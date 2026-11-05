'use client';

import { useEffect, useMemo, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { atribuirParceiroAction, type ActionState } from '@/app/admin/(painel)/admin-actions';
import { PasswordInput } from '@/components/admin/PasswordInput';

export interface ContaAtribuivel {
  id: string;
  nome: string | null;
  email: string | null;
  criadaEm: string;
  status: string;
  origem: string;
  codigo: string | null;
  metodo: string | null;
}

export interface OpcaoParceiro {
  code: string;
  name: string;
}

const MAX_LINHAS = 50;

function Confirmar() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-pill bg-ninho-roxo px-4 py-2 text-sm font-semibold text-white hover:bg-ninho-roxo-escuro disabled:opacity-50"
    >
      {pending ? 'Salvando...' : 'Confirmar'}
    </button>
  );
}

/**
 * Atribuição manual: o dono procura a conta (quem disse "vim pela fulana")
 * e liga ao parceiro certo — ou remove. Pede a senha do admin numa janela
 * por cima (regra do painel para ação que muda dado). Mostra no máximo 50
 * linhas por busca para a tela continuar leve com milhares de contas.
 */
export function AtribuicaoManual({ contas, parceiros }: { contas: ContaAtribuivel[]; parceiros: OpcaoParceiro[] }) {
  const [busca, setBusca] = useState('');
  const [soSemParceiro, setSoSemParceiro] = useState(false);
  const [escolha, setEscolha] = useState<Record<string, string>>({});
  const [aberto, setAberto] = useState<{ id: string; code: string; quem: string } | null>(null);
  const [state, action] = useFormState<ActionState, FormData>(atribuirParceiroAction, {});

  useEffect(() => {
    if (state.ok) setAberto(null);
  }, [state]);

  const filtradas = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return contas.filter((c) => {
      if (soSemParceiro && c.codigo) return false;
      if (!q) return true;
      return (c.nome ?? '').toLowerCase().includes(q) || (c.email ?? '').toLowerCase().includes(q) || (c.codigo ?? '').toLowerCase().includes(q);
    });
  }, [contas, busca, soSemParceiro]);

  const nomeDe = (code: string) => parceiros.find((p) => p.code === code)?.name ?? code;

  return (
    <div className="rounded-2xl border border-ninho-borda bg-white p-4">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome, e-mail ou código"
          className="w-full rounded-xl border border-ninho-borda px-3 py-2 text-sm outline-none focus:border-ninho-roxo sm:max-w-sm"
        />
        <label className="flex items-center gap-2 text-sm text-ninho-grafite">
          <input type="checkbox" checked={soSemParceiro} onChange={(e) => setSoSemParceiro(e.target.checked)} />
          Só quem não tem parceiro
        </label>
        <span className="text-xs text-ninho-cinza sm:ml-auto">
          {filtradas.length} conta(s){filtradas.length > MAX_LINHAS ? ` · mostrando ${MAX_LINHAS}, refine a busca` : ''}
        </span>
      </div>

      {state.error && <div className="mb-3 rounded-xl bg-red-50 p-2.5 text-sm text-red-600">{state.error}</div>}
      {state.ok && <div className="mb-3 rounded-xl bg-ninho-roxo-suave p-2.5 text-sm text-ninho-roxo-escuro">Atribuição salva.</div>}

      <div className="admin-scroll overflow-x-auto">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead>
            <tr className="border-b border-ninho-borda text-[11px] uppercase tracking-wide text-ninho-cinza">
              <th className="px-3 py-2">Conta</th>
              <th className="px-3 py-2">Criada em</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Como conheceu</th>
              <th className="px-3 py-2">Parceiro hoje</th>
              <th className="px-3 py-2">Atribuir a</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ninho-borda">
            {filtradas.slice(0, MAX_LINHAS).map((c) => {
              const valor = escolha[c.id] ?? c.codigo ?? '';
              const mudou = valor !== (c.codigo ?? '');
              return (
                <tr key={c.id}>
                  <td className="px-3 py-2">
                    <span className="block font-medium text-ninho-grafite">{c.nome || '—'}</span>
                    <span className="block text-xs text-ninho-cinza">{c.email || '—'}</span>
                  </td>
                  <td className="px-3 py-2 text-ninho-cinza">{c.criadaEm}</td>
                  <td className="px-3 py-2">{c.status}</td>
                  <td className="px-3 py-2 text-ninho-cinza">{c.origem}</td>
                  <td className="px-3 py-2">
                    {c.codigo ? (
                      <span>
                        <span className="font-mono text-ninho-roxo-escuro">{c.codigo}</span>
                        {c.metodo && <span className="ml-1 text-xs text-ninho-cinza">({c.metodo})</span>}
                      </span>
                    ) : (
                      <span className="text-ninho-cinza">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <select
                        value={valor}
                        onChange={(e) => setEscolha((s) => ({ ...s, [c.id]: e.target.value }))}
                        className="rounded-xl border border-ninho-borda px-2 py-1.5 text-sm"
                      >
                        <option value="">Nenhum</option>
                        {parceiros.map((p) => (
                          <option key={p.code} value={p.code}>
                            {p.name} ({p.code})
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        disabled={!mudou}
                        onClick={() => setAberto({ id: c.id, code: valor, quem: c.nome || c.email || 'esta conta' })}
                        className="rounded-pill border border-ninho-roxo px-3 py-1.5 text-xs font-semibold text-ninho-roxo-escuro hover:bg-ninho-roxo-suave disabled:opacity-30"
                      >
                        Salvar
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {aberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setAberto(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <p className="text-sm font-semibold text-ninho-grafite">Confirmar atribuição</p>
            <p className="mt-1 text-sm text-ninho-cinza">
              {aberto.code
                ? `Ligar ${aberto.quem} ao parceiro ${nomeDe(aberto.code)}. A comissão dessa conta passa a ser dele.`
                : `Tirar o parceiro de ${aberto.quem}. A conta deixa de gerar comissão.`}
            </p>
            <form action={action} className="mt-3 space-y-3">
              <input type="hidden" name="profile_id" value={aberto.id} />
              <input type="hidden" name="promo_code" value={aberto.code} />
              <PasswordInput name="senha" placeholder="Sua senha do painel" autoComplete="current-password" />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAberto(null)}
                  className="rounded-pill border border-ninho-borda px-4 py-2 text-sm text-ninho-cinza"
                >
                  Cancelar
                </button>
                <Confirmar />
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
