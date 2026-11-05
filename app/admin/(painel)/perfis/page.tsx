import { requireRole } from '@/lib/auth/guard';
import { listPerfis, semSenha } from '@/lib/painel/store';
import { PageHeader } from '@/components/admin/PageHeader';
import { PerfisManager } from '@/components/admin/PerfisManager';

export const dynamic = 'force-dynamic';

export default async function PerfisPage() {
  const session = requireRole('admin');
  const perfis = await listPerfis();

  return (
    <>
      <PageHeader
        title="Gerenciar perfis"
        subtitle="Quem tem acesso ao painel. É aqui que se cria o login do conversor ou do parceiro (influenciador), com o código e a comissão."
      />
      <PerfisManager perfis={perfis.map(semSenha)} meuId={session.sub} />
    </>
  );
}
