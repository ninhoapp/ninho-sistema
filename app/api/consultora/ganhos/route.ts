/**
 * GET /api/consultora/ganhos — extrato da consultora para o app.
 *
 * Authorization: Bearer <access_token do Supabase do app>. O token é conferido
 * no próprio Supabase (auth.getUser), e a conta precisa estar ligada a uma
 * consultora (consultoras.profile_id). Mesmo cálculo do painel
 * (lib/consultoras.ts → montarGanhos), no formato do contrato
 * (Ninho-expo/docs/empresa/pedidos/consultoras-contrato.md). `via` = nome da
 * consultora indicada quando a linha é a parte de 12,5% de quem indicou.
 *
 * Desde 08/11/2026 também traz o funil do link (/c/<código>): `cliques` e
 * `funil` em cada item de `meses`, e `funil` no topo (últimos 6 meses, com
 * `meses` mês a mês e `rastreio_disponivel`). Só campos novos.
 *
 * 401 sem token válido · 404 se a conta não é consultora · 429 acima de 30
 * pedidos por minuto da mesma conta.
 */
import { NextResponse } from 'next/server';
import { appDb } from '@/lib/supabase/server';
import { consultoraDaConta, montarGanhos } from '@/lib/consultoras';

export const dynamic = 'force-dynamic';

const semCache = { 'Cache-Control': 'no-store' };

// Limite simples por conta, em memória da instância: 30 pedidos por minuto.
// O cálculo pesado já vem do cache de 2 min (baseComissoes).
const LIMITE = 30;
const JANELA_MS = 60_000;
const pedidosPorConta = new Map<string, number[]>();

function passou(userId: string): boolean {
  const agora = Date.now();
  if (pedidosPorConta.size > 5000) pedidosPorConta.clear();
  const lista = (pedidosPorConta.get(userId) ?? []).filter((t) => agora - t < JANELA_MS);
  lista.push(agora);
  pedidosPorConta.set(userId, lista);
  return lista.length > LIMITE;
}

export async function GET(req: Request) {
  const auth = req.headers.get('authorization') || '';
  const m = /^Bearer\s+(\S+)$/i.exec(auth);
  if (!m || m[1].length > 4096) return NextResponse.json({ error: 'nao_autenticado' }, { status: 401, headers: semCache });

  const { data, error } = await appDb().auth.getUser(m[1]);
  if (error || !data?.user) return NextResponse.json({ error: 'nao_autenticado' }, { status: 401, headers: semCache });

  if (passou(data.user.id)) {
    return NextResponse.json({ error: 'muitas_requisicoes' }, { status: 429, headers: { ...semCache, 'Retry-After': '60' } });
  }

  try {
    const c = await consultoraDaConta(data.user.id);
    if (!c) return NextResponse.json({ error: 'nao_e_consultora' }, { status: 404, headers: semCache });
    return NextResponse.json(await montarGanhos(c), { headers: semCache });
  } catch (e) {
    console.error('[api/consultora/ganhos] falhou:', e instanceof Error ? e.message : e);
    return NextResponse.json({ error: 'erro_interno' }, { status: 500, headers: semCache });
  }
}
