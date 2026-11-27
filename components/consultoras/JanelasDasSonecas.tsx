/**
 * Cartão "Janela antes de cada soneca" da aba Rotina da consultora (dono,
 * 26/11/2026; Ninho-expo docs/design/consultora/janelas-das-sonecas.html).
 * Igual ao app: uma linha por soneca (e a noite), cada ponto é um dia (roxo =
 * soneca boa, âmbar = curta, contorno escuro = o dia aberto), número grande =
 * o meio das boas, faixa clara = a maioria delas.
 */
import Link from 'next/link';
import { dur } from '@/lib/consultoras-rotina';
import { CORTES, type ComparacaoJanela, type JanelasDoPeriodo, type PosicaoJanelas } from '@/lib/consultoras-janelas';
import { CopiarResumo } from './CopiarResumo';

type Lingua = 'pt' | 'en' | 'es';
const ESCALA = 240;
const pct = (m: number) => `${Math.min(100, Math.max(0, (m / ESCALA) * 100))}%`;
const ROXO = '#7C5CD6';
const AMBAR = '#C7841F';
const FAIXA = '#E3D8FA';
const TINTA = '#24164F';

const TX = {
  pt: {
    titulo: 'Janela antes de cada soneca',
    hint: (n: number, dia: string) => `Os ${n} dias até ${dia}: quanto tempo ficou acordado antes das sonecas boas e das curtas`,
    dias: (n: number) => `${n} dias`,
    corte: (m: number) => `Boa: ${m} min ou mais`,
    soneca: (n: number) => `${n}ª soneca`,
    noite: 'Noite',
    boas: (a: number, b: number) => `${a} de ${b} boas`,
    noitesBoas: (a: number, b: number) => `${a} de ${b} noites boas`,
    poucos: 'poucos dias',
    poucosHint: 'Menos de 3 sonecas boas nesta posição no período.',
    maioria: (v: string) => `maioria: ${v}`,
    curtas: (v: string) => `curtas: ${v}`,
    outras: (v: string) => `outras noites: ${v}`,
    a: (x: string, y: string) => `${x} a ${y}`,
    semDados: 'Ainda não há sonecas com início e fim nestes dias.',
    leg: ['Soneca boa', 'Curta', 'Maioria das boas', 'Dia aberto'],
    resumo: (n: number) => `Janelas das sonecas boas · ${n} dias`,
    antes: (n: number) => `Antes da ${n}ª soneca`,
    antesNoite: 'Antes de dormir à noite',
    aviso: 'O que aconteceu nos registros da família. Não é recomendação do Ninho: a orientação é sua.',
    copiar: 'Copiar resumo',
    copiado: 'Copiado',
    textoCopia: (b: string, n: number) => `Janelas antes das sonecas boas de ${b} (${n} dias):`,
    ponto: (d: string, j: string, s: string) => `${d}: ${j} acordado → soneca de ${s}`,
    pontoNoite: (d: string, j: string) => `${d}: ${j} acordado antes de dormir`,
    como: (r: string) => `✓ como as boas (${r})`,
    mais: (t: string, r: string) => `${t} a mais (boas: ${r})`,
    menos: (t: string, r: string) => `${t} a menos (boas: ${r})`,
  },
  en: {
    titulo: 'Wake window before each nap',
    hint: (n: number, dia: string) => `The ${n} days up to ${dia}: how long the baby was awake before good naps and short ones`,
    dias: (n: number) => `${n} days`,
    corte: (m: number) => `Good: ${m} min or more`,
    soneca: (n: number) => `Nap ${n}`,
    noite: 'Night',
    boas: (a: number, b: number) => `${a} of ${b} good`,
    noitesBoas: (a: number, b: number) => `${a} of ${b} good nights`,
    poucos: 'too few days',
    poucosHint: 'Fewer than 3 good naps in this position in the period.',
    maioria: (v: string) => `most: ${v}`,
    curtas: (v: string) => `short: ${v}`,
    outras: (v: string) => `other nights: ${v}`,
    a: (x: string, y: string) => `${x} to ${y}`,
    semDados: 'No naps with start and end in these days yet.',
    leg: ['Good nap', 'Short', 'Most good naps', 'Open day'],
    resumo: (n: number) => `Wake windows before good naps · ${n} days`,
    antes: (n: number) => `Before nap ${n}`,
    antesNoite: 'Before night sleep',
    aviso: "What happened in the family's logs. It is not a Ninho recommendation: the guidance is yours.",
    copiar: 'Copy summary',
    copiado: 'Copied',
    textoCopia: (b: string, n: number) => `Wake windows before ${b}'s good naps (${n} days):`,
    ponto: (d: string, j: string, s: string) => `${d}: awake ${j} → nap of ${s}`,
    pontoNoite: (d: string, j: string) => `${d}: awake ${j} before night sleep`,
    como: (r: string) => `✓ like the good ones (${r})`,
    mais: (t: string, r: string) => `${t} longer (good: ${r})`,
    menos: (t: string, r: string) => `${t} shorter (good: ${r})`,
  },
  es: {
    titulo: 'Ventana antes de cada siesta',
    hint: (n: number, dia: string) => `Los ${n} días hasta el ${dia}: cuánto tiempo estuvo despierto antes de las siestas buenas y de las cortas`,
    dias: (n: number) => `${n} días`,
    corte: (m: number) => `Buena: ${m} min o más`,
    soneca: (n: number) => `${n}.ª siesta`,
    noite: 'Noche',
    boas: (a: number, b: number) => `${a} de ${b} buenas`,
    noitesBoas: (a: number, b: number) => `${a} de ${b} noches buenas`,
    poucos: 'pocos días',
    poucosHint: 'Menos de 3 siestas buenas en esta posición en el período.',
    maioria: (v: string) => `mayoría: ${v}`,
    curtas: (v: string) => `cortas: ${v}`,
    outras: (v: string) => `otras noches: ${v}`,
    a: (x: string, y: string) => `${x} a ${y}`,
    semDados: 'Aún no hay siestas con inicio y fin en estos días.',
    leg: ['Siesta buena', 'Corta', 'Mayoría de las buenas', 'Día abierto'],
    resumo: (n: number) => `Ventanas de las siestas buenas · ${n} días`,
    antes: (n: number) => `Antes de la ${n}.ª siesta`,
    antesNoite: 'Antes de dormir por la noche',
    aviso: 'Lo que pasó en los registros de la familia. No es una recomendación de Ninho: la orientación es tuya.',
    copiar: 'Copiar resumen',
    copiado: 'Copiado',
    textoCopia: (b: string, n: number) => `Ventanas antes de las siestas buenas de ${b} (${n} días):`,
    ponto: (d: string, j: string, s: string) => `${d}: ${j} despierto → siesta de ${s}`,
    pontoNoite: (d: string, j: string) => `${d}: ${j} despierto antes de dormir`,
    como: (r: string) => `✓ como las buenas (${r})`,
    mais: (t: string, r: string) => `${t} de más (buenas: ${r})`,
    menos: (t: string, r: string) => `${t} de menos (buenas: ${r})`,
  },
};
const lingua = (i?: string): Lingua => (i === 'en' || i === 'es' ? i : 'pt');
/** "26/11" (pt/es) ou "11/26" (en) a partir de "2026-11-26". */
const diaCurto = (d: string, l: Lingua) => (l === 'en' ? `${d.slice(5, 7)}/${d.slice(8, 10)}` : `${d.slice(8, 10)}/${d.slice(5, 7)}`);

