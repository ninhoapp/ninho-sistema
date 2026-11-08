/**
 * Ninho · Relatório IA da consultora (v3). Server-only.
 *
 * Decisões do dono (08/11/2026): assinatura da consultora R$ 49,90/mês (compra
 * no app, pela loja), 30 relatórios por mês, o 1º grátis, só consultoras,
 * períodos de 7 ou 14 dias. Ela pode mandar o PDF à família, com o cabeçalho
 * dela (foto e nome).
 *
 * Contrato do backend (Vitor, ainda NÃO aplicado): funções service_role
 *   _consultora_ia_status(p_consultora)
 *   _consultora_relatorios(p_consultora, p_baby)
 *   _consultora_relatorio(p_consultora, p_id)
 * e a edge function `relatorio-consultora` para GERAR. Tudo aqui é tolerante:
 * sem a migration, as telas mostram "ainda não disponível" em vez de erro.
 * O p_consultora vem SEMPRE da sessão (consultoraDoPerfil), nunca do formulário.
 */
import { appDb } from '@/lib/supabase/server';

export const IA_PRECO_MENSAL = 49.9;
export const IA_LIMITE_MES = 30;
export const IA_PERIODOS = [7, 14] as const;

export const RODAPE_IA =
  'Relatório gerado por IA a partir dos registros do app. Não é avaliação de saúde e não substitui o pediatra.';

export interface IaStatus {
  /** Assinatura ativa agora. */
  assinante: boolean;
  /** Até quando a assinatura vale (ISO) ou null. */
  assinaturaAte: string | null;
  /** O relatório grátis já foi usado. */
  gratisUsado: boolean;
  usadosMes: number;
  limiteMes: number;
  /** Custo de tokens no mês, se a tabela tiver (o painel do dono mostra). */
  custoMes: number | null;
  custoMoeda: string | null;
  /** Pode gerar um relatório agora (assinante com cota, ou grátis não usado). */
  podeGerar: boolean;
}

export interface RelatorioResumo {
  id: string;
  babyId: string | null;
  bebe: string | null;
  dias: number | null;
  de: string | null;
  ate: string | null;
  criadoEm: string | null;
  status: string | null;
}

export interface Relatorio extends RelatorioResumo {
  /** O texto do relatório (JSON da IA), lido de forma tolerante na tela. */
  conteudo: Record<string, unknown> | null;
  /** O que faltou nos registros, quando não deu para um relatório completo. */
  falta: string[];
  /** Dados usados (noites, sonecas, mamadas...), se o backend mandar. */
  dadosUsados: Record<string, unknown> | null;
}

// ── leitura tolerante ─────────────────────────────────────
type Obj = Record<string, unknown>;
const obj = (v: unknown): Obj | null => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Obj) : null);
const str = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v : null);
const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : typeof v === 'string' && v.trim() && Number.isFinite(Number(v)) ? Number(v) : null);
const bool = (v: unknown): boolean => v === true || v === 'true' || v === 1;
function primeiro(o: Obj, ...ks: string[]): unknown {
  for (const k of ks) if (o[k] !== undefined && o[k] !== null) return o[k];
  return undefined;
}
function linha(data: unknown): Obj | null {
  if (Array.isArray(data)) return obj(data[0]);
  return obj(data);
}
function lista(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((x) => (typeof x === 'string' ? x : str(obj(x)?.texto) ?? str(obj(x)?.text) ?? '')).filter(Boolean);
  if (typeof v === 'string' && v.trim()) return [v];
  return [];
}

