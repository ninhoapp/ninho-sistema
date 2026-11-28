import {
  AREIA,
  Aceite,
  BarraDaConsultora,
  Campo,
  Celular,
  Corpo,
  Dedo,
  Dica,
  FUNDO,
  GRAD_FIM,
  HEAD_BOTTOM,
  HEAD_TOP,
  Head,
  IconeRedondo,
  Iniciais,
  LILAS,
  LILAS_CLARO,
  LILAS_ESCURO,
  Modulo,
  Pilula,
  ROXO_FUNDO,
  Rotulo,
  SOMBRA_MODULO,
  TINTA,
  TINTA_FRACA,
  Titulo,
  VERDE,
} from '@/components/consultoras/Celular';
import {
  IconeApple,
  IconeBusca,
  IconeCheck,
  IconeCompartilhar,
  IconeEnvelope,
  IconeEstrela,
  IconeInstagram,
  IconeLua,
  IconeOlho,
  IconePessoaMais,
  IconePessoas,
  IconeSeta,
  IconeZapBranco,
  LogoGoogle,
} from '@/components/consultoras/IconesApp';
import { fmtData, fmtHora, textos, type Idioma } from '@/lib/i18n-consultora';

/**
 * Telas do app desenhadas para o manual da consultora (painel e PDF).
 *
 * Fidelidade (dono, 14/11/2026: "está muito 'animação', quero ainda mais fiel
 * e sem ter que mandar print"): cada tela é desenhada no tamanho REAL do app
 * (390 x 844, ver `Celular.tsx`), com os mesmos números do código e os textos
 * EXATOS do app. Nada aqui é print nem foto: é desenho tirado do código.
 *
 * De onde vem cada texto, no Ninho-expo (`src/i18n/locales/pt`):
 *   - entrada e cadastro: `auth.ts` (login, signup, verify)
 *   - termo, modo consultora, Início, Convidar, pedidos, perfil e
 *     apresentação: `consultora.ts`
 *   - "Quem você quer adicionar?" e Cuidador ou Consultor: `account.ts`
 *   - lista "Encontrar consultora de sono": `consultants.ts`
 * A geometria vem de `AppHeader.tsx`, `features/consultora/ui.tsx` e
 * `BarraConsultora.tsx`. Mudou no app, mude aqui.
 *
 * Idioma (25/11/2026): cada tela aceita `idioma` (padrão 'pt', o que o dono
 * vê) e usa os textos do app naquele idioma (dicionário `manual.telas`).
 */
export const MAE = 'Mariana';
export const BEBE = 'Lara';

/** Altura da tela do app (a mesma do Celular). */
const H_TELA = 844;
const ROXO_LINK = '#7C5CD6';

/** Horas e datas de exemplo, fixas (UTC), no formato de cada idioma. */
const hora = (idioma: Idioma, h: number, m: number) => fmtHora(idioma, Date.UTC(2026, 10, 14, h, m));
const DIA_PEDIDO = Date.UTC(2026, 10, 14, 12);

// ── App Store ─────────────────────────────────────────────
export function TelaLoja({ idioma = 'pt' }: { idioma?: Idioma } = {}) {
  const t = textos(idioma).manual.telas;
  return (
    <Celular legenda={t.lojaLegenda} fundo="#FFFFFF" statusEscura>
      <div style={{ paddingTop: 58, paddingLeft: 18, paddingRight: 18 }}>
        <div style={{ display: 'flex', gap: 14 }}>
          <div style={{ width: 104, height: 104, borderRadius: 24, overflow: 'hidden', border: '1px solid #ECECF2', flexShrink: 0, background: '#FFFFFF' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/manual/logo-ninho.png" alt="" width={104} height={104} style={{ display: 'block' }} />
          </div>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: 19, fontWeight: 700, color: '#1C1C1E', lineHeight: '23px' }}>Ninho</p>
              <p style={{ fontSize: 13.5, color: '#8A8A8E', marginTop: 2 }}>{t.lojaSub}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
              <div style={{ position: 'relative', height: 30, borderRadius: 999, background: '#0A84FF', color: '#FFFFFF', fontSize: 14.5, fontWeight: 700, display: 'flex', alignItems: 'center', padding: '0 24px' }}>
                {t.lojaObter}
                <Dedo style={{ right: -10, bottom: -18 }} />
              </div>
              <span style={{ fontSize: 12, color: '#8A8A8E' }}>{t.lojaCompras}</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 26, marginTop: 26, paddingBottom: 14, borderBottom: '1px solid #EFEFF4' }}>
          <div>
            <p style={{ fontSize: 10.5, fontWeight: 600, color: '#8A8A8E', letterSpacing: 0.4 }}>{t.lojaAvaliacoes}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#48484A' }}>{t.lojaNota}</p>
              <IconeEstrela size={13} color="#8A8A8E" />
            </div>
          </div>
          <div>
            <p style={{ fontSize: 10.5, fontWeight: 600, color: '#8A8A8E', letterSpacing: 0.4 }}>{t.lojaIdade}</p>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#48484A', marginTop: 3 }}>4+</p>
          </div>
          <div>
            <p style={{ fontSize: 10.5, fontWeight: 600, color: '#8A8A8E', letterSpacing: 0.4 }}>{t.lojaCategoria}</p>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#48484A', marginTop: 3 }}>{t.lojaEstilo}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 18 }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: 150,
                height: 300,
                borderRadius: 18,
                border: '1px solid #ECECF2',
                background: `linear-gradient(180deg, ${HEAD_TOP} 0%, ${HEAD_BOTTOM} 25%, ${FUNDO} 25.2%)`,
                flexShrink: 0,
                padding: 10,
              }}
            >
              <div style={{ height: 56 }} />
              <div style={{ background: '#FFFFFF', borderRadius: 14, height: 70, boxShadow: SOMBRA_MODULO }} />
              <div style={{ background: '#FFFFFF', borderRadius: 14, height: 54, marginTop: 10, boxShadow: SOMBRA_MODULO }} />
              <div style={{ background: '#FFFFFF', borderRadius: 14, height: 84, marginTop: 10, boxShadow: SOMBRA_MODULO }} />
            </div>
          ))}
        </div>
      </div>
    </Celular>
  );
}

