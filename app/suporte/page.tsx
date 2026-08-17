import type { Metadata } from 'next';
import { SITE_URL, SUPORTE_EMAIL } from '@/lib/config';
import { DIAS_TRIAL, PRECO_MENSAL, PRECO_ANUAL, numeroBr } from '@/lib/precos';

export const metadata: Metadata = {
  title: 'Suporte — Ninho',
  description: 'Central de ajuda do Ninho — dúvidas frequentes e como falar com a gente.',
  openGraph: {
    title: 'Suporte — Ninho',
    description: 'Central de ajuda do Ninho — dúvidas frequentes e como falar com a gente.',
    type: 'website',
    url: `${SITE_URL}/suporte`,
  },
};

// ─── CSS ───────────────────────────────────────────────────────────────────
// Nav e footer copiados 1:1 de app/landing/page.tsx — ver comentário
// equivalente em app/privacy/page.tsx.
const css = `
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --roxo:        #9F86E0;
  --roxo-dark:   #7C5CD6;
  --roxo-light:  #EDE4FB;
  --lavanda:     #F1E9FB;
  --nuvem:       #F2F3F6;
  --grafite:     #1E1F25;
  --grafite-80:  #3D3849;
  --grafite-60:  #6B6F80;
  --borda:       #ECE6F5;
  --branco:      #FFFFFF;
}

html { scroll-behavior: smooth; }

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif;
  background: var(--branco);
  color: var(--grafite);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}

a { color: inherit; text-decoration: none; }

.container { max-width: 1100px; margin: 0 auto; padding: 0 24px; }

/* ─── NAV (igual à landing) ─────────────────────────────────────── */
nav {
  position: sticky; top: 0; z-index: 100;
  background: rgba(255,255,255,0.88);
  backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px);
  border-bottom: 1px solid var(--borda);
}
.nav-inner { display: flex; align-items: center; justify-content: space-between; height: 62px; gap: 16px; }
.nav-brand { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
.nav-logo { width: 30px; height: 30px; display: block; }
.nav-wordmark { font-size: 18px; font-weight: 700; letter-spacing: 3px; color: var(--roxo-dark); }
.nav-links { display: flex; align-items: center; gap: 28px; list-style: none; }
.nav-links a { font-size: 14px; font-weight: 500; color: var(--grafite-60); transition: color .15s; white-space: nowrap; }
.nav-links a:hover { color: var(--grafite); }
@media (max-width: 700px) { .nav-links { display: none; } }

/* ─── HERO ──────────────────────────────────────────────────────── */
.help-hero {
  padding: 64px 0 48px;
  text-align: center;
  background: linear-gradient(180deg, var(--branco) 0%, var(--lavanda) 100%);
}
.help-hero .eyebrow {
  display: inline-block; background: var(--roxo-light); color: var(--roxo-dark);
  font-size: 12px; font-weight: 700; letter-spacing: .4px; padding: 5px 14px;
  border-radius: 999px; margin-bottom: 16px;
}
.help-hero h1 { font-size: clamp(28px, 5vw, 44px); font-weight: 700; letter-spacing: -.5px; color: var(--grafite); }
.help-hero p { margin: 12px auto 0; max-width: 480px; font-size: 15px; color: var(--grafite-60); }

/* ─── CONTATO ───────────────────────────────────────────────────── */
.contact-card {
  max-width: 560px;
  margin: -24px auto 0;
  background: var(--branco);
  border-radius: 20px;
  padding: 28px 30px;
  box-shadow: 0 20px 50px rgba(45,30,80,.12);
  display: flex;
  align-items: center;
  gap: 18px;
  position: relative;
  z-index: 1;
}
.contact-icon {
  flex-shrink: 0; width: 48px; height: 48px; border-radius: 14px;
  background: var(--roxo-light); color: var(--roxo-dark);
  display: flex; align-items: center; justify-content: center;
}
.contact-icon svg { width: 22px; height: 22px; }
.contact-text h3 { font-size: 15px; font-weight: 700; color: var(--grafite); margin-bottom: 3px; }
.contact-text p { font-size: 13px; color: var(--grafite-60); }
.contact-btn {
  margin-left: auto; flex-shrink: 0;
  display: inline-flex; align-items: center; justify-content: center;
  padding: 11px 20px; border-radius: 999px; background: var(--roxo);
  color: var(--branco); font-size: 13.5px; font-weight: 700;
  transition: all .2s; white-space: nowrap;
}
.contact-btn:hover { background: var(--roxo-dark); transform: translateY(-1px); box-shadow: 0 8px 20px rgba(159,134,224,.35); }
@media (max-width: 560px) {
  .contact-card { flex-direction: column; text-align: center; margin-left: 20px; margin-right: 20px; }
  .contact-btn { margin-left: 0; width: 100%; }
}

/* ─── FAQ ───────────────────────────────────────────────────────── */
.faq { padding: 80px 0 96px; }
.faq-wrap { max-width: 720px; margin: 0 auto; }
.section-header { text-align: center; margin-bottom: 40px; }
.section-label {
  display: inline-block; font-size: 11px; font-weight: 700; letter-spacing: 2px;
  text-transform: uppercase; color: var(--roxo-dark); margin-bottom: 10px;
}
.section-header h2 { font-size: clamp(22px, 3.5vw, 30px); font-weight: 700; letter-spacing: -.4px; color: var(--grafite); }

.faq-item {
  background: var(--nuvem);
  border-radius: 16px;
  margin-bottom: 12px;
  overflow: hidden;
}
.faq-item summary {
  cursor: pointer;
  list-style: none;
  padding: 18px 22px;
  font-size: 15px;
  font-weight: 600;
  color: var(--grafite);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.faq-item summary::-webkit-details-marker { display: none; }
.faq-item summary .chev {
  flex-shrink: 0; width: 20px; height: 20px; color: var(--roxo-dark);
  transition: transform .2s;
}
.faq-item[open] summary .chev { transform: rotate(180deg); }
.faq-item .faq-answer { padding: 0 22px 20px; font-size: 14px; color: var(--grafite-60); line-height: 1.7; }
.faq-item .faq-answer a { color: var(--roxo-dark); font-weight: 600; }

/* ─── FOOTER (igual à landing) ──────────────────────────────────── */
footer { background: var(--grafite); color: rgba(255,255,255,.5); padding: 48px 0 30px; }
.footer-inner { display: flex; flex-direction: column; gap: 28px; }
.footer-top { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 28px; }
.footer-brand { display: flex; align-items: center; gap: 10px; }
.footer-logo { width: 22px; height: 22px; object-fit: contain; display: block; }
.footer-wordmark { font-size: 16px; font-weight: 700; letter-spacing: 3px; color: rgba(255,255,255,.9); }
.footer-tagline { font-size: 12px; margin-top: 6px; opacity: .45; }
.footer-links { display: flex; gap: 22px; flex-wrap: wrap; align-items: center; }
.footer-links a { font-size: 13px; color: rgba(255,255,255,.5); transition: color .15s; }
.footer-links a:hover { color: rgba(255,255,255,.9); }
.footer-divider { height: 1px; background: rgba(255,255,255,.07); }
.footer-bottom { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 10px; font-size: 12px; }
@media (max-width: 700px) { .footer-top { flex-direction: column; } }
`;

