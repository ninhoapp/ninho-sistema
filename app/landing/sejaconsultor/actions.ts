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
import { headers } from 'next/headers';
import { appDb } from '@/lib/supabase/server';
import { consultoraAtivaPorCodigo } from '@/lib/consultoras';
import {
  ACEITE_SITE_VERSAO,
  EMAIL_RE,
  normalizarEmail,
  normalizarInstagram,
  normalizarWhatsapp,
} from '@/lib/consultoras-regras';

export interface PedidoState {
  ok?: boolean;
  error?: string;
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
  const iBruto = txt('instagram');
  const cod = txt('codigo');
  if (nome.length < 2 || nome.length > 80) return { error: 'Coloque seu nome.' };
  if (!EMAIL_RE.test(email) || email.length > 254) return { error: 'Coloque o e-mail que você vai usar no app.' };
  const whatsapp = wBruto ? normalizarWhatsapp(wBruto) : null;
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
    const { error } = await sb.from('consultora_pedidos').insert({
      nome,
      email,
      instagram,
      whatsapp,
      indicada_por: indicadora?.id ?? null,
      origem: 'site',
      aceite_versao: ACEITE_SITE_VERSAO,
    });
    if (error) {
      if (error.code === '23505') return { ok: true };
      console.error('[sejaconsultor] insert falhou:', error.message);
      return { error: 'Não consegui enviar agora. Tente de novo em instantes.' };
    }
    return { ok: true };
  } catch (e) {
    console.error('[sejaconsultor] falhou:', e instanceof Error ? e.message : e);
    return { error: 'Não consegui enviar agora. Tente de novo em instantes.' };
  }
}
