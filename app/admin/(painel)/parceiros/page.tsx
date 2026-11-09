import Link from 'next/link';
import { requireRole } from '@/lib/auth/guard';
import { listPerfis, clickStatsPorCodigo, installsPorCodigo, statsDe } from '@/lib/painel/store';
import { fetchAppUsersTodos as fetchAppUsers, accountStatus } from '@/lib/app-users';
import { commissionLabel, formatBRL, formatDate } from '@/lib/metrics';
import { ORIGEM_LABEL } from '@/lib/origem';
import {
  repasseDoParceiro,
  repasseConfirmado,
  funilDoParceiro,
  competencias,
  confirmadoDaCompetencia,
  METODO_LABEL,
  contasComAtribuicaoDupla,
} from '@/lib/parceiros';
import { repasseSchedule, fmtData } from '@/lib/repasse-schedule';
import { SITE_URL } from '@/lib/config';
import { PageHeader } from '@/components/admin/PageHeader';
import { LimparRastreio } from '@/components/admin/LimparRastreio';
import { StatCard } from '@/components/admin/StatCard';
import { BarChart } from '@/components/admin/BarChart';
import { Notice } from '@/components/admin/Notice';
import { CopyLink } from '@/components/admin/CopyLink';
import { AtribuicaoManual, type ContaAtribuivel, type OpcaoParceiro } from '@/components/admin/AtribuicaoManual';

export const dynamic = 'force-dynamic';

/**
 * Parceiros (influenciadores) — visão do dono. Espelha /admin/influenciadores
 * do SOMI: ranking, funil e repasse de cada parceiro, link para mandar a ele
 * e a atribuição manual de contas.
 */
