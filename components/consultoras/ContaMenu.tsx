/**
 * Menu de conta da consultora (v3, pedido do dono 08/11/2026): o nome no canto
 * de cima (botão ☰ Menu, bem visível) abre Meu perfil, Indicar consultora, Assinatura IA, Código e ajuda e
 * Sair, como o ☰ do app. Os mesmos itens repetem no fim da barra lateral
 * ("Sua conta") e no menu do celular (SidebarNav).
 * <details> nativo: abre e fecha sem JavaScript.
 */
import Link from 'next/link';
import { signOut } from '@/app/admin/actions';

export const ITENS_CONTA: [string, string, string][] = [
  ['/admin/consultora?aba=perfil', 'Meu perfil na lista', 'Texto, foto, contato e Pix'],
  ['/admin/consultora?aba=indicar', 'Indicar consultora', 'Traga uma amiga para o programa'],
  ['/admin/consultora?aba=assinatura', 'Assinatura IA', 'Relatórios do mês e validade'],
  ['/admin/consultora?aba=ajuda', 'Código e ajuda', 'Seu código, link e como entrar'],
];

export function ContaMenu({ nome }: { nome: string }) {
  const iniciais = nome.split(/\s+/).filter(Boolean).map((x) => x[0]).slice(0, 2).join('').toUpperCase() || '?';
  return (
    <details className="relative">
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-pill border-2 border-ninho-roxo bg-white px-3.5 py-1.5 text-sm font-bold text-ninho-roxo-escuro shadow-sm hover:bg-ninho-roxo-suave [&::-webkit-details-marker]:hidden">
        <span aria-hidden="true" className="text-lg leading-none">☰</span>
        <span>Menu</span>
        <span className="hidden max-w-[140px] truncate border-l border-ninho-borda pl-2 text-xs font-medium text-ninho-cinza sm:inline">{nome}</span>
        <span className="sr-only">da sua conta: {iniciais}</span>
      </summary>
      <div className="absolute right-0 z-30 mt-2 w-72 rounded-2xl border border-ninho-borda bg-white p-2 shadow-xl">
        {ITENS_CONTA.map(([href, t, s]) => (
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
