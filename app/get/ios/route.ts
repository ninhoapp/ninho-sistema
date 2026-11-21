/**
 * /get/ios — ponte para a App Store.
 *
 * Existe para funcionar dentro do browser embutido do Instagram/Facebook, que
 * bloqueia <a href> direto para apps.apple.com. Como o link aponta para o nosso
 * próprio domínio, o IAB navega normalmente e o redirect acontece aqui.
 *
 * Com ?de=landing (só os botões da página /landing, ENG-010): grava o toque
 * como tráfego orgânico (lib/landing-clique.ts), põe o cookie ninho_click e,
 * com STORE_IOS_PT, leva ct=landing (ou landing_tiktok com &origem=tiktok)
 * para a App Store Connect mostrar os downloads da landing em Campanhas.
 * Falha ao gravar nunca impede o redirecionamento. Sem ?de=landing, igual a
 * antes.
 *
 * Sem STORE_IOS_URL configurada (pré-lançamento) → página de espera.
 */
import { NextResponse } from 'next/server';
import { STORE_IOS_URL } from '@/lib/config';
import { campanhaIosDaLanding, COOKIE_CLIQUE, fonteDaLanding, gravarCliqueLanding, veioDaLanding } from '@/lib/landing-clique';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  if (!STORE_IOS_URL) {
    return NextResponse.redirect(new URL('/landing/em-breve?de=ios', request.url));
  }

  const url = new URL(request.url);
  if (!veioDaLanding(url)) {
    return NextResponse.redirect(STORE_IOS_URL);
  }

  const fonte = fonteDaLanding(url.searchParams.get('origem'));
  const clickId = await gravarCliqueLanding(request, 'apple', fonte);

  let destino = STORE_IOS_URL;
  const pt = (process.env.STORE_IOS_PT || '').trim();
  if (pt) {
    try {
      const u = new URL(STORE_IOS_URL);
      u.searchParams.set('pt', pt);
      u.searchParams.set('ct', campanhaIosDaLanding(fonte));
      u.searchParams.set('mt', '8');
      destino = u.toString();
    } catch {
      destino = STORE_IOS_URL;
    }
  }

  const res = NextResponse.redirect(destino, 302);
  if (clickId) res.cookies.set('ninho_click', clickId, COOKIE_CLIQUE);
  // Cada toque é um clique: nunca em cache.
  res.headers.set('Cache-Control', 'no-store');
  return res;
}
