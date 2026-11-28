/**
 * Menu de conta da consultora (v3, pedido do dono 08/11/2026): o nome no canto
 * de cima (botão ☰ Menu, bem visível) abre Meu perfil, Indicar consultora, Assinatura IA, Código e ajuda e
 * Sair, como o ☰ do app. Os mesmos itens repetem no fim da barra lateral
 * ("Sua conta") e no menu do celular (SidebarNav).
 * <details> nativo: abre e fecha sem JavaScript.
 */
import Link from 'next/link';
import { signOut } from '@/app/admin/actions';

import { COMISSAO_VISIVEL } from '@/lib/consultoras-regras';
import { textos, type Idioma } from '@/lib/i18n-consultora';

/** Itens do menu da conta no idioma da consultora (padrão pt). */
export function itensConta(idioma: Idioma = 'pt'): [string, string, string][] {
  const t = textos(idioma).geral.conta;
  return [
    ['/admin/consultora?aba=perfil', t.perfil, COMISSAO_VISIVEL ? t.perfilSubComPix : t.perfilSub],
    // "Indicar consultora" é do programa de comissão: some junto com ele.
    ...(COMISSAO_VISIVEL ? ([['/admin/consultora?aba=indicar', t.indicar, t.indicarSub]] as [string, string, string][]) : []),
    ['/admin/consultora?aba=assinatura', t.assinatura, t.assinaturaSub],
    ['/admin/consultora?aba=ajuda', t.ajuda, t.ajudaSub],
    ['/admin/consultora?aba=sugestoes', t.sugestoes, t.sugestoesSub],
  ];
}

export function ContaMenu({ nome, idioma = 'pt' }: { nome: string; idioma?: Idioma }) {
  const t = textos(idioma).geral.topo;
  const iniciais = nome.split(/\s+/).filter(Boolean).map((x) => x[0]).slice(0, 2).join('').toUpperCase() || '?';
  return (
    <details className="relative">
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-pill border-2 border-ninho-roxo bg-white px-3.5 py-1.5 text-sm font-bold text-ninho-roxo-escuro shadow-sm hover:bg-ninho-roxo-suave [&::-webkit-details-marker]:hidden">
        <span aria-hidden="true" className="text-lg leading-none">☰</span>
        <span>{t.menu}</span>
        <span className="hidden max-w-[140px] truncate border-l border-ninho-borda pl-2 text-xs font-medium text-ninho-cinza sm:inline">{nome}</span>
        <span className="sr-only">{t.menuDaConta(iniciais)}</span>
      </summary>
      <div className="absolute right-0 z-30 mt-2 w-72 rounded-2xl border border-ninho-borda bg-white p-2 shadow-xl">
        {itensConta(idioma).map(([href, t, s]) => (
          <Link key={href} href={href} className="block rounded-xl px-3 py-2 hover:bg-ninho-roxo-suave">
            <span className="block text-sm font-semibold text-ninho-grafite">{t}</span>
            <span className="block text-[11.5px] text-ninho-cinza">{s}</span>
          </Link>
        ))}
        <form action={signOut} className="mt-1 border-t border-ninho-borda pt-1">
          <button className="w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-red-500 hover:bg-red-50">{t.sair}</button>
        </form>
      </div>
    </details>
  );
}
