'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { grupoDe } from '@/lib/empresa/menu';

/**
 * Faixa no topo de cada tela do admin: diz de qual setor ela é e junta as
 * abas do setor (Equipe + as telas dele), para navegar sem voltar ao menu.
 */
export function SetorTabs() {
  const pathname = usePathname();
  const g = grupoDe(pathname);
  if (!g || (g.abas.length === 0 && !g.equipe)) return null;
  const abas = [...(g.equipe ? [{ href: g.equipe, label: 'Equipe' }] : []), ...g.abas];
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-ninho-borda bg-white p-2">
      <span className="flex items-center gap-2 px-2 text-sm font-semibold">
        <i className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: g.cor }} />
        {g.nome}
      </span>
      {abas.map((a) => {
        const on = pathname === a.href;
        return (
          <Link
            key={a.href}
            href={a.href}
            className={`rounded-pill px-3 py-1.5 text-sm font-medium transition ${
              on ? 'bg-ninho-roxo text-white' : 'text-ninho-grafite hover:bg-ninho-roxo-suave'
            }`}
          >
            {a.label}
          </Link>
        );
      })}
    </div>
  );
}
