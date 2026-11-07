// Confere as regras de comissão e do prazo do Pix das consultoras.
// Rodar: node scripts/verificar-consultoras.mjs  (Node 22.6+ lê o .ts direto)
import assert from 'node:assert/strict';
import {
  PCT_DIRETO, PCT_REDE, PARCELAS_MENSAL, valorComissao, somar, prazoPix, calcularLinhas, totaisPorCompetencia,
} from '../lib/consultoras-regras.ts';

let ok = 0;
const t = (nome, fn) => { fn(); ok++; console.log('ok  ', nome); };

t('percentuais do dono (07/11/2026)', () => {
  assert.equal(PCT_DIRETO, 25);
  assert.equal(PCT_REDE, 12.5);
  assert.equal(PCT_REDE * 2, PCT_DIRETO, 'rede soma o mesmo que a direta');
  assert.equal(PARCELAS_MENSAL, 6);
});

t('valor por linha, centavos arredondados', () => {
  assert.equal(valorComissao(17.9, 25), 4.48);   // 4,475 → 4,48
  assert.equal(valorComissao(17.9, 12.5), 2.24); // 2,2375 → 2,24
  assert.equal(valorComissao(12.9, 25), 3.23);   // 3,225 → 3,23
  assert.equal(valorComissao(12.9, 12.5), 1.61); // 1,6125 → 1,61
  assert.equal(valorComissao(129.9, 25), 32.48); // 32,475 → 32,48
  assert.equal(valorComissao(129.9, 12.5), 16.24);
  assert.equal(valorComissao(89.9, 25), 22.48);
  assert.equal(valorComissao(89.9, 12.5), 11.24);
  assert.equal(valorComissao(14.9, 25), 3.73);   // preço antigo
  assert.equal(valorComissao(9.9, 12.5), 1.24);
});

const mensal = (meses, base = 17.9) => meses.map((m) => ({ competencia: m, data: `${m}-10T12:00:00Z`, base }));
const fam = (o) => ({ id: 'f1', bebe: 'Theo', plano: 'Premium mensal', anual: false, consultoraId: 'NAT', indicadaPorId: null, atribuidaEm: '2026-11-01T00:00:00Z', cobrancas: [], metodo: 'link', ...o });

t('mensal direto: 25% só nas 6 primeiras cobranças', () => {
  const linhas = calcularLinhas([fam({ cobrancas: mensal(['2026-11', '2026-12', '2027-01', '2027-02', '2027-03', '2027-04', '2027-05', '2027-06']) })]);
  assert.equal(linhas.length, 6);
  assert.ok(linhas.every((l) => l.pct === 25 && l.valor === 4.48 && l.consultoraId === 'NAT' && l.viaId === null));
  assert.deepEqual(linhas.map((l) => l.parcela).sort(), ['1/6', '2/6', '3/6', '4/6', '5/6', '6/6']);
  assert.equal(somar(linhas.map((l) => l.valor)), 26.88);
});

t('cobrança antes da atribuição não conta', () => {
  const linhas = calcularLinhas([fam({ atribuidaEm: '2026-12-01T00:00:00Z', cobrancas: mensal(['2026-11', '2026-12']) })]);
  assert.equal(linhas.length, 1);
  assert.equal(linhas[0].competencia, '2026-12');
  assert.equal(linhas[0].parcela, '1/6');
});

t('anual direto: 25% uma vez', () => {
  const linhas = calcularLinhas([fam({ anual: true, plano: 'Premium anual', cobrancas: mensal(['2026-11', '2027-11'], 129.9) })]);
  assert.equal(linhas.length, 1);
  assert.equal(linhas[0].parcela, 'anual');
  assert.equal(linhas[0].valor, 32.48);
});

t('indicada por outra: 12,5% + 12,5%, via marcada', () => {
  const linhas = calcularLinhas([fam({ consultoraId: 'ANA', indicadaPorId: 'NAT', cobrancas: mensal(['2026-11']) })]);
  assert.equal(linhas.length, 2);
  const ana = linhas.find((l) => l.consultoraId === 'ANA');
  const nat = linhas.find((l) => l.consultoraId === 'NAT');
  assert.equal(ana.pct, 12.5); assert.equal(ana.valor, 2.24); assert.equal(ana.viaId, null);
  assert.equal(nat.pct, 12.5); assert.equal(nat.valor, 2.24); assert.equal(nat.viaId, 'ANA');
});

