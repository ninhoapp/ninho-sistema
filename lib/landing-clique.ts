/**
 * Ninho · Clique em "Baixar" na página /landing (tráfego orgânico, ENG-010,
 * aprovado pelo dono em 21/11/2026). Server-only.
 *
 * O dono só usa useninho.com.br/landing no orgânico (bio, stories, reels,
 * posts do Facebook). O TikTok usa /landing?origem=tiktok. Então todo toque
 * em Baixar que sai da /landing é "Tráfego orgânico" ou "TikTok (orgânico)".
 *
 * Contrato (não mudar um lado sem o outro):
 *  - clique em painel.link_clicks com promo_code = 'LANDING', landed = apple
 *    ou play, perfil_id/consultora_id/amiga_profile_id nulos e landing_fonte
 *    (00194) = 'tiktok' | 'organico';
 *  - só grava com ?de=landing (os botões da página /landing). Os mesmos
 *    botões no topo, no rodapé, no guia e no suporte não levam o parâmetro;
 *  - o casamento é em /api/track/match (tipo 'landing', menor prioridade) e o
 *    app grava na conta com registrar_origem_landing(click_id).
 */
import { detectDevice } from '@/lib/config';
import { painelDb } from '@/lib/supabase/server';
import { geoDe, ipDe, ipHash, visitorHash } from '@/lib/atribuicao';

export const CODIGO_LANDING = 'LANDING';

/** Fontes aceitas no ?origem= da /landing. Lista fechada: o resto vira 'organico'. */
export type FonteLanding = 'tiktok' | 'organico';

export function fonteDaLanding(v: unknown): FonteLanding {
  const s = (Array.isArray(v) ? v[0] : v);
  return typeof s === 'string' && s.trim().toLowerCase() === 'tiktok' ? 'tiktok' : 'organico';
}

/** O toque veio de um botão da página /landing? */
export function veioDaLanding(url: URL): boolean {
  return url.searchParams.get('de') === 'landing';
}

/** Campanha da App Store (ct): landing ou landing_tiktok. */
export function campanhaIosDaLanding(fonte: FonteLanding): string {
  return fonte === 'tiktok' ? 'landing_tiktok' : 'landing';
}

/** Install Referrer do Google Play. Sem utm_campaign de propósito: não é código de parceiro. */
export function referrerAndroidDaLanding(fonte: FonteLanding, clickId: string): string {
  const p = new URLSearchParams({ utm_source: 'landing', utm_content: fonte });
  if (clickId) p.set('click_id', clickId);
  return p.toString();
}

const ROBO_RE = /bot|crawl|spider|slurp|facebookexternalhit|bingpreview|headless|lighthouse/i;
function ehRobo(ua: string): boolean {
  return !ua || ROBO_RE.test(ua);
}

function dominio(url: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.slice(0, 120) || null;
  } catch {
    return null;
  }
}

/**
 * Grava o toque e devolve o id (= click_id). Nunca lança: falha vira null e
 * o redirecionamento para a loja segue igual.
 */
export async function gravarCliqueLanding(req: Request, landed: 'apple' | 'play', fonte: FonteLanding): Promise<string | null> {
  try {
    const ua = req.headers.get('user-agent') || '';
    // Robô de busca segue o link da página pública: não é toque de gente
    // (número real ou vazio, regra do painel). Redireciona igual, sem gravar.
    if (ehRobo(ua)) return null;
    const ip = ipDe(req.headers);
    const vh = ip ? visitorHash(ip, ua) : null;
    const sb = painelDb();
    let primeiro = true;
    if (vh) {
      const { data: anterior, error: erroBusca } = await sb
        .from('link_clicks')
        .select('id')
        .eq('promo_code', CODIGO_LANDING)
        .eq('visitor_hash', vh)
        .limit(1);
      if (erroBusca) console.error('[landing] link_clicks (visitante) falhou:', erroBusca.message);
      primeiro = !anterior || anterior.length === 0;
    }
    const linha = {
      perfil_id: null,
      consultora_id: null,
      amiga_profile_id: null,
      promo_code: CODIGO_LANDING,
      device: detectDevice(ua),
      landed,
      visitor_hash: vh,
      ip_hash: ipHash(ip),
      referrer: dominio(req.headers.get('referer')),
      user_agent: ua.slice(0, 500),
      primeiro_do_visitante: primeiro,
      ...geoDe(req.headers),
    };
    const gravar = (comFonte: boolean) =>
      sb
        .from('link_clicks')
        .insert(comFonte ? ({ ...linha, landing_fonte: fonte } as Record<string, unknown>) : (linha as Record<string, unknown>))
        .select('id')
        .single();
    let { data, error } = await gravar(true);
    // Sem a 00194 a coluna landing_fonte não existe: grava sem ela.
    if (error && /landing_fonte/i.test(error.message)) {
      console.warn('[landing] link_clicks sem a coluna landing_fonte (00194): gravando sem ela');
      ({ data, error } = await gravar(false));
    }
    if (error) {
      console.error('[landing] link_clicks falhou:', error.message);
      return null;
    }
    return (data as { id: string } | null)?.id ?? null;
  } catch (e) {
    console.error('[landing] clique não gravado:', e instanceof Error ? e.message : e);
    return null;
  }
}

/** Mesmo cookie dos outros links rastreados (30 dias, legível no navegador). */
export const COOKIE_CLIQUE = { httpOnly: false, sameSite: 'lax' as const, path: '/', maxAge: 60 * 60 * 24 * 30 };
