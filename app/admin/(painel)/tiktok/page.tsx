import { requireRole } from '@/lib/auth/guard';
import { listarFila, listarContaDia, origemTiktok } from '@/lib/tiktok';
import { TelaTiktok } from './TelaTiktok';

export const dynamic = 'force-dynamic';

/** Aba TikTok (setor Crescimento). Pedido do dono, 21/11/2026: só estrutura, sem API. */
export default async function TiktokPage(props: { searchParams: Promise<{ status?: string }> }) {
  await requireRole('admin');
  const searchParams = await props.searchParams;
  const [fila, conta, origem] = await Promise.all([listarFila(), listarContaDia(), origemTiktok()]);
  return <TelaTiktok fila={fila} conta={conta} origem={origem} status={searchParams?.status} />;
}
