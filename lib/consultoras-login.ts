/**
 * Ninho · Login da consultora no painel web: e-mail + código de 6 dígitos que
 * ela gera no app (consultora_gerar_codigo_web, migration 00102). Server-only.
 *
 * O banco guarda só o sha256 (hex) do código, com validade de 10 minutos e uso
 * único. Contra adivinhação (revisão do Henrique, 07/11/2026):
 *  - até 5 erros por código: no 5º, os códigos abertos dela são queimados;
 *  - até 10 tentativas por e-mail em 15 minutos (certas ou erradas, e-mail
 *    liberado ou não, para não revelar quem é consultora).
 * Os contadores ficam EM MEMÓRIA do servidor (sem migration). Na Vercel cada
 * instância tem a sua, então o limite real pode ser um pouco maior; o banco
 * ainda segura o resto (código de 6 dígitos, 10 min, até 10 códigos por hora).
 * Para valer entre instâncias falta a coluna
 * `consultora_codigos_web.tentativas integer not null default 0` e um registro
 * de tentativas por e-mail (ex.: tabela `consultora_login_tentativas(email, em)`).
 *
 * A sessão é o mesmo cookie do painel, com um perfil em painel.perfis (papel
 * 'consultora') criado no 1º login e ligado em consultoras.painel_perfil_id.
 */
import { createHash, randomBytes, timingSafeEqual } from 'crypto';
import { appDb, painelDb } from '@/lib/supabase/server';
import { hashPassword } from '@/lib/auth/password';
import { normalizarEmail, EMAIL_RE } from '@/lib/consultoras-regras';
import type { Consultora } from '@/lib/consultoras';
import type { Perfil } from '@/lib/painel/store';

const ERRO = 'E-mail ou código não confere. Confira e tente de novo, ou gere um código novo no app do Ninho.';
const ERRO_LIMITE = 'Muitas tentativas. Espere 15 minutos e gere um código novo no app do Ninho.';

const MAX_ERROS_POR_CODIGO = 5;
const MAX_POR_EMAIL = 10;
const JANELA_EMAIL_MS = 15 * 60 * 1000;

// Contadores em memória (por instância do servidor).
const errosPorCodigo = new Map<string, { n: number; ate: number }>();
const tentativasPorEmail = new Map<string, number[]>();

function limpar(agora: number) {
  if (errosPorCodigo.size > 5000) errosPorCodigo.clear();
  errosPorCodigo.forEach((v, k) => {
    if (v.ate < agora) errosPorCodigo.delete(k);
  });
  if (tentativasPorEmail.size > 5000) tentativasPorEmail.clear();
}

/** Registra a tentativa e diz se o e-mail passou do limite. */
function estourouEmail(email: string, agora: number): boolean {
  limpar(agora);
  const lista = (tentativasPorEmail.get(email) ?? []).filter((t) => agora - t < JANELA_EMAIL_MS);
  lista.push(agora);
  tentativasPorEmail.set(email, lista);
  return lista.length > MAX_POR_EMAIL;
}

function sha256(v: string): string {
  return createHash('sha256').update(v, 'utf8').digest('hex');
}

function iguais(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export async function loginConsultora(
  emailBruto: string,
  codigoBruto: string,
): Promise<{ perfil?: Perfil; error?: string }> {
  const email = normalizarEmail(emailBruto);
  const codigo = codigoBruto.replace(/\D/g, '');
  if (!EMAIL_RE.test(email) || email.length > 254 || codigo.length !== 6) return { error: ERRO };
  if (estourouEmail(email, Date.now())) return { error: ERRO_LIMITE };

  const sb = appDb();
  const { data: cData, error: cErr } = await sb
    .from('consultoras')
    .select('*')
    .eq('email_liberado', email)
    .not('profile_id', 'is', null)
    .in('estado', ['ativa', 'pausada'])
    .maybeSingle();
  if (cErr) throw new Error(`consultoras: ${cErr.message}`);
  const c = cData as Consultora | null;
  if (!c) return { error: ERRO };

  const agora = new Date().toISOString();
  const { data: codigos, error: kErr } = await sb
    .from('consultora_codigos_web')
    .select('id,codigo_hash')
    .eq('consultora_id', c.id)
    .is('usado_em', null)
    .gt('expira_em', agora)
    .order('criado_em', { ascending: false })
    .limit(5);
  if (kErr) throw new Error(`consultora_codigos_web: ${kErr.message}`);

  const abertos = (codigos as { id: string; codigo_hash: string }[] | null) ?? [];
  const hash = sha256(codigo);
  const certo = abertos.find((k) => iguais(k.codigo_hash, hash));
  if (!certo) {
    // Errou: conta 1 erro em cada código aberto dela (não dá para saber qual
    // ela tentou). No 5º erro de algum, queima os abertos.
    const ate = Date.now() + 15 * 60 * 1000;
    let estourou = false;
    for (const k of abertos) {
      const v = errosPorCodigo.get(k.id) ?? { n: 0, ate };
      v.n += 1;
      errosPorCodigo.set(k.id, v);
      if (v.n >= MAX_ERROS_POR_CODIGO) estourou = true;
    }
    if (estourou) {
      await sb.from('consultora_codigos_web').update({ usado_em: agora }).eq('consultora_id', c.id).is('usado_em', null);
      return { error: ERRO_LIMITE };
    }
    return { error: ERRO };
  }

  // Uso único de verdade: só passa quem conseguir marcar como usado.
  const { data: marcado } = await sb
    .from('consultora_codigos_web')
    .update({ usado_em: agora })
    .eq('id', certo.id)
    .is('usado_em', null)
    .select('id');
  if (!marcado || marcado.length === 0) return { error: ERRO };
  errosPorCodigo.delete(certo.id);

  const perfil = await garantirPerfil(c);
  if (!perfil) return { error: 'Seu acesso ao painel foi desligado. Fale com o Ninho pelo botão Ajuda do app.' };
  return { perfil };
}

/** Perfil do painel (papel consultora) desta consultora; cria no 1º login. */
async function garantirPerfil(c: Consultora): Promise<Perfil | null> {
  const pdb = painelDb();
  if (c.painel_perfil_id) {
    const { data } = await pdb.from('perfis').select('*').eq('id', c.painel_perfil_id).maybeSingle();
    const p = data as Perfil | null;
    if (p) {
      if (!p.active) return null;
      if (p.display_name !== (c.nome ?? p.display_name)) {
        await pdb.from('perfis').update({ display_name: c.nome, updated_at: new Date().toISOString() }).eq('id', p.id);
        p.display_name = c.nome ?? p.display_name;
      }
      return p;
    }
  }
  // Sem senha utilizável: ela só entra pelo código do app.
  const { data, error } = await pdb
    .from('perfis')
    .insert({
      username: `consultora-${c.id}`,
      email: null,
      password_hash: hashPassword(randomBytes(32).toString('hex')),
      role: 'consultora',
      display_name: c.nome || 'Consultora',
      commission_type: 'percentual',
      commission_percent: 0,
    })
    .select('*')
    .single();
  if (error) throw new Error(`painel.perfis (consultora): ${error.message}`);
  const novo = data as Perfil;
  await appDb().from('consultoras').update({ painel_perfil_id: novo.id, atualizado_em: new Date().toISOString() }).eq('id', c.id);
  return novo;
}
