import Link from 'next/link';
import { requireRole } from '@/lib/auth/guard';
import { listPerfis, listOutcomes } from '@/lib/painel/store';
import { fetchAppUsers } from '@/lib/app-users';
import { buildRepasses, commissionLabel, formatBRL } from '@/lib/metrics';
import { zerarConversor } from '@/app/admin/(painel)/admin-actions';
import { PageHeader } from '@/components/admin/PageHeader';
import { StatCard } from '@/components/admin/StatCard';
import { Tabela, Td } from '@/components/admin/Tabela';
import { ExportExcelButton } from '@/components/admin/ExportExcelButton';
import { ConfirmButton } from '@/components/admin/ConfirmButton';
import { IconUsers, IconCrown, IconCash } from '@/components/admin/icons';

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

  const paraExcel = repasses.map((r) => ({
    Conversor: r.perfil.display_name,
    Usuário: r.perfil.username,
    Ativo: r.perfil.active ? 'Sim' : 'Não',
    Comissão: commissionLabel(r.perfil),
    Convertidos: r.convertidos,
    Pagando: r.pagantes,
    'Em trial': r.trials,
    Consolidado: r.consolidado,
    Previsão: r.previsao,
  }));

  return (
    <>
      <PageHeader
        title="Conversores"
        subtitle="Quem trabalha a fila de leads e quanto cada um gerou."
        right={
          <div className="flex flex-wrap gap-2">
            <ExportExcelButton rows={paraExcel} filename="ninho-conversores" sheetName="Conversores" />
            <Link
              href="/admin/perfis"
              className="rounded-pill bg-ninho-roxo px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-ninho-roxo-escuro"
            >
              Novo conversor
            </Link>
          </div>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Conversores ativos" value={ativos} accent icon={<IconUsers />} />
        <StatCard label="Convertidos no total" value={totalConvertidos} icon={<IconCrown />} />
        <StatCard label="Comissão devida" value={formatBRL(totalConsolidado)} icon={<IconCash />} />
      </div>

      <Tabela
        headers={[
          'Conversor',
          'Comissão',
          'Convertidos',
          'Pagando',
          'Em trial',
          'Consolidado',
          'Previsão',
          '',
        ]}
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
            <Td>
              {r.convertidos > 0 && (
                <ConfirmButton
                  action={zerarConversor}
                  hidden={{ perfil_id: r.perfil.id }}
                  label="Zerar"
                  message={`Apagar todos os contatos registrados por ${r.perfil.display_name}? Isso zera a comissão dele. Não tem desfazer.`}
                />
              )}
            </Td>
          </tr>
        ))}
      </Tabela>
    </>
  );
}
