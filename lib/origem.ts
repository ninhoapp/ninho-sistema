/**
 * Ninho · De onde veio cada conta (migration 00074 do app).
 *
 * Três fontes, nesta precedência — a mesma da view `assinantes_por_origem`
 * (migration 00194 do app; mudou um, muda o outro):
 *   1. `atribuicao_apple_ads.atribuido` — a Apple confirmou que a instalação
 *      veio de um anúncio do Apple Ads. Determinístico, por pessoa.
 *   2. `origem_landing` (00194, ENG-010) — tocou em Baixar na página /landing,
 *      o link do orgânico: "Tráfego orgânico" ou, com ?origem=tiktok,
 *      "TikTok (orgânico)". Clique real casado pelo app.
 *   3. `profiles.como_conheceu` — o que a pessoa respondeu no onboarding.
 * (O push de novo assinante, _shared/avisarNovoAssinante.ts, ainda não lê a
 * landing.)
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
  | 'trafego_organico'
  | 'tiktok_organico'
  | 'instagram'
  | 'facebook'
  | 'instagram_facebook'
  | 'busca_loja'
  | 'indicacao'
  | 'tiktok'
  | 'google'
  | 'consultora'
  | 'convite_cuidador'
  | 'outro'
  | 'sem_informacao';

export const ORIGEM_LABEL: Record<Origem, string> = {
  apple_ads: 'Apple Ads',
  trafego_organico: 'Tráfego orgânico',
  tiktok_organico: 'TikTok (orgânico)',
  instagram: 'Instagram',
  facebook: 'Facebook',
  instagram_facebook: 'Instagram/Facebook',
  busca_loja: 'Busca na loja',
  indicacao: 'Indicação',
  tiktok: 'TikTok',
  google: 'Google',
  consultora: 'Consultora',
  convite_cuidador: 'Convite de cuidador',
  outro: 'Outro',
  sem_informacao: 'Sem informação',
};

export const ORIGEM_COR: Record<Origem, string> = {
  apple_ads: '#7DB7F0',
  trafego_organico: '#3FA7A0',
  tiktok_organico: '#E0567A',
  instagram: '#C77DD6',
  facebook: '#5B7FD6',
  instagram_facebook: '#9F86E0',
  busca_loja: '#59B287',
  indicacao: '#F5C24E',
  tiktok: '#3A3A3A',
  google: '#E8875D',
  consultora: '#D99A6C',
  convite_cuidador: '#C9A0DC',
  outro: '#B5B5B5',
  sem_informacao: '#E3E3E3',
};

/** Ordem de exibição: canais pagos primeiro, "sem informação" por último. */
export const ORIGENS: Origem[] = [
  'apple_ads',
  'trafego_organico',
  'tiktok_organico',
  'instagram',
  'facebook',
  'instagram_facebook',
  'busca_loja',
  'indicacao',
  'tiktok',
  'google',
  'consultora',
  'convite_cuidador',
  'outro',
  'sem_informacao',
];

/** Valores que vêm de `profiles.como_conheceu`. As origens calculadas (Apple
 *  Ads e /landing) ficam de fora: ninguém "responde" isso no onboarding. */
const NAO_AUTODECLARADAS = new Set<string>(['apple_ads', 'trafego_organico', 'tiktok_organico', 'sem_informacao']);
const AUTODECLARADAS = new Set<string>(ORIGENS.filter((o) => !NAO_AUTODECLARADAS.has(o)));

/**
 * `campaign_id` falso que a Apple devolve em TestFlight e em build de
 * desenvolvimento. Não é campanha: é placeholder. Contar isso como Apple Ads
 * infla o canal pago com instalação de teste — inclusive as nossas.
 */
export const APPLE_ADS_CAMPANHA_TESTE = 1234567890;

/** Atribuição do Apple Ads que vale: confirmada E de campanha real. */
export function appleAdsValido(atribuido: boolean, campaignId: number | null): boolean {
  return atribuido && campaignId !== APPLE_ADS_CAMPANHA_TESTE;
}

export function resolverOrigem(
  appleAdsAtribuido: boolean,
  comoConheceu: string | null,
  appleAdsCampaignId: number | null = null,
  /** Fonte do clique na /landing (public.origem_landing), ou null se não veio de lá. */
  landingFonte: string | null = null,
): Origem {
  if (appleAdsValido(appleAdsAtribuido, appleAdsCampaignId)) return 'apple_ads';
  if (landingFonte) return landingFonte === 'tiktok' ? 'tiktok_organico' : 'trafego_organico';
  if (comoConheceu && AUTODECLARADAS.has(comoConheceu)) return comoConheceu as Origem;
  return 'sem_informacao';
}
