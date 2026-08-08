/** Casca de tabela do painel: rolagem horizontal no mobile e cabeçalho fixo de estilo. */
export function Tabela({
  headers,
  children,
  vazio,
}: {
  headers: string[];
  children: React.ReactNode;
  /** Mensagem quando não há linhas. Passe `null` em children junto. */
  vazio?: string;
}) {
  const semLinhas = !children || (Array.isArray(children) && children.length === 0);

  if (semLinhas && vazio) {
    return (
      <div className="rounded-2xl border border-ninho-borda bg-white p-8 text-center text-sm text-ninho-cinza">
        {vazio}
      </div>
    );
  }

  return (
    <div className="admin-scroll overflow-x-auto rounded-2xl border border-ninho-borda bg-white">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-ninho-borda">
            {headers.map((h) => (
              <th
                key={h}
                className="whitespace-nowrap px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-ninho-cinza"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-ninho-borda">{children}</tbody>
      </table>
    </div>
  );
}

export function Td({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={`px-4 py-3 align-middle text-ninho-grafite ${className}`}>{children}</td>;
}
