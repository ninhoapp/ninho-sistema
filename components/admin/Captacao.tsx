'use client';

/**
 * Captação de parceiro — a aba onde o dono gerencia quem ele aborda no
 * Instagram para virar consultora de sono (pedido dele em 16/11/2026).
 *
 * De cima para baixo, na ordem em que ele usa de manhã:
 *   1. Para hoje — quem tem retorno marcado para hoje ou atrasado;
 *   2. Autorizei e ainda não criou a conta — o banco responde sozinho;
 *   3. Colar @ (um ou uma lista inteira de uma vez);
 *   4. A lista toda, por etapa, com o histórico de comentários de cada pessoa;
 *   5. Textos prontos de cada etapa, para copiar;
 *   6. Indicação entre consultoras — lugar previsto, ainda não construído.
 *
 * Privacidade: só informação profissional e pública mais o andamento da
 * conversa de trabalho. O aviso em cima do campo de comentário diz isso.
 */
import { useMemo, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import {
  ETAPAS,
  ETAPA_LABEL,
  LINHA_DO_CONSOLE,
  ORIGEM_LABEL,
  RESPOSTAS,
  TEXTOS,
  atrasadoEmDias,
  dataBr,
  urlDoPerfil,
  type AutorizadoSemConta,
  type Comentario,
  type Contato,
  type Etapa,
  type TextoPronto,
} from '@/lib/captacao';
import {
  adicionarContatos,
  arquivarContato,
  comentar,
  importarConvites,
  salvarContato,
  type CaptacaoState,
} from '@/app/admin/(painel)/parceiros/captacao-actions';
import { Aviso, Card, Kpi, Retorno, Selo, botao, campo, rotuloCampo, td, th } from '@/components/consultoras/ui';

const COR_ETAPA: Record<Etapa, 'verde' | 'lilas' | 'ambar' | 'cinza' | 'vermelho' | 'noite'> = {
  novo: 'cinza',
  abordado: 'lilas',
  conversando: 'lilas',
  retomar: 'ambar',
  proposta: 'noite',
  sumiu: 'ambar',
  quente: 'ambar',
  pediu_acesso: 'verde',
  recusou: 'vermelho',
  nao_combina: 'cinza',
  virou_consultora: 'verde',
};

function Botao({ children, cls = botao.suave }: { children: React.ReactNode; cls?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={cls}>
      {pending ? '...' : children}
    </button>
  );
}

function Copiar({ texto, label = 'Copiar' }: { texto: string; label?: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(texto);
          setOk(true);
          setTimeout(() => setOk(false), 1800);
        } catch {
          /* sem permissão: o texto continua na tela para selecionar à mão */
        }
      }}
      className={botao.suave}
    >
      {ok ? 'Copiado!' : label}
    </button>
  );
}

/** Um texto pronto, com o botão de copiar. */
function Pronto({ t }: { t: TextoPronto }) {
  return (
    <div className="rounded-[18px] bg-[#F7F4FD] p-3">
      <p className="text-[13px] font-extrabold text-ninho-grafite">{t.titulo}</p>
      <p className="mb-2 text-[11.5px] text-ninho-cinza">{t.quando}</p>
      {t.espera112 && (
        <p className="mb-2 rounded-[12px] bg-[#FFF2D6] px-2 py-1 text-[11px] font-bold leading-snug text-[#7A5A12]">
          Tire a parte 2 (a orientação chegando à mãe) enquanto a 1.1.2 não chegar às consultoras.
        </p>
      )}
      <p className="whitespace-pre-wrap text-[12.5px] leading-snug">{t.texto}</p>
      <div className="mt-2">
        <Copiar texto={t.texto} label="Copiar texto" />
      </div>
    </div>
  );
}

function Arroba({ c }: { c: Contato }) {
  return (
    <a
      href={urlDoPerfil(c.arroba)}
      target="_blank"
      rel="noopener noreferrer"
      className="font-mono text-[13px] font-bold text-ninho-roxo-escuro hover:underline"
    >
      @{c.arroba}
    </a>
  );
}

function SeloEtapa({ etapa }: { etapa: Etapa }) {
  return <Selo cor={COR_ETAPA[etapa]}>{ETAPA_LABEL[etapa]}</Selo>;
}

function milhar(n: number): string {
  return n.toLocaleString('pt-BR');
}