function lerResumo(o: Obj): RelatorioResumo {
  return {
    id: String(primeiro(o, 'id') ?? ''),
    babyId: str(primeiro(o, 'baby_id', 'bebe_id')),
    bebe: str(primeiro(o, 'bebe_nome', 'bebe', 'baby_name')),
    dias: num(primeiro(o, 'dias', 'periodo_dias', 'periodo')),
    de: str(primeiro(o, 'de', 'periodo_de', 'inicio')),
    ate: str(primeiro(o, 'ate', 'periodo_ate', 'fim')),
    criadoEm: str(primeiro(o, 'criado_em', 'created_at', 'gerado_em')),
    status: str(primeiro(o, 'status', 'estado')),
  };
}

// ── status, lista e relatório ─────────────────────────────
export async function iaStatus(consultoraId: string): Promise<IaStatus | null> {
  const { data, error } = await appDb().rpc('_consultora_ia_status', { p_consultora: consultoraId });
  if (error) {
    console.error('[consultoras-ia] _consultora_ia_status:', error.message);
    return null;
  }
  const o = linha(data);
  if (!o) return null;
  const assinaturaAte = str(primeiro(o, 'assinatura_ate', 'assinante_ate', 'ate', 'expira_em'));
  const assinante = o.assinante !== undefined ? bool(o.assinante) : !!assinaturaAte && new Date(assinaturaAte).getTime() > Date.now();
  const gratisUsado = bool(primeiro(o, 'gratis_usado', 'gratuito_usado'));
  const usadosMes = num(primeiro(o, 'usados_mes', 'relatorios_mes', 'usados')) ?? 0;
  const limiteMes = num(primeiro(o, 'limite_mes', 'limite')) ?? IA_LIMITE_MES;
  const podeGerarBanco = primeiro(o, 'pode_gerar');
  return {
    assinante,
    assinaturaAte,
    gratisUsado,
    usadosMes,
    limiteMes,
    custoMes: num(primeiro(o, 'custo_mes', 'custo_tokens_mes', 'custo_mes_usd')),
    custoMoeda: str(primeiro(o, 'custo_moeda', 'moeda')) ?? (o.custo_mes_usd !== undefined ? 'USD' : null),
    podeGerar: podeGerarBanco !== undefined ? bool(podeGerarBanco) : assinante ? usadosMes < limiteMes : !gratisUsado,
  };
}

/** Relatórios da consultora (de um bebê ou de todos). `null` = indisponível. */
export async function listarRelatorios(consultoraId: string, babyId: string | null): Promise<RelatorioResumo[] | null> {
  const { data, error } = await appDb().rpc('_consultora_relatorios', { p_consultora: consultoraId, p_baby: babyId });
  if (error) {
    console.error('[consultoras-ia] _consultora_relatorios:', error.message);
    return null;
  }
  return (Array.isArray(data) ? data : []).map((x) => lerResumo(obj(x) ?? {})).filter((r) => r.id);
}

export async function lerRelatorio(consultoraId: string, id: string): Promise<Relatorio | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data, error } = await appDb().rpc('_consultora_relatorio', { p_consultora: consultoraId, p_id: id });
  if (error) {
    console.error('[consultoras-ia] _consultora_relatorio:', error.message);
    return null;
  }
  const o = linha(data);
  if (!o) return null;
  let conteudo = primeiro(o, 'conteudo', 'relatorio', 'texto', 'json');
  if (typeof conteudo === 'string') {
    try {
      conteudo = JSON.parse(conteudo);
    } catch {
      conteudo = { resumo: [conteudo] };
    }
  }
  const c = obj(conteudo);
  return {
    ...lerResumo(o),
    conteudo: c,
    falta: lista(primeiro(o, 'falta', 'o_que_falta') ?? c?.falta ?? c?.o_que_falta),
    dadosUsados: obj(primeiro(o, 'dados_usados', 'entrada_resumo')) ?? obj(c?.dados_usados),
  };
}

// ── gerar ─────────────────────────────────────────────────
export type ResultadoGerar =
  | { ok: true; id: string | null }
  | { ok: false; motivo: 'indisponivel' | 'sem_assinatura' | 'limite' | 'sem_dados' | 'sem_acesso' | 'erro'; mensagem: string };

