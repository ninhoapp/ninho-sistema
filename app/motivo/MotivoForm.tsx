'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { descadastrar, registrarMotivo } from './actions';
import { MOTIVOS, type CodigoMotivo } from './opcoes';

type Idioma = 'pt' | 'en';

const botao =
  'w-full rounded-2xl border-[1.5px] px-4 py-3 text-[15px] font-bold transition active:scale-[0.98] disabled:opacity-50';

/**
 * Quem tocou num botão do e-mail chega com `inicial`: o motivo é gravado
 * sozinho ao abrir a página. É de propósito que isso acontece aqui no
 * navegador e não no GET: os filtros de e-mail (Outlook, antivírus) abrem os
 * links para conferir e gravariam todas as opções. Eles não rodam este código.
 */
export function MotivoForm({ token, inicial, idioma }: { token: string; inicial: CodigoMotivo | null; idioma: Idioma }) {
  const t = (pt: string, en: string) => (idioma === 'en' ? en : pt);
  const [motivo, setMotivo] = useState<CodigoMotivo | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [texto, setTexto] = useState('');
  const [textoEnviado, setTextoEnviado] = useState(false);
  const [pendente, start] = useTransition();
  const automatico = useRef(false);

  const escolher = (codigo: CodigoMotivo) => {
    setErro(null);
    start(async () => {
      const r = await registrarMotivo(token, codigo);
      if (r.ok) setMotivo(codigo);
      else setErro(r.erro === 'link' ? t('Este link não é mais válido.', 'This link is no longer valid.') : t('Não deu para salvar. Tente de novo.', "Couldn't save. Please try again."));
    });
  };

  useEffect(() => {
    if (inicial && !automatico.current) {
      automatico.current = true;
      escolher(inicial);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inicial]);

  const enviarTexto = () => {
    if (!motivo || !texto.trim()) return;
    start(async () => {
      const r = await registrarMotivo(token, motivo, texto);
      if (r.ok) setTextoEnviado(true);
      else setErro(t('Não deu para salvar. Tente de novo.', "Couldn't save. Please try again."));
    });
  };

  if (motivo) {
    const rotulo = MOTIVOS.find((m) => m.codigo === motivo);
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-xl font-extrabold text-ninho-grafite">{t('Obrigado por responder!', 'Thanks for answering!')}</h1>
        <p className="text-[15px] leading-relaxed text-ninho-cinza">
          {t('Sua resposta:', 'Your answer:')} <strong className="text-ninho-roxo-escuro">{rotulo ? t(rotulo.pt, rotulo.en) : ''}</strong>.{' '}
          {t('Ela vai direto para a equipe do Ninho.', 'It goes straight to the Ninho team.')}
        </p>
        {textoEnviado ? (
          <p className="rounded-2xl bg-ninho-roxo-suave p-3 text-sm text-ninho-roxo-escuro">{t('Recebemos. Obrigado por contar.', 'Got it. Thanks for telling us.')}</p>
        ) : (
          <>
            <label className="text-sm font-semibold text-ninho-grafite" htmlFor="texto">
              {t('Quer contar mais? (opcional)', 'Want to tell us more? (optional)')}
            </label>
            <textarea
              id="texto"
              rows={4}
              maxLength={1000}
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder={t('Por exemplo: qual função faltou, o que não funcionou…', 'For example: which feature was missing, what didn’t work…')}
              className="w-full rounded-2xl border border-ninho-borda bg-white px-4 py-3 text-sm text-ninho-grafite outline-none focus:border-ninho-roxo"
            />
            {/* Darck, 15/11/2026: texto livre pode virar dado sensível (LGPD art. 11). */}
            <p className="text-xs leading-relaxed text-ninho-cinza">
              {t(
                'Não escreva dados de saúde do bebê aqui. Sua resposta fica com a equipe do Ninho por 12 meses.',
                "Please don't include your baby's health information here. Your answer is kept by the Ninho team for 12 months.",
              )}{' '}
              <a href={t('/privacy', '/privacy-en')} className="underline">
                {t('Política de Privacidade', 'Privacy Policy')}
              </a>
            </p>
            <button
              type="button"
              onClick={enviarTexto}
              disabled={pendente || !texto.trim()}
              className="rounded-full bg-ninho-roxo px-6 py-3 text-sm font-semibold text-white transition hover:bg-ninho-roxo-escuro disabled:opacity-50"
            >
              {pendente ? t('Enviando...', 'Sending...') : t('Enviar', 'Send')}
            </button>
          </>
        )}
        <button type="button" onClick={() => setMotivo(null)} className="text-sm font-semibold text-ninho-roxo hover:underline">
          {t('Trocar minha resposta', 'Change my answer')}
        </button>
        {erro && <p className="text-sm text-red-600">{erro}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-xl font-extrabold text-ninho-grafite">{t('Por que você não assinou o Ninho?', "Why didn't you subscribe to Ninho?")}</h1>
      <p className="mb-2 text-[15px] leading-relaxed text-ninho-cinza">
        {t('Toque na opção que mais tem a ver com você.', 'Tap the option that fits best.')}
      </p>
      {MOTIVOS.map((m) => (
        <button
          key={m.codigo}
          type="button"
          disabled={pendente}
          onClick={() => escolher(m.codigo)}
          className={`${botao} border-ninho-roxo bg-white text-ninho-roxo-escuro hover:bg-ninho-roxo-suave`}
        >
          {pendente && inicial === m.codigo ? t('Salvando...', 'Saving...') : t(m.pt, m.en)}
        </button>
      ))}
      {erro && <p className="text-sm text-red-600">{erro}</p>}
    </div>
  );
}

/** Descadastro pelo link do rodapé: pede um toque (os filtros de e-mail
 *  abrem o link sozinhos e descadastrariam a pessoa sem ela querer). */
export function SairForm({ token, idioma }: { token: string; idioma: Idioma }) {
  const t = (pt: string, en: string) => (idioma === 'en' ? en : pt);
  const [feito, setFeito] = useState<boolean | null>(null);
  const [pendente, start] = useTransition();

  if (feito) {
    return (
      <div className="flex flex-col gap-3">
        <h1 className="text-xl font-extrabold text-ninho-grafite">{t('Pronto', 'Done')}</h1>
        <p className="text-[15px] leading-relaxed text-ninho-cinza">
          {t(
            'Você não vai mais receber e-mails nem lembretes por push do Ninho. Para voltar a receber, abra o app e ligue as notificações.',
            "You won't get emails or push reminders from Ninho anymore. To turn them back on, open the app and enable notifications.",
          )}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-extrabold text-ninho-grafite">{t('Parar de receber e-mails do Ninho?', 'Stop getting emails from Ninho?')}</h1>
      <p className="text-[15px] leading-relaxed text-ninho-cinza">
        {t('Isso também desliga os lembretes por push do app.', 'This also turns off push reminders from the app.')}
      </p>
      <button
        type="button"
        disabled={pendente}
        onClick={() => start(async () => setFeito((await descadastrar(token)).ok))}
        className="rounded-full bg-ninho-roxo px-6 py-3 text-sm font-semibold text-white transition hover:bg-ninho-roxo-escuro disabled:opacity-50"
      >
        {pendente ? t('Salvando...', 'Saving...') : t('Sim, parar de receber', 'Yes, stop')}
      </button>
      {feito === false && <p className="text-sm text-red-600">{t('Este link não é mais válido.', 'This link is no longer valid.')}</p>}
    </div>
  );
}
