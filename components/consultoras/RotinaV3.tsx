/**
 * Desenhos da rotina na área da consultora (v3, docs/design/consultora/v3.html):
 * o dia "do acordar ao acordar", a sequência com as janelas em tamanho real e
 * a semana em barras empilhadas, faixas das noites, horários e sonecas × noite.
 * Só mostram o que está nos registros; quem tira conclusão é a consultora.
 */
import type { DiaV3, SemanaV3, FaixaHorario } from '@/lib/consultoras-rotina';
import { dur, hora, hhmm, inicioDoDia, minutoDoDia } from '@/lib/consultoras-rotina';

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

const DIAS_SEMANA = ['dom.', 'seg.', 'ter.', 'qua.', 'qui.', 'sex.', 'sáb.'];

/** "sex. 6/11" */
export function diaCurto(dia: string): string {
  const d = new Date(`${dia}T12:00:00Z`);
  return `${DIAS_SEMANA[d.getUTCDay()]} ${d.getUTCDate()}/${d.getUTCMonth() + 1}`;
}

export function Legenda({ itens }: { itens: [string, string, boolean?][] }) {
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
export function DiaStrip({ d, maiorJanela, agora }: { d: DiaV3; maiorJanela: number | null; agora: number }) {
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
        {d.noite.segmentos.map((s, i) => (
          <i key={`n${i}`} className="absolute bottom-0 top-0 rounded-md" style={{ left: pos(s.a), width: larg(s.a, s.b), background: i === 0 ? COR.bloco1 : COR.noite }} />
        ))}
        {[...d.mamadasDia, ...d.mamadasMadrugada].map((t, i) => (
          <i key={`m${i}`} className="absolute top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white" style={{ left: pos(t), background: COR.mamada }} />
        ))}
      </div>
      <div className="relative mt-1 h-4 text-[10.5px] font-semibold tabular-nums text-[#9A95AD]">
        {marcas.map((t) => (
          <span key={t} className="absolute -translate-x-1/2" style={{ left: pos(t) }}>{hora(t).slice(0, 2).replace(/^0/, '')}h</span>
        ))}
      </div>
      <Legenda itens={[[COR.soneca, 'Soneca'], [COR.noite, 'Noite'], [COR.bloco1, '1º bloco'], [COR.acordado, 'Acordado'], [COR.maior, 'Maior janela da semana'], [COR.mamada, 'Mamada', true]]} />
    </>
  );
}

