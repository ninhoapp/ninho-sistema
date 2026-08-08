/** Barras verticais em CSS puro — para séries curtas (meses, categorias). */
export function VerticalBarChart({
  data,
  height = 180,
  formatValue,
}: {
  data: { label: string; value: number; color?: string }[];
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
    <div className="admin-scroll overflow-x-auto rounded-2xl border border-ninho-borda bg-white p-5">
      <div className="flex min-w-fit items-end gap-4" style={{ height }}>
        {data.map((d) => (
          <div key={d.label} className="flex h-full min-w-[52px] flex-1 flex-col items-center justify-end gap-2">
            <span className="whitespace-nowrap text-[11px] font-semibold text-ninho-grafite">
              {fmt(d.value)}
            </span>
            <div
              className="w-full rounded-t-lg transition-all"
              style={{
                height: `${Math.max(2, (d.value / max) * 100)}%`,
                background: d.color || '#9F86E0',
              }}
            />
            <span className="whitespace-nowrap text-[11px] text-ninho-cinza">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
