import Link from 'next/link';
import { requireRole } from '@/lib/auth/guard';
import { fetchAppUsersTodos as fetchAppUsers, accountStatus } from '@/lib/app-users';
import { liquido } from '@/lib/precos';
import { mesNoPainel } from '@/lib/dashboard-charts';
import { SITE_URL } from '@/lib/config';
import { telefoneLegivel } from '@/lib/telefone';
import { ExcluirConsultora } from '@/components/consultoras/ExcluirConsultora';
import { LimparRastreio } from '@/components/admin/LimparRastreio';
import { FunilTabela } from '@/components/consultoras/Funil';
import { iaStatus, type IaStatus } from '@/lib/consultoras-ia';
import {
  baseComissoes,
  listPedidos,
  listVinculosAtivos,
  pedidosVinculoPendentes,
  eventosDosLinks,
  funilDaConsultora,
  ultimosMesesFunil,
  type MesFunil,
  bebesPorId,
  cuidadoresDe,
  totalDe,
  pagamentoDe,
  type Consultora,
  type FamiliaAtribuida,
} from '@/lib/consultoras';
import { PCT_DIRETO, PCT_REDE, PARCELAS_MENSAL, prazoPix, dataBr, nomeCompetencia, nomeMes, somar } from '@/lib/consultoras-regras';
import { idadeMeses } from '@/lib/consultoras-rotina';
import {
  Abas,
  Avatar,
  Aviso,
  Card,
  Chave,
  Kpi,
  Retorno,
  Selo,
  SeloEstado,
  botao,
  brl,
  campo,
  rotuloCampo,
  td,
  th,
} from '@/components/consultoras/ui';
import {
  alternarLista,
  decidirBio,
  decidirFoto,
  decidirPedido,
  liberarConsultora,
  ligarConta,
  marcarPago,
  pausarConsultora,
  reativarConsultora,
  subirFotoDono,
  trocarIndicadaPor,
} from './actions';

export const dynamic = 'force-dynamic';

const BASE = '/admin/consultor';
const ABAS: [string, string][] = [
  ['geral', 'Visão geral'],
  ['consultoras', 'Consultoras'],
  ['pedidos', 'Pedidos'],
  ['familias', 'Famílias ligadas'],
  ['comissoes', 'Comissões'],
  ['receita', 'Receita'],
];

const pctTxt = (p: number) => `${String(p).replace('.', ',')}%`;
const dataDubai = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('pt-BR', { timeZone: 'Asia/Dubai' }) : '—';
const primeiro = (n: string | null) => (n || 'Consultora').split(' ')[0];

/** Receita bruta (R$, preço cheio) das famílias atribuídas num mês: cobranças depois da atribuição. */
function brutoDoMes(familias: FamiliaAtribuida[], mes: string, consultoraId?: string): number {
  return somar(
    familias
      .filter((f) => f.gera && (!consultoraId || f.consultoraId === consultoraId))
      .flatMap((f) => f.cobrancas.filter((c) => c.competencia === mes && c.data >= new Date(f.atribuidaEm).toISOString()).map((c) => c.base)),
  );
}

/**
 * Consultoras de sono — área do DONO (role admin). Desenho e comportamento:
 * Ninho-expo/docs/design/consultora/painel.html (visão "Dono do Ninho").
 * O dono não abre a rotina dos bebês por aqui: só contas, planos e dinheiro.
 */
