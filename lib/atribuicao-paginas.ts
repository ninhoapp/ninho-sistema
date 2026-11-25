/**
 * Páginas que os links rastreados (/r/<código> do parceiro e /c/<código> da
 * consultora) mostram no iPhone: navegador embutido (Instagram etc.) e Safari
 * (copia o link do clique para o app ler, por causa da Retransmissão Privada).
 * Server-only, sem dependência.
 *
 * Idioma (25/11/2026): pt, en ou es pelo navegador de quem tocou
 * (lib/idioma.ts). Os nomes dos menus do Instagram em inglês e espanhol não
 * foram conferidos num aparelho.
 */
import { htmlLang, tr, type Idioma } from '@/lib/idioma';

export function escaparHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

/**
 * Script que copia o link do clique para a área de transferência no toque do
 * botão (o navegador só deixa copiar num toque) e depois vai para a loja. O
 * app lê esse link na 1ª abertura quando o IP não casa (Retransmissão Privada
 * do Safari, troca de rede). Grava como URL (text/uri-list) para o iPhone
 * reconhecer sem o app precisar ler todo texto copiado.
 */
export function scriptCopiar(copiar: string, destino: string): string {
  return `<script>
(function(){
  var copiar=${JSON.stringify(copiar)}, destino=${JSON.stringify(destino)}, foi=false;
  function ir(){ if(foi) return; foi=true; location.href=destino; }
  function copiarEIr(ev){
    if(ev) ev.preventDefault();
    try{
      if(window.ClipboardItem && navigator.clipboard && navigator.clipboard.write){
        var item=new ClipboardItem({'text/uri-list':new Blob([copiar],{type:'text/uri-list'}),'text/plain':new Blob([copiar],{type:'text/plain'})});
        navigator.clipboard.write([item]).then(ir,function(){
          navigator.clipboard.writeText(copiar).then(ir,ir);
        });
      } else if(navigator.clipboard && navigator.clipboard.writeText){
        navigator.clipboard.writeText(copiar).then(ir,ir);
      } else { ir(); }
    }catch(e){ ir(); }
    setTimeout(ir,800);
  }
  var b=document.getElementById('baixar'); if(b) b.addEventListener('click',copiarEIr);
})();
</script>`;
}

export function paginaNavegadorEmbutido(destino: string, copiar: string, idioma: Idioma = 'pt'): string {
  const url = escaparHtml(destino);
  const t = (pt: string, en: string, es: string) => tr(idioma, pt, en, es);
  return `<!DOCTYPE html>
<html lang="${htmlLang(idioma)}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="robots" content="noindex">
<title>${t('Baixar o Ninho', 'Download Ninho', 'Descargar Ninho')}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:#7C5CD6;color:#fff;min-height:100svh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px 24px;text-align:center}
h1{font-size:22px;line-height:1.3;margin-bottom:12px}
.sub{font-size:15px;line-height:1.6;opacity:.9;margin-bottom:28px}
.btn{display:block;width:100%;max-width:340px;background:#fff;color:#4B3596;font-weight:700;font-size:16px;padding:15px;border-radius:999px;text-decoration:none;margin-bottom:24px}
.card{background:rgba(255,255,255,.14);border:1.5px solid rgba(255,255,255,.28);border-radius:20px;padding:22px;width:100%;max-width:340px;text-align:left}
.step{display:flex;gap:14px;margin-bottom:16px;font-size:15px;line-height:1.5}
.step:last-child{margin-bottom:0}
.num{flex-shrink:0;width:28px;height:28px;border-radius:50%;background:#fff;color:#4B3596;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px}
.seta{position:fixed;top:max(12px,env(safe-area-inset-top));right:16px;font-size:12px;font-weight:600;animation:b 1.2s ease-in-out infinite}
@keyframes b{50%{transform:translateY(-6px)}}
</style>
</head>
<body>
<div class="seta">↑ ${t('toque aqui', 'tap here', 'toca aquí')}</div>
<h1>${t('Baixe o Ninho na App Store', 'Get Ninho on the App Store', 'Descarga Ninho en la App Store')}</h1>
<p class="sub">${t(
    'Toque no botão. Se a loja não abrir, é o Instagram bloqueando: abra pelo Safari.',
    "Tap the button. If the store doesn't open, Instagram is blocking it: open the link in Safari.",
    'Toca el botón. Si la tienda no se abre, es Instagram el que la bloquea: abre el enlace en Safari.',
  )}</p>
<a class="btn" id="baixar" href="${url}">${t('Abrir a App Store', 'Open the App Store', 'Abrir la App Store')}</a>
<div class="card">
<div class="step"><span class="num">1</span><span>${t(
    'Toque nos <strong>três pontinhos ···</strong> no canto de cima',
    'Tap the <strong>three dots ···</strong> in the top corner',
    'Toca los <strong>tres puntitos ···</strong> en la esquina de arriba',
  )}</span></div>
<div class="step"><span class="num">2</span><span>${t(
    'Escolha <strong>"Abrir no navegador externo"</strong> ou <strong>"Abrir no Safari"</strong>',
    'Choose <strong>"Open in external browser"</strong> or <strong>"Open in Safari"</strong>',
    'Elige la opción de <strong>abrir en el navegador externo</strong> o <strong>en Safari</strong>',
  )}</span></div>
<div class="step"><span class="num">3</span><span>${t('A App Store abre sozinha', 'The App Store opens on its own', 'La App Store se abre sola')}</span></div>
</div>
${scriptCopiar(copiar, destino)}
<script>setTimeout(function(){location.href=${JSON.stringify(destino)}},300)</script>
</body>
</html>`;
}

