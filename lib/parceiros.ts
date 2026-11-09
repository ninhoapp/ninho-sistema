/**
 * Ninho · Números dos parceiros (influenciadores). Server-safe, sem I/O.
 *
 * Mesmas regras do SOMI (somi-pesquisa: lib/metrics.ts, repasse-engine.ts e
 * partner-revenue.ts), adaptadas aos dados do Ninho:
 *
 *  - Conta do parceiro = `u.parceiroCodigo === promo_code` (indicacao_parceiro).
 *  - Assinante = `isPagante` (a conta que paga, nunca quem herda o plano).
 *  - Comissão CONFIRMADA = por cobrança que a loja fez. O Ninho ainda não tem
 *    log de cobrança: as cobranças vêm de `mesesComCobranca` (1ª compra
 *    verificada + um ciclo por vez, cortando no cancelamento) — a MESMA conta
 *    do Faturamento, então repasse e receita batem.
 *  - Duração: mensal paga nos primeiros N meses pagos; anual consome 12 meses
 *    de duração numa cobrança só (com N ≤ 12, paga uma vez).
 *  - Pagamento: o que a loja cobra no mês M é pago até o 5º dia útil de M+1
 *    (lib/repasse-schedule.ts).
 *  - Estorno: ainda não chega ao banco (não há webhook de reembolso). Quem
 *    pede reembolso vira churn e para de gerar cobranças novas.
 */
import type { AppUser } from '@/lib/app-users';
import type { Perfil, ClickStats } from '@/lib/painel/store';
import {
  commissionValue,
  cicloDoUsuario,
  isPagante,
  isTrialAtivo,
  isTrialExpirado,
  isChurn,
  mesesComCobranca,
} from '@/lib/metrics';
import { rotuloMes } from '@/lib/dashboard-charts';

/**
 * Contas do parceiro. Atribuição dupla (a conta também está com uma
 * consultora): só conta aqui se o registro do parceiro for o mais antigo.
 */
export function contasDoParceiro(p: Perfil, users: AppUser[]): AppUser[] {
  const code = (p.promo_code || '').toUpperCase();
  return code ? users.filter((u) => u.parceiroCodigo === code && u.atribuicaoDupla !== 'vale_consultora') : [];
}

/** Contas com atribuição dupla (parceiro e consultora), para o alerta do painel. */
export function contasComAtribuicaoDupla(users: AppUser[]): AppUser[] {
  return users.filter((u) => u.atribuicaoDupla !== null);
}

// ── Estimado / previsão (foto de agora) ───────────────────
export interface RepasseParceiro {
  perfil: Perfil;
  cadastros: number;
  pagantes: number;
  trials: number;
  /** Comissão de um ciclo dos assinantes de hoje (estimado). */
  consolidado: number;
  /** Comissão se os trials de hoje virarem assinatura. */
  previsao: number;
  /** Fim do trial mais próximo (quando a previsão viraria cobrança). */
  previsaoData: string | null;
}

export function repasseDoParceiro(p: Perfil, users: AppUser[]): RepasseParceiro {
  const contas = contasDoParceiro(p, users);
  const pagantes = contas.filter(isPagante);
  const trials = contas.filter(isTrialAtivo);
  const previsaoData =
    trials
      .map((u) => u.trial_ends_at)
      .filter((d): d is string => Boolean(d))
      .sort()[0] ?? null;
  return {
    perfil: p,
    cadastros: contas.length,
    pagantes: pagantes.length,
    trials: trials.length,
    consolidado: pagantes.reduce((s, u) => s + commissionValue(p, u), 0),
    previsao: trials.reduce((s, u) => s + commissionValue(p, u), 0),
    previsaoData,
  };
}

// ── Confirmado (cobranças) ────────────────────────────────
export interface RepasseConfirmado {
  /** Comissão de todas as cobranças elegíveis até hoje. */
  total: number;
  cobrancas: number;
  /** yyyy-mm da cobrança → comissão gerada naquele mês. */
  porCompetencia: Record<string, number>;
}

function duracao(p: Perfil): number | null {
  return p.commission_duration_months && p.commission_duration_months > 0 ? p.commission_duration_months : null;
}

/** Meses de comissão já consumidos por uma conta (anual = 12 por cobrança). */
function mesesConsumidos(u: AppUser, hoje: Date): number {
  return mesesComCobranca(u, hoje).length * (cicloDoUsuario(u) === 'anual' ? 12 : 1);
}

export function repasseConfirmado(p: Perfil, users: AppUser[], hoje: Date = new Date()): RepasseConfirmado {
  const D = duracao(p);
  const porCompetencia: Record<string, number> = {};
  let total = 0;
  let cobrancas = 0;
  for (const u of contasDoParceiro(p, users)) {
    const passo = cicloDoUsuario(u) === 'anual' ? 12 : 1;
    let consumidos = 0;
    for (const mes of mesesComCobranca(u, hoje)) {
      const elegivel = D === null || consumidos + 1 <= D;
      consumidos += passo;
      if (!elegivel) continue;
      const v = commissionValue(p, u);
      total += v;
      cobrancas++;
      porCompetencia[mes] = (porCompetencia[mes] || 0) + v;
    }
  }
  return { total, cobrancas, porCompetencia };
}