// ── Entrada e cadastro ────────────────────────────────────
function BotaoEntrada({ children, icone, escuro = false, dedo = false }: { children: React.ReactNode; icone: React.ReactNode; escuro?: boolean; dedo?: boolean }) {
  return (
    <div
      style={{
        position: 'relative',
        height: 52,
        borderRadius: 999,
        background: escuro ? '#111114' : '#FFFFFF',
        border: escuro ? 'none' : '1.5px solid #E6E0F0',
        color: escuro ? '#FFFFFF' : TINTA,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        fontSize: 15.5,
        fontWeight: 700,
      }}
    >
      {icone}
      {children}
      {dedo && <Dedo />}
    </div>
  );
}

export function TelaLogin({ dedo, idioma = 'pt' }: { dedo: 'google' | 'email'; idioma?: Idioma }) {
  const t = textos(idioma).manual.telas;
  return (
    <Celular legenda={t.loginLegenda} fundo={FUNDO} statusEscura>
      {/* Palco de cima: no app roda a animação da entrada por trás do vidro. */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 440, background: `linear-gradient(160deg, #E9DCFF, ${LILAS_CLARO} 60%, ${FUNDO})` }}>
        <div style={{ position: 'absolute', top: 130, left: 28, right: 28, borderRadius: 26, background: '#FFFFFF', boxShadow: SOMBRA_MODULO, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <IconeRedondo size={40} cor={LILAS_CLARO}>
              <IconeLua size={19} color={LILAS_ESCURO} />
            </IconeRedondo>
            <div>
              <p style={{ fontSize: 14.5, fontWeight: 800, color: TINTA }}>{t.soneca}</p>
              <p style={{ fontSize: 12.5, color: TINTA_FRACA, marginTop: 1 }}>{t.sonecaDetalhe(hora(idioma, 13, 5))}</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 14 }}>
            <IconeRedondo size={40} cor="#FDE9D7">
              <IconeEnvelope size={19} color="#E58A1F" />
            </IconeRedondo>
            <div>
              <p style={{ fontSize: 14.5, fontWeight: 800, color: TINTA }}>{t.mamadeira}</p>
              <p style={{ fontSize: 12.5, color: TINTA_FRACA, marginTop: 1 }}>{t.mamadeiraDetalhe}</p>
            </div>
          </div>
        </div>
      </div>
      {/* Folha de vidro de baixo, com o texto e os botões. */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 404, borderTopLeftRadius: 34, borderTopRightRadius: 34, background: 'rgba(255,255,255,0.82)', padding: 26, paddingTop: 28 }}>
        <p style={{ fontSize: 26, fontWeight: 800, lineHeight: '30px', letterSpacing: -0.5, color: TINTA }}>
          {t.heroTopo}
          <br />
          <span style={{ color: GRAD_FIM }}>{t.heroBaixo}</span>
        </p>
        <p style={{ fontSize: 14, color: TINTA_FRACA, marginTop: 6 }}>{t.heroSub}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 18 }}>
          <BotaoEntrada escuro icone={<IconeApple size={18} />}>
            {t.continuarApple}
          </BotaoEntrada>
          <BotaoEntrada icone={<LogoGoogle size={17} />} dedo={dedo === 'google'}>
            {t.continuarGoogle}
          </BotaoEntrada>
          <BotaoEntrada icone={<IconeEnvelope size={18} color={LILAS_ESCURO} />}>{t.continuarEmail}</BotaoEntrada>
        </div>
        <p style={{ position: 'relative', fontSize: 12, color: TINTA_FRACA, textAlign: 'center', lineHeight: '18px', marginTop: 16 }}>
          {t.novoAqui} <b style={{ color: ROXO_LINK }}>{t.criarConta}</b>
          {'  ·  '}
          <b style={{ color: ROXO_LINK }}>{t.termos}</b>
          {'  ·  '}
          <b style={{ color: ROXO_LINK }}>{t.privacidade}</b>
          {dedo === 'email' && <Dedo style={{ right: 118, bottom: -26 }} />}
        </p>
      </div>
    </Celular>
  );
}

