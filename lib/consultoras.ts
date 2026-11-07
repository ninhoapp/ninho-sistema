/**
 * Ninho · Programa de consultoras de sono — leitura do banco e o cálculo da
 * comissão. Server-only (cliente service role do painel).
 *
 * A regra pura (percentuais, parcelas, prazo do Pix) está em
 * `lib/consultoras-regras.ts`. Aqui só se monta a entrada dela a partir das
 * MESMAS cobranças do Faturamento (`mesesComCobranca` + `priceForUser` de
 * lib/metrics.ts), para o painel do dono, a área da consultora e o app
 * (GET /api/consultora/ganhos) mostrarem o mesmo número.
 *
 * Contrato: Ninho-expo/docs/empresa/pedidos/consultoras-contrato.md.
 */
import { randomUUID } from 'crypto';
import { unstable_cache } from 'next/cache';
import { appDb } from '@/lib/supabase/server';
import { lerTudo } from '@/lib/supabase/paginar';
import { fetchAppUsers, type AppUser } from '@/lib/app-users';
import { mesesComCobranca, priceForUser, planoLabel, cicloDoUsuario, isPagante } from '@/lib/metrics';
import {
  calcularLinhas,
  somar,
  prazoPix,
  METODOS_COM_COMISSAO,
  ACEITE_VINCULO_CONSULTORA_VERSAO,
  CODIGO_RE,
  normalizarCodigo,
  type FamiliaComissao,
  type LinhaComissao,
  type Cobranca,
} from '@/lib/consultoras-regras';

// ── Tipos das tabelas ─────────────────────────────────────
export type EstadoConsultora = 'esperando' | 'ativa' | 'pausada';

export interface Consultora {
  id: string;
  painel_perfil_id: string | null;
  profile_id: string | null;
  estado: EstadoConsultora;
  na_lista: boolean;
  nome: string | null;
  foto_url: string | null;
  cidade: string | null;
  uf: string | null;
  atende_online: boolean;
  atende_presencial: boolean;
  idades: string | null;
  bio: string | null;
  whatsapp: string | null;
  instagram: string | null;
  perfil_aprovado_em: string | null;
  bio_pendente: string | null;
  foto_pendente_url: string | null;
  criado_em: string;
  email_liberado: string | null;
  codigo: string | null;
  indicada_por: string | null;
  liberada_em: string | null;
  ativada_em: string | null;
  pausada_em: string | null;
  termo_aceito_em: string | null;
  termo_versao: string | null;
  cpf: string | null;
  pix_chave: string | null;
}

export interface Pedido {
  id: string;
  nome: string;
  email: string;
  instagram: string | null;
  whatsapp: string | null;
  indicada_por: string | null;
  origem: 'app' | 'site';
  aceite_versao: string | null;
  status: 'pendente' | 'aprovado' | 'recusado';
  criado_em: string;
  decidido_em: string | null;
}

export interface Indicacao {
  profile_id: string;
  baby_id: string | null;
  consultora_id: string;
  indicada_por_id: string | null;
  /** 'link' e 'codigo_cadastro' (frente Parceiros, 00106) e 'manual' geram comissão; 'vinculo' (antigo) não. */
  metodo: 'link' | 'codigo_cadastro' | 'manual' | 'vinculo';
  criado_em: string;
}

export interface Vinculo {
  id: string;
  consultora_id: string;
  baby_id: string;
  aceito_por: string;
  aceite_versao: string;
  aceito_em: string;
  removido_em: string | null;
}

export interface Pagamento {
  id: string;
  consultora_id: string;
  competencia: string;
  valor: number;
  pago_em: string;
  observacao: string | null;
}

export interface Bebe {
  id: string;
  name: string | null;
  birth_date: string | null;
}

export interface Cuidador {
  baby_id: string;
  profile_id: string;
  role: string;
}

// ── Foto: só do bucket próprio ────────────────────────────
export const BUCKET_FOTOS = 'consultoras-fotos';

/** Prefixo público do bucket (igual à constraint consultoras_foto_url_bucket). */
export function prefixoFotos(): string {
  const url = (process.env.SUPABASE_URL || 'https://rmvctouwnrevzolkwxmr.supabase.co').replace(/\/$/, '');
  return `${url}/storage/v1/object/public/${BUCKET_FOTOS}/`;
}

