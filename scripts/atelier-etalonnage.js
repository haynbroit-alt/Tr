// ÉTALONNAGE de l'atelier — protocole : programme/t3h/PROTOCOLE_ETALONNAGE.md.
// Usage : node scripts/atelier-etalonnage.js [--sortie programme/t3h/etalonnage.json]
import { readFileSync, writeFileSync } from 'node:fs';
import { atelier, appliquer } from '../src/atelier.js';
import { lignes, ACTIONS, TRAITS } from '../src/problemes/essai-prix-atelier.js';

const REPETITIONS = 200, PLANTES = ['m', 'e', 't', 'bruit'], DELTAS = [0.05, 0.1, 0.2];
const hasard = (graine) => { let a = graine >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
const base = lignes(JSON.parse(readFileSync('programme/t3h/dev.json', 'utf8')).entreprises);
const brouiller = (u) => { const p = base.map((_, i) => i); for (let i = p.length - 1; i > 0; i--) { const j = Math.floor(u() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; } return base.map((l, i) => ({ traits: base[p[i]].traits, gains: { ...l.gains } })); };
const mediane = (v) => { const s = v.filter((x) => x != null).sort((a, b) => a - b); return s[s.length >> 1]; };

const rien = { repetitions: REPETITIONS, fausses_inventions: 0, profondeurs: {} };
for (let k = 0; k < REPETITIONS; k++) { const r = atelier(brouiller(hasard(1000 + k)), { actions: ACTIONS, traits: TRAITS }); if (!r.refus) { rien.fausses_inventions++; rien.profondeurs[r.profondeur] = (rien.profondeurs[r.profondeur] ?? 0) + 1; } }
const plante = {};
for (const delta of DELTAS) {
  const s = { repetitions: REPETITIONS, trouve: 0, refus: 0, regle_a_cote: 0, profondeurs: {} };
  for (let k = 0; k < REPETITIONS; k++) {
    const L = brouiller(hasard(5000 + k)), trait = PLANTES[k % PLANTES.length], med = mediane(L.map((l) => l.traits[trait])), vise = (l) => l.traits[trait] != null && l.traits[trait] < med;
    for (const l of L) if (vise(l)) l.gains.tenu = l.gains.chaine + delta;
    const r = atelier(L, { actions: ACTIONS, traits: TRAITS });
    if (r.refus) { s.refus++; continue; }
    const V = L.filter(vise), A = L.filter((l) => !vise(l)), part = (S) => S.filter((l) => appliquer(r.regle, l.traits) === 'tenu').length / S.length;
    if (part(V) >= 0.7 && part(A) <= 0.3) { s.trouve++; s.profondeurs[r.profondeur] = (s.profondeurs[r.profondeur] ?? 0) + 1; } else s.regle_a_cote++;
  }
  plante[delta] = s;
}
const criteres = { E1: { taux: rien.fausses_inventions / REPETITIONS, tenu: rien.fausses_inventions / REPETITIONS <= 0.1 }, E2: { taux: plante[0.2].trouve / REPETITIONS, tenu: plante[0.2].trouve / REPETITIONS >= 0.8 } };
console.log(JSON.stringify({ rien_a_trouver: rien, effet_plante: plante, criteres }, null, 1));
const i = process.argv.indexOf('--sortie');
if (i > 0) writeFileSync(process.argv[i + 1], JSON.stringify({ protocole: 'programme/t3h/PROTOCOLE_ETALONNAGE.md', entreprises: base.length, rien_a_trouver: rien, effet_plante: plante, criteres }, null, 1) + '\n');