/** O formulário de comentário: o histórico de cada pessoa cresce por aqui. */
function FormComentario({ c, hoje }: { c: Contato; hoje: string }) {
  const [st, action] = useFormState<CaptacaoState, FormData>(comentar, {});
  return (
    <form action={action} className="rounded-[18px] bg-[#F7F4FD] p-3">
      <input type="hidden" name="id" value={c.id} />
      <Retorno ok={st.ok} erro={st.error} />
      <label className="mb-1 block text-[11.5px] font-bold text-[#9A95AD]">
        O que ela disse (fica no histórico, não apaga o anterior)
      </label>
      <textarea
        name="texto"
        rows={2}
        maxLength={1000}
        placeholder="ex.: está corrida essa semana por causa do aniversário da filha, semana que vem a gente conversa"
        className="w-full rounded-xl border-[1.5px] border-transparent bg-white px-3 py-2 text-[13px] font-medium outline-none focus:border-ninho-roxo"
      />
      <p className="mt-1 text-[11px] leading-snug text-ninho-cinza">
        Só o que é do trabalho. Nada de vida pessoal, saúde ou família dela além do que ela mesma disse para explicar o
        prazo.
      </p>
      <div className="mt-2 flex flex-wrap items-end gap-2">
        <label className="text-[11.5px] font-bold text-[#9A95AD]">
          Etapa
          <select name="etapa" defaultValue={c.etapa} className={`${campo} mt-1 w-[210px]`}>
            {ETAPAS.map((e) => (
              <option key={e.k} value={e.k}>{e.label}</option>
            ))}
          </select>
        </label>
        <label className="text-[11.5px] font-bold text-[#9A95AD]">
          Falar de novo em
          <input type="date" name="proximo_contato" min={hoje} className={`${campo} mt-1 w-[160px]`} />
        </label>
        <Botao cls={botao.grad}>Guardar</Botao>
      </div>
    </form>
  );
}

function Historico({ lista }: { lista: Comentario[] }) {
  if (!lista.length) return <p className="text-[12.5px] text-ninho-cinza">Nenhum comentário ainda.</p>;
  return (
    <ul className="flex flex-col gap-2">
      {lista.map((k) => (
        <li key={k.id} className="rounded-[14px] bg-white px-3 py-2 text-[13px]">
          <p className="leading-snug">{k.texto}</p>
          <p className="mt-1 text-[11px] font-semibold text-ninho-cinza">
            {dataBr(k.criado_em)}
            {k.etapa_depois ? ` · passou para "${ETAPA_LABEL[k.etapa_depois]}"` : ''}
            {k.proximo_contato ? ` · voltar em ${dataBr(k.proximo_contato)}` : ''}
          </p>
        </li>
      ))}
    </ul>
  );
}

/** Ficha da pessoa: etapa, data, dados públicos, comentar e histórico. */
function Ficha({ c, hist, hoje }: { c: Contato; hist: Comentario[]; hoje: string }) {
  const [st, action] = useFormState<CaptacaoState, FormData>(salvarContato, {});
  return (
    <div className="mt-2 grid gap-3 lg:grid-cols-2">
      <form action={action} className="rounded-[18px] bg-[#F7F4FD] p-3">
        <input type="hidden" name="id" value={c.id} />
        <Retorno ok={st.ok} erro={st.error} />
        <div className="grid grid-cols-2 gap-2">
          <label className="text-[11.5px] font-bold text-[#9A95AD]">
            Nome
            <input name="nome" defaultValue={c.nome ?? ''} maxLength={80} className={`${campo} mt-1`} />
          </label>
          <label className="text-[11.5px] font-bold text-[#9A95AD]">
            Seguidores
            <input name="seguidores" defaultValue={c.seguidores ?? ''} inputMode="numeric" className={`${campo} mt-1`} />
          </label>
          <label className="text-[11.5px] font-bold text-[#9A95AD]">
            Etapa
            <select name="etapa" defaultValue={c.etapa} className={`${campo} mt-1`}>
              {ETAPAS.map((e) => (
                <option key={e.k} value={e.k}>{e.label}</option>
              ))}
            </select>
          </label>
          <label className="text-[11.5px] font-bold text-[#9A95AD]">
            Falar de novo em
            <input type="date" name="proximo_contato" defaultValue={c.proximo_contato ?? ''} className={`${campo} mt-1`} />
          </label>
        </div>
        <label className={rotuloCampo}>Por que esse perfil serve (público: formação, se já vende atendimento, idioma)</label>
        <textarea
          name="por_que_serve"
          rows={2}
          maxLength={400}
          defaultValue={c.por_que_serve ?? ''}
          className="w-full rounded-xl border-[1.5px] border-transparent bg-white px-3 py-2 text-[13px] font-medium outline-none focus:border-ninho-roxo"
        />
        <div className="mt-2 flex items-center justify-between gap-2">
          <Botao cls={botao.grad}>Salvar ficha</Botao>
          <span className="text-[11px] text-ninho-cinza">{ORIGEM_LABEL[c.origem]}</span>
        </div>
      </form>
      <div className="flex flex-col gap-3">
        <FormComentario c={c} hoje={hoje} />
        <div className="rounded-[18px] bg-[#F7F4FD] p-3">
          <p className="mb-2 text-[11.5px] font-bold text-[#9A95AD]">Histórico ({hist.length})</p>
          <Historico lista={hist} />
        </div>
        <form action={arquivarContato} className="text-right">
          <input type="hidden" name="id" value={c.id} />
          <input type="hidden" name="arquivar" value={c.arquivado ? '0' : '1'} />
          <button type="submit" className={c.arquivado ? botao.suave : botao.cinza}>
            {c.arquivado ? 'Devolver para a lista' : 'Tirar da lista (guarda o histórico)'}
          </button>
        </form>
      </div>
    </div>
  );
}

