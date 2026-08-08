'use client';

import { useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import {
  criarPerfil,
  salvarPerfil,
  resetarSenha,
  removerPerfil,
  type ActionState,
} from '@/app/admin/(painel)/admin-actions';
import type { Perfil } from '@/lib/painel/store';
import { PasswordInput } from '@/components/admin/PasswordInput';

const inputCls =
  'w-full rounded-xl border border-ninho-borda bg-white px-3 py-2 text-sm text-ninho-grafite outline-none focus:border-ninho-roxo';

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-pill bg-ninho-roxo px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-ninho-roxo-escuro disabled:opacity-50"
    >
      {pending ? 'Salvando...' : label}
    </button>
  );
}

function Msg({ state }: { state: ActionState }) {
  if (state.error)
    return <div className="rounded-xl bg-red-50 p-2.5 text-sm text-red-600">{state.error}</div>;
  if (state.ok)
    return (
      <div className="rounded-xl bg-ninho-roxo-suave p-2.5 text-sm text-ninho-roxo-escuro">
        Salvo.
      </div>
    );
  return null;
}

/** Campos de comissão — só fazem sentido para conversor. */
function CamposComissao({ p }: { p?: Perfil }) {
  const [tipo, setTipo] = useState<'valor' | 'percentual'>(p?.commission_type ?? 'percentual');
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <label className="text-xs text-ninho-cinza">
        Tipo de comissão
        <select
          name="commission_type"
          value={tipo}
          onChange={(e) => setTipo(e.target.value as 'valor' | 'percentual')}
          className={`${inputCls} mt-1`}
        >
          <option value="percentual">% da assinatura</option>
          <option value="valor">R$ por assinante</option>
        </select>
      </label>
      {tipo === 'percentual' ? (
        <label className="text-xs text-ninho-cinza">
          Percentual (%)
          <input
            name="commission_percent"
            type="number"
            step="0.01"
            min="0"
            max="100"
            defaultValue={p?.commission_percent ?? 0}
            className={`${inputCls} mt-1`}
          />
        </label>
      ) : (
        <label className="text-xs text-ninho-cinza">
          Valor por assinante (R$)
          <input
            name="commission_amount"
            type="number"
            step="0.01"
            min="0"
            defaultValue={p?.commission_amount ?? 0}
            className={`${inputCls} mt-1`}
          />
        </label>
      )}
      <label className="text-xs text-ninho-cinza">
        Duração (meses)
        <input
          name="commission_duration_months"
          type="number"
          min="0"
          placeholder="vazio = vitalícia"
          defaultValue={p?.commission_duration_months ?? ''}
          className={`${inputCls} mt-1`}
        />
      </label>
    </div>
  );
}

function FormNovo() {
  const [state, action] = useFormState<ActionState, FormData>(criarPerfil, {});
  const [role, setRole] = useState<'admin' | 'conversor'>('conversor');

  return (
    <form action={action} className="flex flex-col gap-3 rounded-2xl border border-ninho-borda bg-white p-5">
      <h3 className="text-base font-bold text-ninho-grafite">Novo perfil</h3>
      <Msg state={state} />
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs text-ninho-cinza">
          Nome
          <input name="display_name" className={`${inputCls} mt-1`} placeholder="Maria Silva" />
        </label>
        <label className="text-xs text-ninho-cinza">
          Usuário (login)
          <input
            name="username"
            className={`${inputCls} mt-1`}
            placeholder="maria.silva"
            autoCapitalize="none"
          />
        </label>
        <label className="text-xs text-ninho-cinza">
          E-mail (opcional — também serve de login)
          <input name="email" type="email" className={`${inputCls} mt-1`} />
        </label>
        <label className="text-xs text-ninho-cinza">
          Papel
          <select
            name="role"
            value={role}
            onChange={(e) => setRole(e.target.value as 'admin' | 'conversor')}
            className={`${inputCls} mt-1`}
          >
            <option value="conversor">Conversor</option>
            <option value="admin">Administrador</option>
          </select>
        </label>
      </div>
      <label className="text-xs text-ninho-cinza">
        Senha inicial (mín. 8 caracteres)
        <div className="mt-1">
          <PasswordInput name="password" placeholder="Senha inicial" autoComplete="new-password" />
        </div>
      </label>
      {role === 'conversor' && <CamposComissao />}
      <div>
        <Submit label="Criar perfil" />
      </div>
    </form>
  );
}

