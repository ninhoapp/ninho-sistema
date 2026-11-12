/**
 * POST /api/track/match — o app chama UMA vez, na 1ª abertura depois de
 * instalar. Faz o hash do IP de quem chamou e procura o clique mais recente
 * num link rastreado com o mesmo IP nos últimos JANELA_DIAS.
 *
 * Corpo (JSON, tudo opcional):
 *   { click_id?: uuid, versao_atribuicao?: number }
 *   - click_id: o link que a página do Safari copiou (/r/<código>?c=<id> ou
 *     /c/<código>?c=<id>). Sem ele, casa pelo IP.
 *   - versao_atribuicao >= 2: o app sabe tratar link de CONSULTORA (/c/).
 *     Sem isso (versões antigas), só casa clique de parceiro, porque o app
 *     antigo chamaria registrar_indicacao_parceiro com o código da consultora.
 *
 * Resposta (sempre 200):
 *   { ref: null }                                            → não casou
 *   { ref: '<CÓDIGO>', click_id: '<uuid>', tipo: 'parceiro' }   → registrar_indicacao_parceiro(ref, click_id)
 *   { ref: '<CÓDIGO>', click_id: '<uuid>', tipo: 'consultora' } → registrar_indicacao_consultora(ref, 'link', click_id)
 *     (tipo 'consultora' só sai com versao_atribuicao >= 2)
 *     + vincular: true quando o clique veio do link da CONSULTORIA
 *       (/consultoria/<código>, 00144): o app pergunta, depois do cadastro do
 *       bebê, se a família aprova compartilhar a rotina com ela. App antigo
 *       ignora o campo (vira só comissão, como o link de divulgação).
 *   { ref: '<CÓDIGO>', click_id: '<uuid>', tipo: 'amiga' }      → registrar_indicacao_amiga(ref, click_id)
 *     (tipo 'amiga' só sai com versao_atribuicao >= 3; migration 00130)
 *
 * Achou → grava a instalação em painel.install_events (uma por clique, então
 * repetir a chamada não infla "Downloads"). Público (o app ainda não tem
 * sessão). Só casa clique do mesmo IP ou com o id aleatório do clique.
 */
import { NextRequest, NextResponse } from 'next/server';
import { painelDb } from '@/lib/supabase/server';
import { cliqueAproximado, familiaDoIp, geoDe, ipDe, ipHash, ipHashesParaLeitura, JANELA_DIAS } from '@/lib/atribuicao';

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

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface Corpo {
  clickId: string | null;
  versao: number;
}

async function lerCorpo(req: NextRequest): Promise<Corpo> {
  try {
    const texto = (await req.text()).slice(0, 500);
    if (!texto) return { clickId: null, versao: 1 };
    const j = JSON.parse(texto) as { click_id?: unknown; versao_atribuicao?: unknown };
    const clickId = typeof j.click_id === 'string' && UUID_RE.test(j.click_id) ? j.click_id : null;
    const v = Number(j.versao_atribuicao);
    return { clickId, versao: Number.isFinite(v) && v >= 1 ? Math.floor(v) : 1 };
  } catch {
    return { clickId: null, versao: 1 };
  }
}

interface Clique {
  id: string;
  promo_code: string;
  perfil_id: string | null;
  consultora_id?: string | null;
  amiga_profile_id?: string | null;
  /** 00144: clique no link da consultoria. */
  vinculo?: boolean | null;
}

type Filtro = { tipo: 'id'; id: string } | { tipo: 'ip'; hashes: string[] };

/**
 * Janela do clique de CONSULTORA casado só pelo IP (sem o link copiado):
 * 24 h (Henrique, 08/11/2026). IP compartilhado (operadora, empresa) pode
 * casar o clique de uma pessoa com a instalação de outra, e para consultora
 * isso vira comissão. Com o link copiado (click_id) vale a janela normal
 * (JANELA_DIAS). Parceiro continua com JANELA_DIAS nos dois casos. O dono
 * pode mudar este número.
 */
const JANELA_CONSULTORA_IP_HORAS = 24;

