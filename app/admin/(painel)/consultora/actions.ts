'use server';

/**
 * Ações da CONSULTORA na área /admin/consultora. Mesmas regras das funções do
 * app (consultora_atualizar_perfil e consultora_indicar, migration 00102),
 * refeitas aqui porque o painel entra como service role (sem auth.uid()).
 */
import { redirect } from 'next/navigation';
import { revalidatePath, updateTag } from 'next/cache';
import { requireSessionAtiva } from '@/lib/auth/guard';
import { appDb } from '@/lib/supabase/server';
import {
  consultoraDoPerfil,
  subirFoto,
  apagarFoto,
  responderPedidoVinculo,
  convidarFamiliaPorEmail,
  cancelarConvite,
  encerrarFamilia,
  inserirPedido,
  salvarFichaDe,
  marcarContinuarTratado,
  orientacaoAceiteOk,
  aceitarTermoOrientacao,
  enviarOrientacao,
  ORIENTACAO_MAX,
  CONSULTORAS_TAG,
  type Consultora,
} from '@/lib/consultoras';
import {
  EMAIL_RE,
  normalizarCpf,
  normalizarEmail,
  normalizarInstagram,
  normalizarComoSoube,
} from '@/lib/consultoras-regras';
import { juntarTelefone } from '@/lib/telefone';
import { gerarRelatorio } from '@/lib/consultoras-ia';
import { familiasDa } from '@/lib/consultoras';
import { SUGESTAO_MAX, SUGESTAO_MIN, enviarSugestao } from '@/lib/consultoras-sugestoes';
import { textos } from '@/lib/i18n-consultora';
import { idiomaDaConsultora } from '@/lib/i18n-consultora/servidor';

const BASE = '/admin/consultora';

function volta(aba: string, r: { ok?: string; erro?: string }, extra: Record<string, string> = {}): never {
  const q = new URLSearchParams({ aba, ...extra });
  if (r.ok) q.set('ok', r.ok);
  if (r.erro) q.set('erro', r.erro);
  updateTag(CONSULTORAS_TAG);
  revalidatePath(BASE);
  redirect(`${BASE}?${q.toString()}`);
}

async function eu(): Promise<Consultora> {
  const s = await requireSessionAtiva('consultora');
  const c = await consultoraDoPerfil(s.sub);
  if (!c) redirect('/admin/login?porta=consultora');
  return c;
}

const txt = (fd: FormData, k: string) => String(fd.get(k) ?? '').trim();
const agora = () => new Date().toISOString();

/** Textos desta área no idioma da consultora (lib/i18n-consultora/<idioma>/acoes.ts). */
async function textosAcoes() {
  const idioma = await idiomaDaConsultora();
  return { idioma, t: textos(idioma).acoes };
}

export async function salvarPerfil(fd: FormData) {
  const c = await eu();
  const { t } = await textosAcoes();
  if (c.estado !== 'ativa' && c.estado !== 'pausada') volta('perfil', { erro: t.perfil.contaAindaNaoAtiva });

  // 600, o mesmo do campo no app e do check do banco (migration 00168).
  const bio = txt(fd, 'bio').slice(0, 600) || null;
  const cidade = txt(fd, 'cidade').slice(0, 80) || null;
  const ufBruto = txt(fd, 'uf').toUpperCase();
  const uf = /^[A-Z]{2}$/.test(ufBruto) ? ufBruto : null;
  if (ufBruto && !uf) volta('perfil', { erro: t.perfil.ufInvalida });
  const wBruto = txt(fd, 'whatsapp');
  const whatsapp = wBruto ? juntarTelefone(txt(fd, 'whatsapp_pais'), wBruto) : null;
  if (wBruto && !whatsapp) volta('perfil', { erro: t.whatsappComDdd });
  const iBruto = txt(fd, 'instagram');
  const instagram = iBruto ? normalizarInstagram(iBruto) : null;
  if (iBruto && !instagram) volta('perfil', { erro: t.perfil.instagramInvalido });
  const idades = txt(fd, 'idades').slice(0, 40) || null;
  const cpfBruto = txt(fd, 'cpf');
  const cpf = cpfBruto ? normalizarCpf(cpfBruto) : null;
  if (cpfBruto && !cpf) volta('perfil', { erro: t.perfil.cpfInvalido });
  const pix = txt(fd, 'pix');
  if (pix && (pix.length < 3 || pix.length > 120)) volta('perfil', { erro: t.perfil.pixInvalido });

  // Texto novo espera o dono; o resto vale na hora. CPF e Pix vazios mantêm o que já tinha.
  const { error } = await appDb()
    .from('consultoras')
    .update({
      bio_pendente: bio !== c.bio ? bio : null,
      cidade,
      uf,
      whatsapp,
      instagram,
      atende_online: fd.get('atende_online') === 'on',
      atende_presencial: fd.get('atende_presencial') === 'on',
      idades,
      ...(cpf ? { cpf } : {}),
      ...(pix ? { pix_chave: pix } : {}),
      atualizado_em: agora(),
    })
    .eq('id', c.id);
  if (error) {
    console.error('[consultora] salvarPerfil:', error.message);
    volta('perfil', { erro: t.perfil.erroSalvar });
  }
  volta('perfil', { ok: bio !== c.bio ? t.perfil.salvoComTexto : t.perfil.salvo });
}

