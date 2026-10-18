'use client';

/**
 * O prédio da empresa virtual em planta isométrica (mockup aprovado em
 * 18/10/2026: Ninho-expo/docs/empresa/predio-mockup.html).
 *
 * - Torre à esquerda: um andar por setor; clicar troca o andar.
 * - Planta do andar: sala do supervisor, mesas, copa e reunião. Quem está
 *   trabalhando fica sentado digitando; quem está livre anda pelo andar.
 * - Clicar num bonequinho abre o que ele está fazendo.
 * - Atualiza sozinho: router.refresh() a cada 15s refaz a leitura no servidor.
 */
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { EstadoPessoa, Setor, Pessoa } from '@/lib/empresa';

const COR: Record<string, string> = {
  dir: '#7C5CD6', cre: '#4CAF74', mkt: '#E85D6B', aqu: '#3D8BFF', fin: '#F7A83C',
  ate: '#3FB5AC', eng: '#655C7A', des: '#D98BC9', ven: '#A3A3AC',
};
const TIPO: Record<string, string> = { sup: 'Supervisor', agente: 'Agente', skill: 'Skill', humano: 'Humano', produto: 'Produto' };
const PELE = ['#F1C7A6', '#D9A47E', '#B57A55', '#8A5A3B', '#5E3B26', '#E8B998'];
const CABELO = ['#2B1B10', '#5A3A22', '#A0663A', '#1E1E1E', '#C9A15A', '#6B4A3A'];
const TOK = {
  piso: '#F4EFFB', piso2: '#E9E1F7', parede: '#DCD2F0', parede2: '#C9BEE0', madeira: '#E7D3B8', madeira2: '#CDB08C',
  vidro: 'rgba(159,134,224,.22)', muted: '#6B6F80', ok: '#4CAF74', warn: '#FFB020', roxo: '#9F86E0',
};
const W = 14, D = 10, H = 2.2;
const MESAS: [number, number][] = [[5.4, 2.0], [7.8, 2.0], [10.2, 2.0], [5.4, 4.8], [7.8, 4.8], [10.2, 4.8], [12.2, 3.4]];
const SALA_SUP: [number, number] = [1.0, 1.6];
const PONTOS: [number, number][] = [[2.0, 7.0], [9.6, 6.8], [12.4, 8.6]];

const hsh = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
function shade(hex: string, f: number) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.round((n >> 16) * f)), g = Math.min(255, Math.round(((n >> 8) & 255) * f)), b = Math.min(255, Math.round((n & 255) * f));
  return `rgb(${r},${g},${b})`;
}

interface Boneco {
  p: Pessoa; k: number; mesa: [number, number]; seat: [number, number];
  x: number; y: number; rota: [number, number][]; espera: number; livre: boolean;
  estado: EstadoPessoa['estado']; sk: string; hr: string; longo: boolean; fase: number;
}

function quando(iso: string | null) {
  if (!iso) return '';
  const d = new Date(iso);
  const hoje = new Date().toDateString() === d.toDateString();
  return hoje
    ? d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Dubai' })
    : d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'Asia/Dubai' });
}

