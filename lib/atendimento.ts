/**
 * Atendimento dentro do app (a Nina) — dados da aba /admin/atendimento.
 * Server-only. Tabelas no schema public (migration 00085 do Ninho-expo).
 *
 * Responder uma pendência NÃO grava direto aqui: chama a edge function
 * `atendimento` (acao "responder_pendencia"), que escreve a mensagem no tom
 * da Nina, no idioma da pessoa, e manda push + sininho. Assim a chave da
 * Anthropic e o token da Expo ficam só no Supabase.
 */
import { appDb } from '@/lib/supabase/server';
import { lerTudo } from '@/lib/supabase/paginar';

export type StatusPendencia = 'aberta' | 'respondida' | 'descartada';

export interface MensagemConversa {
  role: 'user' | 'assistant' | 'equipe';
  content: string;
  created_at: string;
}

export interface Pendencia {
  id: string;
  profile_id: string;
  resumo: string;
  categoria: string;
  idioma: 'pt' | 'en';
  status: StatusPendencia;
  resposta: string | null;
  respondida_em: string | null;
  created_at: string;
  nome: string | null;
  email: string | null;
  /** Últimas mensagens da conversa até a pendência abrir (contexto). */
  conversa: MensagemConversa[];
}

export interface Aprendizado {
  id: string;
  pergunta: string;
  resposta: string;
  ativo: boolean;
  created_at: string;
}

export interface ResumoAtendimento {
  conversasHoje: number;
  mensagensHoje: number;
  abertas: number;
  respondidas7d: number;
}

export const NOME_CATEGORIA: Record<string, string> = {
  assinatura: 'Assinatura',
  conta: 'Conta',
  cuidadores: 'Cuidadores',
  como_usar: 'Como usar',
  previsao: 'Previsão',
  bug: 'Problema no app',
  sugestao: 'Sugestão',
  outro: 'Outro',
};

/** Meia-noite de hoje em Dubai (UTC+4), como o resto do painel. */
function inicioHojeDubai(): string {
  const agora = new Date();
  const dubai = new Date(agora.getTime() + 4 * 3_600_000);
  dubai.setUTCHours(0, 0, 0, 0);
  return new Date(dubai.getTime() - 4 * 3_600_000).toISOString();
}

async function emailsDe(ids: string[]): Promise<Map<string, string | null>> {
  const db = appDb();
  const pares = await Promise.all(
    ids.map(async (id) => {
      const { data } = await db.auth.admin.getUserById(id);
      return [id, data?.user?.email ?? null] as const;
    }),
  );
  return new Map(pares);
}

export async function fetchPendencias(status: StatusPendencia[], limite = 50): Promise<Pendencia[]> {
  const db = appDb();
  const { data, error } = await db
    .from('atendimento_pendencias')
    .select('id, profile_id, resumo, categoria, idioma, status, resposta, respondida_em, created_at')
    .in('status', status)
    .order('created_at', { ascending: status.includes('aberta') })
    .limit(limite);
  if (error) throw new Error(error.message);
  const linhas = (data ?? []) as Omit<Pendencia, 'nome' | 'email' | 'conversa'>[];
  if (linhas.length === 0) return [];

  const ids = [...new Set(linhas.map((p) => p.profile_id))];
  const [perfis, emails, conversas] = await Promise.all([
    db.from('profiles').select('id, full_name').in('id', ids),
    emailsDe(ids),
    Promise.all(
      linhas.map((p) =>
        db
          .from('atendimento_mensagens')
          .select('role, content, created_at')
          .eq('profile_id', p.profile_id)
          // Até 1 minuto depois de abrir: pega a resposta da Nina que abriu.
          .lte('created_at', new Date(Date.parse(p.created_at) + 60_000).toISOString())
          .order('created_at', { ascending: false })
          .limit(8),
      ),
    ),
  ]);
  const nomes = new Map(((perfis.data ?? []) as { id: string; full_name: string | null }[]).map((p) => [p.id, p.full_name]));

  return linhas.map((p, i) => ({
    ...p,
    nome: nomes.get(p.profile_id) ?? null,
    email: emails.get(p.profile_id) ?? null,
    conversa: (((conversas[i].data ?? []) as MensagemConversa[]) ?? []).reverse(),
  }));
}

export async function fetchAprendizados(): Promise<Aprendizado[]> {
  const { data, error } = await appDb()
    .from('atendimento_aprendizado')
    .select('id, pergunta, resposta, ativo, created_at')
    .order('created_at', { ascending: false })
    .limit(300);
  if (error) throw new Error(error.message);
  return (data ?? []) as Aprendizado[];
}

/** Pendências abertas e a mais antiga — para o alerta vermelho no topo do painel. */
export async function fetchAlertaAtendimento(): Promise<{ abertas: number; maisAntiga: string | null }> {
  const { data, error } = await appDb()
    .from('atendimento_pendencias')
    .select('created_at')
    .eq('status', 'aberta')
    .order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  const linhas = (data ?? []) as { created_at: string }[];
  return { abertas: linhas.length, maisAntiga: linhas[0]?.created_at ?? null };
}

