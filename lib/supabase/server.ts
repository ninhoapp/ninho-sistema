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

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error('SUPABASE_URL não está definida no .env.local');
}
if (!serviceRoleKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY não está definida no .env.local');
}

const authOpts = { persistSession: false, autoRefreshToken: false } as const;

/** Tabelas do painel (schema `painel`). */
export function painelDb() {
  return createClient(supabaseUrl!, serviceRoleKey!, {
    auth: authOpts,
    db: { schema: 'painel' },
  });
}

/** Tabelas do app (schema `public`) — leitura de usuários e assinaturas. */
export function appDb() {
  return createClient(supabaseUrl!, serviceRoleKey!, { auth: authOpts });
}
