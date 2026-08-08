/**
 * Calendário de repasses do Ninho.
 *
 * Regra (alinhada ao prazo de 45 dias da Apple/Google):
 *  - Tudo que a loja COBRA num mês fecha no último dia desse mês.
 *  - O repasse é pago no dia 30 do mês SEGUINTE ao fechamento.
 *    Ex.: cobranças de 01/07 a 31/07 → pagas em 30/08.
 *  - Pix, qualquer valor, sem nota fiscal.
 *
 * Buckets exibidos ao conversor:
 *  - "Em aberto" = mês corrente, ainda acumulando (paga dia 30 do mês seguinte).
 *  - "Consolidado/A pagar" = mês anterior já fechado (paga dia 30 do mês corrente).
 */

const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

function lastDay(year: number, monthIndex0: number): number {
  return new Date(year, monthIndex0 + 1, 0).getDate();
}

/** Data do dia 30 (ou último dia, se o mês não tiver 30) de um mês. */
export function diaPagamento(year: number, monthIndex0: number): Date {
  const dia = Math.min(30, lastDay(year, monthIndex0));
  return new Date(year, monthIndex0, dia);
}

export function fmtData(d: Date): string {
  return d.toLocaleDateString('pt-BR');
}

export function competenciaLabel(year: number, monthIndex0: number): string {
  return `${MESES[monthIndex0]}/${year}`;
}

export interface Bucket {
  competencia: string; // ex: "junho/2026" — mês das cobranças
  pagamentoEm: Date; // dia 30 em que esse bucket é pago
}

export interface RepasseSchedule {
  aberto: Bucket; // mês corrente, ainda acumulando
  consolidado: Bucket; // mês anterior, fechado, a pagar
}

/** Buckets de repasse para uma data de referência (hoje, por padrão). */
export function repasseSchedule(today: Date = new Date()): RepasseSchedule {
  const y = today.getFullYear();
  const m = today.getMonth(); // 0-11

  // Em aberto = mês corrente → paga dia 30 do mês seguinte
  const proxY = m === 11 ? y + 1 : y;
  const proxM = m === 11 ? 0 : m + 1;

  // Consolidado = mês anterior → paga dia 30 do mês corrente
  const antY = m === 0 ? y - 1 : y;
  const antM = m === 0 ? 11 : m - 1;

  return {
    aberto: {
      competencia: competenciaLabel(y, m),
      pagamentoEm: diaPagamento(proxY, proxM),
    },
    consolidado: {
      competencia: competenciaLabel(antY, antM),
      pagamentoEm: diaPagamento(y, m),
    },
  };
}
