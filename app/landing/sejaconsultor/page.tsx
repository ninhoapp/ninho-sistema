/**
 * /landing/sejaconsultor — aba "Seja consultora" da landing. Desenho aprovado:
 * Ninho-expo/docs/design/consultora/painel.html (visão "Site · seja
 * consultora"). O formulário vira um pedido em /admin/consultor › Pedidos.
 *
 * Número de pessoas: total REAL de contas (profiles sem deleted_at),
 * arredondado PARA BAIXO à centena (1827 → 1800, nunca 1900) e guardado por
 * 10 minutos, para ficar perto do ao vivo. Se o banco falhar, a frase some
 * (número real ou vazio).
 *
 * Voz: sem promessa de saúde nem de resultado; selo sempre "Consultora
 * independente". Repasses de lib/consultoras-regras.ts (não repetir número).
 */
import type { Metadata } from 'next';
import { unstable_cache } from 'next/cache';
import { SITE_URL } from '@/lib/config';
import { PRECOS } from '@/lib/precos';
import { totalDeContas } from '@/lib/consultoras';
import { PCT_DIRETO, PCT_REDE, PARCELAS_MENSAL, TEXTO_QUEM_GERA_COMISSAO, valorComissao, somar } from '@/lib/consultoras-regras';
import { formatBRL } from '@/lib/metrics';
import { SitePage } from '@/components/site/SiteChrome';
import '@/components/site/consultora.css';
import { FormSejaConsultora } from '@/components/site/FormSejaConsultora';

export const dynamic = 'force-dynamic';

const DESCRICAO =
  'Consultora de sono: acompanhe a rotina dos bebês que você atende no app e no computador e ganhe comissão quando a família assina o Ninho.';

export const metadata: Metadata = {
  title: 'Seja consultora de sono no Ninho',
  description: DESCRICAO,
  alternates: { canonical: `${SITE_URL}/landing/sejaconsultor` },
  openGraph: {
    title: 'Seja consultora de sono no Ninho',
    description: DESCRICAO,
    type: 'website',
    url: `${SITE_URL}/landing/sejaconsultor`,
    siteName: 'Ninho',
    locale: 'pt_BR',
  },
};

/** Total de contas, cacheado por 10 min. Erro sobe para não guardar vazio. */
const contasAoVivo = unstable_cache(async () => totalDeContas(), ['site-total-contas-v2'], { revalidate: 600 });

async function pessoasArredondado(): Promise<number | null> {
  try {
    const n = await contasAoVivo();
    const r = Math.floor(n / 100) * 100;
    return r >= 100 ? r : null;
  } catch (e) {
    console.error('[sejaconsultor] total de contas falhou:', e instanceof Error ? e.message : e);
    return null;
  }
}

const pct = (p: number) => `${String(p).replace('.', ',')}%`;
const brl = (v: number) => formatBRL(v);

const PLANOS_TAB: [string, number, boolean][] = [
  ['Premium mensal', PRECOS.premium.mensal, true],
  ['Básico mensal', PRECOS.basico.mensal, true],
  ['Premium anual', PRECOS.premium.anual, false],
  ['Básico anual', PRECOS.basico.anual, false],
];

// ── Telas ilustrativas no visual v3 (app e painel), com dados de exemplo ──
// Referência: Ninho-expo/docs/design/consultora/v3.html, BarraConsultora.tsx
// e a tela do bebê do app; no web, app/admin/(painel)/consultora e RotinaV3.
// Nenhum dado real: bebês, mães e números são inventados (mas coerentes).

const ICONES: Record<string, React.ReactNode> = {
  lua: <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />,
  relogio: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>,
  dir: <path d="M9 5l7 7-7 7" />,
  esq: <path d="M15 5l-7 7 7 7" />,
  cima: <path d="M5 15l7-7 7 7" />,
  troca: <path d="M4 8h14l-3-3M20 16H6l3 3" />,
  casa: <path d="M4 11l8-7 8 7v9h-5.5v-6h-5v6H4z" />,
  barras: <path d="M5 20v-8M12 20V5M19 20v-5" />,
  pessoaMais: <><circle cx="10" cy="8" r="3.5" /><path d="M3.5 20a6.5 6.5 0 0 1 13 0M19 8v6M16 11h6" /></>,
  dinheiro: <><rect x="3" y="6" width="18" height="12" rx="2.5" /><circle cx="12" cy="12" r="2.5" /></>,
  brilho: <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9zM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" />,
  fone: <><path d="M4 15v-3a8 8 0 0 1 16 0v3" /><rect x="3" y="14" width="4.5" height="6" rx="1.5" /><rect x="16.5" y="14" width="4.5" height="6" rx="1.5" /></>,
  tela: <><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M9 20h6M12 16v4" /></>,
  cadeado: <><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>,
  sino: <path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20.5h4" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  gota: <path d="M12 3.5s6 6.4 6 10.5a6 6 0 0 1-12 0c0-4.1 6-10.5 6-10.5z" />,
  garfo: <path d="M7 3v8a2 2 0 0 0 2 2v8M5 3v6M9 3v6M17 21V3c-2 1-3 4-3 7s1 3 3 3" />,
  balao: <path d="M5 5h14a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-8l-4 3.5V16H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" />,
};