export function fotoValida(url: string | null | undefined): boolean {
  if (!url) return false;
  const p = prefixoFotos();
  return url.startsWith(p) && /^[a-z0-9/_-]+\.(jpg|png|webp)$/.test(url.slice(p.length));
}

const TIPOS_FOTO: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
export const FOTO_MAX_BYTES = 2 * 1024 * 1024;

/**
 * Sobe a foto para o bucket consultoras-fotos com nome aleatório (nunca o nome
 * do arquivo dela) e devolve a URL pública. `pasta` = 'pendentes' (mandada pela
 * consultora, espera o dono) ou 'aprovadas' (o dono subiu).
 */
export async function subirFoto(arquivo: File, pasta: 'pendentes' | 'aprovadas'): Promise<{ url?: string; error?: string }> {
  const ext = TIPOS_FOTO[arquivo.type];
  if (!ext) return { error: 'A foto precisa ser JPG, PNG ou WebP.' };
  if (arquivo.size <= 0) return { error: 'Escolha uma foto.' };
  if (arquivo.size > FOTO_MAX_BYTES) return { error: 'A foto passa de 2 MB. Mande uma menor.' };
  const caminho = `${pasta}/${randomUUID()}.${ext}`;
  const bytes = Buffer.from(await arquivo.arrayBuffer());
  const { error } = await appDb().storage.from(BUCKET_FOTOS).upload(caminho, bytes, {
    contentType: arquivo.type,
    upsert: false,
  });
  if (error) return { error: `Não consegui guardar a foto: ${error.message}` };
  return { url: prefixoFotos() + caminho };
}

/**
 * Apaga do bucket um arquivo que saiu de uso (foto pendente recusada ou
 * trocada, foto antiga substituída). Só mexe em URL do próprio bucket; falha
 * vai para o log e não desfaz a ação.
 */
export async function apagarFoto(url: string | null | undefined): Promise<void> {
  if (!url || !fotoValida(url)) return;
  const caminho = url.slice(prefixoFotos().length);
  const { error } = await appDb().storage.from(BUCKET_FOTOS).remove([caminho]);
  if (error) console.error('[consultoras] apagar foto falhou:', error.message);
}

// ── Leitura ───────────────────────────────────────────────
const COLS = '*';

export async function listConsultoras(): Promise<Consultora[]> {
  const { data, error } = await lerTudo<Consultora>('consultoras', (de, ate) =>
    appDb().from('consultoras').select(COLS).order('criado_em').order('id').range(de, ate),
  );
  if (error) throw new Error(`consultoras: ${error.message}`);
  return data;
}

export async function getConsultora(id: string): Promise<Consultora | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data } = await appDb().from('consultoras').select(COLS).eq('id', id).maybeSingle();
  return (data as Consultora) ?? null;
}

export async function consultoraDoPerfil(perfilId: string): Promise<Consultora | null> {
  const { data } = await appDb().from('consultoras').select(COLS).eq('painel_perfil_id', perfilId).maybeSingle();
  return (data as Consultora) ?? null;
}

export async function consultoraDaConta(profileId: string): Promise<Consultora | null> {
  const { data } = await appDb().from('consultoras').select(COLS).eq('profile_id', profileId).maybeSingle();
  return (data as Consultora) ?? null;
}

/**
 * Consultora ATIVA (com termo aceito) pelo código do link. Para a rota
 * /c/[codigo] que a frente Parceiros vai montar. Valida o formato antes de
 * consultar; o código é guardado em maiúsculas, então `.eq()` basta.
 */
export async function consultoraAtivaPorCodigo(codigo: string): Promise<Pick<Consultora, 'id' | 'nome' | 'foto_url' | 'cidade' | 'uf' | 'codigo'> | null> {
  const c = normalizarCodigo(codigo);
  if (!CODIGO_RE.test(c)) return null;
  const { data } = await appDb()
    .from('consultoras')
    .select('id,nome,foto_url,cidade,uf,codigo')
    .eq('codigo', c)
    .eq('estado', 'ativa')
    .not('termo_aceito_em', 'is', null)
    .limit(1)
    .maybeSingle();
  return (data as Pick<Consultora, 'id' | 'nome' | 'foto_url' | 'cidade' | 'uf' | 'codigo'>) ?? null;
}

