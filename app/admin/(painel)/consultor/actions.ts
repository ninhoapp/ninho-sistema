'use server';

/**
 * Ações do dono na área /admin/consultor. Tudo grava direto nas tabelas do
 * programa (service role) e vale no app na próxima vez que ele perguntar ao
 * servidor: o app lê consultora_minha_conta, consultoras_da_lista e
 * consultora_familias toda vez que a tela abre. Nada depende de build.
 *
 * Cada ação volta para a mesma tela com ?ok= ou ?erro= (sem estado no cliente).
 */
import { redirect } from 'next/navigation';
import { revalidatePath, revalidateTag } from 'next/cache';
import { requireRole } from '@/lib/auth/guard';
import { verifyPassword } from '@/lib/auth/password';
import { getPerfil, listPerfis } from '@/lib/painel/store';
import { appDb, painelDb } from '@/lib/supabase/server';
import {
  getConsultora,
  listConsultoras,
  baseComissoesAgora,
  CONSULTORAS_TAG,
  totalDe,
  subirFoto,
  fotoValida,
  apagarFoto,
} from '@/lib/consultoras';
import {
  CODIGO_RE,
  EMAIL_RE,
  codigoDoNome,
  normalizarCodigo,
  normalizarEmail,
  normalizarInstagram,
  normalizarWhatsapp,
} from '@/lib/consultoras-regras';

const BASE = '/admin/consultor';

function volta(params: Record<string, string | null | undefined>, destino: string = BASE): never {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) q.set(k, v);
  revalidateTag(CONSULTORAS_TAG);
  revalidatePath(BASE);
  // Repasses (Financeiro) mostra as mesmas comissões: limpa as duas telas.
  revalidatePath('/admin/repasses');
  redirect(`${destino}?${q.toString()}`);
}

// ── Excluir consultora (senha do admin) ───────────────────
export interface ExcluirState {
  error?: string;
}

/**
 * Exclui de verdade só quem não tem histórico: sem vínculo com família (nem
 * removido: é a prova do consentimento), sem aceite de contato, sem pagamento
 * e sem família atribuída para comissão. Com histórico, explica e sugere
 * Pausar. Pede a senha de login do admin, conferida no servidor.
 */
export async function excluirConsultora(_prev: ExcluirState, fd: FormData): Promise<ExcluirState> {
  const session = requireRole('admin');
  const id = txt(fd, 'id');
  // O campo da senha tem nome aleatório (o navegador não preenche sozinho).
  const campo = txt(fd, 'campo');
  const senha = /^k[a-z0-9]{6,20}$/.test(campo) ? String(fd.get(campo) ?? '') : '';
  if (!senha) return { error: 'Digite sua senha de login para confirmar.' };
  const perfil = await getPerfil(session.sub);
  if (!perfil || !verifyPassword(senha, perfil.password_hash)) return { error: 'Senha incorreta. Nada foi excluído.' };

  const c = await getConsultora(id);
  if (!c) return { error: 'Consultora não encontrada.' };

  const sb = appDb();
  const contar = async (tabela: string) => {
    const { count, error } = await sb.from(tabela).select('consultora_id', { count: 'exact', head: true }).eq('consultora_id', c.id);
    if (error) throw new Error(`${tabela}: ${error.message}`);
    return count ?? 0;
  };
  let uso: number[];
  try {
    uso = await Promise.all([
      contar('consultora_vinculos'),
      contar('consultora_contato_aceites'),
      contar('consultora_pagamentos'),
      contar('consultora_indicacoes'),
    ]);
  } catch (e) {
    console.error('[consultor] excluir: conferência falhou:', e instanceof Error ? e.message : e);
    return { error: 'Não consegui conferir o histórico dela agora. Nada foi excluído.' };
  }
  const [vinculos, aceites, pagamentos, familias] = uso;
  const motivos = [
    vinculos ? `${vinculos} vínculo(s) com família (inclusive já removidos: é a prova do consentimento)` : '',
    aceites ? `${aceites} aceite(s) de contato pela lista do app` : '',
    pagamentos ? `${pagamentos} pagamento(s) de comissão` : '',
    familias ? `${familias} família(s) atribuída(s) para comissão` : '',
  ].filter(Boolean);
  if (motivos.length) {
    return { error: `Não dá para excluir: ela tem ${motivos.join(', ')}. Use Pausar: ela sai da lista e perde a rotina das famílias, e o histórico fica guardado.` };
  }

  const { error } = await sb.from('consultoras').delete().eq('id', c.id);
  if (error) {
    return { error: error.code === '23503' ? 'Ela tem histórico ligado e não pode ser excluída. Use Pausar.' : error.message };
  }
  await Promise.all([apagarFoto(c.foto_url), apagarFoto(c.foto_pendente_url)]);
  if (c.painel_perfil_id) {
    const { error: e2 } = await painelDb().from('perfis').delete().eq('id', c.painel_perfil_id).eq('role', 'consultora');
    if (e2) console.error('[consultor] excluir perfil do painel falhou:', e2.message);
  }
  volta({ aba: 'consultoras', ok: `${c.nome ?? 'Consultora'} excluída.` });
}

