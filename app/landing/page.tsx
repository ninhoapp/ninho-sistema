import type { Metadata } from 'next';
import { SITE_URL, CONTATO_EMAIL } from '@/lib/config';
import {
  PRECO_MENSAL,
  PRECO_ANUAL,
  PRECO_ANUAL_POR_MES,
  ECONOMIA_ANUAL,
  DESCONTO_ANUAL_PCT,
  DIAS_TRIAL,
  numeroBr,
} from '@/lib/precos';

export const metadata: Metadata = {
  title: 'Ninho — Cada momento do seu bebê, no lugar certo',
  description:
    'Ninho — o app que acompanha o dia a dia do seu bebê. Sono, mamadas, fraldas, vacinas, crescimento e memórias, compartilhados com quem cuida junto. Disponível para iOS e Android.',
  openGraph: {
    title: 'Ninho — Cada momento do seu bebê, no lugar certo',
    description:
      'Sono, mamadas, fraldas, vacinas, crescimento e memórias. Tudo registrado em segundos e compartilhado com quem cuida junto.',
    type: 'website',
    url: `${SITE_URL}/landing`,
  },
};

// ─── CSS ───────────────────────────────────────────────────────────────────
// Paleta idêntica a lib/theme/colors.json (cópia do app Ninho-expo).
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
  --grad-start:  #A46DFF;
  --grad-end:    #8C5CF8;
  --mel:         #F5C24E;
  --sono:        #9F86E0;
  --mamada:      #FFB78C;
  --fralda:      #6BC7A3;
  --banho:       #7DB7F0;
  --remedio:     #F2797A;
  --crescimento: #59B287;
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

.container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 24px;
}

/* ─── NAV ─────────────────────────────────────────────────────────── */
nav {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(255,255,255,0.88);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  border-bottom: 1px solid var(--borda);
}

.nav-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 62px;
  gap: 16px;
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.nav-logo { width: 30px; height: 30px; display: block; }

.nav-wordmark {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 3px;
  color: var(--roxo-dark);
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 28px;
  list-style: none;
}

.nav-links a {
  font-size: 14px;
  font-weight: 500;
  color: var(--grafite-60);
  transition: color .15s;
  white-space: nowrap;
}
.nav-links a:hover { color: var(--grafite); }

.nav-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.nav-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all .2s;
  border: none;
  white-space: nowrap;
}

.nav-btn-ios {
  background: var(--grafite);
  color: var(--branco);
}
.nav-btn-ios:hover {
  background: #111;
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(30,31,37,.28);
}

.nav-btn-android {
  background: var(--roxo);
  color: var(--branco);
}
.nav-btn-android:hover {
  background: var(--roxo-dark);
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(159,134,224,.42);
}

/* ─── HERO ────────────────────────────────────────────────────────── */
.hero {
  padding: 72px 0 64px;
  text-align: center;
  background: linear-gradient(180deg, var(--branco) 0%, var(--lavanda) 100%);
  overflow: hidden;
  position: relative;
}

.hero::before {
  content: '';
  position: absolute;
  top: -200px;
  left: 50%;
  transform: translateX(-50%);
  width: 700px;
  height: 700px;
  background: radial-gradient(circle, rgba(159,134,224,.13) 0%, transparent 68%);
  pointer-events: none;
}

.hero-logo {
  width: min(148px, 28vw);
  height: min(148px, 28vw);
  margin: 0 auto 24px;
  position: relative;
  z-index: 1;
}

.hero-logo img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  animation: ninhoFloat 4.5s ease-in-out infinite;
}

@keyframes ninhoFloat {
  0%, 100% { transform: translateY(0) scale(1); }
  50%      { transform: translateY(-8px) scale(1.035); }
}

.hero-badge {
  display: inline-block;
  background: var(--roxo-light);
  color: var(--roxo-dark);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: .4px;
  padding: 5px 14px;
  border-radius: 999px;
  margin-bottom: 18px;
  position: relative;
  z-index: 1;
}

.hero h1 {
  font-size: clamp(30px, 5.5vw, 56px);
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -1px;
  color: var(--grafite);
  max-width: 700px;
  margin: 0 auto 18px;
  position: relative;
  z-index: 1;
}

.hero h1 em {
  font-style: normal;
  color: var(--roxo-dark);
}

