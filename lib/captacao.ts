/**
 * Captação de parceiro — o funil de quem o dono aborda no Instagram para virar
 * consultora de sono. Server-only (service_role do schema `painel`).
 *
 * Tabelas: painel.captacao_contatos e painel.captacao_comentarios
 * (migration Ninho-expo/supabase/migrations/00176_painel_captacao_parceiro.sql;
 * enquanto não estiver aplicada, `indisponivel` fica true e a tela explica).
 *
 * O que o banco já responde e NÃO se pede ao dono: "pediu pelo site, eu
 * autorizei e a pessoa ainda não criou a conta" sai de public.consultoras
 * (estado 'esperando') e de painel.parceiro_pedidos aprovados cujo perfil
 * ainda está com senha provisória — ver `autorizadosSemConta`.
 *
 * Privacidade: só informação profissional e pública (o @, o nome, seguidores,
 * se já vende atendimento) e o andamento da conversa de trabalho. O comentário
 * é campo livre e a tela avisa para não escrever nada de vida pessoal.
 */
import { appDb, painelDb } from '@/lib/supabase/server';

// ── Etapas do funil (as palavras do dono em 16/11/2026) ───
export type Etapa =
  | 'novo'
  | 'abordado'
  | 'conversando'
  | 'retomar'
  | 'proposta'
  | 'sumiu'
  | 'quente'
  | 'pediu_acesso'
  | 'recusou'
  | 'nao_combina'
  | 'virou_consultora';

export const ETAPAS: { k: Etapa; label: string; ajuda: string }[] = [
  { k: 'novo', label: 'Achei na pesquisa', ajuda: 'ainda não falei com ela' },
  { k: 'abordado', label: 'Abordei', ajuda: 'mandei a 1ª mensagem, sem resposta' },
  { k: 'conversando', label: 'Conversando', ajuda: 'respondeu, a conversa está de pé' },
  { k: 'retomar', label: 'Falar de novo em', ajuda: 'ela pediu para voltar num dia certo' },
  { k: 'proposta', label: 'Recebeu a proposta', ajuda: 'mandei a proposta, esperando' },
  { k: 'sumiu', label: 'Sumiu depois da proposta', ajuda: 'mandar o vídeo e encerrar sem insistir' },
  { k: 'quente', label: 'Quente', ajuda: 'conversou, fez perguntas, não respondeu mais' },
  { k: 'pediu_acesso', label: 'Pediu acesso', ajuda: 'falta eu liberar no painel' },
  { k: 'recusou', label: 'Não quer', ajuda: 'disse que não' },
  { k: 'nao_combina', label: 'Não combina', ajuda: 'o perfil não serve; fica fora da lista' },
  { k: 'virou_consultora', label: 'Virou consultora', ajuda: 'entrou no programa' },
];

export const ETAPA_LABEL: Record<Etapa, string> = Object.fromEntries(
  ETAPAS.map((e) => [e.k, e.label]),
) as Record<Etapa, string>;

export function etapaValida(v: string): v is Etapa {
  return ETAPAS.some((e) => e.k === v);
}

export type Origem = 'pesquisa' | 'site' | 'indicacao';

export const ORIGEM_LABEL: Record<Origem, string> = {
  pesquisa: 'Veio de pesquisa',
  site: 'Pediu pelo site',
  indicacao: 'Indicação de consultora',
};

export interface Contato {
  id: string;
  arroba: string;
  nome: string | null;
  etapa: Etapa;
  proximo_contato: string | null;
  origem: Origem;
  seguidores: number | null;
  por_que_serve: string | null;
  indicada_por_consultora: string | null;
  arquivado: boolean;
  criado_em: string;
  atualizado_em: string;
}

export interface Comentario {
  id: string;
  contato_id: string;
  texto: string;
  etapa_depois: Etapa | null;
  proximo_contato: string | null;
  criado_em: string;
}

