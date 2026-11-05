import { requireSession } from '@/lib/auth/guard';
import { CONTATO_EMAIL } from '@/lib/config';
import { DIAS_TRIAL, ECONOMIA_ANUAL, PRECOS, brl } from '@/lib/precos';
import {
  CODIGO_EXEMPLO,
  DESTACAR,
  DICAS_FORMATO,
  DUVIDA_SAUDE,
  FAQ,
  FRASES_PRONTAS,
  IDEIAS_CONTEUDO,
  LINK_BASE,
  NAO_FALAR_JURIDICO,
  NAO_FALAR_SAUDE,
  PALAVRAS,
  RECURSOS,
  SOBRE,
} from '@/lib/parceiros/guia';
import { PageHeader } from '@/components/admin/PageHeader';
import { Notice } from '@/components/admin/Notice';
import { Mini } from '@/components/admin/Mini';

// Página só de leitura: qualquer papel logado (admin, parceiro...) pode abrir.
// A permissão de menu é ligada em outro lugar.

const SECOES = [
  { id: 'o-que-e', titulo: 'O que é o Ninho' },
  { id: 'recursos', titulo: 'Recursos' },
  { id: 'planos', titulo: 'Planos e preços' },
  { id: 'divulgar', titulo: 'Como divulgar' },
  { id: 'nao-falar', titulo: 'O que não falar' },
  { id: 'parceria', titulo: 'Como funciona a parceria' },
  { id: 'faq', titulo: 'Perguntas frequentes' },
  { id: 'contato', titulo: 'Contato' },
];

function Card({
  id,
  titulo,
  children,
}: {
  id: string;
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mb-6 scroll-mt-6 rounded-2xl border border-ninho-borda bg-white p-5">
      <h2 className="mb-4 text-lg font-bold text-ninho-grafite">{titulo}</h2>
      {children}
    </section>
  );
}

