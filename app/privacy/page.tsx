import type { Metadata } from 'next';
import { SITE_URL, SUPORTE_EMAIL } from '@/lib/config';

export const metadata: Metadata = {
  title: 'Política de Privacidade — Ninho',
  description:
    'Como o Ninho coleta, usa e protege dados pessoais, em conformidade com a LGPD.',
  openGraph: {
    title: 'Política de Privacidade — Ninho',
    description: 'Como o Ninho coleta, usa e protege dados pessoais, em conformidade com a LGPD.',
    type: 'website',
    url: `${SITE_URL}/privacy`,
  },
};

// ─── CSS ───────────────────────────────────────────────────────────────────
// Nav e footer copiados 1:1 de app/landing/page.tsx (mesmas classes) — o
// site não tem um layout/componente compartilhado ainda, cada rota é
// autocontida, então isso replica o padrão já usado lá em vez de inventar
// um novo. Se um dia extrair um <SiteChrome>, atualizar aqui e em
// landing/page.tsx e suporte/page.tsx junto.
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

.container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 24px;
}

/* ─── NAV (igual à landing) ─────────────────────────────────────── */
nav {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(255,255,255,0.88);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
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

/* ─── ARTIGO LEGAL ──────────────────────────────────────────────── */
.legal-hero {
  padding: 56px 0 40px;
  text-align: center;
  background: linear-gradient(180deg, var(--branco) 0%, var(--lavanda) 100%);
}
.legal-hero .eyebrow {
  display: inline-block;
  background: var(--roxo-light);
  color: var(--roxo-dark);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: .4px;
  padding: 5px 14px;
  border-radius: 999px;
  margin-bottom: 16px;
}
.legal-hero h1 { font-size: clamp(28px, 5vw, 42px); font-weight: 700; letter-spacing: -.5px; color: var(--grafite); }
.legal-hero p { margin-top: 10px; font-size: 14px; color: var(--grafite-60); }

.legal-body { padding: 56px 0 96px; }
.legal-article { max-width: 720px; margin: 0 auto; }
.legal-article > p.lead {
  font-size: 15px;
  color: var(--grafite-80);
  line-height: 1.75;
  background: var(--nuvem);
  border-radius: 16px;
  padding: 20px 22px;
  margin-bottom: 40px;
}
.legal-article h2 {
  font-size: 18px;
  font-weight: 700;
  color: var(--grafite);
  margin: 36px 0 12px;
  padding-top: 24px;
  border-top: 1px solid var(--borda);
  letter-spacing: -.2px;
}
.legal-article h2:first-of-type { border-top: none; padding-top: 0; margin-top: 0; }
.legal-article p { font-size: 14.5px; color: var(--grafite-80); line-height: 1.75; margin-bottom: 14px; }
.legal-article ul { margin: 0 0 14px; padding-left: 20px; }
.legal-article li { font-size: 14.5px; color: var(--grafite-80); line-height: 1.7; margin-bottom: 7px; }
.legal-article strong { color: var(--grafite); font-weight: 700; }
.legal-article a { color: var(--roxo-dark); font-weight: 600; }

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
      <li><a href="/suporte">Suporte</a></li>
    </ul>
  </div>
</nav>

<!-- HERO -->
<section class="legal-hero">
  <div class="container">
    <span class="eyebrow">Última atualização: 14 de agosto de 2026</span>
    <h1>Política de Privacidade</h1>
    <p>Como o Ninho coleta, usa e protege os dados da sua família.</p>
  </div>
</section>

<!-- ARTIGO -->
<section class="legal-body">
  <div class="container">
    <article class="legal-article">
      <p class="lead">
        Esta Política de Privacidade descreve como o Ninho coleta, usa, armazena, compartilha e protege dados
        pessoais, em conformidade com a Lei Geral de Proteção de Dados (Lei 13.709/2018 — "LGPD") e demais
        legislações aplicáveis. Ao usar o Ninho, você concorda com as práticas descritas aqui.
      </p>

      <h2>1. Quem somos</h2>
      <p>O Ninho é o controlador dos dados pessoais tratados no app, nos termos do art. 5º, VI da LGPD. Para
      exercer seus direitos ou tirar dúvidas sobre privacidade, entre em contato pelo e-mail
      <a href="mailto:${SUPORTE_EMAIL}">${SUPORTE_EMAIL}</a>.</p>

      <h2>2. Que dados coletamos</h2>
      <ul>
        <li><strong>Dados de cadastro:</strong> nome, e-mail, foto de perfil (opcional), idioma e fuso horário do dispositivo.</li>
        <li><strong>Dados do(s) bebê(s):</strong> nome, data de nascimento (ou data prevista de parto), sexo (opcional), foto (opcional), e todos os registros que você optar por inserir — sono, alimentação, fraldas, banho, medicamentos, alergias, vacinas, consultas médicas, medidas de crescimento e observações.</li>
        <li><strong>Fotos e "momentos":</strong> imagens que você envia, com data, legenda opcional e marco de vida associado.</li>
        <li><strong>Dados de cuidadores:</strong> nome e e-mail de pessoas que você convida para compartilhar o acesso a um bebê, e o vínculo entre contas resultante da aceitação do convite.</li>
        <li><strong>Dados de assinatura:</strong> status do plano (gratuito/Premium), intervalo de cobrança e identificador da transação fornecido pela App Store ou Google Play — nunca processamos nem armazenamos números de cartão de crédito diretamente.</li>
        <li><strong>Dados técnicos:</strong> identificador do dispositivo para envio de notificações push, registros de erro (diagnóstico), e metadados de uso necessários para o funcionamento do app.</li>
      </ul>

      <h2>3. Base legal e finalidade do tratamento</h2>
      <p>Tratamos seus dados com base em (art. 7º da LGPD): execução de contrato, para fornecer as funcionalidades
      do app que você contratou; consentimento, para funcionalidades opcionais como notificações push e o convite
      de cuidadores; legítimo interesse, para prevenção a fraudes, segurança da conta e melhoria do app; e
      cumprimento de obrigação legal ou regulatória, quando exigido por lei.</p>
      <p>Usamos os dados exclusivamente para: operar o app e exibir o histórico do seu bebê a você e aos
      cuidadores autorizados; processar assinaturas; enviar notificações que você habilitar; oferecer suporte; e
      cumprir obrigações legais.</p>

      <h2>4. Dados de crianças</h2>
      <p>O Ninho trata dados referentes a bebês e crianças pequenas, inseridos exclusivamente por seus pais,
      responsáveis legais ou cuidadores por eles autorizados — nunca diretamente pela criança, que não tem
      acesso à conta.</p>
      <p>Nos termos do art. 14 da LGPD, o tratamento de dados de crianças é realizado com o consentimento
      específico e em destaque dado pelo responsável legal ao cadastrar o bebê no app, e sempre no melhor
      interesse da criança: organizar e acompanhar sua rotina e saúde.</p>
      <p>Não utilizamos dados de bebês e crianças para publicidade direcionada, nem os compartilhamos com
      terceiros para fins comerciais.</p>

      <h2>5. Com quem compartilhamos seus dados</h2>
      <ul>
        <li><strong>Cuidadores</strong> que você convidar têm acesso aos dados do(s) bebê(s) a que forem vinculados, nos termos que você autorizar.</li>
        <li><strong>Prestadores de serviço (operadores):</strong> hospedagem de banco de dados e armazenamento de arquivos (Supabase/AWS); processamento de pagamentos de assinatura (Apple App Store e Google Play); envio de notificações push (Apple Push Notification service e Firebase Cloud Messaging).</li>
      </ul>
      <p>Não vendemos seus dados pessoais nem os de seu(s) bebê(s), e não os compartilhamos com terceiros para
      fins de publicidade. Podemos divulgar dados quando exigido por lei, ordem judicial, ou para proteger
      direitos, segurança ou propriedade do Ninho e de seus usuários.</p>

      <h2>6. Transferência internacional de dados</h2>
      <p>Alguns de nossos prestadores de serviço podem armazenar ou processar dados em servidores localizados
      fora do Brasil. Nesses casos, exigimos contratualmente que sejam adotadas salvaguardas adequadas de
      proteção de dados, conforme o art. 33 da LGPD.</p>

      <h2>7. Armazenamento e segurança</h2>
      <p>Adotamos medidas técnicas e administrativas razoáveis para proteger seus dados contra acesso não
      autorizado, perda, alteração ou destruição, incluindo controle de acesso por conta, criptografia em
      trânsito, e políticas de acesso restrito a fotos e documentos. Nenhum sistema é 100% imune a incidentes de
      segurança; em caso de incidente que possa acarretar risco relevante a você, notificaremos conforme exigido
      pela LGPD.</p>

      <h2>8. Retenção e exclusão de dados</h2>
      <p>Mantemos seus dados enquanto sua conta estiver ativa e pelo tempo necessário para cumprir as finalidades
      descritas nesta Política, ou obrigações legais e regulatórias.</p>
      <p>Ao excluir sua conta (disponível a qualquer momento em Configurações → Excluir conta, dentro do app),
      seus dados de perfil e os dados de bebês que só você cuida são apagados de forma definitiva e irreversível.
      Bebês compartilhados com outros cuidadores permanecem com eles; apenas o seu vínculo é removido. Cópias de
      segurança podem reter dados por um período residual limitado, excluído nos ciclos normais de rotação de
      backup.</p>

      <h2>9. Seus direitos (LGPD, art. 18)</h2>
      <p>Você pode, a qualquer momento e mediante solicitação pelo e-mail
      <a href="mailto:${SUPORTE_EMAIL}">${SUPORTE_EMAIL}</a>:</p>
      <ul>
        <li>Confirmar a existência de tratamento de dados;</li>
        <li>Acessar os dados que temos sobre você e seu(s) bebê(s);</li>
        <li>Corrigir dados incompletos, inexatos ou desatualizados;</li>
        <li>Solicitar anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desconformidade com a lei;</li>
        <li>Solicitar a portabilidade dos seus dados a outro fornecedor de serviço;</li>
        <li>Solicitar a eliminação dos dados tratados com base no seu consentimento;</li>
        <li>Obter informações sobre com quem compartilhamos seus dados;</li>
        <li>Revogar o consentimento a qualquer momento;</li>
        <li>Solicitar revisão de decisões tomadas unicamente com base em tratamento automatizado que afetem seus interesses.</li>
      </ul>
      <p>Responderemos às solicitações dentro dos prazos estabelecidos pela LGPD. Se não estiver satisfeito com
      nossa resposta, você pode apresentar reclamação à Autoridade Nacional de Proteção de Dados (ANPD).</p>

      <h2>10. Notificações e comunicações</h2>
      <p>Você pode ativar ou desativar notificações push a qualquer momento em Configurações do app. Enviamos
      e-mails transacionais essenciais (como confirmação de conta e convites de cuidadores) independentemente
      dessa preferência, por serem necessários à prestação do serviço.</p>

      <h2>11. Crianças e adolescentes como titulares de conta</h2>
      <p>O Ninho não é destinado a ser usado diretamente por menores de 13 anos como titulares de conta. Contas
      devem ser criadas e geridas por adultos responsáveis.</p>

      <h2>12. Alterações desta Política</h2>
      <p>Podemos atualizar esta Política periodicamente. Alterações relevantes serão comunicadas dentro do app ou
      por e-mail antes de entrarem em vigor. Recomendamos revisar esta página periodicamente.</p>

      <h2>13. Contato e encarregado</h2>
      <p>Para exercer seus direitos, tirar dúvidas ou registrar reclamações sobre o tratamento de dados pessoais
      no Ninho, entre em contato pelo e-mail <a href="mailto:${SUPORTE_EMAIL}">${SUPORTE_EMAIL}</a>.</p>
    </article>
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
export default function PrivacyPage() {
  return (
    <>
      {/* eslint-disable-next-line react/no-danger */}
      <style dangerouslySetInnerHTML={{ __html: css }} />
      {/* eslint-disable-next-line react/no-danger */}
      <div dangerouslySetInnerHTML={{ __html: bodyHtml }} />
    </>
  );
}
