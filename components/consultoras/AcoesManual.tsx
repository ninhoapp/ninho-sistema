'use client';

import { useRef, useState } from 'react';
import { toJpeg } from 'html-to-image';
import { dataUrlParaBytes, montarPdf, type PaginaPdf } from '@/lib/pdf-de-imagens';
import { linkWhatsApp } from '@/components/consultoras/BotaoWhatsApp';
import { Rico } from '@/components/consultoras/Celular';
import { useIdioma } from '@/components/consultoras/IdiomaConsultora';
import { textos, type Idioma } from '@/lib/i18n-consultora';
import { LINK_BAIXAR, codigoDe, textoComPdf, textoManual, type DadosManual, type TipoManual } from '@/components/consultoras/manualTextos';
import {
  TelaAprovado,
  TelaApareca,
  TelaEditarPerfil,
  TelaListaConsultoras,
  TelaPerfilNaLista,
  TelaConfirmar,
  TelaConvidar,
  TelaCriarConta,
  TelaFamiliaAdicionar,
  TelaFamiliaCodigo,
  TelaInicioVazio,
  TelaLogin,
  TelaLoja,
  TelaModoConsultora,
  TelaPedido,
  TelaSininho,
  TelaTermo,
  TelaWhatsAppConvite,
} from '@/components/consultoras/TelasManual';

/**
 * Botões do manual (dono, 14/11/2026): Copiar o texto, Baixar PDF e Enviar
 * com PDF. O PDF é desenhado aqui mesmo, falando com a consultora ("você"),
 * com as mesmas telas do painel; o 1º passo de quem não tem conta é um botão
 * tocável para baixar o Ninho (useninho.com.br/baixar).
 *
 * Enviar: no celular, abre o compartilhar do aparelho com o PDF (escolhe o
 * WhatsApp). No computador, baixa o PDF e abre o WhatsApp com a mensagem;
 * aí é só arrastar o PDF para a conversa.
 *
 * Idioma (25/11/2026): `useIdioma()` (o dono vê pt). Textos em
 * lib/i18n-consultora/{pt,en,es}/manual.ts (`pdf` e `mensagem`).
 */

const L = 794; // largura da página A4 desenhada, em px
const A = 1123; // altura
const ESCALA = 0.78;

function Encolhido({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ width: 210 * ESCALA, height: 472 * ESCALA }} className="shrink-0">
      <div style={{ width: 210, transform: `scale(${ESCALA})`, transformOrigin: 'top left' }}>{children}</div>
    </div>
  );
}

function PassoPdf({ n, titulo, children, telas, lado = false }: { n: number; titulo: string; children: React.ReactNode; telas?: React.ReactNode; lado?: boolean }) {
  const texto = (
    <div className="flex items-start gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#8C5CF8] text-[15px] font-black text-white">{n}</span>
      <div className="min-w-0 flex-1">
        <h3 className="text-[19px] font-black leading-tight text-[#24164F]">{titulo}</h3>
        <div className="mt-1.5 space-y-1.5 text-[13.5px] leading-relaxed text-[#3A3B45]">{children}</div>
      </div>
    </div>
  );
  if (lado && telas) {
    // Texto à esquerda e a tela à direita: ocupa menos altura na página.
    return (
      <div className="mt-7 flex items-start gap-6">
        <div className="min-w-0 flex-1">{texto}</div>
        <div className="flex gap-6">{telas}</div>
      </div>
    );
  }
  return (
    <div className="mt-7">
      {texto}
      {telas && <div className="mt-4 flex gap-6 pl-11">{telas}</div>}
    </div>
  );
}