.hero-sub {
  font-size: clamp(15px, 2.2vw, 18px);
  color: var(--grafite-60);
  max-width: 520px;
  margin: 0 auto 36px;
  line-height: 1.65;
  position: relative;
  z-index: 1;
}

/* Store badges — dois lado a lado */
.hero-stores {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  justify-content: center;
  margin-bottom: 20px;
  position: relative;
  z-index: 1;
}

.store-badge {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  background: var(--grafite);
  color: var(--branco);
  padding: 11px 22px;
  border-radius: 14px;
  transition: all .2s;
  min-width: 190px;
  text-align: left;
  border: 1.5px solid transparent;
}

.store-badge:hover {
  background: #111;
  transform: translateY(-2px);
  box-shadow: 0 10px 28px rgba(30,31,37,.28);
}

.store-badge.android {
  background: var(--branco);
  color: var(--grafite);
  border-color: var(--grafite);
}
.store-badge.android:hover {
  background: var(--nuvem);
  transform: translateY(-2px);
  box-shadow: 0 10px 28px rgba(30,31,37,.12);
}

.store-icon { flex-shrink: 0; }

.store-text { display: flex; flex-direction: column; }
.store-label { font-size: 10px; opacity: .7; font-weight: 500; letter-spacing: .3px; }
.store-name  { font-size: 17px; font-weight: 700; letter-spacing: -.3px; line-height: 1.1; }

.hero-note {
  font-size: 13px;
  color: var(--grafite-60);
  margin-bottom: 56px;
  position: relative;
  z-index: 1;
}
.hero-note strong { color: var(--roxo-dark); font-weight: 600; }

/* ── iPhone 17 Pro Max mockup ────────────────────────────────────── */
.hero-mockup { display: flex; justify-content: center; position: relative; z-index: 1; }

.iphone17 {
  position: relative;
  width: min(290px, 60vw);
  background: linear-gradient(160deg, #56565a 0%, #1c1c1e 45%, #2c2c2e 100%);
  border-radius: 56px;
  padding: 11px;
  box-shadow:
    0 70px 130px rgba(45,30,80,.42),
    0 24px 48px rgba(45,30,80,.22),
    inset 0 0 0 1px rgba(255,255,255,.16),
    inset 0 1px 0 rgba(255,255,255,.24),
    inset 0 -1px 0 rgba(0,0,0,.5);
}

.iph-btn {
  position: absolute;
  background: linear-gradient(90deg, #3a3a3c, #4a4a4e);
  border-radius: 2px;
}
.iph-action {
  left: -3.5px; top: 16%;
  width: 3.5px; height: 4.5%;
  border-radius: 2px 0 0 2px;
  box-shadow: -1px 0 4px rgba(0,0,0,.5);
}
.iph-vol-up {
  left: -3.5px; top: 25%;
  width: 3.5px; height: 8%;
  border-radius: 2px 0 0 2px;
  box-shadow: -1px 0 4px rgba(0,0,0,.5);
}
.iph-vol-down {
  left: -3.5px; top: 36%;
  width: 3.5px; height: 8%;
  border-radius: 2px 0 0 2px;
  box-shadow: -1px 0 4px rgba(0,0,0,.5);
}
.iph-power {
  right: -3.5px; top: 27%;
  width: 3.5px; height: 13%;
  border-radius: 0 2px 2px 0;
  box-shadow: 1px 0 4px rgba(0,0,0,.5);
}

/* O print do app é uma tela cheia, sem status bar. Reservamos essa faixa aqui,
   pintada com o roxo exato do topo do header do app (#7E5FDC, amostrado do
   próprio PNG), pra dynamic island ter onde morar sem cobrir o título. */
.iph-screen {
  position: relative;
  border-radius: 47px;
  overflow: hidden;
  background: #7E5FDC;
  padding-top: 40px;
  line-height: 0;
}

/* Sobe a imagem o suficiente pra esconder os cantos arredondados dela (que
   apareceriam como falhas brancas sobre o roxo). Só corta faixa lisa. */
.iph-img {
  width: 100%;
  display: block;
  margin-top: -14px;
}

.iph-di {
  position: absolute;
  top: 11px;
  left: 50%;
  transform: translateX(-50%);
  width: 29%;
  height: 11px;
  background: #000;
  border-radius: 999px;
  z-index: 10;
  box-shadow: 0 0 0 1px rgba(255,255,255,.04);
}

/* ─── TRUST BAR ─────────────────────────────────────────────────── */
.trust-bar {
  background: var(--roxo);
  padding: 16px 0;
}

.trust-inner {
  display: flex;
  gap: 0;
  justify-content: center;
  flex-wrap: wrap;
  row-gap: 10px;
}

.trust-item {
  display: flex;
  align-items: center;
  gap: 7px;
  color: rgba(255,255,255,.92);
  font-size: 13px;
  font-weight: 500;
  padding: 0 20px;
  border-right: 1px solid rgba(255,255,255,.28);
  white-space: nowrap;
}
.trust-item:last-child { border-right: none; }

/* ─── FEATURES ──────────────────────────────────────────────────── */
.features {
  padding: 96px 0;
  background: var(--branco);
}

.section-header {
  text-align: center;
  margin-bottom: 56px;
}

.section-label {
  display: inline-block;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: var(--roxo-dark);
  margin-bottom: 12px;
}

.section-header h2 {
  font-size: clamp(24px, 3.8vw, 40px);
  font-weight: 700;
  letter-spacing: -.5px;
  line-height: 1.15;
  color: var(--grafite);
  max-width: 580px;
  margin: 0 auto 14px;
}

.section-header p {
  font-size: 16px;
  color: var(--grafite-60);
  max-width: 460px;
  margin: 0 auto;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(290px, 1fr));
  gap: 20px;
}

.feature-card {
  background: var(--nuvem);
  border-radius: 20px;
  padding: 30px 26px;
  transition: transform .2s, box-shadow .2s;
}
.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 16px 40px rgba(45,30,80,.09);
}

