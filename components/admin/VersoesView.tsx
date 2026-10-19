import { PageHeader } from '@/components/admin/PageHeader';
import { Notice } from '@/components/admin/Notice';
import diario from '@/lib/empresa/versoes.json';

/**
 * Versões (setor Produto, Clara): o que está em cada versão do app, de qual
 * build saiu e o que já entrou no próximo build. A fonte é
 * Ninho-expo/docs/empresa/versoes.json, copiada para cá por
 * `node scripts/empresa/copiar-organograma.mjs` (pedido do dono, 19/10/2026).
 */

type Estado = 'comecado' | 'terminado' | 'testado' | 'no_ar' | 'fora';
type Situacao = 'proximo' | 'em_revisao' | 'na_loja' | 'antiga';

interface Item { t: string; estado: Estado; teste: string; onde: 'app' | 'servidor'; ref?: string; obs?: string }
interface Build { plataforma: string; build: string; data: string; commit: string; obs?: string }
interface Versao { versao: string; situacao: Situacao; resumo: string; builds: Build[]; itens: Item[] }
interface Diario { atualizado_em: string; ultimo_aviso: { data: string; commit: string; nota?: string }; alertas: string[]; versoes: Versao[] }

const D = diario as Diario;

const ESTADO: Record<Estado, { label: string; cls: string }> = {
  comecado: { label: 'Começado', cls: 'bg-amber-50 text-amber-800' },
  terminado: { label: 'Terminado', cls: 'bg-blue-50 text-blue-700' },
  testado: { label: 'Testado', cls: 'bg-green-50 text-green-700' },
  no_ar: { label: 'No ar', cls: 'bg-ninho-roxo-suave text-ninho-roxo-escuro' },
  fora: { label: 'Fora', cls: 'bg-ninho-nuvem text-ninho-cinza' },
};

const SITUACAO: Record<Situacao, { label: string; cls: string }> = {
  proximo: { label: 'Próximo build', cls: 'bg-amber-50 text-amber-800' },
  em_revisao: { label: 'Em revisão na loja', cls: 'bg-blue-50 text-blue-700' },
  na_loja: { label: 'Na loja agora', cls: 'bg-green-50 text-green-700' },
  antiga: { label: 'Versão antiga', cls: 'bg-ninho-nuvem text-ninho-cinza' },
};

const dataBR = (iso: string) => iso.split('-').reverse().join('/');

function Chip({ cls, children }: { cls: string; children: React.ReactNode }) {
  return <span className={`shrink-0 rounded-pill px-2.5 py-1 text-xs font-semibold ${cls}`}>{children}</span>;
}

function Lista({ titulo, itens, estado = true }: { titulo: string; itens: Item[]; estado?: boolean }) {
  if (!itens.length) return null;
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-ninho-cinza">{titulo}</p>
      <ul className="flex flex-col divide-y divide-ninho-borda rounded-xl border border-ninho-borda">
        {itens.map((i) => (
          <li key={i.t} className="flex flex-col gap-1 p-3 sm:flex-row sm:items-start sm:gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{i.t}</p>
              <p className="text-xs text-ninho-cinza">
                Como testar: {i.teste}
                {i.ref ? ` · ${i.ref}` : ''}
              </p>
              {i.obs && <p className="mt-0.5 text-xs text-ninho-cinza">{i.obs}</p>}
            </div>
            {estado && <Chip cls={ESTADO[i.estado].cls}>{ESTADO[i.estado].label}</Chip>}
          </li>
        ))}
      </ul>
    </div>
  );
}

function CartaoVersao({ v }: { v: Versao }) {
  const app = v.itens.filter((i) => i.onde === 'app');
  const servidor = v.itens.filter((i) => i.onde === 'servidor');
  const conta = (e: Estado) => app.filter((i) => i.estado === e).length;
  return (
    <div className="flex flex-col gap-4 p-4">
      <p className="text-sm text-ninho-cinza">{v.resumo}</p>
      {v.situacao === 'proximo' && (
        <div className="flex flex-wrap gap-2 text-xs">
          <Chip cls={ESTADO.testado.cls}>{conta('testado')} testados</Chip>
          <Chip cls={ESTADO.terminado.cls}>{conta('terminado')} terminados, sem teste seu</Chip>
          <Chip cls={ESTADO.comecado.cls}>{conta('comecado')} em andamento</Chip>
        </div>
      )}
      {v.builds.length > 0 && (
        <div className="flex flex-col gap-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-ninho-cinza">Builds</p>
          {v.builds.map((b) => (
            <p key={`${b.plataforma}-${b.build}`} className="text-sm">
              <b>{b.plataforma}</b> build {b.build} · {b.data} · commit <code className="text-xs">{b.commit}</code>
              {b.obs && <span className="text-ninho-cinza"> · {b.obs}</span>}
            </p>
          ))}
        </div>
      )}
      <Lista titulo={v.situacao === 'proximo' ? 'No app (entra no build)' : 'No app'} itens={app} estado={v.situacao === 'proximo'} />
      <Lista titulo="No servidor (já vale para todas as versões, sem build)" itens={servidor} estado={v.situacao === 'proximo'} />
    </div>
  );
}

/** A tela, separada da página para poder ser vista sem login numa prévia local. */
export function VersoesView() {
  const [primeira, ...resto] = D.versoes;
  return (
    <>
      <PageHeader
        title="Versões"
        subtitle={`O que tem em cada versão do app e o que já entrou no próximo build. Cuidado pela Clara (Produto). Atualizado em ${dataBR(D.atualizado_em)}; último corte em ${dataBR(D.ultimo_aviso.data)} (commit ${D.ultimo_aviso.commit}).`}
      />
      {D.alertas.map((a) => (
        <Notice key={a} tone="warn">{a}</Notice>
      ))}
      <section className="flex flex-col gap-4">
        {primeira && (
          <div className="rounded-2xl border border-ninho-borda bg-white">
            <div className="flex items-center gap-3 border-b border-ninho-borda p-4">
              <h2 className="text-lg font-bold">Versão {primeira.versao}</h2>
              <Chip cls={SITUACAO[primeira.situacao].cls}>{SITUACAO[primeira.situacao].label}</Chip>
            </div>
            <CartaoVersao v={primeira} />
          </div>
        )}
        {resto.map((v) => (
          <details key={v.versao} open={v.situacao === 'na_loja'} className="rounded-2xl border border-ninho-borda bg-white">
            <summary className="flex cursor-pointer list-none items-center gap-3 p-4">
              <h2 className="text-lg font-bold">Versão {v.versao}</h2>
              <Chip cls={SITUACAO[v.situacao].cls}>{SITUACAO[v.situacao].label}</Chip>
              <span className="ml-auto text-xs text-ninho-cinza">{v.itens.length} mudanças</span>
            </summary>
            <div className="border-t border-ninho-borda">
              <CartaoVersao v={v} />
            </div>
          </details>
        ))}
      </section>
    </>
  );
}
