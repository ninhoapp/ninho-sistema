/**
 * Ninho · Filas de contato do conversor. Server-only.
 *
 * Três filas, todas derivadas do `estado` da view public.assinatura_estado:
 *   trialExpirado — acabou o trial e não assinou. É a fila principal.
 *   leads         — ainda em trial. Contato preventivo, antes de expirar.
 *   churn         — era premium e cancelou/venceu.
 */
import { listHiddenLeadIds, listOutcomes } from '@/lib/painel/store';
import { isTrialAtivo, isTrialExpirado, isChurn } from '@/lib/metrics';
import type { AppUser } from '@/lib/app-users';

export interface LeadRow extends AppUser {
  /** Já houve algum desfecho registrado para esse usuário. */
  jaContatado: boolean;
  /** Removido da fila manualmente. */
  removido: boolean;
  /** Último desfecho registrado, se houver. */
  ultimoDesfecho: string | null;
}

export interface LeadSet {
  trialExpirado: LeadRow[];
  leads: LeadRow[];
  churn: LeadRow[];
}

export async function buildConversorLeadSet(users: AppUser[]): Promise<LeadSet> {
  const [hidden, outcomes] = await Promise.all([listHiddenLeadIds(), listOutcomes()]);

  // outcomes vem ordenado por contacted_at desc — o primeiro de cada usuário
  // é o mais recente.
  const ultimoPorUsuario = new Map<string, string>();
  for (const o of outcomes) {
    if (!ultimoPorUsuario.has(o.profile_id)) ultimoPorUsuario.set(o.profile_id, o.outcome);
  }

  const enrich = (u: AppUser): LeadRow => ({
    ...u,
    jaContatado: ultimoPorUsuario.has(u.id),
    removido: hidden.has(u.id),
    ultimoDesfecho: ultimoPorUsuario.get(u.id) ?? null,
  });

  return {
    trialExpirado: users.filter(isTrialExpirado).map(enrich),
    leads: users.filter(isTrialAtivo).map(enrich),
    churn: users.filter(isChurn).map(enrich),
  };
}

/** Link de WhatsApp com mensagem pronta. Sem telefone, devolve null. */
export function whatsappLink(u: AppUser): string | null {
  const digits = (u.phone || '').replace(/\D/g, '');
  if (digits.length < 10) return null;
  const comDdi = digits.startsWith('55') ? digits : `55${digits}`;
  const primeiroNome = (u.name || '').trim().split(/\s+/)[0] || '';
  const texto = encodeURIComponent(
    `Oi${primeiroNome ? ` ${primeiroNome}` : ''}! Aqui é do Ninho. Vi que você começou a acompanhar a rotina do seu bebê com a gente e queria saber como está sendo a experiência.`
  );
  return `https://wa.me/${comDdi}?text=${texto}`;
}
