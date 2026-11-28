/**
 * Formatos do painel da consultora por idioma (datas, horas, números e
 * dinheiro). Sem dependência de servidor: serve a componentes de cliente.
 *
 * O programa paga em R$ (Pix/CPF): o valor continua em reais, só o formato
 * muda (R$ 1.234,50 · R$1,234.50 · R$1,234.50).
 * Hora: pt e es em 24h ("03:20"); en em 12h ("3:20 AM"), como a voz-da-marca.
 */
import type { Idioma } from '@/lib/idioma';

/** Locale do Intl para cada idioma. */
export function localeDe(idioma: Idioma): string {
  return idioma === 'en' ? 'en-US' : idioma === 'es' ? 'es-419' : 'pt-BR';
}

type Quando = string | number | Date;
const data = (v: Quando) => (v instanceof Date ? v : new Date(v));

/** toLocaleDateString no idioma (mesmas opções do Intl). */
export function fmtData(idioma: Idioma, v: Quando, opcoes: Intl.DateTimeFormatOptions = {}): string {
  return data(v).toLocaleDateString(localeDe(idioma), opcoes);
}

/** toLocaleString (data e hora) no idioma; hora 12h só no inglês. */
export function fmtDataHora(idioma: Idioma, v: Quando, opcoes: Intl.DateTimeFormatOptions = {}): string {
  return data(v).toLocaleString(localeDe(idioma), { hour12: idioma === 'en', ...opcoes });
}

/** "03:20" (pt/es) ou "3:20 AM" (en). `timeZone` opcional (padrão: UTC, para ms já deslocados). */
export function fmtHora(idioma: Idioma, v: Quando, timeZone = 'UTC'): string {
  return data(v).toLocaleTimeString(localeDe(idioma), {
    hour: idioma === 'en' ? 'numeric' : '2-digit',
    minute: '2-digit',
    hour12: idioma === 'en',
    timeZone,
  });
}

/** Número no idioma (1.234,5 · 1,234.5). */
export function fmtNumero(idioma: Idioma, v: number, opcoes: Intl.NumberFormatOptions = {}): string {
  return v.toLocaleString(localeDe(idioma), opcoes);
}

/** Dinheiro sempre em R$, no formato do idioma. */
export function fmtBRL(idioma: Idioma, v: number): string {
  return v.toLocaleString(localeDe(idioma), { style: 'currency', currency: 'BRL', currencyDisplay: 'narrowSymbol' });
}

/** "12,5%" · "12.5%". */
export function fmtPct(idioma: Idioma, p: number): string {
  return `${fmtNumero(idioma, p, { maximumFractionDigits: 2 })}%`;
}
