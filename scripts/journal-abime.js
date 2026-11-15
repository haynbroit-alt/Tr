// Épreuve JOURNAL-ABÎMÉ — protocole : programme/abime/PROTOCOLE_JOURNAL_ABIME.md.
// Usage : node scripts/journal-abime.js [--graines 8001-8040] [--sortie programme/abime/resultats.json]
// LAVOISIER (copie gelée) lit le journal intact puis treize journaux abîmés ; la vérité ne s'ouvre qu'après toutes les lectures.
import { writeFileSync } from 'node:fs';
import * as L from '../src/adaptateurs/lavoisier.js';

export const DEGATS = ['perte', 'doublon', 'date', 'quantite', 'reference', 'montant'], TAUX = [0.05, 0.2];
const hasard = (graine) => { let a = graine >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
export function abimer(observe, degat, taux, u) {
  const fin = observe.jours - 1, journal = [];
  for (const r0 of observe.journal) {
    const r = { ...r0 }, touche = u() < taux;
    if (!touche) { journal.push(r); continue; }
    if (degat === 'perte') continue;
    if (degat === 'doublon') { journal.push(r, { ...r, id: `${r.id}~d` }); continue; }
    if (degat === 'date') r.jour = Math.max(0, Math.min(fin, r.jour + (u() < 0.5 ? -1 : 1) * (1 + Math.floor(u() * 7))));
    if (degat === 'quantite') r.quantite = null;
    if (degat === 'reference') { r.reference = null; r.contrepartie = null; }
    if (degat === 'montant' && r.montant != null) r.montant = Number((r.montant * 10).toFixed(2));
    journal.push(r);
  }
  const ids = new Set(journal.map((r) => r.id));   // une référence vers une ligne perdue ne pointe plus sur rien
  return { ...observe, journal: journal.map((r) => (r.reference && !ids.has(r.reference) ? { ...r, reference: null } : r)) };
}
export function variantes(observe, graine) {
  const V = [{ nom: 'intact', obs: observe }];
  DEGATS.forEach((d, i) => TAUX.forEach((t, j) => V.push({ nom: `${d}:${t}`, obs: abimer(observe, d, t, hasard(graine * 100 + i * 10 + j)) })));
  V.push({ nom: 'tout:0.02', obs: DEGATS.reduce((o, d, i) => abimer(o, d, 0.02, hasard(graine * 100 + 90 + i)), observe) });
  return V;
}
const med = (v) => { const s = v.filter((x) => x != null && Number.isFinite(x)).sort((a, b) => a - b); return s.length ? (s[Math.floor((s.length - 1) / 2)] + s[Math.ceil((s.length - 1) / 2)]) / 2 : null; };

if (import.meta.url === `file://${process.argv[1]}`) {
  const opt = (n, d) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : d; }, [a, b] = opt('--graines', '8001-8040').split('-').map(Number);
  const lectures = [];
  for (let g = a; g <= b; g++) {
    const E = process.argv.includes('--dev') ? L.entreprise(g) : L.entrepriseAbimee(g), t0 = Date.now();   // --dev : vérification du code sur les graines de développement de LAVOISIER
    for (const v of variantes(E.observe, g)) { let corps = null, exception = null; try { corps = L.bilanMatiere(v.obs).corps; } catch (e) { exception = String(e.message).slice(0, 200); } lectures.push({ graine: g, classe: E.classe, variante: v.nom, lignes: v.obs.journal.length, corps, exception, E }); }
    console.error(`graine ${g} (${E.classe.archetype}, ${E.classe.nHidden} flux cachés) : ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  }
  // toutes les lectures sont faites : la vérité s'ouvre
  for (const l of lectures) { l.E.ouvrir(); l.mesures = l.corps ? L.evaluer(l.E.verite, l.corps) : null; delete l.corps; }
  const noms = [...new Set(lectures.map((l) => l.variante))], parVariante = Object.fromEntries(noms.map((nom) => {
    const S = lectures.filter((l) => l.variante === nom), M = S.filter((l) => l.mesures).map((l) => l.mesures), somme = (k) => M.reduce((s, m) => s + (m[k] ?? 0), 0);
    return [nom, { lectures: S.length, exceptions: S.filter((l) => l.exception).length, P: med(M.map((m) => m.P)), S: med(M.map((m) => m.S)), L: med(M.map((m) => m.L)), F: med(M.map((m) => m.F)),
      flux_caches: somme('hiddenAbove'), flux_retrouves: somme('hiddenFound'), fausses_detections_par_entreprise: M.length ? somme('FD') / M.length : null }];
  }));
  const I = parVariante.intact, v = (n) => parVariante[n];
  const criteres = { B1: { exceptions: lectures.filter((l) => l.exception).length, tenu: lectures.every((l) => !l.exception) },
    B2: { P: v('doublon:0.05').P, P_intact: I.P, FD: v('doublon:0.05').fausses_detections_par_entreprise, FD_intact: I.fausses_detections_par_entreprise, tenu: v('doublon:0.05').P <= 2 * I.P && v('doublon:0.05').fausses_detections_par_entreprise <= I.fausses_detections_par_entreprise + 0.5 },
    B3: { retrouves: v('date:0.05').flux_retrouves, retrouves_intact: I.flux_retrouves, FD: v('date:0.05').fausses_detections_par_entreprise, FD_intact: I.fausses_detections_par_entreprise, tenu: v('date:0.05').flux_retrouves >= 0.8 * I.flux_retrouves && v('date:0.05').fausses_detections_par_entreprise <= I.fausses_detections_par_entreprise + 0.5 },
    B4: { L: v('reference:0.05').L, L_intact: I.L, tenu: v('reference:0.05').L >= I.L - 0.05 },
    B5: { P: v('montant:0.05').P, P_intact: I.P, tenu: v('montant:0.05').P <= 2 * I.P } };
  const f = (x, n = 3) => (x == null ? '—' : x.toFixed(n));
  console.log('variante          lect. exc.   P        S        L        F     flux retrouvés   FD/entreprise');
  for (const [nom, s] of Object.entries(parVariante)) console.log(`${nom.padEnd(16)} ${String(s.lectures).padStart(5)} ${String(s.exceptions).padStart(4)}  ${f(s.P, 4).padStart(7)}  ${f(s.S, 4).padStart(7)}  ${f(s.L).padStart(6)}  ${f(s.F).padStart(6)}   ${String(s.flux_retrouves).padStart(3)} sur ${String(s.flux_caches).padEnd(3)}      ${f(s.fausses_detections_par_entreprise, 2)}`);
  for (const [k, c] of Object.entries(criteres)) console.log(`${k} : ${c.tenu ? 'tenu' : 'manqué'} ${JSON.stringify(c)}`);
  if (opt('--sortie')) writeFileSync(opt('--sortie'), JSON.stringify({ protocole: 'programme/abime/PROTOCOLE_JOURNAL_ABIME.md', moteur: L.IDENTITE, criteres, par_variante: parVariante, lectures: lectures.map(({ E, ...l }) => l) }, null, 1) + '\n');
}
