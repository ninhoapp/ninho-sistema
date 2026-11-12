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
  costumeAntes,
  descreverRegistro,
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
import { CompartilharRelatorio } from '@/components/consultoras/CompartilharRelatorio';
import { IA_LIMITE_MES, IA_PERIODOS, IA_PRECO_MENSAL, RODAPE_IA, iaStatus, lerRelatorio, listarRelatorios, secoes, type IaStatus } from '@/lib/consultoras-ia';
import { Avatar, Aviso, Card, Kpi, Retorno, Selo, botao, brl, campo, rotuloCampo, td, th } from '@/components/consultoras/ui';
import { CodigoConsultora, LinkConsultoria, LinkDivulgacao } from '@/components/consultoras/LinksConsultora';
import { consultoriaLiberada } from '@/lib/link-consultora';
import { ConfirmButton } from '@/components/admin/ConfirmButton';
import { cancelarConviteFamilia, encerrarAcompanhamento, convidarFamilia, enviarFoto, indicarConsultora, mandarSugestao, pedirRelatorio, responderPedidoFamilia, salvarFicha, salvarPerfil } from './actions';
import { SUGESTAO_MAX, sugestoesDa, type StatusSugestao } from '@/lib/consultoras-sugestoes';

export const dynamic = 'force-dynamic';

const BASE = '/admin/consultora';
const H = 3600 * 1000;
const pctTxt = (p: number) => `${String(p).replace('.', ',')}%`;
const primeiro = (n: string | null) => (n || '').split(' ')[0];