export function TelaCriarConta({ email, idioma = 'pt' }: { email: string; idioma?: Idioma }) {
  const t = textos(idioma).manual.telas;
  return (
    <Celular legenda={t.criarContaLegenda} fundo={FUNDO} statusEscura>
      <div style={{ paddingTop: 76, paddingLeft: 22, paddingRight: 22 }}>
        <p style={{ fontSize: 26, fontWeight: 800, color: TINTA, letterSpacing: -0.5 }}>{t.criarConta}</p>
        <p style={{ fontSize: 14, color: TINTA_FRACA, marginTop: 6 }}>{t.criarContaSub}</p>
        <div style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <p style={{ color: TINTA_FRACA, fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>{t.email}</p>
            <div style={{ height: 52, borderRadius: 16, background: '#FFFFFF', border: `1.5px solid ${LILAS}`, display: 'flex', alignItems: 'center', padding: '0 14px', fontSize: 14.5, fontWeight: 700, color: TINTA, overflow: 'hidden' }}>
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{email}</span>
            </div>
          </div>
          <div>
            <p style={{ color: TINTA_FRACA, fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>{t.senha}</p>
            <div style={{ height: 52, borderRadius: 16, background: '#FFFFFF', border: '1.5px solid #ECE6F5', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px', color: TINTA }}>
              <span style={{ letterSpacing: 3, fontSize: 16, fontWeight: 700 }}>••••••••</span>
              <IconeOlho size={19} color={TINTA_FRACA} />
            </div>
          </div>
          <div>
            <p style={{ color: TINTA_FRACA, fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>{t.repitaSenha}</p>
            <div style={{ height: 52, borderRadius: 16, background: '#FFFFFF', border: '1.5px solid #ECE6F5', display: 'flex', alignItems: 'center', padding: '0 14px', color: TINTA }}>
              <span style={{ letterSpacing: 3, fontSize: 16, fontWeight: 700 }}>••••••••</span>
            </div>
          </div>
          <div style={{ marginTop: 6 }}>
            <Pilula dedo>{t.criarConta}</Pilula>
          </div>
          <p style={{ fontSize: 12.5, color: TINTA_FRACA, textAlign: 'center' }}>
            {t.jaTemConta} <b style={{ color: ROXO_LINK }}>{t.entrar}</b>
          </p>
        </div>
      </div>
    </Celular>
  );
}

export function TelaConfirmar({ email, idioma = 'pt' }: { email?: string; idioma?: Idioma }) {
  const t = textos(idioma).manual.telas;
  return (
    <Celular legenda={t.confirmarLegenda} fundo={FUNDO} statusEscura>
      <div style={{ paddingTop: 76, paddingLeft: 22, paddingRight: 22 }}>
        <p style={{ fontSize: 26, fontWeight: 800, color: TINTA, letterSpacing: -0.5 }}>{t.confirmarTitulo}</p>
        <p style={{ fontSize: 14, color: TINTA_FRACA, marginTop: 6, lineHeight: '20px' }}>
          {t.confirmarSub(email)}
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 26 }}>
          {['4', '8', '1', '9', '2', '7'].map((d, i) => (
            <div
              key={i}
              style={{ width: 48, height: 58, borderRadius: 14, background: '#FFFFFF', border: '1.5px solid #ECE6F5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 800, color: TINTA }}
            >
              {d}
            </div>
          ))}
        </div>
        <div style={{ marginTop: 26 }}>
          <Pilula dedo>{t.confirmar}</Pilula>
        </div>
      </div>
    </Celular>
  );
}

// ── Termo da Consultora ───────────────────────────────────
export function TelaTermo({ primeiro, idioma = 'pt' }: { primeiro: string; idioma?: Idioma }) {
  const t = textos(idioma).manual.telas;
  return (
    <Celular legenda={t.termoLegenda}>
      <Head titulo={t.termoBemVinda(primeiro)} sub={t.termoPronta} semAcoes />
      <Corpo>
        <Modulo>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <IconeRedondo size={46}>
              <IconeCheck size={20} color={LILAS_ESCURO} />
            </IconeRedondo>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Titulo>{t.termoLiberada}</Titulo>
              <Dica style={{ marginTop: 3 }}>{t.termoLiberadaCorpo}</Dica>
            </div>
          </div>
        </Modulo>
        <Modulo>
          <Rotulo>{t.termoRotulo}</Rotulo>
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 9 }}>
            {t.termoItens.map((txt, i) => (
              <div key={i} style={{ display: 'flex', gap: 10 }}>
                <div style={{ width: 22, height: 22, borderRadius: 11, background: LILAS_CLARO, color: LILAS_ESCURO, fontSize: 11.5, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                  {i + 1}
                </div>
                <p style={{ flex: 1, color: TINTA, fontSize: 13.5, lineHeight: '20px' }}>{txt}</p>
              </div>
            ))}
            <p style={{ color: TINTA_FRACA, fontSize: 13, paddingLeft: 32 }}>…</p>
          </div>
          <div style={{ marginTop: 14 }}>
            <Aceite>{t.termoAceito}</Aceite>
          </div>
          <div style={{ marginTop: 14 }}>
            <Pilula dedo>{t.comecar}</Pilula>
          </div>
        </Modulo>
      </Corpo>
    </Celular>
  );
}

// ── Início da consultora ──────────────────────────────────
export function TelaInicioVazio({ nome = 'Nathalia', idioma = 'pt' }: { nome?: string; idioma?: Idioma }) {
  const t = textos(idioma).manual.telas;
  return (
    <Celular legenda={t.inicioLegenda}>
      <Head titulo={t.inicio} sub={t.bomDiaFamilias(nome, 0)} />
      <Corpo>
        <Modulo>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Titulo>{t.suasFamilias}</Titulo>
            <span style={{ color: LILAS_ESCURO, fontSize: 13, fontWeight: 700 }}>0</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, paddingTop: 14, paddingBottom: 14 }}>
            <IconeRedondo size={52}>
              <IconePessoas size={24} color={LILAS} />
            </IconeRedondo>
            <p style={{ color: TINTA, fontSize: 16, fontWeight: 800, marginTop: 4 }}>{t.nenhumaFamilia}</p>
            <p style={{ color: TINTA_FRACA, fontSize: 13, lineHeight: '19px', textAlign: 'center' }}>
              {t.nenhumaFamiliaCorpo}
            </p>
            <div style={{ alignSelf: 'stretch', marginTop: 4 }}>
              <Pilula tom="suave" icone={<IconePessoaMais size={18} color={LILAS_ESCURO} />} dedo>
                {t.convidarFamilia}
              </Pilula>
            </div>
          </div>
        </Modulo>
      </Corpo>
      <BarraDaConsultora ativa="Início" idioma={idioma} />
    </Celular>
  );
}

// ── Convidar família ──────────────────────────────────────
export function TelaConvidar({ codigo, idioma = 'pt' }: { codigo: string; idioma?: Idioma }) {
  const t = textos(idioma).manual.telas;
  return (
    <Celular legenda={t.convidarLegenda}>
      <Head titulo={t.convidarFamilia} sub={t.convidarSub} />
      <Corpo>
        <Modulo padding={16}>
          <Rotulo>{t.codigo}</Rotulo>
          <p style={{ fontSize: 24, fontWeight: 900, letterSpacing: 3, color: ROXO_FUNDO, marginTop: 2 }}>{codigo}</p>
          <Dica style={{ marginTop: 4 }}>
            {t.codigoDica}
          </Dica>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <div style={{ flex: 1 }}>
              <Pilula icone={<IconeZapBranco size={18} />} dedo>
                {t.whatsapp}
              </Pilula>
            </div>
            <div style={{ flex: 1 }}>
              <Pilula tom="linha" icone={<IconeCompartilhar size={18} color={LILAS_ESCURO} />}>
                {t.compartilhar}
              </Pilula>
            </div>
          </div>
        </Modulo>
        <Modulo>
          <Titulo>{t.porEmailTitulo}</Titulo>
          <Dica style={{ marginTop: 6 }}>
            {t.porEmailDica}
          </Dica>
          <Campo placeholder={t.emailFamilia} style={{ marginTop: 12 }} />
        </Modulo>
      </Corpo>
      <BarraDaConsultora ativa="Convidar" idioma={idioma} />
    </Celular>
  );
}

/** A conversa no WhatsApp, com a mensagem que o app manda de verdade. */
export function TelaWhatsAppConvite({ codigo, idioma = 'pt' }: { codigo: string; idioma?: Idioma }) {
  const t = textos(idioma).manual.telas;
  return (
    <Celular legenda={t.zapLegenda} fundo="#EFE7DE">
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 100, background: '#075E54' }} />
      <div style={{ position: 'relative', paddingTop: 50, paddingLeft: 14, paddingRight: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
        <IconeSeta dir="direita" size={22} color="#FFFFFF" />
        <Iniciais nome={MAE} size={38} cor="#C066AE" />
        <div>
          <p style={{ color: '#FFFFFF', fontSize: 15.5, fontWeight: 700 }}>{MAE}</p>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11.5 }}>{t.zapOnline}</p>
        </div>
      </div>
      <div style={{ paddingTop: 26, paddingLeft: 14, paddingRight: 14 }}>
        <div style={{ marginLeft: 'auto', maxWidth: 300, background: '#DCF8C6', borderRadius: 14, borderTopRightRadius: 4, padding: '10px 12px 6px' }}>
          <p style={{ fontSize: 13.5, lineHeight: '19px', color: '#111114', whiteSpace: 'pre-line' }}>
            {t.zapMensagem(codigo)}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 2 }}>
            <span style={{ fontSize: 10.5, color: '#667781' }}>9:41</span>
            <svg width="16" height="11" viewBox="0 0 18 12" fill="none" stroke="#34B7F1" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
              <path d="M1 7l3.2 3.2L10.5 3" />
              <path d="M6.5 7l3.2 3.2L16 3" />
            </svg>
          </div>
        </div>
      </div>
    </Celular>
  );
}

// ── Lado da família ───────────────────────────────────────
export function TelaFamiliaAdicionar({ idioma = 'pt' }: { idioma?: Idioma } = {}) {
  const t = textos(idioma).manual.telas;
  const opcao = (titulo: string, corpo: string, destaque = false) => (
    <div key={titulo} style={{ position: 'relative', borderRadius: 20, background: destaque ? LILAS_CLARO : '#F7F5FB', border: destaque ? `1.5px solid ${LILAS}` : '1.5px solid transparent', padding: 14, display: 'flex', gap: 12, alignItems: 'center' }}>
      <IconeRedondo size={42} cor={destaque ? '#FFFFFF' : LILAS_CLARO}>
        {destaque ? <IconeLua size={19} color={LILAS_ESCURO} /> : <IconePessoas size={19} color={LILAS_ESCURO} />}
      </IconeRedondo>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ color: TINTA, fontSize: 15, fontWeight: 800 }}>{titulo}</p>
        <p style={{ color: TINTA_FRACA, fontSize: 12.5, lineHeight: '17px', marginTop: 2 }}>{corpo}</p>
      </div>
      {destaque && <Dedo style={{ right: 10, bottom: -14 }} />}
    </div>
  );
  return (
    <Celular legenda={t.adicionarLegenda}>
      <Head titulo={t.cuidadorOuConsultor} sub={t.quemAcompanha(BEBE)} />
      <Corpo style={{ opacity: 0.4 }}>
        <Modulo>
          <Rotulo>{t.quemCuida}</Rotulo>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
            <Iniciais nome={MAE} size={42} cor="#C066AE" />
            <div>
              <p style={{ fontSize: 15, fontWeight: 800, color: TINTA }}>{MAE}</p>
              <p style={{ fontSize: 12.5, color: TINTA_FRACA }}>{t.maeResponsavel}</p>
            </div>
          </div>
        </Modulo>
      </Corpo>
      {/* Folha que sobe de baixo ao tocar em Adicionar. */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, borderTopLeftRadius: 30, borderTopRightRadius: 30, background: '#FFFFFF', padding: 22, paddingBottom: 34, boxShadow: '0 -14px 34px -14px rgba(35,26,61,.35)' }}>
        <div style={{ width: 44, height: 5, borderRadius: 999, background: '#E4DEF0', margin: '0 auto 16px' }} />
        <p style={{ fontSize: 19, fontWeight: 800, color: TINTA }}>{t.quemAdicionar}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
          {opcao(t.cuidadorFamilia, t.cuidadorFamiliaCorpo)}
          {opcao(t.consultoraSono, t.consultoraSonoCorpo, true)}
        </div>
      </div>
    </Celular>
  );
}

