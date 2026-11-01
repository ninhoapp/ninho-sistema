/**
 * Avaliações das lojas (App Store e Google Play) — dados da aba /admin/avaliacoes.
 * Server-only. Tabela public.avaliacoes_lojas (migration 00091 do Ninho-expo).
 *
 * A edge function `avaliacoes-lojas` traz as avaliações de hora em hora e
 * escreve um rascunho de resposta. Aqui o dono edita, aprova ou ignora; ao
 * aprovar, chamamos a função (acao "enviar") para publicar na hora, porque as
 * chaves das lojas ficam só no Supabase.
 */
import { appDb } from '@/lib/supabase/server';

export type StatusAvaliacao = 'nova' | 'rascunho' | 'aprovada' | 'enviada' | 'ignorada' | 'erro';

export interface AvaliacaoLoja {
  id: string;
  loja: 'apple' | 'google';
  nota: number;
  titulo: string | null;
  texto: string | null;
  autor: string | null;
  pais: string | null;
  idioma: 'pt' | 'en';
  versao_app: string | null;
  escrita_em: string;
  rascunho: string | null;
  resposta_enviada: string | null;
  status: StatusAvaliacao;
  erro: string | null;
  enviada_em: string | null;
}

/** Limite do Google Play; usamos o mesmo na Apple. */
export const LIMITE_RESPOSTA = 350;

const CAMPOS =
  'id, loja, nota, titulo, texto, autor, pais, idioma, versao_app, escrita_em, rascunho, resposta_enviada, status, erro, enviada_em';

export async function fetchAvaliacoes(status: StatusAvaliacao[], limite = 100): Promise<AvaliacaoLoja[]> {
  const { data, error } = await appDb()
    .from('avaliacoes_lojas')
    .select(CAMPOS)
    .in('status', status)
    .order('escrita_em', { ascending: false })
    .limit(limite);
  if (error) throw new Error(error.message);
  return (data ?? []) as AvaliacaoLoja[];
}

export interface ResumoAvaliacoes {
  esperando: number;
  notaMedia30: number | null;
  total30: number;
  enviadas30: number;
}

export async function fetchResumoAvaliacoes(): Promise<ResumoAvaliacoes> {
  const desde = new Date(Date.now() - 30 * 86_400_000).toISOString();
  const { data, error } = await appDb().from('avaliacoes_lojas').select('nota, status, enviada_em, escrita_em').gte('escrita_em', desde);
  if (error) throw new Error(error.message);
  const linhas = data ?? [];
  const { count } = await appDb()
    .from('avaliacoes_lojas')
    .select('id', { count: 'exact', head: true })
    .in('status', ['nova', 'rascunho', 'erro']);
  return {
    esperando: count ?? 0,
    total30: linhas.length,
    notaMedia30: linhas.length ? linhas.reduce((s, l) => s + l.nota, 0) / linhas.length : null,
    enviadas30: linhas.filter((l) => l.status === 'enviada').length,
  };
}

/** Grava o texto final, marca como aprovada e pede à função para publicar já. */
export async function aprovarAvaliacao(id: string, resposta: string): Promise<{ enviada: boolean; erro?: string }> {
  const { error } = await appDb()
    .from('avaliacoes_lojas')
    .update({ rascunho: resposta, status: 'aprovada', aprovada_em: new Date().toISOString(), erro: null, updated_at: new Date().toISOString() })
    .eq('id', id)
    .in('status', ['nova', 'rascunho', 'erro']);
  if (error) throw new Error(error.message);

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY não definidas.');
  const res = await fetch(`${url}/functions/v1/avaliacoes-lojas`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ acao: 'enviar', id }),
    cache: 'no-store',
  });
  const json = (await res.json().catch(() => ({}))) as { error?: string; envios?: { id: string; ok?: boolean; erro?: string }[] };
  if (!res.ok) return { enviada: false, erro: json.error ?? `Função respondeu ${res.status}` };
  const envio = json.envios?.find((e) => e.id === id);
  return envio?.ok ? { enviada: true } : { enviada: false, erro: envio?.erro ?? 'A loja não confirmou; a função tenta de novo na próxima hora.' };
}

export async function ignorarAvaliacao(id: string): Promise<void> {
  const { error } = await appDb()
    .from('avaliacoes_lojas')
    .update({ status: 'ignorada', updated_at: new Date().toISOString() })
    .eq('id', id)
    .in('status', ['nova', 'rascunho', 'erro']);
  if (error) throw new Error(error.message);
}
