/** Motivos do e-mail "por que você não assinou?" (campanha motivo_nao_assinou
 *  do enviar-comunicado, Ninho-expo). Os códigos são os da coluna
 *  atendimento_resgates.motivo, os mesmos da Nina. Espelho de MOTIVOS_EMAIL
 *  em supabase/functions/enviar-comunicado/index.ts: mudou lá, muda aqui. */
export const MOTIVOS = [
  { codigo: 'preco', pt: 'Achei caro', en: 'Too expensive', es: 'Me pareció caro' },
  { codigo: 'funcionalidade', pt: 'Faltou uma função', en: 'Missing a feature', es: 'Faltó una función' },
  { codigo: 'problema', pt: 'Algo não funcionou', en: "Something didn't work", es: 'Algo no funcionó' },
  { codigo: 'nao_precisa', pt: 'Não preciso mais', en: "I don't need it anymore", es: 'Ya no lo necesito' },
  { codigo: 'outro', pt: 'Outro motivo', en: 'Another reason', es: 'Otro motivo' },
] as const;

export type CodigoMotivo = (typeof MOTIVOS)[number]['codigo'];

export function ehMotivo(r: string | undefined | null): r is CodigoMotivo {
  return MOTIVOS.some((m) => m.codigo === r);
}

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
