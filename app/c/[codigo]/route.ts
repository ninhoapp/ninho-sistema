/**
 * Link rastreável da consultora: www.useninho.com.br/c/<codigo>
 * (desde 12/11/2026 é o link de DIVULGAÇÃO, igual ao /indica/<codigo>; o da
 * consultoria é o /consultoria/<codigo>, lib/link-consultora.ts)
 *
 * Igual ao /r/<código> do parceiro (app/r/[code]/route.ts), sem página de
 * apresentação:
 *  1. Acha a consultora ATIVA pelo código. Inexistente ou pausada: manda para a
 *     loja SEM gravar nada (não revela se o código existe).
 *  2. Grava o clique em painel.link_clicks com consultora_id (00112) e pega o id.
 *  3. Manda para a loja certa (lib/atribuicao.ts → destinoDoLink, origem
 *     'consultora'). iPhone no Instagram/Facebook: página que tenta abrir a
 *     loja e ensina a abrir no Safari. Safari do iPhone: página que copia
 *     https://www.useninho.com.br/c/<código>?c=<id do clique> para o app ler.
 *  4. Cookies first-party (30 dias), como rede de segurança.
 *
 * A instalação é casada depois pelo app (/api/track/match com
 * versao_atribuicao >= 2), que chama registrar_indicacao_consultora(código,
 * 'link', click_id). A resposta varia por aparelho: nunca em cache.
 */
import { NextRequest } from 'next/server';
import { linkDeDivulgacao } from '@/lib/link-consultora';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { codigo: string } }) {
  return linkDeDivulgacao(req, params.codigo, 'c');
}
