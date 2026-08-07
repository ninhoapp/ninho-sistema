/**
 * Nome do cookie de sessão — isolado de propósito.
 *
 * O middleware roda no Edge Runtime, que não tem `node:crypto`. Se ele
 * importasse isso de `lib/auth/session.ts`, o bundle do Edge puxaria junto o
 * HMAC (crypto) e o `next/headers`, e o deploy falha com
 * "The Edge Function middleware is referencing unsupported modules".
 *
 * Este arquivo não pode ganhar import nenhum. É só a constante.
 */
export const SESSION_COOKIE = 'ninho_admin_session';
