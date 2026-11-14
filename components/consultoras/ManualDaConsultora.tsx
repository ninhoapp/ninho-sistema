import { Aviso, Card } from '@/components/consultoras/ui';
import { AcoesManual } from '@/components/consultoras/AcoesManual';
import { codigoDe, type DadosManual } from '@/components/consultoras/manualTextos';
import {
  TelaApareca,
  TelaAprovado,
  TelaConvidar,
  TelaEditarPerfil,
  TelaFamiliaAdicionar,
  TelaFamiliaCodigo,
  TelaInicioVazio,
  TelaListaConsultoras,
  TelaPedido,
  TelaPerfilNaLista,
  TelaSininho,
  TelaWhatsAppConvite,
} from '@/components/consultoras/TelasManual';

/**
 * Manual DENTRO do painel da consultora (dono, 14/11/2026: "coloque os manuais
 * também dentro do painel da consultora e no menu lateral do app").
 *
 * É o mesmo passo a passo que o dono manda em PDF (AcoesManual), falando com
 * ela em "você", com as telas desenhadas. Os passos de baixar o app e criar a
 * conta ficaram de fora: quem está aqui já entrou. Para quem quer o PDF
 * inteiro, os dois caminhos continuam disponíveis nos botões do topo.
 * O mesmo texto está no app, em pt e en, em app/(app)/consultora/manual.tsx.
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
      {telas && <div className="mt-4 flex gap-5 overflow-x-auto pb-2 sm:pl-10">{telas}</div>}
    </div>
  );
}

export function ManualDaConsultora({ dados }: { dados: DadosManual }) {
  const codigo = codigoDe(dados);
  const nome = dados.nome;
  return (
    <>
      <Card titulo="Manual da consultora" direita="o mesmo passo a passo do PDF">
        <p className="text-[13px] leading-relaxed text-ninho-cinza">
          Aqui está o caminho completo, do convite ao acompanhamento, com as telas do app. É o mesmo manual que o Ninho manda em PDF:{' '}
          <b>Baixar PDF</b> gera o arquivo com o seu nome, o seu e-mail e o seu código, para você guardar ou imprimir.
        </p>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
          <Aviso tom="lilas">
            O seu código é <b>{codigo}</b>. É ele que a família digita no app dela.
          </Aviso>
          <AcoesManual tipo="com-conta" dados={dados} apenasPdf rotuloPdf="Baixar PDF" />
        </div>
      </Card>

      <Card className="mt-4" titulo="Passo a passo">
        <Passo
          n={1}
          titulo="Convide a família"
          telas={
            <>
              <TelaInicioVazio />
              <TelaConvidar codigo={codigo} />
              <TelaWhatsAppConvite codigo={codigo} />
            </>
          }
        >
          <p>
            No app, toque em <b>Convidar</b>, na barra de baixo (se a barra estiver fechada, toque na setinha do meio), e depois em{' '}
            <b>Enviar pelo WhatsApp</b>: a sua cliente recebe uma mensagem com o passo a passo e o seu código, <b>{codigo}</b>.
          </p>
          <p>
            Se ela já usa o Ninho, você também pode convidar em <b>Convidar pelo e-mail da família</b>, com o e-mail exato da conta dela. Aqui
            no computador, o mesmo fica em <b>Convidar família</b>.
          </p>
        </Passo>
        <Passo
          n={2}
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
            <b>Pelo código:</b> no app dela, menu ☰ › <b>Cuidador ou Consultor</b> › <b>Adicionar</b> › <b>Consultora de sono</b>. Ela digita o
            seu código, toca em <b>Buscar</b>, marca a caixa e toca em <b>Compartilhar a rotina</b>.
          </p>
          <p>
            <b>Pelo e-mail:</b> ela recebe no sininho o aviso <b>Pedido de consultora de sono</b>, escolhe o bebê e toca em <b>Aprovar</b>.
            Nesse caminho já está pronto.
          </p>
        </Passo>
        <Passo
          n={3}
          titulo="Você aprova (só no caminho do código)"
          telas={
            <>
              <TelaPedido />
              <TelaAprovado />
            </>
          }
        >
          <p>
            Chega para você o aviso <b>Novo pedido de família</b>. No Início, em <b>Pedidos de famílias</b>, toque em <b>Aprovar</b> e depois em{' '}
            <b>Aprovar e acompanhar</b>. Aqui no computador, o pedido aparece em <b>Famílias</b>.
          </p>
          <p>
            Pronto: o bebê aparece em <b>Suas famílias</b>.
          </p>
        </Passo>
        <Passo n={4} titulo="Acompanhe a rotina">
          <p>
            Em <b>Rotina</b> você vê o dia da família, com cada sono e a <b>janela de sono</b> entre eles. Em <b>Evolução</b>, as últimas noites
            lado a lado.
          </p>
          <p>
            O <b>Relatório com IA</b> lê a rotina e escreve a análise para você. Na <b>ficha da família</b> ficam as suas anotações, que só você
            vê.
          </p>
        </Passo>
        <Passo
          n={5}
          titulo="Complete o seu perfil público"
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
            Em <b>Meu perfil na lista</b> (ou, no app, menu ☰ › <b>Editar perfil</b>), coloque foto, um texto sobre como você ajuda as famílias,
            cidade, as idades que atende e o seu WhatsApp.
          </p>
          <p>
            O Ninho revisa e libera você na lista <b>Encontrar consultora de sono</b>, que as famílias veem dentro do app. A lista mostra até 10
            consultoras, e quem traz mais famílias assinantes aparece primeiro.
          </p>
        </Passo>
        <Passo n={6} titulo="Trabalhe no computador">
          <p>
            No app, menu ☰ › <b>Código do painel web</b>: gere um código de 6 dígitos e use com o seu e-mail em{' '}
            <b>useninho.com.br/admin/login</b>, na aba <b>Sou consultora</b>. O código vale 10 minutos.
          </p>
          <p>Aqui você tem as mesmas telas, este manual e o PDF.</p>
        </Passo>
      </Card>

      <Card className="mt-4" titulo="Quando você começou do zero">
        <p className="text-[13px] leading-relaxed text-ninho-cinza">
          Estes são os dois manuais completos que o Ninho manda para uma consultora nova, com os passos de baixar o app e criar a conta. Servem
          para você reler ou mostrar a uma amiga que você indicou.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-6">
          <div>
            <p className="text-[12.5px] font-bold text-[#24164F]">Quem ainda não tem conta no Ninho</p>
            <div className="mt-1.5">
              <AcoesManual tipo="sem-conta" dados={dados} apenasPdf rotuloPdf="Baixar este PDF" />
            </div>
          </div>
          <div>
            <p className="text-[12.5px] font-bold text-[#24164F]">Quem já tem conta no Ninho</p>
            <div className="mt-1.5">
              <AcoesManual tipo="com-conta" dados={dados} apenasPdf rotuloPdf="Baixar este PDF" />
            </div>
          </div>
        </div>
      </Card>
    </>
  );
}
