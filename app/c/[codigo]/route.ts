/**
 * Link rastreável da consultora: www.useninho.com.br/c/<codigo>
 *
 * Igual ao /r/<código> do parceiro (app/r/[code]/route.ts), sem página de
 * apresentação:
 *  1. Acha a consultora ATIVA pelo código. Inexistente ou pausada: manda para a
 *     loja SEM gravar nada (não revela se o código existe).
 *  2. Grava o clique em painel.link_clicks com consultora_id (00112) e pega o id.
 *  3. Manda para a loja certa (lib/atribuicao.ts → destinoDoLink, origem
 *     'consultora'). iPhone no Instagram/Facebook: página que tenta abrir a
 *     loja e ensina a abrir no Safari. Safari do iPhone: página que copia
 *     https://www.useninho.com.br/c/<código>?c=<id do clique> para o app ler.
 *  4. Cookies first-party (30 dias), como rede de segurança.
 *
 * A instalação é casada depois pelo app (/api/track/match com
 * versao_atribuicao >= 2), que chama registrar_indicacao_consultora(código,
 * 'link', click_id). A resposta varia por aparelho: nunca em cache.
 */
import { NextRequest, NextResponse } from 'next/server';
import { detectDevice, LANDING_URL, STORE_ANDROID_URL, STORE_IOS_URL } from '@/lib/config';
import { logClickConsultora } from '@/lib/painel/store';
import { consultoraAtivaPorCodigo } from '@/lib/consultoras';
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

/** Loja do aparelho, sem código nem clique (link indisponível). */
function lojaSemRastreio(ua: string): string {
  const device = detectDevice(ua);
  if (device === 'ios' && STORE_IOS_URL) return STORE_IOS_URL;
  if (device === 'android' && STORE_ANDROID_URL) return STORE_ANDROID_URL;
  return LANDING_URL;
}

export async function GET(req: NextRequest, { params }: { params: { codigo: string } }) {
  const ua = req.headers.get('user-agent') || '';
  let c: Awaited<ReturnType<typeof consultoraAtivaPorCodigo>> = null;
  try {
    c = await consultoraAtivaPorCodigo(decodeURIComponent(params.codigo || ''));
  } catch (e) {
    console.error('[c] consulta falhou:', e instanceof Error ? e.message : e);
  }
  if (!c || !c.codigo) {
    return semCache(NextResponse.redirect(lojaSemRastreio(ua), 302));
  }

  const ip = ipDe(req.headers);
  const device = detectDevice(ua);
  const codigo = c.codigo;
  const previa = destinoDoLink(codigo, device, '', 'consultora');
  let clickId = '';
  try {
    clickId =
      (await logClickConsultora({
        consultora_id: c.id,
        promo_code: codigo,
        device,
        landed: previa.landed,
        visitor_hash: ip ? visitorHash(ip, ua) : null,
        ip_hash: ipHash(ip),
        referrer: dominio(req.headers.get('referer')),
        user_agent: ua.slice(0, 500),
      })) || '';
  } catch (e) {
    console.error('[c] clique não gravado:', e instanceof Error ? e.message : e);
  }
  const { url } = destinoDoLink(codigo, device, clickId, 'consultora');
  console.log('[c] clique', JSON.stringify({ codigo, click: clickId, ip: (ipHash(ip) || '').slice(0, 8), familia: familiaDoIp(ip), device }));

  const copiar = linkParaCopiar(codigo, clickId, 'c');
  const html = (corpo: string) => new NextResponse(corpo, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  const res =
    device === 'ios' && ehNavegadorEmbutido(ua)
      ? html(paginaNavegadorEmbutido(url, copiar))
      : device === 'ios' && ehSafariIphone(ua)
        ? html(paginaSafari(url, copiar))
        : NextResponse.redirect(url, 302);

  const cookie = { httpOnly: false, sameSite: 'lax' as const, path: '/', maxAge: 60 * 60 * 24 * 30 };
  res.cookies.set('ninho_consultora', codigo, cookie);
  if (clickId) res.cookies.set('ninho_click', clickId, cookie);
  return semCache(res);
}
