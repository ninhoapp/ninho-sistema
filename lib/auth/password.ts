/**
 * Ninho · Hash de senha (scrypt nativo, sem dependência externa)
 *
 * Formato armazenado: scrypt$<saltHex>$<hashHex>
 * Server-only.
 */
import { scryptSync, randomBytes, timingSafeEqual } from 'crypto';

const KEYLEN = 64;

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const derived = scryptSync(password, salt, KEYLEN);
  return `scrypt$${salt.toString('hex')}$${derived.toString('hex')}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [scheme, saltHex, hashHex] = stored.split('$');
    if (scheme !== 'scrypt' || !saltHex || !hashHex) return false;
    const salt = Buffer.from(saltHex, 'hex');
    const expected = Buffer.from(hashHex, 'hex');
    const derived = scryptSync(password, salt, expected.length);
    return expected.length === derived.length && timingSafeEqual(expected, derived);
  } catch {
    return false;
  }
}

/**
 * Senha provisória que o painel gera ao criar um perfil (09/11/2026): 12
 * caracteres sem os que confundem (0/O, 1/l/I). O perfil nasce com
 * trocar_senha = true e troca no 1º acesso (/admin/trocar-senha).
 */
export function senhaAleatoria(tamanho = 12): string {
  const alfabeto = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = randomBytes(tamanho);
  let s = '';
  for (let i = 0; i < tamanho; i++) s += alfabeto[bytes[i] % alfabeto.length];
  return s;
}
