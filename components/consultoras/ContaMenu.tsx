/**
 * Menu de conta da consultora (v3, pedido do dono 08/11/2026): o nome no canto
 * de cima abre Meu perfil, Indicar consultora, Assinatura IA, Código e ajuda e
 * Sair, como o ☰ do app. As abas da esquerda ficam só com o trabalho do dia.
 * <details> nativo: abre e fecha sem JavaScript.
 */
import Link from 'next/link';
import { signOut } from '@/app/admin/actions';

const ITENS: [string, string, string][] = [
  ['/admin/consultora?aba=perfil', 'Meu perfil na lista', 'Texto, foto, contato e Pix'],
  ['/admin/consultora?aba=indicar', 'Indicar consultora', 'Traga uma amiga para o programa'],
  ['/admin/consultora?aba=assinatura', 'Assinatura IA', 'Relatórios do mês e validade'],
  ['/admin/consultora?aba=ajuda', 'Código e ajuda', 'Seu código, link e como entrar'],
];

export function ContaMenu({ nome }: { nome: string }) {
  const iniciais = nome.split(/\s+/).filter(Boolean).map((x) => x[0]).slice(0, 2).join('').toUpperCase() || '?';
  return (
    <details className="relative">
      <summary className="flex cursor-pointer list-none items-center gap-2.5 rounded-pill py-1 pl-1 pr-3 hover:bg-ninho-roxo-suave [&::-webkit-details-marker]:hidden">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#9F86E0] text-xs font-extrabold text-white">{iniciais}</span>
        <span className="text-left leading-tight">
          <span className="block text-sm font-medium text-ninho-grafite">{nome}</span>
          <span className="block text-[11px] text-ninho-cinza">Consultora independente ▾</span>
        </span>
      </summary>
      <div className="absolute right-0 z-30 mt-2 w-72 rounded-2xl border border-ninho-borda bg-white p-2 shadow-xl">
        {ITENS.map(([href, t, s]) => (
          <Link key={href} href={href} className="block rounded-xl px-3 py-2 hover:bg-ninho-roxo-suave">
            <span className="block text-sm font-semibold text-ninho-grafite">{t}</span>
            <span className="block text-[11.5px] text-ninho-cinza">{s}</span>
          </Link>
        ))}
        <form action={signOut} className="mt-1 border-t border-ninho-borda pt-1">
          <button className="w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-red-500 hover:bg-red-50">Sair</button>
        </form>
      </div>
    </details>
  );
}
