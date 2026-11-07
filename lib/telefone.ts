/**
 * Telefone com país (WhatsApp): lista de países com bandeira e DDI, sem lib.
 * Puro, serve para Server e Client Components. O banco guarda só dígitos,
 * com o DDI na frente (ex.: 5511987654321).
 */
export interface Pais {
  iso: string;
  nome: string;
  ddi: string;
  bandeira: string;
}

export const PAISES: Pais[] = [
  { iso: 'BR', nome: 'Brasil', ddi: '55', bandeira: '🇧🇷' },
  { iso: 'PT', nome: 'Portugal', ddi: '351', bandeira: '🇵🇹' },
  { iso: 'US', nome: 'Estados Unidos', ddi: '1', bandeira: '🇺🇸' },
  { iso: 'CA', nome: 'Canadá', ddi: '1', bandeira: '🇨🇦' },
  { iso: 'AE', nome: 'Emirados Árabes', ddi: '971', bandeira: '🇦🇪' },
  { iso: 'AR', nome: 'Argentina', ddi: '54', bandeira: '🇦🇷' },
  { iso: 'UY', nome: 'Uruguai', ddi: '598', bandeira: '🇺🇾' },
  { iso: 'PY', nome: 'Paraguai', ddi: '595', bandeira: '🇵🇾' },
  { iso: 'CL', nome: 'Chile', ddi: '56', bandeira: '🇨🇱' },
  { iso: 'CO', nome: 'Colômbia', ddi: '57', bandeira: '🇨🇴' },
  { iso: 'PE', nome: 'Peru', ddi: '51', bandeira: '🇵🇪' },
  { iso: 'MX', nome: 'México', ddi: '52', bandeira: '🇲🇽' },
  { iso: 'ES', nome: 'Espanha', ddi: '34', bandeira: '🇪🇸' },
  { iso: 'IT', nome: 'Itália', ddi: '39', bandeira: '🇮🇹' },
  { iso: 'FR', nome: 'França', ddi: '33', bandeira: '🇫🇷' },
  { iso: 'DE', nome: 'Alemanha', ddi: '49', bandeira: '🇩🇪' },
  { iso: 'GB', nome: 'Reino Unido', ddi: '44', bandeira: '🇬🇧' },
  { iso: 'IE', nome: 'Irlanda', ddi: '353', bandeira: '🇮🇪' },
  { iso: 'NL', nome: 'Holanda', ddi: '31', bandeira: '🇳🇱' },
  { iso: 'BE', nome: 'Bélgica', ddi: '32', bandeira: '🇧🇪' },
  { iso: 'CH', nome: 'Suíça', ddi: '41', bandeira: '🇨🇭' },
  { iso: 'JP', nome: 'Japão', ddi: '81', bandeira: '🇯🇵' },
  { iso: 'AU', nome: 'Austrália', ddi: '61', bandeira: '🇦🇺' },
  { iso: 'AO', nome: 'Angola', ddi: '244', bandeira: '🇦🇴' },
  { iso: 'MZ', nome: 'Moçambique', ddi: '258', bandeira: '🇲🇿' },
];

/** O valor do <select> é o ISO (EUA e Canadá têm o mesmo DDI). */
export function ddiDoIso(iso: string): string {
  return (PAISES.find((p) => p.iso === iso) ?? PAISES[0]).ddi;
}

/**
 * Junta país + número em dígitos com DDI. Aceita quem já digitou o DDI
 * (+55 11..., 0055...). Devolve null se não fechar entre `min` e 15 dígitos.
 */
export function juntarTelefone(iso: string, numero: string, min = 10): string | null {
  const ddi = ddiDoIso(iso);
  let d = numero.replace(/\D/g, '');
  if (!d) return null;
  if (d.startsWith('00')) d = d.slice(2);
  const jaTemDdi = numero.trim().startsWith('+') || numero.trim().startsWith('00') || (d.startsWith(ddi) && d.length > (ddi === '55' ? 11 : 10));
  const total = jaTemDdi ? d : ddi + d;
  return total.length >= min && total.length <= 15 ? total : null;
}

/** Separa dígitos guardados em país + número, para preencher o formulário. */
export function separarTelefone(digitos: string | null | undefined): { iso: string; numero: string } {
  const d = (digitos ?? '').replace(/\D/g, '');
  if (!d) return { iso: 'BR', numero: '' };
  const p = [...PAISES].sort((a, b) => b.ddi.length - a.ddi.length).find((x) => d.startsWith(x.ddi));
  if (!p) return { iso: 'BR', numero: d };
  // DDI 1 é dos EUA e do Canadá: fica EUA.
  const iso = p.ddi === '1' ? 'US' : p.iso;
  return { iso, numero: d.slice(p.ddi.length) };
}

/** "+55 11987654321" para mostrar. */
export function telefoneLegivel(digitos: string | null | undefined): string {
  if (!digitos) return '';
  const { iso, numero } = separarTelefone(digitos);
  return `+${ddiDoIso(iso)} ${numero}`;
}
