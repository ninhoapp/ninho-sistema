import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth/guard';
import {
  SETORES, estadosPorPessoa, lerAtividade, lerAprovacoesAbertas, type Aprovacao, type Atividade,
} from '@/lib/empresa';
import { PageHeader } from '@/components/admin/PageHeader';
import { Notice } from '@/components/admin/Notice';
import { andarDe, COR_SETOR } from '@/lib/empresa/menu';

export const dynamic = 'force-dynamic';

/** A página de um setor: a equipe e o estado de cada um, o que fizeram em 30 dias e o mural do setor. As abas do setor ficam na faixa do topo (SetorTabs). */
export default async function SetorPage({ params }: { params: { setor: string } }) {
  requireRole('admin');
  const setor = SETORES.find((s) => s.id === params.setor);
  if (!setor) notFound();

  let atividade: Atividade[] = [];
  let aprovacoes: Aprovacao[] = [];
  let erro: string | null = null;
  try {
    [atividade, aprovacoes] = await Promise.all([lerAtividade(30), lerAprovacoesAbertas()]);
  } catch (e) {
    erro = e instanceof Error ? e.message : String(e);
  }
  const estados = estadosPorPessoa(atividade, aprovacoes);
  const nomes = Object.fromEntries(setor.pessoas.map((p) => [p.id, p.nome]));
  const recentes = atividade.filter((a) => a.setor === setor.id).slice(0, 30);
  const mural = aprovacoes.filter((a) => a.setor === setor.id);
  const fmt = (iso: string) =>
    new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Dubai' });

  return (
    <>
      <Link href="/admin/empresa" className="mb-3 inline-block text-sm font-medium text-ninho-roxo-escuro hover:underline">
        ‹ Voltar ao prédio
      </Link>
      <PageHeader
        title={setor.nome}
        subtitle={`${andarDe(setor.id)}${setor.desativado ? ' · desativado' : ''}. Quem trabalha aqui, o que fizeram nos últimos 30 dias e o que espera você.`}
      />
      {erro && <Notice tone="warn">Não consegui ler a atividade: {erro}</Notice>}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {setor.pessoas.map((p) => {
          const e = estados[p.id];
          const st = setor.desativado ? 'desativado' : e?.estado ?? 'livre';
          const tag = st === 'trabalhando' ? 'bg-green-50 text-green-700' : st === 'esperando' ? 'bg-amber-50 text-amber-800' : 'bg-ninho-nuvem text-ninho-cinza';
          return (
            <div key={p.id} className="flex flex-col gap-2 rounded-2xl border border-ninho-borda bg-white p-4">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-full font-bold text-white" style={{ background: COR_SETOR[setor.id] }}>{p.nome[0]}</div>
                <div className="min-w-0">
                  <p className="font-semibold">{p.nome}</p>
                  <p className="truncate text-xs text-ninho-cinza">{p.cargo}</p>
                </div>
                <span className={`ml-auto shrink-0 rounded-pill px-2.5 py-1 text-xs font-semibold ${tag}`}>
                  {st === 'trabalhando' ? 'Trabalhando' : st === 'esperando' ? 'Esperando seu OK' : st === 'desativado' ? 'Desativado' : 'Livre'}
                </span>
              </div>
              <p className="text-sm text-ninho-grafite">{e?.agora ?? <span className="text-ninho-cinza">Nada registrado ainda.</span>}</p>
            </div>
          );
        })}
      </section>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section className="rounded-2xl border border-ninho-borda bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold">Atividade recente</h2>
          {recentes.length === 0 ? (
            <p className="text-sm text-ninho-cinza">Ninguém deste setor trabalhou nos últimos 30 dias.</p>
          ) : (
            <ul className="flex flex-col gap-2 text-sm">
              {recentes.map((a) => (
                <li key={a.id} className="grid grid-cols-[96px_1fr] gap-3 border-b border-ninho-borda pb-2 last:border-0">
                  <time className="tabular-nums text-ninho-cinza">{fmt(a.inicio)}</time>
                  <span>
                    <b>{nomes[a.funcionario] ?? a.funcionario}</b>: {a.tarefa ?? '(sem descrição)'}
                    {a.status === 'erro' ? ' (erro)' : a.status === 'trabalhando' ? ' (em andamento)' : ''}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="flex flex-col gap-4">
          <section className="rounded-2xl border border-ninho-borda bg-white p-4">
            <h2 className="mb-3 text-sm font-semibold">Esperando você</h2>
            {mural.length === 0 ? (
              <p className="text-sm text-ninho-cinza">Nada deste setor esperando aprovação.</p>
            ) : (
              <ul className="flex flex-col gap-2 text-sm">
                {mural.map((m) => <li key={m.id}>{m.titulo}</li>)}
              </ul>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
