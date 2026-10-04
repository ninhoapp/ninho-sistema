/**
 * Ninho · Métricas do painel. Server-safe (sem I/O — recebe os dados prontos).
 *
 * Os estados vêm da view `public.assinatura_estado`; aqui só se agrega.
 * Nada nesta camada estima receita de quem não paga: enquanto a cobrança não
 * existir no app, `pagantes` é 0 e a receita é 0 — número vazio, não fictício.
 */
import type { AppUser } from '@/lib/app-users';
import { appDbConfigured } from '@/lib/status-conta';
import type { Perfil, Cost, LeadOutcome } from '@/lib/painel/store';
import {
  PLANOS,
  PLANO_LABEL,
  precoDe,
  precoMensalizado,
  type PlanoKey,
  type PlanoTier,
  type PlanoCiclo,
  type ComissaoPorPlano,
} from '@/lib/precos';

// ── Predicados ────────────────────────────────────────────
export const isPagante = (u: AppUser) => u.estado === 'pagante';
export const isTrialAtivo = (u: AppUser) => u.estado === 'trial_ativo';
export const isTrialExpirado = (u: AppUser) => u.estado === 'trial_expirado';
export const isChurn = (u: AppUser) => u.estado === 'churn';

/**
 * Tier + ciclo da assinatura da conta.
 *
 * As DUAS dimensões importam. Até 10/2026 isto olhava só o ciclo e devolvia
 * sempre preço de Premium — com 6 dos 12 assinantes no Básico, o MRR saía
 * R$ 30/mês inflado. Ciclo sozinho não diz preço nenhum.
 *
 * Sem tier definido assume Premium (o plano "cheio") e sem ciclo assume
 * mensal: é o que a loja cobra com mais frequência, e errar pra baixo numa
 * conta de receita é pior do que errar pra cima.
 */
export function tierDoUsuario(u: AppUser): PlanoTier {
  return u.plan === 'basico' ? 'basico' : 'premium';
}

export function cicloDoUsuario(u: AppUser): PlanoCiclo {
  return u.plan_interval === 'anual' ? 'anual' : 'mensal';
}

export function planoDoUsuario(u: AppUser): PlanoKey {
  return `${tierDoUsuario(u)}-${cicloDoUsuario(u)}` as PlanoKey;
}

/** Rótulo da assinatura — "Premium anual", "Básico mensal". */
export function planoLabel(u: AppUser): string {
  return `${PLANO_LABEL[tierDoUsuario(u)]} ${cicloDoUsuario(u)}`;
}

/** Preço de tabela: o que a loja cobra POR COBRANÇA (anual = valor do ano). */
export function priceForUser(u: AppUser): number {
  return precoDe(tierDoUsuario(u), cicloDoUsuario(u));
}

/**
 * Receita mensalizada (regime de COMPETÊNCIA): o anual entra rateado por 12.
 *
 * Serve pra MRR/ARPU/LTV, que precisam de um valor estável por mês. NÃO serve
 * pra responder "quanto entrou no caixa em outubro" — pra isso use
 * `receitaNoMes`, que é regime de caixa.
 */
export function monthlyRevenueForUser(u: AppUser): number {
  return precoMensalizado(tierDoUsuario(u), cicloDoUsuario(u));
}

// ── Receita de caixa ──────────────────────────────────────
//
// O dinheiro do anual entra DE UMA VEZ: a loja cobra R$ 129,90 num mês só, e
// nos outros onze aquele assinante não gera nada. Ratear por 12 é útil pra
// MRR, mas mente sobre o caixa — foi por isso que o faturamento passou a
// contar cobrança, não mensalidade teórica.
//
// LIMITAÇÃO CONHECIDA: não existe log de cobrança no banco.
// `purchase_verifications` é log de VERIFICAÇÃO do app (a mesma pessoa aparece
// 4 vezes no mesmo dia), não de cobrança da loja. Então as datas são
// derivadas: primeira compra verificada + um ciclo de cada vez. Para quem
// nunca renovou — hoje, todo mundo — isso é exato. Quando os webhooks de
// renovação (App Store Server Notifications / RTDN) gravarem cada cobrança,
// troque esta derivação por aquela tabela.

