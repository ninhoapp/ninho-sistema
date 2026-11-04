'use client';

/**
 * Seção de planos da landing, com a troca Mensal/Anual. Preços saem de
 * lib/precos.ts (que espelha o app); mudou lá, muda aqui.
 */
import { useState } from 'react';
import { PRECOS, DIAS_TRIAL, numeroBr } from '@/lib/precos';

type Ciclo = 'mensal' | 'anual';

const descontoPct = Math.round(
  (1 - PRECOS.premium.anual / (PRECOS.premium.mensal * 12)) * 100
);

export function Planos() {
  const [ciclo, setCiclo] = useState<Ciclo>('anual');
  const anual = ciclo === 'anual';

  const preco = (tier: 'basico' | 'premium') =>
    anual ? PRECOS[tier].anual / 12 : PRECOS[tier].mensal;
  const nota = (tier: 'basico' | 'premium') =>
    anual
      ? `R$ ${numeroBr(PRECOS[tier].anual)} por ano · economize R$ ${numeroBr(
          PRECOS[tier].mensal * 12 - PRECOS[tier].anual
        )}`
      : '';

  return (
    <>
      <div className="n-ciclo">
        <div className="n-ciclo-in" role="group" aria-label="Ciclo de cobrança">
          <button type="button" aria-pressed={!anual} onClick={() => setCiclo('mensal')}>
            Mensal
          </button>
          <button type="button" aria-pressed={anual} onClick={() => setCiclo('anual')}>
            Anual <small>-{descontoPct}%</small>
          </button>
        </div>
      </div>

      <div className="n-planos">
        <div className="n-plano">
          <h3>Básico</h3>
          <p className="n-plano-desc">A rotina inteira do bebê, para a casa toda.</p>
          <div className="n-preco">
            <small>R$</small>
            <b>{numeroBr(preco('basico'))}</b>
            <span>/mês</span>
          </div>
          <div className="n-preco-nota">{nota('basico')}</div>
          <ul className="n-lista">
            <li>Peito, mamadeira, sono, fralda, comida, banho, remédio e mais</li>
            <li>Próxima soneca e próxima mamada</li>
            <li>Cuidadores convidados (pai, avós, babá)</li>
            <li>Histórico por dia e calendário</li>
            <li>Linha do tempo de momentos</li>
            <li className="n-nao">Assistente que responde sobre a rotina</li>
            <li className="n-nao">Álbum em PDF e vídeo dos momentos</li>
          </ul>
          <a href="/baixar" className="n-btn n-btn-claro">Testar {DIAS_TRIAL} dias grátis</a>
        </div>

        <div className="n-plano n-plano-destaque">
          <h3>Premium</h3>
          <p className="n-plano-desc">Tudo do Básico, mais o assistente e as memórias.</p>
          <div className="n-preco">
            <small>R$</small>
            <b>{numeroBr(preco('premium'))}</b>
            <span>/mês</span>
          </div>
          <div className="n-preco-nota">{nota('premium')}</div>
          <ul className="n-lista">
            <li>Tudo do plano Básico</li>
            <li>Assistente: pergunte &quot;quando foi a última soneca?&quot;</li>
            <li>Álbum em PDF dos momentos</li>
            <li>Vídeo dos momentos para mandar à família</li>
          </ul>
          <a href="/baixar" className="n-btn n-btn-roxo">Testar {DIAS_TRIAL} dias grátis</a>
        </div>
      </div>

      <p className="n-planos-rodape">
        Os {DIAS_TRIAL} primeiros dias são grátis, com tudo liberado. Uma assinatura vale para todos
        os cuidadores do mesmo bebê. Cobrança pela App Store ou Google Play; cancele quando quiser.
      </p>
    </>
  );
}
