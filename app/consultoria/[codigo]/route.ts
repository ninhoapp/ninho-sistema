/**
 * Link da CONSULTORIA: www.useninho.com.br/consultoria/<codigo> (12/11/2026,
 * 00144 do app). A consultora manda para as famílias que ela atende.
 *
 * Página com a foto e o nome dela (desenho aprovado:
 * docs/design/consultora/links-divulgacao-consultoria.html, passo A):
 *  - "Baixar o Ninho grátis": copia /c/<código>?c=<clique> (para o app ler no
 *    iPhone) e vai para a loja certa. Depois do cadastro do bebê, o app
 *    pergunta se a família aprova compartilhar a rotina com a consultora.
 *  - "Já tenho o Ninho": abre ninho://consultoria/<código>
 *    (Adicionar consultora, com o código preenchido).
 *
 * LIBERADO SÓ PARA A CONTA DE TESTE DO DONO (12/11/2026): para as outras
 * consultoras vale como o link de divulgação (lib/link-consultora.ts,
 * CONSULTORIA_LIBERADA_PARA), até a versão do app com a pergunta estar na loja.
 *
 * O clique é gravado ao abrir a página, marcado com vinculo = true; a
 * comissão é a mesma do link de divulgação. Código inexistente ou consultora
 * pausada: vai para a loja sem gravar nada (não revela se o código existe).
 * iPhone dentro do Instagram/Facebook: a mesma página do link de divulgação,
 * que ensina a abrir no Safari. A resposta varia por aparelho: nunca em cache.
 */
import { NextRequest, NextResponse } from 'next/server';
import { ehNavegadorEmbutido } from '@/lib/atribuicao';
import { escaparHtml, paginaNavegadorEmbutido, scriptCopiar } from '@/lib/atribuicao-paginas';
import { gravarCookies, lojaSemRastreio, registrarCliqueConsultora, respostaDeDivulgacao, semCache, type CliqueConsultora } from '@/lib/link-consultora';

export const dynamic = 'force-dynamic';

