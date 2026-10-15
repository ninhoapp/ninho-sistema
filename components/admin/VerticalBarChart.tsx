/** Barras verticais em CSS puro — para séries curtas (meses, categorias). */
export function VerticalBarChart({
  data,
  height = 180,
  formatValue,
}: {
  /** `highlight`: marca o bucket ainda em andamento (hoje, mês atual) com um
   *  contorno tracejado, pra não ler um número baixo ali como queda. */
  data: { label: string; value: number; color?: string; highlight?: boolean }[];
  height?: number;
  formatValue?: (v: number) => string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const fmt = formatValue ?? ((v: number) => String(v));

  if (data.length === 0 || data.every((d) => d.value === 0)) {
    return (
      <p className="rounded-2xl border border-ninho-borda bg-white p-8 text-center text-sm text-ninho-cinza">
        Ainda sem dados para exibir.
      </p>
    );
  }

  return (
    // Todas as barras cabem na largura do card, sem rolagem lateral: cada
    // coluna encolhe (min-w-0) e o valor quebra em duas linhas se precisar
    // ("R$" em cima, "493,50" embaixo) em vez de empurrar a largura.
    <div className="rounded-2xl border border-ninho-borda bg-white p-3 sm:p-5">
      <div className="flex items-end gap-1 sm:gap-3" style={{ height }}>
        {data.map((d) => (
          <div key={d.label} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1.5">
            <span className="w-full text-center text-[10px] font-semibold leading-tight text-ninho-grafite sm:text-[11px]">
              {fmt(d.value)}
            </span>
            <div
              className={`w-full rounded-t-lg transition-all ${
                d.highlight ? 'border-2 border-dashed border-ninho-roxo-escuro' : ''
              }`}
              style={{
                height: `${Math.max(2, (d.value / max) * 100)}%`,
                background: d.color || '#9F86E0',
              }}
            />
            <span className="w-full truncate text-center text-[10px] text-ninho-cinza sm:text-[11px]">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
