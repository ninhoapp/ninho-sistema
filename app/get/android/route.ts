/**
 * /get/android — ponte para o Google Play.
 *
 * Tenta primeiro o scheme `market://` (abre o app da Play Store direto, sem
 * passar pelo navegador) e cai no link https depois de 2s. Mesmo motivo do
 * /get/ios: funcionar dentro do browser embutido do Instagram/Facebook.
 *
 * Sem STORE_ANDROID_URL configurada (pré-lançamento) → página de espera.
 */
import { NextResponse } from 'next/server';
import { STORE_ANDROID_URL, PACKAGE_ANDROID } from '@/lib/config';

const MARKET_URL = `market://details?id=${PACKAGE_ANDROID}`;

export async function GET(request: Request) {
  if (!STORE_ANDROID_URL) {
    return NextResponse.redirect(new URL('/landing/em-breve?de=android', request.url));
  }

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Baixar Ninho para Android</title>
  <meta http-equiv="refresh" content="0; url=${MARKET_URL}">
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
      Não abriu? <a href="${STORE_ANDROID_URL}">toque aqui</a>
    </p>
  </div>
  <script>
    window.location.href = '${MARKET_URL}';
    setTimeout(function() {
      window.location.href = '${STORE_ANDROID_URL}';
    }, 2000);
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