.feature-icon {
  width: 54px;
  height: 54px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 18px;
  flex-shrink: 0;
  background: var(--branco);
}
.feature-icon svg { width: 24px; height: 24px; flex-shrink: 0; }
.trust-item svg   { width: 15px; height: 15px; flex-shrink: 0; opacity: .95; }

.feature-card h3 {
  font-size: 17px;
  font-weight: 700;
  color: var(--grafite);
  margin-bottom: 9px;
  letter-spacing: -.2px;
}

.feature-card p {
  font-size: 14px;
  color: var(--grafite-60);
  line-height: 1.65;
}

/* ─── HOW IT WORKS ──────────────────────────────────────────────── */
.how {
  padding: 96px 0;
  background: var(--lavanda);
}

.how-steps {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 28px;
  margin-top: 56px;
}

.step { text-align: center; padding: 0 12px; }

.step-number {
  width: 46px;
  height: 46px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--grad-start) 0%, var(--grad-end) 100%);
  color: var(--branco);
  font-size: 17px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 18px;
  box-shadow: 0 8px 20px rgba(140,92,248,.28);
}

.step h3 { font-size: 16px; font-weight: 700; color: var(--grafite); margin-bottom: 8px; }
.step p  { font-size: 14px; color: var(--grafite-60); line-height: 1.65; }

/* ─── PRICING ───────────────────────────────────────────────────── */
.pricing {
  padding: 96px 0;
  background: var(--branco);
}

.pricing-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  background: var(--nuvem);
  border-radius: 999px;
  padding: 4px;
  width: fit-content;
  margin: 48px auto 40px;
}

.toggle-btn {
  padding: 9px 24px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  background: transparent;
  color: var(--grafite-60);
  transition: all .2s;
  white-space: nowrap;
  position: relative;
}

.toggle-btn.active {
  background: var(--branco);
  color: var(--grafite);
  box-shadow: 0 2px 8px rgba(45,30,80,.12);
}

.toggle-anual-badge {
  display: inline-block;
  background: var(--mel);
  color: var(--grafite);
  font-size: 10px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 999px;
  margin-left: 6px;
  vertical-align: middle;
}

.pricing-card-wrap {
  max-width: 480px;
  margin: 0 auto;
}

.pricing-card {
  background: linear-gradient(135deg, var(--grad-start) 0%, var(--grad-end) 100%);
  color: var(--branco);
  border-radius: 24px;
  padding: 40px 36px 36px;
  position: relative;
  box-shadow: 0 24px 60px rgba(140,92,248,.28);
}