/** Texto da etiqueta da Sequência do dia (null = sem base para comparar). */
export function textoEtiqueta(c: ComparacaoJanela, idioma?: string): { ok: boolean; texto: string } | null {
  if (c.tipo === 'no_base') return null;
  const t = TX[lingua(idioma)];
  const r = c.deMin === c.ateMin ? dur(c.deMin) : `${dur(c.deMin)}–${dur(c.ateMin)}`;
  if (c.tipo === 'within') return { ok: true, texto: t.como(r) };
  return { ok: false, texto: c.tipo === 'above' ? t.mais(dur(c.diferencaMin), r) : t.menos(dur(c.diferencaMin), r) };
}

export function JanelasDasSonecas({
  dados,
  dias,
  corte,
  diaAberto,
  bebe,
  href,
  idioma,
}: {
  dados: JanelasDoPeriodo;
  dias: number;
  corte: number;
  diaAberto: string;
  bebe: string;
  href: (dias: number, corte: number) => string;
  idioma?: string;
}) {
  const l = lingua(idioma);
  const t = TX[l];
  const faixa = (p: PosicaoJanelas) => (p.deMin === p.ateMin ? dur(p.deMin!) : t.a(dur(p.deMin!), dur(p.ateMin!)));
  const linhas = [...dados.sonecas, ...(dados.noite.pontos.length ? [dados.noite] : [])];
  const comNumero = linhas.filter((p) => p.meioMin !== null);
  const proximo = CORTES[(CORTES.indexOf(corte as (typeof CORTES)[number]) + 1) % CORTES.length];
  const rotulo = (p: PosicaoJanelas) => (p.posicao === 0 ? t.noite : t.soneca(p.posicao));
  const texto = [t.textoCopia(bebe, dias), ...comNumero.map((p) => `• ${p.posicao === 0 ? t.antesNoite : t.antes(p.posicao)}: ${faixa(p)}`)].join('\n');

  return (
    <div>
      <p className="text-[12.5px] leading-snug text-ninho-cinza">{t.hint(dias, diaCurto(diaAberto, l))}</p>
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {[7, 14].map((n) => (
          <Link key={n} href={href(n, corte)} scroll={false} className={`rounded-full px-3 py-1.5 text-xs font-bold ${n === dias ? 'bg-[#7C5CD6] text-white' : 'bg-[#F5F2FC] text-ninho-cinza'}`}>
            {t.dias(n)}
          </Link>
        ))}
        <Link href={href(dias, proximo)} scroll={false} className="ml-auto rounded-full bg-[#EDE4FB] px-3 py-1.5 text-xs font-bold text-[#7C5CD6]">
          {t.corte(corte)} ⇅
        </Link>
      </div>

      {linhas.length === 0 ? (
        <p className="mt-3 text-[13px] text-ninho-cinza">{t.semDados}</p>
      ) : (
        <div className="mt-2">
          <div className="relative mb-1 ml-[150px] mr-[150px] h-3.5 text-[10px] font-bold text-[#9A95AD]">
            {[0, 60, 120, 180, 240].map((m) => (
              <span key={m} className="absolute -translate-x-1/2" style={{ left: pct(m) }}>{m ? dur(m) : '0'}</span>
            ))}
          </div>
          {linhas.map((p, i) => (
            <div key={p.posicao} className={`grid grid-cols-[140px_1fr_140px] items-center gap-2.5 py-2.5 ${i ? 'border-t border-[#F1ECFB]' : ''}`}>
              <div>
                <p className="text-[13.5px] font-extrabold">{rotulo(p)}</p>
                <p className="text-[11.5px] font-semibold text-ninho-cinza">{p.posicao === 0 ? t.noitesBoas(p.boas, p.pontos.length) : t.boas(p.boas, p.pontos.length)}</p>
              </div>
              <div className="relative h-[22px] rounded-[7px] bg-[#F7F4FD]">
                {p.meioMin !== null && p.deMin !== null && p.ateMin !== null && (
                  <>
                    <i className="absolute bottom-[3px] top-[3px] rounded-[5px]" style={{ left: pct(p.deMin), width: pct(Math.max(3, p.ateMin - p.deMin)), background: FAIXA }} />
                    <i className="absolute bottom-0 top-0 -ml-px w-0.5" style={{ left: pct(p.meioMin), background: ROXO }} />
                  </>
                )}
                {p.pontos.map((pt, j) => {
                  const aberto = pt.dia === diaAberto;
                  const s = aberto ? 15 : 9;
                  return (
                    <i
                      key={j}
                      title={p.posicao === 0 ? t.pontoNoite(diaCurto(pt.dia, l), dur(pt.janelaMin)) : t.ponto(diaCurto(pt.dia, l), dur(pt.janelaMin), dur(pt.duracaoMin ?? 0))}
                      className="absolute top-1/2 rounded-full"
                      style={{ left: pct(pt.janelaMin), width: s, height: s, marginTop: -s / 2, marginLeft: -s / 2, background: pt.boa ? ROXO : AMBAR, border: aberto ? `2.5px solid ${TINTA}` : '1.5px solid #fff', zIndex: aberto ? 2 : 1 }}
                    />
                  );
                })}
              </div>
              <div className="text-right tabular-nums">
                {p.meioMin !== null ? (
                  <>
                    <p className="text-[17px] font-black text-[#7C5CD6]">{dur(p.meioMin)}</p>
                    <p className="text-[11.5px] font-semibold text-ninho-cinza">{t.maioria(faixa(p))}</p>
                    {p.meioCurtasMin !== null && <p className="text-[11.5px] font-semibold" style={{ color: AMBAR }}>{p.posicao === 0 ? t.outras(dur(p.meioCurtasMin)) : t.curtas(dur(p.meioCurtasMin))}</p>}
                  </>
                ) : (
                  <p className="text-[12px] font-bold text-[#9A95AD]" title={t.poucosHint}>{t.poucos}</p>
                )}
              </div>
            </div>
          ))}
          <div className="mt-2 flex flex-wrap gap-3 text-[11px] font-semibold text-ninho-cinza">
            {[ROXO, AMBAR, FAIXA, '#fff'].map((cor, k) => (
              <span key={k} className="flex items-center gap-1.5">
                <i className="inline-block h-2.5" style={{ width: k === 2 ? 16 : 10, borderRadius: k === 2 ? 3 : 999, background: cor, border: k === 3 ? `2px solid ${TINTA}` : undefined }} />
                {t.leg[k]}
              </span>
            ))}
          </div>
        </div>
      )}

      {comNumero.length > 0 && (
        <div className="mt-3 rounded-2xl bg-[#F5F2FC] px-4 py-3">
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-ninho-cinza">{t.resumo(dias)}</p>
          <ul className="mt-1.5 list-disc pl-5 text-[13px] leading-relaxed">
            {comNumero.map((p) => (
              <li key={p.posicao}><b>{p.posicao === 0 ? t.antesNoite : t.antes(p.posicao)}:</b> {faixa(p)}</li>
            ))}
          </ul>
          <p className="mt-1.5 text-[11px] leading-snug text-[#9A95AD]">{t.aviso}</p>
          <CopiarResumo texto={texto} rotulo={t.copiar} copiado={t.copiado} />
        </div>
      )}
    </div>
  );
}
