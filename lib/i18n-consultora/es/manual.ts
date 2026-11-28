/** Painel da consultora · seção "manual" (es). Mesmas chaves do pt (o tipo obriga). */
import type { manual as Pt } from '../pt/manual';

export const manual: typeof Pt = {
  painel: {
    titulo: 'Manual de la asesora',
    tituloDireita: 'el mismo paso a paso del PDF',
    intro:
      'Aquí está el camino completo, de la invitación al seguimiento, con las pantallas de la app. Es el mismo manual que Ninho envía en PDF: **Descargar PDF** genera el archivo con tu nombre, tu correo y tu código, para que lo guardes o lo imprimas.',
    seuCodigo: (codigo: string) => `Tu código es **${codigo}**. Es el que la familia escribe en su app.`,
    baixarPdf: 'Descargar PDF',
    passoAPasso: 'Paso a paso',
    p1Titulo: 'Invita a la familia',
    p1a: (codigo: string) =>
      `En la app, toca **Invitar**, en la barra de abajo (si la barra está cerrada, toca la flechita del centro), y luego **Enviar por WhatsApp**: tu clienta recibe un mensaje con el paso a paso y tu código, **${codigo}**.`,
    p1b: 'Si ya usa Ninho, también puedes usar **Invitar con el correo de la familia**, con exactamente el correo de su cuenta. Aquí en la computadora, lo mismo está en **Invitar a una familia**.',
    p2Titulo: 'La familia acepta',
    p2a: '**Con el código:** en su app, menú ☰ › **Cuidador o asesora** › **Agregar** › **Asesora de sueño**. Escribe tu código, toca **Buscar**, marca la casilla y toca **Compartir la rutina**.',
    p2b: '**Con el correo:** recibe en Avisos el aviso **Solicitud de asesora de sueño**, elige al bebé y toca **Aprobar**. Por este camino ya queda listo.',
    p3Titulo: 'Tú apruebas (solo por el camino del código)',
    p3a: 'Te llega el aviso **Nueva solicitud de una familia**. En **Inicio**, en **Solicitudes de familias**, toca **Aprobar** y luego **Aprobar y seguir**. Aquí en la computadora, la solicitud aparece en **Familias**.',
    p3b: 'Listo: el bebé aparece en **Tus familias**.',
    p4Titulo: 'Sigue la rutina',
    p4a: 'En **Rutina** ves el día de la familia, con cada sueño y el **tiempo despierto** entre ellos. En **Evolución**, las últimas noches una al lado de la otra.',
    p4b: 'El **Informe con IA** lee la rutina y escribe el análisis por ti. En la **ficha de la familia** quedan tus notas, que solo tú ves.',
    p5Titulo: 'Completa tu perfil público',
    p5a: 'En **Mi perfil en la lista** (o, en la app, menú ☰ › **Editar perfil**), agrega una foto, un texto sobre cómo ayudas a las familias, tu ciudad, las edades que atiendes y tu WhatsApp.',
    p5b: 'Ninho lo revisa y te agrega a la lista **Encontrar asesora de sueño**, que las familias ven dentro de la app. La lista muestra hasta 10 asesoras, y quien trae más familias suscritas aparece primero.',
    p6Titulo: 'Trabaja en la computadora',
    p6a: 'En la app, menú ☰ › **Código del panel web**: genera un código de 6 dígitos y úsalo con tu correo en **useninho.com.br/admin/login**, en la pestaña **Soy asesora**. El código vale 10 minutos.',
    p6b: 'Aquí tienes las mismas pantallas, este manual y el PDF.',
    doZeroTitulo: 'Cuando empezaste desde cero',
    doZeroIntro:
      'Estos son los dos manuales completos que Ninho envía a una asesora nueva, con los pasos para descargar la app y crear la cuenta. Sirven para volver a leerlos o mostrárselos a una amiga que recomendaste.',
    semConta: 'Para quien todavía no tiene cuenta en Ninho',
    comConta: 'Para quien ya tiene cuenta en Ninho',
    baixarEste: 'Descargar este PDF',
  },

  pdf: {
    copiado: '¡Copiado!',
    copiarTexto: 'Copiar texto',
    soTexto: 'Solo el texto por WhatsApp',
    gerando: 'Generando PDF…',
    baixarPdf: 'Descargar PDF',
    enviarPdf: 'Enviar PDF por WhatsApp',
    erro: 'No pude generar el PDF ahora. Inténtalo de nuevo.',
    dicaEnviar:
      'En la computadora, el PDF se descarga y WhatsApp se abre con el mensaje: arrastra el PDF a la conversación. En el celular, elige WhatsApp en la lista.',
    nomeArquivo: (nome: string) => `Manual Ninho - ${nome}.pdf`,
    cabecalho: 'Manual de la asesora',
    pagina: (n: number, total: number) => `página ${n} de ${total}`,
    capaOi: (nome: string) => `¡Hola, ${nome}! ¡Qué bueno tenerte aquí!`,
    capaSemConta: 'Preparé este paso a paso para que empieces en Ninho. Es rápido, y te voy mostrando cada pantalla. ¿Vamos juntas?',
    capaComConta: 'Como ya usas Ninho, falta muy poco. Preparé este paso a paso con cada pantalla, para que empieces a seguir a tus clientas.',
    seuEmail: 'Tu correo de asesora',
    seuCodigo: 'Tu código',
    baixarTitulo: 'Para empezar, descarga Ninho',
    baixarTexto:
      'Toca el botón de abajo: abre la App Store en el iPhone o Google Play en Android. Toca **Obtener** (o **Instalar**) y, cuando termine, vuelve aquí para seguir.',
    baixarBotao: 'Toca aquí para descargar Ninho',
    contaTitulo: 'Ahora crea tu cuenta',
    contaA: (email: string) =>
      `Abre Ninho y entra con Apple, con Google o con tu correo para seguir. Lo importante es usar el correo **${email}**: es el que habilité para ti como asesora.`,
    contaB:
      '**Con el correo:** toca **¿Primera vez aquí? Crear cuenta**, escribe el correo y una contraseña y confirma con el código de 6 dígitos que llega a tu correo (revisa también el spam). **Con Google:** elige la cuenta de ese correo. **Con Apple:** elige compartir tu correo, no **ocultar mi correo**, así la app te reconoce.',
    abrirTitulo: 'Abre Ninho con el correo habilitado',
    abrirA: (email: string) =>
      `Como ya usas Ninho, solo cierra la app y vuelve a abrirla, con la cuenta del correo **${email}**. La app reconoce sola tu cuenta de asesora.`,
    abrirB:
      'Si ya tienes un bebé registrado, aparece la pregunta **Tu cuenta ya está habilitada como asesora**: toca **Usar modo asesora**. Puedes volver cuando quieras desde el menú, en **Cambiar a cuenta normal**. La primera vez, lee los Términos de la Asesora, marca la casilla y toca **Empezar**.',
    abrirC: 'Si entras a Ninho con otro correo, dime cuál es y vinculo tu cuenta desde aquí.',
    termoTitulo: 'Acepta los Términos de la Asesora',
    termoTexto: (nome: string) =>
      `Apenas entras, la app abre tu área de asesora con un mensaje de bienvenida: **Bienvenida, ${nome}**. Lee los términos con calma, marca **Leí y acepto los Términos de la Asesora** y toca **Empezar**. Luego aparecen tres pantallas rápidas de presentación.`,
    convidarTitulo: 'Invita a tu primera clienta',
    convidarA: (codigo: string) =>
      `Ahora invitemos a tu primera clienta. Toca **Invitar a una familia** (o **Invitar**, en la barra de abajo; si está cerrada, toca la flechita del centro) y luego **Enviar por WhatsApp**. Tu clienta recibe un mensaje con el paso a paso y tu código, **${codigo}**.`,
    convidarB: 'Si prefieres, invítala por correo, en **Invitar con el correo de la familia**. Usa el correo con el que entra a Ninho.',
    aceitaTitulo: 'Mira cómo lo recibe tu clienta',
    aceitaA: 'Cuando invitas, tu clienta tiene dos caminos, según cómo la invitaste:',
    aceitaB:
      '**Por WhatsApp (con tu código):** sigue este camino en su app: menú ☰ › **Cuidador o asesora** › **Agregar** › **Asesora de sueño**. Escribe tu código, toca **Buscar**, marca la casilla y toca **Compartir la rutina**.',
    aceitaC: '**Por correo:** le llega un aviso en Avisos, **Solicitud de asesora de sueño**. Elige al bebé y toca **Aprobar**.',
    aprovarTitulo: 'Aprueba la solicitud y sigue',
    aprovarA:
      'Cuando tu clienta usa tu código, te llega el aviso **Nueva solicitud de una familia**. En **Inicio**, en **Solicitudes de familias**, toca **Aprobar** y luego **Aprobar y seguir**.',
    aprovarB:
      '¡Listo! El bebé aparece en **Tus familias**, y sigues la rutina en **Rutina** y **Evolución**. Si ella aprobó desde Avisos, no necesitas este paso: el bebé ya aparece para ti.',
    perfilTitulo: 'Completa tu perfil público',
    perfilA:
      'Ahora el paso que te pone en la vitrina: tu perfil público. Más de 2 mil personas ya usan Ninho, y quien busca ayuda con el sueño del bebé encuentra a las asesoras dentro de la app.',
    perfilB:
      'En el menú ☰, toca **Editar perfil** (o **Completar perfil**, en la presentación). Agrega una foto, un texto corto sobre cómo ayudas, tu ciudad, las edades que atiendes y tu WhatsApp, y toca **Guardar**.',
    perfilC: 'Reviso el texto y la foto y agrego tu perfil a la lista. Solo evita prometer resultados e indicar medicamentos o posiciones para dormir.',
    vitrineTitulo: 'Mira cómo te van a encontrar',
    vitrineA: 'En la app, la familia abre el menú ☰ › **Apoyo** › **Encontrar asesora de sueño**. Ahí ve la lista con foto, nombre y ciudad.',
    vitrineB: 'Al tocar tu nombre, ve tu perfil completo y el botón **Hablar por WhatsApp**, que abre la conversación directo contigo.',
    vitrineC: 'La lista muestra hasta 10 asesoras, y quien trae más familias suscritas aparece primero. Cuanto más invitas, más cerca del inicio quedas.',
    ajudaTitulo: 'Estoy aquí contigo',
    ajudaTexto:
      'Cualquier duda, escríbeme por WhatsApp, a la hora que sea. Si te trabas en alguna pantalla, mándame una captura y lo resolvemos juntas. Tus sugerencias son muy bienvenidas: con ellas Ninho mejora para tu trabajo.',
    ajudaAssinatura: 'Un abrazo, Mailson · Ninho',
  },

  mensagem: {
    comuns: (codigo: string, n: number) =>
      `${n}. La primera vez aparecen los Términos de la Asesora. Léelos, marca "Leí y acepto los Términos de la Asesora" y toca "Empezar".\n\n` +
      `${n + 1}. Para invitar a una clienta, toca "Invitar" en la barra de abajo (si la barra está cerrada, toca la flechita del centro) y luego "Enviar por WhatsApp". ` +
      `Ella recibe el paso a paso con tu código: ${codigo}.\n` +
      `También puedes invitar con el correo de la clienta, en "Invitar con el correo de la familia".\n\n` +
      `${n + 2}. Cuando la clienta escriba tu código, te llega el aviso "Nueva solicitud de una familia". En Inicio, toca "Aprobar" y luego "Aprobar y seguir". ` +
      `Listo: la rutina del bebé aparece para ti.\n\n` +
      `${n + 3}. Completa tu perfil público: en el menú ☰, toca "Editar perfil" y agrega foto, un texto sobre cómo ayudas a las familias, ciudad, edades que atiendes y WhatsApp. ` +
      `Lo reviso y te agrego a la lista "Encontrar asesora de sueño", que las familias ven dentro de la app. Más de 2 mil personas ya usan Ninho.\n\n` +
      `Cualquier duda, escríbeme aquí.`,
    semConta: (nome: string, link: string, email: string) =>
      `¡Hola, ${nome}! Aquí está el paso a paso para empezar en Ninho:\n\n` +
      `1. Toca aquí para descargar Ninho (funciona en iPhone y Android):\n${link}\n\n` +
      `2. Crea tu cuenta con el correo ${email}. Tiene que ser exactamente ese, porque es el que está habilitado como asesora.\n` +
      `- Puedes tocar "Continuar con Google", si es un correo de Google.\n` +
      `- O toca "¿Primera vez aquí? Crear cuenta", escribe el correo y una contraseña y confirma con el código de 6 dígitos que llega al correo.\n` +
      `- Si entras con Apple, no elijas "ocultar mi correo", si no la app no te reconoce.\n\n`,
    comConta: (nome: string, email: string) =>
      `¡Hola, ${nome}! Como ya usas Ninho, es todavía más simple:\n\n` +
      `1. Revisa que tu cuenta en la app sea la del correo ${email}. Ese es el correo habilitado como asesora. ` +
      `Si entras con otro correo, dime cuál es y vinculo tu cuenta desde aquí.\n\n` +
      `2. Cierra Ninho y vuelve a abrirlo. La app reconoce sola tu cuenta de asesora.\n` +
      `- Si ya tienes un bebé registrado, aparece la pregunta "Tu cuenta ya está habilitada como asesora". Toca "Usar modo asesora".\n` +
      `- Luego cambias cuando quieras desde el menú: "Cambiar a cuenta normal" o "Cambiar a modo asesora".\n\n`,
    comPdf: (nome: string, link: string | null) =>
      `¡Hola, ${nome}! ¿Cómo estás? ¡Qué bueno tenerte como nuestra asesora aliada!\n\n` +
      `Aquí va el PDF con la guía para usar Ninho.` +
      (link ? ` Para empezar, descarga la app aquí:\n${link}` : '') +
      `\n\nCualquier duda, estamos para ayudarte, a la hora que lo necesites.`,
  },

  whatsapp: {
    enviar: 'Enviar por WhatsApp',
    copiar: 'Copiar',
    copiado: '¡Copiado!',
  },

  barra: {
    rotina: 'Rutina',
    evolucao: 'Evolución',
    inicio: 'Inicio',
    convidar: 'Invitar',
    ganhos: 'Ganancias',
    ajuda: 'Ayuda',
    painel: 'Panel',
  },

  telas: {
    lojaLegenda: 'App Store o Google Play',
    lojaSub: 'Rutina y recuerdos del bebé',
    lojaObter: 'OBTENER',
    lojaCompras: 'Compras dentro de la app',
    lojaAvaliacoes: 'CALIFICACIONES',
    lojaNota: '4,9',
    lojaIdade: 'EDAD',
    lojaCategoria: 'CATEGORÍA',
    lojaEstilo: 'Estilo de vida',
    loginLegenda: 'Pantalla de entrada de Ninho',
    soneca: 'Siesta',
    sonecaDetalhe: (hora: string) => `1h 20min · ${hora}`,
    mamadeira: 'Biberón',
    mamadeiraDetalhe: '120 ml · ahora',
    heroTopo: 'La rutina del bebé,',
    heroBaixo: 'fácil y en familia.',
    heroSub: 'Sueño, tomas y recuerdos en un solo lugar.',
    continuarApple: 'Continuar con Apple',
    continuarGoogle: 'Continuar con Google',
    continuarEmail: 'Continuar con correo',
    novoAqui: '¿Primera vez aquí?',
    criarConta: 'Crear cuenta',
    termos: 'Términos',
    privacidade: 'Privacidad',
    criarContaLegenda: 'Crear la cuenta con el correo habilitado',
    criarContaSub: 'Toma menos de un minuto.',
    email: 'Correo',
    senha: 'Contraseña',
    repitaSenha: 'Repite la contraseña',
    jaTemConta: '¿Ya tienes una cuenta?',
    entrar: 'Iniciar sesión',
    confirmarLegenda: 'El código que llega al correo',
    confirmarTitulo: 'Confirma tu correo',
    confirmarSub: (email?: string) => `Te enviamos un código de 6 dígitos a ${email ?? 'tu correo'}. Revisa también la carpeta de spam.`,
    confirmar: 'Confirmar',
    termoLegenda: 'Términos de la Asesora (solo la primera vez)',
    termoBemVinda: (nome: string) => `Bienvenida, ${nome}`,
    termoPronta: 'Tu cuenta de asesora está lista',
    termoLiberada: 'Tu cuenta de asesora ya está habilitada',
    termoLiberadaCorpo: 'Ahora puedes seguir la rutina de las familias que la compartan contigo.',
    termoRotulo: 'Términos de la Asesora',
    termoItens: [
      'Eres independiente y la única responsable de las orientaciones que das a las familias. Nunca indiques medicamentos, dosis ni posición para dormir, ni prometas resultados. Los temas de salud son con el pediatra.',
      'Usa la rutina de los bebés solo para atender a esa familia. No copies, guardes ni compartas esos datos.',
      'Al compartir tu enlace, avisa que tienes una colaboración con Ninho ("#publicidad").',
    ],
    termoAceito: 'Leí y acepto los Términos de la Asesora',
    comecar: 'Empezar',
    inicioLegenda: 'El área de la asesora',
    inicio: 'Inicio',
    bomDiaFamilias: (nome: string, n: number) => `Buenos días, ${nome} · ${n} ${n === 1 ? 'familia' : 'familias'}`,
    suasFamilias: 'Tus familias',
    nenhumaFamilia: 'Todavía no hay familias',
    nenhumaFamiliaCorpo: 'Cuando una familia escriba tu código en Cuidador o asesora, el bebé aparecerá aquí.',
    convidarFamilia: 'Invitar a una familia',
    convidarLegenda: 'Invitar: tu código y WhatsApp',
    convidarSub: 'Ellas comparten la rutina contigo',
    codigo: 'Código',
    codigoDica:
      'La familia escribe el código en Cuidador o asesora › Agregar › Asesora de sueño, y tú apruebas en Familias. El mensaje de WhatsApp ya explica el paso a paso.',
    whatsapp: 'WhatsApp',
    compartilhar: 'Compartir',
    porEmailTitulo: 'Invitar con el correo de la familia',
    porEmailDica: 'Usa exactamente el correo con el que la familia entra a Ninho. Recibe la invitación en Avisos, elige al bebé y aprueba.',
    emailFamilia: 'correo de la familia',
    zapLegenda: 'El mensaje que recibe la familia',
    zapOnline: 'en línea',
    zapMensagem: (codigo: string) =>
      `¡Hola! Sigo la rutina de sueño del bebé con Ninho. Es muy rápido:
1. Descarga Ninho: useninho.com.br/indica/${codigo}
2. Crea tu cuenta
3. Abre el menú ☰
4. Toca Cuidador o asesora › Agregar › Asesora de sueño
5. Escribe mi código: ${codigo}
Luego yo apruebo y seguimos la rutina en conjunto.`,
    adicionarLegenda: 'Familia: ☰ › Cuidador o asesora › Agregar',
    cuidadorOuConsultor: 'Cuidador o asesora',
    quemAcompanha: (bebe: string) => `Quién cuida a ${bebe} contigo`,
    quemCuida: 'Quién cuida',
    maeResponsavel: 'Mamá · responsable principal',
    quemAdicionar: '¿A quién quieres agregar?',
    cuidadorFamilia: 'Cuidador de la familia',
    cuidadorFamiliaCorpo: 'Papá, abuela, niñera… Ve y registra todo, y usa tu plan.',
    consultoraSono: 'Asesora de sueño',
    consultoraSonoCorpo: 'Solo sigue la rutina de sueño y de tomas. No registra ni ve fotos.',
    familiaCodigoLegenda: 'La familia escribe el código y comparte',
    familiaSub: 'Comparte la rutina con quien te ayuda',
    codigoConsultora: 'Código de la asesora',
    buscar: 'Buscar',
    consultoraIndependenteSono: 'Asesora de sueño independiente',
    familiaAceite: (nome: string, bebe: string) =>
      `Autorizo a ${nome} a ver, solo para lectura: el nombre y la fecha de nacimiento de ${bebe}, el primer nombre del responsable y de quien hizo cada registro, el sueño, las tomas, los pañales, la comida y si tenemos plan. Ella no ve fotos, momentos ni el chat…`,
    compartilharRotina: 'Compartir la rutina',
    sininhoLegenda: 'Invitación por correo: la familia la recibe en Avisos',
    pedidosConsultora: 'Solicitudes de asesora',
    pedidosConsultoraSub: 'Invitaciones y solicitudes esperando respuesta',
    convitesRecebidos: 'Invitaciones recibidas',
    querAcompanhar: (nome: string) => `${nome} quiere seguir la rutina de tu bebé.`,
    qualBebe: '¿A qué bebé va a seguir?',
    recusar: 'Rechazar',
    aprovar: 'Aprobar',
    pedidoLegenda: 'La solicitud te llega a ti',
    pedidosFamilias: 'Solicitudes de familias',
    pedidosFamiliasDica: 'Te pidieron que sigas su rutina. El bebé solo aparece en tu lista después de que apruebes.',
    pediuEm: (data: string) => `Lo pidió el ${data}`,
    avisoApp: 'NINHO',
    avisoAgora: 'ahora',
    avisoTitulo: 'Nueva solicitud de una familia',
    avisoCorpo: (mae: string, bebe: string) => `${mae} quiere que sigas la rutina de ${bebe}.`,
    aprovadoLegenda: 'Listo: el bebé entra a tu lista',
    aprovadoOk: 'Listo. El bebé ya aparece en tu lista.',
    maeUltimo: (mae: string, hora: string) => `Mamá: ${mae} · Último registro · ${hora}`,
    modoLegenda: 'Quien ya tiene un bebé en la app ve esta pregunta',
    hoje: (data: string) => `Hoy, ${data}`,
    ritmoDoDia: 'Ritmo del día',
    modoTitulo: 'Tu cuenta ya está habilitada como asesora',
    modoCorpo: '¿Quieres usar Ninho en modo asesora? Puedes cambiarlo cuando quieras desde el menú.',
    modoUsar: 'Usar modo asesora',
    agoraNao: 'Ahora no',
    aparecaLegenda: 'Presentación: Aparece en Ninho',
    passoDe: (n: number, total: number) => `${n} de ${total}`,
    aparecaCampos: ['Foto', 'Ciudad', 'Edades que atiende', 'WhatsApp'],
    aparecaTitulo: 'Aparece en Ninho',
    aparecaCorpo: 'Con foto, ciudad, edades y WhatsApp, entras a la lista que las familias ven en la app.',
    completarPerfil: 'Completar perfil',
    fazerDepois: 'Hacerlo después',
    editarLegenda: 'Menú ☰ › Editar perfil',
    editarPerfil: 'Editar perfil',
    consultoraIndependente: 'Asesora independiente',
    trocarFoto: 'Cambiar foto',
    sobreVoce: 'Sobre ti',
    bioExemplo: 'Ayudo a las familias a crear una rutina de sueño amable, al ritmo de cada bebé.',
    cidadeUf: 'Ciudad · Estado',
    instagram: 'Instagram',
    instagramExemplo: '@tuperfil',
    atende: 'Atiende',
    presencialEOnline: 'Presencial y en línea',
    idadesQueAtende: 'Edades que atiende',
    idadesExemplo: '0 a 3 años',
    salvar: 'Guardar',
    listaLegenda: 'Familia: ☰ › Apoyo › Encontrar asesora de sueño',
    listaTitulo: 'Asesoras de sueño',
    listaSub: 'Asesoras independientes',
    listaIntro: 'Asesoras de sueño independientes que ayudan con la rutina de sueño del bebé. Habla con ellas directamente por WhatsApp.',
    filtros: ['Todas', 'Atiende en línea', 'Presencial'],
    online: 'En línea',
    perfilLegenda: 'Tu perfil, como lo ve la familia',
    idades: 'Edades',
    perfilAceite: (nome: string) => `Entiendo que ${nome} es una asesora independiente. Ninho no presta, no cobra ni supervisa sus servicios…`,
    conversarWhatsApp: 'Hablar por WhatsApp',
    verInstagram: 'Ver Instagram',
  },
};
