/**
 * Guardas de sessão para Server Components / Server Actions do painel.
 * Server-only.
 *
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │ ESTA É A ÚNICA PROTEÇÃO DO /admin — e é suficiente.                     │
 * │                                                                          │
 * │ Não existe middleware.ts neste projeto, de propósito. Middleware roda    │
 * │ no Edge Runtime, e o bundler do Edge na Vercel não resolve o alias `@/`, │
 * │ o que quebrava o deploy com "The Edge Function middleware is             │
 * │ referencing unsupported modules". O middleque só checava a PRESENÇA do   │
 * │ cookie e redirecionava — exatamente o que requireSession() faz aqui,     │
 * │ só que melhor: aqui a assinatura HMAC é de fato verificada.              │
 * │                                                                          │
 * │ Cobertura: todas as rotas do painel vivem sob app/admin/(painel)/, cujo  │
 * │ layout chama requireSession() antes de renderizar qualquer coisa.        │
 * │ /admin/login é público por definição e /admin só redireciona.            │
 * │                                                                          │
 * │ Se for criar rota nova em /admin, ela PRECISA ficar dentro de (painel)   │
 * │ ou chamar requireSession() explicitamente.                               │
 * └─────────────────────────────────────────────────────────────────────────┘
 */
import { redirect } from 'next/navigation';
import { getSession, type Role, type SessionData } from '@/lib/auth/session';

export function requireSession(): SessionData {
  const s = getSession();
  if (!s) redirect('/admin/login');
  return s;
}

export function requireRole(roles: Role | Role[]): SessionData {
  const s = requireSession();
  const allowed = Array.isArray(roles) ? roles : [roles];
  if (!allowed.includes(s.role)) {
    // Cada papel cai na sua própria home se tentar acessar outra área.
    redirect('/admin');
  }
  return s;
}
