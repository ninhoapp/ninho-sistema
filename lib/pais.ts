/**
 * País aproximado de uma conta, pelo fuso que o celular declarou no cadastro
 * (`profiles.timezone`). O painel só separa os dois mercados que importam
 * hoje — Brasil e EUA (campanha do Apple Ads Basic com os dois, 02/11/2026);
 * qualquer outro fuso vira "Outro". Quem mora num país com o celular no fuso
 * de outro sai errado, mas é raro e o fuso aparece no tooltip.
 */
export type Pais = 'Brasil' | 'EUA' | 'Outro';

export const PAISES: Pais[] = ['Brasil', 'EUA', 'Outro'];

// Fusos IANA do Brasil (lista completa da tzdata, inclusive os aliases Brazil/*).
const FUSOS_BRASIL = new Set([
  'America/Sao_Paulo', 'America/Fortaleza', 'America/Bahia', 'America/Recife',
  'America/Maceio', 'America/Belem', 'America/Cuiaba', 'America/Campo_Grande',
  'America/Manaus', 'America/Araguaina', 'America/Porto_Velho', 'America/Rio_Branco',
  'America/Boa_Vista', 'America/Santarem', 'America/Noronha', 'America/Eirunepe',
  'Brazil/East', 'Brazil/West', 'Brazil/Acre', 'Brazil/DeNoronha',
]);

const FUSOS_EUA = new Set([
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'America/Phoenix', 'America/Anchorage', 'America/Juneau', 'America/Sitka',
  'America/Metlakatla', 'America/Yakutat', 'America/Nome', 'America/Adak',
  'America/Boise', 'America/Detroit', 'America/Menominee', 'Pacific/Honolulu',
]);

export function paisDoFuso(fuso: string | null): Pais | null {
  if (!fuso) return null;
  if (FUSOS_BRASIL.has(fuso)) return 'Brasil';
  // Indiana, Kentucky e North_Dakota têm vários fusos, todos nos EUA.
  if (FUSOS_EUA.has(fuso) || /^America\/(Indiana|Kentucky|North_Dakota)\//.test(fuso) || fuso.startsWith('US/')) {
    return 'EUA';
  }
  return 'Outro';
}
