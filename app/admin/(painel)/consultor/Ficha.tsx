import Link from 'next/link';
import { accountStatus, type AppUser } from '@/lib/app-users';
import { SITE_URL } from '@/lib/config';
import { telefoneLegivel } from '@/lib/telefone';
import { consultoriaLiberada } from '@/lib/link-consultora';
import { ExcluirConsultora } from '@/components/consultoras/ExcluirConsultora';
import { TrocarFoto } from '@/components/consultoras/TrocarFoto';
import { LimparLink } from '@/components/admin/LimparLink';
import { CopyLink } from '@/components/admin/CopyLink';
import { AbasFicha } from '@/components/consultoras/AbasFicha';
import { CadastrosConsultora, type CadastroLinha } from '@/components/consultoras/CadastrosConsultora';
import { FunilTabela } from '@/components/consultoras/Funil';
import type { IaStatus } from '@/lib/consultoras-ia';
import { situacaoTxt, type MesFunil, type Consultora, type FamiliaAtribuida } from '@/lib/consultoras';
import { PCT_DIRETO, PCT_REDE, prazoPix, dataBr, nomeMes } from '@/lib/consultoras-regras';
import { Avatar, Aviso, Card, Chave, Kpi, Selo, SeloEstado, botao, brl, campo, td, th } from '@/components/consultoras/ui';
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
const primeiro = (nome: string | null | undefined) => (nome ?? '').trim().split(/\s+/)[0] || '';

/** Uma família vinculada à consultora (rotina compartilhada), para a aba Famílias. */
export interface VinculadaLinha {
  id: string;
  bebe: string;
  meses: number | null;
  mae: string | null;
  email: string | null;
  ligadaEm: string;
  plano: string | null;
  planoCor: 'verde' | 'lilas' | 'cinza';
  gera: boolean;
}

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

function IconeZap({ cor = 'currentColor' }: { cor?: string }) {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke={cor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 12a9 9 0 0 1-13.5 7.8L3 21l1.2-4.4A9 9 0 1 1 21 12z" />
    </svg>
  );
}

const chip = 'inline-flex items-center gap-1.5 rounded-pill bg-[#F7F5FB] px-3 py-1.5 text-[12.5px] font-bold text-ninho-grafite';
const botaoZap = 'inline-flex h-9 items-center justify-center gap-1.5 rounded-pill bg-[#25A35A] px-4 text-[13px] font-bold text-white hover:bg-[#1F8F4E]';
const botaoZapPeq = 'inline-flex h-8 items-center justify-center gap-1.5 rounded-pill bg-[#25A35A] px-3 text-[12.5px] font-bold text-white hover:bg-[#1F8F4E]';

/**
 * Ficha da consultora (aba Consultoras, ?id=). Em cima, sempre: quem é, o
 * WhatsApp com botão para chamar, o estado e pausar/excluir. Embaixo, cada
 * assunto numa aba (dono, 14/11/2026): Cadastro, Perfil público, Famílias
 * vinculadas, Comissão e Links. Desenho: docs/design/consultoras-admin/ficha-abas.html.
 */