function Ic({ n, s = 18 }: { n: keyof typeof ICONES; s?: number }) {
  return (
    <svg className="nc-ic" width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICONES[n]}
    </svg>
  );
}

const LOGO = '/brand/ninho-logo-limpo.png';
const COR_NOITE = { calma: '#9F86E0', agitada: '#F0B456', vazia: '#E4E1EA' };

type Familia = { n: string; i: string; c: string; m: string; mae: string; noites: (number | null)[]; agora: [string, 'am' | 'grey' | 'night']; linha: string; dormindo?: boolean };
const FAMILIAS: Familia[] = [
  { n: 'Theo', i: 'T', c: '#7F5FD6', m: '7 meses', mae: 'Carla', noites: [2, 4, 1, 2, 1, 3, 5], agora: ['Acordado · 32 min', 'am'], linha: 'Noite 9h10 · 5 despertares' },
  { n: 'Maria Clara', i: 'M', c: '#E58A1F', m: '9 meses', mae: 'Fernanda', noites: [1, 2, 1, 2, 2, 1, null], agora: ['Sem registro', 'grey'], linha: 'Último registro ontem, 21:00' },
  { n: 'Bento', i: 'B', c: '#33A99F', m: '11 meses', mae: 'Patrícia', noites: [1, 0, 1, 1, 2, 1, 1], agora: ['Dormindo · 25 min', 'night'], linha: 'Noite 11h05 · 1 despertar', dormindo: true },
  { n: 'Alice', i: 'A', c: '#E8607E', m: '4 meses', mae: 'Juliana', noites: [3, 2, 2, 1, 2, 2, 2], agora: ['Acordada · 40 min', 'am'], linha: 'Noite 10h20 · 2 despertares' },
];

function Noites({ v }: { v: (number | null)[] }) {
  return (
    <span className="nc-noites">
      {v.map((x, i) => <i key={i} style={{ background: x === null ? COR_NOITE.vazia : x >= 3 ? COR_NOITE.agitada : COR_NOITE.calma }} />)}
    </span>
  );
}

function Av({ f, s }: { f: Familia; s: number }) {
  return (
    <span className="nc-av" style={{ width: s, height: s, background: f.c, fontSize: s * 0.4 }}>
      {f.i}
      {f.dormindo && <span className="nc-live"><Ic n="lua" s={s > 30 ? 9 : 7} /></span>}
    </span>
  );
}

/** Ontem do Theo (sex.), do acordar (06:15) ao acordar de sáb. (06:10), em minutos desde 0h. */
const DIA = {
  acordou: 375,
  sonecas: [[525, 570], [790, 840]] as [number, number][],
  dormiu: 1145,
  despertares: [[1240, 1260], [1350, 1375], [1480, 1505], [1610, 1640], [1710, 1725]] as [number, number][],
  acordouSeguinte: 1810,
  mamadas: [390, 600, 855, 1050, 1125, 1355, 1485, 1615],
};
const hm = (m: number) => { const x = ((m % 1440) + 1440) % 1440; return `${String(Math.floor(x / 60)).padStart(2, '0')}:${String(x % 60).padStart(2, '0')}`; };
const dur = (m: number) => (m < 60 ? `${m} min` : `${Math.floor(m / 60)}h${m % 60 ? String(m % 60).padStart(2, '0') : ''}`);