export async function enviarFoto(fd: FormData) {
  const c = await eu();
  const { idioma, t } = await textosAcoes();
  const arquivo = fd.get('foto');
  if (!(arquivo instanceof File) || arquivo.size === 0) volta('perfil', { erro: t.foto.escolha });
  const up = await subirFoto(arquivo, 'pendentes', idioma);
  if (!up.url) volta('perfil', { erro: up.error });
  const { error } = await appDb().from('consultoras').update({ foto_pendente_url: up.url, atualizado_em: agora() }).eq('id', c.id);
  if (error) {
    console.error('[consultora] enviarFoto:', error.message);
    await apagarFoto(up.url);
    volta('perfil', { erro: t.foto.erroGuardar });
  }
  // Trocou a foto que ainda esperava aprovação: a antiga sai do bucket.
  await apagarFoto(c.foto_pendente_url);
  volta('perfil', { ok: t.foto.enviada });
}

export async function indicarConsultora(fd: FormData) {
  const c = await eu();
  // A mesma indicação fica em Meu perfil e em Indicar consultora.
  const aba = txt(fd, 'volta') === 'perfil' ? 'perfil' : 'indicar';
  const { t } = await textosAcoes();
  if (c.estado !== 'ativa' || !c.termo_aceito_em) volta(aba, { erro: t.indicar.soAtiva });
  const nome = txt(fd, 'nome');
  const email = normalizarEmail(txt(fd, 'email'));
  const iBruto = txt(fd, 'instagram');
  const wBruto = txt(fd, 'whatsapp');
  if (nome.length < 2 || nome.length > 80) volta(aba, { erro: t.indicar.nome });
  if (!EMAIL_RE.test(email)) volta(aba, { erro: t.indicar.email });
  const whatsapp = wBruto ? juntarTelefone(txt(fd, 'whatsapp_pais'), wBruto) : null;
  if (wBruto && !whatsapp) volta(aba, { erro: t.whatsappComDdd });
  const instagram = iBruto ? normalizarInstagram(iBruto) : null;
  if (iBruto && !instagram) volta(aba, { erro: t.indicar.instagramInvalido });

  const sb = appDb();
  const [{ data: jaC }, { data: jaP }, { count: pend }, { count: dia }] = await Promise.all([
    sb.from('consultoras').select('id').eq('email_liberado', email).limit(1),
    sb.from('consultora_pedidos').select('id').eq('email', email).eq('status', 'pendente').limit(1),
    sb.from('consultora_pedidos').select('id', { count: 'exact', head: true }).eq('indicada_por', c.id).eq('status', 'pendente'),
    sb.from('consultora_pedidos').select('id', { count: 'exact', head: true }).eq('indicada_por', c.id).gt('criado_em', new Date(Date.now() - 86_400_000).toISOString()),
  ]);
  // Mesmas travas de consultora_indicar: ja_existe, até 5 pendentes e 10 por dia.
  if ((jaC?.length ?? 0) > 0 || (jaP?.length ?? 0) > 0) volta(aba, { erro: t.indicar.jaIndicada });
  if ((pend ?? 0) >= 5 || (dia ?? 0) >= 10) volta(aba, { erro: t.indicar.limite });

  // origem 'app' (o check da tabela só aceita 'app' e 'site'): é a consultora pedindo.
  const { error } = await inserirPedido({
    nome: nome.slice(0, 80),
    email,
    instagram,
    whatsapp,
    indicada_por: c.id,
    origem: 'app',
    como_soube: normalizarComoSoube(txt(fd, 'como_soube')),
    comentario: txt(fd, 'comentario').slice(0, 500) || null,
  });
  if (error) volta(aba, { erro: error.code === '23505' ? t.indicar.jaTemPedido : t.erroEnviar });
  volta(aba, { ok: t.indicar.enviada });
}

