import { requireRole } from '@/lib/auth/guard';
import {
  fetchAprendizados,
  fetchPendencias,
  fetchResumoAtendimento,
  fetchCustoAtendimento,
  fetchResgates,
  fetchResumoResgate,
  NOME_CATEGORIA,
  NOME_MOTIVO,
  NOME_RESPOSTA_RAPIDA,
  NOME_TIPO_RESGATE,
  type Pendencia,
  type Resgate,
} from '@/lib/atendimento';
import { PageHeader } from '@/components/admin/PageHeader';
import { StatCard } from '@/components/admin/StatCard';
import { Notice } from '@/components/admin/Notice';
import { EnsinarForm, ResponderForm } from '@/components/admin/AtendimentoForms';
import { alternar, descartar, excluir, marcarVisto } from './actions';

export const dynamic = 'force-dynamic';

/** "18/10 22:14" no fuso de Dubai, como o resto do painel. */
function quando(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Dubai',
  });
}

/** "US$ 0,0213" — centavos de dólar precisam de 4 casas para não virar 0. */
function usd(valor: number): string {
  const casas = valor > 0 && valor < 1 ? 4 : 2;
  return `US$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas })}`;
}

/** Horas desde a abertura — o prazo prometido à pessoa é 48h. */
function idadeHoras(iso: string): number {
  return Math.floor((Date.now() - Date.parse(iso)) / 3_600_000);
}

const QUEM: Record<string, string> = { user: 'Pessoa', assistant: 'Nina', equipe: 'Equipe' };

function CartaoPendencia({ p }: { p: Pendencia }) {
  const horas = idadeHoras(p.created_at);
  const atrasada = horas >= 36;
  return (
    <div className="rounded-2xl border border-ninho-borda bg-white p-5">
      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-pill bg-ninho-roxo-suave px-2.5 py-1 font-semibold text-ninho-roxo-escuro">
          {NOME_CATEGORIA[p.categoria] ?? p.categoria}
        </span>
        <span className="text-ninho-cinza">{quando(p.created_at)}</span>
        <span className={`font-semibold ${atrasada ? 'text-red-600' : 'text-ninho-cinza'}`}>
          há {horas}h {atrasada ? '· prazo de 48h perto do fim' : ''}
        </span>
        {p.idioma === 'en' && <span className="rounded-pill bg-ninho-lavanda px-2 py-0.5 text-ninho-cinza">inglês</span>}
      </div>
      <p className="text-base font-semibold text-ninho-grafite">{p.resumo}</p>
      <p className="mt-1 text-xs text-ninho-cinza">
        {p.nome ?? 'Sem nome'} · {p.email ?? 'sem e-mail'}
      </p>

      {p.conversa.length > 0 && (
        <details className="mt-3 rounded-xl bg-ninho-nuvem p-3 text-sm">
          <summary className="cursor-pointer text-xs font-semibold text-ninho-cinza">Ver a conversa ({p.conversa.length} mensagens)</summary>
          <div className="mt-2 flex flex-col gap-2">
            {p.conversa.map((m, i) => (
              <p key={i} className="whitespace-pre-wrap text-ninho-grafite">
                <span className="font-semibold text-ninho-roxo-escuro">{QUEM[m.role] ?? m.role}:</span> {m.content}
              </p>
            ))}
          </div>
        </details>
      )}

      <div className="mt-4">
        {p.resposta && (
          <p className="mb-2 text-xs font-semibold text-ninho-roxo-escuro">A equipe já escreveu a resposta: toque em &quot;Ver resposta da Nina&quot;, revise e envie.</p>
        )}
        <ResponderForm pendenciaId={p.id} resumo={p.resumo} rascunho={p.resposta} />
      </div>
      <form action={descartar} className="mt-2">
        <input type="hidden" name="id" value={p.id} />
        <button type="submit" className="text-xs text-ninho-cinza hover:text-red-600 hover:underline">
          Descartar sem responder (spam, teste, já resolvido por e-mail)
        </button>
      </form>
    </div>
  );
}