export default async function ConsultorPage({
  searchParams,
}: {
  searchParams: { aba?: string; id?: string; mes?: string; ok?: string; erro?: string };
}) {
  requireRole('admin');
  const aba = ABAS.some(([k]) => k === searchParams.aba) ? searchParams.aba! : 'geral';

  const [base, pedidos, vinculos, users, pedVinc, eventos] = await Promise.all([
    baseComissoes(),
    listPedidos('pendente'),
    listVinculosAtivos(),
    fetchAppUsers(),
    pedidosVinculoPendentes(),
    eventosDosLinks(),
  ]);
  const mesesFunil = ultimosMesesFunil(6);
  const funilDe = (id: string) => funilDaConsultora(id, base.familias, eventos, mesesFunil);
  // Pedidos de vínculo esperando resposta (00109): só contagem e datas, sem ação do dono.
  const pedVincPor = (id: string) => pedVinc.filter((p) => p.consultora_id === id);
  const { consultoras, familias, linhas, pagamentos } = base;
  const porId = new Map(consultoras.map((c) => [c.id, c]));
  const mesAtual = mesNoPainel(new Date());
  const pendPerfil = consultoras.filter((c) => c.bio_pendente || c.foto_pendente_url);

  const vincPor = (id: string) => vinculos.filter((v) => v.consultora_id === id);
  const assinamPor = (id: string) => familias.filter((f) => f.consultoraId === id && f.gera && f.pagaHoje).length;

  let conteudo: React.ReactNode = null;

  if (aba === 'geral') {
    const ativas = consultoras.filter((c) => c.estado === 'ativa');
    const assinantes = familias.filter((f) => f.gera && f.pagaHoje).length;
    const bruto = brutoDoMes(familias, mesAtual);
    const comissao = somar(linhas.filter((l) => l.competencia === mesAtual).map((l) => l.valor));
    const liq = liquido(bruto);
    const raizes = consultoras.filter((c) => !c.indicada_por || !porId.has(c.indicada_por));
    const filhas = (id: string) => consultoras.filter((c) => c.indicada_por === id);
    const No = ({ c, nivel }: { c: Consultora; nivel: number }): React.ReactElement => (
      <>
        <div className="flex items-center gap-2.5 py-2" style={{ marginLeft: nivel * 26, borderLeft: nivel ? '2px solid #E4DCF5' : undefined, paddingLeft: nivel ? 12 : 0 }}>
          <Avatar id={c.id} nome={c.nome} foto={c.foto_url} tamanho={30} />
          <div className="flex-1">
            <b className="text-[13.5px]">{c.nome}</b>
            <p className="text-[11.5px] text-ninho-cinza">
              {c.indicada_por && porId.has(c.indicada_por)
                ? `${pctTxt(PCT_REDE)} das famílias dela + ${pctTxt(PCT_REDE)} para ${primeiro(porId.get(c.indicada_por)!.nome)}`
                : `${pctTxt(PCT_DIRETO)} das famílias dela`}
            </p>
          </div>
          {c.estado !== 'ativa' && <SeloEstado estado={c.estado} />}
        </div>
        {nivel < 6 && filhas(c.id).map((x) => <No key={x.id} c={x} nivel={nivel + 1} />)}
      </>
    );
    conteudo = (
      <>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi rotulo="Consultoras ativas" valor={ativas.length} sub={`${consultoras.filter((c) => c.estado === 'esperando').length} esperando cadastro · ${pedidos.length} pedido${pedidos.length === 1 ? '' : 's'}`} />
          <Kpi rotulo="Famílias ligadas" valor={vinculos.length} sub="vínculos ativos no app" />
          <Kpi rotulo="Assinantes" valor={assinantes} sub={`de ${familias.filter((f) => f.gera).length} famílias que geram comissão`} />
          <Kpi
            verde
            rotulo={`Ninho fica em ${nomeMes(mesAtual)} (R$)`}
            valor={brl(liq - comissao)}
            sub={`${brl(liq)} das lojas − ${brl(comissao)} de comissão`}
          />
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <Card titulo="Consultoras" direita="clique para abrir">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr><th className={th}>Consultora</th><th className={th}>Famílias</th><th className={th}>Assinam</th><th className={`${th} text-right`}>Comissão {nomeMes(mesAtual)} (R$)</th></tr>
                </thead>
                <tbody>
                  {consultoras.filter((c) => c.estado !== 'esperando').map((c) => (
                    <tr key={c.id} className="hover:bg-[#FAF8FE]">
                      <td className={td}>
                        <Link href={`${BASE}?aba=consultoras&id=${c.id}`} className="flex items-center gap-2.5">
                          <Avatar id={c.id} nome={c.nome} foto={c.foto_url} tamanho={32} />
                          <span><b>{c.nome}</b><small className="block text-[11.5px] text-ninho-cinza">{c.indicada_por && porId.has(c.indicada_por) ? `indicada por ${primeiro(porId.get(c.indicada_por)!.nome)}` : 'veio direto'}</small></span>
                        </Link>
                      </td>
                      <td className={`${td} tabular-nums`}>{vincPor(c.id).length}</td>
                      <td className={`${td} tabular-nums`}>{assinamPor(c.id)}</td>
                      <td className={`${td} text-right font-bold tabular-nums`}>{brl(totalDe(linhas, c.id, mesAtual))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {consultoras.filter((c) => c.estado !== 'esperando').length === 0 && <p className="py-4 text-center text-sm text-ninho-cinza">Nenhuma consultora ativa ainda.</p>}
            </div>
          </Card>
          <Card titulo="Funil do link de cada consultora" direita="últimos 6 meses" className="lg:col-span-2">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr><th className={th}>Consultora</th><th className={`${th} text-right`}>Cliques (únicos)</th><th className={`${th} text-right`}>Downloads</th><th className={`${th} text-right`}>Cadastros</th><th className={`${th} text-right`}>Assinaram</th><th className={`${th} text-right`}>Cancelaram</th></tr>
                </thead>
                <tbody>
                  {consultoras.filter((c) => c.estado !== 'esperando').map((c) => {
                    const f = funilDe(c.id);
                    const soma = (k: 'cliques' | 'cliquesUnicos' | 'downloads' | 'cadastros' | 'assinantes' | 'cancelamentos') => f.reduce((s2, m) => s2 + m[k], 0);
                    return (
                      <tr key={c.id}>
                        <td className={td}><Link href={`${BASE}?aba=consultoras&id=${c.id}`} className="font-bold">{c.nome}</Link></td>
                        <td className={`${td} text-right tabular-nums`}>{eventos ? `${soma('cliques')} (${soma('cliquesUnicos')})` : '—'}</td>
                        <td className={`${td} text-right tabular-nums`}>{eventos ? soma('downloads') : '—'}</td>
                        <td className={`${td} text-right tabular-nums`}>{soma('cadastros')}</td>
                        <td className={`${td} text-right tabular-nums`}>{soma('assinantes')}</td>
                        <td className={`${td} text-right tabular-nums`}>{soma('cancelamentos')}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {!eventos && <p className="mt-2 text-[11.5px] text-ninho-cinza">Cliques e downloads do link /c/ ainda não estão sendo contados (falta aplicar a migration 00112).</p>}
            </div>
          </Card>
          <Card titulo="Rede de indicação">
            {raizes.length ? raizes.map((c) => <No key={c.id} c={c} nivel={0} />) : <p className="py-4 text-center text-sm text-ninho-cinza">Ninguém liberado ainda.</p>}
            <Aviso>Sobe um nível só: quem indicou ganha nas famílias da indicada, mas não nas famílias de quem a indicada indicou.</Aviso>
          </Card>
        </div>
      </>
    );
  }

  if (aba === 'consultoras') {
    const det = searchParams.id ? porId.get(searchParams.id) ?? null : null;
    // Assinatura do Relatório IA de cada consultora (00115 do Vitor; sem ela, "—").
    const ia = new Map(
      await Promise.all(consultoras.filter((c) => c.estado !== 'esperando').map(async (c) => [c.id, await iaStatus(c.id)] as const)),
    );
    const iaTxt = (st: IaStatus | null | undefined) =>
      !st ? '—' : st.assinante ? `assina${st.assinaturaAte ? ` até ${dataBr(st.assinaturaAte)}` : ''} · ${st.usadosMes}/${st.limiteMes} no mês` : st.gratisUsado ? 'grátis usado' : '1 grátis livre';
    const ativasOpc = consultoras.filter((c) => c.estado === 'ativa');
    conteudo = (
      <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
        <div>
          <Card titulo="Liberar consultora">
            <form action={liberarConsultora}>
              <label className={rotuloCampo}>E-mail que ela vai usar no app</label>
              <input name="email" type="email" required placeholder="nome@gmail.com" className={campo} />
              <label className={rotuloCampo}>Nome</label>
              <input name="nome" required minLength={2} maxLength={80} placeholder="Nome e sobrenome" className={campo} />
              <label className={rotuloCampo}>Instagram</label>
              <input name="instagram" placeholder="@" className={campo} />
              <label className={rotuloCampo}>Código do link</label>
              <input name="codigo" maxLength={20} placeholder="Sai do nome se ficar vazio" className={`${campo} uppercase`} />
              <p className="mt-1 text-[11.5px] text-ninho-cinza">Link das famílias: {SITE_URL.replace(/^https?:\/\//, '')}/c/codigo</p>
              <label className={rotuloCampo}>Indicada por</label>
              <select name="indicada_por" className={campo} defaultValue="">
                <option value="">Ninguém (veio direto) · {pctTxt(PCT_DIRETO)}</option>
                {ativasOpc.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
              <p className="mt-1 text-[11.5px] text-ninho-cinza">Se outra consultora a trouxe, as famílias dela dão {pctTxt(PCT_REDE)} para cada uma.</p>
              <button type="submit" className={`${botao.grad} mt-4 w-full`}>Liberar e-mail</button>
              <p className="mt-2 text-[11.5px] leading-snug text-ninho-cinza">Ela vira consultora quando abrir o app com esse e-mail confirmado. O painel não manda e-mail: avise ela por fora.</p>
            </form>
          </Card>
        </div>
        <div>
          <Card titulo="Todas as consultoras" direita="clique no nome para abrir">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr><th className={th}>Consultora</th><th className={th}>Indicada por</th><th className={th}>Famílias</th><th className={th}>Assinam</th><th className={`${th} text-right`}>{nomeMes(mesAtual)} (R$)</th><th className={th}>Pedidos de vínculo</th><th className={th}>Relatório IA</th><th className={th}>Na lista</th><th className={th}>Estado</th></tr></thead>
                <tbody>
                  {consultoras.map((c) => (
                    <tr key={c.id} className={det?.id === c.id ? 'bg-[#F3EEFC]' : 'hover:bg-[#FAF8FE]'}>
                      <td className={td}>
                        <Link href={`${BASE}?aba=consultoras&id=${c.id}`} className="flex items-center gap-2.5">
                          <Avatar id={c.id} nome={c.nome} foto={c.foto_url} tamanho={32} />
                          <span><b>{c.nome}</b><small className="block text-[11.5px] text-ninho-cinza">{c.email_liberado} · {c.codigo}</small></span>
                        </Link>
                      </td>
                      <td className={td}>{c.indicada_por && porId.has(c.indicada_por) ? primeiro(porId.get(c.indicada_por)!.nome) : '—'}</td>
                      <td className={`${td} tabular-nums`}>{vincPor(c.id).length}</td>
                      <td className={`${td} tabular-nums`}>{assinamPor(c.id)}</td>
                      <td className={`${td} text-right tabular-nums`}>{brl(totalDe(linhas, c.id, mesAtual))}</td>
                      <td className={`${td} tabular-nums`}>
                        {pedVincPor(c.id).length ? (
                          <>{pedVincPor(c.id).length}<small className="block text-[11px] text-ninho-cinza">desde {dataDubai(pedVincPor(c.id)[pedVincPor(c.id).length - 1].criado_em)}</small></>
                        ) : '—'}
                      </td>
                      <td className={`${td} text-[12px]`}>{iaTxt(ia.get(c.id))}</td>
                      <td className={td}>
                        <form action={alternarLista}><input type="hidden" name="id" value={c.id} /><Chave ligada={c.na_lista && c.estado !== 'pausada'} desabilitada={c.estado === 'pausada'} /></form>
                      </td>
                      <td className={td}><SeloEstado estado={c.estado} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {consultoras.length === 0 && <p className="py-4 text-center text-sm text-ninho-cinza">Nenhuma consultora ainda. Libere a primeira ao lado.</p>}
            </div>
          </Card>
          {det && (
            <Detalhe
              c={det}
              porId={porId}
              consultoras={consultoras}
              familias={familias.filter((f) => f.consultoraId === det.id)}
              vinculos={vincPor(det.id).length}
              pedidosVinculo={pedVincPor(det.id)}
              funil={funilDe(det.id)}
              funilIndisponivel={!eventos}
              ia={ia.get(det.id) ?? null}
              comissaoMes={(babyFam: string) => somar(linhas.filter((l) => l.consultoraId === det.id && l.familiaId === babyFam && l.competencia === mesAtual).map((l) => l.valor))}
              mesAtual={mesAtual}
            />
          )}
        </div>
      </div>
    );
  }

  if (aba === 'pedidos') {
    conteudo = (
      <Card titulo="Pedidos para ser consultora" direita="Nada é liberado sem o seu OK">
        {pedidos.length === 0 && pendPerfil.length === 0 && <p className="py-4 text-center text-sm text-ninho-cinza">Nenhum pedido agora.</p>}
        {pedidos.map((p) => (
          <div key={p.id} className="mt-2.5 flex flex-wrap items-center gap-3 rounded-2xl bg-[#FFF8EC] px-4 py-3">
            <Avatar id={p.id} nome={p.nome} tamanho={38} />
            <div className="min-w-[220px] flex-1 text-[13px] leading-snug">
              <b className="text-[#24164F]">{p.nome}</b>
              {p.instagram ? ` · @${p.instagram.replace(/^@/, '')}` : ''} · {p.email}
              {p.whatsapp ? ` · ${telefoneLegivel(p.whatsapp)}` : ''}
              <br />
              {p.indicada_por && porId.has(p.indicada_por) ? (
                <>indicada por <b>{porId.get(p.indicada_por)!.nome}</b></>
              ) : p.origem === 'site' ? (
                <b>veio pelo site</b>
              ) : (
                <b>veio pelo app</b>
              )}{' '}
              · {dataDubai(p.criado_em)}
              {p.aceite_versao ? ` · aceites ${p.aceite_versao}` : ''}
              {p.como_soube && <><br />Como soube: <b>{p.como_soube}</b></>}
              {p.comentario && <><br /><span className="text-ninho-cinza">&ldquo;{p.comentario}&rdquo;</span></>}
            </div>
            <form action={decidirPedido} className="flex gap-2">
              <input type="hidden" name="id" value={p.id} />
              <button name="decisao" value="recusar" className={botao.cinza}>Recusar</button>
              <button name="decisao" value="aprovar" className={botao.verde}>Aprovar</button>
            </form>
          </div>
        ))}
        {pendPerfil.map((c) => (
          <div key={c.id} className="mt-2.5 rounded-2xl bg-[#F3EEFC] px-4 py-3 text-[13px]">
            <div className="flex items-center gap-3">
              <Avatar id={c.id} nome={c.nome} foto={c.foto_url} tamanho={38} />
              <b className="flex-1">{c.nome} mudou o perfil público</b>
            </div>
            {c.bio_pendente && (
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <p className="min-w-[220px] flex-1 text-ninho-cinza">Texto novo: &ldquo;{c.bio_pendente}&rdquo;</p>
                <form action={decidirBio} className="flex gap-2">
                  <input type="hidden" name="id" value={c.id} />
                  <input type="hidden" name="aba" value="pedidos" />
                  <button name="decisao" value="recusar" className={botao.cinza}>Recusar</button>
                  <button name="decisao" value="aprovar" className={botao.verde}>Aprovar texto</button>
                </form>
              </div>
            )}
            {c.foto_pendente_url && (
              <div className="mt-2 flex flex-wrap items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.foto_pendente_url} alt="Foto nova" width={72} height={72} className="h-[72px] w-[72px] rounded-full object-cover" />
                <p className="flex-1 text-ninho-cinza">Foto nova</p>
                <form action={decidirFoto} className="flex gap-2">
                  <input type="hidden" name="id" value={c.id} />
                  <input type="hidden" name="aba" value="pedidos" />
                  <button name="decisao" value="recusar" className={botao.cinza}>Recusar</button>
                  <button name="decisao" value="aprovar" className={botao.verde}>Aprovar foto</button>
                </form>
              </div>
            )}
          </div>
        ))}
        <Aviso>
          Ao aprovar, o e-mail fica liberado como &ldquo;esperando cadastro&rdquo; e a consultora que indicou fica gravada: as
          famílias da nova dão {pctTxt(PCT_REDE)} para cada uma. Antes de aprovar texto: sem promessa de resultado, sem
          remédio ou melatonina, sem posição de sono e sem título que ela não comprove.
        </Aviso>
      </Card>
    );
  }

  if (aba === 'familias') {
    const babyIds = vinculos.map((v) => v.baby_id);
    const [bebes, cuid] = await Promise.all([bebesPorId(babyIds), cuidadoresDe(babyIds)]);
    const userPor = new Map(users.map((u) => [u.id, u]));
    const hoje = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
    const rows = vinculos
      .map((v) => {
        const b = bebes.get(v.baby_id);
        const dono = cuid.find((c) => c.baby_id === v.baby_id && c.role === 'owner');
        const u = dono ? userPor.get(dono.profile_id) : undefined;
        const fam = familias.find((f) => f.babyId === v.baby_id && f.consultoraId === v.consultora_id);
        return { v, b, u, fam, mae: u?.name ?? null };
      })
      .sort((a, z) => z.v.aceito_em.localeCompare(a.v.aceito_em));
    conteudo = (
      <Card titulo="Famílias ligadas a consultoras" direita="plano e datas · a rotina fica com a família e a consultora dela">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr><th className={th}>Bebê</th><th className={th}>Consultora</th><th className={th}>Plano da família</th><th className={th}>Ligada em</th><th className={th}>Comissão</th><th className={th}>Assinou em</th></tr></thead>
            <tbody>
              {rows.map(({ v, b, u, fam, mae }) => {
                const meses = idadeMeses(b?.birth_date ?? null, hoje);
                const st = u ? accountStatus(u) : null;
                return (
                  <tr key={v.id}>
                    <td className={td}><b>{b?.name ?? 'Bebê'}</b> <small className="text-[11.5px] text-ninho-cinza">{meses !== null && meses >= 0 ? `${meses} ${meses === 1 ? 'mês' : 'meses'}` : ''}{mae ? ` · ${primeiro(mae)}` : ''}</small></td>
                    <td className={td}>{porId.get(v.consultora_id)?.nome ?? '—'}</td>
                    <td className={td}>{st ? <Selo cor={u!.estadoEfetivo === 'pagante' ? 'verde' : u!.estadoEfetivo === 'trial_ativo' ? 'lilas' : 'cinza'}>{st}</Selo> : '—'}</td>
                    <td className={td}>{dataDubai(v.aceito_em)}</td>
                    <td className={td}>{fam?.gera ? <Selo cor="verde">gera</Selo> : <Selo cor="cinza">não gera</Selo>}</td>
                    <td className={td}>{dataDubai(fam?.assinouEm ?? null)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {rows.length === 0 && <p className="py-4 text-center text-sm text-ninho-cinza">Nenhuma família ligada ainda.</p>}
        </div>
        <Aviso>
          Comissão só nasce no cadastro: a família criou a conta pelo link ou pelo código da consultora (ou o dono
          atribuiu). O vínculo sozinho não gera comissão, e família que achou a consultora pela lista &ldquo;Encontrar
          consultora&rdquo; do app também não. A comissão para quando a família cancela ou pede reembolso.
        </Aviso>
      </Card>
    );
  }

  if (aba === 'comissoes') {
    const meses = Array.from(new Set([mesAtual, ...linhas.map((l) => l.competencia)])).sort().reverse().slice(0, 12);
    const m = searchParams.mes && /^\d{4}-\d{2}$/.test(searchParams.mes) ? searchParams.mes : meses[0];
    const doMes = linhas.filter((l) => l.competencia === m);
    const quem = consultoras.filter((c) => totalDe(linhas, c.id, m) > 0);
    conteudo = (
      <>
        <div className="mb-4 flex flex-wrap gap-1.5">
          {meses.map((mm) => (
            <Link key={mm} href={`${BASE}?aba=comissoes&mes=${mm}`} className={`rounded-pill px-3 py-1.5 text-xs font-bold ${mm === m ? 'bg-[#24164F] text-white' : 'bg-white text-ninho-cinza shadow-[inset_0_0_0_1.5px_#ECE6F5]'}`}>
              {nomeCompetencia(mm)}
            </Link>
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
          <Card titulo={`Comissão de ${nomeMes(m)}`} direita={`Pix até ${dataBr(prazoPix(m))}`}>
            <table className="w-full">
              <tbody>
                {quem.map((c) => {
                  const pg = pagamentoDe(pagamentos, c.id, m);
                  return (
                    <tr key={c.id}>
                      <td className={td}><span className="flex items-center gap-2"><Avatar id={c.id} nome={c.nome} foto={c.foto_url} tamanho={28} /><b>{c.nome}</b></span><small className="text-[11px] text-ninho-cinza">Pix: {c.pix_chave ? 'cadastrado' : 'falta cadastrar'}</small></td>
                      <td className={`${td} text-right font-bold tabular-nums`}>{brl(totalDe(linhas, c.id, m))}</td>
                      <td className={td}>
                        {pg ? (
                          <Selo cor="verde">Pago em {dataDubai(pg.pago_em)} ({brl(pg.valor)})</Selo>
                        ) : (
                          <form action={marcarPago}>
                            <input type="hidden" name="id" value={c.id} />
                            <input type="hidden" name="competencia" value={m} />
                            <button className={botao.suave}>Marcar como pago</button>
                          </form>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {quem.length === 0 && <p className="py-4 text-center text-sm text-ninho-cinza">Sem comissão neste mês.</p>}
            <Aviso>Pix todo mês, até o 5º dia útil do mês seguinte (feriado nacional não conta). A comissão de {nomeMes(m)} vence em {dataBr(prazoPix(m))}.</Aviso>
          </Card>
          <Card titulo={`Extrato de ${nomeMes(m)}`}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr><th className={th}>Consultora</th><th className={th}>Família</th><th className={th}>Plano</th><th className={th}>Parcela</th><th className={th}>Regra</th><th className={`${th} text-right`}>Base (R$)</th><th className={`${th} text-right`}>Comissão (R$)</th></tr></thead>
                <tbody>
                  {doMes.map((l, i) => (
                    <tr key={i}>
                      <td className={td}>{porId.get(l.consultoraId)?.nome ?? '—'}</td>
                      <td className={td}><b>{l.bebe}</b>{l.viaId && <small className="block text-[11px] text-ninho-cinza">família da {primeiro(porId.get(l.viaId)?.nome ?? null)}</small>}</td>
                      <td className={td}>{l.plano}</td>
                      <td className={td}>{l.parcela}</td>
                      <td className={td}>{pctTxt(l.pct)}{l.viaId ? ' (indicação)' : ''}</td>
                      <td className={`${td} text-right tabular-nums`}>{brl(l.base)}</td>
                      <td className={`${td} text-right font-bold tabular-nums`}>{brl(l.valor)}</td>
                    </tr>
                  ))}
                </tbody>
                {doMes.length > 0 && (
                  <tfoot><tr><td className={`${td} font-extrabold`} colSpan={6}>Total</td><td className={`${td} text-right font-extrabold tabular-nums`}>{brl(somar(doMes.map((l) => l.valor)))}</td></tr></tfoot>
                )}
              </table>
              {doMes.length === 0 && <p className="py-4 text-center text-sm text-ninho-cinza">Sem comissão neste mês.</p>}
            </div>
          </Card>
        </div>
      </>
    );
  }

  if (aba === 'receita') {
    const meses = Array.from(new Set([mesAtual, ...familias.flatMap((f) => f.cobrancas.map((c) => c.competencia))])).sort().reverse().slice(0, 6).reverse();
    const rs = meses.map((m) => {
      const bruto = brutoDoMes(familias, m);
      const com = somar(linhas.filter((l) => l.competencia === m).map((l) => l.valor));
      return { m, bruto, liq: liquido(bruto), com, fica: liquido(bruto) - com };
    });
    const atual = rs[rs.length - 1];
    const mx = Math.max(...rs.map((r) => r.liq), 1);
    const porCons = consultoras
      .filter((c) => c.estado !== 'esperando')
      .map((c) => ({ c, liq: liquido(brutoDoMes(familias, mesAtual, c.id)) }));
    const mx2 = Math.max(...porCons.map((x) => x.liq), 1);
    conteudo = (
      <>
        <div className="grid gap-4 sm:grid-cols-3">
          <Kpi rotulo={`Famílias pagaram (${nomeMes(mesAtual)}, R$)`} valor={brl(atual.bruto)} sub="preço cheio" />
          <Kpi rotulo={`Lojas repassam (${nomeMes(mesAtual)}, R$)`} valor={brl(atual.liq)} sub="menos 15% da Apple ou do Google" />
          <Kpi verde rotulo={`Fica com o Ninho (${nomeMes(mesAtual)}, R$)`} valor={brl(atual.fica)} sub={`depois de ${brl(atual.com)} de comissão`} />
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <Card titulo="Mês a mês (R$, depois da loja)">
            <div className="mt-3 flex flex-col gap-3">
              {rs.map((r) => (
                <div key={r.m} className="flex items-center gap-3 text-[13px]">
                  <span className="w-24 font-bold">{nomeMes(r.m)}</span>
                  <div className="flex h-[22px] flex-1 overflow-hidden rounded-lg bg-[#F4F0FC]">
                    <i style={{ width: `${(Math.max(r.fica, 0) / mx) * 100}%`, background: '#4CAF74' }} />
                    <i style={{ width: `${(r.com / mx) * 100}%`, background: '#B9A6EC' }} />
                  </div>
                  <span className="w-24 text-right font-extrabold tabular-nums">{brl(r.liq)}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex gap-4 text-[11.5px] font-semibold text-ninho-cinza">
              <span><i className="mr-1.5 inline-block h-2.5 w-2.5 rounded-sm bg-[#4CAF74]" />Fica com o Ninho</span>
              <span><i className="mr-1.5 inline-block h-2.5 w-2.5 rounded-sm bg-[#B9A6EC]" />Comissão</span>
            </div>
          </Card>
          <Card titulo={`Por consultora (${nomeMes(mesAtual)}, R$ depois da loja)`}>
            <div className="mt-3 flex flex-col gap-3">
              {porCons.map((x) => (
                <div key={x.c.id} className="flex items-center gap-3 text-[13px]">
                  <span className="w-24 truncate font-bold">{primeiro(x.c.nome)}</span>
                  <div className="h-[22px] flex-1 overflow-hidden rounded-lg bg-[#F4F0FC]">
                    <i className="block h-full" style={{ width: `${(x.liq / mx2) * 100}%`, background: '#9F86E0' }} />
                  </div>
                  <span className="w-24 text-right font-extrabold tabular-nums">{brl(x.liq)}</span>
                </div>
              ))}
              {porCons.length === 0 && <p className="py-4 text-center text-sm text-ninho-cinza">Nenhuma consultora ativa ainda.</p>}
            </div>
          </Card>
        </div>
        <Aviso>
          Conta só as cobranças das famílias atribuídas a uma consultora, depois da atribuição (mesmas cobranças do
          Faturamento). A comissão é de {pctTxt(PCT_DIRETO)} ({pctTxt(PCT_REDE)} + {pctTxt(PCT_REDE)} na indicação) por {PARCELAS_MENSAL} meses no mensal ou 1x no anual.
        </Aviso>
      </>
    );
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[#24164F]">Consultoras de sono</h1>
          <p className="mt-1 text-sm text-ninho-cinza">
            Só quem o dono libera entra no app como consultora. Você não abre a rotina dos bebês por aqui: só contas,
            planos e dinheiro.
          </p>
        </div>
        <span className="rounded-pill bg-[#E7F5EC] px-3 py-1 text-[11.5px] font-extrabold text-[#2F8A55]">Mesmos dados do app</span>
      </div>
      <Abas base={BASE} atual={aba} abas={ABAS.map(([k, t]) => [k, k === 'pedidos' && pedidos.length + pendPerfil.length ? `${t} (${pedidos.length + pendPerfil.length})` : t])} />
      <Retorno ok={searchParams.ok} erro={searchParams.erro} />
      {familias.some((f) => f.dupla) && (
        <Aviso tom="ambar">
          <b>Atribuição dupla:</b> {familias.filter((f) => f.dupla).length} conta(s) estão com um parceiro E com uma
          consultora. Vale só o registro mais antigo:{' '}
          {familias
            .filter((f) => f.dupla)
            .map((f) => `${f.bebe} (${porId.get(f.consultoraId)?.nome ?? 'consultora'}: ${f.dupla === 'vale_consultora' ? 'conta para ela' : 'conta para o parceiro'})`)
            .join('; ')}
          .
        </Aviso>
      )}
      {conteudo}
    </>
  );
}

function Detalhe({
  c,
  porId,
  consultoras,
  familias,
  vinculos,
  pedidosVinculo,
  funil,
  funilIndisponivel,
  ia,
  comissaoMes,
  mesAtual,
}: {
  c: Consultora;
  porId: Map<string, Consultora>;
  consultoras: Consultora[];
  familias: FamiliaAtribuida[];
  vinculos: number;
  pedidosVinculo: { origem: 'familia' | 'consultora'; criado_em: string }[];
  funil: MesFunil[];
  funilIndisponivel: boolean;
  ia: IaStatus | null;
  comissaoMes: (familiaId: string) => number;
  mesAtual: string;
}) {
  const filhas = consultoras.filter((x) => x.indicada_por === c.id);
  const opcoes = consultoras.filter((x) => x.id !== c.id && x.estado === 'ativa' && x.indicada_por !== c.id);
  const atual = c.indicada_por ? porId.get(c.indicada_por) : null;
  return (
    <Card className="mt-4">
      <div className="flex items-center gap-3">
        <Avatar id={c.id} nome={c.nome} foto={c.foto_url} tamanho={46} />
        <div className="flex-1">
          <b className="text-[17px]">{c.nome}</b>
          <p className="text-[12.5px] text-ninho-cinza">
            {c.instagram ? `@${c.instagram} · ` : ''}liberada em {dataDubai(c.liberada_em ?? c.criado_em)}
            {c.ativada_em ? ` · ativa desde ${dataDubai(c.ativada_em)}` : ''}
          </p>
        </div>
        <SeloEstado estado={c.estado} />
        <Link href={`${BASE}?aba=consultoras`} className={botao.cinza} aria-label="Fechar">✕</Link>
      </div>

      <dl className="mt-4 grid grid-cols-[130px_1fr] gap-x-3 gap-y-2 text-[13px]">
        <dt className="font-bold text-[#9A95AD]">E-mail liberado</dt><dd className="font-semibold">{c.email_liberado}</dd>
        <dt className="font-bold text-[#9A95AD]">Conta do app</dt>
        <dd>
          {c.profile_id ? (
            <span className="font-semibold">ligada</span>
          ) : (
            <form action={ligarConta} className="flex flex-wrap gap-2">
              <input type="hidden" name="id" value={c.id} />
              <input name="conta" placeholder="e-mail da conta (ex.: …@privaterelay.appleid.com) ou id" className={`${campo} h-8 max-w-[320px] text-xs`} />
              <button className={botao.suave}>Ligar a uma conta existente</button>
            </form>
          )}
        </dd>
        <dt className="font-bold text-[#9A95AD]">Link</dt><dd className="font-semibold">{SITE_URL.replace(/^https?:\/\//, '')}/c/{(c.codigo ?? '').toLowerCase()}</dd>
        <dt className="font-bold text-[#9A95AD]">Indicada por</dt>
        <dd>
          <form action={trocarIndicadaPor} className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="id" value={c.id} />
            <select name="indicada_por" defaultValue={c.indicada_por ?? ''} className={`${campo} h-8 max-w-[240px] text-xs`}>
              <option value="">Ninguém ({pctTxt(PCT_DIRETO)})</option>
              {atual && !opcoes.some((o) => o.id === atual.id) && <option value={atual.id}>{atual.nome}</option>}
              {opcoes.map((o) => <option key={o.id} value={o.id}>{o.nome}</option>)}
            </select>
            <button className={botao.cinza}>Salvar</button>
            <small className="text-[11px] text-ninho-cinza">só muda famílias atribuídas daqui para frente</small>
          </form>
        </dd>
        <dt className="font-bold text-[#9A95AD]">Pedidos de vínculo</dt>
        <dd className="font-semibold">
          {pedidosVinculo.length === 0
            ? 'nenhum esperando'
            : `${pedidosVinculo.filter((p) => p.origem === 'familia').length} de famílias esperando ela · ${pedidosVinculo.filter((p) => p.origem === 'consultora').length} convites dela esperando a família · ${pedidosVinculo.map((p) => dataDubai(p.criado_em)).join(', ')}`}
        </dd>
        <dt className="font-bold text-[#9A95AD]">Ela indicou</dt><dd className="font-semibold">{filhas.map((x) => x.nome).join(', ') || 'ninguém ainda'}</dd>
        <dt className="font-bold text-[#9A95AD]">Termo aceito</dt><dd className="font-semibold">{c.termo_aceito_em ? `em ${dataDubai(c.termo_aceito_em)} (${c.termo_versao})` : 'ainda não'}</dd>
        <dt className="font-bold text-[#9A95AD]">Pix e CPF</dt><dd className="font-semibold">{c.pix_chave && c.cpf ? 'cadastrados' : 'faltam'}</dd>
        <dt className="font-bold text-[#9A95AD]">Na lista do app</dt>
        <dd className="flex items-center gap-2">
          <form action={alternarLista}><input type="hidden" name="id" value={c.id} /><Chave ligada={c.na_lista && c.estado !== 'pausada'} desabilitada={c.estado === 'pausada'} /></form>
          <small className="text-[11.5px] text-ninho-cinza">aprovada para a lista: aparece no app assim que ela ativar a conta (até 10; quem mais traz assinantes vem primeiro)</small>
        </dd>
      </dl>

      <div className="mt-4 rounded-[20px] bg-[#F8F6FC] p-4">
        <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.09em] text-[#9A95AD]">
          Perfil público · como as famílias veem
          {c.bio_pendente && <span className="ml-2"><Selo cor="lilas">texto novo para aprovar</Selo></span>}
          {c.foto_pendente_url && <span className="ml-2"><Selo cor="lilas">foto nova para aprovar</Selo></span>}
        </p>
        <div className="flex items-center gap-3">
          <Avatar id={c.id} nome={c.nome} foto={c.foto_url} tamanho={48} />
          <div>
            <b className="text-base">{c.nome}</b>
            <p className="text-[12.5px] text-ninho-cinza">Consultora independente · {c.cidade ? `${c.cidade}${c.uf ? ` · ${c.uf}` : ''}` : 'cidade a preencher'}</p>
            <p className="text-xs text-ninho-cinza">{[c.atende_online && 'Online', c.atende_presencial && 'Presencial'].filter(Boolean).join(' e ')}{c.idades ? ` · ${c.idades}` : ''}</p>
          </div>
        </div>
        <p className={`mt-2 text-[13.5px] leading-relaxed ${c.bio ? '' : 'text-[#9A95AD]'}`}>{c.bio || 'Sem texto ainda.'}</p>
        {c.bio_pendente && (
          <form action={decidirBio} className="mt-2 flex flex-wrap items-center gap-2 rounded-xl bg-white p-2 text-[13px]">
            <input type="hidden" name="id" value={c.id} /><input type="hidden" name="aba" value="consultoras" />
            <span className="flex-1">Novo: &ldquo;{c.bio_pendente}&rdquo;</span>
            <button name="decisao" value="recusar" className={botao.cinza}>Recusar</button>
            <button name="decisao" value="aprovar" className={botao.verde}>Aprovar texto</button>
          </form>
        )}
        {c.foto_pendente_url && (
          <form action={decidirFoto} className="mt-2 flex flex-wrap items-center gap-2 rounded-xl bg-white p-2 text-[13px]">
            <input type="hidden" name="id" value={c.id} /><input type="hidden" name="aba" value="consultoras" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={c.foto_pendente_url} alt="Foto nova" width={56} height={56} className="h-14 w-14 rounded-full object-cover" />
            <span className="flex-1">Foto nova</span>
            <button name="decisao" value="recusar" className={botao.cinza}>Recusar</button>
            <button name="decisao" value="aprovar" className={botao.verde}>Aprovar foto</button>
          </form>
        )}
        <form action={subirFotoDono} className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <input type="hidden" name="id" value={c.id} />
          <input type="file" name="foto" accept="image/jpeg,image/png,image/webp" className="text-xs" />
          <button className={botao.suave}>Trocar foto</button>
          <span className="text-ninho-cinza">JPG, PNG ou WebP até 2 MB</span>
        </form>
        <p className="mt-2 text-[11px] leading-snug text-[#9A95AD]">
          Consultora independente. As orientações são de responsabilidade dela e não substituem o pediatra. Ela pode
          receber comissão do Ninho se a família assinar pelo link dela.
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {c.estado === 'pausada' ? (
          <form action={reativarConsultora}><input type="hidden" name="id" value={c.id} /><button className={botao.verde}>Reativar</button></form>
        ) : (
          <form action={pausarConsultora}><input type="hidden" name="id" value={c.id} /><button className={botao.vermelho}>Pausar</button></form>
        )}
        {c.codigo ? <LimparRastreio tipo="consultora" id={c.id} codigo={c.codigo} /> : null}
        <ExcluirConsultora id={c.id} nome={c.nome ?? 'consultora'} />
      </div>

      <div className="mt-4 rounded-[20px] bg-[#F8F6FC] p-4">
        <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.09em] text-[#9A95AD]">Relatório IA</p>
        {!ia ? (
          <p className="text-[13px] text-ninho-cinza">Situação indisponível (o Relatório IA ainda não foi liberado no banco).</p>
        ) : (
          <div className="grid gap-2 text-[13px] sm:grid-cols-3">
            <p><span className="block text-[11.5px] font-bold text-[#9A95AD]">Assinatura</span><b>{ia.assinante ? `ativa${ia.assinaturaAte ? ` até ${dataBr(ia.assinaturaAte)}` : ''}` : 'sem assinatura'}</b>{!ia.assinante && <span className="block text-[11.5px] text-ninho-cinza">{ia.gratisUsado ? 'grátis já usado' : '1 grátis disponível'}</span>}</p>
            <p><span className="block text-[11.5px] font-bold text-[#9A95AD]">Relatórios no mês</span><b className="tabular-nums">{ia.usadosMes} de {ia.assinante ? ia.limiteMes : 1}</b></p>
            <p><span className="block text-[11.5px] font-bold text-[#9A95AD]">Custo de IA no mês</span><b className="tabular-nums">{ia.custoMes !== null ? `${ia.custoMoeda ?? 'USD'} ${ia.custoMes.toFixed(2).replace('.', ',')}` : '—'}</b></p>
          </div>
        )}
      </div>
      <div className="mt-4">
        <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[0.09em] text-[#9A95AD]">Funil do link {SITE_URL.replace(/^https?:\/\//, '')}/c/{(c.codigo ?? '').toLowerCase()}</p>
        <FunilTabela meses={funil} indisponivel={funilIndisponivel} />
      </div>
      <div className="mt-4 overflow-x-auto">
        <p className="text-[12px] text-ninho-cinza">{vinculos} família{vinculos === 1 ? '' : 's'} ligada{vinculos === 1 ? '' : 's'} agora · abaixo, as famílias atribuídas a ela (as que geram comissão)</p>
        <table className="mt-2 w-full">
          <thead><tr><th className={th}>Família</th><th className={th}>Plano</th><th className={th}>Atribuída em</th><th className={`${th} text-right`}>Comissão {nomeMes(mesAtual)} (R$)</th></tr></thead>
          <tbody>
            {familias.map((f) => {
              const v = comissaoMes(f.id);
              return (
                <tr key={f.id}>
                  <td className={td}><b>{f.bebe}</b></td>
                  <td className={td}><Selo cor={f.pagaHoje ? 'verde' : 'cinza'}>{f.plano}</Selo></td>
                  <td className={td}>{dataDubai(f.atribuidaEm)}</td>
                  <td className={`${td} text-right tabular-nums`}>{v ? brl(v) : '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {familias.length === 0 && <p className="py-4 text-center text-sm text-ninho-cinza">Nenhuma família atribuída ainda.</p>}
      </div>
    </Card>
  );
}
