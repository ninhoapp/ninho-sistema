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

/** Tabelas do painel (schema `painel`). */
export function painelDb() {
  const { url, key } = creds();
  return createClient(url, key, { auth: authOpts, db: { schema: 'painel' } });
}

/** Tabelas do app (schema `public`) — leitura de usuários e assinaturas. */
export function appDb() {
  const { url, key } = creds();
  return createClient(url, key, { auth: authOpts });
}
