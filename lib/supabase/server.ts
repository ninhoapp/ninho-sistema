/**
 * Ninho · Cliente Supabase (server-side only)
 *
 * Use SOMENTE em Server Actions, Route Handlers ou Server Components.
 * NUNCA exponha o service role key no cliente — sem prefixo NEXT_PUBLIC_.
 *
 * Projeto ÚNICO (o mesmo do app Ninho-expo), com duas visões:
 *
 *   appDb()    → schema `public`  — dados do app (profiles, subscriptions, …)
 *   painelDb() → schema `painel`  — dados só do painel (perfis de acesso,
 *                                   comissões, desfechos de lead, custos)
 *
 * O schema `painel` existe pra que a anon key do app nunca enxergue comissão,
 * PIX ou desfecho de lead: a migration revoga `usage` dele para `anon` e
 * `authenticated`, então só o service_role daqui lê.
 */
import { createClient } from '@supabase/supabase-js';

const authOpts = { persistSession: false, autoRefreshToken: false } as const;

/**
 * Nunca usar o cache de `fetch` do Next.js nas consultas ao banco.
 *
 * Sem isto, consultas idênticas feitas em rota de API (ex.: "esse visitante já
 * clicou no link?" em /r/<código>) voltavam a primeira resposta guardada: o
 * 2º clique do mesmo visitante contava como único (achado em 05/11/2026), e um
 * parceiro desativado poderia continuar com o link funcionando. O cache que o
 * painel quer é o `unstable_cache` explícito (lib/app-users.ts), não este.
 */
const semCache: typeof fetch = (input, init) => fetch(input, { ...init, cache: 'no-store' });

/**
 * Valida na chamada, não no import. Se fosse no topo do módulo, `next build`
 * quebraria em qualquer máquina sem .env.local — mesmo as páginas sendo todas
 * force-dynamic, o build carrega o grafo de módulos.
 */
function creds(): { url: string; key: string } {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) throw new Error('SUPABASE_URL não está definida no .env.local');
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY não está definida no .env.local');
  return { url, key };
}

// Um cliente por processo, não por chamada: o cliente é stateless (sem sessão,
// service_role) e recriá-lo a cada query custava alocação à toa em toda tela.
function criarPainel() {
  const { url, key } = creds();
  return createClient(url, key, { auth: authOpts, db: { schema: 'painel' }, global: { fetch: semCache } });
}
function criarApp() {
  const { url, key } = creds();
  return createClient(url, key, { auth: authOpts, global: { fetch: semCache } });
}
let _painel: ReturnType<typeof criarPainel> | null = null;
let _app: ReturnType<typeof criarApp> | null = null;

/** Tabelas do painel (schema `painel`). */
export function painelDb() {
  return (_painel ??= criarPainel());
}

/** Tabelas do app (schema `public`) — leitura de usuários e assinaturas. */
export function appDb() {
  return (_app ??= criarApp());
}
