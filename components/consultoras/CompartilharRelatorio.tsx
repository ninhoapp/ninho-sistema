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

const SECOES: [number, string][] = [
  [1, 'Resumo'],
  [2, 'Sono da noite'],
  [3, 'Sonecas e janelas'],
  [4, 'Antes dos despertares'],
  [5, 'Melhores e piores noites'],
  [6, 'Horários'],
  [7, 'Perguntas para a família'],
  [8, 'O que observar'],
];

export function CompartilharRelatorio({
  whatsapp,
  mensagem,
  children,
}: {
  whatsapp: string | null;
  mensagem: string;
  children: React.ReactNode;
}) {
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

  const ocultas = paraFamilia ? SECOES.map(([n]) => n).filter((n) => !marcadas.has(n)) : [];
  const numero = (whatsapp ?? '').replace(/\D/g, '');
  const wa = `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
  const btn = 'inline-flex h-10 items-center justify-center gap-2 rounded-pill px-4 text-[13.5px] font-bold';

  return (
    <div className={ocultas.map((n) => `oculta-${n}`).join(' ')}>
      <div className="no-print mb-4 flex flex-wrap gap-2">
        <button type="button" onClick={() => imprimir(false)} className={`${btn} bg-[#F1EBFC] text-[#7C5CD6]`}>Baixar PDF</button>
        <button type="button" onClick={() => setAberto((x) => !x)} className={`${btn} bg-gradient-primary text-white`}>Compartilhar com a família</button>
      </div>
      {aberto && (
        <div className="no-print mb-4 rounded-[22px] bg-white p-5 shadow-[0_10px_30px_-22px_rgba(80,40,160,.35)]">
          <p className="text-[15px] font-extrabold">Compartilhar com a família</p>
          <p className="mt-1 text-[13px] text-ninho-cinza">Você revisa antes. A família recebe o PDF com o seu nome, a sua foto e o rodapé de saúde.</p>
          <p className="mt-3 text-[12px] font-extrabold uppercase tracking-[0.08em] text-[#9A95AD]">1 · O que vai no PDF</p>
          <div className="mt-1.5 grid gap-1.5 sm:grid-cols-2">
            {SECOES.map(([n, t]) => (
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
                {n}. {t}{n === 7 ? ' (roteiro seu: vem desmarcada)' : ''}
              </label>
            ))}
          </div>
          <p className="mt-4 text-[12px] font-extrabold uppercase tracking-[0.08em] text-[#9A95AD]">2 · Baixe o PDF da família</p>
          <button type="button" onClick={() => imprimir(true)} className={`${btn} mt-1.5 bg-[#F1EBFC] text-[#7C5CD6]`}>Baixar PDF da família</button>
          <p className="mt-1 text-[12px] text-ninho-cinza">Na janela que abrir, escolha <b>Salvar como PDF</b>.</p>
          <p className="mt-4 text-[12px] font-extrabold uppercase tracking-[0.08em] text-[#9A95AD]">3 · Mande pelo WhatsApp</p>
          <p className="mt-1 rounded-xl bg-[#F5F2FB] p-3 text-[13px]">{mensagem}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <a href={wa} target="_blank" rel="noopener" className={`${btn} bg-[#4CAF74] text-white`}>
              Abrir WhatsApp{numero ? ' da família' : ''}
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
              {copiado ? 'Copiado!' : 'Copiar mensagem'}
            </button>
          </div>
          <p className="mt-1.5 text-[12px] text-ninho-cinza">
            No WhatsApp, toque no clipe › Documento e escolha o PDF que você baixou. {numero ? '' : 'Cadastre o WhatsApp da família na ficha para abrir direto na conversa dela.'}
          </p>
        </div>
      )}
      {children}
    </div>
  );
}