export function TelaFamiliaCodigo({ codigo, nome, idioma = 'pt' }: { codigo: string; nome: string; idioma?: Idioma }) {
  const t = textos(idioma).manual.telas;
  return (
    <Celular legenda={t.familiaCodigoLegenda}>
      <Head titulo={t.consultoraSono} sub={t.familiaSub} />
      <Corpo>
        <Modulo padding={16}>
          <p style={{ color: TINTA_FRACA, fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>{t.codigoConsultora}</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1, height: 48, borderRadius: 16, background: '#F5F2FB', display: 'flex', alignItems: 'center', padding: '0 14px', fontSize: 16, fontWeight: 800, letterSpacing: 2, color: TINTA }}>
              {codigo}
            </div>
            <div style={{ height: 48, borderRadius: 999, background: '#F1EBFC', color: LILAS_ESCURO, fontSize: 13.5, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6, padding: '0 16px' }}>
              <IconeBusca size={16} color={LILAS_ESCURO} />
              {t.buscar}
            </div>
          </div>
        </Modulo>
        <Modulo>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Iniciais nome={nome} size={46} cor="#C066AE" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 16, fontWeight: 800, color: TINTA }}>{nome}</p>
              <p style={{ fontSize: 12.5, color: TINTA_FRACA, marginTop: 1 }}>{t.consultoraIndependenteSono}</p>
            </div>
          </div>
          <div style={{ marginTop: 14 }}>
            <Aceite>{t.familiaAceite(nome, BEBE)}</Aceite>
          </div>
          <div style={{ marginTop: 14 }}>
            <Pilula dedo>{t.compartilharRotina}</Pilula>
          </div>
        </Modulo>
      </Corpo>
    </Celular>
  );
}

