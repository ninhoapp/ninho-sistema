'use server';

/**
 * Ações da CONSULTORA na área /admin/consultora. Mesmas regras das funções do
 * app (consultora_atualizar_perfil e consultora_indicar, migration 00102),
 * refeitas aqui porque o painel entra como service role (sem auth.uid()).
 */
import { redirect } from 'next/navigation';
import { revalidatePath, revalidateTag } from 'next/cache';
import { requireSessionAtiva } from '@/lib/auth/guard';
import { appDb } from '@/lib/supabase/server';
import { consultoraDoPerfil, subirFoto, apagarFoto, CONSULTORAS_TAG, type Consultora } from '@/lib/consultoras';
import {
  EMAIL_RE,
  normalizarCpf,
  normalizarEmail,
  normalizarInstagram,
  normalizarWhatsapp,
} from '@/lib/consultoras-regras';

const BASE = '/admin/consultora';

function volta(aba: string, r: { ok?: string; erro?: string }): never {
  const q = new URLSearchParams({ aba });
  if (r.ok) q.set('ok', r.ok);
  if (r.erro) q.set('erro', r.erro);
  revalidateTag(CONSULTORAS_TAG);
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

export async function salvarPerfil(fd: FormData) {
  const c = await eu();
  if (c.estado !== 'ativa' && c.estado !== 'pausada') volta('perfil', { erro: 'Sua conta ainda não está ativa.' });

  const bio = txt(fd, 'bio').slice(0, 160) || null;
  const cidade = txt(fd, 'cidade').slice(0, 80) || null;
  const ufBruto = txt(fd, 'uf').toUpperCase();
  const uf = /^[A-Z]{2}$/.test(ufBruto) ? ufBruto : null;
  if (ufBruto && !uf) volta('perfil', { erro: 'UF com 2 letras (ex.: SP).' });
  const wBruto = txt(fd, 'whatsapp');
  const whatsapp = wBruto ? normalizarWhatsapp(wBruto) : null;
  if (wBruto && !whatsapp) volta('perfil', { erro: 'WhatsApp com DDD (ex.: 11 98765-4321).' });
  const iBruto = txt(fd, 'instagram');
  const instagram = iBruto ? normalizarInstagram(iBruto) : null;
  if (iBruto && !instagram) volta('perfil', { erro: 'Instagram inválido. Use só o seu @.' });
  const idades = txt(fd, 'idades').slice(0, 40) || null;
  const cpfBruto = txt(fd, 'cpf');
  const cpf = cpfBruto ? normalizarCpf(cpfBruto) : null;
  if (cpfBruto && !cpf) volta('perfil', { erro: 'CPF com 11 números.' });
  const pix = txt(fd, 'pix');
  if (pix && (pix.length < 3 || pix.length > 120)) volta('perfil', { erro: 'Chave Pix inválida.' });

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
  if (error) volta('perfil', { erro: error.message });
  volta('perfil', { ok: bio !== c.bio ? 'Salvo. O texto novo foi para o Ninho aprovar; o resto já vale.' : 'Perfil salvo.' });
}

export async function enviarFoto(fd: FormData) {
  const c = await eu();
  const arquivo = fd.get('foto');
  if (!(arquivo instanceof File) || arquivo.size === 0) volta('perfil', { erro: 'Escolha uma foto.' });
  const up = await subirFoto(arquivo, 'pendentes');
  if (!up.url) volta('perfil', { erro: up.error });
  const { error } = await appDb().from('consultoras').update({ foto_pendente_url: up.url, atualizado_em: agora() }).eq('id', c.id);
  if (error) {
    await apagarFoto(up.url);
    volta('perfil', { erro: error.message });
  }
  // Trocou a foto que ainda esperava aprovação: a antiga sai do bucket.
  await apagarFoto(c.foto_pendente_url);
  volta('perfil', { ok: 'Foto enviada. Ela aparece depois que o Ninho aprovar.' });
}

export async function indicarConsultora(fd: FormData) {
  const c = await eu();
  if (c.estado !== 'ativa' || !c.termo_aceito_em) volta('indicar', { erro: 'Só consultora ativa pode indicar.' });
  const nome = txt(fd, 'nome');
  const email = normalizarEmail(txt(fd, 'email'));
  const iBruto = txt(fd, 'instagram');
  const wBruto = txt(fd, 'whatsapp');
  if (nome.length < 2 || nome.length > 80) volta('indicar', { erro: 'Coloque o nome.' });
  if (!EMAIL_RE.test(email)) volta('indicar', { erro: 'Coloque o e-mail que ela vai usar no app.' });

  const sb = appDb();
  const [{ data: jaC }, { data: jaP }, { count: pend }, { count: dia }] = await Promise.all([
    sb.from('consultoras').select('id').eq('email_liberado', email).limit(1),
    sb.from('consultora_pedidos').select('id').eq('email', email).eq('status', 'pendente').limit(1),
    sb.from('consultora_pedidos').select('id', { count: 'exact', head: true }).eq('indicada_por', c.id).eq('status', 'pendente'),
    sb.from('consultora_pedidos').select('id', { count: 'exact', head: true }).eq('indicada_por', c.id).gt('criado_em', new Date(Date.now() - 86_400_000).toISOString()),
  ]);
  if ((jaC?.length ?? 0) > 0 || (jaP?.length ?? 0) > 0) volta('indicar', { erro: 'Essa pessoa já foi indicada ou liberada.' });
  // Mesmos limites da função do app: até 5 pendentes e 10 por dia.
  if ((pend ?? 0) >= 5 || (dia ?? 0) >= 10) volta('indicar', { erro: 'Você chegou ao limite de indicações por agora. Tente amanhã.' });

  const { error } = await sb.from('consultora_pedidos').insert({
    nome: nome.slice(0, 80),
    email,
    instagram: iBruto ? (normalizarInstagram(iBruto) ?? iBruto.slice(0, 40)) : null,
    whatsapp: wBruto ? wBruto.slice(0, 30) : null,
    indicada_por: c.id,
    origem: 'app',
  });
  if (error) volta('indicar', { erro: error.code === '23505' ? 'Essa pessoa já tem um pedido.' : error.message });
  volta('indicar', { ok: 'Indicação enviada. O Ninho vai conferir.' });
}
