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
import { destinoDoLink, ehNavegadorEmbutido, ehSafariIphone, familiaDoIp, ipDe, ipHash, linkParaCopiar, visitorHash } from '@/lib/atribuicao';
import { paginaNavegadorEmbutido, paginaSafari } from '@/lib/atribuicao-paginas';

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
  // Diagnóstico (a Vercel guarda 1 h): par do "[track/match]" do app.
  console.log(
    '[r] clique',
    JSON.stringify({ codigo, click: clickId, ip: (ipHash(ip) || '').slice(0, 8), familia: familiaDoIp(ip), device }),
  );

  const copiar = linkParaCopiar(codigo, clickId);
  const html = (corpo: string) =>
    new NextResponse(corpo, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  const res =
    device === 'ios' && ehNavegadorEmbutido(ua)
      ? html(paginaNavegadorEmbutido(url, copiar))
      : device === 'ios' && ehSafariIphone(ua)
        ? html(paginaSafari(url, copiar))
        : NextResponse.redirect(url, 302);

  const cookie = { httpOnly: false, sameSite: 'lax' as const, path: '/', maxAge: 60 * 60 * 24 * 30 };
  res.cookies.set('ninho_ref', codigo, cookie);
  if (clickId) res.cookies.set('ninho_click', clickId, cookie);
  return semCache(res);
}
