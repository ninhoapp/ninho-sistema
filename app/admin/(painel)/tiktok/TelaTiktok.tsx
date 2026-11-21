import { quando } from '@/lib/instagram';
import {
  filaDoArquivo,
  type PostTiktok, type StatusTiktok, type ContaDiaTiktok, type OrigemTiktok, type Leitura,
} from '@/lib/tiktok';
import { PageHeader } from '@/components/admin/PageHeader';
import { StatCard } from '@/components/admin/StatCard';
import { Tabela, Td } from '@/components/admin/Tabela';
import { BotaoEnviar } from '@/components/admin/BotaoEnviar';
import { mudarStatus, salvarNumeros, salvarSeguidores } from './actions';

const STATUS: Record<StatusTiktok, { label: string; cor: string }> = {
  agendado: { label: 'Agendado', cor: 'bg-ninho-roxo-suave text-ninho-roxo-escuro' },
  publicado: { label: 'Publicado', cor: 'bg-green-100 text-green-800' },
  recusado: { label: 'Recusado', cor: 'bg-gray-100 text-gray-600' },
};

const FILTROS = {
  todos: { label: 'Todos', mostra: (_: PostTiktok) => true },
  agendado: { label: 'Agendados', mostra: (p: PostTiktok) => p.status === 'agendado' },
  publicado: { label: 'Publicados', mostra: (p: PostTiktok) => p.status === 'publicado' },
  recusado: { label: 'Recusados', mostra: (p: PostTiktok) => p.status === 'recusado' },
} as const;
type Filtro = keyof typeof FILTROS;

const botao = 'rounded-pill px-3 py-1.5 text-sm font-medium transition';
const campo = 'w-28 rounded-lg border border-ninho-borda px-2 py-1 text-sm';

const NUMEROS: [keyof PostTiktok, string][] = [
  ['visualizacoes', 'Visualizações'],
  ['curtidas', 'Curtidas'],
  ['comentarios', 'Comentários'],
  ['compartilhamentos', 'Compartilhamentos'],
  ['salvamentos', 'Salvamentos'],
  ['tempo_medio_s', 'Tempo médio (s)'],
  ['seguidores_ganhos', 'Seguidores ganhos'],
];

const fmt = (n: number | null | undefined) => (n == null ? '—' : n.toLocaleString('pt-BR'));

/** Dia de hoje no fuso de Brasília, para o campo de seguidores. */
function hojeBrasilia(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());
}

function SemDados({ texto }: { texto: string }) {
  return <p className="rounded-2xl border border-ninho-borda bg-white p-6 text-sm text-ninho-cinza">{texto}</p>;
}