function iniciais(nome: string): string {
  const p = nome.trim().split(/\s+/).filter(Boolean);
  return ((p[0]?.[0] ?? '') + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase() || 'N';
}

function pagina(c: CliqueConsultora): string {
  const { consultora, device, destino, copiar } = c;
  const nome = (consultora.nome ?? '').trim() || 'Sua consultora';
  const prim = nome.split(/\s+/)[0] || nome;
  const app = `ninho://consultoria/${encodeURIComponent(consultora.codigo)}`;
  const foto = consultora.foto_url
    ? `<img class="foto" src="${escaparHtml(consultora.foto_url)}" alt="">`
    : `<div class="foto ini">${escaparHtml(iniciais(nome))}</div>`;
  const celular = device === 'ios' || device === 'android';
  const botoes = celular
    ? `<a id="baixar" class="btn prim" href="${escaparHtml(destino)}">Baixar o Ninho grátis</a>
  <a class="btn sec" href="${escaparHtml(app)}">Já tenho o Ninho</a>`
    : `<p class="pc">Abra este link no celular para baixar o Ninho.</p>`;
  const nota = device === 'ios'
    ? `<p class="nota">Ao abrir o Ninho pela primeira vez, toque em <b>Permitir colar</b>: é assim que o app sabe que a ${escaparHtml(prim)} te convidou.</p>`
    : '';
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="robots" content="noindex">
<title>${escaparHtml(prim)} te convidou para o Ninho</title>
<meta property="og:title" content="${escaparHtml(nome)} te convidou para o Ninho">
<meta property="og:description" content="Sua consultora de sono acompanha a rotina do seu bebê pelo Ninho.">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:linear-gradient(180deg,#F1E7FF 0%,#FBF8FF 46%,#fff 100%);color:#1E1F25;min-height:100svh;display:flex;flex-direction:column;align-items:center;padding:36px 22px 28px;text-align:center}
.marca{display:flex;align-items:center;gap:8px;font-weight:800;font-size:17px;color:#24164F}
.marca img{width:34px;height:34px;border-radius:11px;background:#fff;padding:3px;box-shadow:0 4px 12px -4px rgba(110,70,200,.4)}
.wrap{width:100%;max-width:380px;display:flex;flex-direction:column;align-items:center;flex:1}
.av{position:relative;margin-top:30px}
.foto{width:104px;height:104px;border-radius:50%;object-fit:cover;display:block;box-shadow:0 10px 26px -12px rgba(60,30,120,.5)}
.ini{background:#3E9D70;color:#fff;font-size:36px;font-weight:800;display:flex;align-items:center;justify-content:center}
.ok{position:absolute;right:-2px;bottom:-2px;width:28px;height:28px;border-radius:50%;background:#4CAF74;color:#fff;font-size:16px;font-weight:900;display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 3px #fff}
.nome{font-size:20px;font-weight:800;color:#24164F;margin-top:14px}
.papel{font-size:13px;font-weight:700;color:#2F8A55;margin-top:2px}
h1{font-size:25px;line-height:1.2;font-weight:800;letter-spacing:-.4px;color:#24164F;margin-top:24px}
.sub{font-size:15px;line-height:1.55;color:#5c5870;margin-top:10px}
.acoes{width:100%;margin-top:auto;padding-top:30px}
.btn{display:block;width:100%;text-align:center;font-weight:800;font-size:16px;padding:16px;border-radius:999px;text-decoration:none;margin-top:10px}
.prim{background:linear-gradient(135deg,#A46DFF,#8C5CF8);color:#fff;box-shadow:0 12px 22px -10px rgba(140,92,248,.8)}
.sec{background:#fff;color:#1E1F25;box-shadow:inset 0 0 0 1.5px #E6E0F0}
.rodape{font-size:12px;color:#8a86a0;margin-top:14px;line-height:1.5}
.rodape b{color:#24164F;letter-spacing:.06em}
.nota{font-size:12.5px;color:#6B6F80;margin-top:10px;line-height:1.5}
.pc{font-size:15px;font-weight:700;color:#7C5CD6;background:#F1EBFC;border-radius:16px;padding:14px}
</style>
</head>
<body>
<div class="wrap">
  <div class="marca"><img src="/brand/ninho-logo-limpo.png" alt="">Ninho</div>
  <div class="av">${foto}<span class="ok">✓</span></div>
  <div class="nome">${escaparHtml(nome)}</div>
  <div class="papel">Consultora de sono</div>
  <h1>A ${escaparHtml(prim)} vai acompanhar a rotina do seu bebê pelo Ninho</h1>
  <p class="sub">Baixe o app e cadastre o bebê. No final, confirme que quer compartilhar a rotina com ela. Nada de mandar print.</p>
  <div class="acoes">
  ${botoes}
  <p class="rodape">7 dias grátis. Código da ${escaparHtml(prim)}: <b>${escaparHtml(consultora.codigo)}</b></p>
  ${nota}
  </div>
</div>
${celular ? scriptCopiar(copiar, destino) : ''}
</body>
</html>`;
}

export async function GET(req: NextRequest, { params }: { params: { codigo: string } }) {
  const ua = req.headers.get('user-agent') || '';
  const clique = await registrarCliqueConsultora(req, params.codigo, { vinculo: true, rotulo: 'consultoria' });
  if (!clique) return semCache(NextResponse.redirect(lojaSemRastreio(ua), 302));
  // Ainda não liberado para esta consultora (CONSULTORIA_LIBERADA_PARA): vale
  // como o link de divulgação, sem página e sem pergunta no app.
  if (!clique.vinculo) return respostaDeDivulgacao(req, clique);
  const html = (corpo: string) => new NextResponse(corpo, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  const res =
    clique.device === 'ios' && ehNavegadorEmbutido(ua)
      ? html(paginaNavegadorEmbutido(clique.destino, clique.copiar))
      : html(pagina(clique));
  gravarCookies(res, clique.consultora.codigo, clique.clickId);
  return semCache(res);
}
