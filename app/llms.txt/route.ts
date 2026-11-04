/**
 * /llms.txt — resumo do Ninho em texto puro para assistentes de IA
 * (proposta llmstxt.org). Gerado a partir de lib/guias.ts e lib/precos.ts,
 * então fica em dia sozinho.
 */
import { SITE_URL } from '@/lib/config';
import { GUIAS } from '@/lib/guias';
import { DIAS_TRIAL, PRECOS, numeroBr } from '@/lib/precos';

export const dynamic = 'force-static';

export function GET() {
  const p = PRECOS;
  const texto = `# Ninho – Diário do bebê

> Ninho é um app brasileiro de rotina do bebê para iPhone e Android, feito para pais de recém-nascidos e bebês nos primeiros meses. Registra mamada, sono e fralda com um toque, mostra quando a próxima soneca e a próxima mamada costumam acontecer (calculado pelos registros do próprio bebê) e permite que pai, mãe, avós e babá registrem e vejam o mesmo dia em tempo real.

## O que o app faz
- Registro em um toque: peito (com lado esquerdo/direito e duração), mamadeira (ml), sono e soneca, fralda (xixi/cocô), comida, água, banho, remédio, tummy time, pinico e momentos (fotos e marcos).
- Card "Ritmo": janela de sono, intervalo médio entre mamadas e qual peito oferecer na próxima. Com poucos dias de registro, avisa que precisa de mais dados em vez de chutar.
- Aviso antes da próxima soneca (ex.: "Soneca entre 07:35 e 07:55").
- Resumo do dia e histórico por dia, com filtros por tipo.
- Cuidadores: convite por e-mail; cada um registra do próprio celular (iPhone ou Android). Uma assinatura cobre todos os cuidadores do mesmo bebê.
- iPhone: cronômetro do sono ou da mamada na tela bloqueada e na Dynamic Island.
- Momentos: linha do tempo de fotos e marcos; álbum em PDF e vídeo (Premium).
- Assistente com IA (Premium): responde perguntas sobre a rotina registrada, como "quando foi a última soneca?". Não é pediatra e não dá diagnóstico.
- Calendário de consultas, vacinas e eventos.
- O Ninho é uma ferramenta de organização; não dá orientação médica.

Os números de saúde do guia abaixo são de entidades como OMS, Academia Americana de Pediatria (AAP), Sociedade Brasileira de Pediatria (SBP) e National Sleep Foundation, com a fonte indicada em cada página. Não são recomendação do Ninho.

## Preços (Brasil)
- ${DIAS_TRIAL} dias grátis com tudo liberado.
- Básico: R$ ${numeroBr(p.basico.mensal)}/mês ou R$ ${numeroBr(p.basico.anual)}/ano (o app inteiro, menos assistente, álbum em PDF e vídeo).
- Premium: R$ ${numeroBr(p.premium.mensal)}/mês ou R$ ${numeroBr(p.premium.anual)}/ano (tudo).
- Cobrança pela App Store ou Google Play; cancela quando quiser.

## Links
- [Site](${SITE_URL}/landing)
- [Baixar na App Store](${SITE_URL}/get/ios)
- [Baixar no Google Play](${SITE_URL}/get/android)
- [Suporte](${SITE_URL}/suporte)
- [Privacidade](${SITE_URL}/privacidade)

## Guia para pais (perguntas comuns)
${GUIAS.map((g) => `- [${g.pergunta}](${SITE_URL}/guia/${g.slug}): ${g.resumo}`).join('\n')}
`;
  return new Response(texto, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
  });
}