// ─── BODY HTML ─────────────────────────────────────────────────────────────
const bodyHtml = `
<!-- NAV -->
<nav>
  <div class="container nav-inner">
    <a href="/landing" class="nav-brand" aria-label="Ninho">
      <img src="/brand/ninho-logo-limpo.png" alt="" class="nav-logo">
      <span class="nav-wordmark">NINHO</span>
    </a>
    <ul class="nav-links">
      <li><a href="/landing#features">Funcionalidades</a></li>
      <li><a href="/landing#planos">Planos</a></li>
      <li><a href="/privacy">Privacidade</a></li>
    </ul>
  </div>
</nav>

<!-- HERO -->
<section class="help-hero">
  <div class="container">
    <span class="eyebrow">Central de Ajuda</span>
    <h1>Como podemos ajudar?</h1>
    <p>Dúvidas sobre o app, sua assinatura ou seus dados — respondemos rápido, direto de gente de verdade.</p>
  </div>
</section>

<div class="contact-card">
  <span class="contact-icon" aria-hidden="true">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
  </span>
  <span class="contact-text">
    <h3>Fale com o suporte</h3>
    <p>Respondemos em até 2 dias úteis, geralmente bem antes.</p>
  </span>
  <a href="mailto:${SUPORTE_EMAIL}" class="contact-btn">${SUPORTE_EMAIL}</a>
</div>

<!-- FAQ -->
<section class="faq">
  <div class="container faq-wrap">
    <div class="section-header">
      <span class="section-label">Perguntas frequentes</span>
      <h2>As dúvidas mais comuns</h2>
    </div>

    <details class="faq-item">
      <summary>Como cancelo minha assinatura?
        <svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
      </summary>
      <div class="faq-answer">O cancelamento é feito diretamente na loja onde você assinou — nas
      configurações de assinatura da App Store (iOS) ou do Google Play (Android). Cancelar dentro do app ou
      excluir sua conta <strong>não</strong> cancela a cobrança recorrente automaticamente na loja; você
      continua com acesso Premium até o fim do período já pago.</div>
    </details>

    <details class="faq-item">
      <summary>Já assinei, mas o app ainda mostra como gratuito. E agora?
        <svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
      </summary>
      <div class="faq-answer">Na tela de planos do app, toque em <strong>"Já assinei — restaurar
      compra"</strong>. Isso resincroniza sua assinatura com a App Store/Google Play. Se mesmo assim não
      atualizar, nos escreva pelo <a href="mailto:${SUPORTE_EMAIL}">${SUPORTE_EMAIL}</a> com o e-mail usado
      na compra.</div>
    </details>

    <details class="faq-item">
      <summary>Quanto custa o Ninho Premium?
        <svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
      </summary>
      <div class="faq-answer">R$&nbsp;${numeroBr(PRECO_MENSAL)}/mês no plano mensal, ou R$&nbsp;${numeroBr(PRECO_ANUAL)}/ano no
      plano anual (mais barato que 12 meses avulsos). Toda nova conta começa com ${DIAS_TRIAL} dias grátis,
      sem cobrança até você decidir assinar.</div>
    </details>

    <details class="faq-item">
      <summary>Como convido outra pessoa para cuidar do bebê comigo?
        <svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
      </summary>
      <div class="faq-answer">Em Configurações → Cuidadores, toque em convidar e informe o e-mail da pessoa.
      Ela só precisa criar (ou já ter) uma conta no Ninho usando exatamente esse e-mail para o convite ser
      aceito. A partir daí, os dois veem e registram na mesma linha do tempo do bebê.</div>
    </details>

    <details class="faq-item">
      <summary>Posso excluir minha conta e meus dados?
        <svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
      </summary>
      <div class="faq-answer">Sim, a qualquer momento, em Configurações → Excluir conta. É preciso digitar
      "excluir" para confirmar — a ação é definitiva e não pode ser desfeita. Bebês que só você cuida são
      apagados junto; bebês compartilhados continuam existindo para os outros cuidadores, só o seu vínculo é
      removido. Veja os detalhes completos na <a href="/privacy">Política de Privacidade</a>.</div>
    </details>

    <details class="faq-item">
      <summary>Meus dados estão seguros?
        <svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
      </summary>
      <div class="faq-answer">Sim — tratamos tudo em conformidade com a LGPD, com acesso restrito por conta
      e criptografia em trânsito. Não vendemos nem compartilhamos dados de você ou do seu bebê com terceiros
      para fins de publicidade. Detalhes completos na <a href="/privacy">Política de Privacidade</a>.</div>
    </details>

    <details class="faq-item">
      <summary>O Ninho substitui o pediatra?
        <svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
      </summary>
      <div class="faq-answer">Não. O Ninho organiza e registra a rotina do seu bebê, mas não fornece
      diagnóstico médico nem substitui a orientação de um profissional de saúde. Em qualquer dúvida ou
      emergência, procure seu pediatra ou um serviço de emergência.</div>
    </details>

    <details class="faq-item">
      <summary>Não achei minha dúvida aqui. E agora?
        <svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
      </summary>
      <div class="faq-answer">Escreva pra gente pelo <a href="mailto:${SUPORTE_EMAIL}">${SUPORTE_EMAIL}</a> —
      conta o que está acontecendo com o máximo de detalhes (e prints, se der) que a gente responde rápido.</div>
    </details>
  </div>
</section>

<!-- FOOTER -->
<footer>
  <div class="container footer-inner">
    <div class="footer-top">
      <div>
        <div class="footer-brand">
          <img src="/brand/ninho-logo-limpo.png" alt="" class="footer-logo">
          <span class="footer-wordmark">NINHO</span>
        </div>
        <div class="footer-tagline">O dia a dia do seu bebê, com carinho e clareza.</div>
      </div>
      <div class="footer-links">
        <a href="/get/ios">App Store</a>
        <a href="/get/android">Google Play</a>
        <a href="/suporte">Suporte</a>
        <a href="mailto:${SUPORTE_EMAIL}">Contato</a>
        <a href="/privacy">Privacidade</a>
        <a href="/termos">Termos</a>
      </div>
    </div>
    <div class="footer-divider"></div>
    <div class="footer-bottom">
      <span>&#169; ${new Date().getFullYear()} Ninho. Todos os direitos reservados.</span>
      <span>Feito com cuidado no Brasil &#127463;&#127479;</span>
    </div>
  </div>
</footer>
`;

// ─── PAGE ──────────────────────────────────────────────────────────────────
export default function SuportePage() {
  return (
    <>
      {/* eslint-disable-next-line react/no-danger */}
      <style dangerouslySetInnerHTML={{ __html: css }} />
      {/* eslint-disable-next-line react/no-danger */}
      <div dangerouslySetInnerHTML={{ __html: bodyHtml }} />
    </>
  );
}
