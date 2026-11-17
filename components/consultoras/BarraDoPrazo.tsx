import { andamentoDoPrazo, diasAteTermino, semanaDoPrazo, textoDoPrazo } from '@/lib/consultoras';

/**
 * A barrinha do prazo da consultoria (00186, pedido do dono de 17/11/2026).
 *
 * Aparece na lista de famílias e na ficha. Sem as duas datas não há barra:
 * quem não preencheu vê o aviso de que falta preencher. Só existe para
 * família com consultora — nenhuma outra tela do painel usa isto.
 */

function dataBrCurta(iso: string | null): string {
  if (!iso) return '—';
  const [, m, d] = iso.split('-');
  return `${d}/${m}`;
}

export function BarraDoPrazo({ inicio, termino, compacta = false }: { inicio: string | null; termino: string | null; compacta?: boolean }) {
  const dias = diasAteTermino(termino);
  const texto = textoDoPrazo(termino);
  const andamento = andamentoDoPrazo(inicio, termino);
  const semana = semanaDoPrazo(inicio, termino);
  if (dias === null) return null;

  // Reta final em âmbar (2 semanas), último dia em vermelho: a mesma leitura
  // de urgência que a consultora já tem no resto do painel.
  const cor = dias <= 1 ? 'from-[#F09B9B] to-[#E85D5D]' : dias <= 14 ? 'from-[#F6C87A] to-[#E8A13C]' : 'from-[#9F86E0] to-[#7C5CD6]';
  const largura = Math.round((andamento ?? (dias <= 0 ? 1 : 0)) * 100);

  return (
    <div className={compacta ? 'min-w-[190px]' : ''}>
      <div className="flex items-baseline justify-between gap-2">
        <b className="text-[12.5px]">{texto}</b>
        {semana && <span className="text-[11.5px] font-bold text-ninho-cinza">semana {semana.atual} de {semana.total}</span>}
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-[#EFEAF8]">
        <div className={`h-full rounded-full bg-gradient-to-r ${cor}`} style={{ width: `${largura}%` }} />
      </div>
      <div className="mt-1 flex justify-between text-[11px] tabular-nums text-[#9A95AD]">
        <span>{dataBrCurta(inicio)}</span>
        <span>{dataBrCurta(termino)}</span>
      </div>
    </div>
  );
}
