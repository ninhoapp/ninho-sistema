import { conferirSenhaDoAdmin, requireSession, requireSessionAtiva } from '@/lib/auth/guard';
import { signOut } from '@/app/admin/actions';
import { AdminLogo } from '@/components/admin/AdminLogo';
import { SidebarNav } from '@/components/admin/SidebarNav';
import { SetorTabs } from '@/components/admin/SetorTabs';
import { AlertaAtendimento } from '@/components/admin/AlertaAtendimento';
import { ContaMenu } from '@/components/consultoras/ContaMenu';
import { IdiomaProvider, SeletorIdioma } from '@/components/consultoras/IdiomaConsultora';
import { idiomaDaConsultora } from '@/lib/i18n-consultora/servidor';
import { textos } from '@/lib/i18n-consultora';
import '../admin.css';

export const dynamic = 'force-dynamic';

const ROLE_LABEL: Record<string, string> = {
  admin: 'Administrador',
  conversor: 'Conversor',
  influencer: 'Parceiro',
  consultora: 'Consultora independente',
};

export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  // Parceiro e conversor são gente de fora: confere no banco se o perfil
  // ainda existe e está ativo (desativar corta o acesso na hora). O admin
  // fica só no cookie, para o painel não travar se o banco piscar.
  const cookie = await requireSession();
  const session = cookie.role === 'admin' ? cookie : await requireSessionAtiva();
  // Admin: se a senha mudou depois do login, o cookie antigo não entra mais.
  // Banco fora do ar não derruba (auditoria, 10/11/2026).
  if (cookie.role === 'admin') await conferirSenhaDoAdmin(cookie);
  // Painel da consultora em pt/en/es (25/11/2026); o dono e os outros papéis ficam em pt.
  const consultora = session.role === 'consultora';
  const idioma = consultora ? await idiomaDaConsultora() : 'pt';
  const t = textos(idioma).geral.topo;

  return (
    <IdiomaProvider idioma={idioma}>
    <div className="min-h-screen bg-ninho-nuvem text-ninho-grafite" lang={consultora ? idioma : undefined}>
      {/* Topbar */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-ninho-borda bg-white px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2.5">
          <AdminLogo size={30} />
          <div className="leading-tight">
            <span className="block text-sm font-bold tracking-wide text-ninho-roxo-escuro">
              NINHO
            </span>
            <span className="block text-[11px] text-ninho-cinza">{t.painel}</span>
          </div>
        </div>
        {consultora ? (
          <div className="flex items-center gap-3">
            <SeletorIdioma atual={idioma} className="hidden sm:flex" />
            <ContaMenu nome={session.name} idioma={idioma} />
          </div>
        ) : (
        <div className="flex items-center gap-3">
          <div className="text-right leading-tight">
            <span className="block text-sm font-medium text-ninho-grafite">{session.name}</span>
            <span className="block text-[11px] text-ninho-cinza">{ROLE_LABEL[session.role]}</span>
          </div>
          <form action={signOut}>
            <button className="rounded-pill border border-ninho-borda px-3 py-1.5 text-xs font-medium text-ninho-cinza transition hover:border-ninho-roxo hover:text-ninho-roxo">
              Sair
            </button>
          </form>
        </div>
        )}
      </header>

      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 sm:px-6">
        {/* Sidebar */}
        <aside className="hidden w-56 shrink-0 md:block">
          <div className="sticky top-20 rounded-2xl bg-white p-3">
            <SidebarNav role={session.role} />
          </div>
        </aside>

        {/* Conteúdo */}
        <main className="min-w-0 flex-1">
          {/* Menu recolhido no celular */}
          <details className="mb-4 rounded-2xl bg-white p-2 md:hidden">
            <summary className="cursor-pointer px-2 py-1 text-sm font-semibold">{t.menu}</summary>
            <SidebarNav role={session.role} />
            {consultora && <SeletorIdioma atual={idioma} className="mt-2 border-t border-ninho-borda px-3 pt-2 sm:hidden" />}
          </details>
          {session.role === 'admin' && <AlertaAtendimento />}
          {session.role === 'admin' && <SetorTabs />}
          {children}
        </main>
      </div>
    </div>
    </IdiomaProvider>
  );
}
