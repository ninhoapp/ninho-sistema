/**
 * Contas e formatos das tabelas do teste de paywall que rodam nos dois
 * lados (página no servidor e tabela no navegador). Sem nada de servidor:
 * lib/teste-paywall.ts lê o banco e não pode ir para o navegador.
 */
import type { Cartao } from '@/lib/teste-paywall';
import { brl, precoDe } from '@/lib/precos';

/** "24/10 07:22" no fuso de Dubai (regra do painel para datas). */
export function quandoDubai(iso: string | null): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'Asia/Dubai', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso));
}

/** Dias inteiros até a 1ª cobrança (arredonda para cima: faltando 30h, "2"). */
export function diasAte(iso: string | null): number | null {
  if (!iso) return null;
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
}

/** Valor da 1ª cobrança: nada se desligou a renovação; preço de tabela
 *  (bruto, antes da taxa da loja) se vai cobrar ou já cobrou. */
export function valorCartao(c: Cartao): { texto: string; valor: number } {
  if (!c.plano || !c.ciclo) return { texto: '—', valor: 0 };
  const preco = precoDe(c.plano, c.ciclo);
  if (c.pagou) return { texto: `${brl(preco)} · pago`, valor: 0 };
  if (c.renova === false) return { texto: 'R$ 0 · cancelou', valor: 0 };
  return { texto: brl(preco), valor: preco };
}