export async function listPedidos(status?: Pedido['status']): Promise<Pedido[]> {
  let q = appDb().from('consultora_pedidos').select('*').order('criado_em', { ascending: false }).limit(500);
  if (status) q = q.eq('status', status);
  const { data, error } = await q;
  if (error) throw new Error(`consultora_pedidos: ${error.message}`);
  return (data as Pedido[]) ?? [];
}

export async function listIndicacoes(): Promise<Indicacao[]> {
  const { data, error } = await lerTudo<Indicacao>('consultora_indicacoes', (de, ate) =>
    appDb().from('consultora_indicacoes').select('*').order('profile_id').range(de, ate),
  );
  if (error) throw new Error(`consultora_indicacoes: ${error.message}`);
  return data;
}

export async function listVinculosAtivos(): Promise<Vinculo[]> {
  const { data, error } = await lerTudo<Vinculo>('consultora_vinculos', (de, ate) =>
    appDb().from('consultora_vinculos').select('*').is('removido_em', null).order('id').range(de, ate),
  );
  if (error) throw new Error(`consultora_vinculos: ${error.message}`);
  return data;
}

export async function listPagamentos(consultoraId?: string): Promise<Pagamento[]> {
  let q = appDb().from('consultora_pagamentos').select('*').order('competencia', { ascending: false }).limit(2000);
  if (consultoraId) q = q.eq('consultora_id', consultoraId);
  const { data, error } = await q;
  if (error) throw new Error(`consultora_pagamentos: ${error.message}`);
  return ((data as Pagamento[]) ?? []).map((p) => ({ ...p, valor: Number(p.valor) }));
}

export async function bebesPorId(ids: string[]): Promise<Map<string, Bebe>> {
  const out = new Map<string, Bebe>();
  const unicos = Array.from(new Set(ids.filter(Boolean)));
  for (let i = 0; i < unicos.length; i += 200) {
    // Bebê apagado não aparece (nem o nome) em lugar nenhum do programa.
    const { data } = await appDb().from('babies').select('id,name,birth_date').in('id', unicos.slice(i, i + 200)).is('deleted_at', null);
    for (const b of (data as Bebe[] | null) ?? []) out.set(b.id, b);
  }
  return out;
}

export async function cuidadoresDe(babyIds: string[]): Promise<Cuidador[]> {
  const unicos = Array.from(new Set(babyIds.filter(Boolean)));
  const out: Cuidador[] = [];
  for (let i = 0; i < unicos.length; i += 200) {
    const { data } = await appDb()
      .from('caregivers')
      .select('baby_id,profile_id,role')
      .in('baby_id', unicos.slice(i, i + 200))
      .in('role', ['owner', 'caregiver'])
      .is('deleted_at', null);
    out.push(...((data as Cuidador[] | null) ?? []));
  }
  return out;
}

// ── Comissão ──────────────────────────────────────────────
/** Cobranças da conta: mesmas competências do Faturamento, com a data de cada uma. */
function cobrancasDe(u: AppUser): Cobranca[] {
  const meses = mesesComCobranca(u);
  if (!u.assinouEm || meses.length === 0) return [];
  const base = priceForUser(u);
  const anual = cicloDoUsuario(u) === 'anual';
  const d = new Date(u.assinouEm);
  return meses.map((competencia) => {
    const c = { competencia, data: d.toISOString(), base };
    if (anual) d.setFullYear(d.getFullYear() + 1);
    else d.setMonth(d.getMonth() + 1);
    return c;
  });
}

export interface FamiliaAtribuida extends FamiliaComissao {
  babyId: string | null;
  /** Conta que paga (a atribuída ou o cuidador pagante do mesmo bebê). Null = ninguém pagou. */
  pagadorId: string | null;
  pagaHoje: boolean;
  assinouEm: string | null;
  /** O método de atribuição gera comissão (link, código no cadastro ou manual). */
  gera: boolean;
}

/**
 * Quem paga a família: a conta atribuída, se ela já foi cobrada; senão, no
 * plano compartilhado, o dono ou cuidador do mesmo bebê que já foi cobrado
 * (o pagante de hoje primeiro). Um pagador só, para não contar duas vezes.
 */
