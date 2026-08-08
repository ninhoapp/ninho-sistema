/** Gráfico de pizza/rosca simples em SVG, sem dependência. */
export interface Slice {
  label: string;
  value: number;
  color: string;
}

export function DonutChart({ slices, size = 160 }: { slices: Slice[]; size?: number }) {
  const total = slices.reduce((s, x) => s + x.value, 0);
  const r = size / 2;
  const stroke = size * 0.22;
  const radius = r - stroke / 2;
  const circ = 2 * Math.PI * radius;

  if (total === 0) {
    return <p className="text-sm text-ninho-cinza">Sem dados ainda.</p>;
  }

  let offset = 0;
  return (
    <div className="flex flex-wrap items-center gap-5">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <g transform={`rotate(-90 ${r} ${r})`}>
          {slices.map((s) => {
            const frac = s.value / total;
            const dash = frac * circ;
            const el = (
              <circle
                key={s.label}
                cx={r}
                cy={r}
                r={radius}
                fill="none"
                stroke={s.color}
                strokeWidth={stroke}
                strokeDasharray={`${dash} ${circ - dash}`}
                strokeDashoffset={-offset}
              />
            );
            offset += dash;
            return el;
          })}
        </g>
      </svg>
      <ul className="space-y-1.5 text-sm">
        {slices.map((s) => (
          <li key={s.label} className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-sm" style={{ background: s.color }} />
            <span className="text-ninho-grafite">{s.label}</span>
            <span className="text-ninho-cinza">
              {s.value} ({Math.round((s.value / total) * 100)}%)
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
