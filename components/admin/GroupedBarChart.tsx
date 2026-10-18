/**
 * Barras verticais agrupadas em CSS puro — duas (ou mais) séries lado a lado
 * por bucket, ex: cadastros do grupo A × grupo B por dia. Igual ao
 * VerticalBarChart, todas as barras cabem na largura do card, sem rolar.
 */
export function GroupedBarChart({
  data,
  series,
  height = 200,
}: {
  /** `highlight`: bucket ainda em andamento (hoje) — contorno tracejado. */
  data: { label: string; values: Record<string, number>; highlight?: boolean }[];
  series: { key: string; label: string; color: string }[];
  height?: number;
}) {
  const max = Math.max(1, ...data.flatMap((d) => series.map((s) => d.values[s.key] ?? 0)));

  return (
    <div className="rounded-2xl border border-ninho-borda bg-white p-3 sm:p-5">
      <div className="mb-3 flex flex-wrap gap-4 text-xs text-ninho-cinza">
        {series.map((s) => (
          <span key={s.key} className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-sm" style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
      <div className="flex items-end gap-0.5 sm:gap-1.5" style={{ height }}>
        {data.map((d) => (
          <div
            key={d.label}
            className={`flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1 rounded-md ${
              d.highlight ? 'outline-dashed outline-2 outline-offset-1 outline-ninho-roxo-escuro' : ''
            }`}
            title={`${d.label} · ${series.map((s) => `${s.label}: ${d.values[s.key] ?? 0}`).join(' · ')}`}
          >
            <div className="flex h-full w-full items-end justify-center gap-px">
              {series.map((s) => {
                const v = d.values[s.key] ?? 0;
                return (
                  <div key={s.key} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end">
                    {v > 0 && (
                      <span className="text-[9px] font-semibold leading-tight text-ninho-grafite sm:text-[10px]">
                        {v}
                      </span>
                    )}
                    <div
                      className="w-full rounded-t"
                      style={{
                        height: v > 0 ? `${Math.max(2, (v / max) * 85)}%` : '2px',
                        background: v > 0 ? s.color : '#ECE6F5',
                      }}
                    />
                  </div>
                );
              })}
            </div>
            <span className="w-full truncate text-center text-[9px] text-ninho-cinza sm:text-[10px]">
              {d.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
