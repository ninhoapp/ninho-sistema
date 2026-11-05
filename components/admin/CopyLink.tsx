'use client';

import { useState } from 'react';

/** Mostra um link e um botão que copia para a área de transferência. */
export function CopyLink({ url }: { url: string }) {
  const [copiado, setCopiado] = useState(false);
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <code className="min-w-0 flex-1 truncate rounded-xl border border-ninho-borda bg-ninho-nuvem px-3 py-2.5 text-sm text-ninho-grafite">
        {url}
      </code>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            setCopiado(true);
            setTimeout(() => setCopiado(false), 1800);
          } catch {
            /* sem permissão de clipboard: o link continua visível para copiar à mão */
          }
        }}
        className="shrink-0 rounded-pill bg-ninho-roxo px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-ninho-roxo-escuro"
      >
        {copiado ? 'Copiado!' : 'Copiar link'}
      </button>
    </div>
  );
}
