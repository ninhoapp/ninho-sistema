/**
 * Projeção de nov/2026 a dez/2027 (Marta, Financeiro, 24/10/2026, versão 2
 * com as correções do dono). É PLANO, não dado: cada número sai das
 * premissas abaixo. Detalhe e conta: Ninho-expo/docs/empresa/financeiro/
 * projecao-2027.md. Gerado pelo script do modelo; não edite à mão número por
 * número, refaça a projeção e cole de novo.
 *
 * Regra de verba do dono: verba do mês = 1.500 AED do bolso (só até
 * jun/2027) + 100% do faturamento líquido do mês anterior (vendas de M−1,
 * que a Apple paga no dia 1 de M).
 */

export type Cenario = 'pessimista' | 'base' | 'otimista';

export interface MesPlano {
  /** yyyy-mm */
  mes: string;
  verbaAed: number;
  appleAed: number;
  metaAed: number;
  criativoAed: number;
  instalacoes: number;
  novos: number;
  novosAcum: number;
  /** Assinantes acumulados no fim do mês, já com o churn. */
  ativos: number;
  /** MRR bruto em R$ (anual dividido por 12). */
  mrr: number;
  /** Faturamento líquido do mês em R$ (caixa, depois dos 15% da loja). */
  faturamentoLiq: number;
  bolsoAcumAed: number;
}

/** Câmbio usado na projeção: o mesmo do painel (lib/cambio.ts). */
export { CAMBIO, BRL_POR_AED } from '@/lib/cambio';

export const BOLSO_AED = 1500;
export const FIM_DO_BOLSO = '2027-07';

export const CENARIO_LABEL: Record<Cenario, string> = {
  pessimista: 'Pessimista',
  base: 'Base',
  otimista: 'Otimista',
};

export const CENARIO_COR: Record<Cenario, string> = {
  pessimista: '#E8875D',
  base: '#7C5CD6',
  otimista: '#4CAF74',
};

/** Mês em que o faturamento do mês passa de 1.500 AED (a verba se paga sozinha). */
export const SE_PAGA: Record<Cenario, string | null> = {
  pessimista: '2027-06',
  base: '2027-02',
  otimista: '2026-12',
};

export const PREMISSAS: { nome: string; pessimista: string; base: string; otimista: string; origem: string }[] = [
  { nome: 'Custo por assinante Apple (hoje)', pessimista: 'US$ 11,68', base: 'US$ 9,00', otimista: 'US$ 7,19', origem: 'Apple Basic, set–out' },
  { nome: 'Custo por assinante Meta (hoje)', pessimista: 'US$ 25', base: 'US$ 20', otimista: 'US$ 15', origem: 'Meta: melhor caso US$ 14,95' },
  { nome: 'Verba ×2 deixa o custo', pessimista: '×1,19', base: '×1,11', otimista: '×1,04', origem: 'premissa (aumento leve)' },
  { nome: 'Churn mensal', pessimista: '8%', base: '5%', otimista: '3%', origem: 'sem dado ainda' },
  { nome: 'Renovação do anual', pessimista: '50%', base: '60%', otimista: '70%', origem: 'premissa' },
  { nome: 'Mix BM / PM / BA / PA', pessimista: '70/25/2/3', base: '59/30/4/7', otimista: '45/35/7/13', origem: 'base = pagantes de 23/10' },
  { nome: 'Orgânicos por mês', pessimista: '1', base: '3', otimista: '5', origem: 'premissa' },
];

