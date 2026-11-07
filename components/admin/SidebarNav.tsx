'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import type { Role } from '@/lib/auth/session';
import { MENU_ADMIN, grupoDe } from '@/lib/empresa/menu';

interface NavItem {
  href: string;
  label: string;
}

/**
 * Três papéis: admin, conversor e parceiro (influencer, desde 05/11/2026).
 * Conversor e parceiro veem só o próprio painel e a conta.
 *
 * O admin vê o menu organizado pelos setores do prédio (lib/empresa/menu.ts):
 * cada setor abre a equipe dele e lista as abas que são dele.
 */
const CONVERSOR: NavItem[] = [
  { href: '/admin/conversor', label: 'Meu painel' },
  { href: '/admin/conta', label: 'Minha conta' },
];

const PARCEIRO: NavItem[] = [
  { href: '/admin/parceiro', label: 'Meus resultados' },
  { href: '/admin/parceiro/guia', label: 'Guia do parceiro' },
  { href: '/admin/conta', label: 'Minha conta' },
];

const CONSULTORA: NavItem[] = [
  { href: '/admin/consultora', label: 'Famílias' },
  { href: '/admin/consultora?aba=rotina', label: 'Rotina do bebê' },
  { href: '/admin/consultora?aba=semana', label: 'Semana' },
  { href: '/admin/consultora?aba=convidar', label: 'Convidar família' },
  { href: '/admin/consultora?aba=ganhos', label: 'Ganhos' },
  { href: '/admin/consultora?aba=indicar', label: 'Indicar consultora' },
  { href: '/admin/consultora?aba=perfil', label: 'Meu perfil na lista' },
];

function item(active: boolean) {
  return `block rounded-xl px-3 py-2 text-sm font-medium transition ${
    active ? 'bg-ninho-roxo text-white' : 'text-ninho-grafite hover:bg-ninho-roxo-suave'
  }`;
}

export function SidebarNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const busca = useSearchParams();

  if (role === 'consultora') {
    const aba = busca.get('aba') || '';
    return (
      <nav className="flex flex-col gap-1">
        {CONSULTORA.map((i) => {
          const alvo = i.href.split('aba=')[1] ?? '';
          return (
            <Link key={i.href} href={i.href} className={item(pathname === '/admin/consultora' && aba === alvo)}>{i.label}</Link>
          );
        })}
      </nav>
    );
  }

  if (role !== 'admin') {
    return (
      <nav className="flex flex-col gap-1">
        {(role === 'influencer' ? PARCEIRO : CONVERSOR).map((i) => (
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
            {/* Grupo sem página de equipe (Parcerias) abre a 1ª aba dele. Antes era um
                texto sem link, e as abas só apareciam quando já se estava dentro do grupo:
                não havia como chegar em Parceiros ou Consultoras pelo menu. */}
            {g.equipe || g.abas.length ? (
              <Link href={(g.equipe ?? g.abas[0].href)} className={item(pathname === g.equipe)}>{cabeca}</Link>
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
