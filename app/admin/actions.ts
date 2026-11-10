'use server';

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { ipDe } from '@/lib/atribuicao';
import {
  ERRO_MUITAS_TENTATIVAS,
  limparFalhasDeLogin,
  loginBloqueado,
  registrarFalhaDeLogin,
} from '@/lib/auth/login-limite';
import { findPerfilByLogin, getPerfil, setPassword, updatePerfil } from '@/lib/painel/store';
import { verifyPassword } from '@/lib/auth/password';
import { erroSenhaFraca } from '@/lib/auth/senha-forte';
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

  // Trava contra adivinhação de senha (lib/auth/login-limite.ts): conta só os erros.
  const ip = ipDe(headers());
  if (loginBloqueado(login, ip)) return { error: ERRO_MUITAS_TENTATIVAS };

  // Falha de infraestrutura (env faltando, schema não exposto, permissão) não
  // pode se disfarçar de credencial errada — são diagnósticos completamente
  // diferentes, e confundir os dois custa horas.
  let perfil;
  try {
    perfil = await findPerfilByLogin(login);
  } catch (e) {
    console.error('[admin/signIn] falha ao consultar o banco:', e);
    return {
      error:
        'Não consegui acessar o banco. Confira SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY, e se o schema "painel" está em Settings > API > Exposed schemas.',
    };
  }

  if (!perfil || !verifyPassword(password, perfil.password_hash)) {
    registrarFalhaDeLogin(login, ip);
    return { error: 'Usuário ou senha incorretos.' };
  }
  limparFalhasDeLogin(login, ip);

  setSessionCookie({
    sub: perfil.id,
    username: perfil.username,
    role: perfil.role,
    name: perfil.display_name,
  });
  // Senha provisória: troca antes de entrar (09/11/2026).
  if (perfil.trocar_senha) redirect('/admin/trocar-senha');
  redirect(homeForRole(perfil.role));
}

/** 1º acesso com senha provisória: a pessoa cria a própria senha. */
export async function trocarSenhaProvisoria(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = getSession();
  if (!session) return { error: 'Sessão expirada. Entre de novo.' };
  const nova = String(formData.get('nova') || '');
  const confirma = String(formData.get('confirma') || '');
  if (nova !== confirma) return { error: 'A confirmação não confere.' };
  const perfil = await getPerfil(session.sub);
  if (!perfil || !perfil.active) return { error: 'Sessão expirada. Entre de novo.' };
  const fraca = erroSenhaFraca(nova, [perfil.username, perfil.display_name, perfil.email]);
  if (fraca) return { error: fraca };
  if (verifyPassword(nova, perfil.password_hash)) return { error: 'Escolha uma senha diferente da provisória.' };
  const res = await setPassword(perfil.id, nova, false);
  if (!res.ok) return { error: res.error || 'Falha ao salvar.' };
  redirect(homeForRole(perfil.role));
}

/** Consultora: e-mail liberado + código de 6 dígitos gerado no app. */
export async function signInConsultora(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get('email') || '');
  const codigo = String(formData.get('codigo') || '');
  if (!email.trim() || !codigo.trim()) return { error: 'Preencha o e-mail e o código.' };
  let res;
  try {
    const { loginConsultora } = await import('@/lib/consultoras-login');
    res = await loginConsultora(email, codigo);
  } catch (e) {
    console.error('[admin/signInConsultora] falha no banco:', e);
    return { error: 'Não consegui conferir agora. Tente de novo em instantes.' };
  }
  if (!res.perfil) return { error: res.error || 'Não consegui entrar.' };
  setSessionCookie({
    sub: res.perfil.id,
    username: res.perfil.username,
    role: 'consultora',
    name: res.perfil.display_name,
  });
  redirect('/admin/consultora');
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

  if (nova !== confirma) return { error: 'A confirmação não confere.' };

  const perfil = await getPerfil(session.sub);
  if (!perfil || !verifyPassword(atual, perfil.password_hash)) {
    return { error: 'Senha atual incorreta.' };
  }
  const fraca = erroSenhaFraca(nova, [perfil.username, perfil.display_name, perfil.email]);
  if (fraca) return { error: fraca };
  if (nova === atual) return { error: 'A nova senha tem que ser diferente da atual.' };

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
