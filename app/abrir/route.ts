/**
 * /abrir — ponte dos e-mails para DENTRO do app.
 *
 * Irmã de /get/ios e /get/android, com um alvo diferente: aquelas levam pra
 * LOJA (quem ainda não tem o app), esta ABRE o app de quem já tem.
 *
 * POR QUE EXISTE: o botão dos e-mails transacionais não pode apontar
 * `ninho://` direto — Gmail (web e app) e a maioria dos clientes bloqueiam
 * ou removem link de scheme customizado, e o botão não faria nada. Um link
 * https abre no navegador, e DALI o scheme funciona nas duas plataformas,
 * sem exigir Universal Links (iOS) / App Links (Android) — que são
 * configuração nativa e só valeriam a partir de um build novo.
 *
 * `?to=` é a rota do expo-router SEM os grupos: `/(app)/baby-profile` vira
 * `baby-profile`. Allowlist em vez de sanitização — são poucos destinos
 * conhecidos, e assim ninguém monta um link do domínio do Ninho que joga a
 * pessoa em outro esquema.
 *
 * Quem manda estes links: supabase/functions/enviar-nudges (urlAbrirApp)
 * no repositório Ninho-expo.
 */
import { NextResponse } from 'next/server';

import { STORE_ANDROID_URL, STORE_IOS_URL, LANDING_URL, detectDevice } from '@/lib/config';

const SCHEME = 'ninho://';

/** Destinos aceitos em `?to=`. Vazio = abre o app onde ele abrir. */
const ROTAS = new Set(['', 'baby-profile', 'settings/subscription-plans']);

export async function GET(request: Request) {
  const to = new URL(request.url).searchParams.get('to') ?? '';
  const destino = ROTAS.has(to) ? to : '';
  const deep = SCHEME + destino;

  const device = detectDevice(request.headers.get('user-agent') ?? '');
  const loja =
    device === 'ios' ? STORE_IOS_URL : device === 'android' ? STORE_ANDROID_URL : LANDING_URL;

  // No desktop nem tenta o scheme: não leva a lugar nenhum e ainda dispara
  // um diálogo do navegador. Vai direto pra landing.
  if (device === 'desktop') {
    return NextResponse.redirect(LANDING_URL);
  }

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="noindex">
  <title>Abrindo o Ninho…</title>
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
    <p>Abrindo o Ninho…</p>
    <p style="margin-top:16px;font-size:14px;color:#6B6F80">
      Não abriu? <a href="${deep}">toque aqui</a>
    </p>
  </div>
  <script>
    // O timer da loja é cancelado quando o app ASSUME e o navegador sai de
    // cena — senão a loja abriria por cima do app que acabou de abrir.
    var desistiu = false;
    function cancelar() { desistiu = true; }
    window.addEventListener('pagehide', cancelar);
    window.addEventListener('blur', cancelar);
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) cancelar();
    });

    window.location.href = '${deep}';
    setTimeout(function () {
      if (!desistiu && !document.hidden) window.location.href = '${loja}';
    }, 2000);
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      'X-Robots-Tag': 'noindex',
    },
  });
}
