import { requireRole } from '@/lib/auth/guard';
import {
  fetchConversasDosResgates,
  fetchResgatesFiltrados,
  NOME_MOTIVO,
  NOME_RESPOSTA_RAPIDA,
  NOME_TIPO_RESGATE,
  NOME_VOLTARIA,
  type FiltroResgates,
  type MensagemConversa,
  type Resgate,
  type TipoResgate,
} from '@/lib/atendimento';
import { PageHeader } from '@/components/admin/PageHeader';
import { StatCard } from '@/components/admin/StatCard';
import { ExportExcelButton } from '@/components/admin/ExportExcelButton';
import { investigar } from '../actions';

export const dynamic = 'force-dynamic';

/**
 * Tudo o que a Nina coletou de quem não assinou ou teve o cartão recusado
 * (pedido do dono, 11/11/2026): filtrar por motivo, por "voltaria se
 * corrigisse" e marcar o que precisa ser investigado, com nota.
 */

type Params = {
  tipo?: string;
  motivo?: string;
  voltaria?: string;
  situacao?: string;
  investigar?: string;
  dias?: string;
  busca?: string;
  testes?: string;
};

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

const QUEM: Record<string, string> = { user: 'Pessoa', assistant: 'Nina', equipe: 'Equipe' };

const SELECT = 'rounded-xl border border-ninho-borda bg-white px-3 py-2 text-sm text-ninho-grafite';

function lerFiltro(p: Params): FiltroResgates {
  const dias = Number(p.dias ?? '0');
  return {
    tipo: p.tipo === 'nao_assinou' || p.tipo === 'cartao_recusado' ? (p.tipo as TipoResgate) : undefined,
    motivo: p.motivo || undefined,
    voltaria: p.voltaria || undefined,
    situacao: p.situacao || undefined,
    investigar: p.investigar === '1',
    dias: Number.isFinite(dias) && dias > 0 ? dias : 0,
    busca: p.busca || undefined,
    testes: p.testes === '1',
  };
}

