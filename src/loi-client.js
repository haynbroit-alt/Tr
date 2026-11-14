// Chaîne de livraison « trouver une loi dans les données d'un client ». La copie gelée de GALILÉE cherche la loi ;
// cette chaîne ajoute ce que le moteur ne fait pas en données fournies (RESULTATS_G4, RESULTATS_REEL) : une mesure
// sur quatre est mise de côté, et la loi n'est retenue que si elle y prédit mieux qu'une constante et qu'une droite.
import { loiSurDonnees } from './adaptateurs/galilee.js';

export const MESURES_MIN = 50; // constat après coup de RESULTATS_REEL, à confirmer : en dessous, la loi est souvent triviale

export function lireCSV(texte) {
  const L = texte.replace(/^﻿/, '').split(/\r?\n/).filter((l) => l.trim());
  const sep = [';', '\t', ','].find((s) => L[0].includes(s)) ?? ',';
  const num = (v) => Number(sep === ',' ? v : v.replace(',', '.'));
  const noms = L[0].split(sep).map((s) => s.trim().replace(/^"|"$/g, ''));
  const lignes = L.slice(1).map((l) => l.split(sep).map((v) => num(v.trim())));
  const rejetees = lignes.filter((r) => r.length !== noms.length || !r.every(Number.isFinite)).length;
  return { noms, lignes: lignes.filter((r) => r.length === noms.length && r.every(Number.isFinite)), rejetees };
}

// Même partage que le protocole RÉEL : tri par variables puis réponse, rangs 2, 6, 10… mis de côté.
export function partage(X, y) {
  const ordre = y.map((_, i) => i).sort((p, q) => { for (let k = 0; k < X[p].length; k++) if (X[p][k] !== X[q][k]) return X[p][k] - X[q][k]; return y[p] - y[q]; });
  return { vu: ordre.filter((_, r) => r % 4 !== 2), test: ordre.filter((_, r) => r % 4 === 2) };
}

const eqm = (I, f, X, y) => Math.sqrt(I.reduce((s, i) => s + (f(X[i]) - y[i]) ** 2, 0) / I.length);

// Moindres carrés avec constante, par élimination de Gauss sur les équations normales.
function droite(X, y, I) {
  const d = X[0].length + 1, A = Array.from({ length: d }, () => new Array(d + 1).fill(0));
  for (const i of I) { const v = [1, ...X[i]]; for (let a = 0; a < d; a++) { for (let b = 0; b < d; b++) A[a][b] += v[a] * v[b]; A[a][d] += v[a] * y[i]; } }
  for (let c = 0; c < d; c++) {
    let p = c; for (let r = c + 1; r < d; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
    if (Math.abs(A[p][c]) < 1e-12) return null;
    [A[c], A[p]] = [A[p], A[c]];
    for (let r = 0; r < d; r++) if (r !== c) { const f = A[r][c] / A[c][c]; for (let k = c; k <= d; k++) A[r][k] -= f * A[c][k]; }
  }
  const b = A.map((r, i) => r[d] / r[i]);
  return (x) => b[0] + x.reduce((s, v, k) => s + b[k + 1] * v, 0);
}

export function temoins(X, y, vu, test) {
  const m = vu.reduce((s, i) => s + y[i], 0) / vu.length, f = droite(X, y, vu);
  return { constante: eqm(test, () => m, X, y), droite: f ? eqm(test, f, X, y) : null };
}

export function analyser({ noms, cible, X, y, graine = 1 }) {
  const { vu, test } = partage(X, y);
  const max = (v) => Math.max(...v.map(Math.abs)) || 1;
  const sx = noms.map((_, k) => max(vu.map((i) => X[i][k]))), sy = max(vu.map((i) => y[i]));
  const r = loiSurDonnees({ noms, cible, X: vu.map((i) => X[i].map((v, k) => v / sx[k])), y: vu.map((i) => y[i] / sy), graine });
  const t = temoins(X, y, vu, test);
  const erreur = r.texte ? eqm(test, (x) => r.f(x.map((v, k) => v / sx[k])) * sy, X, y) : null;
  const ref = Math.min(t.constante, t.droite ?? Infinity);
  const retenue = erreur != null && Number.isFinite(erreur) && erreur < ref;
  return { cible, noms, mesures: y.length, vues: vu.length, mises_de_cote: test.length, peu_de_mesures: y.length < MESURES_MIN,
    loi: r.texte, echelles: { variables: sx, reponse: sy }, verdict_moteur: r.verdict ?? null, secs: r.secs,
    erreur_loi: Number.isFinite(erreur) ? erreur : null, erreur_constante: t.constante, erreur_droite: t.droite, retenue };
}

const n = (v) => (v == null ? 'non calculable' : Number(v.toPrecision(4)).toString());
export function rapport(a) {
  const l = [`Cible : ${a.cible} — variables : ${a.noms.join(', ')}`,
    `Mesures : ${a.mesures}, dont ${a.mises_de_cote} mises de côté (une sur quatre), jamais montrées au moteur.`];
  if (a.peu_de_mesures) l.push(`ATTENTION : moins de ${MESURES_MIN} mesures. Sur des mesures réelles de référence, un seul jeu sur huit de cette taille a donné une loi utilisable.`);
  l.push(`Loi trouvée (variables divisées par ${a.echelles.variables.map(n).join(', ')} ; réponse par ${n(a.echelles.reponse)}) : ${a.loi ?? 'aucune'}`,
    `Erreur sur les mesures mises de côté — loi : ${n(a.erreur_loi)} ; droite : ${n(a.erreur_droite)} ; constante : ${n(a.erreur_constante)}`,
    a.retenue ? 'Conclusion : loi RETENUE — elle prédit les mesures non vues mieux qu\'une droite et qu\'une constante.'
      : 'Conclusion : loi NON RETENUE — elle ne prédit pas mieux qu\'un témoin simple sur les mesures non vues.',
    `Niveau de confiance affiché par le moteur (pour information, non garanti en données fournies) : ${a.verdict_moteur ?? 'aucun'}`,
    'Limites : interpolation seulement ; une loi retenue prédit, elle ne prouve pas un mécanisme.');
  return l.join('\n');
}
