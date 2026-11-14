// Protocole RÉEL-2 (programme/missions/reel2/PROTOCOLE_REEL2.md). Usage :
//   node scripts/reel2.js --preparer <dossier data du paquet vega-datasets>   (écrit donnees/*.csv)
//   node scripts/reel2.js --out programme/missions/reel2/test.json            (exécution unique)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { loiSurDonnees } from '../src/adaptateurs/galilee.js';
import { lireCSV, temoins } from '../src/loi-client.js';

const DOSSIER = new URL('../programme/missions/reel2/donnees/', import.meta.url).pathname;
const arg = (n, d) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : d; };
export const TACHES = [
  ['S1', 'nature', 'CO₂ à Mauna Loa selon la date', 'temps'], ['S2', 'nature', 'température mondiale selon l’année', 'temps'],
  ['S3', 'nature', 'masse des manchots selon la longueur de l’aile', 'entrelacé'], ['S4', 'nature', 'hauteur du bec selon sa longueur', 'entrelacé'],
  ['T1', 'technique', 'consommation des voitures selon le poids', 'entrelacé'], ['T2', 'technique', 'consommation selon la puissance', 'entrelacé'],
  ['T3', 'technique', 'accélération selon puissance et poids', 'entrelacé'], ['E1', 'économie', 'espérance de vie selon le revenu', 'entrelacé'],
  ['E2', 'économie', 'espérance de vie selon la fécondité', 'entrelacé'], ['E3', 'économie', 'prix du blé selon le salaire', 'entrelacé'],
  ['E4', 'économie', 'recettes des films selon le budget', 'entrelacé'], ['E5', 'économie', 'milles parcourus selon le prix de l’essence', 'entrelacé'],
  ['F1', 'finance', 'rendement S&P 500 du mois suivant selon celui du mois', 'temps'], ['F2', 'finance', 'rendement MSFT du mois suivant selon celui du mois', 'temps'],
  ['F3', 'finance', 'cours du S&P 500 selon la date', 'temps'],
].map(([id, domaine, titre, partage]) => ({ id, domaine, titre, partage }));

function preparer(src) {
  const J = (f) => JSON.parse(readFileSync(join(src, f), 'utf8')), C = (f) => readFileSync(join(src, f), 'utf8').trim().split(/\r?\n/).slice(1).map((l) => l.split(','));
  const an = (s) => { const d = new Date(s); return d.getUTCFullYear() + d.getUTCMonth() / 12; };
  const rend = (p) => p.slice(1).map((v, i) => Math.log(v / p[i]));
  const paires = (r) => r.slice(0, -1).map((v, i) => [v, r[i + 1]]);
  const sp = C('sp500.csv').map((r) => [an(r[0]), Number(r[1])]), ms = C('stocks.csv').filter((r) => r[0] === 'MSFT').map((r) => Number(r[2]));
  const cars = J('cars.json'), pen = J('penguins.json');
  const T = {
    S1: [['date', 'co2'], C('co2-concentration.csv').map((r) => [an(r[0]), Number(r[1])])],
    S2: [['annee', 'temperature'], C('global-temp.csv').map((r) => [Number(r[0]), Number(r[1])])],
    S3: [['aile', 'masse'], pen.map((p) => [p['Flipper Length (mm)'], p['Body Mass (g)']])],
    S4: [['bec_longueur', 'bec_hauteur'], pen.map((p) => [p['Beak Length (mm)'], p['Beak Depth (mm)']])],
    T1: [['poids', 'consommation'], cars.map((c) => [c.Weight_in_lbs, c.Miles_per_Gallon])],
    T2: [['puissance', 'consommation'], cars.map((c) => [c.Horsepower, c.Miles_per_Gallon])],
    T3: [['puissance', 'poids', 'acceleration'], cars.map((c) => [c.Horsepower, c.Weight_in_lbs, c.Acceleration])],
    E1: [['revenu', 'esperance'], C('gapminder-health-income.csv').map((r) => [Number(r.at(-4)), Number(r.at(-3))])],
    E2: [['fecondite', 'esperance'], J('gapminder.json').map((g) => [g.fertility, g.life_expect])],
    E3: [['salaire', 'ble'], J('wheat.json').map((w) => [w.wages, w.wheat])],
    E4: [['budget', 'recettes'], J('movies.json').map((m) => [m['Production Budget'], m['Worldwide Gross']]).filter((r) => r[0] > 0 && r[1] > 0)],
    E5: [['essence', 'milles'], J('driving.json').map((d) => [d.gas, d.miles])],
    F1: [['rendement', 'rendement_suivant'], paires(rend(sp.map((r) => r[1])))],
    F2: [['rendement', 'rendement_suivant'], paires(rend(ms))],
    F3: [['date', 'cours'], sp],
  };
  mkdirSync(DOSSIER, { recursive: true });
  for (const [id, [noms, lignes]] of Object.entries(T)) {
    let L = lignes.filter((r) => r.every((v) => typeof v === 'number' && Number.isFinite(v)));
    if (L.length > 400) L = Array.from({ length: 400 }, (_, i) => L[Math.floor((i * L.length) / 400)]);
    writeFileSync(join(DOSSIER, `${id}.csv`), noms.join(';') + '\n' + L.map((r) => r.join(';')).join('\n') + '\n');
    console.log(id, noms.join(' → '), L.length, 'lignes sur', lignes.length);
  }
}

