import { Aviso, Card } from '@/components/consultoras/ui';
import { AcoesManual } from '@/components/consultoras/AcoesManual';
import { LINK_BAIXAR, codigoDe, type DadosManual } from '@/components/consultoras/manualTextos';
import {
  TelaApareca,
  TelaEditarPerfil,
  TelaListaConsultoras,
  TelaPerfilNaLista,
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

export type { DadosManual };

/**
 * Aba "Manual" da ficha da consultora (dono, 14/11/2026): dois manuais, um
 * para quem ainda não tem conta no Ninho e outro para quem já tem, com as
 * telas desenhadas. Cada um tem Baixar PDF e Enviar PDF no WhatsApp (o PDF
 * fala com a consultora; ver AcoesManual). O convite é pelo código ou pelo
 * e-mail da família: o link da consultoria (/consultoria) só está liberado
 * para a conta de teste (lib/link-consultora.ts).
 */

function Passo({ n, titulo, children, telas }: { n: number; titulo: string; children: React.ReactNode; telas?: React.ReactNode }) {
  return (
    <div className="border-b border-[#F5F2FA] py-5 last:border-0">
      <div className="flex items-start gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#24164F] text-[13px] font-black text-white">{n}</span>
        <div className="min-w-0 flex-1">
          <h5 className="text-[15px] font-black text-[#24164F]">{titulo}</h5>
          <div className="mt-1 max-w-3xl space-y-1 text-[13px] leading-relaxed text-ninho-grafite">{children}</div>
        </div>
      </div>
      {telas && <div className="mt-4 flex gap-5 overflow-x-auto pb-2 pl-10">{telas}</div>}
    </div>
  );
}

/** Passos que valem para os dois manuais: convidar, a família aceitar e aprovar. */
function PassosDepoisDeEntrar({ inicio, codigo, nome }: { inicio: number; codigo: string; nome: string }) {
  return (
    <>
      <Passo
        n={inicio}
        titulo="Convidar a primeira família"
        telas={
          <>
            <TelaInicioVazio />
            <TelaConvidar codigo={codigo} />
            <TelaWhatsAppConvite codigo={codigo} />
          </>
        }
      >
        <p>
          No Início, toque em <b>Convidar família</b> (ou em <b>Convidar</b>, na barra de baixo; fechada, abre pela setinha do meio). O código
          dela é <b>{codigo}</b>.
        </p>
        <p>
          <b>Enviar pelo WhatsApp</b> já manda para a cliente uma mensagem com o passo a passo e o código. Se preferir, ela pode usar{' '}
          <b>Convidar pelo e-mail da família</b>, com o e-mail exato com que a cliente entra no Ninho.
        </p>
      </Passo>
      <Passo
        n={inicio + 1}
        titulo="A família aceita"
        telas={
          <>
            <TelaFamiliaAdicionar />
            <TelaFamiliaCodigo codigo={codigo} nome={nome} />
            <TelaSininho nome={nome} />
          </>
        }
      >
        <p>
          <b>Pelo código:</b> no app dela, a cliente abre o menu ☰ › <b>Cuidador ou Consultor</b> › <b>Adicionar</b> ›{' '}
          <b>Consultora de sono</b>, digita o código, toca em <b>Buscar</b>, marca a caixa e toca em <b>Compartilhar a rotina</b>.
        </p>
        <p>
          <b>Pelo e-mail:</b> a cliente recebe no sininho o aviso <b>Pedido de consultora de sono</b>, escolhe o bebê e toca em <b>Aprovar</b>.
          Nesse caso já está pronto, sem outra aprovação.
        </p>
      </Passo>
      <Passo
        n={inicio + 2}
        titulo="A consultora aprova (só no caminho do código)"
        telas={
          <>
            <TelaPedido />
            <TelaAprovado />
          </>
        }
      >
        <p>
          Chega o aviso <b>Novo pedido de família</b>. No Início, em <b>Pedidos de famílias</b>, ela toca em <b>Aprovar</b> e depois em{' '}
          <b>Aprovar e acompanhar</b>. O bebê aparece em <b>Suas famílias</b>, e a rotina fica em <b>Rotina</b> e <b>Evolução</b>.
        </p>
      </Passo>
      <Passo
        n={inicio + 3}
        titulo="Completar o perfil público e aparecer na lista"
        telas={
          <>
            <TelaApareca />
            <TelaEditarPerfil nome={nome} />
            <TelaListaConsultoras nome={nome} />
            <TelaPerfilNaLista nome={nome} />
          </>
        }
      >
        <p>
          No menu ☰ › <b>Editar perfil</b> (ou <b>Completar perfil</b>, na apresentação), ela coloca foto, texto, cidade, idades e WhatsApp. O
          texto e a foto chegam para você aprovar na aba <b>Perfil público</b>; depois, ligue <b>Na lista do app</b> na aba Cadastro.
        </p>
        <p>
          As famílias encontram em menu ☰ › <b>Apoio</b> › <b>Encontrar consultora de sono</b>, com <b>Conversar no WhatsApp</b> no perfil dela.
          A lista mostra até 10, quem traz mais assinantes primeiro.
        </p>
      </Passo>
    </>
  );
}

export function ManualConsultora({ dados, temConta }: { dados: DadosManual; temConta: boolean }) {
  const codigo = codigoDe(dados);
  const primeiro = dados.nome;
  return (
    <>
      <Card titulo="Manual de orientação" direita="dois caminhos, conforme ela já tenha ou não conta no Ninho">
        <p className="text-[13px] leading-relaxed text-ninho-cinza">
          Cada manual tem as telas do app, passo a passo. <b>Baixar PDF</b> gera o manual falando com a {primeiro}, com o e-mail e o código
          dela; <b>Enviar PDF no WhatsApp</b> manda o PDF com uma mensagem curta.
          {temConta
            ? ' A conta dela já está ligada: os manuais servem para tirar dúvidas.'
            : ' A conta dela ainda não está ligada: mande o manual do caminho dela.'}
        </p>
        <div className="mt-3">
          <Aviso tom="ambar">
            O convite é pelo <b>código</b> ou pelo <b>e-mail da família</b>. O link da consultoria ainda depende da versão nova do app e não
            está liberado para ela, então não aparece no manual.
          </Aviso>
        </div>
      </Card>

      <Card className="mt-4" titulo="Manual 1 · Ela ainda não tem conta no Ninho">
        <div className="mb-2 flex justify-end">
          <AcoesManual tipo="sem-conta" dados={dados} />
        </div>
        <Passo n={1} titulo="Baixar o Ninho" telas={<TelaLoja />}>
          <p>
            O primeiro passo é um link para ela tocar: <b>{LINK_BAIXAR.replace(/^https?:\/\//, '')}</b>. Ele abre a App Store no iPhone e o
            Google Play no Android. No PDF e na mensagem, vai como botão tocável.
          </p>
        </Passo>
        <Passo
          n={2}
          titulo="Criar a conta com o e-mail liberado"
          telas={
            <>
              <TelaLogin dedo="email" />
              <TelaCriarConta email={dados.email} />
              <TelaConfirmar />
            </>
          }
        >
          <p>
            Ela entra com <b>{dados.email}</b>. Só esse e-mail vira consultora.
          </p>
          <p>
            <b>Continuar com Google</b> funciona se esse e-mail for do Google. Ou <b>Novo aqui? Criar conta</b>: e-mail, senha e o código de 6
            dígitos de <b>Confirme seu e-mail</b>. Pela Apple, sem marcar <b>ocultar meu e-mail</b>, porque o e-mail oculto não é reconhecido.
          </p>
        </Passo>
        <Passo n={3} titulo="Aceitar o Termo da Consultora" telas={<TelaTermo primeiro={primeiro} />}>
          <p>
            O app reconhece a conta e já abre a área da consultora, sem pedir cadastro de bebê. Na primeira vez aparece{' '}
            <b>Bem-vinda, {primeiro}</b>: ela marca <b>Li e aceito o Termo da Consultora</b> e toca em <b>Começar</b>. Depois vêm três telas de
            apresentação.
          </p>
        </Passo>
        <PassosDepoisDeEntrar inicio={4} codigo={codigo} nome={primeiro} />
      </Card>

      <Card className="mt-4" titulo="Manual 2 · Ela já tem conta no Ninho">
        <div className="mb-2 flex justify-end">
          <AcoesManual tipo="com-conta" dados={dados} />
        </div>
        <Passo
          n={1}
          titulo="Abrir o app com a conta do e-mail liberado"
          telas={
            <>
              <TelaModoConsultora />
              <TelaTermo primeiro={primeiro} />
            </>
          }
        >
          <p>
            Se a conta dela é do e-mail <b>{dados.email}</b>, basta fechar e abrir o Ninho: o app reconhece sozinho, sem sair da conta.
          </p>
          <p>
            Se ela já tem bebê cadastrado, aparece <b>Sua conta foi liberada como consultora</b> com <b>Usar modo consultora</b>. Depois ela
            troca pelo menu, em <b>Mudar para conta comum</b> e <b>Mudar para modo consultora</b>. Na primeira vez também aparece o Termo.
          </p>
          <p className="text-ninho-cinza">
            Conta com outro e-mail (ou Apple com e-mail oculto) não é reconhecida. Peça o e-mail da conta dela e use <b>Ligar</b>, na aba
            Cadastro.
          </p>
        </Passo>
        <PassosDepoisDeEntrar inicio={2} codigo={codigo} nome={primeiro} />
      </Card>
    </>
  );
}
