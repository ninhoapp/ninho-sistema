'use client';

import { useState } from 'react';

/** Botão "Copiar resumo" do cartão de janelas (texto montado no servidor). */
export function CopiarResumo({ texto, rotulo, copiado }: { texto: string; rotulo: string; copiado: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(texto);
          setOk(true);
          setTimeout(() => setOk(false), 2000);
        } catch {
          /* sem permissão de área de transferência: nada a fazer */
        }
      }}
      className="mt-2 rounded-full bg-[#7C5CD6] px-3.5 py-1.5 text-xs font-extrabold text-white"
    >
      {ok ? `✓ ${copiado}` : rotulo}
    </button>
  );
}
