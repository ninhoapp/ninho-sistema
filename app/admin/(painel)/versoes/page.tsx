import { requireRole } from '@/lib/auth/guard';
import { VersoesView } from '@/components/admin/VersoesView';

/** Versões (setor Produto, Clara). O conteúdo está em components/admin/VersoesView.tsx. */
export default async function VersoesPage() {
  await requireRole('admin');
  return <VersoesView />;
}
