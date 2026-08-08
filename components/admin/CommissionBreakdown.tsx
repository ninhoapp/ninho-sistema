import type { ComissaoPorPlano } from '@/lib/precos';

function brl(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/**
 * Mostra a comissão (percentual ou valor) e quanto ela vale em R$ para cada
 * plano: Premium mensal e Premium anual.
 */
export function CommissionBreakdown({
  headline,
  itens,
  compact = false,
}: {
  headline: string;
  itens: ComissaoPorPlano[];
  compact?: boolean;
}) {
  return (
    <div>
      <p className={`font-semibold text-ninho-grafite ${compact ? 'text-sm' : 'text-base'}`}>
        {headline}
      </p>
      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {itens.map(({ plano, valor }) => (
          <div key={plano.key} className="rounded-xl border border-ninho-borda bg-white p-3">
            <p className="text-[11px] uppercase tracking-wide text-ninho-cinza">{plano.label}</p>
            <p className="mt-0.5 text-lg font-bold text-ninho-roxo-escuro">{brl(valor)}</p>
            <p className="text-[11px] text-ninho-cinza">
              {plano.anual ? 'por ano (1x)' : 'por mês'} · plano {brl(plano.price)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
