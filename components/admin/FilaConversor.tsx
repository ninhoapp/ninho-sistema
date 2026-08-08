'use client';

import { useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import {
  registrarDesfecho,
  ocultarLead,
  reexibirLead,
  type ActionState,
} from '@/app/admin/(painel)/admin-actions';
import type { LeadRow } from '@/lib/conversor';
import { EstadoBadge } from '@/components/admin/EstadoBadge';
import { formatDate } from '@/lib/metrics';

export const DESFECHOS: { value: string; label: string }[] = [
  { value: 'convertido', label: 'Converteu — assinou' },
  { value: 'sem_resposta', label: 'Não respondeu' },
  { value: 'nao_quer', label: 'Não quer' },
  { value: 'caro', label: 'Achou caro' },
  { value: 'sem_interesse', label: 'Sem interesse' },
  { value: 'outro', label: 'Outro' },
];

const DESFECHO_LABEL: Record<string, string> = Object.fromEntries(
  DESFECHOS.map((d) => [d.value, d.label])
);

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-pill bg-ninho-roxo px-4 py-2 text-xs font-semibold text-white transition hover:bg-ninho-roxo-escuro disabled:opacity-50"
    >
      {pending ? 'Salvando...' : label}
    </button>
  );
}

function LinhaLead({ lead, whatsapp }: { lead: LeadRow; whatsapp: string | null }) {
  const [state, action] = useFormState<ActionState, FormData>(registrarDesfecho, {});
  const [aberto, setAberto] = useState(false);

  return (
    <div className="border-b border-ninho-borda last:border-b-0">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ninho-grafite">
            {lead.name || 'Sem nome'}
          </p>
          <p className="truncate text-xs text-ninho-cinza">
            {lead.email || 'sem e-mail'} · {lead.phone || 'sem telefone'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <EstadoBadge estado={lead.estado} />
          {lead.jaContatado && lead.ultimoDesfecho && (
            <span className="rounded-pill bg-ninho-nuvem px-2.5 py-1 text-[11px] text-ninho-cinza">
              {DESFECHO_LABEL[lead.ultimoDesfecho] ?? lead.ultimoDesfecho}
            </span>
          )}
          {whatsapp && (
            <a
              href={whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-pill bg-[#E4F5EC] px-3 py-1.5 text-xs font-semibold text-[#2E7D51] transition hover:bg-[#d3ecdf]"
            >
              WhatsApp
            </a>
          )}
          <button
            type="button"
            onClick={() => setAberto((v) => !v)}
            className="rounded-pill border border-ninho-borda px-3 py-1.5 text-xs font-medium text-ninho-cinza transition hover:border-ninho-roxo hover:text-ninho-roxo"
          >
            {aberto ? 'Fechar' : 'Registrar contato'}
          </button>
        </div>
      </div>

      {aberto && (
        <div className="flex flex-col gap-3 bg-ninho-nuvem px-4 py-4">
          <form action={action} className="flex flex-wrap items-end gap-3">
            <input type="hidden" name="profile_id" value={lead.id} />
            <label className="text-xs text-ninho-cinza">
              Desfecho
              <select
                name="outcome"
                className="mt-1 block rounded-xl border border-ninho-borda bg-white px-3 py-2 text-sm outline-none focus:border-ninho-roxo"
              >
                {DESFECHOS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="min-w-[200px] flex-1 text-xs text-ninho-cinza">
              Observação
              <input
                name="comment"
                className="mt-1 block w-full rounded-xl border border-ninho-borda bg-white px-3 py-2 text-sm outline-none focus:border-ninho-roxo"
                placeholder="O que ele falou"
              />
            </label>
            <Submit label="Registrar" />
          </form>

          {state.error && <p className="text-sm text-red-600">{state.error}</p>}
          {state.ok && <p className="text-sm text-ninho-roxo-escuro">Contato registrado.</p>}

          <form action={lead.removido ? reexibirLead : ocultarLead}>
            <input type="hidden" name="profile_id" value={lead.id} />
            <button className="text-xs font-medium text-ninho-cinza hover:underline">
              {lead.removido ? 'Trazer de volta para a fila' : 'Remover da fila'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export function FilaConversor({
  titulo,
  descricao,
  leads,
  whatsappPorLead,
  vazio,
}: {
  titulo: string;
  descricao: string;
  leads: LeadRow[];
  whatsappPorLead: Record<string, string | null>;
  vazio: string;
}) {
  return (
    <section className="mb-8">
      <h2 className="text-base font-bold text-ninho-grafite">
        {titulo}{' '}
        <span className="ml-1 rounded-pill bg-ninho-roxo-suave px-2.5 py-0.5 text-xs font-semibold text-ninho-roxo-escuro">
          {leads.length}
        </span>
      </h2>
      <p className="mb-3 text-sm text-ninho-cinza">{descricao}</p>

      {leads.length === 0 ? (
        <div className="rounded-2xl border border-ninho-borda bg-white p-8 text-center text-sm text-ninho-cinza">
          {vazio}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-ninho-borda bg-white">
          {leads.map((l) => (
            <LinhaLead key={l.id} lead={l} whatsapp={whatsappPorLead[l.id] ?? null} />
          ))}
        </div>
      )}
    </section>
  );
}

export { DESFECHO_LABEL };