function Linha({ r, conversa }: { r: Resgate; conversa: MensagemConversa[] }) {
  const situacao = r.motivo ? (NOME_MOTIVO[r.motivo] ?? r.motivo) : r.respondeu_em ? 'Respondeu, sem motivo ainda' : 'Ainda não respondeu';
  return (
    <div className={`border-b border-ninho-borda p-4 text-sm last:border-b-0 ${r.investigar ? 'bg-amber-50' : ''}`}>
      <p className="font-semibold text-ninho-grafite">
        <span
          className={`mr-2 rounded-pill px-2 py-0.5 text-xs ${
            r.tipo === 'cartao_recusado' ? 'bg-red-100 text-red-700' : 'bg-ninho-nuvem text-ninho-cinza'
          }`}
        >
          {NOME_TIPO_RESGATE[r.tipo] ?? r.tipo}
        </span>
        {situacao}
        {r.voltaria ? (
          <span className="ml-2 rounded-pill bg-ninho-lavanda px-2 py-0.5 text-xs text-ninho-roxo-escuro">{NOME_VOLTARIA[r.voltaria] ?? r.voltaria}</span>
        ) : null}
        {r.converteu_em ? <span className="ml-2 rounded-pill bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800">assinou depois</span> : null}
        {r.codigo_oferecido ? <span className="ml-2 rounded-pill bg-ninho-lavanda px-2 py-0.5 text-xs text-ninho-roxo-escuro">recebeu o código</span> : null}
        {r.teste ? <span className="ml-2 rounded-pill bg-ninho-nuvem px-2 py-0.5 text-xs text-ninho-cinza">teste</span> : null}
      </p>
      {r.motivo_resumo && (
        <p className="mt-1 whitespace-pre-wrap text-ninho-grafite">
          <span className="text-xs font-semibold text-ninho-cinza">Motivo: </span>
          {r.motivo_resumo}
        </p>
      )}
      {r.voltaria_resumo && (
        <p className="mt-1 whitespace-pre-wrap text-ninho-grafite">
          <span className="text-xs font-semibold text-ninho-cinza">Voltaria se: </span>
          {r.voltaria_resumo}
        </p>
      )}
      <p className="mt-1 text-xs text-ninho-cinza">
        {r.nome ?? 'Sem nome'} · {r.email ?? 'sem e-mail'} · {r.registros} registros · app {r.app_version ?? '?'} · conversa em {quando(r.iniciado_em)}
        {r.resposta_rapida ? ` · tocou em "${NOME_RESPOSTA_RAPIDA[r.resposta_rapida] ?? r.resposta_rapida}"` : ''}
        {r.push_enviada_em ? ' · push enviada' : ''}
      </p>

      {conversa.length > 0 && (
        <details className="mt-2 rounded-xl bg-ninho-nuvem p-3">
          <summary className="cursor-pointer text-xs font-semibold text-ninho-cinza">Ver a conversa ({conversa.length} mensagens)</summary>
          <div className="mt-2 flex flex-col gap-2">
            {conversa.map((m, i) => (
              <p key={i} className="whitespace-pre-wrap text-ninho-grafite">
                <span className="font-semibold text-ninho-roxo-escuro">{QUEM[m.role] ?? m.role}:</span> {m.content}
              </p>
            ))}
          </div>
        </details>
      )}

      <form action={investigar} className="mt-3 flex flex-wrap items-start gap-2">
        <input type="hidden" name="id" value={r.id} />
        <label className="flex items-center gap-2 pt-2 text-xs font-semibold text-ninho-grafite">
          <input type="checkbox" name="investigar" value="true" defaultChecked={r.investigar} />
          Investigar
        </label>
        <input
          name="nota"
          defaultValue={r.nota_dono ?? ''}
          placeholder="Nota (ex.: ver se o cronômetro trava no iPhone 11)"
          className="min-w-[240px] flex-1 rounded-xl border border-ninho-borda bg-white px-3 py-2 text-sm"
        />
        <button type="submit" className="rounded-pill border border-ninho-roxo px-4 py-2 text-xs font-semibold text-ninho-roxo-escuro hover:bg-ninho-roxo-suave">
          Salvar
        </button>
      </form>
    </div>
  );
}

