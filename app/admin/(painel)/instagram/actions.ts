'use server';

import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/auth/guard';
import { painelDb } from '@/lib/supabase/server';

/**
 * Ações da aba Instagram. Só o admin (o dono) aprova: o OK aqui é a
 * autorização para a função `instagram` publicar sozinha no horário marcado
 * (regra do dono, 25/10/2026, na skill regras-de-aprovacao).
 */

const id = (fd: FormData) => String(fd.get('id') ?? '');

async function mudar(postId: string, campos: Record<string, unknown>, deStatus: string[]) {
  requireRole('admin');
  if (!/^[0-9a-f-]{36}$/.test(postId)) throw new Error('post inválido');
  const { error } = await painelDb()
    .from('instagram_posts')
    .update(campos)
    .eq('id', postId)
    .in('status', deStatus);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/instagram');
}

export async function aprovarPost(fd: FormData) {
  await mudar(id(fd), { status: 'aprovado', aprovado_em: new Date().toISOString(), ajuste: null, erro: null, tentativas: 0 },
    ['rascunho', 'recusado', 'erro']);
}

export async function aprovarSemana(fd: FormData) {
  requireRole('admin');
  const semana = String(fd.get('semana') ?? '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(semana)) throw new Error('semana inválida');
  const { error } = await painelDb()
    .from('instagram_posts')
    .update({ status: 'aprovado', aprovado_em: new Date().toISOString(), ajuste: null })
    .eq('semana', semana)
    .eq('status', 'rascunho');
  if (error) throw new Error(error.message);
  revalidatePath('/admin/instagram');
}

export async function pedirAjuste(fd: FormData) {
  const texto = String(fd.get('ajuste') ?? '').trim().slice(0, 1000);
  if (!texto) return;
  await mudar(id(fd), { status: 'rascunho', aprovado_em: null, ajuste: texto }, ['rascunho', 'aprovado', 'erro']);
}

export async function recusarPost(fd: FormData) {
  await mudar(id(fd), { status: 'recusado', aprovado_em: null }, ['rascunho', 'aprovado', 'erro']);
}

/**
 * Horário digitado em Dubai, o relógio do dono (correção dele em 27/10/2026:
 * ele lia o horário do card como se fosse de Dubai). Dubai não tem horário de verão.
 */
export async function mudarHorario(fd: FormData) {
  const v = String(fd.get('quando') ?? '');
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v)) return;
  await mudar(id(fd), { agendado_para: `${v}:00+04:00` }, ['rascunho', 'aprovado', 'erro', 'recusado']);
}