const eqm = (I, f, X, y) => Math.sqrt(I.reduce((s, i) => s + (f(X[i]) - y[i]) ** 2, 0) / I.length);
export function juger(X, y, partage) {
  const n = y.length; let vu, dec, fin;
  if (partage === 'temps') { const I = y.map((_, i) => i); vu = I.slice(0, Math.floor(n / 2)); dec = I.slice(Math.floor(n / 2), Math.floor((3 * n) / 4)); fin = I.slice(Math.floor((3 * n) / 4)); }
  else { const o = y.map((_, i) => i).sort((p, q) => { for (let k = 0; k < X[p].length; k++) if (X[p][k] !== X[q][k]) return X[p][k] - X[q][k]; return y[p] - y[q]; }); vu = o.filter((_, r) => r % 4 < 2); dec = o.filter((_, r) => r % 4 === 2); fin = o.filter((_, r) => r % 4 === 3); }
  const max = (v) => Math.max(...v.map(Math.abs)) || 1, sx = X[0].map((_, k) => max(vu.map((i) => X[i][k]))), sy = max(vu.map((i) => y[i]));
  const r = loiSurDonnees({ noms: X[0].map((_, k) => `x${k + 1}`), cible: 'y', X: vu.map((i) => X[i].map((v, k) => v / sx[k])), y: vu.map((i) => y[i] / sy), graine: 1 });
  const f = (x) => r.f(x.map((v, k) => v / sx[k])) * sy, td = temoins(X, y, vu, dec), tf = temoins(X, y, vu, fin);
  const e = (I) => { if (!r.texte) return null; const v = eqm(I, f, X, y); return Number.isFinite(v) ? v : null; }, ed = e(dec), ef = e(fin);
  const bat = (v, t) => v != null && v < Math.min(t.constante, t.droite ?? Infinity);
  return { mesures: n, vues: vu.length, loi: r.texte, verdict_moteur: r.verdict ?? null, secs: r.secs,
    decision: { loi: ed, droite: td.droite, constante: td.constante }, final: { loi: ef, droite: tf.droite, constante: tf.constante }, retenue: bat(ed, td), tient: bat(ef, tf) };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  if (arg('--preparer')) preparer(arg('--preparer'));
  else {
    const res = [];
    for (const t of TACHES) {
      const { lignes } = lireCSV(readFileSync(join(DOSSIER, `${t.id}.csv`), 'utf8')), X = lignes.map((r) => r.slice(0, -1)), y = lignes.map((r) => r.at(-1));
      const lots = [['réelle', y]];
      if (t.partage === 'entrelacé') { let s = 12345; const p = [...y]; for (let i = p.length - 1; i > 0; i--) { s = (s * 16807) % 2147483647; const j = s % (i + 1); [p[i], p[j]] = [p[j], p[i]]; } lots.push(['mélangée', p]); }
      for (const [nature, yy] of lots) {
        const r = { ...t, nature, ...juger(X, yy, t.partage) }; res.push(r);
        console.log(`${t.id} ${nature.padEnd(8)} ${String(r.mesures).padStart(3)} | ${r.retenue ? 'RETENUE    ' : 'non retenue'} | ${r.tient ? 'tient    ' : 'ne tient pas'} | ${String(r.verdict_moteur).padEnd(10)} | ${String(r.loi).slice(0, 70)}`);
      }
    }
    const out = arg('--out'); if (out) writeFileSync(out, JSON.stringify({ moteur: 'galilee@be42b7e', graine: 1, taches: res }, null, 1) + '\n');
  }
}
