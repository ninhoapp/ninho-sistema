/**
 * O menu do painel organizado pelos setores do prédio (pedido do dono em
 * 18/10/2026: "o prédio não é uma aba a mais, o painel inteiro se organiza
 * pelos setores"). Cada aba antiga mora no setor dono dela; nenhuma tela foi
 * apagada, só mudou de lugar no menu.
 *
 * Também define os andares do prédio em corte: setores parecidos dividem o
 * mesmo andar. Pode ser importado por client components (não lê o banco).
 */

export interface AbaMenu {
  href: string;
  label: string;
}

export interface GrupoMenu {
  /** id do setor no organograma (ou 'conta' para o fim do menu). */
  id: string;
  nome: string;
  cor: string;
  /** Página do setor no prédio (equipe, atividade e mural do setor). */
  equipe?: string;
  abas: AbaMenu[];
}

export const COR_SETOR: Record<string, string> = {
  dir: '#7C5CD6', cre: '#4CAF74', fin: '#F7A83C',
  ate: '#3FB5AC', eng: '#655C7A', ven: '#A3A3AC', conta: '#9F86E0',
};

/**
 * De baixo para cima. Setores relacionados dividem o andar. Em 19/10/2026 a
 * empresa foi enxugada: Crescimento juntou Marketing e Aquisição, e Produto
 * (id 'eng', para o histórico continuar) juntou Engenharia e Design.
 */
export const ANDARES: { nome: string; setores: string[] }[] = [
  { nome: 'Térreo', setores: ['ate', 'ven'] },
  { nome: '1º andar', setores: ['eng'] },
  { nome: '2º andar', setores: ['cre'] },
  { nome: 'Cobertura', setores: ['dir', 'fin'] },
];

export function andarDe(setorId: string): string {
  return ANDARES.find((a) => a.setores.includes(setorId))?.nome ?? '';
}

export const MENU_ADMIN: GrupoMenu[] = [
  {
    id: 'dir', nome: 'Diretoria', cor: COR_SETOR.dir, equipe: '/admin/empresa/dir',
    abas: [
      { href: '/admin/visao-geral', label: 'Visão geral' },
      { href: '/admin/analise', label: 'Análise de dados' },
      { href: '/admin/teste-paywall', label: 'Teste de paywall' },
      { href: '/admin/usuarios', label: 'Usuários ativos' },
    ],
  },
  {
    id: 'cre', nome: 'Crescimento', cor: COR_SETOR.cre, equipe: '/admin/empresa/cre',
    abas: [{ href: '/admin/crescimento', label: 'KPI de crescimento' }],
  },
  {
    id: 'fin', nome: 'Financeiro', cor: COR_SETOR.fin, equipe: '/admin/empresa/fin',
    abas: [
      { href: '/admin/faturamento', label: 'Faturamento e lucro' },
      { href: '/admin/despesas', label: 'Despesas' },
      { href: '/admin/repasses', label: 'Repasses' },
    ],
  },
  {
    id: 'ate', nome: 'Atendimento', cor: COR_SETOR.ate, equipe: '/admin/empresa/ate',
    abas: [{ href: '/admin/atendimento', label: 'Atendimento no app' }],
  },
  {
    id: 'eng', nome: 'Produto', cor: COR_SETOR.eng, equipe: '/admin/empresa/eng',
    abas: [{ href: '/admin/versoes', label: 'Versões' }],
  },
  {
    id: 'ven', nome: 'Vendas', cor: COR_SETOR.ven, equipe: '/admin/empresa/ven',
    abas: [
      { href: '/admin/leads', label: 'Leads' },
      { href: '/admin/conversores', label: 'Conversores' },
      { href: '/admin/conversoes', label: 'Conversões' },
    ],
  },
  {
    id: 'conta', nome: 'Conta', cor: COR_SETOR.conta,
    abas: [
      { href: '/admin/perfis', label: 'Gerenciar perfis' },
      { href: '/admin/conta', label: 'Minha conta' },
    ],
  },
];

/** O grupo dono de um endereço (para a faixa de abas no topo da tela). */
export function grupoDe(pathname: string): GrupoMenu | null {
  for (const g of MENU_ADMIN) {
    if (g.equipe && pathname === g.equipe) return g;
    if (g.abas.some((a) => pathname === a.href || pathname.startsWith(a.href + '/'))) return g;
  }
  return null;
}
