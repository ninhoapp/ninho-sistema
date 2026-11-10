import Link from 'next/link';
import { fetchAlertaAtendimento, fetchAlertaResgate, NOME_MOTIVO } from '@/lib/atendimento';

/**
 * Faixa vermelha no topo de TODAS as páginas do painel enquanto houver
 * pergunta do atendimento esperando o dono (pedido de 25/10/2026: ver e
 * responder o quanto antes). Some sozinha quando não há nada aberto. Se a
 * consulta falhar, não mostra nada: o alerta não pode derrubar o painel.
 */
export async function AlertaAtendimento() {
  return (
    <>
      <FaixaPendencias />
      <FaixaResgate />
    </>
  );
}

async function FaixaPendencias() {
  let alerta: Awaited<ReturnType<typeof fetchAlertaAtendimento>>;
  try {
    alerta = await fetchAlertaAtendimento();
  } catch {
    return null;
  }
  if (alerta.abertas === 0 || !alerta.maisAntiga) return null;

  const horas = Math.floor((Date.now() - Date.parse(alerta.maisAntiga)) / 3_600_000);
  const espera = horas < 1 ? 'menos de 1 hora' : horas === 1 ? '1 hora' : `${horas} horas`;
  const texto =
    alerta.abertas === 1
      ? `1 pergunta do atendimento esperando você há ${espera}`
      : `${alerta.abertas} perguntas do atendimento esperando você, a mais antiga há ${espera}`;

  return (
    <Link
      href="/admin/atendimento"
      className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-red-300 bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
    >
      <span className="flex items-center gap-2">
        <span className="relative flex h-3 w-3 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-white" />
        </span>
        {texto}. A pessoa espera em até 48 horas.
      </span>
      <span className="shrink-0 rounded-pill bg-white px-3 py-1 text-xs text-red-700">Responder</span>
    </Link>
  );
}

/**
 * Motivos de quem não assinou, que a Nina ouviu na conversa de resgate
 * (pedido de 05/11/2026: ver no topo qual foi a justificativa de cada um).
 * Fica até o dono marcar como visto em /admin/atendimento.
 */
async function FaixaResgate() {
  let alerta: Awaited<ReturnType<typeof fetchAlertaResgate>>;
  try {
    alerta = await fetchAlertaResgate();
  } catch {
    return null;
  }
  if (alerta.novos === 0) return null;

  return (
    <Link
      href="/admin/atendimento#resgates"
      className="mb-4 block rounded-2xl border border-ninho-roxo bg-ninho-roxo-suave px-4 py-3 text-sm text-ninho-grafite shadow-sm transition hover:bg-ninho-lavanda"
    >
      <span className="flex items-center justify-between gap-3">
        <span className="font-semibold text-ninho-roxo-escuro">
          {alerta.novos === 1
            ? '1 pessoa contou o motivo à Nina (não assinou ou cartão recusado)'
            : `${alerta.novos} pessoas contaram o motivo à Nina (não assinou ou cartão recusado)`}
        </span>
        <span className="shrink-0 rounded-pill bg-white px-3 py-1 text-xs font-semibold text-ninho-roxo-escuro">Ver</span>
      </span>
      <ul className="mt-2 flex flex-col gap-1">
        {alerta.ultimos.map((r) => (
          <li key={r.id} className="truncate">
            <span className="font-semibold">{NOME_MOTIVO[r.motivo ?? ''] ?? r.motivo}</span>
            {r.motivo_resumo ? ` · ${r.motivo_resumo}` : ''}
            <span className="text-ninho-cinza"> · {r.nome ?? 'Sem nome'}</span>
          </li>
        ))}
      </ul>
    </Link>
  );
}
