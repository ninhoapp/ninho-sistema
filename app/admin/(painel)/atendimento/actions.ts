'use server';

import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/auth/guard';
import {
  adicionarAprendizado,
  alternarAprendizado,
  descartarPendencia,
  excluirAprendizado,
  responderPendencia,
} from '@/lib/atendimento';

export interface RespostaState {
  error?: string;
  ok?: boolean;
  aviso?: string;
}

const CAMINHO = '/admin/atendimento';

export async function responder(_prev: RespostaState, fd: FormData): Promise<RespostaState> {
  requireRole('admin');
  const pendencia_id = String(fd.get('pendencia_id') ?? '');
  const resposta = String(fd.get('resposta') ?? '').trim();
  const ensinar = fd.get('ensinar') === 'on';
  if (!pendencia_id || resposta.length < 2) return { error: 'Escreva a resposta.' };
  try {
    const r = await responderPendencia({
      pendencia_id,
      resposta,
      ensinar,
      pergunta_geral: String(fd.get('pergunta_geral') ?? '').trim() || undefined,
      resposta_geral: String(fd.get('resposta_geral') ?? '').trim() || undefined,
    });
    revalidatePath(CAMINHO);
    const semPush = r.push && r.push.enviados === 0;
    return { ok: true, aviso: semPush ? 'Entregue na conversa e no sininho. A push não saiu (a pessoa está sem aparelho com notificação ligada).' : undefined };
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

export async function descartar(fd: FormData): Promise<void> {
  requireRole('admin');
  await descartarPendencia(String(fd.get('id') ?? ''));
  revalidatePath(CAMINHO);
}

export async function ensinar(_prev: RespostaState, fd: FormData): Promise<RespostaState> {
  requireRole('admin');
  const pergunta = String(fd.get('pergunta') ?? '').trim();
  const resposta = String(fd.get('resposta') ?? '').trim();
  if (pergunta.length < 3 || resposta.length < 3) return { error: 'Preencha a pergunta e a resposta.' };
  try {
    await adicionarAprendizado(pergunta, resposta);
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
  revalidatePath(CAMINHO);
  return { ok: true };
}

export async function alternar(fd: FormData): Promise<void> {
  requireRole('admin');
  await alternarAprendizado(String(fd.get('id') ?? ''), fd.get('ativo') === 'true');
  revalidatePath(CAMINHO);
}

export async function excluir(fd: FormData): Promise<void> {
  requireRole('admin');
  await excluirAprendizado(String(fd.get('id') ?? ''));
  revalidatePath(CAMINHO);
}
