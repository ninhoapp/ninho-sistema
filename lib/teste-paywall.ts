/**
 * Ninho · Teste A/B de paywall (migration 00083 do Ninho-expo). Server-only.
 *
 * Lê as views prontas do banco — a conta de cada número mora lá, não aqui:
 *   teste_paywall_resumo        → uma linha por grupo (só sorteados)
 *   teste_paywall_participantes → uma linha por pessoa (inclui quem ficou fora do sorteio);
 *                                 também vira o "dia × grupo", contado aqui no fuso de Dubai
 *   teste_paywall_config        → rodízio ligado/desligado e fração do grupo B
 *   teste_paywall_liberados     → B sem cartão em 2h, liberado e passado para o A (00089)
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

export type Grupo = 'A' | 'B';

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
}

/** Grupo B sem cartão por 2h, liberado com 7 dias sem cartão e passado
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
  config: { ativo: boolean; fracao_b: number; sorteios: number } | null;
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
  };
}

// bigint/numeric chegam como string do PostgREST em alguns casos.
const n = (v: unknown) => (v == null ? 0 : Number(v));
const nOuNull = (v: unknown) => (v == null ? null : Number(v));

export async function fetchTestePaywall(): Promise<TestePaywall> {
  const sb = appDb();
  const [cfg, res, dia, fora, lib] = await Promise.all([
    sb.from('teste_paywall_config').select('ativo,fracao_b,sorteios').limit(1).maybeSingle(),
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

  const resumo: Record<Grupo, ResumoGrupo> = { A: vazio('A'), B: vazio('B') };
  for (const r of res.data ?? []) {
    const g = r.grupo as Grupo;
    if (g !== 'A' && g !== 'B') continue;
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
    };
  }

  const porDia = new Map<string, DiaGrupo>();
  for (const r of dia.data) {
    if (r.grupo !== 'A' && r.grupo !== 'B') continue;
    const d = diaDubai(new Date(r.entrou_em));
    const chave = `${d}|${r.grupo}`;
    const linha = porDia.get(chave) ?? { dia: d, grupo: r.grupo, cadastros: 0, comecaram_teste_loja: 0, pagaram: 0 };
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
      ? { ativo: !!cfg.data.ativo, fracao_b: n(cfg.data.fracao_b), sorteios: n(cfg.data.sorteios) }
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
    sb.from('subscriptions').select('profile_id,plan,plan_interval').in('profile_id', ids).is('deleted_at', null),
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
  const mapa = new Map<string, { A: number; B: number }>();
  for (const d of diario) {
    const m = mapa.get(d.dia) ?? { A: 0, B: 0 };
    m[d.grupo] += d.cadastros;
    mapa.set(d.dia, m);
  }
  // Meio-dia UTC: subtrair dias inteiros nunca troca a data por fuso.
  const base = new Date(`${hoje}T12:00:00Z`).getTime();
  const pontos: { dia: string; label: string; A: number; B: number; hoje: boolean }[] = [];
  for (let i = dias - 1; i >= 0; i--) {
    const key = new Date(base - i * 86400000).toISOString().slice(0, 10);
    const [, mm, dd] = key.split('-');
    const v = mapa.get(key) ?? { A: 0, B: 0 };
    pontos.push({ dia: key, label: `${dd}/${mm}`, A: v.A, B: v.B, hoje: key === hoje });
  }
  return pontos;
}

/** Porcentagem com uma casa, ou "—" quando não há base. */
export function pct(parte: number, base: number): string {
  return base > 0 ? `${((parte / base) * 100).toFixed(1)}%` : '—';
}
