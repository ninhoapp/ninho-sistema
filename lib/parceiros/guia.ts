/**
 * Texto do "Guia do parceiro" (/admin/parceiro/guia).
 *
 * Fontes, para quem for mexer: os fatos do produto saem da skill
 * `ninho-contexto` do Ninho-expo; o tom, de `voz-da-marca`; os limites de
 * saúde, de `politica-de-saude`; os preços, de `lib/precos.ts` (a página lê
 * os números de lá, não deste arquivo). As regras da parceria foram decididas
 * pelo dono em 11/2026. Não acrescente número, prazo ou recurso que não
 * esteja nessas fontes.
 *
 * Sem emoji em nenhum texto (regra da marca).
 */

export const LINK_BASE = 'www.useninho.com.br/r/';
export const CODIGO_EXEMPLO = 'MARIANA';

export interface Item {
  titulo: string;
  texto: string;
}

export const SOBRE = {
  oQueE:
    'O Ninho é um diário do bebê para pais e cuidadores. Em poucos toques, a família registra sono, sonecas, peito, mamadeira, fralda, comida, banho, remédio e outros cuidados. Com esses registros, o app aprende a rotina de cada bebê e mostra quando ele costuma dormir ou mamar. Também guarda os momentos com foto numa linha do tempo, que vira álbum em PDF e vídeo.',
  paraQuem:
    'Mães, pais e cuidadores, principalmente nos primeiros meses: a maior parte dos bebês das famílias que assinam tem até 2 meses. É gente cansada, muitas vezes de madrugada, com o bebê no colo e uma mão livre.',
  problema:
    '"Que horas ele mamou?", "foi no peito esquerdo ou no direito?", "quanto tempo ela dormiu?". Nos primeiros meses, tudo se mistura, e cada cuidador sabe um pedaço. O Ninho junta tudo num lugar só, lembra por você e mostra o padrão do próprio bebê.',
};

export const RECURSOS: Item[] = [
  {
    titulo: 'Registro da rotina',
    texto:
      'Sono, soneca, peito, mamadeira, fralda, comida, banho, remédio, água, tummy time e mais, com poucos toques. A família para de depender da memória.',
  },
  {
    titulo: 'Previsão da rotina',
    texto:
      'O recurso principal. O app aprende com os registros de cada bebê e mostra quando ele costuma dormir ou mamar ("costuma dormir por volta de..."). Nunca inventa: com poucos dados, diz "dados insuficientes". É uma observação do padrão, não uma ordem.',
  },
  {
    titulo: 'Cuidadores no mesmo bebê',
    texto:
      'Mãe, pai, avó, babá: todos registram e veem a mesma rotina. Ninguém precisa perguntar "ele já mamou?".',
  },
  {
    titulo: 'Plano compartilhado',
    texto:
      'Quem assina cobre todos os cuidadores do mesmo bebê, em qualquer direção: a mãe cria a conta e o pai paga, ou a avó paga, e todo mundo usa. Vale para o responsável principal e os 5 primeiros cuidadores.',
  },
  {
    titulo: 'Momentos e linha do tempo',
    texto:
      'Fotos e memórias do bebê organizadas numa linha do tempo, que vira álbum em PDF e vídeo (álbum e vídeo são do Premium).',
  },
  {
    titulo: 'Calendário',
    texto:
      'Consultas, vacinas, escola e outros eventos que os pais marcam, com lembrete. O Ninho organiza a agenda; ele não diz qual vacina ou consulta fazer.',
  },
  {
    titulo: 'Lembretes e Live Activity',
    texto:
      'Lembretes da rotina e, no iPhone, o sono e o peito em andamento aparecem na tela de bloqueio (Live Activity).',
  },
  {
    titulo: 'Chat IA (Premium)',
    texto:
      'Um assistente dentro do app. Não divulgue como orientação de saúde: dúvida de saúde é sempre com o pediatra.',
  },
  {
    titulo: 'iPhone, Android, português e inglês',
    texto:
      'O app está na App Store e no Google Play, em português e inglês (segue o idioma do celular).',
  },
];

