'use client';

/**
 * Pedidos de /sejaparceiro na tela Parceiros do dono. Cada pendente tem
 * Aprovar (código, % e meses de comissão) e Recusar. Ao aprovar, o login e a
 * senha provisória aparecem uma vez só, para o dono mandar ao parceiro; no
 * 1º acesso o painel obriga o parceiro a trocar a senha.
 */
import { useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { aprovarPedidoParceiro, recusarPedidoParceiro, type AprovarState } from '@/app/admin/(painel)/parceiros/actions';
import type { PedidoParceiro } from '@/lib/parceiros/pedidos';

const SITE_LOGIN = 'https://www.useninho.com.br/admin/login';

function Botao({ children, cls }: { children: React.ReactNode; cls: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={cls}>
      {pending ? '...' : children}
    </button>
  );
}

function dataBr(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', { timeZone: 'Asia/Dubai', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function zap(digitos: string | null) {
  return digitos ? `https://wa.me/${digitos}` : null;
}

function Copiar({ texto }: { texto: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(texto);
          setOk(true);
          setTimeout(() => setOk(false), 1800);
        } catch {
          /* sem permissão: o texto continua na tela */
        }
      }}
      className="inline-flex h-8 items-center rounded-pill bg-[#4CAF74] px-3 text-[12.5px] font-bold text-white"
    >
      {ok ? 'Copiado!' : 'Copiar mensagem'}
    </button>
  );
}

