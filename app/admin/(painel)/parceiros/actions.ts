'use server';

/**
 * Aprovar ou recusar pedido de parceiro (painel.parceiro_pedidos, 00122).
 * Aprovar cria o perfil do parceiro (role influencer) com usuário tirado do
 * nome (ex.: maria.souza), o código escolhido pelo dono e uma SENHA ALEATÓRIA
 * que aparece uma vez só na tela do dono; o parceiro troca no 1º acesso
 * (trocar_senha = true). Só o admin.
 */
import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/auth/guard';
import { senhaAleatoria } from '@/lib/auth/password';
import { appDb } from '@/lib/supabase/server';
import { painelDb } from '@/lib/supabase/server';
import { SITE_URL } from '@/lib/config';
import { createPerfil, normalizarCodigo, PROMO_CODE_RE } from '@/lib/painel/store';
import { decidirPedidoParceiro, pedidoParceiro, usuarioDoNome } from '@/lib/parceiros/pedidos';

export interface AprovarState {
  ok?: boolean;
  error?: string;
  login?: string;
  senha?: string;
  link?: string;
  codigo?: string;
}

async function usuarioLivre(base: string): Promise<string> {
  const sb = painelDb();
  for (let i = 0; i < 50; i++) {
    const u = i === 0 ? base : `${base}${i + 1}`;
    const { data } = await sb.from('perfis').select('id').eq('username', u).limit(1);
    if (!data?.length) return u;
  }
  return `${base}.${Date.now().toString(36).slice(-4)}`;
}

function num(v: FormDataEntryValue | null, padrao: number): number {
  const n = Number(String(v ?? '').replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : padrao;
}

export async function aprovarPedidoParceiro(_prev: AprovarState, fd: FormData): Promise<AprovarState> {
  requireRole('admin');
  const id = String(fd.get('id') || '');
  const pedido = await pedidoParceiro(id);
  if (!pedido || pedido.status !== 'pendente') return { error: 'Esse pedido já foi decidido.' };

  const codigo = normalizarCodigo(String(fd.get('codigo') || ''));
  if (!codigo || !PROMO_CODE_RE.test(codigo)) return { error: 'Código inválido: use de 2 a 40 letras, números, ponto, hífen ou _ (sem espaço).' };
  const { data: consultora } = await appDb().from('consultoras').select('id').eq('codigo', codigo).limit(1);
  if (consultora?.length) return { error: `O código ${codigo} já é de uma consultora de sono. Escolha outro.` };

  const percentual = Math.min(num(fd.get('percentual'), 25), 100);
  const meses = Math.round(num(fd.get('meses'), 1));
  const login = await usuarioLivre(usuarioDoNome(pedido.nome));
  const senha = senhaAleatoria();

  const res = await createPerfil({
    username: login,
    display_name: pedido.nome,
    email: pedido.email,
    password: senha,
    role: 'influencer',
    promo_code: codigo,
    commission_type: 'percentual',
    commission_percent: percentual,
    commission_duration_months: meses,
    trocar_senha: true,
  });
  if (!res.ok) return { error: res.error || 'Não consegui criar o parceiro.' };

  await decidirPedidoParceiro(id, 'aprovado', res.id ?? null);
  // NÃO revalida /admin/parceiros aqui: recarregar a lista tiraria o pedido dos
  // pendentes e o quadro com a senha provisória sumiria antes de o dono ver
  // (visto no teste de 09/11/2026). A lista atualiza ao recarregar a página.
  revalidatePath('/admin/perfis');
  return { ok: true, login, senha, codigo, link: `${SITE_URL}/r/${codigo.toLowerCase()}` };
}

export async function recusarPedidoParceiro(fd: FormData) {
  requireRole('admin');
  const id = String(fd.get('id') || '');
  if (id) await decidirPedidoParceiro(id, 'recusado');
  revalidatePath('/admin/parceiros');
}