function Linha({ c, hist, hoje, destaque = false }: { c: Contato; hist: Comentario[]; hoje: string; destaque?: boolean }) {
  const atraso = c.proximo_contato ? atrasadoEmDias(c.proximo_contato, hoje) : 0;
  const ultimo = hist[0];
  return (
    <details className={`rounded-[18px] px-3 py-2.5 ${destaque ? 'bg-[#FFF8EC]' : 'bg-white shadow-[inset_0_0_0_1.5px_#F0ECF6]'}`}>
      <summary className="cursor-pointer list-none">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <Arroba c={c} />
          {c.nome && <b className="text-[13px]">{c.nome}</b>}
          <SeloEtapa etapa={c.etapa} />
          {c.seguidores ? <span className="text-[11.5px] font-semibold text-ninho-cinza">{milhar(c.seguidores)} seguidores</span> : null}
          {c.origem === 'pesquisa' && <Selo cor="cinza">de pesquisa, não de conversa</Selo>}
          {c.proximo_contato && (
            <span className={`text-[11.5px] font-bold ${atraso > 0 ? 'text-[#B7791F]' : 'text-ninho-cinza'}`}>
              {atraso > 0 ? `atrasado ${atraso} dia${atraso === 1 ? '' : 's'} (${dataBr(c.proximo_contato)})` : `falar em ${dataBr(c.proximo_contato)}`}
            </span>
          )}
          {c.arquivado && <Selo cor="cinza">fora da lista</Selo>}
          <span className="ml-auto text-[11px] font-semibold text-ninho-roxo-escuro">abrir</span>
        </div>
        {ultimo && <p className="mt-1 truncate text-[12.5px] text-ninho-cinza">“{ultimo.texto}”</p>}
      </summary>
      <Ficha c={c} hist={hist} hoje={hoje} />
    </details>
  );
}

