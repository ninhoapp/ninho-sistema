import { requireRole } from '@/lib/auth/guard';
import { fetchAppUsers } from '@/lib/app-users';
import { buildConversorLeadSet, whatsappLink } from '@/lib/conversor';
import { PageHeader } from '@/components/admin/PageHeader';
import { StatCard } from '@/components/admin/StatCard';
import { FilaConversor } from '@/components/admin/FilaConversor';
import { ExportExcelButton } from '@/components/admin/ExportExcelButton';
import { ConfirmButton } from '@/components/admin/ConfirmButton';
import { zerarLeadsOcultos } from '@/app/admin/(painel)/admin-actions';

export const dynamic = 'force-dynamic';

/**
 * Mesma fila do conversor, mas na visão do admin — inclusive os leads que
 * foram removidos da fila, que o conversor não vê.
 */
export default async function LeadsPage() {
  requireRole('admin');
  const users = await fetchAppUsers();
  const leadSet = await buildConversorLeadSet(users);

  const todos = [...leadSet.trialExpirado, ...leadSet.leads, ...leadSet.churn];
  const wpp: Record<string, string | null> = {};
  for (const l of todos) wpp[l.id] = whatsappLink(l);

  const removidos = todos.filter((l) => l.removido);
  const semTelefone = todos.filter((l) => !wpp[l.id]).length;

  const paraExcel = todos.map((l) => ({
    Nome: l.name || '',
    'E-mail': l.email || '',
    Telefone: l.phone || '',
    Estado: l.estado,
    'Trial acaba': l.trial_ends_at ? new Date(l.trial_ends_at).toLocaleDateString('pt-BR') : '',
    'Já contatado': l.jaContatado ? 'Sim' : 'Não',
    'Último desfecho': l.ultimoDesfecho || '',
    'Removido da fila': l.removido ? 'Sim' : 'Não',
  }));

  return (
    <>
      <PageHeader
        title="Leads"
        subtitle="Todas as filas de contato, na visão do admin — incluindo o que foi removido."
        right={
          <div className="flex flex-wrap items-center gap-2">
            <ExportExcelButton rows={paraExcel} filename="ninho-leads" sheetName="Leads" />
            {removidos.length > 0 && (
              <ConfirmButton
                action={zerarLeadsOcultos}
                hidden={{}}
                label="Restaurar removidos"
                message={`Devolver os ${removidos.length} leads removidos para a fila do conversor?`}
              />
            )}
          </div>
        }
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Trial expirado" value={leadSet.trialExpirado.length} accent />
        <StatCard label="Em trial" value={leadSet.leads.length} />
        <StatCard label="Churn" value={leadSet.churn.length} />
        <StatCard
          label="Sem telefone"
          value={semTelefone}
          hint="Não dá para acionar por WhatsApp"
          compactHint
        />
      </div>

      <FilaConversor
        titulo="Trial expirado"
        descricao="Acabou o teste e não assinou."
        leads={leadSet.trialExpirado.filter((l) => !l.removido)}
        whatsappPorLead={wpp}
        vazio="Nenhum trial expirado."
      />

      <FilaConversor
        titulo="Ainda em trial"
        descricao="Testando agora."
        leads={leadSet.leads.filter((l) => !l.removido)}
        whatsappPorLead={wpp}
        vazio="Ninguém em trial."
      />

      <FilaConversor
        titulo="Churn"
        descricao="Cancelaram ou venceram."
        leads={leadSet.churn.filter((l) => !l.removido)}
        whatsappPorLead={wpp}
        vazio="Nenhum cancelamento."
      />

      <FilaConversor
        titulo="Removidos da fila"
        descricao="Tirados manualmente. O conversor não vê estes — dá para trazer de volta."
        leads={removidos}
        whatsappPorLead={wpp}
        vazio="Nada foi removido."
      />
    </>
  );
}
