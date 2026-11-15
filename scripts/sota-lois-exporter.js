// Protocole SOTA-LOIS : exporte les 15 jeux du lot « observé » de RÉEL avec le même partage et la même mise à
// l'échelle que scripts/reel-nist.js, et l'erreur déjà publiée de GALILÉE. Usage : node scripts/sota-lois-exporter.js <dossier>
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { jeux } from './reel-nist.js';

const dest = process.argv[2], publie = JSON.parse(readFileSync(new URL('../programme/missions/reel/test-observe.json', import.meta.url), 'utf8')).jeux;
mkdirSync(dest, { recursive: true });
for (const j of jeux('observe')) {
  const ordre = j.y.map((_, i) => i).sort((p, q) => { for (let k = 0; k < j.X[p].length; k++) if (j.X[p][k] !== j.X[q][k]) return j.X[p][k] - j.X[q][k]; return j.y[p] - j.y[q]; });
  const test = ordre.filter((_, r) => r % 4 === 2), vu = ordre.filter((_, r) => r % 4 !== 2), max = (v) => Math.max(...v.map(Math.abs)) || 1;
  const sx = j.X[0].map((_, k) => max(vu.map((i) => j.X[i][k]))), sy = max(vu.map((i) => j.y[i])), g = publie.find((x) => x.jeu === j.nom);
  writeFileSync(join(dest, `${j.nom}.json`), JSON.stringify({ jeu: j.nom, sd: j.sd, sy, Xvu: vu.map((i) => j.X[i].map((v, k) => v / sx[k])), yvu: vu.map((i) => j.y[i] / sy), Xtest: test.map((i) => j.X[i].map((v, k) => v / sx[k])), ytest: test.map((i) => j.y[i]), galilee: { erreur: g.erreur, rapport: g.rapport, loi: g.loi } }));
}
console.log('exporté :', jeux('observe').length, 'jeux');
