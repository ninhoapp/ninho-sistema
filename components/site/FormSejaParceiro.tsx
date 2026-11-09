'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { enviarPedidoParceiro, type PedidoParceiroState } from '@/app/sejaparceiro/actions';
import { TelefonePais } from '@/components/TelefonePais';

function Enviar() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="nc-btn nc-btn-grad" style={{ width: '100%', marginTop: 16 }} disabled={pending}>
      {pending ? 'Enviando...' : 'Quero ser parceiro'}
    </button>
  );
}

/** Formulário "Quero ser parceiro": nome, e-mail, WhatsApp e Instagram. Vira pedido no painel do dono. */
export function FormSejaParceiro({ abertoEm }: { abertoEm: number }) {
  const [state, action] = useFormState<PedidoParceiroState, FormData>(enviarPedidoParceiro, {});

  if (state.ok) {
    return (
      <div className="nc-ok">
        <div className="nc-ico" style={{ margin: '0 auto', width: 72, height: 72, background: '#D3EEDF', color: '#3E9D70', fontSize: 34 }}>✓</div>
        <h2>Recebemos seu pedido</h2>
        <p>A equipe do Ninho vai olhar o seu perfil e falar com você pelo WhatsApp. Quando for aprovado, você recebe o seu link, o seu código e o acesso ao painel.</p>
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
        <div className="nc-fld"><label htmlFor="np-nome">Nome</label><input id="np-nome" name="nome" required minLength={2} maxLength={80} placeholder="Nome e sobrenome" autoComplete="name" /></div>
        <div className="nc-fld"><label htmlFor="np-email">E-mail</label><input id="np-email" name="email" type="email" required maxLength={254} placeholder="nome@gmail.com" autoComplete="email" /></div>
      </div>
      <div className="nc-g3" style={{ gap: 10 }}>
        <div className="nc-fld" style={{ gridColumn: 'span 2' }}><label htmlFor="np-w">WhatsApp</label><TelefonePais id="np-w" name="whatsapp" /></div>
        <div className="nc-fld"><label htmlFor="np-i">Instagram</label><input id="np-i" name="instagram" required placeholder="@" /></div>
      </div>
      {state.error && <p className="nc-err" role="alert">{state.error}</p>}
      <Enviar />
      <p style={{ fontSize: 12, color: '#9A95AD', marginTop: 10, textAlign: 'center', lineHeight: 1.5 }}>
        Usamos esses dados só para falar com você sobre a parceria. Veja a <a href="/privacidade" style={{ color: '#7C5CD6', fontWeight: 700 }}>Política de Privacidade</a>.
      </p>
    </form>
  );
}
