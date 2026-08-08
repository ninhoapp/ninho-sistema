'use client';

import { useState, useMemo } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { excluirUsuarios, type ExclusaoState } from '@/app/admin/(painel)/admin-actions';
import type { AppUser } from '@/lib/app-users';
import type { PreviaExclusao } from '@/lib/painel/store';
import { EstadoBadge } from '@/components/admin/EstadoBadge';
import { PasswordInput } from '@/components/admin/PasswordInput';
import { ExportExcelButton } from '@/components/admin/ExportExcelButton';
import { CopyAll } from '@/components/admin/CopyAll';
import { ColumnFilter, applyColumnFilters } from '@/components/admin/ColumnFilter';
import { formatDate } from '@/lib/metrics';
import type { Estado } from '@/lib/app-users';

type Col = 'estado' | 'plano';

const ESTADO_TXT: Record<Estado, string> = {
  pagante: 'Pagante',
  trial_ativo: 'Trial ativo',
  trial_expirado: 'Trial expirado',
  churn: 'Churn',
  free: 'Free',
};

function BotaoConfirmar() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-pill bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
    >
      {pending ? 'Excluindo...' : 'Excluir definitivamente'}
    </button>
  );
}

export function UsuariosTable({
  users,
  previas,
}: {
  users: AppUser[];
  /** Prévia de impacto por usuário, calculada no servidor. */
  previas: Record<string, PreviaExclusao>;
}) {
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [confirmando, setConfirmando] = useState(false);
  const [state, action] = useFormState<ExclusaoState, FormData>(excluirUsuarios, {});
  const [colFilters, setColFilters] = useState<Record<Col, Set<string> | null>>({
    estado: null,
    plano: null,
  });

  const ids = useMemo(() => Array.from(sel), [sel]);

  const colValue = (u: AppUser, col: Col) =>
    col === 'estado' ? ESTADO_TXT[u.estado] : u.plan_interval === 'anual' ? 'Anual' : 'Mensal';

  const opcoes = useMemo(
    () => ({
      estado: Array.from(new Set(users.map((u) => ESTADO_TXT[u.estado]))).sort(),
      plano: Array.from(
        new Set(users.map((u) => (u.plan_interval === 'anual' ? 'Anual' : 'Mensal')))
      ).sort(),
    }),
    [users]
  );

  // A seleção e a exclusão agem sobre o que está VISÍVEL — filtrou, some da conta.
  const visiveis = useMemo(
    () => applyColumnFilters(users, colFilters, colValue),
    [users, colFilters]
  );

  // Soma o impacto de tudo que está selecionado, pra confirmação ser concreta.
  const impacto = useMemo(() => {
    return ids.reduce(
      (acc, id) => {
        const p = previas[id];
        if (!p) return acc;
        return {
          bebesApagados: acc.bebesApagados + p.bebes_exclusivos,
          bebesTransferidos: acc.bebesTransferidos + p.bebes_transferidos,
          registros: acc.registros + p.registros,
          fotos: acc.fotos + p.fotos,
        };
      },
      { bebesApagados: 0, bebesTransferidos: 0, registros: 0, fotos: 0 }
    );
  }, [ids, previas]);

  function toggle(id: string) {
    setSel((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  function toggleTodos() {
    setSel((prev) =>
      prev.size === visiveis.length ? new Set() : new Set(visiveis.map((u) => u.id))
    );
  }

  // Sucesso: limpa a seleção e mostra o que de fato aconteceu.
  if (state.ok && state.resumo && confirmando) {
    return (
      <div className="rounded-2xl border border-ninho-borda bg-white p-6">
        <p className="text-sm font-semibold text-ninho-grafite">
          {state.resumo.usuarios} {state.resumo.usuarios === 1 ? 'usuário excluído' : 'usuários excluídos'}.
        </p>
        <p className="mt-1 text-sm text-ninho-cinza">
          {state.resumo.bebesApagados} {state.resumo.bebesApagados === 1 ? 'bebê apagado' : 'bebês apagados'}
          {state.resumo.bebesTransferidos > 0 &&
            `, ${state.resumo.bebesTransferidos} transferido(s) para outro cuidador`}
          .
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 rounded-pill bg-ninho-roxo px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-ninho-roxo-escuro"
        >
          Atualizar lista
        </button>
      </div>
    );
  }

  const paraExcel = visiveis.map((u) => ({
    Nome: u.name || '',
    'E-mail': u.email || '',
    Telefone: u.phone || '',
    Estado: u.estado,
    Plano: u.plan_interval || '',
    'Trial acaba': u.trial_ends_at ? new Date(u.trial_ends_at).toLocaleDateString('pt-BR') : '',
    Cadastro: new Date(u.created_at).toLocaleDateString('pt-BR'),
    Bebês: previas[u.id] ? previas[u.id].bebes_exclusivos + previas[u.id].bebes_transferidos : 0,
  }));

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ninho-cinza">
          Mostrando <strong className="text-ninho-grafite">{visiveis.length}</strong> de{' '}
          {users.length}
        </p>
        <div className="flex flex-wrap gap-2">
          <CopyAll
            label="Copiar e-mails"
            values={visiveis.map((u) => u.email).filter((e): e is string => Boolean(e))}
          />
          <ExportExcelButton rows={paraExcel} filename="ninho-usuarios" sheetName="Usuários" />
        </div>
      </div>

      {sel.size > 0 && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ninho-roxo bg-ninho-roxo-suave px-5 py-3">
          <span className="text-sm font-medium text-ninho-roxo-escuro">
            {sel.size} {sel.size === 1 ? 'usuário selecionado' : 'usuários selecionados'}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setSel(new Set())}
              className="rounded-pill border border-ninho-roxo px-4 py-2 text-xs font-medium text-ninho-roxo-escuro transition hover:bg-white"
            >
              Limpar seleção
            </button>
            <button
              onClick={() => setConfirmando(true)}
              className="rounded-pill bg-red-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-700"
            >
              Excluir {sel.size === 1 ? 'usuário' : 'usuários'}
            </button>
          </div>
        </div>
      )}

      {confirmando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-full w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6">
            <h2 className="text-lg font-bold text-ninho-grafite">
              Excluir {sel.size} {sel.size === 1 ? 'usuário' : 'usuários'}?
            </h2>
            <p className="mt-2 text-sm text-ninho-cinza">
              Isso é definitivo e não tem desfazer. Não é só a conta — some tudo que estiver
              vinculado a ela.
            </p>

            <div className="mt-4 rounded-xl bg-ninho-nuvem p-4 text-sm">
              <p className="mb-2 font-semibold text-ninho-grafite">O que vai ser apagado:</p>
              <ul className="flex flex-col gap-1 text-ninho-cinza">
                <li>
                  <strong className="text-ninho-grafite">{impacto.bebesApagados}</strong>{' '}
                  {impacto.bebesApagados === 1 ? 'bebê' : 'bebês'} — com rotina, vacinas,
                  crescimento, consultas e álbuns
                </li>
                <li>
                  <strong className="text-ninho-grafite">{impacto.registros}</strong> registros de
                  rotina
                </li>
                <li>
                  <strong className="text-ninho-grafite">{impacto.fotos}</strong> fotos
                </li>
              </ul>
              {impacto.bebesTransferidos > 0 && (
                <p className="mt-3 border-t border-ninho-borda pt-3 text-ninho-grafite">
                  <strong>{impacto.bebesTransferidos}</strong>{' '}
                  {impacto.bebesTransferidos === 1 ? 'bebê' : 'bebês'} não{' '}
                  {impacto.bebesTransferidos === 1 ? 'será apagado' : 'serão apagados'}: tem outro
                  cuidador na conta e a posse passa para ele.
                </p>
              )}
            </div>

            <form action={action} className="mt-5 flex flex-col gap-3">
              <input type="hidden" name="ids" value={ids.join(',')} />
              {state.error && (
                <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{state.error}</div>
              )}
              <label className="text-xs text-ninho-cinza">
                Digite sua senha de administrador para confirmar
                <div className="mt-1">
                  <PasswordInput
                    name="senha"
                    placeholder="Sua senha"
                    autoComplete="current-password"
                  />
                </div>
              </label>
              <div className="flex flex-wrap gap-2">
                <BotaoConfirmar />
                <button
                  type="button"
                  onClick={() => setConfirmando(false)}
                  className="rounded-pill border border-ninho-borda px-5 py-2.5 text-sm font-medium text-ninho-cinza transition hover:border-ninho-roxo hover:text-ninho-roxo"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="admin-scroll overflow-x-auto rounded-2xl border border-ninho-borda bg-white">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead>
            <tr className="border-b border-ninho-borda">
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  checked={visiveis.length > 0 && sel.size === visiveis.length}
                  onChange={toggleTodos}
                  aria-label="Selecionar todos"
                />
              </th>
              {['Nome', 'E-mail', 'Telefone'].map((h) => (
                <th
                  key={h}
                  className="whitespace-nowrap px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-ninho-cinza"
                >
                  {h}
                </th>
              ))}
              {/* sem overflow-hidden nestes th: o dropdown do ColumnFilter precisa
                  "escapar" da célula pra não ficar cortado */}
              <th className="whitespace-nowrap px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-ninho-cinza">
                Estado
                <ColumnFilter
                  options={opcoes.estado}
                  selected={colFilters.estado}
                  onChange={(v) => setColFilters((p) => ({ ...p, estado: v }))}
                />
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-ninho-cinza">
                Plano
                <ColumnFilter
                  options={opcoes.plano}
                  selected={colFilters.plano}
                  onChange={(v) => setColFilters((p) => ({ ...p, plano: v }))}
                />
              </th>
              {['Trial acaba', 'Cadastro', 'Bebês'].map((h) => (
                <th
                  key={h}
                  className="whitespace-nowrap px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-ninho-cinza"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-ninho-borda">
            {visiveis.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-ninho-cinza">
                  {users.length === 0
                    ? 'Nenhum usuário cadastrado ainda.'
                    : 'Nenhum usuário corresponde ao filtro.'}
                </td>
              </tr>
            )}
            {visiveis.map((u) => {
              const p = previas[u.id];
              const marcado = sel.has(u.id);
              return (
                <tr key={u.id} className={marcado ? 'bg-ninho-roxo-suave/40' : undefined}>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={marcado}
                      onChange={() => toggle(u.id)}
                      aria-label={`Selecionar ${u.name || u.email || 'usuário'}`}
                    />
                  </td>
                  <td className="px-4 py-3 font-medium text-ninho-grafite">{u.name || '—'}</td>
                  <td className="px-4 py-3 text-ninho-cinza">{u.email || '—'}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-ninho-cinza">{u.phone || '—'}</td>
                  <td className="px-4 py-3">
                    <EstadoBadge estado={u.estado} />
                  </td>
                  <td className="px-4 py-3 text-ninho-cinza">
                    {u.plan_interval ? (u.plan_interval === 'anual' ? 'Anual' : 'Mensal') : '—'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-ninho-cinza">
                    {formatDate(u.trial_ends_at)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-ninho-cinza">
                    {formatDate(u.created_at)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-ninho-cinza">
                    {p ? p.bebes_exclusivos + p.bebes_transferidos : 0}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