function Pagina({
  n,
  total,
  children,
  refPagina,
  idioma,
}: {
  n: number;
  total: number;
  children: React.ReactNode;
  refPagina: (el: HTMLDivElement | null) => void;
  idioma: Idioma;
}) {
  const t = textos(idioma).manual.pdf;
  return (
    <div ref={refPagina} style={{ width: L, height: A }} className="relative flex flex-col overflow-hidden bg-white px-12 pt-10 font-sans text-[#1E1F25]">
      <div className="flex items-center justify-between border-b border-[#ECE6F5] pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#A46DFF] to-[#8C5CF8] text-[13px] font-black text-white">N</span>
          <b className="text-[17px] text-[#7C5CD6]">Ninho</b>
        </div>
        <span className="text-[12px] font-bold text-[#9A95AD]">{t.cabecalho}</span>
      </div>
      <div className="flex-1">{children}</div>
      <div className="mb-6 flex items-center justify-between border-t border-[#ECE6F5] pt-3 text-[11px] text-[#9A95AD]">
        <span>useninho.com.br</span>
        <span>{t.pagina(n, total)}</span>
      </div>
    </div>
  );
}

function Capa({ d, tipo, idioma }: { d: DadosManual; tipo: TipoManual; idioma: Idioma }) {
  const t = textos(idioma).manual.pdf;
  return (
    <div className="mt-8 rounded-[26px] bg-gradient-to-br from-[#F4EEFF] to-[#EDE4FB] p-7">
      <p className="text-[28px] font-black leading-tight text-[#24164F]">{t.capaOi(d.nome)}</p>
      <p className="mt-2 max-w-[600px] text-[14.5px] leading-relaxed text-[#4B3A8C]">
        {tipo === 'sem-conta' ? t.capaSemConta : t.capaComConta}
      </p>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-[18px] bg-white p-4">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#9A95AD]">{t.seuEmail}</p>
          <p className="mt-1 break-all text-[15px] font-black text-[#24164F]">{d.email}</p>
        </div>
        <div className="rounded-[18px] bg-white p-4">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#9A95AD]">{t.seuCodigo}</p>
          <p className="mt-1 text-[15px] font-black tracking-wider text-[#7C5CD6]">{codigoDe(d)}</p>
        </div>
      </div>
    </div>
  );
}

function PassosComuns({ d, inicio, idioma }: { d: DadosManual; inicio: number; idioma: Idioma }) {
  const t = textos(idioma).manual.pdf;
  const codigo = codigoDe(d);
  return {
    termo: (
      <PassoPdf lado n={inicio} titulo={t.termoTitulo} telas={<Encolhido><TelaTermo primeiro={d.nome} idioma={idioma} /></Encolhido>}>
        <p>
          <Rico texto={t.termoTexto(d.nome)} />
        </p>
      </PassoPdf>
    ),
    convidar: (
      <PassoPdf
        n={inicio + 1}
        titulo={t.convidarTitulo}
        telas={
          <>
            <Encolhido><TelaInicioVazio idioma={idioma} /></Encolhido>
            <Encolhido><TelaConvidar codigo={codigo} idioma={idioma} /></Encolhido>
            <Encolhido><TelaWhatsAppConvite codigo={codigo} idioma={idioma} /></Encolhido>
          </>
        }
      >
        <p>
          <Rico texto={t.convidarA(codigo)} />
        </p>
        <p>
          <Rico texto={t.convidarB} />
        </p>
      </PassoPdf>
    ),
    aceita: (
      <PassoPdf
        n={inicio + 2}
        titulo={t.aceitaTitulo}
        telas={
          <>
            <Encolhido><TelaFamiliaAdicionar idioma={idioma} /></Encolhido>
            <Encolhido><TelaFamiliaCodigo codigo={codigo} nome={d.nome} idioma={idioma} /></Encolhido>
            <Encolhido><TelaSininho nome={d.nome} idioma={idioma} /></Encolhido>
          </>
        }
      >
        <p>{t.aceitaA}</p>
        <p>
          <Rico texto={t.aceitaB} />
        </p>
        <p>
          <Rico texto={t.aceitaC} />
        </p>
      </PassoPdf>
    ),
    aprovar: (
      <PassoPdf
        n={inicio + 3}
        titulo={t.aprovarTitulo}
        telas={
          <>
            <Encolhido><TelaPedido idioma={idioma} /></Encolhido>
            <Encolhido><TelaAprovado idioma={idioma} /></Encolhido>
          </>
        }
      >
        <p>
          <Rico texto={t.aprovarA} />
        </p>
        <p>
          <Rico texto={t.aprovarB} />
        </p>
      </PassoPdf>
    ),
    perfil: (
      <>
        <PassoPdf
          lado
          n={inicio + 4}
          titulo={t.perfilTitulo}
          telas={
            <>
              <Encolhido><TelaApareca idioma={idioma} /></Encolhido>
              <Encolhido><TelaEditarPerfil nome={d.nome} idioma={idioma} /></Encolhido>
            </>
          }
        >
          <p>{t.perfilA}</p>
          <p>
            <Rico texto={t.perfilB} />
          </p>
          <p>{t.perfilC}</p>
        </PassoPdf>
        <PassoPdf
          lado
          n={inicio + 5}
          titulo={t.vitrineTitulo}
          telas={
            <>
              <Encolhido><TelaListaConsultoras nome={d.nome} idioma={idioma} /></Encolhido>
              <Encolhido><TelaPerfilNaLista nome={d.nome} idioma={idioma} /></Encolhido>
            </>
          }
        >
          <p>
            <Rico texto={t.vitrineA} />
          </p>
          <p>
            <Rico texto={t.vitrineB} />
          </p>
          <p>{t.vitrineC}</p>
        </PassoPdf>
      </>
    ),
  };
}

