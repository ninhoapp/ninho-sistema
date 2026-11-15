'use server';

/**
 * Respostas da página /motivo. Quem chega aqui é identificado só pelo
 * `unsubscribe_token` do e-mail (o mesmo do link de descadastro), sem login.
 * Nada além do motivo, do texto opcional e do descadastro é alterado.
 */
import { appDb } from '@/lib/supabase/server';
import { ehMotivo, UUID } from './opcoes';

export interface Resultado {
  ok: boolean;
  erro?: string;
}

async function perfilDoToken(token: string): Promise<string | null> {
  if (!UUID.test(token)) return null;
  const { data } = await appDb().from('profiles').select('id').eq('unsubscribe_token', token).maybeSingle();
  return (data?.id as string | undefined) ?? null;
}

/** Grava (ou troca) o motivo na linha do resgate por e-mail. A linha nasce no
 *  envio (enviar-comunicado, motivo_nao_assinou). Sem ela, não grava nada:
 *  o mesmo token está em e-mails de outras campanhas (Darck, 15/11/2026).
 *  Para testar na conta do dono, crie a linha antes (ver mural). */
export async function registrarMotivo(token: string, motivo: string, texto?: string): Promise<Resultado> {
  if (!ehMotivo(motivo)) return { ok: false, erro: 'motivo' };
  const profileId = await perfilDoToken(token);
  if (!profileId) return { ok: false, erro: 'link' };

  const db = appDb();
  const agora = new Date().toISOString();
  const resumo = texto?.trim() ? texto.trim().slice(0, 1000) : undefined;

  const { data: linha } = await db
    .from('atendimento_resgates')
    .select('id, respondeu_em')
    .eq('profile_id', profileId)
    .eq('canal', 'email')
    .order('iniciado_em', { ascending: false })
    .limit(1)
    .maybeSingle();

  const campos = {
    motivo,
    motivo_em: agora,
    updated_at: agora,
    ...(resumo !== undefined ? { motivo_resumo: resumo } : {}),
  };

  if (!linha) return { ok: false, erro: 'link' };
  const { error } = await db
    .from('atendimento_resgates')
    .update({ ...campos, respondeu_em: (linha.respondeu_em as string | null) ?? agora })
    .eq('id', linha.id as string);
  return error ? { ok: false, erro: 'gravar' } : { ok: true };
}

/** Mesmo efeito do link de descadastro do e-mail (RPC da 00030). */
export async function descadastrar(token: string): Promise<Resultado> {
  if (!UUID.test(token)) return { ok: false, erro: 'link' };
  const { data, error } = await appDb().rpc('descadastrar_por_token', { p_token: token });
  const linha = (Array.isArray(data) ? data[0] : data) as { ok?: boolean } | null;
  return error || !linha?.ok ? { ok: false, erro: 'link' } : { ok: true };
}
