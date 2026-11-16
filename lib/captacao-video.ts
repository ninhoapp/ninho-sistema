/**
 * O vídeo da abordagem dentro da aba Captação: o dono assiste e baixa ali
 * mesmo para anexar no direct.
 *
 * Onde fica: bucket PRIVADO do Supabase Storage (`captacao`), não na pasta
 * public do site. O repositório é público e o vídeo mostra a orientação da
 * consultora, que só chega às consultoras com o build 1.1.2 — endereço aberto
 * está fora de questão. A tela recebe uma URL assinada que vale 1 hora.
 *
 * Server-only (service_role).
 */
import { appDb } from '@/lib/supabase/server';

export const BUCKET_CAPTACAO = 'captacao';
export const CAMINHO_VIDEO = 'consultora/abordagem.mp4';
export const VIDEO_MAX_BYTES = 60 * 1024 * 1024;

/** URL assinada (1 hora) do vídeo, ou null quando ainda não subiu nenhum. */
export async function urlDoVideo(): Promise<string | null> {
  const { data, error } = await appDb().storage.from(BUCKET_CAPTACAO).createSignedUrl(CAMINHO_VIDEO, 3600);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

/** Cria o bucket privado se ainda não existir. Erro de "já existe" é sucesso. */
async function garantirBucket(): Promise<string | null> {
  const sb = appDb();
  const { data } = await sb.storage.getBucket(BUCKET_CAPTACAO);
  if (data) return null;
  const { error } = await sb.storage.createBucket(BUCKET_CAPTACAO, {
    public: false,
    fileSizeLimit: VIDEO_MAX_BYTES,
    allowedMimeTypes: ['video/mp4', 'video/quicktime'],
  });
  if (!error) return null;
  return /exist/i.test(error.message) ? null : error.message;
}

/** Sobe (ou troca) o vídeo. Devolve a mensagem de erro, ou null se deu certo. */
export async function subirVideo(arquivo: File): Promise<string | null> {
  if (!arquivo || arquivo.size === 0) return 'Escolha o arquivo do vídeo.';
  if (arquivo.size > VIDEO_MAX_BYTES) return 'O vídeo passa de 60 MB. Grave um arquivo menor.';
  if (!/^video\/(mp4|quicktime)$/.test(arquivo.type)) return 'Mande um arquivo .mp4 (ou .mov).';

  const falhou = await garantirBucket();
  if (falhou) return `Não consegui preparar o lugar do vídeo: ${falhou}`;

  const { error } = await appDb()
    .storage.from(BUCKET_CAPTACAO)
    .upload(CAMINHO_VIDEO, arquivo, { upsert: true, contentType: 'video/mp4' });
  return error ? error.message : null;
}
