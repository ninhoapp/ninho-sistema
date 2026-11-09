/**
 * Ninho · Hash de senha (scrypt nativo, sem dependência externa)
 *
 * Formato armazenado: scrypt$<saltHex>$<hashHex>
 * Server-only.
 */
import { scryptSync, randomBytes, timingSafeEqual } from 'crypto';
import { erroSenhaFraca } from './senha-forte';

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
 * Senha provisória que o painel gera ao criar um perfil (09/11/2026): 14
 * caracteres com maiúscula, minúscula, número e símbolo, sem os que confundem
 * (0/O, 1/l/I). Sempre passa na regra de senha forte (lib/auth/senha-forte.ts).
 * O perfil nasce com trocar_senha = true e troca no 1º acesso.
 */
export function senhaAleatoria(tamanho = 14): string {
  const grupos = ['ABCDEFGHJKLMNPQRSTUVWXYZ', 'abcdefghjkmnpqrstuvwxyz', '23456789', '!@#$%&*?'];
  const todos = grupos.join('');
  for (;;) {
    const bytes = randomBytes(tamanho);
    const chars = grupos.map((g, i) => g[bytes[i] % g.length]);
    for (let i = grupos.length; i < tamanho; i++) chars.push(todos[bytes[i] % todos.length]);
    // embaralha (Fisher-Yates com bytes novos)
    const mix = randomBytes(tamanho);
    for (let i = chars.length - 1; i > 0; i--) {
      const j = mix[i] % (i + 1);
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }
    const s = chars.join('');
    if (!erroSenhaFraca(s)) return s;
  }
}
