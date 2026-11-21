/**
 * Gera um .xlsx simples (uma aba, cabeçalho + linhas) no navegador.
 *
 * Substitui a biblioteca `xlsx` (SheetJS), que tem falhas sem correção no npm
 * (poluição de protótipo e ReDoS ao LER planilhas). O painel só ESCREVE
 * planilha a partir dos dados que já mostra, então basta montar o XML do
 * formato Office Open XML e zipar com o fflate (pequeno e sem dependências).
 * Auditoria de 19/11/2026.
 */
import { strToU8, zipSync } from 'fflate';

type Celula = string | number | null | undefined;

const XML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    // Caracteres de controle não são aceitos em XML 1.0 (o Excel recusa o arquivo).
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
}

/** Coluna 0 → A, 25 → Z, 26 → AA. */
function letra(col: number): string {
  let s = '';
  let n = col + 1;
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

function celula(valor: Celula, ref: string, negrito = false): string {
  const estilo = negrito ? ' s="1"' : '';
  if (valor === null || valor === undefined || valor === '') return '';
  if (typeof valor === 'number' && Number.isFinite(valor)) {
    return `<c r="${ref}"${estilo}><v>${valor}</v></c>`;
  }
  return `<c r="${ref}" t="inlineStr"${estilo}><is><t xml:space="preserve">${esc(String(valor))}</t></is></c>`;
}

/** Nome de aba: no máximo 31 caracteres e sem : \ / ? * [ ] */
function nomeDaAba(nome: string): string {
  const limpo = nome.replace(/[:\\/?*[\]]/g, ' ').trim().slice(0, 31);
  return limpo || 'Dados';
}

/** Monta o arquivo .xlsx. As colunas são as chaves das linhas, na ordem em que aparecem. */
export function montarXlsx(rows: Record<string, Celula>[], aba = 'Dados'): Uint8Array {
  const colunas: string[] = [];
  for (const r of rows) for (const k of Object.keys(r)) if (!colunas.includes(k)) colunas.push(k);

  const linhas: string[] = [];
  linhas.push(
    `<row r="1">${colunas.map((c, i) => celula(c, `${letra(i)}1`, true)).join('')}</row>`,
  );
  rows.forEach((r, idx) => {
    const n = idx + 2;
    linhas.push(`<row r="${n}">${colunas.map((c, i) => celula(r[c], `${letra(i)}${n}`)).join('')}</row>`);
  });

  const sheet =
    XML +
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    `<sheetData>${linhas.join('')}</sheetData></worksheet>`;

  const arquivos: Record<string, Uint8Array> = {
    '[Content_Types].xml': strToU8(
      XML +
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
        '<Default Extension="xml" ContentType="application/xml"/>' +
        '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
        '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
        '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
        '</Types>',
    ),
    '_rels/.rels': strToU8(
      XML +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
        '</Relationships>',
    ),
    'xl/workbook.xml': strToU8(
      XML +
        '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
        `<sheets><sheet name="${esc(nomeDaAba(aba))}" sheetId="1" r:id="rId1"/></sheets></workbook>`,
    ),
    'xl/_rels/workbook.xml.rels': strToU8(
      XML +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>' +
        '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
        '</Relationships>',
    ),
    'xl/styles.xml': strToU8(
      XML +
        '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
        '<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>' +
        '<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>' +
        '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>' +
        '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
        '<cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' +
        '<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs>' +
        '</styleSheet>',
    ),
    'xl/worksheets/sheet1.xml': strToU8(sheet),
  };
  return zipSync(arquivos, { level: 6 });
}

/** Baixa o .xlsx no navegador. */
export function baixarXlsx(rows: Record<string, Celula>[], nomeArquivo: string, aba = 'Dados'): void {
  const bytes = montarXlsx(rows, aba);
  const blob = new Blob([bytes as BlobPart], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nomeArquivo;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
