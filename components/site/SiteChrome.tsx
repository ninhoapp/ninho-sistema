/**
 * Peças comuns das páginas públicas (landing e /guia): moldura da página,
 * menu, rodapé, botões das lojas, moldura de celular e JSON-LD.
 *
 * Os botões das lojas apontam para /get/ios e /get/android (nosso domínio),
 * e não direto para a loja: o navegador embutido do Instagram bloqueia link
 * direto para apps.apple.com / play.google.com.
 */
import Link from 'next/link';
import { Nunito } from 'next/font/google';
import { CONTATO_EMAIL } from '@/lib/config';
import { DIAS_TRIAL } from '@/lib/precos';
import './site.css';

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800', '900'],
  display: 'swap',
  variable: '--n-font',
});

export function SitePage({ children }: { children: React.ReactNode }) {
  return (
    <div className={`n-site ${nunito.variable}`}>
      <SiteNav />
      <main>{children}</main>
      <SiteFooter />
    </div>
  );
}

export function SiteNav() {
  return (
    <header className="n-nav">
      <div className="n-wrap n-nav-in">
        <Link href="/landing" className="n-marca" aria-label="Ninho — início">
          <img src="/brand/ninho-logo-limpo.png" alt="" width={32} height={32} />
          NINHO
        </Link>
        <ul className="n-nav-links">
          <li><Link href="/landing#recursos">Recursos</Link></li>
          <li><Link href="/landing#como-funciona">Como funciona</Link></li>
          <li><Link href="/landing#planos">Planos</Link></li>
          <li><Link href="/guia">Guia para pais</Link></li>
        </ul>
        <div className="n-nav-cta">
          <a href="/get/ios" className="n-btn n-btn-escuro n-btn-sm" aria-label="Baixar o Ninho na App Store">
            <AppleIcon size={13} /> iPhone
          </a>
          <a href="/get/android" className="n-btn n-btn-roxo n-btn-sm" aria-label="Baixar o Ninho no Google Play">
            <PlayIcon size={12} mono /> Android
          </a>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="n-rodape">
      <div className="n-wrap">
        <div className="n-rodape-grid">
          <div>
            <div className="n-marca">
              <img src="/brand/ninho-logo-limpo.png" alt="" width={32} height={32} />
              NINHO
            </div>
            <p style={{ margin: 0, maxWidth: 300 }}>
              O app de rotina do bebê: mamadas, sono e fraldas num toque, a
              próxima soneca e mamada à vista, e todo mundo que cuida junto.
            </p>
          </div>
          <div>
            <h4>App</h4>
            <ul>
              <li><a href="/get/ios">App Store (iPhone)</a></li>
              <li><a href="/get/android">Google Play (Android)</a></li>
              <li><Link href="/landing#planos">Planos e preços</Link></li>
              <li><Link href="/guia/como-funciona-o-app-ninho">Como o Ninho funciona</Link></li>
            </ul>
          </div>
          <div>
            <h4>Guia para pais</h4>
            <ul>
              <li><Link href="/guia/quanto-tempo-recem-nascido-dorme">Sono do recém-nascido</Link></li>
              <li><Link href="/guia/intervalo-entre-mamadas-recem-nascido">Intervalo entre mamadas</Link></li>
              <li><Link href="/guia/janela-de-sono-do-bebe">Janela de sono</Link></li>
              <li><Link href="/guia">Todas as perguntas</Link></li>
            </ul>
          </div>
          <div>
            <h4>Ninho</h4>
            <ul>
              <li><Link href="/suporte">Suporte</Link></li>
              <li><a href={`mailto:${CONTATO_EMAIL}`}>Contato</a></li>
              <li><a href="/privacidade">Privacidade</a></li>
              <li><a href="/termos">Termos de uso</a></li>
            </ul>
          </div>
        </div>
        <div className="n-rodape-base">
          <span>© {new Date().getFullYear()} Ninho. {DIAS_TRIAL} dias grátis, cancele quando quiser.</span>
          <span>O Ninho organiza a rotina e não substitui o pediatra.</span>
        </div>
      </div>
    </footer>
  );
}

export function StoreButtons({ claro = false }: { claro?: boolean }) {
  const cls = claro ? 'n-loja n-loja-clara' : 'n-loja';
  return (
    <div className="n-lojas">
      <a href="/get/ios" className={cls} aria-label="Baixar o Ninho na App Store">
        <AppleIcon size={26} />
        <span>
          <small>Baixar na</small>
          <strong>App Store</strong>
        </span>
      </a>
      <a href="/get/android" className={cls} aria-label="Baixar o Ninho no Google Play">
        <PlayIcon size={24} />
        <span>
          <small>Disponível no</small>
          <strong>Google Play</strong>
        </span>
      </a>
    </div>
  );
}

/**
 * Print real do app dentro de um iPhone desenhado em CSS: aro de titânio com
 * reflexo, botões laterais, borda preta fina, Dynamic Island e brilho do
 * vidro. As medidas seguem as proporções do iPhone 16 Pro (tela 1179x2556),
 * em cqw, para valer em qualquer largura.
 */
export function Phone({
  src,
  alt,
  priority = false,
  style,
}: {
  src: string;
  alt: string;
  priority?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <div className="n-phone" style={style}>
      <div className="n-phone-corpo">
        <i className="n-phone-botao n-phone-acao" />
        <i className="n-phone-botao n-phone-vol1" />
        <i className="n-phone-botao n-phone-vol2" />
        <i className="n-phone-botao n-phone-power" />
        <div className="n-phone-tela">
          <img
            src={src}
            alt={alt}
            width={600}
            height={1303}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            {...(priority ? { fetchPriority: 'high' as const } : {})}
          />
          <i className="n-phone-ilha" />
          <i className="n-phone-brilho" />
        </div>
      </div>
    </div>
  );
}

export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  );
}

export function AppleIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size * 1.2} viewBox="0 0 814 1000" fill="currentColor" aria-hidden="true">
      <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-37.5-155.5-127.4C46.3 799.8 0 682.3 0 569.8c0-166.5 109.4-254.8 216.5-254.8 55.1 0 101.5 36.8 136.5 36.8 33.4 0 86.1-39 149.5-39 24.2 0 108.2 2.6 168.6 73.6zm-68.6-184.5c31.4-37.4 53.5-89.4 53.5-141.4 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.8-55.1 135.8 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.1-69.5z" />
    </svg>
  );
}

export function PlayIcon({ size = 20, mono = false }: { size?: number; mono?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" aria-hidden="true">
      <path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1z" fill={mono ? 'currentColor' : '#EA4335'} />
      <path d="M47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l232.4-232.4L47 0z" fill={mono ? 'currentColor' : '#4285F4'} />
      <path d="M472.6 225.6l-58.9-34-65.7 64.5 65.7 64.5 60.1-34.3c17.1-9.8 17.1-34.9 0-60.7z" fill={mono ? 'currentColor' : '#FBBC04'} />
      <path d="M47 512l280.8-161.2-60.1-60.1L47 512z" fill={mono ? 'currentColor' : '#34A853'} />
    </svg>
  );
}
