'use server';

import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/auth/guard';
import { decidirAprovacao, type StatusAprovacao } from '@/lib/empresa';

const VALIDOS: StatusAprovacao[] = ['aprovado', 'feito', 'recusado'];

export async function decidirItemMural(id: number, status: StatusAprovacao): Promise<{ error?: string }> {
  requireRole('admin');
  if (!Number.isInteger(id) || !VALIDOS.includes(status)) return { error: 'Pedido inválido.' };
  try {
    await decidirAprovacao(id, status);
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
  revalidatePath('/admin/empresa');
  return {};
}
