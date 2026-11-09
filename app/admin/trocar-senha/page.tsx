import { redirect } from 'next/navigation';
import { requireSession } from '@/lib/auth/guard';
import { homeForRole } from '@/lib/auth/session';
import { getPerfil } from '@/lib/painel/store';
import { AdminLogo } from '@/components/admin/AdminLogo';
import { FormTrocarSenha } from '@/components/admin/FormTrocarSenha';
import '../admin.css';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Ninho · Crie sua senha',
  robots: { index: false, follow: false },
};

/**
 * 1º acesso com senha provisória (migration 00122): fora do layout (painel)
 * de propósito, porque o layout manda para cá quem tem trocar_senha. Quem não
 * precisa trocar volta para a própria home.
 */
export default async function TrocarSenhaPage() {
  const s = requireSession();
  const perfil = await getPerfil(s.sub);
  if (!perfil || !perfil.active) redirect('/admin/login?erro=sessao');
  if (!perfil.trocar_senha) redirect(homeForRole(perfil.role));

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-6 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center">
          <AdminLogo size={72} />
        </div>
        <h1 className="text-center text-2xl font-black tracking-tight text-[#24164F]">Olá, {perfil.display_name.split(' ')[0]}</h1>
        <p className="mt-2 text-center text-sm text-ninho-cinza">
          Você entrou com uma senha provisória. Crie a sua senha para continuar.
        </p>
        <FormTrocarSenha />
      </div>
    </main>
  );
}