export async function POST(req: NextRequest) {
  try {
    const ip = ipDe(req.headers);
    const ua = req.headers.get('user-agent') || '';
    // Diagnóstico (a Vercel guarda 1 h): só o começo do hash, nunca o IP.
    const diag = { ip: (ipHash(ip) || '').slice(0, 8), familia: familiaDoIp(ip), ua: ua.slice(0, 80) };
    const desde = new Date(Date.now() - JANELA_DIAS * 86_400_000).toISOString();
    const sb = painelDb();
    const { clickId: clickCopiado, versao } = await lerCorpo(req);
    const aceitaConsultora = versao >= 2;
    // 00130: versao_atribuicao >= 3 sabe tratar o link de amiga (/i/<código>).
    const aceitaAmiga = versao >= 3;

    // Com consultora (v2): clique de parceiro OU de consultora. Sem a 00112
    // (coluna consultora_id), cai só em parceiro.
    const desdeConsultoraIp = new Date(Date.now() - JANELA_CONSULTORA_IP_HORAS * 3_600_000).toISOString();

    // Uma consulta por tipo de link (parceiro: perfil_id; consultora:
    // consultora_id, 00112) e fica o clique mais recente. Sem a 00112, a de
    // consultora falha e só parceiro casa.
    async function buscarTipo(f: Filtro, tipoLink: 'parceiro' | 'consultora' | 'amiga'): Promise<(Clique & { clicked_at: string }) | null> {
      const consultora = tipoLink !== 'parceiro';
      // Amiga casada só pelo IP usa a mesma janela curta da consultora (vale dias grátis).
      const desdeAqui = consultora && f.tipo === 'ip' ? desdeConsultoraIp : desde;
      const base = sb.from('link_clicks').select('*').gte('clicked_at', desdeAqui);
      // Parceiro: perfil_id preenchido. Consultora: consultora_id preenchido e perfil_id nulo.
      const filtrado =
        tipoLink === 'amiga'
          ? base.filter('amiga_profile_id', 'not.is', 'null').filter('perfil_id', 'is', 'null')
          : tipoLink === 'consultora'
            ? base.filter('consultora_id', 'not.is', 'null').filter('perfil_id', 'is', 'null')
            : base.filter('perfil_id', 'not.is', 'null');
      const r =
        f.tipo === 'id'
          ? await filtrado.eq('id', f.id).limit(1).maybeSingle()
          : await filtrado.in('ip_hash', f.hashes).order('clicked_at', { ascending: false }).limit(1).maybeSingle();
      if (r.error) {
        if (consultora) console.warn('[track/match] busca de ' + tipoLink + ' falhou:', r.error.message);
        return null;
      }
      return (r.data as unknown as (Clique & { clicked_at: string }) | null) ?? null;
    }
    async function buscar(f: Filtro): Promise<Clique | null> {
      const [par, con, ami] = await Promise.all([
        buscarTipo(f, 'parceiro'),
        aceitaConsultora ? buscarTipo(f, 'consultora') : Promise.resolve(null),
        aceitaAmiga ? buscarTipo(f, 'amiga') : Promise.resolve(null),
      ]);
      // Fica o clique mais recente dos três tipos.
      return [par, con, ami].filter((x): x is Clique & { clicked_at: string } => !!x).sort((a, b) => (a.clicked_at < b.clicked_at ? 1 : -1))[0] ?? null;
    }

    let data: Clique | null = null;
    let via = 'ip';
    if (clickCopiado) {
      data = await buscar({ tipo: 'id', id: clickCopiado });
      via = 'copiado';
    }
    if (!data) {
      const hashes = ipHashesParaLeitura(ip);
      if (hashes.length > 0) {
        data = await buscar({ tipo: 'ip', hashes });
        via = 'ip';
      }
    }
    // 00145 (dono, 12/11/2026: indicação automática, sem "Permitir colar"):
    // o IP mudou (Retransmissão Privada do Safari, Wi-Fi ↔ 4G). Casa pelo
    // aparelho, pela região e pela hora do toque (até 2 h), com toque que
    // ainda não virou instalação.
    if (!data) {
      const aprox = await cliqueAproximado(sb, { headers: req.headers, ua, convite: false });
      if (aprox) {
        data = await buscar({ tipo: 'id', id: aprox });
        via = 'aproximado';
      }
    }

    if (!data?.promo_code) {
      console.log(
        clickCopiado ? '[track/match] link copiado inválido e nenhum clique desse IP' : '[track/match] nenhum clique desse IP',
        JSON.stringify({ ...diag, versao, regiao: geoDe(req.headers).geo_regiao }),
      );
      return NextResponse.json({ ref: null }, { headers: CORS });
    }
    const tipo: 'parceiro' | 'consultora' | 'amiga' = data.perfil_id ? 'parceiro' : data.amiga_profile_id ? 'amiga' : 'consultora';
    console.log('[track/match] casou', JSON.stringify({ ...diag, via, tipo, versao, codigo: data.promo_code, click: data.id }));

    const platform = /android|okhttp/i.test(ua) ? 'android' : /iphone|ipad|ios|darwin|cfnetwork/i.test(ua) ? 'ios' : null;
    const { error } = await sb
      .from('install_events')
      .upsert(
        {
          promo_code: data.promo_code,
          click_id: data.id,
          platform,
          ...(tipo === 'consultora' ? { consultora_id: data.consultora_id ?? null } : {}),
        },
        { onConflict: 'click_id', ignoreDuplicates: true },
      );
    if (error) console.warn('[track/match] install_events:', error.message);

    const vincular = tipo === 'consultora' && data.vinculo === true;
    return NextResponse.json({ ref: data.promo_code, click_id: data.id, tipo, ...(vincular ? { vincular: true } : {}) }, { headers: CORS });
  } catch (e) {
    console.warn('[track/match]', e);
    return NextResponse.json({ ref: null }, { headers: CORS });
  }
}
