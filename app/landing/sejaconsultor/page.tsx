/**
 * /landing/sejaconsultor — aba "Seja consultora" da landing. Desenho aprovado:
 * Ninho-expo/docs/design/consultora/painel.html (visão "Site · seja
 * consultora"). O formulário vira um pedido em /admin/consultor › Pedidos.
 *
 * Número de pessoas: total REAL de contas (profiles sem deleted_at),
 * arredondado PARA BAIXO à centena e guardado por 1 dia. Se o banco falhar, a
 * frase some (número real ou vazio).
 *
 * Voz: sem promessa de saúde nem de resultado; selo sempre "Consultora
 * independente". Repasses de lib/consultoras-regras.ts (não repetir número).
 */
import type { Metadata } from 'next';
import { unstable_cache } from 'next/cache';
import { SITE_URL } from '@/lib/config';
import { PRECOS } from '@/lib/precos';
import { totalDeContas } from '@/lib/consultoras';
import { PCT_DIRETO, PCT_REDE, PARCELAS_MENSAL, valorComissao, somar } from '@/lib/consultoras-regras';
import { formatBRL } from '@/lib/metrics';
import { SitePage } from '@/components/site/SiteChrome';
import { AbasLanding } from '@/components/site/AbasLanding';
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

/** Total de contas, cacheado por 1 dia. Erro sobe para não guardar vazio. */
const contasDoDia = unstable_cache(async () => totalDeContas(), ['site-total-contas-v1'], { revalidate: 86_400 });

