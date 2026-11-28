import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireSessionAtiva } from '@/lib/auth/guard';
import { appDb } from '@/lib/supabase/server';
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
  convitesEnviados,
  type ConviteEnviado,
  montarGanhos,
  rotinaDe,
  relogioDaFamilia,
  orientacoesDoBebe,
  orientacaoAceiteOk,
  novidadesEstado,
  pedidosDeContinuar,
  diasAteTermino,
  type Consultora,
  type FamiliaDaConsultora,
  type Ficha,
} from '@/lib/consultoras';
import { TelefonePais } from '@/components/TelefonePais';
import { BarraDoPrazo } from '@/components/consultoras/BarraDoPrazo';
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
  COMISSAO_VISIVEL,
  textoQuemGeraComissao,
  textoAceiteVinculo,
  comoSoubeOpcoes,
} from '@/lib/consultoras-regras';
import { textos, fmtData, fmtDataHora, fmtNumero, fmtPct, type Idioma } from '@/lib/i18n-consultora';
import { idiomaDaConsultora } from '@/lib/i18n-consultora/servidor';
import {
  costumeAntes,
  descreverRegistro,
  periodosDaRotina,
  diaLocalDe,
  diaV3,
  dur,
  faixaTxt,
  hora,
  idadeMeses,
  inicioDoDia,
  minutoDaNoite,
  minutoDoDia,
  semanaV3,
  evolucaoLiberada,
  evolucaoSono,
  somarDias,
  FUSO_MS,
  type SemanaV3,
} from '@/lib/consultoras-rotina';
import { BarrasSemana, DiaStrip, EvolucaoSono, FaixasNoites, Horarios, JanelaAntesDeDormir, Legenda, MiniNoites, Sequencia, SonecasNoite, diaCurto } from '@/components/consultoras/RotinaV3';
import { JanelasDasSonecas, textoEtiqueta } from '@/components/consultoras/JanelasDasSonecas';
import { compararJanela, janelasDoPeriodo, lerCorte, lerPeriodo, posicaoPorInicio } from '@/lib/consultoras-janelas';
import { CompartilharRelatorio } from '@/components/consultoras/CompartilharRelatorio';
import { ManualDaConsultora } from '@/components/consultoras/ManualDaConsultora';
import { IA_LIMITE_MES, IA_PERIODOS, IA_PRECO_MENSAL, rodapeIa, iaStatus, lerRelatorio, listarRelatorios, secoes, type IaStatus } from '@/lib/consultoras-ia';
import { Avatar, Aviso, Card, Kpi, Retorno, Selo, botao, brl, campo, rotuloCampo, td, th } from '@/components/consultoras/ui';
import { CodigoConsultora, LinkConsultoria, LinkDivulgacao } from '@/components/consultoras/LinksConsultora';
import { consultoriaLiberada } from '@/lib/link-consultora';
import { ConfirmButton } from '@/components/admin/ConfirmButton';
import { cancelarConviteFamilia, encerrarAcompanhamento, convidarFamilia, enviarFoto, enviarOrientacaoFamilia, indicarConsultora, mandarSugestao, marcarContinuarFalei, pedirRelatorio, responderPedidoFamilia, salvarFicha, salvarPerfil } from './actions';
import { OrientacaoFamilia } from '@/components/consultoras/OrientacaoFamilia';
import { SUGESTAO_MAX, sugestoesDa, type StatusSugestao } from '@/lib/consultoras-sugestoes';

export const dynamic = 'force-dynamic';

const BASE = '/admin/consultora';
const H = 3600 * 1000;
const pctTxt = (p: number, idioma: Idioma) => fmtPct(idioma, p);
const primeiro = (n: string | null) => (n || '').split(' ')[0];

type Busca = { jan?: string; corte?: string; ficha?: string; aba?: string; bebe?: string; dia?: string; evo?: string; dias?: string; id?: string; mes?: string; filtro?: string; q?: string; ok?: string; erro?: string };

/**
 * Área da CONSULTORA (role consultora). Desenho e comportamento:
 * Ninho-expo/docs/design/consultora/painel.html (visão da consultora).
 * Mesmos dados do app: famílias e rotina vêm de _consultora_familias e
 * _consultora_rotina, que já cortam o acesso se ela está pausada, sem vínculo
 * ou se a família está sem plano.
 */
