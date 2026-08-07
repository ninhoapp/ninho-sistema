export function PageHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  /** Conteúdo no canto superior direito do cabeçalho (ex: filtro de mês). */
  right?: React.ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-ninho-grafite">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-sm text-ninho-cinza">{subtitle}</p>}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </header>
  );
}
