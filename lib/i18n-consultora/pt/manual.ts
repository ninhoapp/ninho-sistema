/**
 * Painel da consultora · seção "manual" (português, a fonte e o tipo).
 *
 * Manual da consultora (aba Manual), o PDF do manual, as mensagens prontas de
 * WhatsApp e as telas do app desenhadas (TelasManual/Celular). O painel do
 * DONO usa o mesmo pt: mudou aqui, muda lá.
 *
 * `**texto**` vira negrito na tela (componente `Rico`, em Celular.tsx).
 * Telas desenhadas: os textos são os do app, em cada idioma
 * (Ninho-expo/src/i18n/locales/{pt,en,es}: consultora, auth, account,
 * consultants). Mudou no app, mude aqui.
 */
export const manual = {
  /** ManualDaConsultora: aba Manual do painel da consultora. */
  painel: {
    titulo: 'Manual da consultora',
    tituloDireita: 'o mesmo passo a passo do PDF',
    intro:
      'Aqui está o caminho completo, do convite ao acompanhamento, com as telas do app. É o mesmo manual que o Ninho manda em PDF: **Baixar PDF** gera o arquivo com o seu nome, o seu e-mail e o seu código, para você guardar ou imprimir.',
    seuCodigo: (codigo: string) => `O seu código é **${codigo}**. É ele que a família digita no app dela.`,
    baixarPdf: 'Baixar PDF',
    passoAPasso: 'Passo a passo',
    p1Titulo: 'Convide a família',
    p1a: (codigo: string) =>
      `No app, toque em **Convidar**, na barra de baixo (se a barra estiver fechada, toque na setinha do meio), e depois em **Enviar pelo WhatsApp**: a sua cliente recebe uma mensagem com o passo a passo e o seu código, **${codigo}**.`,
    p1b: 'Se ela já usa o Ninho, você também pode convidar em **Convidar pelo e-mail da família**, com o e-mail exato da conta dela. Aqui no computador, o mesmo fica em **Convidar família**.',
    p2Titulo: 'A família aceita',
    p2a: '**Pelo código:** no app dela, menu ☰ › **Cuidador ou Consultor** › **Adicionar** › **Consultora de sono**. Ela digita o seu código, toca em **Buscar**, marca a caixa e toca em **Compartilhar a rotina**.',
    p2b: '**Pelo e-mail:** ela recebe no sininho o aviso **Pedido de consultora de sono**, escolhe o bebê e toca em **Aprovar**. Nesse caminho já está pronto.',
    p3Titulo: 'Você aprova (só no caminho do código)',
    p3a: 'Chega para você o aviso **Novo pedido de família**. No Início, em **Pedidos de famílias**, toque em **Aprovar** e depois em **Aprovar e acompanhar**. Aqui no computador, o pedido aparece em **Famílias**.',
    p3b: 'Pronto: o bebê aparece em **Suas famílias**.',
    p4Titulo: 'Acompanhe a rotina',
    p4a: 'Em **Rotina** você vê o dia da família, com cada sono e a **janela de sono** entre eles. Em **Evolução**, as últimas noites lado a lado.',
    p4b: 'O **Relatório com IA** lê a rotina e escreve a análise para você. Na **ficha da família** ficam as suas anotações, que só você vê.',
    p5Titulo: 'Complete o seu perfil público',
    p5a: 'Em **Meu perfil na lista** (ou, no app, menu ☰ › **Editar perfil**), coloque foto, um texto sobre como você ajuda as famílias, cidade, as idades que atende e o seu WhatsApp.',
    p5b: 'O Ninho revisa e libera você na lista **Encontrar consultora de sono**, que as famílias veem dentro do app. A lista mostra até 10 consultoras, e quem traz mais famílias assinantes aparece primeiro.',
    p6Titulo: 'Trabalhe no computador',
    p6a: 'No app, menu ☰ › **Código do painel web**: gere um código de 6 dígitos e use com o seu e-mail em **useninho.com.br/admin/login**, na aba **Sou consultora**. O código vale 10 minutos.',
    p6b: 'Aqui você tem as mesmas telas, este manual e o PDF.',
    doZeroTitulo: 'Quando você começou do zero',
    doZeroIntro:
      'Estes são os dois manuais completos que o Ninho manda para uma consultora nova, com os passos de baixar o app e criar a conta. Servem para você reler ou mostrar a uma amiga que você indicou.',
    semConta: 'Quem ainda não tem conta no Ninho',
    comConta: 'Quem já tem conta no Ninho',
    baixarEste: 'Baixar este PDF',
  },

  /** AcoesManual: botões e o PDF desenhado. */
  pdf: {
    copiado: 'Copiado!',
    copiarTexto: 'Copiar texto',
    soTexto: 'Só o texto no WhatsApp',
    gerando: 'Gerando PDF…',
    baixarPdf: 'Baixar PDF',
    enviarPdf: 'Enviar PDF no WhatsApp',
    erro: 'Não consegui gerar o PDF agora. Tente de novo.',
    dicaEnviar:
      'No computador, o PDF é baixado e o WhatsApp abre com a mensagem: arraste o PDF para a conversa. No celular, escolha o WhatsApp na lista.',
    nomeArquivo: (nome: string) => `Manual Ninho - ${nome}.pdf`,
    cabecalho: 'Manual da consultora',
    pagina: (n: number, total: number) => `página ${n} de ${total}`,
    capaOi: (nome: string) => `Oi, ${nome}, tudo bem? Que bom te ter aqui!`,
    capaSemConta: 'Preparei este passo a passo para você começar no Ninho. É rapidinho, e eu vou te mostrando cada tela. Vamos juntas?',
    capaComConta:
      'Como você já usa o Ninho, falta pouquinho. Preparei este passo a passo mostrando cada tela, para você começar a acompanhar as suas clientes.',
    seuEmail: 'Seu e-mail de consultora',
    seuCodigo: 'Seu código',
    baixarTitulo: 'Para começar, baixe o Ninho',
    baixarTexto:
      'Toque no botão abaixo: ele abre a App Store no iPhone ou o Google Play no Android. Toque em **Obter** (ou **Instalar**) e, quando terminar, volte aqui para a gente continuar.',
    baixarBotao: 'Toque aqui para baixar o Ninho',
    contaTitulo: 'Agora crie a sua conta',
    contaA: (email: string) =>
      `Abra o Ninho e entre com a Apple, com o Google ou com o seu e-mail, para a gente continuar. O importante é usar o e-mail **${email}**: foi ele que eu liberei para você como consultora.`,
    contaB:
      '**Com o e-mail:** toque em **Novo aqui? Criar conta**, coloque o e-mail e uma senha e confirme com o código de 6 dígitos que chega no seu e-mail (confira também o spam). **Com o Google:** escolha a conta desse e-mail. **Com a Apple:** escolha compartilhar o seu e-mail, e não **ocultar meu e-mail**, assim o app reconhece você.',
    abrirTitulo: 'Abra o Ninho na conta do e-mail liberado',
    abrirA: (email: string) =>
      `Como você já usa o Ninho, é só fechar o app e abrir de novo, na conta do e-mail **${email}**. O app reconhece a sua conta de consultora sozinho.`,
    abrirB:
      'Se você já tem um bebê cadastrado, vai aparecer a pergunta **Sua conta foi liberada como consultora**: toque em **Usar modo consultora**. Dá para voltar quando quiser pelo menu, em **Mudar para conta comum**. Na primeira vez, leia o Termo da Consultora, marque a caixa e toque em **Começar**.',
    abrirC: 'Se você entra no Ninho com outro e-mail, me conta qual é, que eu ligo a sua conta por aqui.',
    termoTitulo: 'Aceite o Termo da Consultora',
    termoTexto: (nome: string) =>
      `Assim que você entrar, o app já abre a sua área de consultora, com uma mensagem de boas-vindas: **Bem-vinda, ${nome}**. Leia o termo com calma, marque **Li e aceito o Termo da Consultora** e toque em **Começar**. Depois aparecem três telas rápidas de apresentação.`,
    convidarTitulo: 'Convide a sua primeira cliente',
    convidarA: (codigo: string) =>
      `Agora vamos convidar a sua primeira cliente. Toque em **Convidar família** (ou em **Convidar**, na barra de baixo; se ela estiver fechada, toque na setinha do meio) e depois em **Enviar pelo WhatsApp**. A sua cliente recebe uma mensagem com o passo a passo e o seu código, **${codigo}**.`,
    convidarB: 'Se preferir, convide pelo e-mail dela, em **Convidar pelo e-mail da família**. Use o e-mail com que ela entra no Ninho.',
    aceitaTitulo: 'Veja como a sua cliente recebe',
    aceitaA: 'Quando você convida, a sua cliente tem dois caminhos, conforme o jeito que você escolheu:',
    aceitaB:
      '**Pelo WhatsApp (com o seu código):** ela segue este caminho no app dela: menu ☰ › **Cuidador ou Consultor** › **Adicionar** › **Consultora de sono**. Digita o seu código, toca em **Buscar**, marca a caixa e toca em **Compartilhar a rotina**.',
    aceitaC: '**Pelo e-mail:** chega uma notificação no sininho dela, **Pedido de consultora de sono**. Ela escolhe o bebê e toca em **Aprovar**.',
    aprovarTitulo: 'Aprove o pedido e acompanhe',
    aprovarA:
      'Quando a sua cliente usa o seu código, chega para você o aviso **Novo pedido de família**. No Início, em **Pedidos de famílias**, toque em **Aprovar** e depois em **Aprovar e acompanhar**.',
    aprovarB:
      'Pronto! O bebê aparece em **Suas famílias**, e você acompanha a rotina em **Rotina** e **Evolução**. Se ela aprovou pelo sininho, nem precisa deste passo: o bebê já aparece para você.',
    perfilTitulo: 'Complete o seu perfil público',
    perfilA:
      'Agora o passo que coloca você na vitrine: o seu perfil público. Mais de 2 mil pessoas já usam o Ninho, e quem procura ajuda com o sono do bebê encontra as consultoras dentro do próprio app.',
    perfilB:
      'No menu ☰, toque em **Editar perfil** (ou em **Completar perfil**, na apresentação). Coloque uma foto, um texto curto sobre como você ajuda as famílias, a cidade, as idades que atende e o seu WhatsApp, e toque em **Salvar**.',
    perfilC:
      'Eu reviso o texto e a foto e libero o seu perfil na lista. É só evitar promessa de resultado e indicação de remédio ou de posição de sono.',
    vitrineTitulo: 'Veja como as famílias vão te encontrar',
    vitrineA: 'No app, a família abre o menu ☰ › **Apoio** › **Encontrar consultora de sono**. Lá aparece a lista com foto, nome e cidade.',
    vitrineB: 'Ao tocar no seu nome, ela vê o seu perfil completo e o botão **Conversar no WhatsApp**, que abre a conversa direto com você.',
    vitrineC:
      'A lista mostra até 10 consultoras, e quem traz mais famílias assinantes aparece primeiro. Quanto mais você convidar, mais perto do topo você fica.',
    ajudaTitulo: 'Estou aqui com você',
    ajudaTexto:
      'Qualquer dúvida, me chama no WhatsApp, no horário que for. Se travar em alguma tela, me manda um print que a gente resolve junto. E as suas sugestões são muito bem-vindas: é com elas que o Ninho fica cada vez melhor para o seu trabalho.',
    ajudaAssinatura: 'Um abraço, Mailson · Ninho',
  },

  /** manualTextos: mensagens prontas (WhatsApp) que o dono manda para a consultora. */
  mensagem: {
    comuns: (codigo: string, n: number) =>
      `${n}. Na primeira vez, aparece o Termo da Consultora. Leia, marque "Li e aceito o Termo da Consultora" e toque em "Começar".\n\n` +
      `${n + 1}. Para convidar uma cliente, toque em "Convidar" na barra de baixo (se a barra estiver fechada, toque na setinha do meio) e depois em "Enviar pelo WhatsApp". ` +
      `Ela recebe o passo a passo com o seu código: ${codigo}.\n` +
      `Também dá para convidar pelo e-mail da cliente, em "Convidar pelo e-mail da família".\n\n` +
      `${n + 2}. Quando a cliente digitar o seu código, chega o aviso "Novo pedido de família". No Início, toque em "Aprovar" e depois em "Aprovar e acompanhar". ` +
      `Pronto: a rotina do bebê aparece para você.\n\n` +
      `${n + 3}. Complete o seu perfil público: no menu ☰, toque em "Editar perfil" e coloque foto, um texto sobre como você ajuda as famílias, cidade, idades que atende e WhatsApp. ` +
      `Eu reviso e libero você na lista "Encontrar consultora de sono", que as famílias veem dentro do app. Mais de 2 mil pessoas já usam o Ninho.\n\n` +
      `Qualquer dúvida, é só me chamar aqui.`,
    semConta: (nome: string, link: string, email: string) =>
      `Oi, ${nome}! Aqui está o passo a passo para começar no Ninho:\n\n` +
      `1. Toque aqui para baixar o Ninho (funciona no iPhone e no Android):\n${link}\n\n` +
      `2. Crie a sua conta com o e-mail ${email}. Tem que ser exatamente esse, porque é ele que está liberado como consultora.\n` +
      `- Pode tocar em "Continuar com Google", se esse for um e-mail do Google.\n` +
      `- Ou toque em "Novo aqui? Criar conta", coloque o e-mail e uma senha e confirme com o código de 6 dígitos que chega no e-mail.\n` +
      `- Se entrar pela Apple, não escolha "ocultar meu e-mail", senão o app não reconhece você.\n\n`,
    comConta: (nome: string, email: string) =>
      `Oi, ${nome}! Como você já usa o Ninho, é ainda mais simples:\n\n` +
      `1. Confira se a sua conta no app é a do e-mail ${email}. É esse e-mail que está liberado como consultora. ` +
      `Se você entra com outro e-mail, me avise qual é que eu ligo a sua conta por aqui.\n\n` +
      `2. Feche o Ninho e abra de novo. O app reconhece a sua conta de consultora sozinho.\n` +
      `- Se você já tem um bebê cadastrado, aparece a pergunta "Sua conta foi liberada como consultora". Toque em "Usar modo consultora".\n` +
      `- Depois você troca quando quiser pelo menu: "Mudar para conta comum" ou "Mudar para modo consultora".\n\n`,
    /** Texto do dono (14/11/2026). `link` só para quem não tem conta. */
    comPdf: (nome: string, link: string | null) =>
      `Oi, ${nome}, tudo bem? Que bom te ter aqui como nossa parceira consultora!\n\n` +
      `Segue aqui o PDF de orientações de como você utiliza o Ninho.` +
      (link ? ` Para começar, baixe o app por aqui:\n${link}` : '') +
      `\n\nQualquer dúvida, estamos à disposição, no horário que for necessário.`,
  },

  /** BotaoWhatsApp. */
  whatsapp: {
    enviar: 'Enviar pelo WhatsApp',
    copiar: 'Copiar',
    copiado: 'Copiado!',
  },

  /** Barra de baixo da consultora desenhada (Celular.tsx). Textos do app: consultora.nav. */
  barra: {
    rotina: 'Rotina',
    evolucao: 'Evolução',
    inicio: 'Início',
    convidar: 'Convidar',
    ganhos: 'Ganhos',
    ajuda: 'Ajuda',
    painel: 'Painel',
  },

  /** Telas do app desenhadas (TelasManual.tsx). */
  telas: {
    // App Store
    lojaLegenda: 'App Store ou Google Play',
    lojaSub: 'Rotina e memórias do bebê',
    lojaObter: 'OBTER',
    lojaCompras: 'Compras no app',
    lojaAvaliacoes: 'AVALIAÇÕES',
    lojaNota: '4,9',
    lojaIdade: 'IDADE',
    lojaCategoria: 'CATEGORIA',
    lojaEstilo: 'Estilo de vida',
    // Entrada (auth.login)
    loginLegenda: 'Tela de entrada do Ninho',
    soneca: 'Soneca',
    sonecaDetalhe: (hora: string) => `1h 20min · ${hora}`,
    mamadeira: 'Mamadeira',
    mamadeiraDetalhe: '120 ml · agora',
    heroTopo: 'A rotina do bebê,',
    heroBaixo: 'leve e em família.',
    heroSub: 'Sono, mamadas e memórias num lugar só.',
    continuarApple: 'Continuar com Apple',
    continuarGoogle: 'Continuar com Google',
    continuarEmail: 'Continuar com e-mail',
    novoAqui: 'Novo aqui?',
    criarConta: 'Criar conta',
    termos: 'Termos',
    privacidade: 'Privacidade',
    // Cadastro (auth.signup)
    criarContaLegenda: 'Criar conta com o e-mail liberado',
    criarContaSub: 'Leva menos de um minuto.',
    email: 'E-mail',
    senha: 'Senha',
    repitaSenha: 'Repita a senha',
    jaTemConta: 'Já tem uma conta?',
    entrar: 'Entrar',
    // Confirmar (auth.verify)
    confirmarLegenda: 'Código que chega no e-mail',
    confirmarTitulo: 'Confirme seu e-mail',
    confirmarSub: (email?: string) => `Mandamos um código de 6 dígitos para ${email ?? 'o seu e-mail'}. Confira também a caixa de spam.`,
    confirmar: 'Confirmar',
    // Termo (consultora.termo)
    termoLegenda: 'Termo da Consultora (só na 1ª vez)',
    termoBemVinda: (nome: string) => `Bem-vinda, ${nome}`,
    termoPronta: 'Sua conta de consultora está pronta',
    termoLiberada: 'Sua conta de consultora foi liberada',
    termoLiberadaCorpo: 'Agora você acompanha a rotina das famílias que compartilharem com você.',
    termoRotulo: 'Termo da Consultora',
    termoItens: [
      'Você é independente e responde sozinha pelas orientações que dá às famílias. Nunca indique remédio, dose ou posição de sono, nem prometa resultado. Saúde é com o pediatra.',
      'Use a rotina dos bebês só para atender aquela família. Não copie, não guarde e não divulgue esses dados.',
      'Ao divulgar seu link, avise que tem parceria com o Ninho ("#publi").',
    ],
    termoAceito: 'Li e aceito o Termo da Consultora',
    comecar: 'Começar',
    // Início da consultora (consultora.home)
    inicioLegenda: 'A área da consultora',
    inicio: 'Início',
    bomDiaFamilias: (nome: string, n: number) => `Bom dia, ${nome} · ${n} ${n === 1 ? 'família' : 'famílias'}`,
    suasFamilias: 'Suas famílias',
    nenhumaFamilia: 'Nenhuma família ainda',
    nenhumaFamiliaCorpo: 'Quando uma família digitar seu código em Cuidadores, o bebê aparece aqui.',
    convidarFamilia: 'Convidar família',
    // Convidar (consultora.convidar)
    convidarLegenda: 'Convidar: o seu código e o WhatsApp',
    convidarSub: 'Elas compartilham a rotina com você',
    codigo: 'Código',
    codigoDica:
      'A família digita o código em Cuidador ou Consultor › Adicionar › Consultora de sono, e você aprova em Famílias. A mensagem do WhatsApp já explica o passo a passo.',
    whatsapp: 'WhatsApp',
    compartilhar: 'Compartilhar',
    porEmailTitulo: 'Convidar pelo e-mail da família',
    porEmailDica: 'Use o e-mail exato com que a família entra no Ninho. Ela recebe o convite no sininho, escolhe o bebê e aprova.',
    emailFamilia: 'e-mail da família',
    // WhatsApp (consultora.convidar.mensagemCodigo)
    zapLegenda: 'A mensagem que a família recebe',
    zapOnline: 'online',
    zapMensagem: (codigo: string) =>
      `Oi! Eu acompanho a rotina de sono do bebê pelo Ninho. É rapidinho:
1. Baixe o Ninho: useninho.com.br/indica/${codigo}
2. Crie sua conta
3. Abra o menu ☰
4. Toque em Cuidador ou Consultor › Adicionar › Consultora de sono
5. Digite meu código: ${codigo}
Aí é só eu aprovar e a gente acompanha junto.`,
    // Família: Cuidador ou Consultor (account.caregivers)
    adicionarLegenda: 'Família: ☰ › Cuidador ou Consultor › Adicionar',
    cuidadorOuConsultor: 'Cuidador ou Consultor',
    quemAcompanha: (bebe: string) => `Quem acompanha ${bebe}`,
    quemCuida: 'Quem cuida',
    maeResponsavel: 'Mãe · responsável',
    quemAdicionar: 'Quem você quer adicionar?',
    cuidadorFamilia: 'Cuidador da família',
    cuidadorFamiliaCorpo: 'Pai, avó, babá… Vê e registra tudo, e usa o seu plano.',
    consultoraSono: 'Consultora de sono',
    consultoraSonoCorpo: 'Acompanha só a rotina de sono e mamadas. Não registra nem vê fotos.',
    // Família digita o código (consultora.familia)
    familiaCodigoLegenda: 'A família digita o código e compartilha',
    familiaSub: 'Compartilhe a rotina com quem te ajuda',
    codigoConsultora: 'Código da consultora',
    buscar: 'Buscar',
    consultoraIndependenteSono: 'Consultora de sono independente',
    familiaAceite: (nome: string, bebe: string) =>
      `Autorizo ${nome} a ver, só para leitura: o nome e a data de nascimento de ${bebe}, o primeiro nome do responsável e de quem fez cada registro, o sono, as mamadas, as fraldas, a comida e se temos plano. Ela não vê fotos, momentos nem chat…`,
    compartilharRotina: 'Compartilhar a rotina',
    // Sininho da família (consultora.familia)
    sininhoLegenda: 'Convite por e-mail: a família recebe no sininho',
    pedidosConsultora: 'Pedidos de consultora',
    pedidosConsultoraSub: 'Convites e pedidos esperando resposta',
    convitesRecebidos: 'Convites recebidos',
    querAcompanhar: (nome: string) => `${nome} quer acompanhar a rotina do seu bebê.`,
    qualBebe: 'Qual bebê ela vai acompanhar?',
    recusar: 'Recusar',
    aprovar: 'Aprovar',
    // Pedido para a consultora (consultora.vinculo)
    pedidoLegenda: 'O pedido chega para você',
    pedidosFamilias: 'Pedidos de famílias',
    pedidosFamiliasDica: 'Elas pediram para você acompanhar a rotina. O bebê só aparece na sua lista depois que você aprovar.',
    pediuEm: (data: string) => `Pediu em ${data}`,
    avisoApp: 'NINHO',
    avisoAgora: 'agora',
    avisoTitulo: 'Novo pedido de família',
    avisoCorpo: (mae: string, bebe: string) => `${mae} quer que você acompanhe a rotina de ${bebe}.`,
    // Aprovado
    aprovadoLegenda: 'Pronto: o bebê entra na sua lista',
    aprovadoOk: 'Pronto. O bebê já aparece na sua lista.',
    maeUltimo: (mae: string, hora: string) => `Mãe: ${mae} · Último registro · ${hora}`,
    // Modo consultora (consultora.modo)
    modoLegenda: 'Quem já tem bebê no app vê esta pergunta',
    hoje: (data: string) => `Hoje, ${data}`,
    ritmoDoDia: 'Ritmo do dia',
    modoTitulo: 'Sua conta foi liberada como consultora',
    modoCorpo: 'Quer usar o Ninho no modo consultora? Você pode trocar quando quiser pelo menu.',
    modoUsar: 'Usar modo consultora',
    agoraNao: 'Agora não',
    // Apresentação (consultora.apresentacao)
    aparecaLegenda: 'Apresentação: Apareça no Ninho',
    passoDe: (n: number, total: number) => `${n} de ${total}`,
    aparecaCampos: ['Foto', 'Cidade', 'Idades que atende', 'WhatsApp'],
    aparecaTitulo: 'Apareça no Ninho',
    aparecaCorpo: 'Com foto, cidade, idades e WhatsApp, você entra na lista que as famílias veem no app.',
    completarPerfil: 'Completar perfil',
    fazerDepois: 'Fazer depois',
    // Editar perfil (consultora.editar)
    editarLegenda: 'Menu ☰ › Editar perfil',
    editarPerfil: 'Editar perfil',
    consultoraIndependente: 'Consultora independente',
    trocarFoto: 'Trocar foto',
    sobreVoce: 'Sobre você',
    bioExemplo: 'Ajudo famílias a construir uma rotina de sono gentil, no tempo de cada bebê.',
    cidadeUf: 'Cidade · UF',
    instagram: 'Instagram',
    instagramExemplo: '@seuperfil',
    atende: 'Atende',
    presencialEOnline: 'Presencial e online',
    idadesQueAtende: 'Idades que atende',
    idadesExemplo: '0 a 3 anos',
    salvar: 'Salvar',
    // Lista de consultoras (consultants)
    listaLegenda: 'Família: ☰ › Apoio › Encontrar consultora de sono',
    listaTitulo: 'Consultoras de sono',
    listaSub: 'Consultoras independentes',
    listaIntro: 'Consultoras de sono independentes que ajudam com a rotina de sono do bebê. Converse com elas direto pelo WhatsApp.',
    filtros: ['Todas', 'Atende online', 'Presencial'],
    online: 'Online',
    // Perfil na lista (consultants)
    perfilLegenda: 'O seu perfil, como a família vê',
    idades: 'Idades',
    perfilAceite: (nome: string) =>
      `Entendi que ${nome} é uma consultora independente. O Ninho não presta, não cobra e não supervisiona o atendimento dela…`,
    conversarWhatsApp: 'Conversar no WhatsApp',
    verInstagram: 'Ver Instagram',
  },
};