function txt(fd: FormData, k: string): string {
  return String(fd.get(k) ?? '').trim();
}

const agora = () => new Date().toISOString();

/**
 * Códigos já usados por consultoras E por parceiros: o clique do /c/ e do /r/
 * fica na mesma tabela (painel.link_clicks.promo_code), então não pode repetir.
 */
async function codigosEmUso(): Promise<Set<string>> {
  const [cs, ps] = await Promise.all([listConsultoras(), listPerfis()]);
  return new Set([
    ...cs.map((c) => c.codigo).filter((x): x is string => !!x),
    ...ps.map((p) => (p.promo_code ?? '').toUpperCase()).filter(Boolean),
  ]);
}

/** Código livre a partir de um desejado: NATHALIA, NATHALIA2, NATHALIA3... */
async function codigoLivre(desejado: string): Promise<string | null> {
  const base = normalizarCodigo(desejado).slice(0, 18);
  if (base.length < 2) return null;
  const usados = await codigosEmUso();
  if (!usados.has(base)) return base;
  for (let i = 2; i < 100; i++) if (!usados.has(`${base}${i}`)) return `${base}${i}`;
  return null;
}

// ── Liberar (cadastrar) ───────────────────────────────────
export async function liberarConsultora(fd: FormData) {
  requireRole('admin');
  const nome = txt(fd, 'nome');
  const email = normalizarEmail(txt(fd, 'email'));
  const igBruto = txt(fd, 'instagram');
  const instagram = igBruto ? normalizarInstagram(igBruto) : null;
  const codigoDigitado = normalizarCodigo(txt(fd, 'codigo'));
  const indicadaPor = txt(fd, 'indicada_por') || null;
  const aba = 'consultoras';

  if (!EMAIL_RE.test(email)) volta({ aba, erro: 'Coloque o e-mail que ela vai usar no app.' });
  if (nome.length < 2 || nome.length > 80) volta({ aba, erro: 'Coloque o nome (2 a 80 letras).' });
  if (igBruto && !instagram) volta({ aba, erro: 'Instagram inválido. Use só o @ dela.' });
  if (codigoDigitado && !CODIGO_RE.test(codigoDigitado)) volta({ aba, erro: 'Código inválido: de 2 a 20 letras ou números, sem espaço.' });

  const todas = await listConsultoras();
  if (todas.some((c) => c.email_liberado === email)) volta({ aba, erro: 'Esse e-mail já está liberado.' });
  if (codigoDigitado && (await codigosEmUso()).has(codigoDigitado)) volta({ aba, erro: `O código ${codigoDigitado} já existe (consultora ou parceiro). Escolha outro.` });
  if (indicadaPor && !todas.some((c) => c.id === indicadaPor)) volta({ aba, erro: 'A consultora de "indicada por" não existe mais.' });

  const codigo = codigoDigitado || (await codigoLivre(codigoDoNome(nome)));
  if (!codigo) volta({ aba, erro: 'Não consegui montar um código pelo nome. Digite um código.' });

  const { data, error } = await appDb()
    .from('consultoras')
    .insert({
      nome,
      email_liberado: email,
      codigo,
      instagram,
      indicada_por: indicadaPor,
      estado: 'esperando',
      liberada_em: agora(),
    })
    .select('id')
    .single();
  if (error) volta({ aba, erro: error.code === '23505' ? 'E-mail ou código já usado.' : error.message });
  volta({ aba, id: (data as { id: string }).id, ok: `E-mail liberado. Quando ${nome.split(' ')[0]} entrar no app com ${email} (confirmado), vira consultora.` });
}

