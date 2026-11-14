import Link from 'next/link';
import { requireRole } from '@/lib/auth/guard';
import { fetchAppUsersTodos as fetchAppUsers, accountStatus } from '@/lib/app-users';
import { liquido } from '@/lib/precos';
import { mesNoPainel } from '@/lib/dashboard-charts';
import { SITE_URL } from '@/lib/config';
import { telefoneLegivel } from '@/lib/telefone';
import { NovaConsultora } from '@/components/consultoras/NovaConsultora';
import { Detalhe, type VinculadaLinha } from './Ficha';
import { iaStatus } from '@/lib/consultoras-ia';
import {
  baseComissoes,
  listPedidos,
  listVinculosAtivos,
  pedidosVinculoPendentes,
  eventosDosLinks,
  funilDaConsultora,
  ultimosMesesFunil,
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
  td,
  th,
} from '@/components/consultoras/ui';
import {
  alternarLista,
  decidirBio,
  decidirFoto,
  decidirPedido,
  liberarConsultora,
  marcarPago,
  marcarSugestaoDono,
} from './actions';
import { todasSugestoes, type StatusSugestao } from '@/lib/consultoras-sugestoes';

export const dynamic = 'force-dynamic';

const BASE = '/admin/consultor';
const ABAS: [string, string][] = [
  ['geral', 'Visão geral'],
  ['consultoras', 'Consultoras'],
  ['pedidos', 'Pedidos'],
  ['familias', 'Famílias ligadas'],
  ['dinheiro', 'Dinheiro'],
  ['sugestoes', 'Sugestões'],
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
  searchParams: { aba?: string; id?: string; mes?: string; ok?: string; erro?: string; estado?: string; q?: string; parte?: string };
}) {
  requireRole('admin');
  // Comissões e Receita viraram a aba Dinheiro (09/11/2026); links antigos continuam valendo.
  const pedida = searchParams.aba === 'comissoes' || searchParams.aba === 'receita' ? 'dinheiro' : searchParams.aba;
  const aba = ABAS.some(([k]) => k === pedida) ? pedida! : 'geral';

  const [base, pedidos, vinculos, users, pedVinc, eventos, sugestoes] = await Promise.all([
    baseComissoes(),
    listPedidos('pendente'),
    listVinculosAtivos(),
    fetchAppUsers(),
    pedidosVinculoPendentes(),
    eventosDosLinks(),
    todasSugestoes(),
  ]);
  const sugNovas = sugestoes.lista.filter((s) => s.status === 'nova').length;
  const mesesFunil = ultimosMesesFunil(6);
  const funilDe = (id: string) => funilDaConsultora(id, base.familias, eventos, mesesFunil);
  // Pedidos de vínculo esperando resposta (00109): só contagem e datas, sem ação do dono.
  const pedVincPor = (id: string) => pedVinc.filter((p) => p.consultora_id === id);
  const { consultoras, familias, linhas, pagamentos } = base;
  const porId = new Map(consultoras.map((c) => [c.id, c]));
  const mesAtual = mesNoPainel(new Date());
  const pendPerfil = consultoras.filter((c) => c.bio_pendente || c.foto_pendente_url);
  const estadoF = ['ativa', 'esperando', 'pausada'].includes(searchParams.estado ?? '') ? searchParams.estado! : '';
  const termo = (searchParams.q ?? '').trim();
  // Ficha aberta na gaveta (só na aba Consultoras).
  const det = aba === 'consultoras' && searchParams.id ? porId.get(searchParams.id) ?? null : null;
  /** URL da lista com o filtro e a busca de agora; fechar a ficha volta para ela. */
  const urlLista = (p: { estado?: string; id?: string }) => {
    const q = new URLSearchParams({ aba: 'consultoras' });
    const e = p.estado ?? estadoF;
    if (e) q.set('estado', e);
    if (termo) q.set('q', termo);
    if (p.id) q.set('id', p.id);
    return `${BASE}?${q.toString()}`;
  };

  const vincPor = (id: string) => vinculos.filter((v) => v.consultora_id === id);
  const assinamPor = (id: string) => familias.filter((f) => f.consultoraId === id && f.gera && f.pagaHoje).length;

  let conteudo: React.ReactNode = null;

  if (aba === 'geral') {
    const ativas = consultoras.filter((c) => c.estado === 'ativa');
    const pausadas = consultoras.filter((c) => c.estado === 'pausada').length;
    const assinantes = familias.filter((f) => f.gera && f.pagaHoje).length;
    const bruto = brutoDoMes(familias, mesAtual);
    const comissao = somar(linhas.filter((l) => l.competencia === mesAtual).map((l) => l.valor));
    const liq = liquido(bruto);
    const hoje = new Date().toISOString().slice(0, 10);
    const diasDesde = (iso: string) => Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000));

    // Comissões de meses já fechados que ainda não foram pagas.
    const aPagar = Array.from(new Set(linhas.map((l) => l.competencia)))
      .filter((m) => m < mesAtual)
      .sort()
      .map((m) => {
        const quem = consultoras.filter((c) => totalDe(linhas, c.id, m) > 0 && !pagamentoDe(pagamentos, c.id, m));
        return { m, quem, total: somar(quem.map((c) => totalDe(linhas, c.id, m))) };
      })
      .filter((x) => x.quem.length > 0);
    const semPix = consultoras.filter((c) => (!c.pix_chave || !c.cpf) && aPagar.some((x) => x.quem.some((q) => q.id === c.id)));
    const esperando = consultoras.filter((c) => c.estado === 'esperando');
    const temSug = !sugestoes.indisponivel && sugNovas > 0;
    const nTarefas = pedidos.length + pendPerfil.length + aPagar.length + semPix.length + esperando.length + (temSug ? 1 : 0);

    const ranking = consultoras
      .filter((c) => c.estado !== 'esperando')
      .map((c) => {
        const f = funilDe(c.id);
        const s = (k: 'cliques' | 'cadastros' | 'assinantes') => f.reduce((a, m) => a + m[k], 0);
        return { c, cliques: s('cliques'), cadastros: s('cadastros'), assinantes: s('assinantes') };
      })
      .sort((a, z) => z.assinantes - a.assinantes || z.cadastros - a.cadastros);
    const mxA = Math.max(...ranking.map((r) => r.assinantes), 1);

    const raizes = consultoras.filter((c) => c.estado !== 'esperando' && (!c.indicada_por || !porId.has(c.indicada_por)));
    const filhas = (id: string) => consultoras.filter((c) => c.indicada_por === id && c.estado !== 'esperando');
    const No = ({ c, nivel }: { c: Consultora; nivel: number }): React.ReactElement => (
      <>
        <div className="flex items-center gap-2.5 py-1.5" style={{ marginLeft: nivel * 24, borderLeft: nivel ? '2px solid #E4DCF5' : undefined, paddingLeft: nivel ? 10 : 0 }}>
          <Avatar id={c.id} nome={c.nome} foto={c.foto_url} tamanho={26} />
          <div className="flex-1 text-[13px]">
            <b>{c.nome}</b>
            <span className="ml-1.5 text-[11.5px] text-ninho-cinza">
              {c.indicada_por && porId.has(c.indicada_por) ? `${pctTxt(PCT_REDE)} + ${pctTxt(PCT_REDE)} para ${primeiro(porId.get(c.indicada_por)!.nome)}` : pctTxt(PCT_DIRETO)}
            </span>
          </div>
          {c.estado !== 'ativa' && <SeloEstado estado={c.estado} />}
        </div>
        {nivel < 6 && filhas(c.id).map((x) => <No key={x.id} c={x} nivel={nivel + 1} />)}
      </>
    );

    conteudo = (
      <>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi rotulo="Consultoras ativas" valor={ativas.length} sub={`${esperando.length} esperando cadastro · ${pausadas} pausada${pausadas === 1 ? '' : 's'}`} />
          <Kpi rotulo="Famílias ligadas" valor={vinculos.length} sub={`${assinantes} assinam hoje`} />
          <Kpi rotulo={`Comissão de ${nomeMes(mesAtual)} (R$)`} valor={brl(comissao)} sub={`Pix até ${dataBr(prazoPix(mesAtual))}`} />
          <Kpi verde rotulo={`Ninho fica em ${nomeMes(mesAtual)} (R$)`} valor={brl(liq - comissao)} sub={`${brl(liq)} das lojas − ${brl(comissao)} de comissão`} />
        </div>
        <div className="mt-4 grid items-start gap-4 lg:grid-cols-[1.25fr_1fr]">
          <Card titulo="Precisa de você" direita={nTarefas ? <Selo cor="vermelho">{nTarefas}</Selo> : undefined}>
            {nTarefas === 0 && <p className="py-6 text-center text-sm text-ninho-cinza">Tudo em dia. Nada esperando por você.</p>}
            {pedidos.map((p) => (
              <Tarefa
                key={p.id}
                icone="pessoa"
                tom="ambar"
                titulo={`${p.nome} quer ser consultora`}
                sub={[
                  p.indicada_por && porId.has(p.indicada_por) ? `indicada por ${primeiro(porId.get(p.indicada_por)!.nome)}` : p.origem === 'site' ? 'veio pelo site' : 'veio pelo app',
                  p.instagram ? `@${p.instagram.replace(/^@/, '')}` : null,
                  dataDubai(p.criado_em),
                ].filter(Boolean).join(' · ')}
              >
                <Link href={`${BASE}?aba=pedidos`} className={botao.cinza}>Ver</Link>
                <form action={decidirPedido} className="flex gap-2">
                  <input type="hidden" name="id" value={p.id} />
                  <button name="decisao" value="recusar" className={botao.cinza}>Recusar</button>
                  <button name="decisao" value="aprovar" className={botao.verde}>Aprovar</button>
                </form>
              </Tarefa>
            ))}
            {pendPerfil.map((c) => (
              <Tarefa
                key={c.id}
                icone="texto"
                tom="lilas"
                titulo={`${c.nome} mudou ${c.bio_pendente && c.foto_pendente_url ? 'o texto e a foto' : c.bio_pendente ? 'o texto' : 'a foto'} do perfil`}
                sub={c.bio_pendente ? `“${c.bio_pendente.length > 90 ? `${c.bio_pendente.slice(0, 90)}…` : c.bio_pendente}”` : 'foto nova esperando aprovação'}
              >
                <Link href={`${BASE}?aba=consultoras&id=${c.id}&parte=perfil`} className={botao.suave}>Ver e aprovar</Link>
              </Tarefa>
            ))}
            {aPagar.map((x) => {
              const atrasado = prazoPix(x.m) < hoje;
              return (
                <Tarefa
                  key={x.m}
                  icone="pix"
                  tom={atrasado ? 'vermelho' : 'verde'}
                  titulo={`Pagar a comissão de ${nomeMes(x.m)}`}
                  sub={`${x.quem.length} consultora${x.quem.length === 1 ? '' : 's'} · ${brl(x.total)} · ${atrasado ? 'venceu' : 'vence'} em ${dataBr(prazoPix(x.m))}`}
                >
                  {atrasado && <Selo cor="vermelho">atrasado</Selo>}
                  <Link href={`${BASE}?aba=dinheiro&mes=${x.m}`} className={botao.suave}>Abrir</Link>
                </Tarefa>
              );
            })}
            {semPix.map((c) => (
              <Tarefa
                key={c.id}
                icone="pix"
                tom="ambar"
                titulo={`${c.nome} tem comissão a receber e falta ${!c.pix_chave && !c.cpf ? 'Pix e CPF' : !c.pix_chave ? 'Pix' : 'CPF'}`}
                sub="ela cadastra no painel dela, em Ganhos"
              >
                <Link href={`${BASE}?aba=consultoras&id=${c.id}&parte=comissao`} className={botao.cinza}>Abrir</Link>
              </Tarefa>
            ))}
            {esperando.map((c) => {
              const d = diasDesde(c.liberada_em ?? c.criado_em);
              return (
                <Tarefa
                  key={c.id}
                  icone="relogio"
                  tom="cinza"
                  titulo={`${c.nome} ainda não entrou no app`}
                  sub={`${c.email_liberado} liberado ${d === 0 ? 'hoje' : `há ${d} dia${d === 1 ? '' : 's'}`} · avise ela por fora`}
                >
                  <Link href={`${BASE}?aba=consultoras&id=${c.id}`} className={botao.cinza}>Abrir</Link>
                </Tarefa>
              );
            })}
            {temSug && (
              <Tarefa icone="ideia" tom="lilas" titulo={`${sugNovas} sugest${sugNovas === 1 ? 'ão nova' : 'ões novas'} das consultoras`} sub="o que elas gostariam de ter no painel">
                <Link href={`${BASE}?aba=sugestoes`} className={botao.suave}>Ler</Link>
              </Tarefa>
            )}
          </Card>
          <div className="grid gap-4">
            <Card titulo="Quem mais trouxe assinantes" direita="últimos 6 meses">
              {ranking.length === 0 && <p className="py-4 text-center text-sm text-ninho-cinza">Nenhuma consultora ativa ainda.</p>}
              <div className="mt-2 flex flex-col gap-3.5">
                {ranking.map((r) => (
                  <Link key={r.c.id} href={`${BASE}?aba=consultoras&id=${r.c.id}`} className="group block">
                    <div className="mb-1 flex items-baseline justify-between gap-2 text-[12px] text-ninho-cinza">
                      <span className="truncate">
                        <b className="text-[13px] text-ninho-grafite group-hover:text-ninho-roxo-escuro">{primeiro(r.c.nome)}</b>
                        {' · '}
                        {eventos ? `${r.cliques} clique${r.cliques === 1 ? '' : 's'} → ` : ''}
                        {r.cadastros} cadastro{r.cadastros === 1 ? '' : 's'}
                      </span>
                      <span className="shrink-0 tabular-nums">
                        <b className="text-[14px] text-ninho-grafite">{r.assinantes}</b> assinante{r.assinantes === 1 ? '' : 's'}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[#EEE8FA]">
                      <i className="block h-full rounded-full bg-[#9F86E0]" style={{ width: `${(r.assinantes / mxA) * 100}%` }} />
                    </div>
                  </Link>
                ))}
              </div>
              {!eventos && <p className="mt-3 text-[11.5px] text-ninho-cinza">Cliques do link /c/ ainda não estão sendo contados (falta aplicar a migration 00112).</p>}
            </Card>
            <Card titulo="Rede de indicação">
              {raizes.length ? raizes.map((c) => <No key={c.id} c={c} nivel={0} />) : <p className="py-4 text-center text-sm text-ninho-cinza">Ninguém liberado ainda.</p>}
              <p className="mt-2 text-[11.5px] leading-snug text-ninho-cinza">
                Sobe um nível só: quem indicou ganha nas famílias da indicada, mas não nas famílias de quem a indicada indicou.
              </p>
            </Card>
          </div>
        </div>
      </>
    );
  }

  if (aba === 'consultoras') {
    const conta = (e: string) => consultoras.filter((c) => c.estado === e).length;
    const q = termo.toLowerCase();
    const lista = consultoras
      .filter((c) => !estadoF || c.estado === estadoF)
      .filter((c) => !q || [c.nome, c.email_liberado, c.codigo, c.instagram].some((v) => (v ?? '').toLowerCase().includes(q)));
    const chips: [string, string, number][] = [
      ['', 'Todas', consultoras.length],
      ['ativa', 'Ativas', conta('ativa')],
      ['esperando', 'Esperando cadastro', conta('esperando')],
      ['pausada', 'Pausadas', conta('pausada')],
    ];
    conteudo = (
      <>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            {chips.map(([k, t, n]) => (
              <Link
                key={k || 'todas'}
                href={urlLista({ estado: k })}
                className={`rounded-pill px-3 py-1.5 text-xs font-bold ${
                  estadoF === k ? 'bg-[#EFE8FC] text-[#7C5CD6]' : 'bg-white text-ninho-cinza shadow-[inset_0_0_0_1.5px_#ECE6F5] hover:text-ninho-roxo-escuro'
                }`}
              >
                {t} <span className="opacity-70">{n}</span>
              </Link>
            ))}
          </div>
          <form action={BASE} className="w-full sm:w-auto">
            <input type="hidden" name="aba" value="consultoras" />
            {estadoF && <input type="hidden" name="estado" value={estadoF} />}
            <input
              name="q"
              defaultValue={termo}
              placeholder="Buscar por nome, e-mail ou código"
              className="h-9 w-full rounded-pill bg-white px-4 text-[13px] font-semibold shadow-[inset_0_0_0_1.5px_#ECE6F5] outline-none focus:shadow-[inset_0_0_0_1.5px_#9F86E0] sm:w-72"
            />
          </form>
        </div>
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className={th}>Consultora</th>
                  <th className={`${th} text-right`}>Famílias</th>
                  <th className={`${th} text-right`}>Assinam</th>
                  <th className={`${th} text-right`}>{nomeMes(mesAtual)} (R$)</th>
                  <th className={th}>Na lista do app</th>
                  <th className={th}>Situação</th>
                  <th className={th} />
                </tr>
              </thead>
              <tbody>
                {lista.map((c) => {
                  const abrir = urlLista({ id: c.id });
                  const nVinc = pedVincPor(c.id).length;
                  const esp = c.estado === 'esperando';
                  const detalhe = esp
                    ? c.email_liberado
                    : [
                        c.instagram ? `@${c.instagram.replace(/^@/, '')}` : null,
                        c.indicada_por && porId.has(c.indicada_por) ? `indicada por ${primeiro(porId.get(c.indicada_por)!.nome)}` : null,
                        c.codigo,
                      ]
                        .filter(Boolean)
                        .join(' · ');
                  return (
                    <tr key={c.id} className={det?.id === c.id ? 'bg-[#F3EEFC]' : 'hover:bg-[#FAF8FE]'}>
                      <td className={td}>
                        <Link href={abrir} className="flex items-center gap-2.5">
                          <Avatar id={c.id} nome={c.nome} foto={c.foto_url} tamanho={34} />
                          <span>
                            <b>{c.nome}</b>
                            <small className="block text-[11.5px] text-ninho-cinza">{detalhe}</small>
                          </span>
                        </Link>
                      </td>
                      <td className={`${td} text-right tabular-nums`}>{esp ? '—' : vincPor(c.id).length}</td>
                      <td className={`${td} text-right tabular-nums`}>{esp ? '—' : assinamPor(c.id)}</td>
                      <td className={`${td} text-right font-bold tabular-nums`}>{esp ? '—' : brl(totalDe(linhas, c.id, mesAtual))}</td>
                      <td className={td}>
                        <form action={alternarLista}>
                          <input type="hidden" name="id" value={c.id} />
                          <input type="hidden" name="lista" value="1" />
                          <Chave ligada={c.na_lista && c.estado !== 'pausada'} desabilitada={c.estado === 'pausada'} />
                        </form>
                      </td>
                      <td className={td}>
                        <span className="flex flex-wrap gap-1">
                          <SeloEstado estado={c.estado} />
                          {(c.bio_pendente || c.foto_pendente_url) && <Selo cor="lilas">perfil novo</Selo>}
                          {c.estado === 'ativa' && (!c.pix_chave || !c.cpf) && <Selo cor="ambar">falta Pix</Selo>}
                          {nVinc > 0 && <Selo cor="cinza">{nVinc} vínculo{nVinc === 1 ? '' : 's'} esperando</Selo>}
                        </span>
                      </td>
                      <td className={`${td} text-right`}>
                        <Link href={abrir} className="px-1 text-lg font-bold text-[#9A95AD] hover:text-ninho-roxo-escuro" aria-label={`Abrir ${c.nome}`}>
                          ›
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {lista.length === 0 && (
              <p className="py-6 text-center text-sm text-ninho-cinza">
                {consultoras.length === 0 ? 'Nenhuma consultora ainda. Use “Nova consultora”, no alto da tela.' : 'Nenhuma consultora com esse filtro.'}
              </p>
            )}
          </div>
        </Card>
        <p className="mt-3 text-xs text-ninho-cinza">Clique numa consultora para abrir a ficha: perfil público, link e funil, famílias, conta e Pix.</p>
      </>
    );
    // Ficha aberta: ocupa a área da tela no lugar da lista (09/11/2026; a
    // gaveta por cima da lista ficou ruim para o dono).
    if (det) {
      // Famílias vinculadas (rotina compartilhada): nome da mãe (dona do bebê) e do bebê.
      const vincDet = vincPor(det.id);
      const idsDet = vincDet.map((v) => v.baby_id);
      const [bebesDet, cuidDet] = await Promise.all([bebesPorId(idsDet), cuidadoresDe(idsDet)]);
      const userPorDet = new Map(users.map((u) => [u.id, u]));
      const hojeDet = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
      const vinculadas: VinculadaLinha[] = vincDet
        .map((v) => {
          const b = bebesDet.get(v.baby_id);
          const dono = cuidDet.find((x) => x.baby_id === v.baby_id && x.role === 'owner');
          const u = dono ? userPorDet.get(dono.profile_id) : undefined;
          const fam = familias.find((f) => f.babyId === v.baby_id && f.consultoraId === v.consultora_id);
          return {
            id: v.id,
            bebe: b?.name ?? 'Bebê',
            meses: idadeMeses(b?.birth_date ?? null, hojeDet),
            mae: u?.name?.trim() || null,
            email: u?.email ?? null,
            ligadaEm: v.aceito_em,
            plano: u ? accountStatus(u) : null,
            planoCor: (u?.estadoEfetivo === 'pagante' ? 'verde' : u?.estadoEfetivo === 'trial_ativo' ? 'lilas' : 'cinza') as VinculadaLinha['planoCor'],
            gera: Boolean(fam?.gera),
          };
        })
        .sort((a, z) => z.ligadaEm.localeCompare(a.ligadaEm));
      conteudo = (
            <Detalhe
              c={det}
              fechar={urlLista({})}
              parte={searchParams.parte}
              porId={porId}
              consultoras={consultoras}
              familias={familias.filter((f) => f.consultoraId === det.id)}
              vinculadas={vinculadas}
              assinam={assinamPor(det.id)}
              comissaoTotalMes={totalDe(linhas, det.id, mesAtual)}
              pedidosVinculo={pedVincPor(det.id)}
              funil={funilDe(det.id)}
              funilIndisponivel={!eventos}
              linkTotais={
                eventos
                  ? {
                      cliques: eventos.cliques.filter((e) => e.consultora_id === det.id).length,
                      downloads: eventos.downloads.filter((e) => e.consultora_id === det.id).length,
                    }
                  : null
              }
              ia={await iaStatus(det.id)}
              usuarios={new Map(users.map((u) => [u.id, u]))}
              comissaoMes={(babyFam: string) =>
                somar(linhas.filter((l) => l.consultoraId === det.id && l.familiaId === babyFam && l.competencia === mesAtual).map((l) => l.valor))
              }
              mesAtual={mesAtual}
            />
      );
    }
  }

  if (aba === 'sugestoes') {
    const rot: Record<StatusSugestao, { t: string; cor: 'lilas' | 'ambar' | 'verde' }> = {
      nova: { t: 'Nova', cor: 'lilas' },
      lida: { t: 'Lida', cor: 'ambar' },
      feita: { t: 'Feita', cor: 'verde' },
    };
    const acao = (id: string, status: StatusSugestao, t: string, cls: string) => (
      <form action={marcarSugestaoDono}>
        <input type="hidden" name="id" value={id} />
        <button name="status" value={status} className={cls}>{t}</button>
      </form>
    );
    conteudo = (
      <Card titulo="Sugestões das consultoras" direita={sugNovas ? `${sugNovas} nova${sugNovas === 1 ? '' : 's'}` : 'o que elas gostariam de ter no painel'}>
        {sugestoes.indisponivel && <Aviso tom="ambar">Falta aplicar a migration 00123 (consultora_sugestoes). Até lá a consultora vê &ldquo;abre em breve&rdquo;.</Aviso>}
        {!sugestoes.indisponivel && sugestoes.lista.length === 0 && <p className="py-4 text-center text-sm text-ninho-cinza">Nenhuma sugestão ainda.</p>}
        {sugestoes.lista.map((s) => {
          const c = porId.get(s.consultora_id);
          return (
            <div key={s.id} className={`mt-2.5 flex flex-wrap items-start gap-3 rounded-2xl px-4 py-3 ${s.status === 'nova' ? 'bg-[#F3EEFC]' : 'bg-[#FAF8FE]'}`}>
              <Avatar id={s.consultora_id} nome={c?.nome ?? 'Consultora'} foto={c?.foto_url} tamanho={38} />
              <div className="min-w-[220px] flex-1 text-[13px] leading-snug">
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`${BASE}?aba=consultoras&id=${s.consultora_id}`} className="font-bold text-[#24164F]">{c?.nome ?? 'Consultora'}</Link>
                  <span className="text-ninho-cinza">· {dataDubai(s.criado_em)}</span>
                  <Selo cor={rot[s.status].cor}>{rot[s.status].t}</Selo>
                </div>
                <p className="mt-1 whitespace-pre-line text-[13.5px] leading-relaxed text-ninho-grafite">{s.texto}</p>
              </div>
              <div className="flex gap-2">
                {s.status === 'nova' && acao(s.id, 'lida', 'Marcar como lida', botao.cinza)}
                {s.status !== 'feita' && acao(s.id, 'feita', 'Virou melhoria', botao.verde)}
                {s.status !== 'nova' && acao(s.id, 'nova', 'Voltar para nova', botao.suave)}
              </div>
            </div>
          );
        })}
        <Aviso>
          A consultora vê o estado de cada sugestão: <b>Lida pelo Ninho</b> quando você marca como lida e <b>Virou melhoria</b> quando
          marca como feita.
        </Aviso>
      </Card>
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

  if (aba === 'dinheiro') {
    // Comissões e Receita viraram uma aba só (09/11/2026).
    const mesesCom = Array.from(new Set([mesAtual, ...linhas.map((l) => l.competencia)])).sort().reverse().slice(0, 12);
    const m = searchParams.mes && /^\d{4}-\d{2}$/.test(searchParams.mes) ? searchParams.mes : mesesCom[0];
    const doMes = linhas.filter((l) => l.competencia === m);
    const quem = consultoras.filter((c) => totalDe(linhas, c.id, m) > 0);

    const mesesRec = Array.from(new Set([mesAtual, ...familias.flatMap((f) => f.cobrancas.map((c) => c.competencia))])).sort().reverse().slice(0, 6).reverse();
    const rs = mesesRec.map((mm) => {
      const bruto = brutoDoMes(familias, mm);
      const com = somar(linhas.filter((l) => l.competencia === mm).map((l) => l.valor));
      return { m: mm, bruto, liq: liquido(bruto), com, fica: liquido(bruto) - com };
    });
    const atual = rs[rs.length - 1];
    const mx = Math.max(...rs.map((r) => r.liq), 1);
    // Por consultora: o número grande é a COMISSÃO dela no mês (o que o Ninho
    // paga a ela). Antes mostrava a receita das famílias dela depois da loja
    // (ex.: R$ 12,90 × 85% = R$ 10,97) e o dono leu como se fosse a comissão.
    const porCons = consultoras
      .filter((c) => c.estado !== 'esperando')
      .map((c) => {
        const liqC = liquido(brutoDoMes(familias, mesAtual, c.id));
        const com = totalDe(linhas, c.id, mesAtual);
        return { c, liq: liqC, com, fica: liqC - com };
      })
      .sort((a, z) => z.com - a.com);
    const mx2 = Math.max(...porCons.map((x) => Math.max(x.liq, x.com)), 1);

    conteudo = (
      <>
        <div className="grid gap-4 sm:grid-cols-3">
          <Kpi rotulo={`Famílias pagaram (${nomeMes(mesAtual)}, R$)`} valor={brl(atual.bruto)} sub="preço cheio" />
          <Kpi rotulo={`Lojas repassam (${nomeMes(mesAtual)}, R$)`} valor={brl(atual.liq)} sub="menos 15% da Apple ou do Google" />
          <Kpi verde rotulo={`Fica com o Ninho (${nomeMes(mesAtual)}, R$)`} valor={brl(atual.fica)} sub={`depois de ${brl(atual.com)} de comissão`} />
        </div>

        <h2 className="mb-2 mt-6 text-[15px] font-extrabold text-ninho-grafite">Comissões</h2>
        <div className="mb-4 flex flex-wrap gap-1.5">
          {mesesCom.map((mm) => (
            <Link
              key={mm}
              href={`${BASE}?aba=dinheiro&mes=${mm}`}
              scroll={false}
              className={`rounded-pill px-3 py-1.5 text-xs font-bold ${mm === m ? 'bg-[#24164F] text-white' : 'bg-white text-ninho-cinza shadow-[inset_0_0_0_1.5px_#ECE6F5]'}`}
            >
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
                      <td className={td}>
                        <span className="flex items-center gap-2">
                          <Avatar id={c.id} nome={c.nome} foto={c.foto_url} tamanho={28} />
                          <b>{c.nome}</b>
                        </span>
                        <small className="text-[11px] text-ninho-cinza">Pix: {c.pix_chave ? 'cadastrado' : 'falta cadastrar'}</small>
                      </td>
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
            <Aviso>
              Pix todo mês, até o 5º dia útil do mês seguinte (feriado nacional não conta). A comissão de {nomeMes(m)} vence em {dataBr(prazoPix(m))}.
            </Aviso>
          </Card>
          <Card titulo={`Extrato de ${nomeMes(m)}`}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className={th}>Consultora</th>
                    <th className={th}>Família</th>
                    <th className={th}>Plano</th>
                    <th className={th}>Parcela</th>
                    <th className={th}>Regra</th>
                    <th className={`${th} text-right`}>Base (R$)</th>
                    <th className={`${th} text-right`}>Comissão (R$)</th>
                  </tr>
                </thead>
                <tbody>
                  {doMes.map((l, i) => (
                    <tr key={i}>
                      <td className={td}>{porId.get(l.consultoraId)?.nome ?? '—'}</td>
                      <td className={td}>
                        <b>{l.bebe}</b>
                        {l.viaId && <small className="block text-[11px] text-ninho-cinza">família da {primeiro(porId.get(l.viaId)?.nome ?? null)}</small>}
                      </td>
                      <td className={td}>{l.plano}</td>
                      <td className={td}>{l.parcela}</td>
                      <td className={td}>{pctTxt(l.pct)}{l.viaId ? ' (indicação)' : ''}</td>
                      <td className={`${td} text-right tabular-nums`}>{brl(l.base)}</td>
                      <td className={`${td} text-right font-bold tabular-nums`}>{brl(l.valor)}</td>
                    </tr>
                  ))}
                </tbody>
                {doMes.length > 0 && (
                  <tfoot>
                    <tr>
                      <td className={`${td} font-extrabold`} colSpan={6}>Total</td>
                      <td className={`${td} text-right font-extrabold tabular-nums`}>{brl(somar(doMes.map((l) => l.valor)))}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
              {doMes.length === 0 && <p className="py-4 text-center text-sm text-ninho-cinza">Sem comissão neste mês.</p>}
            </div>
          </Card>
        </div>

        <h2 className="mb-2 mt-6 text-[15px] font-extrabold text-ninho-grafite">Receita</h2>
        <div className="grid gap-4 lg:grid-cols-2">
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
          <Card titulo={`Comissão por consultora (${nomeMes(mesAtual)})`} direita="o que o Ninho paga a cada uma">
            <div className="mt-3 flex flex-col gap-3.5">
              {porCons.map((x) => (
                <div key={x.c.id} className="flex items-center gap-3 text-[13px]">
                  <span className="w-24 truncate font-bold">{primeiro(x.c.nome)}</span>
                  <div className="flex h-[22px] flex-1 overflow-hidden rounded-lg bg-[#F4F0FC]" title={`Famílias dela renderam ${brl(x.liq)} depois da loja: ${brl(x.com)} de comissão e ${brl(x.fica)} ficam com o Ninho`}>
                    <i style={{ width: `${(x.com / mx2) * 100}%`, background: '#B9A6EC' }} />
                    <i style={{ width: `${(Math.max(x.fica, 0) / mx2) * 100}%`, background: '#4CAF74' }} />
                  </div>
                  <span className="w-28 text-right leading-tight">
                    <b className="font-extrabold tabular-nums">{brl(x.com)}</b>
                    <small className="block text-[11px] tabular-nums text-ninho-cinza">de {brl(x.liq)}</small>
                  </span>
                </div>
              ))}
              {porCons.length === 0 && <p className="py-4 text-center text-sm text-ninho-cinza">Nenhuma consultora ativa ainda.</p>}
            </div>
            <div className="mt-3 flex flex-wrap gap-4 text-[11.5px] font-semibold text-ninho-cinza">
              <span><i className="mr-1.5 inline-block h-2.5 w-2.5 rounded-sm bg-[#B9A6EC]" />Comissão dela</span>
              <span><i className="mr-1.5 inline-block h-2.5 w-2.5 rounded-sm bg-[#4CAF74]" />Fica com o Ninho</span>
              <span>&ldquo;de&rdquo; = o que as famílias dela renderam depois dos 15% da loja</span>
            </div>
          </Card>
        </div>
        <Aviso>
          Conta só as cobranças das famílias atribuídas a uma consultora, depois da atribuição (mesmas cobranças do Faturamento). A comissão é de{' '}
          {pctTxt(PCT_DIRETO)} ({pctTxt(PCT_REDE)} + {pctTxt(PCT_REDE)} na indicação) por {PARCELAS_MENSAL} meses no mensal ou 1x no anual.
        </Aviso>
      </>
    );
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[#24164F]">Consultoras de sono</h1>
          <p className="mt-1 text-sm text-ninho-cinza">Contas, planos e dinheiro. A rotina dos bebês fica com a família e a consultora dela.</p>
        </div>
        <NovaConsultora
          acao={liberarConsultora}
          opcoes={consultoras.filter((c) => c.estado === 'ativa').map((c) => ({ id: c.id, nome: c.nome ?? 'Consultora' }))}
          pctDireto={pctTxt(PCT_DIRETO)}
          pctRede={pctTxt(PCT_REDE)}
          linkBase={SITE_URL.replace(/^https?:\/\//, '')}
        />
      </div>
      <Abas
        base={BASE}
        atual={aba}
        abas={ABAS.map(([k, t]) => [
          k,
          k === 'pedidos' && pedidos.length + pendPerfil.length
            ? `${t} (${pedidos.length + pendPerfil.length})`
            : k === 'sugestoes' && sugNovas
              ? `${t} (${sugNovas})`
              : t,
        ])}
      />
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

type Tom = 'ambar' | 'lilas' | 'verde' | 'vermelho' | 'cinza';
const TOM: Record<Tom, string> = {
  ambar: 'bg-[#FFF2D6] text-[#B7791F]',
  lilas: 'bg-[#EFE8FC] text-[#7C5CD6]',
  verde: 'bg-[#E7F5EC] text-[#2F8A55]',
  vermelho: 'bg-[#FDEEEE] text-[#E85D5D]',
  cinza: 'bg-[#F0EEF4] text-[#6B6F80]',
};
const ICONE: Record<'pessoa' | 'texto' | 'pix' | 'relogio' | 'ideia', React.ReactNode> = {
  pessoa: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c1.5-4 5-5.5 8-5.5s6.5 1.5 8 5.5" />
    </>
  ),
  texto: <path d="M5 5h14v10H9l-4 4z" />,
  pix: (
    <>
      <rect x="3" y="6" width="18" height="12" rx="3" />
      <circle cx="12" cy="12" r="2.5" />
    </>
  ),
  relogio: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4l3 2" />
    </>
  ),
  ideia: (
    <>
      <path d="M9 18h6M10 21h4" />
      <path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z" />
    </>
  ),
};

/** Uma linha do "Precisa de você" da Visão geral. */
function Tarefa({ icone, tom, titulo, sub, children }: { icone: keyof typeof ICONE; tom: Tom; titulo: string; sub: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-[#F5F2FA] py-3 last:border-0">
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${TOM[tom]}`}>
        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          {ICONE[icone]}
        </svg>
      </span>
      <div className="min-w-[200px] flex-1 text-[13px] leading-snug">
        <b className="text-[#24164F]">{titulo}</b>
        <small className="block text-[11.5px] text-ninho-cinza">{sub}</small>
      </div>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}