function Ajuda({ idioma }: { idioma: Idioma }) {
  const t = textos(idioma).manual.pdf;
  return (
    <div className="mt-5 rounded-[22px] bg-[#E7F5EC] p-4">
      <p className="text-[16px] font-black text-[#2F8A55]">{t.ajudaTitulo}</p>
      <p className="mt-1 text-[13.5px] leading-relaxed text-[#2D4A39]">
        {t.ajudaTexto}
      </p>
      <p className="mt-3 text-[13.5px] font-bold text-[#2D4A39]">{t.ajudaAssinatura}</p>
    </div>
  );
}

export function Paginas({
  tipo,
  d,
  refs,
  idioma = 'pt',
}: {
  tipo: TipoManual;
  d: DadosManual;
  refs: React.MutableRefObject<(HTMLDivElement | null)[]>;
  idioma?: Idioma;
}) {
  const t = textos(idioma).manual.pdf;
  const c = PassosComuns({ d, inicio: 3, idioma });
  const set = (i: number) => (el: HTMLDivElement | null) => {
    refs.current[i] = el;
  };
  if (tipo === 'sem-conta') {
    const total = 6;
    return (
      <>
        <Pagina n={1} total={total} refPagina={set(0)} idioma={idioma}>
          <Capa d={d} tipo={tipo} idioma={idioma} />
          <PassoPdf n={1} titulo={t.baixarTitulo}>
            <p>
              <Rico texto={t.baixarTexto} />
            </p>
            <div className="flex items-center gap-8 pt-3">
              <div>
                <a
                  href={LINK_BAIXAR}
                  data-pdf-link={LINK_BAIXAR}
                  className="inline-flex h-14 items-center rounded-full bg-gradient-to-br from-[#A46DFF] to-[#8C5CF8] px-8 text-[17px] font-black text-white"
                >
                  {t.baixarBotao}
                </a>
                <p className="mt-2 text-[12.5px] font-bold text-[#7C5CD6]" data-pdf-link={LINK_BAIXAR}>
                  {LINK_BAIXAR.replace(/^https?:\/\//, '')}
                </p>
              </div>
              <Encolhido><TelaLoja idioma={idioma} /></Encolhido>
            </div>
          </PassoPdf>
        </Pagina>
        <Pagina n={2} total={total} refPagina={set(1)} idioma={idioma}>
          <PassoPdf
            n={2}
            titulo={t.contaTitulo}
            telas={
              <>
                <Encolhido><TelaLogin dedo="email" idioma={idioma} /></Encolhido>
                <Encolhido><TelaCriarConta email={d.email} idioma={idioma} /></Encolhido>
                <Encolhido><TelaConfirmar idioma={idioma} /></Encolhido>
              </>
            }
          >
            <p>
              <Rico texto={t.contaA(d.email)} />
            </p>
            <p>
              <Rico texto={t.contaB} />
            </p>
          </PassoPdf>
          {c.termo}
        </Pagina>
        <Pagina n={3} total={total} refPagina={set(2)} idioma={idioma}>
          {c.convidar}
        </Pagina>
        <Pagina n={4} total={total} refPagina={set(3)} idioma={idioma}>
          {c.aceita}
        </Pagina>
        <Pagina n={5} total={total} refPagina={set(4)} idioma={idioma}>
          {c.aprovar}
        </Pagina>
        <Pagina n={6} total={total} refPagina={set(5)} idioma={idioma}>
          {c.perfil}
          <Ajuda idioma={idioma} />
        </Pagina>
      </>
    );
  }
  const total = 5;
  const c2 = PassosComuns({ d, inicio: 2, idioma });
  return (
    <>
      <Pagina n={1} total={total} refPagina={set(0)} idioma={idioma}>
        <Capa d={d} tipo={tipo} idioma={idioma} />
        <PassoPdf
          n={1}
          titulo={t.abrirTitulo}
          telas={
            <>
              <Encolhido><TelaModoConsultora idioma={idioma} /></Encolhido>
              <Encolhido><TelaTermo primeiro={d.nome} idioma={idioma} /></Encolhido>
            </>
          }
        >
          <p>
            <Rico texto={t.abrirA(d.email)} />
          </p>
          <p>
            <Rico texto={t.abrirB} />
          </p>
          <p>{t.abrirC}</p>
        </PassoPdf>
      </Pagina>
      <Pagina n={2} total={total} refPagina={set(1)} idioma={idioma}>
        {c2.convidar}
      </Pagina>
      <Pagina n={3} total={total} refPagina={set(2)} idioma={idioma}>
        {c2.aceita}
      </Pagina>
      <Pagina n={4} total={total} refPagina={set(3)} idioma={idioma}>
        {c2.aprovar}
      </Pagina>
      <Pagina n={5} total={total} refPagina={set(4)} idioma={idioma}>
        {c2.perfil}
        <Ajuda idioma={idioma} />
      </Pagina>
    </>
  );
}

const esperarQuadro = () => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));

