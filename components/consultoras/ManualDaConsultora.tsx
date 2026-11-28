import { Aviso, Card } from '@/components/consultoras/ui';
import { AcoesManual } from '@/components/consultoras/AcoesManual';
import { codigoDe, type DadosManual } from '@/components/consultoras/manualTextos';
import { Rico } from '@/components/consultoras/Celular';
import { textos, type Idioma } from '@/lib/i18n-consultora';
import {
  TelaApareca,
  TelaAprovado,
  TelaConvidar,
  TelaEditarPerfil,
  TelaFamiliaAdicionar,
  TelaFamiliaCodigo,
  TelaInicioVazio,
  TelaListaConsultoras,
  TelaPedido,
  TelaPerfilNaLista,
  TelaSininho,
  TelaWhatsAppConvite,
} from '@/components/consultoras/TelasManual';

/**
 * Manual DENTRO do painel da consultora (dono, 14/11/2026: "coloque os manuais
 * também dentro do painel da consultora e no menu lateral do app").
 *
 * É o mesmo passo a passo que o dono manda em PDF (AcoesManual), falando com
 * ela em "você", com as telas desenhadas. Os passos de baixar o app e criar a
 * conta ficaram de fora: quem está aqui já entrou. Para quem quer o PDF
 * inteiro, os dois caminhos continuam disponíveis nos botões do topo.
 * O mesmo texto está no app, em pt e en, em app/(app)/consultora/manual.tsx.
 *
 * Idioma (25/11/2026): `idioma` (padrão 'pt') escolhe os textos do
 * dicionário (lib/i18n-consultora/{pt,en,es}/manual.ts) e as telas desenhadas.
 */

function Passo({ n, titulo, children, telas }: { n: number; titulo: string; children: React.ReactNode; telas?: React.ReactNode }) {
  return (
    <div className="border-b border-[#F5F2FA] py-5 last:border-0">
      <div className="flex items-start gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#24164F] text-[13px] font-black text-white">{n}</span>
        <div className="min-w-0 flex-1">
          <h5 className="text-[15px] font-black text-[#24164F]">{titulo}</h5>
          <div className="mt-1 max-w-3xl space-y-1 text-[13px] leading-relaxed text-ninho-grafite">{children}</div>
        </div>
      </div>
      {telas && <div className="mt-4 flex gap-5 overflow-x-auto pb-2 sm:pl-10">{telas}</div>}
    </div>
  );
}

export function ManualDaConsultora({ dados, idioma = 'pt' }: { dados: DadosManual; idioma?: Idioma }) {
  const t = textos(idioma).manual.painel;
  const codigo = codigoDe(dados);
  const nome = dados.nome;
  return (
    <>
      <Card titulo={t.titulo} direita={t.tituloDireita}>
        <p className="text-[13px] leading-relaxed text-ninho-cinza">
          <Rico texto={t.intro} />
        </p>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
          <Aviso tom="lilas">
            <Rico texto={t.seuCodigo(codigo)} />
          </Aviso>
          <AcoesManual tipo="com-conta" dados={dados} apenasPdf rotuloPdf={t.baixarPdf} />
        </div>
      </Card>

      <Card className="mt-4" titulo={t.passoAPasso}>
        <Passo
          n={1}
          titulo={t.p1Titulo}
          telas={
            <>
              <TelaInicioVazio idioma={idioma} />
              <TelaConvidar codigo={codigo} idioma={idioma} />
              <TelaWhatsAppConvite codigo={codigo} idioma={idioma} />
            </>
          }
        >
          <p>
            <Rico texto={t.p1a(codigo)} />
          </p>
          <p>
            <Rico texto={t.p1b} />
          </p>
        </Passo>
        <Passo
          n={2}
          titulo={t.p2Titulo}
          telas={
            <>
              <TelaFamiliaAdicionar idioma={idioma} />
              <TelaFamiliaCodigo codigo={codigo} nome={nome} idioma={idioma} />
              <TelaSininho nome={nome} idioma={idioma} />
            </>
          }
        >
          <p>
            <Rico texto={t.p2a} />
          </p>
          <p>
            <Rico texto={t.p2b} />
          </p>
        </Passo>
        <Passo
          n={3}
          titulo={t.p3Titulo}
          telas={
            <>
              <TelaPedido idioma={idioma} />
              <TelaAprovado idioma={idioma} />
            </>
          }
        >
          <p>
            <Rico texto={t.p3a} />
          </p>
          <p>
            <Rico texto={t.p3b} />
          </p>
        </Passo>
        <Passo n={4} titulo={t.p4Titulo}>
          <p>
            <Rico texto={t.p4a} />
          </p>
          <p>
            <Rico texto={t.p4b} />
          </p>
        </Passo>
        <Passo
          n={5}
          titulo={t.p5Titulo}
          telas={
            <>
              <TelaApareca idioma={idioma} />
              <TelaEditarPerfil nome={nome} idioma={idioma} />
              <TelaListaConsultoras nome={nome} idioma={idioma} />
              <TelaPerfilNaLista nome={nome} idioma={idioma} />
            </>
          }
        >
          <p>
            <Rico texto={t.p5a} />
          </p>
          <p>
            <Rico texto={t.p5b} />
          </p>
        </Passo>
        <Passo n={6} titulo={t.p6Titulo}>
          <p>
            <Rico texto={t.p6a} />
          </p>
          <p>{t.p6b}</p>
        </Passo>
      </Card>

      <Card className="mt-4" titulo={t.doZeroTitulo}>
        <p className="text-[13px] leading-relaxed text-ninho-cinza">{t.doZeroIntro}</p>
        <div className="mt-3 flex flex-wrap items-center gap-6">
          <div>
            <p className="text-[12.5px] font-bold text-[#24164F]">{t.semConta}</p>
            <div className="mt-1.5">
              <AcoesManual tipo="sem-conta" dados={dados} apenasPdf rotuloPdf={t.baixarEste} />
            </div>
          </div>
          <div>
            <p className="text-[12.5px] font-bold text-[#24164F]">{t.comConta}</p>
            <div className="mt-1.5">
              <AcoesManual tipo="com-conta" dados={dados} apenasPdf rotuloPdf={t.baixarEste} />
            </div>
          </div>
        </div>
      </Card>
    </>
  );
}
