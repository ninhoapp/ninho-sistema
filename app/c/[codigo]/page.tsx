/**
 * /c/<codigo> — página que a família abre pelo link da consultora.
 * Mostra nome, foto e o selo "Consultora independente", os botões das lojas
 * e o passo a passo com o código grande. Código inexistente ou consultora
 * pausada: "Link indisponível", sem dizer se o código existe.
 *
 * TODO(frente Parceiros): rastreio do clique (como em /r/[code]) para a
 * atribuição no cadastro (consultora_indicacoes.metodo 'link'). Não fazer aqui.
 */
import type { Metadata } from 'next';
import { consultoraAtivaPorCodigo } from '@/lib/consultoras';
import { SitePage, StoreButtons } from '@/components/site/SiteChrome';
import '@/components/site/consultora.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Sua consultora de sono no Ninho',
  robots: { index: false, follow: false },
};

export default async function LinkConsultoraPage({ params }: { params: { codigo: string } }) {
  let c: Awaited<ReturnType<typeof consultoraAtivaPorCodigo>> = null;
  try {
    c = await consultoraAtivaPorCodigo(decodeURIComponent(params.codigo || ''));
  } catch (e) {
    console.error('[c/codigo] falhou:', e instanceof Error ? e.message : e);
  }

  if (!c) {
    return (
      <SitePage>
        <div className="nc">
          <section className="n-wrap nc-ok" style={{ padding: '72px 24px' }}>
            <h2>Link indisponível</h2>
            <p>Este link não está ativo agora. Você pode baixar o Ninho e, se tiver o código da sua consultora, digitar no app.</p>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20 }}><StoreButtons /></div>
          </section>
        </div>
      </SitePage>
    );
  }

  const primeiro = (c.nome ?? '').split(' ')[0] || 'sua consultora';
  const iniciais = (c.nome ?? '?').split(/\s+/).filter(Boolean).map((x) => x[0]).slice(0, 2).join('').toUpperCase();
  return (
    <SitePage>
      <div className="nc">
        <section className="n-wrap" style={{ padding: '56px 24px 72px', maxWidth: 640 }}>
          <div className="nc-card" style={{ padding: 28, textAlign: 'center' }}>
            {c.foto_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={c.foto_url} alt="" width={96} height={96} style={{ width: 96, height: 96, borderRadius: '50%', objectFit: 'cover', margin: '0 auto' }} />
            ) : (
              <div style={{ width: 96, height: 96, borderRadius: '50%', background: '#9F86E0', color: '#fff', fontWeight: 900, fontSize: 34, display: 'grid', placeItems: 'center', margin: '0 auto' }}>{iniciais}</div>
            )}
            <h1 style={{ fontSize: 26, fontWeight: 900, margin: '14px 0 0' }}>{c.nome}</h1>
            <span className="nc-tag" style={{ display: 'inline-block', marginTop: 8 }}>Consultora independente</span>
            {(c.cidade || c.uf) && <p style={{ color: '#6B6F80', fontSize: 14, margin: '8px 0 0' }}>{[c.cidade, c.uf].filter(Boolean).join(' · ')}</p>}
            <p style={{ fontSize: 16, color: '#3D3849', margin: '18px 0 0', lineHeight: 1.5 }}>
              {primeiro} usa o Ninho para acompanhar a rotina do seu bebê. Baixe o app, registre o dia do bebê e
              compartilhe a rotina com ela.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20 }}><StoreButtons /></div>
          </div>

          <div className="nc-card" style={{ padding: 24, marginTop: 16 }}>
            <h3>Como compartilhar a rotina com {primeiro}</h3>
            <ol style={{ margin: '12px 0 0', paddingLeft: 20, lineHeight: 1.7, fontSize: 15, color: '#3D3849' }}>
              <li>Baixe o Ninho e crie a sua conta.</li>
              <li>Cadastre o seu bebê.</li>
              <li>No app, abra <b>Cuidador ou Consultor › Adicionar › Consultora de sono</b>.</li>
              <li>Digite o código abaixo e confirme o que ela vai poder ver.</li>
            </ol>
            <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.1em', color: '#9A95AD', margin: '18px 0 0', textAlign: 'center' }}>CÓDIGO</p>
            <p style={{ fontSize: 40, fontWeight: 900, letterSpacing: '.14em', color: '#24164F', margin: 0, textAlign: 'center' }}>{c.codigo}</p>
            <p style={{ fontSize: 12.5, color: '#6B6F80', margin: '14px 0 0', lineHeight: 1.5 }}>
              Ela vê só para leitura o nome e a idade do bebê, os primeiros nomes de quem registra e a rotina (sono, mamadas, fraldas e comida), e só depois que você aceitar no app. Os detalhes aparecem antes de você confirmar. Você pode tirar o acesso
              quando quiser. As orientações são de responsabilidade dela e não substituem o pediatra.
            </p>
          </div>
        </section>
      </div>
    </SitePage>
  );
}
