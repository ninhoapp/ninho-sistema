/**
 * /sejaparceiro — aba "Seja parceiro" do site. Desde 09/11/2026 no mesmo desenho
 * da página Seja consultora (consultora.css), com menos texto e telas do app e
 * do painel. Desenho aprovado: Ninho-expo/docs/design/site/seja-parceiro.html.
 * O guia completo fica em /sejaparceiro/guia; /parceiros redireciona para cá.
 *
 * Regras do dono: comissão sempre "até 25%", nunca valor fixo (ele pode mudar
 * o percentual); Pix até o 5º dia útil do mês seguinte. Telas ilustrativas,
 * com dados de exemplo (nunca dado real de parceiro ou família).
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE_URL } from '@/lib/config';
import { FormSejaParceiro } from '@/components/site/FormSejaParceiro';
import { SitePage } from '@/components/site/SiteChrome';
import '@/components/site/consultora.css';
import '@/components/site/parceiro.css';

export const dynamic = 'force-dynamic';

const DESCRICAO =
  'Seja parceiro do Ninho: link e código só seus, comissão de até 25% sobre cada assinatura, painel com os seus números e Pix todo mês.';

export const metadata: Metadata = {
  title: 'Seja parceiro do Ninho | Ninho',
  description: DESCRICAO,
  alternates: { canonical: `${SITE_URL}/sejaparceiro` },
  openGraph: {
    title: 'Seja parceiro do Ninho',
    description: DESCRICAO,
    type: 'website',
    url: `${SITE_URL}/sejaparceiro`,
    siteName: 'Ninho',
    locale: 'pt_BR',
  },
};

const LOGO = '/brand/ninho-logo-limpo.png';

const ICONES = {
  link: <><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></>,
  barras: <path d="M5 20v-8M12 20V5M19 20v-5" />,
  cadeado: <><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>,
};

function Ic({ n, s = 24 }: { n: keyof typeof ICONES; s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICONES[n]}
    </svg>
  );
}

const MENU_WEB = ['Resultados', 'Ganhos', 'Quem veio por você', 'Guia do parceiro', 'Minha conta'];

function Navegador({ url, ativo, children }: { url: string; ativo: string; children: React.ReactNode }) {
  return (
    <div className="nc-web" aria-hidden="true">
      <div className="nc-web-bar"><i /><i /><i /><span><Ic n="cadeado" s={9} />{url}</span></div>
      <div className="nc-web-in">
        <div className="nc-web-side">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <div className="brand"><img src={LOGO} alt="" />Ninho · parceiro</div>
          {MENU_WEB.map((m) => <div key={m} className={`it${m === ativo ? ' on' : ''}`}>{m}</div>)}
        </div>
        <div className="nc-web-main">{children}</div>
      </div>
    </div>
  );
}

function TelaResultados() {
  const funil: [string, number, number, string?][] = [
    ['Cliques', 412, 100],
    ['Downloads', 96, 48],
    ['Cadastros', 41, 32],
    ['Assinantes', 7, 13, '#4CAF74'],
  ];
  return (
    <Navegador url="useninho.com.br/admin/parceiro" ativo="Resultados">
      <h4>Olá, Marina</h4>
      <div className="sub">Os resultados da sua divulgação</div>
      <div className="nc-kps nc-num" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="nc-kp"><div className="k">Cliques</div><div className="v">412</div></div>
        <div className="nc-kp"><div className="k">Downloads</div><div className="v">96</div></div>
        <div className="nc-kp"><div className="k">Assinantes</div><div className="v">7</div></div>
        <div className="nc-kp" style={{ background: '#EEF8F1' }}><div className="k" style={{ color: '#2F8A55' }}>Próximo Pix</div><div className="v" style={{ color: '#2F8A55' }}>R$ 98,40</div></div>
      </div>
      <div className="nc-pc">
        <div className="ttl">Do clique à assinatura</div>
        <div style={{ marginTop: 6 }}>
          {funil.map(([k, v, w, cor]) => (
            <div key={k} className="np-fn"><b>{k}</b><span><i style={{ width: `${w}%`, background: cor }} /></span><b className="nc-num">{v}</b></div>
          ))}
        </div>
      </div>
      <div className="nc-pc"><div className="ttl">Seu link<small>toque para copiar</small></div><div className="np-link">useninho.com.br/r/MARINA</div></div>
    </Navegador>
  );
}

function TelaGanhos() {
  const pagamentos: [string, string, string, boolean][] = [
    ['setembro', 'R$ 41,20', 'Pago em 07/10', true],
    ['outubro', 'R$ 63,90', 'Pix até 09/11', false],
    ['novembro', 'R$ 98,40', 'Pix até 07/12', false],
  ];
  return (
    <Navegador url="useninho.com.br/admin/parceiro?aba=ganhos" ativo="Ganhos">
      <h4>Ganhos</h4>
      <div className="sub">Comissão de cada mês e quando o Pix cai</div>
      <div className="nc-pc">
        <div className="ttl">Pagamentos</div>
        {pagamentos.map(([m, v, s, pago]) => (
          <div key={m} className="np-pg"><span>{m}</span><span className="nc-num"><b>{v}</b> <span className={`nc-bd ${pago ? 'np-bd-v' : 'am'}`}>{s}</span></span></div>
        ))}
      </div>
      <div className="nc-pc">
        <div className="ttl">Quem veio por você<small>sem nome, só a situação</small></div>
        <table className="nc-tbw">
          <thead><tr><th>Cadastro</th><th>Plano</th><th>Situação</th></tr></thead>
          <tbody>
            <tr><td className="nc-num">02/11</td><td>Premium anual</td><td><span className="nc-bd np-bd-v">Assinou</span></td></tr>
            <tr><td className="nc-num">05/11</td><td>Básico mensal</td><td><span className="nc-bd np-bd-v">Assinou</span></td></tr>
            <tr><td className="nc-num">07/11</td><td>—</td><td><span className="nc-bd np-bd-l">Teste grátis</span></td></tr>
          </tbody>
        </table>
      </div>
    </Navegador>
  );
}

function Fone({ src, alt }: { src: string; alt: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <div className="np-fone"><img src={src} alt={alt} loading="lazy" /></div>;
}

export default function ParceirosPage() {
  const abertoEm = Date.now();
  return (
    <SitePage>
      <div className="nc">
        <section className="nc-hero">
          <div className="n-wrap nc-hero-grid">
            <div>
              <span className="nc-selo">Ninho para criadores de conteúdo</span>
              <h1>Fale do Ninho.<br />Ganhe até 25% de cada assinatura.</h1>
              <p className="sub">Você recebe um link e um código só seus. Cada pessoa que baixa por eles e assina vira comissão, paga por Pix.</p>
              <div className="nc-ctas">
                <a href="#quero-ser-parceiro" className="nc-btn nc-btn-grad">Quero ser parceiro</a>
                <a href="#painel" className="nc-btn nc-btn-soft">Ver o painel</a>
              </div>
            </div>
            <div style={{ position: 'relative' }}>
              <TelaResultados />
              <div className="np-hero-fone"><Fone src="/app/home.webp" alt="Tela inicial do app Ninho" /></div>
            </div>
          </div>
        </section>

        <section className="n-wrap" style={{ marginTop: 34 }}>
          <div className="nc-g3">
            <div className="nc-big">
              <div className="nc-ico"><Ic n="link" /></div>
              <div className="num">Link + código</div>
              <b>Só seus</b>
              <p>O link vai na bio e nos Stories. O código você fala nos Reels, e a pessoa digita no cadastro.</p>
            </div>
            <div className="nc-big">
              <div className="nc-ico">R$</div>
              <div className="num">até 25%</div>
              <b>De comissão por assinatura</b>
              <p>Sobre o preço cheio da loja, de cada pessoa que veio por você e assinou.</p>
            </div>
            <div className="nc-big">
              <div className="nc-ico"><Ic n="barras" /></div>
              <div className="num">Painel</div>
              <b>Seus números na hora</b>
              <p>Cliques, downloads, cadastros, assinantes, comissão e a data do Pix.</p>
            </div>
          </div>
          <div className="nc-tags">
            <span className="nc-tag">Sem custo para você</span>
            <span className="nc-tag">Sem valor mínimo para receber</span>
            <span className="nc-tag">Pix todo mês</span>
          </div>
        </section>

        <section className="n-wrap nc-sec">
          <div className="nc-sec-t"><h2>Como funciona</h2><p>Do seu post até o Pix.</p></div>
          <div className="nc-g2" style={{ marginTop: 24 }}>
            {[
              ['1', 'Você divulga', 'Seu link nos Stories e na bio. Nos Reels, fale o código.'],
              ['2', 'A pessoa baixa o Ninho', 'O link abre a App Store ou o Google Play. O download conta para você.'],
              ['3', 'Cria a conta, com 7 dias grátis', 'Instalou sem o link? Digita o seu código no cadastro e vale igual.'],
              ['4', 'Assinou, você ganha', 'Quando a loja cobra de verdade, a comissão aparece no seu painel.'],
            ].map(([n, t, d]) => (
              <div key={n} className="nc-passo"><i style={n === '4' ? { background: '#4CAF74' } : undefined}>{n}</i><div><b>{t}</b><p>{d}</p></div></div>
            ))}
          </div>
          <div className="nc-banner lilas" style={{ maxWidth: 860, margin: '16px auto 0', textAlign: 'center' }}>
            Quem chega primeiro fica: a conta é do primeiro parceiro que trouxe a pessoa. Cancelou no teste grátis ou pediu reembolso, não gera comissão.
          </div>
        </section>

        <section className="n-wrap nc-sec" id="painel">
          <div className="nc-sec-t"><h2>Veja o seu painel</h2><p>Você acompanha tudo pelo computador ou pelo celular.</p></div>
          <p className="nc-lbl">Seu painel</p>
          <div className="nc-telas">
            <div><TelaResultados /><p className="nc-cap"><b>Resultados</b> · do clique à assinatura e o seu link</p></div>
            <div><TelaGanhos /><p className="nc-cap"><b>Ganhos</b> · comissão de cada mês e a data do Pix</p></div>
          </div>
          <p className="nc-lbl">O app que você vai mostrar</p>
          <div className="np-galeria">
            <figure><Fone src="/app/home.webp" alt="Início do app Ninho" /><figcaption><b>Início</b> · o dia do bebê</figcaption></figure>
            <figure><Fone src="/app/historico.webp" alt="Histórico do app Ninho" /><figcaption><b>Histórico</b> · cada registro</figcaption></figure>
            <figure><Fone src="/app/cuidadores.webp" alt="Cuidadores no app Ninho" /><figcaption><b>Cuidadores</b> · a família junta</figcaption></figure>
            <figure><Fone src="/app/assistente.webp" alt="Chat IA do app Ninho" /><figcaption><b>Chat IA</b> · tira dúvidas da rotina</figcaption></figure>
          </div>
          <p className="nc-ilustra">Telas ilustrativas, com dados de exemplo.</p>
        </section>

        <section className="n-wrap nc-sec">
          <div className="nc-sec-t"><h2>Comissão e pagamento</h2><p>Você ganha quando a pessoa paga. Teste grátis não conta.</p></div>
          <div className="nc-g2" style={{ marginTop: 24 }}>
            <div className="nc-card">
              <h3>Como a comissão é contada</h3>
              <div className="np-chips">
                <span>Até 25% da assinatura</span>
                <span>Sobre o preço cheio da loja</span>
                <span>Mensal: sobre a 1ª mensalidade</span>
                <span>Anual: uma vez</span>
              </div>
              <div className="nc-banner verde">O percentual combinado com você aparece no seu painel, antes de você começar a divulgar.</div>
            </div>
            <div className="nc-card">
              <h3>Como você recebe</h3>
              <div className="np-pix">
                <div><small>Forma</small><b>Pix</b><i>chave no painel</i></div>
                <div><small>Quando</small><b>5º dia útil</b><i>do mês seguinte</i></div>
                <div><small>Mínimo</small><b>Nenhum</b><i>qualquer valor</i></div>
              </div>
            </div>
          </div>
        </section>

        <section className="n-wrap nc-sec">
          <div className="nc-sec-t"><h2>O que pode e o que não pode</h2><p>O Ninho organiza a rotina do bebê. Ele não é um app de saúde.</p></div>
          <div className="nc-g2 np-pn" style={{ marginTop: 24 }}>
            <div className="nc-card ok">
              <h3><span style={{ background: '#4CAF74' }}>✓</span>Pode</h3>
              <ul>
                {['Mostrar o app de verdade, no seu dia a dia', 'Falar dos 7 dias grátis', 'Contar que a família toda registra junto', 'Dizer como o app ajudou a organizar a sua rotina'].map((t) => (
                  <li key={t}><span className="m">✓</span>{t}</li>
                ))}
              </ul>
            </div>
            <div className="nc-card no">
              <h3><span style={{ background: '#E85D5D' }}>✕</span>Não pode</h3>
              <ul>
                {['Prometer resultado ("seu bebê vai dormir a noite toda")', 'Dar orientação de saúde, remédio ou dose', 'Dizer "recomendado por pediatras" ou "grátis para sempre"', 'Inventar desconto, cupom ou recurso que o app não tem'].map((t) => (
                  <li key={t}><span className="m">✕</span>{t}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="nc-banner ambar" style={{ maxWidth: 860, margin: '16px auto 0', textAlign: 'center' }}>
            <b>#publi</b> · Todo post, Reels e Stories da parceria avisa que é publicidade, logo no começo.
          </div>
        </section>

        <section className="n-wrap nc-sec" id="quero-ser-parceiro" style={{ paddingBottom: 72 }}>
          <div className="nc-sec-t"><h2>Quero ser parceiro do Ninho</h2><p>Mande seus dados. A gente confere e te envia o seu link, o seu código e o acesso ao painel.</p></div>
          <FormSejaParceiro abertoEm={abertoEm} />
          <p style={{ textAlign: 'center', marginTop: 16 }}>
            <Link href="/sejaparceiro/guia" className="nc-btn nc-btn-soft">Ver o guia completo</Link>
          </p>
        </section>
      </div>
    </SitePage>
  );
}
