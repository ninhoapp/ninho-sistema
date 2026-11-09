/**
 * Ninho · Meta API de Conversões (servidor)
 *
 * Manda o mesmo evento que o Pixel do navegador manda, pelo servidor. Serve
 * para a Meta contar o cadastro mesmo quando o navegador bloqueia o Pixel
 * (Safari, bloqueador de anúncio). O `event_id` é o mesmo dos dois lados, então
 * a Meta junta os dois e conta uma vez só.
 *
 * Não manda e-mail, telefone nem nome: só IP, navegador e os cookies _fbp/_fbc
 * que o próprio Pixel cria. Mandar e-mail/telefone (com hash) melhora a
 * atribuição, mas é dado pessoal novo indo para a Meta: só com o OK do Darck
 * e a Política de Privacidade atualizada.
 *
 * Configurar: NEXT_PUBLIC_META_PIXEL_ID e META_CAPI_TOKEN (Gerenciador de
 * Eventos › pixel › Configurações › API de Conversões › Gerar token).
 * Sem as duas, não faz nada.
 */
const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;
const TOKEN = process.env.META_CAPI_TOKEN;
const VERSAO = 'v21.0';

export interface EventoServidor {
  nome: 'Lead' | 'CompleteRegistration';
  eventId: string;
  url: string;
  ip?: string | null;
  userAgent?: string | null;
  fbp?: string | null;
  fbc?: string | null;
  contentName?: string;
}

export async function enviarEventoMeta(ev: EventoServidor): Promise<void> {
  if (!PIXEL_ID || !TOKEN) return;
  const userData: Record<string, string> = {};
  if (ev.ip && ev.ip !== 'sem-ip') userData.client_ip_address = ev.ip;
  if (ev.userAgent) userData.client_user_agent = ev.userAgent.slice(0, 500);
  if (ev.fbp) userData.fbp = ev.fbp;
  if (ev.fbc) userData.fbc = ev.fbc;

  const corpo = {
    data: [
      {
        event_name: ev.nome,
        event_time: Math.floor(Date.now() / 1000),
        event_id: ev.eventId,
        action_source: 'website',
        event_source_url: ev.url,
        user_data: userData,
        custom_data: ev.contentName ? { content_name: ev.contentName } : undefined,
      },
    ],
  };

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 3000);
  try {
    const r = await fetch(`https://graph.facebook.com/${VERSAO}/${PIXEL_ID}/events?access_token=${encodeURIComponent(TOKEN)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(corpo),
      signal: ctrl.signal,
    });
    if (!r.ok) console.error('[meta-capi]', ev.nome, r.status, (await r.text()).slice(0, 300));
  } catch (e) {
    console.error('[meta-capi]', ev.nome, e instanceof Error ? e.message : e);
  } finally {
    clearTimeout(timer);
  }
}
