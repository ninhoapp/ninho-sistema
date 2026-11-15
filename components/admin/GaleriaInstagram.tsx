'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Miniaturas de um post do Instagram que abrem por cima da tela (pedido do
 * dono, 15/11/2026: nada de abrir outra aba). No carrossel dá para arrastar
 * para o lado, usar as setas do teclado ou os botões; fecha no X, no Esc ou
 * clicando fora da imagem.
 */
export function GaleriaInstagram({ imagens }: { imagens: string[] }) {
  const [aberta, setAberta] = useState<number | null>(null);
  const inicioX = useRef<number | null>(null);
  const arrastou = useRef(false);
  const total = imagens.length;

  const fechar = useCallback(() => setAberta(null), []);
  const ir = useCallback(
    (passo: number) => setAberta((i) => (i == null ? i : Math.min(total - 1, Math.max(0, i + passo)))),
    [total],
  );

  useEffect(() => {
    if (aberta == null) return;
    const tecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') fechar();
      if (e.key === 'ArrowRight') ir(1);
      if (e.key === 'ArrowLeft') ir(-1);
    };
    window.addEventListener('keydown', tecla);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', tecla);
      document.body.style.overflow = overflow;
    };
  }, [aberta, fechar, ir]);

  return (
    <>
      <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
        {imagens.map((src, i) => (
          <button key={src} type="button" onClick={() => setAberta(i)} className="shrink-0" aria-label={`Abrir slide ${i + 1}`}>
            <img src={src} alt={`slide ${i + 1}`} className="h-44 w-[141px] rounded-lg border border-ninho-borda object-cover" />
          </button>
        ))}
      </div>

      {aberta != null && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          onClick={() => { if (arrastou.current) { arrastou.current = false; return; } fechar(); }}
          onPointerDown={(e) => { inicioX.current = e.clientX; arrastou.current = false; }}
          onPointerUp={(e) => {
            if (inicioX.current == null) return;
            const dx = e.clientX - inicioX.current;
            inicioX.current = null;
            if (Math.abs(dx) > 50) { arrastou.current = true; ir(dx < 0 ? 1 : -1); }
          }}
        >
          <button
            type="button"
            onClick={fechar}
            className="absolute right-4 top-4 rounded-full bg-white/15 px-3 py-1 text-2xl leading-none text-white hover:bg-white/25"
            aria-label="Fechar"
          >
            ×
          </button>

          {total > 1 && aberta > 0 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); ir(-1); }}
              className="absolute left-3 rounded-full bg-white/15 px-3 py-2 text-2xl text-white hover:bg-white/25"
              aria-label="Anterior"
            >
              ‹
            </button>
          )}

          <img
            src={imagens[aberta]}
            alt={`slide ${aberta + 1} de ${total}`}
            draggable={false}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[88vh] max-w-full select-none rounded-xl object-contain"
          />

          {total > 1 && aberta < total - 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); ir(1); }}
              className="absolute right-3 rounded-full bg-white/15 px-3 py-2 text-2xl text-white hover:bg-white/25"
              aria-label="Próxima"
            >
              ›
            </button>
          )}

          {total > 1 && (
            <div className="absolute bottom-4 flex gap-1.5">
              {imagens.map((src, i) => (
                <span key={src} className={`h-2 w-2 rounded-full ${i === aberta ? 'bg-white' : 'bg-white/40'}`} />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
