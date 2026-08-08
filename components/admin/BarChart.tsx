/** Barras horizontais em CSS puro — sem lib de gráfico, sem JS no cliente. */
export function BarChart({
  data,
  formatValue,
}: {
  data: { label: string; value: number; color?: string }[];
  formatValue?: (v: number) => string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const fmt = formatValue ?? ((v: number) => String(v));

  if (data.every((d) => d.value === 0)) {
    return (
      <p className="rounded-2xl border border-ninho-borda bg-white p-8 text-center text-sm text-ninho-cinza">
        Ainda sem dados para exibir.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-ninho-borda bg-white p-5">
      {data.map((d) => (
        <div key={d.label} className="flex items-center gap-3">
          <span className="w-32 shrink-0 truncate text-xs text-ninho-cinza" title={d.label}>
            {d.label}
          </span>
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-ninho-nuvem">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${(d.value / max) * 100}%`,
                background: d.color || '#9F86E0',
              }}
            />
          </div>
          <span className="w-24 shrink-0 text-right text-xs font-semibold text-ninho-grafite">
            {fmt(d.value)}
          </span>
        </div>
      ))}
    </div>
  );
}
