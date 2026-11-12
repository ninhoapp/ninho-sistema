/**
 * Ninho · Teste A/B de paywall (migration 00083 do Ninho-expo). Server-only.
 *
 * Lê as views prontas do banco — a conta de cada número mora lá, não aqui:
 *   teste_paywall_resumo        → uma linha por grupo (só sorteados)
 *   teste_paywall_participantes → uma linha por pessoa (inclui quem ficou fora do sorteio);
 *                                 também vira o "dia × grupo", contado aqui no fuso de Dubai
 *   teste_paywall_config        → rodízio ligado/desligado e fração do grupo B
 *   teste_paywall_liberados     → B sem cartão em 30 min (2h até 02/11), liberado e passado para o A (00089, 00094)
 *
 * Grupo A: 7 dias de teste do app, sem cartão.
 * Grupo B: tela de planos obrigatória, 7 dias grátis da loja (com cartão).
 * Quem cadastrou bebê que ainda não nasceu vai direto para o A, fora do
 * sorteio (sorteado = false), e não entra na comparação.
 */
import { appDb } from '@/lib/supabase/server';
import { lerTudo } from '@/lib/supabase/paginar';
import { resolverOrigem, type Origem } from '@/lib/origem';
import type { PlanoCiclo, PlanoTier } from '@/lib/precos';

/** Fuso do painel inteiro (ver lib/dashboard-charts.ts). A view
 *  teste_paywall_diario conta o dia em São Paulo: quem se cadastrava de
 *  madrugada em Dubai caía "ontem" e o "Cadastros hoje" mostrava menos gente
 *  do que entrou hoje. Por isso o dia é contado aqui, a partir de entrou_em. */
const TZ = 'Asia/Dubai';

/** C (00100 do Ninho-expo): tela de planos no fim do onboarding, com anual e
 *  mensal e um X para fechar; quem fecha segue com o teste do app, como o A. */
export type Grupo = 'A' | 'B' | 'C';
const GRUPOS: Grupo[] = ['A', 'B', 'C'];
const ehGrupo = (g: unknown): g is Grupo => g === 'A' || g === 'B' || g === 'C';

export interface ResumoGrupo {
  grupo: Grupo;
  cadastros: number;
  viram_oferta: number;
  comecaram_teste_loja: number;
  em_teste_loja_agora: number;
  cancelaram_no_teste: number;
  pagaram: number;
  pagantes_hoje: number;
  convidaram_cuidador: number;
  media_registros: number | null;
  pct_pagou: number | null;
  /** Já pagou ou o período grátis acabou (migration 00090). null = a
   *  coluna ainda não existe no banco. */
  decididos: number | null;
  /** Conta oficial do teste: pagaram ÷ decididos (00090). */
  pct_pagou_decididos: number | null;
  /** Saíram sem cartão pelo cron (só o B). */
  liberados: number;
}

/** Grupo B sem cartão por 30 min (2h até 02/11), liberado com 7 dias sem cartão e passado
 *  para o A (migration 00089). Uma linha por pessoa. */
export interface Liberado {
  profile_id: string;
  primeiro_nome: string | null;
  entrou_no_b_em: string;
  liberado_em: string;
  avisado_em: string | null;
  push_aberta_em: string | null;
  voltou_em: string | null;
  registrou_em: string | null;
  registros_depois: number;
  estado: string | null;
  assinou: boolean;
}

/** Quem pôs o cartão (começou os 7 dias grátis da loja). Uma linha por
 *  pessoa, para acompanhar a ativação até a 1ª cobrança. */
export interface Cartao {
  profile_id: string;
  nome: string | null;
  criado_em: string;
  /** Fim dos dias grátis = quando a loja tenta a 1ª cobrança. */
  cobranca_em: string | null;
  registros: number;
  plano: PlanoTier | null;
  ciclo: PlanoCiclo | null;
  /** false = desligou a renovação: não vai ser cobrado. */
  renova: boolean | null;
  pagou: boolean;
  /** A loja tentou a 1ª cobrança, o cartão foi recusado e ela segue
   *  tentando de novo (status past_due da assinatura). */
  recusado: boolean;
  origem: Origem;
}

export interface DiaGrupo {
  dia: string; // yyyy-mm-dd, fuso de Dubai
  grupo: Grupo;
  cadastros: number;
  comecaram_teste_loja: number;
  pagaram: number;
}

export interface TestePaywall {
  /** sorteios = quantas contas já entraram pelo rodízio (00088). Quem
   *  entrou antes dele foi pelo sorteio aleatório da 00083. */
  config: { ativo: boolean; fracao_b: number; sorteios: number; modo: 'AB' | 'ABC' } | null;
  resumo: Record<Grupo, ResumoGrupo>;
  diario: DiaGrupo[];
  foraDoSorteio: number;
  /** null = a view ainda não existe (migration 00089 não aplicada). */
  liberados: Liberado[] | null;
  cartoes: Cartao[];
}