// ── Sequência do dia v2 (dono, 12/11/2026) ────────────────
// docs/design/consultora/sequencia-do-dia-v2.html (Ninho-expo): à esquerda
// "início – fim", uma linha por sono com a duração entre parênteses e, na
// noite picada, os pedaços. Acordado não vira linha: é o espaço pontilhado
// entre um sono e outro (maior quanto mais tempo acordado).
export function Sequencia({ d }: { d: DiaV3 }) {
  type Pedaco = { a: number; b: number | null; min: number };
  type Linha = { de: number; ate: number | null; cor: string; titulo: string; min: number | null; pedacos: Pedaco[]; antes: number | null };
  const pedacosDe = (segs: { a: number; b: number; emAndamento: boolean }[]): Pedaco[] =>
    segs.length > 1 ? segs.map((x) => ({ a: x.a, b: x.emAndamento ? null : x.b, min: (x.b - x.a) / 60000 })) : [];
  const linhas: Linha[] = [];
  const na = d.resumo.noiteAnterior;
  if (na.dormiu !== null) {
    linhas.push({ de: na.dormiu, ate: na.acordou, cor: COR.noite, titulo: 'Fim do sono noturno', min: na.acordou !== null ? na.totalMin : null, pedacos: pedacosDe(na.segmentos), antes: null });
  }
  let cursor = d.acordou;
  d.sonecas.forEach((sn, i) => {
    linhas.push({
      de: sn.a,
      ate: sn.emAndamento ? null : sn.b,
      cor: COR.soneca,
      titulo: `${i + 1}ª soneca`,
      min: sn.emAndamento ? null : sn.min,
      pedacos: [],
      antes: cursor !== null && sn.a > cursor ? (sn.a - cursor) / 60000 : null,
    });
    cursor = sn.b;
  });
  const n = d.noite;
  if (n.dormiu !== null) {
    linhas.push({
      de: n.dormiu,
      ate: n.acordou,
      cor: COR.noite,
      titulo: 'Sono noturno',
      min: n.acordou !== null ? n.totalMin : null,
      pedacos: pedacosDe(n.segmentos),
      antes: cursor !== null && n.dormiu > cursor ? (n.dormiu - cursor) / 60000 : null,
    });
  }
  if (!linhas.length) return <p className="py-6 text-center text-sm text-ninho-cinza">Sem registros de sono neste dia.</p>;
  return (
    <div className="mt-2">
      {linhas.map((l, i) => (
        <div key={i}>
          {i > 0 && l.antes !== null && (
            <div className="flex gap-2.5">
              <span className="w-[104px] shrink-0" />
              <span className="flex w-[18px] justify-center" style={{ height: Math.max(12, Math.min(40, 10 + l.antes / 8)) }}>
                <span className="h-full border-l-2 border-dotted border-[#D9D3EA]" />
              </span>
            </div>
          )}
          <div className="flex gap-2.5 py-1 text-[13px]">
            <span className="w-[104px] shrink-0 text-right font-extrabold tabular-nums">
              {hora(l.de)} – {l.ate !== null ? hora(l.ate) : <span className="text-ninho-cinza">agora</span>}
            </span>
            <span className="flex w-[18px] justify-center pt-[3px]">
              <i className="h-3 w-3 rounded-full" style={{ background: l.cor }} />
            </span>
            <span className="flex-1">
              <b className="text-[13.5px]">{l.titulo}</b>{' '}
              <b className="text-[#7C5CD6]">({l.min !== null ? dur(l.min) : 'em andamento'})</b>
              {l.pedacos.length > 1 && (
                <span className="mt-0.5 block text-[11.5px] leading-snug text-ninho-cinza">
                  {l.pedacos.length} pedaços: {l.pedacos.map((x) => `${hora(x.a)}–${x.b !== null ? hora(x.b) : 'agora'} (${dur(x.min)})`).join(' · ')}
                </span>
              )}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Semana: barras empilhadas ─────────────────────────────
export function BarrasSemana({ s, href }: { s: SemanaV3; href: (dia: string) => string }) {
  const tot = s.dias.map((d) => d.sonecasMin + (d.noiteCompleta ? d.noite.totalMin ?? 0 : 0));
  const mx = Math.max(...tot, 1);
  return (
    <>
      <div className="mt-5 flex h-[210px] items-end gap-3 px-1">
        {s.dias.map((d, i) => {
          const melhor = s.melhores.includes(d.dia);
          const noite = d.noiteCompleta ? d.noite.totalMin ?? 0 : 0;
          return (
            <a key={d.dia} href={href(d.dia)} className="flex flex-1 flex-col items-center gap-1 text-[11px] font-bold text-ninho-cinza">
              <span className="text-[11.5px] font-extrabold tabular-nums text-ninho-grafite">{tot[i] > 0 ? dur(tot[i]) : '—'}</span>
              <div
                className="flex w-full max-w-[52px] flex-col overflow-hidden rounded-[10px]"
                style={{ height: tot[i] > 0 ? `${(tot[i] / mx) * 150}px` : 4, background: tot[i] > 0 ? undefined : '#EEE', boxShadow: melhor ? `0 0 0 2.5px ${COR.verde}` : undefined }}
              >
                {d.sonecasMin > 0 && <div style={{ flex: d.sonecasMin, background: COR.soneca }} />}
                {noite > 0 && <div style={{ flex: noite, background: COR.noite }} />}
              </div>
              <span>{diaCurto(d.dia).split(' ')[0]}</span>
              <span className="text-[10.5px] font-semibold text-[#9A95AD]">{diaCurto(d.dia).split(' ')[1]}</span>
              {!melhor && (d.noite.despertares ?? 0) >= 3 && <span className="text-[10px] font-extrabold" style={{ color: COR.laranja }}>{d.noite.despertares} desp.</span>}
            </a>
          );
        })}
      </div>
      <Legenda itens={[[COR.soneca, 'Sonecas'], [COR.noite, 'Noite'], ['#fff', '2 melhores noites']]} />
    </>
  );
}

// ── Semana: faixas das noites ─────────────────────────────
export function FaixasNoites({ s }: { s: SemanaV3 }) {
  const comNoite = s.dias.filter((d) => d.dormiu !== null);
  if (!comNoite.length) return <p className="py-6 text-center text-sm text-ninho-cinza">Sem noites registradas nesta semana.</p>;
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
              <span className={`w-[74px] shrink-0 font-bold ${melhor ? 'text-[#2F8A55]' : ''}`}>{diaCurto(d.dia)}</span>
              <span className="w-10 shrink-0 tabular-nums text-ninho-cinza">{d.dormiu !== null ? hora(d.dormiu) : ''}</span>
              <div className="relative h-5 flex-1 overflow-hidden rounded-md" style={{ background: d.dormiu !== null ? COR.acordado : COR.trilho }}>
                {d.noite.segmentos.map((sg, i) => (
                  <i key={i} className="absolute bottom-0 top-0 flex items-center justify-center overflow-hidden rounded-[4px] text-[10px] font-bold not-italic text-white" style={{ left: pos(sg.a), width: larg(sg.a, sg.b), background: i === 0 ? COR.bloco1 : COR.noite }}>
                    {i === 0 && sg.b - sg.a >= 110 * 60000 ? dur((sg.b - sg.a) / 60000) : ''}
                  </i>
                ))}
                {d.mamadasMadrugada.map((t, i) => (
                  <i key={`m${i}`} className="absolute top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white" style={{ left: pos(t), background: COR.mamada }} />
                ))}
              </div>
              <span className="w-[86px] shrink-0 text-right tabular-nums">
                {d.dormiu === null ? (
                  <span className="text-[#9A95AD]">sem registro</span>
                ) : (
                  <>
                    <b style={{ color: (d.noite.despertares ?? 0) >= 3 ? COR.laranja : undefined }}>{d.noite.despertares ?? 0} desp.</b>{' '}
                    {d.noiteCompleta && d.noite.totalMin !== null ? dur(d.noite.totalMin) : ''}
                  </>
                )}
              </span>
            </div>
          );
        })}
      </div>
      <div className="ml-[124px] mr-[94px] mt-1 flex justify-between text-[10px] font-semibold text-[#9A95AD]">
        {['18h', '20h', '22h', '0h', '2h', '4h', '6h', '8h'].map((x) => <span key={x}>{x}</span>)}
      </div>
      <Legenda itens={[[COR.bloco1, '1º bloco'], [COR.noite, 'Dormindo'], [COR.acordado, 'Acordado'], [COR.mamada, 'Mamada', true]]} />
    </>
  );
}

