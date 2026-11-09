/**
 * Pedidos para ser parceiro, vindos de /sejaparceiro (migration 00122,
 * painel.parceiro_pedidos). O dono aprova ou recusa em /admin/parceiros.
 * Aprovar cria o perfil do parceiro com senha aleatória e troca obrigatória
 * no 1º acesso. Server-only.
 */
import { painelDb } from '@/lib/supabase/server';

export interface PedidoParceiro {
  id: string;
  nome: string;
  email: string;
  whatsapp: string | null;
  instagram: string | null;
  status: 'pendente' | 'aprovado' | 'recusado';
  perfil_id: string | null;
  criado_em: string;
  decidido_em: string | null;
}

export async function inserirPedidoParceiro(p: {
  nome: string;
  email: string;
  whatsapp: string | null;
  instagram: string | null;
}): Promise<{ error: { code?: string; message: string } | null }> {
  const { error } = await painelDb().from('parceiro_pedidos').insert(p);
  return { error: error ? { code: error.code, message: error.message } : null };
}

/** Já existe pedido pendente com este e-mail, ou parceiro com este e-mail? */
export async function emailJaNoPrograma(email: string): Promise<boolean> {
  const sb = painelDb();
  const [{ data: ped }, { data: perf }] = await Promise.all([
    sb.from('parceiro_pedidos').select('id').eq('email', email).eq('status', 'pendente').limit(1),
    sb.from('perfis').select('id').eq('email', email).limit(1),
  ]);
  return (ped?.length ?? 0) > 0 || (perf?.length ?? 0) > 0;
}

export async function pedidosDoSiteHoje(): Promise<number> {
  const desde = new Date(Date.now() - 86_400_000).toISOString();
  const { count } = await painelDb()
    .from('parceiro_pedidos')
    .select('id', { count: 'exact', head: true })
    .gt('criado_em', desde);
  return count ?? 0;
}

/** Pendentes primeiro; os decididos dos últimos 30 dias embaixo. Falha → lista vazia (tela não quebra). */
export async function listarPedidosParceiro(): Promise<PedidoParceiro[]> {
  const desde = new Date(Date.now() - 30 * 86_400_000).toISOString();
  const { data, error } = await painelDb()
    .from('parceiro_pedidos')
    .select('*')
    .or(`status.eq.pendente,criado_em.gt.${desde}`)
    .order('criado_em', { ascending: false })
    .limit(200);
  if (error) {
    console.error('[parceiro_pedidos] listar falhou:', error.message);
    return [];
  }
  const lista = (data as PedidoParceiro[]) ?? [];
  return [...lista.filter((p) => p.status === 'pendente'), ...lista.filter((p) => p.status !== 'pendente')];
}

export async function pedidoParceiro(id: string): Promise<PedidoParceiro | null> {
  const { data } = await painelDb().from('parceiro_pedidos').select('*').eq('id', id).maybeSingle();
  return (data as PedidoParceiro) ?? null;
}

export async function decidirPedidoParceiro(id: string, status: 'aprovado' | 'recusado', perfilId: string | null = null) {
  const { error } = await painelDb()
    .from('parceiro_pedidos')
    .update({ status, perfil_id: perfilId, decidido_em: new Date().toISOString() })
    .eq('id', id)
    .eq('status', 'pendente');
  return { ok: !error, error: error?.message };
}

/** "Maria Clara Souza" → "maria.souza" (sem acento, só a-z, 0-9 e ponto). */
export function usuarioDoNome(nome: string): string {
  const partes = nome
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(Boolean);
  const u = partes.length > 1 ? `${partes[0]}.${partes[partes.length - 1]}` : partes[0] || 'parceiro';
  return u.slice(0, 40);
}

/** "Maria Clara" → "MARIA" (1º nome, sem acento, maiúsculo). */
export function codigoDoNomeParceiro(nome: string): string {
  const primeiro = nome.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().split(/\s+/)[0] ?? '';
  return primeiro.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 20) || 'PARCEIRO';
}