.pricing-badge {
  position: absolute;
  top: -14px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--mel);
  color: var(--grafite);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .3px;
  padding: 5px 18px;
  border-radius: 999px;
  white-space: nowrap;
}

.plan-name {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 1.4px;
  text-transform: uppercase;
  opacity: .8;
  margin-bottom: 12px;
}

.plan-price-block { margin-bottom: 6px; }

.plan-price {
  font-size: 52px;
  font-weight: 700;
  letter-spacing: -2px;
  line-height: 1;
  display: inline-block;
}

.plan-price-currency {
  font-size: 22px;
  font-weight: 600;
  vertical-align: top;
  margin-top: 10px;
  display: inline-block;
  opacity: .85;
}

.plan-period {
  font-size: 13px;
  opacity: .7;
  margin-bottom: 6px;
}

.plan-annual-note {
  font-size: 12px;
  opacity: .65;
  margin-bottom: 28px;
  min-height: 18px;
}

.plan-features {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 32px;
}

.plan-features li {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 14px;
  line-height: 1.5;
}

.check {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: rgba(255,255,255,.22);
  color: var(--branco);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  margin-top: 2px;
}

.btn-plan-mel {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 15px 24px;
  border-radius: 999px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all .2s;
  border: none;
  background: var(--branco);
  color: var(--roxo-dark);
}
.btn-plan-mel:hover {
  background: var(--roxo-light);
  transform: translateY(-1px);
  box-shadow: 0 10px 28px rgba(30,20,60,.24);
}

/* ─── CTA CALLOUT ───────────────────────────────────────────────── */
.callout {
  padding: 96px 0;
  background: linear-gradient(135deg, var(--roxo) 0%, var(--roxo-dark) 100%);
  text-align: center;
  color: var(--branco);
}

.callout-logo {
  width: 84px;
  height: 84px;
  border-radius: 50%;
  background: var(--branco);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
  box-shadow: 0 12px 32px rgba(0,0,0,.18);
}
.callout-logo img { width: 66px; height: 66px; object-fit: contain; display: block; }

.callout h2 {
  font-size: clamp(24px, 3.8vw, 42px);
  font-weight: 700;
  letter-spacing: -.5px;
  line-height: 1.15;
  max-width: 580px;
  margin: 0 auto 14px;
}

.callout p {
  font-size: 16px;
  opacity: .85;
  max-width: 420px;
  margin: 0 auto 36px;
}

.callout-stores {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
}

.store-badge-light {
  display: inline-flex;
  align-items: center;
  gap: 11px;
  background: rgba(255,255,255,.14);
  color: var(--branco);
  padding: 10px 20px;
  border-radius: 13px;
  border: 1.5px solid rgba(255,255,255,.3);
  transition: all .2s;
  min-width: 175px;
  text-align: left;
  backdrop-filter: blur(8px);
}
.store-badge-light:hover {
  background: rgba(255,255,255,.24);
  transform: translateY(-2px);
  box-shadow: 0 10px 28px rgba(0,0,0,.2);
}

/* ─── FOOTER ────────────────────────────────────────────────────── */
footer {
  background: var(--grafite);
  color: rgba(255,255,255,.5);
  padding: 48px 0 30px;
}

.footer-inner { display: flex; flex-direction: column; gap: 28px; }

.footer-top {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 28px;
}

.footer-brand { display: flex; align-items: center; gap: 10px; }
.footer-logo { width: 22px; height: 22px; object-fit: contain; display: block; }
.footer-wordmark { font-size: 16px; font-weight: 700; letter-spacing: 3px; color: rgba(255,255,255,.9); }
.footer-tagline { font-size: 12px; margin-top: 6px; opacity: .45; }

.footer-links {
  display: flex;
  gap: 22px;
  flex-wrap: wrap;
  align-items: center;
}
.footer-links a { font-size: 13px; color: rgba(255,255,255,.5); transition: color .15s; }
.footer-links a:hover { color: rgba(255,255,255,.9); }

.footer-divider { height: 1px; background: rgba(255,255,255,.07); }

.footer-bottom {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  font-size: 12px;
}

