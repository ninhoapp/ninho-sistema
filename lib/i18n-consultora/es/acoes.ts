/** Painel da consultora · seção "acoes" (es). Mesmas chaves do pt (o tipo obriga). */
import type { acoes as Pt } from '../pt/acoes';

export const acoes: typeof Pt = {
  contaNaoAtiva: 'Tu cuenta no está activa ahora.',
  familiaNaoEncontrada: 'No encontramos la familia.',
  pedidoNaoEncontrado: 'No encontramos la solicitud.',
  emailInvalido: 'Correo no válido.',
  whatsappComDdd: 'WhatsApp con código de área (ej.: 11 98765-4321).',
  erroEnviar: 'No pude enviarlo ahora. Inténtalo de nuevo.',
  limiteHoje: 'Llegaste al límite de invitaciones de hoy. Inténtalo mañana.',
  aceiteDesatualizado: 'La versión de los términos está desactualizada. Recarga la página.',

  perfil: {
    contaAindaNaoAtiva: 'Tu cuenta todavía no está activa.',
    ufInvalida: 'Estado con 2 letras (ej.: SP).',
    instagramInvalido: 'Instagram no válido. Usa solo tu @.',
    cpfInvalido: 'CPF con 11 números.',
    pixInvalido: 'Clave Pix no válida.',
    erroSalvar: 'No pude guardar ahora. Inténtalo de nuevo.',
    salvoComTexto: 'Guardado. El texto nuevo fue a Ninho para su aprobación; lo demás ya vale.',
    salvo: 'Perfil guardado.',
  },

  foto: {
    escolha: 'Elige una foto.',
    formato: 'La foto debe ser JPG, PNG o WebP.',
    grande: 'La foto pasa de 2 MB. Envía una más pequeña.',
    erroGuardar: 'No pude guardar la foto. Inténtalo de nuevo.',
    enviada: 'Foto enviada. Aparece después de que Ninho la apruebe.',
  },

  indicar: {
    soAtiva: 'Solo una asesora activa puede recomendar.',
    nome: 'Escribe el nombre.',
    email: 'Escribe el correo que ella va a usar en la app.',
    instagramInvalido: 'Instagram no válido. Usa solo el @ de ella.',
    jaIndicada: 'Esta persona ya fue recomendada o habilitada.',
    limite: 'Llegaste al límite de recomendaciones por ahora. Inténtalo mañana.',
    jaTemPedido: 'Esta persona ya tiene una solicitud.',
    enviada: 'Recomendación enviada. Ninho la va a revisar.',
  },

  pedidoFamilia: {
    marqueAceite: 'Para aprobar, marca la aceptación.',
    naoEncontrado: 'Esta solicitud ya fue respondida o la familia la canceló.',
    soResponsavel: 'Quien la pidió ya no es la responsable principal del bebé.',
    erro: 'No pude responder ahora. Inténtalo de nuevo.',
    aprovado: 'Solicitud aprobada: la familia aparece en tu lista.',
    recusado: 'Solicitud rechazada.',
  },

  convidar: {
    marqueAceite: 'Para invitar, marca la aceptación.',
    ok: (email: string) =>
      `Invitación registrada para ${email}. Si esta persona ya es responsable de un bebé en Ninho, la recibe ahora en Avisos. Si es cuidadora, la solicitud va al responsable principal. Si todavía no tiene cuenta, la invitación queda guardada y llega cuando cree la cuenta. Revisa que el correo esté bien.`,
  },

  ficha: {
    terminoAntes: 'La fecha de término no puede ser anterior al inicio.',
    encontros: 'Sesiones: usa números de 0 a 999.',
    whatsappInvalido: 'WhatsApp no válido.',
    semAcesso: 'Esta familia ya no comparte la rutina contigo.',
    invalido: 'Revisa los campos de la ficha.',
    erro: 'No pude guardar la ficha ahora. Inténtalo de nuevo.',
    salva: 'Ficha guardada.',
  },

  continuar: {
    indisponivel: 'Las solicitudes todavía no están disponibles.',
    erro: 'No pude marcarla ahora. Inténtalo de nuevo.',
    ok: 'Solicitud marcada como atendida.',
  },

  orientacao: {
    vazio: 'Escribe la orientación antes de enviarla.',
    longo: (max: number) => `La orientación pasa de ${max} caracteres.`,
    indisponivel: 'Las orientaciones todavía no están disponibles. Apenas Ninho las habilite, aparecen aquí.',
    indisponivelCurto: 'Las orientaciones todavía no están disponibles.',
    marqueTermo: 'Para enviar la primera orientación, marca los términos.',
    termoDesatualizado: 'La versión de los términos está desactualizada. Recarga la página.',
    erroTermo: 'No pude registrar tu aceptación ahora. Inténtalo de nuevo.',
    semAcesso: 'Esta familia ya no comparte la rutina contigo (o no tiene plan).',
    semAceite: 'Para enviar, tienes que aceptar los términos. Recarga la página.',
    familiaSemAceite: 'La familia todavía no aceptó recibir orientaciones por Ninho. Ve la solicitud al abrir la app.',
    link: 'La orientación no puede tener enlaces. Quita la dirección y envíala de nuevo.',
    enviada: 'Orientación enviada. La familia la recibe en Avisos y en el celular.',
  },

  relatorio: {
    semPlano: 'Esta familia no tiene plan: la rutina vuelve cuando se suscriba.',
    pronto: 'Informe listo.',
    pedido: 'Informe solicitado. Aparece en la lista en unos instantes.',
  },

  convite: {
    naoEncontrado: 'No encontramos la invitación.',
    cancelado: 'Invitación cancelada.',
    jaRespondido: 'Esta invitación ya había sido respondida o cancelada.',
    erroCancelar: 'No pude cancelarla ahora. Inténtalo de nuevo.',
  },

  encerrar: {
    ok: 'Acompañamiento terminado. Avisamos a la familia.',
    jaNaoCompartilhava: 'Esta familia ya no compartía la rutina contigo.',
    erro: 'No pude terminarlo ahora. Inténtalo de nuevo.',
  },

  sugestao: {
    vazia: 'Escribe tu idea antes de enviarla.',
    longa: (max: number) => `Usa hasta ${max} caracteres.`,
    ok: 'Recibimos tu sugerencia. ¡Gracias por ayudar a mejorar Ninho!',
    indisponivel: 'Las sugerencias abren pronto. Inténtalo más tarde.',
  },

  ia: {
    rodape: 'Informe generado con IA a partir de los registros de la app. No es una evaluación de salud y no reemplaza al pediatra.',
    indisponivel: 'El Informe con IA todavía no está disponible en el panel. Pruébalo en la app.',
    erro: 'No pude generarlo ahora. Inténtalo de nuevo en unos instantes.',
    erroCurto: 'No pude generarlo ahora.',
    emAndamento: 'Ya se está generando un informe. Espera un momento.',
    semAssinatura: 'Ya usaste tu informe gratis. Suscríbete en la app de Ninho para continuar.',
    limite: (n: number) => `Ya usaste los ${n} informes de este mes.`,
    semDados: 'Todavía no hay registros suficientes para un informe completo. No contó como informe usado.',
    semAcesso: 'Sin acceso a la rutina de este bebé ahora.',
  },

  prazo: {
    terminou: 'Terminó',
    terminaHoje: 'Termina hoy',
    acabaAmanha: 'Termina mañana',
    faltamDias: (n: number) => `Faltan ${n} días`,
    faltamSemanas: (n: number) => `Faltan ${n} semanas`,
  },
  situacao: {
    ativaDesde: (d: string) => `suscripción activa desde ${d}`,
    ativa: 'suscripción activa',
    canceladaEm: (d: string) => `canceló el ${d}`,
    cancelada: 'canceló',
    testeAte: (d: string) => `en prueba gratis hasta ${d}`,
    teste: 'en prueba gratis',
    reembolsadaEm: (d: string) => `reembolsada el ${d}`,
    reembolsada: 'reembolsada',
    semCobranca: 'todavía sin cobro',
  },
  ganhos: {
    familiaDaRede: 'Familia de la red',
    familiaN: (n: number) => `Familia ${n}`,
  },
};