// ── Vínculo com aceite dos dois lados (00109) ─────────────
/** Aprovar (com o aceite marcado) ou recusar um pedido de família. */
export async function responderPedidoFamilia(fd: FormData) {
  const c = await eu();
  const pedido = txt(fd, 'pedido');
  const aprovar = txt(fd, 'decisao') === 'aprovar';
  const { t } = await textosAcoes();
  if (!/^[0-9a-f-]{36}$/i.test(pedido)) volta('familias', { erro: t.pedidoNaoEncontrado });
  if (aprovar && fd.get('aceite') !== 'on') volta('familias', { erro: t.pedidoFamilia.marqueAceite });
  const r = await responderPedidoVinculo(c.id, pedido, aprovar);
  const msg: Record<string, string> = {
    nao_encontrado: t.pedidoFamilia.naoEncontrado,
    aceite_invalido: t.aceiteDesatualizado,
    consultora_inativa: t.contaNaoAtiva,
    so_responsavel: t.pedidoFamilia.soResponsavel,
    erro: t.pedidoFamilia.erro,
  };
  if (r !== 'ok') volta('familias', { erro: msg[r] ?? msg.erro });
  volta('familias', { ok: aprovar ? t.pedidoFamilia.aprovado : t.pedidoFamilia.recusado });
}

/** Convida pelo e-mail exato da família. Resposta neutra: não revela quem usa o Ninho. */
export async function convidarFamilia(fd: FormData) {
  const c = await eu();
  const email = normalizarEmail(txt(fd, 'email'));
  const { t } = await textosAcoes();
  if (!EMAIL_RE.test(email)) volta('convidar', { erro: t.emailInvalido });
  if (fd.get('aceite') !== 'on') volta('convidar', { erro: t.convidar.marqueAceite });
  const r = await convidarFamiliaPorEmail(c.id, email);
  const msg: Record<string, string> = {
    ok: t.convidar.ok(email),
    email_invalido: t.emailInvalido,
    limite: t.limiteHoje,
    aceite_invalido: t.aceiteDesatualizado,
    nao_e_consultora: t.contaNaoAtiva,
    erro: t.erroEnviar,
  };
  if (r === 'ok') volta('convidar', { ok: msg.ok });
  volta('convidar', { erro: msg[r] ?? msg.erro });
}

