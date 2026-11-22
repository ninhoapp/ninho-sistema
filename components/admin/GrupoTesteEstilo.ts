import type { GrupoTeste } from '@/lib/teste-paywall';

/** Cor de cada grupo do teste de paywall: as mesmas da página Teste de paywall,
 *  de Usuários ativos e da coluna Grupo dos Assinantes. */
export const TESTE_STYLE: Record<GrupoTeste['grupo'], string> = {
  A: 'bg-[#EFEAFB] text-[#6B52B8]',
  B: 'bg-[#FEF1DE] text-[#9A5B1E]',
  C: 'bg-[#E3F0FC] text-[#2D6FB0]',
};