function LinhaResgate({ r }: { r: Resgate }) {
  const novo = Boolean(r.motivo) && !r.visto_pelo_dono_em;
  const situacao = r.motivo ? (NOME_MOTIVO[r.motivo] ?? r.motivo) : r.respondeu_em ? 'Respondeu, sem motivo ainda' : 'Ainda não respondeu';
  return (
    <div className={`flex flex-wrap items-start gap-3 border-b border-ninho-borda p-4 text-sm last:border-b-0 ${novo ? 'bg-ninho-roxo-suave/40' : ''}`}>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-ninho-grafite">
          <span
            className={`mr-2 rounded-pill px-2 py-0.5 text-xs ${
              r.tipo === 'cartao_recusado' ? 'bg-red-100 text-red-700' : 'bg-ninho-nuvem text-ninho-cinza'
            }`}
          >
            {NOME_TIPO_RESGATE[r.tipo] ?? r.tipo}
          </span>
          {situacao}
          {r.converteu_em ? <span className="ml-2 rounded-pill bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800">assinou depois</span> : null}
          {r.codigo_oferecido ? <span className="ml-2 rounded-pill bg-ninho-lavanda px-2 py-0.5 text-xs text-ninho-roxo-escuro">recebeu o código</span> : null}
          {r.teste ? <span className="ml-2 rounded-pill bg-ninho-nuvem px-2 py-0.5 text-xs text-ninho-cinza">teste</span> : null}
        </p>
        {r.motivo_resumo && <p className="mt-1 whitespace-pre-wrap text-ninho-grafite">{r.motivo_resumo}</p>}
        <p className="mt-1 text-xs text-ninho-cinza">
          {r.nome ?? 'Sem nome'} · {r.email ?? 'sem e-mail'} · {r.registros} registros · app {r.app_version ?? '?'} · puxada em {quando(r.iniciado_em)}
          {r.resposta_rapida ? ` · tocou em "${NOME_RESPOSTA_RAPIDA[r.resposta_rapida] ?? r.resposta_rapida}"` : ''}
          {r.push_enviada_em ? ' · push enviada' : ''}
          {r.lembrete_em ? ` · lembrete em ${quando(r.lembrete_em)}` : ''}
        </p>
      </div>
      {novo && (
        <form action={marcarVisto}>
          <input type="hidden" name="id" value={r.id} />
          <button type="submit" className="shrink-0 text-xs font-semibold text-ninho-roxo hover:underline">
            Marcar como visto
          </button>
        </form>
      )}
    </div>
  );
}

