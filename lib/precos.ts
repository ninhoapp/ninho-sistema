/**
 * Preços dos planos do Ninho. Módulo leve, sem dependências de servidor —
 * pode ser importado tanto em Server quanto em Client Components.
 *
 * A landing (seção "Planos") e o painel leem tudo deste arquivo — mexer aqui
 * propaga para o site inteiro.
 */
export const PRECO_MENSAL = 14.9; // Premium Mensal — definido
// ⚠️ ANUAL A CONFIRMAR: espelha o SOMI (mesma mensalidade, mesmo anual).
// Precisa ser < PRECO_MENSAL * 12 (R$ 178,80), senão o desconto fica negativo.
export const PRECO_ANUAL = 129.9; // Premium Anual (cobrado 1x/ano)
export const DIAS_TRIAL = 14;

/** Mensalidade equivalente do plano anual (o que aparece no toggle "Anual"). */
export const PRECO_ANUAL_POR_MES = PRECO_ANUAL / 12;

/** Economia em R$ de quem assina o anual em vez de 12x o mensal. */
export const ECONOMIA_ANUAL = PRECO_MENSAL * 12 - PRECO_ANUAL;

/** Desconto do anual, em % inteiro (para o badge "X% off"). */
export const DESCONTO_ANUAL_PCT = Math.round(
  (ECONOMIA_ANUAL / (PRECO_MENSAL * 12)) * 100
);

// Taxa que Apple/Google retêm por venda (Small Business Program). Todo campo
// de "receita" do painel usa o valor LÍQUIDO (depois dessa taxa) — é o que o
// Ninho de fato recebe.
export const TAXA_LOJA = 0.15;

/** Valor líquido pro Ninho depois da taxa da loja (Apple/Google). */
export function liquido(valorBruto: number): number {
  return valorBruto * (1 - TAXA_LOJA);
}

export type PlanoKey = 'mensal' | 'anual';

export interface PlanoInfo {
  key: PlanoKey;
  label: string;
  price: number;
  /** true = Apple/Google cobram (e pagam) uma única vez por ciclo anual. */
  anual: boolean;
}

export const PLANOS: PlanoInfo[] = [
  { key: 'mensal', label: 'Premium mensal', price: PRECO_MENSAL, anual: false },
  { key: 'anual', label: 'Premium anual', price: PRECO_ANUAL, anual: true },
];

export function brl(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/** Só o número, no formato usado na landing (ex: "19,90"). */
export function numeroBr(v: number): string {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
