/**
 * Ninho · De onde veio cada conta (migration 00074 do app).
 *
 * Duas fontes, nesta precedência — a mesma da view `assinantes_por_origem`
 * e do push de novo assinante:
 *   1. `atribuicao_apple_ads.atribuido` — a Apple confirmou que a instalação
 *      veio de um anúncio do Apple Ads. Determinístico, por pessoa.
 *   2. `profiles.como_conheceu` — o que a pessoa respondeu no onboarding.
 *
 * Meta Ads NÃO aparece aqui como fonte própria: no iOS sem ATT a Meta não
 * devolve "quem" veio do anúncio. O que temos é o autodeclarado
 * "Instagram ou Facebook" (que mistura anúncio e orgânico). O número por
 * campanha da Meta fica no Gerenciador de Anúncios (evento Subscribe).
 *
 * "Sem informação" = conta de antes da 00074, ou que pulou a pergunta e não
 * veio do Apple Ads (ou ainda não abriu a versão nova do app).
 */
export type Origem =
  | 'apple_ads'
  | 'instagram_facebook'
  | 'busca_loja'
  | 'indicacao'
  | 'tiktok'
  | 'google'
  | 'convite_cuidador'
  | 'outro'
  | 'sem_informacao';

export const ORIGEM_LABEL: Record<Origem, string> = {
  apple_ads: 'Apple Ads',
  instagram_facebook: 'Instagram/Facebook',
  busca_loja: 'Busca na loja',
  indicacao: 'Indicação',
  tiktok: 'TikTok',
  google: 'Google',
  convite_cuidador: 'Convite de cuidador',
  outro: 'Outro',
  sem_informacao: 'Sem informação',
};

export const ORIGEM_COR: Record<Origem, string> = {
  apple_ads: '#7DB7F0',
  instagram_facebook: '#9F86E0',
  busca_loja: '#59B287',
  indicacao: '#F5C24E',
  tiktok: '#3A3A3A',
  google: '#E8875D',
  convite_cuidador: '#C9A0DC',
  outro: '#B5B5B5',
  sem_informacao: '#E3E3E3',
};

/** Ordem de exibição: canais pagos primeiro, "sem informação" por último. */
export const ORIGENS: Origem[] = [
  'apple_ads',
  'instagram_facebook',
  'busca_loja',
  'indicacao',
  'tiktok',
  'google',
  'convite_cuidador',
  'outro',
  'sem_informacao',
];

const AUTODECLARADAS = new Set<string>(ORIGENS);

export function resolverOrigem(appleAdsAtribuido: boolean, comoConheceu: string | null): Origem {
  if (appleAdsAtribuido) return 'apple_ads';
  if (comoConheceu && AUTODECLARADAS.has(comoConheceu)) return comoConheceu as Origem;
  return 'sem_informacao';
}
