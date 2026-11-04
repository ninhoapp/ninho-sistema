/**
 * Conteúdo do /guia — páginas de pergunta e resposta para quem pesquisa no
 * Google ou pergunta a uma IA sobre a rotina do recém-nascido.
 *
 * REGRA DE OURO (pedido do dono, 04/11/2026): todo número ou orientação de
 * saúde precisa dizer DE ONDE veio, com link para a página da entidade, e a
 * página deixa claro que não é recomendação do Ninho. Nada de número "de
 * cabeça": se não há fonte reconhecida, o número não entra.
 * Fontes conferidas em 04/11/2026 (texto citado em cada FONTE.trecho).
 *
 * Outras regras (mesmas da loja, Ninho-expo/marketing/loja/textos-app-store.md):
 * - Sem promessa de saúde. O Ninho organiza; quem orienta é o pediatra.
 * - A previsão do app "costuma", nunca "garante".
 * - Só citar recurso que o app TEM hoje (a tela de Saúde, com vacinas,
 *   alergias e curva de crescimento, saiu em 18/10/2026).
 * - Resposta direta logo no começo: é o trecho que o Google e as IAs citam.
 *
 * Para incluir uma página nova: acrescente um item em GUIAS. A rota, o
 * sitemap, o índice e o llms.txt leem daqui.
 */

export type Categoria = 'Sono' | 'Mamada' | 'Fralda' | 'Rotina' | 'O app Ninho';

export interface Secao {
  titulo: string;
  paragrafos?: string[];
  lista?: string[];
  tabela?: { cabecalho: string[]; linhas: string[][] };
  /** De onde saíram os números/orientações desta seção. */
  fonte?: FonteKey[];
  /** Observação sobre a fonte (ex.: "são estimativas, não recomendação oficial"). */
  notaFonte?: string;
}

export interface Guia {
  slug: string;
  categoria: Categoria;
  /** H1 — a pergunta como a pessoa digita. */
  pergunta: string;
  /** <title> (até ~60 caracteres). */
  titulo: string;
  /** meta description (até ~155 caracteres). */
  descricao: string;
  /** Resposta direta, 2 a 3 frases, já dizendo a fonte dos números. */
  resumo: string;
  secoes: Secao[];
  /** Quando procurar o pediatra (opcional, aparece em destaque). */
  alerta?: string;
  ninho: { titulo: string; texto: string; itens?: string[]; tela: string; alt: string };
  faqs: { q: string; a: string }[];
  relacionados: string[];
  /** Todas as fontes usadas na página (listadas no fim e no aviso do topo). */
  fontes: FonteKey[];
  atualizado: string; // AAAA-MM-DD
}

export type FonteKey =
  | 'nsf'
  | 'aapMamadas'
  | 'aapLeite'
  | 'aapXixi'
  | 'whoAlim'
  | 'sbpSono'
  | 'sfJanela'
  | 'msCaderneta';

export interface Fonte {
  /** Entidade, como aparece no texto ("a OMS", "a AAP"). */
  sigla: string;
  nome: string;
  pagina: string;
  url: string;
  /** false = site de informação, não órgão de saúde (aparece com esse aviso). */
  oficial: boolean;
}

export const FONTES: Record<FonteKey, Fonte> = {
  nsf: {
    sigla: 'National Sleep Foundation',
    nome: 'National Sleep Foundation (EUA)',
    pagina: 'How Much Sleep Do You Really Need?',
    url: 'https://www.thensf.org/how-many-hours-of-sleep-do-you-really-need/',
    oficial: true,
  },
  aapMamadas: {
    sigla: 'AAP',
    nome: 'Academia Americana de Pediatria (AAP), site HealthyChildren.org',
    pagina: 'How Often and How Much Should Your Baby Eat?',
    url: 'https://www.healthychildren.org/English/ages-stages/baby/feeding-nutrition/pages/How-Often-and-How-Much-Should-Your-Baby-Eat.aspx',
    oficial: true,
  },
  aapLeite: {
    sigla: 'AAP',
    nome: 'Academia Americana de Pediatria (AAP), site HealthyChildren.org',
    pagina: 'How to Tell if Your Breastfed Baby is Getting Enough Milk',
    url: 'https://www.healthychildren.org/English/ages-stages/baby/breastfeeding/Pages/How-to-Tell-if-Baby-is-Getting-Enough-Milk.aspx',
    oficial: true,
  },
  aapXixi: {
    sigla: 'AAP',
    nome: 'Academia Americana de Pediatria (AAP), site HealthyChildren.org',
    pagina: "Baby's First Days: Bowel Movements & Urination",
    url: 'https://www.healthychildren.org/English/ages-stages/baby/Pages/babys-first-days-bowel-movements-and-urination.aspx',
    oficial: true,
  },
  whoAlim: {
    sigla: 'OMS',
    nome: 'Organização Mundial da Saúde (OMS)',
    pagina: 'Infant and young child feeding (nota descritiva)',
    url: 'https://www.who.int/news-room/fact-sheets/detail/infant-and-young-child-feeding',
    oficial: true,
  },
  sbpSono: {
    sigla: 'SBP',
    nome: 'Sociedade Brasileira de Pediatria (SBP)',
    pagina: 'Bebê deve dormir de barriga para cima ou de lado? Pediatras reforçam recomendações para o sono seguro',
    url: 'https://www.sbp.com.br/imprensa/detalhe/nid/bebe-deve-dormir-de-barriga-para-cima-ou-de-lado-pediatras-reforcam-recomendacoes-para-o-sono-seguro/',
    oficial: true,
  },
  sfJanela: {
    sigla: 'Sleep Foundation',
    nome: 'Sleep Foundation (site de informação sobre sono, artigo revisado por pediatra)',
    pagina: "Newborn Wake Windows: What's Normal by Age",
    url: 'https://www.sleepfoundation.org/baby-sleep/newborn-wake-windows',
    oficial: false,
  },
  msCaderneta: {
    sigla: 'Ministério da Saúde',
    nome: 'Ministério da Saúde',
    pagina: 'Caderneta da Criança',
    url: 'https://www.gov.br/saude',
    oficial: true,
  },
};

/** Categorias com informação de saúde: levam o aviso de fonte no topo. */
export function temInfoDeSaude(g: Guia): boolean {
  return g.categoria !== 'O app Ninho';
}

const ATUALIZADO = '2026-11-04';

