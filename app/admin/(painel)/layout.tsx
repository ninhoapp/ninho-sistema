import { requireSession } from '@/lib/auth/guard';
import { signOut } from '@/app/admin/actions';
import { AdminLogo } from '@/components/admin/AdminLogo';
import { SidebarNav } from '@/components/admin/SidebarNav';
import '../admin.css';

export const dynamic = 'force-dynamic';

const ROLE_LABEL: Record<string, string> = {
  admin: 'Administrador',
  conversor: 'Conversor',
};

export default function PainelLayout({ children }: { children: React.ReactNode }) {
  const session = requireSession();

  return (
    <div className="min-h-screen bg-ninho-nuvem text-ninho-grafite">
      {/* Topbar */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-ninho-borda bg-white px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2.5">
          <AdminLogo size={30} />
          <div className="leading-tight">
            <span className="block text-sm font-bold tracking-wide text-ninho-roxo-escuro">
              NINHO
            </span>
            <span className="block text-[11px] text-ninho-cinza">Painel</span>
          </div>
        </div>
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
          {/* Nav horizontal no mobile */}
          <div className="admin-scroll mb-4 overflow-x-auto rounded-2xl bg-white p-2 md:hidden">
            <SidebarNav role={session.role} />
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
