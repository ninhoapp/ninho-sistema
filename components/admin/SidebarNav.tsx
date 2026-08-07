'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Role } from '@/lib/auth/session';

interface NavItem {
  href: string;
  label: string;
}

/**
 * O Ninho não tem influencer — só admin e conversor. Por isso não existem
 * aqui as entradas de "Parceiros"/"Influenciadores" nem nada ligado a link
 * de divulgação ou atribuição de instalação.
 */
const NAV: Record<Role, NavItem[]> = {
  admin: [
    { href: '/admin/visao-geral', label: 'Visão geral' },
    { href: '/admin/conversores', label: 'Conversores' },
    { href: '/admin/repasses', label: 'Repasses' },
    { href: '/admin/faturamento', label: 'Faturamento e lucro' },
    { href: '/admin/despesas', label: 'Despesas' },
    { href: '/admin/usuarios', label: 'Usuários ativos' },
    { href: '/admin/conversoes', label: 'Conversões' },
    { href: '/admin/kpi', label: 'KPI' },
    { href: '/admin/perfis', label: 'Gerenciar perfis' },
    { href: '/admin/leads', label: 'Leads' },
    { href: '/admin/conta', label: 'Minha conta' },
  ],
  conversor: [
    { href: '/admin/conversor', label: 'Meu painel' },
    { href: '/admin/conta', label: 'Minha conta' },
  ],
};

export function SidebarNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const items = NAV[role];
  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-xl px-4 py-2.5 text-sm font-medium transition ${
              active
                ? 'bg-ninho-roxo text-white'
                : 'text-ninho-grafite hover:bg-ninho-roxo-suave'
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
