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
import type { PerfilView as Perfil } from '@/lib/painel/store';
import type { Role } from '@/lib/auth/session';
import { SenhaForteInput } from '@/components/admin/SenhaForteInput';
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
  if (state.ok && state.senha)
    return (
      <div className="rounded-xl bg-[#EEF8F1] p-3 text-sm text-[#256B43]">
        Pronto. Usuário <b className="font-mono">{state.login}</b> · senha provisória{' '}
        <b className="font-mono">{state.senha}</b>
        <span className="mt-1 block text-xs">
          A senha aparece só agora: mande para a pessoa. No 1º acesso o painel pede para ela criar a própria senha.
        </span>
      </div>
    );
  if (state.ok)
    return (
      <div className="rounded-xl bg-ninho-roxo-suave p-2.5 text-sm text-ninho-roxo-escuro">
        Salvo.
      </div>
    );
  return null;
}

const ROLE_LABEL: Record<Role, string> = {
  admin: 'Administrador',
  conversor: 'Conversor',
  influencer: 'Parceiro',
  consultora: 'Consultora (criada no 1º login pelo app)',
};

/** Código do parceiro — vira o link /r/<código>. */
function CampoCodigo({ p }: { p?: Perfil }) {
  const [codigo, setCodigo] = useState(p?.promo_code ?? '');
  const limpo = codigo.trim().toLowerCase();
  return (
    <label className="text-xs text-ninho-cinza">
      Código do parceiro (sem espaço, ex.: MARIANA)
      <input
        name="promo_code"
        value={codigo}
        onChange={(e) => setCodigo(e.target.value.toUpperCase().replace(/\s/g, ''))}
        maxLength={40}
        className={`${inputCls} mt-1 font-mono uppercase`}
        placeholder="MARIANA"
        autoCapitalize="characters"
      />
      {limpo && (
        <span className="mt-1 block text-[11px] text-ninho-roxo-escuro">
          Link: www.useninho.com.br/r/{limpo}
        </span>
      )}
      {p && (
        <span className="mt-1 block text-[11px] text-ninho-cinza">
          Trocar o código desliga o link antigo e as contas já atribuídas ao código antigo deixam de contar para ele.
        </span>
      )}
    </label>
  );
}

/** Padrão do parceiro (pedido do dono, 05/11/2026): 25% — 1 mês no plano
 *  mensal e uma única vez no anual (o anual consome 12 meses de duração numa
 *  cobrança só, ver lib/parceiros.ts). */
const PADRAO_PARCEIRO = { percent: 25, meses: 1 };

/** Campos de comissão — conversor e parceiro. */
function CamposComissao({ p, parceiroNovo = false }: { p?: Perfil; parceiroNovo?: boolean }) {
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
            defaultValue={p?.commission_percent ?? (parceiroNovo ? PADRAO_PARCEIRO.percent : 0)}
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
          defaultValue={p?.commission_duration_months ?? (parceiroNovo ? PADRAO_PARCEIRO.meses : '')}
          className={`${inputCls} mt-1`}
        />
      </label>
      {parceiroNovo && (
        <p className="text-[11px] text-ninho-roxo-escuro sm:col-span-3">
          Padrão do parceiro: 25% por 1 mês no plano mensal e 25% uma única vez no anual.
        </p>
      )}
    </div>
  );
}

function FormNovo() {
  const [state, action] = useFormState<ActionState, FormData>(criarPerfil, {});
  const [role, setRole] = useState<Role>('conversor');

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
            onChange={(e) => setRole(e.target.value as Role)}
            className={`${inputCls} mt-1`}
          >
            <option value="conversor">Conversor</option>
            <option value="influencer">Parceiro (influenciador)</option>
            <option value="admin">Administrador</option>
          </select>
        </label>
      </div>
      <label className="text-xs text-ninho-cinza">
        Senha inicial (deixe em branco para gerar uma aleatória)
        <div className="mt-1">
          <SenhaForteInput name="password" placeholder="Gerada automaticamente" opcional />
        </div>
        <span className="mt-1 block text-[11px]">Parceiro e conversor trocam a senha no 1º acesso.</span>
      </label>
      {role === 'influencer' && <CampoCodigo />}
      {role !== 'admin' && <CamposComissao key={role} parceiroNovo={role === 'influencer'} />}
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
            {ROLE_LABEL[p.role]}
            {p.promo_code ? ` · ${p.promo_code}` : ''}
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
            {p.role === 'influencer' && <CampoCodigo p={p} />}
            {p.role !== 'admin' && <CamposComissao p={p} />}
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
              <SenhaForteInput name="nova" placeholder="Em branco = gerar uma senha forte" pessoais={[p.username, p.display_name, p.email]} opcional />
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
