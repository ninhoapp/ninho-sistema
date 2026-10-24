import { requireRole } from '@/lib/auth/guard';
import { listCosts } from '@/lib/painel/store';
import { fetchAppUsers } from '@/lib/app-users';
import { CrescimentoKpi, cenarioValido, mesValido } from '@/components/admin/CrescimentoKpi';

export const dynamic = 'force-dynamic';

export default async function CrescimentoKpiPage({
  searchParams,
}: {
  searchParams: { mes?: string; cen?: string };
}) {
  requireRole('admin');
  const [users, custos] = await Promise.all([fetchAppUsers(), listCosts()]);
  return (
    <CrescimentoKpi
      users={users}
      custos={custos}
      mes={mesValido(searchParams.mes)}
      cen={cenarioValido(searchParams.cen)}
      mesNaUrl={Boolean(searchParams.mes)}
    />
  );
}