function vazio(grupo: Grupo): ResumoGrupo {
  return {
    grupo,
    cadastros: 0,
    viram_oferta: 0,
    comecaram_teste_loja: 0,
    em_teste_loja_agora: 0,
    cancelaram_no_teste: 0,
    pagaram: 0,
    pagantes_hoje: 0,
    convidaram_cuidador: 0,
    media_registros: null,
    pct_pagou: null,
    decididos: 0,
    pct_pagou_decididos: null,
    liberados: 0,
  };
}

// bigint/numeric chegam como string do PostgREST em alguns casos.
const n = (v: unknown) => (v == null ? 0 : Number(v));
const nOuNull = (v: unknown) => (v == null ? null : Number(v));

export async function fetchTestePaywall(): Promise<TestePaywall> {
  const sb = appDb();
  const [cfg, res, dia, fora, lib] = await Promise.all([
    // '*': a coluna modo só existe depois da 00100.
    sb.from('teste_paywall_config').select('*').limit(1).maybeSingle(),
    sb.from('teste_paywall_resumo').select('*'),
    lerTudo<ParticipanteDia>('teste_paywall_participantes', (de, ate) =>
      sb
        .from('teste_paywall_participantes')
        .select('profile_id,grupo,entrou_em,comecou_teste_loja,pagou')
        .eq('sorteado', true)
        .order('profile_id')
        .range(de, ate),
    ),
    sb
      .from('teste_paywall_participantes')
      .select('profile_id', { count: 'exact', head: true })
      .eq('sorteado', false),
    sb.from('teste_paywall_liberados').select('*').order('liberado_em', { ascending: false }),
  ]);
  for (const r of [cfg, res, dia, fora]) {
    if (r.error) throw new Error(`Teste de paywall: ${r.error.message}`);
  }

  const resumo = Object.fromEntries(GRUPOS.map((g) => [g, vazio(g)])) as Record<Grupo, ResumoGrupo>;
  for (const r of res.data ?? []) {
    const g = r.grupo;
    if (!ehGrupo(g)) continue;
    resumo[g] = {
      grupo: g,
      cadastros: n(r.cadastros),
      viram_oferta: n(r.viram_oferta),
      comecaram_teste_loja: n(r.comecaram_teste_loja),
      em_teste_loja_agora: n(r.em_teste_loja_agora),
      cancelaram_no_teste: n(r.cancelaram_no_teste),
      pagaram: n(r.pagaram),
      pagantes_hoje: n(r.pagantes_hoje),
      convidaram_cuidador: n(r.convidaram_cuidador),
      media_registros: nOuNull(r.media_registros),
      pct_pagou: nOuNull(r.pct_pagou),
      // Antes da 00090 a coluna não vem: null avisa a tela.
      decididos: 'decididos' in r ? n(r.decididos) : null,
      pct_pagou_decididos: nOuNull(r.pct_pagou_decididos),
      liberados: n(r.liberados),
    };
  }

  const porDia = new Map<string, DiaGrupo>();
  for (const r of dia.data) {
    const g: unknown = r.grupo;
    if (!ehGrupo(g)) continue;
    const d = diaDubai(new Date(r.entrou_em));
    const chave = `${d}|${g}`;
    const linha = porDia.get(chave) ?? { dia: d, grupo: g, cadastros: 0, comecaram_teste_loja: 0, pagaram: 0 };
    linha.cadastros += 1;
    if (r.comecou_teste_loja) linha.comecaram_teste_loja += 1;
    if (r.pagou) linha.pagaram += 1;
    porDia.set(chave, linha);
  }
  const diario = [...porDia.values()].sort((x, y) => x.dia.localeCompare(y.dia));

  // Antes da 00089 a view não existe: a tela mostra o aviso em vez de quebrar.
  const liberados: Liberado[] | null = lib.error
    ? null
    : (lib.data ?? []).map((r) => ({
        profile_id: String(r.profile_id),
        primeiro_nome: r.primeiro_nome ?? null,
        entrou_no_b_em: String(r.entrou_no_b_em),
        liberado_em: String(r.liberado_em),
        avisado_em: r.avisado_em ?? null,
        push_aberta_em: r.push_aberta_em ?? null,
        voltou_em: r.voltou_em ?? null,
        registrou_em: r.registrou_em ?? null,
        registros_depois: n(r.registros_depois),
        estado: r.estado ?? null,
        assinou: !!r.assinou,
      }));

  const cartoes = await fetchCartoes();

  return {
    config: cfg.data
      ? {
          ativo: !!cfg.data.ativo,
          fracao_b: n(cfg.data.fracao_b),
          sorteios: n(cfg.data.sorteios),
          modo: cfg.data.modo === 'ABC' ? 'ABC' : 'AB',
        }
      : null,
    resumo,
    diario,
    foraDoSorteio: fora.count ?? 0,
    liberados,
    cartoes,
  };
}

