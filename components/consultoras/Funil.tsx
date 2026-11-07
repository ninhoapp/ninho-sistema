/**
 * Funil do link /c/<código> por mês (cliques, downloads, cadastros,
 * assinantes, cancelamentos). Mesmo desenho do funil do parceiro.
 */
import { nomeMes } from '@/lib/consultoras-regras';
import type { MesFunil } from '@/lib/consultoras';
import { td, th } from '@/components/consultoras/ui';

export function FunilTabela({ meses, indisponivel }: { meses: MesFunil[]; indisponivel: boolean }) {
  const tot = meses.reduce(
    (s, m) => ({
      cliques: s.cliques + m.cliques,
      cliquesUnicos: s.cliquesUnicos + m.cliquesUnicos,
      downloads: s.downloads + m.downloads,
      cadastros: s.cadastros + m.cadastros,
      assinantes: s.assinantes + m.assinantes,
      cancelamentos: s.cancelamentos + m.cancelamentos,
    }),
    { cliques: 0, cliquesUnicos: 0, downloads: 0, cadastros: 0, assinantes: 0, cancelamentos: 0 },
  );
  const cel = (v: number | string) => <td className={`${td} text-right tabular-nums`}>{v}</td>;
  const semRastreio = indisponivel ? '—' : null;
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr>
            <th className={th}>Mês</th>
            <th className={`${th} text-right`}>Cliques (únicos)</th>
            <th className={`${th} text-right`}>Downloads</th>
            <th className={`${th} text-right`}>Cadastros</th>
            <th className={`${th} text-right`}>Assinaram</th>
            <th className={`${th} text-right`}>Cancelaram</th>
          </tr>
        </thead>
        <tbody>
          {[...meses].reverse().map((m) => (
            <tr key={m.mes}>
              <td className={td}>{nomeMes(m.mes)}</td>
              {cel(semRastreio ?? `${m.cliques} (${m.cliquesUnicos})`)}
              {cel(semRastreio ?? m.downloads)}
              {cel(m.cadastros)}
              {cel(m.assinantes)}
              {cel(m.cancelamentos)}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td className={`${td} font-extrabold`}>Total</td>
            {cel(semRastreio ?? `${tot.cliques} (${tot.cliquesUnicos})`)}
            {cel(semRastreio ?? tot.downloads)}
            {cel(tot.cadastros)}
            {cel(tot.assinantes)}
            {cel(tot.cancelamentos)}
          </tr>
        </tfoot>
      </table>
      <p className="mt-2 text-[11.5px] leading-snug text-ninho-cinza">
        {indisponivel ? 'Cliques e downloads do link ainda não estão sendo contados. ' : ''}
        Cadastros: contas criadas pelo seu link ou código. Assinaram: 1ª cobrança no mês. Cancelaram: fim do período
        pago no mês. Download só conta quando o app casa a instalação com o clique (mesmo celular e rede).
      </p>
    </div>
  );
}