export default async function ResgatesPage({ searchParams }: { searchParams: Params }) {
  requireRole('admin');
  const filtro = lerFiltro(searchParams);
  const linhas = await fetchResgatesFiltrados(filtro);
  const conversas = await fetchConversasDosResgates(linhas);

  const conta = (f: (r: Resgate) => boolean) => linhas.filter(f).length;
  const motivos = Object.keys(NOME_MOTIVO);

  const paraExcel = linhas.map((r) => ({
    Data: quando(r.iniciado_em),
    Tipo: NOME_TIPO_RESGATE[r.tipo] ?? r.tipo,
    Nome: r.nome ?? '',
    'E-mail': r.email ?? '',
    Registros: r.registros,
    App: r.app_version ?? '',
    Botão: r.resposta_rapida ? (NOME_RESPOSTA_RAPIDA[r.resposta_rapida] ?? r.resposta_rapida) : '',
    Motivo: r.motivo ? (NOME_MOTIVO[r.motivo] ?? r.motivo) : '',
    'Motivo (palavras)': r.motivo_resumo ?? '',
    Voltaria: r.voltaria ? NOME_VOLTARIA[r.voltaria] : '',
    'Voltaria se': r.voltaria_resumo ?? '',
    'Assinou depois': r.converteu_em ? 'sim' : '',
    Investigar: r.investigar ? 'sim' : '',
    Nota: r.nota_dono ?? '',
  }));

  return (
    <>
      <PageHeader
        title="O que a Nina coletou"
        subtitle="Quem não assinou depois do teste e quem teve o cartão recusado: o motivo, se voltaria com o problema resolvido e a conversa inteira. Filtre e marque o que precisa ser investigado."
      />
      <a href="/admin/atendimento#resgates" className="mb-4 inline-block text-sm text-ninho-roxo hover:underline">
        ← Voltar ao atendimento
      </a>

      <form method="get" className="mb-5 flex flex-wrap items-end gap-2 rounded-2xl border border-ninho-borda bg-white p-4">
        <select name="tipo" defaultValue={searchParams.tipo ?? ''} className={SELECT} aria-label="Tipo">
          <option value="">Todos os tipos</option>
          <option value="nao_assinou">Não assinou</option>
          <option value="cartao_recusado">Cartão recusado</option>
        </select>
        <select name="motivo" defaultValue={searchParams.motivo ?? ''} className={SELECT} aria-label="Motivo">
          <option value="">Todos os motivos</option>
          <option value="sem_motivo">Sem motivo ainda</option>
          {motivos.map((m) => (
            <option key={m} value={m}>
              {NOME_MOTIVO[m]}
            </option>
          ))}
        </select>
        <select name="voltaria" defaultValue={searchParams.voltaria ?? ''} className={SELECT} aria-label="Voltaria">
          <option value="">Voltaria: todos</option>
          <option value="sim">Voltaria</option>
          <option value="talvez">Talvez voltasse</option>
          <option value="nao">Não voltaria</option>
          <option value="sem_resposta">Sem resposta</option>
        </select>
        <select name="situacao" defaultValue={searchParams.situacao ?? ''} className={SELECT} aria-label="Situação">
          <option value="">Respondeu ou não</option>
          <option value="respondeu">Respondeu</option>
          <option value="nao_respondeu">Não respondeu</option>
        </select>
        <select name="dias" defaultValue={searchParams.dias ?? ''} className={SELECT} aria-label="Período">
          <option value="">Desde o início</option>
          <option value="7">Últimos 7 dias</option>
          <option value="30">Últimos 30 dias</option>
          <option value="90">Últimos 90 dias</option>
        </select>
        <input name="busca" defaultValue={searchParams.busca ?? ''} placeholder="Buscar nas respostas" className={`${SELECT} min-w-[200px]`} />
        <label className="flex items-center gap-1 text-sm text-ninho-grafite">
          <input type="checkbox" name="investigar" value="1" defaultChecked={searchParams.investigar === '1'} /> Só a investigar
        </label>
        <label className="flex items-center gap-1 text-sm text-ninho-cinza">
          <input type="checkbox" name="testes" value="1" defaultChecked={searchParams.testes === '1'} /> Incluir testes
        </label>
        <button type="submit" className="rounded-pill bg-ninho-roxo px-4 py-2 text-sm font-semibold text-white hover:bg-ninho-roxo-escuro">
          Filtrar
        </button>
        <a href="/admin/atendimento/resgates" className="px-2 py-2 text-sm text-ninho-cinza hover:underline">
          Limpar
        </a>
      </form>

      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-5">
        <StatCard label="Conversas" value={linhas.length} />
        <StatCard label="Responderam" value={conta((r) => Boolean(r.respondeu_em))} />
        <StatCard label="Voltariam" value={conta((r) => r.voltaria === 'sim')} hint={`Talvez: ${conta((r) => r.voltaria === 'talvez')}`} />
        <StatCard label="Assinaram depois" value={conta((r) => Boolean(r.converteu_em))} />
        <StatCard label="A investigar" value={conta((r) => r.investigar)} />
      </div>

      <div className="mb-3 flex justify-end">
        <ExportExcelButton rows={paraExcel} filename="ninho-nina-coletou" sheetName="Nina" />
      </div>

      {linhas.length === 0 ? (
        <p className="rounded-2xl border border-ninho-borda bg-white p-5 text-sm text-ninho-cinza">Nada com esses filtros.</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-ninho-borda bg-white">
          {linhas.map((r) => (
            <Linha key={r.id} r={r} conversa={conversas.get(r.id) ?? []} />
          ))}
        </div>
      )}
    </>
  );
}
