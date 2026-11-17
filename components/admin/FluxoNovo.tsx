import { pct, type FluxoNovo, type Grupo, type Taxas, DIA_MUDANCA, DIAS_JANELA, MINIMO_DECIDIDOS } from '@/lib/teste-paywall';
import { Notice } from '@/components/admin/Notice';

/** Seção "Fluxo novo" da tela Teste de paywall (14/11/2026: todo iPhone
 *  novo no C, 00151 do Ninho-expo). Recebe os números prontos de
 *  fetchTestePaywall().fluxoNovo. */
const COR: Record<Grupo, string> = { A: '#9F86E0', B: '#F7A83C', C: '#4C9BE8' };

export const dataBR = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}`;

/** Data e hora no fuso de Dubai, como o resto do painel: "14/11 15:42". */
const quandoDubai = (iso: string) =>
  new Intl.DateTimeFormat('pt-BR', { timeZone: 'Asia/Dubai', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
    .format(new Date(iso))
    .replace(',', '');

/** Uma linha da tabela do fluxo novo: as mesmas contas do teste_paywall_resumo
 *  (pagou ÷ todos e pagou ÷ decididos) e o funil do cartão. */
function LinhaTaxas({ rotulo, cor, t, total = false }: { rotulo: string; cor?: string; t: Taxas; total?: boolean }) {
  const celula = (parte: number, base: number, destaque = false) => (
    <td className={`px-3 py-2.5 text-right ${destaque ? 'font-bold text-ninho-roxo-escuro' : ''}`}>
      {pct(parte, base)}{' '}
      <span className="text-xs font-normal text-ninho-cinza">
        ({parte}/{base})
      </span>
    </td>
  );
  return (
    <tr className={`border-b border-ninho-borda last:border-b-0 ${total ? 'bg-ninho-nuvem/60 font-semibold' : ''}`}>
      <td className="px-3 py-2.5">
        <span className="inline-flex items-center gap-2">
          {cor && <span className="inline-block h-3 w-3 rounded-sm" style={{ background: cor }} />}
          {rotulo}
        </span>
      </td>
      <td className="px-3 py-2.5 text-right">{t.cadastros}</td>
      <td className={`px-3 py-2.5 text-right ${t.decididos < MINIMO_DECIDIDOS ? 'text-state-warning' : ''}`}>{t.decididos}</td>
      {celula(t.pagaram, t.cadastros, true)}
      {celula(t.pagaram, t.decididos)}
      {celula(t.cartao, t.cadastros)}
      {celula(t.cancelaram, t.cartao)}
      {celula(t.cartaoPagaram, t.cartaoDecididos)}
    </tr>
  );
}

function CabecalhoTaxas({ primeira }: { primeira: string }) {
  return (
    <thead>
      <tr className="border-b border-ninho-borda text-left text-xs text-ninho-cinza">
        <th className="px-3 py-3 font-semibold">{primeira}</th>
        <th className="px-3 py-3 text-right font-semibold">Cadastros</th>
        <th className="px-3 py-3 text-right font-semibold">Decididos</th>
        <th className="px-3 py-3 text-right font-semibold text-ninho-roxo-escuro">Pagantes ÷ cadastros</th>
        <th className="px-3 py-3 text-right font-semibold">Pagantes ÷ decididos</th>
        <th className="px-3 py-3 text-right font-semibold">Puseram o cartão</th>
        <th className="px-3 py-3 text-right font-semibold">Cancelaram no teste</th>
        <th className="px-3 py-3 text-right font-semibold">Pagaram depois do teste</th>
      </tr>
    </thead>
  );
}

export function FluxoNovoSecao({ f }: { f: FluxoNovo }) {
  const ordem: Grupo[] = ['A', 'B', 'C'];
  const pequenos = [
    f.antes.total.decididos < MINIMO_DECIDIDOS ? `antes: ${f.antes.total.decididos}` : null,
    f.depois.total.decididos < MINIMO_DECIDIDOS ? `depois: ${f.depois.total.decididos}` : null,
  ].filter(Boolean);
  return (
    <section className="mb-10">
      <h2 className="mb-1 text-base font-bold text-ninho-grafite">Fluxo novo · todo iPhone no C desde {dataBR(DIA_MUDANCA)}</h2>
      <p className="mb-4 text-xs text-ninho-cinza">
        Métrica principal: <strong>pagantes ÷ cadastros</strong>. Desde o início do teste, só quem foi sorteado (a
        mesma base do teste_paywall_resumo).
      </p>

      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        {ordem.map((g) => {
          const t = f.geral[g];
          return (
            <div key={g} className="rounded-2xl border border-ninho-borda bg-white p-5">
              <div className="mb-2 flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded-sm" style={{ background: COR[g] }} />
                <span className="text-sm font-bold text-ninho-grafite">Grupo {g}</span>
              </div>
              <p className="text-3xl font-bold text-ninho-roxo-escuro">{pct(t.pagaram, t.cadastros)}</p>
              <p className="text-xs text-ninho-cinza">
                pagantes ÷ cadastros · {t.pagaram} de {t.cadastros}
              </p>
              <p className="mt-2 text-sm text-ninho-grafite">
                {pct(t.pagaram, t.decididos)}{' '}
                <span className="text-xs text-ninho-cinza">pagantes ÷ decididos · {t.pagaram} de {t.decididos}</span>
              </p>
            </div>
          );
        })}
      </div>

      <div className="mb-2 overflow-x-auto rounded-2xl border border-ninho-borda bg-white">
        <table className="w-full text-sm">
          <CabecalhoTaxas primeira="Desde o início (sorteados)" />
          <tbody>
            {ordem.map((g) => (
              <LinhaTaxas key={g} rotulo={`Grupo ${g}`} cor={COR[g]} t={f.geral[g]} />
            ))}
            {f.cSemSorteio.cadastros > 0 && (
              <LinhaTaxas rotulo="Grupo C · fluxo novo (sem sorteio)" cor={COR.C} t={f.cSemSorteio} />
            )}
          </tbody>
        </table>
      </div>
      {f.divergencias.length > 0 ? (
        <Notice tone="warn">
          <strong>Não bate com o teste_paywall_resumo:</strong> {f.divergencias.join(' · ')}
        </Notice>
      ) : (
        <p className="mb-6 text-xs text-state-success">✓ Confere com o teste_paywall_resumo do banco (cadastros, decididos, pagaram, cartão e cancelamentos).
          <span className="text-ninho-cinza"> A linha <strong>C · fluxo novo</strong> não entra na view: é todo iPhone que entrou depois da mudança, sem sorteio (quem veio por link de parceiro ou consultora antes dela fica de fora). Aparece quando entrar a primeira pessoa.</span></p>
      )}

      <h3 className="mb-1 mt-6 text-sm font-bold text-ninho-grafite">
        {DIAS_JANELA} dias antes × {DIAS_JANELA} dias depois da mudança ({quandoDubai(f.corte)}, fuso de Dubai)
      </h3>
      <p className="mb-3 text-xs text-ninho-cinza">
        Pela hora em que a pessoa entrou no teste. O corte é o <strong>último sorteado</strong>: a 00151 entrou no meio
        de 14/11, e depois dela nenhum iPhone é mais sorteado
        {f.corteAproximado ? ' (não achei sorteado em 13–15/11, então o corte é 14/11 00:00 de Dubai)' : ''}. Aqui entra
        todo mundo com grupo, sorteado ou não. O B saiu em 12/11. Depois: dia {f.depois.diasCorridos} de {DIAS_JANELA}.
      </p>
      <Notice tone="warn">
        <strong>O A mistura Android com iPhone.</strong> A view não diz a plataforma. O <strong>A depois</strong> é só
        Android (de propósito: o Google Play não tem os 7 dias grátis da loja). O <strong>A antes</strong> mistura
        iPhone sorteado, Android e bebê a caminho. No depois, o iPhone é a linha do <strong>C</strong>.
      </Notice>
      {pequenos.length > 0 && (
        <Notice tone="warn">
          <strong>Amostra pequena para concluir</strong> — menos de {MINIMO_DECIDIDOS} cadastros decididos ({pequenos.join(' · ')}).
          Quem entrou há menos de 7 dias ainda está no período grátis e não conta como decidido; espere fechar os{' '}
          {DIAS_JANELA} dias + 8 para comparar de verdade.
        </Notice>
      )}
      <div className="mb-2 overflow-x-auto rounded-2xl border border-ninho-borda bg-white">
        <table className="w-full text-sm">
          <CabecalhoTaxas primeira="Período · grupo" />
          <tbody>
            {[
              { nome: `Antes · ${quandoDubai(f.antes.de)} a ${quandoDubai(f.antes.ate)}`, lado: f.antes },
              { nome: `Depois · ${quandoDubai(f.depois.de)} a ${quandoDubai(f.depois.ate)}`, lado: f.depois },
            ].flatMap(({ nome, lado }) => [
              <LinhaTaxas key={`${nome}|total`} rotulo={nome} t={lado.total} total />,
              ...ordem
                .filter((g) => lado.grupos[g])
                .map((g) => <LinhaTaxas key={`${nome}|${g}`} rotulo={`Grupo ${g}`} cor={COR[g]} t={lado.grupos[g]!} />),
            ])}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-ninho-cinza">
        <strong>Decididos</strong> = já pagou ou o período grátis acabou (em amarelo quando são menos de {MINIMO_DECIDIDOS}).{' '}
        <strong>Puseram o cartão</strong> = começaram os 7 dias grátis da loja ÷ cadastros.{' '}
        <strong>Cancelaram no teste</strong> = desligaram a renovação antes da 1ª cobrança ÷ quem pôs o cartão.{' '}
        <strong>Pagaram depois do teste</strong> = pagaram a 1ª cobrança ÷ quem pôs o cartão e já passou dos 7 dias da
        loja (+1 dia de folga).
      </p>
    </section>
  );
}