function pagadorDa(ind: Indicacao, users: Map<string, AppUser>, cuidadores: Cuidador[]): AppUser | null {
  const propria = users.get(ind.profile_id);
  if (propria?.assinouEm) return propria;
  const outros = cuidadores
    .filter((c) => c.baby_id === ind.baby_id && c.profile_id !== ind.profile_id)
    .map((c) => users.get(c.profile_id))
    .filter((u): u is AppUser => !!u && !!u.assinouEm)
    .sort((a, b) => Number(isPagante(b)) - Number(isPagante(a)) || a.assinouEm!.localeCompare(b.assinouEm!));
  return outros[0] ?? null;
}

export interface BaseComissoes {
  consultoras: Consultora[];
  familias: FamiliaAtribuida[];
  linhas: LinhaComissao[];
  pagamentos: Pagamento[];
}

/** Tag do cache de comissões: toda ação que muda consultora, atribuição ou pagamento chama revalidateTag. */
export const CONSULTORAS_TAG = 'consultoras';

/**
 * Tudo o que as telas de dinheiro precisam, numa leitura só, com cache de 2
 * minutos (entre requisições). Só arrays no cache (Map vira {}); erro sobe
 * como exceção, então não guarda vazio. Para gravar valor (Marcar como pago),
 * use `baseComissoesAgora`.
 */
export const baseComissoes = unstable_cache(async () => baseComissoesAgora(), ['consultoras-base-v1'], {
  revalidate: 120,
  tags: [CONSULTORAS_TAG],
});

/** Sem cache: lê tudo agora. */
export async function baseComissoesAgora(): Promise<BaseComissoes> {
  const [consultoras, indicacoes, pagamentos, usersArr] = await Promise.all([
    listConsultoras(),
    listIndicacoes(),
    listPagamentos(),
    fetchAppUsers(),
  ]);
  const users = new Map(usersArr.map((u) => [u.id, u]));
  const babyIds = indicacoes.map((i) => i.baby_id).filter((x): x is string => !!x);
  const [bebes, cuidadores] = await Promise.all([bebesPorId(babyIds), cuidadoresDe(babyIds)]);

  const familias: FamiliaAtribuida[] = indicacoes.map((ind) => {
    const pagador = pagadorDa(ind, users, cuidadores);
    return {
      id: ind.profile_id,
      babyId: ind.baby_id,
      bebe: (ind.baby_id && bebes.get(ind.baby_id)?.name) || 'Bebê',
      plano: pagador ? planoLabel(pagador) : 'Sem assinatura',
      anual: pagador ? cicloDoUsuario(pagador) === 'anual' : false,
      consultoraId: ind.consultora_id,
      indicadaPorId: ind.indicada_por_id,
      atribuidaEm: ind.criado_em,
      cobrancas: pagador ? cobrancasDe(pagador) : [],
      metodo: ind.metodo,
      gera: METODOS_COM_COMISSAO.has(ind.metodo),
      // Cancelou: nada a partir do fim do período pago conta (mesmo se voltar).
      // Sem log de cobrança, quem volta a assinar não aparece aqui como buraco:
      // o buraco no mês é cortado em calcularLinhas quando houver o dado.
      paradaEm: pagador && pagador.estado === 'churn' ? pagador.current_period_end : null,
      pagadorId: pagador?.id ?? null,
      pagaHoje: pagador ? isPagante(pagador) : false,
      assinouEm: pagador?.assinouEm ?? null,
    };
  });
  return { consultoras, familias, linhas: calcularLinhas(familias), pagamentos };
}

export function totalDe(linhas: LinhaComissao[], consultoraId: string, competencia: string): number {
  return somar(linhas.filter((l) => l.consultoraId === consultoraId && l.competencia === competencia).map((l) => l.valor));
}

export function pagamentoDe(pagamentos: Pagamento[], consultoraId: string, competencia: string): Pagamento | null {
  return pagamentos.find((p) => p.consultora_id === consultoraId && p.competencia === competencia) ?? null;
}

// ── Ganhos (formato do contrato, o mesmo para o app e a web) ──
export interface Ganhos {
  consultora: { nome: string; codigo: string | null; estado: EstadoConsultora; indicada_por_nome: string | null };
  resumo: { familias: number; assinantes: number; indicadas: number };
  meses: { competencia: string; total: number; status: 'pago' | 'aberto'; prazo: string; pago_em: string | null }[];
  linhas: {
    competencia: string;
    bebe: string;
    plano: string;
    parcela: string;
    pct: number;
    base: number;
    valor: number;
    /** Na parte de 12,5% de quem indicou: o nome da consultora indicada. */
    via: string | null;
  }[];
}

