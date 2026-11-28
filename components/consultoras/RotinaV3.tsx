/**
 * Desenhos da rotina na área da consultora (v3, docs/design/consultora/v3.html):
 * o dia "do acordar ao acordar", a sequência com as janelas em tamanho real e
 * a semana em barras empilhadas, faixas das noites, horários e sonecas × noite.
 * Só mostram o que está nos registros; quem tira conclusão é a consultora.
 *
 * Idioma (25/11/2026): prop opcional `idioma` em cada desenho (padrão pt, o
 * texto de antes). Textos em lib/i18n-consultora/{pt,en,es}/rotina.ts.
 */
import type { DiaV3, SemanaV3, FaixaHorario, LinhaEvolucao } from '@/lib/consultoras-rotina';
import { dur, hora, hhmm, inicioDoDia, minutoDoDia } from '@/lib/consultoras-rotina';
import { textos, type Idioma } from '@/lib/i18n-consultora';

const H = 3600 * 1000;
const COR = {
  soneca: '#9F86E0',
  noite: '#3B2C78',
  bloco1: '#5B48A8',
  acordado: '#E9E3F6',
  maior: '#F6C77E',
  mamada: '#E8607E',
  trilho: '#F4F0FC',
  laranja: '#A8670F',
  verde: '#4CAF74',
};

const tx = (idioma: Idioma) => textos(idioma).rotina;

/** "sex. 6/11" (en: "Fri 11/6"). Sempre UM espaço entre o dia da semana e a data. */
export function diaCurto(dia: string, idioma: Idioma = 'pt'): string {
  const t = tx(idioma);
  const d = new Date(`${dia}T12:00:00Z`);
  return t.diaCurto(t.diasSemana[d.getUTCDay()], d.getUTCDate(), d.getUTCMonth() + 1);
}

/** Rótulos de um eixo de horas cheias ("18h"; en "6 PM"). */
function eixo(horas: number[], idioma: Idioma): string[] {
  return horas.map((h) => tx(idioma).eixo(h));
}

/** "1,5" · "1.5" (uma casa). */
function umaCasa(n: number | null, idioma: Idioma): string {
  return n === null ? '—' : (Math.round(n * 10) / 10).toString().replace('.', tx(idioma).decimal);
}

/** Os textos vêm prontos de quem chama; `idioma` só existe para o contrato (não muda nada). */
export function Legenda({ itens }: { itens: [string, string, boolean?][]; idioma?: Idioma }) {
  return (
    <div className="mt-2 flex flex-wrap gap-3.5 text-[11.5px] font-semibold text-ninho-cinza">
      {itens.map(([cor, txt, redondo]) => (
        <span key={txt}>
          <i className={`mr-1.5 inline-block h-2.5 w-2.5 align-[-1px] ${redondo ? 'rounded-full' : 'rounded-sm'}`} style={{ background: cor, boxShadow: cor === '#fff' ? `0 0 0 2px ${COR.verde}` : undefined }} />
          {txt}
        </span>
      ))}
    </div>
  );
}

