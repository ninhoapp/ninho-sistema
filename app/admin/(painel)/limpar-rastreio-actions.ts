'use server';

/**
 * Limpar os dados de rastreio do link de um parceiro ou de uma consultora
 * (cliques e downloads), principalmente depois dos testes (pedido do dono,
 * 09/11/2026). Pede a senha de login do admin, conferida aqui no servidor.
 *
 * NÃO apaga a atribuição das contas (indicacao_parceiro / consultora_indicacoes)
 * nem comissões ou pagamentos: só os eventos de clique e de download.
 */
import { revalidatePath, revalidateTag } from 'next/cache';
import { requireRole } from '@/lib/auth/guard';
import { verifyPassword } from '@/lib/auth/password';
import { getPerfil } from '@/lib/painel/store';
import { painelDb, appDb } from '@/lib/supabase/server';
import { CONSULTORAS_TAG } from '@/lib/consultoras';

export interface LimparState {
  error?: string;
  ok?: string;
}

type Tipo = 'consultora' | 'parceiro';

async function alvo(tipo: Tipo, id: string): Promise<{ codigo: string; nome: string } | null> {
  if (tipo === 'consultora') {
    const { data } = await appDb().from('consultoras').select('codigo, nome').eq('id', id).maybeSingle();
    return data?.codigo ? { codigo: String(data.codigo).toUpperCase(), nome: data.nome ?? 'consultora' } : null;
  }
  const { data } = await painelDb().from('perfis').select('promo_code, display_name, role').eq('id', id).maybeSingle();
  return data?.promo_code && data.role === 'influencer'
    ? { codigo: String(data.promo_code).toUpperCase(), nome: data.display_name ?? 'parceiro' }
    : null;
}

/** Quantos cliques e downloads seriam apagados (para mostrar antes). */
export async function contarRastreio(tipo: Tipo, id: string): Promise<{ cliques: number; downloads: number } | null> {
  requireRole('admin');
  const a = await alvo(tipo, id);
  if (!a) return null;
  const sb = painelDb();
  const cliques =
    tipo === 'consultora'
      ? sb.from('link_clicks').select('id', { count: 'exact', head: true }).eq('consultora_id', id)
      : sb.from('link_clicks').select('id', { count: 'exact', head: true }).eq('perfil_id', id).is('consultora_id', null);
  const downloads =
    tipo === 'consultora'
      ? sb.from('install_events').select('id', { count: 'exact', head: true }).eq('consultora_id', id)
      : sb.from('install_events').select('id', { count: 'exact', head: true }).eq('promo_code', a.codigo).is('consultora_id', null);
  const [c, d] = await Promise.all([cliques, downloads]);
  return { cliques: c.count ?? 0, downloads: d.count ?? 0 };
}

export async function limparRastreio(_prev: LimparState, fd: FormData): Promise<LimparState> {
  const session = requireRole('admin');
  const tipo = String(fd.get('tipo') ?? '') as Tipo;
  const id = String(fd.get('id') ?? '');
  if ((tipo !== 'consultora' && tipo !== 'parceiro') || !/^[0-9a-f-]{36}$/i.test(id)) return { error: 'Pedido inválido.' };

  // O campo da senha tem nome aleatório (o navegador não preenche sozinho).
  const campo = String(fd.get('campo') ?? '');
  const senha = /^k[a-z0-9]{6,20}$/.test(campo) ? String(fd.get(campo) ?? '') : '';
  if (!senha) return { error: 'Digite sua senha de login para confirmar.' };
  const perfil = await getPerfil(session.sub);
  if (!perfil || !verifyPassword(senha, perfil.password_hash)) return { error: 'Senha incorreta. Nada foi apagado.' };

  const a = await alvo(tipo, id);
  if (!a) return { error: 'Não encontrei esse link.' };

  const sb = painelDb();
  // Downloads primeiro (alguns apontam para um clique pelo click_id).
  const d =
    tipo === 'consultora'
      ? await sb.from('install_events').delete({ count: 'exact' }).eq('consultora_id', id)
      : await sb.from('install_events').delete({ count: 'exact' }).eq('promo_code', a.codigo).is('consultora_id', null);
  if (d.error) {
    console.error('[limpar-rastreio] downloads:', d.error.message);
    return { error: 'Não consegui apagar os downloads agora. Nada mais foi apagado.' };
  }
  const c =
    tipo === 'consultora'
      ? await sb.from('link_clicks').delete({ count: 'exact' }).eq('consultora_id', id)
      : await sb.from('link_clicks').delete({ count: 'exact' }).eq('perfil_id', id).is('consultora_id', null);
  if (c.error) {
    console.error('[limpar-rastreio] cliques:', c.error.message);
    return { error: `Apaguei ${d.count ?? 0} download(s), mas não consegui apagar os cliques agora.` };
  }

  revalidateTag(CONSULTORAS_TAG);
  revalidatePath('/admin', 'layout');
  return { ok: `Pronto: ${c.count ?? 0} clique(s) e ${d.count ?? 0} download(s) de ${a.codigo} apagados. As contas e comissões não mudaram.` };
}