// ── Ficha da família (00111) ──────────────────────────────
export async function salvarFicha(fd: FormData) {
  const c = await eu();
  const baby = txt(fd, 'baby');
  // A mesma ficha aparece na aba Famílias e na aba Ficha (dono, 16/11/2026):
  // o formulário diz de onde veio para a página voltar no mesmo lugar.
  const naAbaFicha = txt(fd, 'volta') === 'ficha';
  const de = naAbaFicha ? 'ficha' : 'familias';
  const { t } = await textosAcoes();
  if (!/^[0-9a-f-]{36}$/i.test(baby)) volta(de, { erro: t.familiaNaoEncontrada });
  const ancora: Record<string, string> = naAbaFicha ? { bebe: baby } : { ficha: baby };
  const data = (k: string) => {
    const v = txt(fd, k);
    return /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null;
  };
  const inicio = data('inicio');
  const termino = data('termino');
  // Término antes do início o servidor também barra; aqui a consultora vê o
  // porquê sem perder o resto do que digitou.
  if (inicio && termino && termino < inicio) volta(de, { erro: t.ficha.terminoAntes }, ancora);
  const num = (k: string) => {
    const v = txt(fd, k);
    if (!v) return null;
    const n = Number(v);
    return Number.isInteger(n) && n >= 0 && n <= 999 ? n : NaN;
  };
  const feitos = num('encontros_feitos');
  const total = num('encontros_total');
  if (Number.isNaN(feitos) || Number.isNaN(total)) volta(de, { erro: t.ficha.encontros }, ancora);
  const wBruto = txt(fd, 'whatsapp');
  const whatsapp = wBruto ? juntarTelefone(txt(fd, 'whatsapp_pais'), wBruto, 8) : null;
  if (wBruto && !whatsapp) volta(de, { erro: t.ficha.whatsappInvalido }, ancora);
  const r = await salvarFichaDe(c.id, baby, {
    inicio,
    termino,
    encontros_feitos: feitos,
    encontros_total: total,
    pais_nomes: txt(fd, 'pais_nomes').slice(0, 120) || null,
    bebe_apelido: txt(fd, 'bebe_apelido').slice(0, 60) || null,
    whatsapp,
    observacoes: txt(fd, 'observacoes').slice(0, 2000) || null,
  });
  const msg: Record<string, string> = {
    sem_acesso: t.ficha.semAcesso,
    invalido: t.ficha.invalido,
    data_invalida: t.ficha.terminoAntes,
    erro: t.ficha.erro,
  };
  if (r !== 'ok') volta(de, { erro: msg[r] ?? msg.erro }, ancora);
  volta(de, { ok: t.ficha.salva }, ancora);
}

// ── "Quero continuar" (00186) ─────────────────────────────
/**
 * A consultora diz que já falou com a família. O pedido some da lista; não
 * renova nem cobra nada — o combinado é entre ela e a família.
 */
export async function marcarContinuarFalei(fd: FormData) {
  const c = await eu();
  const s = await requireSessionAtiva('consultora');
  const pedido = txt(fd, 'pedido');
  const { t } = await textosAcoes();
  if (!/^[0-9a-f-]{36}$/i.test(pedido)) volta('familias', { erro: t.pedidoNaoEncontrado });
  const quem = /^[0-9a-f-]{36}$/i.test(s.sub ?? '') ? s.sub : null;
  const r = await marcarContinuarTratado(c.id, pedido, quem);
  if (r === 'indisponivel') volta('familias', { erro: t.continuar.indisponivel });
  if (r !== 'ok') volta('familias', { erro: t.continuar.erro });
  volta('familias', { ok: t.continuar.ok });
}

// ── Orientação para a família (00157 + 00175) ─────────────
/**
 * Envia a orientação que a família lê no app. Mesmas travas do app; quem
 * decide é o servidor. Na 1ª vez, grava também o termo da consultora (o
 * mesmo texto que ela marca ao aprovar ou convidar uma família).
 */
export async function enviarOrientacaoFamilia(fd: FormData) {
  const c = await eu();
  const baby = txt(fd, 'baby');
  const texto = txt(fd, 'texto');
  const ancora = { bebe: baby };
  const { t, idioma } = await textosAcoes();
  const to = t.orientacao;
  if (!/^[0-9a-f-]{36}$/i.test(baby)) volta('ficha', { erro: t.familiaNaoEncontrada });
  if (c.estado !== 'ativa') volta('ficha', { erro: t.contaNaoAtiva }, ancora);
  if (!texto) volta('ficha', { erro: to.vazio }, ancora);
  if (texto.length > ORIENTACAO_MAX) volta('ficha', { erro: to.longo(ORIENTACAO_MAX) }, ancora);

  const jaAceitou = await orientacaoAceiteOk(c.id);
  if (jaAceitou === null) volta('ficha', { erro: to.indisponivel }, ancora);
  if (!jaAceitou) {
    if (fd.get('aceite') !== 'on') volta('ficha', { erro: to.marqueTermo }, ancora);
    // O banco guarda a versão e o idioma em que ela leu o termo.
    const a = await aceitarTermoOrientacao(c.id, idioma);
    const msgA: Record<string, string> = {
      versao_invalida: to.termoDesatualizado,
      nao_e_consultora: t.contaNaoAtiva,
      indisponivel: to.indisponivelCurto,
      erro: to.erroTermo,
    };
    if (a !== 'ok') volta('ficha', { erro: msgA[a] ?? msgA.erro }, ancora);
  }

  const r = await enviarOrientacao(c.id, baby, texto);
  const msg: Record<string, string> = {
    sem_acesso: to.semAcesso,
    sem_aceite: to.semAceite,
    familia_sem_aceite: to.familiaSemAceite,
    vazio: to.vazio,
    longo: to.longo(ORIENTACAO_MAX),
    link: to.link,
    indisponivel: to.indisponivel,
    erro: t.erroEnviar,
  };
  if (r !== 'ok') volta('ficha', { erro: msg[r] ?? msg.erro }, ancora);
  volta('ficha', { ok: to.enviada }, ancora);
}

