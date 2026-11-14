// programme/missions/reel2/CONFIRMATION_TEMOINS.md : trente témoins négatifs neufs pour la chaîne de livraison.
import { readFileSync, writeFileSync } from 'node:fs';
import { lireCSV, analyser } from '../src/loi-client.js';
const D = new URL('../programme/missions/reel2/', import.meta.url).pathname, res = [];
for (const id of ['S3', 'S4', 'T1', 'T2', 'T3', 'E1', 'E2', 'E3', 'E4', 'E5']) for (const g of [101, 202, 303]) {
  const { noms, lignes } = lireCSV(readFileSync(`${D}donnees/${id}.csv`, 'utf8')), X = lignes.map((r) => r.slice(0, -1)), y = lignes.map((r) => r.at(-1));
  let s = g; for (let i = y.length - 1; i > 0; i--) { s = (s * 16807) % 2147483647; const j = s % (i + 1); [y[i], y[j]] = [y[j], y[i]]; }
  const a = analyser({ noms: noms.slice(0, -1), cible: noms.at(-1), X, y, graine: 1 });
  res.push({ tache: id, permutation: g, loi: a.loi, sans_variable: a.sans_variable, retenue: a.retenue, erreur_loi: a.erreur_loi, erreur_droite: a.erreur_droite, erreur_constante: a.erreur_constante });
  console.log(id, g, a.retenue ? 'RETENUE' : 'écartée', a.sans_variable ? '(constante)' : '', String(a.loi).slice(0, 60));
}
console.log('retenus :', res.filter((r) => r.retenue).length, 'sur', res.length, '| constantes :', res.filter((r) => r.sans_variable).length);
writeFileSync(`${D}temoins.json`, JSON.stringify(res, null, 1) + '\n');
