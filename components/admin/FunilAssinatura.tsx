/**
 * Funil do cadastro à assinatura (Visão geral). Cada barra é medida contra a
 * primeira etapa (cadastros). À direita aparece quanto ela representa dos
 * cadastros, e embaixo do nome quanto passou da etapa anterior: é ali que se
 * vê onde o funil mais perde gente. O desenho veio do painel do SOMI, que o
 * dono pediu igual (20/11/2026).
 */
export interface EtapaFunil {
  label: string;
  n: number;
  cor: string;
}

function pct(n: number, base: number): string {
  if (base <= 0) return '—';
  const v = (n / base) * 100;
  return `${v > 0 && v < 1 ? v.toFixed(1) : Math.round(v)}%`;
}

export function FunilAssinatura({ etapas, rodape }: { etapas: EtapaFunil[]; rodape?: React.ReactNode }) {
  const topo = Math.max(1, etapas[0]?.n ?? 1);
  return (
    <div className="rounded-2xl border border-ninho-borda bg-white p-5">
      <h2 className="text-base font-bold text-ninho-grafite">Funil: do cadastro à assinatura</h2>
      <p className="mb-5 mt-1 text-xs text-ninho-cinza">
        Todos os usuários do app. À direita, quanto cada etapa representa dos cadastros; embaixo do
        nome, quanto passou da etapa anterior. É ali que se vê onde o funil mais perde gente.
      </p>
      <div className="flex flex-col gap-3">
        {etapas.map((e, i) => (
          <div key={e.label} className="flex items-center gap-3">
            <div className="w-44 shrink-0">
              <p className="text-sm text-ninho-grafite">{e.label}</p>
              {i > 0 && (
                <p className="text-[11px] text-ninho-cinza">
                  {pct(e.n, etapas[i - 1].n)} da etapa anterior
                </p>
              )}
            </div>
            <div className="h-7 flex-1 overflow-hidden rounded-lg bg-ninho-nuvem">
              <div
                className="flex h-full items-center rounded-lg px-2.5 text-xs font-bold text-white"
                style={{
                  width: `${Math.max(e.n > 0 ? 4 : 0, (e.n / topo) * 100)}%`,
                  background: e.cor,
                }}
              >
                {e.n > 0 ? e.n.toLocaleString('pt-BR') : ''}
              </div>
            </div>
            <span className="w-12 shrink-0 text-right text-xs font-semibold text-ninho-grafite">
              {i === 0 ? '' : pct(e.n, topo)}
            </span>
          </div>
        ))}
      </div>
      {rodape && <p className="mt-5 text-xs text-ninho-cinza">{rodape}</p>}
    </div>
  );
}
