/** Dicionário pt do painel da consultora. É também o TIPO dos outros idiomas. */
import { geral } from './geral';
import { pagina } from './pagina';
import { acoes } from './acoes';
import { rotina } from './rotina';
import { manual } from './manual';

export const pt = { geral, pagina, acoes, rotina, manual };
export type Dicionario = typeof pt;
