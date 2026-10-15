import { requireRole } from '@/lib/auth/guard';
import { montarAnalise, produtoLabel, type CampanhaResumo, type Canal } from '@/lib/analise';
import { formatDate, taxaConversaoNascidos, taxaConversaoHint } from '@/lib/metrics';
import { fetchAppUsers } from '@/lib/app-users';
import { PageHeader } from '@/components/admin/PageHeader';
import { StatCard } from '@/components/admin/StatCard';
import { Notice } from '@/components/admin/Notice';
import { BarChart } from '@/components/admin/BarChart';
import { Tabela, Td } from '@/components/admin/Tabela';
import { Mini } from '@/components/admin/Mini';

export const dynamic = 'force-dynamic';

const pct = (n: number, d: number) => (d > 0 ? `${Math.round((n / d) * 100)}%` : '—');

/** "12 de 40 · 30%" — o número cru vem antes: com base pequena, % engana. */
function deDe(n: number, d: number) {
  return d > 0 ? `${n} de ${d} · ${pct(n, d)}` : '—';
}

function CanalCel({ c, semRastreio }: { c: Canal; semRastreio?: boolean }) {
  if (c.enviados === 0) return <span className="text-ninho-cinza">—</span>;
  if (semRastreio)
    return (
      <span className="text-ninho-cinza" title="Abertura de e-mail ainda não está chegando do Resend">
        {c.enviados} env. · sem rastreio
      </span>
    );
  return (
    <span>
      <strong>{c.abertos}</strong>/{c.enviados}{' '}
      <span className="text-ninho-cinza">({pct(c.abertos, c.enviados)})</span>
    </span>
  );
}

/** Funil em barras: cada etapa medida contra a primeira. */
function Funil({ etapas }: { etapas: { label: string; n: number }[] }) {
  const topo = Math.max(1, etapas[0]?.n ?? 1);
  return (
    <div className="flex flex-col gap-2.5">
      {etapas.map((e, i) => (
        <div key={e.label} className="flex items-center gap-3">
          <span className="w-40 shrink-0 text-xs text-ninho-cinza">{e.label}</span>
          <div className="h-6 flex-1 overflow-hidden rounded-lg bg-ninho-nuvem">
            <div
              className="flex h-full items-center rounded-lg px-2 text-[11px] font-semibold text-white"
              style={{
                width: `${Math.max(e.n > 0 ? 6 : 0, (e.n / topo) * 100)}%`,
                background: i === etapas.length - 1 ? '#4CAF74' : '#9F86E0',
              }}
            >
              {e.n > 0 ? e.n : ''}
            </div>
          </div>
          <span className="w-12 shrink-0 text-right text-xs font-semibold text-ninho-grafite">
            {i === 0 ? '' : pct(e.n, topo)}
          </span>
        </div>
      ))}
    </div>
  );
}

function Secao({
  titulo,
  sub,
  children,
}: {
  titulo: string;
  sub?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10">
      <h2 className="text-base font-bold text-ninho-grafite">{titulo}</h2>
      {sub && <p className="mb-3 mt-0.5 max-w-3xl text-xs text-ninho-cinza">{sub}</p>}
      {!sub && <div className="mb-3" />}
      {children}
    </section>
  );
}

function CardCampanha({ c, emailRastreado }: { c: CampanhaResumo; emailRastreado: boolean }) {
  return (
    <div className="rounded-2xl border border-ninho-borda bg-white p-5">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-bold text-ninho-grafite">{c.label}</h3>
        <span className="text-xs text-ninho-cinza">enviada em {formatDate(c.inicio)}</span>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Funil
          etapas={[
            { label: 'Receberam', n: c.pessoas },
            { label: 'Abriram o app depois', n: c.voltaramAbrir },
            { label: 'Registraram rotina depois', n: c.voltaramRegistrar },
            { label: 'Assinaram', n: c.assinaram },
          ]}
        />
        <div className="grid grid-cols-3 gap-3 self-start">
          <Mini label="Push aberta" value={pct(c.push.abertos, c.push.enviados)} hint={`${c.push.abertos} de ${c.push.enviados}`} />
          <Mini
            label="Sininho lido"
            value={pct(c.sininho.abertos, c.sininho.enviados)}
            hint={`${c.sininho.abertos} de ${c.sininho.enviados}`}
          />
          <Mini
            label="E-mail aberto"
            value={emailRastreado ? pct(c.email.abertos, c.email.enviados) : '—'}
            hint={emailRastreado ? `${c.email.abertos} de ${c.email.enviados}` : `${c.email.enviados} enviados · sem rastreio`}
          />
        </div>
      </div>
      {c.assinantes.length > 0 && (
        <p className="mt-4 text-xs text-ninho-cinza">
          Assinaram:{' '}
          {c.assinantes
            .map((a) => `${a.nome ?? 'sem nome'} (${produtoLabel(a.produto)}, ${a.diasDepois}d depois)`)
            .join(' · ')}
        </p>
      )}
    </div>
  );
}