/**
 * Safari do iPhone: com a Retransmissão Privada do iCloud ligada, o IP do
 * Safari é outro e a 1ª abertura do app não casa com o clique. Por isso, em
 * vez de mandar direto para a loja, mostra um botão que copia o link do
 * clique e abre a App Store (um toque a mais, só no Safari).
 */
export function paginaSafari(destino: string, copiar: string, idioma: Idioma = 'pt'): string {
  const url = escaparHtml(destino);
  const t = (pt: string, en: string, es: string) => tr(idioma, pt, en, es);
  return `<!DOCTYPE html>
<html lang="${htmlLang(idioma)}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="robots" content="noindex">
<title>${t('Baixar o Ninho', 'Download Ninho', 'Descargar Ninho')}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:#7C5CD6;color:#fff;min-height:100svh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px 24px;text-align:center}
h1{font-size:24px;line-height:1.3;margin-bottom:12px}
.sub{font-size:15px;line-height:1.6;opacity:.92;margin-bottom:28px;max-width:340px}
.btn{display:block;width:100%;max-width:340px;background:#fff;color:#4B3596;font-weight:700;font-size:17px;padding:16px;border-radius:999px;text-decoration:none;margin-bottom:18px}
.nota{font-size:13px;line-height:1.5;opacity:.8;max-width:320px}
</style>
</head>
<body>
<h1>${t('Baixe o Ninho', 'Get Ninho', 'Descarga Ninho')}</h1>
<p class="sub">${t(
    'A rotina e as memórias do seu bebê num lugar só, com 7 dias grátis.',
    "Your baby's routine and memories in one place, with 7 free days.",
    'La rutina y los recuerdos de tu bebé en un solo lugar, con 7 días gratis.',
  )}</p>
<a class="btn" id="baixar" href="${url}">${t('Baixar na App Store', 'Download on the App Store', 'Descargar en la App Store')}</a>
<p class="nota">${t(
    'Ao abrir o Ninho pela primeira vez, toque em <strong>Permitir colar</strong>: é assim que a indicação vale.',
    'When you open Ninho for the first time, tap <strong>Allow Paste</strong>: that is how the referral counts.',
    'Al abrir Ninho por primera vez, toca <strong>Permitir pegar</strong>: así es como vale la recomendación.',
  )}</p>
${scriptCopiar(copiar, destino)}
</body>
</html>`;
}