export default async function ConsultoraPage(props: { searchParams: Promise<Busca> }) {
  const searchParams = await props.searchParams;
  const s = await requireSessionAtiva('consultora');
  const c = await consultoraDoPerfil(s.sub);
  if (!c) redirect('/admin/login?porta=consultora');
  // 'inicio' (padrão) e 'familias' (pedidos, convites, famílias e fichas) são abas diferentes.
  const aba = searchParams.aba || 'inicio';
  const pausada = c.estado === 'pausada';
  const idioma = await idiomaDaConsultora();
  const t = textos(idioma).pagina;

  let corpo: React.ReactNode;
  if (aba === 'rotina' || aba === 'semana') corpo = await Rotina({ c, sp: searchParams, semana: aba === 'semana', idioma });
  else if (aba === 'convidar') corpo = await Convidar({ c, ok: searchParams.ok, erro: searchParams.erro, idioma });
  // Com a comissão escondida, Ganhos e Indicar não abrem nem pelo endereço
  // direto: o link some do menu, mas o favorito continuaria funcionando.
  else if (aba === 'ganhos') corpo = COMISSAO_VISIVEL ? await Ganhos({ c, mes: searchParams.mes, idioma }) : await Familias({ c, sp: searchParams, idioma });
  else if (aba === 'indicar') corpo = COMISSAO_VISIVEL ? await Indicar({ c, idioma }) : await Familias({ c, sp: searchParams, idioma });
  else if (aba === 'perfil') corpo = await Perfil({ c, idioma });
  else if (aba === 'relatorio') corpo = await RelatorioIA({ c, sp: searchParams, idioma });
  else if (aba === 'assinatura') corpo = await AssinaturaIA({ c, idioma });
  else if (aba === 'ajuda') corpo = <Ajuda c={c} idioma={idioma} />;
  else if (aba === 'manual') corpo = <Manual c={c} idioma={idioma} />;
  else if (aba === 'sugestoes') corpo = await Sugestoes({ c, idioma });
  else if (aba === 'ficha') corpo = await AbaFicha({ c, sp: searchParams, idioma });
  else if (aba === 'familias') corpo = await PedidosEConvites({ c, sp: searchParams, idioma });
  else corpo = await Familias({ c, sp: searchParams, idioma });

  return (
    <>
      <div className="no-print mb-4 flex items-center gap-3 rounded-2xl bg-white p-3">
        <Avatar id={c.id} nome={c.nome} foto={c.foto_url} tamanho={40} />
        <div className="flex-1 leading-tight">
          <b className="text-[14px]">{c.nome}</b>
          <p className="text-[12px] text-ninho-cinza">{t.topo.consultoraCodigo(c.codigo ?? '')}</p>
        </div>
        <span className="rounded-pill bg-[#E7F5EC] px-3 py-1 text-[11.5px] font-extrabold text-[#2F8A55]">{t.topo.mesmosDados}</span>
      </div>
      {pausada && (
        <Aviso tom="vermelho">
          {t.topo.pausada}
          {COMISSAO_VISIVEL ? t.topo.pausadaComissao : ''}
        </Aviso>
      )}
      <div className="mt-4">
        <div className="no-print"><Retorno ok={searchParams.ok} erro={searchParams.erro} /></div>
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

function idadeTxt(nasc: string | null, idioma: Idioma): string {
  const t = textos(idioma).pagina.comum;
  const m = idadeMeses(nasc, hojeSP());
  if (m === null) return '';
  if (m < 0) return t.naoNasceu;
  if (m === 0) return t.menosDe1Mes;
  return t.meses(m);
}

function desdeTxt(iso: string, idioma: Idioma): string {
  return fmtData(idioma, iso, { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit' });
}

/** dd/mm/aaaa → hh:mm de São Paulo, no idioma (as listas de convites, relatórios e fichas). */
function quandoTxt(iso: string | number | Date, idioma: Idioma, ano = false): string {
  return fmtDataHora(idioma, iso, { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', ...(ano ? { year: 'numeric' } : {}), hour: '2-digit', minute: '2-digit' });
}

async function SeloAgora({ f, idioma }: { f: FamiliaDaConsultora; idioma: Idioma }) {
  const t = textos(idioma).pagina.selo;
  if (!f.plano_ok) return <Selo cor="cinza">{t.semPlano}</Selo>;
  if (f.dormindo_desde) return <Selo cor="noite">{t.dormindo(dur((Date.now() - new Date(f.dormindo_desde).getTime()) / 60000, idioma))}</Selo>;
  if (!f.ultimo_registro_em) return <Selo cor="vermelho">{t.semRegistro}</Selo>;
  const h = (Date.now() - new Date(f.ultimo_registro_em).getTime()) / H;
  if (h >= 12) return <Selo cor="vermelho">{t.semRegistroHa(Math.floor(h))}</Selo>;
  // Na hora da família (dono, 15/11/2026).
  const ms = new Date(f.ultimo_registro_em).getTime();
  const rel = await relogioDaFamilia(f.baby_id, ms);
  return <Selo cor="ambar">{t.ultimoAs(hora(ms + rel.delta, idioma))}</Selo>;
}

// ── Início (v3) ───────────────────────────────────────────
// "Olhe primeiro" (noite agitada e sem registro), noites calmas de ontem,
// quem está dormindo, Relatório IA e as famílias com as 7 noites em barrinhas.
interface FamiliaComSemana {
  f: FamiliaDaConsultora;
  semana: SemanaV3 | null;
  ficha: Ficha | null;
  /** "Ontem" no relógio da família. */
  ontem?: string;
}

function waLink(digitos: string | null | undefined, texto: string): string {
  const n = (digitos ?? '').replace(/\D/g, '');
  return n ? `https://wa.me/${n}?text=${encodeURIComponent(texto)}` : `https://wa.me/?text=${encodeURIComponent(texto)}`;
}

async function Familias({ c, sp, idioma }: { c: Consultora; sp: Busca; idioma: Idioma }) {
  const tp = textos(idioma).pagina;
  const t = tp.inicio;
  const [todas, pv, ia] = await Promise.all([
    c.estado === 'ativa' ? familiasDa(c.id) : Promise.resolve([] as FamiliaDaConsultora[]),
    c.estado === 'ativa' ? pedidosVinculoDa(c.id) : Promise.resolve({ pedidos: [], indisponivel: false }),
    iaStatus(c.id),
  ]);
  const agora = Date.now();
  const hoje = hojeSP();
  const ontem = somarDias(hoje, -1);
  // As 7 noites que já terminaram (a última é a de ontem, que terminou hoje cedo).
  const lista = todas.slice(0, 40);
  const dados: FamiliaComSemana[] = await Promise.all(
    lista.map(async (f) => {
      // Hora da família (dono, 15/11/2026): o dia e o "agora" são os dela.
      const rel = await relogioDaFamilia(f.baby_id, agora);
      const hojeF = diaLocalDe(rel.agora);
      const [rot, fi] = await Promise.all([
        f.plano_ok ? rotinaDe(c.id, f.baby_id, new Date(inicioDoDia(somarDias(hojeF, -7)) - 12 * H), new Date(rel.agora + 60_000), rel) : Promise.resolve({ registros: [], semAcesso: true }),
        fichaDe(c.id, f.baby_id),
      ]);
      return { f, semana: rot.semAcesso ? null : semanaV3(rot.registros, somarDias(hojeF, -1), rel.agora, 7, idioma), ficha: fi.ficha, ontem: somarDias(hojeF, -1) };
    }),
  );
  const porBebe = new Map(dados.map((d) => [d.f.baby_id, d]));
  const noiteOntem = (d: FamiliaComSemana) => d.semana?.dias.find((x) => x.dia === (d.ontem ?? ontem)) ?? null;
  const semReg = (f: FamiliaDaConsultora) => f.plano_ok && !f.dormindo_desde && (!f.ultimo_registro_em || agora - new Date(f.ultimo_registro_em).getTime() >= 12 * H);
  const agitada = (d: FamiliaComSemana) => {
    const n = noiteOntem(d);
    return !!n && n.noiteCompleta && (n.noite.despertares ?? 0) >= 3;
  };
  const comNoite = dados.filter((d) => noiteOntem(d)?.noiteCompleta);
  const calmas = comNoite.filter((d) => (noiteOntem(d)!.noite.despertares ?? 0) <= 2);
  const dormindo = todas.filter((f) => f.plano_ok && f.dormindo_desde);
  const prioridade = dados.filter((d) => agitada(d) || semReg(d.f));

  const filtro = sp.filtro || 'todas';
  const q = (sp.q || '').trim().toLowerCase();
  let fs = todas;
  if (filtro === 'dorme') fs = fs.filter((f) => f.plano_ok && f.dormindo_desde);
  if (filtro === 'semreg') fs = fs.filter(semReg);
  if (filtro === 'agitada') fs = fs.filter((f) => porBebe.get(f.baby_id) && agitada(porBebe.get(f.baby_id)!));
  if (filtro === 'semplano') fs = fs.filter((f) => !f.plano_ok);
  if (q) fs = fs.filter((f) => `${f.bebe_nome ?? ''} ${f.mae_nome ?? ''}`.toLowerCase().includes(q));
  // Atenção primeiro.
  fs = [...fs].sort((a, b) => {
    const pa = porBebe.get(a.baby_id);
    const pb = porBebe.get(b.baby_id);
    const peso = (f: FamiliaDaConsultora, d?: FamiliaComSemana) => (d && agitada(d) ? 2 : 0) + (semReg(f) ? 1 : 0);
    return peso(b, pb) - peso(a, pa) || (a.bebe_nome ?? '').localeCompare(b.bebe_nome ?? '');
  });
  const chip = (k: string, rotulo: string) => (
    <Link key={k} href={`${BASE}?aba=inicio&filtro=${k}${q ? `&q=${encodeURIComponent(q)}` : ''}`} className={`rounded-pill px-3 py-1.5 text-xs font-bold ${filtro === k ? 'bg-[#24164F] text-white' : 'bg-white text-ninho-cinza shadow-[inset_0_0_0_1.5px_#ECE6F5]'}`}>{rotulo}</Link>
  );
  const horaDoDia = new Date(agora + FUSO_MS).getUTCHours();
  const saudacao = horaDoDia < 12 ? t.bomDia : horaDoDia < 18 ? t.boaTarde : t.boaNoite;
  const dataHoje = fmtData(idioma, agora, { timeZone: 'America/Sao_Paulo', weekday: 'long', day: 'numeric', month: 'long' });
  const iaTxt = !ia ? { v: '—', s: t.iaIndisponivel } : ia.assinante ? { v: tp.comum.deTotal(ia.usadosMes, ia.limiteMes), s: t.iaUsados } : ia.gratisUsado ? { v: t.iaGratisUsadoV, s: t.iaGratisUsadoS } : { v: t.iaUmGratisV, s: t.iaUmGratisS };

  return (
    <>
      <Titulo
        t={saudacao(primeiro(c.nome))}
        sub={t.sub(todas.length, dataHoje)}
        direita={
          <form className="flex h-10 items-center gap-2 rounded-pill bg-white px-4 shadow-[inset_0_0_0_1.5px_#ECE6F5]">
            <input type="hidden" name="aba" value="inicio" />
            <input type="hidden" name="filtro" value={filtro} />
            <input name="q" defaultValue={sp.q} placeholder={tp.comum.buscarBebeOuMae} className="w-48 bg-transparent text-[13.5px] outline-none" />
          </form>
        }
      />
      {pv.pedidos.length > 0 && (
        <Card titulo={t.pedidosTitulo} direita={tp.comum.esperandoVoce(pv.pedidos.length)} className="mb-4">
          <p className="text-[12.5px] text-ninho-cinza">{tp.comum.pedidoExplica}</p>
          {pv.pedidos.map((p) => (
            <div key={p.id} className="mt-3 rounded-2xl bg-[#F3EEFC] px-4 py-3">
              <p className="text-[13.5px]">
                <b>{p.responsavel_nome ?? tp.comum.umaFamilia}</b>
                {p.bebe_nome ? <>{tp.comum.querCompartilharDe}<b>{p.bebe_nome}</b></> : tp.comum.querCompartilharBebe}
                <span className="text-ninho-cinza"> · {desdeTxt(p.criado_em, idioma)}</span>
              </p>
              <details className="mt-2">
                <summary className="cursor-pointer text-[13px] font-bold text-[#7C5CD6]">{tp.comum.aprovar}</summary>
                <form action={responderPedidoFamilia} className="mt-2 rounded-xl bg-white p-3">
                  <input type="hidden" name="pedido" value={p.id} />
                  <label className="flex items-start gap-2.5 text-[13px] leading-relaxed">
                    <input type="checkbox" name="aceite" required className="mt-1 h-4 w-4 shrink-0 accent-[#4CAF74]" />
                    <span>{textoAceiteVinculo(idioma)}</span>
                  </label>
                  <button name="decisao" value="aprovar" className={`${botao.verde} mt-3`}>{tp.comum.aprovarEVer}</button>
                </form>
              </details>
              <form action={responderPedidoFamilia} className="mt-2">
                <input type="hidden" name="pedido" value={p.id} />
                <button name="decisao" value="recusar" className={botao.cinza}>{tp.comum.recusar}</button>
              </form>
            </div>
          ))}
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card titulo={t.olhePrimeiro} direita={t.olheDireita}>
          {prioridade.length === 0 && <p className="py-5 text-center text-sm text-ninho-cinza">{t.nadaAtencao}</p>}
          {prioridade.map((d) => {
            const n = noiteOntem(d);
            if (agitada(d) && n) {
              return (
                <div key={d.f.baby_id} className="mt-2 flex flex-wrap items-center gap-3 rounded-2xl bg-[#FFF8EC] px-3 py-2.5">
                  <Link href={`${BASE}?aba=rotina&bebe=${d.f.baby_id}&dia=${d.ontem ?? ontem}`} className="min-w-[200px] flex-1">
                    <p className="text-[13.5px] font-extrabold">{t.noiteAgitada(d.f.bebe_nome ?? '')}</p>
                    <p className="text-xs tabular-nums text-ninho-cinza">
                      {t.agitadaDetalhe(n.noite.despertares ?? 0, n.noite.primeiroTrechoMin !== null ? dur(n.noite.primeiroTrechoMin, idioma) : null, n.sonecas.length)}
                    </p>
                  </Link>
                  <Link href={`${BASE}?aba=relatorio&bebe=${d.f.baby_id}`} className={botao.suave}>{t.relatorioIa}</Link>
                </div>
              );
            }
            const desde = d.f.ultimo_registro_em ? t.nadaMarcadoDesde(desdeTxt(d.f.ultimo_registro_em, idioma), hora(new Date(d.f.ultimo_registro_em).getTime(), idioma)) : t.nadaMarcadoAinda;
            return (
              <div key={d.f.baby_id} className="mt-2 flex flex-wrap items-center gap-3 rounded-2xl bg-[#F4F2F8] px-3 py-2.5">
                <div className="min-w-[200px] flex-1">
                  <p className="text-[13.5px] font-extrabold">{t.semRegistroTitulo(d.f.bebe_nome ?? '')}</p>
                  <p className="text-xs text-ninho-cinza">{desde}</p>
                </div>
                <a
                  href={waLink(d.ficha?.whatsapp, t.msgWhatsapp(d.ficha?.bebe_apelido || d.f.bebe_nome || tp.comum.bebeMinusculo))}
                  target="_blank"
                  rel="noopener"
                  className={botao.cinza}
                  title={t.lembrarTitle}
                >
                  {t.lembrarWhatsapp}
                </a>
              </div>
            );
          })}
        </Card>
        <div className="grid gap-4 sm:grid-cols-3">
          <Kpi rotulo={t.kpiNoitesCalmas} valor={comNoite.length ? tp.comum.deTotal(calmas.length, comNoite.length) : '—'} sub={t.kpiComRegistro} />
          <Kpi rotulo={t.kpiDormindo} valor={dormindo.length} sub={dormindo.slice(0, 3).map((f) => f.bebe_nome).join(', ') || t.ninguem} />
          <Kpi rotulo={t.kpiRelatorios} valor={iaTxt.v} sub={iaTxt.s} />
        </div>
      </div>

      <Card
        className="mt-4"
        titulo={<div className="flex flex-wrap gap-1.5">{chip('todas', t.chipTodas)}{chip('agitada', t.chipAgitada)}{chip('dorme', t.chipDorme)}{chip('semreg', t.chipSemReg)}{chip('semplano', t.chipSemPlano)}</div>}
        direita={t.listaDireita(fs.length, todas.length)}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr><th className={th}>{tp.comum.bebe}</th><th className={th}>{tp.comum.mae}</th><th className={th}>{t.col7Noites}</th><th className={th}>{tp.comum.agora}</th><th className={th}>{t.colComVoceDesde}</th><th className={th} /></tr></thead>
            <tbody>
              {fs.map((f) => {
                const d = porBebe.get(f.baby_id);
                return (
                  <tr key={f.baby_id} className="hover:bg-[#FAF8FE]">
                    <td className={td}>
                      <Link href={`${BASE}?aba=rotina&bebe=${f.baby_id}`} className="flex items-center gap-2.5">
                        <Avatar id={f.baby_id} nome={f.bebe_nome} tamanho={34} />
                        <span><b>{f.bebe_nome}</b><small className="block text-[11.5px] text-ninho-cinza">{idadeTxt(f.nascimento, idioma)}</small></span>
                      </Link>
                    </td>
                    <td className={td}>{f.mae_nome ?? '—'}</td>
                    <td className={td}>{d?.semana ? <Link href={`${BASE}?aba=semana&bebe=${f.baby_id}`}><MiniNoites s={d.semana} idioma={idioma} /></Link> : <span className="text-xs text-[#9A95AD]">—</span>}</td>
                    <td className={td}><SeloAgora f={f} idioma={idioma} /></td>
                    <td className={td}>{desdeTxt(f.vinculado_em, idioma)}</td>
                    <td className={td}>{d && agitada(d) ? <Link href={`${BASE}?aba=relatorio&bebe=${f.baby_id}`} className={botao.suave}>{t.relatorio}</Link> : <Link href={`${BASE}?aba=rotina&bebe=${f.baby_id}`} className="text-[#BDB8CC]">›</Link>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {fs.length === 0 && (
            <p className="py-6 text-center text-sm text-ninho-cinza">
              {todas.length === 0 ? (c.estado === 'ativa' ? t.vazioAtiva : t.vazioPausada) : t.vazioFiltro}
            </p>
          )}
        </div>
        <Legenda itens={[['#9F86E0', t.legCalma], ['#F0B456', t.legTresOuMais], ['#E4E1EA', t.legSemRegistro]]} idioma={idioma} />
      </Card>
      <ConviteSugestao idioma={idioma} />
    </>
  );
}

// ── Sugestões para o Ninho (00123) ────────────────────────
function ConviteSugestao({ idioma }: { idioma: Idioma }) {
  const t = textos(idioma).pagina.sugestoes;
  return (
    <Link
      href={`${BASE}?aba=sugestoes`}
      className="no-print mt-4 flex flex-wrap items-center gap-4 rounded-[22px] bg-gradient-to-r from-[#F3EEFC] to-[#FBF8FF] px-5 py-4 shadow-[inset_0_0_0_1.5px_#E7DDFB]"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-xl shadow-[0_6px_14px_-8px_rgba(140,92,248,.6)]" aria-hidden>💡</span>
      <span className="min-w-[200px] flex-1 leading-snug">
        <b className="block text-[15px] text-[#24164F]">{t.pergunta}</b>
        <span className="text-[12.5px] text-ninho-cinza">{t.conviteTexto}</span>
      </span>
      <span className={botao.suave}>{t.conviteBotao}</span>
    </Link>
  );
}

// O texto de cada status mora no dicionário (sugestoes.status); aqui só a cor.
const COR_SUGESTAO: Record<StatusSugestao, 'ambar' | 'verde' | 'cinza'> = {
  nova: 'cinza',
  lida: 'ambar',
  feita: 'verde',
};

async function Sugestoes({ c, idioma }: { c: Consultora; idioma: Idioma }) {
  const t = textos(idioma).pagina.sugestoes;
  const { lista, indisponivel } = await sugestoesDa(c.id);
  return (
    <>
      <Titulo t={t.titulo} sub={t.sub} />
      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <section className="rounded-[22px] bg-gradient-to-br from-[#A46DFF] to-[#8C5CF8] p-[3px] shadow-[0_14px_34px_-22px_rgba(140,92,248,.9)]">
          <div className="rounded-[20px] bg-white p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#F3EEFC] text-2xl" aria-hidden>💡</span>
              <div className="leading-tight">
                <h2 className="text-[18px] font-black text-[#24164F]">{t.pergunta}</h2>
                <p className="mt-0.5 text-[12.5px] text-ninho-cinza">{t.dica}</p>
              </div>
            </div>
            <form action={mandarSugestao} className="mt-4">
              <textarea
                name="texto"
                required
                minLength={3}
                maxLength={SUGESTAO_MAX}
                rows={6}
                placeholder={t.placeholder}
                className="w-full resize-y rounded-2xl border-[1.5px] border-transparent bg-[#F5F2FB] px-4 py-3 text-[14px] leading-relaxed outline-none focus:border-ninho-roxo"
                disabled={indisponivel}
              />
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <p className="text-[12px] text-ninho-cinza">{t.soTime}</p>
                <button className={botao.grad} disabled={indisponivel}>{t.enviar}</button>
              </div>
              {indisponivel && <p className="mt-2 text-[12.5px] font-semibold text-[#B7791F]">{t.emBreve}</p>}
            </form>
          </div>
        </section>
        <Card titulo={t.suas} direita={lista.length ? `${lista.length}` : undefined}>
          {lista.length === 0 ? (
            <p className="py-6 text-center text-sm text-ninho-cinza">{t.nenhuma}</p>
          ) : (
            <ul className="mt-1 space-y-2.5">
              {lista.map((s) => (
                <li key={s.id} className="rounded-2xl bg-[#FAF8FE] px-4 py-3">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="text-[11.5px] font-semibold text-[#9A95AD]">{fmtData(idioma, s.criado_em, { timeZone: 'America/Sao_Paulo' })}</span>
                    <Selo cor={COR_SUGESTAO[s.status]}>{t.status[s.status]}</Selo>
                  </div>
                  <p className="whitespace-pre-line text-[13.5px] leading-relaxed text-ninho-grafite">{s.texto}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}

// ── Famílias: pedidos, convites e quem você acompanha (00109, 00118) ──
// O texto de cada status mora no dicionário (familias.statusConvite); aqui só a cor.
// Nunca dizer se o e-mail tem conta no Ninho.
const COR_CONVITE: Record<ConviteEnviado['status'], 'ambar' | 'verde' | 'cinza'> = {
  aguardando: 'ambar',
  aceito: 'verde',
  encerrado: 'cinza',
  cancelado: 'cinza',
};

async function PedidosEConvites({ c, sp, idioma }: { c: Consultora; sp: Busca; idioma: Idioma }) {
  const tp = textos(idioma).pagina;
  const t = tp.familias;
  const ativa = c.estado === 'ativa';
  const [fams, pv, convites, continuar] = await Promise.all([
    ativa ? familiasDa(c.id) : Promise.resolve([] as FamiliaDaConsultora[]),
    ativa ? pedidosVinculoDa(c.id) : Promise.resolve({ pedidos: [], indisponivel: false }),
    convitesEnviados(c.id),
    ativa ? pedidosDeContinuar(c.id) : Promise.resolve({ lista: [], indisponivel: true }),
  ]);
  const filtroConv = sp.filtro && ['aguardando', 'aceito', 'encerrado', 'cancelado'].includes(sp.filtro) ? sp.filtro : 'todos';
  const conv = (convites ?? []).filter((x) => filtroConv === 'todos' || x.status === filtroConv);
  const q = (sp.q || '').trim().toLowerCase();
  const acompanha = [...fams]
    .filter((f) => !q || `${f.bebe_nome ?? ''} ${f.mae_nome ?? ''}`.toLowerCase().includes(q))
    .sort((a, b) => (a.bebe_nome ?? '').localeCompare(b.bebe_nome ?? ''));
  // Uma leitura só das fichas: serve à barra do prazo na lista e aos blocos
  // de anotação logo abaixo (00186).
  const fichasDaLista = await Promise.all(acompanha.slice(0, 60).map((f) => fichaDe(c.id, f.baby_id)));
  const fichaDaLinha = new Map(acompanha.slice(0, 60).map((f, i) => [f.baby_id, fichasDaLista[i].ficha]));
  const chip = (k: string, rotulo: string, n: number) => (
    <Link key={k} href={`${BASE}?aba=familias&filtro=${k}`} className={`rounded-pill px-3 py-1.5 text-xs font-bold ${filtroConv === k ? 'bg-[#24164F] text-white' : 'bg-white text-ninho-cinza shadow-[inset_0_0_0_1.5px_#ECE6F5]'}`}>{rotulo} · {n}</Link>
  );
  const conta = (st: string) => (convites ?? []).filter((x) => st === 'todos' || x.status === st).length;
  return (
    <>
      <Titulo t={t.titulo} sub={t.sub} direita={<Link href={`${BASE}?aba=convidar`} className={botao.grad}>{t.convidarFamilia}</Link>} />

      {continuar.lista.length > 0 && (
        <Card
          className="mb-4 ring-2 ring-[#4CAF74]"
          titulo={t.continuarTitulo}
          direita={<span className="rounded-pill bg-[#E3F4EA] px-3 py-1 text-[11.5px] font-extrabold text-[#2F8A55]">{t.continuarPedidos(continuar.lista.length)}</span>}
        >
          <p className="text-[12.5px] text-ninho-cinza">{t.continuarExplica}</p>
          {continuar.lista.map((p) => (
            <div key={p.id} className="mt-3 flex flex-wrap items-center gap-3 rounded-2xl bg-[#F2FAF5] px-4 py-3">
              <div className="min-w-[220px] flex-1">
                <b className="text-[13.5px]">{t.querContinuar(p.bebe_nome || null)}</b>
                <small className="block text-[11.5px] text-ninho-cinza">
                  {t.pedidoEm(desdeTxt(p.pedido_em, idioma))}
                  {p.termino ? t.terminaEm(dataBr(p.termino, idioma)) : ''}
                </small>
              </div>
              <Link href={`${BASE}?aba=ficha&bebe=${p.baby_id}`} className={botao.suave}>{t.abrirFicha}</Link>
              <form action={marcarContinuarFalei}>
                <input type="hidden" name="pedido" value={p.id} />
                <button className={botao.verde}>{t.jaFalei}</button>
              </form>
            </div>
          ))}
        </Card>
      )}

      <Card titulo={t.pedidosTitulo} direita={pv.pedidos.length ? tp.comum.esperandoVoce(pv.pedidos.length) : undefined}>
        {pv.pedidos.length === 0 && <p className="py-4 text-center text-sm text-ninho-cinza">{pv.indisponivel ? t.pedidosEmBreve : t.nenhumPedido}</p>}
        {pv.pedidos.length > 0 && (
          <p className="text-[12.5px] text-ninho-cinza">{tp.comum.pedidoExplica}</p>
        )}
        {pv.pedidos.map((p) => (
          <div key={p.id} className="mt-3 rounded-2xl bg-[#F3EEFC] px-4 py-3">
            <p className="text-[13.5px]">
              <b>{p.responsavel_nome ?? tp.comum.umaFamilia}</b>
              {p.bebe_nome ? <>{tp.comum.querCompartilharDe}<b>{p.bebe_nome}</b></> : tp.comum.querCompartilharBebe}
              <span className="text-ninho-cinza"> · {desdeTxt(p.criado_em, idioma)}</span>
            </p>
            <details className="mt-2">
              <summary className="cursor-pointer text-[13px] font-bold text-[#7C5CD6]">{tp.comum.aprovar}</summary>
              <form action={responderPedidoFamilia} className="mt-2 rounded-xl bg-white p-3">
                <input type="hidden" name="pedido" value={p.id} />
                <label className="flex items-start gap-2.5 text-[13px] leading-relaxed">
                  <input type="checkbox" name="aceite" required className="mt-1 h-4 w-4 shrink-0 accent-[#4CAF74]" />
                  <span>{textoAceiteVinculo(idioma)}</span>
                </label>
                <button name="decisao" value="aprovar" className={`${botao.verde} mt-3`}>{tp.comum.aprovarEVer}</button>
              </form>
            </details>
            <form action={responderPedidoFamilia} className="mt-2">
              <input type="hidden" name="pedido" value={p.id} />
              <button name="decisao" value="recusar" className={botao.cinza}>{tp.comum.recusar}</button>
            </form>
          </div>
        ))}
      </Card>

      <Card
        className="mt-4"
        titulo={t.convitesTitulo}
        direita={convites && convites.length > 0 ? <div className="flex flex-wrap gap-1.5">{chip('todos', t.chipTodos, conta('todos'))}{chip('aguardando', t.chipAguardando, conta('aguardando'))}{chip('aceito', t.chipAceito, conta('aceito'))}{chip('encerrado', t.chipEncerrado, conta('encerrado'))}{chip('cancelado', t.chipCancelado, conta('cancelado'))}</div> : undefined}
      >
        {convites === null ? (
          <p className="py-4 text-center text-sm text-ninho-cinza">{t.convitesEmBreve}</p>
        ) : conv.length === 0 ? (
          <p className="py-4 text-center text-sm text-ninho-cinza">{convites.length ? t.nenhumConviteFiltro : t.nenhumConvite90}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr><th className={th}>{t.colEmail}</th><th className={th}>{t.colEnviado}</th><th className={th}>{t.colSituacao}</th><th className={th} /></tr></thead>
              <tbody>
                {conv.map((x) => (
                  <tr key={`${x.email}-${x.enviado_em}`}>
                    <td className={`${td} break-all`}>{x.email}</td>
                    <td className={`${td} tabular-nums`}>{quandoTxt(x.enviado_em, idioma)}</td>
                    <td className={td}>
                      <Selo cor={COR_CONVITE[x.status] ?? 'cinza'}>{t.statusConvite[x.status] ?? x.status}</Selo>
                      {x.status === 'aguardando' && <small className="mt-0.5 block text-[11.5px] text-ninho-cinza">{t.semContaAinda}</small>}
                    </td>
                    <td className={td}>
                      {x.status === 'aguardando' && (
                        <ConfirmButton action={cancelarConviteFamilia} hidden={{ email: x.email }} label={t.cancelarEnvio} message={t.cancelarMsg(x.email)} />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card
        className="mt-4"
        titulo={t.acompanhaTitulo}
        direita={
          <form className="flex h-9 items-center gap-2 rounded-pill bg-white px-3 shadow-[inset_0_0_0_1.5px_#ECE6F5]">
            <input type="hidden" name="aba" value="familias" />
            <input name="q" defaultValue={sp.q} placeholder={tp.comum.buscarBebeOuMae} className="w-40 bg-transparent text-[13px] outline-none" />
          </form>
        }
      >
        {acompanha.length === 0 ? (
          <p className="py-4 text-center text-sm text-ninho-cinza">{fams.length ? t.nenhumaBusca : ativa ? tp.comum.nenhumaFamilia : t.pausadaVoltam}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr><th className={th}>{tp.comum.bebe}</th><th className={th}>{tp.comum.mae}</th><th className={th}>{t.colConsultoria}</th><th className={th}>{tp.comum.agora}</th><th className={th} /></tr></thead>
              <tbody>
                {acompanha.map((f) => (
                  <tr key={f.baby_id} className="hover:bg-[#FAF8FE]">
                    <td className={td}>
                      <Link href={`${BASE}?aba=rotina&bebe=${f.baby_id}`} className="flex items-center gap-2.5">
                        <Avatar id={f.baby_id} nome={f.bebe_nome} tamanho={32} />
                        <span><b>{f.bebe_nome}</b><small className="block text-[11.5px] text-ninho-cinza">{idadeTxt(f.nascimento, idioma)}</small></span>
                      </Link>
                    </td>
                    <td className={td}>{f.mae_nome ?? '—'}</td>
                    <td className={td}>
                      {/* 00186: a barra já diz quando começou, então ela
                          substitui o antigo "com você desde". */}
                      {fichaDaLinha.get(f.baby_id)?.termino ? (
                        <BarraDoPrazo inicio={fichaDaLinha.get(f.baby_id)?.inicio ?? null} termino={fichaDaLinha.get(f.baby_id)?.termino ?? null} compacta idioma={idioma} />
                      ) : (
                        <>
                          <Selo cor="lilas">{t.comVoceDesde(desdeTxt(f.vinculado_em, idioma))}</Selo>
                          <small className="mt-0.5 block text-[11.5px] text-[#9A95AD]">{t.semDatas}</small>
                        </>
                      )}
                    </td>
                    <td className={td}><SeloAgora f={f} idioma={idioma} /></td>
                    <td className={td}>
                      <Link href={`${BASE}?aba=ficha&bebe=${f.baby_id}`} className={`${botao.suave} mr-2`}>
                        {fichaDaLinha.get(f.baby_id)?.termino ? t.ficha : t.preencherFicha}
                      </Link>
                      <ConfirmButton
                        action={encerrarAcompanhamento}
                        hidden={{ baby: f.baby_id }}
                        label={t.encerrar}
                        message={t.encerrarMsg(f.bebe_nome ?? t.esteBebe)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      {acompanha.length > 0 && <Fichas familias={acompanha} fichas={fichasDaLista} aberta={sp.ficha} idioma={idioma} />}
    </>
  );
}

// ── Aba Ficha (dono, 16/11/2026) ──────────────────────────
// No app, a aba Ficha do bebê junta as anotações da consultora e a orientação
// que ela manda para a família. No painel só existiam as anotações, soltas no
// fim da aba Famílias: aqui ficam as duas coisas, uma família por vez.
async function AbaFicha({ c, sp, idioma }: { c: Consultora; sp: Busca; idioma: Idioma }) {
  const tp = textos(idioma).pagina;
  const t = tp.ficha;
  const fams = c.estado === 'ativa' ? await familiasDa(c.id) : [];
  const f = fams.find((x) => x.baby_id === sp.bebe) ?? fams[0];
  if (!f) {
    return (
      <>
        <Titulo t={t.titulo} />
        <Card>
          <p className="py-8 text-center text-sm text-ninho-cinza">
            {c.estado === 'pausada' ? t.pausada : tp.comum.nenhumaFamilia}
          </p>
        </Card>
      </>
    );
  }
  // A hora das orientações é a da FAMÍLIA, como no resto da área (17/11/2026).
  const rel = await relogioDaFamilia(f.baby_id);
  const [fi, enviadas, aceiteOk, estado] = await Promise.all([
    fichaDe(c.id, f.baby_id),
    orientacoesDoBebe(c.id, f.baby_id),
    orientacaoAceiteOk(c.id),
    novidadesEstado(c.id, f.baby_id),
  ]);
  const seletor = (
    <form className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="aba" value="ficha" />
      <select name="bebe" defaultValue={f.baby_id} className="h-10 rounded-pill bg-white px-4 text-sm font-bold shadow-[inset_0_0_0_1.5px_#ECE6F5]">
        {fams.map((x) => <option key={x.baby_id} value={x.baby_id}>{x.bebe_nome} · {primeiro(x.mae_nome) || '—'}</option>)}
      </select>
      <button className={botao.suave}>{tp.comum.abrir}</button>
    </form>
  );
  const sub = tp.comum.maeSub(f.mae_nome ?? '—', desdeTxt(f.vinculado_em, idioma), idadeTxt(f.nascimento, idioma));

  // Por que o campo pode não abrir. A ordem importa: o motivo mais forte primeiro.
  const bloqueio = !f.plano_ok
    ? t.bloqueioSemPlano(primeiro(f.mae_nome) || t.maeGenerico)
    : aceiteOk === null || enviadas.indisponivel
      ? t.bloqueioIndisponivel
      : estado !== 'aceito'
        ? t.bloqueioSemAceite
        : undefined;

  const quando = (iso: string) => quandoTxt(new Date(iso).getTime() + rel.delta, idioma);

  return (
    <>
      <Titulo t={f.bebe_nome} sub={sub} direita={seletor} />
      <Card
        titulo={t.orientacaoTitulo}
        direita={<span className="rounded-pill bg-[#E3F4EA] px-3 py-1 text-[11.5px] font-extrabold text-[#2F8A55]">{t.familiaVe}</span>}
      >
        <OrientacaoFamilia
          babyId={f.baby_id}
          acao={enviarOrientacaoFamilia}
          precisaAceite={aceiteOk === false}
          termo={textoAceiteVinculo(idioma)}
          bloqueio={bloqueio}
        />
      </Card>

      {enviadas.lista.length > 0 && (
        <Card className="mt-4" titulo={t.jaEnviadas} direita={`${enviadas.lista.length}`}>
          {enviadas.lista.map((o) => (
            <div key={o.id} className="border-b border-[#F3F0F8] py-3 last:border-0">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <b className="text-[12.5px] tabular-nums">{quando(o.enviada_em)}</b>
                <span className={`text-[11.5px] font-bold ${o.lida_em ? 'text-[#2F8A55]' : 'text-ninho-cinza'}`}>
                  {o.lida_em ? t.lidaEm(quando(o.lida_em)) : t.naoLida}
                </span>
              </div>
              <p className="mt-1 whitespace-pre-wrap text-[13.5px] leading-relaxed">{o.texto}</p>
            </div>
          ))}
        </Card>
      )}

      <Card className="mt-4" titulo={t.fichaConsultoria} direita={t.datasEncontrosVe}>
        {fi.indisponivel ? (
          <p className="py-4 text-center text-sm text-ninho-cinza">{t.indisponivel}</p>
        ) : (
          <FormDaFicha f={f} fi={fi.ficha} naAbaFicha idioma={idioma} />
        )}
      </Card>
    </>
  );
}

/** O mesmo formulário da ficha nas duas abas: Famílias (lista) e Ficha. */
function FormDaFicha({ f, fi, naAbaFicha = false, idioma }: { f: FamiliaDaConsultora; fi: Ficha | null; naAbaFicha?: boolean; idioma: Idioma }) {
  const t = textos(idioma).pagina.ficha;
  return (
        <form action={salvarFicha} className="mt-3">
            {naAbaFicha && <input type="hidden" name="volta" value="ficha" />}
            <input type="hidden" name="baby" value={f.baby_id} />
            {/* 00186: um bloco por assunto. Data e encontros não ficam mais
                misturados na mesma linha, e a família passa a ver as duas
                datas e a contagem de encontros na tela dela. */}
            <div className="rounded-2xl border border-[#ECE6F5] px-4 py-3">
              <p className="mb-2 text-[11.5px] font-extrabold uppercase tracking-wide text-[#9A95AD]">{t.datas} <span className="ml-1 rounded-pill bg-[#E3F4EA] px-2 py-0.5 text-[10.5px] text-[#2F8A55]">{t.aFamiliaVe}</span></p>
              <div className="grid gap-2 sm:grid-cols-2">
                <div><label className={rotuloCampo}>{t.inicio}</label><input type="date" name="inicio" defaultValue={fi?.inicio ?? ''} className={campo} /></div>
                <div><label className={rotuloCampo}>{t.termino}</label><input type="date" name="termino" defaultValue={fi?.termino ?? ''} className={campo} /></div>
              </div>
              {fi?.termino && (
                <div className="mt-3 max-w-[320px]"><BarraDoPrazo inicio={fi.inicio} termino={fi.termino} idioma={idioma} /></div>
              )}
              <small className="mt-2 block text-[11.5px] text-ninho-cinza">
                {t.semTermino}
              </small>
            </div>
            <div className="mt-3 rounded-2xl border border-[#ECE6F5] px-4 py-3">
              <p className="mb-2 text-[11.5px] font-extrabold uppercase tracking-wide text-[#9A95AD]">{t.encontros} <span className="ml-1 rounded-pill bg-[#E3F4EA] px-2 py-0.5 text-[10.5px] text-[#2F8A55]">{t.aFamiliaVe}</span></p>
              <div className="grid gap-2 sm:grid-cols-2">
                <div><label className={rotuloCampo}>{t.encontrosCombinados}</label><input type="number" min={0} max={999} name="encontros_total" defaultValue={fi?.encontros_total ?? ''} className={campo} /></div>
                <div><label className={rotuloCampo}>{t.encontrosFeitos}</label><input type="number" min={0} max={999} name="encontros_feitos" defaultValue={fi?.encontros_feitos ?? ''} className={campo} /></div>
              </div>
            </div>
            <div className="mt-3 rounded-2xl border border-[#ECE6F5] px-4 py-3">
              <p className="mb-2 text-[11.5px] font-extrabold uppercase tracking-wide text-[#9A95AD]">{t.nomes}</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <div><label className={rotuloCampo}>{t.nomesPais}</label><input name="pais_nomes" maxLength={120} defaultValue={fi?.pais_nomes ?? ''} className={campo} /></div>
                <div><label className={rotuloCampo}>{t.apelido}</label><input name="bebe_apelido" maxLength={60} defaultValue={fi?.bebe_apelido ?? ''} className={campo} /></div>
              </div>
            </div>
            <label className={`${rotuloCampo} mt-3`}>{t.whatsappFamilia}</label>
            <TelefonePais name="whatsapp" valor={fi?.whatsapp} classeSelect={campo} classeInput={campo} />
            <label className={rotuloCampo}>{t.observacoes}</label>
            <textarea name="observacoes" maxLength={2000} rows={3} defaultValue={fi?.observacoes ?? ''} className={`${campo} h-auto py-2`} />
            <small className="mt-1 block text-[11.5px] text-ninho-cinza">{t.obsDica}</small>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button className={botao.suave}>{t.salvar}</button>
              <span className="text-[11.5px] text-ninho-cinza">
                {t.rodape}
                {fi?.atualizado_em ? t.salvaEm(quandoTxt(fi.atualizado_em, idioma)) : ''}
              </span>
            </div>
          </form>
  );
}

// ── Fichas (anotações da consultora sobre cada família, 00111) ──
function Fichas({ familias, fichas, aberta, idioma }: { familias: FamiliaDaConsultora[]; fichas: { ficha: Ficha | null; indisponivel: boolean }[]; aberta?: string; idioma: Idioma }) {
  const t = textos(idioma).pagina.ficha;
  const lista = familias.slice(0, 60);
  if (fichas.some((x) => x.indisponivel)) {
    return (
      <Card titulo={t.fichasTitulo} className="mt-4">
        <p className="py-4 text-center text-sm text-ninho-cinza">{t.fichasIndisponivel}</p>
      </Card>
    );
  }
  const dataBrOuVazio = (d: string | null) => (d ? dataBr(d, idioma) : '');
  return (
    <Card titulo={t.fichasTitulo} direita={t.fichasDireita} className="mt-4">
      {lista.map((f, i) => {
        const fi: Ficha | null = fichas[i].ficha;
        const encontros = fi?.encontros_total ? t.encontrosDe(fi.encontros_feitos ?? 0, fi.encontros_total) : fi?.encontros_feitos ? t.encontrosSoFeitos(fi.encontros_feitos) : null;
        return (
          <details key={f.baby_id} id={`ficha-${f.baby_id}`} open={aberta === f.baby_id} className="mt-2 rounded-2xl bg-[#F8F6FC] px-4 py-3">
            <summary className="flex cursor-pointer flex-wrap items-center gap-x-3 gap-y-1 text-[13.5px]">
              <b>{f.bebe_nome}{fi?.bebe_apelido ? ` (${fi.bebe_apelido})` : ''}</b>
              <span className="text-ninho-cinza">{fi?.pais_nomes || f.mae_nome || '—'}</span>
              {fi?.inicio && <Selo cor="lilas">{t.desde(dataBrOuVazio(fi.inicio))}</Selo>}
              {fi?.termino && <Selo cor={(diasAteTermino(fi.termino) ?? 99) <= 14 ? 'ambar' : 'lilas'}>{t.ate(dataBrOuVazio(fi.termino))}</Selo>}
              {encontros && <Selo cor="verde">{encontros}</Selo>}
              {fi?.whatsapp && <span className="text-xs text-ninho-cinza">{telefoneLegivel(fi.whatsapp)}</span>}
              {!fi && <span className="text-xs text-[#9A95AD]">{t.semFicha}</span>}
            </summary>
            <FormDaFicha f={f} fi={fi} idioma={idioma} />
          </details>
        );
      })}
    </Card>
  );
}

// ── Rotina e semana (v3) ──────────────────────────────────
function diaRotulo(dia: string, hoje: string, idioma: Idioma): string {
  const t = textos(idioma).pagina.rotina;
  if (dia === hoje) return t.hoje;
  if (dia === somarDias(hoje, -1)) return t.ontem(diaCurto(dia, idioma));
  return diaCurto(dia, idioma).replace(/^./, (x) => x.toUpperCase());
}

function KpiDelta({ rotulo, valor, sub, grande = false }: { rotulo: string; valor: React.ReactNode; sub?: React.ReactNode; grande?: boolean }) {
  return (
    <div className={`rounded-[22px] p-5 shadow-[0_10px_30px_-22px_rgba(80,40,160,.35)] ${grande ? 'bg-gradient-to-b from-[#F1E9FF] to-white' : 'bg-white'}`}>
      <p className="text-xs font-bold text-[#9A95AD]">{rotulo}</p>
      <p className={`mt-1 font-black tabular-nums tracking-tight text-ninho-grafite ${grande ? 'text-[30px]' : 'text-[24px]'}`}>{valor}</p>
      {sub && <div className="mt-0.5 text-xs tabular-nums text-ninho-cinza">{sub}</div>}
    </div>
  );
}

/** Comparação com a semana anterior: seta verde quando melhora, cinza quando piora (nada de alarme). */
function Delta({ agora, antes, melhorQuando, fmt, idioma }: { agora: number | null; antes: number | null; melhorQuando: 'maior' | 'menor'; fmt: (x: number) => string; idioma: Idioma }) {
  if (agora === null || antes === null) return null;
  const dif = agora - antes;
  if (Math.abs(dif) < 0.05 * Math.max(Math.abs(antes), 1)) return <span className="mr-1 rounded-pill bg-[#F0EEF4] px-2 py-0.5 text-[11px] font-extrabold text-ninho-cinza">{textos(idioma).pagina.rotina.parecido}</span>;
  const melhorou = melhorQuando === 'maior' ? dif > 0 : dif < 0;
  return (
    <span className={`mr-1 rounded-pill px-2 py-0.5 text-[11px] font-extrabold ${melhorou ? 'bg-[#E7F5EC] text-[#2F8A55]' : 'bg-[#F0EEF4] text-ninho-cinza'}`}>
      {dif > 0 ? '↑' : '↓'} {fmt(Math.abs(dif))}
    </span>
  );
}

/** Uma casa decimal no idioma ("1,5" · "1.5"). */
const umDe = (idioma: Idioma) => (x: number) => fmtNumero(idioma, x, { minimumFractionDigits: 1, maximumFractionDigits: 1 });

async function Rotina({ c, sp, semana, idioma }: { c: Consultora; sp: Busca; semana: boolean; idioma: Idioma }) {
  const tp = textos(idioma).pagina;
  const t = tp.rotina;
  const ts = tp.semana;
  const um = umDe(idioma);
  const fams = c.estado === 'ativa' ? await familiasDa(c.id) : [];
  const f = fams.find((x) => x.baby_id === sp.bebe) ?? fams[0];
  const aba = semana ? 'semana' : 'rotina';
  if (!f) {
    return (
      <>
        <Titulo t={semana ? t.tituloEvolucao : t.tituloRotina} />
        <Card><p className="py-8 text-center text-sm text-ninho-cinza">{c.estado === 'pausada' ? t.pausada : tp.comum.nenhumaFamilia}</p></Card>
      </>
    );
  }
  // Hora da FAMÍLIA, não a de Brasília (dono, 15/11/2026): o dia, o "agora" e
  // cada horário saem do fuso do responsável principal (lib/consultoras-fuso.ts).
  const rel = await relogioDaFamilia(f.baby_id);
  const hoje = diaLocalDe(rel.agora);
  const agora = rel.agora;
  const seletor = (extra: React.ReactNode = null) => (
    <form className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="aba" value={aba} />
      <select name="bebe" defaultValue={f.baby_id} className="h-10 rounded-pill bg-white px-4 text-sm font-bold shadow-[inset_0_0_0_1.5px_#ECE6F5]">
        {fams.map((x) => <option key={x.baby_id} value={x.baby_id}>{x.bebe_nome} · {primeiro(x.mae_nome) || '—'}</option>)}
      </select>
      <button className={botao.suave}>{tp.comum.abrir}</button>
      {extra}
    </form>
  );
  const sub = tp.comum.maeSub(f.mae_nome ?? '—', desdeTxt(f.vinculado_em, idioma), idadeTxt(f.nascimento, idioma));
  const trava = (msg: React.ReactNode) => (
    <Card><div className="flex flex-col items-center px-5 py-10 text-center text-[13.5px] leading-relaxed text-ninho-cinza">{msg}</div></Card>
  );
  if (!f.plano_ok) {
    return (
      <>
        <Titulo t={f.bebe_nome} sub={sub} direita={seletor()} />
        {trava(<><b className="text-ninho-grafite">{t.semPlanoTitulo(primeiro(f.mae_nome))}</b>{t.semPlanoTexto}</>)}
      </>
    );
  }

  if (!semana) {
    // Padrão: HOJE (dono, 13/11/2026; antes abria em ontem).
    const dia = sp.dia && /^\d{4}-\d{2}-\d{2}$/.test(sp.dia) && sp.dia <= hoje && sp.dia >= somarDias(hoje, -30) ? sp.dia : hoje;
    // Janela antes de cada soneca (26/11/2026): 7 ou 14 dias e o corte da soneca boa.
    const janLib = evolucaoLiberada(c.email_liberado);
    const janDias = lerPeriodo(sp.jan);
    const janCorte = lerCorte(sp.corte);
    const de = new Date(inicioDoDia(somarDias(dia, janLib && janDias === 14 ? -15 : -8)) - 12 * H);
    const ate = new Date(Math.min(inicioDoDia(somarDias(dia, 1)) + 14 * H, agora + 60_000));
    const { registros, semAcesso } = await rotinaDe(c.id, f.baby_id, de, ate, rel);
    const nav = (
      <div className="flex items-center gap-2 rounded-pill bg-white p-1 shadow-[inset_0_0_0_1.5px_#ECE6F5]">
        {dia > somarDias(hoje, -30) ? <Link href={`${BASE}?aba=rotina&bebe=${f.baby_id}&dia=${somarDias(dia, -1)}`} className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F3EEFC] text-[#7C5CD6]">‹</Link> : <span className="h-8 w-8" />}
        <b className="min-w-[150px] text-center text-[13.5px]">{diaRotulo(dia, hoje, idioma)}</b>
        {dia < hoje ? <Link href={`${BASE}?aba=rotina&bebe=${f.baby_id}&dia=${somarDias(dia, 1)}`} className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F3EEFC] text-[#7C5CD6]">›</Link> : <span className="h-8 w-8" />}
      </div>
    );
    const head = <Titulo t={f.bebe_nome} sub={sub} direita={seletor(nav)} />;
    if (semAcesso) return <>{head}{trava(t.semAcesso)}</>;
    const d = diaV3(registros, dia, agora, idioma);
    const janelas = janLib ? janelasDoPeriodo(registros, dia, janDias, janCorte, agora) : null;
    const posJanela = posicaoPorInicio(d.sonecas);
    const etiquetaJanela = janelas
      ? (inicio: number, antes: number) => {
          const p = posJanela.get(inicio);
          if (p === undefined) return d.dormiu === inicio ? textoEtiqueta(compararJanela(antes, janelas.noite), idioma) : null;
          return textoEtiqueta(compararJanela(antes, janelas.sonecas.find((x) => x.posicao === p)), idioma);
        }
      : undefined;
    if (!d.temRegistro) return <>{head}{trava(<><b className="text-ninho-grafite">{t.nadaNoDia}</b>{t.semRegistroSemNumero}</>)}</>;
    const cost = costumeAntes(registros, dia, agora, idioma);
    const ac = cost.horarios.find((h) => h.chave === 'acordou');
    const dm = cost.horarios.find((h) => h.chave === 'dormiu');
    const fora = (v: number | null, faixaH: { min: number | null; max: number | null } | undefined) =>
      v !== null && faixaH && faixaH.min !== null && faixaH.max !== null && (v < faixaH.min - 15 || v > faixaH.max + 15);
    const acM = d.acordou !== null ? minutoDoDia(d.acordou) : null;
    const dmM = d.dormiu !== null ? minutoDaNoite(d.dormiu) : null;
    const despFora = cost.despertaresMed !== null && (d.noite.despertares ?? 0) >= Math.max(3, cost.despertaresMed + 1.5);
    const laranja = 'font-extrabold text-[#A8670F]';
    return (
      <>
        {head}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiDelta grande rotulo={t.sono24} valor={d.sono24 !== null ? dur(d.sono24, idioma) : '—'} sub={<>{t.deSonecas(dur(d.sonecasMin, idioma))}{d.noiteCompleta ? t.maisNoite(dur(d.noite.totalMin ?? 0, idioma)) : ''}{cost.sono24Med !== null ? t.mediaFim(dur(cost.sono24Med, idioma)) : null}</>} />
          <KpiDelta rotulo={t.noite} valor={d.noiteCompleta ? dur(d.noite.totalMin ?? 0, idioma) : d.dormiu !== null ? t.emCurso : '—'} sub={<>{cost.noiteMed !== null ? t.mediaInicio(dur(cost.noiteMed, idioma)) : ''}<span className={despFora ? laranja : ''}>{t.despertares(d.noite.despertares ?? 0)}</span>{cost.despertaresMed !== null ? t.mediaParen(um(cost.despertaresMed)) : ''}{d.noite.primeiroTrechoMin !== null ? t.primeiroBloco(dur(d.noite.primeiroTrechoMin, idioma)) : ''}</>} />
          <KpiDelta rotulo={t.sonecas} valor={`${d.sonecas.length} · ${dur(d.sonecasMin, idioma)}`} sub={cost.sonecasPorDia !== null ? t.deCostume(um(cost.sonecasPorDia), dur(cost.sonecasMinMed ?? 0, idioma)) : t.semSemanaAnterior} />
          <KpiDelta
            rotulo={t.acordouDormiu}
            valor={`${d.acordou !== null ? hora(d.acordou, idioma) : '—'} · ${d.dormiu !== null ? hora(d.dormiu, idioma) : '—'}`}
            sub={<>{t.deCostumePrefixo}<span className={fora(acM, ac) ? laranja : ''}>{faixaTxt(ac, idioma) ?? '—'}</span> · <span className={fora(dmM, dm) ? laranja : ''}>{faixaTxt(dm, idioma) ?? '—'}</span></>}
          />
        </div>
        <Card className="mt-4" titulo={t.doAcordar} direita={d.acordou !== null ? `${diaCurto(dia, idioma)}, ${hora(d.acordou, idioma)} → ${d.acordouSeguinte !== null ? `${diaCurto(somarDias(dia, 1), idioma)}, ${hora(d.acordouSeguinte, idioma)}` : t.agora}` : t.semHoraAcordar}>
          <DiaStrip d={d} maiorJanela={cost.maiorJanela !== null ? Math.max(cost.maiorJanela, ...d.janelas.map((j) => j.min)) : null} agora={agora} idioma={idioma} />
        </Card>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <Card titulo={t.sequencia} direita={t.sequenciaDireita}>
            <Sequencia d={d} etiqueta={etiquetaJanela} idioma={idioma} />
          </Card>
          <Card titulo={t.registros} direita={`${d.resumo.registros.length}`}>
            <div className="max-h-[460px] overflow-auto">
              {/* Na ordem do dia, igual à Sequência ao lado (dono, 12/11/2026). */}
              {[...d.resumo.registros].reverse().map((reg) => {
                const x = descreverRegistro(reg, agora, periodosDaRotina(registros, agora).periodos.get(new Date(reg.inicio).getTime()), idioma);
                return (
                  <div key={reg.id} className="flex items-center gap-3 border-b border-[#F3F0F8] py-2.5 last:border-0">
                    <span className="h-9 w-9 shrink-0 rounded-full" style={{ background: `${x.cor}33`, boxShadow: `inset 0 0 0 3px ${x.cor}` }} />
                    <div className="flex-1">
                      <p className="text-sm font-bold">{x.titulo}</p>
                      <p className="text-xs tabular-nums text-ninho-cinza">{x.detalhe}</p>
                      {/* Comentário da família (aceite v7; só leitura, sem link clicável). */}
                      {typeof reg.detalhe?.nota === 'string' && reg.detalhe.nota ? (
                        <p className="mt-1.5 whitespace-pre-wrap rounded-xl bg-[#F6F2FE] px-2.5 py-1.5 text-[12px] italic leading-snug text-ninho-grafite">
                          <span className="mb-0.5 block text-[10.5px] font-bold not-italic text-[#7C5CD6]">{t.comentarioFamilia}</span>
                          {reg.detalhe.nota as string}
                        </p>
                      ) : null}
                    </div>
                    <div className="text-right">
                      <p className="text-[13px] font-extrabold tabular-nums">{hora(new Date(reg.inicio).getTime(), idioma)}</p>
                      <p className="text-[11px] text-ninho-cinza">{reg.registrado_por ?? ''}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="mt-2.5 text-[11.5px] font-semibold text-[#9A95AD]">{t.soLeitura(rel.fuso ? rel.fuso.replace(/_/g, ' ') : null)}</p>
          </Card>
        </div>
        {janelas && (
          <Card className="mt-4" titulo={t.janelasSonecas}>
            <JanelasDasSonecas dados={janelas} dias={janDias} corte={janCorte} diaAberto={dia} bebe={f.bebe_nome ?? ''} idioma={idioma} href={(n, ct) => `${BASE}?aba=rotina&bebe=${f.baby_id}&dia=${dia}&jan=${n}&corte=${ct}`} />
          </Card>
        )}
      </>
    );
  }

  // Semana: os dias que já terminaram (o último é ontem), comparados ao período
  // anterior. O período (7, 14 ou 30, padrão 7) é o da Evolução do sono e manda
  // também nos números de cima (dono, 13/11/2026).
  const evoDias = sp.evo === '14' ? 14 : sp.evo === '30' ? 30 : 7;
  const evoQ = `&evo=${evoDias}`;
  const ultimo = sp.dia && /^\d{4}-\d{2}-\d{2}$/.test(sp.dia) && sp.dia < hoje && sp.dia >= somarDias(hoje, -60) ? sp.dia : somarDias(hoje, -1);
  const de = new Date(inicioDoDia(somarDias(ultimo, -Math.max(14, evoDias))) - 12 * H);
  const ate = new Date(Math.min(inicioDoDia(somarDias(ultimo, 1)) + 14 * H, agora + 60_000));
  const { registros, semAcesso } = await rotinaDe(c.id, f.baby_id, de, ate, rel);
  // 14 e 30: o período anterior num segundo pedido (o servidor entrega até 35 dias).
  const regsAntes =
    evoDias === 7 || semAcesso
      ? registros
      : (await rotinaDe(c.id, f.baby_id, new Date(inicioDoDia(somarDias(ultimo, -2 * evoDias)) - 12 * H), new Date(inicioDoDia(somarDias(ultimo, -evoDias + 1)) + 14 * H), rel)).registros;
  const ini = somarDias(ultimo, -(evoDias - 1));
  const nav = (
    <div className="flex items-center gap-2 rounded-pill bg-white p-1 shadow-[inset_0_0_0_1.5px_#ECE6F5]">
      {ultimo > somarDias(hoje, -60) ? <Link href={`${BASE}?aba=semana&bebe=${f.baby_id}&dia=${somarDias(ultimo, -evoDias)}${evoQ}`} className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F3EEFC] text-[#7C5CD6]">‹</Link> : <span className="h-8 w-8" />}
      <b className="min-w-[140px] text-center text-[13.5px]">{dataBr(ini, idioma).slice(0, 5)} – {dataBr(ultimo, idioma).slice(0, 5)}</b>
      {ultimo < somarDias(hoje, -1) ? <Link href={`${BASE}?aba=semana&bebe=${f.baby_id}&dia=${somarDias(ultimo, evoDias) < hoje ? somarDias(ultimo, evoDias) : somarDias(hoje, -1)}${evoQ}`} className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F3EEFC] text-[#7C5CD6]">›</Link> : <span className="h-8 w-8" />}
    </div>
  );
  const head = (
    <Titulo
      t={ts.titulo(f.bebe_nome ?? '')}
      sub={ts.sub(dataBr(ini, idioma).slice(0, 5), dataBr(ultimo, idioma).slice(0, 5), dataBr(somarDias(ini, -evoDias), idioma).slice(0, 5), dataBr(somarDias(ultimo, -evoDias), idioma).slice(0, 5))}
      direita={seletor(<>{nav}<Link href={`${BASE}?aba=relatorio&bebe=${f.baby_id}&dias=7`} className={botao.grad}>{ts.relatorioSemana}</Link></>)}
    />
  );
  if (semAcesso) return <>{head}{trava(ts.semAcesso)}</>;
  // Os desenhos da semana continuam de 7 dias; os números de cima seguem o período.
  const s = semanaV3(registros, ultimo, agora, 7, idioma);
  const sp_ = semanaV3(registros, ultimo, agora, evoDias, idioma);
  const a = semanaV3(regsAntes, somarDias(ultimo, -evoDias), agora, evoDias, idioma);
  const evoLib = evolucaoLiberada(c.email_liberado);
  const evo = evoLib ? evolucaoSono(registros, ultimo, evoDias, agora) : [];
  const vinculoDia = f.vinculado_em ? new Date(new Date(f.vinculado_em).getTime() + FUSO_MS).toISOString().slice(0, 10) : null;
  const durI = (x: number) => dur(x, idioma);
  return (
    <>
      {head}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
        <KpiDelta grande rotulo={ts.noiteMedia} valor={sp_.noiteMed !== null ? durI(sp_.noiteMed) : '—'} sub={<><Delta agora={sp_.noiteMed} antes={a.noiteMed} melhorQuando="maior" fmt={durI} idioma={idioma} />{a.noiteMed !== null ? ts.antes(durI(a.noiteMed)) : ''} · {ts.noitesCompletas(sp_.noitesCompletas, evoDias)}</>} />
        <KpiDelta rotulo={ts.despertaresPorNoite} valor={sp_.despertaresMed !== null ? um(sp_.despertaresMed) : '—'} sub={<><Delta agora={sp_.despertaresMed} antes={a.despertaresMed} melhorQuando="menor" fmt={um} idioma={idioma} />{a.despertaresMed !== null ? ts.antes(um(a.despertaresMed)) : ''}</>} />
        <KpiDelta rotulo={ts.primeiroBloco} valor={sp_.blocoMed !== null ? durI(sp_.blocoMed) : '—'} sub={<><Delta agora={sp_.blocoMed} antes={a.blocoMed} melhorQuando="maior" fmt={durI} idioma={idioma} />{a.blocoMed !== null ? ts.antes(durI(a.blocoMed)) : ''}</>} />
        <KpiDelta rotulo={ts.sonecasPorDia} valor={sp_.sonecasPorDia !== null ? `${um(sp_.sonecasPorDia)} · ${durI(sp_.sonecasMinMed ?? 0)}` : '—'} sub={a.sonecasPorDia !== null ? ts.antes(`${um(a.sonecasPorDia)} · ${durI(a.sonecasMinMed ?? 0)}`) : undefined} />
      </div>
      {evoLib && <Card
        className="mt-4"
        titulo={ts.evolucao}
        direita={
          <span className="flex gap-1.5">
            {[7, 14, 30].map((n) => (
              <Link key={n} href={`${BASE}?aba=semana&bebe=${f.baby_id}&evo=${n}`} className={`rounded-full px-3 py-1 text-[12px] font-bold ${n === evoDias ? 'bg-[#7C5CD6] text-white' : 'bg-[#F5F1FB] text-ninho-cinza'}`}>
                {tp.comum.dias(n)}
              </Link>
            ))}
          </span>
        }
      >
        <p className="text-[12px] text-ninho-cinza">{ts.evolucaoDica}</p>
        <EvolucaoSono linhas={evo} inicioVinculo={vinculoDia} href={(dia) => `${BASE}?aba=rotina&bebe=${f.baby_id}&dia=${dia}`} idioma={idioma} />
      </Card>}
      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1.25fr]">
        <Card titulo={ts.sonoPorDia} direita={ts.sonoPorDiaDireita}>
          <BarrasSemana s={s} href={(dia) => `${BASE}?aba=rotina&bebe=${f.baby_id}&dia=${dia}`} idioma={idioma} />
        </Card>
        <Card titulo={ts.noites} direita={ts.noitesDireita}>
          <FaixasNoites s={s} idioma={idioma} />
        </Card>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-[1.25fr_1fr]">
        <Card titulo={ts.sonecasNoite} direita={ts.sonecasNoiteDireita}>
          <SonecasNoite s={s} idioma={idioma} />
        </Card>
        <Card titulo={ts.horarios} direita={ts.horariosDireita}>
          <Horarios s={s} idioma={idioma} />
          <h3 className="mt-5 text-[15px] font-extrabold text-ninho-grafite">{ts.janela}</h3>
          <JanelaAntesDeDormir s={s} idioma={idioma} />
        </Card>
      </div>
      <p className="mt-3 text-[11.5px] text-ninho-cinza">{ts.rodape}</p>
    </>
  );
}

// ── Relatório IA ──────────────────────────────────────────
async function RelatorioIA({ c, sp, idioma }: { c: Consultora; sp: Busca & { dias?: string; id?: string; gerando?: string }; idioma: Idioma }) {
  const tp = textos(idioma).pagina;
  const t = tp.relatorio;
  const [status, fams] = await Promise.all([iaStatus(c.id), c.estado === 'ativa' ? familiasDa(c.id) : Promise.resolve([] as FamiliaDaConsultora[])]);
  const elegiveis = fams.filter((f) => f.plano_ok);
  if (sp.id) return <RelatorioCompleto c={c} id={sp.id} status={status} fams={fams} idioma={idioma} />;

  const f = elegiveis.find((x) => x.baby_id === sp.bebe) ?? elegiveis[0];
  const dias: 7 | 14 = sp.dias === '14' ? 14 : 7;
  const agora = Date.now();
  let chips: { ok: boolean; txt: string }[] = [];
  if (f) {
    const rel = await relogioDaFamilia(f.baby_id, agora);
    const ultimo = somarDias(diaLocalDe(rel.agora), -1);
    const { registros, semAcesso } = await rotinaDe(c.id, f.baby_id, new Date(inicioDoDia(somarDias(ultimo, -dias)) - 12 * H), new Date(rel.agora + 60_000), rel);
    if (!semAcesso) {
      const s = semanaV3(registros, ultimo, rel.agora, dias, idioma);
      const sonecas = s.dias.reduce((x, d) => x + d.sonecas.length, 0);
      const mamadas = registros.filter((r) => r.tipo === 'feeding' && new Date(r.inicio).getTime() >= inicioDoDia(somarDias(ultimo, -(dias - 1)))).length;
      chips = [
        { ok: s.noitesCompletas >= Math.ceil(dias * 0.7), txt: t.chipNoites(s.noitesCompletas, dias) },
        { ok: sonecas >= dias, txt: t.chipSonecas(sonecas) },
        { ok: mamadas > 0, txt: t.chipMamadas(mamadas) },
      ];
    }
  }
  const lista = status ? await listarRelatorios(c.id, null) : null;
  const nomeBebe = new Map(fams.map((x) => [x.baby_id, x.bebe_nome]));
  const semCota = status && !status.podeGerar;

  return (
    <>
      <Titulo t={t.titulo} sub={t.sub} />
      {!status && (
        <Aviso tom="ambar">{t.indisponivel}</Aviso>
      )}
      <div className="mt-4 grid gap-4 lg:grid-cols-[380px_1fr]">
        <div className="flex flex-col gap-4">
          {semCota ? (
            <Card>
              <div className="py-2 text-center">
                <p className="text-[20px] font-black leading-tight tracking-tight">{t.semCotaTitulo}</p>
                <p className="mt-1.5 text-[13px] text-ninho-cinza">
                  {status!.assinante ? t.usouCota(status!.limiteMes) : t.gratisSalvo}
                </p>
              </div>
              {!status!.assinante && (
                <>
                  <ul className="mt-3 space-y-2 text-[13.5px]">
                    <li>{t.beneficio1(IA_LIMITE_MES)}</li>
                    <li>{t.beneficio2}</li>
                    <li>{t.beneficio3}</li>
                  </ul>
                  <div className="mt-4 rounded-2xl bg-[#EEF8F1] p-4 text-center">
                    <p className="text-[13px] font-bold text-[#2F8A55]">{t.assinaturaConsultora}</p>
                    <p className="text-[24px] font-black tabular-nums text-[#2F8A55]">{brl(IA_PRECO_MENSAL, idioma)}<span className="text-sm font-bold">{tp.comum.porMes}</span></p>
                  </div>
                  <Aviso>
                    <b>{t.assineAppNegrito}</b>{t.assineAppTexto}
                  </Aviso>
                </>
              )}
            </Card>
          ) : (
            <Card titulo={t.pedir} direita={status && !status.assinante && !status.gratisUsado ? <Selo cor="verde">{t.primeiroGratis}</Selo> : status?.assinante ? t.noMes(status.usadosMes, status.limiteMes) : undefined}>
              {elegiveis.length === 0 ? (
                <p className="py-4 text-center text-sm text-ninho-cinza">{t.nenhumaComPlano}</p>
              ) : (
                <>
                  <form className="mt-1">
                    <input type="hidden" name="aba" value="relatorio" />
                    <label className={rotuloCampo}>{t.paraQualBebe}</label>
                    <select name="bebe" defaultValue={f?.baby_id} className={campo}>
                      {elegiveis.map((x) => <option key={x.baby_id} value={x.baby_id}>{x.bebe_nome} · {primeiro(x.mae_nome) || '—'}</option>)}
                    </select>
                    <label className={rotuloCampo}>{t.periodo}</label>
                    <div className="flex gap-2">
                      {IA_PERIODOS.map((p) => (
                        <label key={p} className={`flex-1 cursor-pointer rounded-xl px-3 py-2 text-center text-[13px] font-bold ${dias === p ? 'bg-[#24164F] text-white' : 'bg-[#F5F2FB] text-ninho-cinza'}`}>
                          <input type="radio" name="dias" value={p} defaultChecked={dias === p} className="sr-only" />
                          {tp.comum.dias(p)}
                        </label>
                      ))}
                    </div>
                    <button className={`${botao.cinza} mt-3`}>{t.conferir}</button>
                  </form>
                  {chips.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {chips.map((x) => (
                        <span key={x.txt} className={`rounded-pill px-2.5 py-1 text-[11.5px] font-bold ${x.ok ? 'bg-[#E7F5EC] text-[#2F8A55]' : 'bg-[#FFF2D6] text-[#B7791F]'}`}>{x.ok ? '✓' : '!'} {x.txt}</span>
                      ))}
                    </div>
                  )}
                  <p className="mt-2 text-[12px] leading-snug text-ninho-cinza">{t.usaDados}</p>
                  <form action={pedirRelatorio} className="mt-3">
                    <input type="hidden" name="bebe" value={f?.baby_id ?? ''} />
                    <input type="hidden" name="dias" value={dias} />
                    <button className={`${botao.grad} w-full`} disabled={!status || !f}>{t.gerar(f?.bebe_nome ?? '—', dias)}</button>
                  </form>
                  <p className="mt-2 text-center text-[11.5px] text-ninho-cinza">{t.leva20}</p>
                </>
              )}
            </Card>
          )}
        </div>
        <Card titulo={t.seus} direita={lista ? `${lista.length}` : undefined}>
          {!lista || lista.length === 0 ? (
            <p className="py-8 text-center text-sm text-ninho-cinza">{lista ? t.nenhum : t.aparecemQuando}</p>
          ) : (
            <table className="w-full">
              <thead><tr><th className={th}>{tp.comum.bebe}</th><th className={th}>{t.periodo}</th><th className={th}>{t.colGerado}</th><th className={th} /></tr></thead>
              <tbody>
                {lista.map((r) => (
                  <tr key={r.id} className="hover:bg-[#FAF8FE]">
                    <td className={td}><b>{r.bebe ?? (r.babyId ? nomeBebe.get(r.babyId) : null) ?? tp.comum.bebe}</b></td>
                    <td className={td}>{r.dias ? tp.comum.dias(r.dias) : ''}{r.de && r.ate ? ` · ${tp.comum.periodo(dataBr(r.de, idioma).slice(0, 5), dataBr(r.ate, idioma).slice(0, 5))}` : ''}</td>
                    <td className={td}>{r.criadoEm ? quandoTxt(r.criadoEm, idioma) : '—'}</td>
                    <td className={td}><Link href={`${BASE}?aba=relatorio&id=${r.id}`} className={botao.suave}>{tp.comum.abrir}</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </>
  );
}

async function RelatorioCompleto({ c, id, status, fams, idioma }: { c: Consultora; id: string; status: IaStatus | null; fams: FamiliaDaConsultora[]; idioma: Idioma }) {
  const tp = textos(idioma).pagina;
  const t = tp.relatorio;
  const r = await lerRelatorio(c.id, id);
  if (!r) {
    return (
      <>
        <Titulo t={t.relatorio} direita={<Link href={`${BASE}?aba=relatorio`} className={botao.cinza}>{tp.comum.voltar}</Link>} />
        <Card><p className="py-8 text-center text-sm text-ninho-cinza">{t.naoEncontrado}</p></Card>
      </>
    );
  }
  const fam = fams.find((x) => x.baby_id === r.babyId) ?? null;
  const bebe = r.bebe ?? fam?.bebe_nome ?? tp.comum.bebe;
  const sx = secoes(r.conteudo);
  // Desenhos do período do relatório, com os mesmos registros da Semana.
  let s: SemanaV3 | null = null;
  if (fam && fam.plano_ok && r.ate) {
    const ultimo = r.ate.slice(0, 10);
    const n = r.dias === 14 ? 14 : 7;
    const rel = await relogioDaFamilia(fam.baby_id);
    const rot = await rotinaDe(c.id, fam.baby_id, new Date(inicioDoDia(somarDias(ultimo, -n)) - 12 * H), new Date(Math.min(inicioDoDia(somarDias(ultimo, 1)) + 14 * H, rel.agora + 60_000)), rel);
    if (!rot.semAcesso) s = semanaV3(rot.registros, ultimo, rel.agora, n, idioma);
  }
  const ficha = fam ? (await fichaDe(c.id, fam.baby_id)).ficha : null;
  const periodo = `${r.dias ? tp.comum.dias(r.dias) : ''}${r.de && r.ate ? ` · ${tp.comum.periodo(dataBr(r.de, idioma).slice(0, 5), dataBr(r.ate, idioma).slice(0, 5))}` : ''}`;
  const geradoEm = r.criadoEm ? quandoTxt(r.criadoEm, idioma, true) : '';
  const msgFamilia = t.msgFamilia(ficha?.bebe_apelido || bebe, periodo.replace(/^ · /, ''));
  const Sec = ({ n, t, children, dica }: { n: number; t: string; children: React.ReactNode; dica?: string }) => (
    <section data-secao={n} className="relatorio-secao border-t border-[#F0ECF6] pt-4 first:border-0 first:pt-0">
      <div className="mb-2 flex items-center gap-2.5">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#24164F] text-[13px] font-black text-white">{n}</span>
        <h2 className="text-[15.5px] font-extrabold text-[#24164F]">{t}</h2>
        {dica && <span className="ml-auto text-[11.5px] text-ninho-cinza">{dica}</span>}
      </div>
      {children}
    </section>
  );
  const P = ({ xs }: { xs: string[] }) => (xs.length ? <>{xs.map((x, i) => <p key={i} className="mt-1.5 text-[13.5px] leading-relaxed">{x}</p>)}</> : <p className="text-[13px] text-[#9A95AD]">{t.semTexto}</p>);
  const idade = idadeTxt(fam?.nascimento ?? null, idioma);
  return (
    <div className="relatorio-ia">
      <div className="no-print">
        <Titulo
          t={t.tituloDe(bebe)}
          sub={`${idade ? `${idade} · ` : ''}${periodo.replace(/^ · /, '')}${geradoEm ? ` · ${t.geradoEm(geradoEm)}` : ''}`}
          direita={<Link href={`${BASE}?aba=relatorio`} className={botao.cinza}>{tp.comum.voltar}</Link>}
        />
      </div>
      {/* Cabeçalho do PDF: só na impressão. */}
      <div className="print-only mb-5 hidden items-center gap-3 border-b border-[#EFEAF7] pb-4">
        <Avatar id={c.id} nome={c.nome} foto={c.foto_url} tamanho={52} />
        <div className="flex-1">
          <p className="text-[17px] font-black">{c.nome}</p>
          <p className="text-[12.5px] text-ninho-cinza">{tp.comum.consultoraIndependente}</p>
        </div>
        <div className="text-right text-[12px] text-ninho-cinza">
          <p className="font-extrabold text-[#24164F]">{t.tituloDe(bebe)}</p>
          <p>{periodo.replace(/^ · /, '')}</p>
          {geradoEm && <p>{t.geradoEm(geradoEm)}</p>}
        </div>
      </div>
      <CompartilharRelatorio whatsapp={ficha?.whatsapp ?? null} mensagem={msgFamilia}>
        <div className="grid items-start gap-4 lg:grid-cols-[1fr_330px]">
          <div className="flex flex-col gap-5 rounded-[22px] bg-white p-6 shadow-[0_10px_30px_-22px_rgba(80,40,160,.35)]">
            {r.falta.length > 0 && (
              <section className="rounded-2xl bg-[#FFF8EC] p-4">
                <p className="font-extrabold">{t.faltaTitulo}</p>
                <ul className="mt-2 list-disc pl-5 text-[13.5px]">{r.falta.map((x, i) => <li key={i}>{x}</li>)}</ul>
              </section>
            )}
            {sx.notaSaude && <Aviso tom="ambar">{sx.notaSaude}</Aviso>}
            <Sec n={1} t={t.secResumo}>
              {sx.resumo.length ? (
                <ul className="flex flex-col gap-2">
                  {sx.resumo.map((x, i) => <li key={i} className="flex gap-2.5 text-[14px] leading-relaxed"><i className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#9F86E0]" />{x}</li>)}
                </ul>
              ) : <P xs={[]} />}
            </Sec>
            <div className="grid gap-5 md:grid-cols-2">
              <Sec n={2} t={t.secNoite}>
                {s && <FaixasNoites s={s} idioma={idioma} />}
                <P xs={sx.noite} />
              </Sec>
              <Sec n={3} t={t.secSonecas}>
                {s && <JanelaAntesDeDormir s={s} idioma={idioma} />}
                <P xs={sx.sonecas} />
                {sx.faixaIdade && <p className="mt-2 rounded-xl bg-[#F8F6FC] p-2.5 text-[12px] text-ninho-cinza">{sx.faixaIdade}</p>}
              </Sec>
            </div>
            <Sec n={4} t={t.secPadroes} dica={t.secPadroesDica}>
              {sx.padroes.length ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {sx.padroes.map((p, i) => (
                    <div key={i} className="rounded-2xl bg-[#F8F6FC] p-3">
                      <p className="flex items-center justify-between gap-2 text-[13.5px] font-extrabold">
                        {p.titulo}
                        <span className="flex gap-0.5">{[1, 2, 3].map((k) => <i key={k} className="h-1.5 w-3 rounded-full" style={{ background: k <= p.forca ? '#7C5CD6' : '#E2DCEF' }} />)}</span>
                      </p>
                      {p.evidencia && <p className="mt-1 text-[13px] leading-relaxed text-ninho-cinza">{p.evidencia}</p>}
                    </div>
                  ))}
                </div>
              ) : <P xs={[]} />}
            </Sec>
            <div className="grid gap-5 md:grid-cols-2">
              <Sec n={5} t={t.secMelhoresPiores}>
                {(sx.melhores.length > 0 || sx.piores.length > 0) && (
                  <div className="grid grid-cols-2 gap-2 text-[12.5px]">
                    <div className="rounded-xl bg-[#EEF8F1] p-2.5"><p className="font-extrabold text-[#2F8A55]">{t.melhores}</p>{sx.melhores.map((x, i) => <p key={i}>{x}</p>)}</div>
                    <div className="rounded-xl bg-[#FFF8EC] p-2.5"><p className="font-extrabold text-[#A8670F]">{t.piores}</p>{sx.piores.map((x, i) => <p key={i}>{x}</p>)}</div>
                  </div>
                )}
                {sx.diferencas.length > 0 && (
                  <table className="mt-2 w-full text-[12.5px]">
                    <tbody>
                      {sx.diferencas.map((d2, i) => (
                        <tr key={i} className="border-b border-[#F5F2FA]"><td className="py-1.5 pr-2 font-bold">{d2.item}</td><td className="py-1.5 pr-2 text-[#2F8A55]">{d2.melhores}</td><td className="py-1.5 text-[#A8670F]">{d2.piores}</td></tr>
                      ))}
                    </tbody>
                  </table>
                )}
                {!sx.melhores.length && !sx.piores.length && !sx.diferencas.length && <P xs={[]} />}
              </Sec>
              <Sec n={6} t={t.secConsistencia}>
                {s && <Horarios s={s} idioma={idioma} />}
                <P xs={sx.consistencia} />
              </Sec>
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              <Sec n={7} t={t.secPerguntas} dica={t.secPerguntasDica}>
                {sx.perguntas.length ? <ol className="list-decimal space-y-1.5 pl-5 text-[13.5px] leading-relaxed">{sx.perguntas.map((x, i) => <li key={i}>{x}</li>)}</ol> : <P xs={[]} />}
              </Sec>
              <Sec n={8} t={t.secObservar}>
                {sx.observar.length ? <ul className="space-y-1.5 text-[13.5px] leading-relaxed">{sx.observar.map((x, i) => <li key={i}>• {x}</li>)}</ul> : <P xs={[]} />}
              </Sec>
            </div>
            {sx.outros.map((o) => (
              <section key={o.titulo} className="border-t border-[#F0ECF6] pt-4">
                <h2 className="mb-1 text-[14px] font-extrabold capitalize text-[#24164F]">{o.titulo}</h2>
                <P xs={o.texto} />
              </section>
            ))}
            <p className="mt-1 flex items-start gap-2 rounded-2xl bg-[#F3EEFC] p-3 text-[12.5px] leading-snug text-[#4B3A8C]">ⓘ {rodapeIa(idioma)}</p>
          </div>
          <div className="no-print flex flex-col gap-4 lg:sticky lg:top-20">
            {r.dadosUsados && (
              <Card titulo={t.dadosUsados}>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(r.dadosUsados).map(([k, v]) => (
                    <span key={k} className="rounded-pill bg-[#F0EEF4] px-2.5 py-1 text-[11.5px] font-bold text-ninho-cinza">{k.replace(/_/g, ' ')}: {String(v)}</span>
                  ))}
                </div>
                <p className="mt-2 text-[12px] text-ninho-cinza">{t.naoEntram}</p>
              </Card>
            )}
            <Card titulo={t.seus}>
              <p className="text-[13px] text-ninho-cinza">
                {!status ? t.situacaoIndisp : status.assinante ? t.ativaAte(status.assinaturaAte ? dataBr(status.assinaturaAte, idioma) : null, status.usadosMes, status.limiteMes) : status.gratisUsado ? t.gratisFoi(brl(IA_PRECO_MENSAL, idioma)) : t.aindaTemGratis}
              </p>
            </Card>
          </div>
        </div>
      </CompartilharRelatorio>
    </div>
  );
}

// ── Assinatura IA e Ajuda (menu de conta) ─────────────────
async function AssinaturaIA({ c, idioma }: { c: Consultora; idioma: Idioma }) {
  const tp = textos(idioma).pagina;
  const t = tp.assinatura;
  const st = await iaStatus(c.id);
  return (
    <>
      <Titulo t={t.titulo} sub={t.sub} />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card titulo={t.suaSituacao}>
          {!st ? (
            <p className="py-4 text-sm text-ninho-cinza">{t.indisponivel}</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <Kpi rotulo={t.assinatura} valor={st.assinante ? t.ativa : t.semAssinatura} sub={st.assinante && st.assinaturaAte ? t.ate(dataBr(st.assinaturaAte, idioma)) : st.gratisUsado ? t.gratisUsado : t.gratisDisponivel} />
              <Kpi rotulo={t.noMes} valor={tp.comum.deTotal(st.usadosMes, st.assinante ? st.limiteMes : 1)} sub={st.podeGerar ? t.podeGerar : t.semDisponivel} />
            </div>
          )}
          <Link href={`${BASE}?aba=relatorio`} className={`${botao.grad} mt-4`}>{t.irPara}</Link>
        </Card>
        <Card titulo={t.comoAssinar}>
          <div className="rounded-2xl bg-[#EEF8F1] p-4 text-center">
            <p className="text-[13px] font-bold text-[#2F8A55]">{tp.relatorio.assinaturaConsultora}</p>
            <p className="text-[24px] font-black tabular-nums text-[#2F8A55]">{brl(IA_PRECO_MENSAL, idioma)}<span className="text-sm font-bold">{tp.comum.porMes}</span></p>
            <p className="text-[12px] text-[#2F8A55]">{t.limite(IA_LIMITE_MES)}</p>
          </div>
          <Aviso>
            {t.avisoAntes}<b>{t.avisoNegrito}</b>{t.avisoDepois}
          </Aviso>
        </Card>
      </div>
    </>
  );
}

function Ajuda({ c, idioma }: { c: Consultora; idioma: Idioma }) {
  const t = textos(idioma).pagina.ajuda;
  return (
    <>
      <Titulo t={t.titulo} />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card titulo={t.seuCodigo}>
          <p className="text-3xl font-black tracking-[0.12em] text-[#24164F]">{c.codigo}</p>
          <p className="mt-2 text-[12.5px] text-ninho-cinza">{t.codigoTexto(COMISSAO_VISIVEL)}</p>
        </Card>
        <Card titulo={t.ajuda}>
          <ul className="space-y-2 text-[13.5px] leading-relaxed">
            <li><b>{t.entrarT}</b>{t.entrar}</li>
            <li><b>{t.sumiuT}</b>{t.sumiu}</li>
            {COMISSAO_VISIVEL && <li><b>{t.comissaoT}</b> {textoQuemGeraComissao(idioma)}</li>}
            <li><b>{t.falarT}</b>{t.falar}</li>
          </ul>
        </Card>
      </div>
    </>
  );
}

/**
 * Manual da consultora (dono, 14/11/2026): o mesmo passo a passo que ele manda
 * em PDF, agora dentro do painel dela. O app tem a versão enxuta no menu ☰.
 */
function Manual({ c, idioma }: { c: Consultora; idioma: Idioma }) {
  const t = textos(idioma).pagina.manual;
  return (
    <>
      <Titulo t={t.titulo} sub={t.sub} />
      <ManualDaConsultora
        dados={{ nome: primeiro(c.nome) || t.nomePadrao, email: c.email_liberado ?? '', codigo: c.codigo, whatsapp: c.whatsapp }}
        idioma={idioma}
      />
    </>
  );
}

// ── Convidar ──────────────────────────────────────────────
async function Convidar({ c, ok, erro, idioma }: { c: Consultora; ok?: string; erro?: string; idioma: Idioma }) {
  const t = textos(idioma).pagina.convidar;
  // Só o que liga a família a você (dono, 12/11/2026). O link de divulgação
  // (indicar e ganhar comissão) fica no topo de Ganhos.
  const comConsultoria = consultoriaLiberada(c.email_liberado);
  return (
    <>
      <Titulo t={t.titulo} sub={t.sub} />
      {!c.codigo ? (
        <Aviso tom="ambar">{t.semCodigo}</Aviso>
      ) : (
        <>
          {comConsultoria && <LinkConsultoria codigo={c.codigo} idioma={idioma} />}
          <div className={comConsultoria ? 'mt-3.5' : ''}>
            <CodigoConsultora codigo={c.codigo} principal={!comConsultoria} idioma={idioma} />
          </div>
        </>
      )}
      <Card titulo={t.porEmailTitulo} className="mt-4">
        <p className="text-[13px] leading-relaxed text-ninho-cinza">
          {t.porEmailTexto}{COMISSAO_VISIVEL ? t.naoGeraComissao : ''}
        </p>
        <form action={convidarFamilia} className="mt-3 max-w-xl">
          <label className={rotuloCampo}>{t.emailLabel}</label>
          <input name="email" type="email" required maxLength={254} placeholder={t.emailPh} className={campo} />
          <label className="mt-3 flex items-start gap-2.5 text-[13px] leading-relaxed">
            <input type="checkbox" name="aceite" required className="mt-1 h-4 w-4 shrink-0 accent-[#4CAF74]" />
            <span>{textoAceiteVinculo(idioma)}</span>
          </label>
          <button className={`${botao.grad} mt-4`} disabled={c.estado !== 'ativa'}>{t.enviar}</button>
        </form>
        {(ok || erro) && <div className="mt-3"><Retorno ok={ok} erro={erro} /></div>}
      </Card>
      {COMISSAO_VISIVEL && <Aviso tom="vermelho">{t.indicarAviso}</Aviso>}
    </>
  );
}

// ── Ganhos ────────────────────────────────────────────────
async function Ganhos({ c, mes, idioma }: { c: Consultora; mes?: string; idioma: Idioma }) {
  const t = textos(idioma).pagina.ganhos;
  const pct = (p: number) => pctTxt(p, idioma);
  const brlI = (v: number) => brl(v, idioma);
  const [g, eventos, base] = await Promise.all([montarGanhos(c, idioma), eventosDosLinks(), baseComissoes()]);
  const funil = funilDaConsultora(c.id, base.familias, eventos, ultimosMesesFunil(6));
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
        t={t.titulo}
        sub={
          g.consultora.indicada_por_nome
            ? t.subIndicada(g.consultora.indicada_por_nome, pct(PCT_REDE))
            : t.subDireta(pct(PCT_DIRETO), PARCELAS_MENSAL, pct(PCT_REDE))
        }
        direita={
          meses.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {meses.slice(0, 6).map((mm) => (
                <Link key={mm} href={`${BASE}?aba=ganhos&mes=${mm}`} className={`rounded-pill px-3 py-1.5 text-xs font-bold ${mm === m ? 'bg-[#24164F] text-white' : 'bg-white text-ninho-cinza shadow-[inset_0_0_0_1.5px_#ECE6F5]'}`}>{nomeMes(mm, idioma)}</Link>
              ))}
            </div>
          )
        }
      />
      {/* Link de divulgação: indicar o Ninho e ganhar comissão (dono, 12/11/2026). */}
      {c.codigo && (
        <div className="mb-4">
          <LinkDivulgacao codigo={c.codigo} idioma={idioma} />
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Dono, 13/11/2026: o que conta é quem criou conta pelo link dela. */}
        <Kpi rotulo={t.cadastros} valor={g.resumo.cadastros} sub={t.cadastrosSub} />
        <Kpi rotulo={t.assinaturas} valor={g.resumo.assinaturas} sub={t.assinaturasSub} />
        <Kpi rotulo={t.cancelamentos} valor={g.resumo.cancelamentos} sub={t.cancelamentosSub} />
        <Kpi
          verde
          rotulo={atual ? t.comissaoDe(nomeMes(atual.competencia, idioma)) : t.comissao}
          valor={atual ? brlI(atual.total) : brlI(0)}
          sub={atual ? (atual.status === 'pago' ? t.pago : t.pixAte(dataBr(atual.prazo, idioma))) : t.semAssinante}
        />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-[380px_1fr]">
        <Card titulo={m ? t.deOndeVemDe(nomeMes(m, idioma)) : t.deOndeVem}>
          <table className="w-full">
            <tbody>
              <tr><td className={td}><b>{t.suasFamilias}</b><small className="block text-[11.5px] text-ninho-cinza">{t.porMeses(g.consultora.indicada_por_nome ? pct(PCT_REDE) : pct(PCT_DIRETO), PARCELAS_MENSAL)}</small></td><td className={`${td} text-right font-bold tabular-nums`}>{brlI(direto)}</td></tr>
              {Array.from(viaG).map(([nome, v]) => (
                <tr key={nome}><td className={td}><b>{t.familiasDa(primeiro(nome))}</b><small className="block text-[11.5px] text-ninho-cinza">{t.paraVoce(pct(PCT_REDE))}</small></td><td className={`${td} text-right font-bold tabular-nums`}>{brlI(v)}</td></tr>
              ))}
            </tbody>
          </table>
          <p className="mt-4 text-[11px] font-extrabold tracking-[0.09em] text-[#9A95AD]">{t.pagamentos}</p>
          {g.meses.map((mm) => (
            <div key={mm.competencia} className="flex justify-between py-1.5 text-[13px]">
              <span>{nomeCompetencia(mm.competencia, idioma)}</span>
              <span className="tabular-nums"><b>{brlI(mm.total)}</b>{' '}{mm.status === 'pago' ? <Selo cor="verde">{t.recebidoEm(fmtData(idioma, mm.pago_em!, { timeZone: 'America/Sao_Paulo' }))}</Selo> : <Selo cor="ambar">{t.recebeAte(dataBr(mm.prazo, idioma))}</Selo>}</span>
            </div>
          ))}
          {g.meses.length === 0 && <p className="py-2 text-[13px] text-ninho-cinza">{t.nenhumaComissao}</p>}
          {!c.pix_chave || !c.cpf ? <Aviso tom="ambar">{t.faltaPix}</Aviso> : null}
        </Card>
        <Card titulo={m ? t.extratoDe(nomeMes(m, idioma)) : t.extrato}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr><th className={th}>{t.colFamilia}</th><th className={th}>{t.colPlano}</th><th className={th}>{t.colParcela}</th><th className={th}>{t.colRegra}</th><th className={`${th} text-right`}>{t.colBase}</th><th className={`${th} text-right`}>{t.colComissao}</th></tr></thead>
              <tbody>
                {ls.map((l, i) => (
                  <tr key={i}>
                    <td className={td}><b>{l.bebe}</b>{l.via && <small className="block text-[11px] text-ninho-cinza">{t.familiaDa(primeiro(l.via))}</small>}</td>
                    <td className={td}>{t.plano(l.plano)}</td>
                    <td className={td}>{t.parcela(l.parcela)}</td>
                    <td className={td}>{pct(l.pct)}{l.via ? t.indicacao : ''}</td>
                    <td className={`${td} text-right tabular-nums`}>{brlI(l.base)}</td>
                    <td className={`${td} text-right font-bold tabular-nums`}>{brlI(l.valor)}</td>
                  </tr>
                ))}
              </tbody>
              {ls.length > 0 && <tfoot><tr><td className={`${td} font-extrabold`} colSpan={5}>{t.total}</td><td className={`${td} text-right font-extrabold tabular-nums`}>{brlI(somar(ls.map((l) => l.valor)))}</td></tr></tfoot>}
            </table>
            {ls.length === 0 && <p className="py-6 text-center text-sm text-ninho-cinza">{t.semComissaoMes}</p>}
          </div>
          {m && <Aviso>{t.pixAviso(nomeMes(m, idioma), dataBr(prazoPix(m), idioma))}</Aviso>}
        </Card>
      </div>
      {g.familias.length > 0 && (
        <Card className="mt-4" titulo={t.porQueZero} direita={t.porQueZeroDireita}>
          <table className="w-full">
            <tbody>
              {g.familias.map((x, i) => {
                const valorMes = m ? somar(ls.filter((l) => !l.via && l.bebe === x.bebe).map((l) => l.valor)) : 0;
                return (
                  <tr key={i}>
                    <td className={td}><b>{x.bebe}</b></td>
                    <td className={td}>
                      <Selo cor={x.situacao === 'ativa' ? 'verde' : x.situacao === 'teste' ? 'lilas' : 'cinza'}>{x.texto}</Selo>
                    </td>
                    <td className={`${td} text-right tabular-nums`}>
                      {valorMes ? brlI(valorMes) : <span className="text-ninho-cinza">{brlI(0)}{x.situacao === 'ativa' ? t.parcelasJaPagas : ''}</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="mt-2 text-[11.5px] text-ninho-cinza">{t.rodape}</p>
        </Card>
      )}
      <Card titulo={t.funil} direita={t.ultimos6} className="mt-4">
        <FunilTabela meses={funil} indisponivel={!eventos} titulo={t.ultimos6Titulo} />
      </Card>
    </>
  );
}

// ── Indicar ───────────────────────────────────────────────
async function Indicar({ c, noPerfil = false, idioma }: { c: Consultora; noPerfil?: boolean; idioma: Idioma }) {
  const tp = textos(idioma).pagina;
  const t = tp.indicar;
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
        <h2 className="mb-2 mt-6 text-lg font-black text-[#24164F]">{t.titulo}</h2>
      ) : (
        <Titulo t={t.titulo} sub={t.sub(pctTxt(PCT_REDE, idioma))} />
      )}
      <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
        <Card titulo={t.quem}>
          <form action={indicarConsultora}>
            <input type="hidden" name="volta" value={noPerfil ? 'perfil' : 'indicar'} />
            <label className={rotuloCampo}>{t.nome}</label>
            <input name="nome" required minLength={2} maxLength={80} placeholder={t.nomePh} className={campo} />
            <label className={rotuloCampo}>{t.email}</label>
            <input name="email" type="email" required placeholder={t.emailPh} className={campo} />
            <label className={rotuloCampo}>{tp.comum.whatsapp}</label>
            <TelefonePais name="whatsapp" classeSelect={campo} classeInput={campo} />
            <label className={rotuloCampo}>{tp.comum.instagram}</label>
            <input name="instagram" placeholder="@" className={campo} />
            <label className={rotuloCampo}>{t.comoSoube}</label>
            {/* O valor gravado continua em pt; só o rótulo muda. */}
            <select name="como_soube" defaultValue="Indicação de outra consultora" className={campo}>
              <option value="">{t.escolha}</option>
              {comoSoubeOpcoes(idioma).map((o) => <option key={o.valor} value={o.valor}>{o.rotulo}</option>)}
            </select>
            <label className={rotuloCampo}>{t.comentario}</label>
            <textarea name="comentario" maxLength={500} rows={2} className={`${campo} h-auto py-2`} />
            <button className={`${botao.grad} mt-4 w-full`} disabled={c.estado !== 'ativa'}>{t.enviar}</button>
          </form>
        </Card>
        <Card titulo={t.suas}>
          <table className="w-full">
            <tbody>
              {pedidos.map((p) => (
                <tr key={p.id}><td className={td}><b>{p.nome}</b><small className="block text-[11.5px] text-ninho-cinza">{p.email}</small></td><td className={td}>{p.status === 'pendente' ? <Selo cor="ambar">{t.conferindo}</Selo> : p.status === 'recusado' ? <Selo cor="cinza">{t.naoAprovada}</Selo> : <Selo cor="lilas">{t.aprovada}</Selo>}</td></tr>
              ))}
              {liberadas.map((x) => (
                <tr key={x.id}><td className={td}><b>{x.nome}</b><small className="block text-[11.5px] text-ninho-cinza">{x.email_liberado}</small></td><td className={td}>{x.estado === 'ativa' ? <Selo cor="verde">{t.liberadaAtiva}</Selo> : x.estado === 'esperando' ? <Selo cor="lilas">{t.liberadaFalta}</Selo> : <Selo cor="cinza">{t.pausada}</Selo>}</td></tr>
              ))}
            </tbody>
          </table>
          {pedidos.length + liberadas.length === 0 && <p className="py-6 text-center text-sm text-ninho-cinza">{t.nenhuma}</p>}
          <Aviso>{t.umNivel}</Aviso>
        </Card>
      </div>
    </>
  );
}

// ── Meu perfil ────────────────────────────────────────────
async function Perfil({ c, idioma }: { c: Consultora; idioma: Idioma }) {
  const tp = textos(idioma).pagina;
  const t = tp.perfil;
  const naLista = c.na_lista && c.estado === 'ativa' && !!c.perfil_aprovado_em;
  const exemplo = COMISSAO_VISIVEL ? valorComissao(PRECOS.premium.mensal, PCT_DIRETO) : 0;
  return (
    <>
      <Titulo
        t={t.titulo}
        sub={t.sub}
        direita={<Selo cor={naLista ? 'verde' : 'cinza'}>{naLista ? t.liberado : c.estado === 'pausada' ? t.foraPausada : t.fora}</Selo>}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card titulo={t.editar}>
          {/* key: depois de salvar, os campos voltam com o que está no banco (não o que ficou digitado). */}
          <form action={salvarPerfil} key={c.atualizado_em}>
            <label className={rotuloCampo}>{t.textoCurto}</label>
            <textarea name="bio" maxLength={600} defaultValue={c.bio_pendente ?? c.bio ?? ''} rows={5} className={`${campo} h-auto py-2`} />
            {c.bio_pendente && <p className="mt-1 text-[11.5px] text-[#7C5CD6]">{t.bioPendente}</p>}
            <div className="grid grid-cols-[1fr_80px] gap-2">
              <div><label className={rotuloCampo}>{t.cidade}</label><input name="cidade" defaultValue={c.cidade ?? ''} maxLength={80} className={campo} /></div>
              <div><label className={rotuloCampo}>{t.uf}</label><input name="uf" defaultValue={c.uf ?? ''} maxLength={2} className={`${campo} uppercase`} /></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="col-span-2"><label className={rotuloCampo}>{tp.comum.whatsapp}</label><TelefonePais name="whatsapp" valor={c.whatsapp} classeSelect={campo} classeInput={campo} /></div>
              <div className="col-span-2"><label className={rotuloCampo}>{tp.comum.instagram}</label><input name="instagram" defaultValue={c.instagram ? `@${c.instagram}` : ''} className={campo} /></div>
            </div>
            <label className={rotuloCampo}>{t.idades}</label>
            <input name="idades" defaultValue={c.idades ?? ''} maxLength={40} placeholder={t.idadesPh} className={campo} />
            <div className="mt-3 flex gap-5 text-[13px] font-semibold">
              <label className="flex items-center gap-2"><input type="checkbox" name="atende_online" defaultChecked={c.atende_online} /> {t.online}</label>
              <label className="flex items-center gap-2"><input type="checkbox" name="atende_presencial" defaultChecked={c.atende_presencial} /> {t.presencial}</label>
            </div>
            {COMISSAO_VISIVEL && (
              <>
              <p className="mt-4 text-[11px] font-extrabold tracking-[0.09em] text-[#9A95AD]">{t.paraReceber}</p>
              <div className="grid grid-cols-2 gap-2">
                <div><label className={rotuloCampo}>{t.cpf}</label><input name="cpf" inputMode="numeric" placeholder={c.cpf ? t.trocarCpf : t.soNumeros} className={campo} /></div>
                <div><label className={rotuloCampo}>{t.pix}</label><input name="pix" placeholder={c.pix_chave ? t.trocarChave : ''} className={campo} /></div>
              </div>
              <p className="mt-1 text-[11.5px] text-ninho-cinza">
                {c.cpf ? t.cpfSalvo(`•••.•••.•${c.cpf.slice(-4, -2)}-${c.cpf.slice(-2)}`) : t.cpfNao} ·{' '}
                {c.pix_chave ? t.pixSalvo(c.pix_chave.length > 6 ? `${c.pix_chave.slice(0, 3)}•••${c.pix_chave.slice(-3)}` : '•••') : t.pixNao}.{' '}
                {t.seguranca}
              </p>
              </>
            )}
            <button className={`${botao.grad} mt-4 w-full`}>{t.salvar}</button>
            <p className="mt-2 text-xs leading-snug text-ninho-cinza">{t.salvarDica}</p>
          </form>
          <form action={enviarFoto} className="mt-4 flex flex-wrap items-center gap-2 border-t border-[#F0ECF6] pt-4 text-xs">
            <input type="file" name="foto" accept="image/jpeg,image/png,image/webp" />
            <button className={botao.suave}>{t.enviarFoto}</button>
            <span className="text-ninho-cinza">{t.fotoFormatos}{c.foto_pendente_url ? t.fotoEspera : ''}</span>
          </form>
        </Card>
        <Card titulo={t.previa}>
          <div className="rounded-[20px] bg-[#F8F6FC] p-4">
            <div className="flex items-center gap-3">
              <Avatar id={c.id} nome={c.nome} foto={c.foto_url} tamanho={48} />
              <div>
                <b className="text-base">{c.nome}</b>
                <p className="text-[12.5px] text-ninho-cinza">{tp.comum.consultoraIndependente} · {c.cidade ? `${c.cidade}${c.uf ? ` · ${c.uf}` : ''}` : t.cidadePreencher}</p>
                <p className="text-xs text-ninho-cinza">{[c.atende_online && t.online, c.atende_presencial && t.presencial].filter(Boolean).join(t.e)}{c.idades ? ` · ${c.idades}` : ''}</p>
              </div>
            </div>
            <p className={`mt-2 text-[13.5px] leading-relaxed ${c.bio ? '' : 'text-[#9A95AD]'}`}>{c.bio || t.semTexto}</p>
            <p className="mt-2.5 text-[11px] leading-snug text-[#9A95AD]">{t.disclaimer}</p>
          </div>
          {c.bio_pendente && (
            <Aviso tom="ambar">{t.bioPendenteAviso(c.bio_pendente)}</Aviso>
          )}
          <p className="mt-3 text-[11.5px] text-ninho-cinza">{t.ultimaAlteracao(quandoTxt(c.atualizado_em, idioma, true))}</p>
          <Aviso>{t.avisoFamiliaMarca(COMISSAO_VISIVEL)}</Aviso>
          {COMISSAO_VISIVEL && (
            <Aviso tom="verde">{t.exemplo(brl(exemplo, idioma), PARCELAS_MENSAL)}</Aviso>
          )}
        </Card>
      </div>
      {COMISSAO_VISIVEL && (await Indicar({ c, noPerfil: true, idioma }))}
    </>
  );
}
