// Protocole RÉEL (programme/missions/reel/PROTOCOLE_REEL.md) : la copie gelée de GALILÉE, en mode « données
// fournies », sur les jeux de référence du NIST. Une mesure sur quatre est mise de côté ; l'erreur sur ces mesures
// est comparée à l'écart-type certifié du modèle de l'étude. Usage :
//   node scripts/reel-nist.js --lot genere|observe [--echelle brut|norme] [--out fichier.json]
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loiSurDonnees } from '../src/adaptateurs/galilee.js';

const DOSSIER = new URL('../programme/missions/reel/nist/', import.meta.url).pathname;
const arg = (n, d) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : d; };
const lot = arg('--lot', 'genere'), echelle = arg('--echelle', 'brut'), out = arg('--out', null);

export function lire(nom) {
  const L = readFileSync(join(DOSSIER, nom), 'utf8').split(/\r?\n/);
  const tete = L.slice(0, 60).join('\n');
  const [, a, b] = tete.match(/Data\s+\(lines\s+(\d+)\s+to\s+(\d+)\)/);
  const sd = Number(tete.match(/Residual Standard Deviation:\s+(\S+)/)[1]);
  const modele = (L.find((l) => /^\s*(y|log\[y\])\s*=/.test(l)) ?? '').trim().replace(/\s+\+\s+e$/, '');
  const nature = /Generated Data/.test(tete) ? 'genere' : 'observe';
  const lignes = L.slice(a - 1, b).map((l) => l.trim().split(/\s+/).map(Number)).filter((r) => r.length >= 2 && r.every(Number.isFinite));
  const log = modele.startsWith('log[y]');
  return { nom: nom.replace('.dat', ''), nature, sd, modele, y: lignes.map((r) => (log ? Math.log(r[0]) : r[0])), X: lignes.map((r) => r.slice(1)) };
}

const cle = (j) => JSON.stringify([j.X, j.y]);
export function jeux(nature) {
  const vus = new Map();
  for (const f of readdirSync(DOSSIER).filter((f) => f.endsWith('.dat')).sort()) {
    const j = lire(f);
    if (j.nature !== nature) continue;
    const k = cle(j), d = vus.get(k);
    if (!d) vus.set(k, { ...j, fichiers: [j.nom] });
    else { d.fichiers.push(j.nom); if (j.sd < d.sd) { d.sd = j.sd; d.modele = j.modele; } }
  }
  return [...vus.values()];
}

export function evaluer(j, echelle) {
  const ordre = j.y.map((_, i) => i).sort((p, q) => { for (let k = 0; k < j.X[p].length; k++) if (j.X[p][k] !== j.X[q][k]) return j.X[p][k] - j.X[q][k]; return j.y[p] - j.y[q]; });
  const test = ordre.filter((_, r) => r % 4 === 2), vu = ordre.filter((_, r) => r % 4 !== 2);
  const d = j.X[0].length, noms = d === 1 ? ['x'] : j.X[0].map((_, k) => `x${k + 1}`);
  const max = (v) => Math.max(...v.map(Math.abs)) || 1;
  const sx = echelle === 'norme' ? noms.map((_, k) => max(vu.map((i) => j.X[i][k]))) : noms.map(() => 1);
  const sy = echelle === 'norme' ? max(vu.map((i) => j.y[i])) : 1;
  const r = loiSurDonnees({ noms, cible: 'y', X: vu.map((i) => j.X[i].map((v, k) => v / sx[k])), y: vu.map((i) => j.y[i] / sy), graine: 1 });
  const base = { jeu: j.nom, fichiers: j.fichiers, points: j.y.length, vus: vu.length, mis_de_cote: test.length, modele_etude: j.modele, ecart_type_certifie: j.sd, secs: r.secs };
  if (!r.texte) return { ...base, loi: null, verdict: null, erreur: null, rapport: null };
  const e2 = test.map((i) => (r.f(j.X[i].map((v, k) => v / sx[k])) * sy - j.y[i]) ** 2);
  const erreur = Math.sqrt(e2.reduce((s, v) => s + v, 0) / e2.length);
  const fini = Number.isFinite(erreur);
  return { ...base, loi: r.texte, verdict: r.verdict, erreur: fini ? erreur : null, rapport: fini ? erreur / j.sd : null };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const res = [];
  for (const j of jeux(lot)) {
    const r = evaluer(j, echelle);
    res.push(r);
    console.log(`${r.jeu.padEnd(10)} ${String(r.points).padStart(4)} pts  rapport ${r.rapport == null ? 'échec ' : r.rapport.toFixed(2).padStart(8)}  ${String(r.verdict).padEnd(11)} ${r.secs.toFixed(1)} s  ${String(r.loi).slice(0, 70)}`);
  }
  const ok = res.filter((r) => r.rapport != null && r.rapport <= 2).length;
  console.log(`au niveau de la référence : ${ok} sur ${res.length} (échelle ${echelle})`);
  if (out) writeFileSync(out, JSON.stringify({ lot, echelle, moteur: 'galilee@be42b7e', graine: 1, jeux: res }, null, 1) + '\n');
}
