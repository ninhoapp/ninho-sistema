/**
 * Lê TODAS as linhas de uma consulta, de 1.000 em 1.000.
 *
 * O PostgREST do Supabase devolve no máximo 1.000 linhas por pedido, sem
 * avisar. Sem paginar, qualquer contagem trava em 1.000 (foi o que aconteceu
 * com "total de usuários" em out/2026, quando a base passou de 1.000 contas).
 *
 * A consulta precisa de uma ordem estável (ex.: `.order('id')`), senão a
 * mesma linha pode cair em duas páginas e outra em nenhuma.
 */
type Pagina<T> = PromiseLike<{ data: T[] | null; error: { message: string } | null }>;

export async function lerTudo<T>(
  nome: string,
  pagina: (de: number, ate: number) => Pagina<T>,
): Promise<{ data: T[]; error: { message: string } | null }> {
  const out: T[] = [];
  const tam = 1000;
  for (let de = 0; de < 500_000; de += tam) {
    const { data, error } = await pagina(de, de + tam - 1);
    if (error) {
      console.error(`[painel] ${nome} falhou:`, error.message);
      return { data: out, error };
    }
    out.push(...(data ?? []));
    if (!data || data.length < tam) break;
  }
  return { data: out, error: null };
}
