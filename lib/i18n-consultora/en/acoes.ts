/** Painel da consultora · seção "acoes" (en). Mesmas chaves do pt (o tipo obriga). */
import type { acoes as Pt } from '../pt/acoes';

export const acoes: typeof Pt = {
  contaNaoAtiva: "Your account isn't active right now.",
  familiaNaoEncontrada: 'Family not found.',
  pedidoNaoEncontrado: 'Request not found.',
  emailInvalido: 'Invalid email.',
  whatsappComDdd: 'WhatsApp with area code (e.g. 11 98765-4321).',
  erroEnviar: "Couldn't send right now. Try again.",
  limiteHoje: "You've reached today's invite limit. Try again tomorrow.",
  aceiteDesatualizado: 'This version of the terms is out of date. Reload the page.',

  perfil: {
    contaAindaNaoAtiva: "Your account isn't active yet.",
    ufInvalida: 'State with 2 letters (e.g. SP).',
    instagramInvalido: 'Invalid Instagram. Use just your @.',
    cpfInvalido: 'CPF with 11 digits.',
    pixInvalido: 'Invalid Pix key.',
    erroSalvar: "Couldn't save right now. Try again.",
    salvoComTexto: 'Saved. Your new text was sent to Ninho for approval; everything else is already live.',
    salvo: 'Profile saved.',
  },

  foto: {
    escolha: 'Choose a photo.',
    formato: 'The photo must be JPG, PNG or WebP.',
    grande: 'The photo is over 2 MB. Send a smaller one.',
    erroGuardar: "Couldn't save the photo. Try again.",
    enviada: 'Photo sent. It shows up after Ninho approves it.',
  },

  indicar: {
    soAtiva: 'Only active consultants can refer.',
    nome: 'Enter the name.',
    email: "Enter the email she'll use in the app.",
    instagramInvalido: 'Invalid Instagram. Use just her @.',
    jaIndicada: 'This person has already been referred or approved.',
    limite: "You've reached the referral limit for now. Try again tomorrow.",
    jaTemPedido: 'This person already has a request.',
    enviada: 'Referral sent. Ninho will review it.',
  },

  pedidoFamilia: {
    marqueAceite: 'To approve, check the agreement box.',
    naoEncontrado: 'This request was already answered or was canceled by the family.',
    soResponsavel: 'The person who asked is no longer the primary caregiver for the baby.',
    erro: "Couldn't reply right now. Try again.",
    aprovado: 'Request approved: the family now appears in your list.',
    recusado: 'Request declined.',
  },

  convidar: {
    marqueAceite: 'To invite, check the agreement box.',
    ok: (email: string) =>
      `Invite saved for ${email}. If this person is already the primary caregiver for a baby in Ninho, they get it now in the bell. If they are a caregiver, the request goes to the primary caregiver. If they don't have an account yet, the invite is kept and arrives when they create one. Check that the email is correct.`,
  },

  ficha: {
    terminoAntes: "The end date can't be before the start date.",
    encontros: 'Sessions: use numbers from 0 to 999.',
    whatsappInvalido: 'Invalid WhatsApp.',
    semAcesso: 'This family no longer shares the routine with you.',
    invalido: 'Check the profile fields.',
    erro: "Couldn't save the profile right now. Try again.",
    salva: 'Profile saved.',
  },

  continuar: {
    indisponivel: "Requests aren't available yet.",
    erro: "Couldn't mark it right now. Try again.",
    ok: 'Request marked as handled.',
  },

  orientacao: {
    vazio: 'Write the guidance before sending.',
    longo: (max: number) => `The guidance is over ${max.toLocaleString('en-US')} characters.`,
    indisponivel: "Guidance isn't available yet. It shows up here as soon as Ninho turns it on.",
    indisponivelCurto: "Guidance isn't available yet.",
    marqueTermo: 'To send your first guidance, check the terms box.',
    termoDesatualizado: 'This version of the terms is out of date. Reload the page.',
    erroTermo: "Couldn't save your acceptance right now. Try again.",
    semAcesso: 'This family no longer shares the routine with you (or has no plan).',
    semAceite: 'To send, you need to accept the terms. Reload the page.',
    familiaSemAceite: "The family hasn't agreed to receive guidance through Ninho yet. They'll see the request when they open the app.",
    link: "Guidance can't include links. Remove the address and send again.",
    enviada: 'Guidance sent. The family gets it in the bell and on their phone.',
  },

  relatorio: {
    semPlano: 'This family has no plan: the routine comes back when they subscribe.',
    pronto: 'Report ready.',
    pedido: 'Report requested. It shows up in the list in a moment.',
  },

  convite: {
    naoEncontrado: 'Invite not found.',
    cancelado: 'Invite canceled.',
    jaRespondido: 'This invite was already answered or canceled.',
    erroCancelar: "Couldn't cancel right now. Try again.",
  },

  encerrar: {
    ok: 'Follow-up ended. The family was notified.',
    jaNaoCompartilhava: 'This family was no longer sharing the routine with you.',
    erro: "Couldn't end it right now. Try again.",
  },

  sugestao: {
    vazia: 'Write your idea before sending.',
    longa: (max: number) => `Use up to ${max.toLocaleString('en-US')} characters.`,
    ok: 'We got your suggestion. Thanks for helping make Ninho better!',
    indisponivel: 'Suggestions open soon. Try again later.',
  },

  ia: {
    rodape: "Report generated by AI from the app's entries. It is not a health assessment and does not replace the pediatrician.",
    indisponivel: "The AI Report isn't available in the dashboard yet. Try it in the app.",
    erro: "Couldn't generate it right now. Try again in a moment.",
    erroCurto: "Couldn't generate it right now.",
    emAndamento: 'A report is already being generated. Wait a moment.',
    semAssinatura: 'Your free report has been used. Subscribe in the Ninho app to continue.',
    limite: (n: number) => `You've reached the ${n} reports for this month.`,
    semDados: "There aren't enough entries yet for a full report. It didn't count as a used report.",
    semAcesso: "No access to this baby's routine right now.",
  },

  prazo: {
    terminou: 'Ended',
    terminaHoje: 'Ends today',
    acabaAmanha: 'Ends tomorrow',
    faltamDias: (n: number) => `${n} days left`,
    faltamSemanas: (n: number) => `${n} weeks left`,
  },
  situacao: {
    ativaDesde: (d: string) => `subscribed since ${d}`,
    ativa: 'subscribed',
    canceladaEm: (d: string) => `canceled on ${d}`,
    cancelada: 'canceled',
    testeAte: (d: string) => `on free trial until ${d}`,
    teste: 'on free trial',
    reembolsadaEm: (d: string) => `refunded on ${d}`,
    reembolsada: 'refunded',
    semCobranca: 'not charged yet',
  },
  ganhos: {
    familiaDaRede: 'Network family',
    familiaN: (n: number) => `Family ${n}`,
  },
};
