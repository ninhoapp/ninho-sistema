/** Mini-card de métrica (fundo nuvem), usado em grids densos. */
export function Mini({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-xl bg-ninho-nuvem p-3">
      <p className="text-[11px] uppercase text-ninho-cinza">{label}</p>
      <p className="mt-0.5 text-lg font-bold text-ninho-grafite">{value}</p>
      {hint && <p className="text-[10px] text-ninho-cinza">{hint}</p>}
    </div>
  );
}