export const IDEIAS_CONTEUDO: Item[] = [
  {
    titulo: 'A madrugada real',
    texto:
      'Você com o bebê no colo, registrando a mamada com uma mão só. O problema aparece nos primeiros 2 segundos ("que horas foi a última?").',
  },
  {
    titulo: 'A previsão depois de alguns dias',
    texto:
      'Use o app por uns dias e mostre a tela com o padrão do seu bebê ("costuma dormir por volta de..."). Conte que é o padrão dele, não uma regra.',
  },
  {
    titulo: 'Os cuidadores juntos',
    texto:
      'O pai ou a avó abrindo o app e vendo o que você registrou. Mostra o fim do "você já trocou a fralda?".',
  },
  {
    titulo: 'Memórias',
    texto:
      'A linha do tempo com fotos e o álbum em PDF ou o vídeo dos primeiros meses. Funciona bem em datas como "1 mês do bebê".',
  },
  {
    titulo: 'Antes da consulta',
    texto:
      'Abrir o histórico para lembrar o que você observou e levar ao pediatra. O Ninho organiza; quem avalia é o médico.',
  },
];

export const DICAS_FORMATO: string[] = [
  'Mostre a tela real do app, com gravação ou print do seu celular. Nada de tela montada ou desenhada por IA.',
  'Coloque legenda escrita no vídeo: muita gente assiste sem som.',
  'Feche com o convite na tela: "Baixe o Ninho grátis · 7 dias grátis", mais o seu link ou código.',
  'Fale do seu jeito. Se o seu bebê aparecer, você decide o que mostrar; se mostrar a tela de outra família, peça autorização antes.',
];

export const FRASES_PRONTAS: string[] = [
  'Às 3 da manhã eu não lembrava nem qual peito tinha sido o último. Agora eu registro no Ninho com uma mão só.',
  'O Ninho aprende a rotina do bebê e mostra quando ele costuma dormir. Não é regra, é o padrão dele.',
  'Aqui em casa todo mundo vê os mesmos registros. Acabou o "ele já mamou?".',
  'Os momentos com foto viram uma linha do tempo e, depois, um álbum dos primeiros meses.',
  'Dá para testar 7 dias grátis, com tudo liberado. O link está na bio.',
];

export const DESTACAR: string[] = [
  'Organização, tranquilidade e "lembra por você".',
  'A previsão sempre como "costuma", "por volta de", nunca como horário certo.',
  'O teste grátis de 7 dias, com tudo liberado.',
  'O plano compartilhado: um paga e todos os cuidadores do bebê usam.',
];

export const PALAVRAS: { use: string; evite: string }[] = [
  { use: 'registrar, registro', evite: 'lançar, lançamento' },
  { use: 'responsável principal (quem criou a conta)', evite: 'dono da conta' },
  { use: 'costuma mamar por volta das 11h', evite: 'está na hora de mamar' },
  { use: 'teste grátis', evite: 'free trial' },
  { use: 'momentos (as memórias com foto)', evite: 'momentos para falar dos registros da rotina' },
];

export const NAO_FALAR_SAUDE: string[] = [
  'Que o Ninho cuida da saúde do bebê, evita cólica, melhora o sono ou faz o bebê dormir mais.',
  'Que o Ninho é "recomendado por pediatras" ou aprovado por médicos.',
  'Que o app diz a hora certa de mamar ou dormir. A previsão descreve o padrão; o peito é em livre demanda.',
  'Que o Ninho tem área de saúde ou carteira de vacina. Consultas e vacinas são eventos que os pais marcam no calendário.',
  'Qualquer orientação de dose ou remédio (inclusive de farmácia), remédio na amamentação, água antes dos 6 meses, mel antes de 1 ano, preparo de fórmula, posição de sono ou cama compartilhada, volume ou intervalo "ideal" de mamada, introdução alimentar, peso, altura ou percentil, ou se um sintoma é grave.',
  'O Chat IA como fonte de orientação de saúde.',
];

