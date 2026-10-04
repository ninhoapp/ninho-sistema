/**
 * Ninho · Pedaços de lib/app-users que componentes de navegador usam.
 *
 * Ficam aqui, sem nenhum import, pra que um 'use client' não arraste o
 * cliente do Supabase (e o resto do código de servidor) pro bundle do
 * navegador só por causa de uma constante. lib/app-users re-exporta tudo.
 */

/** True quando o painel consegue ler o banco. Falso = telas vazias, sem chute. */
export function appDbConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

// ─── Status da conta (rótulo legível) ──────────────────────────────────
//
// O `estado` cru da view responde "paga ou não paga". A tela de usuários
// precisa de mais: QUAL plano e em QUAL ciclo, senão Premium anual e
// Básico mensal viram a mesma linha "pagante" e o filtro da coluna não
// serve pra nada.
export type StatusConta =
  | 'Free trial ativo'
  | 'Free trial expirado'
  | 'Premium mensal'
  | 'Premium anual'
  | 'Básico mensal'
  | 'Básico anual'
  | 'Churn'
  | 'Cadastrado';

/** Quem conta como assinante de verdade — quem paga, em qualquer plano. */
export const STATUS_ASSINANTE: StatusConta[] = [
  'Premium mensal',
  'Premium anual',
  'Básico mensal',
  'Básico anual',
];

/** Status em que faz sentido mexer na data de fim do trial. Fora deles a
 *  data que vale é `current_period_end` (ciclo pago), que quem manda é a
 *  loja — não o operador. */
export const STATUS_TRIAL_EDITAVEL: StatusConta[] = [
  'Free trial ativo',
  'Free trial expirado',
];
