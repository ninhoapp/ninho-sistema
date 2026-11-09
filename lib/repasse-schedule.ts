/**
 * Calendário de repasses do Ninho.
 *
 * Regra (alinhada ao prazo de 45 dias da Apple/Google):
 *  - Tudo que a loja COBRA num mês fecha no último dia desse mês.
 *  - O repasse é pago até o 5º DIA ÚTIL do mês SEGUINTE ao fechamento
 *    (regra do dono, 09/11/2026; antes era dia 30). Mesma conta da
 *    consultora (lib/consultoras-regras.ts → diaUtil, com feriados).
 *    Ex.: cobranças de 01/07 a 31/07 → pagas até o 5º dia útil de agosto.
 *  - Pix, qualquer valor, sem nota fiscal.
 *
 * Buckets exibidos ao conversor:
 *  - "Em aberto" = mês corrente, ainda acumulando (paga no 5º dia útil do mês seguinte).
 *  - "Consolidado/A pagar" = mês anterior já fechado (paga no 5º dia útil do mês corrente).
 */

import { diaUtil } from '@/lib/consultoras-regras';

const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

/** Prazo do Pix num mês: o 5º dia útil (fim de semana e feriado nacional não contam). */
export function diaPagamento(year: number, monthIndex0: number): Date {
  const [y, m, d] = diaUtil(year, monthIndex0 + 1, 5).split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function fmtData(d: Date): string {
  return d.toLocaleDateString('pt-BR');
}

export function competenciaLabel(year: number, monthIndex0: number): string {
  return `${MESES[monthIndex0]}/${year}`;
}

export interface Bucket {
  competencia: string; // ex: "junho/2026" — mês das cobranças
  pagamentoEm: Date; // 5º dia útil em que esse bucket é pago
}

export interface RepasseSchedule {
  aberto: Bucket; // mês corrente, ainda acumulando
  consolidado: Bucket; // mês anterior, fechado, a pagar
}

/** Buckets de repasse para uma data de referência (hoje, por padrão). */
export function repasseSchedule(today: Date = new Date()): RepasseSchedule {
  const y = today.getFullYear();
  const m = today.getMonth(); // 0-11

  // Em aberto = mês corrente → paga no 5º dia útil do mês seguinte
  const proxY = m === 11 ? y + 1 : y;
  const proxM = m === 11 ? 0 : m + 1;

  // Consolidado = mês anterior → paga no 5º dia útil do mês corrente
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