// ── Estado ────────────────────────────────────────────────
export async function pausarConsultora(fd: FormData) {
  requireRole('admin');
  const id = txt(fd, 'id');
  const { error } = await appDb()
    .from('consultoras')
    .update({ estado: 'pausada', na_lista: false, pausada_em: agora(), atualizado_em: agora() })
    .eq('id', id);
  if (error) volta({ aba: 'consultoras', id, erro: error.message });
  volta({ aba: 'consultoras', id, ok: 'Pausada: perdeu a rotina das famílias e saiu da lista do app. A comissão das famílias que já assinam continua.' });
}

export async function reativarConsultora(fd: FormData) {
  requireRole('admin');
  const c = await getConsultora(txt(fd, 'id'));
  if (!c) volta({ aba: 'consultoras', erro: 'Consultora não encontrada.' });
  const { error } = await appDb()
    .from('consultoras')
    .update({ estado: c.profile_id ? 'ativa' : 'esperando', pausada_em: null, atualizado_em: agora() })
    .eq('id', c.id);
  if (error) volta({ aba: 'consultoras', id: c.id, erro: error.message });
  volta({ aba: 'consultoras', id: c.id, ok: c.profile_id ? 'Reativada.' : 'Reativada: volta a esperar o cadastro no app.' });
}

export async function alternarLista(fd: FormData) {
  requireRole('admin');
  const c = await getConsultora(txt(fd, 'id'));
  const ret = txt(fd, 'aba') || 'consultoras';
  if (!c) volta({ aba: ret, erro: 'Consultora não encontrada.' });
  const ligar = !c.na_lista;
  if (ligar) {
    // Dono (07/11/2026): pode ligar antes de ela criar a conta; o perfil fica
    // aprovado e ela aparece no app assim que ativar. Só a pausada não entra.
    if (c.estado === 'pausada') volta({ aba: ret, id: c.id, erro: 'Consultora pausada não entra na lista. Reative primeiro.' });
    if (!c.nome || !(c.whatsapp || c.instagram)) volta({ aba: ret, id: c.id, erro: 'Falta completar o perfil público (nome e WhatsApp ou Instagram).' });
  }
  const { error } = await appDb()
    .from('consultoras')
    .update({
      na_lista: ligar,
      // Ligar a chave é o dono aprovando o perfil como está.
      ...(ligar && !c.perfil_aprovado_em ? { perfil_aprovado_em: agora() } : {}),
      atualizado_em: agora(),
    })
    .eq('id', c.id);
  if (error) volta({ aba: ret, id: c.id, erro: error.message });
  volta({
    aba: ret,
    id: c.id,
    ok: ligar
      ? `${c.nome?.split(' ')[0]} pode aparecer em "Encontrar consultora" assim que ativar a conta (até 10; quem mais traz assinantes vem primeiro).`
      : `${c.nome?.split(' ')[0]} saiu da lista do app.`,
  });
}

// ── Perfil público: texto e foto ──────────────────────────
export async function decidirBio(fd: FormData) {
  requireRole('admin');
  const c = await getConsultora(txt(fd, 'id'));
  const ret = txt(fd, 'aba') || 'pedidos';
  if (!c || !c.bio_pendente) volta({ aba: ret, erro: 'Não há texto novo para decidir.' });
  const aprovar = txt(fd, 'decisao') === 'aprovar';
  const { error } = await appDb()
    .from('consultoras')
    .update(
      aprovar
        ? { bio: c.bio_pendente, bio_pendente: null, perfil_aprovado_em: agora(), atualizado_em: agora() }
        : { bio_pendente: null, atualizado_em: agora() },
    )
    .eq('id', c.id);
  if (error) volta({ aba: ret, id: c.id, erro: error.message });
  volta({ aba: ret, id: c.id, ok: aprovar ? 'Texto aprovado: já aparece no app.' : 'Texto recusado. Fica o anterior.' });
}