type Busca = { ficha?: string; aba?: string; bebe?: string; dia?: string; evo?: string; dias?: string; id?: string; mes?: string; filtro?: string; q?: string; ok?: string; erro?: string };

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
  // 'inicio' (padrão) e 'familias' (pedidos, convites, famílias e fichas) são abas diferentes.
  const aba = searchParams.aba || 'inicio';
  const pausada = c.estado === 'pausada';

  let corpo: React.ReactNode;
  if (aba === 'rotina' || aba === 'semana') corpo = await Rotina({ c, sp: searchParams, semana: aba === 'semana' });
  else if (aba === 'convidar') corpo = await Convidar({ c, ok: searchParams.ok, erro: searchParams.erro });
  else if (aba === 'ganhos') corpo = await Ganhos({ c, mes: searchParams.mes });
  else if (aba === 'indicar') corpo = await Indicar({ c });
  else if (aba === 'perfil') corpo = await Perfil({ c });
  else if (aba === 'relatorio') corpo = await RelatorioIA({ c, sp: searchParams });
  else if (aba === 'assinatura') corpo = await AssinaturaIA({ c });
  else if (aba === 'ajuda') corpo = <Ajuda c={c} />;
  else if (aba === 'sugestoes') corpo = await Sugestoes({ c });
  else if (aba === 'familias') corpo = await PedidosEConvites({ c, sp: searchParams });
  else corpo = await Familias({ c, sp: searchParams });

  return (
    <>
      <div className="no-print mb-4 flex items-center gap-3 rounded-2xl bg-white p-3">
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

// ── Início (v3) ───────────────────────────────────────────
// "Olhe primeiro" (noite agitada e sem registro), noites calmas de ontem,
// quem está dormindo, Relatório IA e as famílias com as 7 noites em barrinhas.
interface FamiliaComSemana {
  f: FamiliaDaConsultora;
  semana: SemanaV3 | null;
  ficha: Ficha | null;
}

function waLink(digitos: string | null | undefined, texto: string): string {
  const n = (digitos ?? '').replace(/\D/g, '');
  return n ? `https://wa.me/${n}?text=${encodeURIComponent(texto)}` : `https://wa.me/?text=${encodeURIComponent(texto)}`;
}

async function Familias({ c, sp }: { c: Consultora; sp: Busca }) {
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
      const [rot, fi] = await Promise.all([
        f.plano_ok ? rotinaDe(c.id, f.baby_id, new Date(inicioDoDia(somarDias(hoje, -7)) - 12 * H), new Date(agora + 60_000)) : Promise.resolve({ registros: [], semAcesso: true }),
        fichaDe(c.id, f.baby_id),
      ]);
      return { f, semana: rot.semAcesso ? null : semanaV3(rot.registros, ontem, agora), ficha: fi.ficha };
    }),
  );
  const porBebe = new Map(dados.map((d) => [d.f.baby_id, d]));
  const noiteOntem = (d: FamiliaComSemana) => d.semana?.dias.find((x) => x.dia === ontem) ?? null;
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
  const chip = (k: string, t: string) => (
    <Link key={k} href={`${BASE}?aba=inicio&filtro=${k}${q ? `&q=${encodeURIComponent(q)}` : ''}`} className={`rounded-pill px-3 py-1.5 text-xs font-bold ${filtro === k ? 'bg-[#24164F] text-white' : 'bg-white text-ninho-cinza shadow-[inset_0_0_0_1.5px_#ECE6F5]'}`}>{t}</Link>
  );
  const horaDoDia = new Date(agora + FUSO_MS).getUTCHours();
  const saudacao = horaDoDia < 12 ? 'Bom dia' : horaDoDia < 18 ? 'Boa tarde' : 'Boa noite';
  const dataHoje = new Date(agora).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', weekday: 'long', day: 'numeric', month: 'long' });
  const iaTxt = !ia ? { v: '—', s: 'ainda não disponível' } : ia.assinante ? { v: `${ia.usadosMes} de ${ia.limiteMes}`, s: 'usados neste mês' } : ia.gratisUsado ? { v: 'grátis usado', s: 'assine pelo app' } : { v: '1 grátis', s: 'ainda não usado' };

  return (
    <>
      <Titulo
        t={`${saudacao}, ${primeiro(c.nome)}`}
        sub={`${todas.length} família${todas.length === 1 ? '' : 's'} compartilha${todas.length === 1 ? '' : 'm'} a rotina com você · ${dataHoje}`}
        direita={
          <form className="flex h-10 items-center gap-2 rounded-pill bg-white px-4 shadow-[inset_0_0_0_1.5px_#ECE6F5]">
            <input type="hidden" name="aba" value="inicio" />
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

      <div className="grid gap-4 lg:grid-cols-2">
        <Card titulo="Olhe primeiro" direita="o que mudou desde ontem">
          {prioridade.length === 0 && <p className="py-5 text-center text-sm text-ninho-cinza">Nada pedindo atenção agora.</p>}
          {prioridade.map((d) => {
            const n = noiteOntem(d);
            if (agitada(d) && n) {
              return (
                <div key={d.f.baby_id} className="mt-2 flex flex-wrap items-center gap-3 rounded-2xl bg-[#FFF8EC] px-3 py-2.5">
                  <Link href={`${BASE}?aba=rotina&bebe=${d.f.baby_id}&dia=${ontem}`} className="min-w-[200px] flex-1">
                    <p className="text-[13.5px] font-extrabold">{d.f.bebe_nome} · noite agitada</p>
                    <p className="text-xs tabular-nums text-ninho-cinza">
                      {n.noite.despertares} despertares{n.noite.primeiroTrechoMin !== null ? `, 1º bloco de ${dur(n.noite.primeiroTrechoMin)}` : ''}. Dia com {n.sonecas.length} soneca{n.sonecas.length === 1 ? '' : 's'}.
                    </p>
                  </Link>
                  <Link href={`${BASE}?aba=relatorio&bebe=${d.f.baby_id}`} className={botao.suave}>Relatório IA</Link>
                </div>
              );
            }
            const desde = d.f.ultimo_registro_em ? `desde ${desdeTxt(d.f.ultimo_registro_em)}, ${hora(new Date(d.f.ultimo_registro_em).getTime())}` : 'ainda';
            return (
              <div key={d.f.baby_id} className="mt-2 flex flex-wrap items-center gap-3 rounded-2xl bg-[#F4F2F8] px-3 py-2.5">
                <div className="min-w-[200px] flex-1">
                  <p className="text-[13.5px] font-extrabold">{d.f.bebe_nome} · sem registro</p>
                  <p className="text-xs text-ninho-cinza">Nada marcado {desde}.</p>
                </div>
                <a
                  href={waLink(d.ficha?.whatsapp, `Oi! Tudo bem? Vi que não tem registro do ${d.ficha?.bebe_apelido || d.f.bebe_nome || 'bebê'} no Ninho desde ontem. Consegue marcar o sono e as mamadas de hoje? Assim eu acompanho direitinho.`)}
                  target="_blank"
                  rel="noopener"
                  className={botao.cinza}
                  title="Abre o WhatsApp com a mensagem pronta. Você revisa e envia."
                >
                  Lembrar no WhatsApp
                </a>
              </div>
            );
          })}
        </Card>
        <div className="grid gap-4 sm:grid-cols-3">
          <Kpi rotulo="Noites calmas ontem" valor={comNoite.length ? `${calmas.length} de ${comNoite.length}` : '—'} sub="famílias com registro" />
          <Kpi rotulo="Dormindo agora" valor={dormindo.length} sub={dormindo.slice(0, 3).map((f) => f.bebe_nome).join(', ') || 'ninguém'} />
          <Kpi rotulo="Relatórios IA" valor={iaTxt.v} sub={iaTxt.s} />
        </div>
      </div>

      <Card
        className="mt-4"
        titulo={<div className="flex flex-wrap gap-1.5">{chip('todas', 'Todas')}{chip('agitada', 'Noite agitada')}{chip('dorme', 'Dormindo agora')}{chip('semreg', 'Sem registro')}{chip('semplano', 'Sem plano')}</div>}
        direita={`${fs.length} de ${todas.length} · atenção primeiro`}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr><th className={th}>Bebê</th><th className={th}>Mãe</th><th className={th}>7 noites</th><th className={th}>Agora</th><th className={th}>Com você desde</th><th className={th} /></tr></thead>
            <tbody>
              {fs.map((f) => {
                const d = porBebe.get(f.baby_id);
                return (
                  <tr key={f.baby_id} className="hover:bg-[#FAF8FE]">
                    <td className={td}>
                      <Link href={`${BASE}?aba=rotina&bebe=${f.baby_id}`} className="flex items-center gap-2.5">
                        <Avatar id={f.baby_id} nome={f.bebe_nome} tamanho={34} />
                        <span><b>{f.bebe_nome}</b><small className="block text-[11.5px] text-ninho-cinza">{idadeTxt(f.nascimento)}</small></span>
                      </Link>
                    </td>
                    <td className={td}>{f.mae_nome ?? '—'}</td>
                    <td className={td}>{d?.semana ? <Link href={`${BASE}?aba=semana&bebe=${f.baby_id}`}><MiniNoites s={d.semana} /></Link> : <span className="text-xs text-[#9A95AD]">—</span>}</td>
                    <td className={td}><SeloAgora f={f} /></td>
                    <td className={td}>{desdeTxt(f.vinculado_em)}</td>
                    <td className={td}>{d && agitada(d) ? <Link href={`${BASE}?aba=relatorio&bebe=${f.baby_id}`} className={botao.suave}>Relatório</Link> : <Link href={`${BASE}?aba=rotina&bebe=${f.baby_id}`} className="text-[#BDB8CC]">›</Link>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {fs.length === 0 && (
            <p className="py-6 text-center text-sm text-ninho-cinza">
              {todas.length === 0 ? (c.estado === 'ativa' ? 'Nenhuma família ainda. Mande seu link em Convidar família.' : 'Sem famílias para mostrar.') : 'Nenhuma família com esse filtro.'}
            </p>
          )}
        </div>
        <Legenda itens={[['#9F86E0', 'noite calma (até 2 despertares)'], ['#F0B456', '3 ou mais'], ['#E4E1EA', 'sem registro']]} />
      </Card>
      <ConviteSugestao />
    </>
  );
}

// ── Sugestões para o Ninho (00123) ────────────────────────
function ConviteSugestao() {
  return (
    <Link
      href={`${BASE}?aba=sugestoes`}
      className="no-print mt-4 flex flex-wrap items-center gap-4 rounded-[22px] bg-gradient-to-r from-[#F3EEFC] to-[#FBF8FF] px-5 py-4 shadow-[inset_0_0_0_1.5px_#E7DDFB]"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-xl shadow-[0_6px_14px_-8px_rgba(140,92,248,.6)]" aria-hidden>💡</span>
      <span className="min-w-[200px] flex-1 leading-snug">
        <b className="block text-[15px] text-[#24164F]">O que você gostaria de ter por aqui?</b>
        <span className="text-[12.5px] text-ninho-cinza">Conte sua ideia. A gente lê todas e é assim que o Ninho melhora para você.</span>
      </span>
      <span className={botao.suave}>Dar uma sugestão</span>
    </Link>
  );
}

const ROTULO_SUGESTAO: Record<StatusSugestao, { t: string; cor: 'ambar' | 'verde' | 'cinza' }> = {
  nova: { t: 'Enviada', cor: 'cinza' },
  lida: { t: 'Lida pelo Ninho', cor: 'ambar' },
  feita: { t: 'Virou melhoria', cor: 'verde' },
};

async function Sugestoes({ c }: { c: Consultora }) {
  const { lista, indisponivel } = await sugestoesDa(c.id);
  return (
    <>
      <Titulo t="Sugestões" sub="Este espaço é seu para dizer o que falta, o que atrapalha e o que você gostaria de ver." />
      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <section className="rounded-[22px] bg-gradient-to-br from-[#A46DFF] to-[#8C5CF8] p-[3px] shadow-[0_14px_34px_-22px_rgba(140,92,248,.9)]">
          <div className="rounded-[20px] bg-white p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#F3EEFC] text-2xl" aria-hidden>💡</span>
              <div className="leading-tight">
                <h2 className="text-[18px] font-black text-[#24164F]">O que você gostaria de ter por aqui?</h2>
                <p className="mt-0.5 text-[12.5px] text-ninho-cinza">Uma tela, um botão, um relatório, um jeito mais fácil de fazer algo. Vale tudo.</p>
              </div>
            </div>
            <form action={mandarSugestao} className="mt-4">
              <textarea
                name="texto"
                required
                minLength={3}
                maxLength={SUGESTAO_MAX}
                rows={6}
                placeholder="Ex.: queria ver a soma das sonecas da semana de todas as famílias numa tela só."
                className="w-full resize-y rounded-2xl border-[1.5px] border-transparent bg-[#F5F2FB] px-4 py-3 text-[14px] leading-relaxed outline-none focus:border-ninho-roxo"
                disabled={indisponivel}
              />
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <p className="text-[12px] text-ninho-cinza">Só o time do Ninho lê. Não coloque dados das famílias.</p>
                <button className={botao.grad} disabled={indisponivel}>Enviar sugestão</button>
              </div>
              {indisponivel && <p className="mt-2 text-[12.5px] font-semibold text-[#B7791F]">As sugestões abrem em breve.</p>}
            </form>
          </div>
        </section>
        <Card titulo="Suas sugestões" direita={lista.length ? `${lista.length}` : undefined}>
          {lista.length === 0 ? (
            <p className="py-6 text-center text-sm text-ninho-cinza">Você ainda não mandou nenhuma. A primeira pode ser a próxima melhoria do Ninho.</p>
          ) : (
            <ul className="mt-1 space-y-2.5">
              {lista.map((s) => (
                <li key={s.id} className="rounded-2xl bg-[#FAF8FE] px-4 py-3">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="text-[11.5px] font-semibold text-[#9A95AD]">{new Date(s.criado_em).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</span>
                    <Selo cor={ROTULO_SUGESTAO[s.status].cor}>{ROTULO_SUGESTAO[s.status].t}</Selo>
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
const ROTULO_CONVITE: Record<ConviteEnviado['status'], { t: string; cor: 'ambar' | 'verde' | 'cinza' }> = {
  // Nunca dizer se o e-mail tem conta no Ninho.
  aguardando: { t: 'Aguardando a família', cor: 'ambar' },
  aceito: { t: 'Aceito', cor: 'verde' },
  encerrado: { t: 'Encerrado', cor: 'cinza' },
  cancelado: { t: 'Cancelado', cor: 'cinza' },
};

async function PedidosEConvites({ c, sp }: { c: Consultora; sp: Busca }) {
  const ativa = c.estado === 'ativa';
  const [fams, pv, convites] = await Promise.all([
    ativa ? familiasDa(c.id) : Promise.resolve([] as FamiliaDaConsultora[]),
    ativa ? pedidosVinculoDa(c.id) : Promise.resolve({ pedidos: [], indisponivel: false }),
    convitesEnviados(c.id),
  ]);
  const filtroConv = sp.filtro && ['aguardando', 'aceito', 'encerrado', 'cancelado'].includes(sp.filtro) ? sp.filtro : 'todos';
  const conv = (convites ?? []).filter((x) => filtroConv === 'todos' || x.status === filtroConv);
  const q = (sp.q || '').trim().toLowerCase();
  const acompanha = [...fams]
    .filter((f) => !q || `${f.bebe_nome ?? ''} ${f.mae_nome ?? ''}`.toLowerCase().includes(q))
    .sort((a, b) => (a.bebe_nome ?? '').localeCompare(b.bebe_nome ?? ''));
  const chip = (k: string, t: string, n: number) => (
    <Link key={k} href={`${BASE}?aba=familias&filtro=${k}`} className={`rounded-pill px-3 py-1.5 text-xs font-bold ${filtroConv === k ? 'bg-[#24164F] text-white' : 'bg-white text-ninho-cinza shadow-[inset_0_0_0_1.5px_#ECE6F5]'}`}>{t} · {n}</Link>
  );
  const conta = (st: string) => (convites ?? []).filter((x) => st === 'todos' || x.status === st).length;
  return (
    <>
      <Titulo t="Famílias" sub="Pedidos para aprovar, convites que você mandou e as famílias que você acompanha." direita={<Link href={`${BASE}?aba=convidar`} className={botao.grad}>Convidar família</Link>} />

      <Card titulo="1 · Pedidos para você aprovar" direita={pv.pedidos.length ? `${pv.pedidos.length} esperando você` : undefined}>
        {pv.pedidos.length === 0 && <p className="py-4 text-center text-sm text-ninho-cinza">{pv.indisponivel ? 'Os pedidos aparecem aqui assim que o Ninho liberar.' : 'Nenhum pedido esperando você.'}</p>}
        {pv.pedidos.length > 0 && (
          <p className="text-[12.5px] text-ninho-cinza">A família digitou seu código e já aceitou compartilhar a rotina. A rotina só aparece para você depois que você aprovar.</p>
        )}
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

      <Card
        className="mt-4"
        titulo="2 · Convites que você enviou"
        direita={convites && convites.length > 0 ? <div className="flex flex-wrap gap-1.5">{chip('todos', 'Todos', conta('todos'))}{chip('aguardando', 'Aguardando', conta('aguardando'))}{chip('aceito', 'Aceitos', conta('aceito'))}{chip('encerrado', 'Encerrados', conta('encerrado'))}{chip('cancelado', 'Cancelados', conta('cancelado'))}</div> : undefined}
      >
        {convites === null ? (
          <p className="py-4 text-center text-sm text-ninho-cinza">A lista de convites aparece aqui assim que o Ninho liberar.</p>
        ) : conv.length === 0 ? (
          <p className="py-4 text-center text-sm text-ninho-cinza">{convites.length ? 'Nenhum convite com esse filtro.' : 'Nenhum convite enviado nos últimos 90 dias. Convide pelo e-mail em Convidar família.'}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr><th className={th}>E-mail</th><th className={th}>Enviado em</th><th className={th}>Situação</th><th className={th} /></tr></thead>
              <tbody>
                {conv.map((x) => (
                  <tr key={`${x.email}-${x.enviado_em}`}>
                    <td className={`${td} break-all`}>{x.email}</td>
                    <td className={`${td} tabular-nums`}>{new Date(x.enviado_em).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
                    <td className={td}>
                      <Selo cor={ROTULO_CONVITE[x.status]?.cor ?? 'cinza'}>{ROTULO_CONVITE[x.status]?.t ?? x.status}</Selo>
                      {x.status === 'aguardando' && <small className="mt-0.5 block text-[11.5px] text-ninho-cinza">Se ainda não tem conta, chega quando ela criar.</small>}
                    </td>
                    <td className={td}>
                      {x.status === 'aguardando' && (
                        <ConfirmButton action={cancelarConviteFamilia} hidden={{ email: x.email }} label="Cancelar envio" message={`Cancelar o convite para ${x.email}? Ela não vai mais conseguir aceitar este convite.`} />
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
        titulo="3 · Famílias que você acompanha"
        direita={
          <form className="flex h-9 items-center gap-2 rounded-pill bg-white px-3 shadow-[inset_0_0_0_1.5px_#ECE6F5]">
            <input type="hidden" name="aba" value="familias" />
            <input name="q" defaultValue={sp.q} placeholder="Buscar bebê ou mãe" className="w-40 bg-transparent text-[13px] outline-none" />
          </form>
        }
      >
        {acompanha.length === 0 ? (
          <p className="py-4 text-center text-sm text-ninho-cinza">{fams.length ? 'Nenhuma família com essa busca.' : ativa ? 'Nenhuma família ainda.' : 'Conta pausada: as famílias voltam quando o Ninho reativar.'}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr><th className={th}>Bebê</th><th className={th}>Mãe</th><th className={th}>Com você desde</th><th className={th}>Agora</th><th className={th} /></tr></thead>
              <tbody>
                {acompanha.map((f) => (
                  <tr key={f.baby_id} className="hover:bg-[#FAF8FE]">
                    <td className={td}>
                      <Link href={`${BASE}?aba=rotina&bebe=${f.baby_id}`} className="flex items-center gap-2.5">
                        <Avatar id={f.baby_id} nome={f.bebe_nome} tamanho={32} />
                        <span><b>{f.bebe_nome}</b><small className="block text-[11.5px] text-ninho-cinza">{idadeTxt(f.nascimento)}</small></span>
                      </Link>
                    </td>
                    <td className={td}>{f.mae_nome ?? '—'}</td>
                    <td className={`${td} tabular-nums`}>{desdeTxt(f.vinculado_em)}</td>
                    <td className={td}><SeloAgora f={f} /></td>
                    <td className={td}>
                      <ConfirmButton
                        action={encerrarAcompanhamento}
                        hidden={{ baby: f.baby_id }}
                        label="Encerrar acompanhamento"
                        message={`Encerrar o acompanhamento de ${f.bebe_nome ?? 'este bebê'}? A família é avisada e você deixa de ver a rotina na hora. Para voltar, ela precisa aprovar de novo.`}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      {acompanha.length > 0 && <Fichas c={c} familias={acompanha} aberta={sp.ficha} />}
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

// ── Rotina e semana (v3) ──────────────────────────────────
function diaRotulo(dia: string): string {
  const hoje = hojeSP();
  if (dia === hoje) return 'Hoje';
  if (dia === somarDias(hoje, -1)) return `Ontem, ${diaCurto(dia)}`;
  return diaCurto(dia).replace(/^./, (x) => x.toUpperCase());
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
function Delta({ agora, antes, melhorQuando, fmt }: { agora: number | null; antes: number | null; melhorQuando: 'maior' | 'menor'; fmt: (x: number) => string }) {
  if (agora === null || antes === null) return null;
  const dif = agora - antes;
  if (Math.abs(dif) < 0.05 * Math.max(Math.abs(antes), 1)) return <span className="mr-1 rounded-pill bg-[#F0EEF4] px-2 py-0.5 text-[11px] font-extrabold text-ninho-cinza">parecido</span>;
  const melhorou = melhorQuando === 'maior' ? dif > 0 : dif < 0;
  return (
    <span className={`mr-1 rounded-pill px-2 py-0.5 text-[11px] font-extrabold ${melhorou ? 'bg-[#E7F5EC] text-[#2F8A55]' : 'bg-[#F0EEF4] text-ninho-cinza'}`}>
      {dif > 0 ? '↑' : '↓'} {fmt(Math.abs(dif))}
    </span>
  );
}

const um = (x: number) => x.toFixed(1).replace('.', ',');

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
  const hoje = hojeSP();
  const agora = Date.now();
  const seletor = (extra: React.ReactNode = null) => (
    <form className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="aba" value={aba} />
      <select name="bebe" defaultValue={f.baby_id} className="h-10 rounded-pill bg-white px-4 text-sm font-bold shadow-[inset_0_0_0_1.5px_#ECE6F5]">
        {fams.map((x) => <option key={x.baby_id} value={x.baby_id}>{x.bebe_nome} · {primeiro(x.mae_nome) || '—'}</option>)}
      </select>
      <button className={botao.suave}>Abrir</button>
      {extra}
    </form>
  );
  const sub = `Mãe: ${f.mae_nome ?? '—'} · com você desde ${desdeTxt(f.vinculado_em)}${idadeTxt(f.nascimento) ? ` · ${idadeTxt(f.nascimento)}` : ''}`;
  const trava = (msg: React.ReactNode) => (
    <Card><div className="flex flex-col items-center px-5 py-10 text-center text-[13.5px] leading-relaxed text-ninho-cinza">{msg}</div></Card>
  );
  if (!f.plano_ok) {
    return (
      <>
        <Titulo t={f.bebe_nome} sub={sub} direita={seletor()} />
        {trava(<><b className="text-ninho-grafite">A família da {primeiro(f.mae_nome)} está sem plano</b>O teste grátis acabou e ela não assinou. A rotina volta a aparecer quando ela assinar o Básico ou o Premium.</>)}
      </>
    );
  }

  if (!semana) {
    // Padrão: ontem (o último dia que já tem a noite inteira); hoje também abre.
    const dia = sp.dia && /^\d{4}-\d{2}-\d{2}$/.test(sp.dia) && sp.dia <= hoje && sp.dia >= somarDias(hoje, -30) ? sp.dia : somarDias(hoje, -1);
    const de = new Date(inicioDoDia(somarDias(dia, -8)) - 12 * H);
    const ate = new Date(Math.min(inicioDoDia(somarDias(dia, 1)) + 14 * H, agora + 60_000));
    const { registros, semAcesso } = await rotinaDe(c.id, f.baby_id, de, ate);
    const nav = (
      <div className="flex items-center gap-2 rounded-pill bg-white p-1 shadow-[inset_0_0_0_1.5px_#ECE6F5]">
        {dia > somarDias(hoje, -30) ? <Link href={`${BASE}?aba=rotina&bebe=${f.baby_id}&dia=${somarDias(dia, -1)}`} className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F3EEFC] text-[#7C5CD6]">‹</Link> : <span className="h-8 w-8" />}
        <b className="min-w-[150px] text-center text-[13.5px]">{diaRotulo(dia)}</b>
        {dia < hoje ? <Link href={`${BASE}?aba=rotina&bebe=${f.baby_id}&dia=${somarDias(dia, 1)}`} className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F3EEFC] text-[#7C5CD6]">›</Link> : <span className="h-8 w-8" />}
      </div>
    );
    const head = <Titulo t={f.bebe_nome} sub={sub} direita={seletor(nav)} />;
    if (semAcesso) return <>{head}{trava('Sem acesso à rotina deste bebê agora (vínculo removido, família sem plano ou conta pausada).')}</>;
    const d = diaV3(registros, dia, agora);
    if (!d.temRegistro) return <>{head}{trava(<><b className="text-ninho-grafite">Nada registrado neste dia</b>Sem registro, sem número.</>)}</>;
    const cost = costumeAntes(registros, dia, agora);
    const ac = cost.horarios.find((h) => h.rotulo === 'Acordou');
    const dm = cost.horarios.find((h) => h.rotulo === 'Dormiu');
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
          <KpiDelta grande rotulo="Sono nas 24h" valor={d.sono24 !== null ? dur(d.sono24) : '—'} sub={<>{dur(d.sonecasMin)} de sonecas{d.noiteCompleta ? ` + ${dur(d.noite.totalMin ?? 0)} de noite` : ''}{cost.sono24Med !== null ? <> · média {dur(cost.sono24Med)}</> : null}</>} />
          <KpiDelta rotulo="Noite" valor={d.noiteCompleta ? dur(d.noite.totalMin ?? 0) : d.dormiu !== null ? 'em curso' : '—'} sub={<>{cost.noiteMed !== null ? `média ${dur(cost.noiteMed)} · ` : ''}<span className={despFora ? laranja : ''}>{d.noite.despertares ?? 0} despertares</span>{cost.despertaresMed !== null ? ` (média ${um(cost.despertaresMed)})` : ''}{d.noite.primeiroTrechoMin !== null ? ` · 1º bloco ${dur(d.noite.primeiroTrechoMin)}` : ''}</>} />
          <KpiDelta rotulo="Sonecas" valor={`${d.sonecas.length} · ${dur(d.sonecasMin)}`} sub={cost.sonecasPorDia !== null ? `de costume ${um(cost.sonecasPorDia)} · ${dur(cost.sonecasMinMed ?? 0)}` : 'sem semana anterior para comparar'} />
          <KpiDelta
            rotulo="Acordou · dormiu"
            valor={`${d.acordou !== null ? hora(d.acordou) : '—'} · ${d.dormiu !== null ? hora(d.dormiu) : '—'}`}
            sub={<>de costume <span className={fora(acM, ac) ? laranja : ''}>{faixaTxt(ac) ?? '—'}</span> · <span className={fora(dmM, dm) ? laranja : ''}>{faixaTxt(dm) ?? '—'}</span></>}
          />
        </div>
        <Card className="mt-4" titulo="Do acordar ao acordar" direita={d.acordou !== null ? `${diaCurto(dia)}, ${hora(d.acordou)} → ${d.acordouSeguinte !== null ? `${diaCurto(somarDias(dia, 1))}, ${hora(d.acordouSeguinte)}` : 'agora'}` : 'sem a hora de acordar'}>
          <DiaStrip d={d} maiorJanela={cost.maiorJanela !== null ? Math.max(cost.maiorJanela, ...d.janelas.map((j) => j.min)) : null} agora={agora} />
        </Card>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <Card titulo="Sequência do dia" direita="cada sono com início e fim">
            <Sequencia d={d} />
          </Card>
          <Card titulo="Registros" direita={`${d.resumo.registros.length}`}>
            <div className="max-h-[460px] overflow-auto">
              {/* Na ordem do dia, igual à Sequência ao lado (dono, 12/11/2026). */}
              {[...d.resumo.registros].reverse().map((reg) => {
                const x = descreverRegistro(reg, agora);
                return (
                  <div key={reg.id} className="flex items-center gap-3 border-b border-[#F3F0F8] py-2.5 last:border-0">
                    <span className="h-9 w-9 shrink-0 rounded-full" style={{ background: `${x.cor}33`, boxShadow: `inset 0 0 0 3px ${x.cor}` }} />
                    <div className="flex-1">
                      <p className="text-sm font-bold">{x.titulo}</p>
                      <p className="text-xs tabular-nums text-ninho-cinza">{x.detalhe}</p>
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

  // Semana: os 7 dias que já terminaram (o último é ontem), comparados aos 7 anteriores.
  const ultimo = sp.dia && /^\d{4}-\d{2}-\d{2}$/.test(sp.dia) && sp.dia < hoje && sp.dia >= somarDias(hoje, -28) ? sp.dia : somarDias(hoje, -1);
  const de = new Date(inicioDoDia(somarDias(ultimo, -14)) - 12 * H);
  const ate = new Date(Math.min(inicioDoDia(somarDias(ultimo, 1)) + 14 * H, agora + 60_000));
  const { registros, semAcesso } = await rotinaDe(c.id, f.baby_id, de, ate);
  const ini = somarDias(ultimo, -6);
  const nav = (
    <div className="flex items-center gap-2 rounded-pill bg-white p-1 shadow-[inset_0_0_0_1.5px_#ECE6F5]">
      {ultimo > somarDias(hoje, -28) ? <Link href={`${BASE}?aba=semana&bebe=${f.baby_id}&dia=${somarDias(ultimo, -7)}`} className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F3EEFC] text-[#7C5CD6]">‹</Link> : <span className="h-8 w-8" />}
      <b className="min-w-[140px] text-center text-[13.5px]">{dataBr(ini).slice(0, 5)} – {dataBr(ultimo).slice(0, 5)}</b>
      {ultimo < somarDias(hoje, -1) ? <Link href={`${BASE}?aba=semana&bebe=${f.baby_id}&dia=${somarDias(ultimo, 7) < hoje ? somarDias(ultimo, 7) : somarDias(hoje, -1)}`} className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F3EEFC] text-[#7C5CD6]">›</Link> : <span className="h-8 w-8" />}
    </div>
  );
  const head = (
    <Titulo
      t={`Semana de ${f.bebe_nome}`}
      sub={`${dataBr(ini).slice(0, 5)} a ${dataBr(ultimo).slice(0, 5)} · comparado a ${dataBr(somarDias(ini, -7)).slice(0, 5)} a ${dataBr(somarDias(ultimo, -7)).slice(0, 5)}`}
      direita={seletor(<>{nav}<Link href={`${BASE}?aba=relatorio&bebe=${f.baby_id}&dias=7`} className={botao.grad}>Relatório IA desta semana</Link></>)}
    />
  );
  if (semAcesso) return <>{head}{trava('Sem acesso à rotina deste bebê agora.')}</>;
  const s = semanaV3(registros, ultimo, agora);
  const a = semanaV3(registros, somarDias(ultimo, -7), agora);
  // Evolução do sono: até 30 dias que terminam hoje (pedido próprio, o servidor entrega até 35).
  const evoDias = sp.evo === '7' ? 7 : sp.evo === '30' ? 30 : 14;
  const evoLib = evolucaoLiberada(c.email_liberado);
  const evoRot = evoLib ? await rotinaDe(c.id, f.baby_id, new Date(inicioDoDia(somarDias(hoje, -30)) - 6 * H), new Date(agora + 60_000)) : null;
  const evo = !evoRot || evoRot.semAcesso ? [] : evolucaoSono(evoRot.registros, hoje, evoDias, agora);
  const vinculoDia = f.vinculado_em ? new Date(new Date(f.vinculado_em).getTime() + FUSO_MS).toISOString().slice(0, 10) : null;
  return (
    <>
      {head}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
        <KpiDelta grande rotulo="Noite, em média" valor={s.noiteMed !== null ? dur(s.noiteMed) : '—'} sub={<><Delta agora={s.noiteMed} antes={a.noiteMed} melhorQuando="maior" fmt={(x) => dur(x)} />{a.noiteMed !== null ? `antes ${dur(a.noiteMed)}` : ''} · {s.noitesCompletas} de 7 noites completas</>} />
        <KpiDelta rotulo="Despertares por noite" valor={s.despertaresMed !== null ? um(s.despertaresMed) : '—'} sub={<><Delta agora={s.despertaresMed} antes={a.despertaresMed} melhorQuando="menor" fmt={um} />{a.despertaresMed !== null ? `antes ${um(a.despertaresMed)}` : ''}</>} />
        <KpiDelta rotulo="1º bloco" valor={s.blocoMed !== null ? dur(s.blocoMed) : '—'} sub={<><Delta agora={s.blocoMed} antes={a.blocoMed} melhorQuando="maior" fmt={(x) => dur(x)} />{a.blocoMed !== null ? `antes ${dur(a.blocoMed)}` : ''}</>} />
        <KpiDelta rotulo="Sonecas por dia" valor={s.sonecasPorDia !== null ? `${um(s.sonecasPorDia)} · ${dur(s.sonecasMinMed ?? 0)}` : '—'} sub={a.sonecasPorDia !== null ? `antes ${um(a.sonecasPorDia)} · ${dur(a.sonecasMinMed ?? 0)}` : undefined} />
      </div>
      {evoLib && <Card
        className="mt-4"
        titulo="Evolução do sono"
        direita={
          <span className="flex gap-1.5">
            {[7, 14, 30].map((n) => (
              <Link key={n} href={`${BASE}?aba=semana&bebe=${f.baby_id}${sp.dia ? `&dia=${sp.dia}` : ''}&evo=${n}`} className={`rounded-full px-3 py-1 text-[12px] font-bold ${n === evoDias ? 'bg-[#7C5CD6] text-white' : 'bg-[#F5F1FB] text-ninho-cinza'}`}>
                {n} dias
              </Link>
            ))}
          </span>
        }
      >
        <p className="text-[12px] text-ninho-cinza">Cada linha é um dia, de 18h a 18h · toque para abrir o dia</p>
        <EvolucaoSono linhas={evo} inicioVinculo={vinculoDia} href={(dia) => `${BASE}?aba=rotina&bebe=${f.baby_id}&dia=${dia}`} />
      </Card>}
      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1.25fr]">
        <Card titulo="Sono por dia" direita="sonecas do dia + a noite seguinte">
          <BarrasSemana s={s} href={(dia) => `${BASE}?aba=rotina&bebe=${f.baby_id}&dia=${dia}`} />
        </Card>
        <Card titulo="Noites" direita="de quando dormiu até quando acordou">
          <FaixasNoites s={s} />
        </Card>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-[1.25fr_1fr]">
        <Card titulo="Sonecas e a noite seguinte" direita="linhas verdes: 2 melhores noites">
          <SonecasNoite s={s} />
        </Card>
        <Card titulo="Horários" direita="ponto = cada dia · faixa = de onde a onde">
          <Horarios s={s} />
          <h3 className="mt-5 text-[15px] font-extrabold text-ninho-grafite">Janela antes de dormir</h3>
          <JanelaAntesDeDormir s={s} />
        </Card>
      </div>
      <p className="mt-3 text-[11.5px] text-ninho-cinza">
        Sem registro, sem número: médias só com as noites completas e os dias com registro. Horário de Brasília. A tela só
        mostra; quem tira conclusão é você.
      </p>
    </>
  );
}

// ── Relatório IA ──────────────────────────────────────────
async function RelatorioIA({ c, sp }: { c: Consultora; sp: Busca & { dias?: string; id?: string; gerando?: string } }) {
  const [status, fams] = await Promise.all([iaStatus(c.id), c.estado === 'ativa' ? familiasDa(c.id) : Promise.resolve([] as FamiliaDaConsultora[])]);
  const elegiveis = fams.filter((f) => f.plano_ok);
  if (sp.id) return <RelatorioCompleto c={c} id={sp.id} status={status} fams={fams} />;

  const f = elegiveis.find((x) => x.baby_id === sp.bebe) ?? elegiveis[0];
  const dias: 7 | 14 = sp.dias === '14' ? 14 : 7;
  const agora = Date.now();
  const hoje = hojeSP();
  let chips: { ok: boolean; txt: string }[] = [];
  if (f) {
    const ultimo = somarDias(hoje, -1);
    const { registros, semAcesso } = await rotinaDe(c.id, f.baby_id, new Date(inicioDoDia(somarDias(ultimo, -dias)) - 12 * H), new Date(agora + 60_000));
    if (!semAcesso) {
      const s = semanaV3(registros, ultimo, agora, dias);
      const sonecas = s.dias.reduce((x, d) => x + d.sonecas.length, 0);
      const mamadas = registros.filter((r) => r.tipo === 'feeding' && new Date(r.inicio).getTime() >= inicioDoDia(somarDias(ultimo, -(dias - 1)))).length;
      chips = [
        { ok: s.noitesCompletas >= Math.ceil(dias * 0.7), txt: `${s.noitesCompletas} de ${dias} noites completas` },
        { ok: sonecas >= dias, txt: `${sonecas} sonecas` },
        { ok: mamadas > 0, txt: `${mamadas} mamadas` },
      ];
    }
  }
  const lista = status ? await listarRelatorios(c.id, null) : null;
  const nomeBebe = new Map(fams.map((x) => [x.baby_id, x.bebe_nome]));
  const semCota = status && !status.podeGerar;

  return (
    <>
      <Titulo t="Relatório IA" sub="Uma leitura dos registros de 7 ou 14 dias, para levar à conversa com a família. Fica salvo aqui e no app." />
      {!status && (
        <Aviso tom="ambar">O Relatório IA ainda não está disponível no painel. Assim que o Ninho liberar, ele aparece aqui. Enquanto isso, a Semana mostra os mesmos desenhos.</Aviso>
      )}
      <div className="mt-4 grid gap-4 lg:grid-cols-[380px_1fr]">
        <div className="flex flex-col gap-4">
          {semCota ? (
            <Card>
              <div className="py-2 text-center">
                <p className="text-[20px] font-black leading-tight tracking-tight">Relatórios para todas as suas famílias</p>
                <p className="mt-1.5 text-[13px] text-ninho-cinza">
                  {status!.assinante ? `Você usou os ${status!.limiteMes} relatórios deste mês. A cota volta no mês que vem.` : 'Seu relatório grátis continua salvo.'}
                </p>
              </div>
              {!status!.assinante && (
                <>
                  <ul className="mt-3 space-y-2 text-[13.5px]">
                    <li>• Um relatório para cada bebê que você acompanha (até {IA_LIMITE_MES} por mês)</li>
                    <li>• Períodos de 7 ou 14 dias, comparando com antes</li>
                    <li>• PDF pronto para a conversa com a família</li>
                  </ul>
                  <div className="mt-4 rounded-2xl bg-[#EEF8F1] p-4 text-center">
                    <p className="text-[13px] font-bold text-[#2F8A55]">Assinatura da consultora</p>
                    <p className="text-[24px] font-black tabular-nums text-[#2F8A55]">{brl(IA_PRECO_MENSAL)}<span className="text-sm font-bold"> /mês</span></p>
                  </div>
                  <Aviso>
                    <b>Assine pelo app do Ninho</b>: na sua área de consultora, toque em Relatório IA › Assinar. A compra é pela
                    App Store ou pelo Google Play e renova todo mês; cancele quando quiser nos ajustes da loja. Depois de
                    assinar, os relatórios aparecem aqui também.
                  </Aviso>
                </>
              )}
            </Card>
          ) : (
            <Card titulo="Pedir relatório" direita={status && !status.assinante && !status.gratisUsado ? <Selo cor="verde">1º grátis</Selo> : status?.assinante ? `${status.usadosMes} de ${status.limiteMes} no mês` : undefined}>
              {elegiveis.length === 0 ? (
                <p className="py-4 text-center text-sm text-ninho-cinza">Nenhuma família com plano agora.</p>
              ) : (
                <>
                  <form className="mt-1">
                    <input type="hidden" name="aba" value="relatorio" />
                    <label className={rotuloCampo}>Para qual bebê?</label>
                    <select name="bebe" defaultValue={f?.baby_id} className={campo}>
                      {elegiveis.map((x) => <option key={x.baby_id} value={x.baby_id}>{x.bebe_nome} · {primeiro(x.mae_nome) || '—'}</option>)}
                    </select>
                    <label className={rotuloCampo}>Período</label>
                    <div className="flex gap-2">
                      {IA_PERIODOS.map((p) => (
                        <label key={p} className={`flex-1 cursor-pointer rounded-xl px-3 py-2 text-center text-[13px] font-bold ${dias === p ? 'bg-[#24164F] text-white' : 'bg-[#F5F2FB] text-ninho-cinza'}`}>
                          <input type="radio" name="dias" value={p} defaultChecked={dias === p} className="sr-only" />
                          {p} dias
                        </label>
                      ))}
                    </div>
                    <button className={`${botao.cinza} mt-3`}>Conferir os dados</button>
                  </form>
                  {chips.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {chips.map((x) => (
                        <span key={x.txt} className={`rounded-pill px-2.5 py-1 text-[11.5px] font-bold ${x.ok ? 'bg-[#E7F5EC] text-[#2F8A55]' : 'bg-[#FFF2D6] text-[#B7791F]'}`}>{x.ok ? '✓' : '!'} {x.txt}</span>
                      ))}
                    </div>
                  )}
                  <p className="mt-2 text-[12px] leading-snug text-ninho-cinza">Usa sono, sonecas, mamadas, horários e as notas dos registros. Não usa fotos, momentos nem o chat da família.</p>
                  <form action={pedirRelatorio} className="mt-3">
                    <input type="hidden" name="bebe" value={f?.baby_id ?? ''} />
                    <input type="hidden" name="dias" value={dias} />
                    <button className={`${botao.grad} w-full`} disabled={!status || !f}>Gerar relatório de {f?.bebe_nome ?? '—'} ({dias} dias)</button>
                  </form>
                  <p className="mt-2 text-center text-[11.5px] text-ninho-cinza">Leva uns 20 segundos. Se faltar registro, ele diz o que falta e não conta como usado.</p>
                </>
              )}
            </Card>
          )}
        </div>
        <Card titulo="Seus relatórios" direita={lista ? `${lista.length}` : undefined}>
          {!lista || lista.length === 0 ? (
            <p className="py-8 text-center text-sm text-ninho-cinza">{lista ? 'Nenhum relatório ainda.' : 'Os relatórios aparecem aqui quando o Relatório IA for liberado.'}</p>
          ) : (
            <table className="w-full">
              <thead><tr><th className={th}>Bebê</th><th className={th}>Período</th><th className={th}>Gerado em</th><th className={th} /></tr></thead>
              <tbody>
                {lista.map((r) => (
                  <tr key={r.id} className="hover:bg-[#FAF8FE]">
                    <td className={td}><b>{r.bebe ?? (r.babyId ? nomeBebe.get(r.babyId) : null) ?? 'Bebê'}</b></td>
                    <td className={td}>{r.dias ? `${r.dias} dias` : ''}{r.de && r.ate ? ` · ${dataBr(r.de).slice(0, 5)} a ${dataBr(r.ate).slice(0, 5)}` : ''}</td>
                    <td className={td}>{r.criadoEm ? new Date(r.criadoEm).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                    <td className={td}><Link href={`${BASE}?aba=relatorio&id=${r.id}`} className={botao.suave}>Abrir</Link></td>
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

async function RelatorioCompleto({ c, id, status, fams }: { c: Consultora; id: string; status: IaStatus | null; fams: FamiliaDaConsultora[] }) {
  const r = await lerRelatorio(c.id, id);
  if (!r) {
    return (
      <>
        <Titulo t="Relatório" direita={<Link href={`${BASE}?aba=relatorio`} className={botao.cinza}>Voltar</Link>} />
        <Card><p className="py-8 text-center text-sm text-ninho-cinza">Relatório não encontrado ou ainda não disponível.</p></Card>
      </>
    );
  }
  const fam = fams.find((x) => x.baby_id === r.babyId) ?? null;
  const bebe = r.bebe ?? fam?.bebe_nome ?? 'Bebê';
  const sx = secoes(r.conteudo);
  // Desenhos do período do relatório, com os mesmos registros da Semana.
  let s: SemanaV3 | null = null;
  if (fam && fam.plano_ok && r.ate) {
    const ultimo = r.ate.slice(0, 10);
    const n = r.dias === 14 ? 14 : 7;
    const rot = await rotinaDe(c.id, fam.baby_id, new Date(inicioDoDia(somarDias(ultimo, -n)) - 12 * H), new Date(Math.min(inicioDoDia(somarDias(ultimo, 1)) + 14 * H, Date.now() + 60_000)));
    if (!rot.semAcesso) s = semanaV3(rot.registros, ultimo, Date.now(), n);
  }
  const ficha = fam ? (await fichaDe(c.id, fam.baby_id)).ficha : null;
  const periodo = `${r.dias ? `${r.dias} dias` : ''}${r.de && r.ate ? ` · ${dataBr(r.de).slice(0, 5)} a ${dataBr(r.ate).slice(0, 5)}` : ''}`;
  const geradoEm = r.criadoEm ? new Date(r.criadoEm).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
  const msgFamilia = `Oi! Segue o relatório da rotina do ${ficha?.bebe_apelido || bebe} (${periodo.replace(/^ · /, '')}), feito a partir dos registros do Ninho. Vamos conversar sobre ele no nosso próximo encontro?`;
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
  const P = ({ xs }: { xs: string[] }) => (xs.length ? <>{xs.map((x, i) => <p key={i} className="mt-1.5 text-[13.5px] leading-relaxed">{x}</p>)}</> : <p className="text-[13px] text-[#9A95AD]">Sem texto nesta seção.</p>);
  return (
    <div className="relatorio-ia">
      <div className="no-print">
        <Titulo
          t={`Relatório de ${bebe}`}
          sub={`${idadeTxt(fam?.nascimento ?? null) ? `${idadeTxt(fam?.nascimento ?? null)} · ` : ''}${periodo.replace(/^ · /, '')}${geradoEm ? ` · gerado em ${geradoEm}` : ''}`}
          direita={<Link href={`${BASE}?aba=relatorio`} className={botao.cinza}>Voltar</Link>}
        />
      </div>
      {/* Cabeçalho do PDF: só na impressão. */}
      <div className="print-only mb-5 hidden items-center gap-3 border-b border-[#EFEAF7] pb-4">
        <Avatar id={c.id} nome={c.nome} foto={c.foto_url} tamanho={52} />
        <div className="flex-1">
          <p className="text-[17px] font-black">{c.nome}</p>
          <p className="text-[12.5px] text-ninho-cinza">Consultora independente</p>
        </div>
        <div className="text-right text-[12px] text-ninho-cinza">
          <p className="font-extrabold text-[#24164F]">Relatório de {bebe}</p>
          <p>{periodo.replace(/^ · /, '')}</p>
          {geradoEm && <p>gerado em {geradoEm}</p>}
        </div>
      </div>
      <CompartilharRelatorio whatsapp={ficha?.whatsapp ?? null} mensagem={msgFamilia}>
        <div className="grid items-start gap-4 lg:grid-cols-[1fr_330px]">
          <div className="flex flex-col gap-5 rounded-[22px] bg-white p-6 shadow-[0_10px_30px_-22px_rgba(80,40,160,.35)]">
            {r.falta.length > 0 && (
              <section className="rounded-2xl bg-[#FFF8EC] p-4">
                <p className="font-extrabold">Ainda não dá para um relatório completo</p>
                <ul className="mt-2 list-disc pl-5 text-[13.5px]">{r.falta.map((x, i) => <li key={i}>{x}</li>)}</ul>
              </section>
            )}
            {sx.notaSaude && <Aviso tom="ambar">{sx.notaSaude}</Aviso>}
            <Sec n={1} t="Resumo em 3 linhas">
              {sx.resumo.length ? (
                <ul className="flex flex-col gap-2">
                  {sx.resumo.map((x, i) => <li key={i} className="flex gap-2.5 text-[14px] leading-relaxed"><i className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#9F86E0]" />{x}</li>)}
                </ul>
              ) : <P xs={[]} />}
            </Sec>
            <div className="grid gap-5 md:grid-cols-2">
              <Sec n={2} t="Sono da noite">
                {s && <FaixasNoites s={s} />}
                <P xs={sx.noite} />
              </Sec>
              <Sec n={3} t="Sonecas e janelas">
                {s && <JanelaAntesDeDormir s={s} />}
                <P xs={sx.sonecas} />
                {sx.faixaIdade && <p className="mt-2 rounded-xl bg-[#F8F6FC] p-2.5 text-[12px] text-ninho-cinza">{sx.faixaIdade}</p>}
              </Sec>
            </div>
            <Sec n={4} t="O que acontece antes dos despertares" dica="padrões nos registros, não causas">
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
              <Sec n={5} t="Melhores e piores noites">
                {(sx.melhores.length > 0 || sx.piores.length > 0) && (
                  <div className="grid grid-cols-2 gap-2 text-[12.5px]">
                    <div className="rounded-xl bg-[#EEF8F1] p-2.5"><p className="font-extrabold text-[#2F8A55]">Melhores</p>{sx.melhores.map((x, i) => <p key={i}>{x}</p>)}</div>
                    <div className="rounded-xl bg-[#FFF8EC] p-2.5"><p className="font-extrabold text-[#A8670F]">Mais agitadas</p>{sx.piores.map((x, i) => <p key={i}>{x}</p>)}</div>
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
              <Sec n={6} t="Consistência dos horários">
                {s && <Horarios s={s} />}
                <P xs={sx.consistencia} />
              </Sec>
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              <Sec n={7} t="Perguntas para levar à família" dica="roteiro seu">
                {sx.perguntas.length ? <ol className="list-decimal space-y-1.5 pl-5 text-[13.5px] leading-relaxed">{sx.perguntas.map((x, i) => <li key={i}>{x}</li>)}</ol> : <P xs={[]} />}
              </Sec>
              <Sec n={8} t="O que observar nos próximos dias">
                {sx.observar.length ? <ul className="space-y-1.5 text-[13.5px] leading-relaxed">{sx.observar.map((x, i) => <li key={i}>• {x}</li>)}</ul> : <P xs={[]} />}
              </Sec>
            </div>
            {sx.outros.map((o) => (
              <section key={o.titulo} className="border-t border-[#F0ECF6] pt-4">
                <h2 className="mb-1 text-[14px] font-extrabold capitalize text-[#24164F]">{o.titulo}</h2>
                <P xs={o.texto} />
              </section>
            ))}
            <p className="mt-1 flex items-start gap-2 rounded-2xl bg-[#F3EEFC] p-3 text-[12.5px] leading-snug text-[#4B3A8C]">ⓘ {RODAPE_IA}</p>
          </div>
          <div className="no-print flex flex-col gap-4 lg:sticky lg:top-20">
            {r.dadosUsados && (
              <Card titulo="Dados usados">
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(r.dadosUsados).map(([k, v]) => (
                    <span key={k} className="rounded-pill bg-[#F0EEF4] px-2.5 py-1 text-[11.5px] font-bold text-ninho-cinza">{k.replace(/_/g, ' ')}: {String(v)}</span>
                  ))}
                </div>
                <p className="mt-2 text-[12px] text-ninho-cinza">Fotos, momentos e chat não entram.</p>
              </Card>
            )}
            <Card titulo="Seus relatórios">
              <p className="text-[13px] text-ninho-cinza">
                {!status ? 'Situação da assinatura indisponível agora.' : status.assinante ? `Assinatura ativa${status.assinaturaAte ? ` até ${dataBr(status.assinaturaAte)}` : ''}. ${status.usadosMes} de ${status.limiteMes} relatórios usados neste mês.` : status.gratisUsado ? `Este foi o seu relatório grátis. Para os próximos, assine pelo app do Ninho (${brl(IA_PRECO_MENSAL)}/mês).` : 'Você ainda tem 1 relatório grátis.'}
              </p>
            </Card>
          </div>
        </div>
      </CompartilharRelatorio>
    </div>
  );
}

// ── Assinatura IA e Ajuda (menu de conta) ─────────────────
async function AssinaturaIA({ c }: { c: Consultora }) {
  const st = await iaStatus(c.id);
  return (
    <>
      <Titulo t="Assinatura IA" sub="Relatórios IA das suas famílias: o 1º é grátis; depois, a assinatura da consultora." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card titulo="Sua situação">
          {!st ? (
            <p className="py-4 text-sm text-ninho-cinza">Situação indisponível agora. O Relatório IA ainda está sendo liberado.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <Kpi rotulo="Assinatura" valor={st.assinante ? 'Ativa' : 'Sem assinatura'} sub={st.assinante && st.assinaturaAte ? `até ${dataBr(st.assinaturaAte)}` : st.gratisUsado ? 'relatório grátis já usado' : '1 relatório grátis disponível'} />
              <Kpi rotulo="Relatórios neste mês" valor={`${st.usadosMes} de ${st.assinante ? st.limiteMes : 1}`} sub={st.podeGerar ? 'pode gerar agora' : 'sem relatório disponível'} />
            </div>
          )}
          <Link href={`${BASE}?aba=relatorio`} className={`${botao.grad} mt-4`}>Ir para Relatório IA</Link>
        </Card>
        <Card titulo="Como assinar">
          <div className="rounded-2xl bg-[#EEF8F1] p-4 text-center">
            <p className="text-[13px] font-bold text-[#2F8A55]">Assinatura da consultora</p>
            <p className="text-[24px] font-black tabular-nums text-[#2F8A55]">{brl(IA_PRECO_MENSAL)}<span className="text-sm font-bold"> /mês</span></p>
            <p className="text-[12px] text-[#2F8A55]">até {IA_LIMITE_MES} relatórios por mês, de 7 ou 14 dias</p>
          </div>
          <Aviso>
            A assinatura é feita <b>pelo app do Ninho</b> (Relatório IA › Assinar), com a App Store ou o Google Play. Ela
            renova todo mês; cancele quando quiser nos ajustes da loja. A assinatura é separada da sua comissão: uma não
            desconta da outra.
          </Aviso>
        </Card>
      </div>
    </>
  );
}

function Ajuda({ c }: { c: Consultora }) {
  return (
    <>
      <Titulo t="Código e ajuda" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card titulo="Seu código">
          <p className="text-3xl font-black tracking-[0.12em] text-[#24164F]">{c.codigo}</p>
          <p className="mt-2 text-[12.5px] text-ninho-cinza">A família digita o código em Cuidador ou Consultor › Adicionar › Consultora de sono. O link para convidar fica em Convidar família; o de indicar e ganhar comissão, em Ganhos.</p>
        </Card>
        <Card titulo="Ajuda">
          <ul className="space-y-2 text-[13.5px] leading-relaxed">
            <li><b>Entrar no computador:</b> no app, gere o código de 6 dígitos e use com o seu e-mail em useninho.com.br/admin/login (aba Sou consultora). Ele vale 10 minutos.</li>
            <li><b>Rotina sumiu?</b> A família pode ter tirado o acesso, estar sem plano, ou a sua conta pode estar pausada.</li>
            <li><b>Comissão:</b> {TEXTO_QUEM_GERA_COMISSAO}</li>
            <li><b>Falar com o Ninho:</b> pelo botão Ajuda do app ou pelo e-mail suporte@useninho.com.br.</li>
          </ul>
        </Card>
      </div>
    </>
  );
}

// ── Convidar ──────────────────────────────────────────────
async function Convidar({ c, ok, erro }: { c: Consultora; ok?: string; erro?: string }) {
  // Só o que liga a família a você (dono, 12/11/2026). O link de divulgação
  // (indicar e ganhar comissão) fica no topo de Ganhos.
  const comConsultoria = consultoriaLiberada(c.email_liberado);
  return (
    <>
      <Titulo t="Convidar família" sub="Para as famílias que você atende compartilharem a rotina do bebê com você." />
      {!c.codigo ? (
        <Aviso tom="ambar">Seu código ainda não foi criado. Fale com o Ninho.</Aviso>
      ) : (
        <>
          {comConsultoria && <LinkConsultoria codigo={c.codigo} />}
          <div className={comConsultoria ? 'mt-3.5' : ''}>
            <CodigoConsultora codigo={c.codigo} principal={!comConsultoria} />
          </div>
        </>
      )}
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
        {(ok || erro) && <div className="mt-3"><Retorno ok={ok} erro={erro} /></div>}
      </Card>
      <Aviso tom="vermelho">Para trazer uma amiga consultora, use Indicar consultora.</Aviso>
    </>
  );
}

// ── Ganhos ────────────────────────────────────────────────
async function Ganhos({ c, mes }: { c: Consultora; mes?: string }) {
  const [g, eventos, base] = await Promise.all([montarGanhos(c), eventosDosLinks(), baseComissoes()]);
  const funil = funilDaConsultora(c.id, base.familias, eventos, ultimosMesesFunil(6));
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
      {/* Link de divulgação: indicar o Ninho e ganhar comissão (dono, 12/11/2026). */}
      {c.codigo && (
        <div className="mb-4">
          <LinkDivulgacao codigo={c.codigo} />
        </div>
      )}
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
      {g.familias.length > 0 && (
        <Card className="mt-4" titulo="Suas famílias e por que algumas estão em R$ 0" direita="famílias que chegaram pelo seu link ou código">
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
                      {valorMes ? brl(valorMes) : <span className="text-ninho-cinza">{brl(0)}{x.situacao === 'ativa' ? ' · parcelas já pagas ou fora deste mês' : ''}</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="mt-2 text-[11.5px] text-ninho-cinza">A comissão só existe quando a família paga: teste grátis não conta, e ela para quando a família cancela ou pede reembolso.</p>
        </Card>
      )}
      <Card titulo="Funil dos seus links" direita="últimos 6 meses" className="mt-4">
        <FunilTabela meses={funil} indisponivel={!eventos} titulo="Últimos 6 meses" />
      </Card>
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
