import { requireRole } from '@/lib/auth/guard';
import { SETORES, estadosPorPessoa, lerAtividade, lerAprovacoesAbertas, type Aprovacao, type Atividade } from '@/lib/empresa';
import { PageHeader } from '@/components/admin/PageHeader';
import { StatCard } from '@/components/admin/StatCard';
import { Notice } from '@/components/admin/Notice';
import { Predio } from '@/components/admin/Predio';

export const dynamic = 'force-dynamic';

/**
 * O prédio da empresa virtual (etapa 3c). Mostra quem está trabalhando agora,
 * a partir do que os hooks do Claude Code registram em painel.empresa_atividade.
 * O componente faz router.refresh() a cada 15s, então a página relê sozinha.
 */
export default async function EmpresaPage() {
  requireRole('admin');

  let atividade: Atividade[] = [];
  let aprovacoes: Aprovacao[] = [];
  let erro: string | null = null;
  try {
    [atividade, aprovacoes] = await Promise.all([lerAtividade(), lerAprovacoesAbertas()]);
  } catch (e) {
    erro = e instanceof Error ? e.message : String(e);
  }

  const estados = estadosPorPessoa(atividade, aprovacoes);
  const ativos = SETORES.filter((s) => !s.desativado);
  const funcoes = ativos.reduce((n, s) => n + s.pessoas.length, 0);
  const trabalhando = Object.values(estados).filter((e) => e.estado === 'trabalhando').length;
  const hoje = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Dubai' });
  const tarefasHoje = atividade.filter(
    (a) => new Date(a.inicio).toLocaleDateString('en-CA', { timeZone: 'Asia/Dubai' }) === hoje,
  ).length;

  // Começa no andar onde tem gente trabalhando; senão, na diretoria.
  const inicial =
    ativos.find((s) => s.pessoas.some((p) => estados[p.id]?.estado === 'trabalhando'))?.id ?? 'dir';

  return (
    <>
      <PageHeader
        title="O prédio"
        subtitle="Quem está trabalhando agora em cada setor. Escolha o andar na torre e clique em alguém para ver o que está fazendo. Atualiza sozinho."
      />
      {erro && (
        <Notice tone="warn">
          Não consegui ler a atividade da empresa: {erro}. Confira se a migration 00083 está aplicada.
        </Notice>
      )}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Trabalhando agora" value={trabalhando} accent />
        <StatCard label="Esperando você" value={aprovacoes.length} hint="itens no mural" danger={aprovacoes.length > 0} />
        <StatCard label="Tarefas hoje" value={tarefasHoje} hint="no fuso de Dubai" />
        <StatCard label="Funções" value={funcoes} hint={`${ativos.length} setores ativos`} />
      </div>
      <Predio setores={SETORES} estados={estados} inicial={inicial} />
    </>
  );
}
