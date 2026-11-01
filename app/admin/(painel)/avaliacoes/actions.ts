'use server';

import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/auth/guard';
import { aprovarAvaliacao, ignorarAvaliacao, LIMITE_RESPOSTA } from '@/lib/avaliacoes';

export interface AprovarState {
  error?: string;
  ok?: boolean;
}

const CAMINHO = '/admin/avaliacoes';

export async function aprovar(_prev: AprovarState, fd: FormData): Promise<AprovarState> {
  requireRole('admin');
  const id = String(fd.get('id') ?? '');
  const resposta = String(fd.get('resposta') ?? '').trim();
  if (!id || resposta.length < 5) return { error: 'Escreva a resposta.' };
  if (resposta.length > LIMITE_RESPOSTA) return { error: `A resposta tem ${resposta.length} caracteres; o máximo é ${LIMITE_RESPOSTA}.` };
  try {
    const r = await aprovarAvaliacao(id, resposta);
    revalidatePath(CAMINHO);
    return r.enviada ? { ok: true } : { error: `Aprovada, mas não publicou: ${r.erro}` };
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

export async function ignorar(fd: FormData): Promise<void> {
  requireRole('admin');
  await ignorarAvaliacao(String(fd.get('id') ?? ''));
  revalidatePath(CAMINHO);
}
