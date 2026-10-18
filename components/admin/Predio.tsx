'use client';

/**
 * O prédio da empresa virtual (mockup v2 aprovado em 18/10/2026:
 * Ninho-expo/docs/empresa/predio-mockup.html).
 *
 * - Um prédio só, em corte, com a frente aberta: todos os andares de uma vez,
 *   e setores parecidos dividindo o andar (lib/empresa/menu.ts → ANDARES).
 * - Todo mundo fica parado na própria mesa; o estado aparece só na etiqueta
 *   em cima, que é o próprio nome (verde trabalhando, amarela esperando o OK,
 *   cinza livre). Gente andando poluía a tela e o dono não sabia quem era quem.
 * - Clicar no setor mostra a equipe; clicar na pessoa mostra o que faz.
 * - Os contadores do topo abrem a lista do que contam.
 * - Central: o que espera o dono (com Aprovar / Já fiz / Recusar) e o que foi feito.
 * - Atualiza sozinho: router.refresh() a cada 15s refaz a leitura no servidor.
 */
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import type { Aprovacao, EstadoPessoa, Pessoa, Setor } from '@/lib/empresa';
import { ANDARES, COR_SETOR } from '@/lib/empresa/menu';
import { decidirItemMural } from '@/app/admin/(painel)/empresa/actions';

export interface Feito {
  quando: string;
  quem: string;
  setor: string | null;
  oque: string;
}

const TIPO: Record<string, string> = { sup: 'Supervisor', agente: 'Agente', skill: 'Skill', humano: 'Humano', produto: 'Produto' };
const PELE = ['#F1C7A6', '#D9A47E', '#B57A55', '#8A5A3B', '#5E3B26', '#E8B998'];
const CABELO = ['#2B1B10', '#5A3A22', '#A0663A', '#1E1E1E', '#C9A15A', '#6B4A3A'];
/** Etiqueta em cima da cabeça: o nome da pessoa na cor do estado [fundo, texto]. */
const ETIQUETA = { trabalhando: ['#4CAF74', '#fff'], esperando: ['#FFB020', '#3A2600'], livre: ['#E6E4DE', '#55534D'], desativado: ['#E6E4DE', '#9A988F'] } as const;
const W = 18, D = 4.6, FH = 3.2;

const hsh = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
function shade(hex: string, f: number) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.round((n >> 16) * f)), g = Math.min(255, Math.round(((n >> 8) & 255) * f)), b = Math.min(255, Math.round((n & 255) * f));
  return `rgb(${r},${g},${b})`;
}
function quando(iso: string | null) {
  if (!iso) return '';
  const d = new Date(iso);
  const dia = (x: Date) => x.toLocaleDateString('en-CA', { timeZone: 'Asia/Dubai' });
  return dia(d) === dia(new Date())
    ? d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Dubai' })
    : d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'Asia/Dubai' });
}

interface Lugar {
  p: Pessoa; setor: Setor; andar: number; mesa: [number, number]; seat: [number, number];
  sk: string; hr: string; longo: boolean; fase: number;
}

type Lista = 'trab' | 'esp' | 'hoje' | 'func' | null;