/* ─── RESPONSIVE ────────────────────────────────────────────────── */
@media (max-width: 700px) {
  .nav-links { display: none; }
  .nav-btn span.btn-label { display: none; }
  .nav-btn { padding: 8px 12px; }
  .hero { padding: 48px 0 40px; }
  .features, .how, .pricing, .callout { padding: 64px 0; }
  .trust-item { border-right: none; padding: 2px 14px; }
  .footer-top { flex-direction: column; }
}

@media (max-width: 480px) {
  .store-badge { min-width: 160px; }
}

@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  .hero-logo img { animation: none; }
}
`;

// ─── BODY HTML ─────────────────────────────────────────────────────────────
const bodyHtml = `
<!-- NAV -->
<nav>
  <div class="container nav-inner">
    <a href="#" class="nav-brand" aria-label="Ninho">
      <img src="/brand/ninho-logo-limpo.png" alt="" class="nav-logo">
      <span class="nav-wordmark">NINHO</span>
    </a>
    <ul class="nav-links">
      <li><a href="#features">Funcionalidades</a></li>
      <li><a href="#como-funciona">Como funciona</a></li>
      <li><a href="#planos">Planos</a></li>
    </ul>
    <div class="nav-actions">
      <a href="/get/ios" class="nav-btn nav-btn-ios" aria-label="Baixar para iOS">
        <svg width="14" height="14" viewBox="0 0 814 1000" fill="currentColor" aria-hidden="true">
          <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-37.5-155.5-127.4C46.3 799.8 0 682.3 0 569.8c0-166.5 109.4-254.8 216.5-254.8 55.1 0 101.5 36.8 136.5 36.8 33.4 0 86.1-39 149.5-39 24.2 0 108.2 2.6 168.6 73.6zm-68.6-184.5c31.4-37.4 53.5-89.4 53.5-141.4 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.8-55.1 135.8 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.1-69.5z"/>
        </svg>
        <span class="btn-label">Baixar iOS</span>
      </a>
      <a href="/get/android" class="nav-btn nav-btn-android" aria-label="Baixar para Android">
        <svg width="13" height="14" viewBox="0 0 512 512" fill="currentColor" aria-hidden="true">
          <path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l232.4-232.4L47 0zm425.6 225.6l-58.9-34-65.7 64.5 65.7 64.5 60.1-34.3c17.1-9.8 17.1-34.9 0-60.7zm-375.4 220.1L337 324.3l-60.1-60.1-220.7 220.7z" fill="white"/>
        </svg>
        <span class="btn-label">Baixar Android</span>
      </a>
    </div>
  </div>
</nav>

<!-- HERO -->
<section class="hero">
  <div class="container">
    <div class="hero-logo">
      <img src="/brand/ninho-logo-limpo.png" alt="Ninho">
    </div>
    <span class="hero-badge">&#10022; Diário do bebê com IA</span>
    <h1>Cada momento do seu bebê<br>em um só <em>ninho</em></h1>
    <p class="hero-sub">
      Sono, mamada, fralda, banho e remédio registrados em dois toques.
      Vacinas, consultas e crescimento sempre em dia — e tudo compartilhado
      com quem cuida junto, em tempo real.
    </p>
    <div class="hero-stores">
      <a href="/get/ios" class="store-badge" aria-label="Baixar na App Store">
        <span class="store-icon">
          <svg width="28" height="34" viewBox="0 0 814 1000" fill="white" aria-hidden="true">
            <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-37.5-155.5-127.4C46.3 799.8 0 682.3 0 569.8c0-166.5 109.4-254.8 216.5-254.8 55.1 0 101.5 36.8 136.5 36.8 33.4 0 86.1-39 149.5-39 24.2 0 108.2 2.6 168.6 73.6zm-68.6-184.5c31.4-37.4 53.5-89.4 53.5-141.4 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.8-55.1 135.8 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.1-69.5z"/>
          </svg>
        </span>
        <span class="store-text">
          <span class="store-label">Disponível na</span>
          <span class="store-name">App Store</span>
        </span>
      </a>
      <a href="/get/android" class="store-badge android" aria-label="Baixar no Google Play">
        <span class="store-icon">
          <svg width="28" height="31" viewBox="0 0 512 512" aria-hidden="true">
            <path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1z" fill="#EA4335"/>
            <path d="M47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l232.4-232.4L47 0z" fill="#4285F4"/>
            <path d="M472.6 225.6l-58.9-34-65.7 64.5 65.7 64.5 60.1-34.3c17.1-9.8 17.1-34.9 0-60.7z" fill="#FBBC04"/>
            <path d="M47 512l280.8-161.2-60.1-60.1L47 512z" fill="#34A853"/>
          </svg>
        </span>
        <span class="store-text">
          <span class="store-label" style="color:var(--grafite-60);">Disponível no</span>
          <span class="store-name" style="color:var(--grafite);">Google Play</span>
        </span>
      </a>
    </div>
    <p class="hero-note">
      <strong>${DIAS_TRIAL} dias grátis</strong> &middot; Cancele quando quiser
    </p>
    <div class="hero-mockup" aria-hidden="true">
      <div class="iphone17">
        <div class="iph-btn iph-action"></div>
        <div class="iph-btn iph-vol-up"></div>
        <div class="iph-btn iph-vol-down"></div>
        <div class="iph-btn iph-power"></div>
        <div class="iph-screen">
          <div class="iph-di"></div>
          <img src="/screenshot.png" alt="Ninho — tela de momentos" class="iph-img">
        </div>
      </div>
    </div>
  </div>