export const NAO_FALAR_JURIDICO: string[] = [
  'Conteúdo da parceria sem aviso de publicidade. Sinalize de forma clara e logo no começo, em todo post, Reels e Stories: "publicidade", "#publi" ou "parceria paga com o Ninho" (no Instagram, use também o rótulo de parceria paga). Essa é a orientação do CONAR para publicidade feita por influenciadores.',
  'Preço, desconto ou cupom que não estejam neste guia. A única condição para divulgar é o teste grátis de 7 dias.',
  '"Grátis para sempre". Depois do teste, sem assinar, a pessoa continua vendo o que registrou, mas não registra mais.',
  'Recurso que o app não tem, ou como ele vai ficar no futuro.',
  'Promessa de resultado ("seu bebê vai dormir a noite toda").',
  'Dados, nome ou foto de bebê de outra família sem autorização dos pais.',
  'O logo do Ninho distorcido, recolorido ou redesenhado.',
];

export const DUVIDA_SAUDE =
  'Se um seguidor perguntar algo de saúde, a resposta é sempre a mesma: "Isso é com o pediatra." Em sinal de alerta (dificuldade para respirar, lábios arroxeados, convulsão, bebê que não acorda, febre em bebê com menos de 3 meses, pancada na cabeça, queimadura ou ingestão de produto), oriente procurar o pronto-socorro ou ligar para o SAMU (192), sem tentar explicar a causa.';

export const FAQ: Item[] = [
  {
    titulo: 'Meu seguidor instalou e não apareceu para mim. Por quê?',
    texto:
      'Os motivos mais comuns: abriu o link num aparelho (no computador, por exemplo) e instalou em outro; instalou direto pela loja sem tocar no link; instalou mais de 7 dias depois do clique; ou outro parceiro chegou antes. Nesse caso, ele pode digitar o seu código no cadastro do app nos 7 primeiros dias da conta. Se já passou disso e ele veio mesmo por você, escreva para a equipe.',
  },
  {
    titulo: 'Quando recebo?',
    texto:
      'O mês fecha no último dia. O que a loja cobrou naquele mês é pago por Pix até o 5º dia útil do mês seguinte, com a chave cadastrada em Minha conta.',
  },
  {
    titulo: 'O que conta como assinante?',
    texto:
      'Quem assinou o Básico ou o Premium e teve a assinatura cobrada de verdade pela Apple ou pelo Google. Quem está nos 7 dias grátis ainda não conta, e quem cancela antes de o teste acabar não gera comissão.',
  },
  {
    titulo: 'Download e cadastro geram comissão?',
    texto:
      'Não. Cliques, downloads e cadastros aparecem na sua tela para você ver o caminho até a assinatura. A comissão vem só da assinatura cobrada.',
  },
  {
    titulo: 'E se o assinante cancelar depois?',
    texto:
      'Se a loja já cobrou a primeira mensalidade ou a anuidade, a sua comissão está garantida. Quem cancela ainda nos 7 dias grátis não gera comissão.',
  },
  {
    titulo: 'Quanto eu ganho por assinante?',
    texto:
      'Até 25% do preço cheio da assinatura, sem descontar a taxa da loja: no plano mensal, sobre a primeira mensalidade; no plano anual, sobre a anuidade, uma única vez. O seu percentual e os valores de cada mês aparecem na sua tela de resultados.',
  },
  {
    titulo: 'Tem valor mínimo para receber?',
    texto: 'Não tem mínimo: qualquer valor é pago.',
  },
  {
    titulo: 'Meu seguidor já usava o Ninho. Conta para mim?',
    texto:
      'Só se a conta dele tiver até 7 dias e ainda não tiver outro parceiro: aí ele pode digitar o seu código no cadastro. Conta mais antiga, ou que já veio de outro parceiro, não muda.',
  },
  {
    titulo: 'Posso oferecer desconto aos meus seguidores?',
    texto:
      'Divulgue só o teste grátis de 7 dias. Se quiser propor uma condição especial, fale com a equipe antes de publicar.',
  },
  {
    titulo: 'Onde vejo meus números e minha comissão?',
    texto:
      'Na sua tela de resultados aqui no painel: cliques, downloads, cadastros, assinantes e o valor de cada mês.',
  },
];
