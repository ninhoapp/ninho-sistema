/**
 * Conteúdo do /guia — páginas de pergunta e resposta para quem pesquisa no
 * Google ou pergunta a uma IA sobre a rotina do recém-nascido.
 *
 * Regras do conteúdo (mesmas da loja, ver Ninho-expo/marketing/loja/textos-app-store.md):
 * - Sem promessa de saúde. O Ninho organiza; quem orienta é o pediatra.
 * - A previsão "costuma", nunca "garante".
 * - Só citar recurso que o app TEM hoje (a tela de Saúde, com vacinas,
 *   alergias e curva de crescimento, saiu em 18/10/2026).
 * - Números de referência só de fonte reconhecida (SBP, OMS, Ministério da
 *   Saúde, AAP), sempre com "cada bebê é um".
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
  /** Resposta direta, 2 a 3 frases. */
  resumo: string;
  secoes: Secao[];
  /** Quando procurar o pediatra (opcional, aparece em destaque). */
  alerta?: string;
  ninho: { titulo: string; texto: string; itens?: string[]; tela: string; alt: string };
  faqs: { q: string; a: string }[];
  relacionados: string[];
  fontes: FonteKey[];
  atualizado: string; // AAAA-MM-DD
}

export type FonteKey = 'sbp' | 'oms' | 'ms' | 'aap' | 'nsf';

