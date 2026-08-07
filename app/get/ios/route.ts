/**
 * /get/ios — ponte para a App Store.
 *
 * Existe para funcionar dentro do browser embutido do Instagram/Facebook, que
 * bloqueia <a href> direto para apps.apple.com. Como o link aponta para o nosso
 * próprio domínio, o IAB navega normalmente e o redirect acontece aqui.
 *
 * Sem STORE_IOS_URL configurada (pré-lançamento) → página de espera.
 */
import { NextResponse } from 'next/server';
import { STORE_IOS_URL } from '@/lib/config';

export async function GET(request: Request) {
  if (!STORE_IOS_URL) {
    return NextResponse.redirect(new URL('/landing/em-breve?de=ios', request.url));
  }

  return NextResponse.redirect(STORE_IOS_URL);
}
