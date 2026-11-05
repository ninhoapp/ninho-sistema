/**
 * Link rastreável do parceiro: www.useninho.com.br/r/<codigo>
 *
 *  1. Acha o parceiro ativo pelo código (inválido → landing, sem registrar).
 *  2. Grava o clique (hash do IP, aparelho, visitante único) e pega o id.
 *  3. Manda para a loja certa (lib/atribuicao.ts → destinoDoLink).
 *     Dentro do navegador do Instagram/Facebook/TikTok no iPhone, a App Store
 *     costuma ser bloqueada: mostra uma página que tenta abrir sozinha e,
 *     se não abrir, ensina a abrir no Safari (lição do SOMI, /get/ios de lá).
 *  4. Cookie first-party com o código (30 dias), como rede de segurança.
 *
 * A instalação é casada com o clique depois, pelo app (/api/track/match).
 * A resposta varia por aparelho e grava clique: nunca pode ficar em cache.
 */
import { NextRequest, NextResponse } from 'next/server';
import { detectDevice, LANDING_URL } from '@/lib/config';
import { findParceiroPorCodigo, logClick } from '@/lib/painel/store';
import { destinoDoLink, ehNavegadorEmbutido, ipDe, ipHash, visitorHash } from '@/lib/atribuicao';

export const dynamic = 'force-dynamic';

function semCache(res: NextResponse): NextResponse {
  res.headers.set('Cache-Control', 'no-store');
  res.headers.set('Vary', 'User-Agent');
  return res;
}

function dominio(url: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.slice(0, 120) || null;
  } catch {
    return null;
  }
}

function escaparHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

function paginaNavegadorEmbutido(destino: string): string {
  const url = escaparHtml(destino);
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="robots" content="noindex">
<title>Baixar o Ninho</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:#7C5CD6;color:#fff;min-height:100svh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px 24px;text-align:center}
h1{font-size:22px;line-height:1.3;margin-bottom:12px}
.sub{font-size:15px;line-height:1.6;opacity:.9;margin-bottom:28px}
.btn{display:block;width:100%;max-width:340px;background:#fff;color:#4B3596;font-weight:700;font-size:16px;padding:15px;border-radius:999px;text-decoration:none;margin-bottom:24px}
.card{background:rgba(255,255,255,.14);border:1.5px solid rgba(255,255,255,.28);border-radius:20px;padding:22px;width:100%;max-width:340px;text-align:left}
.step{display:flex;gap:14px;margin-bottom:16px;font-size:15px;line-height:1.5}
.step:last-child{margin-bottom:0}
.num{flex-shrink:0;width:28px;height:28px;border-radius:50%;background:#fff;color:#4B3596;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px}
.seta{position:fixed;top:max(12px,env(safe-area-inset-top));right:16px;font-size:12px;font-weight:600;animation:b 1.2s ease-in-out infinite}
@keyframes b{50%{transform:translateY(-6px)}}
</style>
</head>
<body>
<div class="seta">↑ toque aqui</div>
<h1>Baixe o Ninho na App Store</h1>
<p class="sub">Toque no botão. Se a loja não abrir, é o Instagram bloqueando: abra pelo Safari.</p>
<a class="btn" href="${url}">Abrir a App Store</a>
<div class="card">
<div class="step"><span class="num">1</span><span>Toque nos <strong>três pontinhos ···</strong> no canto de cima</span></div>
<div class="step"><span class="num">2</span><span>Escolha <strong>"Abrir no navegador externo"</strong> ou <strong>"Abrir no Safari"</strong></span></div>
<div class="step"><span class="num">3</span><span>A App Store abre sozinha</span></div>
</div>
<script>setTimeout(function(){location.href=${JSON.stringify(destino)}},300)</script>
</body>
</html>`;
}

export async function GET(req: NextRequest, { params }: { params: { code: string } }) {
  const parceiro = await findParceiroPorCodigo(params.code);
  if (!parceiro || !parceiro.promo_code) {
    return semCache(NextResponse.redirect(LANDING_URL, 302));
  }

  const ua = req.headers.get('user-agent') || '';
  const ip = ipDe(req.headers);
  const device = detectDevice(ua);
  const codigo = parceiro.promo_code;

  // O destino não depende do click_id para o iPhone; para o Android, sim
  // (vai no referrer). Grava o clique antes para ter o id.
  const previa = destinoDoLink(codigo, device, '');
  const clickId =
    (await logClick({
      perfil_id: parceiro.id,
      promo_code: codigo,
      device,
      landed: previa.landed,
      visitor_hash: ip ? visitorHash(ip, ua) : null,
      ip_hash: ipHash(ip),
      // Só o domínio: a URL inteira pode carregar identificador de quem clicou.
      referrer: dominio(req.headers.get('referer')),
      user_agent: ua.slice(0, 500),
    })) || '';
  const { url } = destinoDoLink(codigo, device, clickId);

  const res =
    device === 'ios' && ehNavegadorEmbutido(ua)
      ? new NextResponse(paginaNavegadorEmbutido(url), {
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        })
      : NextResponse.redirect(url, 302);

  const cookie = { httpOnly: false, sameSite: 'lax' as const, path: '/', maxAge: 60 * 60 * 24 * 30 };
  res.cookies.set('ninho_ref', codigo, cookie);
  if (clickId) res.cookies.set('ninho_click', clickId, cookie);
  return semCache(res);
}