/** Linha do funil que o BANCO já sabe: autorizei e a pessoa não criou a conta. */
export interface AutorizadoSemConta {
  id: string;
  nome: string;
  instagram: string | null;
  desde: string | null;
  tipo: 'consultora' | 'parceiro';
  detalhe: string;
}

// ── Normalização do @ ─────────────────────────────────────
const ARROBA_RE = /^[a-z0-9._]{1,30}$/;

/**
 * "＠Maria.Sono", "https://instagram.com/maria.sono/", "@maria sono " →
 * "maria.sono". Devolve null quando não dá um @ válido do Instagram.
 */
export function normalizarArroba(bruto: string): string | null {
  let s = (bruto || '').trim().toLowerCase();
  if (!s) return null;
  s = s.replace(/^https?:\/\//, '').replace(/^www\./, '');
  s = s.replace(/^(?:instagram\.com|instagr\.am)\//, '');
  s = s.split(/[/?#]/)[0];
  // "＠" é o arroba de largura cheia, que vem colado do celular.
  s = s.replace(/^[@＠]+/, '').trim();
  s = s.replace(/\s+/g, '');
  return ARROBA_RE.test(s) ? s : null;
}

/** Cola uma lista inteira (uma por linha, ou separadas por vírgula/espaço). */
export function arrobasDaLista(texto: string): { arrobas: string[]; recusados: string[] } {
  const pedacos = (texto || '').split(/[\s,;]+/).filter(Boolean);
  const arrobas: string[] = [];
  const recusados: string[] = [];
  for (const p of pedacos) {
    const a = normalizarArroba(p);
    if (!a) recusados.push(p.slice(0, 40));
    else if (!arrobas.includes(a)) arrobas.push(a);
  }
  return { arrobas, recusados };
}

export function urlDoPerfil(arroba: string): string {
  return `https://www.instagram.com/${arroba}/`;
}

// ── Dia de hoje no fuso do painel (Asia/Dubai) ────────────
/** 'AAAA-MM-DD' de hoje em Dubai — o mesmo fuso das outras datas do painel. */
export function hojeDubai(agora: Date = new Date()): string {
  return agora.toLocaleDateString('en-CA', { timeZone: 'Asia/Dubai' });
}

export function dataBr(iso: string | null): string {
  if (!iso) return '—';
  const [a, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${a}`;
}

/** Quem tem retorno marcado para hoje ou atrasado — a lista que ele abre de manhã. */
export function paraHoje(contatos: Contato[], hoje: string = hojeDubai()): Contato[] {
  return contatos
    .filter((c) => !c.arquivado && c.proximo_contato && c.proximo_contato <= hoje)
    .sort((a, b) => (a.proximo_contato ?? '').localeCompare(b.proximo_contato ?? ''));
}

export function atrasadoEmDias(iso: string | null, hoje: string = hojeDubai()): number {
  if (!iso) return 0;
  const ms = Date.parse(`${hoje}T00:00:00Z`) - Date.parse(`${iso.slice(0, 10)}T00:00:00Z`);
  return Math.max(0, Math.round(ms / 86_400_000));
}

// ── Leitura ───────────────────────────────────────────────
/** A migration 00176 ainda não foi aplicada? (tabela/schema inexistente) */
function tabelaFalta(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  const c = error.code ?? '';
  return c === '42P01' || c === 'PGRST205' || c === 'PGRST106' || /captacao_/.test(error.message ?? '');
}

export interface Captacao {
  contatos: Contato[];
  comentarios: Comentario[];
  /** true = a migration 00176 ainda não foi aplicada. */
  indisponivel: boolean;
  erro?: string;
}

export async function listarCaptacao(): Promise<Captacao> {
  const sb = painelDb();
  const [c, k] = await Promise.all([
    sb.from('captacao_contatos').select('*').order('atualizado_em', { ascending: false }).limit(1000),
    sb.from('captacao_comentarios').select('*').order('criado_em', { ascending: false }).limit(2000),
  ]);
  if (tabelaFalta(c.error) || tabelaFalta(k.error)) {
    return { contatos: [], comentarios: [], indisponivel: true };
  }
  if (c.error || k.error) {
    const erro = c.error?.message ?? k.error?.message;
    console.error('[captacao] leitura falhou:', erro);
    return { contatos: [], comentarios: [], indisponivel: false, erro };
  }
  return {
    contatos: (c.data as Contato[]) ?? [],
    comentarios: (k.data as Comentario[]) ?? [],
    indisponivel: false,
  };
}

/**
 * "Autorizei e a pessoa ainda não criou a conta" — sem perguntar nada ao dono:
 *  - public.consultoras com estado 'esperando' (e-mail liberado, sem conta no app);
 *  - painel.parceiro_pedidos aprovados cujo perfil ainda está com a senha
 *    provisória (nunca entrou no painel para trocar).
 * Falha de banco não derruba a tela: volta o que deu.
 */
export async function autorizadosSemConta(): Promise<AutorizadoSemConta[]> {
  const linhas: AutorizadoSemConta[] = [];

  const { data: cons, error: e1 } = await appDb()
    .from('consultoras')
    .select('id,nome,instagram,estado,liberada_em,email_liberado,profile_id')
    .eq('estado', 'esperando')
    .order('liberada_em', { ascending: true })
    .limit(200);
  if (e1) console.error('[captacao] consultoras esperando:', e1.message);
  for (const c of (cons as { id: string; nome: string | null; instagram: string | null; liberada_em: string | null; email_liberado: string | null }[]) ?? []) {
    linhas.push({
      id: c.id,
      nome: c.nome || c.email_liberado || 'sem nome',
      instagram: c.instagram,
      desde: c.liberada_em,
      tipo: 'consultora',
      detalhe: 'consultora de sono: e-mail liberado, ainda sem conta no app',
    });
  }

  const sb = painelDb();
  const { data: peds, error: e2 } = await sb
    .from('parceiro_pedidos')
    .select('id,nome,instagram,perfil_id,decidido_em')
    .eq('status', 'aprovado')
    .not('perfil_id', 'is', null)
    .order('decidido_em', { ascending: true })
    .limit(200);
  if (e2) console.error('[captacao] parceiro_pedidos aprovados:', e2.message);
  const pedidos = (peds as { id: string; nome: string; instagram: string | null; perfil_id: string; decidido_em: string | null }[]) ?? [];
  if (pedidos.length) {
    const { data: perfis } = await sb
      .from('perfis')
      .select('id,trocar_senha')
      .in('id', pedidos.map((p) => p.perfil_id));
    const provisoria = new Set(
      ((perfis as { id: string; trocar_senha: boolean | null }[]) ?? []).filter((p) => p.trocar_senha).map((p) => p.id),
    );
    for (const p of pedidos) {
      if (!provisoria.has(p.perfil_id)) continue;
      linhas.push({
        id: p.id,
        nome: p.nome,
        instagram: p.instagram,
        desde: p.decidido_em,
        tipo: 'parceiro',
        detalhe: 'parceiro aprovado: senha provisória nunca trocada, não entrou no painel',
      });
    }
  }

  return linhas;
}

// ── Importação da página de convites ──────────────────────
/**
 * A página de convites do dono
 * (Ninho-expo/marketing/consultoras/contatos/enviar.html) guarda o que ele
 * marcou no localStorage do navegador, não em arquivo: `ninho.convites.v1` é
 * um mapa @ → estado. Aqui cada estado de lá vira uma etapa daqui.
 */
export const ETAPA_DO_CONVITE: Record<string, { etapa: Etapa; arquivar?: boolean; rotulo: string }> = {
  '': { etapa: 'novo', rotulo: 'A enviar' },
  enviada: { etapa: 'abordado', rotulo: '1º contato enviado' },
  respondeu: { etapa: 'conversando', rotulo: 'Respondeu' },
  proposta: { etapa: 'proposta', rotulo: 'Proposta enviada' },
  pediu: { etapa: 'pediu_acesso', rotulo: 'Pediu acesso' },
  sem: { etapa: 'sumiu', rotulo: 'Sem resposta depois da proposta' },
  nao: { etapa: 'recusou', rotulo: 'Não quis' },
  fora: { etapa: 'nao_combina', arquivar: true, rotulo: 'Não combina' },
};

/**
 * A linha pronta do console. Lê os cartões da PRÓPRIA página (nome, alcance e
 * o "o que eu vi") junto com o que ele marcou, para a lista de contatos dele
 * não precisar morar neste repositório — que é público.
 */
export const LINHA_DO_CONSOLE =
  "copy(JSON.stringify({contatos:[...document.querySelectorAll('.c')].map(c=>({arroba:c.dataset.id,nome:(c.querySelector('h2')||{}).textContent||'',meta:(c.querySelector('.meta')||{}).textContent||'',gancho:(c.querySelector('.g')||{}).textContent||'',estado:(c.querySelector('.st')||{}).value||''})),datas:JSON.parse(localStorage.getItem('ninho.convites.datas.v1')||'{}')}))";

export interface ConviteMarcado {
  arroba: string;
  estado: string;
  data: string | null;
  nome: string | null;
  seguidores: number | null;
  gancho: string | null;
}

function soNumero(meta: string): number | null {
  const m = /([\d.]+)\s*seguidores/.exec(meta || '');
  if (!m) return null;
  const n = Number(m[1].replace(/\./g, ''));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function limpar(v: string, prefixo?: string): string | null {
  let s = (v || '').replace(/\s+/g, ' ').trim();
  if (prefixo && s.toLowerCase().startsWith(prefixo.toLowerCase())) s = s.slice(prefixo.length).trim();
  return s || null;
}

/**
 * Aceita o que a linha do console produz ({contatos,datas}) e também os
 * formatos antigos: {estado,datas} e o mapa cru (@ → estado) de
 * `ninho.convites.v1`, que vêm sem nome e sem alcance.
 */
export function lerConvitesColados(txt: string): { linhas: ConviteMarcado[]; erro?: string } {
  const bruto = (txt || '').trim();
  if (!bruto) return { linhas: [], erro: 'Cole o texto que a linha do console copiou.' };
  let obj: unknown;
  try {
    obj = JSON.parse(bruto);
  } catch {
    return { linhas: [], erro: 'Isso não é o JSON da página de convites (não consegui ler).' };
  }
  if (!obj || typeof obj !== 'object') return { linhas: [], erro: 'Isso não é o JSON da página de convites.' };

  const o = obj as Record<string, unknown>;
  const datas = (o.datas && typeof o.datas === 'object' ? o.datas : {}) as Record<string, unknown>;
  const dataDe = (chave: string) => (typeof datas[chave] === 'string' ? (datas[chave] as string) : null);
  const linhas: ConviteMarcado[] = [];

  if (Array.isArray(o.contatos)) {
    for (const bruta of o.contatos as Record<string, unknown>[]) {
      const arroba = normalizarArroba(String(bruta?.arroba ?? ''));
      const estado = String(bruta?.estado ?? '');
      if (!arroba || !(estado in ETAPA_DO_CONVITE)) continue;
      linhas.push({
        arroba,
        estado,
        data: dataDe(String(bruta?.arroba ?? '')),
        nome: limpar(String(bruta?.nome ?? '')),
        seguidores: soNumero(String(bruta?.meta ?? '')),
        gancho: limpar(String(bruta?.gancho ?? ''), 'O que eu vi:'),
      });
    }
  } else {
    const estados = (o.estado && typeof o.estado === 'object' ? o.estado : o) as Record<string, unknown>;
    for (const [chave, valor] of Object.entries(estados)) {
      const arroba = normalizarArroba(String(chave));
      const estado = String(valor ?? '');
      if (!arroba || !(estado in ETAPA_DO_CONVITE)) continue;
      linhas.push({ arroba, estado, data: dataDe(chave), nome: null, seguidores: null, gancho: null });
    }
  }

  if (!linhas.length) return { linhas: [], erro: 'Não encontrei nenhum @ nesse texto.' };
  return { linhas };
}

// ── Textos prontos (para ele copiar em vez de reescrever) ─
/**
 * Eixo de 16/11/2026: a plataforma, NUNCA a comissão
 * (Ninho-expo/docs/empresa/aquisicao-consultora.md). Os textos vêm de
 * marketing/consultora/mensagem-abordagem.md e respostas-prontas.md, escritos
 * pela frente de aquisição. Sem emoji, sem porcentagem no título, sem
 * promessa de resultado de sono. Quem manda é o dono.
 *
 * `espera112` marca o texto que cita a orientação chegando à mãe: ela está
 * pronta no código e no banco, mas só chega às consultoras com o build 1.1.2.
 * Até lá a tela avisa para tirar essa linha.
 */
export interface TextoPronto {
  k: string;
  titulo: string;
  quando: string;
  texto: string;
  espera112?: boolean;
}

export const TEXTOS: TextoPronto[] = [
  {
    k: 'abordagem',
    titulo: '1ª abordagem',
    quando: 'para quem está em "Achei na pesquisa"',
    texto: `Oi! Aqui é o Mailson, do Ninho — um app de rotina do bebê.

Montei uma área para quem atende sono: a rotina de todas as suas famílias num lugar só, no fuso da casa de cada uma, e os números do bebê na mão na hora de atender. Sem print e sem planilha.

Você não paga nada para usar. Posso te mostrar em 53 segundos?`,
  },
  {
    k: 'proposta',
    titulo: 'Proposta',
    quando: 'quando ela diz "pode apresentar"',
    espera112: true,
    texto: `Que bom! Vou direto ao ponto, em três partes.

1. Você acompanha. Sua cliente registra sono, mamadas e fraldas no Ninho; você abre e vê o dia inteiro dela — sonecas com início e fim, janelas de sono, a noite e os despertares — no celular e no computador, sempre na hora da casa da família.
2. Você orienta por dentro do app. O que você escreve chega para a mãe destacado, e fica o histórico de tudo que você já passou.
3. Você mostra evolução. Em duas semanas dá para comparar como era e como está, com os números dela.

Te mandei o vídeo de 53 segundos com as telas de verdade. Se fizer sentido, eu te libero o acesso hoje mesmo e a gente começa com uma família só, para você sentir.`,
  },
  {
    k: 'reativacao',
    titulo: 'Reativação (sumiu depois da proposta)',
    quando: 'para quem você já tinha procurado antes, falando de comissão',
    texto: `Oi! Mailson, do Ninho.

Na primeira vez eu te falei da parceria pelo lado errado. O ponto é o seu trabalho: a rotina de todas as suas famílias num lugar, um canal direto com cada mãe e os números do bebê na mão na hora de atender.

Te mandei um vídeo de 53 segundos mostrando na tela. É o único pedido. Não te procuro mais; se quiser conhecer, me chama quando quiser.`,
  },
  {
    k: 'retomada_proposta',
    titulo: 'Retomada (recebeu a proposta e sumiu)',
    quando: 'uma vez só, com o arquivo do vídeo junto',
    espera112: true,
    texto: `Oi! Passando só para fechar o assunto, sem cobrança nenhuma.

Te mandei a proposta do Ninho e sei que semana de consultora é corrida. Em uma linha: a rotina de todas as suas famílias num lugar só, um canal direto com cada mãe e os números do bebê na mão na hora de atender.

Deixo o vídeo aqui de novo, são 53 segundos.

Não insisto mais. Se um dia você quiser começar a usar o Ninho para acompanhar suas clientes, é só me chamar que eu libero o seu acesso na hora.`,
  },
  {
    k: 'retomada_contato',
    titulo: 'Retomada (não respondeu ao primeiro contato)',
    quando: 'uma vez só, com o arquivo do vídeo junto',
    texto: `Oi! Te escrevi uma vez e não quero virar insistência.

Resumo rápido: no Ninho a família registra o sono, as mamadas e as fraldas, e você acompanha a rotina de todas as suas clientes num lugar só, no celular e no computador.

Mando o vídeo junto: 53 segundos.

Essa é a última vez que te escrevo sobre isso. Se um dia quiser usar o Ninho para acompanhar suas clientes, me chama que eu libero na hora.`,
  },
];

/**
 * O texto certo para a etapa em que a pessoa está — a aba sabe em que pé cada
 * uma parou, então ele não escolhe à mão.
 */
export function textoDaEtapa(e: Etapa): TextoPronto | null {
  const porEtapa: Partial<Record<Etapa, string>> = {
    novo: 'abordagem',
    abordado: 'retomada_contato',
    conversando: 'proposta',
    proposta: 'retomada_proposta',
    sumiu: 'retomada_proposta',
    quente: 'retomada_contato',
  };
  const k = porEtapa[e];
  return k ? TEXTOS.find((t) => t.k === k) ?? null : null;
}

/** Respostas para a reação dela, no meio da conversa. */
export const RESPOSTAS: TextoPronto[] = [
  {
    k: 'investimento',
    titulo: '"Qual o investimento?"',
    quando: 'ela pergunta quanto custa para ela',
    texto: `Para você não custa nada. Você não paga nada para usar o Ninho como consultora: acompanhar a rotina das suas famílias, o histórico e o painel no computador são seus, de graça.

Quem assina é a família, se ela quiser continuar depois dos 7 dias grátis. O Básico é R$ 12,90 por mês e o Premium R$ 17,90, e a assinatura cobre o pai, a mãe e os cuidadores do mesmo bebê.`,
  },
  {
    k: 'depois',
    titulo: '"Vejo depois, agora não dá"',
    quando: 'sem pressa, deixa a porta aberta',
    texto: `Claro, sem pressa nenhuma.

Deixo o vídeo aí para quando sobrar um minuto. Se um dia você quiser testar com uma cliente só, me chama que eu te libero na hora.

Boa semana e bom trabalho.`,
  },
  {
    k: 'como_funciona',
    titulo: '"Como funciona?"',
    quando: 'o passo a passo, curto',
    texto: `É simples: eu libero o seu acesso, você manda o seu link para a família, ela cria a conta e aprova compartilhar a rotina com você. A partir daí, tudo que ela registrar aparece para você.

Você não registra nada e não precisa pedir print: abre e lê. No computador são as mesmas telas.`,
  },
  {
    k: 'cliente_paga',
    titulo: '"Minha cliente vai ter que pagar?"',
    quando: 'o preço é da família, não dela',
    texto: `Ela começa com 7 dias grátis, sem cartão. Se quiser continuar, o Básico é R$ 12,90 por mês e o Premium R$ 17,90 — e essa assinatura cobre o pai, a mãe e os cuidadores do mesmo bebê, não é uma por pessoa.

Na prática, o que ela paga por mês é menos que um lanche, e é o que mantém a rotina registrada para você acompanhar.`,
  },
  {
    k: 'outro_app',
    titulo: '"Já uso planilha / outro app"',
    quando: 'sem pedir para ela trocar de método',
    texto: `Entendo, e não precisa trocar nada de uma vez.

A diferença que as consultoras sentem é parar de pedir print e de depender da memória da mãe: o registro é dela, chega na hora, e você abre quando quiser. Se quiser, começamos com uma cliente só e você compara com o seu jeito atual.`,
  },
  {
    k: 'comissao',
    titulo: '"Vocês pagam comissão?"',
    quando: 'só quando ELA pergunta; nunca abra com isto',
    texto: `Pagamos, sim: até 25% da assinatura das famílias que criam a conta pelo seu link ou código, por alguns meses, por Pix. O valor exato fica no seu painel, em Ganhos.

Mas não é por isso que eu te procurei. O que muda o seu dia é ter a rotina das suas famílias num lugar só e falar com elas por dentro do app. A comissão é consequência.`,
  },
];
