import Link from 'next/link';
import { requireSessionAtiva } from '@/lib/auth/guard';
import { getPerfil, clickStatsPorCodigo, installsPorCodigo, statsDe } from '@/lib/painel/store';
import { fetchAppUsersTodos as fetchAppUsers } from '@/lib/app-users';
import {
  commissionLabel,
  commissionPerPlan,
  commissionValue,
  formatBRL,
  formatDate,
  isChurn,
  isPagante,
  isTrialAtivo,
  planoLabel,
} from '@/lib/metrics';
import {
  repasseDoParceiro,
  repasseConfirmado,
  funilDoParceiro,
  origemDoParceiro,
  barrasReceita,
  competencias,
  confirmadoDaCompetencia,
  contasDoParceiro,
} from '@/lib/parceiros';
import { repasseSchedule, fmtData } from '@/lib/repasse-schedule';
import { SITE_URL } from '@/lib/config';
import { Notice } from '@/components/admin/Notice';
import { CopyLink } from '@/components/admin/CopyLink';
import { CommissionBreakdown } from '@/components/admin/CommissionBreakdown';
import { RepasseRegras } from '@/components/admin/RepasseRegras';
import { VerticalBarChart } from '@/components/admin/VerticalBarChart';
import { Abas, Avatar, Aviso, Card, Kpi, Selo, td, th } from '@/components/consultoras/ui';
import type { AppUser } from '@/lib/app-users';

export const dynamic = 'force-dynamic';

/**
 * Painel do PARCEIRO (influenciador) — o que ele vê ao entrar. Desde 09/11/2026
 * no mesmo desenho do painel da consultora (cartões brancos, KPIs, selos),
 * aprovado pelo dono em Ninho-expo/docs/design/site/seja-parceiro.html.
 * Abas: Resultados (padrão), Ganhos e Quem veio por você.
 *
 * Mostra só números agregados e a situação de cada indicado (data e status),
 * nunca nome, e-mail ou telefone de quem baixou.
 */
type Busca = { aba?: string };

const ABAS: [string, string][] = [
  ['resultados', 'Resultados'],
  ['ganhos', 'Ganhos'],
  ['indicados', 'Quem veio por você'],
];

function Titulo({ t, sub }: { t: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className="mb-4">
      <h1 className="text-2xl font-black tracking-tight text-[#24164F]">{t}</h1>
      {sub && <p className="mt-1 text-sm text-ninho-cinza">{sub}</p>}
    </div>
  );
}

function pctTxt(a: number, b: number): string {
  return b > 0 ? `${Math.round((a / b) * 100)}% da anterior` : '—';
}

function LinhaFunil({ k, v, max, sub, cor = '#9F86E0' }: { k: string; v: number; max: number; sub?: string; cor?: string }) {
  const w = max > 0 ? Math.max(v > 0 ? 3 : 0, Math.round((v / max) * 100)) : 0;
  return (
    <div className="grid h-11 grid-cols-[96px_1fr_92px] items-center gap-x-2.5">
      <span className="text-[13px] font-extrabold">{k}</span>
      <span className="h-[18px] rounded-[7px] bg-[#F1ECFB]">
        <i className="block h-full rounded-[7px]" style={{ width: `${w}%`, background: cor }} />
      </span>
      <span className="text-right text-base font-black tabular-nums">
        {v}
        {sub && <small className="block text-[10.5px] font-semibold text-ninho-cinza">{sub}</small>}
      </span>
    </div>
  );
}

function situacao(u: AppUser): React.ReactNode {
  if (isPagante(u)) return <Selo cor="verde">Assinou</Selo>;
  if (isTrialAtivo(u)) return <Selo cor="lilas">Teste grátis</Selo>;
  if (isChurn(u)) return <Selo cor="vermelho">Cancelou</Selo>;
  return <Selo cor="cinza">Sem plano</Selo>;
}

