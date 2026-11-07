'use client';

import { useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { enviarPedidoSite, type PedidoState } from '@/app/landing/sejaconsultor/actions';

function Enviar({ pronto }: { pronto: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="nc-btn nc-btn-grad" style={{ width: '100%', marginTop: 16 }} disabled={pending || !pronto}>
      {pending ? 'Enviando...' : 'Enviar pedido'}
    </button>
  );
}

/** Formulário "Quero ser consultora" (aceites do Darck, versão site-2026-11-06). */
export function FormSejaConsultora({ abertoEm }: { abertoEm: number }) {
  const [state, action] = useFormState<PedidoState, FormData>(enviarPedidoSite, {});
  const [ok1, setOk1] = useState(false);
  const [ok2, setOk2] = useState(false);

  if (state.ok) {
    return (
      <div className="nc-ok">
        <div className="nc-ico" style={{ margin: '0 auto', width: 72, height: 72, background: '#D3EEDF', color: '#3E9D70', fontSize: 34 }}>✓</div>
        <h2>Recebemos seu pedido</h2>
        <p>A equipe do Ninho vai olhar seu perfil e falar com você. Quando a conta for liberada, você entra no app com o e-mail que mandou.</p>
      </div>
    );
  }

  return (
    <form action={action} className="nc-card nc-form">
      <input type="hidden" name="t" value={abertoEm} />
      <div className="nc-hp" aria-hidden="true">
        <label>Site<input name="site" tabIndex={-1} autoComplete="off" /></label>
      </div>
      <div className="nc-g2" style={{ gap: 10 }}>
        <div className="nc-fld"><label htmlFor="nc-nome">Nome</label><input id="nc-nome" name="nome" required minLength={2} maxLength={80} placeholder="Nome e sobrenome" autoComplete="name" /></div>
        <div className="nc-fld"><label htmlFor="nc-email">E-mail que você vai usar no app</label><input id="nc-email" name="email" type="email" required maxLength={254} placeholder="nome@gmail.com" autoComplete="email" /></div>
      </div>
      <div className="nc-g3" style={{ gap: 10 }}>
        <div className="nc-fld"><label htmlFor="nc-w">WhatsApp</label><input id="nc-w" name="whatsapp" placeholder="+55" inputMode="tel" autoComplete="tel" /></div>
        <div className="nc-fld"><label htmlFor="nc-i">Instagram</label><input id="nc-i" name="instagram" placeholder="@" /></div>
        <div className="nc-fld"><label htmlFor="nc-c">Quem te indicou (código)</label><input id="nc-c" name="codigo" placeholder="Ex.: NATHALIA" maxLength={20} /></div>
      </div>
      <label className="nc-ck">
        <input type="checkbox" name="ok1" checked={ok1} onChange={(e) => setOk1(e.target.checked)} />
        <span>
          <b>Sou responsável pelas minhas orientações.</b> Atendo como profissional independente, e tudo o que eu orientar
          ou indicar às famílias é de minha responsabilidade única e exclusiva. O Ninho é um app de registro de rotina: não
          presta, não cobra e não supervisiona consultoria.
        </span>
      </label>
      <label className="nc-ck">
        <input type="checkbox" name="ok2" checked={ok2} onChange={(e) => setOk2(e.target.checked)} />
        <span>
          Tenho 18 anos ou mais e li o <a href="#termo-consultora" style={{ color: '#7C5CD6', fontWeight: 800 }}>Termo da Consultora</a> e a{' '}
          <a href="/privacidade" target="_blank" rel="noopener" style={{ color: '#7C5CD6', fontWeight: 800 }}>Política de Privacidade</a>. Sei que o
          Ninho decide quem entra e pode pausar minha conta.
        </span>
      </label>
      <div className="nc-err" role="alert">{state.error ?? ''}</div>
      <Enviar pronto={ok1 && ok2} />
      <p style={{ fontSize: 12, color: '#9A95AD', textAlign: 'center', marginTop: 10 }}>
        O pedido chega no painel do Ninho. Nada é liberado sem a aprovação da equipe.
      </p>
    </form>
  );
}
