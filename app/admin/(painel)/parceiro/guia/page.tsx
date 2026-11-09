import { requireSession } from '@/lib/auth/guard';
import { PageHeader } from '@/components/admin/PageHeader';
import { GuiaParceiroConteudo } from '@/components/parceiros/GuiaParceiroConteudo';

// Página só de leitura: qualquer papel logado (admin, parceiro...) pode abrir.
// A permissão de menu é ligada em outro lugar. A versão pública, para quem
// ainda está conhecendo a parceria, é /sejaparceiro/guia (mesmo conteúdo).

export default function GuiaParceiroPage() {
  requireSession();

  return (
    <>
      <PageHeader
        title="Guia do parceiro"
        subtitle="Tudo para conhecer o Ninho, falar dele do jeito certo e entender como a parceria funciona."
      />
      <GuiaParceiroConteudo />
    </>
  );
}
