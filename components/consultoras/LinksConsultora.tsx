/**
 * Os dois links da consultora (dono, 12/11/2026; 00144 do app). Desenho
 * aprovado: docs/design/consultora/links-divulgacao-consultoria.html (Ninho-expo).
 *  - Link da CONSULTORIA (principal, em cima e em destaque): para as clientes.
 *    Depois do cadastro do bebê, a família aprova ou recusa compartilhar a
 *    rotina; se aprovar, a consultora confirma em Famílias.
 *  - Link de DIVULGAÇÃO (embaixo, menor): para publicar. Só comissão.
 */
import { SITE_URL } from '@/lib/config';
import { CopyLink } from '@/components/admin/CopyLink';

export function linksDaConsultora(codigo: string) {
  const c = codigo.toLowerCase();
  return { consultoria: `${SITE_URL}/consultoria/${c}`, divulgacao: `${SITE_URL}/indica/${c}`, antigo: `${SITE_URL}/c/${c}` };
}

function Lua({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5a8.5 8.5 0 1 0 10.7 10.7Z" />
    </svg>
  );
}

function Instagram({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.9} aria-hidden>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

const IG = 'radial-gradient(circle at 30% 107%,#fdf497 0%,#fdf497 5%,#fd5949 45%,#d6249f 60%,#285AEB 90%)';

/** `comConsultoria`: o link da consultoria só aparece para quem está liberada
 *  (lib/link-consultora.ts, CONSULTORIA_LIBERADA_PARA). */
export function LinksConsultora({ codigo, compacto = false, comConsultoria }: { codigo: string; compacto?: boolean; comConsultoria: boolean }) {
  const l = linksDaConsultora(codigo);
  const msg = `Oi! Para eu acompanhar a rotina do seu bebê, baixe o Ninho por este link: ${l.consultoria}`;
  const zap = `https://wa.me/?text=${encodeURIComponent(msg)}`;
  return (
    <>
      {comConsultoria && (
      <section className="rounded-[22px] bg-white p-5 shadow-[inset_0_0_0_2px_#CDB8FB,0_14px_34px_-22px_rgba(140,92,248,.9)] sm:p-6">
        <div className="flex items-center gap-3">
          <span className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full bg-gradient-primary text-white">
            <Lua className="h-6 w-6" />
          </span>
          <div className="leading-tight">
            <h2 className="text-[19px] font-black text-[#24164F]">Link da consultoria</h2>
            <span className="mt-1 inline-block rounded-pill bg-[#E7F5EC] px-2.5 py-0.5 text-[11.5px] font-extrabold text-[#2F8A55]">Para as suas clientes</span>
          </div>
        </div>
        <div className={`mt-4 grid gap-5 ${compacto ? '' : 'lg:grid-cols-[1.1fr_1fr]'}`}>
          <div className="min-w-0">
            <CopyLink url={l.consultoria} />
            <div className="mt-2.5 flex flex-wrap gap-2">
              <a href={zap} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center justify-center rounded-pill bg-[#F1EBFC] px-4 text-[13px] font-bold text-[#7C5CD6]">
                Mandar no WhatsApp
              </a>
            </div>
            <p className="mt-3 text-[13px] leading-relaxed text-[#4d4a5c]">
              Mande para a família que você atende. Ela baixa o Ninho e, depois do cadastro do bebê, o app pergunta se ela aprova compartilhar a
              rotina com você. Também gera comissão.
            </p>
          </div>
          {!compacto && (
            <div className="min-w-0">
              <ol className="space-y-2 text-[13px] leading-snug text-[#4d4a5c]">
                {[
                  <>A família abre o link e baixa o Ninho (quem já tem toca em <b>Já tenho o Ninho</b>).</>,
                  <>Depois do cadastro do bebê, ela <b>aprova</b> ou <b>recusa</b> compartilhar a rotina com você.</>,
                  <>Se aprovar, você confirma em <b>Famílias</b> e a rotina aparece.</>,
                ].map((t, i) => (
                  <li key={i} className="flex gap-2.5">
                    <span className="flex h-[21px] w-[21px] shrink-0 items-center justify-center rounded-full bg-[#EFE8FC] text-[11.5px] font-black text-[#7C5CD6]">{i + 1}</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
        <div className="mt-4 rounded-[14px] bg-[#FDEEEE] px-3.5 py-2.5 text-[12.5px] leading-relaxed text-[#8A2E2E]">
          <b>Não publique este link.</b> Ele pede para a pessoa compartilhar a rotina do bebê com você.
        </div>
      </section>
      )}

      <section className={`${comConsultoria ? 'mt-3.5 ' : ''}rounded-[22px] bg-white p-4 shadow-[0_10px_30px_-22px_rgba(80,40,160,.35)] sm:px-5`}>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
          <div className="flex shrink-0 items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full text-white" style={{ background: IG }}>
              <Instagram className="h-5 w-5" />
            </span>
            <div className="leading-tight">
              <h2 className="text-[15px] font-black text-[#24164F]">Link de divulgação</h2>
              <span className="mt-0.5 inline-block rounded-pill bg-[#FDEBF3] px-2.5 py-0.5 text-[11px] font-extrabold text-[#B8306E]">Instagram, stories, grupos</span>
            </div>
          </div>
          <div className="min-w-[260px] flex-1">
            <CopyLink url={l.divulgacao} />
          </div>
        </div>
        <p className="mt-3 text-[12.5px] leading-relaxed text-ninho-cinza">
          Para publicar. Quem baixar por ele <b className="text-[#24164F]">não fica ligado a você</b>; se a família assinar, <b className="text-[#24164F]">você ganha a comissão</b>. O link antigo ({l.antigo.replace(/^https?:\/\//, '')}) continua valendo como este.
        </p>
      </section>
    </>
  );
}
