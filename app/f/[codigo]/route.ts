/**
 * Convite de cuidador por link: www.useninho.com.br/f/<código> (12/11/2026,
 * migration 00142 do app, mural item 120).
 *
 * Quem convida manda este link pelo WhatsApp. A página:
 *  - mostra o código grande (para digitar no app, se precisar);
 *  - grava o toque (IP) em painel.link_clicks com landed='convite': no
 *    cadastro, o app pergunta a /api/convite/match e o convite abre sozinho,
 *    sem "Permitir colar" (dono, 12/11/2026: nada de colar);
 *  - "Baixar o Ninho": vai para a loja certa;
 *  - "Já tenho o Ninho": abre ninho://convite/<código> direto no app.
 *
 * Não consulta o banco: a página não mostra nome de bebê nem de ninguém (o
 * link pode ser repassado). Quem vê o convite e aceita é o app, logado.
 * A resposta varia por aparelho: nunca em cache.
 */
import { NextRequest, NextResponse } from 'next/server';
import { detectDevice, LANDING_URL, STORE_ANDROID_URL, STORE_IOS_URL } from '@/lib/config';
import { escaparHtml } from '@/lib/atribuicao-paginas';
import { geoDe, ipDe, ipHash, visitorHash } from '@/lib/atribuicao';
import { painelDb } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// Mesmo alfabeto do banco (_gerar_codigo_convite): sem I, L, O, 0, 1.
const CODIGO_RE = /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/;

function loja(ua: string): string {
  const device = detectDevice(ua);
  if (device === 'android' && STORE_ANDROID_URL) return STORE_ANDROID_URL;
  if (STORE_IOS_URL) return STORE_IOS_URL;
  return LANDING_URL;
}

function pagina(codigo: string, destino: string): string {
  const app = `ninho://convite/${codigo}`;
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="robots" content="noindex">
<title>Convite para o Ninho</title>
<meta property="og:title" content="Você foi convidado(a) para o Ninho">
<meta property="og:description" content="Cuide do bebê junto: todo mundo registra, todo mundo vê.">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:#F5F1FB;color:#1E1F25;min-height:100svh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px 20px;text-align:center}
.bola{width:84px;height:84px;border-radius:50%;background:linear-gradient(135deg,#B9A3EE,#7C5CD6);display:flex;align-items:center;justify-content:center;color:#fff;font-size:38px;margin-bottom:20px}
h1{font-size:23px;line-height:1.25;margin-bottom:10px;letter-spacing:-.3px}
.sub{font-size:15px;line-height:1.55;color:#6B6F80;max-width:340px;margin-bottom:24px}
.card{background:#fff;border-radius:24px;padding:22px;width:100%;max-width:360px;box-shadow:0 8px 24px rgba(60,30,120,.10);text-align:left}
.step{display:flex;gap:12px;margin-bottom:16px;font-size:15px;line-height:1.45}
.num{flex-shrink:0;width:28px;height:28px;border-radius:50%;background:#EDE4FB;color:#7C5CD6;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:13px}
.codigo{margin:6px 0 18px;background:#EDE4FB;border-radius:14px;padding:12px;text-align:center;font-size:28px;font-weight:800;letter-spacing:6px;color:#7C5CD6}
.btn{display:block;width:100%;text-align:center;font-weight:800;font-size:16px;padding:16px;border-radius:999px;text-decoration:none;margin-top:10px}
.prim{background:#7C5CD6;color:#fff}
.sec{border:1.5px solid #EDE4FB;color:#7C5CD6}
</style>
</head>
<body>
<div class="bola">👪</div>
<h1>Você foi convidado(a) para o Ninho</h1>
<p class="sub">Para cuidar do bebê junto: todo mundo registra, todo mundo vê.</p>
<div class="card">
  <div class="step"><div class="num">1</div><div>Baixe o Ninho e crie sua conta, com qualquer e-mail.</div></div>
  <div class="step"><div class="num">2</div><div>O convite abre sozinho no cadastro. Se não abrir, toque em "Recebeu um convite da família?" e use o código:</div></div>
  <div class="codigo">${escaparHtml(codigo)}</div>
  <a id="baixar" class="btn prim" href="${escaparHtml(destino)}">Baixar o Ninho</a>
  <a class="btn sec" href="${escaparHtml(app)}">Já tenho o Ninho</a>
</div>
</body>
</html>`;
}

export async function GET(request: NextRequest, { params }: { params: { codigo: string } }) {
  const ua = request.headers.get('user-agent') || '';
  let codigo = '';
  try {
    codigo = decodeURIComponent(params.codigo || '').trim().toUpperCase();
  } catch {
    codigo = '';
  }
  const destino = loja(ua);

  if (CODIGO_RE.test(codigo)) {
    // Só o hash do IP (nunca o IP). Falhar aqui não impede a página.
    try {
      const ip = ipDe(request.headers);
      await painelDb()
        .from('link_clicks')
        .insert({
          promo_code: codigo,
          device: detectDevice(ua),
          landed: 'convite',
          visitor_hash: ip ? visitorHash(ip, ua) : null,
          ip_hash: ipHash(ip),
          referrer: null,
          user_agent: ua.slice(0, 500),
          ...geoDe(request.headers),
          perfil_id: null,
          primeiro_do_visitante: true,
        });
    } catch (e) {
      console.error('[f] toque não gravado:', e instanceof Error ? e.message : e);
    }
  }
  const res = CODIGO_RE.test(codigo)
    ? new NextResponse(pagina(codigo, destino), { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
    : NextResponse.redirect(destino, 302);
  res.headers.set('Cache-Control', 'no-store');
  res.headers.set('Vary', 'User-Agent');
  return res;
}
