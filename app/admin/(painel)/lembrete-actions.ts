'use server';

import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/auth/guard';
import { marcarLembreteFeito } from '@/lib/lembretes';

/** Botão "Já fiz a verificação" da faixa de lembrete no topo do painel. */
export async function concluirLembrete(fd: FormData) {
  const s = await requireRole('admin');
  const id = String(fd.get('id') ?? '');
  if (!/^[0-9a-f-]{36}$/i.test(id)) return;
  await marcarLembreteFeito(id, s.name ?? null);
  revalidatePath('/admin', 'layout');
}