function Pendente({ p, codigoSugerido }: { p: PedidoParceiro; codigoSugerido: string }) {
  const [state, action] = useFormState<AprovarState, FormData>(aprovarPedidoParceiro, {});
  const w = zap(p.whatsapp);

  if (state.ok && state.login && state.senha) {
    const msg =
      `Oi, ${p.nome.split(' ')[0]}! Sua parceria com o Ninho foi aprovada.\n\n` +
      `Seu link: ${state.link}\nSeu código: ${state.codigo}\n\n` +
      `Painel: ${SITE_LOGIN}\nUsuário: ${state.login}\nSenha provisória: ${state.senha}\n\n` +
      `No primeiro acesso o painel pede para você criar a sua senha.`;
    return (
      <div className="rounded-[18px] bg-[#EEF8F1] p-4 text-[13.5px] text-[#256B43]">
        <p className="font-extrabold">{p.nome} aprovado como parceiro.</p>
        <p className="mt-1">
          Usuário <b className="font-mono">{state.login}</b> · senha provisória <b className="font-mono">{state.senha}</b> · código{' '}
          <b className="font-mono">{state.codigo}</b>
        </p>
        <p className="mt-1 text-[12px]">A senha aparece só agora. Mande a mensagem abaixo para ele; no 1º acesso ele cria a senha dele.</p>
        <pre className="mt-2 whitespace-pre-wrap rounded-xl bg-white p-3 font-sans text-[12.5px] text-ninho-grafite">{msg}</pre>
        <div className="mt-2 flex flex-wrap gap-2">
          <Copiar texto={msg} />
          {w && (
            <a href={w} target="_blank" rel="noreferrer" className="inline-flex h-8 items-center rounded-pill bg-white px-3 text-[12.5px] font-bold text-[#2F8A55]">
              Abrir o WhatsApp dele
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[18px] border border-[#F0ECF6] p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[15px] font-extrabold text-ninho-grafite">{p.nome}</p>
          <p className="mt-0.5 text-[12.5px] text-ninho-cinza">
            {p.email}
            {p.instagram && (
              <>
                {' · '}
                <a href={`https://instagram.com/${p.instagram}`} target="_blank" rel="noreferrer" className="font-semibold text-[#7C5CD6]">@{p.instagram}</a>
              </>
            )}
            {w && (
              <>
                {' · '}
                <a href={w} target="_blank" rel="noreferrer" className="font-semibold text-[#2F8A55]">WhatsApp +{p.whatsapp}</a>
              </>
            )}
          </p>
        </div>
        <span className="text-[11.5px] font-semibold text-ninho-cinza">pediu em {dataBr(p.criado_em)}</span>
      </div>
      <form action={action} className="mt-3 flex flex-wrap items-end gap-2">
        <input type="hidden" name="id" value={p.id} />
        <label className="text-[11.5px] font-bold text-[#9A95AD]">
          Código do link
          <input name="codigo" defaultValue={codigoSugerido} className="mt-1 block h-9 w-40 rounded-xl bg-[#F5F2FB] px-3 font-mono text-[13px] font-bold uppercase text-ninho-grafite outline-none" />
        </label>
        <label className="text-[11.5px] font-bold text-[#9A95AD]">
          Comissão %
          <input name="percentual" defaultValue={25} inputMode="decimal" className="mt-1 block h-9 w-20 rounded-xl bg-[#F5F2FB] px-3 text-[13px] font-bold text-ninho-grafite outline-none" />
        </label>
        <label className="text-[11.5px] font-bold text-[#9A95AD]">
          Meses (mensal)
          <input name="meses" defaultValue={1} inputMode="numeric" className="mt-1 block h-9 w-20 rounded-xl bg-[#F5F2FB] px-3 text-[13px] font-bold text-ninho-grafite outline-none" />
        </label>
        <Botao cls="inline-flex h-9 items-center rounded-pill bg-[#4CAF74] px-4 text-[13px] font-bold text-white disabled:opacity-50">Aprovar</Botao>
        <button formAction={recusarPedidoParceiro} className="inline-flex h-9 items-center rounded-pill bg-[#FDEEEE] px-4 text-[13px] font-bold text-[#E85D5D]">
          Recusar
        </button>
      </form>
      {state.error && <p className="mt-2 text-[12.5px] font-semibold text-[#E85D5D]">{state.error}</p>}
    </div>
  );
}

export function PedidosParceiros({ pedidos, sugestoes }: { pedidos: PedidoParceiro[]; sugestoes: Record<string, string> }) {
  const pendentes = pedidos.filter((p) => p.status === 'pendente');
  const decididos = pedidos.filter((p) => p.status !== 'pendente');
  return (
    <section className="mb-6 rounded-[22px] bg-white p-5 shadow-[0_10px_30px_-22px_rgba(80,40,160,.35)]">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[15px] font-extrabold text-ninho-grafite">
          Pedidos para ser parceiro{' '}
          {pendentes.length > 0 && <span className="ml-1 rounded-pill bg-[#F2709F] px-2 py-0.5 text-[11px] font-extrabold text-white">{pendentes.length}</span>}
        </h2>
        <span className="text-xs font-semibold text-ninho-cinza">vêm do formulário em useninho.com.br/sejaparceiro</span>
      </div>
      {pendentes.length === 0 && <p className="text-[13px] text-ninho-cinza">Nenhum pedido esperando.</p>}
      <div className="flex flex-col gap-3">
        {pendentes.map((p) => (
          <Pendente key={p.id} p={p} codigoSugerido={sugestoes[p.id] ?? ''} />
        ))}
      </div>
      {decididos.length > 0 && (
        <details className="mt-3">
          <summary className="cursor-pointer text-[12.5px] font-semibold text-ninho-roxo-escuro">Decididos nos últimos 30 dias ({decididos.length})</summary>
          <ul className="mt-2 divide-y divide-[#F5F2FA] text-[13px]">
            {decididos.map((p) => (
              <li key={p.id} className="flex flex-wrap justify-between gap-2 py-2">
                <span><b>{p.nome}</b> <span className="text-ninho-cinza">· {p.email}</span></span>
                <span className={p.status === 'aprovado' ? 'font-bold text-[#2F8A55]' : 'font-bold text-[#E85D5D]'}>
                  {p.status === 'aprovado' ? 'Aprovado' : 'Recusado'} {p.decidido_em ? `em ${dataBr(p.decidido_em)}` : ''}
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
