import { requireRole } from '@/lib/auth/guard';
import {
  SETORES, estadosPorPessoa, lerAtividade, lerAprovacoesAbertas, lerAprovacoesResolvidas,
  type Aprovacao, type Atividade,
} from '@/lib/empresa';
import { PageHeader } from '@/components/admin/PageHeader';
import { Notice } from '@/components/admin/Notice';
import { Predio, type Feito } from '@/components/admin/Predio';

export const dynamic = 'force-dynamic';

const STATUS_MURAL: Record<string, string> = { aprovado: 'aprovou', feito: 'fez', recusado: 'recusou' };

/**
 * O prédio da empresa virtual. Mostra quem está trabalhando agora, a partir
 * do que os hooks do Claude Code registram em painel.empresa_atividade, e o
 * mural (painel.aprovacoes). O componente faz router.refresh() a cada 15s.
 */
export default async function EmpresaPage() {
  requireRole('admin');

  let atividade: Atividade[] = [];
  let aprovacoes: Aprovacao[] = [];
  let resolvidas: Awaited<ReturnType<typeof lerAprovacoesResolvidas>> = [];
  let erro: string | null = null;
  try {
    [atividade, aprovacoes, resolvidas] = await Promise.all([lerAtividade(), lerAprovacoesAbertas(), lerAprovacoesResolvidas()]);
  } catch (e) {
    erro = e instanceof Error ? e.message : String(e);
  }

  const estados = estadosPorPessoa(atividade, aprovacoes);
  const nome = new Map(SETORES.flatMap((s) => s.pessoas.map((p) => [p.id, p.nome] as const)));
  const dia = (iso: string) => new Date(iso).toLocaleDateString('en-CA', { timeZone: 'Asia/Dubai' });
  const hojeDubai = dia(new Date().toISOString());

  const deAtividade: Feito[] = atividade
    .filter((a) => a.status !== 'trabalhando')
    .map((a) => ({
      quando: a.fim ?? a.inicio,
      quem: nome.get(a.funcionario) ?? a.funcionario,
      setor: a.setor,
      oque: `${a.tarefa ?? '(sem descrição)'}${a.status === 'erro' ? ' (erro)' : ''}`,
    }));
  const doMural: Feito[] = resolvidas.map((m) => ({
    quando: m.atualizado_em,
    quem: 'Você',
    setor: m.setor,
    oque: `${STATUS_MURAL[m.status] ?? m.status}: ${m.titulo}`,
  }));
  const feitos = [...deAtividade, ...doMural].sort((a, b) => b.quando.localeCompare(a.quando)).slice(0, 80);
  const hoje: Feito[] = atividade
    .filter((a) => dia(a.inicio) === hojeDubai)
    .map((a) => ({
      quando: a.inicio,
      quem: nome.get(a.funcionario) ?? a.funcionario,
      setor: a.setor,
      oque: `${a.tarefa ?? '(sem descrição)'}${a.status === 'trabalhando' ? ' (em andamento)' : a.status === 'erro' ? ' (erro)' : ''}`,
    }));

  return (
    <>
      <PageHeader
        title="O prédio"
        subtitle="Frente aberta: todos os andares de uma vez. Clique num setor para ver quem está lá, ou em alguém para ver o que está fazendo. Atualiza sozinho."
      />
      {erro && (
        <Notice tone="warn">
          Não consegui ler a atividade da empresa: {erro}. Confira se a migration 00083 está aplicada.
        </Notice>
      )}
      <Predio setores={SETORES} estados={estados} esperando={aprovacoes} feitos={feitos} hoje={hoje} />
    </>
  );
}
