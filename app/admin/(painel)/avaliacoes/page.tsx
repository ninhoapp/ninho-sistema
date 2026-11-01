import { requireRole } from '@/lib/auth/guard';
import { fetchAvaliacoes, fetchResumoAvaliacoes, type AvaliacaoLoja } from '@/lib/avaliacoes';
import { PageHeader } from '@/components/admin/PageHeader';
import { StatCard } from '@/components/admin/StatCard';
import { Notice } from '@/components/admin/Notice';
import { AprovarAvaliacaoForm } from '@/components/admin/AvaliacoesForms';
import { ignorar } from './actions';

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

const LOJA: Record<string, string> = { apple: 'App Store', google: 'Google Play' };

function Estrelas({ nota }: { nota: number }) {
  const cor = nota <= 2 ? 'text-red-600' : nota === 3 ? 'text-amber-600' : 'text-ninho-roxo';
  return (
    <span className={`font-semibold ${cor}`} aria-label={`${nota} de 5 estrelas`}>
      {'★'.repeat(nota)}
      <span className="text-ninho-borda">{'★'.repeat(5 - nota)}</span>
    </span>
  );
}

function Cabecalho({ a }: { a: AvaliacaoLoja }) {
  return (
    <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
      <span className="rounded-pill bg-ninho-roxo-suave px-2.5 py-1 font-semibold text-ninho-roxo-escuro">{LOJA[a.loja]}</span>
      <Estrelas nota={a.nota} />
      <span className="text-ninho-cinza">{quando(a.escrita_em)}</span>
      {a.autor && <span className="text-ninho-cinza">· {a.autor}</span>}
      {a.versao_app && <span className="text-ninho-cinza">· versão {a.versao_app}</span>}
      {a.idioma === 'en' && <span className="rounded-pill bg-ninho-lavanda px-2 py-0.5 text-ninho-cinza">inglês</span>}
    </div>
  );
}

function CartaoEsperando({ a }: { a: AvaliacaoLoja }) {
  return (
    <div className="rounded-2xl border border-ninho-borda bg-white p-5">
      <Cabecalho a={a} />
      {a.titulo && <p className="text-base font-semibold text-ninho-grafite">{a.titulo}</p>}
      <p className="mt-1 whitespace-pre-wrap text-sm text-ninho-grafite">{a.texto ?? '(sem texto)'}</p>
      {a.status === 'erro' && a.erro && (
        <div className="mt-3 rounded-2xl bg-red-50 p-3 text-xs text-red-600">A última tentativa de publicar falhou: {a.erro}</div>
      )}
      <div className="mt-4">
        {a.rascunho || a.status === 'erro' ? (
          <AprovarAvaliacaoForm id={a.id} rascunho={a.rascunho ?? ''} />
        ) : (
          <p className="rounded-2xl bg-ninho-nuvem p-3 text-sm text-ninho-cinza">O rascunho da resposta sai na próxima rodada (de hora em hora).</p>
        )}
      </div>
      <form action={ignorar} className="mt-2">
        <input type="hidden" name="id" value={a.id} />
        <button type="submit" className="text-xs text-ninho-cinza hover:text-red-600 hover:underline">
          Não responder esta avaliação
        </button>
      </form>
    </div>
  );
}

export default async function AvaliacoesPage() {
  requireRole('admin');

  let dados;
  try {
    const [esperando, enviadas, resumo] = await Promise.all([
      fetchAvaliacoes(['nova', 'rascunho', 'erro']),
      fetchAvaliacoes(['enviada'], 20),
      fetchResumoAvaliacoes(),
    ]);
    dados = { esperando, enviadas, resumo };
  } catch (e) {
    return (
      <>
        <PageHeader title="Avaliações das lojas" subtitle="Respostas às avaliações da App Store e do Google Play." />
        <Notice tone="warn">
          Não consegui ler as avaliações. A migration <code>00091_avaliacoes_lojas.sql</code> já foi aplicada?
          <span className="mt-1 block text-xs">{e instanceof Error ? e.message : String(e)}</span>
        </Notice>
      </>
    );
  }

  const { esperando, enviadas, resumo } = dados;
  // As piores primeiro: 1 e 2 estrelas têm prazo de 2 dias (manual do Atendimento).
  const fila = [...esperando].sort((x, y) => x.nota - y.nota || Date.parse(y.escrita_em) - Date.parse(x.escrita_em));

  return (
    <>
      <PageHeader
        title="Avaliações das lojas"
        subtitle="As avaliações novas da App Store e do Google Play chegam aqui de hora em hora, já com um rascunho de resposta. Edite se quiser e aprove: a resposta é publicada na loja na hora."
      />

      <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Esperando você" value={resumo.esperando} />
        <StatCard label="Avaliações em 30 dias" value={resumo.total30} />
        <StatCard label="Nota média em 30 dias" value={resumo.notaMedia30 === null ? '—' : resumo.notaMedia30.toFixed(1).replace('.', ',')} />
        <StatCard label="Respondidas em 30 dias" value={resumo.enviadas30} />
      </div>

      <section className="mb-10">
        <h2 className="mb-3 text-lg font-bold text-ninho-grafite">Esperando resposta ({fila.length})</h2>
        {fila.length === 0 ? (
          <p className="rounded-2xl border border-ninho-borda bg-white p-5 text-sm text-ninho-cinza">Nenhuma avaliação esperando resposta.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {fila.map((a) => (
              <CartaoEsperando key={a.id} a={a} />
            ))}
          </div>
        )}
      </section>

      {enviadas.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-bold text-ninho-grafite">Respondidas</h2>
          <div className="overflow-hidden rounded-2xl border border-ninho-borda bg-white">
            {enviadas.map((a) => (
              <div key={a.id} className="border-b border-ninho-borda p-4 text-sm last:border-b-0">
                <Cabecalho a={a} />
                <p className="text-ninho-grafite">{a.titulo ? <strong>{a.titulo}. </strong> : null}{a.texto}</p>
                <p className="mt-2 whitespace-pre-wrap rounded-xl bg-ninho-nuvem p-3 text-ninho-cinza">{a.resposta_enviada}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
