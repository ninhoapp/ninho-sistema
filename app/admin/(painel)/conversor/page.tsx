import { requireRole } from '@/lib/auth/guard';
import { getPerfil, listOutcomes } from '@/lib/painel/store';
import { fetchAppUsers } from '@/lib/app-users';
import { buildConversorLeadSet, whatsappLink } from '@/lib/conversor';
import {
  commissionLabel,
  commissionPerPlan,
  formatBRL,
  repasseDoPerfil,
} from '@/lib/metrics';
import { repasseSchedule, fmtData } from '@/lib/repasse-schedule';
import { PageHeader } from '@/components/admin/PageHeader';
import { StatCard } from '@/components/admin/StatCard';
import { Notice } from '@/components/admin/Notice';
import { FilaConversor } from '@/components/admin/FilaConversor';
import { CommissionBreakdown } from '@/components/admin/CommissionBreakdown';
import { RepasseRegras } from '@/components/admin/RepasseRegras';
import { IconCash, IconClock, IconCrown, IconUsers } from '@/components/admin/icons';

export const dynamic = 'force-dynamic';

export default async function ConversorPage() {
  const session = requireRole('conversor');
  const perfil = await getPerfil(session.sub);
  if (!perfil) return null;

  const users = await fetchAppUsers();
  const [leadSet, outcomes] = await Promise.all([
    buildConversorLeadSet(users),
    listOutcomes(perfil.id),
  ]);
  const r = repasseDoPerfil(perfil, users, outcomes);
  const sched = repasseSchedule();

  // Mapa de links de WhatsApp — montado no servidor pra não expor a lógica
  // de telefone no cliente.
  const wpp: Record<string, string | null> = {};
  for (const l of [...leadSet.trialExpirado, ...leadSet.leads, ...leadSet.churn]) {
    wpp[l.id] = whatsappLink(l);
  }

  const visiveis = (arr: typeof leadSet.leads) => arr.filter((l) => !l.removido);

  return (
    <>
      <PageHeader title="Meu painel" subtitle={`Sua comissão: ${commissionLabel(perfil)}`} />

      {!perfil.pix_key && (
        <Notice tone="warn">
          Você ainda não cadastrou sua chave PIX. Sem ela não dá para receber o repasse — cadastre
          em Minha conta.
        </Notice>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Consolidado"
          value={formatBRL(r.consolidado)}
          hint={`${sched.consolidado.competencia} · paga ${fmtData(sched.consolidado.pagamentoEm)}`}
          compactHint
          accent
          icon={<IconCash />}
        />
        <StatCard
          label="Em aberto"
          value={formatBRL(r.previsao)}
          hint={`${sched.aberto.competencia} · paga ${fmtData(sched.aberto.pagamentoEm)}`}
          compactHint
          icon={<IconClock />}
        />
        <StatCard label="Convertidos" value={r.convertidos} hint="Marcados por você" icon={<IconUsers />} />
        <StatCard label="Pagando hoje" value={r.pagantes} icon={<IconCrown />} />
      </div>

      <div className="mb-8">
        <CommissionBreakdown
          headline={commissionLabel(perfil)}
          itens={commissionPerPlan(perfil)}
        />
      </div>

      <div className="mb-8">
        <RepasseRegras duracaoMeses={perfil.commission_duration_months} />
      </div>

      <FilaConversor
        titulo="Trial expirado"
        descricao="Acabou o teste e não assinou. É a fila principal — contato aqui é o que vira comissão."
        leads={visiveis(leadSet.trialExpirado)}
        whatsappPorLead={wpp}
        vazio="Nenhum trial expirado aguardando contato."
      />

      <FilaConversor
        titulo="Ainda em trial"
        descricao="Estão testando agora. Contato preventivo, antes de o prazo acabar."
        leads={visiveis(leadSet.leads)}
        whatsappPorLead={wpp}
        vazio="Ninguém em trial no momento."
      />

      <FilaConversor
        titulo="Churn"
        descricao="Já foram premium e cancelaram. Vale entender o motivo."
        leads={visiveis(leadSet.churn)}
        whatsappPorLead={wpp}
        vazio="Nenhum cancelamento registrado."
      />
    </>
  );
}
