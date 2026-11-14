/**
 * PDF mínimo montado no navegador: uma imagem JPEG por página (A4) e links
 * tocáveis por cima. Sem biblioteca: o jspdf puxava o DOMPurify com falhas
 * conhecidas, e aqui só precisamos de imagem + link.
 */
export interface LinkPdf {
  /** Posição em pixels da página desenhada (origem no canto de cima). */
  x: number;
  y: number;
  w: number;
  h: number;
  url: string;
}

export interface PaginaPdf {
  /** JPEG da página inteira. */
  jpeg: Uint8Array;
  /** Tamanho do JPEG em pixels. */
  larguraImg: number;
  alturaImg: number;
  /** Tamanho da página desenhada em pixels (antes do pixelRatio), para os links. */
  larguraPx: number;
  alturaPx: number;
  links: LinkPdf[];
}

const A4_L = 595.28;
const A4_A = 841.89;

const enc = new TextEncoder();
const num = (n: number) => (Math.round(n * 100) / 100).toString();
const textoPdf = (s: string) => s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

export function dataUrlParaBytes(dataUrl: string): Uint8Array {
  const b64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function montarPdf(paginas: PaginaPdf[]): Blob {
  const partes: Uint8Array[] = [];
  const offsets: number[] = [];
  let tamanho = 0;
  const escrever = (p: string | Uint8Array) => {
    const b = typeof p === 'string' ? enc.encode(p) : p;
    partes.push(b);
    tamanho += b.length;
  };

  // Numeração: 1 catálogo, 2 páginas; depois, por página: página, conteúdo, imagem e os links.
  const ids: { pagina: number; conteudo: number; imagem: number; links: number[] }[] = [];
  let proximo = 3;
  for (const p of paginas) {
    const pagina = proximo++;
    const conteudo = proximo++;
    const imagem = proximo++;
    const links = p.links.map(() => proximo++);
    ids.push({ pagina, conteudo, imagem, links });
  }
  const total = proximo - 1;

  const objeto = (id: number, corpo: string | Uint8Array[]) => {
    offsets[id] = tamanho;
    escrever(`${id} 0 obj\n`);
    if (typeof corpo === 'string') escrever(corpo);
    else corpo.forEach(escrever);
    escrever('\nendobj\n');
  };

  escrever('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
  objeto(1, '<< /Type /Catalog /Pages 2 0 R >>');
  objeto(2, `<< /Type /Pages /Kids [${ids.map((i) => `${i.pagina} 0 R`).join(' ')}] /Count ${paginas.length} >>`);

  paginas.forEach((p, k) => {
    const i = ids[k];
    const annots = i.links.length ? ` /Annots [${i.links.map((l) => `${l} 0 R`).join(' ')}]` : '';
    objeto(
      i.pagina,
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${num(A4_L)} ${num(A4_A)}] /Resources << /XObject << /Im0 ${i.imagem} 0 R >> >> /Contents ${i.conteudo} 0 R${annots} >>`,
    );
    const stream = `q ${num(A4_L)} 0 0 ${num(A4_A)} 0 0 cm /Im0 Do Q`;
    objeto(i.conteudo, `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
    objeto(i.imagem, [
      enc.encode(
        `<< /Type /XObject /Subtype /Image /Width ${p.larguraImg} /Height ${p.alturaImg} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${p.jpeg.length} >>\nstream\n`,
      ),
      p.jpeg,
      enc.encode('\nendstream'),
    ]);
    const ex = A4_L / p.larguraPx;
    const ey = A4_A / p.alturaPx;
    p.links.forEach((l, j) => {
      const x1 = l.x * ex;
      const x2 = (l.x + l.w) * ex;
      const y1 = A4_A - (l.y + l.h) * ey;
      const y2 = A4_A - l.y * ey;
      objeto(
        i.links[j],
        `<< /Type /Annot /Subtype /Link /Rect [${num(x1)} ${num(y1)} ${num(x2)} ${num(y2)}] /Border [0 0 0] /A << /S /URI /URI (${textoPdf(l.url)}) >> >>`,
      );
    });
  });

  const inicioXref = tamanho;
  let xref = `xref\n0 ${total + 1}\n0000000000 65535 f \n`;
  for (let id = 1; id <= total; id++) xref += `${String(offsets[id]).padStart(10, '0')} 00000 n \n`;
  escrever(xref);
  escrever(`trailer\n<< /Size ${total + 1} /Root 1 0 R >>\nstartxref\n${inicioXref}\n%%EOF\n`);

  return new Blob(partes as BlobPart[], { type: 'application/pdf' });
}