export async function decidirFoto(fd: FormData) {
  requireRole('admin');
  const c = await getConsultora(txt(fd, 'id'));
  const ret = txt(fd, 'aba') || 'pedidos';
  if (!c || !c.foto_pendente_url) volta({ aba: ret, erro: 'Não há foto nova para decidir.' });
  const aprovar = txt(fd, 'decisao') === 'aprovar';
  if (aprovar && !fotoValida(c.foto_pendente_url)) volta({ aba: ret, id: c.id, erro: 'Foto fora do bucket consultoras-fotos: não dá para aprovar.' });
  const { error } = await appDb()
    .from('consultoras')
    .update(
      aprovar
        ? { foto_url: c.foto_pendente_url, foto_pendente_url: null, perfil_aprovado_em: agora(), atualizado_em: agora() }
        : { foto_pendente_url: null, atualizado_em: agora() },
    )
    .eq('id', c.id);
  if (error) volta({ aba: ret, id: c.id, erro: error.message });
  // Recusou: some o arquivo novo. Aprovou: some a foto antiga.
  await apagarFoto(aprovar ? c.foto_url : c.foto_pendente_url);
  volta({ aba: ret, id: c.id, ok: aprovar ? 'Foto aprovada: já aparece no app.' : 'Foto recusada. Fica a anterior.' });
}

/** O dono sobe a foto da consultora: vale na hora (é ele aprovando). */
export async function subirFotoDono(fd: FormData) {
  requireRole('admin');
  const id = txt(fd, 'id');
  const c = await getConsultora(id);
  if (!c) volta({ aba: 'consultoras', erro: 'Consultora não encontrada.' });
  const arquivo = fd.get('foto');
  if (!(arquivo instanceof File) || arquivo.size === 0) volta({ aba: 'consultoras', id, erro: 'Escolha uma foto.' });
  const up = await subirFoto(arquivo, 'aprovadas');
  if (!up.url) volta({ aba: 'consultoras', id, erro: up.error });
  const { error } = await appDb().from('consultoras').update({ foto_url: up.url, atualizado_em: agora() }).eq('id', id);
  if (error) {
    await apagarFoto(up.url);
    volta({ aba: 'consultoras', id, erro: error.message });
  }
  await apagarFoto(c.foto_url);
  volta({ aba: 'consultoras', id, ok: 'Foto trocada.' });
}

// ── Ligar a uma conta existente (ex.: e-mail oculto da Apple) ──
export async function ligarConta(fd: FormData) {
  requireRole('admin');
  const id = txt(fd, 'id');
  const alvo = txt(fd, 'conta');
  const c = await getConsultora(id);
  if (!c) volta({ aba: 'consultoras', erro: 'Consultora não encontrada.' });
  if (c.profile_id) volta({ aba: 'consultoras', id, erro: 'Ela já está ligada a uma conta do app.' });

  let profileId: string | null = null;
  if (/^[0-9a-f-]{36}$/i.test(alvo)) {
    const { data } = await appDb().from('profiles').select('id').eq('id', alvo).is('deleted_at', null).maybeSingle();
    profileId = (data as { id: string } | null)?.id ?? null;
  } else if (EMAIL_RE.test(normalizarEmail(alvo))) {
    const { data } = await appDb().from('usuarios_admin').select('id').eq('email', normalizarEmail(alvo)).limit(2);
    const rows = (data as { id: string }[] | null) ?? [];
    profileId = rows.length === 1 ? rows[0].id : null;
  }
  if (!profileId) volta({ aba: 'consultoras', id, erro: 'Não achei essa conta no app. Use o e-mail da conta (como aparece em Usuários ativos) ou o id.' });

  const { error } = await appDb()
    .from('consultoras')
    .update({
      profile_id: profileId,
      estado: c.estado === 'esperando' ? 'ativa' : c.estado,
      ativada_em: c.ativada_em ?? agora(),
      atualizado_em: agora(),
    })
    .eq('id', c.id)
    .is('profile_id', null);
  if (error) volta({ aba: 'consultoras', id, erro: error.code === '23505' ? 'Essa conta já é de outra consultora.' : error.message });
  volta({ aba: 'consultoras', id, ok: 'Conta ligada. Na próxima vez que ela abrir o app, entra como consultora.' });
}

