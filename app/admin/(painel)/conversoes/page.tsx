import { requireRole } from '@/lib/auth/guard';
import { listOutcomes, listPerfis } from '@/lib/painel/store';
import { fetchAppUsers } from '@/lib/app-users';
import { formatDate } from '@/lib/metrics';
import { PageHeader } from '@/components/admin/PageHeader';
import { StatCard } from '@/components/admin/StatCard';
import { BarChart } from '@/components/admin/BarChart';
import { DonutChart } from '@/components/admin/DonutChart';
import { Tabela, Td } from '@/components/admin/Tabela';
import { MonthFilter } from '@/components/admin/MonthFilter';
import { ExportExcelButton } from '@/components/admin/ExportExcelButton';
import { DESFECHO_LABEL } from '@/components/admin/FilaConversor';
import { IconExchange, IconCrown, IconPercent, IconUsers } from '@/components/admin/icons';

export const dynamic = 'force-dynamic';

function mesValido(v: string | undefined): string {
  return v && /^\d{4}-\d{2}$/.test(v) ? v : new Date().toISOString().slice(0, 7);
}

export default async function ConversoesPage({
  searchParams,
}: {
  searchParams: { mes?: string };
}) {
  requireRole('admin');
  const mes = mesValido(searchParams.mes);

  const [todosOutcomes, perfis, users] = await Promise.all([
    listOutcomes(),
    listPerfis(),
    fetchAppUsers(),
  ]);

  const outcomes = todosOutcomes.filter((o) => o.contacted_at.slice(0, 7) === mes);

  const nomePorPerfil = new Map(perfis.map((p) => [p.id, p.display_name]));
  const usuarioPorId = new Map(users.map((u) => [u.id, u]));

  const porDesfecho = new Map<string, number>();
  for (const o of outcomes) porDesfecho.set(o.outcome, (porDesfecho.get(o.outcome) ?? 0) + 1);

  const convertidos = porDesfecho.get('convertido') ?? 0;
  const taxa = outcomes.length > 0 ? (convertidos / outcomes.length) * 100 : 0;

  const porConversor = new Map<string, number>();
  for (const o of outcomes) {
    const nome = o.perfil_id ? nomePorPerfil.get(o.perfil_id) ?? '—' : '—';
    porConversor.set(nome, (porConversor.get(nome) ?? 0) + 1);
  }

  const paraExcel = outcomes.map((o) => {
    const u = usuarioPorId.get(o.profile_id);
    return {
      Quando: new Date(o.contacted_at).toLocaleDateString('pt-BR'),
      Pessoa: u?.name || u?.email || '',
      'E-mail': u?.email || '',
      Desfecho: DESFECHO_LABEL[o.outcome] ?? o.outcome,
      Conversor: o.perfil_id ? nomePorPerfil.get(o.perfil_id) ?? '' : '',
      Observação: o.comment || '',
    };
  });

  const CORES: Record<string, string> = {
    convertido: '#59B287',
    sem_resposta: '#C9BEE0',
    nao_quer: '#E85D5D',
    caro: '#F5C24E',
    sem_interesse: '#FFB78C',
    outro: '#7DB7F0',
  };

  return (
    <>
      <PageHeader
        title="Conversões"
        subtitle="Todo contato registrado pelos conversores e no que deu."
        right={
          <div className="flex flex-wrap gap-2">
            <ExportExcelButton rows={paraExcel} filename="ninho-conversoes" sheetName="Conversões" />
            <MonthFilter value={mes} />
          </div>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Contatos no mês" value={outcomes.length} accent icon={<IconExchange />} />
        <StatCard label="Converteram" value={convertidos} icon={<IconCrown />} />
        <StatCard label="Taxa de conversão" value={`${taxa.toFixed(1)}%`} icon={<IconPercent />} />
        <StatCard
          label="Pessoas distintas"
          value={new Set(outcomes.map((o) => o.profile_id)).size}
          icon={<IconUsers />}
        />
      </div>

      <div className="mb-8 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-ninho-borda bg-white p-5">
          <h2 className="mb-4 text-base font-bold text-ninho-grafite">Desfechos</h2>
          <DonutChart
            slices={Object.entries(DESFECHO_LABEL)
              .map(([k, label]) => ({
                label,
                value: porDesfecho.get(k) ?? 0,
                color: CORES[k] ?? '#9F86E0',
              }))
              .filter((s) => s.value > 0)}
          />
        </div>
        <div>
          <h2 className="mb-3 text-base font-bold text-ninho-grafite">Contatos por conversor</h2>
          <BarChart
            data={Array.from(porConversor.entries()).map(([label, value]) => ({ label, value }))}
          />
        </div>
      </div>

      <h2 className="mb-3 text-base font-bold text-ninho-grafite">Histórico de {mes}</h2>
      <Tabela
        headers={['Quando', 'Pessoa', 'Desfecho', 'Conversor', 'Observação']}
        vazio={`Nenhum contato registrado em ${mes}.`}
      >
        {outcomes.map((o) => {
          const u = usuarioPorId.get(o.profile_id);
          return (
            <tr key={o.id}>
              <Td className="whitespace-nowrap text-ninho-cinza">{formatDate(o.contacted_at)}</Td>
              <Td className="font-medium">{u?.name || u?.email || '—'}</Td>
              <Td>
                <span
                  className={`rounded-pill px-2.5 py-1 text-[11px] font-semibold ${
                    o.outcome === 'convertido'
                      ? 'bg-[#E4F5EC] text-[#2E7D51]'
                      : 'bg-ninho-nuvem text-ninho-cinza'
                  }`}
                >
                  {DESFECHO_LABEL[o.outcome] ?? o.outcome}
                </span>
              </Td>
              <Td className="text-ninho-cinza">
                {o.perfil_id ? nomePorPerfil.get(o.perfil_id) ?? '—' : '—'}
              </Td>
              <Td className="text-ninho-cinza">{o.comment || '—'}</Td>
            </tr>
          );
        })}
      </Tabela>
    </>
  );
}