/**
 * Gera um relatório. PONTO ÚNICO de chamada ao backend: o contrato final da
 * edge function `relatorio-consultora` (Vitor) ainda vai ser fechado, e é só
 * aqui que muda. Hoje: invoke com o service role do painel, mandando a
 * consultora (da sessão), o bebê e os dias.
 */
export async function gerarRelatorio(consultoraId: string, babyId: string, dias: 7 | 14): Promise<ResultadoGerar> {
  try {
    const { data, error } = await appDb().functions.invoke('relatorio-consultora', {
      body: { consultora_id: consultoraId, baby_id: babyId, periodo_dias: dias, lang: 'pt' },
    });
    if (error) {
      const msg = error.message || '';
      console.error('[consultoras-ia] relatorio-consultora:', msg);
      const status = (error as { context?: { status?: number } }).context?.status;
      // Função ainda não publicada (404) ou sem rede até ela: indisponível, não erro.
      if (status === 404 || /not found|FunctionsRelayError|FunctionsFetchError/i.test(msg)) {
        return { ok: false, motivo: 'indisponivel', mensagem: 'O Relatório IA ainda não está disponível no painel. Tente pelo app.' };
      }
      return { ok: false, motivo: 'erro', mensagem: 'Não consegui gerar agora. Tente de novo em instantes.' };
    }
    const o = obj(data) ?? {};
    // Contrato da relatorio-consultora (Vitor, 00116): status pronto | sem_dados |
    // erro (com id), sem_cota (motivo sem_assinatura | limite_mes), em_andamento, sem_acesso.
    let r = str(o.resultado) ?? str(o.status) ?? (o.id ? 'ok' : null);
    if (r === 'pronto' || r === 'ok' || o.ok === true) return { ok: true, id: str(o.id) ?? str(o.relatorio_id) };
    if (r === 'sem_cota') r = str(o.motivo) === 'limite_mes' ? 'limite' : 'sem_assinatura';
    if (r === 'em_andamento') return { ok: false, motivo: 'erro', mensagem: 'Já há um relatório sendo gerado. Aguarde um instante.' };
    const motivos: Record<string, ResultadoGerar & { ok: false }> = {
      sem_assinatura: { ok: false, motivo: 'sem_assinatura', mensagem: 'Seu relatório grátis já foi usado. Assine pelo app do Ninho para continuar.' },
      limite: { ok: false, motivo: 'limite', mensagem: `Você chegou aos ${IA_LIMITE_MES} relatórios deste mês.` },
      sem_dados: { ok: false, motivo: 'sem_dados', mensagem: 'Ainda não há registros suficientes para um relatório completo. Não contou como relatório usado.' },
      sem_acesso: { ok: false, motivo: 'sem_acesso', mensagem: 'Sem acesso à rotina deste bebê agora.' },
    };
    return motivos[r ?? ''] ?? { ok: false, motivo: 'erro', mensagem: str(o.mensagem) ?? 'Não consegui gerar agora.' };
  } catch (e) {
    console.error('[consultoras-ia] gerar falhou:', e instanceof Error ? e.message : e);
    return { ok: false, motivo: 'indisponivel', mensagem: 'O Relatório IA ainda não está disponível no painel. Tente pelo app.' };
  }
}

// ── seções do relatório (leitura tolerante para a tela) ───
export interface Padrao {
  titulo: string;
  evidencia: string;
  /** 1 a 3 tracinhos (quantas vezes apareceu). */
  forca: number;
}
export interface SecoesRelatorio {
  resumo: string[];
  noite: string[];
  sonecas: string[];
  faixaIdade: string | null;
  padroes: Padrao[];
  melhores: string[];
  piores: string[];
  diferencas: { item: string; melhores: string; piores: string }[];
  consistencia: string[];
  perguntas: string[];
  observar: string[];
  notaSaude: string | null;
  /** Campos que vieram e não têm lugar no molde (mostrados no fim, como texto). */
  outros: { titulo: string; texto: string[] }[];
}

