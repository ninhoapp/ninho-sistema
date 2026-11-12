/**
 * Convite da família casado pelo IP (12/11/2026, sem "Permitir colar"):
 * quem tocou em www.useninho.com.br/f/<código> e logo depois abriu o cadastro
 * no app recebe o código do convite. O app ainda mostra "Você vai cuidar de
 * {bebê} com {nome}?" antes de vincular: o toque não vincula ninguém sozinho.
 *
 * Janela curta (60 min) porque IP pode ser compartilhado (operadora, Wi-Fi):
 * o pior caso é alguém ver a pergunta de um convite que não é dele e tocar em
 * "Não é isso". Não usa a rota de atribuição (/api/track/match): os toques de
 * convite (landed='convite') não têm parceiro, consultora nem amiga, então
 * nunca entram nela.
 */
import { NextRequest, NextResponse } from 'next/server';
import { ipDe, ipHashesParaLeitura, ultimoToqueAproximado } from '@/lib/atribuicao';
import { painelDb } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'content-type',
  'Cache-Control': 'no-store',
};
const JANELA_MIN = 60;

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function POST(req: NextRequest) {
  try {
    const sb = painelDb();
    const hashes = ipHashesParaLeitura(ipDe(req.headers));
    const desde = new Date(Date.now() - JANELA_MIN * 60_000).toISOString();
    // Vale só o ÚLTIMO toque (dono, 13/11/2026): se depois do convite a
    // pessoa tocou no link de uma consultora, parceiro ou amiga, não é
    // convite — o cadastro segue com a indicação, sem a caixa do convite.
    let ultimo: { landed: string; promo_code: string } | null = null;
    let via = 'ip';
    if (hashes.length > 0) {
      const { data, error } = await sb
        .from('link_clicks')
        .select('landed, promo_code, clicked_at')
        .in('ip_hash', hashes)
        .gte('clicked_at', desde)
        .order('clicked_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) console.warn('[convite/match]', error.message);
      ultimo = (data as { landed: string; promo_code: string } | null) ?? null;
    }
    // 00145: IP mudou (Retransmissão Privada do Safari, Wi-Fi ↔ 4G): o último
    // toque do mesmo aparelho e região. O app ainda pergunta antes de vincular.
    if (!ultimo) {
      ultimo = await ultimoToqueAproximado(sb, req.headers, req.headers.get('user-agent') || '');
      via = 'aproximado';
    }
    const codigo = ultimo?.landed === 'convite' ? ultimo.promo_code : null;
    console.log('[convite/match]', codigo ? `casou (${via})` : ultimo ? `último toque não é convite (${ultimo.landed})` : 'nada');
    return NextResponse.json({ codigo }, { headers: CORS });
  } catch (e) {
    console.warn('[convite/match]', e);
    return NextResponse.json({ codigo: null }, { headers: CORS });
  }
}
