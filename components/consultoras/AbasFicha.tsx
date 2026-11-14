'use client';

import { useEffect, useState } from 'react';

export interface ParteFicha {
  chave: string;
  rotulo: string;
  /** Número pequeno ao lado do rótulo (ex.: quantas famílias). */
  conta?: number;
  /** Pontinho âmbar: tem algo esperando o dono nessa aba. */
  alerta?: boolean;
  conteudo: React.ReactNode;
}

const GUARDA = 'ficha-consultora-parte';

/**
 * Abas da ficha da consultora (dono, 14/11/2026: "tudo separado").
 * Todas as partes já vêm prontas do servidor; a troca é só no navegador.
 * A aba escolhida vai para a URL (?parte=) e fica guardada na sessão, para
 * voltar nela depois que um botão da ficha salva e recarrega a página.
 */
export function AbasFicha({ partes, inicial }: { partes: ParteFicha[]; inicial?: string }) {
  const valida = (k: string | null | undefined) => (k && partes.some((p) => p.chave === k) ? k : null);
  const [atual, setAtual] = useState(valida(inicial) ?? partes[0]?.chave);

  useEffect(() => {
    if (valida(inicial)) return;
    try {
      const salva = valida(sessionStorage.getItem(GUARDA));
      if (salva) setAtual(salva);
    } catch {
      /* sem sessionStorage: fica na primeira aba */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const escolher = (k: string) => {
    setAtual(k);
    try {
      sessionStorage.setItem(GUARDA, k);
    } catch {
      /* ignora */
    }
    const url = new URL(window.location.href);
    url.searchParams.set('parte', k);
    url.searchParams.delete('ok');
    url.searchParams.delete('erro');
    window.history.replaceState(null, '', url.toString());
  };

  return (
    <>
      <div role="tablist" className="my-4 flex max-w-full gap-1 overflow-x-auto rounded-pill bg-white p-1.5 shadow-[0_10px_30px_-22px_rgba(80,40,160,.35)] sm:w-max">
        {partes.map((p) => {
          const on = p.chave === atual;
          return (
            <button
              key={p.chave}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => escolher(p.chave)}
              className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-pill px-4 py-2 text-[13px] font-extrabold transition ${
                on ? 'bg-[#24164F] text-white' : 'text-ninho-cinza hover:text-[#7C5CD6]'
              }`}
            >
              {p.rotulo}
              {typeof p.conta === 'number' && (
                <span className={`rounded-pill px-1.5 text-[11px] ${on ? 'bg-white/20 text-white' : 'bg-[#EFE8FC] text-[#7C5CD6]'}`}>{p.conta}</span>
              )}
              {p.alerta && <span className="h-[7px] w-[7px] rounded-full bg-[#E0A030]" aria-label="tem algo para ver" />}
            </button>
          );
        })}
      </div>
      {partes.map((p) => (
        <div key={p.chave} role="tabpanel" hidden={p.chave !== atual}>
          {p.conteudo}
        </div>
      ))}
    </>
  );
}