export const FONTES: Record<FonteKey, { nome: string; url: string }> = {
  sbp: { nome: 'Sociedade Brasileira de Pediatria (SBP)', url: 'https://www.sbp.com.br' },
  oms: { nome: 'Organização Mundial da Saúde (OMS)', url: 'https://www.who.int' },
  ms: { nome: 'Ministério da Saúde — Caderneta da Criança', url: 'https://www.gov.br/saude' },
  aap: { nome: 'American Academy of Pediatrics (HealthyChildren.org)', url: 'https://www.healthychildren.org' },
  nsf: { nome: 'National Sleep Foundation', url: 'https://www.thensf.org' },
};

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
      'Recém-nascidos costumam dormir de 14 a 17 horas por dia, em períodos curtos de dia e de noite. Veja o que é esperado por idade e como acompanhar.',
    resumo:
      'Nos primeiros 3 meses, a referência é de 14 a 17 horas de sono a cada 24 horas, divididas em vários períodos de 1 a 4 horas, de dia e de noite. O recém-nascido ainda não distingue dia e noite e acorda para mamar. Cada bebê é um: alguns dormem um pouco menos ou um pouco mais e estão bem.',
    secoes: [
      {
        titulo: 'Sono por idade (referência para 24 horas)',
        tabela: {
          cabecalho: ['Idade', 'Total de sono em 24 h', 'Como costuma ser'],
          linhas: [
            ['0 a 3 meses', '14 a 17 horas', 'Vários períodos curtos, dia e noite, entre as mamadas'],
            ['4 a 11 meses', '12 a 15 horas', 'Noite mais longa e 2 a 4 sonecas durante o dia'],
            ['1 a 2 anos', '11 a 14 horas', 'Noite longa e 1 ou 2 sonecas'],
          ],
        },
        paragrafos: ['Faixas recomendadas pela National Sleep Foundation e usadas como referência por sociedades de pediatria. São médias, não metas.'],
      },
      {
        titulo: 'Por que o recém-nascido acorda tanto',
        paragrafos: [
          'O estômago é pequeno, então ele precisa mamar com frequência, inclusive de madrugada. Além disso, o relógio biológico (ritmo circadiano) ainda está se formando: é comum que só entre a 6ª e a 12ª semana o bebê comece a dormir períodos mais longos à noite.',
        ],
      },
      {
        titulo: 'Sono seguro',
        lista: [
          'Sempre de barriga para cima, no berço ou no moisés.',
          'Colchão firme, sem travesseiro, protetor, bichinhos ou cobertas soltas.',
          'No quarto dos pais, mas na superfície dele, de preferência nos primeiros meses.',
          'Sem cigarro por perto e sem superaquecer o bebê.',
        ],
      },
      {
        titulo: 'Como saber se o seu bebê está dormindo o suficiente',
        paragrafos: [
          'Mais do que o total exato, observe o conjunto: o bebê mama bem, molha as fraldas, ganha peso nas consultas e tem momentos acordado e tranquilo. Anotar o sono por alguns dias mostra o padrão real, e esse histórico ajuda muito na conversa com o pediatra.',
        ],
      },
    ],
    alerta:
      'Procure o pediatra se o bebê estiver muito sonolento e difícil de acordar para mamar, com febre, recusando mamadas ou molhando menos fraldas do que o habitual.',
    ninho: {
      titulo: 'Veja quanto o seu bebê dormiu hoje',
      texto: 'No Ninho, um toque começa e outro termina o sono. O resumo do dia soma as horas, e o card Ritmo mostra a janela de sono do seu bebê.',
      itens: ['Total de sono do dia no resumo', 'Histórico por dia para levar ao pediatra', 'No iPhone, cronômetro do sono na tela bloqueada'],
      tela: '/app/live.webp',
      alt: 'Cronômetro do sono noturno do Ninho na tela bloqueada do iPhone',
    },
    faqs: [
      { q: 'Recém-nascido pode dormir 5 horas seguidas?', a: 'Alguns dormem, principalmente depois das primeiras semanas. Nos primeiros dias, muitos pediatras orientam acordar o bebê para mamar se passar de 3 a 4 horas. Confirme com o pediatra do seu filho, que conhece o peso e a história dele.' },
      { q: 'Quando o bebê começa a dormir a noite toda?', a: 'Não há uma idade certa. Muitos bebês começam a fazer um período longo à noite entre 3 e 6 meses, mas acordar à noite no primeiro ano é comum e esperado.' },
      { q: 'É normal o recém-nascido dormir o dia todo?', a: 'Nas primeiras semanas, sim: ele passa a maior parte do dia dormindo e acorda para mamar. O que merece atenção é sonolência a ponto de não conseguir mamar.' },
    ],
    relacionados: ['janela-de-sono-do-bebe', 'bebe-trocou-o-dia-pela-noite', 'rotina-do-recem-nascido'],
    fontes: ['nsf', 'sbp', 'aap'],
    atualizado: ATUALIZADO,
  },
  {
    slug: 'janela-de-sono-do-bebe',
    categoria: 'Sono',
    pergunta: 'O que é janela de sono e qual a do meu bebê?',
    titulo: 'Janela de sono do bebê: o que é e tabela por idade',
    descricao:
      'Janela de sono é o tempo que o bebê fica acordado entre um sono e outro. Veja as faixas comuns por idade, os sinais de sono e como descobrir a do seu bebê.',
    resumo:
      'Janela de sono é o tempo que o bebê consegue ficar acordado entre um sono e outro antes de ficar cansado demais. No recém-nascido ela é curta, perto de 45 a 60 minutos, e vai aumentando com os meses. A melhor referência é o próprio bebê: os sinais de sono e o padrão que aparece nos registros dos últimos dias.',
    secoes: [
      {
        titulo: 'Janelas de sono comuns por idade',
        tabela: {
          cabecalho: ['Idade', 'Tempo acordado (aproximado)'],
          linhas: [
            ['0 a 1 mês', '35 a 60 minutos'],
            ['1 a 2 meses', '1h a 1h30'],
            ['3 a 4 meses', '1h15 a 2h'],
            ['5 a 7 meses', '2h a 3h'],
            ['8 a 12 meses', '2h30 a 4h'],
          ],
        },
        paragrafos: [
          'Essas faixas são referências usadas por consultoras de sono e pediatras, não regras. Bebês da mesma idade podem ter janelas bem diferentes.',
        ],
      },
      {
        titulo: 'Sinais de que o bebê está ficando com sono',
        lista: [
          'Olhar perdido, desvia o olhar de rostos e brinquedos',
          'Esfrega os olhos ou as orelhas',
          'Boceja, fica mais quieto ou mais irritado',
          'Pálpebras pesadas, sobrancelhas avermelhadas',
          'Choro que não passa com mamada nem colo (pode ser cansaço demais)',
        ],
      },
      {
        titulo: 'Como descobrir a janela do seu bebê',
        paragrafos: [
          'Anote, por 3 a 5 dias, a hora em que o bebê acorda e a hora em que adormece de novo. A diferença entre os dois é a janela. Quando o mesmo intervalo se repete, você passa a preparar o sono (fralda, quarto escuro, colo) alguns minutos antes, e não depois que o choro começa.',
        ],
      },
    ],
    ninho: {
      titulo: 'O Ninho calcula a janela de sono por você',
      texto: 'Com os registros de sono dos últimos dias, o card Ritmo mostra a janela de sono do seu bebê e o horário em que a próxima soneca costuma acontecer. Com poucos dias de registro, ele avisa em vez de chutar.',
      itens: ['Janela de sono calculada pelos seus registros', 'Aviso antes da próxima soneca', 'Muda junto com o bebê, semana a semana'],
      tela: '/app/home.webp',
      alt: 'Card Ritmo do Ninho mostrando janela de sono de 50 minutos e soneca entre 07:35 e 07:55',
    },
    faqs: [
      { q: 'Janela de sono vale para a noite também?', a: 'A janela é mais útil durante o dia, entre as sonecas. A última janela antes do sono da noite costuma ser a mais longa do dia.' },
      { q: 'E se o bebê passar da janela?', a: 'Ele pode ficar agitado e demorar mais para dormir. Não é grave: acalme, diminua os estímulos e tente de novo. No dia seguinte, comece a preparar o sono um pouco antes.' },
      { q: 'Precisa seguir a tabela à risca?', a: 'Não. A tabela é ponto de partida. O que vale é o seu bebê: os sinais de sono e o padrão que aparece nos registros.' },
    ],
    relacionados: ['quanto-tempo-recem-nascido-dorme', 'bebe-trocou-o-dia-pela-noite', 'rotina-do-recem-nascido'],
    fontes: ['sbp', 'aap'],
    atualizado: ATUALIZADO,
  },
  {
    slug: 'bebe-trocou-o-dia-pela-noite',
    categoria: 'Sono',
    pergunta: 'Bebê trocou o dia pela noite: o que fazer?',
    titulo: 'Bebê trocou o dia pela noite? O que ajuda',
    descricao:
      'É comum o recém-nascido dormir de dia e ficar acordado à noite. Entenda por que acontece e o que ajuda o bebê a diferenciar dia e noite.',
    resumo:
      'É comum e costuma passar sozinho: o recém-nascido ainda não tem o relógio biológico formado e só começa a diferenciar dia e noite entre a 6ª e a 12ª semana. Dá para ajudar com luz e barulho normais durante o dia, e escuro, silêncio e pouca conversa nas mamadas da noite.',
    secoes: [
      {
        titulo: 'Por que acontece',
        paragrafos: [
          'Na barriga, o bebê era embalado pelo movimento da mãe durante o dia e ficava mais ativo à noite, quando ela descansava. Depois do nascimento, o corpo dele ainda não produz melatonina no ritmo do dia e da noite. Esse ritmo amadurece nas primeiras semanas, com a ajuda da luz do dia e da rotina da casa.',
        ],
      },
      {
        titulo: 'O que ajuda durante o dia',
        lista: [
          'Abrir as cortinas e deixar a luz natural entrar',
          'Não precisa de silêncio absoluto nas sonecas do dia',
          'Conversar, brincar e mostrar o rosto quando ele estiver acordado',
          'Oferecer as mamadas normalmente, sem deixar intervalos muito longos de dia',
        ],
      },
      {
        titulo: 'O que ajuda à noite',
        lista: [
          'Luz baixa e quente nas mamadas e trocas',
          'Pouca conversa e pouca brincadeira',
          'Trocar a fralda só quando precisar',
          'Voltar para o berço logo depois de mamar e arrotar',
        ],
      },
      {
        titulo: 'Quanto tempo leva',
        paragrafos: [
          'Para a maioria dos bebês, a melhora aparece em algumas semanas. Anotar sono e mamadas ajuda a ver a evolução: muitas vezes os períodos da noite já estão ficando mais longos e o cansaço não deixa você perceber.',
        ],
      },
    ],
    alerta: 'Converse com o pediatra se o bebê chora sem parar, não consegue mamar ou se a troca de dia e noite continua depois dos 3 a 4 meses.',
    ninho: {
      titulo: 'Veja a noite melhorando',
      texto: 'No histórico do Ninho, cada dia mostra os sonos e as mamadas em ordem. Em poucas semanas dá para ver os períodos da noite ficando mais longos.',
      tela: '/app/historico.webp',
      alt: 'Histórico do dia no Ninho com horários de sono e mamada',
    },
    faqs: [
      { q: 'Devo acordar o bebê de dia para ele dormir à noite?', a: 'Nas primeiras semanas, muitos pediatras orientam não deixar o bebê passar de 3 a 4 horas sem mamar durante o dia. Pergunte ao pediatra do seu filho qual o intervalo ideal para ele.' },
      { q: 'Banho à noite ajuda?', a: 'Para muitos bebês, um banho morno e calmo faz parte de um ritual que sinaliza a noite. Não é obrigatório: o que ajuda é a repetição do ritual.' },
    ],
    relacionados: ['quanto-tempo-recem-nascido-dorme', 'janela-de-sono-do-bebe', 'rotina-do-recem-nascido'],
    fontes: ['sbp', 'aap'],
    atualizado: ATUALIZADO,
  },

  // ─── MAMADA ────────────────────────────────────────────────────────────
  {
    slug: 'intervalo-entre-mamadas-recem-nascido',
    categoria: 'Mamada',
    pergunta: 'De quanto em quanto tempo o recém-nascido mama?',
    titulo: 'Intervalo entre mamadas do recém-nascido',
    descricao:
      'O recém-nascido costuma mamar de 8 a 12 vezes em 24 horas, a cada 1h30 a 3h. Veja como contar o intervalo, sinais de fome e como acompanhar.',
    resumo:
      'Um recém-nascido em aleitamento materno costuma mamar de 8 a 12 vezes em 24 horas, o que dá um intervalo médio de 1h30 a 3 horas. A recomendação da OMS e da SBP é a livre demanda: oferecer o peito sempre que o bebê mostrar fome, sem horário fixo. Com mamadeira, os intervalos tendem a ser um pouco maiores, de 3 a 4 horas.',
    secoes: [
      {
        titulo: 'Como contar o intervalo entre mamadas',
        paragrafos: [
          'O intervalo é contado do início de uma mamada até o início da próxima. Então, se o bebê começou a mamar às 14h, mamou 30 minutos e voltou a pedir às 16h, o intervalo foi de 2 horas, e não de 1h30.',
        ],
      },
      {
        titulo: 'Sinais de fome (antes do choro)',
        lista: [
          'Leva as mãos à boca ou chupa os dedos',
          'Vira a cabeça procurando o peito (reflexo de busca)',
          'Abre a boca, estala os lábios, põe a língua para fora',
          'Fica inquieto e se mexe mais',
          'O choro costuma ser um sinal tardio de fome',
        ],
      },
      {
        titulo: 'Mamadas em cachos (cluster feeding)',
        paragrafos: [
          'Em alguns momentos, principalmente no fim da tarde e nos picos de crescimento, o bebê pede para mamar muitas vezes seguidas, com intervalos de 30 a 60 minutos. É comum e costuma durar alguns dias.',
        ],
      },
      {
        titulo: 'Como saber se o bebê está mamando o suficiente',
        lista: [
          'Depois do 5º dia, molha pelo menos 6 fraldas por dia',
          'Faz cocô com regularidade nas primeiras semanas',
          'Ganha peso nas consultas de acompanhamento',
          'Fica satisfeito depois das mamadas na maior parte das vezes',
        ],
      },
    ],
    alerta:
      'Procure o pediatra se o bebê mama muito pouco, está sonolento demais para mamar, molha menos fraldas ou se você está com dor ao amamentar. Bancos de leite e consultoras de amamentação também ajudam.',
    ninho: {
      titulo: 'O Ninho mostra quando foi a última mamada',
      texto: 'A tela inicial mostra quanto tempo passou desde a última mamada, e o card Ritmo mostra o intervalo médio entre mamadas do seu bebê e o horário em que a próxima costuma chegar.',
      itens: ['Peito com lado e duração', 'Mamadeira com ml', 'Intervalo médio entre mamadas e próxima mamada prevista'],
      tela: '/app/home.webp',
      alt: 'Card Ritmo do Ninho mostrando 2h40 entre mamadas e próxima por volta de 09:00',
    },
    faqs: [
      { q: 'Preciso acordar o recém-nascido para mamar?', a: 'Nas primeiras semanas, muitos pediatras orientam não deixar passar de 3 a 4 horas sem mamar, até o bebê recuperar o peso do nascimento. Depois disso, siga a orientação do pediatra do seu filho.' },
      { q: 'Quanto tempo dura cada mamada no peito?', a: 'Varia muito, de 10 a 40 minutos. Mais importante que o relógio é deixar o bebê esvaziar bem um peito antes de oferecer o outro.' },
      { q: 'Quantos ml o recém-nascido mama na mamadeira?', a: 'A quantidade muda muito nas primeiras semanas e depende do peso do bebê. Quem define é o pediatra; anotar os ml de cada mamadeira ajuda nessa conversa.' },
    ],
    relacionados: ['como-controlar-as-mamadas-do-bebe', 'qual-peito-o-bebe-mamou-por-ultimo', 'quantas-fraldas-o-recem-nascido-usa-por-dia'],
    fontes: ['oms', 'sbp', 'ms', 'aap'],
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
    fontes: ['oms', 'sbp'],
    atualizado: ATUALIZADO,
  },
  {
    slug: 'qual-peito-o-bebe-mamou-por-ultimo',
    categoria: 'Mamada',
    pergunta: 'Como lembrar qual peito o bebê mamou por último?',
    titulo: 'Qual peito o bebê mamou por último? Como lembrar',
    descricao:
      'Alternar o peito em que a mamada começa ajuda a esvaziar as duas mamas. Veja truques para lembrar o lado e como um app mostra o próximo peito.',
    resumo:
      'Comece cada mamada pelo peito em que a anterior terminou, ou pelo que ficou para trás, alternando os lados. Para não esquecer, registre o lado no fim de cada mamada: um app de rotina guarda isso e já mostra qual peito oferecer na próxima vez.',
    secoes: [
      {
        titulo: 'Por que alternar os peitos',
        paragrafos: [
          'Alternar o lado em que a mamada começa ajuda a esvaziar bem as duas mamas, o que mantém a produção de leite equilibrada e diminui o risco de ingurgitamento (peito empedrado). O ideal é deixar o bebê esvaziar bem um peito antes de oferecer o outro.',
        ],
      },
      {
        titulo: 'Truques que as mães usam',
        lista: [
          'Pulseira ou elástico de cabelo no braço do lado da próxima mamada',
          'Trocar o anel de mão',
          'Sentir qual peito está mais cheio',
          'Anotar no celular, o que também guarda a hora e a duração',
        ],
      },
    ],
    alerta: 'Dor forte, rachaduras, vermelhidão ou febre durante a amamentação são motivo para procurar o pediatra, o obstetra ou um banco de leite.',
    ninho: {
      titulo: 'O Ninho já mostra o próximo lado',
      texto: 'Ao registrar o peito, você escolhe esquerdo ou direito. No card Ritmo aparece o último lado e o próximo a oferecer, para você e para quem estiver ajudando.',
      tela: '/app/home.webp',
      alt: 'Card Ritmo do Ninho com último lado Esquerdo e próximo direito',
    },
    faqs: [
      { q: 'Preciso oferecer os dois peitos em toda mamada?', a: 'Nem sempre. Muitos bebês ficam satisfeitos com um só. Ofereça o segundo se o bebê ainda mostrar fome depois de esvaziar o primeiro.' },
      { q: 'É normal um peito produzir mais que o outro?', a: 'É comum ter alguma diferença. Se ela for grande ou vier com dor, converse com um profissional de amamentação.' },
    ],
    relacionados: ['como-controlar-as-mamadas-do-bebe', 'intervalo-entre-mamadas-recem-nascido', 'rotina-do-recem-nascido'],
    fontes: ['sbp', 'ms'],
    atualizado: ATUALIZADO,
  },

  // ─── FRALDA ────────────────────────────────────────────────────────────
  {
    slug: 'quantas-fraldas-o-recem-nascido-usa-por-dia',
    categoria: 'Fralda',
    pergunta: 'Quantas fraldas o recém-nascido suja por dia?',
    titulo: 'Quantas fraldas o recém-nascido usa por dia?',
    descricao:
      'A partir do 5º dia, o recém-nascido costuma molhar pelo menos 6 fraldas por dia. Veja a referência por dia de vida e o que observar no xixi e no cocô.',
    resumo:
      'Nos primeiros dias, o número de fraldas molhadas sobe junto com os dias de vida: 1 no primeiro dia, 2 no segundo e assim por diante. A partir do 5º ou 6º dia, a referência é de pelo menos 6 fraldas molhadas por dia, com xixi claro. Na prática, muitas famílias trocam de 8 a 12 fraldas por dia no primeiro mês.',
    secoes: [
      {
        titulo: 'Fraldas molhadas por dia de vida (referência)',
        tabela: {
          cabecalho: ['Dia de vida', 'Fraldas molhadas (mínimo)', 'Cocô'],
          linhas: [
            ['1º dia', '1', 'Mecônio, escuro e pegajoso'],
            ['2º dia', '2', 'Mecônio'],
            ['3º dia', '3', 'Fezes de transição, esverdeadas'],
            ['4º dia', '4', 'Ficando amareladas'],
            ['5º dia em diante', '6 ou mais', 'Amarelas e moles (no aleitamento materno)'],
          ],
        },
      },
      {
        titulo: 'O que observar',
        lista: [
          'Xixi claro ou amarelo bem claro é bom sinal de hidratação',
          'Cristais alaranjados na fralda podem aparecer nos primeiros dias',
          'No aleitamento materno, o cocô costuma ser amarelo, mole e com "grumos"',
          'Com fórmula, o cocô tende a ser mais firme e menos frequente',
        ],
      },
      {
        titulo: 'Por que contar fraldas',
        paragrafos: [
          'Nas primeiras semanas, as fraldas são uma das formas mais simples de saber se o bebê está mamando o suficiente. É por isso que o pediatra costuma perguntar quantas fraldas o bebê molhou nas últimas 24 horas.',
        ],
      },
    ],
    alerta:
      'Procure o pediatra se o bebê molhar menos fraldas do que o esperado, se o xixi estiver escuro, se houver sangue nas fezes, cocô branco ou acinzentado, ou se o bebê estiver muito sonolento.',
    ninho: {
      titulo: 'Fraldas contadas sem esforço',
      texto: 'No Ninho, um toque em Fralda registra xixi, cocô ou os dois. O resumo do dia mostra quantas fraldas foram trocadas, e todos os cuidadores somam no mesmo lugar.',
      tela: '/app/historico.webp',
      alt: 'Histórico do Ninho com registro de Fralda Xixi e resumo do dia com 1 fralda',
    },
    faqs: [
      { q: 'Quantas fraldas comprar para o primeiro mês?', a: 'Como a troca pode passar de 8 a 12 por dia, muitas famílias calculam entre 250 e 350 fraldas no primeiro mês. O tamanho RN dura pouco: vale não estocar demais.' },
      { q: 'Bebê que mama no peito pode ficar dias sem fazer cocô?', a: 'Depois das primeiras semanas, alguns bebês em aleitamento exclusivo ficam alguns dias sem evacuar e estão bem. Nas primeiras semanas, porém, o cocô frequente é esperado. Na dúvida, fale com o pediatra.' },
    ],
    relacionados: ['intervalo-entre-mamadas-recem-nascido', 'o-que-anotar-para-a-consulta-do-pediatra', 'rotina-do-recem-nascido'],
    fontes: ['aap', 'sbp', 'ms'],
    atualizado: ATUALIZADO,
  },

  // ─── ROTINA ────────────────────────────────────────────────────────────
  {
    slug: 'rotina-do-recem-nascido',
    categoria: 'Rotina',
    pergunta: 'Como montar uma rotina para o recém-nascido?',
    titulo: 'Rotina do recém-nascido: como montar sem horário fixo',
    descricao:
      'Recém-nascido não segue horário, mas segue um ritmo: mamar, ficar acordado um pouco e dormir. Veja como observar esse ciclo e organizar o dia da casa.',
    resumo:
      'Nas primeiras semanas, a rotina do recém-nascido é um ciclo que se repete de 8 a 12 vezes por dia: mamar, ficar acordado um pouco (trocar fralda, colo, conversa) e dormir. Em vez de impor horários, observe esse ciclo por alguns dias; o padrão que aparecer é a rotina do seu bebê, e ela muda a cada poucas semanas.',
    secoes: [
      {
        titulo: 'O ciclo mamar, acordar, dormir',
        paragrafos: [
          'Um dia típico de recém-nascido tem muitos ciclos curtos. O bebê acorda com fome, mama, fica acordado por pouco tempo (no primeiro mês, perto de 35 a 60 minutos contando a mamada) e volta a dormir. À noite, o tempo acordado é menor ainda.',
        ],
      },
      {
        titulo: 'Exemplo de um dia (só para ter ideia)',
        tabela: {
          cabecalho: ['Horário aproximado', 'O que costuma acontecer'],
          linhas: [
            ['06:00', 'Mamada, fralda, um pouco acordado'],
            ['07:00 a 08:30', 'Soneca'],
            ['08:30', 'Mamada, banho de sol ou tummy time rápido'],
            ['09:30 a 11:30', 'Soneca'],
            ['…', 'O ciclo se repete ao longo do dia'],
            ['Fim da tarde', 'Mamadas mais seguidas (comum)'],
            ['Noite', 'Mamadas com luz baixa e volta direta ao berço'],
          ],
        },
        paragrafos: ['Cada bebê tem o próprio ritmo. Use o exemplo para entender a lógica, não como horário a cumprir.'],
      },
      {
        titulo: 'O que ajuda a casa a funcionar',
        lista: [
          'Combinar turnos à noite entre os adultos',
          'Deixar tudo anotado num lugar que todos vejam',
          'Aproveitar as sonecas para comer e descansar, não só para arrumar a casa',
          'Aceitar ajuda dos avós e amigos com tarefas da casa',
        ],
      },
    ],
    ninho: {
      titulo: 'Deixe o Ninho mostrar o ritmo do seu bebê',
      texto: 'Registre por alguns dias e o card Ritmo mostra a janela de sono, o intervalo entre mamadas e quando a próxima soneca e mamada costumam acontecer. Assim o dia da casa se organiza em volta do bebê, e não do relógio.',
      tela: '/app/home.webp',
      alt: 'Tela inicial do Ninho com o Ritmo da Helena e o resumo de hoje',
    },
    faqs: [
      { q: 'Com quantos meses o bebê tem rotina?', a: 'Um padrão mais previsível costuma aparecer entre 2 e 4 meses, quando o sono da noite fica mais longo e as sonecas mais regulares.' },
      { q: 'Dá para colocar o recém-nascido em horário fixo de mamada?', a: 'Para bebês amamentados, a OMS e a SBP recomendam a livre demanda, sem horário fixo. Com fórmula, siga a orientação do pediatra.' },
    ],
    relacionados: ['janela-de-sono-do-bebe', 'intervalo-entre-mamadas-recem-nascido', 'como-dividir-os-cuidados-do-bebe'],
    fontes: ['oms', 'sbp', 'aap'],
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
    fontes: ['ms', 'sbp'],
    atualizado: ATUALIZADO,
  },
];

export function guiaPorSlug(slug: string): Guia | undefined {
  return GUIAS.find((g) => g.slug === slug);
}

export const CATEGORIAS: Categoria[] = ['Sono', 'Mamada', 'Fralda', 'Rotina', 'O app Ninho'];