export function Detalhe({
  c,
  fechar,
  parte,
  porId,
  consultoras,
  familias,
  vinculadas,
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
  parte?: string;
  porId: Map<string, Consultora>;
  consultoras: Consultora[];
  familias: FamiliaAtribuida[];
  vinculadas: VinculadaLinha[];
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
  const codigo = (c.codigo ?? '').toLowerCase();
  const site = SITE_URL.replace(/\/$/, '');
  const linkConsultoria = `${site}/consultoria/${codigo}`;
  const linkDivulgacao = `${site}/indica/${codigo}`;
  const comConsultoria = consultoriaLiberada(c.email_liberado);
  const cliques6m = funil.reduce((s, m) => s + m.cliques, 0);
  const unicos6m = funil.reduce((s, m) => s + m.cliquesUnicos, 0);
  const perfilNovo = Boolean(c.bio_pendente || c.foto_pendente_url);
  const local = c.cidade ? `${c.cidade}${c.uf ? ` · ${c.uf}` : ''}` : null;
  const desde = c.ativada_em ? `ativa desde ${dataDubai(c.ativada_em)}` : `liberada em ${dataDubai(c.liberada_em ?? c.criado_em)}`;
  const insta = c.instagram ? c.instagram.replace(/^@/, '') : null;
  const zapNum = (c.whatsapp ?? '').replace(/\D/g, '');
  const zapUrl = zapNum ? `https://wa.me/${zapNum}?text=${encodeURIComponent(`Oi, ${primeiro(c.nome) || 'tudo bem'}! `)}` : null;
  const faltaPix = !c.pix_chave || !c.cpf;
  const pedFam = pedidosVinculo.filter((p) => p.origem === 'familia').length;
  const pedDela = pedidosVinculo.filter((p) => p.origem === 'consultora').length;
  const assinamVinc = vinculadas.filter((v) => v.planoCor === 'verde').length;
  const testeVinc = vinculadas.filter((v) => v.planoCor === 'lilas').length;
  const geram = familias.filter((f) => f.gera).length;
  const pct = c.indicada_por ? PCT_REDE : PCT_DIRETO;

  // ── Cadastro ─────────────────────────────────────────────
  const cadastro = (
    <Card titulo="Cadastro e contato" direita="só você vê">
      <Linha rotulo="WhatsApp">
        {zapUrl ? (
          <>
            {telefoneLegivel(c.whatsapp)}
            <a href={zapUrl} target="_blank" rel="noreferrer" className={botaoZapPeq}>
              <IconeZap /> Chamar
            </a>
          </>
        ) : (
          <span className="text-ninho-cinza">não informado</span>
        )}
      </Linha>
      <Linha rotulo="Instagram">
        {insta ? (
          <>
            @{insta}
            <a href={`https://instagram.com/${insta}`} target="_blank" rel="noreferrer" className={botao.suave}>
              Abrir
            </a>
          </>
        ) : (
          <span className="text-ninho-cinza">não informado</span>
        )}
      </Linha>
      <Linha rotulo="E-mail liberado" ajuda="a conta do app com este e-mail (confirmado) vira consultora">
        {c.email_liberado}
      </Linha>
      <Linha rotulo="Conta do app">
        {c.profile_id ? (
          <Selo cor="verde">ligada</Selo>
        ) : (
          <form action={ligarConta} className="flex flex-wrap justify-end gap-2">
            <input type="hidden" name="id" value={c.id} />
            <input name="conta" placeholder="e-mail da conta ou id" className={`${campo} h-8 w-56 text-xs`} />
            <button className={botao.suave}>Ligar</button>
          </form>
        )}
      </Linha>
      <Linha rotulo="Código">{c.codigo ?? '—'}</Linha>
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
      <Linha rotulo="Termo aceito">{c.termo_aceito_em ? `${dataDubai(c.termo_aceito_em)} (${c.termo_versao})` : 'ainda não'}</Linha>
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
  );

  // ── Perfil público ───────────────────────────────────────
  const perfil = (
    <Card titulo="Perfil público" direita="como as famílias veem no app">
      <div className="max-w-xl rounded-[20px] bg-[#F8F6FC] p-4">
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
        <form action={decidirBio} className="mt-3 max-w-xl rounded-2xl bg-[#F3EEFC] p-3 text-[13px]">
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
        <form action={decidirFoto} className="mt-3 flex max-w-xl flex-wrap items-center gap-3 rounded-2xl bg-[#F3EEFC] p-3 text-[13px]">
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
      <p className="mt-3 max-w-xl text-[11px] leading-snug text-[#9A95AD]">
        Aviso que as famílias veem: consultora independente; as orientações são de responsabilidade dela e não substituem o pediatra. Ela pode
        receber comissão do Ninho se a família assinar pelo link dela.
      </p>
    </Card>
  );

  // ── Famílias vinculadas ──────────────────────────────────
  const familiasVinc = (
    <>
      <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi rotulo="Vinculadas" valor={vinculadas.length} sub="rotina aberta para ela" />
        <Kpi rotulo="Assinam hoje" valor={assinamVinc} sub="das vinculadas" />
        <Kpi rotulo="Em teste grátis" valor={testeVinc} sub="podem virar assinatura" />
        <Kpi rotulo="Pedidos esperando" valor={pedidosVinculo.length} sub={pedidosVinculo.length ? `${pedFam} de famílias · ${pedDela} convites dela` : 'nenhum agora'} />
      </div>
      <Card titulo={`Famílias vinculadas (${vinculadas.length})`} direita="mãe e bebê · quem compartilha a rotina com ela">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className={th}>Mãe</th>
                <th className={th}>Bebê</th>
                <th className={th}>Ligada em</th>
                <th className={th}>Plano da família</th>
                <th className={th}>Comissão</th>
              </tr>
            </thead>
            <tbody>
              {vinculadas.map((v) => (
                <tr key={v.id}>
                  <td className={td}>
                    <div className="flex items-center gap-2.5">
                      <Avatar id={v.id} nome={v.mae ?? v.email ?? '?'} tamanho={32} />
                      <div>
                        <b className="text-[#24164F]">{v.mae || 'Sem nome'}</b>
                        {v.email && <p className="text-[11.5px] text-ninho-cinza">{v.email}</p>}
                      </div>
                    </div>
                  </td>
                  <td className={td}>
                    <b className="text-[#24164F]">{v.bebe}</b>
                    {v.meses !== null && v.meses >= 0 && (
                      <p className="text-[11.5px] text-ninho-cinza">{v.meses} {v.meses === 1 ? 'mês' : 'meses'}</p>
                    )}
                  </td>
                  <td className={td}>{dataDubai(v.ligadaEm)}</td>
                  <td className={td}>{v.plano ? <Selo cor={v.planoCor}>{v.plano}</Selo> : '—'}</td>
                  <td className={td}>{v.gera ? <Selo cor="verde">gera</Selo> : <Selo cor="cinza">não gera</Selo>}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {vinculadas.length === 0 && <p className="py-4 text-center text-sm text-ninho-cinza">Nenhuma família vinculada ainda.</p>}
        </div>
        <Aviso>
          Vinculada é a família que aceitou compartilhar a rotina com ela. Comissão é outra coisa: só nasce quando a família cria a conta
          pelo link ou pelo código dela (veja a aba Comissão).
        </Aviso>
      </Card>
    </>
  );

  // ── Comissão ─────────────────────────────────────────────
  const comissao = (
    <>
      <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi verde rotulo={`Comissão de ${nomeMes(mesAtual)} (R$)`} valor={brl(comissaoTotalMes)} sub={`Pix até ${dataBr(prazoPix(mesAtual))}`} />
        <Kpi rotulo="Famílias que geram" valor={geram} sub={`${familias.length} atribuída${familias.length === 1 ? '' : 's'} a ela`} />
        <Kpi rotulo="Assinam hoje" valor={assinam} sub="das famílias atribuídas" />
        <Kpi rotulo="Percentual" valor={pctTxt(pct)} sub={c.indicada_por ? `por 6 meses · indicada por ${atual?.nome ?? 'outra'}` : 'por 6 meses · não foi indicada'} />
      </div>
      <Card titulo="Pagamento" direita={<Link href="/admin/consultor?aba=dinheiro" className="font-bold text-[#7C5CD6] hover:underline">Ver e marcar pagamentos ›</Link>}>
        <Linha rotulo="Chave Pix">{c.pix_chave ? 'cadastrada' : <Selo cor="ambar">falta</Selo>}</Linha>
        <Linha rotulo="CPF">{c.cpf ? 'cadastrado' : <Selo cor="ambar">falta</Selo>}</Linha>
        {faltaPix && <p className="pt-2 text-[12px] text-ninho-cinza">Ela cadastra no painel dela, em Ganhos.</p>}
      </Card>
      <Card className="mt-4" titulo={`Famílias que geram comissão (${familias.length})`} direita="criaram a conta pelo link ou pelo código dela">
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
        <Aviso>
          Comissão só nasce no cadastro: a família criou a conta pelo link ou pelo código dela (ou você atribuiu). O vínculo sozinho não gera,
          e a comissão para quando a família cancela ou pede reembolso.
        </Aviso>
      </Card>
    </>
  );

  // ── Links ────────────────────────────────────────────────
  const links = (
    <>
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <Card titulo="Convidar clientes" direita={comConsultoria ? 'link principal' : 'ainda não liberado'}>
          <p className="mb-3 text-[12.5px] leading-relaxed text-ninho-cinza">
            Para quem ela já atende. A família abre a página com a foto e o nome dela e, depois de cadastrar o bebê, o app pergunta se quer
            compartilhar a rotina com ela.
          </p>
          <CopyLink url={linkConsultoria} />
          {!comConsultoria && (
            <p className="mt-2 text-[11.5px] text-[#B7791F]">
              A pergunta de vínculo depende da versão nova do app. Até liberar, este link funciona igual ao de divulgação e não aparece no painel dela.
            </p>
          )}
        </Card>
        <Card titulo="Divulgação no Instagram" direita="bio e stories">
          <p className="mb-3 text-[12.5px] leading-relaxed text-ninho-cinza">
            Para quem ainda não é cliente dela. Leva direto para a loja e conta a comissão se a pessoa assinar, mas não liga a família a ela.
          </p>
          <CopyLink url={linkDivulgacao} />
        </Card>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Kpi rotulo="Cliques nos links (6 meses)" valor={funilIndisponivel ? '—' : cliques6m} sub={funilIndisponivel ? 'ainda não contados' : `${unicos6m} únicos · os dois links somados`} />
        <Kpi rotulo="Downloads pelo link" valor={linkTotais ? linkTotais.downloads : '—'} sub="desde o começo" />
      </div>
      <Card className="mt-4" titulo="Do clique à assinatura" direita="os dois links somados">
        <FunilTabela meses={funil} indisponivel={funilIndisponivel} titulo="Mês a mês" />
        <div className="mt-3 flex flex-wrap justify-end gap-2">
          <LimparLink tipo="consultora" id={c.id} nome={c.nome ?? 'consultora'} cliques={linkTotais?.cliques ?? null} downloads={linkTotais?.downloads ?? null} />
        </div>
      </Card>
    </>
  );

  return (
    <>
      <Link href={fechar} className="mb-3 inline-flex items-center gap-1 text-[13px] font-bold text-[#7C5CD6] hover:underline">
        ‹ Todas as consultoras
      </Link>

      <Card>
        <div className="flex flex-wrap items-center gap-4">
          <Avatar id={c.id} nome={c.nome} foto={c.foto_url} tamanho={64} />
          <div className="min-w-[240px] flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-black tracking-tight text-[#24164F]">{c.nome}</h2>
              <SeloEstado estado={c.estado} />
              {perfilNovo && <Selo cor="lilas">perfil novo para aprovar</Selo>}
            </div>
            <p className="mt-0.5 text-[13px] text-ninho-cinza">
              {['Consultora independente', local, desde, c.codigo ? `código ${c.codigo}` : null].filter(Boolean).join(' · ')}
            </p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {c.whatsapp && (
                <span className={chip}>
                  <IconeZap cor="#25A35A" />
                  {telefoneLegivel(c.whatsapp)}
                </span>
              )}
              {insta && <span className={chip}>@{insta}</span>}
              <span className={chip}>{c.email_liberado}</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 self-start">
            {zapUrl && (
              <a href={zapUrl} target="_blank" rel="noreferrer" className={botaoZap}>
                <IconeZap /> Chamar no WhatsApp
              </a>
            )}
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

      <AbasFicha
        inicial={parte}
        partes={[
          { chave: 'cadastro', rotulo: 'Cadastro', alerta: !c.profile_id, conteudo: cadastro },
          { chave: 'perfil', rotulo: 'Perfil público', alerta: perfilNovo, conteudo: perfil },
          { chave: 'familias', rotulo: 'Famílias vinculadas', conta: vinculadas.length, alerta: pedidosVinculo.length > 0, conteudo: familiasVinc },
          { chave: 'comissao', rotulo: 'Comissão', alerta: faltaPix && comissaoTotalMes > 0, conteudo: comissao },
          { chave: 'links', rotulo: 'Links', conteudo: links },
        ]}
      />
    </>
  );
}
