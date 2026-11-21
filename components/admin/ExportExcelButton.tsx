'use client';

/**
 * Botão que exporta as linhas dadas (já formatadas, com as colunas exatas
 * que devem virar cabeçalho) pra um arquivo .xlsx baixado na hora, no
 * navegador — sem passar pelo servidor. Usar sempre com os dados JÁ
 * filtrados/ordenados que a tabela está mostrando, não a lista bruta.
 */
export function ExportExcelButton({
  rows,
  filename,
  sheetName = 'Dados',
  label = 'Exportar Excel',
}: {
  rows: Record<string, string | number>[];
  filename: string;
  sheetName?: string;
  label?: string;
}) {
  async function handleExport() {
    // Carregada só no clique, pra não ir junto em toda tela com tabela.
    // Antes era a lib `xlsx` (SheetJS), trocada por ter falha sem correção.
    const { baixarXlsx } = await import('@/lib/planilha');
    const hoje = new Date().toISOString().slice(0, 10);
    baixarXlsx(rows, `${filename}-${hoje}.xlsx`, sheetName);
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={rows.length === 0}
      className="rounded-pill border border-ninho-roxo px-4 py-2 text-sm font-medium text-ninho-roxo-escuro transition hover:bg-ninho-roxo-suave disabled:opacity-40"
    >
      ⬇ {label} ({rows.length})
    </button>
  );
}