export default async function ParceirosPage() {
  requireRole('admin');
  const [perfis, users, cliques, installs] = await Promise.all([
    listPerfis(),
    fetchAppUsers(),
    clickStatsPorCodigo(),
    installsPorCodigo(),
  ]);
  const parceiros = perfis.filter((p) => p.role === 'influencer');
  const sched = repasseSchedule();
  const comp = competencias();

  const linhas = parceiros.map((p) => {
    const code = p.promo_code;
    const stats = statsDe(cliques, code);
    const downloads = code ? installs.get(code.toUpperCase()) ?? 0 : 0;
    const confirmado = repasseConfirmado(p, users);
    return {
      p,
      link: code ? `${SITE_URL}/r/${code.toLowerCase()}` : null,
      stats,
      rep: repasseDoParceiro(p, users),
      funil: funilDoParceiro(p, users, stats, downloads),
      aPagar: confirmadoDaCompetencia(confirmado, comp.fechada),
      emAberto: confirmadoDaCompetencia(confirmado, comp.aberta),
      total: confirmado.total,
    };
  });

  const totalAPagar = linhas.reduce((s, l) => s + l.aPagar, 0);
  const totalAssinantes = linhas.reduce((s, l) => s + l.rep.pagantes, 0);
  const totalCadastros = linhas.reduce((s, l) => s + l.rep.cadastros, 0);

  const nomePorCodigo = new Map(parceiros.filter((p) => p.promo_code).map((p) => [p.promo_code!.toUpperCase(), p.display_name]));
  const opcoes: OpcaoParceiro[] = parceiros
    .filter((p) => p.promo_code && p.active)
    .map((p) => ({ code: p.promo_code!.toUpperCase(), name: p.display_name }));

  // Primeiro quem tem parceiro ou disse "indicação"/Instagram — é quem mais
  // costuma precisar de atribuição manual. Depois, as contas mais novas.
  const peso = (o: string) => (o === 'indicacao' ? 2 : o === 'instagram_facebook' || o === 'tiktok' ? 1 : 0);
  const contas: ContaAtribuivel[] = [...users]
    .sort((a, b) => peso(b.origem) - peso(a.origem) || b.created_at.localeCompare(a.created_at))
    .map((u) => ({
      id: u.id,
      nome: u.name,
      email: u.email,
      criadaEm: formatDate(u.created_at),
      status: accountStatus(u),
      origem: ORIGEM_LABEL[u.origem],
      codigo: u.parceiroCodigo,
      metodo: u.parceiroMetodo
        ? `${METODO_LABEL[u.parceiroMetodo]}${u.parceiroCodigo && !nomePorCodigo.has(u.parceiroCodigo) ? ' · parceiro removido' : ''}`
        : null,
    }));

  return (
    <>
      <PageHeader
        title="Parceiros"
        subtitle="Influenciadores com link rastreável: o que cada um trouxe e quanto recebe. Para criar um parceiro, use Gerenciar perfis com o papel Parceiro."
        right={
          <Link
            href="/admin/perfis"
            className="rounded-pill bg-ninho-roxo px-4 py-2 text-sm font-semibold text-white hover:bg-ninho-roxo-escuro"
          >
            Novo parceiro
          </Link>
        }
      />

      {contasComAtribuicaoDupla(users).length > 0 && (
        <Notice tone="warn">
          <strong>Atribuição dupla:</strong> {contasComAtribuicaoDupla(users).length} conta(s) estão com um parceiro E
          com uma consultora de sono. Vale só o registro mais antigo:{' '}
          {contasComAtribuicaoDupla(users)
            .map((u) => `${u.email ?? u.name ?? u.id.slice(0, 8)} (${u.parceiroCodigo}: ${u.atribuicaoDupla === 'vale_parceiro' ? 'conta para o parceiro' : 'conta para a consultora'})`)
            .join('; ')}
          .
        </Notice>
      )}

      {parceiros.length === 0 && (
        <Notice tone="info">
          Nenhum parceiro ainda. Em <Link href="/admin/perfis" className="font-semibold underline">Gerenciar perfis</Link>,
          crie um perfil com o papel <strong>Parceiro (influenciador)</strong> e um código (ex.: MARIANA). O link dele
          fica {SITE_URL}/r/mariana e aparece aqui para você copiar.
        </Notice>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Parceiros ativos" value={parceiros.filter((p) => p.active).length} />
        <StatCard label="Cadastros por parceiros" value={totalCadastros} />
        <StatCard label="Assinantes por parceiros" value={totalAssinantes} hint="pagando hoje" />
        <StatCard
          label="A pagar (R$)"
          value={formatBRL(totalAPagar)}
          hint={`cobranças de ${sched.consolidado.competencia} · Pix ${fmtData(sched.consolidado.pagamentoEm)}`}
          compactHint
          accent
        />
      </div>

      {linhas.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-3 text-base font-bold text-ninho-grafite">Ranking por assinantes</h2>
          <BarChart
            data={[...linhas]
              .sort((a, b) => b.rep.pagantes - a.rep.pagantes)
              .map((l) => ({ label: l.p.display_name, value: l.rep.pagantes }))}
          />
        </section>
      )}

      <section className="mb-8 flex flex-col gap-4">
        {linhas.map((l) => (
          <div key={l.p.id} className="rounded-2xl border border-ninho-borda bg-white p-5">
            <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-base font-bold text-ninho-grafite">
                  {l.p.display_name}{' '}
                  <span className="font-mono text-sm font-semibold text-ninho-roxo-escuro">{l.p.promo_code || 'sem código'}</span>
                  {!l.p.active && <span className="ml-2 rounded-pill bg-ninho-nuvem px-2 py-0.5 text-[11px] text-ninho-cinza">inativo</span>}
                </p>
                <p className="text-xs text-ninho-cinza">
                  {commissionLabel(l.p)} · login <span className="font-mono">{l.p.username}</span> · Pix {l.p.pix_key || 'não cadastrado'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[11px] uppercase text-ninho-cinza">A pagar · em aberto</p>
                <p className="text-lg font-bold text-ninho-roxo-escuro">
                  {formatBRL(l.aPagar)} <span className="text-sm font-medium text-ninho-cinza">· {formatBRL(l.emAberto)}</span>
                </p>
              </div>
            </div>
            {l.link && <CopyLink url={l.link} />}
            {l.p.promo_code ? (
              <div className="mt-2"><LimparRastreio tipo="parceiro" id={l.p.id} codigo={l.p.promo_code.toUpperCase()} /></div>
            ) : null}
            <div className="mt-4 grid grid-cols-3 gap-2 text-center sm:grid-cols-5 lg:grid-cols-9">
              {[
                ['Cliques únicos', l.funil.cliquesUnicos],
                ['Downloads', l.funil.downloads],
                ['Cadastros', l.funil.cadastros],
                ['Em teste', l.rep.trials],
                ['Assinantes', l.funil.assinantes],
                ['Download/clique', `${l.funil.txDownloadPorClique}%`],
                ['Conversão teste', `${l.funil.txConversaoTrial}%`],
                ['Previsão', formatBRL(l.rep.previsao)],
                ['Total gerado', formatBRL(l.total)],
              ].map(([rotulo, valor]) => (
                <div key={String(rotulo)} className="rounded-xl bg-ninho-nuvem p-2">
                  <p className="text-[10px] uppercase text-ninho-cinza">{rotulo}</p>
                  <p className="text-sm font-bold text-ninho-grafite">{valor}</p>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-ninho-cinza">
              Cliques: {l.stats.ios} iPhone · {l.stats.android} Android · {l.stats.desktop} computador (total {l.stats.total}).
            </p>
          </div>
        ))}
      </section>

      <section>
        <h2 className="mb-1 text-base font-bold text-ninho-grafite">Atribuição manual</h2>
        <p className="mb-4 text-sm text-ninho-cinza">
          Para quem disse que veio de um parceiro mas não tocou no link nem digitou o código. Atribuição manual troca a
          automática e aparece como &quot;Manual&quot;.
        </p>
        <AtribuicaoManual contas={contas} parceiros={opcoes} />
      </section>
    </>
  );
}
