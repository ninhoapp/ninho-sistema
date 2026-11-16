'use server';

/**
 * Captação de parceiro (/admin/parceiros?aba=captacao) — só o admin.
 * Tabelas painel.captacao_contatos e painel.captacao_comentarios
 * (migration Ninho-expo/supabase/migrations/00176).
 *
 * Nada é apagado de verdade: "tirar da lista" arquiva, para o histórico da
 * conversa não se perder.
 */
import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/auth/guard';
import { painelDb } from '@/lib/supabase/server';
import {
  ETAPA_DO_CONVITE,
  arrobasDaLista,
  dataBr,
  etapaValida,
  lerConvitesColados,
  normalizarArroba,
  type Etapa,
  type Origem,
} from '@/lib/captacao';
import { subirVideo } from '@/lib/captacao-video';

export interface CaptacaoState {
  ok?: string;
  error?: string;
}

const ORIGENS: Origem[] = ['pesquisa', 'site', 'indicacao'];

function texto(fd: FormData, campo: string, max: number): string | null {
  const v = String(fd.get(campo) ?? '').trim();
  return v ? v.slice(0, max) : null;
}

/** 'AAAA-MM-DD' ou null. Input type=date já manda nesse formato. */
function data(fd: FormData, campo: string): string | null {
  const v = String(fd.get(campo) ?? '').trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null;
}

function faltaTabela(msg?: string): boolean {
  return /captacao_contatos|captacao_comentarios|schema cache/.test(msg ?? '');
}

function aviso(msg?: string): string {
  return faltaTabela(msg)
    ? 'As tabelas da captação ainda não existem no banco: aplique a migration 00176 (Ninho-expo/supabase/migrations/00176_painel_captacao_parceiro.sql).'
    : msg || 'Não consegui gravar.';
}

/**
 * O caminho curto, que é o que ele faz o dia inteiro: um @, o que a pessoa
 * disse e o dia de voltar a falar. Cria o contato (ou acha o que já existe) e
 * já escreve o comentário no histórico.
 */
export async function registrarContato(_prev: CaptacaoState, fd: FormData): Promise<CaptacaoState> {
  requireRole('admin');
  const arroba = normalizarArroba(String(fd.get('arroba') ?? ''));
  if (!arroba) return { error: 'Escreva o @ do Instagram (ex.: @maria.sono).' };

  const etapaBruta = String(fd.get('etapa') ?? 'abordado');
  const etapa: Etapa = etapaValida(etapaBruta) ? etapaBruta : 'abordado';
  const prox = data(fd, 'proximo_contato');
  const comentario = texto(fd, 'texto', 1000);
  const sb = painelDb();

  const achado = await sb.from('captacao_contatos').select('id').eq('arroba', arroba).maybeSingle();
  if (achado.error && !/row/i.test(achado.error.message)) return { error: aviso(achado.error.message) };

  let id = (achado.data as { id: string } | null)?.id ?? null;
  const campos: Record<string, unknown> = { etapa, atualizado_em: new Date().toISOString() };
  if (prox) campos.proximo_contato = prox;
  const nome = texto(fd, 'nome', 80);
  if (nome) campos.nome = nome;

  if (id) {
    const up = await sb.from('captacao_contatos').update(campos).eq('id', id);
    if (up.error) return { error: aviso(up.error.message) };
  } else {
    const ins = await sb
      .from('captacao_contatos')
      .insert({ arroba, origem: 'pesquisa', ...campos })
      .select('id')
      .single();
    if (ins.error) return { error: aviso(ins.error.message) };
    id = (ins.data as { id: string }).id;
  }

  if (comentario) {
    const c = await sb
      .from('captacao_comentarios')
      .insert({ contato_id: id, texto: comentario, etapa_depois: etapa, proximo_contato: prox });
    if (c.error) return { error: aviso(c.error.message) };
  }

  revalidatePath('/admin/parceiros');
  const quando = prox ? ` Volta para a sua lista em ${dataBr(prox)}.` : '';
  return { ok: `@${arroba} ${achado.data ? 'atualizado' : 'registrado'}.${quando}` };
}

/** Sobe (ou troca) o vídeo da abordagem, para ele ver e baixar na própria aba. */
export async function subirVideoCaptacao(_prev: CaptacaoState, fd: FormData): Promise<CaptacaoState> {
  requireRole('admin');
  const arquivo = fd.get('arquivo');
  if (!(arquivo instanceof File)) return { error: 'Escolha o arquivo do vídeo.' };
  const erro = await subirVideo(arquivo);
  if (erro) return { error: erro };
  revalidatePath('/admin/parceiros');
  return { ok: 'Vídeo guardado. Ele toca aqui e você baixa quando precisar.' };
}

/**
 * Cola um @ ou uma LISTA de @ de uma vez (uma por linha, ou separados por
 * vírgula/espaço) e vira uma linha por pessoa. @ repetido não duplica.
 */