export const GUIAS: Guia[] = [
  // ─── O APP ─────────────────────────────────────────────────────────────
  {
    slug: 'como-funciona-o-app-ninho',
    categoria: 'O app Ninho',
    pergunta: 'Como funciona o app Ninho?',
    titulo: 'Como funciona o app Ninho, diário do bebê',
    descricao:
      'O Ninho registra mamada, sono e fralda num toque, mostra quando costuma vir a próxima soneca e mamada e divide o dia com quem cuida. Veja passo a passo.',
    resumo:
      'O Ninho é um app de rotina do bebê para iPhone e Android. Você registra mamadas, sono, fraldas e outros cuidados com um toque; o app aprende o ritmo do bebê pelos seus registros e mostra quando a próxima soneca e a próxima mamada costumam acontecer. Pai, mãe, avós e babá registram do próprio celular e todos veem o mesmo dia, na hora.',
    secoes: [
      {
        titulo: 'Para quem é o Ninho',
        paragrafos: [
          'Para pais de recém-nascidos e bebês nos primeiros meses, quando a rotina muda toda semana e ninguém lembra a que horas foi a última mamada. Também para quem divide o cuidado: o casal, os avós, a babá ou a creche.',
        ],
      },
      {
        titulo: 'O que dá para registrar',
        paragrafos: ['Cada registro leva poucos segundos, mesmo com o bebê no colo. O Ninho guarda a hora e a duração ou quantidade:'],
        lista: [
          'Peito, com o lado (esquerdo ou direito) e a duração',
          'Mamadeira, com a quantidade em ml',
          'Sono e soneca, com início e fim',
          'Fralda (xixi, cocô ou os dois)',
          'Comida, água, banho, remédio, tummy time e pinico',
          'Momentos: fotos e marcos, como o primeiro sorriso',
        ],
      },
      {
        titulo: 'O que o Ninho mostra',
        lista: [
          'Na tela inicial, quanto tempo passou desde a última mamada, o último sono e a última fralda.',
          'O card Ritmo: janela de sono, intervalo entre mamadas e qual peito oferecer na próxima.',
          'Um aviso quando a próxima soneca costuma chegar (por exemplo: "Soneca entre 07:35 e 07:55").',
          'O resumo do dia: quantos ml, quantos minutos no peito, quantas horas de sono e quantas fraldas.',
          'O histórico completo, organizado por dia e com filtro por tipo.',
          'No iPhone, o cronômetro do sono ou da mamada ao vivo na tela bloqueada e na Dynamic Island.',
        ],
      },
      {
        titulo: 'Como funciona a previsão da próxima soneca e mamada',
        paragrafos: [
          'O Ninho não usa uma tabela genérica: ele olha os registros do seu bebê nos últimos dias e calcula o intervalo que costuma se repetir. Quando ainda há poucos registros, ele avisa que precisa de mais dados em vez de chutar um horário. A previsão é um apoio para se organizar; o bebê continua sendo quem manda, e a mamada em livre demanda segue valendo.',
        ],
      },
      {
        titulo: 'Quanto custa',
        paragrafos: [
          'Os primeiros 7 dias são grátis, com tudo liberado. Depois, há dois planos: o Básico (o app inteiro, menos o assistente, o álbum em PDF e o vídeo) e o Premium (tudo). Uma assinatura vale para todos os cuidadores do mesmo bebê. A cobrança é feita pela App Store ou pelo Google Play, e dá para cancelar quando quiser.',
        ],
      },
    ],
    ninho: {
      titulo: 'A tela inicial do Ninho',
      texto: 'É assim que a casa toda vê o dia do bebê: os botões de registro em cima, o Ritmo no meio e o resumo de hoje embaixo.',
      tela: '/app/home.webp',
      alt: 'Tela inicial do app Ninho com os botões Peito, Sono, Fralda e Mamadeira e o card Ritmo',
    },
    faqs: [
      { q: 'O Ninho funciona no Android?', a: 'Sim. O Ninho está na App Store (iPhone) e no Google Play (Android). O cronômetro na tela bloqueada é um recurso do iPhone.' },
      { q: 'Precisa de internet?', a: 'Os registros são sincronizados pela internet para que todos os cuidadores vejam o mesmo dia.' },
      { q: 'O Ninho dá orientação médica?', a: 'Não. O Ninho é uma ferramenta de organização para pais e cuidadores. Dúvidas de saúde são com o pediatra; o histórico do app ajuda a levar a informação certa para a consulta.' },
      { q: 'Quantas pessoas podem usar o mesmo bebê?', a: 'Você convida quem cuida junto (pai, mãe, avós, babá) por e-mail. Cada um entra com a própria conta, e uma assinatura cobre todos os cuidadores do mesmo bebê.' },
    ],
    relacionados: ['melhor-app-para-rotina-do-bebe', 'como-controlar-as-mamadas-do-bebe', 'como-dividir-os-cuidados-do-bebe'],
    fontes: [],
    atualizado: ATUALIZADO,
  },
  {
    slug: 'melhor-app-para-rotina-do-bebe',
    categoria: 'O app Ninho',
    pergunta: 'Qual o melhor aplicativo para acompanhar a rotina do bebê?',
    titulo: 'Melhor app para rotina do bebê: o que comparar',
    descricao:
      'Vai escolher um app para anotar mamada, sono e fralda? Veja o que realmente importa (rapidez, previsão, cuidadores, privacidade) e como o Ninho se sai.',
    resumo:
      'O melhor app de rotina do bebê é o que você consegue usar às 3 da manhã com uma mão só. Compare cinco pontos: rapidez para registrar, se ele mostra o que vem depois (próxima soneca e mamada), se várias pessoas registram no mesmo bebê, se está em português e se cuida bem dos seus dados. O Ninho foi feito em cima desses cinco pontos.',
    secoes: [
      {
        titulo: '1. Registrar em um toque',
        paragrafos: [
          'Se anotar uma mamada leva mais que alguns segundos, você para de anotar na segunda semana. Procure um app com botões grandes na tela inicial, que já preencha a hora atual e lembre o último lado do peito.',
        ],
      },
      {
        titulo: '2. Mostrar o que vem depois',
        paragrafos: [
          'Anotar é metade do trabalho. A outra metade é saber quando a próxima soneca ou mamada costuma acontecer, para tomar banho, comer ou sair de casa com calma. Prefira apps que calculem isso com os registros do seu bebê, e não com uma tabela igual para todos.',
        ],
      },
      {
        titulo: '3. Cuidado compartilhado de verdade',
        paragrafos: [
          'Pai, avó e babá precisam registrar do próprio celular e ver o mesmo dia na hora. Confira se cada cuidador paga à parte ou se uma assinatura cobre a casa toda.',
        ],
      },
      {
        titulo: '4. Português e jeito brasileiro',
        paragrafos: ['Termos como "peito", "mamadeira", "soneca" e "xixi" fazem diferença na madrugada. Um app traduzido às pressas confunde.'],
      },
      {
        titulo: '5. Privacidade e honestidade',
        paragrafos: [
          'Leia a política de privacidade: os dados do seu filho são sensíveis. Desconfie de app que promete diagnóstico; um diário de rotina organiza, não substitui o pediatra.',
        ],
      },
      {
        titulo: 'Como o Ninho se compara nesses pontos',
        tabela: {
          cabecalho: ['O que comparar', 'No Ninho'],
          linhas: [
            ['Registro rápido', 'Um toque na tela inicial; peito com lado, mamadeira em ml, sono com cronômetro'],
            ['O que vem depois', 'Card Ritmo e aviso da próxima soneca, calculados pelos seus registros'],
            ['Cuidadores', 'Convite por e-mail; uma assinatura vale para todos os cuidadores do bebê'],
            ['Idioma', 'Feito no Brasil, em português'],
            ['Saúde', 'Não dá diagnóstico; o assistente avisa que não é pediatra'],
            ['Preço', '7 dias grátis; depois planos Básico e Premium, mensal ou anual'],
          ],
        },
      },
    ],
    ninho: {
      titulo: 'Teste o Ninho por 7 dias',
      texto: 'Use uma semana inteira com tudo liberado e veja se o Ritmo do seu bebê começa a aparecer. Se não servir, é só cancelar antes do fim do teste.',
      tela: '/app/historico.webp',
      alt: 'Histórico do dia no app Ninho com peito, sono, mamadeira e fralda e o resumo do dia',
    },
    faqs: [
      { q: 'Existe app de rotina do bebê grátis?', a: 'Vários apps têm versão grátis com limites. No Ninho, os 7 primeiros dias são grátis com tudo liberado; depois é preciso assinar um dos planos para continuar registrando.' },
      { q: 'Papel e caneta não resolvem?', a: 'Resolvem para quem cuida sozinho. Quando duas ou mais pessoas cuidam, o caderno fica num lugar só e ninguém sabe o que o outro anotou. E o papel não calcula intervalos para você.' },
      { q: 'Dá para usar o mesmo app no iPhone e no Android?', a: 'Sim. No Ninho, um cuidador pode estar no iPhone e outro no Android, vendo o mesmo bebê.' },
    ],
    relacionados: ['como-funciona-o-app-ninho', 'como-controlar-as-mamadas-do-bebe', 'como-dividir-os-cuidados-do-bebe'],
    fontes: [],
    atualizado: ATUALIZADO,
  },

  // ─── SONO ──────────────────────────────────────────────────────────────
  {
    slug: 'quanto-tempo-recem-nascido-dorme',
    categoria: 'Sono',
    pergunta: 'Quanto tempo um recém-nascido dorme por dia?',
    titulo: 'Quanto tempo o recém-nascido dorme por dia?',
    descricao:
      'Segundo a National Sleep Foundation, bebês de 0 a 3 meses precisam de 14 a 17 horas de sono por dia, contando as sonecas. Veja as faixas por idade e a fonte.',
    resumo:
      'Segundo a National Sleep Foundation (EUA), bebês de 0 a 3 meses precisam de 14 a 17 horas de sono a cada 24 horas, somando as sonecas do dia e o sono da noite. De 4 a 11 meses, a faixa da mesma entidade é de 12 a 15 horas. São referências gerais: cada bebê é um, e quem avalia o seu é o pediatra.',
    secoes: [
      {
        titulo: 'Sono por idade, segundo a National Sleep Foundation',
        tabela: {
          cabecalho: ['Idade', 'Sono em 24 horas (sonecas incluídas)'],
          linhas: [
            ['0 a 3 meses', '14 a 17 horas'],
            ['4 a 11 meses', '12 a 15 horas'],
            ['1 a 2 anos', '11 a 14 horas'],
          ],
        },
        fonte: ['nsf'],
        notaFonte: 'Faixas copiadas da página da National Sleep Foundation. Não são recomendação do Ninho.',
      },
      {
        titulo: 'Por que o recém-nascido acorda tanto',
        paragrafos: [
          'Nas primeiras semanas, o bebê dorme em períodos curtos, de dia e de noite, e acorda para mamar. A AAP descreve que bebês amamentados costumam mamar a cada 2 horas nesse começo, o que explica boa parte dos despertares. Com o passar dos meses, os períodos de sono da noite tendem a ficar mais longos, no ritmo de cada bebê.',
        ],
        fonte: ['aapMamadas'],
      },
      {
        titulo: 'Sono seguro, segundo a Sociedade Brasileira de Pediatria',
        lista: [
          'Bebês menores de 1 ano devem dormir de barriga para cima (não de lado nem de bruços).',
          'Em berço com superfície firme e sem inclinação.',
          'Sem objetos fofos no berço: travesseiros, "naninhas", cobertas e lençóis soltos.',
          'Em berço próprio, separado da cama dos pais.',
        ],
        fonte: ['sbpSono'],
        notaFonte: 'Resumo das orientações publicadas pela SBP. Para os detalhes, leia o texto original.',
      },
      {
        titulo: 'Como acompanhar o sono do seu bebê',
        paragrafos: [
          'Anotar o sono por alguns dias mostra o padrão real do seu bebê, e esse histórico ajuda muito na conversa com o pediatra. Ele é quem diz se o sono está adequado para o seu filho.',
        ],
      },
    ],
    alerta:
      'Procure o pediatra se o bebê estiver muito sonolento e difícil de acordar para mamar, com febre, recusando mamadas ou molhando menos fraldas do que o habitual.',
    ninho: {
      titulo: 'Veja quanto o seu bebê dormiu hoje',
      texto: 'No Ninho, um toque começa e outro termina o sono. O resumo do dia soma as horas, e o card Ritmo mostra a janela de sono do seu bebê, calculada pelos seus registros.',
      itens: ['Total de sono do dia no resumo', 'Histórico por dia para levar ao pediatra', 'No iPhone, cronômetro do sono na tela bloqueada'],
      tela: '/app/live.webp',
      alt: 'Cronômetro do sono noturno do Ninho na tela bloqueada do iPhone',
    },
    faqs: [
      { q: 'Preciso acordar o recém-nascido para mamar?', a: 'Isso depende do peso e da história do bebê. Pergunte ao pediatra do seu filho qual o intervalo máximo entre mamadas para ele.' },
      { q: 'Quando o bebê começa a dormir a noite toda?', a: 'Não há uma idade certa, e acordar à noite no primeiro ano é comum. Se o sono preocupa, leve o histórico para o pediatra.' },
      { q: 'É normal o recém-nascido dormir o dia todo?', a: 'Nas primeiras semanas o bebê passa a maior parte do dia dormindo e acorda para mamar. Sonolência a ponto de não conseguir mamar é motivo para procurar o pediatra.' },
    ],
    relacionados: ['janela-de-sono-do-bebe', 'bebe-trocou-o-dia-pela-noite', 'rotina-do-recem-nascido'],
    fontes: ['nsf', 'sbpSono', 'aapMamadas'],
    atualizado: ATUALIZADO,
  },
  {
    slug: 'janela-de-sono-do-bebe',
    categoria: 'Sono',
    pergunta: 'O que é janela de sono e qual a do meu bebê?',
    titulo: 'Janela de sono do bebê: o que é e estimativas por idade',
    descricao:
      'Janela de sono é o tempo que o bebê fica acordado entre um sono e outro. Veja as estimativas por idade (e de onde vêm), os sinais de sono e como descobrir a do seu bebê.',
    resumo:
      'Janela de sono é o tempo que o bebê fica acordado entre um sono e outro. Não existe uma tabela oficial de órgão de saúde para isso: as faixas que circulam são estimativas. A Sleep Foundation, por exemplo, estima de 30 minutos a 1h30 para bebês de 0 a 1 mês. A melhor referência é o próprio bebê: os sinais de sono e o padrão dos registros dele.',
    secoes: [
      {
        titulo: 'Estimativas de janela de sono por idade',
        tabela: {
          cabecalho: ['Idade', 'Tempo acordado (estimativa)'],
          linhas: [
            ['0 a 1 mês', '30 min a 1h30'],
            ['1 a 4 meses', '1h a 3h'],
            ['5 a 7 meses', '1h30 a 4h30'],
            ['7 a 10 meses', '1h30 a 6h'],
            ['10 a 12 meses', '3h a 7h30'],
          ],
        },
        fonte: ['sfJanela'],
        notaFonte:
          'Atenção: estes números são estimativas publicadas pela Sleep Foundation, um site de informação sobre sono (o artigo é revisado por uma pediatra). Não são recomendação oficial de órgão de saúde nem recomendação do Ninho. O próprio artigo diz que cada bebê tem o seu ritmo.',
      },
      {
        titulo: 'Sinais que os pais costumam notar quando o bebê está com sono',
        lista: [
          'Olhar perdido, desvia o olhar de rostos e brinquedos',
          'Esfrega os olhos ou as orelhas',
          'Boceja, fica mais quieto ou mais irritado',
        ],
        notaFonte: 'Observações comuns do dia a dia, não uma lista clínica. Cada bebê demonstra o sono do seu jeito.',
      },
      {
        titulo: 'Como descobrir a janela do seu bebê',
        paragrafos: [
          'Anote, por alguns dias, a hora em que o bebê acorda e a hora em que adormece de novo. A diferença entre os dois é a janela dele. Quando o mesmo intervalo se repete, você passa a preparar o sono (fralda, quarto escuro, colo) um pouco antes.',
        ],
      },
    ],
    ninho: {
      titulo: 'O Ninho calcula a janela de sono do seu bebê',
      texto: 'Em vez de tabela, o Ninho usa os registros de sono do próprio bebê nos últimos dias: o card Ritmo mostra a janela de sono dele e quando a próxima soneca costuma acontecer. Com poucos dias de registro, ele avisa em vez de chutar.',
      itens: ['Janela de sono calculada pelos seus registros', 'Aviso antes da próxima soneca', 'Muda junto com o bebê, semana a semana'],
      tela: '/app/home.webp',
      alt: 'Card Ritmo do Ninho mostrando janela de sono de 50 minutos e soneca entre 07:35 e 07:55',
    },
    faqs: [
      { q: 'Preciso seguir a tabela à risca?', a: 'Não. A tabela é uma estimativa de um site de informação, não uma regra. O que vale é o seu bebê: os sinais de sono e o padrão que aparece nos registros.' },
      { q: 'E se o bebê passar da janela?', a: 'Ele pode ficar mais agitado e demorar para dormir. Diminua os estímulos e tente de novo. Se o sono preocupa, converse com o pediatra.' },
    ],
    relacionados: ['quanto-tempo-recem-nascido-dorme', 'bebe-trocou-o-dia-pela-noite', 'rotina-do-recem-nascido'],
    fontes: ['sfJanela'],
    atualizado: ATUALIZADO,
  },
  {
    slug: 'bebe-trocou-o-dia-pela-noite',
    categoria: 'Sono',
    pergunta: 'Bebê trocou o dia pela noite: o que fazer?',
    titulo: 'Bebê trocou o dia pela noite? O que ajuda',
    descricao:
      'É comum o recém-nascido dormir de dia e ficar acordado à noite. Veja ideias práticas que muitas famílias usam e quando conversar com o pediatra.',
    resumo:
      'É comum nas primeiras semanas: o recém-nascido dorme e acorda em períodos curtos, de dia e de noite, e ainda não diferencia um do outro. Muitas famílias ajudam com luz e barulho normais durante o dia e um ambiente escuro e calmo nas mamadas da noite. Se a troca preocupa ou não melhora, converse com o pediatra.',
    secoes: [
      {
        titulo: 'Ideias que muitas famílias usam durante o dia',
        lista: [
          'Abrir as cortinas e deixar a luz natural entrar',
          'Não exigir silêncio absoluto nas sonecas do dia',
          'Conversar e brincar quando o bebê estiver acordado',
        ],
        notaFonte: 'Dicas práticas de rotina, não orientação médica.',
      },
      {
        titulo: 'Ideias que muitas famílias usam à noite',
        lista: [
          'Luz baixa nas mamadas e nas trocas',
          'Pouca conversa e pouca brincadeira',
          'Voltar para o berço logo depois de mamar e arrotar',
        ],
        notaFonte: 'Dicas práticas de rotina, não orientação médica.',
      },
      {
        titulo: 'Sono seguro vale de dia e de noite',
        paragrafos: [
          'A Sociedade Brasileira de Pediatria orienta que bebês menores de 1 ano durmam de barriga para cima, em berço firme, sem objetos fofos e separado da cama dos pais.',
        ],
        fonte: ['sbpSono'],
      },
      {
        titulo: 'Acompanhe a evolução',
        paragrafos: [
          'Anotar sono e mamadas ajuda a ver a evolução: muitas vezes os períodos da noite já estão ficando mais longos e o cansaço não deixa você perceber. O histórico também ajuda o pediatra a avaliar.',
        ],
      },
    ],
    alerta: 'Converse com o pediatra se o bebê chora sem parar, não consegue mamar, ou se a troca de dia e noite continua por muitas semanas.',
    ninho: {
      titulo: 'Veja a noite melhorando',
      texto: 'No histórico do Ninho, cada dia mostra os sonos e as mamadas em ordem. Com algumas semanas de registro dá para ver se os períodos da noite estão ficando mais longos.',
      tela: '/app/historico.webp',
      alt: 'Histórico do dia no Ninho com horários de sono e mamada',
    },
    faqs: [
      { q: 'Devo acordar o bebê de dia para ele dormir à noite?', a: 'Pergunte ao pediatra do seu filho. O intervalo máximo entre mamadas depende do peso e da idade do bebê.' },
      { q: 'Banho à noite ajuda?', a: 'Muitas famílias usam um banho calmo como parte do ritual da noite. Não é obrigatório: o que costuma ajudar é a repetição do ritual.' },
    ],
    relacionados: ['quanto-tempo-recem-nascido-dorme', 'janela-de-sono-do-bebe', 'rotina-do-recem-nascido'],
    fontes: ['sbpSono'],
    atualizado: ATUALIZADO,
  },

  // ─── MAMADA ────────────────────────────────────────────────────────────
  {
    slug: 'intervalo-entre-mamadas-recem-nascido',
    categoria: 'Mamada',
    pergunta: 'De quanto em quanto tempo o recém-nascido mama?',
    titulo: 'Intervalo entre mamadas do recém-nascido',
    descricao:
      'Segundo a Academia Americana de Pediatria, o recém-nascido amamentado costuma mamar a cada 2 horas, 10 a 12 vezes por dia. Veja a fonte, a orientação da OMS e a mamadeira.',
    resumo:
      'Segundo a Academia Americana de Pediatria (AAP), recém-nascidos amamentados costumam mamar a cada 2 horas (do início de uma mamada ao início da próxima), e 10 a 12 mamadas em 24 horas é o normal. A OMS recomenda amamentar sob livre demanda, ou seja, sempre que o bebê quiser, de dia e de noite. Com fórmula, a AAP diz que a maioria dos recém-nascidos mama a cada 2 a 3 horas.',
    secoes: [
      {
        titulo: 'O que dizem a AAP e a OMS',
        tabela: {
          cabecalho: ['Situação', 'Referência', 'Fonte'],
          linhas: [
            ['Peito, recém-nascido', 'A cada 2 horas; 10 a 12 mamadas em 24 h é o normal', 'AAP'],
            ['Peito, como oferecer', 'Livre demanda: sempre que o bebê quiser, de dia e de noite', 'OMS'],
            ['Fórmula, recém-nascido', 'A cada 2 a 3 horas; no mínimo 8 vezes em 24 h', 'AAP'],
            ['Fórmula, fim do 1º mês', 'Cerca de a cada 3 a 4 horas', 'AAP'],
          ],
        },
        fonte: ['aapMamadas', 'whoAlim'],
        notaFonte: 'Números traduzidos das páginas da AAP e da OMS. Não são recomendação do Ninho. A quantidade e o intervalo certos para o seu bebê são definidos pelo pediatra.',
      },
      {
        titulo: 'Como contar o intervalo entre mamadas',
        paragrafos: [
          'A AAP conta o intervalo do início de uma mamada até o início da próxima. Então, se o bebê começou a mamar às 14h, mamou 30 minutos e voltou a pedir às 16h, o intervalo foi de 2 horas, e não de 1h30.',
        ],
        fonte: ['aapMamadas'],
      },
      {
        titulo: 'Como saber se o bebê está mamando o suficiente',
        paragrafos: [
          'Um dos sinais que a AAP cita são as fraldas: depois dos primeiros 4 a 5 dias, o bebê deve molhar pelo menos 5 a 6 fraldas por dia. O ganho de peso é acompanhado pelo pediatra nas consultas.',
        ],
        fonte: ['aapMamadas'],
      },
    ],
    alerta:
      'Procure o pediatra se o bebê mama muito pouco, está sonolento demais para mamar, molha menos fraldas do que o esperado, ou se você sente dor ao amamentar. Bancos de leite humano também ajudam com a amamentação.',
    ninho: {
      titulo: 'O Ninho mostra quando foi a última mamada',
      texto: 'A tela inicial mostra quanto tempo passou desde a última mamada, e o card Ritmo mostra o intervalo médio entre as mamadas do seu bebê, calculado pelos registros dele, e quando a próxima costuma chegar.',
      itens: ['Peito com lado e duração', 'Mamadeira com ml', 'Intervalo médio do seu bebê e próxima mamada prevista'],
      tela: '/app/home.webp',
      alt: 'Card Ritmo do Ninho mostrando 2h40 entre mamadas e próxima por volta de 09:00',
    },
    faqs: [
      { q: 'Preciso acordar o recém-nascido para mamar?', a: 'Depende do bebê. A AAP comenta que, para bebês com dificuldade de ganhar peso, não se deve esperar demais entre as mamadas, mesmo que seja preciso acordá-los. O intervalo certo para o seu filho é o pediatra quem define.' },
      { q: 'Quantos ml o recém-nascido mama na mamadeira?', a: 'A AAP cita de 1 a 2 onças (cerca de 30 a 60 ml) por mamada depois dos primeiros dias, chegando a 3 ou 4 onças (cerca de 90 a 120 ml) no fim do primeiro mês. A quantidade do seu bebê é definida pelo pediatra; anotar os ml ajuda nessa conversa.' },
    ],
    relacionados: ['como-controlar-as-mamadas-do-bebe', 'qual-peito-o-bebe-mamou-por-ultimo', 'quantas-fraldas-o-recem-nascido-usa-por-dia'],
    fontes: ['aapMamadas', 'whoAlim'],
    atualizado: ATUALIZADO,
  },
  {
    slug: 'como-controlar-as-mamadas-do-bebe',
    categoria: 'Mamada',
    pergunta: 'Como controlar as mamadas do bebê?',
    titulo: 'Como controlar as mamadas do bebê (sem caderno)',
    descricao:
      'Anotar a hora, o lado e a duração de cada mamada ajuda a ver o padrão do bebê e a responder o pediatra. Veja o que anotar e o jeito mais fácil de fazer.',
    resumo:
      'Para controlar as mamadas, anote três coisas: a hora em que começou, o tipo (peito ou mamadeira) e o detalhe (o lado e a duração no peito, ou os ml na mamadeira). Com alguns dias de registro você enxerga o intervalo médio do seu bebê. Um app de rotina faz isso num toque e calcula o intervalo sozinho.',
    secoes: [
      {
        titulo: 'O que anotar em cada mamada',
        tabela: {
          cabecalho: ['Tipo', 'O que registrar', 'Por quê'],
          linhas: [
            ['Peito', 'Hora de início, lado, duração', 'Saber o intervalo e qual peito oferecer na próxima'],
            ['Mamadeira', 'Hora e quantidade em ml', 'Acompanhar quanto o bebê toma por dia'],
            ['Leite materno ordenhado', 'Hora e ml', 'Mesma lógica da mamadeira'],
          ],
        },
      },
      {
        titulo: 'Caderno, planilha ou app?',
        paragrafos: [
          'O caderno funciona enquanto só uma pessoa cuida. Quando o pai, a avó ou a babá entram na rotina, cada um anota num lugar, ou ninguém anota. Planilha no celular é lenta de madrugada. Um app de rotina registra com um toque, guarda a hora sozinho e mostra o mesmo histórico para todos.',
        ],
      },
      {
        titulo: 'Por quanto tempo vale anotar',
        paragrafos: [
          'O controle é mais útil nas primeiras semanas, até o bebê recuperar o peso do nascimento e a amamentação se estabelecer. Muitas famílias continuam porque o registro responde à pergunta que mais se ouve em casa: "que horas ele mamou?".',
        ],
      },
      {
        titulo: 'O que o pediatra costuma perguntar',
        lista: [
          'Quantas vezes o bebê mama em 24 horas',
          'De quanto em quanto tempo',
          'Quanto tempo dura a mamada ou quantos ml',
          'Quantas fraldas molhadas e com cocô por dia',
        ],
      },
    ],
    ninho: {
      titulo: 'Controle de mamadas num toque',
      texto: 'No Ninho, você toca em Peito ou Mamadeira e o registro está feito. O app guarda o lado, a duração e os ml, mostra o resumo do dia e calcula o intervalo médio entre mamadas.',
      itens: ['"Que horas mamou?" respondido na tela inicial', 'Resumo do dia em ml e minutos', 'Todos os cuidadores veem o mesmo histórico'],
      tela: '/app/historico.webp',
      alt: 'Histórico do Ninho com Peito 15min, Mamadeira 120 ml e resumo do dia',
    },
    faqs: [
      { q: 'Preciso anotar mamadas de madrugada?', a: 'Se puder, sim: são as que mais se esquecem. Por isso um registro de um toque, com a tela escura, faz diferença.' },
      { q: 'Controlar a mamada não vai contra a livre demanda?', a: 'Não. Livre demanda é oferecer o peito quando o bebê pede. Anotar só registra o que aconteceu; ninguém precisa seguir um horário fixo.' },
    ],
    relacionados: ['intervalo-entre-mamadas-recem-nascido', 'qual-peito-o-bebe-mamou-por-ultimo', 'o-que-anotar-para-a-consulta-do-pediatra'],
    fontes: ['whoAlim'],
    atualizado: ATUALIZADO,
  },
  {
    slug: 'qual-peito-o-bebe-mamou-por-ultimo',
    categoria: 'Mamada',
    pergunta: 'Como lembrar qual peito o bebê mamou por último?',
    titulo: 'Qual peito o bebê mamou por último? Como lembrar',
    descricao:
      'Truques que as mães usam para lembrar o lado da última mamada, e como um app mostra o próximo peito. Dúvidas sobre amamentação: pediatra ou banco de leite.',
    resumo:
      'Registre o lado no fim de cada mamada: um app de rotina guarda isso e já mostra qual peito oferecer na próxima vez, para você e para quem estiver ajudando. Como alternar os lados e quanto tempo deixar em cada peito são orientações para combinar com o pediatra ou com um banco de leite humano.',
    secoes: [
      {
        titulo: 'Truques que as mães usam',
        lista: [
          'Pulseira ou elástico de cabelo no braço do lado da próxima mamada',
          'Trocar o anel de mão',
          'Anotar no celular, o que também guarda a hora e a duração',
        ],
        notaFonte: 'Dicas práticas de organização, não orientação médica.',
      },
      {
        titulo: 'E a amamentação em si?',
        paragrafos: [
          'A OMS recomenda amamentar sob livre demanda, sempre que o bebê quiser, de dia e de noite. Para dúvidas sobre pega, lado e duração da mamada, procure o pediatra, uma consultora de amamentação ou um banco de leite humano.',
        ],
        fonte: ['whoAlim'],
      },
    ],
    alerta: 'Dor forte, rachaduras, vermelhidão ou febre durante a amamentação são motivo para procurar o pediatra, o obstetra ou um banco de leite humano.',
    ninho: {
      titulo: 'O Ninho já mostra o próximo lado',
      texto: 'Ao registrar o peito, você escolhe esquerdo ou direito. No card Ritmo aparece o último lado e o próximo, para você e para quem estiver ajudando.',
      tela: '/app/home.webp',
      alt: 'Card Ritmo do Ninho com último lado Esquerdo e próximo direito',
    },
    faqs: [
      { q: 'Preciso oferecer os dois peitos em toda mamada?', a: 'Essa é uma dúvida para o pediatra ou para um profissional de amamentação, que avalia o seu caso.' },
    ],
    relacionados: ['como-controlar-as-mamadas-do-bebe', 'intervalo-entre-mamadas-recem-nascido', 'rotina-do-recem-nascido'],
    fontes: ['whoAlim'],
    atualizado: ATUALIZADO,
  },

  // ─── FRALDA ────────────────────────────────────────────────────────────
  {
    slug: 'quantas-fraldas-o-recem-nascido-usa-por-dia',
    categoria: 'Fralda',
    pergunta: 'Quantas fraldas o recém-nascido suja por dia?',
    titulo: 'Quantas fraldas o recém-nascido molha por dia?',
    descricao:
      'Segundo a Academia Americana de Pediatria, depois dos primeiros 4 a 5 dias o bebê deve molhar pelo menos 5 a 6 fraldas por dia. Veja a fonte e o que observar.',
    resumo:
      'Segundo a Academia Americana de Pediatria (AAP), nos primeiros dias depois do nascimento o bebê deve molhar 2 a 3 fraldas por dia e, depois dos primeiros 4 a 5 dias, pelo menos 5 a 6 fraldas por dia. Números diferentes disso são motivo para falar com o pediatra.',
    secoes: [
      {
        titulo: 'Fraldas molhadas, segundo a AAP',
        tabela: {
          cabecalho: ['Período', 'Fraldas molhadas por dia'],
          linhas: [
            ['Primeiros dias depois do nascimento', '2 a 3'],
            ['Depois dos primeiros 4 a 5 dias', 'Pelo menos 5 a 6'],
          ],
        },
        fonte: ['aapMamadas'],
        notaFonte: 'Números traduzidos da página da AAP. Não são recomendação do Ninho.',
      },
      {
        titulo: 'Xixi e cocô: o que a AAP descreve',
        lista: [
          'Nos primeiros dias, o cocô é o mecônio (escuro e pegajoso); depois de eliminado, fica amarelo-esverdeado.',
          'No bebê amamentado, o cocô logo fica amarelo e líquido, com grumos que lembram sementinhas.',
          'No bebê que toma fórmula, costuma ser bege ou amarelo.',
          'Na primeira semana pode aparecer uma mancha rosada ou cor de tijolo na fralda, que costuma ser confundida com sangue.',
        ],
        fonte: ['aapXixi'],
      },
      {
        titulo: 'Por que contar fraldas',
        paragrafos: [
          'Nas primeiras semanas, as fraldas são uma forma simples de acompanhar se o bebê está mamando o suficiente. É por isso que o pediatra costuma perguntar quantas fraldas o bebê molhou nas últimas 24 horas.',
        ],
      },
    ],
    alerta:
      'A AAP orienta procurar o pediatra se houver sangue de verdade no xixi ou no cocô (diz que nunca é normal), se a mancha rosada continuar, se houver febre em bebê com menos de 3 meses, ou se o bebê molhar menos fraldas do que o esperado.',
    ninho: {
      titulo: 'Fraldas contadas sem esforço',
      texto: 'No Ninho, um toque em Fralda registra xixi, cocô ou os dois. O resumo do dia mostra quantas fraldas foram trocadas, e todos os cuidadores somam no mesmo lugar.',
      tela: '/app/historico.webp',
      alt: 'Histórico do Ninho com registro de Fralda Xixi e resumo do dia com 1 fralda',
    },
    faqs: [
      { q: 'Bebê que mama no peito pode ficar dias sem fazer cocô?', a: 'Isso muda com a idade do bebê e deve ser avaliado pelo pediatra. Na dúvida, leve o registro das fraldas dos últimos dias para a consulta.' },
    ],
    relacionados: ['intervalo-entre-mamadas-recem-nascido', 'o-que-anotar-para-a-consulta-do-pediatra', 'rotina-do-recem-nascido'],
    fontes: ['aapMamadas', 'aapXixi'],
    atualizado: ATUALIZADO,
  },

  // ─── ROTINA ────────────────────────────────────────────────────────────
  {
    slug: 'rotina-do-recem-nascido',
    categoria: 'Rotina',
    pergunta: 'Como montar uma rotina para o recém-nascido?',
    titulo: 'Rotina do recém-nascido: como montar sem horário fixo',
    descricao:
      'Recém-nascido não segue horário, mas tem um ritmo: mamar, ficar acordado um pouco e dormir. Veja como observar esse ciclo e organizar o dia da casa.',
    resumo:
      'Nas primeiras semanas, a rotina do recém-nascido é um ciclo que se repete muitas vezes por dia: mamar, ficar acordado um pouco e dormir. A OMS recomenda amamentar sob livre demanda, sem horário fixo. Em vez de impor horários, observe esse ciclo por alguns dias: o padrão que aparecer é a rotina do seu bebê, e ela muda com o tempo.',
    secoes: [
      {
        titulo: 'O ciclo mamar, acordar, dormir',
        paragrafos: [
          'Segundo a AAP, recém-nascidos amamentados costumam mamar a cada 2 horas. Entre uma mamada e outra, o bebê fica acordado por pouco tempo (troca de fralda, colo, conversa) e volta a dormir. A Sleep Foundation estima esse tempo acordado entre 30 minutos e 1h30 no primeiro mês; é uma estimativa de site de informação, não uma regra.',
        ],
        fonte: ['aapMamadas', 'sfJanela'],
      },
      {
        titulo: 'Exemplo ilustrativo de um dia',
        tabela: {
          cabecalho: ['Horário aproximado', 'O que pode acontecer'],
          linhas: [
            ['06:00', 'Mamada, fralda, um pouco acordado'],
            ['07:00', 'Soneca'],
            ['08:00', 'Mamada, fralda, colo'],
            ['…', 'O ciclo se repete ao longo do dia e da noite'],
            ['Noite', 'Mamadas com luz baixa e volta direta ao berço'],
          ],
        },
        notaFonte: 'Exemplo inventado só para mostrar a lógica do ciclo. Não é uma recomendação de horário, nem do Ninho nem de nenhuma entidade. Cada bebê tem o seu ritmo.',
      },
      {
        titulo: 'O que ajuda a casa a funcionar',
        lista: [
          'Combinar turnos à noite entre os adultos',
          'Deixar tudo anotado num lugar que todos vejam',
          'Aproveitar as sonecas para comer e descansar',
          'Aceitar ajuda dos avós e amigos com as tarefas da casa',
        ],
        notaFonte: 'Dicas práticas de organização da casa.',
      },
    ],
    ninho: {
      titulo: 'Deixe o Ninho mostrar o ritmo do seu bebê',
      texto: 'Registre por alguns dias e o card Ritmo mostra a janela de sono, o intervalo entre mamadas e quando a próxima soneca e a próxima mamada costumam acontecer, sempre pelos registros do seu bebê.',
      tela: '/app/home.webp',
      alt: 'Tela inicial do Ninho com o Ritmo da Helena e o resumo de hoje',
    },
    faqs: [
      { q: 'Dá para colocar o recém-nascido em horário fixo de mamada?', a: 'Para bebês amamentados, a OMS recomenda a livre demanda, sem horário fixo. Com fórmula, siga a orientação do pediatra.' },
    ],
    relacionados: ['janela-de-sono-do-bebe', 'intervalo-entre-mamadas-recem-nascido', 'como-dividir-os-cuidados-do-bebe'],
    fontes: ['aapMamadas', 'whoAlim', 'sfJanela'],
    atualizado: ATUALIZADO,
  },
  {
    slug: 'como-dividir-os-cuidados-do-bebe',
    categoria: 'Rotina',
    pergunta: 'Como dividir os cuidados do bebê entre o casal, avós e babá?',
    titulo: 'Como dividir os cuidados do bebê em casa',
    descricao:
      'Turnos na madrugada, um lugar só para anotar e combinados claros. Veja como dividir mamadas, fraldas e sonecas entre o casal, os avós e a babá.',
    resumo:
      'Divida por turnos e por tarefas, e deixe tudo registrado num lugar que todos vejam. O combinado mais útil é o da madrugada (quem acorda em qual horário), e a ferramenta mais útil é um registro compartilhado, para ninguém precisar perguntar "ele já mamou?" quando assume o bebê.',
    secoes: [
      {
        titulo: 'Combinados que funcionam',
        lista: [
          'Turnos de madrugada: um adulto até as 2h, outro depois, para cada um dormir um bloco seguido',
          'Se a mãe amamenta, o outro cuida da fralda, do arroto e de colocar o bebê de volta no berço',
          'Uma pessoa fica com o bebê enquanto a outra dorme de verdade, em outro cômodo',
          'Tarefas fixas: quem dá banho, quem cuida das roupas, quem faz as compras',
        ],
      },
      {
        titulo: 'Passagem de turno sem ruído',
        paragrafos: [
          'Quem assume precisa saber em segundos: quando foi a última mamada e de que lado, há quanto tempo o bebê está acordado e quando foi a última fralda. Se essa informação está na cabeça de uma pessoa só, ela nunca descansa.',
        ],
      },
      {
        titulo: 'Com avós e babá',
        paragrafos: [
          'Avós e babás ficam mais tranquilos quando enxergam o dia do bebê e podem registrar o que fizeram. E os pais, no trabalho, sabem como o bebê está sem precisar ligar.',
        ],
      },
    ],
    ninho: {
      titulo: 'Todo mundo que cuida, no mesmo Ninho',
      texto: 'Convide pai, mãe, avós ou babá por e-mail. Cada um registra do próprio celular e todos veem o mesmo dia, na hora. Uma assinatura cobre todos os cuidadores do mesmo bebê.',
      itens: ['Convite com a relação com o bebê (mãe, pai, avó/avô, babá)', 'iPhone e Android no mesmo bebê', 'Histórico e Ritmo iguais para todos'],
      tela: '/app/cuidadores.webp',
      alt: 'Tela Convidar cuidador do Ninho com nome, e-mail e relação com o bebê',
    },
    faqs: [
      { q: 'Cada cuidador precisa pagar?', a: 'No Ninho, não. Uma assinatura vale para todos os cuidadores do mesmo bebê.' },
      { q: 'A babá vê tudo do app?', a: 'O cuidador convidado vê e registra a rotina do bebê para o qual foi convidado.' },
    ],
    relacionados: ['rotina-do-recem-nascido', 'como-funciona-o-app-ninho', 'como-controlar-as-mamadas-do-bebe'],
    fontes: [],
    atualizado: ATUALIZADO,
  },
  {
    slug: 'o-que-anotar-para-a-consulta-do-pediatra',
    categoria: 'Rotina',
    pergunta: 'O que anotar para levar na consulta do pediatra?',
    titulo: 'O que anotar para a consulta do pediatra do bebê',
    descricao:
      'Mamadas, sono, fraldas e dúvidas: veja a lista do que anotar antes da consulta de rotina do bebê para aproveitar melhor o tempo com o pediatra.',
    resumo:
      'Leve um resumo dos últimos dias: quantas mamadas por dia e de quanto em quanto tempo, quantos ml (se usa mamadeira), quanto o bebê dorme, quantas fraldas molha e suja, remédios que tomou e as dúvidas escritas. Com isso a consulta fica mais objetiva e nada importante é esquecido.',
    secoes: [
      {
        titulo: 'Lista para a consulta',
        lista: [
          'Mamadas: quantas por dia, intervalo médio, duração ou ml',
          'Sono: total por dia, sonecas, como estão as noites',
          'Fraldas: quantas molhadas e com cocô por dia, cor e consistência',
          'Remédios e vitaminas: nome, dose e horário que foram dados',
          'Algo diferente: febre, vômitos, manchas na pele, choro fora do comum',
          'Suas dúvidas, escritas antes (na consulta a gente esquece)',
          'A Caderneta da Criança, para o registro de peso, altura e vacinas',
        ],
      },
      {
        titulo: 'Por que anotar ajuda',
        paragrafos: [
          'Na consulta, é comum responder "acho que umas 8 vezes" ou "dorme bem, eu acho". Com os números dos últimos dias, o pediatra enxerga o padrão real e você sai com orientações mais precisas.',
        ],
      },
    ],
    ninho: {
      titulo: 'O histórico do Ninho vai com você',
      texto: 'No Ninho, o histórico por dia mostra cada mamada, sono e fralda, e o calendário guarda a data da consulta. Você também pode perguntar ao assistente (Premium), por exemplo, "qual a média de intervalo das sonecas?".',
      tela: '/app/calendario.webp',
      alt: 'Calendário do Ninho com a consulta do pediatra marcada',
    },
    faqs: [
      { q: 'O Ninho substitui a Caderneta da Criança?', a: 'Não. A Caderneta é o documento oficial de vacinas e crescimento. O Ninho cuida da rotina do dia a dia e ajuda a levar essas informações para a consulta.' },
    ],
    relacionados: ['como-controlar-as-mamadas-do-bebe', 'quantas-fraldas-o-recem-nascido-usa-por-dia', 'quanto-tempo-recem-nascido-dorme'],
    fontes: ['msCaderneta'],
    atualizado: ATUALIZADO,
  },
];

export function guiaPorSlug(slug: string): Guia | undefined {
  return GUIAS.find((g) => g.slug === slug);
}

export const CATEGORIAS: Categoria[] = ['Sono', 'Mamada', 'Fralda', 'Rotina', 'O app Ninho'];
