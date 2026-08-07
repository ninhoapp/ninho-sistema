import { requireSession } from '@/lib/auth/guard';
import { getPerfil } from '@/lib/painel/store';
import { PageHeader } from '@/components/admin/PageHeader';
import { Notice } from '@/components/admin/Notice';
import { ChangePasswordForm } from '@/components/admin/ChangePasswordForm';
import { PixForm } from '@/components/admin/PixForm';
import { commissionLabel } from '@/lib/metrics';

export const dynamic = 'force-dynamic';

const ROLE_LABEL: Record<string, string> = {
  admin: 'Administrador',
  conversor: 'Conversor',
};

export default async function ContaPage() {
  const session = requireSession();
  const perfil = await getPerfil(session.sub);

  return (
    <>
      <PageHeader
        title="Minha conta"
        subtitle="Seus dados de acesso. A senha é guardada como hash scrypt — nem o painel consegue lê-la de volta."
      />

      <div className="mb-6 rounded-2xl border border-ninho-borda bg-white p-5">
        <dl className="grid gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-xs uppercase tracking-wide text-ninho-cinza">Nome</dt>
            <dd className="mt-1 text-sm font-medium text-ninho-grafite">{session.name}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-ninho-cinza">Usuário</dt>
            <dd className="mt-1 font-mono text-sm text-ninho-grafite">{session.username}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-ninho-cinza">Papel</dt>
            <dd className="mt-1 text-sm font-medium text-ninho-roxo-escuro">
              {ROLE_LABEL[session.role]}
            </dd>
          </div>
        </dl>
      </div>

      <section className="mb-8">
        <h2 className="mb-1 text-base font-bold text-ninho-grafite">Trocar senha</h2>
        <p className="mb-4 text-sm text-ninho-cinza">
          Mínimo de 8 caracteres. Você precisa informar a senha atual para confirmar.
        </p>
        <ChangePasswordForm />
      </section>

      {session.role === 'conversor' && (
        <section>
          <h2 className="mb-1 text-base font-bold text-ninho-grafite">Chave PIX</h2>
          <p className="mb-4 text-sm text-ninho-cinza">
            É para onde o repasse é enviado. {perfil && commissionLabel(perfil)}
          </p>
          <PixForm atual={perfil?.pix_key ?? null} />
        </section>
      )}

      {!perfil && (
        <Notice tone="warn">
          Não consegui carregar seu perfil do banco. Confira se <code>SUPABASE_URL</code> e{' '}
          <code>SUPABASE_SERVICE_ROLE_KEY</code> estão definidas.
        </Notice>
      )}
    </>
  );
}
