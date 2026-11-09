import type { DiaPrevisao } from '@/lib/previsao';

const fmt = (n: number) => n.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
const dm = (dia: string) => `${dia.slice(8, 10)}/${dia.slice(5, 7)}`;

/**
 * Assinantes por dia: barras cheias = pagaram (real), traço = o que o modelo
 * esperava naquele dia; barras claras = previsão com a faixa de 80%. SVG puro
 * (sem JS), todas as barras cabem na largura, sem rolagem lateral. Passe o
 * mouse numa barra para ver o número (title nativo).
 */
export function PrevisaoChart({ dias, hoje }: { dias: DiaPrevisao[]; hoje: string }) {
  const W = 1000, H = 260, L = 30, R = 6, T = 12, B = 28;
  const max = Math.max(4, ...dias.map((d) => Math.max(d.real ?? 0, d.alto)));
  const topo = Math.ceil(max / 2) * 2;
  const n = dias.length;
  const bw = (W - L - R) / Math.max(1, n);
  const y = (v: number) => T + (H - T - B) * (1 - v / topo);
  const passo = topo <= 8 ? 2 : topo <= 16 ? 4 : 5;
  const iHoje = dias.findIndex((d) => d.dia === hoje);

  return (
    <div className="rounded-2xl border border-ninho-borda bg-white p-3 sm:p-5">
      <div className="mb-2 flex flex-wrap gap-4 text-xs text-ninho-cinza">
        <span className="inline-flex items-center gap-1.5">
          <i className="inline-block h-3 w-3 rounded-sm bg-ninho-roxo" />Pagaram (real)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <i className="inline-block h-0.5 w-3.5 bg-ninho-grafite" />Esperado pelo modelo
        </span>
        <span className="inline-flex items-center gap-1.5">
          <i className="inline-block h-3 w-3 rounded-sm bg-ninho-roxo-suave" />Previsto
        </span>
        <span className="inline-flex items-center gap-1.5">
          <i className="inline-block h-3.5 w-0.5 bg-ninho-cinza" />Faixa de 80%
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-label="Assinantes por dia, real e previsto">
        {Array.from({ length: Math.floor(topo / passo) + 1 }, (_, i) => i * passo).map((g) => (
          <g key={g}>
            <line x1={L} x2={W - R} y1={y(g)} y2={y(g)} className="stroke-ninho-borda" strokeWidth={1} />
            <text x={L - 6} y={y(g) + 4} textAnchor="end" fontSize={11} className="fill-ninho-cinza">
              {g}
            </text>
          </g>
        ))}
        {iHoje >= 0 && (
          <line
            x1={L + (iHoje + 1) * bw}
            x2={L + (iHoje + 1) * bw}
            y1={T}
            y2={H - B}
            className="stroke-ninho-cinza"
            strokeDasharray="3 3"
          />
        )}
        {dias.map((d, i) => {
          const x = L + i * bw + 1;
          const w = Math.max(2, bw - 2);
          const cx = x + w / 2;
          const v = d.futuro ? d.esperado : (d.real ?? 0);
          const titulo = d.futuro
            ? `${dm(d.dia)}: previsto ${fmt(d.esperado)} (de ${fmt(d.baixo)} a ${fmt(d.alto)})`
            : `${dm(d.dia)}: ${d.real} pagaram · modelo esperava ${fmt(d.esperado)}`;
          const label = d.dia.endsWith('-01') || d.dia.endsWith('-15') || d.dia === hoje;
          return (
            <g key={d.dia}>
              <title>{titulo}</title>
              {v > 0 && (
                <rect
                  x={x}
                  y={y(v)}
                  width={w}
                  height={y(0) - y(v)}
                  rx={Math.min(3, w / 2)}
                  className={d.futuro ? 'fill-ninho-roxo-suave' : 'fill-ninho-roxo'}
                />
              )}
              {d.futuro ? (
                <line x1={cx} x2={cx} y1={y(d.alto)} y2={y(d.baixo)} className="stroke-ninho-cinza" strokeWidth={1.5} />
              ) : (
                d.esperado > 0 && (
                  <line x1={x - 1} x2={x + w + 1} y1={y(d.esperado)} y2={y(d.esperado)} className="stroke-ninho-grafite" strokeWidth={2} />
                )
              )}
              <rect x={L + i * bw} y={T} width={bw} height={H - T - B} fill="transparent" />
              {label && (
                <text x={cx} y={H - B + 17} textAnchor="middle" fontSize={11} className="fill-ninho-cinza">
                  {d.dia === hoje ? 'hoje' : dm(d.dia)}
                </text>
              )}
            </g>
          );
        })}
        <line x1={L} x2={W - R} y1={y(0)} y2={y(0)} className="stroke-ninho-cinza" strokeWidth={1} />
      </svg>
    </div>
  );
}
