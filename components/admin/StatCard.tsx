export function StatCard({
  label,
  value,
  hint,
  accent = false,
  danger = false,
  icon,
  trend,
  compactHint = false,
}: {
  label: string;
  value: string | number;
  hint?: string;
  accent?: boolean;
  danger?: boolean;
  icon?: React.ReactNode;
  /** "vs período anterior" — pct positivo = cresceu (↑), negativo = caiu (↓). */
  trend?: { pct: number };
  /** Fonte do hint um pouco menor — pra cards apertados onde o texto padrão não cabe bem. */
  compactHint?: boolean;
}) {
  const valueColor = danger ? 'text-red-600' : 'text-ninho-roxo-escuro';
  const box = danger
    ? 'border-red-200 bg-red-50'
    : accent
    ? 'border-ninho-roxo bg-ninho-roxo-suave'
    : 'border-ninho-borda bg-white';
  const iconBox = danger
    ? 'bg-red-100 text-red-500'
    : 'bg-ninho-roxo-suave text-ninho-roxo-escuro';
  return (
    <div className={`relative rounded-2xl border p-5 ${box}`}>
      <p className="pr-9 text-xs uppercase tracking-wide text-ninho-cinza">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${valueColor}`}>{value}</p>
      {hint && (
        <p className={`mt-1 text-ninho-cinza ${compactHint ? 'text-[10px]' : 'text-xs'}`}>{hint}</p>
      )}
      {trend && (
        <p
          className={`mt-1 flex items-center gap-1 text-xs font-medium ${
            trend.pct >= 0 ? 'text-state-success' : 'text-red-500'
          }`}
        >
          <span>{trend.pct >= 0 ? '↑' : '↓'}</span>
          <span>{Math.abs(Math.round(trend.pct))}% vs período anterior</span>
        </p>
      )}
      {icon && (
        <div
          className={`absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full ${iconBox}`}
        >
          {icon}
        </div>
      )}
    </div>
  );
}
