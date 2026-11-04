/**
 * /baixar — botão "Testar grátis" da landing e do /guia, sem precisar saber
 * a plataforma de quem clicou: Android → Google Play; qualquer outro → App
 * Store (no computador, a página da App Store abre normalmente).
 *
 * A resposta varia por User-Agent, então NÃO pode ficar em cache (ver o
 * comentário de app/abrir/route.ts sobre o que acontece quando fica).
 */
import { NextResponse } from 'next/server';
import { detectDevice, STORE_ANDROID_URL, STORE_IOS_URL } from '@/lib/config';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const device = detectDevice(request.headers.get('user-agent') || '');
  const destino =
    device === 'android' && STORE_ANDROID_URL
      ? STORE_ANDROID_URL
      : STORE_IOS_URL || new URL('/landing/em-breve', request.url).toString();

  const res = NextResponse.redirect(destino, 302);
  res.headers.set('Cache-Control', 'no-store');
  res.headers.set('Vary', 'User-Agent');
  return res;
}