// ── Semana: horários (ponto = dia, faixa = variação) ──────
export function Horarios({ s }: { s: SemanaV3 }) {
  if (!s.horarios.length) return <p className="py-6 text-center text-sm text-ninho-cinza">Sem horários registrados.</p>;
  return (
    <div className="mt-3 flex flex-col gap-3">
      {s.horarios.map((f: FaixaHorario) => {
        const lo = (f.min ?? 0) - 40;
        const hi = (f.max ?? 0) + 40;
        const p = (m: number) => `${((m - lo) / Math.max(hi - lo, 1)) * 100}%`;
        return (
          <div key={f.rotulo} className="text-[12px]">
            <div className="flex justify-between">
              <b>{f.rotulo}{f.dias < s.dias.length ? <span className="font-semibold text-[#9A95AD]"> · {f.dias} de {s.dias.length} dias</span> : ''}</b>
              <span className="tabular-nums" style={{ color: f.irregular ? COR.laranja : undefined, fontWeight: f.irregular ? 800 : 600 }}>
                {f.min !== null && f.max !== null ? (f.min === f.max ? hhmm(f.min) : `${hhmm(f.min)}–${hhmm(f.max)} · varia ${dur(f.variacao ?? 0)}`) : '—'}
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
export function SonecasNoite({ s }: { s: SemanaV3 }) {
  const janelas = s.dias.map((d) => d.janelaAntesDeDormir).filter((x): x is number => x !== null);
  const maior = janelas.length ? Math.max(...janelas) : null;
  const th = 'border-b border-[#F0ECF6] px-1.5 py-2 text-left text-[10.5px] font-extrabold uppercase tracking-[0.06em] text-[#9A95AD]';
  const td = 'border-b border-[#F5F2FA] px-1.5 py-2 tabular-nums';
  return (
    <div className="overflow-x-auto">
      <table className="mt-2 w-full text-[12.5px]">
        <thead>
          <tr><th className={th}>Dia</th><th className={th}>Sonecas</th><th className={th}>Última até</th><th className={th}>Janela até dormir</th><th className={th}>Noite seguinte</th></tr>
        </thead>
        <tbody>
          {s.dias.map((d) => {
            const melhor = s.melhores.includes(d.dia);
            const longa = maior !== null && d.janelaAntesDeDormir !== null && Math.round(d.janelaAntesDeDormir) === Math.round(maior) && janelas.length > 1;
            return (
              <tr key={d.dia} style={{ background: melhor ? '#EEF8F1' : undefined }}>
                <td className={`${td} font-bold`}>{diaCurto(d.dia)}</td>
                <td className={td}>{d.temRegistro ? `${d.sonecas.length} · ${dur(d.sonecasMin)}` : '—'}</td>
                <td className={td}>{d.fimUltimaSoneca !== null ? hora(d.fimUltimaSoneca) : '—'}</td>
                <td className={td} style={{ color: longa ? COR.laranja : undefined, fontWeight: longa ? 800 : undefined }}>{d.janelaAntesDeDormir !== null ? dur(d.janelaAntesDeDormir) : '—'}</td>
                <td className={td}>{d.noiteCompleta && d.noite.totalMin !== null ? `${dur(d.noite.totalMin)} · ${d.noite.despertares} desp.` : '—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Semana: janela antes de dormir ────────────────────────
export function JanelaAntesDeDormir({ s }: { s: SemanaV3 }) {
  const vals = s.dias.map((d) => d.janelaAntesDeDormir);
  const mx = Math.max(...vals.filter((x): x is number => x !== null), 1);
  const maior = Math.max(...vals.filter((x): x is number => x !== null), 0);
  return (
    <div className="mt-2 flex flex-col gap-1.5">
      {s.dias.map((d, i) => (
        <div key={d.dia} className="flex items-center gap-2 text-[12px]">
          <span className="w-[74px] shrink-0 font-bold">{diaCurto(d.dia)}</span>
          <div className="h-3.5 flex-1 overflow-hidden rounded-full" style={{ background: COR.trilho }}>
            {vals[i] !== null && <i className="block h-full rounded-full" style={{ width: `${(vals[i]! / mx) * 100}%`, background: Math.round(vals[i]!) === Math.round(maior) && maior > 0 ? COR.maior : COR.soneca }} />}
          </div>
          <span className="w-12 shrink-0 text-right font-bold tabular-nums">{vals[i] !== null ? dur(vals[i]!) : '—'}</span>
        </div>
      ))}
    </div>
  );
}

/** Mini-noites para a lista de famílias: 7 barrinhas (lilás calma, laranja ≥3 despertares, cinza sem registro). */
export function MiniNoites({ s }: { s: SemanaV3 }) {
  return (
    <span className="inline-flex items-end gap-[3px]">
      {s.dias.map((d) => {
        const sem = !d.noiteCompleta;
        const desp = d.noite.despertares ?? 0;
        return (
          <i
            key={d.dia}
            title={`${diaCurto(d.dia)}: ${sem ? 'sem registro' : `${desp} despertar(es)`}`}
            className="inline-block w-[7px] rounded-[2px]"
            style={{ height: sem ? 8 : 18, background: sem ? '#E4E1EA' : desp >= 3 ? '#F0B456' : COR.soneca }}
          />
        );
      })}
    </span>
  );
}

export { minutoDoDia };
