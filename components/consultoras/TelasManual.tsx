import { Celular, Dedo, Head, Modulo, Pilula } from '@/components/consultoras/Celular';

/**
 * Telas do app desenhadas para o manual da consultora (no painel e no PDF).
 * Os textos são os do app (src/i18n/locales/pt no Ninho-expo): login
 * (auth.ts), termo, modo consultora, convidar e pedidos (consultora.ts),
 * Cuidador ou Consultor (settings.ts / account.ts). Mudou no app, mude aqui.
 * Componentes puros (sem hook): servem no servidor e no navegador.
 */
export const MAE = 'Mariana';
export const BEBE = 'Lara';

export function TelaLoja() {
  return (
    <Celular legenda="App Store ou Google Play" fundo="#FFFFFF">
      <div className="px-3 pt-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[14px] bg-gradient-to-br from-[#A46DFF] to-[#8C5CF8] text-[20px] font-black text-white">N</span>
          <div className="min-w-0">
            <p className="text-[12px] font-black leading-tight">Ninho: Diário do Bebê</p>
            <p className="text-[8.5px] text-[#6B6F80]">Sono, mamadas e rotina</p>
            <div className="relative mt-1.5 inline-flex h-[22px] items-center rounded-full bg-[#0A84FF] px-4 text-[9.5px] font-black text-white">
              Obter
              <Dedo />
            </div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-1.5">
          {['#E4D3FF', '#EDE4FB', '#D3BDFD'].map((c) => (
            <div key={c} className="h-[150px] rounded-[10px]" style={{ background: c }} />
          ))}
        </div>
        <p className="mt-3 text-[9px] text-[#6B6F80]">Grátis · iPhone e Android</p>
      </div>
    </Celular>
  );
}

