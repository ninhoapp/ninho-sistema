import { requireRole } from '@/lib/auth/guard';
import {
  fetchAprendizados,
  fetchPendencias,
  fetchResumoAtendimento,
  fetchCustoAtendimento,
  NOME_CATEGORIA,
  type Pendencia,
} from '@/lib/atendimento';
import { PageHeader } from '@/components/admin/PageHeader';
import { StatCard } from '@/components/admin/StatCard';
import { Notice } from '@/components/admin/Notice';
import { EnsinarForm, ResponderForm } from '@/components/admin/AtendimentoForms';
import { alternar, descartar, excluir } from './actions';

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
        <ResponderForm pendenciaId={p.id} resumo={p.resumo} />
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
    dados = { abertas, respondidas, aprendizados, resumo, custoHoje, custo30 };
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

  const { abertas, respondidas, aprendizados, resumo, custoHoje, custo30 } = dados;
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
