/**
 * Preços dos planos do Ninho. Módulo leve, sem dependências de servidor —
 * pode ser importado tanto em Server quanto em Client Components.
 *
 * A landing (seção "Planos") e o painel leem tudo deste arquivo — mexer aqui
 * propaga para o site inteiro.
 */
/**
 * Tabela de preços — DOIS planos pagos, cada um com dois ciclos.
 *
 * ⚠️ ESPELHA `src/features/subscription/plans.ts` do app
 * (PLAN_DISPLAY_FALLBACK). Mudou lá, muda aqui: é daqui que saem receita,
 * MRR, ARPU, LTV e comissão no painel.
 *
 * O painel ignorava o Básico até 10/2026 e cobrava preço de Premium de todo
 * mundo — com 6 dos 12 assinantes no Básico, isso inflava o MRR em R$ 30/mês.
 * Por isso `plan` (o tier) é tão obrigatório quanto `plan_interval` em
 * qualquer conta de dinheiro: ciclo sozinho não diz o preço.
 */
export type PlanoTier = 'basico' | 'premium';
export type PlanoCiclo = 'mensal' | 'anual';

export const PRECOS: Record<PlanoTier, Record<PlanoCiclo, number>> = {
  basico: { mensal: 9.9, anual: 89.9 },
  premium: { mensal: 14.9, anual: 129.9 },
};

export const PLANO_LABEL: Record<PlanoTier, string> = {
  basico: 'Básico',
  premium: 'Premium',
};

/** Preço de tabela de um tier + ciclo. */
export function precoDe(tier: PlanoTier, ciclo: PlanoCiclo): number {
  return PRECOS[tier][ciclo];
}

/** Quanto esse plano vale POR MÊS — anual entra rateado por 12, pra não
 *  inflar o mês em que a loja cobrou os 12 de uma vez. */
export function precoMensalizado(tier: PlanoTier, ciclo: PlanoCiclo): number {
  const p = precoDe(tier, ciclo);
  return ciclo === 'anual' ? p / 12 : p;
}

// Atalhos do Premium — a landing fala só dele, e esses nomes já estavam
// espalhados por lá antes do Básico existir.
export const PRECO_MENSAL = PRECOS.premium.mensal;
export const PRECO_ANUAL = PRECOS.premium.anual;

/**
 * Duração do free trial, em dias.
 *
 * ⚠️ ANDA JUNTO COM O BANCO. A mesma constante existe em SQL como
 * `public.trial_dias()` (migration 00022), que é quem de fato carimba o
 * `trial_ends_at` de cada usuário no cadastro. Mudou aqui, muda lá — senão a
 * landing promete um prazo e o app concede outro.
 */
export const DIAS_TRIAL = 7;

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

export type PlanoKey = 'basico-mensal' | 'basico-anual' | 'premium-mensal' | 'premium-anual';

export interface PlanoInfo {
  key: PlanoKey;
  label: string;
  price: number;
  /** true = Apple/Google cobram (e pagam) uma única vez por ciclo anual. */
  anual: boolean;
}

/** Os QUATRO produtos que existem nas lojas — é sobre eles que a comissão
 *  do conversor é calculada. Antes esta lista tinha só o Premium, e a
 *  comissão de quem vendesse Básico saía errada. */
export const PLANOS: PlanoInfo[] = [
  { key: 'basico-mensal', label: 'Básico mensal', price: PRECOS.basico.mensal, anual: false },
  { key: 'basico-anual', label: 'Básico anual', price: PRECOS.basico.anual, anual: true },
  { key: 'premium-mensal', label: 'Premium mensal', price: PRECOS.premium.mensal, anual: false },
  { key: 'premium-anual', label: 'Premium anual', price: PRECOS.premium.anual, anual: true },
];

export interface ComissaoPorPlano {
  plano: PlanoInfo;
  valor: number; // R$ de comissão por cobrança desse plano
}

export function brl(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/** Só o número, no formato usado na landing (ex: "19,90"). */
export function numeroBr(v: number): string {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
