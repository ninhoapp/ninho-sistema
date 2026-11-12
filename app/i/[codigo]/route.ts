/**
 * Link do "Indique uma amiga": www.useninho.com.br/i/<codigo>
 *
 * Igual ao /c/<código> da consultora (app/c/[codigo]/route.ts):
 *  1. Acha a conta dona do código (indicacao_amiga_codigos, migration 00130).
 *     Código inexistente: manda para a loja SEM gravar nada.
 *  2. Grava o clique em painel.link_clicks com amiga_profile_id e pega o id.
 *  3. Manda para a loja certa. iPhone no Instagram/WhatsApp: página que tenta
 *     abrir a loja; Safari do iPhone: página que copia
 *     https://www.useninho.com.br/i/<código>?c=<id do clique> para o app ler.
 *
 * A instalação é casada depois pelo app (/api/track/match com
 * versao_atribuicao >= 3), que chama registrar_indicacao_amiga(código, click_id).
 * A resposta varia por aparelho: nunca em cache.
 */
import { NextRequest, NextResponse } from 'next/server';
import { detectDevice, LANDING_URL, STORE_ANDROID_URL, STORE_IOS_URL } from '@/lib/config';
import { appDb, painelDb } from '@/lib/supabase/server';
import { destinoDoLink, ehNavegadorEmbutido, familiaDoIp, geoDe, ipDe, ipHash, linkParaCopiar, visitorHash } from '@/lib/atribuicao';
import { paginaNavegadorEmbutido } from '@/lib/atribuicao-paginas';

export const dynamic = 'force-dynamic';

const CODIGO_RE = /^[A-Z0-9]{6}$/;

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

/** Grava o clique (painel.link_clicks, coluna amiga_profile_id da 00130) e devolve o id. */
async function logClickAmiga(input: {
  amiga_profile_id: string;
  promo_code: string;
  device: string;
  landed: string;
  visitor_hash: string | null;
  ip_hash: string | null;
  referrer: string | null;
  user_agent: string;
  geo_pais?: string | null;
  geo_regiao?: string | null;
  geo_cidade?: string | null;
}): Promise<string | null> {
  const sb = painelDb();
  let primeiro = true;
  if (input.visitor_hash) {
    const { data: anterior } = await sb
      .from('link_clicks')
      .select('id')
      .eq('amiga_profile_id', input.amiga_profile_id)
      .eq('visitor_hash', input.visitor_hash)
      .limit(1);
    primeiro = !anterior || anterior.length === 0;
  }
  const { data, error } = await sb
    .from('link_clicks')
    .insert({ ...input, perfil_id: null, primeiro_do_visitante: primeiro })
    .select('id')
    .single();
  if (error) console.error('[i] link_clicks falhou:', error.message);
  return (data as { id: string } | null)?.id ?? null;
}

async function donaDoCodigo(codigo: string): Promise<string | null> {
  if (!CODIGO_RE.test(codigo)) return null;
  const { data, error } = await appDb().from('indicacao_amiga_codigos').select('profile_id').eq('codigo', codigo).limit(1).maybeSingle();
  if (error) {
    // Sem a 00130 a tabela não existe: o link só leva à loja.
    console.warn('[i] consulta falhou:', error.message);
    return null;
  }
  return (data as { profile_id: string } | null)?.profile_id ?? null;
}

export async function GET(req: NextRequest, { params }: { params: { codigo: string } }) {
  const ua = req.headers.get('user-agent') || '';
  let codigo = '';
  try {
    codigo = decodeURIComponent(params.codigo || '').trim().toUpperCase();
  } catch {
    codigo = '';
  }
  let dona: string | null = null;
  try {
    dona = await donaDoCodigo(codigo);
  } catch (e) {
    console.error('[i] consulta falhou:', e instanceof Error ? e.message : e);
  }
  if (!dona) {
    return semCache(NextResponse.redirect(lojaSemRastreio(ua), 302));
  }

  const ip = ipDe(req.headers);
  const device = detectDevice(ua);
  const previa = destinoDoLink(codigo, device, '', 'amiga');
  let clickId = '';
  try {
    clickId =
      (await logClickAmiga({
        amiga_profile_id: dona,
        promo_code: codigo,
        device,
        landed: previa.landed,
        visitor_hash: ip ? visitorHash(ip, ua) : null,
        ip_hash: ipHash(ip),
        referrer: dominio(req.headers.get('referer')),
        user_agent: ua.slice(0, 500),
        ...geoDe(req.headers),
      })) || '';
  } catch (e) {
    console.error('[i] clique não gravado:', e instanceof Error ? e.message : e);
  }
  const { url } = destinoDoLink(codigo, device, clickId, 'amiga');
  console.log('[i] clique', JSON.stringify({ codigo, click: clickId, ip: (ipHash(ip) || '').slice(0, 8), familia: familiaDoIp(ip), device }));

  const copiar = linkParaCopiar(codigo, clickId, 'i');
  const html = (corpo: string) => new NextResponse(corpo, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  const res =
    device === 'ios' && ehNavegadorEmbutido(ua)
      ? html(paginaNavegadorEmbutido(url, copiar))
      : NextResponse.redirect(url, 302);

  const cookie = { httpOnly: false, sameSite: 'lax' as const, path: '/', maxAge: 60 * 60 * 24 * 30 };
  res.cookies.set('ninho_amiga', codigo, cookie);
  if (clickId) res.cookies.set('ninho_click', clickId, cookie);
  return semCache(res);
}
