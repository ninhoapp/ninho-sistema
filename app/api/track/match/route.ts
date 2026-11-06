/**
 * POST /api/track/match — o app chama UMA vez, na 1ª abertura depois de
 * instalar. Faz o hash do IP de quem chamou e procura o clique mais recente
 * num link de parceiro com o mesmo IP nos últimos JANELA_DIAS.
 *
 * Achou → grava a instalação em painel.install_events (um por clique, então
 * repetir a chamada não infla "Downloads") e devolve { ref, click_id }.
 * Não achou → { ref: null }.
 *
 * Público (o app ainda não tem sessão nessa hora) e sem corpo: só lê os
 * headers. Não dá para inflar números de outro parceiro chamando daqui, porque
 * só casa com clique que saiu do mesmo IP. A indicação na conta é gravada
 * depois pelo app via registrar_indicacao_parceiro(), que confere o clique.
 */
import { NextRequest, NextResponse } from 'next/server';
import { painelDb } from '@/lib/supabase/server';
import { familiaDoIp, ipDe, ipHash, ipHashesParaLeitura, JANELA_DIAS } from '@/lib/atribuicao';

export const dynamic = 'force-dynamic';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'content-type',
  'Cache-Control': 'no-store',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function POST(req: NextRequest) {
  try {
    const ip = ipDe(req.headers);
    const ua = req.headers.get('user-agent') || '';
    // Diagnóstico (a Vercel guarda 1 h): compare o `ip` daqui com o do
    // "[r] clique" do mesmo teste. Só o começo do hash, nunca o IP.
    const diag = { ip: (ipHash(ip) || '').slice(0, 8), familia: familiaDoIp(ip), ua: ua.slice(0, 80) };
    const hashes = ipHashesParaLeitura(ip);
    if (hashes.length === 0) {
      console.log('[track/match] sem IP', JSON.stringify(diag));
      return NextResponse.json({ ref: null }, { headers: CORS });
    }

    const desde = new Date(Date.now() - JANELA_DIAS * 86_400_000).toISOString();
    const sb = painelDb();
    const { data } = await sb
      .from('link_clicks')
      .select('id,promo_code,perfil_id')
      .in('ip_hash', hashes)
      .gte('clicked_at', desde)
      .not('perfil_id', 'is', null)
      .order('clicked_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!data?.promo_code) {
      console.log('[track/match] nenhum clique desse IP', JSON.stringify(diag));
      return NextResponse.json({ ref: null }, { headers: CORS });
    }
    console.log('[track/match] casou', JSON.stringify({ ...diag, codigo: data.promo_code, click: data.id }));

    const platform = /android|okhttp/i.test(ua) ? 'android' : /iphone|ipad|ios|darwin|cfnetwork/i.test(ua) ? 'ios' : null;
    const { error } = await sb
      .from('install_events')
      .upsert(
        { promo_code: data.promo_code, click_id: data.id, platform },
        { onConflict: 'click_id', ignoreDuplicates: true },
      );
    if (error) console.warn('[track/match] install_events:', error.message);

    return NextResponse.json({ ref: data.promo_code, click_id: data.id }, { headers: CORS });
  } catch (e) {
    console.warn('[track/match]', e);
    return NextResponse.json({ ref: null }, { headers: CORS });
  }
}