</section>

<!-- TRUST BAR -->
<div class="trust-bar">
  <div class="container trust-inner">
    <span class="trust-item">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
      Dados protegidos (LGPD)
    </span>
    <span class="trust-item">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
      Assistente com IA
    </span>
    <span class="trust-item">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      Registro em 2 toques
    </span>
    <span class="trust-item">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
      Compartilhe com quem cuida
    </span>
    <span class="trust-item">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect width="20" height="5" x="2" y="7"/><line x1="12" x2="12" y1="22" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>
      ${DIAS_TRIAL} dias grátis
    </span>
  </div>
</div>

<!-- FEATURES -->
<section class="features" id="features">
  <div class="container">
    <div class="section-header">
      <span class="section-label">Funcionalidades</span>
      <h2>Tudo sobre o seu bebê, sem virar mais uma tarefa</h2>
      <p>O Ninho foi desenhado para ser rápido de usar num dia que já é corrido.</p>
    </div>
    <div class="features-grid">
      <div class="feature-card">
        <div class="feature-icon" style="color:var(--sono);">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
        </div>
        <h3>Rotina em dois toques</h3>
        <p>Sono, mamada, fralda, banho, refeição e medicamento. O Ninho lembra o último registro e já preenche por você — dá pra lançar com o bebê no colo.</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon" style="color:var(--grad-end);">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
        </div>
        <h3>Assistente com IA</h3>
        <p>Pergunte o que quiser sobre a rotina do seu bebê. A IA conhece o histórico dele e responde com base no que você já registrou — sem achismo.</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon" style="color:var(--fralda);">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m18 2 4 4"/><path d="m17 7 3-3"/><path d="M19 9 8.7 19.3c-1 1-2.5 1-3.4 0l-.6-.6c-1-1-1-2.5 0-3.4L15 5"/><path d="m9 11 4 4"/><path d="m5 19-3 3"/><path d="m14 4 6 6"/></svg>
        </div>
        <h3>Vacinas e consultas</h3>
        <p>Calendário vacinal completo com o que já foi aplicado e o que vem a seguir. Consultas com anexos de exames e receitas, tudo junto.</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon" style="color:var(--crescimento);">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="m19 9-5 5-4-4-3 3"/></svg>
        </div>
        <h3>Crescimento em gráfico</h3>
        <p>Peso, altura e perímetro cefálico plotados ao longo do tempo. Você vê a curva do seu bebê e leva pronta para o pediatra.</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon" style="color:var(--mamada);">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
        </div>
        <h3>Momentos e álbuns</h3>
        <p>A linha do tempo do seu bebê, com fotos organizadas em álbuns. Cada primeira vez guardada no lugar certo, sem se perder na galeria.</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon" style="color:var(--banho);">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        </div>
        <h3>Cuidado compartilhado</h3>
        <p>Convide o pai, a mãe, a avó ou a babá. Cada um registra do próprio celular e todo mundo vê a mesma rotina atualizada na hora.</p>
      </div>
    </div>
  </div>
</section>

