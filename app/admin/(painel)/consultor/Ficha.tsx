import Link from 'next/link';
import { accountStatus, type AppUser } from '@/lib/app-users';
import { SITE_URL } from '@/lib/config';
import { ExcluirConsultora } from '@/components/consultoras/ExcluirConsultora';
import { TrocarFoto } from '@/components/consultoras/TrocarFoto';
import { LimparLink } from '@/components/admin/LimparLink';
import { CadastrosConsultora, type CadastroLinha } from '@/components/consultoras/CadastrosConsultora';
import { FunilTabela } from '@/components/consultoras/Funil';
import type { IaStatus } from '@/lib/consultoras-ia';
import { situacaoTxt, type MesFunil, type Consultora, type FamiliaAtribuida } from '@/lib/consultoras';
import { PCT_DIRETO, prazoPix, dataBr, nomeMes } from '@/lib/consultoras-regras';
import { Avatar, Card, Chave, Kpi, Selo, SeloEstado, botao, brl, campo } from '@/components/consultoras/ui';
import {
  alternarLista,
  decidirBio,
  decidirFoto,
  ligarConta,
  pausarConsultora,
  reativarConsultora,
  subirFotoDono,
  trocarIndicadaPor,
} from './actions';

const pctTxt = (p: number) => `${String(p).replace('.', ',')}%`;
const dataDubai = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('pt-BR', { timeZone: 'Asia/Dubai' }) : '—');

