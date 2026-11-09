/**
 * Sugestões das consultoras (migration 00123 do Ninho-expo). A consultora
 * escreve no painel web; o dono lê em /admin/consultor › Sugestões.
 * Antes da migration aplicada, tudo volta "indisponível" sem quebrar a tela.
 */
import { appDb } from '@/lib/supabase/server';

export type StatusSugestao = 'nova' | 'lida' | 'feita';

export interface Sugestao {
  id: string;
  consultora_id: string;
  texto: string;
  status: StatusSugestao;
  criado_em: string;
}

export const SUGESTAO_MIN = 3;
export const SUGESTAO_MAX = 2000;

const semTabela = (e: { code?: string; message?: string } | null) =>
  !!e && (e.code === '42P01' || e.code === 'PGRST205' || /consultora_sugestoes/.test(e.message ?? ''));

export async function sugestoesDa(consultoraId: string): Promise<{ lista: Sugestao[]; indisponivel: boolean }> {
  const { data, error } = await appDb()
    .from('consultora_sugestoes')
    .select('id, consultora_id, texto, status, criado_em')
    .eq('consultora_id', consultoraId)
    .order('criado_em', { ascending: false })
    .limit(30);
  if (error) return { lista: [], indisponivel: true };
  return { lista: (data ?? []) as Sugestao[], indisponivel: false };
}

export async function todasSugestoes(): Promise<{ lista: Sugestao[]; indisponivel: boolean }> {
  const { data, error } = await appDb()
    .from('consultora_sugestoes')
    .select('id, consultora_id, texto, status, criado_em')
    .order('criado_em', { ascending: false })
    .limit(300);
  if (error) return { lista: [], indisponivel: true };
  return { lista: (data ?? []) as Sugestao[], indisponivel: false };
}

export async function enviarSugestao(consultoraId: string, texto: string): Promise<'ok' | 'indisponivel' | 'erro'> {
  const { error } = await appDb().from('consultora_sugestoes').insert({ consultora_id: consultoraId, texto });
  if (!error) return 'ok';
  return semTabela(error) ? 'indisponivel' : 'erro';
}

export async function marcarSugestao(id: string, status: StatusSugestao): Promise<boolean> {
  const { error } = await appDb()
    .from('consultora_sugestoes')
    .update({ status, atualizado_em: new Date().toISOString() })
    .eq('id', id);
  return !error;
}