/** A tela, separada da leitura do banco (dá para ver os estados vazios sem banco). */
export function TelaTiktok({ fila, conta, origem, status }: {
  fila: Leitura<PostTiktok[]>;
  conta: Leitura<ContaDiaTiktok[]>;
  origem: Leitura<OrigemTiktok>;
  status?: string;
}) {
  // Sem a 00196 a fila vem do arquivo (igual ao seed): só para ver, nada se grava.
  const doArquivo = !fila.ok;
  const todos = fila.ok ? fila.dados : filaDoArquivo();
  const filtro: Filtro = status && status in FILTROS ? (status as Filtro) : 'todos';
  const posts = todos.filter(FILTROS[filtro].mostra);
  const contagem = Object.fromEntries(
    (Object.keys(FILTROS) as Filtro[]).map((k) => [k, todos.filter(FILTROS[k].mostra).length]),
  ) as Record<Filtro, number>;

  const dias = conta.ok ? conta.dados : [];
  const hoje = dias[0];
  const semanaAtras = dias.find((c) => c.dia <= new Date(Date.now() - 7 * 86_400_000).toISOString().slice(0, 10));
  const ganho = hoje && semanaAtras ? hoje.seguidores - semanaAtras.seguidores : null;
  const proximo = todos.find((p) => p.status === 'agendado' && new Date(p.agendado_para).getTime() > Date.now());
  const comNumeros = todos.filter((p) => NUMEROS.some(([k]) => p[k] != null));

  return (
    <>
      <PageHeader
        title="TikTok"
        subtitle="Perfil @ninho.dirio.do.be. Os vídeos são agendados à mão no TikTok Studio; aqui fica a fila, os números que você lança e quem veio pelo link do TikTok. Horário de Brasília em destaque."
      />

      {doArquivo && (
        <p className="mb-6 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">
          <strong>Fila do arquivo, ainda não está no banco.</strong> A migration 00196 não foi aplicada: a lista abaixo é a fila aprovada
          (marketing/tiktok/fila-2026-11-22.html) e não dá para mudar status nem lançar números até aplicar.
        </p>
      )}

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Seguidores" value={hoje ? fmt(hoje.seguidores) : '—'} hint={hoje ? `Lançado em ${hoje.dia.split('-').reverse().join('/')}` : 'Nenhum dia lançado'} accent />
        <StatCard label="Ganho em 7 dias" value={ganho != null ? (ganho >= 0 ? `+${ganho}` : String(ganho)) : '—'} />
        <StatCard label="Publicados" value={`${contagem.publicado} de ${todos.length}`} />
        <StatCard
          label="Próximo vídeo"
          value={proximo ? `nº ${proximo.numero}` : '—'}
          hint={proximo ? `${quando(proximo.agendado_para, 'America/Sao_Paulo')} em Brasília` : 'Nada agendado pela frente'}
        />
      </div>

      {/* ── Origem ───────────────────────────────────────────────────── */}
      <section className="mb-8">
        <h2 className="mb-1 text-lg font-bold">Quem veio do TikTok (orgânico)</h2>
        <p className="mb-3 text-sm text-ninho-cinza">
          Pelo link da bio, useninho.com.br/landing?origem=tiktok. Desde o começo do rastreio.
        </p>
        {origem.ok ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Cliques em Baixar" value={fmt(origem.dados.cliques)} hint="Na /landing, vindos do TikTok" />
            <StatCard label="Instalações" value={fmt(origem.dados.instalacoes)} hint="Primeira abertura casada com o clique" />
            <StatCard label="Contas" value={fmt(origem.dados.pessoas)} hint="Contas novas com origem TikTok (orgânico)" />
            <StatCard label="Assinantes" value={fmt(origem.dados.assinantes)} hint="Básico ou Premium ativos hoje" accent />
          </div>
        ) : (
          <SemDados texto={`Sem dados ainda: o rastreio do link do TikTok começa quando a migration ${origem.falta} for aplicada.`} />
        )}
      </section>

      {/* ── Seguidores por dia ───────────────────────────────────────── */}
      <section className="mb-8">
        <h2 className="mb-3 text-lg font-bold">Seguidores por dia</h2>
        {conta.ok ? (
          <div className="grid gap-4 lg:grid-cols-[auto_1fr]">
            <form action={salvarSeguidores} className="flex flex-wrap items-end gap-2 self-start rounded-2xl border border-ninho-borda bg-white p-4">
              <label className="text-xs text-ninho-cinza">Dia
                <input type="date" name="dia" required defaultValue={hojeBrasilia()} className="mt-1 block rounded-lg border border-ninho-borda px-2 py-1 text-sm" />
              </label>
              <label className="text-xs text-ninho-cinza">Seguidores
                <input type="number" name="seguidores" required min={0} inputMode="numeric" className={`mt-1 block ${campo}`} />
              </label>
              <BotaoEnviar className={`${botao} bg-ninho-roxo text-white hover:bg-ninho-roxo-escuro`}>Salvar</BotaoEnviar>
            </form>
            <Tabela headers={['Dia', 'Seguidores', 'Diferença']} vazio="Nenhum dia lançado ainda.">
              {dias.length
                ? dias.slice(0, 14).map((d, i) => {
                    const ant = dias[i + 1];
                    const dif = ant ? d.seguidores - ant.seguidores : null;
                    return (
                      <tr key={d.dia}>
                        <Td>{d.dia.split('-').reverse().join('/')}</Td>
                        <Td>{fmt(d.seguidores)}</Td>
                        <Td>{dif == null ? '—' : dif >= 0 ? `+${dif}` : String(dif)}</Td>
                      </tr>
                    );
                  })
                : null}
            </Tabela>
          </div>
        ) : (
          <SemDados texto="Sem dados ainda: dá para lançar os seguidores do dia quando a migration 00196 for aplicada." />
        )}
      </section>

      {/* ── Fila ─────────────────────────────────────────────────────── */}
      <section className="mb-8">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold">Fila ({todos.length} vídeos)</h2>
          <nav className="flex flex-wrap gap-2">
            {(Object.keys(FILTROS) as Filtro[]).map((k) => (
              <a
                key={k}
                href={k === 'todos' ? '/admin/tiktok' : `/admin/tiktok?status=${k}`}
                className={`${botao} ${k === filtro ? 'bg-ninho-roxo text-white' : 'border border-ninho-borda bg-white hover:border-ninho-roxo'}`}
              >
                {FILTROS[k].label} <span className={k === filtro ? 'opacity-80' : 'text-ninho-cinza'}>({contagem[k]})</span>
              </a>
            ))}
          </nav>
        </div>
        <Tabela headers={['Nº', 'Dia e hora (Brasília)', 'Vídeo', 'Legenda do TikTok', 'Status']} vazio="Nada neste filtro.">
          {posts.length
            ? posts.map((p) => (
                <tr key={p.numero}>
                  <Td className="font-semibold">{String(p.numero).padStart(2, '0')}</Td>
                  <Td className="whitespace-nowrap">
                    <strong>{quando(p.agendado_para, 'America/Sao_Paulo')}</strong>
                    <span className="block text-xs text-ninho-cinza">{quando(p.agendado_para, 'Asia/Dubai')} em Dubai</span>
                  </Td>
                  <Td>
                    <span className="block font-medium">{p.nome}</span>
                    <a href={p.video_url} target="_blank" rel="noreferrer" className="text-xs font-medium text-ninho-roxo">Assistir</a>
                    {p.tiktok_url && (
                      <a href={p.tiktok_url} target="_blank" rel="noreferrer" className="ml-3 text-xs font-medium text-ninho-roxo">Ver no TikTok</a>
                    )}
                  </Td>
                  <Td><pre className="max-w-md whitespace-pre-wrap font-sans text-xs">{p.legenda}</pre></Td>
                  <Td>
                    <span className={`rounded-pill px-2.5 py-1 text-xs font-semibold ${STATUS[p.status].cor}`}>{STATUS[p.status].label}</span>
                    {p.id && (
                      <form action={mudarStatus} className="mt-2 flex items-center gap-1">
                        <input type="hidden" name="id" value={p.id} />
                        <select name="status" defaultValue={p.status} className="rounded-lg border border-ninho-borda px-1 py-1 text-xs">
                          <option value="agendado">Agendado</option>
                          <option value="publicado">Publicado</option>
                          <option value="recusado">Recusado</option>
                        </select>
                        <BotaoEnviar className="rounded-pill border border-ninho-borda px-2 py-1 text-xs hover:border-ninho-roxo">Mudar</BotaoEnviar>
                      </form>
                    )}
                  </Td>
                </tr>
              ))
            : null}
        </Tabela>
      </section>

      {/* ── Números por vídeo ────────────────────────────────────────── */}
      <section className="mb-8">
        <h2 className="mb-1 text-lg font-bold">Números por vídeo</h2>
        <p className="mb-3 text-sm text-ninho-cinza">Lançados à mão, do TikTok Studio. Abra o vídeo para lançar ou corrigir.</p>
        {doArquivo ? (
          <SemDados texto="Sem dados ainda: os números podem ser lançados quando a migration 00196 for aplicada." />
        ) : (
          <>
            <Tabela headers={['Nº', 'Vídeo', ...NUMEROS.map(([, l]) => l)]} vazio="Nenhum número lançado ainda.">
              {comNumeros.length
                ? comNumeros.map((p) => (
                    <tr key={p.numero}>
                      <Td className="font-semibold">{String(p.numero).padStart(2, '0')}</Td>
                      <Td>{p.nome}</Td>
                      {NUMEROS.map(([k]) => <Td key={k}>{fmt(p[k] as number | null)}</Td>)}
                    </tr>
                  ))
                : null}
            </Tabela>
            <div className="mt-4 space-y-2">
              {todos.filter((p) => p.id && p.status !== 'recusado').map((p) => (
                <details key={p.numero} className="rounded-2xl border border-ninho-borda bg-white p-3">
                  <summary className="cursor-pointer text-sm">
                    <strong>{String(p.numero).padStart(2, '0')}</strong> · {p.nome}
                    <span className="text-ninho-cinza"> · {quando(p.agendado_para, 'America/Sao_Paulo')}</span>
                    {p.numeros_em && <span className="text-ninho-cinza"> · lançado em {quando(p.numeros_em, 'Asia/Dubai')} (Dubai)</span>}
                  </summary>
                  <form action={salvarNumeros} className="mt-3 flex flex-wrap items-end gap-3">
                    <input type="hidden" name="id" value={p.id!} />
                    {NUMEROS.map(([k, l]) => (
                      <label key={k} className="text-xs text-ninho-cinza">{l}
                        <input
                          type="number" name={k} min={0} step={k === 'tempo_medio_s' ? '0.1' : '1'}
                          defaultValue={(p[k] as number | null) ?? ''} className={`mt-1 block ${campo}`}
                        />
                      </label>
                    ))}
                    <label className="text-xs text-ninho-cinza">Link no TikTok
                      <input type="url" name="tiktok_url" defaultValue={p.tiktok_url ?? ''} placeholder="https://www.tiktok.com/@ninho.dirio.do.be/video/..." className="mt-1 block w-72 rounded-lg border border-ninho-borda px-2 py-1 text-sm" />
                    </label>
                    <BotaoEnviar className={`${botao} bg-ninho-roxo text-white hover:bg-ninho-roxo-escuro`}>Salvar números</BotaoEnviar>
                  </form>
                </details>
              ))}
            </div>
          </>
        )}
      </section>
    </>
  );
}