/** Todo mundo que pôs o cartão (sorteado ou não), com nome, plano, origem e
 *  quantos registros fez — a pergunta é "essa pessoa está usando e vai
 *  pagar?". Ordem: 1ª cobrança mais próxima primeiro. */
async function fetchCartoes(): Promise<Cartao[]> {
  const sb = appDb();
  const { data: part, error } = await sb
    .from('teste_paywall_participantes')
    .select('profile_id,teste_loja_ate,renovacao_automatica,registros,pagou')
    .eq('comecou_teste_loja', true);
  if (error) throw new Error(`Teste de paywall (cartões): ${error.message}`);
  const linhas = part ?? [];
  if (linhas.length === 0) return [];

  const ids = linhas.map((l) => String(l.profile_id));
  const [perfis, subs, apple] = await Promise.all([
    sb.from('profiles').select('id,full_name,created_at,como_conheceu').in('id', ids),
    sb.from('subscriptions').select('profile_id,plan,plan_interval,status').in('profile_id', ids).is('deleted_at', null),
    sb.from('atribuicao_apple_ads').select('profile_id,atribuido,campaign_id').in('profile_id', ids),
  ]);
  for (const r of [perfis, subs, apple]) {
    if (r.error) throw new Error(`Teste de paywall (cartões): ${r.error.message}`);
  }
  const perfil = new Map((perfis.data ?? []).map((p) => [String(p.id), p]));
  const sub = new Map((subs.data ?? []).map((s) => [String(s.profile_id), s]));
  const ads = new Map((apple.data ?? []).map((a) => [String(a.profile_id), a]));

  return linhas
    .map((l) => {
      const id = String(l.profile_id);
      const p = perfil.get(id);
      const s = sub.get(id);
      const a = ads.get(id);
      const plano = s?.plan === 'basico' || s?.plan === 'premium' ? (s.plan as PlanoTier) : null;
      const ciclo = s?.plan_interval === 'mensal' || s?.plan_interval === 'anual' ? (s.plan_interval as PlanoCiclo) : null;
      return {
        profile_id: id,
        nome: (p?.full_name ?? '').trim() || null,
        criado_em: String(p?.created_at ?? ''),
        cobranca_em: l.teste_loja_ate ?? null,
        registros: n(l.registros),
        plano,
        ciclo,
        renova: l.renovacao_automatica ?? null,
        pagou: !!l.pagou,
        recusado: !l.pagou && s?.status === 'past_due',
        origem: resolverOrigem(a?.atribuido === true, p?.como_conheceu ?? null, a?.campaign_id ?? null),
      };
    })
    .sort((x, y) => (x.cobranca_em ?? '').localeCompare(y.cobranca_em ?? ''));
}

interface ParticipanteDia {
  profile_id: string;
  grupo: string;
  entrou_em: string;
  comecou_teste_loja: boolean | null;
  pagou: boolean | null;
}

/** Data (yyyy-mm-dd) no fuso de Dubai. */
function diaDubai(d: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}

/** Hoje (yyyy-mm-dd) no fuso de Dubai — o mesmo do `dia` do diário. */
export function hojeDubai(): string {
  return diaDubai(new Date());
}

/** Últimos N dias (hoje incluso) com cadastros por grupo, preenchendo dias sem ninguém com zero. */
export function cadastrosPorDia(diario: DiaGrupo[], dias: number) {
  const hoje = hojeDubai();
  const mapa = new Map<string, Record<Grupo, number>>();
  for (const d of diario) {
    const m = mapa.get(d.dia) ?? { A: 0, B: 0, C: 0 };
    m[d.grupo] += d.cadastros;
    mapa.set(d.dia, m);
  }
  // Meio-dia UTC: subtrair dias inteiros nunca troca a data por fuso.
  const base = new Date(`${hoje}T12:00:00Z`).getTime();
  const pontos: { dia: string; label: string; A: number; B: number; C: number; hoje: boolean }[] = [];
  for (let i = dias - 1; i >= 0; i--) {
    const key = new Date(base - i * 86400000).toISOString().slice(0, 10);
    const [, mm, dd] = key.split('-');
    const v = mapa.get(key) ?? { A: 0, B: 0, C: 0 };
    pontos.push({ dia: key, label: `${dd}/${mm}`, A: v.A, B: v.B, C: v.C, hoje: key === hoje });
  }
  return pontos;
}