export default async function AnalisePage() {
  requireRole('admin');
  const [a, users] = await Promise.all([montarAnalise(), fetchAppUsers()]);
  const conversao = taxaConversaoNascidos(users);

  if (!a) {
    return (
      <>
        <PageHeader title="Análise de dados" />
        <Notice tone="warn">Banco do app não configurado — sem dados para analisar.</Notice>
      </>
    );
  }

  const { campanhas, trial, expiracao, ofertas, cuidador, emailRastreado } = a;
  const presente = campanhas.find((c) => c.id === 'presente_7_dias');
  const outras = campanhas.filter((c) => c.id !== 'presente_7_dias');

  const tot = campanhas.reduce(
    (s, c) => ({
      pessoas: s.pessoas + c.pessoas,
      pushEnv: s.pushEnv + c.push.enviados,
      pushAbr: s.pushAbr + c.push.abertos,
      sinEnv: s.sinEnv + c.sininho.enviados,
      sinLido: s.sinLido + c.sininho.abertos,
      assinaram: s.assinaram + c.assinaram,
    }),
    { pessoas: 0, pushEnv: 0, pushAbr: 0, sinEnv: 0, sinLido: 0, assinaram: 0 },
  );
  const h = cuidador.historico;

  return (
    <>
      <PageHeader
        title="Análise de dados"
        subtitle="O que cada ação sua gerou: quem viu, quem voltou a usar e quem assinou. Atualiza sozinho a cada minuto; campanha nova aparece aqui sem precisar mexer no painel."
      />

      {!emailRastreado && (
        <Notice tone="warn">
          <strong>Abertura de e-mail ainda não chega.</strong> Os e-mails estão saindo (aparecem como
          “enviados”), mas nenhum evento de abertura/clique voltou do Resend. Confira se o webhook do
          Resend aponta pro Supabase com os eventos <em>email.opened</em> e <em>email.clicked</em> —
          enquanto isso, e-mail fica como “sem rastreio” e não entra nas taxas.
        </Notice>
      )}

      <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          label="Taxa de conversão"
          value={`${conversao.taxa.toFixed(1)}%`}
          hint={taxaConversaoHint(conversao)}
          compactHint
          accent
        />
        <StatCard label="Pessoas alcançadas" value={tot.pessoas} hint={`em ${campanhas.length} campanhas`} compactHint />
        <StatCard label="Push abertas" value={pct(tot.pushAbr, tot.pushEnv)} hint={`${tot.pushAbr} de ${tot.pushEnv} enviadas`} compactHint />
        <StatCard label="Sininho lido" value={pct(tot.sinLido, tot.sinEnv)} hint={`${tot.sinLido} de ${tot.sinEnv} entregues`} compactHint />
        <StatCard label="Assinaram depois de uma campanha" value={tot.assinaram} hint="Primeira compra após receber" compactHint />
      </div>

      {presente && (
        <Secao
          titulo="Presente de +7 dias"
          sub="Quem ganhou mais 7 dias de teste: quantos voltaram a abrir o app, a registrar a rotina e quantos assinaram depois do presente."
        >
          <CardCampanha c={presente} emailRastreado={emailRastreado} />
        </Secao>
      )}

      <Secao
        titulo="Todas as campanhas (push, sininho e e-mail)"
        sub="Uma linha por campanha enviada pelo enviar-comunicado. “Voltaram” e “assinaram” contam só o que aconteceu DEPOIS do primeiro envio para cada pessoa."
      >
        <Tabela
          headers={['Campanha', 'Enviada', 'Pessoas', 'Push aberta', 'Sininho lido', 'E-mail aberto', 'Abriram o app', 'Registraram', 'Assinaram']}
          vazio="Nenhuma campanha enviada ainda."
        >
          {campanhas.map((c) => (
            <tr key={c.id}>
              <Td className="font-medium">{c.label}</Td>
              <Td className="whitespace-nowrap">{formatDate(c.inicio)}</Td>
              <Td>{c.pessoas}</Td>
              <Td className="whitespace-nowrap">
                <CanalCel c={c.push} />
              </Td>
              <Td className="whitespace-nowrap">
                <CanalCel c={c.sininho} />
              </Td>
              <Td className="whitespace-nowrap">
                <CanalCel c={c.email} semRastreio={!emailRastreado} />
              </Td>
              <Td className="whitespace-nowrap">{deDe(c.voltaramAbrir, c.pessoas)}</Td>
              <Td className="whitespace-nowrap">{deDe(c.voltaramRegistrar, c.pessoas)}</Td>
              <Td className="whitespace-nowrap font-semibold">{deDe(c.assinaram, c.pessoas)}</Td>
            </tr>
          ))}
        </Tabela>
        {outras.length > 0 && (
          <p className="mt-2 text-[11px] text-ninho-cinza">
            Push “aberta” = a pessoa tocou na notificação (medido pelo app desde a 1.0.3). Sininho “lido” =
            abriu a notificação dentro do app.
          </p>
        )}
      </Secao>

      <Secao
        titulo="Assinaram quanto tempo depois de expirar o teste"
        sub={`Dos ${expiracao.totalAssinantes} assinantes, quando cada um pagou em relação ao fim do próprio teste. Hoje há ${expiracao.expiradosSemAssinar} contas com teste vencido sem assinar.`}
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <BarChart
            data={expiracao.faixas.map((f, i) => ({
              label: f.label,
              value: f.n,
              color: i === 0 ? '#9F86E0' : i >= 3 ? '#4CAF74' : '#7DB7F0',
            }))}
          />
          <div>
            <p className="mb-2 text-xs font-semibold text-ninho-grafite">
              Assinaram 3+ dias depois de expirar ({expiracao.depoisDe3Dias.length})
            </p>
            <Tabela headers={['Quem', 'Plano', 'Assinou', 'Dias após expirar', 'Recebeu antes (7d)']} vazio="Ninguém assinou 3+ dias depois de expirar.">
              {expiracao.depoisDe3Dias.map((p) => (
                <tr key={p.profileId}>
                  <Td>{p.nome ?? '—'}</Td>
                  <Td className="whitespace-nowrap">{produtoLabel(p.produto)}</Td>
                  <Td className="whitespace-nowrap">{formatDate(p.em)}</Td>
                  <Td>{p.diasDepois}</Td>
                  <Td className="text-xs">{p.recebeu.length ? p.recebeu.join(', ') : <span className="text-ninho-cinza">nenhuma campanha</span>}</Td>
                </tr>
              ))}
            </Tabela>
          </div>
        </div>
      </Secao>

      <Secao
        titulo="Régua automática do fim do teste"
        sub="Avisos que saem sozinhos antes do teste acabar. A push da régua não tem rastreio de abertura — o sininho e a compra sim. “Assinaram” = em até 7 dias depois do aviso."
      >
        <Tabela headers={['Aviso', 'Pessoas', 'Sininho lido', 'E-mails', 'Assinaram em 7 dias']} vazio="A régua ainda não disparou.">
          {trial.map((t) => (
            <tr key={t.kind}>
              <Td className="font-medium">{t.label}</Td>
              <Td>{t.pessoas}</Td>
              <Td className="whitespace-nowrap">{deDe(t.sininhoLidos, t.sininhoEnviados)}</Td>
              <Td>{t.emails}</Td>
              <Td className="whitespace-nowrap font-semibold">{deDe(t.assinaram7d, t.pessoas)}</Td>
            </tr>
          ))}
        </Tabela>
      </Secao>

      <Secao
        titulo="Assinaturas com oferta / código promocional"
        sub="Lido da própria transação da Apple: conta como oferta quando a Apple marca a oferta usada ou quando o preço pago ficou abaixo do preço de tabela."
      >
        <div className="mb-4 grid gap-4 sm:grid-cols-3">
          <StatCard label="Assinaram com oferta" value={ofertas.total} accent />
          <StatCard label="Planos anuais vendidos" value={ofertas.anuais} hint="Com ou sem oferta" compactHint />
          <StatCard
            label="Do total de assinantes"
            value={pct(ofertas.total, expiracao.totalAssinantes)}
            hint={`${ofertas.total} de ${expiracao.totalAssinantes}`}
            compactHint
          />
        </div>
        {ofertas.compras.length > 0 && (
          <Tabela headers={['Quem', 'Plano', 'Pagou', 'Tabela', 'Oferta', 'Quando']}>
            {ofertas.compras.map((o) => (
              <tr key={o.profileId}>
                <Td>{o.nome ?? '—'}</Td>
                <Td>{produtoLabel(o.produto)}</Td>
                <Td>R$ {o.preco.toFixed(2).replace('.', ',')}</Td>
                <Td className="text-ninho-cinza">R$ {o.precoTabela.toFixed(2).replace('.', ',')}</Td>
                <Td>{o.oferta}</Td>
                <Td>{formatDate(o.em)}</Td>
              </tr>
            ))}
          </Tabela>
        )}
      </Secao>

      <Secao
        titulo="Banner “convidar cuidador”"
        sub="Banner do 2º e 4º dia de uso. Os números do banner começam a contar quando a versão com ele (1.0.5) estiver instalada; o comparativo ao lado já usa o histórico inteiro."
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-ninho-borda bg-white p-5">
            <p className="mb-3 text-xs font-semibold text-ninho-grafite">Funil do banner</p>
            {cuidador.bannerVisto === 0 ? (
              <p className="text-sm text-ninho-cinza">
                Ninguém viu o banner ainda — ele só existe a partir da versão 1.0.5.
              </p>
            ) : (
              <>
                <Funil
                  etapas={[
                    { label: 'Viram o banner', n: cuidador.bannerVisto },
                    { label: 'Tocaram em convidar', n: cuidador.bannerConvidar },
                    { label: 'Enviaram convite', n: cuidador.convidaramDepoisBanner },
                    { label: 'Cuidador aceitou', n: cuidador.aceitosDepoisBanner },
                    { label: 'Assinaram', n: cuidador.assinaramDepoisBanner },
                  ]}
                />
                <p className="mt-3 text-[11px] text-ninho-cinza">
                  {cuidador.bannerAgoraNao} tocaram em “agora não”.
                </p>
              </>
            )}
          </div>
          <div className="rounded-2xl border border-ninho-borda bg-white p-5">
            <p className="mb-3 text-xs font-semibold text-ninho-grafite">
              Quem convida cuidador assina mais? (todo o histórico)
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Mini
                label="Convidaram cuidador"
                value={pct(h.convidaramAssinaram, h.convidaram)}
                hint={`${h.convidaramAssinaram} de ${h.convidaram} assinaram · ${h.convidaramAceito} com convite aceito`}
              />
              <Mini
                label="Não convidaram"
                value={pct(h.naoConvidaramAssinaram, h.naoConvidaram)}
                hint={`${h.naoConvidaramAssinaram} de ${h.naoConvidaram} assinaram`}
              />
            </div>
            <p className="mt-3 text-[11px] text-ninho-cinza">
              Base: quem já terminou o teste ou assinou (mesma base da taxa de conversão do KPI).
              Mostra correlação, não causa — quem convida já tende a ser quem mais usa.
            </p>
          </div>
        </div>
      </Secao>

      <p className="text-[11px] text-ninho-cinza">
        “Assinou” = primeira compra verificada da conta. A mesma assinatura da Apple restaurada em
        outra conta conta uma vez só. Gerado em {new Date(a.geradoEm).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}.
      </p>
    </>
  );
}