export function TelaSininho({ nome, idioma = 'pt' }: { nome: string; idioma?: Idioma }) {
  const t = textos(idioma).manual.telas;
  return (
    <Celular legenda={t.sininhoLegenda}>
      <Head titulo={t.pedidosConsultora} sub={t.pedidosConsultoraSub} />
      <Corpo>
        <Modulo>
          <Rotulo>{t.convitesRecebidos}</Rotulo>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
            <Iniciais nome={nome} size={44} cor="#C066AE" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 15.5, fontWeight: 800, color: TINTA }}>{nome}</p>
              <Dica style={{ marginTop: 2 }}>{t.querAcompanhar(nome)}</Dica>
            </div>
          </div>
          <p style={{ color: TINTA_FRACA, fontSize: 12.5, fontWeight: 700, marginTop: 14 }}>{t.qualBebe}</p>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <span style={{ borderRadius: 999, background: LILAS_CLARO, color: LILAS_ESCURO, fontSize: 13.5, fontWeight: 800, padding: '9px 16px' }}>{BEBE}</span>
            <span style={{ borderRadius: 999, background: AREIA, color: TINTA_FRACA, fontSize: 13.5, fontWeight: 700, padding: '9px 16px' }}>Theo</span>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <div style={{ flex: 1 }}>
              <Pilula tom="cinza">{t.recusar}</Pilula>
            </div>
            <div style={{ flex: 1 }}>
              <Pilula dedo>{t.aprovar}</Pilula>
            </div>
          </div>
        </Modulo>
      </Corpo>
    </Celular>
  );
}