function FormAdicionar({ hoje }: { hoje: string }) {
  const [st, action] = useFormState<CaptacaoState, FormData>(adicionarContatos, {});
  return (
    <form action={action}>
      <Retorno ok={st.ok} erro={st.error} />
      <label className={rotuloCampo}>
        Cole um @ ou a lista toda de uma vez (uma por linha; aceita o endereço do perfil)
      </label>
      <textarea
        name="lista"
        rows={4}
        placeholder={'@maria.sono\n@consultoradosono.ana\ninstagram.com/sono.da.bia'}
        className="w-full rounded-xl border-[1.5px] border-transparent bg-[#F5F2FB] px-3 py-2 text-[13px] font-semibold outline-none focus:border-ninho-roxo"
      />
      <div className="mt-2 grid gap-2 sm:grid-cols-4">
        <label className="text-[11.5px] font-bold text-[#9A95AD]">
          Origem
          <select name="origem" defaultValue="pesquisa" className={`${campo} mt-1`}>
            <option value="pesquisa">Veio de pesquisa</option>
            <option value="site">Pediu pelo site</option>
            <option value="indicacao">Indicação de consultora</option>
          </select>
        </label>
        <label className="text-[11.5px] font-bold text-[#9A95AD]">
          Etapa
          <select name="etapa" defaultValue="novo" className={`${campo} mt-1`}>
            {ETAPAS.map((e) => (
              <option key={e.k} value={e.k}>{e.label}</option>
            ))}
          </select>
        </label>
        <label className="text-[11.5px] font-bold text-[#9A95AD]">
          Nome (só quando é um @ só)
          <input name="nome" maxLength={80} className={`${campo} mt-1`} />
        </label>
        <label className="text-[11.5px] font-bold text-[#9A95AD]">
          Falar em
          <input type="date" name="proximo_contato" min={hoje} className={`${campo} mt-1`} />
        </label>
      </div>
      <label className={rotuloCampo}>Por que esses perfis servem (vale para todos os @ desta colagem)</label>
      <input name="por_que_serve" maxLength={400} className={campo} placeholder="ex.: consultora de sono certificada, fala português, já vende mentoria" />
      <div className="mt-3">
        <Botao cls={botao.grad}>Colocar na lista</Botao>
      </div>
    </form>
  );
}

/**
 * Traz os @ que ele já abordou na página de convites (enviar.html). O que ele
 * marcou lá vive no localStorage do navegador dele, então o caminho é copiar
 * de lá e colar aqui — uma vez só.
 */
function FormImportar() {
  const [st, action] = useFormState<CaptacaoState, FormData>(importarConvites, {});
  return (
    <form action={action}>
      <Retorno ok={st.ok} erro={st.error} />
      <ol className="mb-3 ml-4 list-decimal text-[12.5px] leading-relaxed text-ninho-cinza">
        <li>Abra a sua página de convites (<span className="font-mono">enviar.html</span>) no navegador.</li>
        <li>Aperte <b>F12</b> e vá na aba <b>Console</b>.</li>
        <li>Cole a linha abaixo e dê Enter — ela copia o que você já marcou.</li>
        <li>Cole aqui embaixo e mande.</li>
      </ol>
      <div className="mb-2 flex flex-wrap items-center gap-2 rounded-[14px] bg-[#24164F] px-3 py-2">
        <code className="flex-1 overflow-x-auto whitespace-nowrap text-[11.5px] text-white">{LINHA_DO_CONSOLE}</code>
        <Copiar texto={LINHA_DO_CONSOLE} label="Copiar a linha" />
      </div>
      <textarea
        name="colado"
        rows={3}
        placeholder='{"estado":{"brendabauth":"enviada", ...},"datas":{...}}'
        className="w-full rounded-xl border-[1.5px] border-transparent bg-[#F5F2FB] px-3 py-2 text-[12.5px] font-semibold outline-none focus:border-ninho-roxo"
      />
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Botao cls={botao.grad}>Trazer os contatos</Botao>
        <span className="text-[11.5px] text-ninho-cinza">
          Pode mandar quantas vezes quiser: @ repetido não duplica, só atualiza a etapa.
        </span>
      </div>
    </form>
  );
}

