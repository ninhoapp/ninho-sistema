'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Role } from '@/lib/auth/session';
import { MENU_ADMIN, grupoDe } from '@/lib/empresa/menu';

interface NavItem {
  href: string;
  label: string;
}

/**
 * O Ninho não tem influencer — só admin e conversor. Por isso não existem
 * aqui as entradas de "Parceiros"/"Influenciadores" nem nada ligado a link
 * de divulgação ou atribuição de instalação.
 *
 * O admin vê o menu organizado pelos setores do prédio (lib/empresa/menu.ts):
 * cada setor abre a equipe dele e lista as abas que são dele.
 */
const CONVERSOR: NavItem[] = [
  { href: '/admin/conversor', label: 'Meu painel' },
  { href: '/admin/conta', label: 'Minha conta' },
];

function item(active: boolean) {
  return `block rounded-xl px-3 py-2 text-sm font-medium transition ${
    active ? 'bg-ninho-roxo text-white' : 'text-ninho-grafite hover:bg-ninho-roxo-suave'
  }`;
}

export function SidebarNav({ role }: { role: Role }) {
  const pathname = usePathname();

  if (role !== 'admin') {
    return (
      <nav className="flex flex-col gap-1">
        {CONVERSOR.map((i) => (
          <Link key={i.href} href={i.href} className={item(pathname === i.href)}>{i.label}</Link>
        ))}
      </nav>
    );
  }

  const atual = grupoDe(pathname);
  return (
    <nav className="flex flex-col gap-0.5">
      <Link href="/admin/empresa" className={item(pathname === '/admin/empresa')}>O prédio</Link>
      {MENU_ADMIN.map((g) => {
        const aberto = atual?.id === g.id;
        const cabeca = (
          <span className="flex items-center gap-2">
            <i className="inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: g.cor }} />
            {g.nome}
            {g.abas.length > 0 && <span className="ml-auto text-[11px] font-normal text-ninho-cinza">{g.abas.length}</span>}
          </span>
        );
        return (
          <div key={g.id} className="mt-1">
            {g.equipe ? (
              <Link href={g.equipe} className={item(pathname === g.equipe)}>{cabeca}</Link>
            ) : (
              <p className="px-3 py-2 text-sm font-medium text-ninho-cinza">{cabeca}</p>
            )}
            {(aberto || g.id === 'conta') && g.abas.length > 0 && (
              <div className="ml-4 flex flex-col gap-0.5 border-l border-ninho-borda pl-2">
                {g.abas.map((a) => (
                  <Link key={a.href} href={a.href} className={item(pathname === a.href)}>{a.label}</Link>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
