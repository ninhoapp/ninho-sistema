'use client';

/**
 * Barra do relatório: "Baixar PDF" e "Compartilhar com a família".
 *
 * PDF sem biblioteca nova: a página tem CSS de impressão (relatorio.css) e o
 * botão chama window.print(); a consultora escolhe "Salvar como PDF". O PDF sai
 * com o cabeçalho dela (foto, nome, "Consultora independente") e o rodapé fixo
 * de saúde.
 *
 * Compartilhar: o navegador não consegue anexar um arquivo no WhatsApp por um
 * link. Então o fluxo é: (1) ela revisa as seções (as perguntas para a família
 * vêm desmarcadas, porque são roteiro dela); (2) baixa o PDF da família; (3)
 * abre o WhatsApp da família com a mensagem pronta e anexa o PDF baixado. Quem
 * envia é sempre ela.
 */
import { useEffect, useState } from 'react';
import './relatorio.css';
import { useTextos } from '@/components/consultoras/IdiomaConsultora';

/** Números das seções do relatório (os nomes vêm de rotina.compartilhar.secoes). */
const SECOES = [1, 2, 3, 4, 5, 6, 7, 8];

export function CompartilharRelatorio({
  whatsapp,
  mensagem,
  children,
}: {
  whatsapp: string | null;
  mensagem: string;
  children: React.ReactNode;
}) {
  const t = useTextos().rotina.compartilhar;
  const [aberto, setAberto] = useState(false);
  const [marcadas, setMarcadas] = useState<Set<number>>(() => new Set([1, 2, 3, 4, 5, 6, 8]));
  const [paraFamilia, setParaFamilia] = useState(false);
  const [copiado, setCopiado] = useState(false);

  // Depois de imprimir, volta a mostrar tudo na tela.
  useEffect(() => {
    const depois = () => setParaFamilia(false);
    window.addEventListener('afterprint', depois);
    return () => window.removeEventListener('afterprint', depois);
  }, []);

  function imprimir(familia: boolean) {
    setParaFamilia(familia);
    // Espera o React aplicar as classes antes de abrir a impressão.
    setTimeout(() => window.print(), 60);
  }

  const ocultas = paraFamilia ? SECOES.filter((n) => !marcadas.has(n)) : [];
  const numero = (whatsapp ?? '').replace(/\D/g, '');
  const wa = `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
  const btn = 'inline-flex h-10 items-center justify-center gap-2 rounded-pill px-4 text-[13.5px] font-bold';

  return (
    <div className={ocultas.map((n) => `oculta-${n}`).join(' ')}>
      <div className="no-print mb-4 flex flex-wrap gap-2">
        <button type="button" onClick={() => imprimir(false)} className={`${btn} bg-[#F1EBFC] text-[#7C5CD6]`}>{t.baixarPdf}</button>
        <button type="button" onClick={() => setAberto((x) => !x)} className={`${btn} bg-gradient-primary text-white`}>{t.titulo}</button>
      </div>
      {aberto && (
        <div className="no-print mb-4 rounded-[22px] bg-white p-5 shadow-[0_10px_30px_-22px_rgba(80,40,160,.35)]">
          <p className="text-[15px] font-extrabold">{t.titulo}</p>
          <p className="mt-1 text-[13px] text-ninho-cinza">{t.intro}</p>
          <p className="mt-3 text-[12px] font-extrabold uppercase tracking-[0.08em] text-[#9A95AD]">{t.passo1}</p>
          <div className="mt-1.5 grid gap-1.5 sm:grid-cols-2">
            {SECOES.map((n) => (
              <label key={n} className="flex items-center gap-2 text-[13px]">
                <input
                  type="checkbox"
                  checked={marcadas.has(n)}
                  onChange={(e) => {
                    const s = new Set(marcadas);
                    if (e.target.checked) s.add(n);
                    else s.delete(n);
                    setMarcadas(s);
                  }}
                  className="h-4 w-4 accent-[#4CAF74]"
                />
                {n}. {t.secoes[n - 1]}{n === 7 ? t.roteiro : ''}
              </label>
            ))}
          </div>
          <p className="mt-4 text-[12px] font-extrabold uppercase tracking-[0.08em] text-[#9A95AD]">{t.passo2}</p>
          <button type="button" onClick={() => imprimir(true)} className={`${btn} mt-1.5 bg-[#F1EBFC] text-[#7C5CD6]`}>{t.baixarPdfFamilia}</button>
          <p className="mt-1 text-[12px] text-ninho-cinza">{t.salvarAntes}<b>{t.salvarComoPdf}</b>{t.salvarDepois}</p>
          <p className="mt-4 text-[12px] font-extrabold uppercase tracking-[0.08em] text-[#9A95AD]">{t.passo3}</p>
          <p className="mt-1 rounded-xl bg-[#F5F2FB] p-3 text-[13px]">{mensagem}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <a href={wa} target="_blank" rel="noopener" className={`${btn} bg-[#4CAF74] text-white`}>
              {t.abrirWhatsapp}{numero ? t.daFamilia : ''}
            </a>
            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(mensagem);
                  setCopiado(true);
                  setTimeout(() => setCopiado(false), 1800);
                } catch {
                  /* sem permissão: a mensagem está na tela para copiar à mão */
                }
              }}
              className={`${btn} bg-[#F0EEF4] text-ninho-cinza`}
            >
              {copiado ? t.copiado : t.copiar}
            </button>
          </div>
          <p className="mt-1.5 text-[12px] text-ninho-cinza">
            {t.anexar}{numero ? '' : t.semWhatsapp}
          </p>
        </div>
      )}
      {children}
    </div>
  );
}