export async function adicionarContatos(_prev: CaptacaoState, fd: FormData): Promise<CaptacaoState> {
  requireRole('admin');
  const bruto = String(fd.get('lista') ?? '');
  const { arrobas, recusados } = arrobasDaLista(bruto);
  if (!arrobas.length) {
    return { error: recusados.length ? `Não reconheci nenhum @ válido (ex.: ${recusados[0]}).` : 'Cole pelo menos um @.' };
  }

  const origemBruta = String(fd.get('origem') ?? 'pesquisa') as Origem;
  const origem = ORIGENS.includes(origemBruta) ? origemBruta : 'pesquisa';
  const nome = arrobas.length === 1 ? texto(fd, 'nome', 80) : null;
  const porQue = texto(fd, 'por_que_serve', 400);
  const etapaBruta = String(fd.get('etapa') ?? 'novo');
  const etapa: Etapa = etapaValida(etapaBruta) ? etapaBruta : 'novo';

  const linhas = arrobas.map((arroba) => ({
    arroba,
    nome,
    origem,
    etapa,
    por_que_serve: porQue,
    proximo_contato: data(fd, 'proximo_contato'),
  }));

  // ignoreDuplicates: colar a mesma lista duas vezes não sobrescreve o que já
  // está registrado sobre aquela pessoa.
  const { error, count } = await painelDb()
    .from('captacao_contatos')
    .upsert(linhas, { onConflict: 'arroba', ignoreDuplicates: true, count: 'exact' });
  if (error) return { error: aviso(error.message) };

  revalidatePath('/admin/parceiros');
  const novos = count ?? 0;
  const repetidos = arrobas.length - novos;
  const partes = [`${novos} contato(s) na lista`];
  if (repetidos > 0) partes.push(`${repetidos} já estava(m) lá`);
  if (recusados.length) partes.push(`não reconheci: ${recusados.slice(0, 5).join(', ')}`);
  return { ok: `${partes.join(' · ')}.` };
}

/**
 * Traz de uma vez os @ que ele já abordou na página de convites
 * (Ninho-expo/marketing/consultoras/contatos/enviar.html). O que ele marcou lá
 * mora no localStorage do navegador: ele cola aqui o que a linha do console
 * copiou, e cada @ entra na etapa correspondente.
 *
 * O nome, o alcance e o "o que eu vi" vêm da própria página colada — a lista
 * de contatos dele NÃO mora neste repositório, que é público. A data em que
 * ele marcou vira o primeiro comentário do histórico.
 *
 * Rodar duas vezes não duplica nem apaga: @ que já está na lista é
 * ATUALIZADO para a etapa da página, e quem já tem comentário de importação
 * não ganha outro.
 */
export async function importarConvites(_prev: CaptacaoState, fd: FormData): Promise<CaptacaoState> {
  requireRole('admin');
  // Dois caminhos: o arquivo que o botão "Exportar para o painel" da página de
  // convites baixa (o normal) ou o texto colado do console (o antigo).
  const arquivo = fd.get('arquivo');
  const doArquivo = arquivo instanceof File && arquivo.size > 0 ? await arquivo.text() : '';
  const { linhas: todas, erro } = lerConvitesColados(doArquivo || String(fd.get('colado') ?? ''));
  if (erro) return { error: erro };
  // A página tem 180 cartões, a maioria de outras áreas (amamentação, doula,
  // fotógrafa). Só entra quem ele marcou com alguma situação.
  const linhas = todas.filter((l) => l.estado !== '');
  if (!linhas.length) return { error: 'Nesse texto nenhum contato está marcado com uma situação.' };

  const sb = painelDb();

  const { data: jaTem, error: eLer } = await sb.from('captacao_contatos').select('id,arroba').limit(2000);
  if (eLer) return { error: aviso(eLer.message) };
  const idPorArroba = new Map(((jaTem as { id: string; arroba: string }[]) ?? []).map((c) => [c.arroba, c.id]));

  const novos: Record<string, unknown>[] = [];
  let atualizados = 0;
  for (const l of linhas) {
    const mapa = ETAPA_DO_CONVITE[l.estado];
    const existente = idPorArroba.get(l.arroba);
    if (existente) {
      const up = await sb
        .from('captacao_contatos')
        .update({ etapa: mapa.etapa, arquivado: Boolean(mapa.arquivar), atualizado_em: new Date().toISOString() })
        .eq('id', existente);
      if (!up.error) atualizados++;
      continue;
    }
    novos.push({
      arroba: l.arroba,
      nome: l.nome,
      etapa: mapa.etapa,
      origem: 'pesquisa',
      seguidores: l.seguidores,
      por_que_serve: l.gancho ? l.gancho.slice(0, 400) : null,
      arquivado: Boolean(mapa.arquivar),
    });
  }

  if (novos.length) {
    const ins = await sb.from('captacao_contatos').insert(novos).select('id,arroba');
    if (ins.error) return { error: aviso(ins.error.message) };
    for (const c of ((ins.data as { id: string; arroba: string }[]) ?? [])) idPorArroba.set(c.arroba, c.id);

    // Um comentário por contato novo, para o histórico começar com o que ele
    // já tinha feito, e não em branco.
    const comentarios = linhas
      .filter((l) => novos.some((n) => n.arroba === l.arroba))
      .map((l) => {
        const id = idPorArroba.get(l.arroba);
        if (!id) return null;
        const mapa = ETAPA_DO_CONVITE[l.estado];
        const quando = l.data ? ` em ${dataBr(l.data)}` : '';
        return {
          contato_id: id,
          texto: `Veio da página de convites: "${mapa.rotulo}"${quando}.`,
          etapa_depois: mapa.etapa,
          proximo_contato: null,
        };
      })
      .filter(Boolean) as Record<string, unknown>[];
    if (comentarios.length) await sb.from('captacao_comentarios').insert(comentarios);
  }

  revalidatePath('/admin/parceiros');
  return {
    ok: `${novos.length} contato(s) novo(s) e ${atualizados} atualizado(s), de ${linhas.length} marcado(s) na página de convites.`,
  };
}