export async function trocarIndicadaPor(fd: FormData) {
  requireRole('admin');
  const id = txt(fd, 'id');
  const nova = txt(fd, 'indicada_por') || null;
  if (nova === id) volta({ aba: 'consultoras', id, erro: 'Ela não pode ter sido indicada por ela mesma.' });
  if (nova) {
    const outra = await getConsultora(nova);
    if (!outra) volta({ aba: 'consultoras', id, erro: 'Consultora não encontrada.' });
    if (outra.indicada_por === id) volta({ aba: 'consultoras', id, erro: `${outra.nome} foi indicada por ela: não dá para inverter.` });
  }
  const { error } = await appDb().from('consultoras').update({ indicada_por: nova, atualizado_em: agora() }).eq('id', id);
  if (error) volta({ aba: 'consultoras', id, erro: error.message });
  volta({ aba: 'consultoras', id, ok: '"Indicada por" atualizado. Vale só para as famílias atribuídas daqui para frente.' });
}

// ── Pedidos ───────────────────────────────────────────────
export async function decidirPedido(fd: FormData) {
  requireRole('admin');
  const id = txt(fd, 'id');
  const aprovar = txt(fd, 'decisao') === 'aprovar';
  const { data } = await appDb().from('consultora_pedidos').select('*').eq('id', id).eq('status', 'pendente').maybeSingle();
  const p = data as { id: string; nome: string; email: string; instagram: string | null; whatsapp: string | null; indicada_por: string | null } | null;
  if (!p) volta({ aba: 'pedidos', erro: 'Pedido já decidido ou não encontrado.' });

  if (!aprovar) {
    await appDb().from('consultora_pedidos').update({ status: 'recusado', decidido_em: agora() }).eq('id', id);
    volta({ aba: 'pedidos', ok: 'Pedido recusado. Nada foi liberado.' });
  }

  const email = normalizarEmail(p.email);
  const todas = await listConsultoras();
  if (todas.some((c) => c.email_liberado === email)) {
    await appDb().from('consultora_pedidos').update({ status: 'aprovado', decidido_em: agora() }).eq('id', id);
    volta({ aba: 'pedidos', ok: 'Esse e-mail já estava liberado. Pedido marcado como aprovado.' });
  }
  const codigo = await codigoLivre(codigoDoNome(p.nome));
  if (!codigo) volta({ aba: 'pedidos', erro: 'Não consegui montar um código pelo nome. Libere pela aba Consultoras.' });
  const indicadaPor = p.indicada_por && todas.some((c) => c.id === p.indicada_por) ? p.indicada_por : null;

  const { data: nova, error } = await appDb()
    .from('consultoras')
    .insert({
      nome: p.nome.slice(0, 80),
      email_liberado: email,
      codigo,
      instagram: p.instagram ? normalizarInstagram(p.instagram) : null,
      whatsapp: p.whatsapp ? normalizarWhatsapp(p.whatsapp) : null,
      indicada_por: indicadaPor,
      estado: 'esperando',
      liberada_em: agora(),
    })
    .select('id')
    .single();
  if (error) volta({ aba: 'pedidos', erro: error.message });
  await appDb().from('consultora_pedidos').update({ status: 'aprovado', decidido_em: agora() }).eq('id', id);
  volta({ aba: 'consultoras', id: (nova as { id: string }).id, ok: `Aprovada e liberada como "esperando cadastro" (código ${codigo}).` });
}

// ── Pagamento (Pix) ───────────────────────────────────────
export async function marcarPago(fd: FormData) {
  requireRole('admin');
  const id = txt(fd, 'id');
  const competencia = txt(fd, 'competencia');
  // De onde veio: Consultoras › Comissões ou Financeiro › Repasses (a mesma tabela).
  const daRepasses = txt(fd, 'volta') === 'repasses';
  const ir = (p: Record<string, string>): never =>
    daRepasses ? volta(p, '/admin/repasses') : volta({ aba: 'comissoes', mes: competencia, ...p });
  if (!/^\d{4}-\d{2}$/.test(competencia)) ir({ erro: 'Mês inválido.' });
  // O valor gravado é o calculado agora (o mesmo que a tela mostra).
  const base = await baseComissoesAgora();
  const valor = totalDe(base.linhas, id, competencia);
  if (valor <= 0) ir({ erro: 'Não há comissão nesse mês para essa consultora.' });
  const { error } = await appDb()
    .from('consultora_pagamentos')
    .insert({ consultora_id: id, competencia, valor, observacao: txt(fd, 'observacao') || null });
  if (error) ir({ erro: error.code === '23505' ? 'Esse mês já estava marcado como pago.' : error.message });
  ir({ ok: 'Marcado como pago. Ela vê "Pago" no app e no painel, e Repasses já mostra.' });
}