<!-- HOW IT WORKS -->
<section class="how" id="como-funciona">
  <div class="container">
    <div class="section-header">
      <span class="section-label">Como funciona</span>
      <h2>Em três passos, você está no controle</h2>
      <p>Configuração simples, resultado no primeiro dia.</p>
    </div>
    <div class="how-steps">
      <div class="step">
        <div class="step-number">1</div>
        <h3>Cadastre seu bebê</h3>
        <p>Nome, data de nascimento e uma foto. Em menos de um minuto o Ninho já monta o calendário de vacinas certo para a idade dele.</p>
      </div>
      <div class="step">
        <div class="step-number">2</div>
        <h3>Registre o dia a dia</h3>
        <p>Cada soneca, mamada e troca entra em dois toques. O que você não lançar, pode perguntar depois para a IA.</p>
      </div>
      <div class="step">
        <div class="step-number">3</div>
        <h3>Acompanhe e compartilhe</h3>
        <p>Veja padrões de sono e alimentação, o gráfico de crescimento e a linha do tempo — junto com quem cuida do bebê com você.</p>
      </div>
    </div>
  </div>
</section>

<!-- PRICING -->
<section class="pricing" id="planos">
  <div class="container">
    <div class="section-header">
      <span class="section-label">Planos</span>
      <h2>${DIAS_TRIAL} dias grátis.<br>Depois, só R$&nbsp;${numeroBr(PRECO_MENSAL)}.</h2>
      <p>Sem cartão de crédito para começar. Cancele quando quiser.</p>
    </div>
    <div class="pricing-toggle" role="group" aria-label="Ciclo de cobrança">
      <button class="toggle-btn active" id="btnMensal" onclick="setPricing('mensal')">Mensal</button>
      <button class="toggle-btn" id="btnAnual" onclick="setPricing('anual')">Anual <span class="toggle-anual-badge">${DESCONTO_ANUAL_PCT}% off</span></button>
    </div>
    <div class="pricing-card-wrap">
      <div class="pricing-card">
        <div class="pricing-badge">${DIAS_TRIAL} dias grátis — sem cartão</div>
        <div class="plan-name">Premium</div>
        <div class="plan-price-block">
          <span class="plan-price-currency">R$</span><span class="plan-price" id="planPrice">${numeroBr(PRECO_MENSAL)}</span>
        </div>
        <div class="plan-period" id="planPeriod">por mês</div>
        <div class="plan-annual-note" id="planAnnualNote"></div>
        <ul class="plan-features">
          <li><span class="check">&#10003;</span> Registros de rotina ilimitados</li>
          <li><span class="check">&#10003;</span> Assistente com IA ilimitado</li>
          <li><span class="check">&#10003;</span> Calendário de vacinas completo</li>
          <li><span class="check">&#10003;</span> Consultas com anexos de exames</li>
          <li><span class="check">&#10003;</span> Gráficos de crescimento</li>
          <li><span class="check">&#10003;</span> Alergias e medicamentos</li>
          <li><span class="check">&#10003;</span> Momentos, álbuns e fotos</li>
          <li><span class="check">&#10003;</span> Cuidadores convidados sem limite</li>
        </ul>
        <a href="/get/ios" class="btn-plan-mel">
          Começar grátis por ${DIAS_TRIAL} dias
        </a>
      </div>
    </div>
  </div>
</section>

