import { redirect } from 'next/navigation';

/**
 * A KPI antiga da Diretoria saiu a pedido do dono (24/10/2026). No lugar dela
 * ficou o "KPI de crescimento" (plano × realizado), no setor de Crescimento.
 * O endereço antigo continua funcionando e leva para lá.
 */
export default function KpiAntiga() {
  redirect('/admin/crescimento');
}
