import { redirect } from 'next/navigation';
import { getSession, homeForRole } from '@/lib/auth/session';
import { AdminLogo } from '@/components/admin/AdminLogo';
import { LoginForm } from '@/components/admin/LoginForm';
import '../admin.css';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Ninho · Painel',
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  const session = getSession();
  if (session) redirect(homeForRole(session.role));

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-6 py-10">
      <div className="w-full max-w-sm">
        <p className="text-center text-2xl font-medium leading-tight text-ninho-grafite">
          Que bom te ver no{' '}
          <span className="font-bold text-ninho-roxo-escuro">Ninho</span>
        </p>
        <p className="mt-2 text-center text-sm text-ninho-cinza">
          Acesse seu painel para acompanhar os resultados.
        </p>

        <div className="my-8 flex flex-col items-center">
          <AdminLogo size={104} pulse />
          <span className="mt-2 text-lg font-bold tracking-[0.2em] text-ninho-roxo-escuro">
            NINHO
          </span>
        </div>

        <LoginForm />

        <p className="mt-8 text-center text-[11px] text-ninho-cinza">
          Acesso restrito à equipe Ninho.
        </p>
      </div>
    </main>
  );
}
