'use client';

import * as XLSX from 'xlsx';

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
  function handleExport() {
    const sheet = XLSX.utils.json_to_sheet(rows);
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, sheetName);
    const hoje = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(book, `${filename}-${hoje}.xlsx`);
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
