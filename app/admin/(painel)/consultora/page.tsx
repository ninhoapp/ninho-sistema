import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireSessionAtiva } from '@/lib/auth/guard';
import { appDb } from '@/lib/supabase/server';
import { SITE_URL } from '@/lib/config';
import { PRECOS } from '@/lib/precos';
import {
  consultoraDoPerfil,
  familiasDa,
  fichaDe,
  baseComissoes,
  eventosDosLinks,
  funilDaConsultora,
  ultimosMesesFunil,
  pedidosVinculoDa,
  montarGanhos,
  rotinaDe,
  type Consultora,
  type FamiliaDaConsultora,
  type Ficha,
} from '@/lib/consultoras';
import { TelefonePais } from '@/components/TelefonePais';
import { FunilTabela } from '@/components/consultoras/Funil';
import { mesNoPainel } from '@/lib/dashboard-charts';
import { telefoneLegivel } from '@/lib/telefone';
import {
  PCT_DIRETO,
  PCT_REDE,
  PARCELAS_MENSAL,
  dataBr,
  nomeCompetencia,
  nomeMes,
  prazoPix,
  somar,
  valorComissao,
  TEXTO_QUEM_GERA_COMISSAO,
  ACEITE_VINCULO_CONSULTORA_TEXTO,
  COMO_SOUBE_OPCOES,
} from '@/lib/consultoras-regras';
import {
  descreverRegistro,
  diaLocalDe,
  dur,
  hora,
  idadeMeses,
  inicioDoDia,
  resumoDoDia,
  somarDias,
  FUSO_MS,
  type ResumoDia,
} from '@/lib/consultoras-rotina';
import { Avatar, Aviso, Card, Kpi, Retorno, Selo, botao, brl, campo, rotuloCampo, td, th } from '@/components/consultoras/ui';
import { CopyLink } from '@/components/admin/CopyLink';
import { convidarFamilia, enviarFoto, indicarConsultora, responderPedidoFamilia, salvarFicha, salvarPerfil } from './actions';

export const dynamic = 'force-dynamic';

const BASE = '/admin/consultora';
const H = 3600 * 1000;
const pctTxt = (p: number) => `${String(p).replace('.', ',')}%`;
const primeiro = (n: string | null) => (n || '').split(' ')[0];

type Busca = { ficha?: string; aba?: string; bebe?: string; dia?: string; mes?: string; filtro?: string; q?: string; ok?: string; erro?: string };

/**
 * Área da CONSULTORA (role consultora). Desenho e comportamento:
 * Ninho-expo/docs/design/consultora/painel.html (visão da consultora).
 * Mesmos dados do app: famílias e rotina vêm de _consultora_familias e
 * _consultora_rotina, que já cortam o acesso se ela está pausada, sem vínculo
 * ou se a família está sem plano.
 */
export default async function ConsultoraPage({ searchParams }: { searchParams: Busca }) {
  const s = await requireSessionAtiva('consultora');
  const c = await consultoraDoPerfil(s.sub);
  if (!c) redirect('/admin/login?porta=consultora');
  const aba = searchParams.aba || 'familias';
  const pausada = c.estado === 'pausada';

  let corpo: React.ReactNode;
  if (aba === 'rotina' || aba === 'semana') corpo = await Rotina({ c, sp: searchParams, semana: aba === 'semana' });
  else if (aba === 'convidar') corpo = await Convidar({ c });
  else if (aba === 'ganhos') corpo = await Ganhos({ c, mes: searchParams.mes });
  else if (aba === 'indicar') corpo = await Indicar({ c });
  else if (aba === 'perfil') corpo = await Perfil({ c });
  else corpo = await Familias({ c, sp: searchParams });

  return (
    <>
      <div className="mb-4 flex items-center gap-3 rounded-2xl bg-white p-3">
        <Avatar id={c.id} nome={c.nome} foto={c.foto_url} tamanho={40} />
        <div className="flex-1 leading-tight">
          <b className="text-[14px]">{c.nome}</b>
          <p className="text-[12px] text-ninho-cinza">Consultora independente · código {c.codigo}</p>
        </div>
        <span className="rounded-pill bg-[#E7F5EC] px-3 py-1 text-[11.5px] font-extrabold text-[#2F8A55]">Mesmos dados do app</span>
      </div>
      {pausada && (
        <Aviso tom="vermelho">
          Sua conta de consultora está pausada pelo Ninho. Você não vê a rotina das famílias até ser reativada. A
          comissão das famílias que já assinam continua.
        </Aviso>
      )}
      <div className="mt-4">
        <Retorno ok={searchParams.ok} erro={searchParams.erro} />
        {corpo}
      </div>
    </>
  );
}

