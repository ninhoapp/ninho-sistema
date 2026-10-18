import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth/guard';
import {
  ABA_HREF, SETORES, estadosPorPessoa, lerAtividade, lerAprovacoesAbertas, type Aprovacao, type Atividade,
} from '@/lib/empresa';
import { PageHeader } from '@/components/admin/PageHeader';
import { Notice } from '@/components/admin/Notice';
import { Predio } from '@/components/admin/Predio';

export const dynamic = 'force-dynamic';

/** Um andar do prédio: a planta do setor, a atividade recente e as abas do painel que são dele. */
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
        subtitle={`${setor.andar} andar${setor.desativado ? ' · desativado' : ''}. A planta do setor, o que fizeram nos últimos 30 dias e as abas do painel que pertencem a ele.`}
      />
      {erro && <Notice tone="warn">Não consegui ler a atividade: {erro}</Notice>}

      <Predio setores={SETORES} estados={estados} inicial={setor.id} comTorre={false} />

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
            <h2 className="mb-3 text-sm font-semibold">Abas deste setor</h2>
            {setor.abas.length === 0 ? (
              <p className="text-sm text-ninho-cinza">Este setor ainda não tem aba no painel.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {setor.abas.map((aba) =>
                  ABA_HREF[aba] ? (
                    <Link key={aba} href={ABA_HREF[aba]} className="rounded-pill bg-ninho-roxo-suave px-3 py-1.5 text-sm font-medium text-ninho-roxo-escuro hover:bg-ninho-roxo hover:text-white">
                      {aba}
                    </Link>
                  ) : (
                    <span key={aba} className="rounded-pill bg-ninho-nuvem px-3 py-1.5 text-sm text-ninho-cinza">{aba}</span>
                  ),
                )}
              </div>
            )}
          </section>
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
