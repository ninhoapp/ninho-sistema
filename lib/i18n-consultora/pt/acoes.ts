/** Painel da consultora · seção "acoes" (português, a fonte e o tipo). */
export const acoes = {
  // Comuns a várias ações.
  contaNaoAtiva: 'Sua conta não está ativa agora.',
  familiaNaoEncontrada: 'Família não encontrada.',
  pedidoNaoEncontrado: 'Pedido não encontrado.',
  emailInvalido: 'E-mail inválido.',
  whatsappComDdd: 'WhatsApp com DDD (ex.: 11 98765-4321).',
  erroEnviar: 'Não consegui enviar agora. Tente de novo.',
  limiteHoje: 'Você chegou ao limite de convites de hoje. Tente amanhã.',
  aceiteDesatualizado: 'Versão do aceite desatualizada. Recarregue a página.',

  perfil: {
    contaAindaNaoAtiva: 'Sua conta ainda não está ativa.',
    ufInvalida: 'UF com 2 letras (ex.: SP).',
    instagramInvalido: 'Instagram inválido. Use só o seu @.',
    cpfInvalido: 'CPF com 11 números.',
    pixInvalido: 'Chave Pix inválida.',
    erroSalvar: 'Não consegui salvar agora. Tente de novo.',
    salvoComTexto: 'Salvo. O texto novo foi para o Ninho aprovar; o resto já vale.',
    salvo: 'Perfil salvo.',
  },

  foto: {
    escolha: 'Escolha uma foto.',
    formato: 'A foto precisa ser JPG, PNG ou WebP.',
    grande: 'A foto passa de 2 MB. Mande uma menor.',
    erroGuardar: 'Não consegui guardar a foto. Tente de novo.',
    enviada: 'Foto enviada. Ela aparece depois que o Ninho aprovar.',
  },

  indicar: {
    soAtiva: 'Só consultora ativa pode indicar.',
    nome: 'Coloque o nome.',
    email: 'Coloque o e-mail que ela vai usar no app.',
    instagramInvalido: 'Instagram inválido. Use só o @ dela.',
    jaIndicada: 'Essa pessoa já foi indicada ou liberada.',
    limite: 'Você chegou ao limite de indicações por agora. Tente amanhã.',
    jaTemPedido: 'Essa pessoa já tem um pedido.',
    enviada: 'Indicação enviada. O Ninho vai conferir.',
  },

  pedidoFamilia: {
    marqueAceite: 'Para aprovar, marque o aceite.',
    naoEncontrado: 'Esse pedido já foi respondido ou foi cancelado pela família.',
    soResponsavel: 'Quem pediu não é mais a responsável pelo bebê.',
    erro: 'Não consegui responder agora. Tente de novo.',
    aprovado: 'Pedido aprovado: a família aparece na sua lista.',
    recusado: 'Pedido recusado.',
  },

  convidar: {
    marqueAceite: 'Para convidar, marque o aceite.',
    ok: (email: string) =>
      `Convite registrado para ${email}. Se essa pessoa já é responsável por um bebê no Ninho, recebe agora no sininho. Se é cuidadora, o pedido vai para o responsável principal. Se ainda não tem conta, o convite fica guardado e chega quando ela criar a conta. Confira se o e-mail está certo.`,
  },

  ficha: {
    terminoAntes: 'O término não pode ser antes do início.',
    encontros: 'Encontros: use números de 0 a 999.',
    whatsappInvalido: 'WhatsApp inválido.',
    semAcesso: 'Essa família não compartilha mais a rotina com você.',
    invalido: 'Confira os campos da ficha.',
    erro: 'Não consegui salvar a ficha agora. Tente de novo.',
    salva: 'Ficha salva.',
  },

  continuar: {
    indisponivel: 'Os pedidos ainda não estão disponíveis.',
    erro: 'Não consegui marcar agora. Tente de novo.',
    ok: 'Pedido marcado como tratado.',
  },

  orientacao: {
    vazio: 'Escreva a orientação antes de enviar.',
    longo: (max: number) => `A orientação passa de ${max} letras.`,
    indisponivel: 'As orientações ainda não estão disponíveis. Assim que o Ninho liberar, aparecem aqui.',
    indisponivelCurto: 'As orientações ainda não estão disponíveis.',
    marqueTermo: 'Para enviar a primeira orientação, marque o termo.',
    termoDesatualizado: 'Versão do termo desatualizada. Recarregue a página.',
    erroTermo: 'Não consegui registrar o termo agora. Tente de novo.',
    semAcesso: 'Essa família não compartilha mais a rotina com você (ou está sem plano).',
    semAceite: 'Para enviar, é preciso confirmar o termo. Recarregue a página.',
    familiaSemAceite: 'A família ainda não aceitou receber orientações pelo Ninho. Ela vê o pedido ao abrir o app.',
    link: 'A orientação não pode ter link. Tire o endereço e envie de novo.',
    enviada: 'Orientação enviada. A família recebe no sininho e no celular.',
  },

  relatorio: {
    semPlano: 'Essa família está sem plano: a rotina volta quando ela assinar.',
    pronto: 'Relatório pronto.',
    pedido: 'Relatório pedido. Ele aparece na lista em instantes.',
  },

  convite: {
    naoEncontrado: 'Convite não encontrado.',
    cancelado: 'Convite cancelado.',
    jaRespondido: 'Esse convite já tinha sido respondido ou cancelado.',
    erroCancelar: 'Não consegui cancelar agora. Tente de novo.',
  },

  encerrar: {
    ok: 'Acompanhamento encerrado. A família foi avisada.',
    jaNaoCompartilhava: 'Essa família já não compartilhava a rotina com você.',
    erro: 'Não consegui encerrar agora. Tente de novo.',
  },

  sugestao: {
    vazia: 'Escreva sua ideia antes de enviar.',
    longa: (max: number) => `Use até ${max} caracteres.`,
    ok: 'Recebemos sua sugestão. Obrigado por ajudar a melhorar o Ninho!',
    indisponivel: 'As sugestões abrem em breve. Tente de novo mais tarde.',
  },

  /** Relatório IA (lib/consultoras-ia.ts). */
  ia: {
    rodape: 'Relatório gerado por IA a partir dos registros do app. Não é avaliação de saúde e não substitui o pediatra.',
    indisponivel: 'O Relatório IA ainda não está disponível no painel. Tente pelo app.',
    erro: 'Não consegui gerar agora. Tente de novo em instantes.',
    erroCurto: 'Não consegui gerar agora.',
    emAndamento: 'Já há um relatório sendo gerado. Aguarde um instante.',
    semAssinatura: 'Seu relatório grátis já foi usado. Assine pelo app do Ninho para continuar.',
    limite: (n: number) => `Você chegou aos ${n} relatórios deste mês.`,
    semDados: 'Ainda não há registros suficientes para um relatório completo. Não contou como relatório usado.',
    semAcesso: 'Sem acesso à rotina deste bebê agora.',
  },

  /** Textos de lib/consultoras.ts que chegam à tela da consultora. */
  prazo: {
    terminou: 'Terminou',
    terminaHoje: 'Termina hoje',
    acabaAmanha: 'Acaba amanhã',
    faltamDias: (n: number) => `Faltam ${n} dias`,
    faltamSemanas: (n: number) => `Faltam ${n} semanas`,
  },
  situacao: {
    ativaDesde: (d: string) => `assinatura ativa desde ${d}`,
    ativa: 'assinatura ativa',
    canceladaEm: (d: string) => `cancelou em ${d}`,
    cancelada: 'cancelou',
    testeAte: (d: string) => `em teste grátis até ${d}`,
    teste: 'em teste grátis',
    reembolsadaEm: (d: string) => `reembolsada em ${d}`,
    reembolsada: 'reembolsada',
    semCobranca: 'ainda não cobrada',
  },
  ganhos: {
    familiaDaRede: 'Família da rede',
    familiaN: (n: number) => `Família ${n}`,
  },
};