export function Predio({
  setores, estados, inicial, comTorre = true,
}: {
  setores: Setor[];
  estados: Record<string, EstadoPessoa>;
  inicial: string;
  comTorre?: boolean;
}) {
  const router = useRouter();
  const [setorId, setSetorId] = useState(inicial);
  const [sel, setSel] = useState<string | null>(null);
  const plantaRef = useRef<HTMLCanvasElement>(null);
  const torreRef = useRef<HTMLCanvasElement>(null);
  const bonecos = useRef<Boneco[]>([]);
  const alvos = useRef<{ id: string; x: number; y: number; r: number }[]>([]);
  const torreAlvos = useRef<{ id: string; y0: number; y1: number }[]>([]);
  const estadosRef = useRef(estados);
  estadosRef.current = estados;

  const setor = setores.find((s) => s.id === setorId) ?? setores[0];

  // atualiza os dados no servidor a cada 15s
  useEffect(() => {
    const t = setInterval(() => router.refresh(), 15_000);
    return () => clearInterval(t);
  }, [router]);

  // monta os bonequinhos quando troca de andar
  useEffect(() => {
    let mi = 0;
    bonecos.current = setor.pessoas.map((p) => {
      const k = hsh(p.nome);
      const mesa = p.tipo === 'sup' ? SALA_SUP : MESAS[mi++ % MESAS.length];
      const seat: [number, number] = [mesa[0] + 0.55, mesa[1] - 0.55];
      const est = estadosRef.current[p.id]?.estado ?? 'livre';
      return {
        p, k, mesa, seat, x: seat[0], y: seat[1], rota: [], espera: 1 + (k % 5), livre: est === 'livre',
        estado: est, sk: PELE[k % PELE.length], hr: CABELO[(k >> 3) % CABELO.length], longo: k % 3 === 0, fase: k % 7,
      };
    });
  }, [setor]);

  // quando os estados mudam (refresh), atualiza sem reposicionar
  useEffect(() => {
    for (const b of bonecos.current) {
      const est = estados[b.p.id]?.estado ?? 'livre';
      b.estado = est;
      b.livre = est === 'livre';
      // quem começou a trabalhar volta para a mesa (se já está nela, fica)
      const naMesa = Math.abs(b.x - b.seat[0]) < 0.05 && Math.abs(b.y - b.seat[1]) < 0.05;
      if (!b.livre && !naMesa) b.rota = [[b.x, 3.4], [b.seat[0], 3.4], b.seat];
    }
  }, [estados]);

  const desenhar = useCallback((t: number, dt: number) => {
    const reduz = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // movimento
    for (const b of bonecos.current) {
      if (b.rota.length) {
        const [tx, ty] = b.rota[0], dx = tx - b.x, dy = ty - b.y, dist = Math.hypot(dx, dy), v = 1.5 * dt;
        if (dist <= v) { b.x = tx; b.y = ty; b.rota.shift(); if (!b.rota.length) b.espera = 2 + Math.random() * 4; }
        else { b.x += (dx / dist) * v; b.y += (dy / dist) * v; }
      } else if (b.livre && !reduz) {
        b.espera -= dt;
        if (b.espera <= 0) {
          const ops = [...PONTOS, b.seat, b.seat];
          const d = ops[Math.floor(Math.random() * ops.length)];
          b.rota = [[b.x, 3.4], [d[0], 3.4], [d[0] + (Math.random() - 0.5) * 0.6, d[1] + (Math.random() - 0.5) * 0.4]];
        }
      }
    }
    const sentado = (b: Boneco) => !b.rota.length && Math.abs(b.x - b.seat[0]) < 0.05 && Math.abs(b.y - b.seat[1]) < 0.05;

    // ---------- planta ----------
    const cv = plantaRef.current;
    if (cv) {
      const ctx = cv.getContext('2d')!;
      const dpr = window.devicePixelRatio || 1, cw = cv.clientWidth, ch = 460;
      if (cv.width !== Math.round(cw * dpr)) { cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr); }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, cw, ch);
      const T = Math.min(cw / (W + D + 1), (ch - 30) / ((W + D) / 2 + H + 0.8));
      const OX = (D + 0.5) * T + (cw - (W + D + 1) * T) / 2, OY = (H + 0.6) * T;
      const P = (x: number, y: number, z = 0): [number, number] => [OX + (x - y) * T, OY + ((x + y) * T) / 2 - z * T];
      const poly = (pts: [number, number][], fill?: string, stroke?: string) => {
        ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath();
        if (fill) { ctx.fillStyle = fill; ctx.fill(); }
        if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke(); }
      };
      const caixa = (x: number, y: number, w: number, d: number, h: number, cor: string, z0 = 0) => {
        poly([P(x, y + d, z0), P(x + w, y + d, z0), P(x + w, y + d, z0 + h), P(x, y + d, z0 + h)], shade(cor, 0.82));
        poly([P(x + w, y, z0), P(x + w, y + d, z0), P(x + w, y + d, z0 + h), P(x + w, y, z0 + h)], shade(cor, 0.7));
        poly([P(x, y, z0 + h), P(x + w, y, z0 + h), P(x + w, y + d, z0 + h), P(x, y + d, z0 + h)], cor);
      };
      const rotulo = (txt: string, x: number, y: number) => {
        const [a, b] = P(x, y, 0); ctx.font = '600 11px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = TOK.muted; ctx.fillText(txt, a, b);
      };
      ctx.globalAlpha = setor.desativado ? 0.55 : 1;
      for (let x = 0; x < W; x++) for (let y = 0; y < D; y++) poly([P(x, y), P(x + 1, y), P(x + 1, y + 1), P(x, y + 1)], (x + y) % 2 ? TOK.piso : TOK.piso2);
      poly([P(0, 0), P(0, D), P(0, D, H), P(0, 0, H)], TOK.parede2);
      poly([P(0, 0), P(W, 0), P(W, 0, H), P(0, 0, H)], TOK.parede);
      for (let i = 0; i < 4; i++) { const x0 = 6 + i * 2; poly([P(x0, 0, 0.9), P(x0 + 1.2, 0, 0.9), P(x0 + 1.2, 0, 1.8), P(x0, 0, 1.8)], 'rgba(160,200,255,.35)'); }
      poly([P(4.6, 0, 0), P(5.6, 0, 0), P(5.6, 0, 1.6), P(4.6, 0, 1.6)], '#9B90B5');
      poly([P(0, 4, 0), P(4, 4, 0), P(4, 4, 1.5), P(0, 4, 1.5)], TOK.vidro, 'rgba(124,92,214,.45)');
      poly([P(4, 0, 0), P(4, 4, 0), P(4, 4, 1.5), P(4, 0, 1.5)], TOK.vidro, 'rgba(124,92,214,.45)');

      const itens: { d: number; f: () => void }[] = [];
      itens.push({ d: 7.9, f: () => { caixa(0.3, 6.6, 2.2, 0.8, 0.9, TOK.madeira2); caixa(0.7, 6.8, 0.3, 0.3, 0.35, '#ffffff', 0.9); } });
      itens.push({ d: 11.5, f: () => { caixa(2.9, 8.6, 0.5, 0.5, 0.5, '#7A9A5B'); caixa(3.0, 8.7, 0.3, 0.3, 0.6, '#5E8A45', 0.5); } });
      itens.push({ d: 15.5, f: () => caixa(8.5, 7, 2.4, 1.3, 0.45, TOK.madeira) });
      for (const b of bonecos.current) {
        const m = b.mesa;
        itens.push({ d: m[0] + m[1] + 0.6, f: () => {
          caixa(m[0], m[1], 1.2, 0.7, 0.45, TOK.madeira);
          caixa(m[0] + 0.35, m[1] + 0.1, 0.5, 0.12, 0.38, '#655C7A', 0.45);
          if (b.estado === 'trabalhando' && sentado(b)) {
            const [a, c] = P(m[0] + 0.6, m[1] + 0.1, 0.66);
            ctx.fillStyle = reduz ? '#BDF0D2' : `rgba(189,240,210,${0.6 + 0.4 * Math.abs(Math.sin(t * 3))})`;
            ctx.beginPath(); ctx.ellipse(a, c, T * 0.18, T * 0.1, 0, 0, Math.PI * 2); ctx.fill();
          }
        } });
      }
      const sobre: (() => void)[] = [];
      alvos.current = [];
      for (const b of bonecos.current) {
        itens.push({ d: b.x + b.y, f: () => {
          const andando = b.rota.length > 0, sit = sentado(b);
          const z0 = (sit ? 0.25 : 0) + (andando ? Math.abs(Math.sin(t * 9 + b.fase)) * 0.12 : 0);
          const [sx, sy] = P(b.x, b.y, 0);
          ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.beginPath(); ctx.ellipse(sx, sy, T * 0.32, T * 0.16, 0, 0, Math.PI * 2); ctx.fill();
          caixa(b.x - 0.18, b.y - 0.18, 0.36, 0.36, 0.75, b.estado === 'desativado' ? '#B4B2A9' : COR[setor.id], z0);
          const [hx, hy] = P(b.x, b.y, z0 + 1.05), r = T * 0.3;
          if (b.longo) { ctx.fillStyle = b.hr; ctx.beginPath(); ctx.ellipse(hx, hy + r * 0.35, r * 1.05, r * 1.15, 0, 0, Math.PI * 2); ctx.fill(); }
          ctx.fillStyle = b.sk; ctx.beginPath(); ctx.arc(hx, hy, r, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = b.hr; ctx.beginPath(); ctx.arc(hx, hy - r * 0.15, r * 1.02, Math.PI * 1.05, Math.PI * 1.95); ctx.fill();
          alvos.current.push({ id: b.p.id, x: hx, y: hy + r, r: T * 0.9 });
          sobre.push(() => {
            let bol: [string, string] | null = null;
            if (b.estado === 'trabalhando' && sit) bol = [TOK.ok, '···'];
            else if (b.estado === 'esperando') bol = [TOK.warn, 'OK?'];
            if (bol) {
              const bx = hx + r * 0.9, by = hy - r * 2.1;
              ctx.globalAlpha = b.estado === 'trabalhando' && !reduz ? 0.75 + 0.25 * Math.sin(t * 5 + b.fase) : 1;
              ctx.fillStyle = bol[0]; ctx.beginPath(); ctx.roundRect(bx - 15, by - 9, 30, 18, 9); ctx.fill();
              ctx.fillStyle = b.estado === 'esperando' ? '#3A2600' : '#fff';
              ctx.font = `700 ${Math.max(10, T * 0.48)}px system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
              ctx.fillText(bol[1], bx, by + 1); ctx.globalAlpha = 1;
            }
            ctx.font = `600 ${Math.max(10, T * 0.5)}px system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
            const wv = ctx.measureText(b.p.nome).width + 10;
            ctx.fillStyle = sel === b.p.id ? TOK.roxo : 'rgba(255,255,255,.9)';
            ctx.beginPath(); ctx.roundRect(sx - wv / 2, sy + T * 0.25, wv, T * 0.75 + 4, 6); ctx.fill();
            ctx.fillStyle = sel === b.p.id ? '#fff' : '#1E1F25'; ctx.fillText(b.p.nome, sx, sy + T * 0.25 + 2);
          });
        } });
      }
      itens.sort((a, b) => a.d - b.d).forEach((i) => i.f());
      rotulo(`Sala de ${setor.pessoas[0]?.nome ?? ''}`, 2.2, 0.3); rotulo('Copa', 1.8, 9.3); rotulo('Reunião', 9.6, 9.3);
      sobre.forEach((f) => f());
      ctx.globalAlpha = 1;
      if (setor.desativado) { ctx.fillStyle = 'rgba(30,31,37,.7)'; ctx.font = '600 16px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('Setor desativado', cw / 2, 40); }
    }

    // ---------- torre ----------
    const tv = torreRef.current;
    if (tv) {
      const ctx = tv.getContext('2d')!;
      const dpr = window.devicePixelRatio || 1, cw = tv.clientWidth, ch = 430;
      if (tv.width !== Math.round(cw * dpr)) { tv.width = Math.round(cw * dpr); tv.height = Math.round(ch * dpr); }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, cw, ch);
      const tw = 2.4, td = 1.6, hf = 1.05, n = setores.length, lab = 86;
      const Tt = Math.min((cw - lab) / (tw + td + 0.4), (ch - 20) / ((tw + td) / 2 + n * hf + 0.5));
      const ox = (td + 0.2) * Tt, oy = ch - ((tw + td) / 2) * Tt - 8;
      const Q = (x: number, y: number, z: number): [number, number] => [ox + (x - y) * Tt, oy + ((x + y) * Tt) / 2 - z * Tt];
      const pq = (pts: [number, number][], c: string) => { ctx.beginPath(); pts.forEach((p, j) => (j ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath(); ctx.fillStyle = c; ctx.fill(); };
      torreAlvos.current = [];
      [...setores].reverse().forEach((s, i) => {
        const z = i * hf, on = s.id === setor.id, cor = s.desativado ? '#B4B2A9' : COR[s.id];
        const top: [number, number][] = [Q(0, 0, z + hf * 0.92), Q(tw, 0, z + hf * 0.92), Q(tw, td, z + hf * 0.92), Q(0, td, z + hf * 0.92)];
        const fl: [number, number][] = [Q(0, td, z), Q(tw, td, z), Q(tw, td, z + hf * 0.92), Q(0, td, z + hf * 0.92)];
        const fr: [number, number][] = [Q(tw, 0, z), Q(tw, td, z), Q(tw, td, z + hf * 0.92), Q(tw, 0, z + hf * 0.92)];
        pq(fl, shade(cor, on ? 0.95 : 0.8)); pq(fr, shade(cor, on ? 0.8 : 0.66)); pq(top, shade(cor, on ? 1.15 : 1));
        const trab = s.pessoas.filter((p) => estadosRef.current[p.id]?.estado === 'trabalhando').length;
        for (let w = 0; w < 3; w++) {
          const lit = w < trab;
          pq([Q(0.2 + w * 0.75, td, z + 0.25), Q(0.65 + w * 0.75, td, z + 0.25), Q(0.65 + w * 0.75, td, z + 0.7), Q(0.2 + w * 0.75, td, z + 0.7)],
            lit ? (reduz ? '#FFE9A8' : `rgba(255,233,168,${0.75 + 0.25 * Math.sin(t * 2 + w + i)})`) : 'rgba(255,255,255,.35)');
        }
        const lx = Q(tw, 0, 0)[0], ly = Q(tw, td / 2, z + hf * 0.45)[1];
        ctx.fillStyle = on ? TOK.roxo : TOK.muted; ctx.font = `${on ? 700 : 500} 12px system-ui, sans-serif`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillText((on ? '› ' : '') + s.nome, lx + 6, ly);
        const ys = [...top, ...fl, ...fr].map((p) => p[1]);
        torreAlvos.current.push({ id: s.id, y0: Math.min(...ys), y1: Math.max(...ys) });
      });
      const zt = n * hf;
      pq([Q(0, 0, zt), Q(tw, 0, zt), Q(tw, td, zt), Q(0, td, zt)], TOK.roxo);
    }
  }, [setor, setores, sel]);

  useEffect(() => {
    let raf = 0, last = performance.now();
    const loop = (now: number) => { const dt = Math.min(0.05, (now - last) / 1000); last = now; desenhar(now / 1000, dt); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [desenhar]);

  function cliquePlanta(e: React.MouseEvent<HTMLCanvasElement>) {
    const r = e.currentTarget.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    let best: string | null = null, bd = 1e9;
    for (const a of alvos.current) { const d = Math.hypot(a.x - x, a.y - y); if (d < a.r && d < bd) { bd = d; best = a.id; } }
    if (best) setSel(best);
  }
  function cliqueTorre(e: React.MouseEvent<HTMLCanvasElement>) {
    const y = e.clientY - e.currentTarget.getBoundingClientRect().top;
    const lista = torreAlvos.current;
    const hit = lista.filter((a) => y >= a.y0 && y <= a.y1).sort((a, b) => a.y1 - a.y0 - (b.y1 - b.y0))[0]
      ?? lista.reduce((m, a) => (Math.abs((a.y0 + a.y1) / 2 - y) < Math.abs((m.y0 + m.y1) / 2 - y) ? a : m), lista[0]);
    if (hit) { setSetorId(hit.id); setSel(null); }
  }

  const pessoaSel = setor.pessoas.find((p) => p.id === sel);
  const est = pessoaSel ? estados[pessoaSel.id] : null;

  return (
    <div className="flex flex-col gap-4">
      <div className={`grid gap-4 ${comTorre ? 'md:grid-cols-[210px_minmax(0,1fr)]' : ''}`}>
        {comTorre && (
          <div className="rounded-2xl border border-ninho-borda bg-white p-3">
            <p className="mb-2 px-1 text-sm font-semibold">Torre</p>
            <canvas ref={torreRef} height={430} onClick={cliqueTorre} className="block w-full cursor-pointer" aria-label="Torre do prédio: clique num andar" />
          </div>
        )}
        <div className="min-w-0 rounded-2xl border border-ninho-borda bg-white p-3">
          <div className="mb-2 flex flex-wrap items-baseline gap-2 px-1">
            <p className="text-sm font-semibold">{setor.nome}</p>
            <span className="text-xs text-ninho-cinza">{setor.andar} andar{setor.desativado ? ' · desativado' : ''} · {setor.pessoas.length} pessoas</span>
            {comTorre && (
              <Link href={`/admin/empresa/${setor.id}`} className="ml-auto text-xs font-semibold text-ninho-roxo-escuro hover:underline">
                Abrir o setor ›
              </Link>
            )}
          </div>
          <canvas ref={plantaRef} height={460} onClick={cliquePlanta} className="block w-full" aria-label={`Planta do andar ${setor.nome}`} />
          <div className="flex flex-wrap gap-4 px-1 pt-2 text-xs text-ninho-cinza">
            <span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-[#4CAF74]" />Trabalhando</span>
            <span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-[#FFB020]" />Esperando seu OK</span>
            <span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-[#B4B2A9]" />Livre (andando)</span>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-ninho-borda bg-white p-4">
        {!pessoaSel || !est ? (
          <p className="text-sm text-ninho-cinza">Clique em alguém na planta para ver o que está fazendo agora e as últimas tarefas.</p>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-full text-lg font-bold text-white" style={{ background: COR[setor.id] }}>{pessoaSel.nome[0]}</div>
              <div>
                <p className="font-semibold">{pessoaSel.nome}</p>
                <p className="text-xs text-ninho-cinza">{pessoaSel.cargo} · {setor.nome}</p>
              </div>
              <button onClick={() => setSel(null)} className="ml-auto rounded-pill border border-ninho-borda px-3 py-1 text-xs text-ninho-cinza hover:border-ninho-roxo">Fechar</button>
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-semibold">
              <span className={`rounded-pill px-2.5 py-1 ${est.estado === 'trabalhando' ? 'bg-green-50 text-green-700' : est.estado === 'esperando' ? 'bg-amber-50 text-amber-800' : 'bg-ninho-nuvem text-ninho-cinza'}`}>
                {est.estado === 'trabalhando' ? 'Trabalhando' : est.estado === 'esperando' ? 'Esperando seu OK' : est.estado === 'desativado' ? 'Desativado' : 'Livre'}
              </span>
              <span className="rounded-pill bg-ninho-roxo-suave px-2.5 py-1 text-ninho-roxo-escuro">{TIPO[pessoaSel.tipo]}</span>
              {pessoaSel.agente && <span className="rounded-pill bg-ninho-nuvem px-2.5 py-1 text-ninho-cinza">agente: {pessoaSel.agente}</span>}
              {pessoaSel.skills?.map((s) => <span key={s} className="rounded-pill bg-ninho-nuvem px-2.5 py-1 text-ninho-cinza">skill: {s}</span>)}
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
        )}
      </div>
    </div>
  );
}
