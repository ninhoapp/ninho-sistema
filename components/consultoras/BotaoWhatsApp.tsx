'use client';

import { useState } from 'react';

/** wa.me com o texto pronto. Sem número, abre o WhatsApp para escolher a conversa. */
export function linkWhatsApp(numero: string | null | undefined, texto: string): string {
  const n = (numero ?? '').replace(/\D/g, '');
  return `https://wa.me/${n}?text=${encodeURIComponent(texto)}`;
}

/** Botão verde que abre o WhatsApp com a mensagem pronta, e um "Copiar" ao lado. */
export function BotaoWhatsApp({ numero, texto, rotulo = 'Enviar pelo WhatsApp' }: { numero: string | null | undefined; texto: string; rotulo?: string }) {
  const [copiado, setCopiado] = useState(false);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(texto);
            setCopiado(true);
            setTimeout(() => setCopiado(false), 1800);
          } catch {
            /* sem permissão: o texto continua na tela */
          }
        }}
        className="inline-flex h-8 items-center justify-center rounded-pill bg-[#F0EEF4] px-3 text-[12.5px] font-bold text-ninho-cinza"
      >
        {copiado ? 'Copiado!' : 'Copiar'}
      </button>
      <a
        href={linkWhatsApp(numero, texto)}
        target="_blank"
        rel="noreferrer"
        className="inline-flex h-8 items-center justify-center gap-1.5 rounded-pill bg-[#25A35A] px-3.5 text-[12.5px] font-bold text-white hover:bg-[#1F8F4E]"
      >
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M21 12a9 9 0 0 1-13.5 7.8L3 21l1.2-4.4A9 9 0 1 1 21 12z" />
        </svg>
        {rotulo}
      </a>
    </div>
  );
}
