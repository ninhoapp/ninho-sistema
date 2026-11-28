'use client';

/**
 * Idioma do painel da consultora no CLIENTE. O layout do painel põe o
 * provedor com o idioma já resolvido no servidor (lib/i18n-consultora/servidor.ts);
 * fora dele (ou para o dono) vale pt. Componente de servidor não usa isto:
 * recebe `idioma` por prop.
 */
import { createContext, useContext, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { NOMES_IDIOMA, textos, type Idioma } from '@/lib/i18n-consultora';
import { escolherIdiomaPainel } from '@/lib/i18n-consultora/acoes';

const Ctx = createContext<Idioma>('pt');

export function IdiomaProvider({ idioma, children }: { idioma: Idioma; children: React.ReactNode }) {
  return <Ctx.Provider value={idioma}>{children}</Ctx.Provider>;
}

export function useIdioma(): Idioma {
  return useContext(Ctx);
}

export function useTextos() {
  return textos(useContext(Ctx));
}

/** Seletor discreto: Português · English · Español. Grava só o cookie deste navegador. */
export function SeletorIdioma({ atual, className = '' }: { atual: Idioma; className?: string }) {
  const router = useRouter();
  const [pendente, start] = useTransition();
  return (
    <div className={`flex items-center gap-1 text-[11.5px] ${pendente ? 'opacity-60' : ''} ${className}`} aria-label="Idioma / Language / Idioma">
      {NOMES_IDIOMA.map(([v, nome], i) => (
        <span key={v} className="flex items-center gap-1">
          {i > 0 && <span className="text-[#D5D0E0]" aria-hidden>·</span>}
          <button
            type="button"
            lang={v}
            disabled={pendente || v === atual}
            aria-pressed={v === atual}
            onClick={() =>
              start(async () => {
                await escolherIdiomaPainel(v);
                router.refresh();
              })
            }
            className={v === atual ? 'font-bold text-ninho-roxo-escuro' : 'text-ninho-cinza hover:text-ninho-roxo'}
          >
            {nome}
          </button>
        </span>
      ))}
    </div>
  );
}
