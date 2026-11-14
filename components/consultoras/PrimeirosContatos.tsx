import { Aviso, Card } from '@/components/consultoras/ui';
import { BotaoWhatsApp } from '@/components/consultoras/BotaoWhatsApp';

/**
 * Aba "Primeiros contatos" da ficha da consultora (dono, 14/11/2026): textos
 * prontos para o dono falar com ela pelo WhatsApp dele. A ideia é ela se
 * sentir acolhida e com suporte, e perceber que o Ninho vai ser bom para o
 * trabalho dela. Sem emoji (voz-da-marca) e sem prometer o que o app não faz.
 */
export interface DadosContato {
  nome: string;
  whatsapp: string | null;
  email: string;
  codigo: string | null;
  ativa: boolean;
  indicada: boolean;
  pct: string;
}

interface Modelo {
  id: string;
  quando: string;
  titulo: string;
  texto: (d: DadosContato) => string;
}

const MODELOS: Modelo[] = [
  {
    id: 'boas-vindas',
    quando: 'Logo depois de aprovar o pedido',
    titulo: 'Boas-vindas',
    texto: (d) =>
      `Oi, ${d.nome}! Tudo bem? Aqui é o Mailson, criador do Ninho.\n\n` +
      `Seja muito bem-vinda! Acabei de aprovar o seu pedido e fiquei muito feliz de ter você com a gente.\n\n` +
      `O Ninho nasceu para facilitar a rotina das famílias, e o trabalho das consultoras é uma parte muito importante disso. ` +
      `Com o app, você acompanha a rotina de sono, mamadas e fraldas das suas clientes de perto, sem precisar pedir print ou planilha.\n\n` +
      `Estou aqui para te ajudar no que precisar, do primeiro acesso até a sua primeira família. ` +
      `E assim como as outras consultoras, você pode me mandar sugestões a qualquer momento: muita coisa do app já mudou por causa delas.\n\n` +
      `Daqui a pouco te mando o passo a passo para ativar a sua conta.`,
  },
  {
    id: 'ativar',
    quando: 'Se ela ainda não entrou no app (1 ou 2 dias depois)',
    titulo: 'Ajuda para ativar a conta',
    texto: (d) =>
      `Oi, ${d.nome}! Passando para saber se deu tudo certo com o seu acesso ao Ninho.\n\n` +
      `Só lembrando o detalhe mais importante: entre no app com o e-mail ${d.email}, porque é ele que está liberado como consultora. ` +
      `Pode ser com o Google ou com e-mail. Se for pela Apple, não marque "ocultar meu e-mail".\n\n` +
      `Se travar em qualquer parte, me manda um print aqui que eu resolvo com você na hora. Sem pressa nenhuma.`,
  },
  {
    id: 'ativada',
    quando: 'Quando a conta dela aparece como ativa',
    titulo: 'Conta ativada',
    texto: (d) =>
      `${d.nome}, vi aqui que a sua conta de consultora já está ativa. Que bom!\n\n` +
      `O próximo passo é convidar a sua primeira família. No app, toque em Convidar, na barra de baixo, e depois em "Enviar pelo WhatsApp". ` +
      `A cliente recebe o passo a passo com o seu código. Quando ela digitar o código, você aprova no Início e a rotina do bebê aparece para você.\n\n` +
      `Uma dica: comece por uma cliente que você atende agora. Fica mais fácil de você conhecer o app junto com ela.\n\n` +
      `Qualquer dúvida no caminho, é só me chamar.`,
  },
  {
    id: 'comissao',
    quando: 'Quando ela perguntar como ganha',
    titulo: 'Como funciona a comissão',
    texto: (d) =>
      `Claro, ${d.nome}! Funciona assim:\n\n` +
      `Quando uma família cria a conta no Ninho pelo seu link ou com o seu código${d.codigo ? ` (${d.codigo})` : ''} e assina um plano, ` +
      `você recebe ${d.pct} sobre o preço cheio: por 6 meses no plano mensal, ou uma vez no plano anual. O teste grátis não conta.\n\n` +
      `O pagamento é por Pix, até o 5º dia útil do mês seguinte. Você cadastra a chave Pix e o CPF no app, na aba Ganhos.\n\n` +
      `Família que já tinha conta e só se ligou a você não gera comissão, mas você acompanha a rotina dela do mesmo jeito.`,
  },
  {
    id: 'primeira-familia',
    quando: 'Quando a primeira família se vincular',
    titulo: 'Primeira família',
    texto: (d) =>
      `${d.nome}, a sua primeira família já está ligada a você no Ninho. Parabéns!\n\n` +
      `Agora você vê a rotina do bebê no app, do jeito que a família registra. Se puder, me conta depois o que achou: ` +
      `o que ajudou no seu acompanhamento e o que faltou. É assim que a gente vai melhorando o app para o seu trabalho.`,
  },
  {
    id: 'sugestoes',
    quando: 'Uma semana depois de ativar',
    titulo: 'Pedir sugestões',
    texto: (d) =>
      `Oi, ${d.nome}! Já faz uma semana que você está no Ninho e queria muito ouvir você.\n\n` +
      `O que está funcionando bem? O que poderia ser mais fácil no seu dia a dia com as famílias?\n\n` +
      `Pode falar tudo, mesmo que pareça pequeno. As melhorias que entram no app vêm justamente das consultoras, e eu leio cada mensagem.`,
  },
  {
    id: 'reaproximar',
    quando: 'Se ela sumir por um tempo',
    titulo: 'Retomar o contato',
    texto: (d) =>
      `Oi, ${d.nome}! Tudo bem por aí?\n\n` +
      `Passando só para lembrar que continuo à disposição para te ajudar com o Ninho. ` +
      `Se alguma coisa não funcionou como você esperava, me conta: quero entender e melhorar.\n\n` +
      `E se quiser, marco uma conversa rápida para te mostrar o que tem de novo no app.`,
  },
];

export function PrimeirosContatos({ dados }: { dados: DadosContato }) {
  return (
    <>
      <Card titulo="Primeiros contatos" direita="textos para você mandar do seu WhatsApp">
        <p className="text-[13px] leading-relaxed text-ninho-cinza">
          Mensagens prontas para acolher a {dados.nome} e mostrar que ela tem suporte. O botão abre o seu WhatsApp na conversa com ela, com o
          texto já escrito: você revisa, ajusta se quiser e envia.
        </p>
        {!dados.whatsapp && (
          <div className="mt-3">
            <Aviso tom="ambar">Ela não tem WhatsApp cadastrado. O botão abre o WhatsApp com o texto, e você escolhe a conversa.</Aviso>
          </div>
        )}
      </Card>
      <div className="mt-4 grid items-start gap-4 lg:grid-cols-2">
        {MODELOS.map((m) => {
          const texto = m.texto(dados);
          return (
            <Card key={m.id}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.07em] text-[#9A95AD]">{m.quando}</p>
                  <h4 className="mt-0.5 text-[15px] font-black text-[#24164F]">{m.titulo}</h4>
                </div>
                <BotaoWhatsApp numero={dados.whatsapp} texto={texto} rotulo="Enviar" />
              </div>
              <div className="mt-3 whitespace-pre-line rounded-2xl rounded-tl-md bg-[#E7F8EE] px-4 py-3 text-[13px] leading-relaxed text-[#1E1F25]">
                {texto}
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}
