/**
 * Gráfico de barras divergente: linha zero no meio, barra cresce pra cima em
 * lucro (valor com "+" acima da barra) e pra baixo em prejuízo (valor com
 * "-" abaixo da barra) — dá pra bater o olho e saber se foi lucro ou não.
 */
export interface DBar {
  label: string;
  value: number;
  tone?: 'verde' | 'vermelho' | 'amarelo' | 'roxo';
  highlight?: boolean;
}

const TONE_CLASS: Record<NonNullable<DBar['tone']>, string> = {
  verde: 'bg-state-success',
  vermelho: 'bg-red-400',
  amarelo: 'bg-category-food',
  roxo: 'bg-ninho-roxo',
};

function formatSigned(v: number): string {
  const abs = Math.abs(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  if (v > 0) return `+${abs}`;
  if (v < 0) return `-${abs}`;
  return abs;
}

export function DivergingBarChart({ bars, halfHeight = 90 }: { bars: DBar[]; halfHeight?: number }) {
  if (bars.length === 0) return <p className="text-sm text-ninho-cinza">Sem dados ainda.</p>;
  const max = Math.max(1, ...bars.map((b) => Math.abs(b.value)));

  return (
    <div
      className="flex w-full items-stretch gap-1 rounded-2xl border border-ninho-borda bg-white p-4 sm:gap-2"
      style={{ height: halfHeight * 2 + 72 }}
    >
      {bars.map((b, i) => {
        const isNeg = b.value < 0;
        const barPx = Math.min((Math.abs(b.value) / max) * halfHeight, halfHeight);
        const tone = b.tone ?? (isNeg ? 'vermelho' : 'verde');
        const caption = formatSigned(b.value);

        return (
          <div key={i} className="flex min-w-0 flex-1 flex-col items-center">
            {/* metade de cima: lucro cresce daqui pra baixo, até a linha zero */}
            <div
              className="flex w-full flex-col items-center justify-end"
              style={{ height: halfHeight }}
            >
              {!isNeg && (
                <span className="mb-1 w-full text-center text-[9px] font-semibold leading-tight text-ninho-grafite sm:text-[11px]">
                  {caption}
                </span>
              )}
              {!isNeg && (
                <div
                  className={`w-full max-w-[28px] rounded-t-md transition-all ${TONE_CLASS[tone]} ${
                    b.highlight ? 'ring-2 ring-ninho-grafite/40 ring-offset-1' : ''
                  }`}
                  style={{ height: barPx }}
                />
              )}
            </div>

            {/* linha zero */}
            <div className="h-[2px] w-full shrink-0 bg-ninho-grafite/30" />

            {/* metade de baixo: prejuízo cresce daqui pra baixo */}
            <div
              className="flex w-full flex-col items-center justify-start"
              style={{ height: halfHeight }}
            >
              {isNeg && (
                <div
                  className={`w-full max-w-[28px] rounded-b-md transition-all ${TONE_CLASS[tone]} ${
                    b.highlight ? 'ring-2 ring-ninho-grafite/40 ring-offset-1' : ''
                  }`}
                  style={{ height: barPx }}
                />
              )}
              {isNeg && (
                <span className="mt-1 w-full text-center text-[9px] font-semibold leading-tight text-ninho-grafite sm:text-[11px]">
                  {caption}
                </span>
              )}
            </div>

            <span className="mt-2 w-full text-center text-[9px] leading-tight text-ninho-cinza sm:mt-3 sm:text-[10px]">
              {b.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
