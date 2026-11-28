import { redirect } from 'next/navigation';
import { getSession, homeForRole } from '@/lib/auth/session';
import { AdminLogo } from '@/components/admin/AdminLogo';
import { LoginPortas } from '@/components/admin/LoginConsultoraForm';
import { SeletorIdioma } from '@/components/consultoras/IdiomaConsultora';
import { idiomaDoLogin } from '@/lib/i18n-consultora/servidor';
import { textos } from '@/lib/i18n-consultora';
import '../admin.css';

export const dynamic = 'force-dynamic';

export async function generateMetadata(props: { searchParams: Promise<{ lang?: string }> }) {
  const t = textos(await idiomaDoLogin((await props.searchParams).lang)).geral.topo;
  return { title: `Ninho · ${t.painel}`, robots: { index: false, follow: false } };
}

export default async function AdminLoginPage(props: { searchParams: Promise<{ porta?: string; lang?: string }> }) {
  const searchParams = await props.searchParams;
  const session = await getSession();
  if (session) redirect(homeForRole(session.role));
  // Antes de entrar: ?lang= → cookie do seletor → navegador → pt (25/11/2026).
  // O formulário da equipe (LoginForm) é do dono e fica em pt.
  const idioma = await idiomaDoLogin(searchParams.lang);
  const t = textos(idioma).geral.login;

  return (
    <main lang={idioma} className="flex min-h-screen items-center justify-center bg-white px-6 py-10">
      <div className="w-full max-w-sm">
        <p className="text-center text-2xl font-medium leading-tight text-ninho-grafite">
          {t.titulo}{' '}
          <span className="font-bold text-ninho-roxo-escuro">Ninho</span>
        </p>
        <p className="mt-2 text-center text-sm text-ninho-cinza">
          {t.sub}
        </p>

        <div className="my-8 flex flex-col items-center">
          <AdminLogo size={104} pulse />
          <span className="mt-2 text-lg font-bold tracking-[0.2em] text-ninho-roxo-escuro">
            NINHO
          </span>
        </div>

        <LoginPortas inicial={searchParams.porta === 'consultora' ? 'consultora' : 'equipe'} idioma={idioma} />

        <p className="mt-8 text-center text-[11px] text-ninho-cinza">
          {t.rodape}
        </p>
        <SeletorIdioma atual={idioma} className="mt-3 justify-center" />
      </div>
    </main>
  );
}
