import Link from 'next/link';
import { requireSessionAtiva } from '@/lib/auth/guard';
import { getPerfil, clickStatsPorCodigo, installsPorCodigo, statsDe } from '@/lib/painel/store';
import { fetchAppUsersTodos as fetchAppUsers } from '@/lib/app-users';
import { commissionLabel, commissionPerPlan, formatBRL, formatDate, isPagante, isTrialAtivo } from '@/lib/metrics';
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
import { PageHeader } from '@/components/admin/PageHeader';
import { Notice } from '@/components/admin/Notice';
import { Mini } from '@/components/admin/Mini';
import { StatCard } from '@/components/admin/StatCard';
import { CopyLink } from '@/components/admin/CopyLink';
import { CommissionBreakdown } from '@/components/admin/CommissionBreakdown';
import { RepasseRegras } from '@/components/admin/RepasseRegras';
import { VerticalBarChart } from '@/components/admin/VerticalBarChart';

export const dynamic = 'force-dynamic';

/**
 * Painel do PARCEIRO (influenciador) — o que ele vê ao entrar. Espelha a tela
 * /admin/influencer do SOMI. Mostra só números agregados e a situação de cada
 * indicado (data e status), nunca nome, e-mail ou telefone de quem baixou.
 */
export default async function ParceiroPage() {
  const session = await requireSessionAtiva(['influencer', 'admin']);
  const perfil = await getPerfil(session.sub);
  if (!perfil) return null;

  if (perfil.role !== 'influencer') {
    return (
      <>
        <PageHeader title="Painel do parceiro" subtitle="Esta é a tela que cada parceiro vê ao entrar." />
        <Notice tone="info">
          Você é administrador. Para ver os números de cada parceiro, abra{' '}
          <Link href="/admin/parceiros" className="font-semibold underline">Parceiros</Link>.
        </Notice>
      </>
    );
  }

  const [users, cliques, installs] = await Promise.all([fetchAppUsers(), clickStatsPorCodigo(), installsPorCodigo()]);
  const code = perfil.promo_code;
  const stats = statsDe(cliques, code);
  const downloads = code ? installs.get(code.toUpperCase()) ?? 0 : 0;

  const rep = repasseDoParceiro(perfil, users);
  const confirmado = repasseConfirmado(perfil, users);
  const funil = funilDoParceiro(perfil, users, stats, downloads);
  const origem = origemDoParceiro(perfil, users);
  const barras = barrasReceita(perfil, users, 7);
  const sched = repasseSchedule();
  const comp = competencias();
  const aPagar = confirmadoDaCompetencia(confirmado, comp.fechada);
  const emAberto = confirmadoDaCompetencia(confirmado, comp.aberta);
  const indicados = contasDoParceiro(perfil, users).sort((a, b) => b.created_at.localeCompare(a.created_at));
  const link = code ? `${SITE_URL}/r/${code.toLowerCase()}` : null;

  return (
    <>
      <PageHeader
        title={`Olá, ${perfil.display_name}`}
        subtitle="Acompanhe os resultados da sua divulgação do Ninho."
        right={
          <Link
            href="/admin/parceiro/guia"
            className="rounded-pill border border-ninho-roxo px-4 py-2 text-sm font-semibold text-ninho-roxo-escuro hover:bg-ninho-roxo-suave"
          >
            Guia do parceiro
          </Link>
        }
      />

      {!code && (
        <Notice tone="warn">Seu código de divulgação ainda não foi configurado. Fale com a equipe do Ninho.</Notice>
      )}
      {!perfil.pix_key && (
        <Notice tone="warn">
          Cadastre sua chave Pix em <Link href="/admin/conta" className="font-semibold underline">Minha conta</Link> para
          receber os repasses.
        </Notice>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Assinantes" value={rep.pagantes} hint="pagando hoje" />
        <StatCard
          label="Próximo pagamento"
          value={formatBRL(aPagar)}
          hint={`cobranças de ${sched.consolidado.competencia} · paga ${fmtData(sched.consolidado.pagamentoEm)}`}
          compactHint
          accent
        />
        <StatCard
          label="Gerado este mês"
          value={formatBRL(emAberto)}
          hint={`${sched.aberto.competencia} · paga ${fmtData(sched.aberto.pagamentoEm)}`}
          compactHint
        />
      </div>

      <section className="mb-6 rounded-2xl border border-ninho-borda bg-white p-5">
        <h2 className="mb-3 text-base font-bold text-ninho-grafite">Seu link de divulgação</h2>
        {link ? (
          <>
            <CopyLink url={link} />
            <p className="mt-3 text-sm text-ninho-grafite">
              Seu código: <span className="font-mono font-semibold text-ninho-roxo-escuro">{code}</span>
            </p>
            <p className="mt-1 text-xs text-ninho-cinza">
              O link leva direto para a loja certa (iPhone ou Android) e conta cada clique, download e cadastro que vier
              de você. Quem já instalou sem o link pode digitar o seu código no cadastro do app.
            </p>
          </>
        ) : (
          <p className="text-sm text-ninho-cinza">Link indisponível até o código ser configurado.</p>
        )}
      </section>

      <section className="mb-6 rounded-2xl border border-ninho-borda bg-white p-5">
        <h2 className="mb-4 text-base font-bold text-ninho-grafite">Seu funil</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          <Mini label="Cliques únicos" value={funil.cliquesUnicos} />
          <Mini label="Downloads" value={funil.downloads} />
          <Mini label="Cadastros" value={funil.cadastros} />
          <Mini label="Em teste grátis" value={rep.trials} />
          <Mini label="Assinantes" value={funil.assinantes} />
          <Mini label="Download / clique" value={`${funil.txDownloadPorClique}%`} />
          <Mini label="Conversão do teste" value={`${funil.txConversaoTrial}%`} />
        </div>
        <p className="mt-3 text-xs text-ninho-cinza">
          Cliques por aparelho: {stats.ios} iPhone · {stats.android} Android · {stats.desktop} computador. Downloads
          contam quando a pessoa abre o app no mesmo celular em que tocou no link.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="mb-1 text-base font-bold text-ninho-grafite">Sua receita (R$)</h2>
        <p className="mb-3 text-xs text-ninho-cinza">
          Cada barra é o mês em que o Pix cai (dia 30). Meses fechados mostram o valor das cobranças reais; o mês atual e
          os próximos são previsão pelos assinantes de hoje.
        </p>
        <VerticalBarChart
          data={barras.map((b) => ({
            label: b.label,
            value: b.value,
            highlight: b.highlight,
            color: b.kind === 'realizado' ? '#7C5CD6' : '#C9B8F0',
          }))}
          formatValue={formatBRL}
        />
      </section>

      <section className="mb-6 rounded-2xl border border-ninho-borda bg-white p-5">
        <h2 className="mb-3 text-base font-bold text-ninho-grafite">Seus pagamentos</h2>
        <ul className="space-y-3 text-sm">
          <li className="flex items-start justify-between gap-4">
            <span>
              A pagar (mês fechado)
              <span className="block text-xs text-ninho-cinza">
                cobranças de {sched.consolidado.competencia} · paga em <strong>{fmtData(sched.consolidado.pagamentoEm)}</strong>
              </span>
            </span>
            <span className="font-bold text-ninho-roxo-escuro">{formatBRL(aPagar)}</span>
          </li>
          <li className="flex items-start justify-between gap-4 border-t border-ninho-borda pt-3">
            <span>
              Em aberto (este mês)
              <span className="block text-xs text-ninho-cinza">
                cobranças de {sched.aberto.competencia} até agora · paga em <strong>{fmtData(sched.aberto.pagamentoEm)}</strong>
              </span>
            </span>
            <span className="font-bold text-ninho-roxo-escuro">{formatBRL(emAberto)}</span>
          </li>
          <li className="flex items-start justify-between gap-4 border-t border-ninho-borda pt-3">
            <span>
              Previsão (em teste grátis, podem cancelar)
              <span className="block text-xs text-ninho-cinza">
                {rep.trials} pessoa(s){rep.previsaoData ? ` · o teste mais próximo acaba em ${formatDate(rep.previsaoData)}` : ''}
              </span>
            </span>
            <span className="font-semibold text-ninho-cinza">{formatBRL(rep.previsao)}</span>
          </li>
          <li className="flex items-start justify-between gap-4 border-t border-ninho-borda pt-3">
            <span>
              Total gerado desde o início
              <span className="block text-xs text-ninho-cinza">{confirmado.cobrancas} cobrança(s) com comissão</span>
            </span>
            <span className="font-semibold text-ninho-grafite">{formatBRL(confirmado.total)}</span>
          </li>
        </ul>
        <p className="mt-4 text-xs text-ninho-cinza">Pagamento via Pix no dia 30. Comissão: {commissionLabel(perfil)}.</p>
      </section>

      <section className="mb-6 rounded-2xl border border-ninho-borda bg-white p-5">
        <h2 className="mb-3 text-base font-bold text-ninho-grafite">Sua comissão por plano</h2>
        <CommissionBreakdown headline={commissionLabel(perfil)} itens={commissionPerPlan(perfil)} />
      </section>

      <section className="mb-6 rounded-2xl border border-ninho-borda bg-white p-5">
        <h2 className="mb-3 text-base font-bold text-ninho-grafite">Origem dos seus indicados</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Mini label="Pelo link" value={origem.link.cadastros} hint={`${origem.link.assinantes} assinante(s)`} />
          <Mini label="Pelo código" value={origem.codigo.cadastros} hint={`${origem.codigo.assinantes} assinante(s)`} />
          <Mini label="Pela equipe" value={origem.manual.cadastros} hint={`${origem.manual.assinantes} assinante(s)`} />
        </div>
        <p className="mt-3 text-xs text-ninho-cinza">
          &quot;Link&quot; = abriu o app depois de tocar no seu link. &quot;Código&quot; = digitou seu código no cadastro.
          &quot;Equipe&quot; = a pessoa disse que veio de você e a equipe do Ninho registrou.
        </p>
      </section>

      <div className="mb-6">
        <RepasseRegras duracaoMeses={perfil.commission_duration_months} />
      </div>

      <section className="rounded-2xl border border-ninho-borda bg-white p-2">
        <h2 className="p-3 text-base font-bold text-ninho-grafite">Seus indicados ({indicados.length})</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ninho-borda text-left text-[11px] uppercase tracking-wide text-ninho-cinza">
              <th className="p-3">Cadastro</th>
              <th className="p-3">Situação</th>
            </tr>
          </thead>
          <tbody>
            {indicados.length === 0 && (
              <tr>
                <td colSpan={2} className="p-6 text-center text-ninho-cinza">Ainda sem indicados. Divulgue seu link.</td>
              </tr>
            )}
            {indicados.map((u) => (
              <tr key={u.id} className="border-b border-ninho-borda last:border-0">
                <td className="p-3 text-ninho-cinza">{formatDate(u.created_at)}</td>
                <td className="p-3">
                  {isPagante(u) ? (
                    <span className="font-medium text-ninho-roxo-escuro">Assinante</span>
                  ) : isTrialAtivo(u) ? (
                    <span className="text-ninho-grafite">Em teste grátis</span>
                  ) : (
                    <span className="text-ninho-cinza">Cadastrado</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
