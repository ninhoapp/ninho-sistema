/**
 * Link de DIVULGAÇÃO da consultora: www.useninho.com.br/indica/<codigo>
 * (12/11/2026, 00144 do app). Para publicar no Instagram, stories e grupos:
 * só comissão, a família não fica ligada à consultora. Igual ao antigo
 * /c/<codigo>, que continua valendo (lib/link-consultora.ts).
 */
import { NextRequest } from 'next/server';
import { linkDeDivulgacao } from '@/lib/link-consultora';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { codigo: string } }) {
  return linkDeDivulgacao(req, params.codigo, 'indica');
}