/**
 * `apenasPdf` (dono, 14/11/2026): no painel da CONSULTORA só faz sentido
 * baixar o PDF — copiar o texto e "enviar no WhatsApp" são do dono, que manda
 * o manual para ela.
 */
export function AcoesManual({ tipo, dados, apenasPdf = false, rotuloPdf }: { tipo: TipoManual; dados: DadosManual; apenasPdf?: boolean; rotuloPdf?: string }) {
  const idioma = useIdioma();
  const t = textos(idioma).manual.pdf;
  const [desenhar, setDesenhar] = useState(false);
  const [estado, setEstado] = useState<'' | 'gerando' | 'copiado' | 'erro'>('');
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  const nomeArquivo = t.nomeArquivo(dados.nome);

  async function gerar(): Promise<Blob> {
    refs.current = [];
    setDesenhar(true);
    await esperarQuadro();
    await esperarQuadro();
    const paginas: PaginaPdf[] = [];
    for (const el of refs.current) {
      if (!el) continue;
      const base = el.getBoundingClientRect();
      const links = Array.from(el.querySelectorAll<HTMLElement>('[data-pdf-link]')).map((a) => {
        const r = a.getBoundingClientRect();
        return { x: r.left - base.left, y: r.top - base.top, w: r.width, h: r.height, url: a.dataset.pdfLink! };
      });
      const url = await toJpeg(el, { pixelRatio: 2, quality: 0.9, backgroundColor: '#ffffff', skipFonts: true, width: L, height: A });
      paginas.push({ jpeg: dataUrlParaBytes(url), larguraImg: L * 2, alturaImg: A * 2, larguraPx: L, alturaPx: A, links });
    }
    setDesenhar(false);
    return montarPdf(paginas);
  }

  function baixar(blob: Blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nomeArquivo;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  async function aoBaixar() {
    setEstado('gerando');
    try {
      baixar(await gerar());
      setEstado('');
    } catch {
      setDesenhar(false);
      setEstado('erro');
    }
  }

  async function aoEnviar() {
    const texto = textoComPdf(tipo, dados, idioma);
    const teste = new File([''], 'teste.pdf', { type: 'application/pdf' });
    const podeCompartilhar = typeof navigator !== 'undefined' && !!navigator.canShare && navigator.canShare({ files: [teste] });
    // Abre a janela já no toque, senão o navegador bloqueia depois da espera.
    const janela = podeCompartilhar ? null : window.open('about:blank', '_blank');
    setEstado('gerando');
    try {
      const blob = await gerar();
      const arquivo = new File([blob], nomeArquivo, { type: 'application/pdf' });
      if (podeCompartilhar) {
        await navigator.share({ files: [arquivo], text: texto, title: nomeArquivo });
      } else {
        baixar(blob);
        const destino = linkWhatsApp(dados.whatsapp, texto);
        if (janela) janela.location.href = destino;
        else window.open(destino, '_blank');
      }
      setEstado('');
    } catch (e) {
      if (janela) janela.close();
      setDesenhar(false);
      setEstado((e as Error)?.name === 'AbortError' ? '' : 'erro');
    }
  }

  async function aoCopiar() {
    try {
      await navigator.clipboard.writeText(textoManual(tipo, dados, idioma));
      setEstado('copiado');
      setTimeout(() => setEstado(''), 1800);
    } catch {
      setEstado('erro');
    }
  }

  const gerando = estado === 'gerando';
  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex flex-wrap items-center justify-end gap-2">
        {!apenasPdf && (
          <button type="button" onClick={aoCopiar} className="inline-flex h-8 items-center rounded-pill bg-[#F0EEF4] px-3 text-[12.5px] font-bold text-ninho-cinza">
            {estado === 'copiado' ? t.copiado : t.copiarTexto}
          </button>
        )}
        {!apenasPdf && (
          <a
            href={linkWhatsApp(dados.whatsapp, textoManual(tipo, dados, idioma))}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-8 items-center rounded-pill bg-[#F1EBFC] px-3 text-[12.5px] font-bold text-[#7C5CD6]"
          >
            {t.soTexto}
          </a>
        )}
        <button
          type="button"
          onClick={aoBaixar}
          disabled={gerando}
          className="inline-flex h-8 items-center rounded-pill bg-[#24164F] px-3.5 text-[12.5px] font-bold text-white disabled:opacity-50"
        >
          {gerando ? t.gerando : (rotuloPdf ?? t.baixarPdf)}
        </button>
        {!apenasPdf && (
        <button
          type="button"
          onClick={aoEnviar}
          disabled={gerando}
          className="inline-flex h-8 items-center gap-1.5 rounded-pill bg-[#25A35A] px-3.5 text-[12.5px] font-bold text-white hover:bg-[#1F8F4E] disabled:opacity-50"
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M21 12a9 9 0 0 1-13.5 7.8L3 21l1.2-4.4A9 9 0 1 1 21 12z" />
          </svg>
          {t.enviarPdf}
        </button>
        )}
      </div>
      {estado === 'erro' && <p className="text-[11.5px] font-bold text-[#E85D5D]">{t.erro}</p>}
      {!apenasPdf && (
        <p className="max-w-[420px] text-right text-[11px] leading-snug text-ninho-cinza">
          {t.dicaEnviar}
        </p>
      )}
      {desenhar && (
        <div aria-hidden style={{ position: 'fixed', left: -100000, top: 0, width: L }}>
          <Paginas tipo={tipo} d={dados} refs={refs} idioma={idioma} />
        </div>
      )}
    </div>
  );
}