// ── Pedido para a consultora ──────────────────────────────
export function TelaPedido({ idioma = 'pt' }: { idioma?: Idioma } = {}) {
  const t = textos(idioma).manual.telas;
  return (
    <Celular legenda={t.pedidoLegenda}>
      <Head titulo={t.inicio} sub={t.bomDiaFamilias('Nathalia', 0)} sinoComAviso />
      <Corpo>
        <Modulo>
          <Rotulo>{t.pedidosFamilias}</Rotulo>
          <Dica style={{ marginTop: 6 }}>{t.pedidosFamiliasDica}</Dica>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 14 }}>
            <Iniciais nome={BEBE} size={44} cor="#4583D6" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 15.5, fontWeight: 800, color: TINTA }}>
                {MAE} · {BEBE}
              </p>
              <p style={{ fontSize: 12.5, color: TINTA_FRACA, marginTop: 1 }}>{t.pediuEm(fmtData(idioma, DIA_PEDIDO, { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' }))}</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <div style={{ flex: 1 }}>
              <Pilula tom="cinza">{t.recusar}</Pilula>
            </div>
            <div style={{ flex: 1 }}>
              <Pilula dedo>{t.aprovar}</Pilula>
            </div>
          </div>
        </Modulo>
      </Corpo>
      {/* Aviso do sistema, como chega no alto da tela. */}
      <div style={{ position: 'absolute', top: 58, left: 10, right: 10, borderRadius: 22, background: 'rgba(255,255,255,0.96)', padding: 14, boxShadow: '0 12px 28px -10px rgba(40,20,90,.45)', display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, overflow: 'hidden', flexShrink: 0 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/manual/logo-ninho.png" alt="" width={38} height={38} style={{ display: 'block' }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#6B6F80', letterSpacing: 0.3 }}>{t.avisoApp}</p>
            <p style={{ fontSize: 12, color: '#8A8A8E' }}>{t.avisoAgora}</p>
          </div>
          <p style={{ fontSize: 14.5, fontWeight: 800, color: TINTA, marginTop: 1 }}>{t.avisoTitulo}</p>
          <p style={{ fontSize: 13, color: TINTA_FRACA, lineHeight: '18px' }}>
            {t.avisoCorpo(MAE, BEBE)}
          </p>
        </div>
      </div>
    </Celular>
  );
}

export function TelaAprovado({ idioma = 'pt' }: { idioma?: Idioma } = {}) {
  const t = textos(idioma).manual.telas;
  return (
    <Celular legenda={t.aprovadoLegenda}>
      <Head titulo={t.inicio} sub={t.bomDiaFamilias('Nathalia', 1)} />
      <Corpo>
        <div style={{ borderRadius: 18, background: '#E7F5EC', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 24, height: 24, borderRadius: 12, background: VERDE, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <IconeCheck size={14} />
          </div>
          <p style={{ color: '#2F8A55', fontSize: 13.5, fontWeight: 700 }}>{t.aprovadoOk}</p>
        </div>
        <Modulo>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Titulo>{t.suasFamilias}</Titulo>
            <span style={{ color: LILAS_ESCURO, fontSize: 13, fontWeight: 700 }}>1</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 14, borderRadius: 20, background: '#FBFAFD', padding: 12 }}>
            <Iniciais nome={BEBE} size={46} cor="#4583D6" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 16, fontWeight: 800, color: TINTA }}>{BEBE}</p>
              <p style={{ fontSize: 12.5, color: TINTA_FRACA, marginTop: 1 }}>{t.maeUltimo(MAE, hora(idioma, 8, 40))}</p>
            </div>
            <IconeSeta dir="direita" size={18} color="#C9BEE0" />
          </div>
        </Modulo>
      </Corpo>
      <BarraDaConsultora ativa="Início" idioma={idioma} />
    </Celular>
  );
}

export function TelaModoConsultora({ idioma = 'pt' }: { idioma?: Idioma } = {}) {
  const t = textos(idioma).manual.telas;
  return (
    <Celular legenda={t.modoLegenda}>
      <Head titulo={BEBE} sub={t.hoje(fmtData(idioma, DIA_PEDIDO, { day: 'numeric', month: 'long', timeZone: 'UTC' }))} />
      <Corpo style={{ opacity: 0.45 }}>
        <Modulo>
          <Rotulo>{t.ritmoDoDia}</Rotulo>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 64, marginTop: 14 }}>
            {[30, 48, 22, 58, 40, 64, 34].map((h, i) => (
              <div key={i} style={{ flex: 1, height: h, borderRadius: 8, background: i % 2 ? LILAS_CLARO : '#DCCDFA' }} />
            ))}
          </div>
        </Modulo>
        <Modulo>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <IconeRedondo size={42} cor={LILAS_CLARO}>
              <IconeLua size={19} color={LILAS_ESCURO} />
            </IconeRedondo>
            <div>
              <p style={{ fontSize: 15, fontWeight: 800, color: TINTA }}>{t.soneca}</p>
              <p style={{ fontSize: 12.5, color: TINTA_FRACA, marginTop: 1 }}>{t.sonecaDetalhe(hora(idioma, 13, 5))}</p>
            </div>
          </div>
        </Modulo>
      </Corpo>
      <div style={{ position: 'absolute', left: 22, right: 22, top: 250, borderRadius: 28, background: '#FFFFFF', padding: 22, boxShadow: '0 24px 50px -18px rgba(40,20,90,.5)' }}>
        <IconeRedondo size={52}>
          <IconeLua size={24} color={LILAS_ESCURO} />
        </IconeRedondo>
        <p style={{ fontSize: 19, fontWeight: 800, color: TINTA, marginTop: 14, lineHeight: '25px' }}>{t.modoTitulo}</p>
        <Dica style={{ marginTop: 8 }}>{t.modoCorpo}</Dica>
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Pilula dedo>{t.modoUsar}</Pilula>
          <Pilula tom="cinza">{t.agoraNao}</Pilula>
        </div>
      </div>
    </Celular>
  );
}