function chaveMes(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** Meses (yyyy-mm) em que esta assinatura foi cobrada, do início até hoje. */
export function mesesComCobranca(u: AppUser, hoje: Date = new Date()): string[] {
  if (!u.assinouEm) return [];

  // Quem cancelou parou de ser cobrado: a última cobrança é anterior ao fim do
  // período pago. Sem esse corte, um churn continuaria gerando receita todo mês.
  const fim =
    isPagante(u) || !u.current_period_end
      ? hoje.getTime()
      : Math.min(new Date(u.current_period_end).getTime() - 1, hoje.getTime());

  const anual = cicloDoUsuario(u) === 'anual';
  const out: string[] = [];
  const d = new Date(u.assinouEm);

  // Teto de segurança: 240 iterações = 20 anos de mensal.
  for (let i = 0; i < 240 && d.getTime() <= fim; i++) {
    out.push(chaveMes(d));
    if (anual) d.setFullYear(d.getFullYear() + 1);
    else d.setMonth(d.getMonth() + 1);
  }
  return out;
}

/** Quanto ESTA conta pôs no caixa no mês (yyyy-mm). Valor CHEIO da cobrança. */
export function receitaNoMes(u: AppUser, mes: string, hoje: Date = new Date()): number {
  const cobrancas = mesesComCobranca(u, hoje).filter((m) => m === mes).length;
  return cobrancas * priceForUser(u);
}

/** Receita bruta de caixa do mês, somando todas as contas. */
export function receitaBrutaDoMes(users: AppUser[], mes: string, hoje: Date = new Date()): number {
  return users.reduce((s, u) => s + receitaNoMes(u, mes, hoje), 0);
}

// ── Comissão ──────────────────────────────────────────────
/** Quanto a comissão vale em R$ para cada tipo de plano. */
export function commissionPerPlan(p: Perfil): ComissaoPorPlano[] {
  return PLANOS.map((plano) => {
    const valor =
      p.commission_type === 'valor'
        ? Number(p.commission_amount) || 0
        : ((Number(p.commission_percent) || 0) / 100) * plano.price;
    return { plano, valor };
  });
}

/** Valor da comissão por um assinante, conforme o tipo configurado no perfil. */
export function commissionValue(p: Perfil, u: AppUser): number {
  if (p.commission_type === 'valor') return Number(p.commission_amount) || 0;
  return ((Number(p.commission_percent) || 0) / 100) * priceForUser(u);
}

/** Rótulo legível da comissão + duração. */
export function commissionLabel(p: Perfil): string {
  const base =
    p.commission_type === 'valor'
      ? `${formatBRL(Number(p.commission_amount) || 0)} / assinante`
      : `${Number(p.commission_percent) || 0}% da assinatura`;
  const dur =
    p.commission_duration_months && p.commission_duration_months > 0
      ? `por ${p.commission_duration_months} ${p.commission_duration_months === 1 ? 'mês' : 'meses'}`
      : 'vitalícia';
  return `${base} · ${dur}`;
}

// ── Visão geral ───────────────────────────────────────────
export interface OverviewMetrics {
  appConfigured: boolean;
  totalUsuarios: number;
  pagantes: number;
  trialAtivo: number;
  trialExpirado: number;
  churn: number;
  free: number;
  receitaMensalEstimada: number;
}

export function buildOverview(users: AppUser[]): OverviewMetrics {
  const pagantesArr = users.filter(isPagante);
  return {
    appConfigured: appDbConfigured(),
    totalUsuarios: users.length,
    pagantes: pagantesArr.length,
    trialAtivo: users.filter(isTrialAtivo).length,
    trialExpirado: users.filter(isTrialExpirado).length,
    churn: users.filter(isChurn).length,
    free: users.filter((u) => u.estado === 'free').length,
    receitaMensalEstimada: pagantesArr.reduce((s, u) => s + monthlyRevenueForUser(u), 0),
  };
}

/**
 * Reconstrói a visão geral como estava numa data passada, para o comparativo
 * "vs período anterior".
 *
 * ⚠️ É APROXIMAÇÃO, não histórico exato. `trial_ends_at` e `created_at` são
 * datas fixas, então trial ativo/expirado saem corretos para qualquer data.
 * Já "pagante" só temos o snapshot de hoje — quem paga hoje é contado como se
 * já pagasse naquela data (desde que já existisse). Cancelamento ou reembolso
 * ocorrido no meio do caminho não aparece. Para histórico exato seria preciso
 * uma tabela de eventos de cobrança, que ainda não existe.
 */
export function buildOverviewAt(users: AppUser[], at: number): OverviewMetrics {
  const existiam = users.filter((u) => new Date(u.created_at).getTime() <= at);

  const trialAtivo = existiam.filter(
    (u) => u.trial_ends_at != null && new Date(u.trial_ends_at).getTime() > at && !isPagante(u)
  ).length;
  const trialExpirado = existiam.filter(
    (u) => u.trial_ends_at != null && new Date(u.trial_ends_at).getTime() <= at && !isPagante(u)
  ).length;
  const pagantesArr = existiam.filter(isPagante);

  return {
    appConfigured: appDbConfigured(),
    totalUsuarios: existiam.length,
    pagantes: pagantesArr.length,
    trialAtivo,
    trialExpirado,
    churn: existiam.filter(isChurn).length,
    free: existiam.length - pagantesArr.length - trialAtivo - trialExpirado,
    receitaMensalEstimada: pagantesArr.reduce((s, u) => s + monthlyRevenueForUser(u), 0),
  };
}

// ── Repasses ──────────────────────────────────────────────
/**
 * No Ninho o repasse é sempre do conversor, e sempre sobre os leads que ELE
 * marcou como 'convertido'. Não existe atribuição por link/código — não há
 * influencer.
 */
export interface RepassePerfil {
  perfil: Perfil;
  convertidos: number; // leads que ele marcou como convertido
  pagantes: number; // desses, quantos pagam hoje
  trials: number; // desses, quantos ainda estão em trial (previsão)
  consolidado: number; // R$ já devido
  previsao: number; // R$ potencial se os trials virarem
}

export function repasseDoPerfil(
  perfil: Perfil,
  users: AppUser[],
  outcomes: LeadOutcome[]
): RepassePerfil {
  const convertidoIds = new Set(
    outcomes
      .filter((o) => o.perfil_id === perfil.id && o.outcome === 'convertido')
      .map((o) => o.profile_id)
  );
  const convertidos = users.filter((u) => convertidoIds.has(u.id));
  const pagantesArr = convertidos.filter(isPagante);
  const trialsArr = convertidos.filter(isTrialAtivo);

  return {
    perfil,
    convertidos: convertidos.length,
    pagantes: pagantesArr.length,
    trials: trialsArr.length,
    consolidado: pagantesArr.reduce((s, u) => s + commissionValue(perfil, u), 0),
    previsao: trialsArr.reduce((s, u) => s + commissionValue(perfil, u), 0),
  };
}

export function buildRepasses(
  perfis: Perfil[],
  users: AppUser[],
  outcomes: LeadOutcome[]
): RepassePerfil[] {
  return perfis
    .filter((p) => p.role === 'conversor')
    .map((p) => repasseDoPerfil(p, users, outcomes));
}

// ── Custos e lucro ────────────────────────────────────────
export interface PnL {
  receita: number;
  repasses: number;
  custosFixos: number;
  custosVariaveis: number;
  custoTotal: number;
  lucro: number;
  margem: number; // %
}

/** Soma os custos de um mês (yyyy-mm). Sem mês, soma tudo. */
export function custosDoMes(costs: Cost[], mes?: string) {
  const alvo = costs.filter((c) => !mes || c.ref_month.slice(0, 7) === mes);
  const fixos = alvo.filter((c) => c.kind === 'fixo').reduce((s, c) => s + Number(c.amount), 0);
  const variaveis = alvo
    .filter((c) => c.kind === 'variavel')
    .reduce((s, c) => s + Number(c.amount), 0);
  return { fixos, variaveis, total: fixos + variaveis };
}

export function buildPnL(
  receita: number,
  costs: Cost[],
  repasses: RepassePerfil[],
  mes?: string
): PnL {
  const c = custosDoMes(costs, mes);
  const totalRepasses = repasses.reduce((s, r) => s + r.consolidado, 0);
  const custoTotal = c.total + totalRepasses;
  const lucro = receita - custoTotal;
  return {
    receita,
    repasses: totalRepasses,
    custosFixos: c.fixos,
    custosVariaveis: c.variaveis,
    custoTotal,
    lucro,
    margem: receita > 0 ? (lucro / receita) * 100 : 0,
  };
}

// ── Formatação ────────────────────────────────────────────
export function formatBRL(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('pt-BR');
}

export function pctChange(atual: number, anterior: number): number {
  if (anterior === 0) return atual === 0 ? 0 : 100;
  return ((atual - anterior) / anterior) * 100;
}