export default async function ParceiroPage({ searchParams }: { searchParams: Busca }) {
  const session = await requireSessionAtiva(['influencer', 'admin']);
  const perfil = await getPerfil(session.sub);
  if (!perfil) return null;

  if (perfil.role !== 'influencer') {
    return (
      <>
        <Titulo t="Painel do parceiro" sub="Esta é a tela que cada parceiro vê ao entrar." />
        <Notice tone="info">
          Você é administrador. Para ver os números de cada parceiro, abra{' '}
          <Link href="/admin/parceiros" className="font-semibold underline">Parceiros</Link>.
        </Notice>
      </>
    );
  }

  const aba = ABAS.some(([k]) => k === searchParams.aba) ? searchParams.aba! : 'resultados';

  const [users, cliques, installs] = await Promise.all([fetchAppUsers(), clickStatsPorCodigo(), installsPorCodigo()]);
  const code = perfil.promo_code;
  const stats = statsDe(cliques, code);
  const downloads = code ? installs.get(code.toUpperCase()) ?? 0 : 0;

  const rep = repasseDoParceiro(perfil, users);
  const confirmado = repasseConfirmado(perfil, users);
  const funil = funilDoParceiro(perfil, users, stats, downloads);
  const origem = origemDoParceiro(perfil, users);
  const sched = repasseSchedule();
  const comp = competencias();
  const aPagar = confirmadoDaCompetencia(confirmado, comp.fechada);
  const emAberto = confirmadoDaCompetencia(confirmado, comp.aberta);
  const indicados = contasDoParceiro(perfil, users).sort((a, b) => b.created_at.localeCompare(a.created_at));
  const cancelaram = indicados.filter(isChurn).length;
  const link = code ? `${SITE_URL}/r/${code.toLowerCase()}` : null;

  let corpo: React.ReactNode;

  if (aba === 'ganhos') {
    const barras = barrasReceita(perfil, users, 7);
    corpo = (
      <>
        <Titulo t="Ganhos" sub={`Sua comissão: ${commissionLabel(perfil)}. Pix até o 5º dia útil do mês seguinte.`} />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi rotulo="A pagar (mês fechado)" valor={formatBRL(aPagar)} sub={`cobranças de ${sched.consolidado.competencia} · Pix ${fmtData(sched.consolidado.pagamentoEm)}`} verde />
          <Kpi rotulo="Em aberto (este mês)" valor={formatBRL(emAberto)} sub={`${sched.aberto.competencia} · Pix ${fmtData(sched.aberto.pagamentoEm)}`} />
          <Kpi rotulo="Previsão (em teste grátis)" valor={formatBRL(rep.previsao)} sub={`${rep.trials} pessoa(s)${rep.previsaoData ? ` · o 1º teste acaba em ${formatDate(rep.previsaoData)}` : ''}`} />
          <Kpi rotulo="Total desde o início" valor={formatBRL(confirmado.total)} sub={`${confirmado.cobrancas} cobrança(s) com comissão`} />
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-[1.25fr_1fr]">
          <Card titulo="Comissão por mês" direita="mês em que o Pix cai">
            <VerticalBarChart
              data={barras.map((b) => ({
                label: b.label,
                value: b.value,
                highlight: b.highlight,
                color: b.kind === 'realizado' ? '#9F86E0' : '#D9CCF6',
              }))}
              formatValue={formatBRL}
            />
            <p className="mt-2 text-[11.5px] text-ninho-cinza">
              Meses fechados: cobranças reais. Mês atual e próximos: previsão pelos assinantes de hoje.
            </p>
          </Card>
          <Card titulo="Sua comissão por plano">
            <CommissionBreakdown headline={commissionLabel(perfil)} itens={commissionPerPlan(perfil)} />
          </Card>
        </div>
        <div className="mt-4">
          <RepasseRegras duracaoMeses={perfil.commission_duration_months} />
        </div>
      </>
    );
  } else if (aba === 'indicados') {
    const origens: [string, { cadastros: number; assinantes: number }, string][] = [
      ['Pelo link', origem.link, 'abriu o app depois de tocar no seu link'],
      ['Pelo código', origem.codigo, 'digitou o seu código no cadastro'],
      ['Pela equipe', origem.manual, 'disse que veio de você e a equipe registrou'],
    ];
    corpo = (
      <>
        <Titulo t="Quem veio por você" sub="Sem nome, e-mail ou telefone: só a data e a situação de cada conta." />
        <div className="grid gap-3 sm:grid-cols-3">
          {origens.map(([k, o, sub]) => (
            <Kpi key={k} rotulo={k} valor={o.cadastros} sub={`${o.assinantes} assinante(s) · ${sub}`} />
          ))}
        </div>
        <Card titulo={`Contas (${indicados.length})`} className="mt-4">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px]">
              <thead>
                <tr>
                  <th className={th}>Cadastro</th>
                  <th className={th}>Plano</th>
                  <th className={th}>Situação</th>
                  <th className={`${th} text-right`}>Comissão</th>
                </tr>
              </thead>
              <tbody>
                {indicados.length === 0 && (
                  <tr>
                    <td colSpan={4} className={`${td} py-6 text-center text-ninho-cinza`}>Ainda sem indicados. Divulgue o seu link.</td>
                  </tr>
                )}
                {indicados.map((u) => (
                  <tr key={u.id}>
                    <td className={`${td} tabular-nums text-ninho-cinza`}>{formatDate(u.created_at)}</td>
                    <td className={td}>{isPagante(u) ? planoLabel(u) : '—'}</td>
                    <td className={td}>{situacao(u)}</td>
                    <td className={`${td} text-right font-bold tabular-nums`}>{isPagante(u) ? formatBRL(commissionValue(perfil, u)) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </>
    );
  } else {
    const max = Math.max(funil.cliquesUnicos, funil.downloads, funil.cadastros, 1);
    corpo = (
      <>
        <Titulo t={`Olá, ${perfil.display_name}`} sub="Os resultados da sua divulgação do Ninho, desde o início." />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-[1fr_1fr_1fr_1fr_1.25fr]">
          <Kpi rotulo="Cliques" valor={funil.cliques} sub={`${funil.cliquesUnicos} pessoas`} />
          <Kpi rotulo="Downloads" valor={funil.downloads} sub={`${funil.txDownloadPorClique}% dos cliques`} />
          <Kpi rotulo="Cadastros" valor={funil.cadastros} sub={`${rep.trials} em teste grátis`} />
          <Kpi rotulo="Assinantes" valor={rep.pagantes} sub="pagando hoje" />
          <div className="col-span-2 lg:col-span-1">
            <Kpi rotulo="Próximo Pix" valor={formatBRL(aPagar)} sub={`cobranças de ${sched.consolidado.competencia} · ${fmtData(sched.consolidado.pagamentoEm)}`} verde />
          </div>
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-[1.25fr_1fr]">
          <Card titulo="Do clique à assinatura">
            <LinhaFunil k="Cliques" v={funil.cliquesUnicos} max={max} sub={`${funil.cliques} no total`} />
            <LinhaFunil k="Downloads" v={funil.downloads} max={max} sub={pctTxt(funil.downloads, funil.cliquesUnicos)} />
            <LinhaFunil k="Cadastros" v={funil.cadastros} max={max} sub={pctTxt(funil.cadastros, funil.downloads)} />
            <LinhaFunil k="Assinantes" v={funil.assinantes} max={max} sub={`${funil.txConversaoTrial}% do teste`} cor="#4CAF74" />
            <LinhaFunil k="Cancelaram" v={cancelaram} max={max} cor="#C9C5D3" />
            <p className="mt-2 text-[11.5px] leading-snug text-ninho-cinza">
              Cliques por aparelho: {stats.ios} iPhone · {stats.android} Android · {stats.desktop} computador. O download
              conta quando a pessoa abre o app no mesmo celular em que tocou no link.
            </p>
          </Card>
          <Card titulo="Seu link e seu código" direita="link na bio e nos Stories; código nos Reels">
            {link ? (
              <>
                <CopyLink url={link} />
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-[14px] bg-[#F7F4FD] px-2 py-2.5">
                    <b className="block font-mono text-[15px] font-black text-[#24164F]">{code}</b>
                    <span className="text-xs font-bold text-ninho-cinza">código</span>
                  </div>
                  <div className="rounded-[14px] bg-[#F7F4FD] px-2 py-2.5">
                    <b className="block text-lg font-black tabular-nums text-[#24164F]">{origem.link.cadastros}</b>
                    <span className="text-xs font-bold text-ninho-cinza">pelo link</span>
                  </div>
                  <div className="rounded-[14px] bg-[#F7F4FD] px-2 py-2.5">
                    <b className="block text-lg font-black tabular-nums text-[#24164F]">{origem.codigo.cadastros}</b>
                    <span className="text-xs font-bold text-ninho-cinza">pelo código</span>
                  </div>
                </div>
                <p className="mt-3 text-xs leading-snug text-ninho-cinza">
                  O link leva para a loja certa (iPhone ou Android). Quem instalou sem o link pode digitar o seu código
                  no cadastro do app.
                </p>
              </>
            ) : (
              <p className="text-sm text-ninho-cinza">O link aparece aqui quando o seu código for configurado.</p>
            )}
            <Link href="/admin/parceiro/guia" className="mt-3 inline-flex h-8 items-center rounded-pill bg-[#F1EBFC] px-3 text-[12.5px] font-bold text-[#7C5CD6]">
              Guia do parceiro: ideias e o que não falar
            </Link>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="mb-4 flex items-center gap-3 rounded-2xl bg-white p-3">
        <Avatar id={perfil.id} nome={perfil.display_name} tamanho={40} />
        <div className="flex-1 leading-tight">
          <b className="text-[14px]">{perfil.display_name}</b>
          <p className="text-[12px] text-ninho-cinza">Parceiro do Ninho{code ? ` · código ${code}` : ''}</p>
        </div>
      </div>
      {!code && <Aviso tom="ambar">Seu código de divulgação ainda não foi configurado. Fale com a equipe do Ninho.</Aviso>}
      {!perfil.pix_key && (
        <Aviso tom="ambar">
          Cadastre a sua chave Pix em <Link href="/admin/conta" className="font-semibold underline">Minha conta</Link> para
          receber os repasses.
        </Aviso>
      )}
      <div className="mt-4">
        <Abas base="/admin/parceiro" atual={aba} abas={ABAS} />
        {corpo}
      </div>
    </>
  );
}
