/**
 * Regra de senha forte do Ninho (pedido do dono, 09/11/2026: o painel aceitava
 * "123456789"). Vale para TODA senha que alguém escolhe no painel: criar perfil,
 * redefinir, trocar a provisória e trocar a própria. Mesma regra no app
 * (Ninho-expo src/utils/senhaForte.ts) e nas funções do servidor que gravam senha.
 *
 * Pura e sem dependência: roda no servidor (onde vale) e no navegador (só para
 * mostrar os critérios enquanto a pessoa digita).
 */

export const SENHA_MIN = 10;

export interface CriterioSenha {
  id: string;
  texto: string;
  ok: boolean;
}

/** Senhas que aparecem em todo vazamento: recusadas mesmo cumprindo o resto. */
const COMUNS = [
  'senha', 'password', 'qwerty', 'asdfgh', 'zxcvbn', 'abc123', 'admin', 'ninho', 'teste', 'test',
  'iloveyou', 'brasil', 'mudar', 'trocar', 'welcome', 'letmein', 'master', 'dragon', 'monkey',
];

const SEQUENCIAS = ['0123456789', 'abcdefghijklmnopqrstuvwxyz', 'qwertyuiop', 'asdfghjkl', 'zxcvbnm'];

function temSequencia(s: string, tamanho = 4): boolean {
  const t = s.toLowerCase();
  for (const seq of SEQUENCIAS) {
    const ida = seq;
    const volta = seq.split('').reverse().join('');
    for (const base of [ida, volta]) {
      for (let i = 0; i + tamanho <= base.length; i++) {
        if (t.includes(base.slice(i, i + tamanho))) return true;
      }
    }
  }
  return false;
}

function semAcento(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/** Pedaços pessoais (usuário, nome, e-mail) com 3+ letras que não podem estar na senha. */
function pedacosPessoais(pessoais: (string | null | undefined)[]): string[] {
  const out = new Set<string>();
  for (const p of pessoais) {
    if (!p) continue;
    for (const parte of semAcento(p).split(/[^a-z0-9]+/)) if (parte.length >= 3) out.add(parte);
  }
  return Array.from(out);
}

export function criteriosSenha(senha: string, pessoais: (string | null | undefined)[] = []): CriterioSenha[] {
  const t = semAcento(senha);
  return [
    { id: 'tamanho', texto: `Pelo menos ${SENHA_MIN} caracteres`, ok: senha.length >= SENHA_MIN },
    { id: 'maiuscula', texto: 'Uma letra maiúscula', ok: /[A-Z]/.test(senha) },
    { id: 'minuscula', texto: 'Uma letra minúscula', ok: /[a-z]/.test(senha) },
    { id: 'numero', texto: 'Um número', ok: /[0-9]/.test(senha) },
    { id: 'simbolo', texto: 'Um símbolo (ex.: ! @ # $ % & *)', ok: /[^A-Za-z0-9]/.test(senha) },
    {
      id: 'padrao',
      texto: 'Sem sequência (1234, abcd, qwer), sem repetir 3 vezes o mesmo caractere e sem senha comum',
      ok: senha.length > 0 && !temSequencia(senha) && !/(.)\1\1/.test(senha) && !COMUNS.some((c) => t.includes(c)),
    },
    {
      id: 'pessoal',
      texto: 'Sem o seu nome, usuário ou e-mail',
      ok: senha.length > 0 && !pedacosPessoais(pessoais).some((p) => t.includes(p)),
    },
  ];
}

/** null = senha forte; senão, a mensagem do 1º critério que falhou. */
export function erroSenhaFraca(senha: string, pessoais: (string | null | undefined)[] = []): string | null {
  if (senha.length > 128) return 'A senha pode ter no máximo 128 caracteres.';
  const falhou = criteriosSenha(senha, pessoais).find((c) => !c.ok);
  return falhou ? `Senha fraca. Falta: ${falhou.texto.toLowerCase()}.` : null;
}
