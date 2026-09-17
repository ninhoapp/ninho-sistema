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
  /** Fuso declarado no cadastro — é o que dá o país aproximado no painel. */
  timezone: string | null;
  estado: Estado;
  plan: 'free' | 'basico' | 'premium' | null;
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
  timezone: string | null;
}

interface EstadoRow {
  profile_id: string;
  plan: 'free' | 'basico' | 'premium' | null;
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
      .select('id,full_name,phone,created_at,timezone')
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
      timezone: p.timezone,
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

// ─── Status da conta (rótulo legível) ──────────────────────────────────
//
// O `estado` cru da view responde "paga ou não paga". A tela de usuários
// precisa de mais: QUAL plano e em QUAL ciclo, senão Premium anual e
// Básico mensal viram a mesma linha "pagante" e o filtro da coluna não
// serve pra nada.
export type StatusConta =
  | 'Free trial ativo'
  | 'Free trial expirado'
  | 'Premium mensal'
  | 'Premium anual'
  | 'Básico mensal'
  | 'Básico anual'
  | 'Churn'
  | 'Cadastrado';

export function accountStatus(u: AppUser): StatusConta {
  if (u.estado === 'pagante') {
    const anual = u.plan_interval === 'anual';
    if (u.plan === 'basico') return anual ? 'Básico anual' : 'Básico mensal';
    return anual ? 'Premium anual' : 'Premium mensal';
  }
  if (u.estado === 'trial_ativo') return 'Free trial ativo';
  if (u.estado === 'trial_expirado') return 'Free trial expirado';
  if (u.estado === 'churn') return 'Churn';
  return 'Cadastrado';
}

/** Quem conta como assinante de verdade — quem paga, em qualquer plano. */
export const STATUS_ASSINANTE: StatusConta[] = [
  'Premium mensal',
  'Premium anual',
  'Básico mensal',
  'Básico anual',
];

// ─── País ──────────────────────────────────────────────────────────────
const BR_ZONES = [
  'sao_paulo', 'fortaleza', 'recife', 'bahia', 'manaus', 'cuiaba', 'belem',
  'maceio', 'campo_grande', 'porto_velho', 'boa_vista', 'rio_branco',
  'noronha', 'araguaina', 'santarem',
];

/** País aproximado a partir do timezone — não existe coluna de país. */
export function countryFromTimezone(tz: string | null): string {
  if (!tz) return '—';
  const t = tz.toLowerCase();
  if (BR_ZONES.some((z) => t.includes(z))) return 'Brasil';
  if (t.startsWith('america/')) return 'Américas';
  if (t.startsWith('europe/')) return 'Europa';
  if (t.startsWith('africa/')) return 'África';
  if (t.startsWith('asia/')) return 'Ásia';
  if (t.startsWith('australia/') || t.startsWith('pacific/')) return 'Oceania';
  return tz.split('/').pop()?.replace(/_/g, ' ') || tz;
}

// ─── Uso por usuário ───────────────────────────────────────────────────
/**
 * Métricas de uso — base do funil "baixou → cadastrou → usou de fato →
 * assina".
 *
 * Vem pronta do banco (RPC `get_uso_por_usuario`, migration 00063 do app)
 * porque o PostgREST corta em 1.000 linhas e `activities` cresce rápido:
 * agregar no Postgres é a única forma de não perder linha em silêncio.
 * A regra de "registro real" sai inteira da view `registros_reais`, que é
 * a fonte única — nada de recopiar filtro aqui.
 *
 * NOTA sobre `diasAbertura`: só há histórico a partir de 19/08/2026, quando
 * `analytics_events` começou a gravar `app_aberto`. O número começa do zero
 * pra todo mundo e vai enchendo; enquanto não amadurece, quem consome cai
 * em `diasRegistro`.
 */
export interface UsoUsuario {
  registros: number;
  diasRegistro: number;
  ultimoRegistroAt: string | null;
  diasAbertura: number;
  ultimoAppAbertoAt: string | null;
  /** Bebês vinculados hoje. Zero = onboarding não concluído. */
  bebes: number;
  /** Primeiro vínculo com um bebê — o relógio das métricas de uso. */
  primeiroBebeEm: string | null;
  sistema: 'ios' | 'android' | 'web' | null;
  appVersion: string | null;
}

interface UsoRow {
  profile_id: string;
  registros: number;
  dias_registro: number;
  ultimo_registro_at: string | null;
  dias_abertura: number;
  ultimo_app_aberto_at: string | null;
  bebes: number;
  primeiro_bebe_em: string | null;
  sistema: 'ios' | 'android' | 'web' | null;
  app_version: string | null;
}

export async function fetchUsoPorUsuario(): Promise<Map<string, UsoUsuario>> {
  const map = new Map<string, UsoUsuario>();
  if (!appDbConfigured()) return map;

  const { data, error } = await appDb().rpc('get_uso_por_usuario');
  if (error) {
    // Falhar calado aqui viraria uma tabela inteira de zeros passando por
    // "ninguém usa o app" — o tipo de número que muda decisão de produto.
    console.error('[painel] get_uso_por_usuario falhou:', error.message);
    return map;
  }

  for (const r of (data as UsoRow[] | null) ?? []) {
    map.set(r.profile_id, {
      registros: Number(r.registros) || 0,
      diasRegistro: Number(r.dias_registro) || 0,
      ultimoRegistroAt: r.ultimo_registro_at,
      diasAbertura: Number(r.dias_abertura) || 0,
      ultimoAppAbertoAt: r.ultimo_app_aberto_at,
      bebes: Number(r.bebes) || 0,
      primeiroBebeEm: r.primeiro_bebe_em,
      sistema: r.sistema,
      appVersion: r.app_version,
    });
  }
  return map;
}