export async function montarGanhos(c: Consultora): Promise<Ganhos> {
  const [base, vinculos] = await Promise.all([baseComissoes(), listVinculosAtivos()]);
  const nomePorId = new Map(base.consultoras.map((x) => [x.id, x.nome ?? 'Consultora']));
  const minhas = base.linhas.filter((l) => l.consultoraId === c.id);

  // Privacidade (Henrique): o nome do bebê só aparece se a família ainda
  // compartilha a rotina com ela (vínculo ativo) e o bebê não foi apagado
  // (bebesPorId já filtra deleted_at; sem nome = apagado). A parte de quem
  // indicou nunca mostra o bebê: é "Família da rede". O resto vira "Família 1, 2…".
  const babyDaFamilia = new Map(base.familias.map((f) => [f.id, f.babyId]));
  const comVinculo = new Set(vinculos.filter((v) => v.consultora_id === c.id).map((v) => v.baby_id));
  const babyIds = Array.from(new Set(minhas.map((l) => babyDaFamilia.get(l.familiaId)).filter((x): x is string => !!x && comVinculo.has(x))));
  const vivos = await bebesPorId(babyIds);
  const apelido = new Map<string, string>();
  const rotulo = (l: LinhaComissao): string => {
    if (l.viaId) return 'Família da rede';
    const baby = babyDaFamilia.get(l.familiaId);
    const nome = baby && comVinculo.has(baby) ? vivos.get(baby)?.name : null;
    if (nome) return nome;
    if (!apelido.has(l.familiaId)) apelido.set(l.familiaId, `Família ${apelido.size + 1}`);
    return apelido.get(l.familiaId)!;
  };
  // Numeração estável: pela data da atribuição, não pela ordem do extrato.
  const diretasPorData = base.familias
    .filter((f) => f.consultoraId === c.id)
    .sort((a, b) => a.atribuidaEm.localeCompare(b.atribuidaEm));
  for (const f of diretasPorData) {
    const linha = minhas.find((l) => l.familiaId === f.id && !l.viaId);
    if (linha) rotulo(linha);
  }
  const competencias = Array.from(new Set(minhas.map((l) => l.competencia))).sort().reverse();
  return {
    consultora: {
      nome: c.nome ?? '',
      codigo: c.codigo,
      estado: c.estado,
      indicada_por_nome: c.indicada_por ? nomePorId.get(c.indicada_por) ?? null : null,
    },
    resumo: {
      familias: vinculos.filter((v) => v.consultora_id === c.id).length,
      assinantes: base.familias.filter((f) => f.consultoraId === c.id && f.gera && f.pagaHoje).length,
      indicadas: base.consultoras.filter((x) => x.indicada_por === c.id).length,
    },
    meses: competencias.map((comp) => {
      const pg = pagamentoDe(base.pagamentos, c.id, comp);
      return {
        competencia: comp,
        total: totalDe(base.linhas, c.id, comp),
        status: pg ? 'pago' : 'aberto',
        prazo: prazoPix(comp),
        pago_em: pg?.pago_em ?? null,
      };
    }),
    linhas: minhas.map((l) => ({
      competencia: l.competencia,
      bebe: rotulo(l),
      // Henrique: a consultora vê só o ciclo (o aceite diz que ela não vê pagamentos da família).
      plano: /anual/i.test(l.plano) ? 'Anual' : 'Mensal',
      parcela: l.parcela,
      pct: l.pct,
      base: l.base,
      valor: l.valor,
      via: l.viaId ? nomePorId.get(l.viaId) ?? null : null,
    })),
  };
}

// ── Famílias e rotina (funções service_role da migration 00102) ──
export interface FamiliaDaConsultora {
  baby_id: string;
  bebe_nome: string | null;
  nascimento: string | null;
  mae_nome: string | null;
  vinculado_em: string;
  plano_ok: boolean;
  dormindo_desde: string | null;
  ultimo_registro_em: string | null;
}

export async function familiasDa(consultoraId: string): Promise<FamiliaDaConsultora[]> {
  const { data, error } = await appDb().rpc('_consultora_familias', { p_consultora: consultoraId });
  if (error) throw new Error(`_consultora_familias: ${error.message}`);
  return (data as FamiliaDaConsultora[]) ?? [];
}

