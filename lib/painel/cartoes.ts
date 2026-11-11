/**
 * Cartões que pagam as despesas e a regra do mês da fatura (migration 00128
 * do Ninho-expo). Sem import de servidor: a tela de Despesas usa a mesma
 * conta para mostrar "entra em dezembro" antes de lançar.
 *
 * Regra do dono (10/11/2026): a compra conta no mês em que a fatura do cartão
 * FECHA. Cartão que fecha dia 17: compra de 18/10 é de novembro. Quando a
 * verba acaba, o dono troca o canal para um cartão que já fechou, e o mês
 * sai sozinho pela troca registrada em painel.cartao_por_canal.
 * O banco faz a mesma conta (public.mes_da_fatura); mudou aqui, mude lá.
 */

export interface Cartao {
  id: string;
  nome: string;
  final4: string | null;
  dia_fechamento: number;
  dia_vencimento: number | null;
  observacao: string | null;
}

export type Canal = 'meta_ads' | 'apple_ads' | 'ferramentas';

export interface CartaoCanal {
  canal: Canal;
  desde: string; // yyyy-mm-dd
  cartao_id: string;
}

export const CANAIS: Record<Canal, string> = {
  meta_ads: 'Meta Ads',
  apple_ads: 'Apple Ads',
  ferramentas: 'Ferramentas e o resto',
};

/** Mês (yyyy-mm) da fatura em que cai uma compra do dia `dia` (yyyy-mm-dd). */
export function mesDaFatura(dia: string, diaFechamento: number): string {
  const [y, m, d] = dia.split('-').map(Number);
  if (d <= diaFechamento) return `${y}-${String(m).padStart(2, '0')}`;
  const ny = m === 12 ? y + 1 : y;
  const nm = m === 12 ? 1 : m + 1;
  return `${ny}-${String(nm).padStart(2, '0')}`;
}

/** Cartão que o canal usava no dia (o mais recente com `desde` <= dia). Cai em "ferramentas" se o canal não tiver. */
export function cartaoDoCanal(historico: CartaoCanal[], canal: Canal, dia: string): string | null {
  const achar = (c: Canal) =>
    historico
      .filter((h) => h.canal === c && h.desde <= dia)
      .sort((a, b) => (a.desde < b.desde ? 1 : -1))[0]?.cartao_id ?? null;
  return achar(canal) ?? achar('ferramentas');
}

export function nomeCartao(c: Cartao): string {
  return c.final4 ? `${c.nome} (final ${c.final4})` : c.nome;
}

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

/** "2026-12" → "dezembro de 2026". */
export function nomeMes(mes: string): string {
  const [y, m] = mes.split('-').map(Number);
  return `${MESES[m - 1]} de ${y}`;
}