/** Porcentagem com uma casa, ou "—" quando não há base. */
export function pct(parte: number, base: number): string {
  return base > 0 ? `${((parte / base) * 100).toFixed(1)}%` : '—';
}

/** Depois da tela de planos, a pessoa continuou usando o app ou sumiu?
 *  View teste_paywall_continuidade (00139 do Ninho-expo), uma linha por
 *  pessoa; aqui vira uma linha por grupo e fatia. Só sorteados e só quem
 *  passou pela tela há mais de 24h (`maduro`): quem chegou hoje ainda não
 *  teve tempo de voltar. No A não há tela: conta a partir do fim do
 *  onboarding, para comparar. */
export type FatiaContinuidade = 'A' | 'cartao' | 'sem_cartao' | 'fechou_x' | 'saiu_na_tela';

export interface Continuidade {
  grupo: Grupo;
  fatia: FatiaContinuidade;
  pessoas: number;
  continuaram: number;
  voltaramOutroDia: number;
  registrosDepois: number;
  diasDepois: number;
  pagaram: number;
}

const ORDEM_FATIA: FatiaContinuidade[] = ['A', 'cartao', 'fechou_x', 'sem_cartao', 'saiu_na_tela'];

/** null = a view ainda não existe (migration 00139 não aplicada). */
export async function fetchContinuidade(): Promise<Continuidade[] | null> {
  const { data, error } = await lerTudo<{
    profile_id: string;
    grupo: string;
    fatia: string;
    continuou: boolean;
    voltou_outro_dia: boolean;
    registros_depois: number;
    dias_abriu_depois: number;
    pagou: boolean;
  }>('teste_paywall_continuidade', (de, ate) =>
    appDb()
      .from('teste_paywall_continuidade')
      .select('profile_id,grupo,fatia,continuou,voltou_outro_dia,registros_depois,dias_abriu_depois,pagou')
      .eq('sorteado', true)
      .eq('maduro', true)
      .order('profile_id')
      .range(de, ate),
  );
  if (error) return null;
  const mapa = new Map<string, Continuidade>();
  for (const r of data) {
    if (!ehGrupo(r.grupo) || !ORDEM_FATIA.includes(r.fatia as FatiaContinuidade)) continue;
    const chave = `${r.grupo}|${r.fatia}`;
    const c = mapa.get(chave) ?? {
      grupo: r.grupo,
      fatia: r.fatia as FatiaContinuidade,
      pessoas: 0,
      continuaram: 0,
      voltaramOutroDia: 0,
      registrosDepois: 0,
      diasDepois: 0,
      pagaram: 0,
    };
    c.pessoas += 1;
    if (r.continuou) c.continuaram += 1;
    if (r.voltou_outro_dia) c.voltaramOutroDia += 1;
    c.registrosDepois += n(r.registros_depois);
    c.diasDepois += n(r.dias_abriu_depois);
    if (r.pagou) c.pagaram += 1;
    mapa.set(chave, c);
  }
  return [...mapa.values()].sort(
    (x, y) => x.grupo.localeCompare(y.grupo) || ORDEM_FATIA.indexOf(x.fatia) - ORDEM_FATIA.indexOf(y.fatia),
  );
}

/** Grupo do teste de cada conta, para a coluna "Teste" de Usuários ativos.
 *  `sorteado = false` = bebê ainda não nascido: vai para o A fora da
 *  comparação. `liberadoEm` = grupo B que ficou sem cartão (30 min; 2h até 02/11) e ganhou 7
 *  dias sem cartão (00089); no teste continua contando no B. Quem não está
 *  no mapa nunca entrou no teste (versão sem o teste ou conta antiga).
 *  Falha não derruba a página: todo mundo aparece como "—". */
export interface GrupoTeste {
  grupo: Grupo;
  sorteado: boolean;
  liberadoEm: string | null;
}

export async function fetchGrupoTestePorUsuario(): Promise<Map<string, GrupoTeste>> {
  const out = new Map<string, GrupoTeste>();
  const { data, error } = await lerTudo<{ profile_id: string; grupo: string; sorteado: boolean; liberado_em: string | null }>(
    'teste_paywall_participantes',
    (de, ate) =>
      appDb()
        .from('teste_paywall_participantes')
        .select('profile_id,grupo,sorteado,liberado_em')
        .order('profile_id')
        .range(de, ate),
  );
  if (error) return out;
  for (const r of data) {
    // O C (00100) ficava de fora daqui e aparecia como "—" em Usuários ativos.
    if (!ehGrupo(r.grupo)) continue;
    out.set(r.profile_id, { grupo: r.grupo, sorteado: !!r.sorteado, liberadoEm: r.liberado_em ?? null });
  }
  return out;
}
