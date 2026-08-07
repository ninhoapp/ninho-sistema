/**
 * Ninho · Leitura dos usuários do app para o painel. Server-only.
 *
 * O estado de assinatura NÃO é recalculado aqui — vem pronto da view
 * `public.assinatura_estado` (migration 00022), que é a fonte única. Se a
 * regra de quem é pagante mudar, muda no SQL e o painel acompanha sozinho.
 */
import { appDb } from '@/lib/supabase/server';

export type Estado = 'trial_ativo' | 'trial_expirado' | 'pagante' | 'churn' | 'free';

export interface AppUser {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
  estado: Estado;
  plan: 'free' | 'premium' | null;
  plan_interval: 'mensal' | 'anual' | null;
  trial_ends_at: string | null;
  current_period_end: string | null;
}

/** True quando o painel consegue ler o banco. Falso = telas vazias, sem chute. */
export function appDbConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

interface ProfileRow {
  id: string;
  full_name: string | null;
  phone: string | null;
  created_at: string;
}

interface EstadoRow {
  profile_id: string;
  plan: 'free' | 'premium' | null;
  plan_interval: 'mensal' | 'anual' | null;
  trial_ends_at: string | null;
  current_period_end: string | null;
  estado: Estado;
}

/**
 * E-mail mora em `auth.users`, não em `public.profiles` — o conversor precisa
 * dele pra contatar. Só o service_role lê essa tabela.
 */
async function fetchEmails(): Promise<Map<string, string>> {
  const sb = appDb();
  const out = new Map<string, string>();
  const perPage = 1000;
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await sb.auth.admin.listUsers({ page, perPage });
    if (error || !data?.users?.length) break;
    for (const u of data.users) {
      if (u.email) out.set(u.id, u.email);
    }
    if (data.users.length < perPage) break;
  }
  return out;
}

export async function fetchAppUsers(): Promise<AppUser[]> {
  if (!appDbConfigured()) return [];
  const sb = appDb();

  // profiles e a view não têm FK declarada entre si, então PostgREST não faz o
  // embed — busca separado e junta aqui.
  const [profilesRes, estadosRes, emails] = await Promise.all([
    sb
      .from('profiles')
      .select('id,full_name,phone,created_at')
      .is('deleted_at', null)
      .order('created_at', { ascending: false }),
    sb
      .from('assinatura_estado')
      .select('profile_id,plan,plan_interval,trial_ends_at,current_period_end,estado'),
    fetchEmails(),
  ]);

  const profiles = (profilesRes.data as ProfileRow[] | null) ?? [];
  const estados = (estadosRes.data as EstadoRow[] | null) ?? [];
  const estadoByProfile = new Map(estados.map((e) => [e.profile_id, e]));

  return profiles.map((p) => {
    const e = estadoByProfile.get(p.id);
    return {
      id: p.id,
      name: p.full_name,
      email: emails.get(p.id) ?? null,
      phone: p.phone,
      created_at: p.created_at,
      // Sem linha de assinatura o usuário é 'free'. Depois da 00022 isso não
      // deve acontecer (trigger + backfill), mas não vale inventar estado.
      estado: e?.estado ?? 'free',
      plan: e?.plan ?? null,
      plan_interval: e?.plan_interval ?? null,
      trial_ends_at: e?.trial_ends_at ?? null,
      current_period_end: e?.current_period_end ?? null,
    };
  });
}
