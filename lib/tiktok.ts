/**
 * Ninho · TikTok (aba /admin/tiktok, setor Crescimento). Pedido do dono,
 * 21/11/2026: só a estrutura, sem API do TikTok.
 *
 * - Fila e números por vídeo: painel.tiktok_posts (migration 00196 do
 *   Ninho-expo). O dono agenda à mão no TikTok Studio e lança os números aqui.
 * - Seguidores por dia: painel.tiktok_conta_dia (00196).
 * - Origem "TikTok (orgânico)": cliques da /landing?origem=tiktok
 *   (painel.link_clicks, promo_code 'LANDING', landing_fonte 'tiktok'),
 *   instalações casadas (painel.install_events), pessoas
 *   (public.origem_landing, fonte 'tiktok') e assinantes
 *   (public.assinantes_por_origem, origem 'tiktok_organico'). Tudo da 00194.
 *
 * Nada aqui quebra a tela: tabela ou coluna que ainda não existe vira
 * "aguardando migration".
 */
import { painelDb, appDb } from '@/lib/supabase/server';
import { lerTudo } from '@/lib/supabase/paginar';
import { FILA_ARQUIVO } from '@/lib/tiktok-fila';

export type StatusTiktok = 'agendado' | 'publicado' | 'recusado';

export interface PostTiktok {
  id: string | null;
  numero: number;
  nome: string;
  tema: string | null;
  video_url: string;
  legenda: string;
  agendado_para: string;
  status: StatusTiktok;
  tiktok_url: string | null;
  visualizacoes: number | null;
  curtidas: number | null;
  comentarios: number | null;
  compartilhamentos: number | null;
  salvamentos: number | null;
  tempo_medio_s: number | null;
  seguidores_ganhos: number | null;
  numeros_em: string | null;
}

export interface ContaDiaTiktok {
  dia: string;
  seguidores: number;
}

/** Resultado de uma leitura: dados, ou o motivo de não ter. */
export type Leitura<T> = { ok: true; dados: T } | { ok: false; falta: string };

/** Tabela, coluna ou view que ainda não existe (migration não aplicada). */
function faltaObjeto(e: { code?: string; message: string }): boolean {
  return ['42P01', '42703', 'PGRST200', 'PGRST204', 'PGRST205'].includes(e.code ?? '')
    || /does not exist|could not find/i.test(e.message);
}

export async function listarFila(): Promise<Leitura<PostTiktok[]>> {
  const { data, error } = await painelDb()
    .from('tiktok_posts')
    .select('*')
    .order('numero', { ascending: true });
  if (error) {
    if (faltaObjeto(error)) return { ok: false, falta: '00196' };
    throw new Error(`painel.tiktok_posts: ${error.message}`);
  }
  return { ok: true, dados: (data ?? []) as PostTiktok[] };
}

/** A fila do arquivo, igual ao seed da 00196, para mostrar antes de aplicar. */
export function filaDoArquivo(): PostTiktok[] {
  return FILA_ARQUIVO.map((f) => ({
    id: null, numero: f.numero, nome: f.nome, tema: f.tema, video_url: f.video_url, legenda: f.legenda,
    agendado_para: new Date(f.quando).toISOString(), status: 'agendado', tiktok_url: null,
    visualizacoes: null, curtidas: null, comentarios: null, compartilhamentos: null,
    salvamentos: null, tempo_medio_s: null, seguidores_ganhos: null, numeros_em: null,
  }));
}

export async function listarContaDia(): Promise<Leitura<ContaDiaTiktok[]>> {
  const { data, error } = await painelDb()
    .from('tiktok_conta_dia')
    .select('dia, seguidores')
    .order('dia', { ascending: false })
    .limit(60);
  if (error) {
    if (faltaObjeto(error)) return { ok: false, falta: '00196' };
    throw new Error(`painel.tiktok_conta_dia: ${error.message}`);
  }
  return { ok: true, dados: (data ?? []) as ContaDiaTiktok[] };
}

export interface OrigemTiktok {
  cliques: number;
  instalacoes: number;
  pessoas: number;
  assinantes: number;
}

/** Cliques, instalações, pessoas e assinantes do TikTok orgânico (00194). */
export async function origemTiktok(): Promise<Leitura<OrigemTiktok>> {
  const cliques = await lerTudo<{ id: string }>('link_clicks tiktok', (de, ate) =>
    painelDb()
      .from('link_clicks')
      .select('id')
      .eq('promo_code', 'LANDING')
      .eq('landing_fonte', 'tiktok')
      .order('id')
      .range(de, ate),
  );
  if (cliques.error) {
    if (faltaObjeto(cliques.error as { code?: string; message: string })) return { ok: false, falta: '00194' };
    throw new Error(`painel.link_clicks: ${cliques.error.message}`);
  }
  const ids = cliques.data.map((c) => c.id);

  // Instalações casadas com esses cliques, em lotes (URL do PostgREST tem limite).
  const lotes: string[][] = [];
  for (let i = 0; i < ids.length; i += 200) lotes.push(ids.slice(i, i + 200));
  const [instal, pessoas, assinantes] = await Promise.all([
    Promise.all(lotes.map(async (lote) => {
      const { count, error } = await painelDb()
        .from('install_events').select('id', { count: 'exact', head: true }).in('click_id', lote);
      if (error) throw new Error(`painel.install_events: ${error.message}`);
      return count ?? 0;
    })),
    appDb().from('origem_landing').select('profile_id', { count: 'exact', head: true }).eq('fonte', 'tiktok'),
    appDb().from('assinantes_por_origem').select('profile_id', { count: 'exact', head: true }).eq('origem', 'tiktok_organico'),
  ]);
  for (const r of [pessoas, assinantes]) {
    if (r.error) {
      if (faltaObjeto(r.error)) return { ok: false, falta: '00194' };
      throw new Error(r.error.message);
    }
  }
  return {
    ok: true,
    dados: {
      cliques: ids.length,
      instalacoes: instal.reduce((a, b) => a + b, 0),
      pessoas: pessoas.count ?? 0,
      assinantes: assinantes.count ?? 0,
    },
  };
}