function Sub({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-2 mt-5 text-sm font-semibold text-ninho-roxo-escuro first:mt-0">{children}</h3>;
}

function Lista({ itens, tom = 'normal' }: { itens: string[]; tom?: 'normal' | 'nao' }) {
  return (
    <ul className="space-y-2 text-sm text-ninho-grafite">
      {itens.map((t) => (
        <li key={t} className="flex gap-2">
          <span
            className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
              tom === 'nao' ? 'bg-[#E85D5D]' : 'bg-ninho-roxo'
            }`}
          />
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}

function Passo({ n, titulo, children }: { n: number; titulo: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ninho-roxo-suave text-sm font-bold text-ninho-roxo-escuro">
        {n}
      </span>
      <div className="text-sm text-ninho-grafite">
        <p className="font-semibold">{titulo}</p>
        <div className="mt-1 text-ninho-cinza">{children}</div>
      </div>
    </div>
  );
}

export default function GuiaParceiroPage() {
  requireSession();

  return (
    <>
      <PageHeader
        title="Guia do parceiro"
        subtitle="Tudo para conhecer o Ninho, falar dele do jeito certo e entender como a parceria funciona."
      />

      <nav className="mb-6 flex flex-wrap gap-2">
        {SECOES.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="rounded-full border border-ninho-borda bg-white px-3 py-1 text-xs font-medium text-ninho-roxo-escuro hover:bg-ninho-roxo-suave"
          >
            {s.titulo}
          </a>
        ))}
      </nav>

      {/* 1 */}
      <Card id="o-que-e" titulo="O que é o Ninho">
        <p className="text-sm leading-relaxed text-ninho-grafite">{SOBRE.oQueE}</p>
        <Sub>Para quem é</Sub>
        <p className="text-sm leading-relaxed text-ninho-grafite">{SOBRE.paraQuem}</p>
        <Sub>Que problema resolve</Sub>
        <p className="text-sm leading-relaxed text-ninho-grafite">{SOBRE.problema}</p>
      </Card>

      {/* 2 */}
      <Card id="recursos" titulo="Principais recursos">
        <div className="grid gap-3 sm:grid-cols-2">
          {RECURSOS.map((r) => (
            <div key={r.titulo} className="rounded-xl bg-ninho-nuvem p-4">
              <p className="text-sm font-semibold text-ninho-grafite">{r.titulo}</p>
              <p className="mt-1 text-sm text-ninho-cinza">{r.texto}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* 3 */}
      <Card id="planos" titulo="Planos e preços">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Mini label="Teste grátis" value={`${DIAS_TRIAL} dias`} hint="Tudo liberado" />
          <Mini label="Básico mensal" value={brl(PRECOS.basico.mensal)} hint="por mês" />
          <Mini label="Básico anual" value={brl(PRECOS.basico.anual)} hint="por ano" />
          <Mini label="Premium mensal" value={brl(PRECOS.premium.mensal)} hint="por mês" />
          <Mini
            label="Premium anual"
            value={brl(PRECOS.premium.anual)}
            hint={`por ano · economia de ${brl(ECONOMIA_ANUAL)}`}
          />
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-ninho-borda text-xs uppercase text-ninho-cinza">
                <th className="py-2 pr-4 font-medium">Plano</th>
                <th className="py-2 font-medium">O que libera</th>
              </tr>
            </thead>
            <tbody className="text-ninho-grafite">
              <tr className="border-b border-ninho-borda">
                <td className="py-2 pr-4 font-semibold">Teste grátis</td>
                <td className="py-2">Tudo, por {DIAS_TRIAL} dias.</td>
              </tr>
              <tr className="border-b border-ninho-borda">
                <td className="py-2 pr-4 font-semibold">Básico</td>
                <td className="py-2">O app inteiro, menos álbum em PDF, vídeo e Chat IA.</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 font-semibold">Premium</td>
                <td className="py-2">Tudo.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <Sub>Bom saber</Sub>
        <Lista
          itens={[
            `Todo mundo começa com ${DIAS_TRIAL} dias grátis, com tudo liberado. Nada é cobrado no dia, e o app avisa 2 dias antes de o teste acabar.`,
            'A assinatura é feita e cobrada pela App Store ou pelo Google Play. Quem cancela na loja antes de o teste acabar não paga nada.',
            'Quem não assina depois do teste continua vendo tudo o que registrou, mas não registra nem edita.',
            'Uma assinatura cobre todos os cuidadores do mesmo bebê (responsável principal e os 5 primeiros cuidadores).',
            'Os preços acima são os da loja no Brasil. Fora do Brasil, vale o preço que a loja mostra na moeda local.',
          ]}
        />
      </Card>

      {/* 4 */}
      <Card id="divulgar" titulo="Como divulgar">
        <Sub>Ideias de conteúdo que funcionam</Sub>
        <div className="grid gap-3 sm:grid-cols-2">
          {IDEIAS_CONTEUDO.map((i) => (
            <div key={i.titulo} className="rounded-xl bg-ninho-nuvem p-4">
              <p className="text-sm font-semibold text-ninho-grafite">{i.titulo}</p>
              <p className="mt-1 text-sm text-ninho-cinza">{i.texto}</p>
            </div>
          ))}
        </div>

        <Sub>No formato</Sub>
        <Lista itens={DICAS_FORMATO} />

        <Sub>Frases prontas</Sub>
        <p className="mb-2 text-xs text-ninho-cinza">Use como ponto de partida e ajuste para o seu jeito de falar.</p>
        <div className="space-y-2">
          {FRASES_PRONTAS.map((f) => (
            <blockquote
              key={f}
              className="rounded-xl border-l-4 border-ninho-roxo bg-ninho-roxo-suave/40 px-4 py-2 text-sm text-ninho-grafite"
            >
              {f}
            </blockquote>
          ))}
        </div>

        <Sub>O que destacar</Sub>
        <Lista itens={DESTACAR} />

        <Sub>Palavras da casa</Sub>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-ninho-borda text-xs uppercase text-ninho-cinza">
                <th className="py-2 pr-4 font-medium">Prefira</th>
                <th className="py-2 font-medium">Evite</th>
              </tr>
            </thead>
            <tbody className="text-ninho-grafite">
              {PALAVRAS.map((p) => (
                <tr key={p.use} className="border-b border-ninho-borda last:border-0">
                  <td className="py-2 pr-4">{p.use}</td>
                  <td className="py-2 text-ninho-cinza">{p.evite}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 5 */}
      <Card id="nao-falar" titulo="O que não falar">
        <p className="mb-4 text-sm text-ninho-grafite">
          O Ninho organiza a rotina; ele não é um aplicativo médico e não pode parecer um. Uma frase que soa como
          orientação de saúde pode atrasar a ida de uma família ao médico. Na dúvida, não diga.
        </p>
        <Sub>Saúde: nunca diga</Sub>
        <Lista itens={NAO_FALAR_SAUDE} tom="nao" />
        <Sub>Publicidade e regras: nunca faça</Sub>
        <Lista itens={NAO_FALAR_JURIDICO} tom="nao" />
        <div className="mt-5">
          <Notice tone="warn">{DUVIDA_SAUDE}</Notice>
        </div>
      </Card>

      {/* 6 */}
      <Card id="parceria" titulo="Como funciona a parceria">
        <Sub>Seu link e seu código</Sub>
        <p className="text-sm text-ninho-grafite">
          Cada parceiro tem um código próprio e um link com ele. Por exemplo, para o código {CODIGO_EXEMPLO}:
        </p>
        <p className="my-3 inline-block rounded-xl bg-ninho-nuvem px-4 py-2 font-mono text-sm text-ninho-roxo-escuro">
          {LINK_BASE}
          {CODIGO_EXEMPLO}
        </p>
        <p className="text-sm text-ninho-grafite">
          O seu link e o seu código estão na sua tela de resultados aqui no painel. Lá você acompanha cliques,
          downloads, cadastros, assinantes e a sua comissão.
        </p>

        <Sub>Como o download é contado</Sub>
        <div className="space-y-3">
          <Passo n={1} titulo="A pessoa toca no seu link no celular">
            O link leva para a loja certa (App Store ou Google Play).
          </Passo>
          <Passo n={2} titulo="Instala o Ninho no MESMO celular">
            O app reconhece a instalação e a liga ao clique no seu link pela rede, em até 7 dias. Se a pessoa abrir o
            link no computador e instalar no celular, ou abrir num celular e instalar em outro, o download não é ligado
            a você.
          </Passo>
          <Passo n={3} titulo="Se instalou sem o link, ainda dá: o código">
            No cadastro do app, a pessoa pode digitar o seu código. Vale nos 7 primeiros dias da conta.
          </Passo>
        </div>

        <Sub>Dicas para o Instagram</Sub>
        <Lista
          itens={[
            'Stories: use a figurinha de link com o seu link. Quem toca já está no celular, que é o caminho certo.',
            'Bio: deixe o seu link na bio e diga "link na bio" no conteúdo.',
            'Reels e posts: links na legenda não abrem. Fale o código em voz alta e escreva na tela, e mande para o link da bio.',
            'Peça para a pessoa abrir o link no celular em que vai instalar o app.',
            'Use o link exatamente como está na sua tela de resultados.',
          ]}
        />

        <Sub>Quem chega primeiro fica</Sub>
        <Lista
          itens={[
            'A conta fica com o primeiro parceiro que trouxe a pessoa (pelo link ou pelo código) e não muda de parceiro depois.',
            'Se alguém disser que veio por você e não apareceu na sua tela, a equipe pode atribuir a conta a você manualmente. Escreva para a equipe.',
          ]}
        />

        <Sub>Como a comissão é calculada</Sub>
        <Lista
          itens={[
            'A comissão padrão é de 25% do preço cheio da assinatura (o preço da loja, sem descontar a taxa da Apple ou do Google) de cada pessoa que veio por você.',
            'Plano mensal: 25% da primeira mensalidade cobrada (1 mês).',
            'Plano anual: 25% da anuidade, uma única vez.',
            'Só conta quando a Apple ou o Google cobram de verdade. Quem cancela durante os 7 dias grátis não gera comissão.',
            'Se o seu acordo for diferente do padrão, vale o que está na sua tela de resultados.',
          ]}
        />

        <Sub>Quando e como você recebe</Sub>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Mini label="Fechamento" value="Mensal" hint="O que a loja cobrou no mês" />
          <Mini label="Pagamento" value="Dia 30" hint="Do mês seguinte" />
          <Mini label="Forma" value="Pix" hint="Chave em Minha conta" />
          <Mini label="Mínimo" value="Nenhum" hint="Qualquer valor é pago" />
        </div>
        <p className="mt-3 text-sm text-ninho-cinza">
          Cadastre a sua chave Pix em Minha conta. Sem ela, não dá para fazer o pagamento.
        </p>
      </Card>

      {/* 7 */}
      <Card id="faq" titulo="Perguntas frequentes">
        <div className="divide-y divide-ninho-borda">
          {FAQ.map((q) => (
            <details key={q.titulo} className="group py-3">
              <summary className="cursor-pointer list-none text-sm font-semibold text-ninho-grafite marker:hidden">
                <span className="mr-2 inline-block text-ninho-roxo transition-transform group-open:rotate-90">›</span>
                {q.titulo}
              </summary>
              <p className="mt-2 pl-5 text-sm text-ninho-cinza">{q.texto}</p>
            </details>
          ))}
        </div>
      </Card>

      {/* 8 */}
      <Card id="contato" titulo="Fale com a equipe">
        <p className="text-sm text-ninho-grafite">
          Dúvida sobre a parceria, um seguidor que não apareceu na sua tela ou uma ideia de conteúdo que você quer
          validar antes de publicar: escreva para{' '}
          <a href={`mailto:${CONTATO_EMAIL}`} className="font-semibold text-ninho-roxo-escuro underline">
            {CONTATO_EMAIL}
          </a>
          .
        </p>
        <p className="mt-2 text-sm text-ninho-cinza">Quem responde é a Equipe Ninho.</p>
      </Card>
    </>
  );
}