export function Predio({
  setores, estados, esperando, feitos, hoje,
}: {
  setores: Setor[];
  estados: Record<string, EstadoPessoa>;
  esperando: Aprovacao[];
  feitos: Feito[];
  hoje: Feito[];
}) {
  const router = useRouter();
  const [selSetor, setSelSetor] = useState<string | null>(null);
  const [selPessoa, setSelPessoa] = useState<string | null>(null);
  const [lista, setLista] = useState<Lista>(null);
  const [aba, setAba] = useState<'esperando' | 'feito'>('esperando');
  const [pend, startTransition] = useTransition();
  const [erroMural, setErroMural] = useState<string | null>(null);
  const cvRef = useRef<HTMLCanvasElement>(null);
  const alvosP = useRef<{ id: string; x: number; y: number; r: number }[]>([]);
  const alvosS = useRef<{ id: string; pts: [number, number][] }[]>([]);
  const estadosRef = useRef(estados);
  estadosRef.current = estados;

  useEffect(() => {
    const t = setInterval(() => router.refresh(), 15_000);
    return () => clearInterval(t);
  }, [router]);

  const porId = new Map(setores.map((s) => [s.id, s]));
  const pessoa = (id: string) => {
    for (const s of setores) { const p = s.pessoas.find((x) => x.id === id); if (p) return { p, s }; }
    return null;
  };
  const nomeDe = (id: string | null) => (id ? pessoa(id)?.p.nome ?? id : '');
  const ativos = setores.filter((s) => !s.desativado);
  const trabalhando = ativos.flatMap((s) => s.pessoas.filter((p) => estados[p.id]?.estado === 'trabalhando').map((p) => ({ p, s })));
  const funcoes = ativos.reduce((n, s) => n + s.pessoas.length, 0);

  // lugares fixos: cada setor ocupa uma sala do andar, cada pessoa uma mesa
  const lugares = useRef<Lugar[]>([]);
  useEffect(() => {
    const out: Lugar[] = [];
    ANDARES.forEach((a, fi) => {
      const larg = W / a.setores.length;
      a.setores.forEach((sid, si) => {
        const s = setores.find((x) => x.id === sid);
        if (!s) return;
        const x0 = si * larg, n = s.pessoas.length;
        const cols = Math.min(4, Math.max(2, Math.ceil(n / 2))), passo = (larg - 1.4) / cols;
        s.pessoas.forEach((p, i) => {
          const col = i % cols, row = Math.floor(i / cols);
          const mesa: [number, number] = [x0 + 0.7 + col * passo, row ? 1.1 : 2.7];
          const k = hsh(p.nome);
          out.push({ p, setor: s, andar: fi, mesa, seat: [mesa[0] + 0.55, mesa[1] - 0.35], sk: PELE[k % 6], hr: CABELO[(k >> 3) % 6], longo: k % 3 === 0, fase: k % 7 });
        });
      });
    });
    lugares.current = out;
  }, [setores]);

  const desenhar = useCallback((t: number) => {
    const cv = cvRef.current;
    if (!cv) return;
    const reduz = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const c = cv.getContext('2d')!;
    const dpr = window.devicePixelRatio || 1, cw = cv.clientWidth, ch = cv.clientHeight;
    if (cv.width !== Math.round(cw * dpr) || cv.height !== Math.round(ch * dpr)) { cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr); }
    c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, cw, ch);
    const nA = ANDARES.length;
    const T = Math.min(cw / (W + D * 0.55 + 0.8), (ch - 20) / (nA * FH + D * 0.34 + 1.4));
    const OX = (cw - (W + D * 0.55) * T) / 2, OY = ch - 12 - Math.max(0, (ch - 20 - (nA * FH + D * 0.34 + 1.4) * T) / 2);
    const P = (x: number, y: number, z: number): [number, number] => [OX + (x + y * 0.55) * T, OY - (z + y * 0.34) * T];
    const poly = (pts: [number, number][], f?: string | null, s?: string, lw = 1) => {
      c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath();
      if (f) { c.fillStyle = f; c.fill(); }
      if (s) { c.strokeStyle = s; c.lineWidth = lw; c.stroke(); }
    };
    const caixa = (x: number, y: number, z: number, w: number, d: number, h: number, cor: string) => {
      poly([P(x + w, y, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x + w, y, z + h)], shade(cor, 0.72));
      poly([P(x, y, z + h), P(x + w, y, z + h), P(x + w, y + d, z + h), P(x, y + d, z + h)], cor);
      poly([P(x, y, z), P(x + w, y, z), P(x + w, y, z + h), P(x, y, z + h)], shade(cor, 0.86));
    };
    const fonte = (peso: number, px: number) => `${peso} ${px}px system-ui, -apple-system, sans-serif`;

    alvosP.current = []; alvosS.current = [];
    const sobre: (() => void)[] = [];
    ANDARES.forEach((a, fi) => {
      const z = fi * FH, larg = W / a.setores.length;
      caixa(0, 0, z - 0.25, W, D, 0.25, '#C9BEE0');
      a.setores.forEach((sid, si) => {
        const s = porId.get(sid);
        if (!s) return;
        const x0 = si * larg, on = selSetor === sid, off = !!s.desativado;
        poly([P(x0, 0, z), P(x0 + larg, 0, z), P(x0 + larg, D, z), P(x0, D, z)], on ? '#E2D6FB' : off ? '#ECEBEF' : '#F4EFFB');
        poly([P(x0, D, z), P(x0 + larg, D, z), P(x0 + larg, D, z + FH - 0.25), P(x0, D, z + FH - 0.25)], off ? '#E2E1E6' : '#E9E1F7');
        poly([P(x0, D, z + FH - 0.7), P(x0 + larg, D, z + FH - 0.7), P(x0 + larg, D, z + FH - 0.25), P(x0, D, z + FH - 0.25)], off ? '#C9C8CF' : COR_SETOR[sid]);
        // nome do setor como placa na viga da frente (a faixa do fundo fica escondida pelo piso de cima)
        const [lx, ly] = P(x0 + 0.25, 0, z + FH - 0.12);
        sobre.push(() => {
          c.font = fonte(700, 12); c.textAlign = 'left'; c.textBaseline = 'middle';
          const txt = `${s.nome}${off ? ' · desativado' : ''}`, tw = c.measureText(txt).width + 14;
          c.fillStyle = off ? '#B4B2A9' : COR_SETOR[sid]; c.beginPath(); c.roundRect(lx, ly - 10, tw, 20, 6); c.fill();
          c.fillStyle = '#fff'; c.fillText(txt, lx + 7, ly + 1);
        });
        for (let w = 0; w < Math.floor(larg / 3); w++) {
          const wx = x0 + 1 + w * 3;
          poly([P(wx, D, z + 0.9), P(wx + 1.6, D, z + 0.9), P(wx + 1.6, D, z + 1.9), P(wx, D, z + 1.9)], 'rgba(160,200,255,.35)');
        }
        if (si > 0) poly([P(x0, 0, z), P(x0, D, z), P(x0, D, z + FH - 0.25), P(x0, 0, z + FH - 0.25)], 'rgba(159,134,224,.18)', 'rgba(124,92,214,.4)');
        if (on) poly([P(x0, 0, z), P(x0 + larg, 0, z), P(x0 + larg, 0, z + FH - 0.3), P(x0, 0, z + FH - 0.3)], null, '#7C5CD6', 2);
        alvosS.current.push({ id: sid, pts: [P(x0, 0, z), P(x0 + larg, 0, z), P(x0 + larg, D, z), P(x0 + larg, D, z + FH - 0.25), P(x0, D, z + FH - 0.25), P(x0, 0, z + FH - 0.25)] });
      });
      poly([P(0, 0, z), P(0, D, z), P(0, D, z + FH - 0.25), P(0, 0, z + FH - 0.25)], 'rgba(201,190,224,.55)');

      const itens: { d: number; f: () => void }[] = [];
      for (const L of lugares.current.filter((l) => l.andar === fi)) {
        const est = L.setor.desativado ? 'desativado' : estadosRef.current[L.p.id]?.estado ?? 'livre';
        itens.push({ d: L.mesa[1] + 0.01, f: () => {
          caixa(L.mesa[0], L.mesa[1], z, 1.1, 0.55, 0.42, L.setor.desativado ? '#DADADA' : '#E7D3B8');
          caixa(L.mesa[0] + 0.3, L.mesa[1] + 0.4, z + 0.42, 0.5, 0.08, 0.35, '#655C7A');
          if (est === 'trabalhando') {
            const [x, y] = P(L.mesa[0] + 0.55, L.mesa[1] + 0.4, z + 0.6);
            c.fillStyle = reduz ? '#BDF0D2' : `rgba(189,240,210,${0.6 + 0.4 * Math.abs(Math.sin(t * 3))})`;
            c.fillRect(x - T * 0.2, y - T * 0.12, T * 0.4, T * 0.22);
          }
        } });
        itens.push({ d: L.seat[1], f: () => {
          const [bx, by] = L.seat, z0 = z + 0.2;
          const [sx, sy] = P(bx, by, z);
          c.fillStyle = 'rgba(0,0,0,.12)'; c.beginPath(); c.ellipse(sx, sy, T * 0.3, T * 0.1, 0, 0, Math.PI * 2); c.fill();
          caixa(bx - 0.17, by - 0.1, z0, 0.34, 0.2, 0.75, est === 'desativado' ? '#B4B2A9' : COR_SETOR[L.setor.id]);
          const [hx, hy] = P(bx, by, z0 + 1.05), r = T * 0.27;
          if (L.longo) { c.fillStyle = L.hr; c.beginPath(); c.ellipse(hx, hy + r * 0.35, r * 1.05, r * 1.15, 0, 0, Math.PI * 2); c.fill(); }
          c.fillStyle = L.sk; c.beginPath(); c.arc(hx, hy, r, 0, Math.PI * 2); c.fill();
          c.fillStyle = L.hr; c.beginPath(); c.arc(hx, hy - r * 0.15, r * 1.02, Math.PI * 1.05, Math.PI * 1.95); c.fill();
          alvosP.current.push({ id: L.p.id, x: hx, y: hy + r, r: Math.max(14, T * 0.8) });
          // uma etiqueta só, em cima da cabeça: o nome, na cor do estado
          sobre.push(() => {
            const [cor, tc] = ETIQUETA[est];
            const on = selPessoa === L.p.id, ey = hy - r * 1.9;
            c.font = fonte(700, 11); c.textAlign = 'center'; c.textBaseline = 'middle';
            const tw = c.measureText(L.p.nome).width + 12;
            c.fillStyle = cor; c.beginPath(); c.roundRect(hx - tw / 2, ey - 9, tw, 18, 9); c.fill();
            if (est === 'trabalhando' && !reduz) {
              c.strokeStyle = `rgba(76,175,116,${0.35 + 0.35 * Math.sin(t * 4 + L.fase)})`; c.lineWidth = 3; c.stroke();
            }
            if (on) { c.strokeStyle = '#7C5CD6'; c.lineWidth = 2.5; c.stroke(); }
            c.fillStyle = tc; c.fillText(L.p.nome, hx, ey + 1);
          });
        } });
      }
      itens.sort((x, y) => y.d - x.d).forEach((i) => i.f());
    });
    caixa(0, 0, nA * FH - 0.25, W, D, 0.3, '#9F86E0');
    sobre.forEach((f) => f());
  }, [setores, selSetor, selPessoa]);

  useEffect(() => {
    let raf = 0;
    const loop = (now: number) => { desenhar(now / 1000); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [desenhar]);

  function clique(e: React.MouseEvent<HTMLCanvasElement>) {
    const r = e.currentTarget.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    let best: string | null = null, bd = 1e9;
    for (const a of alvosP.current) { const d = Math.hypot(a.x - x, a.y - y); if (d < a.r && d < bd) { bd = d; best = a.id; } }
    if (best) { setSelPessoa(best); setSelSetor(pessoa(best)?.s.id ?? null); return; }
    const dentro = (pts: [number, number][]) => {
      let ok = false;
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const [xi, yi] = pts[i], [xj, yj] = pts[j];
        if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) ok = !ok;
      }
      return ok;
    };
    const s = alvosS.current.find((a) => dentro(a.pts));
    if (s) { setSelSetor(s.id); setSelPessoa(null); }
  }

  function decidir(id: number, status: 'aprovado' | 'feito' | 'recusado') {
    setErroMural(null);
    startTransition(async () => {
      const r = await decidirItemMural(id, status);
      if (r.error) setErroMural(r.error);
      router.refresh();
    });
  }

  const stat = (k: Exclude<Lista, null>, valor: number, rotulo: string, alerta = false) => (
    <button
      key={k}
      onClick={() => setLista(lista === k ? null : k)}
      className={`rounded-2xl border bg-white px-4 py-3 text-left transition hover:border-ninho-roxo ${lista === k ? 'border-ninho-roxo ring-2 ring-ninho-roxo-suave' : 'border-ninho-borda'}`}
    >
      <span className={`block text-2xl font-bold tabular-nums ${alerta && valor > 0 ? 'text-amber-600' : 'text-ninho-roxo-escuro'}`}>{valor}</span>
      <span className="block text-xs text-ninho-cinza">{rotulo}</span>
      <span className="mt-0.5 block text-[11px] font-semibold text-ninho-roxo-escuro">{lista === k ? 'Fechar lista' : 'Ver quem são ›'}</span>
    </button>
  );
  const th = 'border-b border-ninho-borda px-2 py-1.5 text-left text-[11px] font-semibold uppercase tracking-wide text-ninho-cinza';
  const td = 'border-b border-ninho-borda px-2 py-1.5 align-top';
  const dot = (cor: string) => <i className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full align-[-1px]" style={{ background: cor }} />;
  const vazio = (txt: string) => <p className="text-sm text-ninho-cinza">{txt}</p>;

  const sp = selPessoa ? pessoa(selPessoa) : null;
  const est = sp ? estados[sp.p.id] : null;
  const ss = selSetor ? porId.get(selSetor) : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stat('trab', trabalhando.length, 'trabalhando agora')}
        {stat('esp', esperando.length, 'esperando você', true)}
        {stat('hoje', hoje.length, 'tarefas hoje')}
        {stat('func', funcoes, `funções em ${ativos.length} setores`)}
      </div>

      {lista && (
        <div className="overflow-x-auto rounded-2xl border border-ninho-roxo bg-white p-4 text-sm">
          <div className="mb-2 flex items-center">
            <h3 className="font-semibold">
              {lista === 'trab' ? 'Trabalhando agora' : lista === 'esp' ? 'Esperando você' : lista === 'hoje' ? 'Tarefas de hoje' : 'Funções por setor'}
            </h3>
            <button onClick={() => setLista(null)} className="ml-auto rounded-pill border border-ninho-borda px-3 py-1 text-xs text-ninho-cinza hover:border-ninho-roxo">Fechar</button>
          </div>
          {lista === 'trab' && (trabalhando.length === 0 ? vazio('Ninguém trabalhando agora.') : (
            <table className="w-full"><thead><tr><th className={th}>Quem</th><th className={th}>Função</th><th className={th}>Setor</th><th className={th}>O que está fazendo</th></tr></thead>
              <tbody>{trabalhando.map(({ p, s }) => (
                <tr key={p.id}><td className={td}>{dot(COR_SETOR[s.id])}<b>{p.nome}</b></td><td className={td}>{p.cargo}</td><td className={td}>{s.nome}</td><td className={td}>{estados[p.id]?.agora ?? '—'}</td></tr>
              ))}</tbody></table>
          ))}
          {lista === 'esp' && (esperando.length === 0 ? vazio('Nada esperando você.') : (
            <table className="w-full"><thead><tr><th className={th}>O quê</th><th className={th}>Pedido por</th><th className={th}>Desde</th></tr></thead>
              <tbody>{esperando.map((m) => (
                <tr key={m.id}><td className={td}>{m.titulo}</td><td className={td}>{nomeDe(m.pedido_por) || '—'}{m.setor ? ` · ${porId.get(m.setor)?.nome ?? m.setor}` : ''}</td><td className={td}>{quando(m.criado_em)}</td></tr>
              ))}</tbody></table>
          ))}
          {lista === 'hoje' && (hoje.length === 0 ? vazio('Nenhuma tarefa hoje (fuso de Dubai).') : (
            <table className="w-full"><thead><tr><th className={th}>Hora</th><th className={th}>Quem</th><th className={th}>O que fez</th></tr></thead>
              <tbody>{hoje.map((f, i) => (
                <tr key={i}><td className={`${td} tabular-nums`}>{quando(f.quando)}</td><td className={td}>{f.quem}</td><td className={td}>{f.oque}</td></tr>
              ))}</tbody></table>
          ))}
          {lista === 'func' && (
            <table className="w-full"><thead><tr><th className={th}>Setor</th><th className={th}>Quem</th></tr></thead>
              <tbody>{ativos.map((s) => (
                <tr key={s.id}><td className={`${td} whitespace-nowrap`}>{dot(COR_SETOR[s.id])}{s.nome}</td>
                  <td className={td}>{s.pessoas.map((p, i) => <span key={p.id}>{i > 0 && ', '}{p.nome} <span className="text-ninho-cinza">({p.cargo})</span></span>)}</td></tr>
              ))}</tbody></table>
          )}
        </div>
      )}

      <div className="min-w-0 rounded-2xl border border-ninho-borda bg-white p-3">
        <canvas ref={cvRef} onClick={clique} className="block aspect-[1.15/1] max-h-[880px] w-full cursor-pointer" aria-label="Prédio em corte com todos os andares: clique num setor ou numa pessoa" />
        <div className="flex flex-wrap gap-4 px-1 pt-2 text-xs text-ninho-cinza">
          <span>{dot('#4CAF74')}Trabalhando</span>
          <span>{dot('#FFB020')}Esperando seu OK</span>
          <span>{dot('#D3D1CA')}Livre</span>
          <span className="ml-auto">Clique num setor ou em alguém</span>
        </div>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-ninho-borda bg-white p-3">
          <h3 className="mb-2 px-1 text-sm font-semibold">Central</h3>
          <div className="mb-3 flex gap-1.5">
            <button onClick={() => setAba('esperando')} className={`rounded-pill border px-3 py-1.5 text-sm ${aba === 'esperando' ? 'border-ninho-roxo bg-ninho-roxo font-semibold text-white' : 'border-ninho-borda'}`}>
              Esperando você{esperando.length > 0 && <em className="ml-1.5 rounded-pill bg-amber-400 px-1.5 text-[11px] font-bold not-italic text-amber-950">{esperando.length}</em>}
            </button>
            <button onClick={() => setAba('feito')} className={`rounded-pill border px-3 py-1.5 text-sm ${aba === 'feito' ? 'border-ninho-roxo bg-ninho-roxo font-semibold text-white' : 'border-ninho-borda'}`}>
              O que foi feito
            </button>
          </div>
          {erroMural && <p className="mb-2 text-xs text-red-600">{erroMural}</p>}
          {aba === 'esperando' ? (
            esperando.length === 0 ? vazio('Nada esperando você agora.') : (
              <div className={`flex flex-col gap-2 ${pend ? 'opacity-60' : ''}`}>
                {esperando.map((m) => (
                  <div key={m.id} className="flex flex-col gap-1.5 rounded-xl border border-ninho-borda p-3">
                    <p className="text-sm font-semibold">{m.titulo}</p>
                    <span className="text-[11px] text-ninho-cinza">
                      {[nomeDe(m.pedido_por), m.setor ? porId.get(m.setor)?.nome : null, quando(m.criado_em)].filter(Boolean).join(' · ')}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      <button disabled={pend} onClick={() => decidir(m.id, 'aprovado')} className="rounded-pill bg-[#4CAF74] px-2.5 py-1 text-xs font-medium text-white">Aprovar</button>
                      <button disabled={pend} onClick={() => decidir(m.id, 'feito')} className="rounded-pill border border-ninho-borda px-2.5 py-1 text-xs">Já fiz</button>
                      <button disabled={pend} onClick={() => decidir(m.id, 'recusado')} className="rounded-pill border border-ninho-borda px-2.5 py-1 text-xs text-red-600">Recusar</button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : feitos.length === 0 ? vazio('Nada concluído nos últimos 7 dias.') : (
            <ul className="flex max-h-[560px] flex-col gap-2 overflow-y-auto text-sm">
              {feitos.map((f, i) => (
                <li key={i} className="grid grid-cols-[44px_1fr] gap-2">
                  <time className="tabular-nums text-ninho-cinza">{quando(f.quando)}</time>
                  <span><b>{f.quem}</b>: {f.oque}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

      <div className="rounded-2xl border border-ninho-borda bg-white p-4">
        {sp && est ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-full text-lg font-bold text-white" style={{ background: COR_SETOR[sp.s.id] }}>{sp.p.nome[0]}</div>
              <div>
                <p className="font-semibold">{sp.p.nome}</p>
                <p className="text-xs text-ninho-cinza">{sp.p.cargo} · {sp.s.nome}</p>
              </div>
              <button onClick={() => setSelPessoa(null)} className="ml-auto rounded-pill border border-ninho-borda px-3 py-1 text-xs text-ninho-cinza hover:border-ninho-roxo">Voltar ao setor</button>
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-semibold">
              <span className={`rounded-pill px-2.5 py-1 ${est.estado === 'trabalhando' ? 'bg-green-50 text-green-700' : est.estado === 'esperando' ? 'bg-amber-50 text-amber-800' : 'bg-ninho-nuvem text-ninho-cinza'}`}>
                {est.estado === 'trabalhando' ? 'Trabalhando' : est.estado === 'esperando' ? 'Esperando seu OK' : est.estado === 'desativado' ? 'Desativado' : 'Livre'}
              </span>
              <span className="rounded-pill bg-ninho-roxo-suave px-2.5 py-1 text-ninho-roxo-escuro">{TIPO[sp.p.tipo]}</span>
              {sp.p.agente && <span className="rounded-pill bg-ninho-nuvem px-2.5 py-1 text-ninho-cinza">agente: {sp.p.agente}</span>}
              {sp.p.skills?.map((s) => <span key={s} className="rounded-pill bg-ninho-nuvem px-2.5 py-1 text-ninho-cinza">skill: {s}</span>)}
            </div>
            <div className="rounded-xl bg-ninho-nuvem p-3">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-ninho-cinza">{est.estado === 'trabalhando' ? 'Agora' : 'Última tarefa'}</p>
              <p className="text-sm">{est.agora ?? 'Nada registrado ainda. Entra em ação quando o Valério chamar.'}</p>
            </div>
            {est.historico.length > 0 && (
              <div className="rounded-xl bg-ninho-nuvem p-3">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ninho-cinza">Últimas tarefas</p>
                <ul className="flex flex-col gap-1.5 text-sm">
                  {est.historico.map((h, i) => (
                    <li key={i} className="grid grid-cols-[52px_1fr] gap-2">
                      <time className="tabular-nums text-ninho-cinza">{quando(h.quando)}</time>
                      <span>{h.tarefa}{h.status === 'erro' ? ' (erro)' : ''}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : ss ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-full text-lg font-bold text-white" style={{ background: COR_SETOR[ss.id] }}>{ss.nome[0]}</div>
              <div>
                <p className="font-semibold">{ss.nome}</p>
                <p className="text-xs text-ninho-cinza">{ss.pessoas.length} pessoas{ss.desativado ? ' · desativado' : ''}</p>
              </div>
              <Link href={`/admin/empresa/${ss.id}`} className="ml-auto text-xs font-semibold text-ninho-roxo-escuro hover:underline">Abrir o setor ›</Link>
              <button onClick={() => setSelSetor(null)} className="rounded-pill border border-ninho-borda px-3 py-1 text-xs text-ninho-cinza hover:border-ninho-roxo">Fechar</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {ss.pessoas.map((p) => {
                const e = ss.desativado ? 'desativado' : estados[p.id]?.estado ?? 'livre';
                return (
                  <button key={p.id} onClick={() => setSelPessoa(p.id)} className="rounded-xl border border-ninho-borda px-3 py-1.5 text-left text-sm hover:border-ninho-roxo">
                    {dot(e === 'trabalhando' ? '#4CAF74' : e === 'esperando' ? '#FFB020' : '#B4B2A9')}<b>{p.nome}</b> <span className="text-ninho-cinza">{p.cargo}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          vazio('Clique num setor do prédio para ver quem está lá, ou direto em alguém para ver o que está fazendo.')
        )}
      </div>
      </div>
    </div>
  );
}