// ── O dia num olhar ───────────────────────────────────────
export function DiaStrip({ d, maiorJanela, agora, idioma = 'pt' }: { d: DiaV3; maiorJanela: number | null; agora: number; idioma?: Idioma }) {
  const t = tx(idioma);
  const ini = d.acordou ?? inicioDoDia(d.dia) + 6 * H;
  const fim = d.acordouSeguinte ?? Math.max(ini + 24 * H, Math.min(agora, ini + 26 * H));
  const total = Math.max(fim - ini, H);
  const pos = (t: number) => `${(Math.max(0, Math.min(t - ini, total)) / total) * 100}%`;
  const larg = (a: number, b: number) => `${(Math.max(0, Math.min(b, fim) - Math.max(a, ini)) / total) * 100}%`;
  const marcas: number[] = [];
  const primeiraHora = Math.ceil(ini / (2 * H)) * 2 * H;
  for (let t = primeiraHora; t <= fim; t += 2 * H) marcas.push(t);
  return (
    <>
      <div className="relative mt-3 h-9 overflow-hidden rounded-[10px]" style={{ background: COR.acordado }}>
        {d.janelas.map((j, i) => (
          maiorJanela !== null && Math.round(j.min) >= Math.round(maiorJanela) ? (
            <i key={`j${i}`} className="absolute bottom-0 top-0" style={{ left: pos(j.de), width: larg(j.de, j.ate), background: COR.maior }} />
          ) : null
        ))}
        {d.sonecas.map((s, i) => (
          <i key={`s${i}`} className="absolute bottom-0 top-0 rounded-md" style={{ left: pos(s.a), width: larg(s.a, s.b), background: COR.soneca }} />
        ))}
        {d.noite.trechos.map((s, i) => (
          <i key={`n${i}`} className="absolute bottom-0 top-0 rounded-md" style={{ left: pos(s.a), width: larg(s.a, s.b), background: i === 0 ? COR.bloco1 : COR.noite }} />
        ))}
        {/* Despertar anotado dentro do sono: brecha na barra do dia também. */}
        {d.noite.brechas.map((b, i) => (
          <i key={`nb${i}`} className="absolute bottom-0 top-0 min-w-[3px]" style={{ left: pos(b.a), width: b.b ? larg(b.a, b.b) : '0.8%', background: COR.acordado }} />
        ))}
        {[...d.mamadasDia, ...d.mamadasMadrugada].map((t, i) => (
          <i key={`m${i}`} className="absolute top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white" style={{ left: pos(t), background: COR.mamada }} />
        ))}
      </div>
      <div className="relative mt-1 h-4 text-[10.5px] font-semibold tabular-nums text-[#9A95AD]">
        {marcas.map((m) => (
          <span key={m} className="absolute -translate-x-1/2 whitespace-nowrap" style={{ left: pos(m) }}>{t.eixo(Math.floor(minutoDoDia(m) / 60))}</span>
        ))}
      </div>
      <Legenda itens={[[COR.soneca, t.leg.soneca], [COR.noite, t.leg.noite], [COR.bloco1, t.leg.bloco1], [COR.acordado, t.leg.acordado], [COR.maior, t.leg.maiorJanelaSemana], [COR.mamada, t.leg.mamada, true]]} />
    </>
  );
}

// ── Sequência do dia v2 (dono, 12/11/2026) ────────────────
// docs/design/consultora/sequencia-do-dia-v2.html (Ninho-expo): à esquerda
// "início – fim", uma linha por sono com a duração entre parênteses e, na
// noite picada, os pedaços. Acordado não vira linha: é o espaço pontilhado
// entre um sono e outro (maior quanto mais tempo acordado).
// Novidades da família (00157, dono 15/11/2026): o que a família marcou em
// cada soneca e os despertares da noite. Só chegam quando a família aceitou
// as novidades (lib/consultoras.ts, rotinaDe). As anotações livres dos
// registros NÃO aparecem (decisão do dono, 12/11/2026).
// Rótulos das marcas por idioma: rotina.marca (mesmos textos do app).
const MARCA_ATENCAO = new Set(['demorou_adormecer', 'acordou_no_meio']);
const PROLONGADO_MIN = 30;

type Despertar = { de: number; ate: number | null };

function despertaresDe(detalhe: Record<string, unknown> | undefined): Despertar[] | null {
  const lista = detalhe?.despertares;
  if (!Array.isArray(lista)) return null;
  const out: Despertar[] = [];
  for (const x of lista as { de?: unknown; ate?: unknown }[]) {
    const de = typeof x?.de === 'string' ? new Date(x.de).getTime() : NaN;
    if (Number.isNaN(de)) continue;
    const ate = typeof x?.ate === 'string' ? new Date(x.ate).getTime() : null;
    out.push({ de, ate: ate !== null && !Number.isNaN(ate) ? ate : null });
  }
  return out;
}

function Etiqueta({ txt, atencao }: { txt: string; atencao?: boolean }) {
  return (
    <span className={`rounded-pill px-2 py-0.5 text-[11px] font-bold ${atencao ? 'bg-[#FFF1DE] text-[#A2631A]' : 'bg-[#F4F1FA] text-[#5E4FA8]'}`}>{txt}</span>
  );
}