// ── Perfil público e a lista "Encontrar consultora de sono" ────────────────
export function TelaApareca({ idioma = 'pt' }: { idioma?: Idioma } = {}) {
  const t = textos(idioma).manual.telas;
  return (
    <Celular legenda={t.aparecaLegenda} fundo={FUNDO} statusEscura>
      <div style={{ paddingTop: 62, paddingLeft: 22, paddingRight: 22, height: H_TELA, display: 'flex', flexDirection: 'column' }}>
        <p style={{ textAlign: 'center', color: TINTA_FRACA, fontSize: 12.5, fontWeight: 700 }}>{t.passoDe(3, 3)}</p>
        <div style={{ marginTop: 18, borderRadius: 28, background: `linear-gradient(160deg, ${LILAS_CLARO}, #E9DCFF)`, padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {t.aparecaCampos.map((f) => (
            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#FFFFFF', borderRadius: 16, padding: '12px 14px' }}>
              <div style={{ width: 22, height: 22, borderRadius: 11, border: `2px solid ${LILAS}`, flexShrink: 0 }} />
              <span style={{ fontSize: 14.5, fontWeight: 700, color: TINTA }}>{f}</span>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 26, fontWeight: 800, color: TINTA, marginTop: 24, letterSpacing: -0.4 }}>{t.aparecaTitulo}</p>
        <Dica style={{ marginTop: 8, fontSize: 14 }}>{t.aparecaCorpo}</Dica>
        <div style={{ marginTop: 'auto', paddingBottom: 40, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Pilula dedo>{t.completarPerfil}</Pilula>
          <Pilula tom="cinza">{t.fazerDepois}</Pilula>
        </div>
      </div>
    </Celular>
  );
}

export function TelaEditarPerfil({ nome, idioma = 'pt' }: { nome: string; idioma?: Idioma }) {
  const t = textos(idioma).manual.telas;
  const linha = (rotulo: string, valor: string) => (
    <div key={rotulo} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #F3F0F8', paddingTop: 11, paddingBottom: 11 }}>
      <span style={{ color: TINTA_FRACA, fontSize: 13, fontWeight: 700 }}>{rotulo}</span>
      <span style={{ color: TINTA, fontSize: 13.5, fontWeight: 700 }}>{valor}</span>
    </div>
  );
  return (
    <Celular legenda={t.editarLegenda}>
      <Head titulo={t.editarPerfil} sub={t.consultoraIndependente} />
      <Corpo>
        <Modulo>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Iniciais nome={nome} size={64} cor="#C066AE" />
            <div>
              <p style={{ fontSize: 16, fontWeight: 800, color: TINTA }}>{nome}</p>
              <span style={{ display: 'inline-flex', marginTop: 6, borderRadius: 999, background: '#F1EBFC', color: LILAS_ESCURO, fontSize: 12.5, fontWeight: 800, padding: '7px 13px' }}>
                {t.trocarFoto}
              </span>
            </div>
          </div>
          <p style={{ color: TINTA_FRACA, fontSize: 12.5, fontWeight: 700, marginTop: 18, marginBottom: 6 }}>{t.sobreVoce}</p>
          <div style={{ borderRadius: 16, background: '#F5F2FB', padding: '12px 14px', color: TINTA, fontSize: 13.5, lineHeight: '19px' }}>
            {t.bioExemplo}
          </div>
          <div style={{ marginTop: 6 }}>
            {linha(t.cidadeUf, 'Recife · PE')}
            {linha('WhatsApp', '(81) 9····-····')}
            {linha(t.instagram, t.instagramExemplo)}
            {linha(t.atende, t.presencialEOnline)}
            {linha(t.idadesQueAtende, t.idadesExemplo)}
          </div>
          <div style={{ marginTop: 16 }}>
            <Pilula dedo>{t.salvar}</Pilula>
          </div>
        </Modulo>
      </Corpo>
    </Celular>
  );
}

export function TelaListaConsultoras({ nome, idioma = 'pt' }: { nome: string; idioma?: Idioma }) {
  const t = textos(idioma).manual.telas;
  const card = (n: string, cor: string, cidade: string, atende: string, destaque = false) => (
    <div key={n} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12, background: '#FFFFFF', borderRadius: 24, padding: 14, boxShadow: SOMBRA_MODULO, border: destaque ? `1.5px solid ${LILAS}` : '1.5px solid transparent' }}>
      <Iniciais nome={n} size={48} cor={cor} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 15.5, fontWeight: 800, color: TINTA }}>{n}</p>
        <p style={{ fontSize: 12.5, color: TINTA_FRACA, marginTop: 1 }}>{t.consultoraIndependente} · {cidade}</p>
        <span style={{ display: 'inline-flex', marginTop: 6, borderRadius: 999, background: AREIA, color: LILAS_ESCURO, fontSize: 11.5, fontWeight: 800, padding: '4px 10px' }}>{atende}</span>
      </div>
      <IconeSeta dir="direita" size={18} color="#C9BEE0" />
      {destaque && <Dedo style={{ right: 12, bottom: -14 }} />}
    </div>
  );
  return (
    <Celular legenda={t.listaLegenda}>
      <Head titulo={t.listaTitulo} sub={t.listaSub} />
      <Corpo>
        <Dica>{t.listaIntro}</Dica>
        <div style={{ display: 'flex', gap: 8 }}>
          {t.filtros.map((f, i) => (
            <span
              key={f}
              style={{ borderRadius: 999, background: i === 0 ? ROXO_FUNDO : '#FFFFFF', color: i === 0 ? '#FFFFFF' : TINTA_FRACA, fontSize: 12.5, fontWeight: 700, padding: '8px 14px', boxShadow: i === 0 ? 'none' : 'inset 0 0 0 1.5px #ECE6F5' }}
            >
              {f}
            </span>
          ))}
        </div>
        {card(nome, '#C066AE', 'Recife · PE', t.presencialEOnline, true)}
        {card('Juliana', '#4583D6', 'São Paulo · SP', t.online)}
        {card('Camila', '#3E9D70', t.online, t.online)}
      </Corpo>
    </Celular>
  );
}

export function TelaPerfilNaLista({ nome, idioma = 'pt' }: { nome: string; idioma?: Idioma }) {
  const t = textos(idioma).manual.telas;
  return (
    <Celular legenda={t.perfilLegenda}>
      <Head titulo={t.consultoraSono} sub={nome} />
      <Corpo>
        <Modulo>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Iniciais nome={nome} size={68} cor="#C066AE" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 19, fontWeight: 800, color: TINTA }}>{nome}</p>
              <p style={{ fontSize: 13, color: TINTA_FRACA, marginTop: 2 }}>{t.consultoraIndependente} · Recife · PE</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <div style={{ flex: 1, borderRadius: 18, background: '#F7F5FB', padding: 12 }}>
              <p style={{ color: TINTA_FRACA, fontSize: 11.5, fontWeight: 800, letterSpacing: 0.6, textTransform: 'uppercase' }}>{t.atende}</p>
              <p style={{ color: TINTA, fontSize: 13.5, fontWeight: 700, marginTop: 3 }}>{t.presencialEOnline}</p>
            </div>
            <div style={{ flex: 1, borderRadius: 18, background: '#F7F5FB', padding: 12 }}>
              <p style={{ color: TINTA_FRACA, fontSize: 11.5, fontWeight: 800, letterSpacing: 0.6, textTransform: 'uppercase' }}>{t.idades}</p>
              <p style={{ color: TINTA, fontSize: 13.5, fontWeight: 700, marginTop: 3 }}>{t.idadesExemplo}</p>
            </div>
          </div>
          <p style={{ color: TINTA, fontSize: 13.5, lineHeight: '20px', marginTop: 16 }}>
            {t.bioExemplo}
          </p>
          <div style={{ marginTop: 16 }}>
            <Aceite>{t.perfilAceite(nome)}</Aceite>
          </div>
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Pilula tom="verde" icone={<IconeZapBranco size={18} />} dedo>
              {t.conversarWhatsApp}
            </Pilula>
            <Pilula tom="linha" icone={<IconeInstagram size={18} color={LILAS_ESCURO} />}>
              {t.verInstagram}
            </Pilula>
          </div>
        </Modulo>
      </Corpo>
    </Celular>
  );
}
