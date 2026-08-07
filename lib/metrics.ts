/**
 * Ninho · Métricas do painel. Server-safe (sem I/O — recebe os dados prontos).
 *
 * Os estados vêm da view `public.assinatura_estado`; aqui só se agrega.
 * Nada nesta camada estima receita de quem não paga: enquanto a cobrança não
 * existir no app, `pagantes` é 0 e a receita é 0 — número vazio, não fictício.
 */
import type { AppUser } from '@/lib/app-users';
import { appDbConfigured } from '@/lib/app-users';
import type { Perfil, Cost, LeadOutcome } from '@/lib/painel/store';
import {
  PLANOS,
  PRECO_MENSAL,
  PRECO_ANUAL,
  type PlanoKey,
  type ComissaoPorPlano,
} from '@/lib/precos';

// ── Predicados ────────────────────────────────────────────
export const isPagante = (u: AppUser) => u.estado === 'pagante';
export const isTrialAtivo = (u: AppUser) => u.estado === 'trial_ativo';
export const isTrialExpirado = (u: AppUser) => u.estado === 'trial_expirado';
export const isChurn = (u: AppUser) => u.estado === 'churn';

/** Plano do usuário. Sem ciclo definido (ainda não pagou), assume mensal. */
export function planoDoUsuario(u: AppUser): PlanoKey {
  return u.plan_interval === 'anual' ? 'anual' : 'mensal';
}

/** Preço de tabela do plano do usuário. */
export function priceForUser(u: AppUser): number {
  return planoDoUsuario(u) === 'anual' ? PRECO_ANUAL : PRECO_MENSAL;
}

/** Receita mensal do usuário. O anual entra rateado por 12 pra não inflar o mês da cobrança. */
export function monthlyRevenueForUser(u: AppUser): number {
  return planoDoUsuario(u) === 'anual' ? PRECO_ANUAL / 12 : PRECO_MENSAL;
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
