'use client';

import { useRef, useState } from 'react';
import { toJpeg } from 'html-to-image';
import { dataUrlParaBytes, montarPdf, type PaginaPdf } from '@/lib/pdf-de-imagens';
import { linkWhatsApp } from '@/components/consultoras/BotaoWhatsApp';
import { LINK_BAIXAR, codigoDe, textoComPdf, textoManual, type DadosManual, type TipoManual } from '@/components/consultoras/manualTextos';
import {
  TelaAprovado,
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

function Pagina({ n, total, children, refPagina }: { n: number; total: number; children: React.ReactNode; refPagina: (el: HTMLDivElement | null) => void }) {
  return (
    <div ref={refPagina} style={{ width: L, height: A }} className="relative flex flex-col overflow-hidden bg-white px-12 pt-10 font-sans text-[#1E1F25]">
      <div className="flex items-center justify-between border-b border-[#ECE6F5] pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#A46DFF] to-[#8C5CF8] text-[13px] font-black text-white">N</span>
          <b className="text-[17px] text-[#7C5CD6]">Ninho</b>
        </div>
        <span className="text-[12px] font-bold text-[#9A95AD]">Manual da consultora</span>
      </div>
      <div className="flex-1">{children}</div>
      <div className="mb-6 flex items-center justify-between border-t border-[#ECE6F5] pt-3 text-[11px] text-[#9A95AD]">
        <span>useninho.com.br</span>
        <span>
          página {n} de {total}
        </span>
      </div>
    </div>
  );
}

function Capa({ d, tipo }: { d: DadosManual; tipo: TipoManual }) {
  return (
    <div className="mt-8 rounded-[26px] bg-gradient-to-br from-[#F4EEFF] to-[#EDE4FB] p-7">
      <p className="text-[28px] font-black leading-tight text-[#24164F]">Oi, {d.nome}, tudo bem? Que bom te ter aqui!</p>
      <p className="mt-2 max-w-[600px] text-[14.5px] leading-relaxed text-[#4B3A8C]">
        {tipo === 'sem-conta'
          ? 'Preparei este passo a passo para você começar no Ninho. É rapidinho, e eu vou te mostrando cada tela. Vamos juntas?'
          : 'Como você já usa o Ninho, falta pouquinho. Preparei este passo a passo mostrando cada tela, para você começar a acompanhar as suas clientes.'}
      </p>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-[18px] bg-white p-4">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#9A95AD]">Seu e-mail de consultora</p>
          <p className="mt-1 break-all text-[15px] font-black text-[#24164F]">{d.email}</p>
        </div>
        <div className="rounded-[18px] bg-white p-4">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#9A95AD]">Seu código</p>
          <p className="mt-1 text-[15px] font-black tracking-wider text-[#7C5CD6]">{codigoDe(d)}</p>
        </div>
      </div>
    </div>
  );
}

function PassosComuns({ d, inicio }: { d: DadosManual; inicio: number }) {
  const codigo = codigoDe(d);
  return {
    termo: (
      <PassoPdf lado n={inicio} titulo="Aceite o Termo da Consultora" telas={<Encolhido><TelaTermo primeiro={d.nome} /></Encolhido>}>
        <p>
          Assim que você entrar, o app já abre a sua área de consultora, com uma mensagem de boas-vindas: <b>Bem-vinda, {d.nome}</b>. Leia o
          termo com calma, marque <b>Li e aceito o Termo da Consultora</b> e toque em <b>Começar</b>. Depois aparecem três telas rápidas de
          apresentação.
        </p>
      </PassoPdf>
    ),
    convidar: (
      <PassoPdf
        n={inicio + 1}
        titulo="Convide a sua primeira cliente"
        telas={
          <>
            <Encolhido><TelaInicioVazio /></Encolhido>
            <Encolhido><TelaConvidar codigo={codigo} /></Encolhido>
            <Encolhido><TelaWhatsAppConvite codigo={codigo} /></Encolhido>
          </>
        }
      >
        <p>
          Agora vamos convidar a sua primeira cliente. Toque em <b>Convidar família</b> (ou em <b>Convidar</b>, na barra de baixo; se ela estiver
          fechada, toque na setinha do meio) e depois em <b>Enviar pelo WhatsApp</b>. A sua cliente recebe uma mensagem com o passo a passo e o
          seu código, <b>{codigo}</b>.
        </p>
        <p>
          Se preferir, convide pelo e-mail dela, em <b>Convidar pelo e-mail da família</b>. Use o e-mail com que ela entra no Ninho.
        </p>
      </PassoPdf>
    ),
    aceita: (
      <PassoPdf
        n={inicio + 2}
        titulo="Veja como a sua cliente recebe"
        telas={
          <>
            <Encolhido><TelaFamiliaAdicionar /></Encolhido>
            <Encolhido><TelaFamiliaCodigo codigo={codigo} nome={d.nome} /></Encolhido>
            <Encolhido><TelaSininho nome={d.nome} /></Encolhido>
          </>
        }
      >
        <p>Quando você convida, a sua cliente tem dois caminhos, conforme o jeito que você escolheu:</p>
        <p>
          <b>Pelo WhatsApp (com o seu código):</b> ela segue este caminho no app dela: menu ☰ › <b>Cuidador ou Consultor</b> › <b>Adicionar</b>{' '}
          › <b>Consultora de sono</b>. Digita o seu código, toca em <b>Buscar</b>, marca a caixa e toca em <b>Compartilhar a rotina</b>.
        </p>
        <p>
          <b>Pelo e-mail:</b> chega uma notificação no sininho dela, <b>Pedido de consultora de sono</b>. Ela escolhe o bebê e toca em{' '}
          <b>Aprovar</b>.
        </p>
      </PassoPdf>
    ),
    aprovar: (
      <PassoPdf
        n={inicio + 3}
        titulo="Aprove o pedido e acompanhe"
        telas={
          <>
            <Encolhido><TelaPedido /></Encolhido>
            <Encolhido><TelaAprovado /></Encolhido>
          </>
        }
      >
        <p>
          Quando a sua cliente usa o seu código, chega para você o aviso <b>Novo pedido de família</b>. No Início, em{' '}
          <b>Pedidos de famílias</b>, toque em <b>Aprovar</b> e depois em <b>Aprovar e acompanhar</b>.
        </p>
        <p>
          Pronto! O bebê aparece em <b>Suas famílias</b>, e você acompanha a rotina em <b>Rotina</b> e <b>Evolução</b>. Se ela aprovou pelo
          sininho, nem precisa deste passo: o bebê já aparece para você.
        </p>
      </PassoPdf>
    ),
  };
}

function Ajuda() {
  return (
    <div className="mt-8 rounded-[22px] bg-[#E7F5EC] p-5">
      <p className="text-[16px] font-black text-[#2F8A55]">Estou aqui com você</p>
      <p className="mt-1 text-[13.5px] leading-relaxed text-[#2D4A39]">
        Qualquer dúvida, me chama no WhatsApp, no horário que for. Se travar em alguma tela, me manda um print que a gente resolve junto. E as
        suas sugestões são muito bem-vindas: é com elas que o Ninho fica cada vez melhor para o seu trabalho.
      </p>
      <p className="mt-3 text-[13.5px] font-bold text-[#2D4A39]">Um abraço, Mailson · Ninho</p>
    </div>
  );
}

export function Paginas({ tipo, d, refs }: { tipo: TipoManual; d: DadosManual; refs: React.MutableRefObject<(HTMLDivElement | null)[]> }) {
  const c = PassosComuns({ d, inicio: 3 });
  const set = (i: number) => (el: HTMLDivElement | null) => {
    refs.current[i] = el;
  };
  if (tipo === 'sem-conta') {
    const total = 5;
    return (
      <>
        <Pagina n={1} total={total} refPagina={set(0)}>
          <Capa d={d} tipo={tipo} />
          <PassoPdf n={1} titulo="Para começar, baixe o Ninho">
            <p>
              Toque no botão abaixo: ele abre a App Store no iPhone ou o Google Play no Android. Toque em <b>Obter</b> (ou <b>Instalar</b>) e,
              quando terminar, volte aqui para a gente continuar.
            </p>
            <div className="flex items-center gap-8 pt-3">
              <div>
                <a
                  href={LINK_BAIXAR}
                  data-pdf-link={LINK_BAIXAR}
                  className="inline-flex h-14 items-center rounded-full bg-gradient-to-br from-[#A46DFF] to-[#8C5CF8] px-8 text-[17px] font-black text-white"
                >
                  Toque aqui para baixar o Ninho
                </a>
                <p className="mt-2 text-[12.5px] font-bold text-[#7C5CD6]" data-pdf-link={LINK_BAIXAR}>
                  {LINK_BAIXAR.replace(/^https?:\/\//, '')}
                </p>
              </div>
              <Encolhido><TelaLoja /></Encolhido>
            </div>
          </PassoPdf>
        </Pagina>
        <Pagina n={2} total={total} refPagina={set(1)}>
          <PassoPdf
            n={2}
            titulo="Agora crie a sua conta"
            telas={
              <>
                <Encolhido><TelaLogin dedo="email" /></Encolhido>
                <Encolhido><TelaCriarConta email={d.email} /></Encolhido>
                <Encolhido><TelaConfirmar /></Encolhido>
              </>
            }
          >
            <p>
              Abra o Ninho e entre com a Apple, com o Google ou com o seu e-mail, para a gente continuar. O importante é usar o e-mail{' '}
              <b>{d.email}</b>: foi ele que eu liberei para você como consultora.
            </p>
            <p>
              <b>Com o e-mail:</b> toque em <b>Novo aqui? Criar conta</b>, coloque o e-mail e uma senha e confirme com o código de 6 dígitos que
              chega no seu e-mail (confira também o spam). <b>Com o Google:</b> escolha a conta desse e-mail. <b>Com a Apple:</b> escolha
              compartilhar o seu e-mail, e não <b>ocultar meu e-mail</b>, assim o app reconhece você.
            </p>
          </PassoPdf>
          {c.termo}
        </Pagina>
        <Pagina n={3} total={total} refPagina={set(2)}>
          {c.convidar}
        </Pagina>
        <Pagina n={4} total={total} refPagina={set(3)}>
          {c.aceita}
        </Pagina>
        <Pagina n={5} total={total} refPagina={set(4)}>
          {c.aprovar}
          <Ajuda />
        </Pagina>
      </>
    );
  }
  const total = 4;
  const c2 = PassosComuns({ d, inicio: 2 });
  return (
    <>
      <Pagina n={1} total={total} refPagina={set(0)}>
        <Capa d={d} tipo={tipo} />
        <PassoPdf
          n={1}
          titulo="Abra o Ninho na conta do e-mail liberado"
          telas={
            <>
              <Encolhido><TelaModoConsultora /></Encolhido>
              <Encolhido><TelaTermo primeiro={d.nome} /></Encolhido>
            </>
          }
        >
          <p>
            Como você já usa o Ninho, é só fechar o app e abrir de novo, na conta do e-mail <b>{d.email}</b>. O app reconhece a sua conta de
            consultora sozinho.
          </p>
          <p>
            Se você já tem um bebê cadastrado, vai aparecer a pergunta <b>Sua conta foi liberada como consultora</b>: toque em{' '}
            <b>Usar modo consultora</b>. Dá para voltar quando quiser pelo menu, em <b>Mudar para conta comum</b>. Na primeira vez, leia o Termo
            da Consultora, marque a caixa e toque em <b>Começar</b>.
          </p>
          <p>Se você entra no Ninho com outro e-mail, me conta qual é, que eu ligo a sua conta por aqui.</p>
        </PassoPdf>
      </Pagina>
      <Pagina n={2} total={total} refPagina={set(1)}>
        {c2.convidar}
      </Pagina>
      <Pagina n={3} total={total} refPagina={set(2)}>
        {c2.aceita}
      </Pagina>
      <Pagina n={4} total={total} refPagina={set(3)}>
        {c2.aprovar}
        <Ajuda />
      </Pagina>
    </>
  );
}

const esperarQuadro = () => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));

export function AcoesManual({ tipo, dados }: { tipo: TipoManual; dados: DadosManual }) {
  const [desenhar, setDesenhar] = useState(false);
  const [estado, setEstado] = useState<'' | 'gerando' | 'copiado' | 'erro'>('');
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  const nomeArquivo = `Manual Ninho - ${dados.nome}.pdf`;

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
    const texto = textoComPdf(tipo, dados);
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
      await navigator.clipboard.writeText(textoManual(tipo, dados));
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
        <button type="button" onClick={aoCopiar} className="inline-flex h-8 items-center rounded-pill bg-[#F0EEF4] px-3 text-[12.5px] font-bold text-ninho-cinza">
          {estado === 'copiado' ? 'Copiado!' : 'Copiar texto'}
        </button>
        <a
          href={linkWhatsApp(dados.whatsapp, textoManual(tipo, dados))}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-8 items-center rounded-pill bg-[#F1EBFC] px-3 text-[12.5px] font-bold text-[#7C5CD6]"
        >
          Só o texto no WhatsApp
        </a>
        <button
          type="button"
          onClick={aoBaixar}
          disabled={gerando}
          className="inline-flex h-8 items-center rounded-pill bg-[#24164F] px-3.5 text-[12.5px] font-bold text-white disabled:opacity-50"
        >
          {gerando ? 'Gerando PDF…' : 'Baixar PDF'}
        </button>
        <button
          type="button"
          onClick={aoEnviar}
          disabled={gerando}
          className="inline-flex h-8 items-center gap-1.5 rounded-pill bg-[#25A35A] px-3.5 text-[12.5px] font-bold text-white hover:bg-[#1F8F4E] disabled:opacity-50"
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M21 12a9 9 0 0 1-13.5 7.8L3 21l1.2-4.4A9 9 0 1 1 21 12z" />
          </svg>
          Enviar PDF no WhatsApp
        </button>
      </div>
      {estado === 'erro' && <p className="text-[11.5px] font-bold text-[#E85D5D]">Não consegui gerar o PDF agora. Tente de novo.</p>}
      <p className="max-w-[420px] text-right text-[11px] leading-snug text-ninho-cinza">
        No computador, o PDF é baixado e o WhatsApp abre com a mensagem: arraste o PDF para a conversa. No celular, escolha o WhatsApp na
        lista.
      </p>
      {desenhar && (
        <div aria-hidden style={{ position: 'fixed', left: -100000, top: 0, width: L }}>
          <Paginas tipo={tipo} d={dados} refs={refs} />
        </div>
      )}
    </div>
  );
}