export function Captacao({
  contatos,
  comentarios,
  autorizados,
  indisponivel,
  erro,
  hoje,
  video,
}: {
  contatos: Contato[];
  comentarios: Comentario[];
  autorizados: AutorizadoSemConta[];
  indisponivel: boolean;
  erro?: string;
  hoje: string;
  /** O vídeo da abordagem: só o caminho do arquivo no computador do dono. */
  video?: { caminho: string } | null;
}) {
  const [filtro, setFiltro] = useState<string>('');
  const [verArquivados, setVerArquivados] = useState(false);

  const porContato = useMemo(() => {
    const m = new Map<string, Comentario[]>();
    for (const k of comentarios) {
      const l = m.get(k.contato_id);
      if (l) l.push(k);
      else m.set(k.contato_id, [k]);
    }
    return m;
  }, [comentarios]);

  const ativos = contatos.filter((c) => !c.arquivado);
  const hojeLista = ativos
    .filter((c) => c.proximo_contato && c.proximo_contato <= hoje)
    .sort((a, b) => (a.proximo_contato ?? '').localeCompare(b.proximo_contato ?? ''));
  const conta = (e: Etapa) => ativos.filter((c) => c.etapa === e).length;

  const visiveis = contatos
    .filter((c) => (verArquivados ? true : !c.arquivado))
    .filter((c) => (filtro ? c.etapa === filtro : true));

  const todosOsArrobas = ativos.map((c) => `@${c.arroba}`);

  return (
    <>
      {indisponivel && (
        <Aviso tom="ambar">
          <strong>A aba está pronta, o banco ainda não.</strong> As tabelas da captação (
          <span className="font-mono">painel.captacao_contatos</span> e{' '}
          <span className="font-mono">painel.captacao_comentarios</span>) chegam com a migration{' '}
          <span className="font-mono">00176_painel_captacao_parceiro.sql</span>, que está escrita e esperando você
          aplicar. Até lá a lista aparece vazia e nada é gravado.
        </Aviso>
      )}
      {erro && <Aviso tom="vermelho">Não consegui ler a captação agora: {erro}</Aviso>}

      <div className="mb-4 mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        <Kpi rotulo="Para hoje" valor={hojeLista.length} sub="retorno marcado para hoje ou atrasado" verde={hojeLista.length > 0} />
        <Kpi rotulo="Abordei" valor={conta('abordado')} sub="1ª mensagem, sem resposta" />
        <Kpi rotulo="Conversando" valor={conta('conversando')} sub="respondeu, conversa de pé" />
        <Kpi rotulo="Com a proposta" valor={conta('proposta') + conta('sumiu')} sub={`${conta('sumiu')} sumiu depois dela`} />
        <Kpi rotulo="Quentes" valor={conta('quente')} sub="perguntou e parou de responder" />
        <Kpi rotulo="Pediu acesso" valor={conta('pediu_acesso')} sub="falta eu liberar" verde={conta('pediu_acesso') > 0} />
        <Kpi rotulo="Autorizadas sem conta" valor={autorizados.length} sub="eu liberei, ela não criou" />
      </div>

      <Card titulo="Para hoje" direita={`${hojeLista.length} pessoa(s) · ${dataBr(hoje)}`} className="mb-4">
        {hojeLista.length === 0 ? (
          <p className="py-4 text-center text-[13px] text-ninho-cinza">
            Ninguém marcado para hoje. Quando você escrever um comentário com data, a pessoa volta para cá no dia.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {hojeLista.map((c) => (
              <Linha key={c.id} c={c} hist={porContato.get(c.id) ?? []} hoje={hoje} destaque />
            ))}
          </div>
        )}
      </Card>

      <Card
        titulo="Autorizei e a pessoa ainda não criou a conta"
        direita="direto do banco, sem você registrar nada"
        className="mb-4"
      >
        {autorizados.length === 0 ? (
          <p className="py-4 text-center text-[13px] text-ninho-cinza">Ninguém pendurado aqui agora.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px]">
              <thead>
                <tr>
                  <th className={th}>Quem</th>
                  <th className={th}>Instagram</th>
                  <th className={th}>Desde</th>
                  <th className={th}>O que está faltando</th>
                </tr>
              </thead>
              <tbody>
                {autorizados.map((a) => (
                  <tr key={`${a.tipo}-${a.id}`}>
                    <td className={`${td} font-bold`}>{a.nome}</td>
                    <td className={td}>
                      {a.instagram ? (
                        <a
                          href={urlDoPerfil(a.instagram.replace(/^[@＠]/, '').toLowerCase())}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-[12.5px] font-bold text-ninho-roxo-escuro hover:underline"
                        >
                          {a.instagram}
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className={`${td} tabular-nums text-ninho-cinza`}>{a.desde ? dataBr(a.desde) : '—'}</td>
                    <td className={`${td} text-ninho-cinza`}>{a.detalhe}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card
        titulo="Trazer quem você já abordou"
        direita="da sua página de convites (enviar.html)"
        className="mb-4"
      >
        <FormImportar />
      </Card>

      <Card titulo="Colocar @ na lista" direita="uma linha por pessoa" className="mb-4">
        <FormAdicionar hoje={hoje} />
      </Card>

      <Card
        titulo={`Todos os contatos (${visiveis.length})`}
        direita={<Copiar texto={todosOsArrobas.join('\n')} label={`Copiar os ${todosOsArrobas.length} @`} />}
        className="mb-4"
      >
        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setFiltro('')}
            className={`rounded-pill px-3 py-1.5 text-[12px] font-bold ${filtro === '' ? 'bg-[#24164F] text-white' : 'bg-[#F0EEF4] text-ninho-cinza'}`}
          >
            Todas as etapas
          </button>
          {ETAPAS.map((e) => (
            <button
              key={e.k}
              type="button"
              title={e.ajuda}
              onClick={() => setFiltro(e.k)}
              className={`rounded-pill px-3 py-1.5 text-[12px] font-bold ${filtro === e.k ? 'bg-[#24164F] text-white' : 'bg-[#F0EEF4] text-ninho-cinza'}`}
            >
              {e.label} ({conta(e.k)})
            </button>
          ))}
          <label className="ml-auto flex items-center gap-1.5 text-[12px] font-bold text-ninho-cinza">
            <input type="checkbox" checked={verArquivados} onChange={(ev) => setVerArquivados(ev.target.checked)} />
            mostrar quem saiu da lista
          </label>
        </div>
        {visiveis.length === 0 ? (
          <p className="py-6 text-center text-[13px] text-ninho-cinza">
            Nada aqui ainda. Cole os @ que você já abordou no campo acima.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {visiveis.map((c) => (
              <Linha key={c.id} c={c} hist={porContato.get(c.id) ?? []} hoje={hoje} />
            ))}
          </div>
        )}
      </Card>

      {video && (
        <Card titulo="Vídeo da abordagem" direita="53 s · 1080×1920 · 4,4 MB" className="mb-4">
          <p className="text-[13px] leading-relaxed">
            O vídeo é <strong>anexado na conversa</strong>, nunca mandado como link: ele toca ali mesmo, sem ela sair do
            Instagram. O arquivo está no seu computador, em:
          </p>
          <div className="my-3 flex flex-wrap items-center gap-2 rounded-[14px] bg-[#24164F] px-3 py-2">
            <code className="flex-1 overflow-x-auto whitespace-nowrap text-[11.5px] text-white">{video.caminho}</code>
            <Copiar texto={video.caminho} label="Copiar o caminho" />
          </div>
          <Aviso tom="ambar">
            <strong>Ainda não vai para endereço público.</strong> O vídeo mostra a orientação da consultora chegando no
            celular da família, que só chega às consultoras com o build <strong>1.1.2</strong>. Quem receber hoje não
            acha essa tela no app. Por isso ele não é servido pelo site: o envio é você anexando o arquivo.
          </Aviso>
          <ul className="mt-3 ml-4 list-disc text-[12.5px] leading-relaxed text-ninho-cinza">
            <li>Não mandar para quem já é consultora cadastrada: este material é para ganhar gente nova.</li>
            <li>Comissão só entra se ela perguntar, e sempre &ldquo;até 25%&rdquo;, nunca valor fixo.</li>
            <li>Preços citados nos textos: Básico R$ 12,90 e Premium R$ 17,90, com 7 dias grátis.</li>
          </ul>
        </Card>
      )}

      <Card titulo="Textos de cada etapa" direita="troque {nome} antes de mandar" className="mb-4">
        <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-4">
          {TEXTOS.map((t) => (
            <Pronto key={t.k} t={t} />
          ))}
        </div>
        <p className="mt-3 text-[11.5px] leading-snug text-ninho-cinza">
          O eixo é a plataforma, não a comissão (decisão de 16/11/2026). Não abra com dinheiro, não cite porcentagem e
          não prometa resultado de sono.
        </p>
      </Card>

      <Card titulo="Respostas para a reação dela" direita="no meio da conversa" className="mb-4">
        <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
          {RESPOSTAS.map((t) => (
            <Pronto key={t.k} t={t} />
          ))}
        </div>
      </Card>

      <Card titulo="Consultora indica consultora" direita="previsto, ainda não construído">
        <p className="text-[13px] leading-relaxed text-ninho-cinza">
          Quando houver um número bom de consultoras, o lugar de pedir que uma indique outra é aqui: a indicada entra na
          lista com a origem <strong>Indicação de consultora</strong> (a coluna já existe no banco) e quem indicou fica
          gravada. Não há nada ligado ainda — nenhuma consultora recebe pedido de indicação hoje.
        </p>
      </Card>
    </>
  );
}
