// Protocole SOTA-LOIS-2 : fait tourner GALILÉE par la chaîne de livraison sur chaque jeu, mesure la longueur de sa
// loi, et exporte le même partage pour les concurrents. Usage : node scripts/sota-lois-2-exporter.js <jeux> <sortie>
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { analyser, partage } from '../src/loi-client.js';
import { parse, size } from '../moteurs/galilee/src/expr.js';

const [src, dest] = process.argv.slice(2);
mkdirSync(dest, { recursive: true });
for (const f of readdirSync(src).filter((x) => x.endsWith('.csv')).sort()) {
  const L = readFileSync(join(src, f), 'utf8').trim().split('\n').slice(1).map((l) => l.split(';').map(Number));
  const X = L.map((r) => [r[0]]), y = L.map((r) => r[1]), a = analyser({ noms: ['x'], cible: 'y', X, y, graine: 1 }), { vu, test } = partage(X, y);
  let noeuds = null; try { noeuds = a.loi ? size(parse(a.loi, ['x'])) : null; } catch { noeuds = null; }
  const sx = a.echelles.variables[0], sy = a.echelles.reponse;
  writeFileSync(join(dest, f.replace('.csv', '.json')), JSON.stringify({ jeu: f.replace('.csv', ''), points: y.length, sy, Xvu: vu.map((i) => [X[i][0] / sx]), yvu: vu.map((i) => y[i] / sy), Xtest: test.map((i) => [X[i][0] / sx]), ytest: test.map((i) => y[i]),
    temoin: Math.min(a.erreur_constante, a.erreur_droite ?? Infinity), galilee: { erreur: a.erreur_loi, loi: a.loi, noeuds, retenue: a.retenue, sans_variable: a.sans_variable, secs: a.secs } }));
  console.log(f.replace('.csv', '').padEnd(34), String(y.length).padStart(4), 'GALILÉE', a.erreur_loi == null ? 'échec' : (a.erreur_loi / Math.min(a.erreur_constante, a.erreur_droite ?? Infinity)).toFixed(2), `${noeuds} nœuds`, a.retenue ? 'retenue' : 'non retenue', `${a.secs.toFixed(1)} s`);
}
