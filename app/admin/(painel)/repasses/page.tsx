import { requireRole } from '@/lib/auth/guard';
import { listPerfis, listOutcomes } from '@/lib/painel/store';
import { fetchAppUsers } from '@/lib/app-users';
import { buildRepasses, commissionLabel, formatBRL } from '@/lib/metrics';
import { repasseSchedule, fmtData } from '@/lib/repasse-schedule';
import { PageHeader } from '@/components/admin/PageHeader';
import { StatCard } from '@/components/admin/StatCard';
import { Notice } from '@/components/admin/Notice';
import { Tabela, Td } from '@/components/admin/Tabela';
import { ExportExcelButton } from '@/components/admin/ExportExcelButton';
import { IconCash, IconClock, IconUsers } from '@/components/admin/icons';
import { repasseConfirmado, repasseDoParceiro, competencias, confirmadoDaCompetencia } from '@/lib/parceiros';
import { baseComissoesAgora, totalDe, pagamentoDe } from '@/lib/consultoras';
import { prazoPix, dataBr, nomeCompetencia } from '@/lib/consultoras-regras';
import { marcarPago } from '@/app/admin/(painel)/consultor/actions';

export const dynamic = 'force-dynamic';

export default async function RepassesPage({ searchParams }: { searchParams: { ok?: string; erro?: string } }) {
  requireRole('admin');
  const [perfis, users, outcomes, cons] = await Promise.all([
    listPerfis(),
    fetchAppUsers(),
    listOutcomes(),
    // Sem cache: Financeiro nunca mostra valor velho depois de um "Marcar como pago".
    baseComissoesAgora().catch((e) => {
      console.error('[repasses] comissões de consultoras falharam:', e instanceof Error ? e.message : e);
      return null;
    }),
  ]);

  // Consultoras de sono: o MESMO cálculo e a MESMA tabela de pagamentos de
  // Parcerias › Consultoras de sono (lib/consultoras.ts + consultora_pagamentos).
  const linhasConsultoras = cons
    ? Array.from(new Set(cons.linhas.map((l) => l.competencia)))
        .sort()
        .reverse()
        .flatMap((mes) =>
          cons.consultoras
            .map((c) => ({ c, mes, valor: totalDe(cons.linhas, c.id, mes), pago: pagamentoDe(cons.pagamentos, c.id, mes) }))
            .filter((x) => x.valor > 0 || x.pago),
        )
    : [];
  const consultorasEmAberto = linhasConsultoras.filter((x) => !x.pago).reduce((s, x) => s + x.valor, 0);

  const repasses = buildRepasses(perfis, users, outcomes).filter(
    (r) => r.convertidos > 0 || r.consolidado > 0
  );
  const totalDevido = repasses.reduce((s, r) => s + r.consolidado, 0);
  const totalPrevisto = repasses.reduce((s, r) => s + r.previsao, 0);
  const semPix = repasses.filter((r) => r.consolidado > 0 && !r.perfil.pix_key);
  const sched = repasseSchedule();

  // Parceiros (influenciadores): comissão por cobrança da loja (lib/parceiros.ts).
  const comp = competencias();
  const parceiros = perfis
    .filter((p) => p.role === 'influencer')
    .map((p) => {
      const conf = repasseConfirmado(p, users);
      return {
        perfil: p,
        pagantes: repasseDoParceiro(p, users).pagantes,
        aPagar: confirmadoDaCompetencia(conf, comp.fechada),
        emAberto: confirmadoDaCompetencia(conf, comp.aberta),
      };
    })
    .filter((r) => r.pagantes > 0 || r.aPagar > 0 || r.emAberto > 0);
  const totalParceiros = parceiros.reduce((s, r) => s + r.aPagar, 0);

  const paraExcelConsultoras = linhasConsultoras.map((x) => ({
    Conversor: `${x.c.nome ?? 'Consultora'} (consultora ${x.c.codigo ?? ''})`,
    Usuário: x.c.email_liberado ?? '',
    Comissão: `consultora · ${nomeCompetencia(x.mes)}`,
    'Chave PIX': x.c.pix_chave || '',
    Convertidos: 0,
    Pagando: 0,
    'A pagar': x.pago ? 0 : x.valor,
    Previsto: 0,
  }));

  const paraExcel = repasses.map((r) => ({
    Conversor: r.perfil.display_name,
    Usuário: r.perfil.username,
    Comissão: commissionLabel(r.perfil),
    'Chave PIX': r.perfil.pix_key || '',
    Convertidos: r.convertidos,
    Pagando: r.pagantes,
    'A pagar': r.consolidado,
    Previsto: r.previsao,
  })).concat(
    parceiros.map((r) => ({
      Conversor: `${r.perfil.display_name} (parceiro ${r.perfil.promo_code ?? ''})`,
      Usuário: r.perfil.username,
      Comissão: commissionLabel(r.perfil),
      'Chave PIX': r.perfil.pix_key || '',
      Convertidos: 0,
      Pagando: r.pagantes,
      'A pagar': r.aPagar,
      Previsto: r.emAberto,
    })),
  ).concat(paraExcelConsultoras);

  return (
    <>
      <PageHeader
        title="Repasses"
        subtitle="Quanto pagar a cada conversor, parceiro e consultora de sono. Conversor: leads que ele marcou como convertido e que hoje pagam. Parceiro: cobranças da loja nas contas que vieram do link ou do código dele. Consultora: o mesmo extrato de Parcerias › Consultoras de sono."
        right={<ExportExcelButton rows={paraExcel} filename="ninho-repasses" sheetName="Repasses" />}
      />

      {(searchParams.ok || searchParams.erro) && (
        <div className={`mb-4 rounded-2xl px-4 py-3 text-sm font-semibold ${searchParams.erro ? 'bg-red-50 text-red-600' : 'bg-[#EEF8F1] text-[#256B43]'}`} role="status">
          {searchParams.erro || searchParams.ok}
        </div>
      )}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="A pagar agora"
          value={formatBRL(totalDevido)}
          hint={`${sched.consolidado.competencia} · paga ${fmtData(sched.consolidado.pagamentoEm)}`}
          compactHint
          accent
          icon={<IconCash />}
        />
        <StatCard
          label="Em aberto"
          value={formatBRL(totalPrevisto)}
          hint={`${sched.aberto.competencia} · paga ${fmtData(sched.aberto.pagamentoEm)}`}
          compactHint
          icon={<IconClock />}
        />
        <StatCard label="Conversores com valor" value={repasses.length} icon={<IconUsers />} />
      </div>

      <Notice>
        Fechamento mensal: tudo que a loja cobrar entre o dia 1 e o último dia do mês é pago no dia
        30 do mês seguinte — Apple e Google repassam com cerca de 45 dias. Pagamento via Pix, sem
        nota fiscal.
      </Notice>

      {semPix.length > 0 && (
        <Notice tone="warn">
          {semPix.length === 1
            ? `${semPix[0].perfil.display_name} tem repasse a receber mas não cadastrou chave PIX.`
            : `${semPix.length} conversores têm repasse a receber mas não cadastraram chave PIX.`}{' '}
          Cada um preenche a própria chave em Minha conta.
        </Notice>
      )}

      <Tabela
        headers={['Conversor', 'Comissão', 'Chave PIX', 'Pagando', 'A pagar', 'Em aberto']}
        vazio="Nenhum repasse a fazer. Assim que um conversor marcar um lead como convertido e ele assinar, aparece aqui."
      >
        {repasses.map((r) => (
          <tr key={r.perfil.id}>
            <Td className="font-medium">{r.perfil.display_name}</Td>
            <Td className="text-xs text-ninho-cinza">{commissionLabel(r.perfil)}</Td>
            <Td className="font-mono text-xs">
              {r.perfil.pix_key || <span className="text-red-500">não cadastrada</span>}
            </Td>
            <Td>{r.pagantes}</Td>
            <Td className="whitespace-nowrap font-semibold text-ninho-roxo-escuro">
              {formatBRL(r.consolidado)}
            </Td>
            <Td className="whitespace-nowrap text-ninho-cinza">{formatBRL(r.previsao)}</Td>
          </tr>
        ))}
      </Tabela>

      <h2 className="mb-3 mt-8 text-base font-bold text-ninho-grafite">Parceiros (influenciadores)</h2>
      <p className="mb-3 text-sm text-ninho-cinza">
        A pagar = cobranças de {sched.consolidado.competencia} (Pix {fmtData(sched.consolidado.pagamentoEm)}). Em aberto =
        cobranças de {sched.aberto.competencia} até agora. Total a pagar aos parceiros: {formatBRL(totalParceiros)}.
      </p>
      <Tabela
        headers={['Parceiro', 'Código', 'Comissão', 'Chave PIX', 'Pagando', 'A pagar', 'Em aberto']}
        vazio="Nenhum parceiro com valor ainda. Os números de cada um ficam em Crescimento > Parceiros."
      >
        {parceiros.map((r) => (
          <tr key={r.perfil.id}>
            <Td className="font-medium">{r.perfil.display_name}</Td>
            <Td className="font-mono text-xs text-ninho-roxo-escuro">{r.perfil.promo_code || '—'}</Td>
            <Td className="text-xs text-ninho-cinza">{commissionLabel(r.perfil)}</Td>
            <Td className="font-mono text-xs">
              {r.perfil.pix_key || <span className="text-red-500">não cadastrada</span>}
            </Td>
            <Td>{r.pagantes}</Td>
            <Td className="whitespace-nowrap font-semibold text-ninho-roxo-escuro">{formatBRL(r.aPagar)}</Td>
            <Td className="whitespace-nowrap text-ninho-cinza">{formatBRL(r.emAberto)}</Td>
          </tr>
        ))}
      </Tabela>

      <h2 className="mb-3 mt-8 text-base font-bold text-ninho-grafite">Consultoras de sono</h2>
      <p className="mb-3 text-sm text-ninho-cinza">
        Pix até o 5º dia útil do mês seguinte ao das cobranças (feriado nacional não conta). Em aberto agora:{' '}
        {formatBRL(consultorasEmAberto)}. &ldquo;Marcar como pago&rdquo; aqui ou em Parcerias › Consultoras de sono grava no
        mesmo lugar, e a consultora vê &ldquo;Pago&rdquo; no app e no painel.
      </p>
      {!cons && <Notice tone="warn">Não consegui ler as comissões das consultoras agora. Recarregue a página.</Notice>}
      <Tabela
        headers={['Consultora', 'Mês das cobranças', 'Chave PIX', 'Valor', 'Prazo do Pix', 'Situação']}
        vazio="Nenhuma comissão de consultora ainda."
      >
        {linhasConsultoras.map((x) => (
          <tr key={`${x.c.id}-${x.mes}`}>
            <Td className="font-medium">{x.c.nome}</Td>
            <Td>{nomeCompetencia(x.mes)}</Td>
            <Td className="font-mono text-xs">{x.c.pix_chave || <span className="text-red-500">não cadastrada</span>}</Td>
            <Td className="whitespace-nowrap font-semibold text-ninho-roxo-escuro">{formatBRL(x.pago ? x.pago.valor : x.valor)}</Td>
            <Td className="whitespace-nowrap">{dataBr(prazoPix(x.mes))}</Td>
            <Td>
              {x.pago ? (
                <span className="text-xs font-semibold text-[#2F8A55]">
                  Pago em {new Date(x.pago.pago_em).toLocaleDateString('pt-BR', { timeZone: 'Asia/Dubai' })}
                  {Math.abs(x.pago.valor - x.valor) >= 0.01 && <span className="block font-normal text-[#B7791F]">extrato hoje: {formatBRL(x.valor)}</span>}
                </span>
              ) : (
                <form action={marcarPago}>
                  <input type="hidden" name="id" value={x.c.id} />
                  <input type="hidden" name="competencia" value={x.mes} />
                  <input type="hidden" name="volta" value="repasses" />
                  <button className="rounded-pill bg-[#F1EBFC] px-3 py-1.5 text-xs font-bold text-[#7C5CD6]">Marcar como pago</button>
                </form>
              )}
            </Td>
          </tr>
        ))}
      </Tabela>
    </>
  );
}