async function pessoasArredondado(): Promise<number | null> {
  try {
    const n = await contasDoDia();
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

function TelaWebFamilias() {
  const noite = { background: '#3B2C78', color: '#fff' };
  const acordado = { background: '#FFF2D6', color: '#B7791F' };
  const fams: [string, string, string, string, React.CSSProperties][] = [
    ['T', '#7F5FD6', 'Theo · 7 meses', 'Dormindo · 1h12', noite],
    ['A', '#E8607E', 'Alice · 4 meses', 'Acordada · 40 min', acordado],
    ['B', '#33A99F', 'Bento · 11 meses', 'Dormindo · 25 min', noite],
    ['H', '#4583D6', 'Heitor · 5 meses', 'Acordado · 1h25', acordado],
  ];
  return (
    <div className="nc-web">
      <div className="nc-web-bar"><i /><i /><i /><span>useninho.com.br/admin/consultora</span></div>
      <div className="nc-web-in">
        <div className="nc-web-side">
          <div className="on">Famílias</div><div>Rotina do bebê</div><div>Semana</div><div>Convidar família</div><div>Ganhos</div><div>Meu perfil</div>
        </div>
        <div className="nc-web-main">
          <h4>Suas famílias</h4>
          {fams.map(([l, cor, n, s, st]) => (
            <div key={n} className="nc-mini">
              <span className="av" style={{ background: cor }}>{l}</span>
              <b>{n}</b>
              <small style={st}>{s}</small>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TelaWebRotina() {
  const blocos: [number, number, string][] = [[0, 26, '#3B2C78'], [38, 44, '#9F86E0'], [55, 60, '#9F86E0'], [70, 73, '#9F86E0'], [82, 100, '#3B2C78']];
  return (
    <div className="nc-web">
      <div className="nc-web-bar"><i /><i /><i /><span>useninho.com.br/admin/consultora</span></div>
      <div className="nc-web-in">
        <div className="nc-web-side">
          <div>Famílias</div><div className="on">Rotina do bebê</div><div>Semana</div><div>Convidar família</div><div>Ganhos</div><div>Meu perfil</div>
        </div>
        <div className="nc-web-main">
          <h4>Theo <span style={{ fontSize: 11, color: '#6B6F80', fontWeight: 600 }}>7 meses</span></h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6 }}>
            {[['Acordou', '06:10'], ['Noite', '10h40'], ['1º despertar', '4h15'], ['Sonecas', '3']].map(([k, v]) => (
              <div key={k} className="nc-mini" style={{ display: 'block', marginTop: 0 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: '#9A95AD' }}>{k}</div>
                <div style={{ fontSize: 15, fontWeight: 900 }}>{v}</div>
              </div>
            ))}
          </div>
          <div className="nc-bar24">{blocos.map(([a, b, c]) => <i key={a} style={{ left: `${a}%`, width: `${b - a}%`, background: c }} />)}</div>
          {[['Mamadeira', '180 ml', '15:10'], ['Soneca', '13:20 – 14:30', '1h10'], ['Fralda', 'xixi', '12:50']].map(([t, d, h]) => (
            <div key={t} className="nc-mini"><b>{t}<span style={{ display: 'block', fontWeight: 500, color: '#6B6F80', fontSize: 10 }}>{d}</span></b><span style={{ fontWeight: 800 }}>{h}</span></div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TelaCelular({ titulo, sub, children }: { titulo: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="nc-phone">
      <i className="nc-phone-ilha" />
      <div className="nc-phone-head"><b>{titulo}</b><span>{sub}</span></div>
      <div className="nc-phone-body">{children}</div>
    </div>
  );
}

export default async function SejaConsultoraPage() {
  const pessoas = await pessoasArredondado();
  const pessoasTxt = pessoas ? `Mais de ${pessoas.toLocaleString('pt-BR')} pessoas já usam o Ninho.` : null;
  const ex = valorComissao(PRECOS.premium.mensal, PCT_DIRETO);
  const abertoEm = Date.now();

  return (
    <SitePage>
      <AbasLanding ativa="consultora" />
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
              <TelaWebFamilias />
              <div style={{ position: 'absolute', right: -10, bottom: -50, transform: 'scale(.8)', transformOrigin: 'bottom right' }} className="nc-hide-sm">
                <TelaCelular titulo="Theo" sub="Mãe: Carla · com você desde 12/10">
                  <div className="nc-mod">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)' }}>
                      <div><div className="k">Sono</div><div className="v">13h20</div></div>
                      <div><div className="k">Noite</div><div className="v">10h40</div></div>
                      <div><div className="k">Mamadas</div><div className="v">5</div></div>
                    </div>
                    <div className="nc-bar24"><i style={{ left: 0, width: '26%', background: '#3B2C78' }} /><i style={{ left: '38%', width: '6%', background: '#9F86E0' }} /><i style={{ left: '55%', width: '5%', background: '#9F86E0' }} /></div>
                  </div>
                </TelaCelular>
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
              <p>Em cada família que assinar pelo seu link ou código: {pct(PCT_DIRETO)} por {PARCELAS_MENSAL} meses no mensal, ou 1x no anual. Indicada por outra consultora: {pct(PCT_REDE)} + {pct(PCT_REDE)}.</p>
            </div>
            <div className="nc-big">
              <div className="nc-ico">★</div>
              <div className="num">Top 10</div>
              <b>Divulgação no app</b>
              <p>As 10 consultoras que mais trazem assinantes aparecem na lista do app, com nome e contato.{pessoasTxt ? ` ${pessoasTxt}` : ''}</p>
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
            <div><TelaWebFamilias /><p className="nc-cap"><b>Suas famílias</b> · quem está dormindo agora e quem está sem registro</p></div>
            <div><TelaWebRotina /><p className="nc-cap"><b>Rotina do bebê</b> · hora que acordou, sonecas, janelas, noite e quem registrou</p></div>
          </div>
          <p className="nc-lbl">No celular</p>
          <div className="nc-telas">
            <div>
              <TelaCelular titulo="Boa tarde, Ana" sub="Consultora · 6 famílias">
                <div className="nc-mod">
                  <div style={{ fontWeight: 800, fontSize: 12.5 }}>Suas famílias</div>
                  {[['T', '#7F5FD6', 'Theo'], ['A', '#E8607E', 'Alice'], ['B', '#33A99F', 'Bento']].map(([l, c, n]) => (
                    <div key={n} className="nc-mini" style={{ padding: '6px 0' }}><span className="av" style={{ background: c }}>{l}</span><b>{n}</b></div>
                  ))}
                </div>
              </TelaCelular>
              <p className="nc-cap"><b>Início</b> · suas famílias</p>
            </div>
            <div>
              <TelaCelular titulo="Theo" sub="Mãe: Carla">
                <div className="nc-mod">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)' }}>
                    <div><div className="k">Acordou</div><div className="v">06:10</div></div>
                    <div><div className="k">Sonecas</div><div className="v">3</div></div>
                    <div><div className="k">Dormiu</div><div className="v">19:40</div></div>
                  </div>
                  <div className="nc-bar24"><i style={{ left: 0, width: '26%', background: '#3B2C78' }} /><i style={{ left: '38%', width: '6%', background: '#9F86E0' }} /><i style={{ left: '82%', width: '18%', background: '#3B2C78' }} /></div>
                </div>
              </TelaCelular>
              <p className="nc-cap"><b>Rotina</b> · o dia do bebê</p>
            </div>
            <div>
              <TelaCelular titulo="Ganhos" sub="Comissão das suas famílias">
                <div className="nc-mod">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 4 }}>
                    <div><div className="v">6</div><div className="k">Famílias</div></div>
                    <div><div className="v">4</div><div className="k">Assinantes</div></div>
                    <div><div className="v">1</div><div className="k">Indicadas</div></div>
                  </div>
                  <div className="nc-earn">Comissão do mês · Pix até o 5º dia útil<b>{brl(somar([ex, ex, ex, ex]))}</b></div>
                </div>
              </TelaCelular>
              <p className="nc-cap"><b>Ganhos</b> · comissão e data do Pix</p>
            </div>
          </div>
          <p className="nc-ilustra">Telas ilustrativas, com dados de exemplo.</p>
        </section>

        <section className="n-wrap nc-sec">
          <div className="nc-sec-t"><h2>Como funcionam os repasses</h2><p>Você ganha quando a família paga. Teste grátis não conta.</p></div>
          <div className="nc-g3" style={{ marginTop: 24 }}>
            {[
              ['1', 'A família assina', 'Pelo seu link ou código.'],
              ['2', `Comissão por ${PARCELAS_MENSAL} meses`, `Mensal: ${pct(PCT_DIRETO)} todo mês, por ${PARCELAS_MENSAL} meses. Anual: ${pct(PCT_DIRETO)} uma vez só.`],
              ['3', 'Pix todo mês', 'Até o 5º dia útil do mês seguinte.'],
            ].map(([n, t, d]) => (
              <div key={n} className="nc-passo"><i>{n}</i><div><b>{t}</b><p>{d}</p></div></div>
            ))}
          </div>
          <div className="nc-banner lilas" style={{ maxWidth: 860, margin: '16px auto 0', textAlign: 'center' }}>
            Você ganha comissão pelas famílias que chegam pelo seu link ou código. Famílias que já tinham conta e
            encontraram você pela lista &lsquo;Encontrar consultora&rsquo; dentro do Ninho não geram comissão.
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
                <b>{brl(somar(Array(10 * PARCELAS_MENSAL).fill(ex)))}</b> no total. Reembolso desconta a comissão.
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
              <li>Comissão: {pct(PCT_DIRETO)} (ou {pct(PCT_REDE)} + {pct(PCT_REDE)} quando você foi indicada) por {PARCELAS_MENSAL} meses no plano mensal, ou uma vez no anual. Pagamento por Pix até o 5º dia útil do mês seguinte. Reembolso desconta a comissão.</li>
              <li>Se o Ninho for cobrado por algo que você fez, você ressarce.</li>
            </ul>
            <p style={{ marginTop: 8 }}>O termo completo aparece no app, na primeira vez que você entra como consultora.</p>
          </details>
        </section>
      </div>
    </SitePage>
  );
}
