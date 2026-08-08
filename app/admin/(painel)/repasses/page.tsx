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

export const dynamic = 'force-dynamic';

export default async function RepassesPage() {
  requireRole('admin');
  const [perfis, users, outcomes] = await Promise.all([
    listPerfis(),
    fetchAppUsers(),
    listOutcomes(),
  ]);

  const repasses = buildRepasses(perfis, users, outcomes).filter(
    (r) => r.convertidos > 0 || r.consolidado > 0
  );
  const totalDevido = repasses.reduce((s, r) => s + r.consolidado, 0);
  const totalPrevisto = repasses.reduce((s, r) => s + r.previsao, 0);
  const semPix = repasses.filter((r) => r.consolidado > 0 && !r.perfil.pix_key);
  const sched = repasseSchedule();

  const paraExcel = repasses.map((r) => ({
    Conversor: r.perfil.display_name,
    Usuário: r.perfil.username,
    Comissão: commissionLabel(r.perfil),
    'Chave PIX': r.perfil.pix_key || '',
    Convertidos: r.convertidos,
    Pagando: r.pagantes,
    'A pagar': r.consolidado,
    Previsto: r.previsao,
  }));

  return (
    <>
      <PageHeader
        title="Repasses"
        subtitle="Quanto pagar a cada conversor. A comissão sai dos leads que ele marcou como convertido e que hoje estão pagando."
        right={<ExportExcelButton rows={paraExcel} filename="ninho-repasses" sheetName="Repasses" />}
      />

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
    </>
  );
}
