import { requireRole } from '@/lib/auth/guard';
import { getPerfil, listOutcomes } from '@/lib/painel/store';
import { fetchAppUsers } from '@/lib/app-users';
import { buildConversorLeadSet, whatsappLink } from '@/lib/conversor';
import { commissionLabel, formatBRL, repasseDoPerfil } from '@/lib/metrics';
import { PageHeader } from '@/components/admin/PageHeader';
import { StatCard } from '@/components/admin/StatCard';
import { FilaConversor } from '@/components/admin/FilaConversor';

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

  // Mapa de links de WhatsApp — montado no servidor pra não expor a lógica
  // de telefone no cliente.
  const wpp: Record<string, string | null> = {};
  for (const l of [...leadSet.trialExpirado, ...leadSet.leads, ...leadSet.churn]) {
    wpp[l.id] = whatsappLink(l);
  }

  const visiveis = (arr: typeof leadSet.leads) => arr.filter((l) => !l.removido);

  return (
    <>
      <PageHeader
        title="Meu painel"
        subtitle={`Sua comissão: ${commissionLabel(perfil)}`}
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Consolidado"
          value={formatBRL(r.consolidado)}
          hint="Já devido — convertidos que pagam"
          accent
        />
        <StatCard
          label="Previsão"
          value={formatBRL(r.previsao)}
          hint="Se os trials que você converteu virarem"
        />
        <StatCard label="Convertidos" value={r.convertidos} hint="Marcados por você" />
        <StatCard label="Pagando hoje" value={r.pagantes} />
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
