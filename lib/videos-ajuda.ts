/**
 * Vídeos de ajuda da consultora (dono, 13/11/2026).
 *
 * Os vídeos NÃO ficam dentro do app: cada um é uma página nossa em /v/<slug>.
 * Assim o app só abre um link (chega por OTA, sem build novo), a cliente da
 * consultora assiste no navegador sem ter o Ninho instalado, e dá para trocar
 * o vídeo sem mexer no app.
 *
 * Desenho aprovado: Ninho-expo/docs/design/consultora/videos-de-ajuda.html.
 *
 * O MP4 e a imagem de prévia ficam em public/videos/<slug>.mp4 e .jpg. Enquanto
 * não existirem, a página mostra só os passos escritos (ver temArquivo).
 */
import fs from 'node:fs';
import path from 'node:path';

export interface VideoAjuda {
  slug: string;
  /** Título da página e do preview no WhatsApp. */
  titulo: string;
  /** Uma linha logo abaixo do título. */
  linha: string;
  /** Descrição do preview no WhatsApp e do buscador. */
  descricao: string;
  /** Só para a consultora (não indexa e não oferece "baixar o Ninho"). */
  interno?: boolean;
  /** Passos escritos: quem não quer ver vídeo, lê. */
  passos: string[];
  /** Par de abas: o outro caso da mesma pergunta. */
  abas?: { rotulo: string; slug: string }[];
}

export const VIDEOS: VideoAjuda[] = [
  {
    slug: 'convidar',
    titulo: 'Como convidar uma família',
    linha: 'Para consultoras do Ninho. Leva 1 minuto.',
    descricao:
      'O passo a passo para trazer uma cliente para o Ninho: mandar o seu link, o que ela vê e onde você aprova.',
    interno: true,
    passos: [
      'No app, abra Convidar família e copie o seu link da consultoria.',
      'Mande o link para a cliente pelo WhatsApp.',
      'Ela cria a conta pelo link, cadastra o bebê e toca em Aprovar.',
      'O pedido chega para você em Início; é só confirmar.',
    ],
  },
  {
    slug: 'aprovar',
    titulo: 'Como aprovar a sua consultora',
    linha: 'Você vai criar a sua conta no Ninho agora. Leva 20 segundos.',
    descricao:
      'Vídeo curto mostrando onde você toca para a sua consultora acompanhar o sono do seu bebê.',
    passos: [
      'Abra o link que a sua consultora mandou e toque em Baixar o Ninho.',
      'Entre com a Apple ou o Google, cadastre o bebê, marque os Termos e toque em Começar.',
      'Toque em Aprovar na pergunta que aparece logo depois.',
    ],
    abas: [
      { rotulo: 'Vou criar a conta', slug: 'aprovar' },
      { rotulo: 'Já tenho conta', slug: 'ja-tenho-conta' },
    ],
  },
  {
    slug: 'ja-tenho-conta',
    titulo: 'Como aprovar a sua consultora',
    linha: 'Você já usa o Ninho. Leva 20 segundos.',
    descricao:
      'Vídeo curto mostrando onde você toca para a sua consultora acompanhar o sono do seu bebê.',
    passos: [
      'Abra o link que a sua consultora mandou e toque em Já tenho o Ninho.',
      'O Ninho abre com o código e o nome dela já preenchidos.',
      'Marque a caixa e toque em Compartilhar.',
    ],
    abas: [
      { rotulo: 'Vou criar a conta', slug: 'aprovar' },
      { rotulo: 'Já tenho conta', slug: 'ja-tenho-conta' },
    ],
  },
];

export function videoPorSlug(slug: string): VideoAjuda | undefined {
  return VIDEOS.find((v) => v.slug === slug);
}

/** O MP4 (ou a imagem de prévia) já foi publicado? */
export function temArquivo(slug: string, ext: 'mp4' | 'jpg'): boolean {
  try {
    return fs.existsSync(path.join(process.cwd(), 'public', 'videos', `${slug}.${ext}`));
  } catch {
    return false;
  }
}
