/** Painel da consultora · seção "manual" (en). Mesmas chaves do pt (o tipo obriga). */
import type { manual as Pt } from '../pt/manual';

export const manual: typeof Pt = {
  painel: {
    titulo: 'Consultant handbook',
    tituloDireita: 'the same step by step as the PDF',
    intro:
      'Here is the whole path, from the invite to following the baby, with the app screens. It is the same handbook Ninho sends as a PDF: **Download PDF** creates the file with your name, your email and your code, so you can keep it or print it.',
    seuCodigo: (codigo: string) => `Your code is **${codigo}**. This is the code the family types in their app.`,
    baixarPdf: 'Download PDF',
    passoAPasso: 'Step by step',
    p1Titulo: 'Invite the family',
    p1a: (codigo: string) =>
      `In the app, tap **Invite** in the bottom bar (if the bar is closed, tap the little arrow in the middle) and then **Send on WhatsApp**: your client gets a message with the step by step and your code, **${codigo}**.`,
    p1b: 'If she already uses Ninho, you can also use **Invite by the family\'s email**, with the exact email of her account. Here on the computer, the same option is under **Invite a family**.',
    p2Titulo: 'The family accepts',
    p2a: '**By code:** in her app, menu ☰ › **Caregiver or Consultant** › **Add** › **Sleep consultant**. She types your code, taps **Search**, checks the box and taps **Share the routine**.',
    p2b: '**By email:** she gets a **Sleep consultant request** in the bell, picks the baby and taps **Approve**. On this path it is already done.',
    p3Titulo: 'You approve (only on the code path)',
    p3a: 'You get a **New family request** notice. On **Home**, under **Requests from families**, tap **Approve** and then **Approve and follow**. Here on the computer, the request shows up under **Families**.',
    p3b: 'That\'s it: the baby shows up under **Your families**.',
    p4Titulo: 'Follow the routine',
    p4a: 'In **Routine** you see the family\'s day, with every sleep and the **wake window** between them. In **Progress**, the last nights side by side.',
    p4b: 'The **AI report** reads the routine and writes the analysis for you. The **family profile** holds your notes, which only you can see.',
    p5Titulo: 'Complete your public profile',
    p5a: 'In **My profile on the list** (or, in the app, menu ☰ › **Edit profile**), add a photo, a text about how you help families, your city, the ages you work with and your WhatsApp.',
    p5b: 'Ninho reviews it and lists you under **Find a sleep consultant**, which families see inside the app. The list shows up to 10 consultants, and whoever brings more subscribing families comes first.',
    p6Titulo: 'Work on your computer',
    p6a: 'In the app, menu ☰ › **Web panel code**: generate a 6-digit code and use it with your email at **useninho.com.br/admin/login**, on the **I\'m a consultant** tab. The code lasts 10 minutes.',
    p6b: 'Here you get the same screens, this handbook and the PDF.',
    doZeroTitulo: 'When you started from scratch',
    doZeroIntro:
      'These are the two full handbooks Ninho sends to a new consultant, with the steps to download the app and create the account. Use them to read again or to show a friend you referred.',
    semConta: 'For someone without a Ninho account yet',
    comConta: 'For someone who already has a Ninho account',
    baixarEste: 'Download this PDF',
  },

  pdf: {
    copiado: 'Copied!',
    copiarTexto: 'Copy text',
    soTexto: 'Text only on WhatsApp',
    gerando: 'Creating PDF…',
    baixarPdf: 'Download PDF',
    enviarPdf: 'Send PDF on WhatsApp',
    erro: 'I couldn\'t create the PDF right now. Please try again.',
    dicaEnviar:
      'On a computer, the PDF downloads and WhatsApp opens with the message: drag the PDF into the chat. On a phone, choose WhatsApp from the list.',
    nomeArquivo: (nome: string) => `Ninho handbook - ${nome}.pdf`,
    cabecalho: 'Consultant handbook',
    pagina: (n: number, total: number) => `page ${n} of ${total}`,
    capaOi: (nome: string) => `Hi, ${nome}! So glad to have you here!`,
    capaSemConta: 'I put together this step by step so you can start on Ninho. It\'s quick, and I\'ll show you each screen along the way. Shall we?',
    capaComConta:
      'Since you already use Ninho, you\'re almost there. I put together this step by step showing each screen, so you can start following your clients.',
    seuEmail: 'Your consultant email',
    seuCodigo: 'Your code',
    baixarTitulo: 'To start, download Ninho',
    baixarTexto:
      'Tap the button below: it opens the App Store on iPhone or Google Play on Android. Tap **Get** (or **Install**) and, when it finishes, come back here so we can continue.',
    baixarBotao: 'Tap here to download Ninho',
    contaTitulo: 'Now create your account',
    contaA: (email: string) =>
      `Open Ninho and sign in with Apple, with Google or with your email so we can continue. What matters is using the email **${email}**: it is the one I enabled for you as a consultant.`,
    contaB:
      '**With email:** tap **New here? Create account**, enter the email and a password and confirm with the 6-digit code sent to your email (check spam too). **With Google:** choose the account for that email. **With Apple:** choose to share your email, not **Hide My Email**, so the app recognizes you.',
    abrirTitulo: 'Open Ninho with the enabled email',
    abrirA: (email: string) =>
      `Since you already use Ninho, just close the app and open it again, signed in with **${email}**. The app recognizes your consultant account on its own.`,
    abrirB:
      'If you already have a baby added, you will see the question **Your account is now a consultant account**: tap **Use consultant mode**. You can switch back anytime from the menu, in **Switch to regular account**. The first time, read the Consultant Terms, check the box and tap **Get started**.',
    abrirC: 'If you sign in to Ninho with a different email, tell me which one and I\'ll link your account from here.',
    termoTitulo: 'Accept the Consultant Terms',
    termoTexto: (nome: string) =>
      `As soon as you sign in, the app opens your consultant area with a welcome message: **Welcome, ${nome}**. Read the terms calmly, check **I have read and accept the Consultant Terms** and tap **Get started**. Then three quick intro screens show up.`,
    convidarTitulo: 'Invite your first client',
    convidarA: (codigo: string) =>
      `Now let's invite your first client. Tap **Invite a family** (or **Invite** in the bottom bar; if it is closed, tap the little arrow in the middle) and then **Send on WhatsApp**. Your client gets a message with the step by step and your code, **${codigo}**.`,
    convidarB: 'If you prefer, invite her by email, in **Invite by the family\'s email**. Use the email she signs in to Ninho with.',
    aceitaTitulo: 'See how your client receives it',
    aceitaA: 'When you invite, your client has two paths, depending on how you invited her:',
    aceitaB:
      '**On WhatsApp (with your code):** she follows this path in her app: menu ☰ › **Caregiver or Consultant** › **Add** › **Sleep consultant**. She types your code, taps **Search**, checks the box and taps **Share the routine**.',
    aceitaC: '**By email:** a notification arrives in her bell, **Sleep consultant request**. She picks the baby and taps **Approve**.',
    aprovarTitulo: 'Approve the request and follow',
    aprovarA:
      'When your client uses your code, you get a **New family request** notice. On **Home**, under **Requests from families**, tap **Approve** and then **Approve and follow**.',
    aprovarB:
      'Done! The baby shows up under **Your families**, and you follow the routine in **Routine** and **Progress**. If she approved from the bell, you can skip this step: the baby already shows up for you.',
    perfilTitulo: 'Complete your public profile',
    perfilA:
      'Now the step that puts you in the showcase: your public profile. More than 2,000 people already use Ninho, and anyone looking for help with baby sleep finds consultants right inside the app.',
    perfilB:
      'In menu ☰, tap **Edit profile** (or **Complete profile**, in the intro). Add a photo, a short text about how you help families, your city, the ages you work with and your WhatsApp, and tap **Save**.',
    perfilC:
      'I review the text and the photo and add your profile to the list. Just avoid promising results and recommending medicine or sleep positions.',
    vitrineTitulo: 'See how families will find you',
    vitrineA: 'In the app, the family opens menu ☰ › **Support** › **Find a sleep consultant**. There they see the list with photo, name and city.',
    vitrineB: 'When she taps your name, she sees your full profile and the **Chat on WhatsApp** button, which opens a chat straight with you.',
    vitrineC:
      'The list shows up to 10 consultants, and whoever brings more subscribing families comes first. The more you invite, the closer to the top you get.',
    ajudaTitulo: 'I\'m here with you',
    ajudaTexto:
      'Any questions, message me on WhatsApp, at any time. If you get stuck on a screen, send me a screenshot and we\'ll sort it out together. Your suggestions are very welcome: they are how Ninho keeps getting better for your work.',
    ajudaAssinatura: 'Warmly, Mailson · Ninho',
  },

  mensagem: {
    comuns: (codigo: string, n: number) =>
      `${n}. The first time, the Consultant Terms show up. Read them, check "I have read and accept the Consultant Terms" and tap "Get started".\n\n` +
      `${n + 1}. To invite a client, tap "Invite" in the bottom bar (if the bar is closed, tap the little arrow in the middle) and then "Send on WhatsApp". ` +
      `She gets the step by step with your code: ${codigo}.\n` +
      `You can also invite by the client's email, in "Invite by the family's email".\n\n` +
      `${n + 2}. When the client enters your code, you get a "New family request" notice. On Home, tap "Approve" and then "Approve and follow". ` +
      `Done: the baby's routine shows up for you.\n\n` +
      `${n + 3}. Complete your public profile: in menu ☰, tap "Edit profile" and add a photo, a text about how you help families, your city, the ages you work with and your WhatsApp. ` +
      `I review it and add you to the "Find a sleep consultant" list, which families see inside the app. More than 2,000 people already use Ninho.\n\n` +
      `Any questions, just message me here.`,
    semConta: (nome: string, link: string, email: string) =>
      `Hi, ${nome}! Here is the step by step to start on Ninho:\n\n` +
      `1. Tap here to download Ninho (works on iPhone and Android):\n${link}\n\n` +
      `2. Create your account with the email ${email}. It has to be exactly this one, because it is the one enabled as a consultant.\n` +
      `- You can tap "Continue with Google", if this is a Google email.\n` +
      `- Or tap "New here? Create account", enter the email and a password and confirm with the 6-digit code sent to the email.\n` +
      `- If you sign in with Apple, don't choose "Hide My Email", or the app won't recognize you.\n\n`,
    comConta: (nome: string, email: string) =>
      `Hi, ${nome}! Since you already use Ninho, it's even simpler:\n\n` +
      `1. Check that your account in the app is the one with the email ${email}. That is the email enabled as a consultant. ` +
      `If you sign in with a different email, tell me which one and I'll link your account from here.\n\n` +
      `2. Close Ninho and open it again. The app recognizes your consultant account on its own.\n` +
      `- If you already have a baby added, you'll see the question "Your account is now a consultant account". Tap "Use consultant mode".\n` +
      `- You can switch anytime from the menu: "Switch to regular account" or "Switch to consultant mode".\n\n`,
    comPdf: (nome: string, link: string | null) =>
      `Hi, ${nome}, how are you? So glad to have you as our partner consultant!\n\n` +
      `Here is the PDF with the guide on how to use Ninho.` +
      (link ? ` To start, download the app here:\n${link}` : '') +
      `\n\nAny questions, we're here for you, at any time you need.`,
  },

  whatsapp: {
    enviar: 'Send on WhatsApp',
    copiar: 'Copy',
    copiado: 'Copied!',
  },

  barra: {
    rotina: 'Routine',
    evolucao: 'Progress',
    inicio: 'Home',
    convidar: 'Invite',
    ganhos: 'Earnings',
    ajuda: 'Help',
    painel: 'Panel',
  },

  telas: {
    lojaLegenda: 'App Store or Google Play',
    lojaSub: 'Baby routine and memories',
    lojaObter: 'GET',
    lojaCompras: 'In-App Purchases',
    lojaAvaliacoes: 'RATINGS',
    lojaNota: '4.9',
    lojaIdade: 'AGE',
    lojaCategoria: 'CATEGORY',
    lojaEstilo: 'Lifestyle',
    loginLegenda: 'Ninho sign-in screen',
    soneca: 'Nap',
    sonecaDetalhe: (hora: string) => `1h 20min · ${hora}`,
    mamadeira: 'Bottle',
    mamadeiraDetalhe: '4 oz · just now',
    heroTopo: 'Your baby\'s routine,',
    heroBaixo: 'easy and shared.',
    heroSub: 'Sleep, feedings and memories in one place.',
    continuarApple: 'Continue with Apple',
    continuarGoogle: 'Continue with Google',
    continuarEmail: 'Continue with email',
    novoAqui: 'New here?',
    criarConta: 'Create account',
    termos: 'Terms',
    privacidade: 'Privacy',
    criarContaLegenda: 'Create the account with the enabled email',
    criarContaSub: 'It takes less than a minute.',
    email: 'Email',
    senha: 'Password',
    repitaSenha: 'Confirm password',
    jaTemConta: 'Already have an account?',
    entrar: 'Sign in',
    confirmarLegenda: 'The code that arrives by email',
    confirmarTitulo: 'Confirm your email',
    confirmarSub: (email?: string) =>
      `We sent a 6-digit code to ${email ?? 'your email'}. Be sure to check your spam folder too.`,
    confirmar: 'Confirm',
    termoLegenda: 'Consultant Terms (first time only)',
    termoBemVinda: (nome: string) => `Welcome, ${nome}`,
    termoPronta: 'Your consultant account is ready',
    termoLiberada: 'Your consultant account is ready',
    termoLiberadaCorpo: 'You can now follow the routine of the families who share it with you.',
    termoRotulo: 'Consultant Terms',
    termoItens: [
      'You are independent and solely responsible for the guidance you give families. Never recommend medicine, doses or sleep positions, and never promise results. Health questions go to the pediatrician.',
      'Use the babies\' routines only to support that family. Do not copy, store or share this data.',
      'When you share your link, say you have a partnership with Ninho ("#ad").',
    ],
    termoAceito: 'I have read and accept the Consultant Terms',
    comecar: 'Get started',
    inicioLegenda: 'The consultant area',
    inicio: 'Home',
    bomDiaFamilias: (nome: string, n: number) => `Good morning, ${nome} · ${n} ${n === 1 ? 'family' : 'families'}`,
    suasFamilias: 'Your families',
    nenhumaFamilia: 'No families yet',
    nenhumaFamiliaCorpo: 'When a family enters your code in Caregivers, the baby shows up here.',
    convidarFamilia: 'Invite a family',
    convidarLegenda: 'Invite: your code and WhatsApp',
    convidarSub: 'They share their routine with you',
    codigo: 'Code',
    codigoDica:
      'The family enters the code in Caregiver or Consultant › Add › Sleep consultant, and you approve in Families. The WhatsApp message already explains the steps.',
    whatsapp: 'WhatsApp',
    compartilhar: 'Share',
    porEmailTitulo: 'Invite by the family\'s email',
    porEmailDica: 'Use the exact email the family signs in to Ninho with. They get the invitation in the bell, choose the baby and approve.',
    emailFamilia: 'family\'s email',
    zapLegenda: 'The message the family receives',
    zapOnline: 'online',
    zapMensagem: (codigo: string) =>
      `Hi! I follow the baby's sleep routine on Ninho. It's quick:
1. Download Ninho: useninho.com.br/indica/${codigo}
2. Create your account
3. Open the ☰ menu
4. Tap Caregiver or Consultant › Add › Sleep consultant
5. Enter my code: ${codigo}
Once I approve, we follow it together.`,
    adicionarLegenda: 'Family: ☰ › Caregiver or Consultant › Add',
    cuidadorOuConsultor: 'Caregiver or Consultant',
    quemAcompanha: (bebe: string) => `Who cares for ${bebe} with you`,
    quemCuida: 'Caregivers',
    maeResponsavel: 'Mom · primary caregiver',
    quemAdicionar: 'Who do you want to add?',
    cuidadorFamilia: 'Family caregiver',
    cuidadorFamiliaCorpo: 'Dad, grandma, nanny… Sees and logs everything, and uses your plan.',
    consultoraSono: 'Sleep consultant',
    consultoraSonoCorpo: 'Only follows the sleep and feeding routine. Can\'t log or see photos.',
    familiaCodigoLegenda: 'The family enters the code and shares',
    familiaSub: 'Share the routine with the person helping you',
    codigoConsultora: 'Consultant code',
    buscar: 'Search',
    consultoraIndependenteSono: 'Independent sleep consultant',
    familiaAceite: (nome: string, bebe: string) =>
      `I authorize ${nome} to view, read-only: ${bebe}'s name and date of birth, the first name of the parent and of whoever logged each entry, sleep, feedings, diapers, food and whether we have a plan. The consultant does not see photos, moments or chat…`,
    compartilharRotina: 'Share the routine',
    sininhoLegenda: 'Email invite: the family gets it in the bell',
    pedidosConsultora: 'Consultant requests',
    pedidosConsultoraSub: 'Invitations and requests waiting for an answer',
    convitesRecebidos: 'Invitations received',
    querAcompanhar: (nome: string) => `${nome} would like to follow your baby's routine.`,
    qualBebe: 'Which baby will she follow?',
    recusar: 'Decline',
    aprovar: 'Approve',
    pedidoLegenda: 'The request reaches you',
    pedidosFamilias: 'Requests from families',
    pedidosFamiliasDica: 'They asked you to follow their routine. The baby only shows up on your list after you approve.',
    pediuEm: (data: string) => `Requested on ${data}`,
    avisoApp: 'NINHO',
    avisoAgora: 'now',
    avisoTitulo: 'New family request',
    avisoCorpo: (mae: string, bebe: string) => `${mae} would like you to follow ${bebe}'s routine.`,
    aprovadoLegenda: 'Done: the baby joins your list',
    aprovadoOk: 'Done. The baby now shows up on your list.',
    maeUltimo: (mae: string, hora: string) => `Mom: ${mae} · Last entry · ${hora}`,
    modoLegenda: 'Anyone who already has a baby in the app sees this question',
    hoje: (data: string) => `Today, ${data}`,
    ritmoDoDia: 'Rhythm of the day',
    modoTitulo: 'Your account is now a consultant account',
    modoCorpo: 'Do you want to use Ninho in consultant mode? You can switch anytime from the menu.',
    modoUsar: 'Use consultant mode',
    agoraNao: 'Not now',
    aparecaLegenda: 'Intro: Show up in Ninho',
    passoDe: (n: number, total: number) => `${n} of ${total}`,
    aparecaCampos: ['Photo', 'City', 'Ages you work with', 'WhatsApp'],
    aparecaTitulo: 'Show up in Ninho',
    aparecaCorpo: 'With a photo, city, ages and WhatsApp, you join the list families see in the app.',
    completarPerfil: 'Complete profile',
    fazerDepois: 'Do it later',
    editarLegenda: 'Menu ☰ › Edit profile',
    editarPerfil: 'Edit profile',
    consultoraIndependente: 'Independent consultant',
    trocarFoto: 'Change photo',
    sobreVoce: 'About you',
    bioExemplo: 'I help families build a gentle sleep routine, at each baby\'s own pace.',
    cidadeUf: 'City · State',
    instagram: 'Instagram',
    instagramExemplo: '@yourprofile',
    atende: 'Works',
    presencialEOnline: 'In person and online',
    idadesQueAtende: 'Ages you work with',
    idadesExemplo: '0 to 3 years',
    salvar: 'Save',
    listaLegenda: 'Family: ☰ › Support › Find a sleep consultant',
    listaTitulo: 'Sleep consultants',
    listaSub: 'Independent consultants',
    listaIntro: 'Independent sleep consultants who help with your baby\'s sleep routine. Talk to them directly on WhatsApp.',
    filtros: ['All', 'Online', 'In person'],
    online: 'Online',
    perfilLegenda: 'Your profile, as the family sees it',
    idades: 'Ages',
    perfilAceite: (nome: string) =>
      `I understand that ${nome} is an independent consultant. Ninho does not provide, charge for or supervise her services…`,
    conversarWhatsApp: 'Chat on WhatsApp',
    verInstagram: 'See Instagram',
  },
};
