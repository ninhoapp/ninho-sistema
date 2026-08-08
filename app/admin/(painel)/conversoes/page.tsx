import { requireRole } from '@/lib/auth/guard';
import { listOutcomes, listPerfis } from '@/lib/painel/store';
import { fetchAppUsers } from '@/lib/app-users';
import { formatDate } from '@/lib/metrics';
import { PageHeader } from '@/components/admin/PageHeader';
import { StatCard } from '@/components/admin/StatCard';
import { BarChart } from '@/components/admin/BarChart';
import { Tabela, Td } from '@/components/admin/Tabela';
import { DESFECHO_LABEL } from '@/components/admin/FilaConversor';

export const dynamic = 'force-dynamic';

export default async function ConversoesPage() {
  requireRole('admin');
  const [outcomes, perfis, users] = await Promise.all([
    listOutcomes(),
    listPerfis(),
    fetchAppUsers(),
  ]);

  const nomePorPerfil = new Map(perfis.map((p) => [p.id, p.display_name]));
  const usuarioPorId = new Map(users.map((u) => [u.id, u]));

  const porDesfecho = new Map<string, number>();
  for (const o of outcomes) porDesfecho.set(o.outcome, (porDesfecho.get(o.outcome) ?? 0) + 1);

  const convertidos = porDesfecho.get('convertido') ?? 0;
  const taxa = outcomes.length > 0 ? (convertidos / outcomes.length) * 100 : 0;

  return (
    <>
      <PageHeader
        title="Conversões"
        subtitle="Todo contato registrado pelos conversores e no que deu."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Contatos feitos" value={outcomes.length} accent />
        <StatCard label="Converteram" value={convertidos} />
        <StatCard label="Taxa de conversão" value={`${taxa.toFixed(1)}%`} />
        <StatCard label="Pessoas distintas" value={new Set(outcomes.map((o) => o.profile_id)).size} />
      </div>

      <h2 className="mb-3 text-base font-bold text-ninho-grafite">Desfechos</h2>
      <div className="mb-8">
        <BarChart
          data={Object.entries(DESFECHO_LABEL).map(([k, label]) => ({
            label,
            value: porDesfecho.get(k) ?? 0,
            color: k === 'convertido' ? '#59B287' : '#9F86E0',
          }))}
        />
      </div>

      <h2 className="mb-3 text-base font-bold text-ninho-grafite">Histórico</h2>
      <Tabela
        headers={['Quando', 'Pessoa', 'Desfecho', 'Conversor', 'Observação']}
        vazio="Nenhum contato registrado ainda."
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
