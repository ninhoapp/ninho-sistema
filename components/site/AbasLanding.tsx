/**
 * Seletor de abas no topo da landing: "Para famílias" (/landing) e "Seja
 * consultora" (/landing/sejaconsultor). Mesmo chrome (SitePage) nas duas.
 */
import Link from 'next/link';
import './consultora.css';

export function AbasLanding({ ativa }: { ativa: 'familias' | 'consultora' }) {
  return (
    <nav className="nc-abas" aria-label="Páginas do site">
      <div className="nc-abas-in">
        <Link href="/landing" className={ativa === 'familias' ? 'on' : ''} aria-current={ativa === 'familias' ? 'page' : undefined}>
          Para famílias
        </Link>
        <Link href="/landing/sejaconsultor" className={ativa === 'consultora' ? 'on' : ''} aria-current={ativa === 'consultora' ? 'page' : undefined}>
          Seja consultora
        </Link>
      </div>
    </nav>
  );
}
