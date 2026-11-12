/**
 * Links rastreáveis da consultora (00112 e 00144 do app):
 *  - divulgação: /indica/<código> e o antigo /c/<código> → direto para a loja.
 *  - consultoria: /consultoria/<código> → página com a foto e o nome dela,
 *    "Baixar o Ninho grátis" e "Já tenho o Ninho". O clique fica marcado
 *    (`vinculo`) e, depois do cadastro do bebê, o app pergunta se a família
 *    aprova compartilhar a rotina com ela.
 *
 * Os dois gravam o clique em painel.link_clicks com consultora_id, e a
 * instalação é casada depois pelo app (/api/track/match). A comissão é a
 * mesma (método 'link'). Server-only.
 */
import { NextRequest, NextResponse } from 'next/server';
import { detectDevice, LANDING_URL, STORE_ANDROID_URL, STORE_IOS_URL } from '@/lib/config';
import { logClickConsultora } from '@/lib/painel/store';
import { consultoraAtivaPorCodigo } from '@/lib/consultoras';
import { destinoDoLink, ehNavegadorEmbutido, ehSafariIphone, familiaDoIp, ipDe, ipHash, linkParaCopiar, visitorHash } from '@/lib/atribuicao';
import { paginaNavegadorEmbutido, paginaSafari } from '@/lib/atribuicao-paginas';

/**
 * Link da CONSULTORIA liberado só para estas consultoras (dono, 12/11/2026).
 * A pergunta "Aprovar / Recusar" depende de uma versão nova do app; até ela
 * estar na loja, só a conta de teste do dono usa. Para as outras, o
 * /consultoria/<código> funciona igual ao de divulgação e o painel não mostra
 * o link. Para liberar para todas: trocar por `() => true`.
 */
const CONSULTORIA_LIBERADA_PARA = new Set(['joana.oliveira85@yahoo.com.br']);

export function consultoriaLiberada(emailLiberado: string | null | undefined): boolean {
  return CONSULTORIA_LIBERADA_PARA.has((emailLiberado ?? '').trim().toLowerCase());
}

export function semCache(res: NextResponse): NextResponse {
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
export function lojaSemRastreio(ua: string): string {
  const device = detectDevice(ua);
  if (device === 'ios' && STORE_IOS_URL) return STORE_IOS_URL;
  if (device === 'android' && STORE_ANDROID_URL) return STORE_ANDROID_URL;
  return LANDING_URL;
}

export type CliqueConsultora = {
  consultora: NonNullable<Awaited<ReturnType<typeof consultoraAtivaPorCodigo>>> & { codigo: string };
  device: ReturnType<typeof detectDevice>;
  clickId: string;
  /** Loja certa, com o código (e o clique, no Android). */
  destino: string;
  /** /c/<código>?c=<clique>: o que a página copia para o app ler no iPhone. */
  copiar: string;
  /** O clique ficou marcado como link da consultoria (pedido E liberado). */
  vinculo: boolean;
};

/**
 * Acha a consultora ATIVA pelo código e grava o clique. null = código
 * inexistente ou consultora pausada (quem chama manda para a loja sem gravar
 * nada, para não revelar se o código existe).
 */
export async function registrarCliqueConsultora(
  req: NextRequest,
  codigoBruto: string,
  opcoes: { vinculo: boolean; rotulo: string },
): Promise<CliqueConsultora | null> {
  const ua = req.headers.get('user-agent') || '';
  let c: Awaited<ReturnType<typeof consultoraAtivaPorCodigo>> = null;
  try {
    c = await consultoraAtivaPorCodigo(decodeURIComponent(codigoBruto || ''));
  } catch (e) {
    console.error(`[${opcoes.rotulo}] consulta falhou:`, e instanceof Error ? e.message : e);
  }
  if (!c || !c.codigo) return null;
  const vinculo = opcoes.vinculo && consultoriaLiberada(c.email_liberado);

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
        vinculo,
      })) || '';
  } catch (e) {
    console.error(`[${opcoes.rotulo}] clique não gravado:`, e instanceof Error ? e.message : e);
  }
  const { url } = destinoDoLink(codigo, device, clickId, 'consultora');
  console.log(
    `[${opcoes.rotulo}] clique`,
    JSON.stringify({ codigo, click: clickId, vinculo, ip: (ipHash(ip) || '').slice(0, 8), familia: familiaDoIp(ip), device }),
  );
  return {
    consultora: { ...c, codigo },
    device,
    clickId,
    destino: url,
    copiar: linkParaCopiar(codigo, clickId, 'c'),
    vinculo,
  };
}

/** Cookies first-party (30 dias), como rede de segurança. */
export function gravarCookies(res: NextResponse, codigo: string, clickId: string): void {
  const cookie = { httpOnly: false, sameSite: 'lax' as const, path: '/', maxAge: 60 * 60 * 24 * 30 };
  res.cookies.set('ninho_consultora', codigo, cookie);
  if (clickId) res.cookies.set('ninho_click', clickId, cookie);
}

/**
 * Link de divulgação (/c/<código> e /indica/<código>): grava o clique e vai
 * para a loja. iPhone no Instagram/Facebook: página que ensina a abrir no
 * Safari. Safari do iPhone: página que copia /c/<código>?c=<clique> para o app
 * ler. A resposta varia por aparelho: nunca em cache.
 */
export async function linkDeDivulgacao(req: NextRequest, codigoBruto: string, rotulo: string): Promise<NextResponse> {
  const ua = req.headers.get('user-agent') || '';
  const clique = await registrarCliqueConsultora(req, codigoBruto, { vinculo: false, rotulo });
  if (!clique) return semCache(NextResponse.redirect(lojaSemRastreio(ua), 302));
  return respostaDeDivulgacao(req, clique);
}

/** Resposta do link de divulgação para um clique já gravado. */
export function respostaDeDivulgacao(req: NextRequest, clique: CliqueConsultora): NextResponse {
  const ua = req.headers.get('user-agent') || '';
  const { device, destino, copiar } = clique;
  const html = (corpo: string) => new NextResponse(corpo, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  const res =
    device === 'ios' && ehNavegadorEmbutido(ua)
      ? html(paginaNavegadorEmbutido(destino, copiar))
      : device === 'ios' && ehSafariIphone(ua)
        ? html(paginaSafari(destino, copiar))
        : NextResponse.redirect(destino, 302);
  gravarCookies(res, clique.consultora.codigo, clique.clickId);
  return semCache(res);
}