export function TelaLogin({ dedo }: { dedo: 'google' | 'email' }) {
  return (
    <Celular legenda="Tela de entrada do Ninho" fundo="#F4EEFF">
      <div className="flex h-full flex-col px-3 pb-3">
        <div className="mt-2 flex items-center gap-1.5">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-[#A46DFF] to-[#8C5CF8] text-[9px] font-black text-white">N</span>
          <b className="text-[12px] text-[#7C5CD6]">Ninho</b>
        </div>
        <div className="mt-4 h-[120px] rounded-[18px] bg-gradient-to-br from-[#E4D3FF] to-[#D3BDFD]" />
        <p className="mt-3 text-[15px] font-black leading-tight text-[#24164F]">A rotina do bebê,<br />leve e em família.</p>
        <p className="mt-1 text-[9.5px] text-[#6B6F80]">Sono, mamadas e memórias num lugar só.</p>
        <div className="mt-auto">
          <Pilula tom="preto">Continuar com Apple</Pilula>
          <Pilula tom="branco" dedo={dedo === 'google'}>Continuar com Google</Pilula>
          <Pilula tom="branco">Continuar com e-mail</Pilula>
          <p className="relative mt-2 text-center text-[9px] text-[#6B6F80]">
            Novo aqui? <b className="text-[#7C5CD6]">Criar conta</b>
            {dedo === 'email' && <Dedo />}
          </p>
        </div>
      </div>
    </Celular>
  );
}

export function TelaCriarConta({ email }: { email: string }) {
  return (
    <Celular legenda="Criar conta com o e-mail liberado">
      <div className="px-3 pt-3">
        <p className="text-[15px] font-black text-[#24164F]">Criar conta</p>
        <p className="text-[9.5px] text-[#6B6F80]">Leva menos de um minuto.</p>
        <div className="mt-3 rounded-[12px] bg-white p-2 shadow-[inset_0_0_0_1.5px_#9F86E0]">
          <p className="text-[8px] font-bold text-[#9A95AD]">E-mail</p>
          <p className="truncate text-[10px] font-bold">{email}</p>
        </div>
        <div className="mt-2 rounded-[12px] bg-white p-2">
          <p className="text-[8px] font-bold text-[#9A95AD]">Senha</p>
          <p className="text-[10px] font-bold">••••••••</p>
        </div>
        <div className="mt-4">
          <Pilula dedo>Criar conta</Pilula>
        </div>
      </div>
    </Celular>
  );
}

export function TelaConfirmar() {
  return (
    <Celular legenda="Código que chega no e-mail">
      <div className="px-3 pt-3">
        <p className="text-[15px] font-black text-[#24164F]">Confirme seu e-mail</p>
        <p className="text-[9.5px] text-[#6B6F80]">Mandamos um código de 6 dígitos para o seu e-mail. Confira também a caixa de spam.</p>
        <div className="mt-4 flex justify-between">
          {['4', '8', '1', '9', '2', '7'].map((d, i) => (
            <span key={i} className="flex h-8 w-6 items-center justify-center rounded-[8px] bg-white text-[13px] font-black text-[#24164F] shadow-[inset_0_0_0_1.5px_#ECE6F5]">
              {d}
            </span>
          ))}
        </div>
        <div className="mt-5">
          <Pilula dedo>Confirmar</Pilula>
        </div>
      </div>
    </Celular>
  );
}

export function TelaTermo({ primeiro }: { primeiro: string }) {
  return (
    <Celular legenda="Termo da Consultora (só na 1ª vez)">
      <Head titulo={`Bem-vinda, ${primeiro}`} sub="Sua conta de consultora está pronta" />
      <Modulo>
        <p className="text-[10.5px] font-black text-[#24164F]">Sua conta de consultora foi liberada</p>
        <p className="mt-0.5 text-[9px] text-[#6B6F80]">Agora você acompanha a rotina das famílias que compartilharem com você.</p>
      </Modulo>
      <Modulo>
        <p className="text-[8.5px] font-extrabold uppercase tracking-wide text-[#9A95AD]">Termo da Consultora</p>
        {['Você é independente e responde pelas orientações…', 'Use a rotina só para atender aquela família…', 'Comissão: 25% sobre o preço cheio…'].map((t, i) => (
          <p key={i} className="mt-1 text-[8.5px] text-[#6B6F80]">
            <b className="text-[#7C5CD6]">{i + 1}.</b> {t}
          </p>
        ))}
        <div className="relative mt-2 flex items-center gap-1.5">
          <span className="flex h-3.5 w-3.5 items-center justify-center rounded-[4px] bg-[#8C5CF8] text-[8px] font-black text-white">✓</span>
          <span className="text-[9px] font-bold">Li e aceito o Termo da Consultora</span>
        </div>
        <Pilula dedo>Começar</Pilula>
      </Modulo>
    </Celular>
  );
}

function BarraDeBaixo({ ativa }: { ativa: 'Início' | 'Convidar' }) {
  return (
    <div className="absolute inset-x-1.5 bottom-2 flex items-center justify-between rounded-full bg-white px-1 py-1.5 shadow-[0_6px_14px_-8px_rgba(40,20,90,.4)]">
      {['Rotina', 'Evolução', 'Início', 'Convidar', 'Ganhos'].map((a) => (
        <span key={a} className={`rounded-full px-1 py-0.5 text-[6.8px] font-bold ${a === ativa ? 'bg-[#EDE4FB] text-[#7C5CD6]' : 'text-[#9A95AD]'}`}>
          {a}
        </span>
      ))}
    </div>
  );
}

export function TelaInicioVazio() {
  return (
    <Celular legenda="A área da consultora">
      <div className="relative h-full">
        <Head titulo="Início" sub="Consultora · 0 famílias" />
        <Modulo className="text-center">
          <p className="mt-3 text-[11px] font-black text-[#24164F]">Nenhuma família ainda</p>
          <p className="mx-auto mt-1 max-w-[150px] text-[9px] text-[#6B6F80]">Quando uma família digitar seu código em Cuidadores, o bebê aparece aqui.</p>
          <div className="mx-auto mb-2 max-w-[140px]">
            <Pilula dedo>Convidar família</Pilula>
          </div>
        </Modulo>
        <BarraDeBaixo ativa="Início" />
      </div>
    </Celular>
  );
}

export function TelaConvidar({ codigo }: { codigo: string }) {
  return (
    <Celular legenda="Convidar: código e e-mail">
      <div className="relative h-full">
        <Head titulo="Convidar família" sub="Elas compartilham a rotina com você" />
        <Modulo>
          <p className="text-[8.5px] font-extrabold uppercase tracking-wide text-[#9A95AD]">Código</p>
          <div className="mt-1 flex items-center justify-between rounded-[10px] bg-[#F7F5FB] px-2 py-1.5">
            <b className="text-[12px] tracking-wider text-[#7C5CD6]">{codigo}</b>
            <span className="rounded-full bg-[#F1EBFC] px-2 py-0.5 text-[8px] font-bold text-[#7C5CD6]">Copiar</span>
          </div>
          <p className="mt-1 text-[8px] text-[#6B6F80]">A família digita o código em Cuidador ou Consultor › Adicionar › Consultora de sono.</p>
          <Pilula tom="verde" dedo>Enviar pelo WhatsApp</Pilula>
        </Modulo>
        <Modulo>
          <p className="text-[9.5px] font-black">Convidar pelo e-mail da família</p>
          <div className="mt-1 rounded-[8px] bg-[#F7F5FB] px-2 py-1 text-[8.5px] text-[#9A95AD]">e-mail da família</div>
          <Pilula tom="branco">Enviar convite</Pilula>
        </Modulo>
        <BarraDeBaixo ativa="Convidar" />
      </div>
    </Celular>
  );
}

export function TelaWhatsAppConvite({ codigo }: { codigo: string }) {
  return (
    <Celular legenda="A mensagem que a família recebe" fundo="#ECE5DD">
      <div className="bg-[#075E54] px-3 py-2 text-[10px] font-bold text-white">{MAE}</div>
      <div className="ml-auto mr-2 mt-3 max-w-[165px] rounded-[10px] rounded-tr-sm bg-[#DCF8C6] p-2 text-[8.5px] leading-snug">
        Oi! Eu acompanho a rotina de sono do bebê pelo Ninho. É rapidinho:
        <br />1. Baixe o Ninho
        <br />2. Crie sua conta
        <br />3. Abra o menu ☰
        <br />4. Toque em Cuidador ou Consultor › Adicionar › Consultora de sono
        <br />5. Digite meu código: <b>{codigo}</b>
        <br />Aí é só eu aprovar e a gente acompanha junto.
      </div>
    </Celular>
  );
}

export function TelaFamiliaAdicionar() {
  return (
    <Celular legenda="Família: ☰ › Cuidador ou Consultor › Adicionar">
      <Head titulo="Cuidador ou Consultor" sub={`Quem acompanha ${BEBE}`} />
      <div className="absolute inset-x-0 bottom-0 rounded-t-[22px] bg-white p-3 shadow-[0_-10px_24px_-12px_rgba(40,20,90,.35)]">
        <p className="text-[11px] font-black text-[#24164F]">Quem você quer adicionar?</p>
        <div className="mt-2 rounded-[12px] bg-[#F7F5FB] p-2 text-[9.5px] font-bold">Cuidador da família</div>
        <div className="relative mt-1.5 rounded-[12px] bg-[#EDE4FB] p-2 text-[9.5px] font-bold text-[#7C5CD6] shadow-[inset_0_0_0_1.5px_#9F86E0]">
          Consultora de sono
          <Dedo />
        </div>
      </div>
    </Celular>
  );
}

export function TelaFamiliaCodigo({ codigo, nome }: { codigo: string; nome: string }) {
  return (
    <Celular legenda="A família digita o código e compartilha">
      <Head titulo="Consultora de sono" sub="Compartilhe a rotina com quem te ajuda" />
      <Modulo>
        <p className="text-[8px] font-bold text-[#9A95AD]">Código da consultora</p>
        <div className="mt-0.5 flex gap-1.5">
          <div className="flex-1 rounded-[8px] bg-[#F7F5FB] px-2 py-1 text-[10px] font-black tracking-wider">{codigo}</div>
          <span className="rounded-full bg-[#F1EBFC] px-2 py-1 text-[8.5px] font-bold text-[#7C5CD6]">Buscar</span>
        </div>
      </Modulo>
      <Modulo>
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#C066AE] text-[9px] font-black text-white">{nome.slice(0, 1)}</span>
          <div>
            <p className="text-[10px] font-black">{nome}</p>
            <p className="text-[8px] text-[#6B6F80]">Consultora de sono independente</p>
          </div>
        </div>
        <div className="mt-2 flex items-start gap-1.5">
          <span className="mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[4px] bg-[#8C5CF8] text-[8px] font-black text-white">✓</span>
          <span className="text-[8px] text-[#6B6F80]">Autorizo {nome} a ver, só para leitura: o sono, as mamadas, as fraldas e a comida de {BEBE}…</span>
        </div>
        <Pilula dedo>Compartilhar a rotina</Pilula>
      </Modulo>
    </Celular>
  );
}

export function TelaPedido() {
  return (
    <Celular legenda="O pedido chega para a consultora">
      <div className="relative h-full">
        <div className="mx-2 mt-1 rounded-[14px] bg-white/95 p-2 shadow-[0_8px_18px_-10px_rgba(40,20,90,.5)]">
          <p className="text-[8px] font-bold text-[#9A95AD]">NINHO · agora</p>
          <p className="text-[9.5px] font-black">Novo pedido de família</p>
          <p className="text-[8.5px] text-[#6B6F80]">{MAE} quer que você acompanhe a rotina de {BEBE}. Abra para aprovar.</p>
        </div>
        <Modulo>
          <p className="text-[8.5px] font-extrabold uppercase tracking-wide text-[#9A95AD]">Pedidos de famílias</p>
          <div className="mt-1.5 flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#4583D6] text-[9px] font-black text-white">L</span>
            <div>
              <p className="text-[10px] font-black">{BEBE}</p>
              <p className="text-[8px] text-[#6B6F80]">Mãe: {MAE}</p>
            </div>
          </div>
          <div className="mt-1 grid grid-cols-2 gap-1.5">
            <Pilula tom="cinza">Recusar</Pilula>
            <Pilula dedo>Aprovar</Pilula>
          </div>
        </Modulo>
        <BarraDeBaixo ativa="Início" />
      </div>
    </Celular>
  );
}

export function TelaAprovado() {
  return (
    <Celular legenda="Pronto: o bebê entra na lista">
      <div className="relative h-full">
        <Head titulo="Início" sub="Consultora · 1 família" />
        <div className="mx-2.5 mt-2.5 rounded-[12px] bg-[#E7F5EC] px-2.5 py-1.5 text-[9px] font-bold text-[#2F8A55]">Pronto. O bebê já aparece na sua lista.</div>
        <Modulo>
          <p className="text-[8.5px] font-extrabold uppercase tracking-wide text-[#9A95AD]">Suas famílias</p>
          <div className="mt-1.5 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#4583D6] text-[10px] font-black text-white">L</span>
            <div>
              <p className="text-[10.5px] font-black">{BEBE}</p>
              <p className="text-[8px] text-[#6B6F80]">Mãe: {MAE} · Último registro · 08:40</p>
            </div>
          </div>
        </Modulo>
        <BarraDeBaixo ativa="Início" />
      </div>
    </Celular>
  );
}

export function TelaModoConsultora() {
  return (
    <Celular legenda="Quem já tem bebê no app vê esta pergunta">
      <div className="relative h-full bg-[#F2F3F6]">
        <Head titulo={BEBE} sub="Hoje" />
        <Modulo className="opacity-40">
          <p className="text-[9px]">Ritmo do dia</p>
        </Modulo>
        <div className="absolute inset-x-[11px] top-[120px] rounded-[20px] bg-white p-3 shadow-[0_18px_40px_-18px_rgba(40,20,90,.6)]">
          <p className="text-[11px] font-black leading-tight text-[#24164F]">Sua conta foi liberada como consultora</p>
          <p className="mt-1 text-[9px] text-[#6B6F80]">Quer usar o Ninho no modo consultora? Você pode trocar quando quiser pelo menu.</p>
          <Pilula dedo>Usar modo consultora</Pilula>
          <Pilula tom="cinza">Agora não</Pilula>
        </div>
      </div>
    </Celular>
  );
}

export function TelaSininho({ nome }: { nome: string }) {
  return (
    <Celular legenda="Convite por e-mail: a família recebe no sininho">
      <Head titulo="Pedidos de consultora" sub="Convites recebidos" />
      <Modulo>
        <p className="text-[9.5px] font-black">Pedido de consultora de sono</p>
        <p className="mt-0.5 text-[8.5px] text-[#6B6F80]">{nome} quer acompanhar a rotina do seu bebê.</p>
        <p className="mt-2 text-[8px] font-bold text-[#9A95AD]">Qual bebê ela vai acompanhar?</p>
        <div className="mt-0.5 rounded-[8px] bg-[#EDE4FB] px-2 py-1 text-[9px] font-bold text-[#7C5CD6]">{BEBE}</div>
        <div className="mt-1 grid grid-cols-2 gap-1.5">
          <Pilula tom="cinza">Recusar</Pilula>
          <Pilula dedo>Aprovar</Pilula>
        </div>
      </Modulo>
    </Celular>
  );
}
