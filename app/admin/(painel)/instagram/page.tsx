import { requireRole } from '@/lib/auth/guard';
import { listarPosts, listarConta, quando, melhoresHoras, type PostInstagram, type StatusPost } from '@/lib/instagram';
import { PageHeader } from '@/components/admin/PageHeader';
import { StatCard } from '@/components/admin/StatCard';
import { aprovarPost, aprovarSemana, pedirAjuste, recusarPost, mudarHorario } from './actions';

export const dynamic = 'force-dynamic';

const STATUS: Record<StatusPost, { label: string; cor: string }> = {
  rascunho: { label: 'Esperando seu OK', cor: 'bg-amber-100 text-amber-800' },
  aprovado: { label: 'Aprovado · sai sozinho', cor: 'bg-ninho-roxo-suave text-ninho-roxo-escuro' },
  publicando: { label: 'Publicando', cor: 'bg-ninho-roxo-suave text-ninho-roxo-escuro' },
  publicado: { label: 'Publicado', cor: 'bg-green-100 text-green-800' },
  erro: { label: 'Erro', cor: 'bg-red-100 text-red-700' },
  recusado: { label: 'Recusado', cor: 'bg-gray-100 text-gray-600' },
};

const botao = 'rounded-pill px-3 py-1.5 text-sm font-medium transition';

/** "2026-10-26T14:30" em Dubai (o relógio do dono), para o campo de horário. */
function valorHorario(iso: string): string {
  const d = new Date(new Date(iso).getTime() + 4 * 3_600_000);
  return d.toISOString().slice(0, 16);
}

function Numeros({ m }: { m: PostInstagram['metricas'] }) {
  if (!m) return <p className="text-xs text-ninho-cinza">Números chegam no dia seguinte.</p>;
  const itens: [string, number | undefined][] = [
    ['alcance', m.reach], ['salvamentos', m.saved], ['compartilhamentos', m.shares],
    ['curtidas', m.likes], ['comentários', m.comments], ['seguidores', m.follows],
  ];
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ninho-cinza">
      {itens.map(([k, v]) => (
        <span key={k}><strong className="text-ninho-grafite">{v ?? '—'}</strong> {k}</span>
      ))}
    </div>
  );
}

/** Rascunho com o horário já vencido: não saiu porque ninguém aprovou. */
function atrasado(p: PostInstagram): boolean {
  return p.status === 'rascunho' && new Date(p.agendado_para).getTime() < Date.now();
}

