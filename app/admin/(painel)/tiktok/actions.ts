'use server';

import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/auth/guard';
import { painelDb } from '@/lib/supabase/server';

/**
 * Ações da aba TikTok. Tudo à mão (pedido do dono, 21/11/2026: sem API):
 * o status do vídeo, os números que o dono lê no TikTok Studio e os
 * seguidores do perfil no dia.
 */

/** Número inteiro >= 0, ou null se vazio. Texto inválido também vira null. */
function inteiro(v: FormDataEntryValue | null): number | null {
  const s = String(v ?? '').trim().replace(/\./g, '');
  if (!s) return null;
  const n = Number(s);
  return Number.isInteger(n) && n >= 0 && n < 2_000_000_000 ? n : null;
}

function decimal(v: FormDataEntryValue | null): number | null {
  const s = String(v ?? '').trim().replace(',', '.');
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 && n < 100_000 ? Math.round(n * 10) / 10 : null;
}

function idValido(fd: FormData): string {
  const id = String(fd.get('id') ?? '');
  if (!/^[0-9a-f-]{36}$/.test(id)) throw new Error('vídeo inválido');
  return id;
}

export async function mudarStatus(fd: FormData) {
  await requireRole('admin');
  const id = idValido(fd);
  const status = String(fd.get('status') ?? '');
  if (!['agendado', 'publicado', 'recusado'].includes(status)) throw new Error('status inválido');
  const { error } = await painelDb()
    .from('tiktok_posts')
    .update({ status, atualizado_em: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/tiktok');
}

export async function salvarNumeros(fd: FormData) {
  await requireRole('admin');
  const id = idValido(fd);
  const link = String(fd.get('tiktok_url') ?? '').trim();
  const { error } = await painelDb()
    .from('tiktok_posts')
    .update({
      visualizacoes: inteiro(fd.get('visualizacoes')),
      curtidas: inteiro(fd.get('curtidas')),
      comentarios: inteiro(fd.get('comentarios')),
      compartilhamentos: inteiro(fd.get('compartilhamentos')),
      salvamentos: inteiro(fd.get('salvamentos')),
      tempo_medio_s: decimal(fd.get('tempo_medio_s')),
      seguidores_ganhos: inteiro(fd.get('seguidores_ganhos')),
      tiktok_url: /^https:\/\/(www\.|vm\.)?tiktok\.com\//.test(link) ? link.slice(0, 500) : null,
      numeros_em: new Date().toISOString(),
      atualizado_em: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/tiktok');
}

export async function salvarSeguidores(fd: FormData) {
  await requireRole('admin');
  const dia = String(fd.get('dia') ?? '');
  const seguidores = inteiro(fd.get('seguidores'));
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dia) || seguidores == null) return;
  const { error } = await painelDb()
    .from('tiktok_conta_dia')
    .upsert({ dia, seguidores }, { onConflict: 'dia' });
  if (error) throw new Error(error.message);
  revalidatePath('/admin/tiktok');
}
