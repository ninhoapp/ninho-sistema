'use client';

import { useState } from 'react';
import { botao, campo } from './ui';

/**
 * "Orientação para a família" na aba Ficha do painel da consultora
 * (dono, 16/11/2026: no app já existia, no painel não).
 *
 * As mesmas regras do app (Darck, docs/empresa/pedidos/consultora-comunicacao-aceites.md):
 * um campo só, até 1.000 letras, sem link e sem anexo, não se edita depois de
 * enviada; aviso (que NÃO bloqueia) quando o texto parece de saúde; e o termo
 * na 1ª vez que ela envia. Quem decide de verdade é o servidor — isto aqui é
 * só para ela ver o limite e o aviso antes de mandar.
 */

export const ORIENTACAO_MAX = 1000;

/** Mesma regra do servidor: http, www. ou domínio com ponto e barra. */
function temLink(t: string): boolean {
  return /https?:\/\//i.test(t) || /\bwww\./i.test(t) || /\b[a-z0-9-]+\.[a-z]{2,}\/\S*/i.test(t);
}

/** Palavras de saúde (Darck): o painel só avisa, nunca bloqueia. */
function pareceSaude(t: string): boolean {
  return /(rem[eé]dio|\bmg\b|\bml de\b|\bgotas?\b|melatonina|bru[cç]os|cama compartilhada|diagn[oó]stic)/i.test(t);
}

/** Texto do termo com o trecho entre ** em negrito e os parágrafos separados. */
export function TextoComNegrito({ texto }: { texto: string }) {
  return (
    <>
      {texto.split('\n\n').map((par, i) => (
        <p key={i} className={i ? 'mt-2' : ''}>
          {par.split('**').map((p, j) => (j % 2 === 1 ? <b key={j}>{p}</b> : <span key={j}>{p}</span>))}
        </p>
      ))}
    </>
  );
}

export function OrientacaoFamilia({
  babyId,
  acao,
  precisaAceite,
  termo,
  bloqueio,
}: {
  babyId: string;
  acao: (fd: FormData) => void;
  /** Ela ainda não aceitou o termo que está valendo: o aceite vai junto. */
  precisaAceite: boolean;
  termo: string;
  /** Motivo para não dar nem para escrever (família sem plano, sem aceite dela…). */
  bloqueio?: string;
}) {
  const [texto, setTexto] = useState('');
  const [marcado, setMarcado] = useState(false);
  const limpo = texto.trim();
  const comLink = temLink(texto);
  const saude = pareceSaude(texto);
  const pode = Boolean(limpo) && limpo.length <= ORIENTACAO_MAX && !comLink && (!precisaAceite || marcado) && !bloqueio;

  if (bloqueio) return <p className="py-3 text-[13.5px] leading-relaxed text-ninho-cinza">{bloqueio}</p>;

  return (
    <form action={acao}>
      <input type="hidden" name="baby" value={babyId} />
      <textarea
        name="texto"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        maxLength={ORIENTACAO_MAX}
        rows={6}
        placeholder="Escreva aqui a orientação que a família vai ler no app. Sem link e sem anexo."
        className={`${campo} h-auto py-2 leading-relaxed`}
      />
      <div className="mt-1.5 flex flex-wrap items-start justify-between gap-2">
        <small className="max-w-[460px] text-[11.5px] leading-snug text-ninho-cinza">
          A família recebe no sininho e no celular, e você vê quando ela ler. Depois de enviada, a orientação não
          pode ser editada nem apagada.
        </small>
        <small className="text-[11.5px] font-extrabold tabular-nums text-ninho-cinza">
          {texto.length}/{ORIENTACAO_MAX}
        </small>
      </div>

      {(comLink || saude) && (
        <div className="mt-2 rounded-2xl bg-[#FFF3DF] px-3 py-2 text-[12.5px] font-bold leading-snug text-[#A8670F]">
          {comLink
            ? 'A orientação não pode ter link. Tire o endereço para poder enviar.'
            : 'Esse texto parece falar de saúde (remédio, dose, posição de sono). Você pode enviar, mas lembre: orientação de saúde é com o pediatra.'}
        </div>
      )}

      {precisaAceite && (
        <div className="mt-3 rounded-2xl bg-[#F8F6FC] px-4 py-3">
          <p className="text-[12.5px] font-extrabold text-[#24164F]">Antes da primeira orientação, confirme o termo</p>
          <div className="mt-2 max-h-[220px] overflow-auto text-[12.5px] leading-relaxed text-ninho-grafite">
            <TextoComNegrito texto={termo} />
          </div>
          <label className="mt-3 flex items-start gap-2 text-[12.5px] font-bold text-ninho-grafite">
            <input type="checkbox" name="aceite" checked={marcado} onChange={(e) => setMarcado(e.target.checked)} className="mt-0.5" />
            <span>Li e concordo com o termo acima.</span>
          </label>
        </div>
      )}

      <div className="mt-3">
        <button className={botao.grad} disabled={!pode}>
          Enviar para a família
        </button>
      </div>
    </form>
  );
}
