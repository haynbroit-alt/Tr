// Protocole PRIX-RÉEL (programme/missions/prix-reel/PROTOCOLE_PRIX_REEL.md) : la lecture « quel niveau de prix
// dégage le plus de marge » confrontée à des ventes réelles. Lecture sur la première moitié des semaines de chaque
// série, vérification sur la seconde. Les CSV viennent de scripts/prix-reel-extraire.py (données hors dépôt).
// Usage : node scripts/prix-reel.js prive/prix-reel [--sortie programme/missions/prix-reel/resultats.json]
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tUnilateral } from './t3.js';

const NIVEAUX = [-1, -0.5, 0, 0.5, 1], PAS = 1.25, MIN_SEMAINES = 60, MIN_LECTURE = 3, MIN_VERIF = 2;
const med = (v) => { const s = [...v].sort((a, b) => a - b); return s[s.length >> 1]; };
const moy = (v) => v.reduce((a, b) => a + b, 0) / v.length;
const lire = (f) => { const [h, ...L] = readFileSync(f, 'utf8').trim().split('\n'); const c = h.split(';'); return L.map((l) => Object.fromEntries(l.split(';').map((v, i) => [c[i], Number(v)]))); };

// une série : semaines { semaine, unites, prix, cout, promo } dans l'ordre du temps
function lireSerie(S) {
  if (S.length < MIN_SEMAINES) return { etat: 'trop courte' };
  const k = Math.floor(S.length / 2), lecture = S.slice(0, k), verif = S.slice(k), ref = med(lecture.map((s) => s.prix));
  const niveau = (s) => { const u = Math.log(s.prix / ref) / Math.log(PAS); const n = NIVEAUX.reduce((a, b) => (Math.abs(b - u) < Math.abs(a - u) ? b : a)); return Math.abs(n - u) <= 0.25 ? n : null; };
  const table = (W) => Object.fromEntries(NIVEAUX.map((u) => { const m = W.filter((s) => niveau(s) === u).map((s) => (s.prix - s.cout) * s.unites); return [u, { n: m.length, marge: m.length ? moy(m) : null }]; }));
  const TL = table(lecture), TV = table(verif), vus = NIVEAUX.filter((u) => TL[u].n >= MIN_LECTURE);
  if (vus.length < 2) return { etat: 'un seul niveau lisible' };
  const tri = [...vus].sort((a, b) => TL[b].marge - TL[a].marge || Math.abs(a) - Math.abs(b)), decide = tri[0], pire = tri.at(-1);
  const dansGrille = verif.filter((s) => niveau(s) != null).map((s) => (s.prix - s.cout) * s.unites), echelle = dansGrille.length ? Math.abs(moy(dansGrille)) : null;
  const classement = TV[decide].n >= MIN_VERIF && TV[pire].n >= MIN_VERIF && echelle > 0 ? (TV[decide].marge - TV[pire].marge) / echelle : null;
  const out = { decide, pire, niveaux_lus: vus.length, classement, hors_grille: 1 - (lecture.filter((s) => niveau(s) != null).length + dansGrille.length) / S.length };
  if (decide === 0) return { etat: 'ne change rien', ...out };
  if (TV[decide].n < MIN_VERIF || TV[0].n < MIN_VERIF) return { etat: 'non évaluable', ...out };
  if (!(TV[0].marge > 0)) return { etat: 'non évaluable', motif: 'marge de référence non positive', ...out };
  return { etat: 'évaluée', gain: (TV[decide].marge - TV[0].marge) / TV[0].marge, ...out };
}

// binomiale unilatérale : probabilité d'au moins k succès sur n à pile ou face
function signes(v) { const x = v.filter((d) => d !== 0), n = x.length, k = x.filter((d) => d > 0).length; let p = 0, c = 1; for (let i = 0; i <= n; i++) { if (i >= k) p += c; c = (c * (n - i)) / (i + 1); } return { n, positifs: k, p: p / 2 ** n, etabli: p / 2 ** n < 0.05 }; }

