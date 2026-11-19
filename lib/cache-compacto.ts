/**
 * `unstable_cache` que cabe no limite de 2 MB da Vercel. Server-only.
 *
 * O cache de dados da Vercel recusa, calado, qualquer item acima de 2 MB: a
 * tela funciona, mas nada fica guardado e toda visita refaz as consultas.
 * Foi o que deixou o painel lento de novo em 19/11/2026: a lista de usuários
 * passou de ~2.250 contas e chegou perto dos 2 MB em JSON, então cada clique
 * voltava a ler tudo no banco.
 *
 * Aqui o valor vai para o cache comprimido (gzip + base64), ~8x menor. A lista
 * de usuários aguenta assim dezenas de milhares de contas antes de bater no
 * limite. Descomprimir custa poucos milissegundos.
 *
 * Mesmas regras do `unstable_cache`: só dados que viram JSON (Map vira {}),
 * e erro deve subir como exceção para não guardar vazio.
 */
import { unstable_cache } from 'next/cache';
import { gzipSync, gunzipSync } from 'node:zlib';

export function cacheCompacto<T>(
  fn: () => Promise<T>,
  chave: string[],
  opts: { revalidate: number; tags?: string[] },
): () => Promise<T> {
  const guardado = unstable_cache(
    async (): Promise<string> => gzipSync(JSON.stringify(await fn())).toString('base64'),
    chave,
    opts,
  );
  return async () => JSON.parse(gunzipSync(Buffer.from(await guardado(), 'base64')).toString('utf8')) as T;
}