function Titulo({ t, sub, direita }: { t: React.ReactNode; sub?: React.ReactNode; direita?: React.ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-[#24164F]">{t}</h1>
        {sub && <p className="mt-1 text-sm text-ninho-cinza">{sub}</p>}
      </div>
      {direita}
    </div>
  );
}

function hojeSP(): string {
  return diaLocalDe(Date.now());
}

function idadeTxt(nasc: string | null): string {
  const m = idadeMeses(nasc, hojeSP());
  if (m === null) return '';
  if (m < 0) return 'ainda não nasceu';
  if (m === 0) return 'menos de 1 mês';
  return `${m} ${m === 1 ? 'mês' : 'meses'}`;
}

function desdeTxt(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit' });
}

function SeloAgora({ f }: { f: FamiliaDaConsultora }) {
  if (!f.plano_ok) return <Selo cor="cinza">Família sem plano</Selo>;
  if (f.dormindo_desde) return <Selo cor="noite">Dormindo · {dur((Date.now() - new Date(f.dormindo_desde).getTime()) / 60000)}</Selo>;
  if (!f.ultimo_registro_em) return <Selo cor="vermelho">Sem registro</Selo>;
  const h = (Date.now() - new Date(f.ultimo_registro_em).getTime()) / H;
  if (h >= 12) return <Selo cor="vermelho">Sem registro há {Math.floor(h)}h</Selo>;
  return <Selo cor="ambar">Último registro às {hora(new Date(f.ultimo_registro_em).getTime())}</Selo>;
}

// ── Famílias ──────────────────────────────────────────────
async function Familias({ c, sp }: { c: Consultora; sp: Busca }) {
  const [todas, pv] = await Promise.all([
    c.estado === 'ativa' ? familiasDa(c.id) : Promise.resolve([] as FamiliaDaConsultora[]),
    c.estado === 'ativa' ? pedidosVinculoDa(c.id) : Promise.resolve({ pedidos: [], indisponivel: false }),
  ]);
  const semReg = (f: FamiliaDaConsultora) => f.plano_ok && !f.dormindo_desde && (!f.ultimo_registro_em || Date.now() - new Date(f.ultimo_registro_em).getTime() >= 12 * H);
  const filtro = sp.filtro || 'todas';
  const q = (sp.q || '').trim().toLowerCase();
  let fs = todas;
  if (filtro === 'dorme') fs = fs.filter((f) => f.plano_ok && f.dormindo_desde);
  if (filtro === 'semreg') fs = fs.filter(semReg);
  if (filtro === 'semplano') fs = fs.filter((f) => !f.plano_ok);
  if (q) fs = fs.filter((f) => `${f.bebe_nome ?? ''} ${f.mae_nome ?? ''}`.toLowerCase().includes(q));
  const atencao = todas.filter(semReg);
  const chip = (k: string, t: string) => (
    <Link key={k} href={`${BASE}?aba=familias&filtro=${k}${q ? `&q=${encodeURIComponent(q)}` : ''}`} className={`rounded-pill px-3 py-1.5 text-xs font-bold ${filtro === k ? 'bg-[#24164F] text-white' : 'bg-white text-ninho-cinza shadow-[inset_0_0_0_1.5px_#ECE6F5]'}`}>{t}</Link>
  );
  return (
    <>
      <Titulo
        t="Suas famílias"
        sub={`${todas.length} família${todas.length === 1 ? '' : 's'} compartilha${todas.length === 1 ? '' : 'm'} a rotina com você`}
        direita={
          <form className="flex h-10 items-center gap-2 rounded-pill bg-white px-4 shadow-[inset_0_0_0_1.5px_#ECE6F5]">
            <input type="hidden" name="aba" value="familias" />
            <input type="hidden" name="filtro" value={filtro} />
            <input name="q" defaultValue={sp.q} placeholder="Buscar bebê ou mãe" className="w-48 bg-transparent text-[13.5px] outline-none" />
          </form>
        }
      />
      {pv.pedidos.length > 0 && (
        <Card titulo="Pedidos de famílias" direita={`${pv.pedidos.length} esperando você`} className="mb-4">
          <p className="text-[12.5px] text-ninho-cinza">
            A família digitou seu código e já aceitou compartilhar a rotina. A rotina só aparece para você depois que
            você aprovar.
          </p>
          {pv.pedidos.map((p) => (
            <div key={p.id} className="mt-3 rounded-2xl bg-[#F3EEFC] px-4 py-3">
              <p className="text-[13.5px]">
                <b>{p.responsavel_nome ?? 'Uma família'}</b>
                {p.bebe_nome ? <> quer compartilhar a rotina de <b>{p.bebe_nome}</b></> : ' quer compartilhar a rotina do bebê'}
                <span className="text-ninho-cinza"> · {desdeTxt(p.criado_em)}</span>
              </p>
              <details className="mt-2">
                <summary className="cursor-pointer text-[13px] font-bold text-[#7C5CD6]">Aprovar</summary>
                <form action={responderPedidoFamilia} className="mt-2 rounded-xl bg-white p-3">
                  <input type="hidden" name="pedido" value={p.id} />
                  <label className="flex items-start gap-2.5 text-[13px] leading-relaxed">
                    <input type="checkbox" name="aceite" required className="mt-1 h-4 w-4 shrink-0 accent-[#4CAF74]" />
                    <span>{ACEITE_VINCULO_CONSULTORA_TEXTO}</span>
                  </label>
                  <button name="decisao" value="aprovar" className={`${botao.verde} mt-3`}>Aprovar e ver a rotina</button>
                </form>
              </details>
              <form action={responderPedidoFamilia} className="mt-2">
                <input type="hidden" name="pedido" value={p.id} />
                <button name="decisao" value="recusar" className={botao.cinza}>Recusar</button>
              </form>
            </div>
          ))}
        </Card>
      )}
      {atencao.length > 0 && (
        <Card titulo="Precisa de atenção hoje" className="mb-4">
          {atencao.map((f) => (
            <Link key={f.baby_id} href={`${BASE}?aba=rotina&bebe=${f.baby_id}`} className="mt-2 flex items-center gap-3 rounded-2xl bg-[#FFF8EC] px-3 py-2.5">
              <div className="flex-1">
                <p className="text-[13.5px] font-extrabold">{f.bebe_nome} · sem registro {f.ultimo_registro_em ? `desde ${desdeTxt(f.ultimo_registro_em)}, ${hora(new Date(f.ultimo_registro_em).getTime())}` : 'ainda'}</p>
                <p className="text-xs text-ninho-cinza">Mãe: {f.mae_nome ?? '—'}</p>
              </div>
              <span className="text-[#BDB8CC]">›</span>
            </Link>
          ))}
        </Card>
      )}
      <Card titulo={<div className="flex flex-wrap gap-1.5">{chip('todas', 'Todas')}{chip('dorme', 'Dormindo agora')}{chip('semreg', 'Sem registro')}{chip('semplano', 'Sem plano')}</div>} direita={`${fs.length} de ${todas.length}`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr><th className={th}>Bebê</th><th className={th}>Mãe</th><th className={th}>Agora</th><th className={th}>Com você desde</th><th className={th} /></tr></thead>
            <tbody>
              {fs.map((f) => (
                <tr key={f.baby_id} className="hover:bg-[#FAF8FE]">
                  <td className={td}>
                    <Link href={`${BASE}?aba=rotina&bebe=${f.baby_id}`} className="flex items-center gap-2.5">
                      <Avatar id={f.baby_id} nome={f.bebe_nome} tamanho={34} />
                      <span><b>{f.bebe_nome}</b><small className="block text-[11.5px] text-ninho-cinza">{idadeTxt(f.nascimento)}</small></span>
                    </Link>
                  </td>
                  <td className={td}>{f.mae_nome ?? '—'}</td>
                  <td className={td}><SeloAgora f={f} /></td>
                  <td className={td}>{desdeTxt(f.vinculado_em)}</td>
                  <td className={td}><Link href={`${BASE}?aba=rotina&bebe=${f.baby_id}`} className="text-[#BDB8CC]">›</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
          {fs.length === 0 && (
            <p className="py-6 text-center text-sm text-ninho-cinza">
              {todas.length === 0 ? (c.estado === 'ativa' ? 'Nenhuma família ainda. Mande seu link em Convidar família.' : 'Sem famílias para mostrar.') : 'Nenhuma família com esse filtro.'}
            </p>
          )}
        </div>
      </Card>
      {fs.length > 0 && <Fichas c={c} familias={fs} aberta={sp.ficha} />}
    </>
  );
}

// ── Fichas (anotações da consultora sobre cada família, 00111) ──
async function Fichas({ c, familias, aberta }: { c: Consultora; familias: FamiliaDaConsultora[]; aberta?: string }) {
  const lista = familias.slice(0, 60);
  const fichas = await Promise.all(lista.map((f) => fichaDe(c.id, f.baby_id)));
  if (fichas.some((x) => x.indisponivel)) {
    return (
      <Card titulo="Fichas das famílias" className="mt-4">
        <p className="py-4 text-center text-sm text-ninho-cinza">As fichas ainda não estão disponíveis. Assim que o Ninho liberar, aparecem aqui.</p>
      </Card>
    );
  }
  const dataBrOuVazio = (d: string | null) => (d ? dataBr(d) : null);
  return (
    <Card titulo="Fichas das famílias" direita="Só você vê estas anotações." className="mt-4">
      {lista.map((f, i) => {
        const fi: Ficha | null = fichas[i].ficha;
        const encontros = fi?.encontros_total ? `${fi.encontros_feitos ?? 0} de ${fi.encontros_total} encontros` : fi?.encontros_feitos ? `${fi.encontros_feitos} encontros feitos` : null;
        return (
          <details key={f.baby_id} id={`ficha-${f.baby_id}`} open={aberta === f.baby_id} className="mt-2 rounded-2xl bg-[#F8F6FC] px-4 py-3">
            <summary className="flex cursor-pointer flex-wrap items-center gap-x-3 gap-y-1 text-[13.5px]">
              <b>{f.bebe_nome}{fi?.bebe_apelido ? ` (${fi.bebe_apelido})` : ''}</b>
              <span className="text-ninho-cinza">{fi?.pais_nomes || f.mae_nome || '—'}</span>
              {fi?.inicio && <Selo cor="lilas">desde {dataBrOuVazio(fi.inicio)}</Selo>}
              {encontros && <Selo cor="verde">{encontros}</Selo>}
              {fi?.whatsapp && <span className="text-xs text-ninho-cinza">{telefoneLegivel(fi.whatsapp)}</span>}
              {!fi && <span className="text-xs text-[#9A95AD]">sem ficha ainda</span>}
            </summary>
            <form action={salvarFicha} className="mt-3">
              <input type="hidden" name="baby" value={f.baby_id} />
              <div className="grid gap-2 sm:grid-cols-3">
                <div><label className={rotuloCampo}>Início da consultoria</label><input type="date" name="inicio" defaultValue={fi?.inicio ?? ''} className={campo} /></div>
                <div><label className={rotuloCampo}>Encontros feitos</label><input type="number" min={0} max={999} name="encontros_feitos" defaultValue={fi?.encontros_feitos ?? ''} className={campo} /></div>
                <div><label className={rotuloCampo}>Encontros combinados</label><input type="number" min={0} max={999} name="encontros_total" defaultValue={fi?.encontros_total ?? ''} className={campo} /></div>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div><label className={rotuloCampo}>Nomes dos pais</label><input name="pais_nomes" maxLength={120} defaultValue={fi?.pais_nomes ?? ''} className={campo} /></div>
                <div><label className={rotuloCampo}>Como você chama o bebê</label><input name="bebe_apelido" maxLength={60} defaultValue={fi?.bebe_apelido ?? ''} className={campo} /></div>
              </div>
              <label className={rotuloCampo}>WhatsApp da família</label>
              <TelefonePais name="whatsapp" valor={fi?.whatsapp} classeSelect={campo} classeInput={campo} />
              <label className={rotuloCampo}>Observações</label>
              <textarea name="observacoes" maxLength={2000} rows={3} defaultValue={fi?.observacoes ?? ''} className={`${campo} h-auto py-2`} />
              <small className="mt-1 block text-[11.5px] text-ninho-cinza">Anote só o que precisa para o atendimento. Não registre diagnóstico, remédio nem dado de saúde.</small>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <button className={botao.suave}>Salvar ficha</button>
                <span className="text-[11.5px] text-ninho-cinza">
                  Só você vê estas anotações. A família não vê, e elas somem se a família tirar o seu acesso.
                  {fi?.atualizado_em ? ` Salva em ${new Date(fi.atualizado_em).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}.` : ''}
                </span>
              </div>
            </form>
          </details>
        );
      })}
    </Card>
  );
}

// ── Rotina e semana ───────────────────────────────────────
function Barra24({ r, hoje }: { r: ResumoDia; hoje: boolean }) {
  const ini = inicioDoDia(r.dia);
  const pos = (t: number) => `${((t - ini) / (24 * H)) * 100}%`;
  const cor = { noite: '#3B2C78', soneca: '#9F86E0', andamento: 'repeating-linear-gradient(45deg,#9F86E0,#9F86E0 6px,#B9A6EC 6px,#B9A6EC 12px)' };
  return (
    <>
      <div className="relative mt-4 h-[30px] overflow-hidden rounded-[10px] bg-[#F4F0FC]">
        {r.blocos.map((b, i) => (
          <i key={i} className="absolute bottom-0 top-0 rounded-md" style={{ left: pos(b.a), width: `${((b.b - b.a) / (24 * H)) * 100}%`, background: cor[b.tipo] }} />
        ))}
        {r.marcas.filter((m) => m.tipo === 'mamada').map((m, i) => (
          <i key={`m${i}`} className="absolute bottom-[9px] top-[9px] w-1 rounded bg-[#E8607E]" style={{ left: pos(m.t) }} />
        ))}
        {hoje && <i className="absolute bottom-0 top-0 w-0.5 bg-[#E85D5D]" style={{ left: pos(Date.now()) }} />}
      </div>
      <div className="mt-1 flex justify-between text-[10.5px] font-semibold tabular-nums text-[#9A95AD]">
        {[0, 3, 6, 9, 12, 15, 18, 21, 24].map((h) => <span key={h}>{h}h</span>)}
      </div>
      <div className="mt-2 flex flex-wrap gap-3.5 text-[11.5px] font-semibold text-ninho-cinza">
        <span><i className="mr-1.5 inline-block h-2.5 w-2.5 rounded-sm bg-[#3B2C78]" />Noite</span>
        <span><i className="mr-1.5 inline-block h-2.5 w-2.5 rounded-sm bg-[#9F86E0]" />Soneca</span>
        <span><i className="mr-1.5 inline-block h-2.5 w-2.5 rounded-sm bg-[#E8607E]" />Mamada</span>
        {hoje && <span><i className="mr-1.5 inline-block h-2.5 w-2.5 rounded-sm bg-[#E85D5D]" />Agora</span>}
      </div>
    </>
  );
}

const minDoDia = (t: number) => {
  const d = new Date(t + FUSO_MS);
  return d.getUTCHours() * 60 + d.getUTCMinutes();
};
const hhmm = (min: number) => {
  const m = ((Math.round(min) % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
};
const media = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

function diaRotulo(dia: string): string {
  const hoje = hojeSP();
  if (dia === hoje) return 'Hoje';
  if (dia === somarDias(hoje, -1)) return 'Ontem';
  const d = new Date(`${dia}T12:00:00Z`);
  const sem = d.toLocaleDateString('pt-BR', { weekday: 'short', timeZone: 'UTC' }).replace('.', '');
  return `${sem.charAt(0).toUpperCase()}${sem.slice(1)}, ${d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', timeZone: 'UTC' }).replace('.', '')}`;
}

async function Rotina({ c, sp, semana }: { c: Consultora; sp: Busca; semana: boolean }) {
  const fams = c.estado === 'ativa' ? await familiasDa(c.id) : [];
  const f = fams.find((x) => x.baby_id === sp.bebe) ?? fams[0];
  const aba = semana ? 'semana' : 'rotina';
  if (!f) {
    return (
      <>
        <Titulo t={semana ? 'Semana' : 'Rotina do bebê'} />
        <Card><p className="py-8 text-center text-sm text-ninho-cinza">{c.estado === 'pausada' ? 'Conta pausada: a rotina volta quando o Ninho reativar.' : 'Nenhuma família ainda.'}</p></Card>
      </>
    );
  }
  const seletor = (
    <form className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="aba" value={aba} />
      <select name="bebe" defaultValue={f.baby_id} className="h-10 rounded-pill bg-white px-4 text-sm font-bold shadow-[inset_0_0_0_1.5px_#ECE6F5]">
        {fams.map((x) => <option key={x.baby_id} value={x.baby_id}>{x.bebe_nome} · {x.mae_nome ?? '—'}</option>)}
      </select>
      <button className={botao.suave}>Abrir</button>
    </form>
  );
  const sub = `Mãe: ${f.mae_nome ?? '—'} · com você desde ${desdeTxt(f.vinculado_em)}${idadeTxt(f.nascimento) ? ` · ${idadeTxt(f.nascimento)}` : ''}`;
  const trava = (msg: React.ReactNode) => (
    <Card><div className="flex flex-col items-center px-5 py-10 text-center text-[13.5px] leading-relaxed text-ninho-cinza">{msg}</div></Card>
  );
  if (!f.plano_ok) {
    return (
      <>
        <Titulo t={f.bebe_nome} sub={sub} direita={seletor} />
        {trava(<><b className="text-ninho-grafite">A família da {primeiro(f.mae_nome)} está sem plano</b>O teste grátis acabou e ela não assinou. A rotina volta a aparecer quando ela assinar o Básico ou o Premium.</>)}
      </>
    );
  }

  const agora = Date.now();
  const hoje = hojeSP();

  if (!semana) {
    const dia = sp.dia && /^\d{4}-\d{2}-\d{2}$/.test(sp.dia) && sp.dia <= hoje && sp.dia >= somarDias(hoje, -30) ? sp.dia : hoje;
    const de = new Date(inicioDoDia(dia) - 12 * H);
    const ate = new Date(Math.min(inicioDoDia(dia) + 36 * H, agora + 60_000));
    const { registros, semAcesso } = await rotinaDe(c.id, f.baby_id, de, ate);
    const nav = (
      <div className="flex items-center gap-2 rounded-pill bg-white p-1 shadow-[inset_0_0_0_1.5px_#ECE6F5]">
        {dia > somarDias(hoje, -30) ? <Link href={`${BASE}?aba=rotina&bebe=${f.baby_id}&dia=${somarDias(dia, -1)}`} className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F3EEFC] text-[#7C5CD6]">‹</Link> : <span className="h-8 w-8" />}
        <b className="min-w-[150px] text-center text-[13.5px]">{diaRotulo(dia)}</b>
        {dia < hoje ? <Link href={`${BASE}?aba=rotina&bebe=${f.baby_id}&dia=${somarDias(dia, 1)}`} className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F3EEFC] text-[#7C5CD6]">›</Link> : <span className="h-8 w-8" />}
      </div>
    );
    const head = <Titulo t={<>{f.bebe_nome}</>} sub={sub} direita={<div className="flex flex-wrap items-center gap-2">{seletor}{nav}</div>} />;
    if (semAcesso) return <>{head}{trava('Sem acesso à rotina deste bebê agora (vínculo removido, família sem plano ou conta pausada).')}</>;
    const r = resumoDoDia(registros, dia, agora);
    if (!r.temRegistro) return <>{head}{trava(<><b className="text-ninho-grafite">Nada registrado neste dia</b>Sem registro, sem número.</>)}</>;
    const n = r.noiteAnterior;
    const caixa = (k: string, v: React.ReactNode, s?: React.ReactNode, alerta = false) => (
      <div className="rounded-2xl bg-[#F7F4FD] p-3">
        <p className="text-[11.5px] font-bold text-[#9A95AD]">{k}</p>
        <p className="mt-0.5 text-[22px] font-black tabular-nums tracking-tight">{v}</p>
        {s && <p className={`text-[11.5px] ${alerta ? 'font-extrabold text-[#E85D5D]' : 'text-ninho-cinza'}`}>{s}</p>}
      </div>
    );
    return (
      <>
        {head}
        <div className="grid gap-4 lg:grid-cols-[1.25fr_1fr]">
          <Card titulo={dia === hoje ? 'Hoje até agora' : 'O dia'}>
            <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {caixa('Acordou de manhã', r.acordou ? hora(r.acordou) : '—', n.dormiu ? `dormiu ${hora(n.dormiu)} na véspera` : undefined)}
              {caixa('Noite', n.totalMin !== null ? dur(n.totalMin) : '—', n.despertares !== null ? `${n.despertares} despertar${n.despertares === 1 ? '' : 'es'}` : undefined, (n.despertares ?? 0) >= 4)}
              {caixa('1º despertar', n.primeiroTrechoMin !== null ? dur(n.primeiroTrechoMin) : '—', 'de sono seguido')}
              {caixa('Dormiu à noite', r.noite.dormiu ? hora(r.noite.dormiu) : '—', r.noite.dormiu ? undefined : dia === hoje ? 'ainda não' : 'sem registro')}
              {caixa('Sonecas', r.sonecas.length, r.sonecas.length ? `${dur(r.sonecasMin)} somadas` : undefined)}
              {caixa('Mamadas', r.mamadas, r.ml ? `${r.ml} ml na mamadeira` : undefined)}
              {caixa('Fraldas', r.fraldas, 'trocas')}
              {caixa('Comida', r.comidas, 'registros')}
            </div>
            <Barra24 r={r} hoje={dia === hoje} />
            {(r.sonecas.length > 0 || r.janelas.length > 0) && (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.09em] text-[#9A95AD]">Sonecas</p>
                  {r.sonecas.map((x, i) => (
                    <p key={i} className="flex justify-between border-b border-[#F3F0F8] py-1.5 text-[13px] tabular-nums">
                      <span>{i + 1}ª · {hora(x.a)}{x.emAndamento ? ' · agora' : ` – ${hora(x.b)}`}</span><b>{dur(x.min)}</b>
                    </p>
                  ))}
                  {r.sonecas.length === 0 && <p className="py-1.5 text-[13px] text-ninho-cinza">Nenhuma registrada.</p>}
                </div>
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.09em] text-[#9A95AD]">Janelas acordado</p>
                  {r.janelas.map((j, i) => (
                    <p key={i} className="flex justify-between border-b border-[#F3F0F8] py-1.5 text-[13px] tabular-nums">
                      <span>{j.rotulo}</span><b>{dur(j.min)}</b>
                    </p>
                  ))}
                  {r.janelas.length === 0 && <p className="py-1.5 text-[13px] text-ninho-cinza">Faltam registros para calcular.</p>}
                </div>
              </div>
            )}
          </Card>
          <Card titulo="Registros" direita={`${r.registros.length}`}>
            <div className="max-h-[440px] overflow-auto">
              {r.registros.map((reg) => {
                const d = descreverRegistro(reg, agora);
                return (
                  <div key={reg.id} className="flex items-center gap-3 border-b border-[#F3F0F8] py-2.5 last:border-0">
                    <span className="h-9 w-9 shrink-0 rounded-full" style={{ background: `${d.cor}33`, boxShadow: `inset 0 0 0 3px ${d.cor}` }} />
                    <div className="flex-1">
                      <p className="text-sm font-bold">{d.titulo}</p>
                      <p className="text-xs tabular-nums text-ninho-cinza">{d.detalhe}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[13px] font-extrabold tabular-nums">{hora(new Date(reg.inicio).getTime())}</p>
                      <p className="text-[11px] text-ninho-cinza">{reg.registrado_por ?? ''}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="mt-2.5 text-[11.5px] font-semibold text-[#9A95AD]">Só leitura. Fotos, momentos e chat ficam com a família. Horário de Brasília.</p>
          </Card>
        </div>
      </>
    );
  }

  // Semana: últimos 7 dias (hoje até agora + 6 dias completos).
  const dias = Array.from({ length: 7 }, (_, i) => somarDias(hoje, i - 6));
  const de = new Date(inicioDoDia(dias[0]) - 12 * H);
  const { registros, semAcesso } = await rotinaDe(c.id, f.baby_id, de, new Date(agora + 60_000));
  const head = <Titulo t={`Semana de ${f.bebe_nome}`} sub="Sono dos últimos 7 dias. Bom para levar à conversa com a família." direita={seletor} />;
  if (semAcesso) return <>{head}{trava('Sem acesso à rotina deste bebê agora.')}</>;
  const rs = dias.map((d) => resumoDoDia(registros, d, agora));
  const completos = rs.filter((r) => r.dia !== hoje && r.temRegistro);
  const acordou = media(completos.filter((r) => r.acordou).map((r) => minDoDia(r.acordou!)));
  const dormiu = media(completos.filter((r) => r.noite.dormiu).map((r) => { const m = minDoDia(r.noite.dormiu!); return m < 12 * 60 ? m + 1440 : m; }));
  const sonecasDia = media(completos.map((r) => r.sonecas.length));
  const sonecasMin = media(completos.filter((r) => r.sonecas.length).map((r) => r.sonecasMin));
  const janelas = media(completos.flatMap((r) => r.janelas.map((j) => j.min)));
  const primeiroTrecho = media(completos.map((r) => r.noite.primeiroTrechoMin).filter((x): x is number => x !== null));
  const despert = media(completos.map((r) => r.noite.despertares).filter((x): x is number => x !== null));
  // Noites completas (que começaram nos 6 dias anteriores), as de sono seguido mais longo primeiro.
  const noites = completos
    .map((r) => r.noite)
    .filter((n) => n.dormiu !== null && n.primeiroTrechoMin !== null && n.acordou !== null)
    .sort((a, b) => b.primeiroTrechoMin! - a.primeiroTrechoMin! || (a.despertares ?? 0) - (b.despertares ?? 0))
    .slice(0, 3);
  const totais = rs.map((r) => ({ r, noite: r.noiteAnterior.totalMin ?? 0, son: r.sonecasMin }));
  const mx = Math.max(...totais.map((t) => t.noite + t.son), 1);
  const vazio = (v: number | null, f2: (x: number) => string) => (v === null ? '—' : f2(v));
  return (
    <>
      {head}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi rotulo="Acordou de manhã (média)" valor={vazio(acordou, hhmm)} sub="dias completos" />
        <Kpi rotulo="Dormiu à noite (média)" valor={vazio(dormiu, hhmm)} sub="hora de dormir" />
        <Kpi rotulo="Sonecas por dia" valor={vazio(sonecasDia, (x) => x.toFixed(1).replace('.', ','))} sub={sonecasMin !== null ? `${dur(sonecasMin)} somadas por dia` : undefined} />
        <Kpi rotulo="Janela acordado (média)" valor={vazio(janelas, dur)} sub="entre acordar, sonecas e noite" />
        <Kpi rotulo="Até o 1º despertar (média)" valor={vazio(primeiroTrecho, dur)} sub="sono seguido no começo da noite" />
        <Kpi rotulo="Despertares por noite" valor={vazio(despert, (x) => x.toFixed(1).replace('.', ','))} />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card titulo="Sono por dia" direita="noite (que terminou na manhã do dia) + sonecas">
          <div className="mt-5 flex h-[220px] items-end gap-3.5 px-1.5">
            {totais.map(({ r, noite, son }) => (
              <Link key={r.dia} href={`${BASE}?aba=rotina&bebe=${f.baby_id}&dia=${r.dia}`} className="flex flex-1 flex-col items-center gap-1.5 text-[11.5px] font-bold text-ninho-cinza">
                <span className="text-xs font-extrabold tabular-nums text-ninho-grafite">{noite + son > 0 ? dur(noite + son) : '—'}</span>
                <div className="flex w-full max-w-[56px] flex-col overflow-hidden rounded-[10px]" style={{ height: noite + son > 0 ? `${((noite + son) / mx) * 170}px` : 4, background: noite + son > 0 ? undefined : '#EEE' }}>
                  {son > 0 && <div style={{ flex: son, background: '#9F86E0' }} />}
                  {noite > 0 && <div style={{ flex: noite, background: '#3B2C78' }} />}
                </div>
                {r.dia === hoje ? 'Hoje*' : diaRotulo(r.dia).split(',')[0]}
              </Link>
            ))}
          </div>
          <p className="mt-2.5 text-xs text-ninho-cinza">* Hoje até agora. Clique num dia para abrir a rotina.</p>
        </Card>
        <Card titulo="Noites em que dormiu melhor" direita="maior sono seguido">
          {noites.length === 0 && <p className="py-6 text-center text-sm text-ninho-cinza">Sem noites completas registradas nesta semana.</p>}
          {noites.map((n, i) => (
            <div key={n.dia} className="flex items-center gap-3 border-b border-[#F3F0F8] py-2.5 last:border-0">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#24164F] text-sm font-black text-white">{i + 1}</span>
              <div className="flex-1">
                <p className="text-sm font-bold">Noite de {diaRotulo(n.dia).toLowerCase()}</p>
                <p className="text-xs tabular-nums text-ninho-cinza">
                  dormiu {hora(n.dormiu!)} · acordou {hora(n.acordou!)} · {n.despertares} despertar{n.despertares === 1 ? '' : 'es'}
                </p>
              </div>
              <b className="text-sm tabular-nums">{dur(n.primeiroTrechoMin!)}</b>
            </div>
          ))}
        </Card>
      </div>
      <p className="mt-3 text-[11.5px] text-ninho-cinza">
        Sem registro, sem número: médias só com os dias completos que têm registro. Horário de Brasília.
      </p>
    </>
  );
}

// ── Convidar ──────────────────────────────────────────────
async function Convidar({ c }: { c: Consultora }) {
  const [base, eventos] = await Promise.all([baseComissoes(), eventosDosLinks()]);
  const funil = funilDaConsultora(c.id, base.familias, eventos, ultimosMesesFunil(6));
  const link = `${SITE_URL}/c/${(c.codigo ?? '').toLowerCase()}`;
  const msg = `Oi! Para eu acompanhar a rotina do seu bebê, baixe o Ninho por este link: ${link}`;
  return (
    <>
      <Titulo t="Convidar família" sub="A família abre o link, cadastra o bebê e aceita compartilhar a rotina com você." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card titulo="Seu link e código">
          <div className="mt-2"><CopyLink url={link} /></div>
          <p className="mt-5 text-[11px] font-extrabold tracking-[0.09em] text-[#9A95AD]">CÓDIGO</p>
          <p className="text-3xl font-black tracking-[0.12em] text-[#24164F]">{c.codigo}</p>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-ninho-cinza">Quem já usa o Ninho digita em Cuidadores › Adicionar consultora.</p>
          <p className="mt-4 text-[11px] font-extrabold tracking-[0.09em] text-[#9A95AD]">MENSAGEM PARA O WHATSAPP</p>
          <p className="mt-1 rounded-2xl bg-[#F5F2FB] p-3 text-[13px]">{msg}</p>
        </Card>
        <Card titulo="Como funciona">
          <div className="mt-2 space-y-2 text-[13.5px] leading-relaxed text-[#4d4a5c]">
            <p><b>1.</b> A mãe abre o seu link e cria a conta no Ninho (ou digita o seu código no cadastro).</p>
            <p><b>2.</b> Ela pede para compartilhar a rotina com {c.nome}, digitando seu código em Cuidadores.</p>
            <p><b>3.</b> Você aprova em Famílias, aqui ou no app. Só então a rotina aparece. Ela pode tirar você quando quiser.</p>
          </div>
          <Aviso tom="vermelho">Este link é só para famílias. Para trazer uma amiga consultora, use Indicar consultora.</Aviso>
          <Aviso>{TEXTO_QUEM_GERA_COMISSAO}</Aviso>
        </Card>
      </div>
      <Card titulo="Convidar pelo e-mail da família" className="mt-4">
        <p className="text-[13px] leading-relaxed text-ninho-cinza">
          Para quem já usa o Ninho. Digite o e-mail exato da conta da família: ela recebe o convite no sininho, escolhe o
          bebê e decide. A rotina só aparece depois que ela aceitar. Convite não gera comissão.
        </p>
        <form action={convidarFamilia} className="mt-3 max-w-xl">
          <label className={rotuloCampo}>E-mail da família no Ninho</label>
          <input name="email" type="email" required maxLength={254} placeholder="familia@gmail.com" className={campo} />
          <label className="mt-3 flex items-start gap-2.5 text-[13px] leading-relaxed">
            <input type="checkbox" name="aceite" required className="mt-1 h-4 w-4 shrink-0 accent-[#4CAF74]" />
            <span>{ACEITE_VINCULO_CONSULTORA_TEXTO}</span>
          </label>
          <button className={`${botao.grad} mt-4`} disabled={c.estado !== 'ativa'}>Enviar convite</button>
        </form>
      </Card>
      <Card titulo="Funil do seu link" direita="últimos 6 meses" className="mt-4">
        <FunilTabela meses={funil} indisponivel={!eventos} />
      </Card>
    </>
  );
}

// ── Ganhos ────────────────────────────────────────────────
async function Ganhos({ c, mes }: { c: Consultora; mes?: string }) {
  const [g, eventos] = await Promise.all([montarGanhos(c), eventosDosLinks()]);
  const { count: indicadas } = await appDb().from('consultoras').select('id', { count: 'exact', head: true }).eq('indicada_por', c.id);
  const meses = g.meses.map((m) => m.competencia);
  const m = mes && meses.includes(mes) ? mes : meses[0] ?? null;
  const ls = m ? g.linhas.filter((l) => l.competencia === m) : [];
  const atual = g.meses[0];
  const direto = somar(ls.filter((l) => !l.via).map((l) => l.valor));
  const viaG = new Map<string, number>();
  ls.filter((l) => l.via).forEach((l) => viaG.set(l.via!, somar([viaG.get(l.via!) ?? 0, l.valor])));
  return (
    <>
      <Titulo
        t="Ganhos"
        sub={
          g.consultora.indicada_por_nome
            ? `Você foi indicada por ${g.consultora.indicada_por_nome}: suas famílias dão ${pctTxt(PCT_REDE)} para você e ${pctTxt(PCT_REDE)} para ela.`
            : `Suas famílias dão ${pctTxt(PCT_DIRETO)} por ${PARCELAS_MENSAL} meses no mensal, ou 1x no anual. Famílias de quem você indicou dão ${pctTxt(PCT_REDE)} para você.`
        }
        direita={
          meses.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {meses.slice(0, 6).map((mm) => (
                <Link key={mm} href={`${BASE}?aba=ganhos&mes=${mm}`} className={`rounded-pill px-3 py-1.5 text-xs font-bold ${mm === m ? 'bg-[#24164F] text-white' : 'bg-white text-ninho-cinza shadow-[inset_0_0_0_1.5px_#ECE6F5]'}`}>{nomeMes(mm)}</Link>
              ))}
            </div>
          )
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi rotulo="Famílias" valor={g.resumo.familias} sub="compartilham a rotina" />
        <Kpi rotulo="Assinantes" valor={g.resumo.assinantes} sub="famílias suas que pagam hoje" />
        <Kpi
          rotulo={`Cliques no seu link (${nomeMes(mesNoPainel(new Date()))})`}
          valor={eventos ? eventos.cliques.filter((e) => e.consultora_id === c.id && mesNoPainel(e.quando) === mesNoPainel(new Date())).length : '—'}
          sub={`${indicadas ?? g.resumo.indicadas} consultora${(indicadas ?? g.resumo.indicadas) === 1 ? '' : 's'} indicada${(indicadas ?? g.resumo.indicadas) === 1 ? '' : 's'} por você`}
        />
        <Kpi
          verde
          rotulo={atual ? `Comissão de ${nomeMes(atual.competencia)} (R$)` : 'Comissão (R$)'}
          valor={atual ? brl(atual.total) : brl(0)}
          sub={atual ? (atual.status === 'pago' ? 'pago' : `Pix até ${dataBr(atual.prazo)}`) : 'ainda sem família assinante'}
        />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-[380px_1fr]">
        <Card titulo={m ? `De onde vem (${nomeMes(m)})` : 'De onde vem'}>
          <table className="w-full">
            <tbody>
              <tr><td className={td}><b>Suas famílias</b><small className="block text-[11.5px] text-ninho-cinza">{g.consultora.indicada_por_nome ? pctTxt(PCT_REDE) : pctTxt(PCT_DIRETO)} por {PARCELAS_MENSAL} meses</small></td><td className={`${td} text-right font-bold tabular-nums`}>{brl(direto)}</td></tr>
              {Array.from(viaG).map(([nome, v]) => (
                <tr key={nome}><td className={td}><b>Famílias da {primeiro(nome)}</b><small className="block text-[11.5px] text-ninho-cinza">{pctTxt(PCT_REDE)} para você</small></td><td className={`${td} text-right font-bold tabular-nums`}>{brl(v)}</td></tr>
              ))}
            </tbody>
          </table>
          <p className="mt-4 text-[11px] font-extrabold tracking-[0.09em] text-[#9A95AD]">PAGAMENTOS</p>
          {g.meses.map((mm) => (
            <div key={mm.competencia} className="flex justify-between py-1.5 text-[13px]">
              <span>{nomeCompetencia(mm.competencia)}</span>
              <span className="tabular-nums"><b>{brl(mm.total)}</b>{' '}{mm.status === 'pago' ? <Selo cor="verde">Recebido em {new Date(mm.pago_em!).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</Selo> : <Selo cor="ambar">Recebe até {dataBr(mm.prazo)}</Selo>}</span>
            </div>
          ))}
          {g.meses.length === 0 && <p className="py-2 text-[13px] text-ninho-cinza">Nenhuma comissão ainda.</p>}
          {!c.pix_chave || !c.cpf ? <Aviso tom="ambar">Falta cadastrar CPF e chave Pix em Meu perfil na lista para receber.</Aviso> : null}
        </Card>
        <Card titulo={m ? `Extrato de ${nomeMes(m)}` : 'Extrato'}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr><th className={th}>Família</th><th className={th}>Plano</th><th className={th}>Parcela</th><th className={th}>Regra</th><th className={`${th} text-right`}>Base (R$)</th><th className={`${th} text-right`}>Comissão (R$)</th></tr></thead>
              <tbody>
                {ls.map((l, i) => (
                  <tr key={i}>
                    <td className={td}><b>{l.bebe}</b>{l.via && <small className="block text-[11px] text-ninho-cinza">família da {primeiro(l.via)}</small>}</td>
                    <td className={td}>{l.plano}</td>
                    <td className={td}>{l.parcela}</td>
                    <td className={td}>{pctTxt(l.pct)}{l.via ? ' (indicação)' : ''}</td>
                    <td className={`${td} text-right tabular-nums`}>{brl(l.base)}</td>
                    <td className={`${td} text-right font-bold tabular-nums`}>{brl(l.valor)}</td>
                  </tr>
                ))}
              </tbody>
              {ls.length > 0 && <tfoot><tr><td className={`${td} font-extrabold`} colSpan={5}>Total</td><td className={`${td} text-right font-extrabold tabular-nums`}>{brl(somar(ls.map((l) => l.valor)))}</td></tr></tfoot>}
            </table>
            {ls.length === 0 && <p className="py-6 text-center text-sm text-ninho-cinza">Sem comissão neste mês. Teste grátis não conta: a comissão começa quando a família paga.</p>}
          </div>
          {m && <Aviso>Pix até o 5º dia útil do mês seguinte: a comissão de {nomeMes(m)} vence em {dataBr(prazoPix(m))}.</Aviso>}
        </Card>
      </div>
    </>
  );
}

// ── Indicar ───────────────────────────────────────────────
async function Indicar({ c, noPerfil = false }: { c: Consultora; noPerfil?: boolean }) {
  const sb = appDb();
  const [{ data: peds }, { data: libs }] = await Promise.all([
    sb.from('consultora_pedidos').select('id,nome,email,status,criado_em').eq('indicada_por', c.id).order('criado_em', { ascending: false }).limit(50),
    sb.from('consultoras').select('id,nome,email_liberado,estado').eq('indicada_por', c.id).limit(50),
  ]);
  const liberadas = (libs as { id: string; nome: string | null; email_liberado: string | null; estado: string }[] | null) ?? [];
  const emailsLib = new Set(liberadas.map((x) => x.email_liberado));
  const pedidos = ((peds as { id: string; nome: string; email: string; status: string; criado_em: string }[] | null) ?? []).filter((p) => !emailsLib.has(p.email.toLowerCase()));
  return (
    <>
      {noPerfil ? (
        <h2 className="mb-2 mt-6 text-lg font-black text-[#24164F]">Indicar consultora</h2>
      ) : (
        <Titulo t="Indicar consultora" sub={`O Ninho confere e libera a conta dela. Depois, as famílias dela dão ${pctTxt(PCT_REDE)} para ela e ${pctTxt(PCT_REDE)} para você.`} />
      )}
      <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
        <Card titulo="Quem você quer indicar">
          <form action={indicarConsultora}>
            <input type="hidden" name="volta" value={noPerfil ? 'perfil' : 'indicar'} />
            <label className={rotuloCampo}>Nome</label>
            <input name="nome" required minLength={2} maxLength={80} placeholder="Nome e sobrenome" className={campo} />
            <label className={rotuloCampo}>E-mail que ela vai usar no app</label>
            <input name="email" type="email" required placeholder="nome@gmail.com" className={campo} />
            <label className={rotuloCampo}>WhatsApp</label>
            <TelefonePais name="whatsapp" classeSelect={campo} classeInput={campo} />
            <label className={rotuloCampo}>Instagram</label>
            <input name="instagram" placeholder="@" className={campo} />
            <label className={rotuloCampo}>Como ela ficou sabendo do Ninho?</label>
            <select name="como_soube" defaultValue="Indicação de outra consultora" className={campo}>
              <option value="">Escolha</option>
              {COMO_SOUBE_OPCOES.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
            <label className={rotuloCampo}>Comentário (opcional)</label>
            <textarea name="comentario" maxLength={500} rows={2} className={`${campo} h-auto py-2`} />
            <button className={`${botao.grad} mt-4 w-full`} disabled={c.estado !== 'ativa'}>Enviar indicação ao Ninho</button>
          </form>
        </Card>
        <Card titulo="Suas indicações">
          <table className="w-full">
            <tbody>
              {pedidos.map((p) => (
                <tr key={p.id}><td className={td}><b>{p.nome}</b><small className="block text-[11.5px] text-ninho-cinza">{p.email}</small></td><td className={td}>{p.status === 'pendente' ? <Selo cor="ambar">O Ninho está conferindo</Selo> : p.status === 'recusado' ? <Selo cor="cinza">Não aprovada</Selo> : <Selo cor="lilas">Aprovada</Selo>}</td></tr>
              ))}
              {liberadas.map((x) => (
                <tr key={x.id}><td className={td}><b>{x.nome}</b><small className="block text-[11.5px] text-ninho-cinza">{x.email_liberado}</small></td><td className={td}>{x.estado === 'ativa' ? <Selo cor="verde">Liberada e ativa</Selo> : x.estado === 'esperando' ? <Selo cor="lilas">Liberada · falta ela entrar no app</Selo> : <Selo cor="cinza">Pausada</Selo>}</td></tr>
              ))}
            </tbody>
          </table>
          {pedidos.length + liberadas.length === 0 && <p className="py-6 text-center text-sm text-ninho-cinza">Nenhuma indicação ainda.</p>}
          <Aviso>Só 1 nível: você ganha nas famílias de quem você indicou, mas não nas famílias de quem ela indicar.</Aviso>
        </Card>
      </div>
    </>
  );
}

// ── Meu perfil ────────────────────────────────────────────
async function Perfil({ c }: { c: Consultora }) {
  const naLista = c.na_lista && c.estado === 'ativa' && !!c.perfil_aprovado_em;
  const exemplo = valorComissao(PRECOS.premium.mensal, PCT_DIRETO);
  return (
    <>
      <Titulo
        t="Meu perfil na lista"
        sub={`É assim que as famílias te encontram em "Encontrar consultora de sono", no app. A lista mostra até 10 consultoras escolhidas pelo Ninho; quem mais traz assinantes aparece primeiro.`}
        direita={<Selo cor={naLista ? 'verde' : 'cinza'}>{naLista ? 'Liberado para a lista' : c.estado === 'pausada' ? 'Fora da lista: conta pausada' : 'Fora da lista'}</Selo>}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card titulo="Editar">
          {/* key: depois de salvar, os campos voltam com o que está no banco (não o que ficou digitado). */}
          <form action={salvarPerfil} key={c.atualizado_em}>
            <label className={rotuloCampo}>Texto curto (até 160 letras)</label>
            <textarea name="bio" maxLength={160} defaultValue={c.bio_pendente ?? c.bio ?? ''} rows={3} className={`${campo} h-auto py-2`} />
            {c.bio_pendente && <p className="mt-1 text-[11.5px] text-[#7C5CD6]">Texto novo esperando o Ninho aprovar.</p>}
            <div className="grid grid-cols-[1fr_80px] gap-2">
              <div><label className={rotuloCampo}>Cidade</label><input name="cidade" defaultValue={c.cidade ?? ''} maxLength={80} className={campo} /></div>
              <div><label className={rotuloCampo}>UF</label><input name="uf" defaultValue={c.uf ?? ''} maxLength={2} className={`${campo} uppercase`} /></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="col-span-2"><label className={rotuloCampo}>WhatsApp</label><TelefonePais name="whatsapp" valor={c.whatsapp} classeSelect={campo} classeInput={campo} /></div>
              <div className="col-span-2"><label className={rotuloCampo}>Instagram</label><input name="instagram" defaultValue={c.instagram ? `@${c.instagram}` : ''} className={campo} /></div>
            </div>
            <label className={rotuloCampo}>Idades que atende</label>
            <input name="idades" defaultValue={c.idades ?? ''} maxLength={40} placeholder="Ex.: 0 a 2 anos" className={campo} />
            <div className="mt-3 flex gap-5 text-[13px] font-semibold">
              <label className="flex items-center gap-2"><input type="checkbox" name="atende_online" defaultChecked={c.atende_online} /> Online</label>
              <label className="flex items-center gap-2"><input type="checkbox" name="atende_presencial" defaultChecked={c.atende_presencial} /> Presencial</label>
            </div>
            <p className="mt-4 text-[11px] font-extrabold tracking-[0.09em] text-[#9A95AD]">PARA RECEBER (SÓ O NINHO VÊ)</p>
            <div className="grid grid-cols-2 gap-2">
              <div><label className={rotuloCampo}>CPF</label><input name="cpf" inputMode="numeric" placeholder={c.cpf ? 'trocar o CPF' : 'só números'} className={campo} /></div>
              <div><label className={rotuloCampo}>Chave Pix</label><input name="pix" placeholder={c.pix_chave ? 'trocar a chave' : ''} className={campo} /></div>
            </div>
            <p className="mt-1 text-[11.5px] text-ninho-cinza">
              {c.cpf ? `CPF salvo: •••.•••.•${c.cpf.slice(-4, -2)}-${c.cpf.slice(-2)}` : 'CPF ainda não cadastrado'} ·{' '}
              {c.pix_chave ? `Pix salvo: ${c.pix_chave.length > 6 ? `${c.pix_chave.slice(0, 3)}•••${c.pix_chave.slice(-3)}` : '•••'}` : 'Pix ainda não cadastrado'}.
              Por segurança, os campos ficam vazios: deixe vazio para manter.
            </p>
            <button className={`${botao.grad} mt-4 w-full`}>Salvar</button>
            <p className="mt-2 text-xs leading-snug text-ninho-cinza">Texto e foto novos passam pelo Ninho antes de aparecer. Cidade, contato e atendimento valem na hora.</p>
          </form>
          <form action={enviarFoto} className="mt-4 flex flex-wrap items-center gap-2 border-t border-[#F0ECF6] pt-4 text-xs">
            <input type="file" name="foto" accept="image/jpeg,image/png,image/webp" />
            <button className={botao.suave}>Enviar foto</button>
            <span className="text-ninho-cinza">JPG, PNG ou WebP até 2 MB{c.foto_pendente_url ? ' · uma foto nova espera aprovação' : ''}</span>
          </form>
        </Card>
        <Card titulo="Prévia">
          <div className="rounded-[20px] bg-[#F8F6FC] p-4">
            <div className="flex items-center gap-3">
              <Avatar id={c.id} nome={c.nome} foto={c.foto_url} tamanho={48} />
              <div>
                <b className="text-base">{c.nome}</b>
                <p className="text-[12.5px] text-ninho-cinza">Consultora independente · {c.cidade ? `${c.cidade}${c.uf ? ` · ${c.uf}` : ''}` : 'cidade a preencher'}</p>
                <p className="text-xs text-ninho-cinza">{[c.atende_online && 'Online', c.atende_presencial && 'Presencial'].filter(Boolean).join(' e ')}{c.idades ? ` · ${c.idades}` : ''}</p>
              </div>
            </div>
            <p className={`mt-2 text-[13.5px] leading-relaxed ${c.bio ? '' : 'text-[#9A95AD]'}`}>{c.bio || 'Sem texto ainda.'}</p>
            <p className="mt-2.5 text-[11px] leading-snug text-[#9A95AD]">
              Consultora independente. As orientações são de responsabilidade dela e não substituem o pediatra. Ela
              pode receber comissão do Ninho se a família assinar pelo link dela.
            </p>
          </div>
          {c.bio_pendente && (
            <Aviso tom="ambar">
              Texto novo esperando o Ninho aprovar: &ldquo;{c.bio_pendente}&rdquo;. Até lá, a lista do app mostra o texto acima.
            </Aviso>
          )}
          <p className="mt-3 text-[11.5px] text-ninho-cinza">Última alteração salva: {new Date(c.atualizado_em).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}.</p>
          <Aviso>Antes de te chamar, a família marca que você é independente, que suas orientações são de sua responsabilidade e que você pode receber comissão.</Aviso>
          <Aviso tom="verde">Exemplo: cada família no Premium mensal pelo seu link dá {brl(exemplo)} por mês, por {PARCELAS_MENSAL} meses.</Aviso>
        </Card>
      </div>
      {await Indicar({ c, noPerfil: true })}
    </>
  );
}
