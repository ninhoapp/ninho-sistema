// Confere as contas da rotina da consultora (lib/consultoras-rotina.ts, v3).
// Rodar: node scripts/verificar-rotina.mjs  (Node 22.6+ lê o .ts direto)
import assert from 'node:assert/strict';
import {
  diaV3, semanaV3, costumeAntes, hhmm, faixaTxt, minutoDaNoite, minutoDoDia, somarDias,
} from '../lib/consultoras-rotina.ts';

let ok = 0;
const t = (nome, fn) => { fn(); ok++; console.log('ok  ', nome); };

// Horário de Brasília (UTC−3) → ISO.
const em = (dia, hora) => {
  const [h, m] = hora.split(':').map(Number);
  const [y, mo, d] = dia.split('-').map(Number);
  return new Date(Date.UTC(y, mo - 1, d, h + 3, m)).toISOString();
};
let n = 0;
const sono = (dia, a, diaFim, b) => ({ id: `s${++n}`, tipo: 'sleep', subtipo: null, inicio: em(dia, a), fim: em(diaFim, b), detalhe: {}, registrado_por: 'Carla' });
const mamada = (dia, h, ml = 150) => ({ id: `m${++n}`, tipo: 'feeding', subtipo: 'bottle', inicio: em(dia, h), fim: null, detalhe: { ml }, registrado_por: 'Carla' });

/** Um dia típico: acordou 06:15 (fim da noite anterior), 3 sonecas, dormiu 19:30, 1 despertar. */
function diaTipico(dia, { dormiu = '19:30', ultima = ['16:30', '17:05'], despertar = true } = {}) {
  const prox = somarDias(dia, 1);
  const regs = [
    sono(dia, '09:00', dia, '10:10'),
    sono(dia, '13:00', dia, '14:20'),
    sono(dia, ultima[0], dia, ultima[1]),
    mamada(dia, '12:00'),
  ];
  if (despertar) {
    regs.push(sono(dia, dormiu, prox, '00:10'), sono(prox, '00:30', prox, '06:15'), mamada(prox, '00:15'));
  } else {
    regs.push(sono(dia, dormiu, prox, '06:15'));
  }
  return regs;
}

const D = '2026-11-02';
const ANTES = somarDias(D, -1);
// A noite de ANTES termina às 06:15 de D (o "acordou" de D).
const base = [sono(ANTES, '19:40', D, '06:15'), ...diaTipico(D)];
const agora = new Date(em(somarDias(D, 3), '12:00')).getTime();

t('dia do acordar ao acordar', () => {
  const d = diaV3(base, D, agora);
  assert.equal(hhmm(minutoDoDia(d.acordou)), '06:15');
  assert.equal(hhmm(minutoDoDia(d.acordouSeguinte)), '06:15');
  assert.equal(d.sonecas.length, 3);
  assert.equal(Math.round(d.sonecasMin), 70 + 80 + 35);
  assert.equal(d.noite.despertares, 1);
  assert.equal(d.despertaresLista.length, 1);
  assert.equal(Math.round(d.despertaresLista[0].min), 20); // 00:10 → 00:30
  assert.equal(Math.round(d.noite.primeiroTrechoMin), 280); // 19:30 → 00:10
  assert.equal(d.noiteCompleta, true);
  assert.equal(d.mamadasMadrugada.length, 1);
  assert.equal(d.mamadasDia.length, 1);
  assert.equal(Math.round(d.janelaAntesDeDormir), 145); // 17:05 → 19:30
  assert.equal(Math.round(d.sono24), 185 + 280 + 345);
});

t('sem registro, sem número', () => {
  const d = diaV3([], D, agora);
  assert.equal(d.temRegistro, false);
  assert.equal(d.acordou, null);
  assert.equal(d.sono24, null);
  assert.equal(d.janelaAntesDeDormir, null);
  const s = semanaV3([], D, agora);
  assert.equal(s.noiteMed, null);
  assert.equal(s.melhores.length, 0);
  assert.equal(s.horarios.length, 0);
});

t('noite que passa da meia-noite conta como 24h+', () => {
  assert.equal(minutoDaNoite(new Date(em(D, '00:30')).getTime()), 24 * 60 + 30);
  assert.equal(minutoDaNoite(new Date(em(D, '19:30')).getTime()), 19 * 60 + 30);
});

// Semana: 7 dias, um deles com dormir tarde e noite sem despertar.
const semanaRegs = [sono(somarDias(D, -1), '19:40', D, '06:15')];
for (let i = 0; i < 7; i++) {
  const dia = somarDias(D, i);
  const tarde = i === 3;
  semanaRegs.push(...diaTipico(dia, { dormiu: tarde ? '20:40' : '19:30', despertar: i !== 5 }));
}

t('semana: médias, melhores noites e horários', () => {
  const s = semanaV3(semanaRegs, somarDias(D, 6), agora);
  assert.equal(s.dias.length, 7);
  assert.equal(s.noitesCompletas, 7);
  assert.equal(s.sonecasPorDia, 3);
  // A noite sem despertar (dia 5) tem mais sono: é a melhor.
  assert.equal(s.melhores[0], somarDias(D, 5));
  const dormiu = s.horarios.find((h) => h.rotulo === 'Dormiu');
  assert.equal(faixaTxt(dormiu), '19:30–20:40');
  assert.equal(dormiu.irregular, true); // variou 1h10
  const acordou = s.horarios.find((h) => h.rotulo === 'Acordou');
  assert.equal(faixaTxt(acordou), '06:15');
  assert.equal(acordou.irregular, false);
  assert.ok(s.maiorJanela >= 215); // 17:05 → 20:40 no dia tarde
});

t('de costume = os 7 dias antes', () => {
  const c = costumeAntes(semanaRegs, somarDias(D, 7), agora);
  assert.equal(c.dias[0].dia, D);
  assert.equal(c.dias[6].dia, somarDias(D, 6));
});

console.log(`\n${ok} verificações passaram.`);
