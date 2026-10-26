/**
 * Ninho · Instagram (aba /admin/instagram, pedido ENG-005)
 *
 * Os posts ficam em painel.instagram_posts (migration 00092 do Ninho-expo).
 * A Lívia sobe a semana como rascunho; o dono aprova aqui; a função
 * `instagram` publica sozinha no horário. Mudar legenda ou imagem depois do OK
 * devolve o post para rascunho (trigger no banco).
 */
import { painelDb } from '@/lib/supabase/server';

export type StatusPost = 'rascunho' | 'aprovado' | 'publicando' | 'publicado' | 'erro' | 'recusado';

export interface PostInstagram {
  id: string;
  slug: string;
  semana: string;
  formato: 'imagem' | 'carrossel';
  objetivo: string | null;
  vende: boolean;
  legenda: string;
  imagens: string[];
  agendado_para: string;
  status: StatusPost;
  ajuste: string | null;
  aprovado_em: string | null;
  publicado_em: string | null;
  permalink: string | null;
  erro: string | null;
  metricas: {
    reach?: number;
    views?: number;
    saved?: number;
    shares?: number;
    likes?: number;
    comments?: number;
    follows?: number;
    comentarios_saude?: { id: string; texto: string; em: string }[];
  } | null;
}

export interface ContaDia {
  dia: string;
  seguidores: number | null;
  alcance: number | null;
  visitas_perfil: number | null;
  online_por_hora: Record<string, number> | null;
}

export async function listarPosts(): Promise<PostInstagram[]> {
  const { data, error } = await painelDb()
    .from('instagram_posts')
    .select('*')
    .gte('agendado_para', new Date(Date.now() - 45 * 86_400_000).toISOString())
    .order('agendado_para', { ascending: true });
  if (error) throw new Error(`painel.instagram_posts: ${error.message}`);
  return (data ?? []) as PostInstagram[];
}

export async function listarConta(): Promise<ContaDia[]> {
  const { data, error } = await painelDb()
    .from('instagram_conta_dia')
    .select('dia, seguidores, alcance, visitas_perfil, online_por_hora')
    .order('dia', { ascending: false })
    .limit(60);
  if (error) throw new Error(`painel.instagram_conta_dia: ${error.message}`);
  return (data ?? []) as ContaDia[];
}

/** "seg 26/10 07:30" no fuso pedido. */
export function quando(iso: string, timeZone: 'America/Sao_Paulo' | 'Asia/Dubai'): string {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone, weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso)).replace('.', '').replace(',', '');
}

/** As 3 horas (em Brasília) com mais seguidores online. Vem em UTC da Meta. */
export function melhoresHoras(online: Record<string, number> | null): string[] {
  if (!online) return [];
  return Object.entries(online)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([h]) => `${String((Number(h) + 21) % 24).padStart(2, '0')}h`);
}