// ── Relatório IA ──────────────────────────────────────────
/** Pede um relatório. Bebê precisa ser uma família ativa dela, com plano. */
export async function pedirRelatorio(fd: FormData) {
  const c = await eu();
  const baby = txt(fd, 'bebe');
  const dias = txt(fd, 'dias') === '14' ? 14 : 7;
  const { idioma, t } = await textosAcoes();
  if (c.estado !== 'ativa') volta('relatorio', { erro: t.contaNaoAtiva });
  const fams = await familiasDa(c.id);
  const f = fams.find((x) => x.baby_id === baby);
  if (!f) volta('relatorio', { erro: t.familiaNaoEncontrada });
  if (!f.plano_ok) volta('relatorio', { erro: t.relatorio.semPlano }, { bebe: baby });
  // O relatório sai no idioma da consultora (a função relatorio-consultora aceita pt, en e es).
  const r = await gerarRelatorio(c.id, baby, dias, idioma);
  if (r.ok) {
    if (r.id) volta('relatorio', { ok: t.relatorio.pronto }, { id: r.id });
    volta('relatorio', { ok: t.relatorio.pedido }, { bebe: baby, dias: String(dias) });
  }
  volta('relatorio', { erro: r.mensagem }, { bebe: baby, dias: String(dias) });
}

// ── Convites e acompanhamento (00118) ─────────────────────
export async function cancelarConviteFamilia(fd: FormData) {
  const c = await eu();
  const email = normalizarEmail(txt(fd, 'email'));
  const { t } = await textosAcoes();
  if (!EMAIL_RE.test(email)) volta('familias', { erro: t.convite.naoEncontrado });
  const r = await cancelarConvite(c.id, email);
  if (r === 'ok') volta('familias', { ok: t.convite.cancelado });
  volta('familias', { erro: r === 'nao_encontrado' ? t.convite.jaRespondido : t.convite.erroCancelar });
}

export async function encerrarAcompanhamento(fd: FormData) {
  const c = await eu();
  const baby = txt(fd, 'baby');
  const { t } = await textosAcoes();
  if (!/^[0-9a-f-]{36}$/i.test(baby)) volta('familias', { erro: t.familiaNaoEncontrada });
  const r = await encerrarFamilia(c.id, baby);
  if (r === 'ok') volta('familias', { ok: t.encerrar.ok });
  volta('familias', { erro: r === 'nao_encontrado' ? t.encerrar.jaNaoCompartilhava : t.encerrar.erro });
}

// ── Sugestões para o Ninho (00123) ────────────────────────
export async function mandarSugestao(fd: FormData) {
  const c = await eu();
  const texto = txt(fd, 'texto').replace(/\s+\n/g, '\n');
  const { t } = await textosAcoes();
  if (texto.length < SUGESTAO_MIN) volta('sugestoes', { erro: t.sugestao.vazia });
  if (texto.length > SUGESTAO_MAX) volta('sugestoes', { erro: t.sugestao.longa(SUGESTAO_MAX) });
  const r = await enviarSugestao(c.id, texto);
  if (r === 'ok') volta('sugestoes', { ok: t.sugestao.ok });
  volta('sugestoes', { erro: r === 'indisponivel' ? t.sugestao.indisponivel : t.erroEnviar });
}
