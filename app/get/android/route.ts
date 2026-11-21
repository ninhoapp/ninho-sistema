/**
 * /get/android — ponte para o Google Play.
 *
 * Tenta primeiro o scheme `market://` (abre o app da Play Store direto, sem
 * passar pelo navegador) e cai no link https depois de 2s. Mesmo motivo do
 * /get/ios: funcionar dentro do browser embutido do Instagram/Facebook.
 *
 * Com ?de=landing (só os botões da página /landing, ENG-010): grava o toque
 * como tráfego orgânico (lib/landing-clique.ts), põe o cookie ninho_click e
 * manda o Install Referrer (utm_source=landing&utm_content=<fonte>&click_id=…)
 * nos DOIS endereços, o market:// e o https, senão o referrer se perde no
 * caminho mais comum. Falha ao gravar nunca impede o redirecionamento. Sem
 * ?de=landing, igual a antes.
 *
 * Sem STORE_ANDROID_URL configurada (pré-lançamento) → página de espera.
 */
import { NextResponse } from 'next/server';
import { STORE_ANDROID_URL, PACKAGE_ANDROID } from '@/lib/config';
import { COOKIE_CLIQUE, fonteDaLanding, gravarCliqueLanding, referrerAndroidDaLanding, veioDaLanding } from '@/lib/landing-clique';

const MARKET_URL = `market://details?id=${PACKAGE_ANDROID}`;

/** Escapa para atributo HTML (o & do referrer). */
function attr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Para string JS dentro do <script>: JSON e sem "</" que feche a tag. */
function js(s: string): string {
  return JSON.stringify(s).replace(/</g, '\\u003c');
}

function pagina(market: string, https: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Baixar Ninho para Android</title>
  <meta http-equiv="refresh" content="0; url=${attr(market)}">
  <style>
    body { margin: 0; display: flex; align-items: center; justify-content: center;
           min-height: 100svh; font-family: -apple-system, sans-serif;
           background: #F1E9FB; color: #1E1F25; text-align: center; padding: 24px; }
    p { font-size: 17px; line-height: 1.5; }
    a { color: #7C5CD6; font-weight: 600; }
  </style>
</head>
<body>
  <div>
    <p>Abrindo o Google Play…</p>
    <p style="margin-top:16px;font-size:14px;color:#6B6F80">
      Não abriu? <a href="${attr(https)}">toque aqui</a>
    </p>
  </div>
  <script>
    window.location.href = ${js(market)};
    setTimeout(function() {
      window.location.href = ${js(https)};
    }, 2000);
  </script>
</body>
</html>`;
}

/** Acrescenta o Install Referrer a um endereço da loja (market:// ou https). */
function comReferrer(base: string, referrer: string): string {
  return `${base}${base.includes('?') ? '&' : '?'}referrer=${encodeURIComponent(referrer)}`;
}

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  if (!STORE_ANDROID_URL) {
    return NextResponse.redirect(new URL('/landing/em-breve?de=android', request.url));
  }

  const url = new URL(request.url);
  if (!veioDaLanding(url)) {
    return new NextResponse(pagina(MARKET_URL, STORE_ANDROID_URL), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  const fonte = fonteDaLanding(url.searchParams.get('origem'));
  const clickId = await gravarCliqueLanding(request, 'play', fonte);
  const referrer = referrerAndroidDaLanding(fonte, clickId || '');

  const res = new NextResponse(pagina(comReferrer(MARKET_URL, referrer), comReferrer(STORE_ANDROID_URL, referrer)), {
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
  });
  if (clickId) res.cookies.set('ninho_click', clickId, COOKIE_CLIQUE);
  return res;
}
