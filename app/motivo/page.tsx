/**
 * /motivo — destino dos botões do e-mail "por que você não assinou?"
 * (campanha motivo_nao_assinou do enviar-comunicado, Ninho-expo; pedido do
 * dono, 15/11/2026). Grava o motivo em atendimento_resgates (canal 'email'),
 * que aparece em /admin/atendimento/resgates.
 *
 *   ?t=<unsubscribe_token>&r=<motivo>  → grava o motivo (no navegador)
 *   ?t=<unsubscribe_token>             → mostra as opções
 *   ?t=<unsubscribe_token>&sair=1      → descadastro, com um toque
 */
import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { appDb } from '@/lib/supabase/server';
import { MotivoForm, SairForm } from './MotivoForm';
import { ehMotivo, UUID } from './opcoes';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Ninho',
  robots: { index: false, follow: false },
};

/** Idioma do app da pessoa (o mesmo do e-mail); sem ele, o do navegador. */
async function idiomaDe(token: string, valido: boolean): Promise<'pt' | 'en'> {
  if (valido) {
    try {
      const { data } = await appDb().from('profiles').select('locale').eq('unsubscribe_token', token).maybeSingle();
      const locale = (data?.locale as string | null) ?? null;
      if (locale) return locale.toLowerCase().startsWith('en') ? 'en' : 'pt';
    } catch {
      // sem banco (ex.: máquina sem .env.local): cai no navegador
    }
  }
  return (headers().get('accept-language') ?? '').toLowerCase().startsWith('en') ? 'en' : 'pt';
}

export default async function MotivoPage({ searchParams }: { searchParams: { t?: string; r?: string; sair?: string } }) {
  const token = searchParams.t ?? '';
  const valido = UUID.test(token);
  const idioma = await idiomaDe(token, valido);

  return (
    <main className="min-h-screen bg-ninho-lavanda px-4 py-12 font-sans">
      <div className="mx-auto max-w-[440px] overflow-hidden rounded-3xl bg-white shadow-sm">
        <div className="bg-ninho-roxo py-6 text-center">
          <p className="text-[22px] font-black tracking-[3px] text-white">NINHO</p>
        </div>
        <div className="px-6 py-8">
          {!valido ? (
            <p className="text-[15px] text-ninho-cinza">
              {idioma === 'en' ? 'This link is not valid.' : 'Este link não é válido.'}
            </p>
          ) : searchParams.sair ? (
            <SairForm token={token} idioma={idioma} />
          ) : (
            <MotivoForm token={token} inicial={ehMotivo(searchParams.r) ? searchParams.r : null} idioma={idioma} />
          )}
        </div>
      </div>
    </main>
  );
}