function CardPost({ p }: { p: PostInstagram }) {
  const s = STATUS[p.status];
  const editavel = ['rascunho', 'aprovado', 'erro', 'recusado'].includes(p.status);
  return (
    <article className={`rounded-2xl border bg-white p-4 ${atrasado(p) ? 'border-red-300' : 'border-ninho-borda'}`}>
      {atrasado(p) && (
        <p className="mb-3 rounded-lg bg-red-50 p-2 text-sm text-red-700">
          <strong>O horário passou e o post não saiu</strong> porque não estava aprovado. Mude o horário e aprove, ou aprove como está para sair em até 10 minutos.
        </p>
      )}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm">
          <strong>{quando(p.agendado_para, 'Asia/Dubai')}</strong> em Dubai
          <span className="text-ninho-cinza"> · {quando(p.agendado_para, 'America/Sao_Paulo')} no Brasil</span>
        </div>
        <span className={`rounded-pill px-2.5 py-1 text-xs font-semibold ${s.cor}`}>{s.label}</span>
      </div>

      <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
        {p.imagens.map((src, i) => (
          <a key={src} href={src} target="_blank" rel="noreferrer" className="shrink-0">
            <img src={src} alt={`slide ${i + 1}`} className="h-44 w-[141px] rounded-lg border border-ninho-borda object-cover" />
          </a>
        ))}
      </div>

      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ninho-cinza">
        {p.formato} · {p.objetivo ?? '—'}{p.vende ? ' · vende' : ''}
      </p>
      <pre className="mb-3 whitespace-pre-wrap font-sans text-sm text-ninho-grafite">{p.legenda}</pre>

      {p.ajuste && <p className="mb-3 rounded-lg bg-amber-50 p-2 text-sm"><strong>Ajuste pedido:</strong> {p.ajuste}</p>}
      {p.erro && <p className="mb-3 rounded-lg bg-red-50 p-2 text-sm text-red-700">{p.erro}</p>}

      {p.status === 'publicado' && (
        <div className="mb-2 space-y-2">
          <Numeros m={p.metricas} />
          {p.permalink && <a href={p.permalink} target="_blank" rel="noreferrer" className="text-sm font-medium text-ninho-roxo">Ver no Instagram</a>}
          {(p.metricas?.comentarios_saude?.length ?? 0) > 0 && (
            <div className="rounded-lg bg-red-50 p-2 text-sm">
              <strong>Comentários sobre saúde</strong> (responda com: &quot;Isso é com o pediatra. Posso te ajudar a anotar o que observou para levar na consulta.&quot; Se for urgente: SAMU 192.)
              <ul className="mt-1 list-disc pl-5">
                {p.metricas!.comentarios_saude!.map((c) => <li key={c.id}>{c.texto}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      {editavel && (
        <div className="flex flex-wrap items-start gap-2">
          {p.status !== 'aprovado' && (
            <form action={aprovarPost}>
              <input type="hidden" name="id" value={p.id} />
              <button className={`${botao} bg-ninho-roxo text-white hover:bg-ninho-roxo-escuro`}>Aprovar</button>
            </form>
          )}
          <form action={mudarHorario} className="flex items-center gap-1">
            <input type="hidden" name="id" value={p.id} />
            <input type="datetime-local" name="quando" defaultValue={valorHorario(p.agendado_para)}
              className="rounded-lg border border-ninho-borda px-2 py-1 text-sm" />
            <button className={`${botao} border border-ninho-borda hover:border-ninho-roxo`}>Mudar horário</button>
          </form>
          <details className="w-full">
            <summary className="cursor-pointer text-sm text-ninho-cinza">Pedir ajuste ou recusar</summary>
            <form action={pedirAjuste} className="mt-2 flex flex-col gap-2">
              <input type="hidden" name="id" value={p.id} />
              <textarea name="ajuste" rows={2} placeholder="O que mudar?" className="rounded-lg border border-ninho-borda p-2 text-sm" />
              <button className={`${botao} self-start border border-ninho-borda hover:border-ninho-roxo`}>Pedir ajuste</button>
            </form>
            <form action={recusarPost} className="mt-2">
              <input type="hidden" name="id" value={p.id} />
              <button className={`${botao} text-red-600 hover:bg-red-50`}>Recusar este post</button>
            </form>
          </details>
        </div>
      )}
    </article>
  );
}

export default async function InstagramPage() {
  requireRole('admin');
  const [posts, conta] = await Promise.all([listarPosts(), listarConta()]);

  const hoje = conta[0];
  const semanaAtras = conta.find((c) => c.dia <= new Date(Date.now() - 7 * 86_400_000).toISOString().slice(0, 10));
  const ganho = hoje?.seguidores != null && semanaAtras?.seguidores != null ? hoje.seguidores - semanaAtras.seguidores : null;
  const horas = melhoresHoras(conta.find((c) => c.online_por_hora)?.online_por_hora ?? null);
  const esperando = posts.filter((p) => p.status === 'rascunho');

  // Atrasados no topo e nunca escondidos; depois, as semanas da mais próxima para a mais distante.
  const atrasados = posts.filter(atrasado);
  const proximo = posts.find((p) => p.status === 'aprovado');
  const semanas = [...new Set(posts.filter((p) => !atrasado(p)).map((p) => p.semana))].sort();

  return (
    <>
      <PageHeader
        title="Instagram"
        subtitle="Aprove cada post: aprovado, ele sai sozinho no horário marcado (hora de Dubai em destaque; o público está no Brasil, 7h antes). Mudou legenda ou imagem depois do OK, volta para aprovação."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Seguidores" value={hoje?.seguidores != null ? String(hoje.seguidores) : '—'} hint="Meta: 200" accent />
        <StatCard label="Ganho em 7 dias" value={ganho != null ? (ganho >= 0 ? `+${ganho}` : String(ganho)) : '—'} />
        <StatCard label="Esperando seu OK" value={String(esperando.length)} />
        <StatCard label="Seguidores mais online" value={horas.length ? horas.join(' · ') : '—'} hint="Horário de Dubai" />
      </div>

      {posts.length === 0 && (
        <p className="rounded-2xl bg-white p-6 text-sm text-ninho-cinza">Nenhum post ainda. A Lívia sobe a semana com marketing/instagram/gerador/subir.py.</p>
      )}

      <p className={`mb-6 rounded-2xl p-4 text-sm ${proximo ? 'bg-green-50 text-green-800' : 'bg-amber-50 text-amber-900'}`}>
        {proximo
          ? <>Próximo post que sai sozinho: <strong>{quando(proximo.agendado_para, 'Asia/Dubai')} em Dubai</strong>.</>
          : <><strong>Nenhum post aprovado.</strong> Nada vai sair até você aprovar.</>}
      </p>

      {atrasados.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-lg font-bold text-red-700">Horário passou sem aprovação ({atrasados.length})</h2>
          <div className="grid gap-4 lg:grid-cols-2">
            {atrasados.map((p) => <CardPost key={p.id} p={p} />)}
          </div>
        </section>
      )}

      {semanas.map((semana) => {
        const daSemana = posts.filter((p) => p.semana === semana && !atrasado(p));
        const rascunhos = daSemana.filter((p) => p.status === 'rascunho').length;
        return (
          <section key={semana} className="mb-8">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-bold">Semana de {semana.split('-').reverse().slice(0, 2).join('/')}</h2>
              {rascunhos > 0 && (
                <form action={aprovarSemana}>
                  <input type="hidden" name="semana" value={semana} />
                  <button className={`${botao} bg-ninho-roxo text-white hover:bg-ninho-roxo-escuro`}>
                    Aprovar os {rascunhos} que faltam
                  </button>
                </form>
              )}
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              {daSemana.map((p) => <CardPost key={p.id} p={p} />)}
            </div>
          </section>
        );
      })}
    </>
  );
}