export async function fetchResumoAtendimento(): Promise<ResumoAtendimento> {
  const db = appDb();
  const hoje = inicioHojeDubai();
  const seteDias = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const [msgsHoje, abertas, respondidas] = await Promise.all([
    lerTudo<{ id: string; profile_id: string }>('atendimento hoje', (de, ate) =>
      db.from('atendimento_mensagens').select('id, profile_id').eq('role', 'user').gte('created_at', hoje).order('id').range(de, ate),
    ),
    db.from('atendimento_pendencias').select('id', { count: 'exact', head: true }).eq('status', 'aberta'),
    db
      .from('atendimento_pendencias')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'respondida')
      .gte('respondida_em', seteDias),
  ]);
  const linhas = msgsHoje.data;
  return {
    conversasHoje: new Set(linhas.map((l) => l.profile_id)).size,
    mensagensHoje: linhas.length,
    abertas: abertas.count ?? 0,
    respondidas7d: respondidas.count ?? 0,
  };
}

/**
 * Preço da API da Anthropic por modelo, em US$ por milhão de tokens — tabela
 * oficial, conferida em 19/10/2026. Cada resposta grava o modelo que a gerou
 * (coluna `modelo`, ex. "claude-haiku-5-5 · atendimento-…"), então o custo
 * antigo continua certo depois de uma troca. Modelo novo na função
 * `atendimento`: acrescente aqui.
 * Cache: leitura custa 0,1× a entrada; escrita, 1,25× (cache de 5 min, o do
 * Sonnet) ou 2× (cache de 1 hora, o do Haiku).
 */
const PRECOS_USD_POR_MILHAO: Record<string, { entrada: number; saida: number; cacheLido: number; cacheCriado: number }> = {
  'claude-haiku-5-5': { entrada: 0.1, saida: 0.5, cacheLido: 0.01, cacheCriado: 0.2 },
  'claude-sonnet-5': { entrada: 2, saida: 10, cacheLido: 0.2, cacheCriado: 2.5 },
};

function precoDo(modelo: string | null) {
  const id = (modelo ?? '').split(' ')[0];
  // Sem modelo (respostas da primeira versão) = Sonnet, o único usado antes.
  return PRECOS_USD_POR_MILHAO[id] ?? PRECOS_USD_POR_MILHAO['claude-sonnet-5'];
}

export interface CustoAtendimento {
  dias: number;
  respostas: number;
  pessoas: number;
  usd: number;
  /** Média por resposta da Nina, em US$. */
  usdPorResposta: number | null;
}

/** Custo REAL da Nina no período: soma os tokens gravados em cada resposta. */
export async function fetchCustoAtendimento(dias: number): Promise<CustoAtendimento> {
  const desde = new Date(Date.now() - dias * 86_400_000).toISOString();
  type Linha = {
    id: string;
    profile_id: string;
    tokens_entrada: number;
    tokens_saida: number;
    tokens_cache_lido: number;
    tokens_cache_criado: number;
    modelo: string | null;
  };
  const { data, error } = await lerTudo<Linha>('custo atendimento', (de, ate) =>
    appDb()
      .from('atendimento_mensagens')
      .select('id, profile_id, tokens_entrada, tokens_saida, tokens_cache_lido, tokens_cache_criado, modelo')
      .neq('role', 'user')
      .gte('created_at', desde)
      .order('id')
      .range(de, ate),
  );
  if (error) throw new Error(error.message);
  let usd = 0;
  let respostas = 0;
  for (const l of data) {
    const p = precoDo(l.modelo);
    const custo =
      (l.tokens_entrada * p.entrada + l.tokens_saida * p.saida + l.tokens_cache_lido * p.cacheLido + l.tokens_cache_criado * p.cacheCriado) /
      1_000_000;
    if (custo > 0) respostas += 1;
    usd += custo;
  }
  return {
    dias,
    respostas,
    pessoas: new Set(data.map((l) => l.profile_id)).size,
    usd,
    usdPorResposta: respostas > 0 ? usd / respostas : null,
  };
}

/** Chama a edge function, que entrega a resposta na conversa da pessoa. */
export async function responderPendencia(input: {
  pendencia_id: string;
  resposta: string;
  ensinar: boolean;
  pergunta_geral?: string;
  resposta_geral?: string;
}): Promise<{ mensagem?: string; push?: { enviados: number; erro?: string } }> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY não definidas.');
  const res = await fetch(`${url}/functions/v1/atendimento`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ acao: 'responder_pendencia', ...input }),
    cache: 'no-store',
  });
  const json = (await res.json().catch(() => ({}))) as { error?: string; mensagem?: string; push?: { enviados: number; erro?: string } };
  if (!res.ok) throw new Error(json.error ?? `Função respondeu ${res.status}`);
  return json;
}

export async function descartarPendencia(id: string): Promise<void> {
  const { error } = await appDb().from('atendimento_pendencias').update({ status: 'descartada' }).eq('id', id).eq('status', 'aberta');
  if (error) throw new Error(error.message);
}

export async function adicionarAprendizado(pergunta: string, resposta: string): Promise<void> {
  const { error } = await appDb().from('atendimento_aprendizado').insert({ pergunta, resposta });
  if (error) throw new Error(error.message);
}

export async function alternarAprendizado(id: string, ativo: boolean): Promise<void> {
  const { error } = await appDb().from('atendimento_aprendizado').update({ ativo }).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function excluirAprendizado(id: string): Promise<void> {
  const { error } = await appDb().from('atendimento_aprendizado').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
