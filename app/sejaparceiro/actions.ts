'use server';

/**
 * Pedido "Quero ser parceiro" do site (/sejaparceiro). Vira uma linha em
 * painel.parceiro_pedidos e espera o dono em /admin/parceiros › Pedidos.
 * Nunca cria acesso sozinho.
 *
 * Mesmo anti-spam do Seja consultora: campo escondido, 3 s mínimos entre abrir
 * a página e enviar, até 5 envios por IP por hora e teto de pedidos por dia.
 * E-mail que já é parceiro ou já tem pedido recebe a MESMA resposta de sucesso
 * (não revela quem já está no programa) e nada é gravado.
 */
import { headers } from 'next/headers';
import { juntarTelefone } from '@/lib/telefone';
import { EMAIL_RE, normalizarEmail, normalizarInstagram } from '@/lib/consultoras-regras';
import { emailJaNoPrograma, inserirPedidoParceiro, pedidosDoSiteHoje } from '@/lib/parceiros/pedidos';

export interface PedidoParceiroState {
  ok?: boolean;
  error?: string;
}

const TETO_DIA = 200;
const POR_IP_HORA = 5;
const enviosPorIp = new Map<string, number[]>();

function ipEstourou(): boolean {
  const h = headers();
  const ip = (h.get('x-forwarded-for')?.split(',')[0] || h.get('x-real-ip') || 'sem-ip').trim().slice(0, 64);
  const agora = Date.now();
  if (enviosPorIp.size > 5000) enviosPorIp.clear();
  const lista = (enviosPorIp.get(ip) ?? []).filter((t) => agora - t < 3_600_000);
  lista.push(agora);
  enviosPorIp.set(ip, lista);
  return lista.length > POR_IP_HORA;
}

export async function enviarPedidoParceiro(_prev: PedidoParceiroState, fd: FormData): Promise<PedidoParceiroState> {
  const txt = (k: string) => String(fd.get(k) ?? '').trim();

  if (txt('site')) return { ok: true }; // robô
  const t = Number(txt('t'));
  if (!Number.isFinite(t) || Date.now() - t < 3000) return { error: 'Confira os campos e envie de novo.' };

  const nome = txt('nome');
  const email = normalizarEmail(txt('email'));
  const whatsapp = juntarTelefone(txt('whatsapp_pais'), txt('whatsapp'));
  const instagram = normalizarInstagram(txt('instagram'));
  if (nome.length < 2 || nome.length > 80) return { error: 'Coloque seu nome.' };
  if (!EMAIL_RE.test(email) || email.length > 254) return { error: 'Coloque um e-mail válido.' };
  if (!whatsapp) return { error: 'WhatsApp com DDD (ex.: 11 98765-4321).' };
  if (!instagram) return { error: 'Coloque o seu @ do Instagram.' };
  if (ipEstourou()) return { error: 'Recebemos muitos pedidos deste aparelho. Tente de novo mais tarde ou fale com a gente no Instagram @useninho.app.' };

  try {
    if (await emailJaNoPrograma(email)) return { ok: true };
    if ((await pedidosDoSiteHoje()) >= TETO_DIA) {
      return { error: 'Recebemos muitos pedidos hoje. Tente de novo amanhã ou fale com a gente no Instagram @useninho.app.' };
    }
    const { error } = await inserirPedidoParceiro({ nome, email, whatsapp, instagram });
    if (error) {
      if (error.code === '23505') return { ok: true };
      console.error('[sejaparceiro] gravar pedido falhou:', error.message);
      return { error: 'Não consegui enviar agora. Tente de novo em instantes.' };
    }
    return { ok: true };
  } catch (e) {
    console.error('[sejaparceiro] pedido falhou:', e instanceof Error ? e.message : e);
    return { error: 'Não consegui enviar agora. Tente de novo em instantes.' };
  }
}
