/**
 * Linhas do plano (um traço por cenário) × linha do realizado, em SVG puro.
 * Server-safe. Todos os meses cabem na largura do card, sem rolar.
 *
 * - Plano: linha fina; o cenário escolhido fica mais forte.
 * - Realizado: linha grossa escura com ponto e valor em cada mês.
 * - Marcas verticais: "hoje" e o fim do bolso do dono.
 */
export interface SeriePlano {
  key: string;
  label: string;
  color: string;
  /** Valor por mês (mesma ordem de `meses`); null = sem ponto. */
  valores: (number | null)[];
  destaque?: boolean;
}

function teto(max: number): number {
  if (max <= 10) return 10;
  const pot = 10 ** Math.floor(Math.log10(max));
  for (const f of [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) {
    if (f * pot >= max) return f * pot;
  }
  return 10 * pot;
}

export function PlanoRealChart({
  meses,
  rotulos,
  plano,
  realizado,
  unidade,
  formatar = (v) => Math.round(v).toLocaleString('pt-BR'),
  marcas = [],
  escalaMax,
}: {
  meses: string[];
  rotulos: string[];
  plano: SeriePlano[];
  realizado: (number | null)[];
  /** Escrito no eixo, ex.: "assinantes". */
  unidade: string;
  formatar?: (v: number) => string;
  marcas?: { mes: string; label: string; tracejada?: boolean }[];
  /** Topo do eixo. Sem ele, cabe tudo. Linha que passa do topo é cortada e
   *  ganha o valor final no canto, com seta. */
  escalaMax?: number;
}) {
  const W = 880, H = 320, L = 56, R = 64, T = 20, B = 40;
  const todos = [...plano.flatMap((s) => s.valores), ...realizado].filter((v): v is number => v != null);
  const max = teto(escalaMax ?? Math.max(1, ...todos));
  const n = meses.length;
  const x = (i: number) => L + (i * (W - L - R)) / Math.max(1, n - 1);
  const y = (v: number) => T + (H - T - B) * (1 - v / max);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * max);
  const caminho = (vals: (number | null)[]) =>
    vals
      .map((v, i) => (v == null ? null : `${x(i)},${y(v)}`))
      .filter(Boolean)
      .join(' ');
  const ultimoReal = realizado.reduce<number>((acc, v, i) => (v != null ? i : acc), -1);

  return (
    <div className="rounded-2xl border border-ninho-borda bg-white p-3 sm:p-5">
      <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-ninho-cinza">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-[3px] w-5 rounded bg-ninho-grafite" />
          <strong className="text-ninho-grafite">Realizado</strong>
        </span>
        {plano.map((s) => (
          <span key={s.key} className="flex items-center gap-1.5">
            <span
              className="inline-block w-5 rounded"
              style={{ background: s.color, height: s.destaque ? 3 : 2, opacity: s.destaque ? 1 : 0.6 }}
            />
            Plano {s.label.toLowerCase()}
          </span>
        ))}
        {marcas.map((m) => (
          <span key={m.label} className="flex items-center gap-1.5">
            <span className={`inline-block h-3 w-0 border-l ${m.tracejada ? 'border-dashed' : ''} border-ninho-cinza`} />
            {m.label}
          </span>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-label={`Plano e realizado, em ${unidade}`}>
        <defs>
          <clipPath id="plano-area">
            <rect x={0} y={T - 2} width={W} height={H - T - B + 4} />
          </clipPath>
        </defs>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke="#ECE6F5" />
            <text x={L - 8} y={y(t) + 4} textAnchor="end" fontSize="12" fill="#8A8299">
              {formatar(t)}
            </text>
          </g>
        ))}
        <text x={14} y={T + (H - T - B) / 2} fontSize="12" fill="#8A8299" textAnchor="middle" transform={`rotate(-90 14 ${T + (H - T - B) / 2})`}>
          {unidade}
        </text>
        {rotulos.map((r, i) => (
          <text key={r} x={x(i)} y={H - 14} textAnchor="middle" fontSize="11" fill="#8A8299">
            {r}
          </text>
        ))}
        {marcas.map((m) => {
          const i = meses.indexOf(m.mes);
          if (i < 0) return null;
          return (
            <g key={m.label}>
              <line x1={x(i)} x2={x(i)} y1={T} y2={H - B} stroke="#8A8299" strokeDasharray={m.tracejada ? '4 4' : undefined} />
              <text x={x(i) + 4} y={T + 10} fontSize="11" fill="#8A8299">{m.label}</text>
            </g>
          );
        })}
        {plano.map((s) => {
          const ult = s.valores.reduce<number>((acc, v, i) => (v != null ? i : acc), -1);
          return (
            <g key={s.key} opacity={s.destaque ? 1 : 0.55}>
              <polyline clipPath="url(#plano-area)" points={caminho(s.valores)} fill="none" stroke={s.color} strokeWidth={s.destaque ? 2.5 : 1.5} strokeLinejoin="round" />
              {ult >= 0 && (s.valores[ult] as number) > max && (
                <text x={W - R + 6} y={T + 4} fontSize="12" fontWeight={600} fill={s.color}>
                  ↑ {formatar(s.valores[ult] as number)}
                </text>
              )}
              {ult >= 0 && (s.valores[ult] as number) <= max && (
                <>
                  <circle cx={x(ult)} cy={y(s.valores[ult] as number)} r={3.5} fill={s.color} />
                  <text x={x(ult) + 6} y={y(s.valores[ult] as number) + 4} fontSize="12" fontWeight={600} fill={s.color}>
                    {formatar(s.valores[ult] as number)}
                  </text>
                </>
              )}
              {s.valores.map((v, i) =>
                v == null || v > max ? null : (
                  <circle key={i} cx={x(i)} cy={y(v)} r={8} fill="transparent">
                    <title>{`${rotulos[i]} · plano ${s.label.toLowerCase()}: ${formatar(v)} ${unidade}`}</title>
                  </circle>
                )
              )}
            </g>
          );
        })}
        <polyline points={caminho(realizado)} fill="none" stroke="#2E2A3A" strokeWidth={3} strokeLinejoin="round" />
        {realizado.map((v, i) =>
          v == null ? null : (
            <g key={i}>
              <circle cx={x(i)} cy={y(v)} r={4.5} fill="#2E2A3A" stroke="#fff" strokeWidth={1.5}>
                <title>{`${rotulos[i]} · realizado: ${formatar(v)} ${unidade}`}</title>
              </circle>
              {i === ultimoReal && (
                <text x={x(i)} y={y(v) - 10} textAnchor="middle" fontSize="12" fontWeight={700} fill="#2E2A3A">
                  {formatar(v)}
                </text>
              )}
            </g>
          )
        )}
      </svg>
    </div>
  );
}