export interface RegistroRotina {
  id: string;
  tipo: 'sleep' | 'feeding' | 'diaper' | 'food';
  subtipo: string | null;
  inicio: string;
  fim: string | null;
  detalhe: Record<string, unknown>;
  registrado_por: string | null;
}

/** Rotina de um bebê. `sem_acesso` = pausada, sem vínculo ou família sem plano. */
export async function rotinaDe(
  consultoraId: string,
  babyId: string,
  de: Date,
  ate: Date,
): Promise<{ registros: RegistroRotina[]; semAcesso: boolean }> {
  const { data, error } = await appDb().rpc('_consultora_rotina', {
    p_consultora: consultoraId,
    p_baby: babyId,
    p_de: de.toISOString(),
    p_ate: ate.toISOString(),
  });
  if (error) {
    if (/sem_acesso/.test(error.message)) return { registros: [], semAcesso: true };
    throw new Error(`_consultora_rotina: ${error.message}`);
  }
  return { registros: (data as RegistroRotina[]) ?? [], semAcesso: false };
}

// ── Vínculo com aceite dos dois lados (migration 00108) ───
// O id da consultora vem SEMPRE da sessão (consultoraDoPerfil), nunca do formulário.

export interface PedidoVinculo {
  id: string;
  responsavel_nome: string | null;
  bebe_nome: string | null;
  criado_em: string;
}

/** Pedidos de famílias esperando a consultora. `indisponivel` = a 00108 ainda não foi aplicada. */
export async function pedidosVinculoDa(consultoraId: string): Promise<{ pedidos: PedidoVinculo[]; indisponivel: boolean }> {
  const { data, error } = await appDb().rpc('_consultora_pedidos_vinculo', { p_consultora: consultoraId });
  if (error) {
    console.error('[consultoras] _consultora_pedidos_vinculo:', error.message);
    return { pedidos: [], indisponivel: true };
  }
  return { pedidos: (data as PedidoVinculo[]) ?? [], indisponivel: false };
}

export async function responderPedidoVinculo(consultoraId: string, pedidoId: string, aprovar: boolean): Promise<string> {
  const { data, error } = await appDb().rpc('_consultora_responder_pedido', {
    p_consultora: consultoraId,
    p_pedido: pedidoId,
    p_aprovar: aprovar,
    p_aceite_versao: ACEITE_VINCULO_CONSULTORA_VERSAO,
  });
  if (error) {
    console.error('[consultoras] _consultora_responder_pedido:', error.message);
    return 'erro';
  }
  return String(data);
}

export async function convidarFamiliaPorEmail(consultoraId: string, email: string): Promise<string> {
  const { data, error } = await appDb().rpc('_consultora_convidar_familia', {
    p_consultora: consultoraId,
    p_email: email,
    p_aceite_versao: ACEITE_VINCULO_CONSULTORA_VERSAO,
  });
  if (error) {
    console.error('[consultoras] _consultora_convidar_familia:', error.message);
    return 'erro';
  }
  return String(data);
}

/** Pedidos de vínculo pendentes de todas as consultoras (para o dono: só contagem e datas). */
export async function pedidosVinculoPendentes(): Promise<{ consultora_id: string; origem: 'familia' | 'consultora'; criado_em: string }[]> {
  const { data, error } = await appDb()
    .from('consultora_vinculo_pedidos')
    .select('consultora_id,origem,criado_em')
    .eq('status', 'pendente')
    .order('criado_em', { ascending: false })
    .limit(2000);
  if (error) {
    console.error('[consultoras] consultora_vinculo_pedidos:', error.message);
    return [];
  }
  return (data as { consultora_id: string; origem: 'familia' | 'consultora'; criado_em: string }[]) ?? [];
}

// ── Contagem pública (site) ───────────────────────────────
/** Total real de contas (profiles sem deleted_at). Lança em erro. */
export async function totalDeContas(): Promise<number> {
  const { count, error } = await appDb().from('profiles').select('id', { count: 'exact', head: true }).is('deleted_at', null);
  if (error) throw new Error(error.message);
  if (typeof count !== 'number') throw new Error('contagem vazia');
  return count;
}