/** Uma linha da ficha: rótulo à esquerda, valor à direita. */
function Linha({ rotulo, ajuda, children }: { rotulo: string; ajuda?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 border-b border-[#F5F2FA] py-3 text-[13px] last:border-0">
      <div className="min-w-[130px]">
        <p className="font-bold text-[#9A95AD]">{rotulo}</p>
        {ajuda && <p className="max-w-[260px] text-[11px] leading-snug text-ninho-cinza">{ajuda}</p>}
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2 text-right font-semibold text-ninho-grafite">{children}</div>
    </div>
  );
}

/**
 * Ficha da consultora (aba Consultoras, ?id=). Ocupa a área da tela no lugar da
 * lista: cabeçalho, números, "Cadastro e conta" ao lado do "Perfil público",
 * depois o link e as famílias. Desenho: ideia B de
 * docs/design/consultoras-admin/ideias.html (página só dela).
 */
export function Detalhe({
  c,
  fechar,
  porId,
  consultoras,
  familias,
  vinculos,
  assinam,
  comissaoTotalMes,
  pedidosVinculo,
  funil,
  funilIndisponivel,
  linkTotais,
  ia,
  comissaoMes,
  mesAtual,
  usuarios,
}: {
  c: Consultora;
  fechar: string;
  porId: Map<string, Consultora>;
  consultoras: Consultora[];
  familias: FamiliaAtribuida[];
  vinculos: number;
  assinam: number;
  comissaoTotalMes: number;
  pedidosVinculo: { origem: 'familia' | 'consultora'; criado_em: string }[];
  funil: MesFunil[];
  funilIndisponivel: boolean;
  linkTotais: { cliques: number; downloads: number } | null;
  ia: IaStatus | null;
  comissaoMes: (familiaId: string) => number;
  mesAtual: string;
  usuarios: Map<string, AppUser>;
}) {
  const filhas = consultoras.filter((x) => x.indicada_por === c.id);
  const opcoes = consultoras.filter((x) => x.id !== c.id && x.estado === 'ativa' && x.indicada_por !== c.id);
  const atual = c.indicada_por ? porId.get(c.indicada_por) : null;
  const link = `${SITE_URL.replace(/^https?:\/\//, '')}/indica/${(c.codigo ?? '').toLowerCase()}`;
  const cliques6m = funil.reduce((s, m) => s + m.cliques, 0);
  const unicos6m = funil.reduce((s, m) => s + m.cliquesUnicos, 0);
  const perfilNovo = Boolean(c.bio_pendente || c.foto_pendente_url);
  const local = c.cidade ? `${c.cidade}${c.uf ? ` · ${c.uf}` : ''}` : null;
  const desde = c.ativada_em ? `ativa desde ${dataDubai(c.ativada_em)}` : `liberada em ${dataDubai(c.liberada_em ?? c.criado_em)}`;

  return (
    <>
      <Link href={fechar} className="mb-3 inline-flex items-center gap-1 text-[13px] font-bold text-[#7C5CD6] hover:underline">
        ‹ Todas as consultoras
      </Link>

      <Card>
        <div className="flex flex-wrap items-center gap-4">
          <Avatar id={c.id} nome={c.nome} foto={c.foto_url} tamanho={64} />
          <div className="min-w-[220px] flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-black tracking-tight text-[#24164F]">{c.nome}</h2>
              <SeloEstado estado={c.estado} />
              {perfilNovo && <Selo cor="lilas">perfil novo para aprovar</Selo>}
            </div>
            <p className="mt-0.5 text-[13px] text-ninho-cinza">
              {[c.instagram ? `@${c.instagram.replace(/^@/, '')}` : null, local, desde].filter(Boolean).join(' · ')}
            </p>
            <p className="mt-1 text-[13px] font-semibold text-[#7C5CD6]">{link}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {c.estado === 'pausada' ? (
              <form action={reativarConsultora}>
                <input type="hidden" name="id" value={c.id} />
                <button className={botao.verde}>Reativar</button>
              </form>
            ) : (
              <form action={pausarConsultora}>
                <input type="hidden" name="id" value={c.id} />
                <button className={botao.vermelho}>Pausar</button>
              </form>
            )}
            <ExcluirConsultora id={c.id} nome={c.nome ?? 'consultora'} />
          </div>
        </div>
      </Card>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi rotulo="Famílias ligadas" valor={vinculos} sub={`${familias.length} atribuída${familias.length === 1 ? '' : 's'} a ela`} />
        <Kpi rotulo="Assinam hoje" valor={assinam} sub="das famílias atribuídas" />
        <Kpi rotulo="Cliques no link (6 meses)" valor={funilIndisponivel ? '—' : cliques6m} sub={funilIndisponivel ? 'ainda não contados' : `${unicos6m} únicos`} />
        <Kpi verde rotulo={`Comissão de ${nomeMes(mesAtual)} (R$)`} valor={brl(comissaoTotalMes)} sub={`Pix até ${dataBr(prazoPix(mesAtual))}`} />
      </div>

      <div className="mt-4 grid items-start gap-4 lg:grid-cols-2">
        <div id="conta" className="scroll-mt-20">
        <Card titulo="Cadastro e conta">
          <Linha rotulo="E-mail liberado">{c.email_liberado}</Linha>
          <Linha rotulo="Conta do app">
            {c.profile_id ? (
              'ligada'
            ) : (
              <form action={ligarConta} className="flex flex-wrap justify-end gap-2">
                <input type="hidden" name="id" value={c.id} />
                <input name="conta" placeholder="e-mail da conta ou id" className={`${campo} h-8 w-56 text-xs`} />
                <button className={botao.suave}>Ligar</button>
              </form>
            )}
          </Linha>
          <Linha rotulo="Indicada por" ajuda="só muda as famílias atribuídas daqui para frente">
            <form action={trocarIndicadaPor} className="flex items-center justify-end gap-2">
              <input type="hidden" name="id" value={c.id} />
              <select name="indicada_por" defaultValue={c.indicada_por ?? ''} className={`${campo} h-8 w-40 text-xs`}>
                <option value="">Ninguém ({pctTxt(PCT_DIRETO)})</option>
                {atual && !opcoes.some((o) => o.id === atual.id) && <option value={atual.id}>{atual.nome}</option>}
                {opcoes.map((o) => <option key={o.id} value={o.id}>{o.nome}</option>)}
              </select>
              <button className={botao.cinza}>Salvar</button>
            </form>
          </Linha>
          <Linha rotulo="Ela indicou">{filhas.map((x) => x.nome).join(', ') || 'ninguém ainda'}</Linha>
          <Linha rotulo="Na lista do app" ajuda="aparece em Encontrar consultora (até 10; quem mais traz assinantes vem primeiro)">
            <form action={alternarLista}>
              <input type="hidden" name="id" value={c.id} />
              <Chave ligada={c.na_lista && c.estado !== 'pausada'} desabilitada={c.estado === 'pausada'} />
            </form>
          </Linha>
          <Linha rotulo="Pedidos de vínculo">
            {pedidosVinculo.length === 0
              ? 'nenhum esperando'
              : `${pedidosVinculo.filter((p) => p.origem === 'familia').length} de famílias · ${pedidosVinculo.filter((p) => p.origem === 'consultora').length} convites dela`}
          </Linha>
          <Linha rotulo="Termo aceito">{c.termo_aceito_em ? `${dataDubai(c.termo_aceito_em)} (${c.termo_versao})` : 'ainda não'}</Linha>
          <Linha rotulo="Pix e CPF">
            {c.pix_chave && c.cpf ? 'cadastrados' : <Selo cor="ambar">{!c.pix_chave && !c.cpf ? 'faltam Pix e CPF' : !c.pix_chave ? 'falta Pix' : 'falta CPF'}</Selo>}
          </Linha>
          <Linha rotulo="Relatório IA">
            <span>
              {!ia
                ? 'indisponível'
                : ia.assinante
                  ? `assina${ia.assinaturaAte ? ` até ${dataBr(ia.assinaturaAte)}` : ''} · ${ia.usadosMes} de ${ia.limiteMes} no mês`
                  : ia.gratisUsado
                    ? 'sem assinatura · grátis já usado'
                    : 'sem assinatura · 1 grátis disponível'}
              {ia && ia.custoMes !== null && (
                <small className="block text-[11px] font-normal text-ninho-cinza">
                  custo de IA no mês: {ia.custoMoeda ?? 'USD'} {ia.custoMes.toFixed(2).replace('.', ',')}
                </small>
              )}
            </span>
          </Linha>
        </Card>
        </div>

        <div id="perfil" className="scroll-mt-20">
        <Card titulo="Perfil público" direita="como as famílias veem no app">
          <div className="rounded-[20px] bg-[#F8F6FC] p-4">
            <div className="flex items-center gap-3">
              <Avatar id={c.id} nome={c.nome} foto={c.foto_url} tamanho={52} />
              <div>
                <b className="text-base">{c.nome}</b>
                <p className="text-[12.5px] text-ninho-cinza">Consultora independente · {local ?? 'cidade a preencher'}</p>
                <p className="text-xs text-ninho-cinza">
                  {[c.atende_online && 'Online', c.atende_presencial && 'Presencial'].filter(Boolean).join(' e ')}
                  {c.idades ? ` · ${c.idades}` : ''}
                </p>
              </div>
            </div>
            <p className={`mt-3 text-[13.5px] leading-relaxed ${c.bio ? '' : 'text-[#9A95AD]'}`}>{c.bio || 'Ela ainda não escreveu o texto do perfil.'}</p>
          </div>
          {c.bio_pendente && (
            <form action={decidirBio} className="mt-3 rounded-2xl bg-[#F3EEFC] p-3 text-[13px]">
              <input type="hidden" name="id" value={c.id} />
              <input type="hidden" name="aba" value="consultoras" />
              <p className="text-[11px] font-extrabold uppercase tracking-[0.07em] text-[#7C5CD6]">Texto novo para aprovar</p>
              <p className="mt-1 text-[#4B3A8C]">&ldquo;{c.bio_pendente}&rdquo;</p>
              <div className="mt-2 flex justify-end gap-2">
                <button name="decisao" value="recusar" className={botao.cinza}>Recusar</button>
                <button name="decisao" value="aprovar" className={botao.verde}>Aprovar texto</button>
              </div>
            </form>
          )}
          {c.foto_pendente_url && (
            <form action={decidirFoto} className="mt-3 flex flex-wrap items-center gap-3 rounded-2xl bg-[#F3EEFC] p-3 text-[13px]">
              <input type="hidden" name="id" value={c.id} />
              <input type="hidden" name="aba" value="consultoras" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={c.foto_pendente_url} alt="Foto nova" width={56} height={56} className="h-14 w-14 rounded-full object-cover" />
              <p className="flex-1 font-bold text-[#4B3A8C]">Foto nova para aprovar</p>
              <button name="decisao" value="recusar" className={botao.cinza}>Recusar</button>
              <button name="decisao" value="aprovar" className={botao.verde}>Aprovar foto</button>
            </form>
          )}
          <div className="mt-3">
            <TrocarFoto acao={subirFotoDono} id={c.id} />
          </div>
          <p className="mt-3 text-[11px] leading-snug text-[#9A95AD]">
            Aviso que as famílias veem: consultora independente; as orientações são de responsabilidade dela e não substituem o pediatra. Ela pode
            receber comissão do Ninho se a família assinar pelo link dela.
          </p>
        </Card>
        </div>
      </div>

      <Card className="mt-4" titulo="Link e funil" direita={link}>
        <FunilTabela meses={funil} indisponivel={funilIndisponivel} titulo="Do clique à assinatura" />
        <div className="mt-3 flex flex-wrap justify-end gap-2">
          <LimparLink tipo="consultora" id={c.id} nome={c.nome ?? 'consultora'} cliques={linkTotais?.cliques ?? null} downloads={linkTotais?.downloads ?? null} />
        </div>
      </Card>

      <Card className="mt-4" titulo={`Famílias atribuídas a ela (${familias.length})`} direita="as que geram comissão">
        <div className="overflow-x-auto">
          <CadastrosConsultora
            mes={nomeMes(mesAtual)}
            linhas={familias.map((f): CadastroLinha => {
              const u = usuarios.get(f.id);
              const como: Record<string, string> = {
                link: 'Link',
                codigo_cadastro: 'Código no cadastro',
                manual: 'Manual (dono)',
                vinculo: 'Vínculo',
                dupla_parceiro: 'Também de parceiro',
              };
              return {
                id: f.id,
                nome: u?.name?.trim() || (u?.email ?? 'Sem nome'),
                comoChegou: como[f.metodo] ?? f.metodo,
                atribuidaEm: f.atribuidaEm,
                atribuidaEmTxt: dataDubai(f.atribuidaEm),
                plano: f.plano,
                pagaHoje: f.pagaHoje,
                comissaoMes: comissaoMes(f.id),
                motivoSemValor: comissaoMes(f.id)
                  ? null
                  : !f.gera
                    ? 'não gera comissão (atribuição)'
                    : f.situacao === 'ativa'
                      ? 'parcelas já pagas ou fora do mês'
                      : situacaoTxt(f.situacao, f.situacaoDesde),
                status: u ? accountStatus(u) : '—',
                email: u?.email ?? '',
              };
            })}
          />
        </div>
      </Card>
    </>
  );
}
