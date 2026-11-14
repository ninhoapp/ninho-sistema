import { SITE_URL } from '@/lib/config';

/** Manda o iPhone para a App Store e o Android para o Google Play (app/baixar/route.ts). */
export const LINK_BAIXAR = `${SITE_URL}/baixar`;

export interface DadosManual {
  nome: string;
  email: string;
  codigo: string | null;
  whatsapp: string | null;
}

export type TipoManual = 'sem-conta' | 'com-conta';

export const codigoDe = (d: DadosManual) => (d.codigo ?? 'SEUCODIGO').toUpperCase();

const passosComuns = (codigo: string, n: number) =>
  `${n}. Na primeira vez, aparece o Termo da Consultora. Leia, marque "Li e aceito o Termo da Consultora" e toque em "Começar".\n\n` +
  `${n + 1}. Para convidar uma cliente, toque em "Convidar" na barra de baixo (se a barra estiver fechada, toque na setinha do meio) e depois em "Enviar pelo WhatsApp". ` +
  `Ela recebe o passo a passo com o seu código: ${codigo}.\n` +
  `Também dá para convidar pelo e-mail da cliente, em "Convidar pelo e-mail da família".\n\n` +
  `${n + 2}. Quando a cliente digitar o seu código, chega o aviso "Novo pedido de família". No Início, toque em "Aprovar" e depois em "Aprovar e acompanhar". ` +
  `Pronto: a rotina do bebê aparece para você.\n\n` +
  `${n + 3}. Complete o seu perfil público: no menu ☰, toque em "Editar perfil" e coloque foto, um texto sobre como você ajuda as famílias, cidade, idades que atende e WhatsApp. ` +
  `Eu reviso e libero você na lista "Encontrar consultora de sono", que as famílias veem dentro do app. Mais de 2 mil pessoas já usam o Ninho.\n\n` +
  `Qualquer dúvida, é só me chamar aqui.`;

/** Passo a passo completo, em texto, para mandar pelo WhatsApp. */
export function textoManual(tipo: TipoManual, d: DadosManual): string {
  const codigo = codigoDe(d);
  if (tipo === 'sem-conta') {
    return (
      `Oi, ${d.nome}! Aqui está o passo a passo para começar no Ninho:\n\n` +
      `1. Toque aqui para baixar o Ninho (funciona no iPhone e no Android):\n${LINK_BAIXAR}\n\n` +
      `2. Crie a sua conta com o e-mail ${d.email}. Tem que ser exatamente esse, porque é ele que está liberado como consultora.\n` +
      `- Pode tocar em "Continuar com Google", se esse for um e-mail do Google.\n` +
      `- Ou toque em "Novo aqui? Criar conta", coloque o e-mail e uma senha e confirme com o código de 6 dígitos que chega no e-mail.\n` +
      `- Se entrar pela Apple, não escolha "ocultar meu e-mail", senão o app não reconhece você.\n\n` +
      passosComuns(codigo, 3)
    );
  }
  return (
    `Oi, ${d.nome}! Como você já usa o Ninho, é ainda mais simples:\n\n` +
    `1. Confira se a sua conta no app é a do e-mail ${d.email}. É esse e-mail que está liberado como consultora. ` +
    `Se você entra com outro e-mail, me avise qual é que eu ligo a sua conta por aqui.\n\n` +
    `2. Feche o Ninho e abra de novo. O app reconhece a sua conta de consultora sozinho.\n` +
    `- Se você já tem um bebê cadastrado, aparece a pergunta "Sua conta foi liberada como consultora". Toque em "Usar modo consultora".\n` +
    `- Depois você troca quando quiser pelo menu: "Mudar para conta comum" ou "Mudar para modo consultora".\n\n` +
    passosComuns(codigo, 3)
  );
}

/** Mensagem curta que acompanha o PDF no WhatsApp. O 1º passo (baixar) vai como link tocável. */
export function textoComPdf(tipo: TipoManual, d: DadosManual): string {
  // Texto do dono (14/11/2026). Para quem não tem conta, o link de baixar vai junto, tocável.
  return (
    `Oi, ${d.nome}, tudo bem? Que bom te ter aqui como nossa parceira consultora!\n\n` +
    `Segue aqui o PDF de orientações de como você utiliza o Ninho.` +
    (tipo === 'sem-conta' ? ` Para começar, baixe o app por aqui:\n${LINK_BAIXAR}` : '') +
    `\n\nQualquer dúvida, estamos à disposição, no horário que for necessário.`
  );
}