export function Sequencia({ d, idioma = 'pt' , etiqueta }: { d: DiaV3; etiqueta?: (inicio: number, antesMin: number) => { ok: boolean; texto: string } | null; idioma?: Idioma }) {
  const t = tx(idioma);
  const hr = (ms: number) => hora(ms, idioma);
  const du = (min: number) => dur(min, idioma);
  // "10:30 PM – 11:45 PM" (en) não cabe na coluna de 104px do 24h.
  const colHora = idioma === 'en' ? 'w-[150px]' : 'w-[104px]';
  // Sonos do dia com os extras, pelo início (mesmo instante da linha).
  const sonosReg = d.resumo.registros.filter((r) => r.tipo === 'sleep');
  const porInicio = new Map(sonosReg.map((r) => [new Date(r.inicio).getTime(), r.detalhe]));
  const temNovidades = sonosReg.some((r) => Array.isArray(r.detalhe?.despertares));
  // Comentário da família (aceite v7): o detalhe.nota de cada sono da linha.
  const notasEntre = (de: number, ate: number | null): string[] =>
    sonosReg
      .filter((r) => {
        const a = new Date(r.inicio).getTime();
        return a >= de - 60_000 && (ate === null || a <= ate) && typeof r.detalhe?.nota === 'string' && r.detalhe.nota;
      })
      .map((r) => r.detalhe.nota as string);
  const despertaresEntre = (de: number, ate: number | null): Despertar[] => {
    const out: Despertar[] = [];
    for (const r of sonosReg) {
      const a = new Date(r.inicio).getTime();
      if (a < de - 60_000 || (ate !== null && a > ate)) continue;
      out.push(...(despertaresDe(r.detalhe) ?? []));
    }
    return out.sort((x, y) => x.de - y.de);
  };
  type Pedaco = { a: number; b: number | null; min: number };
  type Linha = { de: number; ate: number | null; cor: string; titulo: string; min: number | null; pedacos: Pedaco[]; antes: number | null; marcas?: string[] | null; desp?: Despertar[] | null; notas?: string[] };
  const pedacosDe = (segs: { a: number; b: number; emAndamento: boolean }[]): Pedaco[] =>
    segs.length > 1 ? segs.map((x) => ({ a: x.a, b: x.emAndamento ? null : x.b, min: (x.b - x.a) / 60000 })) : [];
  const linhas: Linha[] = [];
  const na = d.resumo.noiteAnterior;
  if (na.dormiu !== null) {
    linhas.push({ de: na.dormiu, ate: na.acordou, cor: COR.noite, titulo: t.seq.fimSonoNoturno, min: na.acordou !== null ? na.totalMin : null, pedacos: pedacosDe(na.trechos), antes: null, desp: temNovidades ? despertaresEntre(na.dormiu, na.acordou) : null, notas: notasEntre(na.dormiu, na.acordou) });
  }
  let cursor = d.acordou;
  d.sonecas.forEach((sn, i) => {
    linhas.push({
      de: sn.a,
      ate: sn.emAndamento ? null : sn.b,
      cor: COR.soneca,
      titulo: t.seq.sonecaN(i + 1),
      min: sn.emAndamento ? null : sn.min,
      pedacos: [],
      antes: cursor !== null && sn.a > cursor ? (sn.a - cursor) / 60000 : null,
      marcas: temNovidades ? ((porInicio.get(sn.a)?.marcas as string[] | undefined) ?? []) : null,
      notas: typeof porInicio.get(sn.a)?.nota === 'string' ? [porInicio.get(sn.a)!.nota as string] : [],
    });
    cursor = sn.b;
  });
  const n = d.noite;
  if (n.dormiu !== null) {
    linhas.push({
      de: n.dormiu,
      ate: n.acordou,
      cor: COR.noite,
      titulo: t.seq.sonoNoturno,
      min: n.acordou !== null ? n.totalMin : null,
      pedacos: pedacosDe(n.trechos),
      antes: cursor !== null && n.dormiu > cursor ? (n.dormiu - cursor) / 60000 : null,
      desp: temNovidades ? despertaresEntre(n.dormiu, n.acordou) : null,
      notas: notasEntre(n.dormiu, n.acordou),
    });
  }
  if (!linhas.length) return <p className="py-6 text-center text-sm text-ninho-cinza">{t.seq.semSono}</p>;
  return (
    <div className="mt-2">
      {linhas.map((l, i) => (
        <div key={i}>
          {i > 0 && l.antes !== null && (
            // Janela de sono: quanto tempo ficou acordado entre um sono e o
            // outro (pedido de consultora pelo dono, 13/11/2026; ele escolheu
            // o nome "Janela de sono", que é como as consultoras falam).
            <div className="flex items-center gap-2.5">
              <span className={`${colHora} shrink-0`} />
              <span className="flex w-[18px] justify-center" style={{ height: Math.max(16, Math.min(40, 10 + l.antes / 8)) }}>
                <span className="h-full border-l-2 border-dotted border-[#D9D3EA]" />
              </span>
              <span className="text-[11.5px] font-semibold tabular-nums text-[#9A95AD]">{t.seq.janelaDeSono(du(l.antes))}</span>
              {etiqueta && (() => {
                // Comparação com as sonecas boas da semana (dono, 26/11/2026).
                const e = etiqueta(l.de, l.antes as number);
                return e ? <span className={`ml-1 rounded-full px-2 py-0.5 text-[11px] font-extrabold ${e.ok ? 'bg-[#E7F5EC] text-[#2F8A55]' : 'bg-[#FFF3DF] text-[#A8670F]'}`}>{e.texto}</span> : null;
              })()}
            </div>
          )}
          <div className="flex gap-2.5 py-1 text-[13px]">
            <span className={`${colHora} shrink-0 text-right font-extrabold tabular-nums`}>
              {hr(l.de)} – {l.ate !== null ? hr(l.ate) : <span className="text-ninho-cinza">{t.seq.agora}</span>}
            </span>
            <span className="flex w-[18px] justify-center pt-[3px]">
              <i className="h-3 w-3 rounded-full" style={{ background: l.cor }} />
            </span>
            <span className="flex-1">
              <b className="text-[13.5px]">{l.titulo}</b>{' '}
              <b className="text-[#7C5CD6]">({l.min !== null ? du(l.min) : t.seq.emAndamento})</b>
              {l.pedacos.length > 1 && (
                <span className="mt-0.5 block text-[11.5px] leading-snug text-ninho-cinza">
                  {t.seq.pedacos(l.pedacos.length, l.pedacos.map((x) => `${hr(x.a)}–${x.b !== null ? hr(x.b) : t.seq.agora} (${du(x.min)})`).join(' · '))}
                </span>
              )}
              {l.marcas && l.marcas.length > 0 && (
                <span className="mt-1 flex flex-wrap gap-1">
                  {l.marcas.map((m) => <Etiqueta key={m} txt={t.marca[m] ?? m} atencao={MARCA_ATENCAO.has(m)} />)}
                </span>
              )}
              {l.marcas && l.marcas.length === 0 && l.ate !== null && (
                <span className="mt-0.5 block text-[11.5px] text-ninho-cinza">{t.seq.semResposta}</span>
              )}
              {l.desp && l.desp.length > 0 && (() => {
                const mins = l.desp.map((x) => ((x.ate ?? x.de) - x.de) / 60000);
                const total = mins.reduce((s, m) => s + m, 0);
                const prolongados = mins.filter((m) => m >= PROLONGADO_MIN).length;
                return (
                  <span className="mt-1 block">
                    <span className="block text-[11.5px] text-ninho-cinza">
                      {t.seq.despertares(l.desp.length)} · {t.seq.acordadoTempo(du(total))}{prolongados > 0 ? ` · ${t.seq.prolongados(prolongados)}` : ''}
                    </span>
                    <span className="mt-1 flex flex-wrap gap-1">
                      {l.desp.map((x, j) => (
                        <Etiqueta key={j} txt={`${hr(x.de)} · ${x.ate !== null ? du(mins[j]) : t.seq.acordadoAgora}${mins[j] >= PROLONGADO_MIN ? ` · ${t.seq.prolongado}` : ''}`} atencao={mins[j] >= PROLONGADO_MIN} />
                      ))}
                    </span>
                  </span>
                );
              })()}
              {(l.notas ?? []).map((nota, j) => (
                <span key={`n${j}`} className="mt-1.5 block whitespace-pre-wrap rounded-xl bg-[#F6F2FE] px-2.5 py-1.5 text-[12px] italic leading-snug text-ninho-grafite">
                  <span className="mb-0.5 block text-[10.5px] font-bold not-italic text-[#7C5CD6]">{t.seq.comentario}</span>
                  {nota}
                </span>
              ))}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Evolução do sono: um dia por linha (dono, 12/11/2026) ──
export function EvolucaoSono({ linhas, inicioVinculo, href, idioma = 'pt' }: { linhas: LinhaEvolucao[]; inicioVinculo: string | null; href: (dia: string) => string; idioma?: Idioma }) {
  const t = tx(idioma);
  const comSono = linhas.filter((l) => l.totalMin !== null);
  const med = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
  const bloco = (ls: LinhaEvolucao[]) => ({ sono: med(ls.map((l) => l.totalMin ?? 0)), desp: med(ls.filter((l) => l.despertares !== null).map((l) => l.despertares ?? 0)) });
  const a = bloco(comSono.slice(0, 7));
  const b = bloco(comSono.slice(-7));
  const alto = linhas.length > 20 ? 'h-3' : 'h-5';
  return (
    <div className="mt-2">
      <div className="mb-1 ml-[78px] mr-[72px] flex justify-between text-[10px] font-bold text-[#9A95AD]">
        {eixo([18, 21, 0, 3, 6, 9, 12, 15, 18], idioma).map((h, i) => <span key={i} className="whitespace-nowrap">{h}</span>)}
      </div>
      {linhas.map((l, i) => (
        <div key={l.dia}>
          {inicioVinculo === l.dia && i > 0 && (
            <div className="mb-0.5 mt-2 flex items-center gap-1.5 text-[10.5px] font-extrabold text-[#7C5CD6]">
              {t.evo.comecouComVoce(diaCurto(l.dia, idioma).split(' ')[1])}
              <span className="h-px flex-1 bg-[#EDE4FB]" />
            </div>
          )}
          <a href={href(l.dia)} className="my-[3px] flex items-center gap-2 rounded-md hover:bg-[#FAF8FE]">
            <span className="w-[70px] shrink-0 whitespace-nowrap text-[11px] font-bold tabular-nums text-ninho-cinza">{diaCurto(l.dia, idioma)}</span>
            <span className={`relative flex-1 overflow-hidden rounded-[5px] ${alto}`} style={{ background: COR.trilho }}>
              {l.sonos.map((s, j) => (
                <i key={j} className="absolute bottom-0 top-0 rounded-[3px]" style={{ left: `${s.de * 100}%`, width: `${Math.max(0.4, (s.ate - s.de) * 100)}%`, background: s.tipo === 'noite' ? COR.noite : COR.soneca }} />
              ))}
              {l.mamadas.map((m, j) => (
                <b key={`m${j}`} className="absolute top-1/2 -ml-[2.5px] -mt-[2.5px] h-[5px] w-[5px] rounded-full" style={{ left: `${m * 100}%`, background: COR.mamada }} />
              ))}
            </span>
            <span className="w-16 shrink-0 text-right text-[11px] font-extrabold tabular-nums">
              {l.totalMin !== null ? dur(l.totalMin, idioma) : '—'}
              {l.despertares !== null && <span className="block text-[9.5px] font-bold text-[#9A95AD]">{t.evo.desp(l.despertares)}</span>}
            </span>
          </a>
        </div>
      ))}
      <Legenda itens={[[COR.noite, t.leg.noite], [COR.soneca, t.leg.soneca], [COR.mamada, t.leg.mamada, true], [COR.trilho, t.leg.acordado]]} />
      {comSono.length >= 10 && (
        <div className="mt-3.5 flex gap-2.5">
          {([[t.evo.primeiros, a], [t.evo.ultimos, b]] as const).map(([k, x]) => (
            <div key={k} className="flex-1 rounded-[14px] bg-[#F5F1FB] px-3 py-2.5">
              <div className="text-[11px] font-bold text-ninho-cinza">{k}</div>
              <div className="mt-0.5 text-[15px] font-extrabold">
                {x.sono !== null ? dur(Math.round(x.sono), idioma) : '—'} <span className="text-[11.5px] font-bold text-ninho-cinza">{t.evo.porDia} · {t.evo.desp(umaCasa(x.desp, idioma))}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Semana: barras empilhadas ─────────────────────────────
/** Altura mínima para a hora caber escrita dentro do pedaço da barra. */
const ALTURA_ROTULO = 16;

/**
 * Um pedaço da barra do sono por dia com a duração escrita dentro, em branco
 * (dono, 16/11/2026): antes só havia o total em cima, e não dava para ler
 * quanto foi de soneca e quanto foi de noite. Pedaço baixo fica sem o número.
 */
function Pedaco({ minutos, altura, cor, idioma }: { minutos: number; altura: number; cor: string; idioma: Idioma }) {
  if (minutos <= 0) return null;
  return (
    <div className="flex items-center justify-center overflow-hidden" style={{ height: `${altura}px`, background: cor }}>
      {altura >= ALTURA_ROTULO && (
        <span className="whitespace-nowrap text-[10px] font-extrabold tabular-nums text-white">{dur(minutos, idioma)}</span>
      )}
    </div>
  );
}

export function BarrasSemana({ s, href, idioma = 'pt' }: { s: SemanaV3; href: (dia: string) => string; idioma?: Idioma }) {
  const t = tx(idioma);
  const tot = s.dias.map((d) => d.sonecasMin + (d.noiteCompleta ? d.noite.totalMin ?? 0 : 0));
  const mx = Math.max(...tot, 1);
  return (
    <>
      <div className="mt-5 flex h-[210px] items-end gap-3 px-1">
        {s.dias.map((d, i) => {
          const melhor = s.melhores.includes(d.dia);
          const noite = d.noiteCompleta ? d.noite.totalMin ?? 0 : 0;
          // Altura de cada pedaço em pixel (não mais flex): é ela que diz se a
          // hora cabe escrita dentro do pedaço (dono, 16/11/2026, pedido de
          // uma consultora — antes só havia o total em cima da barra).
          const alt = tot[i] > 0 ? (tot[i] / mx) * 150 : 4;
          const altSon = tot[i] > 0 ? (d.sonecasMin / tot[i]) * alt : 0;
          const altNoite = tot[i] > 0 ? (noite / tot[i]) * alt : 0;
          const [sem, data] = diaCurto(d.dia, idioma).split(' ');
          return (
            <a key={d.dia} href={href(d.dia)} className="flex flex-1 flex-col items-center gap-1 text-[11px] font-bold text-ninho-cinza">
              <span className="text-[11.5px] font-extrabold tabular-nums text-ninho-grafite">{tot[i] > 0 ? dur(tot[i], idioma) : '—'}</span>
              <div
                className="flex w-full max-w-[52px] flex-col overflow-hidden rounded-[10px]"
                style={{ height: `${alt}px`, background: tot[i] > 0 ? undefined : '#EEE', boxShadow: melhor ? `0 0 0 2.5px ${COR.verde}` : undefined }}
              >
                <Pedaco minutos={d.sonecasMin} altura={altSon} cor={COR.soneca} idioma={idioma} />
                <Pedaco minutos={noite} altura={altNoite} cor={COR.noite} idioma={idioma} />
              </div>
              <span>{sem}</span>
              <span className="text-[10.5px] font-semibold text-[#9A95AD]">{data}</span>
              {!melhor && (d.noite.despertares ?? 0) >= 3 && <span className="text-[10px] font-extrabold" style={{ color: COR.laranja }}>{t.evo.desp(d.noite.despertares ?? 0)}</span>}
            </a>
          );
        })}
      </div>
      <Legenda itens={[[COR.soneca, t.leg.sonecas], [COR.noite, t.leg.noite], ['#fff', t.leg.melhores]]} />
    </>
  );
}

// ── Semana: faixas das noites ─────────────────────────────
export function FaixasNoites({ s, idioma = 'pt' }: { s: SemanaV3; idioma?: Idioma }) {
  const t = tx(idioma);
  const comNoite = s.dias.filter((d) => d.dormiu !== null);
  if (!comNoite.length) return <p className="py-6 text-center text-sm text-ninho-cinza">{t.semNoites}</p>;
  return (
    <>
      <div className="mt-3 flex flex-col gap-2">
        {s.dias.map((d) => {
          const a = inicioDoDia(d.dia) + 18 * H;
          const span = 14 * H; // 18:00 → 08:00
          const pos = (t: number) => `${(Math.max(0, Math.min(t - a, span)) / span) * 100}%`;
          const larg = (x: number, y: number) => `${(Math.max(0, Math.min(y, a + span) - Math.max(x, a)) / span) * 100}%`;
          const melhor = s.melhores.includes(d.dia);
          return (
            <div key={d.dia} className="flex items-center gap-2 text-[12px]">
              <span className={`w-[74px] shrink-0 font-bold ${melhor ? 'text-[#2F8A55]' : ''}`}>{diaCurto(d.dia, idioma)}</span>
              <span className={`${idioma === 'en' ? 'w-14' : 'w-10'} shrink-0 whitespace-nowrap tabular-nums text-ninho-cinza`}>{d.dormiu !== null ? hora(d.dormiu, idioma) : ''}</span>
              <div className="relative h-5 flex-1 overflow-hidden rounded-md" style={{ background: d.dormiu !== null ? COR.acordado : COR.trilho }}>
                {/* Trechos = segmentos quebrados nos despertares anotados
                    dentro do sono (dono, 17/11/2026: o despertar tem que
                    abrir brecha, como no app). */}
                {d.noite.trechos.map((sg, i) => (
                  <i key={i} className="absolute bottom-0 top-0 flex items-center justify-center overflow-hidden rounded-[4px] text-[10px] font-bold not-italic text-white" style={{ left: pos(sg.a), width: larg(sg.a, sg.b), background: i === 0 ? COR.bloco1 : COR.noite }}>
                    {i === 0 && sg.b - sg.a >= 110 * 60000 ? dur((sg.b - sg.a) / 60000, idioma) : ''}
                  </i>
                ))}
                {/* A brecha, por cima, com largura mínima para um despertar
                    curto não sumir. */}
                {d.noite.brechas.map((b, i) => (
                  <i key={`b${i}`} className="absolute bottom-0 top-0 min-w-[3px] not-italic" style={{ left: pos(b.a), width: b.b ? larg(b.a, b.b) : '1%', background: COR.acordado }} />
                ))}
                {d.mamadasMadrugada.map((t, i) => (
                  <i key={`m${i}`} className="absolute top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white" style={{ left: pos(t), background: COR.mamada }} />
                ))}
              </div>
              <span className="w-[86px] shrink-0 text-right tabular-nums">
                {d.dormiu === null ? (
                  <span className="text-[#9A95AD]">{t.semRegistro}</span>
                ) : (
                  <>
                    <b style={{ color: (d.noite.despertares ?? 0) >= 3 ? COR.laranja : undefined }}>{t.evo.desp(d.noite.despertares ?? 0)}</b>{' '}
                    {d.noiteCompleta && d.noite.totalMin !== null ? dur(d.noite.totalMin, idioma) : ''}
                  </>
                )}
              </span>
            </div>
          );
        })}
      </div>
      {/* Hora de dormir em 12h (en) ocupa mais: a coluna e o eixo andam juntos. */}
      <div className={`${idioma === 'en' ? 'ml-[140px]' : 'ml-[124px]'} mr-[94px] mt-1 flex justify-between text-[10px] font-semibold text-[#9A95AD]`}>
        {eixo([18, 20, 22, 0, 2, 4, 6, 8], idioma).map((x) => <span key={x} className="whitespace-nowrap">{x}</span>)}
      </div>
      <Legenda itens={[[COR.bloco1, t.leg.bloco1], [COR.noite, t.leg.dormindo], [COR.acordado, t.leg.acordado], [COR.mamada, t.leg.mamada, true]]} />
    </>
  );
}

// ── Semana: horários (ponto = dia, faixa = variação) ──────
export function Horarios({ s, idioma = 'pt' }: { s: SemanaV3; idioma?: Idioma }) {
  const t = tx(idioma);
  if (!s.horarios.length) return <p className="py-6 text-center text-sm text-ninho-cinza">{t.semHorarios}</p>;
  return (
    <div className="mt-3 flex flex-col gap-3">
      {s.horarios.map((f: FaixaHorario) => {
        const lo = (f.min ?? 0) - 40;
        const hi = (f.max ?? 0) + 40;
        const p = (m: number) => `${((m - lo) / Math.max(hi - lo, 1)) * 100}%`;
        return (
          <div key={f.chave} className="text-[12px]">
            <div className="flex justify-between">
              {/* Rótulo pelo idioma do desenho (a semana pode ter sido montada em outro). */}
              <b>{t.faixa[f.chave]}{f.dias < s.dias.length ? <span className="font-semibold text-[#9A95AD]"> · {t.diasDe(f.dias, s.dias.length)}</span> : ''}</b>
              <span className="tabular-nums" style={{ color: f.irregular ? COR.laranja : undefined, fontWeight: f.irregular ? 800 : 600 }}>
                {f.min !== null && f.max !== null ? (f.min === f.max ? hhmm(f.min, idioma) : `${hhmm(f.min, idioma)}–${hhmm(f.max, idioma)} · ${t.varia(dur(f.variacao ?? 0, idioma))}`) : '—'}
              </span>
            </div>
            <div className="relative mt-1 h-4 rounded-full" style={{ background: COR.trilho }}>
              {f.min !== null && f.max !== null && (
                <i className="absolute bottom-1 top-1 rounded-full" style={{ left: p(f.min), width: `calc(${p(f.max)} - ${p(f.min)})`, background: f.irregular ? '#F6C77E' : '#D9CFF5' }} />
              )}
              {f.valores.map((v, i) => (v === null ? null : <i key={i} className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white" style={{ left: p(v), background: COR.noite }} />))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Semana: sonecas × noite seguinte ──────────────────────
export function SonecasNoite({ s, idioma = 'pt' }: { s: SemanaV3; idioma?: Idioma }) {
  const t = tx(idioma);
  const janelas = s.dias.map((d) => d.janelaAntesDeDormir).filter((x): x is number => x !== null);
  const maior = janelas.length ? Math.max(...janelas) : null;
  const th = 'border-b border-[#F0ECF6] px-1.5 py-2 text-left text-[10.5px] font-extrabold uppercase tracking-[0.06em] text-[#9A95AD]';
  const td = 'border-b border-[#F5F2FA] px-1.5 py-2 tabular-nums';
  return (
    <div className="overflow-x-auto">
      <table className="mt-2 w-full text-[12.5px]">
        <thead>
          <tr><th className={th}>{t.tabela.dia}</th><th className={th}>{t.tabela.sonecas}</th><th className={th}>{t.tabela.ultima}</th><th className={th}>{t.tabela.janela}</th><th className={th}>{t.tabela.noite}</th></tr>
        </thead>
        <tbody>
          {s.dias.map((d) => {
            const melhor = s.melhores.includes(d.dia);
            const longa = maior !== null && d.janelaAntesDeDormir !== null && Math.round(d.janelaAntesDeDormir) === Math.round(maior) && janelas.length > 1;
            return (
              <tr key={d.dia} style={{ background: melhor ? '#EEF8F1' : undefined }}>
                <td className={`${td} font-bold`}>{diaCurto(d.dia, idioma)}</td>
                <td className={td}>{d.temRegistro ? `${d.sonecas.length} · ${dur(d.sonecasMin, idioma)}` : '—'}</td>
                <td className={td}>{d.fimUltimaSoneca !== null ? hora(d.fimUltimaSoneca, idioma) : '—'}</td>
                <td className={td} style={{ color: longa ? COR.laranja : undefined, fontWeight: longa ? 800 : undefined }}>{d.janelaAntesDeDormir !== null ? dur(d.janelaAntesDeDormir, idioma) : '—'}</td>
                <td className={td}>{d.noiteCompleta && d.noite.totalMin !== null ? `${dur(d.noite.totalMin, idioma)} · ${t.evo.desp(d.noite.despertares ?? 0)}` : '—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Semana: janela antes de dormir ────────────────────────
export function JanelaAntesDeDormir({ s, idioma = 'pt' }: { s: SemanaV3; idioma?: Idioma }) {
  const vals = s.dias.map((d) => d.janelaAntesDeDormir);
  const mx = Math.max(...vals.filter((x): x is number => x !== null), 1);
  const maior = Math.max(...vals.filter((x): x is number => x !== null), 0);
  return (
    <div className="mt-2 flex flex-col gap-1.5">
      {s.dias.map((d, i) => (
        <div key={d.dia} className="flex items-center gap-2 text-[12px]">
          <span className="w-[74px] shrink-0 font-bold">{diaCurto(d.dia, idioma)}</span>
          <div className="h-3.5 flex-1 overflow-hidden rounded-full" style={{ background: COR.trilho }}>
            {vals[i] !== null && <i className="block h-full rounded-full" style={{ width: `${(vals[i]! / mx) * 100}%`, background: Math.round(vals[i]!) === Math.round(maior) && maior > 0 ? COR.maior : COR.soneca }} />}
          </div>
          <span className="w-12 shrink-0 text-right font-bold tabular-nums">{vals[i] !== null ? dur(vals[i]!, idioma) : '—'}</span>
        </div>
      ))}
    </div>
  );
}

/** Mini-noites para a lista de famílias: 7 barrinhas (lilás calma, laranja ≥3 despertares, cinza sem registro). */
export function MiniNoites({ s, idioma = 'pt' }: { s: SemanaV3; idioma?: Idioma }) {
  const t = tx(idioma);
  return (
    <span className="inline-flex items-end gap-[3px]">
      {s.dias.map((d) => {
        const sem = !d.noiteCompleta;
        const desp = d.noite.despertares ?? 0;
        return (
          <i
            key={d.dia}
            title={`${diaCurto(d.dia, idioma)}: ${sem ? t.semRegistro : t.despertaresMini(desp)}`}
            className="inline-block w-[7px] rounded-[2px]"
            style={{ height: sem ? 8 : 18, background: sem ? '#E4E1EA' : desp >= 3 ? '#F0B456' : COR.soneca }}
          />
        );
      })}
    </span>
  );
}

export { minutoDoDia };
