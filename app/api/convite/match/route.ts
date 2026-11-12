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
import { cliqueAproximado, ipDe, ipHashesParaLeitura } from '@/lib/atribuicao';
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
    let codigo: string | null = null;
    let via = 'ip';
    if (hashes.length > 0) {
      const { data, error } = await sb
        .from('link_clicks')
        .select('promo_code, clicked_at')
        .eq('landed', 'convite')
        .in('ip_hash', hashes)
        .gte('clicked_at', desde)
        .order('clicked_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) console.warn('[convite/match]', error.message);
      codigo = (data as { promo_code?: string } | null)?.promo_code ?? null;
    }
    // 00145: IP mudou (Retransmissão Privada do Safari, Wi-Fi ↔ 4G): casa pelo
    // aparelho, pela região e pela hora do toque. O app ainda pergunta antes
    // de vincular ("Não é isso" desfaz).
    if (!codigo) {
      const aprox = await cliqueAproximado(sb, { headers: req.headers, ua: req.headers.get('user-agent') || '', convite: true });
      if (aprox) {
        const { data } = await sb.from('link_clicks').select('promo_code').eq('id', aprox).maybeSingle();
        codigo = (data as { promo_code?: string } | null)?.promo_code ?? null;
        via = 'aproximado';
      }
    }
    console.log('[convite/match]', codigo ? `casou (${via})` : 'nada');
    return NextResponse.json({ codigo }, { headers: CORS });
  } catch (e) {
    console.warn('[convite/match]', e);
    return NextResponse.json({ codigo: null }, { headers: CORS });
  }
}
