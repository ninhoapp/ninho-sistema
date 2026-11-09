'use server';

/**
 * Pedido para ser consultora vindo do site. Vira uma linha em
 * public.consultora_pedidos (origem 'site', com a versão dos aceites) e espera
 * o dono em /admin/consultor › Pedidos. Nunca libera ninguém sozinho.
 *
 * Anti-spam simples: campo escondido (robô preenche), tempo mínimo de 3 s
 * entre abrir a página e enviar, até 5 envios por IP por hora (em memória da
 * instância, pelo x-forwarded-for), 1 pedido pendente por e-mail e um teto
 * alto de pedidos do site por dia.
 *
 * E-mail que já é consultora ou já tem pedido recebe a MESMA resposta de
 * sucesso (não revela quem já está no programa) e nada é gravado.
 */
import { randomUUID } from 'crypto';
import { cookies, headers } from 'next/headers';
import { appDb } from '@/lib/supabase/server';
import { SITE_URL } from '@/lib/config';
import { enviarEventoMeta } from '@/lib/meta-capi';
import { consultoraAtivaPorCodigo, inserirPedido } from '@/lib/consultoras';
import { juntarTelefone } from '@/lib/telefone';
import {
  ACEITE_SITE_VERSAO,
  EMAIL_RE,
  normalizarEmail,
  normalizarInstagram,
  normalizarComoSoube,
} from '@/lib/consultoras-regras';

export interface PedidoState {
  ok?: boolean;
  error?: string;
  /** Só vem quando um pedido NOVO foi gravado: o formulário dispara o Lead do Pixel com este id. */
  eventId?: string;
}

/** Conta o cadastro para a Meta pelo servidor (o navegador manda o mesmo eventId). */
async function avisarMeta(eventId: string) {
  const h = headers();
  const c = cookies();
  await enviarEventoMeta({
    nome: 'Lead',
    eventId,
    url: `${SITE_URL}/landing/sejaconsultor`,
    ip: ipDoPedido(),
    userAgent: h.get('user-agent'),
    fbp: c.get('_fbp')?.value ?? null,
    fbc: c.get('_fbc')?.value ?? null,
    contentName: 'consultora',
  });
}

const TETO_DIA = 200;
const POR_IP_HORA = 5;
const enviosPorIp = new Map<string, number[]>();

function ipDoPedido(): string {
  const h = headers();
  return (h.get('x-forwarded-for')?.split(',')[0] || h.get('x-real-ip') || 'sem-ip').trim().slice(0, 64);
}

function ipEstourou(ip: string): boolean {
  const agora = Date.now();
  if (enviosPorIp.size > 5000) enviosPorIp.clear();
  const lista = (enviosPorIp.get(ip) ?? []).filter((t) => agora - t < 3_600_000);
  lista.push(agora);
  enviosPorIp.set(ip, lista);
  return lista.length > POR_IP_HORA;
}

export async function enviarPedidoSite(_prev: PedidoState, fd: FormData): Promise<PedidoState> {
  const txt = (k: string) => String(fd.get(k) ?? '').trim();

  // Robô: finge que deu certo e não grava nada.
  if (txt('site')) return { ok: true };
  const t = Number(txt('t'));
  if (!Number.isFinite(t) || Date.now() - t < 3000) return { error: 'Confira os campos e envie de novo.' };

  const nome = txt('nome');
  const email = normalizarEmail(txt('email'));
  const wBruto = txt('whatsapp');
  const comoSoube = normalizarComoSoube(txt('como_soube'));
  const comentario = txt('comentario').slice(0, 500) || null;
  const iBruto = txt('instagram');
  const cod = txt('codigo');
  if (nome.length < 2 || nome.length > 80) return { error: 'Coloque seu nome.' };
  if (!EMAIL_RE.test(email) || email.length > 254) return { error: 'Coloque o e-mail que você vai usar no app.' };
  const whatsapp = wBruto ? juntarTelefone(txt('whatsapp_pais'), wBruto) : null;
  if (wBruto && !whatsapp) return { error: 'WhatsApp com DDD (ex.: 11 98765-4321).' };
  const instagram = iBruto ? normalizarInstagram(iBruto) : null;
  if (iBruto && !instagram) return { error: 'Instagram inválido. Use só o seu @.' };
  if (fd.get('ok1') !== 'on' || fd.get('ok2') !== 'on') return { error: 'Marque as duas caixas para enviar.' };
  if (ipEstourou(ipDoPedido())) return { error: 'Recebemos muitos pedidos deste aparelho. Tente de novo mais tarde ou fale com a gente no Instagram @useninho.app.' };

  try {
    const sb = appDb();
    const desde = new Date(Date.now() - 86_400_000).toISOString();
    const [{ data: jaC }, { data: jaP }, { count: hoje }] = await Promise.all([
      sb.from('consultoras').select('id').eq('email_liberado', email).limit(1),
      sb.from('consultora_pedidos').select('id').eq('email', email).eq('status', 'pendente').limit(1),
      sb.from('consultora_pedidos').select('id', { count: 'exact', head: true }).eq('origem', 'site').gt('criado_em', desde),
    ]);
    if ((jaC?.length ?? 0) > 0 || (jaP?.length ?? 0) > 0) return { ok: true };
    if ((hoje ?? 0) >= TETO_DIA) return { error: 'Recebemos muitos pedidos hoje. Tente de novo amanhã ou fale com a gente no Instagram @useninho.app.' };

    const indicadora = cod ? await consultoraAtivaPorCodigo(cod) : null;
    const { error } = await inserirPedido({
      nome,
      email,
      instagram,
      whatsapp,
      indicada_por: indicadora?.id ?? null,
      origem: 'site',
      aceite_versao: ACEITE_SITE_VERSAO,
      como_soube: comoSoube,
      comentario,
    });
    if (error) {
      if (error.code === '23505') return { ok: true };
      console.error('[sejaconsultor] insert falhou:', error.message);
      return { error: 'Não consegui enviar agora. Tente de novo em instantes.' };
    }
    const eventId = randomUUID();
    await avisarMeta(eventId);
    return { ok: true, eventId };
  } catch (e) {
    console.error('[sejaconsultor] falhou:', e instanceof Error ? e.message : e);
    return { error: 'Não consegui enviar agora. Tente de novo em instantes.' };
  }
}
