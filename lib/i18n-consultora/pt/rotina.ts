/** Painel da consultora · seção "rotina" (português, a fonte e o tipo). */
export const rotina = {
  // Formatos curtos dos gráficos.
  /** dom. … sáb. (getUTCDay). */
  diasSemana: ['dom.', 'seg.', 'ter.', 'qua.', 'qui.', 'sex.', 'sáb.'],
  /** "sex. 6/11": UM espaço entre o dia da semana e a data (as telas cortam no espaço). */
  diaCurto: (sem: string, dia: number, mes: number) => `${sem} ${dia}/${mes}`,
  /** "6/11" (barra do prazo). */
  dataCurta: (dia: string, mes: string) => `${dia}/${mes}`,
  /** Rótulo de eixo, hora cheia 0–23: "18h". */
  eixo: (h: number) => `${h}h`,
  /** Separador decimal ("1,5 desp."). */
  decimal: ',',
  meses: ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'],
  mesAno: (mes: string, ano: string) => `${mes} de ${ano}`,

  // lib/consultoras-rotina.ts
  registro: {
    sonoNoturno: 'Sono noturno',
    soneca: 'Soneca',
    sono: 'Sono',
    dormindo: 'Dormindo',
    emAndamento: ' · em andamento',
    mamadeira: 'Mamadeira',
    semQuantidade: 'sem quantidade',
    peito: 'Peito',
    ladoEsquerdo: 'lado esquerdo',
    ladoDireito: 'lado direito',
    ladoAmbos: 'lado os dois',
    ladoOutro: (x: string) => `lado ${x}`,
    fralda: 'Fralda',
    xixi: 'xixi',
    coco: 'cocô',
    xixiCoco: 'xixi e cocô',
    seca: 'seca',
    comida: 'Comida',
    lanche: 'lanche',
    refeicao: 'refeição',
  },
  janela: {
    acordouPrimeira: 'Acordou → 1ª soneca',
    entre: (i: number) => `${i}ª → ${i + 1}ª soneca`,
    ultimaNoite: 'Última soneca → noite',
    acordouNoite: 'Acordou → noite',
  },
  faixa: {
    acordou: 'Acordou',
    soneca1: '1ª soneca',
    soneca2: '2ª soneca',
    soneca3: '3ª soneca',
    dormiu: 'Dormiu',
  },

  // components/consultoras/RotinaV3.tsx
  leg: {
    soneca: 'Soneca',
    sonecas: 'Sonecas',
    noite: 'Noite',
    bloco1: '1º bloco',
    acordado: 'Acordado',
    dormindo: 'Dormindo',
    maiorJanelaSemana: 'Maior janela da semana',
    mamada: 'Mamada',
    melhores: '2 melhores noites',
  },
  marca: {
    adormeceu_rapido: 'Adormeceu rápido',
    demorou_adormecer: 'Demorou para adormecer',
    no_colo: 'No colo',
    fora_do_colo: 'Fora do colo',
    acordou_feliz: 'Acordou feliz',
    acordou_irritado: 'Acordou irritado(a)',
    acordou_no_meio: 'Acordou no meio',
  } as Record<string, string>,
  seq: {
    fimSonoNoturno: 'Fim do sono noturno',
    sonoNoturno: 'Sono noturno',
    sonecaN: (n: number) => `${n}ª soneca`,
    semSono: 'Sem registros de sono neste dia.',
    janelaDeSono: (t: string) => `Janela de sono ${t}`,
    agora: 'agora',
    emAndamento: 'em andamento',
    pedacos: (n: number, lista: string) => `${n} pedaços: ${lista}`,
    semResposta: 'Sem resposta da família',
    despertares: (n: number) => `${n} ${n === 1 ? 'despertar' : 'despertares'}`,
    acordadoTempo: (t: string) => `${t} acordado`,
    prolongados: (n: number) => `${n} prolongado${n > 1 ? 's' : ''}`,
    acordadoAgora: 'acordado agora',
    prolongado: 'prolongado',
    comentario: 'Comentário da família',
  },
  evo: {
    comecouComVoce: (data: string) => `começou com você · ${data}`,
    desp: (n: number | string) => `${n} desp.`,
    primeiros: 'Primeiros 7 dias',
    ultimos: 'Últimos 7 dias',
    porDia: '/dia',
  },
  semNoites: 'Sem noites registradas nesta semana.',
  semRegistro: 'sem registro',
  semHorarios: 'Sem horários registrados.',
  diasDe: (n: number, total: number) => `${n} de ${total} dias`,
  varia: (t: string) => `varia ${t}`,
  tabela: {
    dia: 'Dia',
    sonecas: 'Sonecas',
    ultima: 'Última até',
    janela: 'Janela até dormir',
    noite: 'Noite seguinte',
  },
  despertaresMini: (n: number) => `${n} despertar(es)`,

  // components/consultoras/Funil.tsx
  funil: {
    titulo: 'Rastreio do link',
    cliques: 'Cliques (únicos)',
    downloads: 'Downloads',
    cadastros: 'Cadastros',
    assinaram: 'Assinaram',
    cancelaram: 'Cancelaram',
    mes: 'Mês',
    periodo: 'Período do rastreio',
    total: (n: number) => `Total (${n} meses)`,
    verMesAMes: 'Ver mês a mês',
    indisponivel: 'Cliques e downloads do link ainda não estão sendo contados. ',
    explica:
      'Cadastros: contas criadas pelo link ou código. Assinaram: 1ª cobrança no mês. Cancelaram: fim do período pago no mês. Download só conta quando o app casa a instalação com o clique (mesmo celular e rede).',
  },

  // components/consultoras/BarraDoPrazo.tsx (mesma regra de textoDoPrazo, lib/consultoras.ts)
  prazo: {
    semana: (atual: number, total: number) => `semana ${atual} de ${total}`,
  },

  // components/consultoras/CompartilharRelatorio.tsx
  compartilhar: {
    secoes: [
      'Resumo',
      'Sono da noite',
      'Sonecas e janelas',
      'Antes dos despertares',
      'Melhores e piores noites',
      'Horários',
      'Perguntas para a família',
      'O que observar',
    ],
    roteiro: ' (roteiro seu: vem desmarcada)',
    baixarPdf: 'Baixar PDF',
    titulo: 'Compartilhar com a família',
    intro: 'Você revisa antes. A família recebe o PDF com o seu nome, a sua foto e o rodapé de saúde.',
    passo1: '1 · O que vai no PDF',
    passo2: '2 · Baixe o PDF da família',
    baixarPdfFamilia: 'Baixar PDF da família',
    salvarAntes: 'Na janela que abrir, escolha ',
    salvarComoPdf: 'Salvar como PDF',
    salvarDepois: '.',
    passo3: '3 · Mande pelo WhatsApp',
    abrirWhatsapp: 'Abrir WhatsApp',
    daFamilia: ' da família',
    copiado: 'Copiado!',
    copiar: 'Copiar mensagem',
    anexar: 'No WhatsApp, toque no clipe › Documento e escolha o PDF que você baixou. ',
    semWhatsapp: 'Cadastre o WhatsApp da família na ficha para abrir direto na conversa dela.',
  },

  // components/consultoras/OrientacaoFamilia.tsx
  orientacao: {
    placeholder: 'Escreva aqui a orientação que a família vai ler no app. Sem link e sem anexo.',
    nota: 'A família recebe no sininho e no celular, e você vê quando ela ler. Depois de enviada, a orientação não pode ser editada nem apagada.',
    comLink: 'A orientação não pode ter link. Tire o endereço para poder enviar.',
    saude:
      'Esse texto parece falar de saúde (remédio, dose, posição de sono). Você pode enviar, mas lembre: orientação de saúde é com o pediatra.',
    termoTitulo: 'Antes da primeira orientação, confirme o termo',
    concordo: 'Li e concordo com o termo acima.',
    enviar: 'Enviar para a família',
  },

  // components/consultoras/LinksConsultora.tsx
  links: {
    msgConsultoria: (link: string) =>
      `Oi! Para eu acompanhar a rotina do seu bebê, baixe o Ninho por este link: ${link}\nDepois de cadastrar o bebê, é só tocar em Aprovar para compartilhar a rotina comigo.`,
    consultoriaTitulo: 'Link da consultoria',
    consultoriaTag: 'Para as suas clientes',
    mandarWhatsapp: 'Mandar no WhatsApp',
    consultoriaHint:
      'Mande para a família que você atende. Ela baixa o Ninho e, depois do cadastro do bebê, o app pergunta se ela aprova compartilhar a rotina com você.',
    /** Os 3 passos: o trecho entre ** sai em negrito. */
    passos: [
      'A família abre o link e baixa o Ninho (quem já tem toca em **Já tenho o Ninho**).',
      'Depois do cadastro do bebê, ela **aprova** ou **recusa** compartilhar a rotina com você.',
      'Se aprovar, você confirma em **Famílias** e a rotina aparece.',
    ],
    naoPublique: 'Não publique este link.',
    naoPubliqueCorpo: ' Ele pede para a pessoa compartilhar a rotina do bebê com você.',
    msgCodigo: (link: string, codigo: string) =>
      `Oi! Eu acompanho a rotina de sono do bebê pelo Ninho. É rapidinho:\n1. Baixe o Ninho: ${link}\n2. Crie sua conta\n3. Abra o menu ☰\n` +
      `4. Toque em Cuidador ou Consultor › Adicionar › Consultora de sono\n5. Digite meu código: ${codigo}\nAí é só eu aprovar e a gente acompanha junto.`,
    seuCodigo: 'Seu código',
    codigoPrincipal: 'A família digita o código em Cuidador ou Consultor › Adicionar › Consultora de sono, e você aprova em Famílias.',
    codigoReserva: 'Se o link não funcionar, a família digita o código em Cuidador ou Consultor › Adicionar › Consultora de sono.',
    mandarPassoAPasso: 'Mandar o passo a passo no WhatsApp',
    msgDivulgacao: (link: string) =>
      `Eu uso e indico o Ninho para a rotina do bebê: sono, mamadas, fraldas e muito mais. Baixe com 7 dias grátis: ${link}`,
    indicaTitulo: 'Indique o Ninho e ganhe comissão',
    indicaTag: 'Instagram, stories, grupos',
    indicaAntes: 'Use este link para indicar o Ninho para quem você quiser. Quando a pessoa assinar, ',
    indicaNegrito: 'você ganha a comissão',
    indicaDepois: '. Ela não fica ligada a você e você não vê a rotina dela.',
    compartilharWhatsapp: 'Compartilhar no WhatsApp',
    linkAntigo: (url: string) => `O link antigo (${url}) continua valendo como este.`,
  },

  // components/consultoras/ui.tsx
  ui: {
    ativa: 'Ativa',
    pausada: 'Pausada',
    esperando: 'Esperando cadastro',
    chave: 'Aparecer em Encontrar consultora de sono',
  },
};
