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
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import {
  ETAPAS,
  ETAPA_LABEL,
  LINHA_DO_CONSOLE,
  ORIGEM_LABEL,
  RESPOSTAS,
  TEXTOS,
  atrasadoEmDias,
  dataBr,
  textoDaEtapa,
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
  registrarContato,
  salvarContato,
  subirVideoCaptacao,
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
  const [st, action] = useActionState<CaptacaoState, FormData>(comentar, {});
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

/**
 * O texto da vez para ESTA pessoa, escolhido pela etapa em que ela está — ele
 * não precisa procurar qual é nem editar nada antes de mandar.
 */
function ProximoTexto({ c }: { c: Contato }) {
  const t = textoDaEtapa(c.etapa);
  if (!t) return null;
  return (
    <div className="rounded-[18px] bg-[#EEF8F1] p-3">
      <p className="text-[11.5px] font-bold text-[#2F8A55]">Texto para mandar agora</p>
      <p className="mt-0.5 text-[13px] font-extrabold text-ninho-grafite">{t.titulo}</p>
      {t.espera112 && (
        <p className="mt-1 rounded-[12px] bg-[#FFF2D6] px-2 py-1 text-[11px] font-bold leading-snug text-[#7A5A12]">
          Tire a parte da orientação chegando à mãe enquanto a 1.1.2 não chegar às consultoras.
        </p>
      )}
      <p className="mt-1 whitespace-pre-wrap text-[12.5px] leading-snug">{t.texto}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <Copiar texto={t.texto} label="Copiar e mandar" />
        <a
          href={urlDoPerfil(c.arroba)}
          target="_blank"
          rel="noopener noreferrer"
          className={botao.suave}
        >
          Abrir o perfil dela
        </a>
      </div>
    </div>
  );
}

/** Ficha da pessoa: etapa, data, dados públicos, comentar e histórico. */
function Ficha({ c, hist, hoje }: { c: Contato; hist: Comentario[]; hoje: string }) {
  const [st, action] = useActionState<CaptacaoState, FormData>(salvarContato, {});
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
        <ProximoTexto c={c} />
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

/**
 * O caminho curto, e o primeiro da tela: um @, o que a pessoa disse e o dia
 * de voltar a falar. É o que ele faz o dia inteiro.
 */
function FormRegistrar({ hoje }: { hoje: string }) {
  const [st, action] = useActionState<CaptacaoState, FormData>(registrarContato, {});
  return (
    <form action={action}>
      <Retorno ok={st.ok} erro={st.error} />
      <div className="grid gap-3 lg:grid-cols-[220px_1fr]">
        <div>
          <label className="text-[11.5px] font-bold text-[#9A95AD]">
            @ do Instagram
            <input
              name="arroba"
              required
              placeholder="@maria.sono"
              className={`${campo} mt-1`}
            />
          </label>
          <label className="mt-2 block text-[11.5px] font-bold text-[#9A95AD]">
            Em que pé está
            <select name="etapa" defaultValue="abordado" className={`${campo} mt-1`}>
              {ETAPAS.map((e) => (
                <option key={e.k} value={e.k}>{e.label}</option>
              ))}
            </select>
          </label>
          <label className="mt-2 block text-[11.5px] font-bold text-[#9A95AD]">
            Falar de novo em
            <input type="date" name="proximo_contato" min={hoje} className={`${campo} mt-1`} />
          </label>
        </div>
        <div>
          <label className="text-[11.5px] font-bold text-[#9A95AD]">
            O que ela disse / o que fazer depois
            <textarea
              name="texto"
              rows={5}
              maxLength={1000}
              placeholder="ex.: está corrida essa semana por causa do aniversário da filha, semana que vem a gente conversa"
              className="mt-1 w-full rounded-xl border-[1.5px] border-transparent bg-[#F5F2FB] px-3 py-2 text-[13px] font-medium outline-none focus:border-ninho-roxo"
            />
          </label>
          <p className="mt-1 text-[11px] leading-snug text-ninho-cinza">
            Com a data preenchida, essa pessoa volta sozinha para a lista &ldquo;Para hoje&rdquo; no dia. O comentário
            nunca apaga o anterior. Só o que é do trabalho: nada de vida pessoal.
          </p>
          <div className="mt-3">
            <Botao cls={botao.grad}>Salvar contato</Botao>
          </div>
        </div>
      </div>
    </form>
  );
}

/** Sobe (ou troca) o vídeo da abordagem, que fica em lugar fechado. */
function FormVideo({ tem }: { tem: boolean }) {
  const [st, action] = useActionState<CaptacaoState, FormData>(subirVideoCaptacao, {});
  return (
    <form action={action} className={tem ? 'mt-4' : ''}>
      <Retorno ok={st.ok} erro={st.error} />
      <label className="text-[11.5px] font-bold text-[#9A95AD]">
        {tem ? 'Trocar o vídeo (quando a gente regravar)' : 'Escolha o vídeo no seu computador (.mp4, até 60 MB)'}
      </label>
      <div className="mt-1 flex flex-wrap items-center gap-3">
        <input
          type="file"
          name="arquivo"
          accept="video/mp4,video/quicktime,.mp4,.mov"
          className="text-[12.5px] file:mr-3 file:rounded-pill file:border-0 file:bg-[#F1EBFC] file:px-3 file:py-2 file:text-[12.5px] file:font-bold file:text-[#7C5CD6]"
        />
        <Botao cls={tem ? botao.suave : botao.grad}>{tem ? 'Trocar' : 'Guardar o vídeo'}</Botao>
      </div>
      {!tem && (
        <p className="mt-1 text-[11.5px] text-ninho-cinza">
          Ele está em <span className="font-mono">Ninho-expo\marketing\consultora\video\consultora-plataforma.mp4</span>.
        </p>
      )}
    </form>
  );
}

function FormAdicionar({ hoje }: { hoje: string }) {
  const [st, action] = useActionState<CaptacaoState, FormData>(adicionarContatos, {});
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
  const [st, action] = useActionState<CaptacaoState, FormData>(importarConvites, {});
  return (
    <form action={action}>
      <Retorno ok={st.ok} erro={st.error} />
      <ol className="mb-3 ml-4 list-decimal text-[13px] leading-relaxed">
        <li>
          Abra a sua página de convites (<span className="font-mono">enviar.html</span>) e clique no botão branco{' '}
          <b>Exportar para o painel</b>, no alto. Ele baixa o arquivo{' '}
          <span className="font-mono">captacao-ninho.json</span>.
        </li>
        <li>Escolha esse arquivo aqui embaixo e mande.</li>
      </ol>
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="file"
          name="arquivo"
          accept="application/json,.json"
          className="text-[12.5px] file:mr-3 file:rounded-pill file:border-0 file:bg-[#F1EBFC] file:px-3 file:py-2 file:text-[12.5px] file:font-bold file:text-[#7C5CD6]"
        />
        <Botao cls={botao.grad}>Trazer os contatos</Botao>
      </div>
      <p className="mt-2 text-[11.5px] text-ninho-cinza">
        Pode mandar quantas vezes quiser: @ repetido não duplica, só atualiza a etapa. Entram só os que você marcou com
        alguma situação — os outros perfis da página ficam de fora.
      </p>
      <details className="mt-3">
        <summary className="cursor-pointer text-[11.5px] font-bold text-ninho-cinza">
          Não achou o botão na sua página? Tem o jeito pelo console
        </summary>
        <div className="mt-2 flex flex-wrap items-center gap-2 rounded-[14px] bg-[#24164F] px-3 py-2">
          <code className="flex-1 overflow-x-auto whitespace-nowrap text-[11.5px] text-white">{LINHA_DO_CONSOLE}</code>
          <Copiar texto={LINHA_DO_CONSOLE} label="Copiar a linha" />
        </div>
        <textarea
          name="colado"
          rows={2}
          placeholder="cole aqui o que a linha copiou"
          className="mt-2 w-full rounded-xl border-[1.5px] border-transparent bg-[#F5F2FB] px-3 py-2 text-[12.5px] font-semibold outline-none focus:border-ninho-roxo"
        />
      </details>
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
  /** URL assinada do vídeo da abordagem (1 hora). null = ainda não subiu. */
  video?: string | null;
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

      <Card titulo="Registrar um contato" direita="o @, o que ela disse e quando voltar" className="mb-4">
        <FormRegistrar hoje={hoje} />
        <details className="mt-4 border-t border-[#F0ECF6] pt-3">
          <summary className="cursor-pointer text-[12px] font-bold text-ninho-cinza">
            Colocar vários @ de uma vez (uma lista colada)
          </summary>
          <div className="mt-3">
            <FormAdicionar hoje={hoje} />
          </div>
        </details>
      </Card>

      <Card titulo="Vídeo da abordagem" direita="53 s · 1080×1920" className="mb-4">
        <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
          <div>
            {video ? (
              // eslint-disable-next-line jsx-a11y/media-has-caption
              <video src={video} controls preload="metadata" className="w-full rounded-[18px] bg-black" />
            ) : (
              <div className="flex h-[300px] items-center justify-center rounded-[18px] bg-[#F0EEF4] px-4 text-center text-[12.5px] font-semibold text-ninho-cinza">
                Nenhum vídeo guardado ainda. Escolha o arquivo ao lado.
              </div>
            )}
          </div>
          <div>
            {video ? (
              <>
                <p className="text-[13px] leading-relaxed">
                  Assista aqui, baixe e <strong>anexe o arquivo</strong> na conversa do Instagram. O vídeo toca lá
                  dentro, sem ela sair do direct — por isso o arquivo, nunca um link.
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <a href={video} download="ninho-consultora.mp4" className={botao.grad}>
                    Baixar o vídeo
                  </a>
                  <a
                    href="https://www.instagram.com/direct/inbox/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={botao.suave}
                  >
                    Abrir o direct do Instagram
                  </a>
                </div>
              </>
            ) : null}
            <FormVideo tem={Boolean(video)} />
            <Aviso tom="ambar">
              <strong>Não mande como link, e não publique.</strong> O vídeo mostra a orientação da consultora chegando
              no celular da família, que só chega às consultoras com o build <strong>1.1.2</strong>: quem receber hoje
              não acha essa tela no app. Aqui ele fica guardado em lugar fechado, só para você.
            </Aviso>
            <ul className="mt-3 ml-4 list-disc text-[12.5px] leading-relaxed text-ninho-cinza">
              <li>Não mandar para quem já é consultora cadastrada: este material é para ganhar gente nova.</li>
              <li>Comissão só entra se ela perguntar, e sempre &ldquo;até 25%&rdquo;, nunca valor fixo.</li>
              <li>
                Se ela perguntar se a cliente vai pagar: Básico R$ 12,90 e Premium R$ 17,90, com 7 dias grátis, e a
                assinatura cobre o pai, a mãe e os cuidadores do mesmo bebê — não é uma por pessoa.
              </li>
            </ul>
          </div>
        </div>
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

      <Card titulo="Textos de cada etapa" direita="saem prontos: nada para preencher" className="mb-4">
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
