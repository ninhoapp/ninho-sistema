import { DIAS_TRIAL } from '@/lib/precos';

/** Quadro com as regras de repasse — exibido ao conversor. */
export function RepasseRegras({ duracaoMeses }: { duracaoMeses: number | null }) {
  const duracaoTxt =
    duracaoMeses && duracaoMeses > 0
      ? `As assinaturas mensais geram comissão nos primeiros ${duracaoMeses} ${
          duracaoMeses === 1 ? 'mês' : 'meses'
        } pagos.`
      : 'As assinaturas mensais geram comissão de forma vitalícia enquanto o usuário pagar.';

  return (
    <div className="rounded-2xl border border-ninho-borda bg-white p-5 text-sm text-ninho-grafite">
      <h3 className="mb-2 text-base font-bold text-ninho-grafite">Como funciona o seu repasse</h3>
      <ul className="space-y-1.5 text-ninho-cinza">
        <li>
          • Você só conta como assinante quando a <strong>loja realmente cobrou</strong> o usuário.
          Quem assina e cancela ainda dentro dos {DIAS_TRIAL} dias grátis não gera pagamento — a
          loja não chegou a cobrar.
        </li>
        <li>• {duracaoTxt}</li>
        <li>
          • <strong>Premium anual</strong> paga <strong>uma única vez</strong> por ano — a loja
          cobra os 12 meses de uma vez só.
        </li>
        <li>
          • O fechamento é por mês: tudo que a loja cobrar entre o dia 1 e o último dia do mês é
          pago no <strong>dia 30 do mês seguinte</strong> (ex.: cobranças de julho → pagas em
          30/08). Isso porque Apple e Google repassam com cerca de <strong>45 dias</strong>.
        </li>
        <li>
          • Pagamento via <strong>Pix</strong>, qualquer valor, <strong>sem nota fiscal</strong>.
          Cadastre sua chave em Minha conta.
        </li>
        <li>
          • Se o usuário pedir <strong>reembolso</strong>, a comissão daquela assinatura é{' '}
          <strong>estornada</strong> do seu saldo.
        </li>
      </ul>
    </div>
  );
}