function etude(series) {
  const R = series.map(({ groupe, S }) => ({ groupe, ...lireSerie(S) }));
  const etats = R.reduce((c, r) => { c[r.etat] = (c[r.etat] ?? 0) + 1; return c; }, {});
  const E = R.filter((r) => r.etat === 'évaluée'), parGroupe = (rows, f) => { const g = new Map(); for (const r of rows) { if (!g.has(r.groupe)) g.set(r.groupe, []); g.get(r.groupe).push(f(r)); } return [...g.values()].map(moy); };
  const gains = parGroupe(E, (r) => r.gain), C = R.filter((r) => r.classement != null);
  return { series: R.length, etats, changent: R.filter((r) => r.decide != null && r.decide !== 0).length, decision_plus_basse: R.filter((r) => r.decide < 0).length, decision_plus_haute: R.filter((r) => r.decide > 0).length,
    decisions: Object.fromEntries(NIVEAUX.map((u) => [u, R.filter((r) => r.decide === u).length])), hors_grille_moyen: R.filter((r) => r.hors_grille != null).length ? moy(R.filter((r) => r.hors_grille != null).map((r) => r.hors_grille)) : null,
    R1: gains.length > 1 ? { groupes: gains.length, series: E.length, gain_moyen: moy(gains), gain_median: med(gains), series_en_gain: E.filter((r) => r.gain > 0).length, ...(({ t, seuil, etabli }) => ({ t, seuil, etabli }))(tUnilateral(gains)) } : { groupes: gains.length, series: E.length, valeurs: E.map((r) => Number(r.gain.toFixed(3))) },
    R2: { series: C.length, series_bien_classees: C.filter((r) => r.classement > 0).length, ...signes(parGroupe(C, (r) => r.classement)) } };
}

const dossier = process.argv[2], iS = process.argv.indexOf('--sortie');
const jus = lire(join(dossier, 'jus.csv')), thon = lire(join(dossier, 'thon.csv'));
const grouper = (L, cle, groupe, vers) => { const g = new Map(); for (const r of L) { const k = cle(r); if (!g.has(k)) g.set(k, { groupe: groupe(r), S: [] }); g.get(k).S.push(vers(r)); } for (const x of g.values()) x.S.sort((a, b) => a.semaine - b.semaine); return [...g.values()]; };
const versJus = (r) => ({ semaine: r.semaine, unites: r.unites, prix: r.prix, cout: r.prix * (1 - r.marge_pct / 100), promo: r.deal !== 0 || r.feat !== 0 });
const sJus = grouper(jus, (r) => `${r.magasin}|${r.marque}`, (r) => r.magasin, versJus);
const sansPromo = (series) => series.map(({ groupe, S }) => ({ groupe, S: S.filter((s) => !s.promo) }));
const sThon = grouper(thon, (r) => r.marque, (r) => r.marque, (r) => ({ semaine: r.semaine, unites: r.unites, prix: r.prix, cout: r.cout, promo: r.promotion !== 0 }));
const res = { protocole: 'programme/missions/prix-reel/PROTOCOLE_PRIX_REEL.md', donnees: { jus_lignes: jus.length, magasins: new Set(jus.map((r) => r.magasin)).size, marques: new Set(jus.map((r) => r.marque)).size, semaines_promo_pct: 100 * moy(sJus.flatMap((x) => x.S.map((s) => (s.promo ? 1 : 0)))), thon_lignes: thon.length },
  jus: etude(sJus), jus_sans_promotion: etude(sansPromo(sJus)), thon: etude(sThon), thon_sans_promotion: etude(sansPromo(sThon)) };
if (iS > 0) writeFileSync(process.argv[iS + 1], JSON.stringify(res, null, 1) + '\n');
console.log(JSON.stringify(res, null, 1));
