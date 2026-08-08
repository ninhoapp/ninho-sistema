import Link from 'next/link';
import { requireRole } from '@/lib/auth/guard';
import { listPerfis, listOutcomes } from '@/lib/painel/store';
import { fetchAppUsers } from '@/lib/app-users';
import { buildRepasses, commissionLabel, formatBRL } from '@/lib/metrics';
import { PageHeader } from '@/components/admin/PageHeader';
import { StatCard } from '@/components/admin/StatCard';
import { Tabela, Td } from '@/components/admin/Tabela';

export const dynamic = 'force-dynamic';

export default async function ConversoresPage() {
  requireRole('admin');
  const [perfis, users, outcomes] = await Promise.all([
    listPerfis(),
    fetchAppUsers(),
    listOutcomes(),
  ]);

  const repasses = buildRepasses(perfis, users, outcomes);
  const totalConsolidado = repasses.reduce((s, r) => s + r.consolidado, 0);
  const totalConvertidos = repasses.reduce((s, r) => s + r.convertidos, 0);
  const ativos = repasses.filter((r) => r.perfil.active).length;

  return (
    <>
      <PageHeader
        title="Conversores"
        subtitle="Quem trabalha a fila de leads e quanto cada um gerou."
        right={
          <Link
            href="/admin/perfis"
            className="rounded-pill bg-ninho-roxo px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-ninho-roxo-escuro"
          >
            Novo conversor
          </Link>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Conversores ativos" value={ativos} accent />
        <StatCard label="Convertidos no total" value={totalConvertidos} />
        <StatCard label="Comissão devida" value={formatBRL(totalConsolidado)} />
      </div>

      <Tabela
        headers={['Conversor', 'Comissão', 'Convertidos', 'Pagando', 'Em trial', 'Consolidado', 'Previsão']}
        vazio="Nenhum conversor cadastrado. Crie um em Gerenciar perfis."
      >
        {repasses.map((r) => (
          <tr key={r.perfil.id}>
            <Td>
              <span className="block font-medium">{r.perfil.display_name}</span>
              <span className="block font-mono text-xs text-ninho-cinza">
                {r.perfil.username}
                {!r.perfil.active && ' · inativo'}
              </span>
            </Td>
            <Td className="text-xs text-ninho-cinza">{commissionLabel(r.perfil)}</Td>
            <Td>{r.convertidos}</Td>
            <Td>{r.pagantes}</Td>
            <Td>{r.trials}</Td>
            <Td className="whitespace-nowrap font-semibold">{formatBRL(r.consolidado)}</Td>
            <Td className="whitespace-nowrap text-ninho-cinza">{formatBRL(r.previsao)}</Td>
          </tr>
        ))}
      </Tabela>
    </>
  );
}
