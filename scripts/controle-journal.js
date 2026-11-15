// Épreuve CONTRÔLE — protocole : programme/abime/PROTOCOLE_CONTROLE.md.
// Usage : node scripts/controle-journal.js [--graines 8041-8080] [--sortie programme/abime/controle.json]   (--dev : graines de développement de LAVOISIER)
import { writeFileSync } from 'node:fs';
import * as L from '../src/adaptateurs/lavoisier.js';
import { abimer, DEGATS } from './journal-abime.js';
import { controler } from '../src/controle-journal.js';

const hasard = (graine) => { let a = graine >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
const med = (v) => { const s = v.filter((x) => x != null && Number.isFinite(x)).sort((a, b) => a - b); return s.length ? (s[Math.floor((s.length - 1) / 2)] + s[Math.ceil((s.length - 1) / 2)]) / 2 : null; };
const opt = (n, d) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : d; }, [a, b] = opt('--graines', '8041-8080').split('-').map(Number), lectures = [];
for (let g = a; g <= b; g++) {
  const E = process.argv.includes('--dev') ? L.entreprise(g) : L.entrepriseAbimee(g), t0 = Date.now(), o = E.observe;
  const etats = { intact: o, doublon: abimer(o, 'doublon', 0.05, hasard(g * 100 + 10)), montant: abimer(o, 'montant', 0.05, hasard(g * 100 + 50)), tout: DEGATS.reduce((x, d, i) => abimer(x, d, 0.02, hasard(g * 100 + 90 + i)), o) }, lues = [];
  for (const [etat, obs] of Object.entries(etats)) for (const avec of [false, true]) {
    const c = avec ? controler(obs) : null; let corps = null, exception = null;
    try { corps = L.bilanMatiere(avec ? c.observe : obs).corps; } catch (e) { exception = String(e.message).slice(0, 200); }
    lues.push({ graine: g, etat, controle: avec, rapport: c?.rapport ?? null, corps, exception });
  }
  E.ouvrir();   // les huit lectures de cette entreprise sont faites : sa vérité s'ouvre
  for (const l of lues) { l.mesures = l.corps ? L.evaluer(E.verite, l.corps) : null; delete l.corps; lectures.push(l); }
  console.error(`graine ${g} (${E.classe.archetype}) : ${((Date.now() - t0) / 1000).toFixed(1)} s`);
}
const cas = (etat, controle) => { const S = lectures.filter((l) => l.etat === etat && l.controle === controle), M = S.filter((l) => l.mesures).map((l) => l.mesures), somme = (k) => M.reduce((s, m) => s + (m[k] ?? 0), 0);
  return { lectures: S.length, exceptions: S.filter((l) => l.exception).length, flux_caches: somme('hiddenAbove'), flux_retrouves: somme('hiddenFound'), fausses_detections_par_entreprise: M.length ? somme('FD') / M.length : null, P: med(M.map((m) => m.P)), L: med(M.map((m) => m.L)),
    alertes: controle ? S.filter((l) => l.rapport.alerte).length : null, part_touchee_mediane: controle ? med(S.map((l) => l.rapport.part_touchee)) : null }; };
const T = Object.fromEntries(['intact', 'doublon', 'montant', 'tout'].flatMap((e) => [[`${e}`, cas(e, false)], [`${e}+contrôle`, cas(e, true)]])), ref = T.intact;
const abimes = ['doublon', 'montant', 'tout'].map((e) => T[`${e}+contrôle`]), nAb = abimes.reduce((s, x) => s + x.lectures, 0), alAb = abimes.reduce((s, x) => s + x.alertes, 0);
const criteres = { K1: { retrouves: T['intact+contrôle'].flux_retrouves, reference: ref.flux_retrouves, FD: T['intact+contrôle'].fausses_detections_par_entreprise, FD_reference: ref.fausses_detections_par_entreprise, tenu: T['intact+contrôle'].flux_retrouves >= ref.flux_retrouves - 2 && T['intact+contrôle'].fausses_detections_par_entreprise <= ref.fausses_detections_par_entreprise + 0.2 },
  K2: { retrouves: T['doublon+contrôle'].flux_retrouves, sans_controle: T.doublon.flux_retrouves, reference: ref.flux_retrouves, tenu: T['doublon+contrôle'].flux_retrouves >= 0.8 * ref.flux_retrouves },
  K3: { retrouves: T['montant+contrôle'].flux_retrouves, sans_controle: T.montant.flux_retrouves, reference: ref.flux_retrouves, P: T['montant+contrôle'].P, P_reference: ref.P, tenu: T['montant+contrôle'].flux_retrouves >= 0.8 * ref.flux_retrouves && T['montant+contrôle'].P <= 2 * ref.P },
  K4: { alertes_abimes: alAb, journaux_abimes: nAb, fausses_alertes: T['intact+contrôle'].alertes, journaux_intacts: T['intact+contrôle'].lectures, tenu: alAb >= 0.95 * nAb && T['intact+contrôle'].alertes <= 0.1 * T['intact+contrôle'].lectures } };
criteres.succession = criteres.K1.tenu && (criteres.K2.tenu || criteres.K3.tenu) ? 'le prétendant prend la place' : 'le tenant garde sa place';
const f = (x, n = 3) => (x == null ? '—' : x.toFixed(n));
console.log('cas                 flux retrouvés   FD/entr.   P        L      alertes');
for (const [nom, s] of Object.entries(T)) console.log(`${nom.padEnd(18)}  ${String(s.flux_retrouves).padStart(3)} sur ${String(s.flux_caches).padEnd(3)}      ${f(s.fausses_detections_par_entreprise, 2)}     ${f(s.P, 4)}  ${f(s.L)}   ${s.alertes ?? '—'}${s.alertes != null ? ` sur ${s.lectures}` : ''}${s.exceptions ? `  (${s.exceptions} exceptions)` : ''}`);
for (const [k, c] of Object.entries(criteres)) console.log(`${k} : ${typeof c === 'string' ? c : `${c.tenu ? 'tenu' : 'manqué'} ${JSON.stringify(c)}`}`);
if (opt('--sortie')) writeFileSync(opt('--sortie'), JSON.stringify({ protocole: 'programme/abime/PROTOCOLE_CONTROLE.md', moteur: L.IDENTITE, criteres, cas: T, lectures }, null, 1) + '\n');