function FormEditar({ p, ehVoce }: { p: Perfil; ehVoce: boolean }) {
  const [state, action] = useFormState<ActionState, FormData>(salvarPerfil, {});
  const [senhaState, senhaAction] = useFormState<ActionState, FormData>(resetarSenha, {});
  const [aberto, setAberto] = useState(false);

  return (
    <div className="rounded-2xl border border-ninho-borda bg-white">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
      >
        <span>
          <span className="block text-sm font-semibold text-ninho-grafite">
            {p.display_name}{' '}
            {ehVoce && <span className="text-xs font-normal text-ninho-cinza">(você)</span>}
          </span>
          <span className="block font-mono text-xs text-ninho-cinza">{p.username}</span>
        </span>
        <span className="flex items-center gap-2">
          <span className="rounded-pill bg-ninho-roxo-suave px-2.5 py-1 text-[11px] font-semibold text-ninho-roxo-escuro">
            {p.role === 'admin' ? 'Administrador' : 'Conversor'}
          </span>
          {!p.active && (
            <span className="rounded-pill bg-ninho-nuvem px-2.5 py-1 text-[11px] text-ninho-cinza">
              inativo
            </span>
          )}
          <span className="text-ninho-cinza">{aberto ? '▲' : '▼'}</span>
        </span>
      </button>

      {aberto && (
        <div className="flex flex-col gap-5 border-t border-ninho-borda p-5">
          <form action={action} className="flex flex-col gap-3">
            <input type="hidden" name="id" value={p.id} />
            <Msg state={state} />
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs text-ninho-cinza">
                Nome
                <input
                  name="display_name"
                  defaultValue={p.display_name}
                  className={`${inputCls} mt-1`}
                />
              </label>
              <label className="text-xs text-ninho-cinza">
                E-mail
                <input
                  name="email"
                  type="email"
                  defaultValue={p.email ?? ''}
                  className={`${inputCls} mt-1`}
                />
              </label>
            </div>
            {p.role === 'conversor' && <CamposComissao p={p} />}
            <label className="flex items-center gap-2 text-sm text-ninho-grafite">
              <input type="checkbox" name="active" defaultChecked={p.active} />
              Perfil ativo (desmarcar bloqueia o login)
            </label>
            <div>
              <Submit label="Salvar alterações" />
            </div>
          </form>

          <form action={senhaAction} className="flex flex-col gap-3 border-t border-ninho-borda pt-5">
            <input type="hidden" name="id" value={p.id} />
            <h4 className="text-sm font-semibold text-ninho-grafite">Redefinir senha</h4>
            <Msg state={senhaState} />
            <div className="max-w-sm">
              <PasswordInput name="nova" placeholder="Nova senha (mín. 8)" autoComplete="new-password" />
            </div>
            <div>
              <Submit label="Redefinir" />
            </div>
          </form>

          {!ehVoce && (
            <form action={removerPerfil} className="border-t border-ninho-borda pt-5">
              <input type="hidden" name="id" value={p.id} />
              <button
                type="submit"
                className="rounded-pill border border-red-200 px-5 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
              >
                Excluir perfil
              </button>
              <p className="mt-2 text-xs text-ninho-cinza">
                Os desfechos de lead registrados por ele são mantidos, sem dono.
              </p>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

export function PerfisManager({ perfis, meuId }: { perfis: Perfil[]; meuId: string }) {
  return (
    <div className="flex flex-col gap-4">
      <FormNovo />
      {perfis.map((p) => (
        <FormEditar key={p.id} p={p} ehVoce={p.id === meuId} />
      ))}
    </div>
  );
}
