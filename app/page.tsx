/**
 * Domínio raiz — smart link por dispositivo.
 * iOS → App Store · Android → Play Store · Desktop/outro → landing.
 *
 * Enquanto as lojas não estiverem preenchidas em lib/config.ts (pré-lançamento),
 * TODO mundo cai em /landing — inclusive mobile.
 */
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { detectDevice, STORE_IOS_URL, STORE_ANDROID_URL } from '@/lib/config';

export const dynamic = 'force-dynamic';

export default function Home() {
  const ua = headers().get('user-agent') || '';
  const device = detectDevice(ua);

  if (device === 'ios' && STORE_IOS_URL) redirect(STORE_IOS_URL);
  if (device === 'android' && STORE_ANDROID_URL) redirect(STORE_ANDROID_URL);

  redirect('/landing');
}
