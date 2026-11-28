import { redirect } from 'next/navigation';
import { requireSession } from '@/lib/auth/guard';
import { homeForRole } from '@/lib/auth/session';
import { getPerfil } from '@/lib/painel/store';
import { AdminLogo } from '@/components/admin/AdminLogo';
import { FormTrocarSenha } from '@/components/admin/FormTrocarSenha';
import { IdiomaProvider } from '@/components/consultoras/IdiomaConsultora';
import { idiomaDaConsultora } from '@/lib/i18n-consultora/servidor';
import { textos } from '@/lib/i18n-consultora';
import '../admin.css';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const t = textos(await idiomaDaConsultora()).geral.trocarSenha;
  return { title: `Ninho · ${t.titulo}`, robots: { index: false, follow: false } };
}

/**
 * 1º acesso com senha provisória (migration 00122): fora do layout (painel)
 * de propósito, porque o layout manda para cá quem tem trocar_senha. Quem não
 * precisa trocar volta para a própria home.
 */
export default async function TrocarSenhaPage() {
  const s = await requireSession();
  const perfil = await getPerfil(s.sub);
  if (!perfil || !perfil.active) redirect('/admin/login?erro=sessao');
  if (!perfil.trocar_senha) redirect(homeForRole(perfil.role));
  // Consultora vê no idioma dela (quase nunca chega aqui: ela entra pelo código do app); os outros em pt.
  const idioma = await idiomaDaConsultora();
  const t = textos(idioma).geral.trocarSenha;

  return (
    <IdiomaProvider idioma={idioma}>
    <main lang={idioma} className="flex min-h-screen items-center justify-center bg-white px-6 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center">
          <AdminLogo size={72} />
        </div>
        <h1 className="text-center text-2xl font-black tracking-tight text-[#24164F]">{t.ola(perfil.display_name.split(' ')[0])}</h1>
        <p className="mt-2 text-center text-sm text-ninho-cinza">
          {t.sub}
        </p>
        <FormTrocarSenha />
      </div>
    </main>
    </IdiomaProvider>
  );
}
