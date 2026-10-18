/**
 * Ninho · Empresa virtual (o prédio em /admin/empresa).
 *
 * O organograma vem de `organograma.json`, que é cópia de
 * Ninho-expo/docs/empresa/organograma.json (fonte única), feita por
 * `node scripts/empresa/copiar-organograma.mjs` lá no Ninho-expo.
 *
 * A atividade vem de `painel.empresa_atividade`, gravada pela edge function
 * `empresa-atividade` a partir dos hooks do Claude Code no computador do dono.
 * O mural vem de `painel.aprovacoes`.
 *
 * Server-only (usa a service_role).
 */
import { painelDb } from '@/lib/supabase/server';
import organograma from './organograma.json';

export type TipoPessoa = 'sup' | 'agente' | 'skill' | 'humano' | 'produto';
export type Estado = 'trabalhando' | 'esperando' | 'livre' | 'desativado';

export interface Pessoa {
  id: string;
  nome: string;
  cargo: string;
  tipo: TipoPessoa;
  agente?: string;
  skills?: string[];
  principal?: boolean;
}

export interface Setor {
  id: string;
  nome: string;
  andar: string;
  desativado?: boolean;
  abas: string[];
  pessoas: Pessoa[];
}

export interface Atividade {
  id: number;
  funcionario: string;
  setor: string;
  tipo: string;
  status: 'trabalhando' | 'concluido' | 'erro';
  tarefa: string | null;
  inicio: string;
  fim: string | null;
}

export interface Aprovacao {
  id: number;
  titulo: string;
  setor: string | null;
  pedido_por: string | null;
  status: string;
  criado_em: string;
}

export interface EstadoPessoa {
  estado: Estado;
  /** Tarefa atual (trabalhando) ou a última feita. */
  agora: string | null;
  desde: string | null;
  historico: { quando: string; tarefa: string; status: string }[];
}

export const SETORES: Setor[] = (organograma as { setores: Setor[] }).setores;

/** Abas atuais do painel → endereço. Usado nos andares para levar à aba. */
export const ABA_HREF: Record<string, string> = {
  'Visão geral': '/admin/visao-geral',
  KPI: '/admin/kpi',
  'Gerenciar perfis': '/admin/perfis',
  'Minha conta': '/admin/conta',
  'Usuários ativos': '/admin/usuarios',
  'Análise de dados': '/admin/analise',
  'Faturamento e lucro': '/admin/faturamento',
  Despesas: '/admin/despesas',
  Repasses: '/admin/repasses',
  Leads: '/admin/leads',
  Conversores: '/admin/conversores',
  Conversões: '/admin/conversoes',
};

/** Registro "trabalhando" mais velho que isto é sessão que fechou sem o fim: conta como livre. */
const ABERTO_MAX_MS = 2 * 60 * 60 * 1000;

export async function lerAtividade(dias = 7): Promise<Atividade[]> {
  const desde = new Date(Date.now() - dias * 86_400_000).toISOString();
  const { data, error } = await painelDb()
    .from('empresa_atividade')
    .select('id, funcionario, setor, tipo, status, tarefa, inicio, fim')
    .gte('inicio', desde)
    .order('inicio', { ascending: false })
    .limit(500);
  if (error) throw new Error(`Falha ao ler a atividade da empresa: ${error.message}`);
  return (data ?? []) as Atividade[];
}

export async function lerAprovacoesAbertas(): Promise<Aprovacao[]> {
  const { data, error } = await painelDb()
    .from('aprovacoes')
    .select('id, titulo, setor, pedido_por, status, criado_em')
    .eq('status', 'esperando')
    .order('criado_em', { ascending: true });
  if (error) throw new Error(`Falha ao ler o mural de aprovações: ${error.message}`);
  return (data ?? []) as Aprovacao[];
}

/** Estado de cada pessoa a partir da atividade (mais recente primeiro). */
export function estadosPorPessoa(
  atividade: Atividade[],
  aprovacoes: Aprovacao[],
  agora: Date = new Date(),
): Record<string, EstadoPessoa> {
  const porPessoa = new Map<string, Atividade[]>();
  for (const a of atividade) {
    const lista = porPessoa.get(a.funcionario) ?? [];
    lista.push(a);
    porPessoa.set(a.funcionario, lista);
  }
  const pedindoOk = new Set(aprovacoes.map((a) => a.pedido_por).filter(Boolean) as string[]);

  const out: Record<string, EstadoPessoa> = {};
  for (const s of SETORES) {
    for (const p of s.pessoas) {
      const lista = porPessoa.get(p.id) ?? [];
      const aberta = lista.find(
        (a) => a.status === 'trabalhando' && agora.getTime() - Date.parse(a.inicio) < ABERTO_MAX_MS,
      );
      const ultima = lista[0];
      const estado: Estado = s.desativado
        ? 'desativado'
        : aberta
          ? 'trabalhando'
          : pedindoOk.has(p.id)
            ? 'esperando'
            : 'livre';
      out[p.id] = {
        estado,
        agora: (aberta ?? ultima)?.tarefa ?? null,
        desde: (aberta ?? ultima)?.inicio ?? null,
        historico: lista.slice(0, 5).map((a) => ({
          quando: a.inicio,
          tarefa: a.tarefa ?? '(sem descrição)',
          status: a.status === 'trabalhando' && a !== aberta ? 'concluido' : a.status,
        })),
      };
    }
  }
  return out;
}

/** Itens do mural resolvidos nos últimos dias (vão para "O que foi feito"). */
export async function lerAprovacoesResolvidas(dias = 7): Promise<(Aprovacao & { atualizado_em: string })[]> {
  const desde = new Date(Date.now() - dias * 86_400_000).toISOString();
  const { data, error } = await painelDb()
    .from('aprovacoes')
    .select('id, titulo, setor, pedido_por, status, criado_em, atualizado_em')
    .neq('status', 'esperando')
    .gte('atualizado_em', desde)
    .order('atualizado_em', { ascending: false })
    .limit(50);
  if (error) throw new Error(`Falha ao ler o mural de aprovações: ${error.message}`);
  return (data ?? []) as (Aprovacao & { atualizado_em: string })[];
}

export type StatusAprovacao = 'aprovado' | 'feito' | 'recusado';

/** O dono decide um item do mural direto no prédio. */
export async function decidirAprovacao(id: number, status: StatusAprovacao): Promise<void> {
  const { error } = await painelDb()
    .from('aprovacoes')
    .update({ status, atualizado_em: new Date().toISOString() })
    .eq('id', id)
    .eq('status', 'esperando');
  if (error) throw new Error(`Falha ao atualizar o mural: ${error.message}`);
}