function DiaFaixa() {
  const A = 360;
  const S = 1440;
  const L = (m: number) => `${(((m - A) / S) * 100).toFixed(2)}%`;
  const W = (a: number, b: number) => `${(((b - a) / S) * 100).toFixed(2)}%`;
  const partes: React.ReactNode[] = [];
  let ant = DIA.acordou;
  DIA.sonecas.forEach(([a, b], i) => {
    partes.push(<i key={`w${i}`} className="w" style={{ left: L(ant), width: W(ant, a) }} />, <i key={`s${i}`} className="s" style={{ left: L(a), width: W(a, b) }} />);
    ant = b;
  });
  partes.push(<i key="wl" className="w lg" style={{ left: L(ant), width: W(ant, DIA.dormiu) }} />);
  let st = DIA.dormiu;
  DIA.despertares.forEach(([a, b], i) => {
    partes.push(<i key={`n${i}`} className={`n${i === 0 ? ' f' : ''}`} style={{ left: L(st), width: W(st, a) }} />);
    st = b;
  });
  const fim = Math.min(DIA.acordouSeguinte, A + S);
  partes.push(<i key="nu" className="n u" style={{ left: L(st), width: W(st, fim) }} />);
  DIA.mamadas.forEach((m) => partes.push(<i key={`m${m}`} className="m" style={{ left: L(m) }} />));
  const acordado = DIA.dormiu - ant;
  return (
    <div className="nc-dia">
      {partes}
      <span className="pin nc-num" style={{ left: L(DIA.acordou), transform: 'none' }}>acordou {hm(DIA.acordou)}</span>
      <span className="pin nc-num" style={{ left: L((ant + DIA.dormiu) / 2), color: '#A8670F' }}>{dur(acordado)} acordado</span>
      <span className="pin nc-num" style={{ left: L((DIA.dormiu + fim) / 2) }}>noite 9h10 · 5 despertares</span>
    </div>
  );
}

function LegendaDia() {
  return (
    <div className="nc-leg">
      <span><i style={{ background: '#9F86E0' }} />Soneca</span>
      <span><i style={{ background: '#3B2C78' }} />Noite</span>
      <span><i style={{ background: '#E9E3F6' }} />Acordado</span>
      <span><i style={{ background: '#F6C77E' }} />Maior janela da semana</span>
      <span><i style={{ background: '#F2709F', borderRadius: '50%' }} />Mamada</span>
    </div>
  );
}

// ── Painel web ──
const MENU_WEB = ['Início', 'Famílias', 'Rotina', 'Semana', 'Relatório IA', 'Convidar família', 'Ganhos'];

function Navegador({ url, ativo, children }: { url: string; ativo: string; children: React.ReactNode }) {
  return (
    <div className="nc-web">
      <div className="nc-web-bar"><i /><i /><i /><span><Ic n="cadeado" s={9} />{url}</span></div>
      <div className="nc-web-in">
        <div className="nc-web-side">
          <div className="brand"><img src={LOGO} alt="" />Ninho · consultora</div>
          {MENU_WEB.map((m) => <div key={m} className={`it${m === ativo ? ' on' : ''}`}>{m}</div>)}
        </div>
        <div className="nc-web-main">{children}</div>
      </div>
    </div>
  );
}