const CONHECIDOS = new Set(['resumo', 'resumo_3_linhas', 'noite', 'sono_noite', 'sonecas', 'sonecas_janelas', 'faixa_idade', 'padroes', 'antes_dos_despertares', 'melhores_piores', 'melhores', 'piores', 'diferencas', 'consistencia', 'horarios', 'perguntas', 'perguntas_familia', 'observar', 'proximos_dias', 'nota_saude', 'falta', 'o_que_falta', 'dados_usados']);

function textos(v: unknown): string[] {
  if (typeof v === 'string') return v.trim() ? [v] : [];
  if (Array.isArray(v)) return v.flatMap(textos);
  const o = obj(v);
  if (!o) return [];
  return [...lista(o.texto ?? o.text ?? o.paragrafos), ...lista(o.linhas)];
}

export function secoes(c: Record<string, unknown> | null): SecoesRelatorio {
  const o = c ?? {};
  const mp = obj(o.melhores_piores) ?? {};
  const sn = obj(o.sonecas ?? o.sonecas_janelas);
  const padroesBrutos = primeiro(o, 'padroes', 'antes_dos_despertares');
  const padroes: Padrao[] = (Array.isArray(padroesBrutos) ? padroesBrutos : obj(padroesBrutos) && Array.isArray(obj(padroesBrutos)!.itens) ? (obj(padroesBrutos)!.itens as unknown[]) : [])
    .map((p) => {
      const x = obj(p);
      if (!x) return typeof p === 'string' ? { titulo: p, evidencia: '', forca: 1 } : null;
      const f = num(x.forca ?? x.vezes ?? x.forca_1_3) ?? 1;
      return { titulo: str(x.titulo ?? x.padrao) ?? '', evidencia: str(x.evidencia ?? x.texto ?? x.descricao) ?? '', forca: Math.max(1, Math.min(3, Math.round(f))) };
    })
    .filter((p): p is Padrao => !!p && !!(p.titulo || p.evidencia));
  // Henrique: o backend grava melhores_piores como LISTA de {aspecto, melhores, piores}.
  const difBrutas = Array.isArray(o.melhores_piores) ? o.melhores_piores : primeiro(mp, 'diferencas') ?? o.diferencas;
  const diferencas = (Array.isArray(difBrutas) ? difBrutas : [])
    .map((d) => {
      const x = obj(d);
      return x ? { item: str(x.item ?? x.aspecto ?? x.o_que) ?? '', melhores: str(x.melhores ?? x.boas) ?? '', piores: str(x.piores ?? x.agitadas) ?? '' } : null;
    })
    .filter((d): d is { item: string; melhores: string; piores: string } => !!d && !!d.item);
  return {
    resumo: textos(primeiro(o, 'resumo', 'resumo_3_linhas')),
    noite: textos(primeiro(o, 'noite', 'sono_noite')),
    sonecas: textos(sn ?? o.sonecas),
    faixaIdade: str(sn?.faixa_idade) ?? str(o.faixa_idade),
    padroes,
    melhores: textos(primeiro(mp, 'melhores') ?? o.melhores),
    piores: textos(primeiro(mp, 'piores', 'agitadas') ?? o.piores),
    diferencas,
    consistencia: textos(primeiro(o, 'consistencia', 'horarios')),
    perguntas: textos(primeiro(o, 'perguntas', 'perguntas_familia')),
    observar: textos(primeiro(o, 'observar', 'proximos_dias')),
    notaSaude: str(o.nota_saude),
    outros: Object.entries(o)
      .filter(([k]) => !CONHECIDOS.has(k))
      .map(([k, v]) => ({ titulo: k.replace(/_/g, ' '), texto: textos(v) }))
      .filter((x) => x.texto.length),
  };
}
