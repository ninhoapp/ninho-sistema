/**
 * Câmbio do painel. Despesas (`painel.custos`) é tudo em AED (regra do dono,
 * 24/10/2026) e a receita das lojas é em R$. Para juntar os dois (lucro,
 * margem, resultado), a despesa é convertida para R$ com esta cotação, que
 * aparece escrita na tela. Mudou a cotação: troque aqui e a data junto.
 */
export const CAMBIO = { data: '24/10/2026', aedPorUsd: 3.6725, brlPorUsd: 5.45 };

/** Quantos R$ vale 1 AED nesse câmbio (≈ 1,484). */
export const BRL_POR_AED = CAMBIO.brlPorUsd / CAMBIO.aedPorUsd;

export function aedParaBrl(aed: number): number {
  return aed * BRL_POR_AED;
}

export function formatAED(v: number): string {
  return `${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} AED`;
}

/** "1 AED = R$ 1,48 (US$ 1 = 3,6725 AED = R$ 5,45, em 24/10/2026)" */
export const TEXTO_CAMBIO = `1 AED = R$ ${BRL_POR_AED.toFixed(2).replace('.', ',')} (US$ 1 = ${CAMBIO.aedPorUsd
  .toString()
  .replace('.', ',')} AED = R$ ${CAMBIO.brlPorUsd.toString().replace('.', ',')}, em ${CAMBIO.data})`;
