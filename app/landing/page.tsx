/**
 * Landing do Ninho (useninho.com.br/landing).
 *
 * Telas: prints reais do app em pt (bebê fictício Helena), limpos pelo
 * Ninho-expo/marketing/loja/screenshots/limpar.py e convertidos para WebP em
 * public/app/. Mesma mensagem das screenshots da loja: o Ninho controla
 * sono e mamada e mostra o que vem depois; cuidadores, IA e o resto depois.
 *
 * Regras de texto: sem promessa de saúde, previsão "costuma" (nunca
 * "garante"), e só recurso que existe hoje (a tela de Saúde, com vacinas,
 * alergias e crescimento, saiu do app em 18/10/2026).
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE_URL, STORE_ANDROID_URL, STORE_IOS_URL } from '@/lib/config';
import { DIAS_TRIAL, PRECOS, numeroBr } from '@/lib/precos';
import { GUIAS } from '@/lib/guias';
import { SitePage, StoreButtons, Phone, JsonLd } from '@/components/site/SiteChrome';
import { Planos } from '@/components/site/Planos';
import { AvisoNavegadorInsta } from '@/components/site/AvisoNavegadorInsta';

const TITULO = 'Ninho: app de rotina do bebê — mamada, sono e fralda';
const DESCRICAO =
  'Registre mamada, sono e fralda num toque, veja quando costuma vir a próxima soneca e mamada e divida o dia com quem cuida junto. 7 dias grátis no iPhone e Android.';

export const metadata: Metadata = {
  title: TITULO,
  description: DESCRICAO,
  alternates: { canonical: `${SITE_URL}/landing` },
  openGraph: {
    title: '"Que horas ela mamou?" O Ninho lembra por você.',
    description: DESCRICAO,
    type: 'website',
    url: `${SITE_URL}/landing`,
    siteName: 'Ninho',
    locale: 'pt_BR',
    images: [{ url: '/app/home.webp', width: 600, height: 1303, alt: 'Tela inicial do app Ninho' }],
  },
  twitter: { card: 'summary_large_image', title: TITULO, description: DESCRICAO },
};

const FAQ_LANDING = [
  {
    q: 'O Ninho é grátis?',
    a: `Os ${DIAS_TRIAL} primeiros dias são grátis, com tudo liberado. Depois, para continuar registrando, você escolhe o plano Básico (R$ ${numeroBr(PRECOS.basico.mensal)} por mês) ou o Premium (R$ ${numeroBr(PRECOS.premium.mensal)} por mês), com desconto no anual. Cancele quando quiser pela App Store ou Google Play.`,
  },
  {
    q: 'Funciona no iPhone e no Android?',
    a: 'Sim. O Ninho está na App Store e no Google Play, e um cuidador no iPhone vê o mesmo bebê que outro no Android. O cronômetro na tela bloqueada é do iPhone.',
  },
  {
    q: 'Como o Ninho sabe a hora da próxima soneca?',
    a: 'Ele olha os registros de sono e mamada do seu bebê nos últimos dias e calcula o intervalo que costuma se repetir. Com poucos registros, avisa que precisa de mais dados em vez de chutar. É uma previsão para se organizar, não uma regra.',
  },
  {
    q: 'Quantas pessoas podem registrar o mesmo bebê?',
    a: 'Você convida por e-mail quem cuida junto: pai, mãe, avós, babá. Cada um registra do próprio celular e todos veem o mesmo dia. Uma assinatura vale para todos os cuidadores do mesmo bebê.',
  },
  {
    q: 'O Ninho substitui o pediatra?',
    a: 'Não. O Ninho é uma ferramenta de organização para pais e cuidadores e não dá orientação médica. O histórico ajuda a levar a informação certa para a consulta.',
  },
  {
    q: 'Meus dados ficam seguros?',
    a: 'Os dados do bebê ficam na sua conta e só aparecem para os cuidadores que você convidou. A Política de Privacidade explica, em linguagem simples, o que é guardado e por quanto tempo.',
  },
];

const TIPOS: [string, string][] = [
  ['Peito', 'var(--n-peito)'],
  ['Mamadeira', 'var(--n-mamadeira)'],
  ['Sono', 'var(--n-sono)'],
  ['Fralda', 'var(--n-fralda)'],
  ['Comida', 'var(--n-comida)'],
  ['Banho', 'var(--n-banho)'],
  ['Remédio', '#D94A4A'],
  ['Água', '#7480E0'],
  ['Tummy time', '#3FC1B0'],
  ['Momento', 'var(--n-momento)'],
];

const GUIAS_DESTAQUE = [
  'intervalo-entre-mamadas-recem-nascido',
  'quanto-tempo-recem-nascido-dorme',
  'janela-de-sono-do-bebe',
  'quantas-fraldas-o-recem-nascido-usa-por-dia',
  'bebe-trocou-o-dia-pela-noite',
  'como-funciona-o-app-ninho',
];

export default function LandingPage() {
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Ninho',
      url: SITE_URL,
      logo: `${SITE_URL}/brand/ninho-logo.png`,
      sameAs: [STORE_IOS_URL, STORE_ANDROID_URL].filter(Boolean),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'MobileApplication',
      name: 'Ninho – Diário do bebê',
      operatingSystem: 'iOS, Android',
      applicationCategory: 'LifestyleApplication',
      inLanguage: 'pt-BR',
      description: DESCRICAO,
      url: `${SITE_URL}/landing`,
      downloadUrl: [STORE_IOS_URL, STORE_ANDROID_URL].filter(Boolean),
      image: `${SITE_URL}/app/home.webp`,
      screenshot: ['home', 'historico', 'cuidadores', 'assistente', 'calendario'].map(
        (t) => `${SITE_URL}/app/${t}.webp`
      ),
      featureList: [
        'Registro de mamada no peito (com lado), mamadeira, sono, fralda, comida, banho, remédio, água e tummy time',
        'Previsão da próxima soneca e da próxima mamada pelos registros do bebê',
        'Cuidadores convidados registrando no mesmo bebê',
        'Cronômetro na tela bloqueada do iPhone',
        'Linha do tempo de momentos, álbum em PDF e vídeo',
        'Assistente que responde sobre a rotina registrada',
        'Calendário de consultas e eventos',
      ],
      offers: [
        { '@type': 'Offer', name: 'Básico mensal', price: PRECOS.basico.mensal.toFixed(2), priceCurrency: 'BRL' },
        { '@type': 'Offer', name: 'Básico anual', price: PRECOS.basico.anual.toFixed(2), priceCurrency: 'BRL' },
        { '@type': 'Offer', name: 'Premium mensal', price: PRECOS.premium.mensal.toFixed(2), priceCurrency: 'BRL' },
        { '@type': 'Offer', name: 'Premium anual', price: PRECOS.premium.anual.toFixed(2), priceCurrency: 'BRL' },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FAQ_LANDING.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    },
  ];

  const destaques = GUIAS_DESTAQUE.map((s) => GUIAS.find((g) => g.slug === s)!).filter(Boolean);

  return (
    <SitePage>
      <JsonLd data={jsonLd} />
      <AvisoNavegadorInsta />

      {/* ─── HERO ─────────────────────────────────────────── */}
      <section className="n-hero">
        <div className="n-wrap n-hero-grid">
          <div>
            <span className="n-selo">
              <b>{DIAS_TRIAL} DIAS GRÁTIS</b> Para pais de recém-nascido
            </span>
            <h1>
              &ldquo;Que horas ela mamou?&rdquo;
              <br />
              <span className="n-grad-texto">O Ninho lembra por você.</span>
            </h1>
            <p className="n-hero-sub">
              Registre mamada, sono e fralda com um toque, veja quando costuma vir a próxima
              soneca e a próxima mamada, e divida o dia com todo mundo que cuida junto.
            </p>
            <StoreButtons />
            <div className="n-hero-nota">
              <span><Check /> Tudo liberado no teste</span>
              <span><Check /> Cancele quando quiser</span>
              <span><Check /> iPhone e Android</span>
            </div>
          </div>

          <div className="n-hero-visual">
            <img className="n-hero-mae" src="/app/mae-mamadeira.webp" alt="" width={900} height={821} />
            <Phone src="/app/home.webp" alt="Tela inicial do Ninho: botões de Peito, Sono, Fralda e Mamadeira, o Ritmo da Helena e o resumo de hoje" priority />
            <div className="n-notif n-notif-1" aria-hidden="true">
              <div className="n-notif-topo">
                <img src="/brand/ninho-logo-limpo.png" alt="" /> NINHO <em>agora</em>
              </div>
              <strong>Soneca entre 07:35 e 07:55</strong>
              <span>Helena costuma dormir cerca de 50 min depois de acordar.</span>
            </div>
            <div className="n-notif n-notif-2" aria-hidden="true">
              <div className="n-notif-topo">
                <img src="/brand/ninho-logo-limpo.png" alt="" /> NINHO <em>agora</em>
              </div>
              <strong>Mamada por volta das 09:00</strong>
              <span>Helena tem mamado a cada cerca de 2h40.</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── TIPOS DE REGISTRO ───────────────────────────── */}
      <div className="n-faixa" aria-label="O que dá para registrar">
        <div className="n-wrap n-faixa-in">
          {TIPOS.map(([nome, cor]) => (
            <span key={nome} className="n-chip">
              <i style={{ background: cor }} /> {nome}
            </span>
          ))}
        </div>
      </div>

      {/* ─── DOR ─────────────────────────────────────────── */}
      <section className="n-secao">
        <div className="n-wrap">
          <div className="n-cabeca">
            <span className="n-rotulo">Os primeiros meses</span>
            <h2>A cabeça já está cheia. A rotina do bebê não precisa ficar nela.</h2>
            <p>Três perguntas que toda casa com recém-nascido faz, várias vezes por dia.</p>
          </div>
          <div className="n-dor">
            <div className="n-dor-card">
              <p className="n-aspas">&ldquo;Que horas ele mamou? Foi no peito esquerdo?&rdquo;</p>
              <p>De madrugada ninguém lembra. No Ninho, a última mamada e o lado aparecem na tela inicial.</p>
            </div>
            <div className="n-dor-card">
              <p className="n-aspas">&ldquo;Dá tempo de tomar banho antes da próxima soneca?&rdquo;</p>
              <p>O Ninho aprende o ritmo do seu bebê e mostra quando a próxima soneca costuma chegar.</p>
            </div>
            <div className="n-dor-card">
              <p className="n-aspas">&ldquo;Amor, você trocou a fralda ou fui eu?&rdquo;</p>
              <p>Cada cuidador registra do próprio celular. Todo mundo vê o mesmo dia, na hora.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── RECURSOS ────────────────────────────────────── */}
      <section className="n-secao n-secao-lavanda" id="recursos" style={{ paddingTop: 72 }}>
        <div className="n-wrap">
          <div className="n-cabeca" style={{ marginBottom: 16 }}>
            <span className="n-rotulo">Como o Ninho ajuda</span>
            <h2>Tudo o que já aconteceu, e o que vem depois</h2>
          </div>

          <div className="n-recurso">
            <div className="n-recurso-texto">
              <span className="n-rotulo">Registro em um toque</span>
              <h3>Registre com o bebê no colo, até às 3 da manhã</h3>
              <p>
                Um toque em Peito, Mamadeira, Sono ou Fralda e pronto: a hora já vem preenchida.
                O histórico fica organizado por dia, com o resumo de ml, minutos de peito, horas
                de sono e fraldas.
              </p>
              <ul className="n-lista">
                <li>Peito com lado e duração; mamadeira em ml</li>
                <li>Sono e soneca com cronômetro</li>
                <li>Comida, banho, remédio, água, tummy time e pinico</li>
              </ul>
            </div>
            <div className="n-recurso-visual" style={{ ['--n-cor' as string]: '#FDE6EB' }}>
              <Phone src="/app/historico.webp" alt="Histórico do Ninho: Peito 15min, Sono 3h00, Mamadeira 120 ml, Fralda xixi e o resumo do dia" />
            </div>
          </div>

          <div className="n-recurso n-recurso-inv">
            <div className="n-recurso-texto">
              <span className="n-rotulo">Saiba o que vem depois</span>
              <h3>A próxima soneca e a próxima mamada, à vista</h3>
              <p>
                O Ninho aprende o ritmo do seu bebê pelos seus registros e mostra a janela de
                sono, o intervalo entre mamadas e qual peito oferecer. Com poucos dias de
                registro, ele avisa em vez de chutar.
              </p>
              <ul className="n-lista">
                <li>Aviso antes da próxima soneca</li>
                <li>Calculado com os dados do seu bebê, não com uma tabela genérica</li>
                <li>Muda junto com o bebê, semana a semana</li>
              </ul>
            </div>
            <div className="n-recurso-visual" style={{ ['--n-cor' as string]: '#E7DDFB' }}>
              <div className="n-ritmo" role="img" aria-label="Card Ritmo da Helena: janela de sono 50 min, soneca 07:35 a 07:55; 2h40 entre mamadas, próxima por volta de 09:00; último lado esquerdo, próximo direito">
                <div className="n-ritmo-topo">
                  <strong>Ritmo da Helena</strong>
                  <span>Com base nos seus registros</span>
                </div>
                <div className="n-ritmo-cols">
                  <div className="n-ritmo-col">
                    <div className="n-ritmo-ico" style={{ background: 'var(--n-sono)' }}>zᶻ</div>
                    <small>Janela de sono</small>
                    <b>50min</b>
                    <em style={{ color: 'var(--n-sono)' }}>Soneca 07:35–07:55</em>
                  </div>
                  <div className="n-ritmo-col">
                    <div className="n-ritmo-ico" style={{ background: 'var(--n-mamadeira)' }}>ml</div>
                    <small>Entre mamadas</small>
                    <b>2h40</b>
                    <em style={{ color: '#D9596F' }}>Próxima ~09:00</em>
                  </div>
                  <div className="n-ritmo-col">
                    <div className="n-ritmo-ico" style={{ background: 'var(--n-peito)' }}>E</div>
                    <small>Último lado</small>
                    <b style={{ fontSize: 20, lineHeight: '30px' }}>Esquerdo</b>
                    <em style={{ color: 'var(--n-peito)' }}>Próximo: direito</em>
                  </div>
                </div>
                <div className="n-linha" aria-hidden="true">
                  <div className="n-linha-ponto n-linha-agora" style={{ left: '8%' }}><span>agora</span><i /></div>
                  <div className="n-linha-ponto" style={{ left: '48%' }}><span>Soneca 07:35</span><i /></div>
                  <div className="n-linha-ponto n-linha-mamada" style={{ left: '86%' }}><span>Mamada ~09:00</span><i /></div>
                </div>
              </div>
            </div>
          </div>

          <div className="n-recurso">
            <div className="n-recurso-texto">
              <span className="n-rotulo">Quem cuida junto</span>
              <h3>Pai, avós e babá veem o mesmo dia, na hora</h3>
              <p>
                Convide quem cuida com você por e-mail. Cada um registra do próprio celular, no
                iPhone ou no Android, e a passagem de turno deixa de ser um interrogatório.
              </p>
              <ul className="n-lista">
                <li>Uma assinatura cobre todos os cuidadores do mesmo bebê</li>
                <li>Quem está no trabalho acompanha sem precisar ligar</li>
              </ul>
            </div>
            <div className="n-recurso-visual" style={{ ['--n-cor' as string]: '#DDF1E6' }}>
              <Phone src="/app/cuidadores.webp" alt="Tela Convidar cuidador do Ninho, com relação Mãe, Pai, Avó/Avô e Babá" />
            </div>
          </div>

          <div className="n-recurso n-recurso-inv">
            <div className="n-recurso-texto">
              <span className="n-rotulo">Pergunte sobre o dia <span className="n-etiqueta">Premium</span></span>
              <h3>&ldquo;Quando foi a última soneca?&rdquo; É só perguntar</h3>
              <p>
                O assistente do Ninho responde com base no que vocês registraram, e também
                registra por você. Ele deixa claro o que é: uma IA que ajuda a entender a rotina,
                não um pediatra.
              </p>
              <ul className="n-lista">
                <li>&ldquo;Qual a média de intervalo das sonecas?&rdquo;</li>
                <li>&ldquo;Quantos ml ela tomou hoje?&rdquo;</li>
              </ul>
            </div>
            <div className="n-recurso-visual" style={{ ['--n-cor' as string]: '#E7DDFB' }}>
              <Phone src="/app/assistente.webp" alt="Assistente do Ninho com sugestões de perguntas sobre a rotina do bebê" />
            </div>
          </div>
        </div>
      </section>

      {/* ─── MAIS RECURSOS ───────────────────────────────── */}
      <section className="n-secao">
        <div className="n-wrap">
          <div className="n-cabeca">
            <span className="n-rotulo">E mais</span>
            <h2>Feito para os primeiros meses de verdade</h2>
          </div>
          <div className="n-grade">
            <div className="n-card">
              <div className="n-card-ico" style={{ background: '#3A3480' }}><Icon d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" /></div>
              <h3>Cronômetro na tela bloqueada</h3>
              <p>No iPhone, acompanhe o sono ou a mamada ao vivo na tela bloqueada e na Dynamic Island, sem abrir o app.</p>
            </div>
            <div className="n-card">
              <div className="n-card-ico" style={{ background: 'var(--n-momento)' }}><Icon d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" /></div>
              <h3>Cada primeira vez, guardada</h3>
              <p>Fotos e marcos numa linha do tempo. No Premium, vira álbum em PDF ou vídeo para mandar para a família.</p>
            </div>
            <div className="n-card">
              <div className="n-card-ico" style={{ background: 'var(--n-banho)' }}><Icon d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" /></div>
              <h3>Consultas no calendário</h3>
              <p>Pediatra, vacinas, aulas e aniversários num calendário só, com os próximos eventos à vista.</p>
            </div>
            <div className="n-card">
              <div className="n-card-ico" style={{ background: 'var(--n-roxo-forte)' }}><Icon d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" /></div>
              <h3>Lembretes gentis</h3>
              <p>Um aviso antes da próxima soneca, para preparar o quarto antes do choro começar.</p>
            </div>
            <div className="n-card">
              <div className="n-card-ico" style={{ background: 'var(--n-comida)' }}><Icon d="M3 3v18h18M7 14l4-4 4 4 5-5" /></div>
              <h3>O dia inteiro de relance</h3>
              <p>Quanto tempo desde a última mamada, quanto o bebê dormiu e quantas fraldas hoje, logo na tela inicial.</p>
            </div>
            <div className="n-card">
              <div className="n-card-ico" style={{ background: 'var(--n-grafite)' }}><Icon d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></div>
              <h3>Seus dados, sua família</h3>
              <p>A rotina do bebê só aparece para os cuidadores que você convidou. A <a href="/privacidade" style={{ textDecoration: 'underline' }}>Política de Privacidade</a> explica tudo em linguagem simples.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── COMO FUNCIONA ───────────────────────────────── */}
      <section className="n-secao n-secao-lavanda" id="como-funciona">
        <div className="n-wrap">
          <div className="n-cabeca">
            <span className="n-rotulo">Como funciona</span>
            <h2>No primeiro dia você já registra. Em poucos dias, vê o ritmo.</h2>
          </div>
          <div className="n-passos">
            <div className="n-passo">
              <h3>Cadastre o bebê</h3>
              <p>Nome, data de nascimento e uma foto. Leva menos de um minuto.</p>
            </div>
            <div className="n-passo">
              <h3>Registre o dia a dia</h3>
              <p>Cada mamada, soneca e fralda entra com um toque. Convide quem cuida junto.</p>
            </div>
            <div className="n-passo">
              <h3>Veja o que vem depois</h3>
              <p>Com alguns dias de registro, o Ninho mostra quando a próxima soneca e mamada costumam acontecer.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── PLANOS ──────────────────────────────────────── */}
      <section className="n-secao" id="planos">
        <div className="n-wrap">
          <div className="n-cabeca" style={{ marginBottom: 28 }}>
            <span className="n-rotulo">Planos</span>
            <h2>{DIAS_TRIAL} dias grátis, com tudo liberado</h2>
            <p>Depois, escolha o plano que faz sentido para a sua casa.</p>
          </div>
          <Planos />
        </div>
      </section>

      {/* ─── GUIA ────────────────────────────────────────── */}
      <section className="n-secao n-secao-lavanda">
        <div className="n-wrap">
          <div className="n-cabeca">
            <span className="n-rotulo">Guia para pais</span>
            <h2>Dúvidas de quem acabou de ter bebê</h2>
            <p>Respostas diretas sobre sono, mamada e fralda. Cada número traz a fonte (OMS, AAP, SBP e outras): não é recomendação do Ninho.</p>
          </div>
          <div className="n-guias">
            {destaques.map((g) => (
              <Link key={g.slug} href={`/guia/${g.slug}`} className="n-guia-card">
                <small>{g.categoria}</small>
                <strong>{g.pergunta}</strong>
                <span>{g.descricao}</span>
                <em>Ler resposta →</em>
              </Link>
            ))}
          </div>
          <p style={{ textAlign: 'center', marginTop: 28 }}>
            <Link href="/guia" className="n-btn n-btn-claro">Ver todas as perguntas</Link>
          </p>
        </div>
      </section>

      {/* ─── FAQ ─────────────────────────────────────────── */}
      <section className="n-secao" id="perguntas">
        <div className="n-wrap">
          <div className="n-cabeca">
            <span className="n-rotulo">Perguntas frequentes</span>
            <h2>Antes de baixar</h2>
          </div>
          <div className="n-faq">
            {FAQ_LANDING.map((f) => (
              <details key={f.q}>
                <summary>{f.q}</summary>
                <div><p>{f.a}</p></div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CHAMADA FINAL ───────────────────────────────── */}
      <section className="n-final">
        <div className="n-wrap">
          <div className="n-final-box">
            <h2>Menos coisa para lembrar.<br />Mais tempo com o bebê.</h2>
            <p>Baixe o Ninho e use {DIAS_TRIAL} dias grátis, com tudo liberado.</p>
            <StoreButtons claro />
          </div>
        </div>
      </section>
    </SitePage>
  );
}

function Check() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function Icon({ d }: { d: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}