export const PLANO: Record<Cenario, MesPlano[]> = {
  pessimista: [
    { mes: '2026-11', verbaAed: 1859, appleAed: 1108, metaAed: 651, criativoAed: 100, instalacoes: 961, novos: 30, novosAcum: 30, ativos: 55, mrr: 622, faturamentoLiq: 638, bolsoAcumAed: 1500 },
    { mes: '2026-12', verbaAed: 1930, appleAed: 1216, metaAed: 714, criativoAed: 0, instalacoes: 1030, novos: 32, novosAcum: 63, ativos: 84, mrr: 936, faturamentoLiq: 902, bolsoAcumAed: 3000 },
    { mes: '2027-01', verbaAed: 2108, appleAed: 1265, metaAed: 743, criativoAed: 100, instalacoes: 1061, novos: 33, novosAcum: 96, ativos: 111, mrr: 1237, faturamentoLiq: 1149, bolsoAcumAed: 4500 },
    { mes: '2027-02', verbaAed: 2274, appleAed: 1433, metaAed: 842, criativoAed: 0, instalacoes: 1165, novos: 37, novosAcum: 133, ativos: 139, mrr: 1550, faturamentoLiq: 1416, bolsoAcumAed: 6000 },
    { mes: '2027-03', verbaAed: 2454, appleAed: 1483, metaAed: 871, criativoAed: 100, instalacoes: 1195, novos: 37, novosAcum: 170, ativos: 166, mrr: 1850, faturamentoLiq: 1661, bolsoAcumAed: 7500 },
    { mes: '2027-04', verbaAed: 2619, appleAed: 1650, metaAed: 969, criativoAed: 0, instalacoes: 1295, novos: 40, novosAcum: 210, ativos: 194, mrr: 2162, faturamentoLiq: 1924, bolsoAcumAed: 9000 },
    { mes: '2027-05', verbaAed: 2796, appleAed: 1699, metaAed: 998, criativoAed: 100, instalacoes: 1323, novos: 41, novosAcum: 252, ativos: 221, mrr: 2459, faturamentoLiq: 2164, bolsoAcumAed: 10500 },
    { mes: '2027-06', verbaAed: 2958, appleAed: 1864, metaAed: 1095, criativoAed: 0, instalacoes: 1419, novos: 44, novosAcum: 296, ativos: 249, mrr: 2767, faturamentoLiq: 2422, bolsoAcumAed: 12000 },
    { mes: '2027-07', verbaAed: 1632, appleAed: 965, metaAed: 567, criativoAed: 100, instalacoes: 866, novos: 27, novosAcum: 323, ativos: 258, mrr: 2864, faturamentoLiq: 2412, bolsoAcumAed: 12000 },
    { mes: '2027-08', verbaAed: 1625, appleAed: 1024, metaAed: 601, criativoAed: 0, instalacoes: 905, novos: 29, novosAcum: 352, ativos: 267, mrr: 2968, faturamentoLiq: 2494, bolsoAcumAed: 12000 },
    { mes: '2027-09', verbaAed: 1681, appleAed: 996, metaAed: 585, criativoAed: 100, instalacoes: 887, novos: 28, novosAcum: 380, ativos: 276, mrr: 3058, faturamentoLiq: 2557, bolsoAcumAed: 12000 },
    { mes: '2027-10', verbaAed: 1723, appleAed: 1086, metaAed: 638, criativoAed: 0, instalacoes: 946, novos: 30, novosAcum: 410, ativos: 284, mrr: 3148, faturamentoLiq: 2791, bolsoAcumAed: 12000 },
    { mes: '2027-11', verbaAed: 1881, appleAed: 1122, metaAed: 659, criativoAed: 100, instalacoes: 969, novos: 31, novosAcum: 441, ativos: 293, mrr: 3246, faturamentoLiq: 2796, bolsoAcumAed: 12000 },
    { mes: '2027-12', verbaAed: 1884, appleAed: 1187, metaAed: 697, criativoAed: 0, instalacoes: 1011, novos: 32, novosAcum: 472, ativos: 302, mrr: 3350, faturamentoLiq: 2890, bolsoAcumAed: 12000 },
  ],
  base: [
    { mes: '2026-11', verbaAed: 1859, appleAed: 1108, metaAed: 651, criativoAed: 100, instalacoes: 1008, novos: 43, novosAcum: 43, ativos: 68, mrr: 776, faturamentoLiq: 1055, bolsoAcumAed: 1500 },
    { mes: '2026-12', verbaAed: 2211, appleAed: 1393, metaAed: 818, criativoAed: 0, instalacoes: 1224, novos: 51, novosAcum: 94, ativos: 116, mrr: 1321, faturamentoLiq: 1564, bolsoAcumAed: 3000 },
    { mes: '2027-01', verbaAed: 2554, appleAed: 1546, metaAed: 908, criativoAed: 100, instalacoes: 1337, novos: 55, novosAcum: 149, ativos: 167, mrr: 1892, faturamentoLiq: 2047, bolsoAcumAed: 4500 },
    { mes: '2027-02', verbaAed: 2880, appleAed: 1814, metaAed: 1065, criativoAed: 0, instalacoes: 1532, novos: 63, novosAcum: 212, ativos: 222, mrr: 2523, faturamentoLiq: 2610, bolsoAcumAed: 6000 },
    { mes: '2027-03', verbaAed: 3259, appleAed: 1990, metaAed: 1169, criativoAed: 100, instalacoes: 1658, novos: 68, novosAcum: 280, ativos: 280, mrr: 3183, faturamentoLiq: 3162, bolsoAcumAed: 7500 },
    { mes: '2027-04', verbaAed: 3631, appleAed: 2288, metaAed: 1343, criativoAed: 0, instalacoes: 1866, novos: 76, novosAcum: 356, ativos: 344, mrr: 3906, faturamentoLiq: 3797, bolsoAcumAed: 9000 },
    { mes: '2027-05', verbaAed: 4058, appleAed: 2494, metaAed: 1465, criativoAed: 100, instalacoes: 2008, novos: 82, novosAcum: 438, ativos: 411, mrr: 4660, faturamentoLiq: 4424, bolsoAcumAed: 10500 },
    { mes: '2027-06', verbaAed: 4481, appleAed: 2823, metaAed: 1658, criativoAed: 0, instalacoes: 2232, novos: 90, novosAcum: 528, ativos: 483, mrr: 5481, faturamentoLiq: 5135, bolsoAcumAed: 12000 },
    { mes: '2027-07', verbaAed: 3460, appleAed: 2117, metaAed: 1243, criativoAed: 100, instalacoes: 1747, novos: 72, novosAcum: 600, ativos: 534, mrr: 6049, faturamentoLiq: 5349, bolsoAcumAed: 12000 },
    { mes: '2027-08', verbaAed: 3604, appleAed: 2271, metaAed: 1334, criativoAed: 0, instalacoes: 1854, novos: 76, novosAcum: 676, ativos: 586, mrr: 6640, faturamentoLiq: 5829, bolsoAcumAed: 12000 },
    { mes: '2027-09', verbaAed: 3928, appleAed: 2412, metaAed: 1416, criativoAed: 100, instalacoes: 1952, novos: 80, novosAcum: 755, ativos: 640, mrr: 7250, faturamentoLiq: 6316, bolsoAcumAed: 12000 },
    { mes: '2027-10', verbaAed: 4256, appleAed: 2681, metaAed: 1575, criativoAed: 0, instalacoes: 2136, novos: 87, novosAcum: 842, ativos: 698, mrr: 7903, faturamentoLiq: 7060, bolsoAcumAed: 12000 },
    { mes: '2027-11', verbaAed: 4757, appleAed: 2934, metaAed: 1723, criativoAed: 100, instalacoes: 2306, novos: 93, novosAcum: 935, ativos: 760, mrr: 8597, faturamentoLiq: 7750, bolsoAcumAed: 12000 },
    { mes: '2027-12', verbaAed: 5222, appleAed: 3290, metaAed: 1932, criativoAed: 0, instalacoes: 2541, novos: 103, novosAcum: 1038, ativos: 827, mrr: 9362, faturamentoLiq: 8481, bolsoAcumAed: 12000 },
  ],
  otimista: [
    { mes: '2026-11', verbaAed: 1859, appleAed: 1108, metaAed: 651, criativoAed: 100, instalacoes: 1058, novos: 58, novosAcum: 58, ativos: 84, mrr: 966, faturamentoLiq: 1836, bolsoAcumAed: 1500 },
    { mes: '2026-12', verbaAed: 2737, appleAed: 1724, metaAed: 1013, criativoAed: 0, instalacoes: 1609, novos: 85, novosAcum: 143, ativos: 167, mrr: 1927, faturamentoLiq: 3053, bolsoAcumAed: 3000 },
    { mes: '2027-01', verbaAed: 3557, appleAed: 2178, metaAed: 1279, criativoAed: 100, instalacoes: 2009, novos: 105, novosAcum: 247, ativos: 267, mrr: 3095, faturamentoLiq: 4265, bolsoAcumAed: 4500 },
    { mes: '2027-02', verbaAed: 4374, appleAed: 2756, metaAed: 1618, criativoAed: 0, instalacoes: 2512, novos: 130, novosAcum: 377, ativos: 391, mrr: 4523, faturamentoLiq: 5759, bolsoAcumAed: 6000 },
    { mes: '2027-03', verbaAed: 5380, appleAed: 3327, metaAed: 1954, criativoAed: 100, instalacoes: 3004, novos: 154, novosAcum: 531, ativos: 536, mrr: 6200, faturamentoLiq: 7413, bolsoAcumAed: 7500 },
    { mes: '2027-04', verbaAed: 6495, appleAed: 4092, metaAed: 2403, criativoAed: 0, instalacoes: 3657, novos: 187, novosAcum: 718, ativos: 710, mrr: 8212, faturamentoLiq: 9455, bolsoAcumAed: 9000 },
    { mes: '2027-05', verbaAed: 7872, appleAed: 4896, metaAed: 2875, criativoAed: 100, instalacoes: 4337, novos: 221, novosAcum: 939, ativos: 913, mrr: 10566, faturamentoLiq: 11760, bolsoAcumAed: 10500 },
    { mes: '2027-06', verbaAed: 9425, appleAed: 5937, metaAed: 3487, criativoAed: 0, instalacoes: 5209, novos: 264, novosAcum: 1203, ativos: 1155, mrr: 13366, faturamentoLiq: 14560, bolsoAcumAed: 12000 },
    { mes: '2027-07', verbaAed: 9811, appleAed: 6118, metaAed: 3593, criativoAed: 100, instalacoes: 5360, novos: 271, novosAcum: 1474, ativos: 1399, mrr: 16183, faturamentoLiq: 16656, bolsoAcumAed: 12000 },
    { mes: '2027-08', verbaAed: 11224, appleAed: 7071, metaAed: 4153, criativoAed: 0, instalacoes: 6150, novos: 311, novosAcum: 1784, ativos: 1677, mrr: 19387, faturamentoLiq: 19643, bolsoAcumAed: 12000 },
    { mes: '2027-09', verbaAed: 13237, appleAed: 8276, metaAed: 4861, criativoAed: 100, instalacoes: 7142, novos: 360, novosAcum: 2144, ativos: 1997, mrr: 23084, faturamentoLiq: 23166, bolsoAcumAed: 12000 },
    { mes: '2027-10', verbaAed: 15610, appleAed: 9835, metaAed: 5776, criativoAed: 0, instalacoes: 8414, novos: 423, novosAcum: 2567, ativos: 2372, mrr: 27416, faturamentoLiq: 27614, bolsoAcumAed: 12000 },
    { mes: '2027-11', verbaAed: 18608, appleAed: 11660, metaAed: 6848, criativoAed: 100, instalacoes: 9891, novos: 496, novosAcum: 3064, ativos: 2810, mrr: 32469, faturamentoLiq: 33154, bolsoAcumAed: 12000 },
    { mes: '2027-12', verbaAed: 22341, appleAed: 14075, metaAed: 8266, criativoAed: 0, instalacoes: 11827, novos: 593, novosAcum: 3656, ativos: 3331, mrr: 38498, faturamentoLiq: 39622, bolsoAcumAed: 12000 },
  ],
};
