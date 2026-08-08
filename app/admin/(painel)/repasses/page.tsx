import { requireRole } from '@/lib/auth/guard';
import { listPerfis, listOutcomes } from '@/lib/painel/store';
import { fetchAppUsers } from '@/lib/app-users';
import { buildRepasses, commissionLabel, formatBRL } from '@/lib/metrics';
import { PageHeader } from '@/components/admin/PageHeader';
import { StatCard } from '@/components/admin/StatCard';
import { Notice } from '@/components/admin/Notice';
import { Tabela, Td } from '@/components/admin/Tabela';

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

  return (
    <>
      <PageHeader
        title="Repasses"
        subtitle="Quanto pagar a cada conversor. A comissão sai dos leads que ele marcou como convertido e que hoje estão pagando."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="A pagar agora"
          value={formatBRL(totalDevido)}
          hint="Convertidos com assinatura ativa"
          accent
        />
        <StatCard
          label="Previsto"
          value={formatBRL(totalPrevisto)}
          hint="Se os trials convertidos virarem pagantes"
        />
        <StatCard label="Conversores com valor" value={repasses.length} />
      </div>

      {semPix.length > 0 && (
        <Notice tone="warn">
          {semPix.length === 1
            ? `${semPix[0].perfil.display_name} tem repasse a receber mas não cadastrou chave PIX.`
            : `${semPix.length} conversores têm repasse a receber mas não cadastraram chave PIX.`}{' '}
          Cada um preenche a própria chave em Minha conta.
        </Notice>
      )}

      <Tabela
        headers={['Conversor', 'Comissão', 'Chave PIX', 'Pagando', 'A pagar', 'Previsto']}
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
