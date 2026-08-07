'use server';

import { redirect } from 'next/navigation';
import { findPerfilByLogin, getPerfil, setPassword, updatePerfil } from '@/lib/painel/store';
import { verifyPassword } from '@/lib/auth/password';
import {
  setSessionCookie,
  clearSessionCookie,
  getSession,
  homeForRole,
} from '@/lib/auth/session';

export interface ActionState {
  error?: string;
  ok?: boolean;
}

export async function signIn(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const login = String(formData.get('login') || '').trim();
  const password = String(formData.get('password') || '');
  if (!login || !password) return { error: 'Preencha usuário e senha.' };

  const perfil = await findPerfilByLogin(login);
  if (!perfil || !verifyPassword(password, perfil.password_hash)) {
    return { error: 'Usuário ou senha incorretos.' };
  }

  setSessionCookie({
    sub: perfil.id,
    username: perfil.username,
    role: perfil.role,
    name: perfil.display_name,
  });
  redirect(homeForRole(perfil.role));
}

export async function signOut() {
  clearSessionCookie();
  redirect('/admin/login');
}

export async function changeOwnPassword(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = getSession();
  if (!session) return { error: 'Sessão expirada.' };

  const atual = String(formData.get('atual') || '');
  const nova = String(formData.get('nova') || '');
  const confirma = String(formData.get('confirma') || '');

  if (nova.length < 8) return { error: 'A nova senha precisa ter ao menos 8 caracteres.' };
  if (nova !== confirma) return { error: 'A confirmação não confere.' };

  const perfil = await getPerfil(session.sub);
  if (!perfil || !verifyPassword(atual, perfil.password_hash)) {
    return { error: 'Senha atual incorreta.' };
  }

  const res = await setPassword(perfil.id, nova);
  if (!res.ok) return { error: res.error || 'Falha ao salvar.' };
  return { ok: true };
}

export async function updateOwnPix(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = getSession();
  if (!session) return { error: 'Sessão expirada.' };
  const pix = String(formData.get('pix_key') || '').trim();
  const res = await updatePerfil(session.sub, { pix_key: pix || null });
  if (!res.ok) return { error: res.error || 'Falha ao salvar.' };
  return { ok: true };
}
