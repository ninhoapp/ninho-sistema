'use server';

/**
 * "Limpar dados do link" (pedido do dono, 09/11/2026), principalmente para os
 * testes: apaga os CLIQUES (painel.link_clicks) e os DOWNLOADS
 * (painel.install_events) de um código de parceiro ou de consultora.
 *
 * NÃO mexe nas atribuições de contas (indicacao_parceiro,
 * consultora_indicacoes) nem em comissões ou pagamentos. Pede a senha de login
 * do admin, conferida no servidor (campo com nome aleatório).
 */
import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/auth/guard';
import { verifyPassword } from '@/lib/auth/password';
import { getPerfil } from '@/lib/painel/store';
import { painelDb } from '@/lib/supabase/server';

export interface LimparState {
  ok?: string;
  error?: string;
}

const UUID = /^[0-9a-f-]{36}$/i;

export async function limparDadosDoLink(_prev: LimparState, fd: FormData): Promise<LimparState> {
  const session = requireRole('admin');
  const tipo = String(fd.get('tipo') || '');
  const id = String(fd.get('id') || '');
  const campo = String(fd.get('campo') || '');
  const senha = /^k[a-z0-9]{6,20}$/.test(campo) ? String(fd.get(campo) ?? '') : '';
  if (!senha) return { error: 'Digite sua senha de login para confirmar.' };
  const admin = await getPerfil(session.sub);
  if (!admin || !verifyPassword(senha, admin.password_hash)) return { error: 'Senha incorreta. Nada foi apagado.' };
  if (!UUID.test(id) || (tipo !== 'parceiro' && tipo !== 'consultora')) return { error: 'Link não encontrado.' };

  const sb = painelDb();
  let cliques = 0;
  let downloads = 0;
  if (tipo === 'parceiro') {
    const p = await getPerfil(id);
    if (!p || p.role !== 'influencer') return { error: 'Parceiro não encontrado.' };
    // Downloads sem clique ligado (o casamento antigo); os com clique saem junto com o clique (cascade).
    if (p.promo_code) {
      const d = await sb.from('install_events').delete({ count: 'exact' }).eq('promo_code', p.promo_code.toUpperCase()).is('click_id', null);
      if (d.error) return { error: `Downloads: ${d.error.message}` };
      downloads += d.count ?? 0;
      const dc = await sb.from('install_events').select('id', { count: 'exact', head: true }).eq('promo_code', p.promo_code.toUpperCase()).not('click_id', 'is', null);
      downloads += dc.count ?? 0;
    }
    const c = await sb.from('link_clicks').delete({ count: 'exact' }).eq('perfil_id', p.id);
    if (c.error) return { error: `Cliques: ${c.error.message}` };
    cliques = c.count ?? 0;
  } else {
    // Consultora (colunas da 00112). Sem a 00112 não há nada gravado para ela.
    const dc = await sb.from('install_events').select('id', { count: 'exact', head: true }).eq('consultora_id', id);
    if (dc.error) return { ok: 'Nada para apagar: o rastreio do link da consultora ainda não está ligado.' };
    const d = await sb.from('install_events').delete({ count: 'exact' }).eq('consultora_id', id);
    if (d.error) return { error: `Downloads: ${d.error.message}` };
    downloads = d.count ?? 0;
    const c = await sb.from('link_clicks').delete({ count: 'exact' }).eq('consultora_id', id);
    if (c.error) return { error: `Cliques: ${c.error.message}` };
    cliques = c.count ?? 0;
  }
  revalidatePath('/admin/parceiros');
  revalidatePath('/admin/consultor');
  revalidatePath('/admin/parceiro');
  return { ok: `Apagados ${cliques} clique(s) e ${downloads} download(s). As contas atribuídas e as comissões continuam.` };
}