<!-- CTA CALLOUT -->
<section class="callout">
  <div class="container">
    <div class="callout-logo" aria-hidden="true">
      <img src="/brand/ninho-logo-limpo.png" alt="">
    </div>
    <h2>Eles crescem rápido.<br>O Ninho guarda cada passo.</h2>
    <p>Baixe agora e comece seus ${DIAS_TRIAL} dias grátis. Cancele quando quiser.</p>
    <div class="callout-stores">
      <a href="/get/ios" class="store-badge-light" aria-label="Baixar na App Store">
        <svg width="24" height="29" viewBox="0 0 814 1000" fill="white" aria-hidden="true">
          <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-37.5-155.5-127.4C46.3 799.8 0 682.3 0 569.8c0-166.5 109.4-254.8 216.5-254.8 55.1 0 101.5 36.8 136.5 36.8 33.4 0 86.1-39 149.5-39 24.2 0 108.2 2.6 168.6 73.6zm-68.6-184.5c31.4-37.4 53.5-89.4 53.5-141.4 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.8-55.1 135.8 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.1-69.5z"/>
        </svg>
        <span class="store-text">
          <span class="store-label">Disponível na</span>
          <span class="store-name">App Store</span>
        </span>
      </a>
      <a href="/get/android" class="store-badge-light" aria-label="Baixar no Google Play">
        <svg width="24" height="27" viewBox="0 0 512 512" aria-hidden="true">
          <path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1z" fill="#EA4335"/>
          <path d="M47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l232.4-232.4L47 0z" fill="#4285F4"/>
          <path d="M472.6 225.6l-58.9-34-65.7 64.5 65.7 64.5 60.1-34.3c17.1-9.8 17.1-34.9 0-60.7z" fill="#FBBC04"/>
          <path d="M47 512l280.8-161.2-60.1-60.1L47 512z" fill="#34A853"/>
        </svg>
        <span class="store-text">
          <span class="store-label">Disponível no</span>
          <span class="store-name">Google Play</span>
        </span>
      </a>
    </div>
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
        <a href="#features">Funcionalidades</a>
        <a href="#planos">Planos</a>
        <a href="mailto:${CONTATO_EMAIL}">Contato</a>
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

// ─── JS ────────────────────────────────────────────────────────────────────
const pricingJs = `
function setPricing(ciclo) {
  var isAnual = ciclo === 'anual';
  document.getElementById('btnMensal').classList.toggle('active', !isAnual);
  document.getElementById('btnAnual').classList.toggle('active', isAnual);
  document.getElementById('planPrice').textContent = isAnual ? '${numeroBr(PRECO_ANUAL_POR_MES)}' : '${numeroBr(PRECO_MENSAL)}';
  document.getElementById('planPeriod').textContent = isAnual ? 'por mês, cobrado anualmente' : 'por mês';
  document.getElementById('planAnnualNote').textContent = isAnual ? 'R$ ${numeroBr(PRECO_ANUAL)}/ano — economia de R$ ${numeroBr(ECONOMIA_ANUAL)}' : '';
}
`;

// Resolve o bloqueio do Instagram/Facebook IAB para links das lojas.
// O IAB do Meta bloqueia navegação direta para apps.apple.com / play.google.com.
// Os botões já apontam para /get/ios e /get/android no nosso próprio domínio —
// o IAB consegue navegar aí, e a página de redirect cuida de abrir a loja.
// O banner é um aviso adicional de boa UX.
const iabFixJs = `
(function () {
  var ua = navigator.userAgent || '';
  var isMetaIAB = /Instagram|FBAN|FBAV|FB_IAB/i.test(ua);
  var isIOS = /iPhone|iPad|iPod/i.test(ua);

  if (isMetaIAB) {
    var banner = document.createElement('div');
    banner.innerHTML = isIOS
      ? '<span>Para baixar o app, toque em <strong>&#8942;</strong> e selecione <strong>"Abrir no Safari"</strong></span><button onclick="this.parentNode.remove()" aria-label="Fechar">&#10005;</button>'
      : '<span>Para baixar o app, toque em <strong>&#8942;</strong> e selecione <strong>"Abrir no Chrome"</strong></span><button onclick="this.parentNode.remove()" aria-label="Fechar">&#10005;</button>';
    banner.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:9999;background:#7C5CD6;color:#fff;padding:12px 16px;display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:14px;line-height:1.4;';
    banner.querySelector('button').style.cssText = 'flex-shrink:0;background:rgba(255,255,255,0.2);border:none;color:#fff;border-radius:50%;width:28px;height:28px;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;';
    document.body.prepend(banner);
  }
})();
`;

// ─── PAGE ──────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <>
      {/* eslint-disable-next-line react/no-danger */}
      <style dangerouslySetInnerHTML={{ __html: css }} />
      {/* eslint-disable-next-line react/no-danger */}
      <div dangerouslySetInnerHTML={{ __html: bodyHtml }} />
      {/* eslint-disable-next-line react/no-danger */}
      <script dangerouslySetInnerHTML={{ __html: pricingJs }} />
      {/* eslint-disable-next-line react/no-danger */}
      <script dangerouslySetInnerHTML={{ __html: iabFixJs }} />
    </>
  );
}