function chaveMes(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** Comissão confirmada de uma competência (mês das cobranças, yyyy-mm). */
export function confirmadoDaCompetencia(c: RepasseConfirmado, mes: string): number {
  return c.porCompetencia[mes] ?? 0;
}

/** Competência do mês passado (fechado, paga no 5º dia útil deste mês) e a atual. */
export function competencias(hoje: Date = new Date()): { fechada: string; aberta: string } {
  return {
    fechada: chaveMes(new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1)),
    aberta: chaveMes(hoje),
  };
}

// ── Funil ─────────────────────────────────────────────────
export interface FunilParceiro {
  cliques: number;
  cliquesUnicos: number;
  downloads: number;
  cadastros: number;
  iniciaramTrial: number;
  assinantes: number;
  /** Assinantes ÷ quem passou pelo trial (pagante, em trial, trial vencido ou churn). */
  txConversaoTrial: number;
  txDownloadPorClique: number;
}

const pct = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 100) : 0);

export function funilDoParceiro(p: Perfil, users: AppUser[], stats: ClickStats, downloads: number): FunilParceiro {
  const contas = contasDoParceiro(p, users);
  const assinantes = contas.filter(isPagante).length;
  const iniciaramTrial = contas.filter(
    (u) => isPagante(u) || isTrialAtivo(u) || isTrialExpirado(u) || isChurn(u),
  ).length;
  return {
    cliques: stats.total,
    cliquesUnicos: stats.unique,
    downloads,
    cadastros: contas.length,
    iniciaramTrial,
    assinantes,
    txConversaoTrial: pct(assinantes, iniciaramTrial),
    txDownloadPorClique: pct(downloads, stats.unique),
  };
}

// ── Origem: link × código × manual ────────────────────────
export interface OrigemParceiro {
  link: { cadastros: number; assinantes: number };
  codigo: { cadastros: number; assinantes: number };
  manual: { cadastros: number; assinantes: number };
}

export function origemDoParceiro(p: Perfil, users: AppUser[]): OrigemParceiro {
  const r: OrigemParceiro = {
    link: { cadastros: 0, assinantes: 0 },
    codigo: { cadastros: 0, assinantes: 0 },
    manual: { cadastros: 0, assinantes: 0 },
  };
  for (const u of contasDoParceiro(p, users)) {
    const b = r[u.parceiroMetodo ?? 'manual'];
    b.cadastros++;
    if (isPagante(u)) b.assinantes++;
  }
  return r;
}

export const METODO_LABEL: Record<'link' | 'codigo' | 'manual', string> = {
  link: 'Link',
  codigo: 'Código',
  manual: 'Manual',
};

// ── Gráfico de receita do parceiro ────────────────────────
export interface BarraReceita {
  label: string;
  value: number;
  /** realizado = competência fechada (cobranças reais); projecao = ainda acumulando. */
  kind: 'realizado' | 'projecao';
  highlight: boolean;
}

/**
 * Uma barra por MÊS DE PAGAMENTO (5º dia útil), do mês atual até `mesesFrente`.
 * O valor de cada barra é a competência do mês anterior a ela. Competência
 * fechada = confirmado; atual e futuras = projeção dos assinantes de hoje
 * (próximas cobranças pelo `current_period_end`, enquanto couberem na duração).
 */
export function barrasReceita(p: Perfil, users: AppUser[], mesesFrente = 7, hoje: Date = new Date()): BarraReceita[] {
  const confirmado = repasseConfirmado(p, users, hoje);
  const D = duracao(p);

  // Próximas cobranças projetadas por competência.
  const projetado: Record<string, number> = {};
  const limite = new Date(hoje.getFullYear(), hoje.getMonth() + mesesFrente + 1, 1);
  for (const u of contasDoParceiro(p, users)) {
    if (!isPagante(u) || !u.current_period_end) continue;
    const anual = cicloDoUsuario(u) === 'anual';
    let consumidos = mesesConsumidos(u, hoje);
    const d = new Date(u.current_period_end);
    for (let i = 0; i < 24 && d < limite; i++) {
      if (D !== null && consumidos + 1 > D) break;
      if (d >= hoje) {
        const k = chaveMes(d);
        projetado[k] = (projetado[k] || 0) + commissionValue(p, u);
      }
      consumidos += anual ? 12 : 1;
      if (anual) d.setFullYear(d.getFullYear() + 1);
      else d.setMonth(d.getMonth() + 1);
    }
  }

  const atual = chaveMes(hoje);
  const barras: BarraReceita[] = [];
  for (let i = 0; i <= mesesFrente; i++) {
    const pagamento = new Date(hoje.getFullYear(), hoje.getMonth() + i, 1);
    const comp = chaveMes(new Date(hoje.getFullYear(), hoje.getMonth() + i - 1, 1));
    const fechada = comp < atual;
    // Competência atual: o que já foi cobrado este mês + o que ainda vai ser.
    const value = fechada
      ? confirmadoDaCompetencia(confirmado, comp)
      : (comp === atual ? confirmadoDaCompetencia(confirmado, comp) : 0) + (projetado[comp] ?? 0);
    barras.push({
      label: rotuloMes(chaveMes(pagamento)),
      value,
      kind: fechada ? 'realizado' : 'projecao',
      highlight: i === 0,
    });
  }
  return barras;
}
