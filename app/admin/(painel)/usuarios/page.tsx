import { requireRole } from '@/lib/auth/guard';
import {
  fetchAppUsers,
  fetchUsoPorUsuario,
  appDbConfigured,
  accountStatus,
} from '@/lib/app-users';
import { buildUsuariosCharts } from '@/lib/dashboard-charts';
import { fetchGrupoTestePorUsuario } from '@/lib/teste-paywall';
import { taxaConversaoNascidos, taxaConversaoHint } from '@/lib/metrics';
import { paisDoFuso } from '@/lib/pais';
import { listPerfis } from '@/lib/painel/store';
import { listConsultoras } from '@/lib/consultoras';
import { PageHeader } from '@/components/admin/PageHeader';
import { Notice } from '@/components/admin/Notice';
import { UsuariosTable, type UsuarioRow } from '@/components/admin/UsuariosTable';

export const dynamic = 'force-dynamic';

export default async function UsuariosPage() {
  requireRole('admin');

  const [users, uso, testePaywall, perfis, consultoras] = await Promise.all([
    fetchAppUsers(),
    fetchUsoPorUsuario(),
    fetchGrupoTestePorUsuario(),
    listPerfis().catch(() => []),
    listConsultoras().catch(() => []),
  ]);
  // Quem trouxe a conta (link ou código): nome do parceiro pelo código e da
  // consultora pelo id. Se tiver os dois, vale o registro mais antigo.
  const parceiroPorCodigo = new Map(
    perfis.filter((p) => p.promo_code).map((p) => [p.promo_code!.toUpperCase(), p.display_name || p.promo_code!.toUpperCase()]),
  );
  const consultoraPorId = new Map(consultoras.map((c) => [c.id, c.nome || 'Consultora']));
  const indicadoPor = (u: (typeof users)[number]): UsuarioRow['indicadoPor'] => {
    const cons = u.consultoraId ? { nome: consultoraPorId.get(u.consultoraId) ?? 'Consultora', tipo: 'consultora' as const } : null;
    const parc = u.parceiroCodigo ? { nome: parceiroPorCodigo.get(u.parceiroCodigo) ?? u.parceiroCodigo, tipo: 'parceiro' as const } : null;
    if (cons && parc) return u.atribuicaoDupla === 'vale_consultora' ? cons : parc;
    return cons ?? parc;
  };
  const charts = buildUsuariosCharts(users);
  const conversao = taxaConversaoNascidos(users);

  const rows: UsuarioRow[] = users.map((u) => {
    const m = uso.get(u.id);
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      created_at: u.created_at,
      birthDate: u.birthDate,
      status: accountStatus(u),
      herdadoDe: u.herdadoDe,
      indicadoPor: indicadoPor(u),
      // Duas colunas no banco, uma pergunta só na tela: quem paga (ou
      // cancelou no meio do ciclo) conta pelo fim do período pago; o resto
      // conta pelo fim do trial. Usa os campos EFETIVOS: pra quem herda de
      // outra conta, "Dias" tem que contar até o fim do período de QUEM
      // PAGA, não uma data da própria conta que nem é mais o que vale.
      expiraEm:
        u.estadoEfetivo === 'pagante' || u.estadoEfetivo === 'churn'
          ? u.currentPeriodEndEfetivo ?? u.trialEndsAtEfetivo
          : u.trialEndsAtEfetivo,
      registros: m?.registros ?? 0,
      diasRegistro: m?.diasRegistro ?? 0,
      momentos: m?.momentos ?? 0,
      diasAbertura: m?.diasAbertura ?? 0,
      sistema: m?.sistema ?? null,
      appVersion: m?.appVersion ?? null,
      origem: u.origem,
      pais: paisDoFuso(u.timezone),
      fuso: u.timezone,
      teste: testePaywall.get(u.id) ?? null,
    };
  });

  return (
    <div>
      <PageHeader
        title="Usuários ativos"
        subtitle="Todos os usuários do app, status da conta e atividade. Selecione para excluir — a exclusão pede sua senha e é definitiva."
      />

      {!appDbConfigured() && (
        <Notice tone="warn">
          Banco não configurado — defina <code>SUPABASE_URL</code> e{' '}
          <code>SUPABASE_SERVICE_ROLE_KEY</code>.
        </Notice>
      )}

      <UsuariosTable
        rows={rows}
        usuariosPorDia={charts.usuariosPorDia}
        usuariosPorMes={charts.usuariosPorMes}
        conversao={{ valor: `${conversao.taxa.toFixed(1)}%`, hint: taxaConversaoHint(conversao) }}
      />
    </div>
  );
}