export default async function AtendimentoPage() {
  requireRole('admin');

  let dados;
  try {
    const [abertas, respondidas, aprendizados, resumo, custoHoje, custo30] = await Promise.all([
      fetchPendencias(['aberta']),
      fetchPendencias(['respondida'], 15),
      fetchAprendizados(),
      fetchResumoAtendimento(),
      fetchCustoAtendimento(1),
      fetchCustoAtendimento(30),
    ]);
    // Resgate (migration 00097): sem a tabela, a seção só não aparece.
    const [resgates, resumoResgate] = await Promise.all([fetchResgates(), fetchResumoResgate()]);
    dados = { abertas, respondidas, aprendizados, resumo, custoHoje, custo30, resgates, resumoResgate };
  } catch (e) {
    return (
      <>
        <PageHeader title="Atendimento no app" subtitle="Perguntas que a Nina passou para a equipe." />
        <Notice tone="warn">
          Não consegui ler as tabelas do atendimento. A migration <code>00085_atendimento.sql</code> já foi aplicada?
          <span className="mt-1 block text-xs">{e instanceof Error ? e.message : String(e)}</span>
        </Notice>
      </>
    );
  }

  const { abertas, respondidas, aprendizados, resumo, custoHoje, custo30, resgates, resumoResgate } = dados;
  return (
    <>
      <PageHeader
        title="Atendimento no app"
        subtitle="A Nina responde as dúvidas no app. O que ela não sabe chega aqui; a sua resposta vai para a pessoa no app (com notificação) e, se quiser, a Nina aprende."
      />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Esperando você" value={resumo.abertas} />
        <StatCard label="Pessoas que falaram hoje" value={resumo.conversasHoje} />
        <StatCard label="Mensagens hoje" value={resumo.mensagensHoje} />
        <StatCard label="Respondidas em 7 dias" value={resumo.respondidas7d} />
      </div>

      {/* Custo REAL: tokens gravados em cada resposta × preço de tabela. */}
      <div className="mb-8 grid grid-cols-1 gap-3 md:grid-cols-3">
        <StatCard label="Custo da Nina hoje" value={usd(custoHoje.usd)} hint={`${custoHoje.respostas} respostas`} />
        <StatCard
          label="Custo da Nina em 30 dias"
          value={usd(custo30.usd)}
          hint={`${custo30.respostas} respostas para ${custo30.pessoas} pessoas`}
        />
        <StatCard
          label="Média por resposta"
          value={custo30.usdPorResposta === null ? '—' : usd(custo30.usdPorResposta)}
          hint="Preço de tabela da Anthropic, em dólar (o cartão é cobrado em dólar)"
        />
      </div>

      <section className="mb-10">
        <h2 className="mb-3 text-lg font-bold text-ninho-grafite">Esperando resposta ({abertas.length})</h2>
        {abertas.length === 0 ? (
          <p className="rounded-2xl border border-ninho-borda bg-white p-5 text-sm text-ninho-cinza">Nenhuma pergunta esperando. A Nina deu conta de tudo.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {abertas.map((p) => (
              <CartaoPendencia key={p.id} p={p} />
            ))}
          </div>
        )}
      </section>

      {resumoResgate.ativo !== null && (
        <section id="resgates" className="mb-10">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-bold text-ninho-grafite">Conversas que a Nina puxou</h2>
            <span
              className={`rounded-pill px-2.5 py-1 text-xs font-semibold ${
                resumoResgate.ativo ? 'bg-emerald-100 text-emerald-800' : 'bg-ninho-nuvem text-ninho-cinza'
              }`}
            >
              Não assinou: {resumoResgate.ativo ? 'ligado' : 'desligado'}
            </span>
            {resumoResgate.cartaoAtivo !== null && (
              <span
                className={`rounded-pill px-2.5 py-1 text-xs font-semibold ${
                  resumoResgate.cartaoAtivo ? 'bg-emerald-100 text-emerald-800' : 'bg-ninho-nuvem text-ninho-cinza'
                }`}
              >
                Cartão recusado: {resumoResgate.cartaoAtivo ? 'ligado' : 'desligado'}
              </span>
            )}
          </div>
          <p className="mb-3 text-sm text-ninho-cinza">
            A Nina manda uma mensagem para quem terminou o teste, usou bastante e não assinou (uma vez só, sem push) e para quem teve o cartão recusado pela loja (com push e um lembrete). O motivo que a pessoa contou, por botão ou por escrito, aparece aqui e no topo do painel até você marcar como visto.
          </p>
          <div className="mb-3 grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard label="Não assinou: conversas" value={resumoResgate.porTipo.nao_assinou.iniciados} />
            <StatCard label="Responderam" value={resumoResgate.porTipo.nao_assinou.responderam} />
            <StatCard label="Receberam o código" value={resumoResgate.codigos} />
            <StatCard label="Assinaram depois" value={resumoResgate.porTipo.nao_assinou.converteram} hint="Até 60 dias depois da mensagem" />
          </div>
          {resumoResgate.cartaoAtivo !== null && (
            <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
              <StatCard label="Cartão recusado: avisos" value={resumoResgate.porTipo.cartao_recusado.iniciados} />
              <StatCard label="Push enviada" value={resumoResgate.porTipo.cartao_recusado.pushes} />
              <StatCard label="Responderam" value={resumoResgate.porTipo.cartao_recusado.responderam} />
              <StatCard label="Cobrança passou depois" value={resumoResgate.porTipo.cartao_recusado.converteram} hint="Até 60 dias depois do aviso" />
            </div>
          )}
          {Object.keys(resumoResgate.porMotivo).length > 0 && (
            <p className="mb-3 text-sm text-ninho-grafite">
              {Object.entries(resumoResgate.porMotivo)
                .sort((a, b) => b[1] - a[1])
                .map(([m, n]) => `${NOME_MOTIVO[m] ?? m}: ${n}`)
                .join(' · ')}
            </p>
          )}
          {resgates.some((r) => r.motivo && !r.visto_pelo_dono_em) && (
            <form action={marcarVisto} className="mb-3">
              <button type="submit" className="text-xs font-semibold text-ninho-roxo hover:underline">
                Marcar todos como vistos
              </button>
            </form>
          )}
          {resgates.length === 0 ? (
            <p className="rounded-2xl border border-ninho-borda bg-white p-5 text-sm text-ninho-cinza">Nenhuma conversa puxada ainda.</p>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-ninho-borda bg-white">
              {resgates.map((r) => (
                <LinhaResgate key={r.id} r={r} />
              ))}
            </div>
          )}
        </section>
      )}

      <section className="mb-10">
        <h2 className="mb-1 text-lg font-bold text-ninho-grafite">O que a Nina aprendeu ({aprendizados.filter((a) => a.ativo).length} ativos)</h2>
        <p className="mb-3 text-sm text-ninho-cinza">Entra em toda conversa. Desligue o que ficou velho (ex.: uma oferta que acabou).</p>
        <div className="mb-4 rounded-2xl border border-ninho-borda bg-white p-5">
          <p className="mb-3 text-sm font-semibold text-ninho-grafite">Ensinar algo novo</p>
          <EnsinarForm />
        </div>
        {aprendizados.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-ninho-borda bg-white">
            {aprendizados.map((a) => (
              <div key={a.id} className={`flex flex-wrap items-start gap-3 border-b border-ninho-borda p-4 last:border-b-0 ${a.ativo ? '' : 'opacity-50'}`}>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ninho-grafite">{a.pergunta}</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-ninho-cinza">{a.resposta}</p>
                  <p className="mt-1 text-xs text-ninho-cinza">{quando(a.created_at)}</p>
                </div>
                <div className="flex shrink-0 gap-3 text-xs">
                  <form action={alternar}>
                    <input type="hidden" name="id" value={a.id} />
                    <input type="hidden" name="ativo" value={a.ativo ? 'false' : 'true'} />
                    <button type="submit" className="font-semibold text-ninho-roxo hover:underline">
                      {a.ativo ? 'Desligar' : 'Ligar'}
                    </button>
                  </form>
                  <form action={excluir}>
                    <input type="hidden" name="id" value={a.id} />
                    <button type="submit" className="text-ninho-cinza hover:text-red-600 hover:underline">
                      Excluir
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {respondidas.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-bold text-ninho-grafite">Respondidas recentemente</h2>
          <div className="overflow-hidden rounded-2xl border border-ninho-borda bg-white">
            {respondidas.map((p) => (
              <div key={p.id} className="border-b border-ninho-borda p-4 text-sm last:border-b-0">
                <p className="font-semibold text-ninho-grafite">{p.resumo}</p>
                <p className="mt-1 whitespace-pre-wrap text-ninho-cinza">Você: {p.resposta}</p>
                <p className="mt-1 text-xs text-ninho-cinza">
                  {p.nome ?? 'Sem nome'} · respondida em {quando(p.respondida_em)}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
