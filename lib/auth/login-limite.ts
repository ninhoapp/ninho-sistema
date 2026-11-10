/**
 * Ninho · Trava contra adivinhação de senha no login do painel.
 * Server-only. Auditoria de segurança de 10/11/2026.
 *
 * O login do painel (usuário + senha) não contava erros: dava para tentar
 * senhas sem parar, e o painel enxerga os dados de todas as famílias.
 *
 * Conta só as senhas ERRADAS, numa janela de 15 minutos:
 *  - 8 erros do mesmo usuário vindos do mesmo IP;
 *  - 30 erros do mesmo IP (qualquer usuário);
 *  - 40 erros do mesmo usuário (qualquer IP).
 * Passou de um deles, o login responde "Muitas tentativas" até a janela
 * andar. Entrar com a senha certa zera a conta do usuário naquele IP.
 * Quem acerta a senha não percebe nada.
 *
 * Os contadores ficam EM MEMÓRIA do servidor, como em lib/consultoras-login.ts.
 * Na Vercel cada instância tem a sua, então o limite real pode ser um pouco
 * maior. Para valer entre instâncias falta uma tabela no schema painel
 * (ex.: `painel.login_tentativas(chave text, em timestamptz)`).
 */
const JANELA_MS = 15 * 60 * 1000;
const MAX_USUARIO_IP = 8;
const MAX_IP = 30;
const MAX_USUARIO = 40;

const falhas = new Map<string, number[]>();

function recentes(chave: string, agora: number): number[] {
  return (falhas.get(chave) ?? []).filter((t) => agora - t < JANELA_MS);
}

function chaves(login: string, ip: string): { chave: string; max: number }[] {
  const u = login.trim().toLowerCase().slice(0, 254);
  const lista = [{ chave: `u:${u}`, max: MAX_USUARIO }];
  if (ip) {
    lista.push({ chave: `i:${ip}`, max: MAX_IP });
    lista.push({ chave: `ui:${u}|${ip}`, max: MAX_USUARIO_IP });
  }
  return lista;
}

/** true = já errou demais; não confira a senha agora. */
export function loginBloqueado(login: string, ip: string, agora = Date.now()): boolean {
  return chaves(login, ip).some(({ chave, max }) => recentes(chave, agora).length >= max);
}

export function registrarFalhaDeLogin(login: string, ip: string, agora = Date.now()): void {
  if (falhas.size > 5000) falhas.clear();
  for (const { chave } of chaves(login, ip)) {
    const lista = recentes(chave, agora);
    lista.push(agora);
    falhas.set(chave, lista);
  }
}

/** Senha certa: zera os erros deste usuário neste IP (os do IP inteiro ficam). */
export function limparFalhasDeLogin(login: string, ip: string): void {
  const u = login.trim().toLowerCase().slice(0, 254);
  if (ip) falhas.delete(`ui:${u}|${ip}`);
}

export const ERRO_MUITAS_TENTATIVAS = 'Muitas tentativas. Espere 15 minutos e tente de novo.';
