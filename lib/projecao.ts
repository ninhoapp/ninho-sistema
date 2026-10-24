/**
 * Projeção de nov/2026 a dez/2027 (Marta, Financeiro, 24/10/2026, versão 2
 * com as correções do dono). É PLANO, não dado: cada número sai das
 * premissas abaixo. Detalhe e conta: Ninho-expo/docs/empresa/financeiro/
 * projecao-2027.md. Gerado pelo script do modelo; não edite à mão número por
 * número, refaça a projeção e cole de novo.
 *
 * Regra de verba do dono: verba do mês = 1.500 AED do bolso (só até
 * jun/2027) + 100% do faturamento líquido do mês anterior (vendas de M−1,
 * que a Apple paga no dia 1 de M). Exceção: nov/2026 = 2.200 AED, valor do dono.
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

/** Verba de nov/2026 definida pelo dono em 24/10/2026 (1.500 do bolso + ~700 do faturamento de out). */
export const VERBA_NOV_AED = 2200;

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
    { mes: '2026-11', verbaAed: 2200, appleAed: 1323, metaAed: 777, criativoAed: 100, instalacoes: 1097, novos: 34, novosAcum: 34, ativos: 60, mrr: 668, faturamentoLiq: 696, bolsoAcumAed: 1500 },
    { mes: '2026-12', verbaAed: 1969, appleAed: 1240, metaAed: 728, criativoAed: 0, instalacoes: 1045, novos: 33, novosAcum: 67, ativos: 88, mrr: 984, faturamentoLiq: 944, bolsoAcumAed: 3000 },
    { mes: '2027-01', verbaAed: 2136, appleAed: 1283, metaAed: 753, criativoAed: 100, instalacoes: 1072, novos: 34, novosAcum: 101, ativos: 115, mrr: 1285, faturamentoLiq: 1190, bolsoAcumAed: 4500 },
    { mes: '2027-02', verbaAed: 2302, appleAed: 1450, metaAed: 852, criativoAed: 0, instalacoes: 1175, novos: 37, novosAcum: 138, ativos: 143, mrr: 1598, faturamentoLiq: 1457, bolsoAcumAed: 6000 },
    { mes: '2027-03', verbaAed: 2481, appleAed: 1500, metaAed: 881, criativoAed: 100, instalacoes: 1206, novos: 38, novosAcum: 176, ativos: 171, mrr: 1898, faturamentoLiq: 1701, bolsoAcumAed: 7500 },
    { mes: '2027-04', verbaAed: 2646, appleAed: 1667, metaAed: 979, criativoAed: 0, instalacoes: 1305, novos: 41, novosAcum: 216, ativos: 199, mrr: 2209, faturamentoLiq: 1963, bolsoAcumAed: 9000 },
    { mes: '2027-05', verbaAed: 2823, appleAed: 1715, metaAed: 1008, criativoAed: 100, instalacoes: 1333, novos: 42, novosAcum: 258, ativos: 225, mrr: 2507, faturamentoLiq: 2203, bolsoAcumAed: 10500 },
    { mes: '2027-06', verbaAed: 2985, appleAed: 1880, metaAed: 1104, criativoAed: 0, instalacoes: 1428, novos: 45, novosAcum: 303, ativos: 253, mrr: 2814, faturamentoLiq: 2461, bolsoAcumAed: 12000 },
    { mes: '2027-07', verbaAed: 1658, appleAed: 982, metaAed: 577, criativoAed: 100, instalacoes: 877, novos: 28, novosAcum: 330, ativos: 262, mrr: 2911, faturamentoLiq: 2451, bolsoAcumAed: 12000 },
    { mes: '2027-08', verbaAed: 1652, appleAed: 1041, metaAed: 611, criativoAed: 0, instalacoes: 916, novos: 29, novosAcum: 359, ativos: 272, mrr: 3015, faturamentoLiq: 2534, bolsoAcumAed: 12000 },
    { mes: '2027-09', verbaAed: 1707, appleAed: 1013, metaAed: 595, criativoAed: 100, instalacoes: 898, novos: 28, novosAcum: 388, ativos: 280, mrr: 3106, faturamentoLiq: 2596, bolsoAcumAed: 12000 },
    { mes: '2027-10', verbaAed: 1750, appleAed: 1102, metaAed: 647, criativoAed: 0, instalacoes: 957, novos: 30, novosAcum: 418, ativos: 288, mrr: 3196, faturamentoLiq: 2830, bolsoAcumAed: 12000 },
    { mes: '2027-11', verbaAed: 1907, appleAed: 1138, metaAed: 669, criativoAed: 100, instalacoes: 980, novos: 31, novosAcum: 449, ativos: 297, mrr: 3293, faturamentoLiq: 2845, bolsoAcumAed: 12000 },
    { mes: '2027-12', verbaAed: 1917, appleAed: 1208, metaAed: 709, criativoAed: 0, instalacoes: 1025, novos: 32, novosAcum: 481, ativos: 306, mrr: 3398, faturamentoLiq: 2931, bolsoAcumAed: 12000 },
  ],
  base: [
    { mes: '2026-11', verbaAed: 2200, appleAed: 1323, metaAed: 777, criativoAed: 100, instalacoes: 1172, novos: 49, novosAcum: 49, ativos: 75, mrr: 849, faturamentoLiq: 1181, bolsoAcumAed: 1500 },
    { mes: '2026-12', verbaAed: 2296, appleAed: 1446, metaAed: 849, criativoAed: 0, instalacoes: 1264, novos: 53, novosAcum: 101, ativos: 124, mrr: 1408, faturamentoLiq: 1648, bolsoAcumAed: 3000 },
    { mes: '2027-01', verbaAed: 2610, appleAed: 1582, metaAed: 929, criativoAed: 100, instalacoes: 1364, novos: 56, novosAcum: 158, ativos: 175, mrr: 1987, faturamentoLiq: 2131, bolsoAcumAed: 4500 },
    { mes: '2027-02', verbaAed: 2936, appleAed: 1850, metaAed: 1086, criativoAed: 0, instalacoes: 1558, novos: 64, novosAcum: 222, ativos: 231, mrr: 2626, faturamentoLiq: 2699, bolsoAcumAed: 6000 },
    { mes: '2027-03', verbaAed: 3318, appleAed: 2028, metaAed: 1191, criativoAed: 100, instalacoes: 1684, novos: 69, novosAcum: 291, ativos: 290, mrr: 3292, faturamentoLiq: 3257, bolsoAcumAed: 7500 },
    { mes: '2027-04', verbaAed: 3695, appleAed: 2328, metaAed: 1367, criativoAed: 0, instalacoes: 1894, novos: 77, novosAcum: 368, ativos: 355, mrr: 4023, faturamentoLiq: 3897, bolsoAcumAed: 9000 },
    { mes: '2027-05', verbaAed: 4126, appleAed: 2536, metaAed: 1490, criativoAed: 100, instalacoes: 2037, novos: 83, novosAcum: 451, ativos: 422, mrr: 4785, faturamentoLiq: 4531, bolsoAcumAed: 10500 },
    { mes: '2027-06', verbaAed: 4553, appleAed: 2868, metaAed: 1685, criativoAed: 0, instalacoes: 2262, novos: 92, novosAcum: 543, ativos: 495, mrr: 5613, faturamentoLiq: 5247, bolsoAcumAed: 12000 },
    { mes: '2027-07', verbaAed: 3536, appleAed: 2165, metaAed: 1271, criativoAed: 100, instalacoes: 1781, novos: 73, novosAcum: 616, ativos: 546, mrr: 6191, faturamentoLiq: 5469, bolsoAcumAed: 12000 },
    { mes: '2027-08', verbaAed: 3685, appleAed: 2322, metaAed: 1364, criativoAed: 0, instalacoes: 1890, novos: 77, novosAcum: 693, ativos: 600, mrr: 6792, faturamentoLiq: 5957, bolsoAcumAed: 12000 },
    { mes: '2027-09', verbaAed: 4014, appleAed: 2466, metaAed: 1448, criativoAed: 100, instalacoes: 1989, novos: 81, novosAcum: 774, ativos: 655, mrr: 7411, faturamentoLiq: 6452, bolsoAcumAed: 12000 },
    { mes: '2027-10', verbaAed: 4348, appleAed: 2739, metaAed: 1609, criativoAed: 0, instalacoes: 2175, novos: 88, novosAcum: 862, ativos: 713, mrr: 8075, faturamentoLiq: 7204, bolsoAcumAed: 12000 },
    { mes: '2027-11', verbaAed: 4855, appleAed: 2995, metaAed: 1759, criativoAed: 100, instalacoes: 2347, novos: 95, novosAcum: 957, ativos: 775, mrr: 8777, faturamentoLiq: 7944, bolsoAcumAed: 12000 },
    { mes: '2027-12', verbaAed: 5353, appleAed: 3373, metaAed: 1981, criativoAed: 0, instalacoes: 2595, novos: 105, novosAcum: 1062, ativos: 844, mrr: 9557, faturamentoLiq: 8661, bolsoAcumAed: 12000 },
  ],
  otimista: [
    { mes: '2026-11', verbaAed: 2200, appleAed: 1323, metaAed: 777, criativoAed: 100, instalacoes: 1251, novos: 67, novosAcum: 67, ativos: 93, mrr: 1078, faturamentoLiq: 2104, bolsoAcumAed: 1500 },
    { mes: '2026-12', verbaAed: 2918, appleAed: 1838, metaAed: 1080, criativoAed: 0, instalacoes: 1710, novos: 90, novosAcum: 157, ativos: 181, mrr: 2094, faturamentoLiq: 3270, bolsoAcumAed: 3000 },
    { mes: '2027-01', verbaAed: 3703, appleAed: 2270, metaAed: 1333, criativoAed: 100, instalacoes: 2090, novos: 109, novosAcum: 266, ativos: 286, mrr: 3304, faturamentoLiq: 4491, bolsoAcumAed: 4500 },
    { mes: '2027-02', verbaAed: 4526, appleAed: 2852, metaAed: 1675, criativoAed: 0, instalacoes: 2595, novos: 134, novosAcum: 400, ativos: 413, mrr: 4775, faturamentoLiq: 6017, bolsoAcumAed: 6000 },
    { mes: '2027-03', verbaAed: 5554, appleAed: 3436, metaAed: 2018, criativoAed: 100, instalacoes: 3098, novos: 159, novosAcum: 559, ativos: 562, mrr: 6500, faturamentoLiq: 7714, bolsoAcumAed: 7500 },
    { mes: '2027-04', verbaAed: 6698, appleAed: 4220, metaAed: 2478, criativoAed: 0, instalacoes: 3766, novos: 192, novosAcum: 751, ativos: 740, mrr: 8567, faturamentoLiq: 9810, bolsoAcumAed: 9000 },
    { mes: '2027-05', verbaAed: 8110, appleAed: 5047, metaAed: 2964, criativoAed: 100, instalacoes: 4464, novos: 227, novosAcum: 978, ativos: 950, mrr: 10986, faturamentoLiq: 12176, bolsoAcumAed: 10500 },
    { mes: '2027-06', verbaAed: 9705, appleAed: 6114, metaAed: 3591, criativoAed: 0, instalacoes: 5356, novos: 271, novosAcum: 1249, ativos: 1198, mrr: 13860, faturamentoLiq: 15048, bolsoAcumAed: 12000 },
    { mes: '2027-07', verbaAed: 10140, appleAed: 6325, metaAed: 3715, criativoAed: 100, instalacoes: 5532, novos: 280, novosAcum: 1529, ativos: 1450, mrr: 16764, faturamentoLiq: 17228, bolsoAcumAed: 12000 },
    { mes: '2027-08', verbaAed: 11609, appleAed: 7314, metaAed: 4295, criativoAed: 0, instalacoes: 6350, novos: 321, novosAcum: 1849, ativos: 1736, mrr: 20069, faturamentoLiq: 20313, bolsoAcumAed: 12000 },
    { mes: '2027-09', verbaAed: 13688, appleAed: 8560, metaAed: 5028, criativoAed: 100, instalacoes: 7374, novos: 371, novosAcum: 2221, ativos: 2067, mrr: 23884, faturamentoLiq: 23948, bolsoAcumAed: 12000 },
    { mes: '2027-10', verbaAed: 16138, appleAed: 10167, metaAed: 5971, criativoAed: 0, instalacoes: 8683, novos: 436, novosAcum: 2657, ativos: 2453, mrr: 28352, faturamentoLiq: 28526, bolsoAcumAed: 12000 },
    { mes: '2027-11', verbaAed: 19222, appleAed: 12047, metaAed: 7075, criativoAed: 100, instalacoes: 10202, novos: 512, novosAcum: 3169, ativos: 2904, mrr: 33556, faturamentoLiq: 34347, bolsoAcumAed: 12000 },
    { mes: '2027-12', verbaAed: 23145, appleAed: 14581, metaAed: 8564, criativoAed: 0, instalacoes: 12231, novos: 613, novosAcum: 3782, ativos: 3443, mrr: 39789, faturamentoLiq: 40985, bolsoAcumAed: 12000 },
  ],
};