/** Etapa, data do próximo contato e os dados públicos da ficha. */
export async function salvarContato(_prev: CaptacaoState, fd: FormData): Promise<CaptacaoState> {
  requireRole('admin');
  const id = String(fd.get('id') ?? '');
  if (!id) return { error: 'Contato não encontrado.' };

  const etapaBruta = String(fd.get('etapa') ?? '');
  const patch: Record<string, unknown> = {
    proximo_contato: data(fd, 'proximo_contato'),
    atualizado_em: new Date().toISOString(),
  };
  if (etapaValida(etapaBruta)) patch.etapa = etapaBruta;
  if (fd.has('nome')) patch.nome = texto(fd, 'nome', 80);
  if (fd.has('por_que_serve')) patch.por_que_serve = texto(fd, 'por_que_serve', 400);
  if (fd.has('seguidores')) {
    const n = Number(String(fd.get('seguidores') ?? '').replace(/[^\d]/g, ''));
    patch.seguidores = Number.isFinite(n) && n > 0 ? Math.round(n) : null;
  }
  if (fd.has('arroba')) {
    const a = normalizarArroba(String(fd.get('arroba') ?? ''));
    if (!a) return { error: 'O @ está em um formato que o Instagram não usa.' };
    patch.arroba = a;
  }

  const { error } = await painelDb().from('captacao_contatos').update(patch).eq('id', id);
  if (error) return { error: aviso(error.message) };
  revalidatePath('/admin/parceiros');
  return { ok: 'Salvo.' };
}

/**
 * Escreve um comentário no histórico (nunca sobrescreve o anterior) e, de
 * quebra, pode mudar a etapa e marcar o dia de voltar a falar.
 */
export async function comentar(_prev: CaptacaoState, fd: FormData): Promise<CaptacaoState> {
  requireRole('admin');
  const id = String(fd.get('id') ?? '');
  const txt = texto(fd, 'texto', 1000);
  if (!id) return { error: 'Contato não encontrado.' };
  if (!txt) return { error: 'Escreva o comentário.' };

  const etapaBruta = String(fd.get('etapa') ?? '');
  const etapa: Etapa | null = etapaValida(etapaBruta) ? etapaBruta : null;
  const prox = data(fd, 'proximo_contato');
  const sb = painelDb();

  const { error } = await sb
    .from('captacao_comentarios')
    .insert({ contato_id: id, texto: txt, etapa_depois: etapa, proximo_contato: prox });
  if (error) return { error: aviso(error.message) };

  const patch: Record<string, unknown> = { atualizado_em: new Date().toISOString() };
  if (etapa) patch.etapa = etapa;
  // Só mexe na data quando ele escreveu uma: comentar sem data não apaga o
  // retorno que já estava marcado.
  if (prox) patch.proximo_contato = prox;
  const up = await sb.from('captacao_contatos').update(patch).eq('id', id);
  if (up.error) return { error: aviso(up.error.message) };

  revalidatePath('/admin/parceiros');
  return { ok: prox ? 'Comentário guardado; volta para a sua lista no dia marcado.' : 'Comentário guardado.' };
}

/** Tira da lista (arquiva) ou devolve para a lista. O histórico fica. */
export async function arquivarContato(fd: FormData) {
  requireRole('admin');
  const id = String(fd.get('id') ?? '');
  if (!id) return;
  const arquivar = String(fd.get('arquivar') ?? '1') === '1';
  await painelDb()
    .from('captacao_contatos')
    .update({ arquivado: arquivar, atualizado_em: new Date().toISOString() })
    .eq('id', id);
  revalidatePath('/admin/parceiros');
}