t('indicada por outra no anual: 2 linhas uma vez', () => {
  const linhas = calcularLinhas([fam({ anual: true, consultoraId: 'ANA', indicadaPorId: 'NAT', cobrancas: mensal(['2026-11'], 89.9) })]);
  assert.equal(linhas.length, 2);
  assert.ok(linhas.every((l) => l.valor === 11.24 && l.parcela === 'anual'));
});

t('indicada por ela mesma conta como direta (sem dobrar)', () => {
  const linhas = calcularLinhas([fam({ indicadaPorId: 'NAT', cobrancas: mensal(['2026-11']) })]);
  assert.equal(linhas.length, 1);
  assert.equal(linhas[0].pct, 25);
});

t('só 1 nível: quem indicou quem indicou não recebe', () => {
  // A família é da ANA (indicada pela NAT). A NAT foi indicada pela BIA, mas
  // isso não entra: só consultoraId e indicadaPorId da atribuição contam.
  const linhas = calcularLinhas([fam({ consultoraId: 'ANA', indicadaPorId: 'NAT', cobrancas: mensal(['2026-11']) })]);
  assert.ok(!linhas.some((l) => l.consultoraId === 'BIA'));
});

t('totais por mês de uma consultora', () => {
  const linhas = calcularLinhas([
    fam({ id: 'f1', cobrancas: mensal(['2026-11', '2026-12']) }),
    fam({ id: 'f2', bebe: 'Lia', consultoraId: 'ANA', indicadaPorId: 'NAT', cobrancas: mensal(['2026-11'], 12.9) }),
  ]);
  const nat = totaisPorCompetencia(linhas, 'NAT');
  assert.equal(nat.get('2026-11'), 6.09); // 4,48 + 1,61
  assert.equal(nat.get('2026-12'), 4.48);
  assert.equal(totaisPorCompetencia(linhas, 'ANA').get('2026-11'), 1.61);
});

t('método: link, código no cadastro e manual geram; vínculo não', () => {
  const c = mensal(['2026-11']);
  assert.equal(calcularLinhas([fam({ metodo: 'link', cobrancas: c })]).length, 1);
  assert.equal(calcularLinhas([fam({ metodo: 'codigo_cadastro', cobrancas: c })]).length, 1);
  assert.equal(calcularLinhas([fam({ metodo: 'manual', cobrancas: c })]).length, 1);
  assert.equal(calcularLinhas([fam({ metodo: 'vinculo', cobrancas: c })]).length, 0);
  assert.equal(calcularLinhas([fam({ metodo: 'qualquer', cobrancas: c })]).length, 0);
});

t('cancelou (mês sem cobrança) e voltou: depois do buraco nada conta', () => {
  const linhas = calcularLinhas([fam({ cobrancas: mensal(['2026-11', '2026-12', '2027-02', '2027-03']) })]);
  assert.deepEqual(linhas.map((l) => l.competencia).sort(), ['2026-11', '2026-12']);
});

t('virada de ano sem buraco continua contando', () => {
  const linhas = calcularLinhas([fam({ cobrancas: mensal(['2026-12', '2027-01']) })]);
  assert.equal(linhas.length, 2);
});

t('reembolso: a reembolsada e as seguintes não contam', () => {
  const c = mensal(['2026-11', '2026-12', '2027-01']);
  c[1].reembolsada = true;
  const linhas = calcularLinhas([fam({ cobrancas: c })]);
  assert.deepEqual(linhas.map((l) => l.competencia), ['2026-11']);
});

t('reembolso do anual: nada conta', () => {
  const c = mensal(['2026-11'], 129.9);
  c[0].reembolsada = true;
  assert.equal(calcularLinhas([fam({ anual: true, cobrancas: c })]).length, 0);
});

t('paradaEm (cancelou): cobranças a partir dela não contam, nem na rede', () => {
  const linhas = calcularLinhas([fam({ consultoraId: 'ANA', indicadaPorId: 'NAT', paradaEm: '2026-12-01T00:00:00Z', cobrancas: mensal(['2026-11', '2026-12', '2027-01']) })]);
  assert.equal(linhas.length, 2);
  assert.ok(linhas.every((l) => l.competencia === '2026-11'));
});

t('prazo do Pix: 5º dia útil do mês seguinte, com feriado', () => {
  assert.equal(prazoPix('2026-10'), '2026-11-09'); // 02/11 Finados
  assert.equal(prazoPix('2026-11'), '2026-12-07');
  assert.equal(prazoPix('2026-12'), '2027-01-08'); // 01/01 feriado
});

console.log(`\n${ok} verificações passaram.`);
