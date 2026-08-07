/** Configurações gerais do site e do painel do Ninho. */

/**
 * URL pública do site.
 *
 * ⚠️ DOMÍNIO PROVISÓRIO — o registro.br ainda está propagando. Assim que o
 * domínio definitivo estiver no ar, defina `NEXT_PUBLIC_SITE_URL` na Vercel
 * (Settings > Environment Variables). Nenhum outro arquivo precisa mudar:
 * todo o site monta links a partir daqui.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || 'https://useninho.com.br'
).replace(/\/$/, '');

// Para onde o desktop é direcionado (não tem loja).
export const LANDING_URL = process.env.NEXT_PUBLIC_LANDING_URL || SITE_URL;

// E-mail de contato exibido na landing e nas páginas legais.
export const CONTATO_EMAIL = process.env.NEXT_PUBLIC_CONTATO_EMAIL || 'contato@useninho.com.br';

// Identificadores do app (batem com o app.json do Ninho-expo).
export const BUNDLE_ID_IOS = 'com.ninho.app';
export const PACKAGE_ANDROID = 'com.ninho.app';

/**
 * Links de loja.
 *
 * Pré-lançamento: deixe as duas vazias. Nesse estado o mobile cai na landing
 * (desktop também), e /get/ios · /get/android mostram a página de espera.
 * Ao publicar, preencha STORE_IOS_URL / STORE_ANDROID_URL (ou as envs).
 */
export const STORE_IOS_URL = process.env.STORE_IOS_URL || ''; // ex: https://apps.apple.com/app/id0000000000
export const STORE_ANDROID_URL =
  process.env.STORE_ANDROID_URL || ''; // ex: https://play.google.com/store/apps/details?id=com.ninho.app

// Página de espera (exibida enquanto o app não está nas lojas).
export const ESPERA_URL = process.env.ESPERA_URL || `${SITE_URL}/landing/em-breve`;

export type Device = 'ios' | 'android' | 'desktop' | 'other';

export function detectDevice(userAgent: string): Device {
  const ua = userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return 'ios';
  if (/android/.test(ua)) return 'android';
  if (/windows|macintosh|linux|cros/.test(ua) && !/mobile/.test(ua)) return 'desktop';
  return 'other';
}

/** Já existe app publicado para esse device? */
export function lojaDisponivel(device: Device): boolean {
  if (device === 'ios') return Boolean(STORE_IOS_URL);
  if (device === 'android') return Boolean(STORE_ANDROID_URL);
  return false;
}