function TelaWebInicio() {
  return (
    <Navegador url="useninho.com.br/admin/consultora" ativo="Início">
      <h4>Boa tarde, Ana</h4>
      <div className="sub">6 famílias compartilham a rotina com você</div>
      <div className="nc-pc">
        <div className="ttl">Olhe primeiro<small>o que mudou desde ontem</small></div>
        <div className="prio">
          <span className="nc-ci night" style={{ width: 24, height: 24 }}><Ic n="lua" s={12} /></span>
          <div><div className="a">Theo · noite agitada</div><div className="b2 nc-num">5 despertares, a mais agitada da semana. 1º bloco de 1h35.</div></div>
        </div>
        <div className="prio gr">
          <span className="nc-ci grey" style={{ width: 24, height: 24 }}><Ic n="relogio" s={12} /></span>
          <div><div className="a">Maria Clara · sem registro</div><div className="b2 nc-num">Nada marcado desde ontem, 21:00.</div></div>
        </div>
      </div>
      <div className="nc-pc">
        <div className="ttl">Suas famílias<small>atenção primeiro</small></div>
        <table className="nc-tbw">
          <thead><tr><th>Bebê</th><th>Últimas 7 noites</th><th>Agora</th></tr></thead>
          <tbody>
            {FAMILIAS.map((f) => (
              <tr key={f.n}>
                <td><div className="who"><Av f={f} s={24} /><div><b>{f.n}</b><small>{f.m} · {f.mae}</small></div></div></td>
                <td><Noites v={f.noites} /></td>
                <td><span className={`nc-bd ${f.agora[1]} nc-num`}>{f.agora[0]}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Navegador>
  );
}

function TelaWebRotina() {
  const seq: [string, string, string, string, number?, boolean?][] = [
    [hm(375), '#F2B35A', 'Acordou', ''],
    ['', '#E9E3F6', 'Acordado', '2h30', 150],
    [hm(525), '#9F86E0', '1ª soneca', '45 min'],
    ['', '#E9E3F6', 'Acordado', '3h40', 220],
    [hm(790), '#9F86E0', '2ª soneca', '50 min'],
    ['', '#F6C77E', 'Acordado', '5h05', 305, true],
    [hm(1145), '#3B2C78', 'Dormiu', ''],
    ['', '#5B48A8', '1º bloco', '1h35'],
    ['', '#F0B456', '5 despertares', ''],
    [hm(1810), '#F2B35A', 'Acordou (sáb.)', '9h10'],
  ];
  const reg: [string, React.ComponentProps<typeof Ic>['n'], string, string][] = [
    ['bottle', 'gota', 'Mamadeira', '18:45 · 180 ml · Rafael'],
    ['food', 'garfo', 'Comida', '17:30 · papinha de legumes · Carla'],
    ['lil', 'balao', 'Nota: "Não quis dormir à tarde"', '16:30 · Carla'],
    ['bottle', 'gota', 'Mamadeira', '14:15 · 150 ml · Carla'],
    ['sleep', 'lua', 'Soneca', '13:10 – 14:00 · 50 min · Carla'],
  ];
  return (
    <Navegador url="useninho.com.br/admin/consultora?aba=rotina" ativo="Rotina">
      <h4>Theo <small>7 meses</small></h4>
      <div className="sub">Mãe: Carla · com você desde 12/10 · ontem, sex. 6 de nov.</div>
      <div className="nc-kps nc-num">
        <div className="nc-kp big"><div className="k">Sono nas 24h</div><div className="v">10h45</div><div className="s">média 12h27</div></div>
        <div className="nc-kp"><div className="k">Noite</div><div className="v">9h10</div><div className="s" style={{ color: '#A8670F', fontWeight: 800 }}>5 despertares</div></div>
        <div className="nc-kp"><div className="k">Sonecas</div><div className="v">2 · 1h35</div><div className="s">de costume 3</div></div>
        <div className="nc-kp"><div className="k">Acordou · dormiu</div><div className="v">06:15 · 19:05</div><div className="s">de costume 06:15 · 19:25</div></div>
      </div>
      <div className="nc-pc">
        <div className="ttl">Do acordar ao acordar<small>sex. 6, 06:15 → sáb. 7, 06:10</small></div>
        <DiaFaixa />
        <div className="nc-ax nc-num">{['6h', '9h', '12h', '15h', '18h', '21h', '0h', '3h', '6h'].map((h, i) => <span key={i}>{h}</span>)}</div>
        <LegendaDia />
      </div>
      <div className="nc-g2w">
        <div className="nc-pc">
          <div className="ttl">Sequência do dia<small>janelas em tamanho real</small></div>
          <div className="nc-seq" style={{ marginTop: 4 }}>
            {seq.map(([h, cor, l, du, jan, longa], i) => (
              <div key={i} className="r">
                <span className="h nc-num">{h}</span>
                <span className="d" style={{ background: cor }} />
                <span className={`l${jan ? ' w' : ''}`}>{l}{jan ? <span className={`bar${longa ? ' lg' : ''}`} style={{ display: 'block', width: `${Math.min(100, (jan / 360) * 100)}%` }} /> : null}</span>
                <span className="du nc-num" style={longa ? { color: '#A8670F' } : undefined}>{du}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="nc-pc">
          <div className="ttl">Registros<small>Carla e Rafael</small></div>
          {reg.map(([cls, ic, a, b], i) => (
            <div key={i} className="nc-li">
              <span className={`nc-ci ${cls}`} style={{ width: 22, height: 22 }}><Ic n={ic} s={11} /></span>
              <div style={{ minWidth: 0 }}><div className="a">{a}</div><div className="b2 nc-num">{b}</div></div>
            </div>
          ))}
        </div>
      </div>
    </Navegador>
  );
}

// ── Celular ──
const BARRA: [string, React.ComponentProps<typeof Ic>['n'], boolean?][] = [
  ['Semana', 'barras'],
  ['Convidar', 'pessoaMais'],
  ['Início', 'casa', true],
  ['Ganhos', 'dinheiro'],
  ['IA', 'brilho'],
];

function Celular({ t1, t2, barraAberta, escala, children }: { t1: string; t2: string; barraAberta?: boolean; escala?: number; children: React.ReactNode }) {
  const ajuda = <div className="side help"><Ic n="fone" s={20} /><span>Ajuda</span></div>;
  const painel = <div className="side web"><Ic n="tela" s={21} /><span className="lk"><Ic n="cadeado" s={9} /></span><span>Painel</span></div>;
  return (
    <div className="nc-cel" style={escala ? ({ '--s': escala } as React.CSSProperties) : undefined} aria-hidden="true">
      <div className="nc-ph">
        <div className="ilha" /><span className="hora">14:02</span><span className="bat" />
        <div className="head">
          <svg className="onda" viewBox="0 0 390 56" preserveAspectRatio="none"><path d="M0 26 C 100 60, 200 0, 290 26 S 370 40, 390 30 L390 56 L0 56Z" fill="#F5F2FC" /></svg>
          <div className="hbar">
            <div className="logo"><img src={LOGO} alt="" /></div>
            <div className="tt"><div className="t1">{t1}</div><div className="t2">{t2}</div></div>
            <div className="act"><Ic n="sino" s={20} /></div>
            <div className="act"><Ic n="menu" s={20} /></div>
          </div>
        </div>
        <div className="content">{children}</div>
        <div className="fade" />
        {barraAberta ? (
          <>
            <div className="menu">
              {BARRA.map(([l, ic, centro]) => (
                <div key={l} className={`mb${centro ? ' ce on' : ''}`}><div className="c"><Ic n={ic} s={centro ? 22 : 18} /></div>{l}</div>
              ))}
            </div>
            <div className="row2" style={{ bottom: 142 }}>{ajuda}<div className="seta" style={{ transform: 'rotate(180deg)' }}><Ic n="cima" s={20} /></div>{painel}</div>
          </>
        ) : (
          <>
            <div className="strip" />
            <div className="row2">{ajuda}<div className="seta"><Ic n="cima" s={20} /></div>{painel}</div>
          </>
        )}
        <div className="homebar" />
      </div>
    </div>
  );
}

function CelInicio() {
  return (
    <Celular t1="Boa tarde, Ana" t2="Consultora · 6 famílias" barraAberta>
      <div className="mod">
        <div className="mt"><div><div className="t">Olhe primeiro</div><div className="s">O que mudou desde ontem</div></div></div>
        <div className="prio">
          <span className="nc-ci night" style={{ width: 36, height: 36 }}><Ic n="lua" s={17} /></span>
          <div style={{ flex: 1, minWidth: 0 }}><div className="a">Theo · noite agitada</div><div className="b2 nc-num">5 despertares, a mais agitada da semana. 1º bloco de 1h35.</div></div>
          <span style={{ color: '#BDB8CC' }}><Ic n="dir" s={16} /></span>
        </div>
        <div className="prio gr">
          <span className="nc-ci grey" style={{ width: 36, height: 36 }}><Ic n="relogio" s={17} /></span>
          <div style={{ flex: 1, minWidth: 0 }}><div className="a">Maria Clara · sem registro</div><div className="b2 nc-num">Nada marcado desde ontem, 21:00.</div></div>
          <span style={{ color: '#BDB8CC' }}><Ic n="dir" s={16} /></span>
        </div>
      </div>
      <div className="mod">
        <div className="mt"><div className="t">Suas famílias</div><span className="link">Ver todas</span></div>
        <div style={{ marginTop: 4 }}>
          {FAMILIAS.map((f) => (
            <div key={f.n} className="fam">
              <Av f={f} s={40} />
              <div className="tx"><div className="a">{f.n} <small>{f.m}</small></div><div className="b2 nc-num">{f.linha}</div></div>
              <div className="dir"><Noites v={f.noites} /><span className={`nc-bd ${f.agora[1]} nc-num`}>{f.agora[0]}</span></div>
            </div>
          ))}
        </div>
      </div>
    </Celular>
  );
}

function CelBebe({ escala }: { escala?: number }) {
  return (
    <Celular t1="Theo · 7 meses" t2="Mãe: Carla · com você desde 12/10" escala={escala}>
      <div className="mod">
        <div className="back"><span className="b"><Ic n="esq" s={17} /></span>Início<span className="r">Trocar <Ic n="troca" s={15} /></span></div>
        <div className="abas"><span>Ficha</span><span className="on">Rotina</span><span>Semana</span><span>Relatório</span></div>
      </div>
      <div className="mod">
        <div className="data"><span className="ar"><Ic n="esq" s={15} /></span><b>Ontem, sex. 6 de nov.</b><span className="ar"><Ic n="dir" s={15} /></span></div>
        <div className="hero"><div><div className="k">Sono nas 24h</div><div className="v nc-num">10h45</div><div className="s nc-num">1h35 de sonecas + 9h10 de noite</div></div><span className="nc-delta nc-num">média 12h27</span></div>
        <DiaFaixa />
        <div className="nc-ax nc-num">{['6h', '9h', '12h', '15h', '18h', '21h', '0h', '3h', '6h'].map((h, i) => <span key={i}>{h}</span>)}</div>
      </div>
      <div className="mod">
        <div className="minis nc-num">
          <div><div className="k">Acordou</div><div className="v">06:15</div><div className="s">de costume 06:15–06:50</div></div>
          <div><div className="k">Sonecas</div><div className="v">2</div><div className="s">de costume 3</div></div>
          <div><div className="k">Dormiu</div><div className="v">19:05</div><div className="s">de costume 19:25–19:45</div></div>
        </div>
        <div className="minis nc-num">
          <div><div className="k">Noite</div><div className="v">9h10</div><div className="s">média 9h54</div></div>
          <div><div className="k">Despertares</div><div className="v" style={{ color: '#A8670F' }}>5</div><div className="s">média 2,6</div></div>
          <div><div className="k">1º bloco</div><div className="v">1h35</div><div className="s">média 3h59</div></div>
        </div>
      </div>
    </Celular>
  );
}

function CelGanhos({ comissao }: { comissao: string }) {
  const etapas: [string, number, string, string][] = [
    ['Cliques', 214, '#9F86E0', 'desde 12/10'],
    ['Downloads', 61, '#9F86E0', '29% da anterior'],
    ['Cadastros', 12, '#9F86E0', '20% da anterior'],
    ['Assinantes', 5, '#4CAF74', '42% da anterior'],
    ['Cancelamentos', 1, '#C9C5D3', '4 ativos'],
  ];
  return (
    <Celular t1="Ganhos" t2="Comissão das suas famílias">
      <div className="mod">
        <div className="kpis nc-num">
          <div><b>6</b><span>Famílias</span></div>
          <div><b>4</b><span>Assinantes</span></div>
          <div><b>1</b><span>Indicadas</span></div>
        </div>
        <div className="ganho">
          <div><small>Comissão de novembro · Pix até 07/12</small><b className="nc-num">{comissao}</b></div>
          <span className="nc-ci ok" style={{ width: 40, height: 40 }}><Ic n="dinheiro" s={19} /></span>
        </div>
      </div>
      <div className="mod">
        <div className="mt"><div><div className="t">Seu link em novembro</div><div className="s">useninho.com.br/c/ana</div></div></div>
        <div style={{ marginTop: 10 }}>
          {etapas.map(([k, v, cor, sub]) => (
            <div key={k} className="funil">
              <span className="k">{k}</span>
              <span className="tr"><i style={{ width: `${Math.max(4, Math.sqrt(v / 214) * 100).toFixed(1)}%`, background: cor }} /></span>
              <span className="v nc-num">{v}<small>{sub}</small></span>
            </div>
          ))}
        </div>
      </div>
    </Celular>
  );
}

export default async function SejaConsultoraPage() {
  const pessoas = await pessoasArredondado();
  const pessoasTxt = pessoas ? `Mais de ${pessoas.toLocaleString('pt-BR')} pessoas já usam o Ninho.` : null;
  const ex = valorComissao(PRECOS.premium.mensal, PCT_DIRETO);
  const abertoEm = Date.now();

  return (
    <SitePage>
      <div className="nc">
        <section className="nc-hero">
          <div className="n-wrap nc-hero-grid">
            <div>
              <span className="nc-selo">Ninho para consultoras de sono</span>
              <h1>Acompanhe seus bebês.<br />Ganhe com cada família que assinar.</h1>
              <p className="sub">A família registra a rotina no Ninho. Você acompanha tudo, no app e no computador.</p>
              {pessoasTxt && <p className="sub" style={{ fontWeight: 800, color: '#24164F', marginTop: 10 }}>{pessoasTxt}</p>}
              <div className="nc-ctas">
                <a href="#form-consultora" className="nc-btn nc-btn-grad">Quero ser consultora</a>
                <a href="#plataforma" className="nc-btn nc-btn-soft">Ver a plataforma</a>
              </div>
            </div>
            <div style={{ position: 'relative' }}>
              <TelaWebInicio />
              <div className="nc-hero-cel nc-hide-sm">
                <CelBebe escala={0.42} />
              </div>
            </div>
          </div>
        </section>

        <section className="n-wrap" style={{ marginTop: 34 }}>
          <div className="nc-g3">
            <div className="nc-big">
              <div className="nc-ico">◐</div>
              <div className="num">App + web</div>
              <b>Acompanhe seus bebês</b>
              <p>A rotina de todos os bebês que você atende num lugar só: sono, mamadas, fraldas e comida, registrados pela família. Só leitura.</p>
            </div>
            <div className="nc-big">
              <div className="nc-ico">R$</div>
              <div className="num">{pct(PCT_DIRETO)}</div>
              <b>De comissão por {PARCELAS_MENSAL} meses</b>
              <p>Em cada família que criar a conta pelo seu link ou código e assinar: {pct(PCT_DIRETO)} por {PARCELAS_MENSAL} meses no mensal, ou 1x no anual. Indicada por outra consultora: {pct(PCT_REDE)} + {pct(PCT_REDE)}.</p>
            </div>
            <div className="nc-big">
              <div className="nc-ico">★</div>
              <div className="num">Top 10</div>
              <b>Divulgação no app</b>
              <p>O Ninho escolhe até 10 consultoras para a lista do app, com nome e contato. Quem mais traz assinantes aparece primeiro.{pessoasTxt ? ` ${pessoasTxt}` : ''}</p>
            </div>
          </div>
          <div className="nc-tags">
            <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.09em', color: '#9A95AD', alignSelf: 'center' }}>E PARA O NINHO</span>
            <span className="nc-tag">Famílias que entendem o valor do app</span>
            <span className="nc-tag">Você só ganha quando a família assina</span>
          </div>
        </section>

        <section className="n-wrap nc-sec" id="plataforma">
          <div className="nc-sec-t"><h2>Veja a plataforma</h2><p>As telas da área da consultora, com a rotina que as famílias registram.</p></div>
          <p className="nc-lbl">No computador</p>
          <div className="nc-telas">
            <div><TelaWebInicio /><p className="nc-cap"><b>Suas famílias</b> · quem está dormindo agora e quem está sem registro</p></div>
            <div><TelaWebRotina /><p className="nc-cap"><b>Rotina do bebê</b> · hora que acordou, sonecas, janelas, noite e quem registrou</p></div>
          </div>
          <p className="nc-lbl">No celular</p>
          <div className="nc-telas">
            <div>
              <CelInicio />
              <p className="nc-cap"><b>Início</b> · suas famílias</p>
            </div>
            <div>
              <CelBebe />
              <p className="nc-cap"><b>Rotina</b> · o dia do bebê</p>
            </div>
            <div>
              <CelGanhos comissao={brl(somar([ex, ex, ex, ex]))} />
              <p className="nc-cap"><b>Ganhos</b> · comissão e data do Pix</p>
            </div>
          </div>
          <p className="nc-ilustra">Telas ilustrativas, com dados de exemplo.</p>
        </section>

        <section className="n-wrap nc-sec">
          <div className="nc-sec-t"><h2>Como funcionam os repasses</h2><p>Você ganha quando a família paga. Teste grátis não conta.</p></div>
          <div className="nc-g3" style={{ marginTop: 24 }}>
            {[
              ['1', 'A família cria a conta e assina', 'Pelo seu link ou código.'],
              ['2', `Comissão por ${PARCELAS_MENSAL} meses`, `Mensal: ${pct(PCT_DIRETO)} todo mês, por ${PARCELAS_MENSAL} meses. Anual: ${pct(PCT_DIRETO)} uma vez só.`],
              ['3', 'Pix todo mês', 'Até o 5º dia útil do mês seguinte.'],
            ].map(([n, t, d]) => (
              <div key={n} className="nc-passo"><i>{n}</i><div><b>{t}</b><p>{d}</p></div></div>
            ))}
          </div>
          <div className="nc-banner lilas" style={{ maxWidth: 860, margin: '16px auto 0', textAlign: 'center' }}>
            {TEXTO_QUEM_GERA_COMISSAO}
          </div>
          <div className="nc-g2" style={{ marginTop: 16 }}>
            <div className="nc-card">
              <h3>Quem ganha o quê</h3>
              <div className="nc-arv">
                <div className="nc-no raiz"><b>Ana</b><small>veio direto ao Ninho</small><span className="nc-badge v">{pct(PCT_DIRETO)} das famílias dela</span></div>
                <div className="nc-linha" />
                <div className="nc-no"><b>Bia</b><small>indicada pela Ana</small><span className="nc-badge v">Bia {pct(PCT_REDE)}</span><span className="nc-badge l">Ana {pct(PCT_REDE)}</span></div>
                <div className="nc-linha" />
                <div className="nc-no"><b>Carol</b><small>indicada pela Bia</small><span className="nc-badge v">Carol {pct(PCT_REDE)}</span><span className="nc-badge l">Bia {pct(PCT_REDE)}</span><small style={{ marginTop: 4 }}>a Ana não ganha aqui: só 1 nível</small></div>
              </div>
            </div>
            <div className="nc-card">
              <h3>Quanto você recebe por família <span style={{ fontSize: 12, color: '#9A95AD', fontWeight: 600 }}>· sobre o preço cheio</span></h3>
              <table className="nc-tb">
                <thead><tr><th>Plano da família</th><th className="r">{pct(PCT_DIRETO)}</th><th className="r">{pct(PCT_REDE)}</th></tr></thead>
                <tbody>
                  {PLANOS_TAB.map(([nome, preco, mensal]) => (
                    <tr key={nome}>
                      <td><b>{nome}</b> {brl(preco)}</td>
                      <td className="r">{brl(valorComissao(preco, PCT_DIRETO))}{mensal ? `/mês · ${PARCELAS_MENSAL}x` : ' · 1x'}</td>
                      <td className="r">{brl(valorComissao(preco, PCT_REDE))}{mensal ? `/mês · ${PARCELAS_MENSAL}x` : ' · 1x'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="nc-banner verde">
                Exemplo: <b>10 famílias no Premium mensal</b> dão <b>{brl(somar(Array(10).fill(ex)))} por mês</b> durante {PARCELAS_MENSAL} meses, ou{' '}
                <b>{brl(somar(Array(10 * PARCELAS_MENSAL).fill(ex)))}</b> no total. Se a família cancelar ou pedir reembolso, a comissão dela para.
              </div>
            </div>
          </div>
        </section>

        <section className="n-wrap nc-sec" id="form-consultora" style={{ paddingBottom: 72 }}>
          <div className="nc-sec-t"><h2>Quero ser consultora no Ninho</h2><p>O Ninho confere cada pedido. Também dá para falar com a gente no Instagram @useninho.app.</p></div>
          <FormSejaConsultora abertoEm={abertoEm} />
          <details className="nc-termo" id="termo-consultora" style={{ maxWidth: 640, margin: '16px auto 0' }}>
            <summary>Termo da Consultora (resumo)</summary>
            <ul>
              <li>Você é independente e responde sozinha pelas orientações que dá às famílias. Nunca indique remédio, dose ou posição de sono, nem prometa resultado. Saúde é com o pediatra.</li>
              <li>Use a rotina dos bebês só para atender aquela família. Não copie, não guarde e não divulgue esses dados.</li>
              <li>Ao divulgar seu link, avise que tem parceria com o Ninho (&ldquo;#publi&rdquo;).</li>
              <li>Comissão: {pct(PCT_DIRETO)} (ou {pct(PCT_REDE)} + {pct(PCT_REDE)} quando você foi indicada) por {PARCELAS_MENSAL} meses no plano mensal, ou uma vez no anual. Pagamento por Pix até o 5º dia útil do mês seguinte. Vale só para famílias que criaram a conta pelo seu link ou código (o vínculo sozinho não gera, e quem achou você pela lista do app também não) e acaba quando a família cancela ou pede reembolso.</li>
              <li>Se o Ninho for cobrado por algo que você fez, você ressarce.</li>
            </ul>
            <p style={{ marginTop: 8 }}>O termo completo aparece no app, na primeira vez que você entra como consultora.</p>
          </details>
        </section>
      </div>
    </SitePage>
  );
}
