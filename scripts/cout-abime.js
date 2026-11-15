// Épreuve COÛT-ABÎMÉ — protocole : programme/abime/PROTOCOLE_COUT_ABIME.md.
// Usage : COUT_TEST=exécution-unique node scripts/cout-abime.js --graines 8101-8160 --sortie programme/abime/cout.json   (vérification du code : --graines 241-242)
import { writeFileSync } from 'node:fs';
import * as L from '../src/adaptateurs/lavoisier.js';
import { couper, choisirObjet, coutUnitaire, margeVraie, J1 } from '../src/problemes/essai-prix.js';
import { abimer, DEGATS } from './journal-abime.js';
import { controler } from '../src/controle-journal.js';

const hasard = (graine) => { let a = graine >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
const med = (v) => { const s = v.filter((x) => x != null && Number.isFinite(x)).sort((a, b) => a - b); return s.length ? (s[Math.floor((s.length - 1) / 2)] + s[Math.ceil((s.length - 1) / 2)]) / 2 : null; };
const opt = (n, d) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : d; }, [a, b] = opt('--graines', '241-242').split('-').map(Number), lectures = [], ecartees = [];
for (let g = a; g <= b; g++) {
  const E = L.entreprisePilotee(g, [], 'cout'), avant = couper(E.observe, J1), choix = choisirObjet(avant), t0 = Date.now();
  if (!choix.objet) { ecartees.push(g); continue; }
  const tok = choix.objet, etats = { intact: avant, ...Object.fromEntries(DEGATS.map((d, i) => [d, abimer(avant, d, 0.05, hasard(g * 100 + i))])), tout: DEGATS.reduce((o, d, i) => abimer(o, d, 0.02, hasard(g * 100 + 90 + i)), avant) }, lues = [];
  for (const [etat, o] of Object.entries(etats)) for (const avec of [false, true]) {
    const obs = avec ? controler(o).observe : o; let cout = null, methode = null, exception = null;
    try { const c = coutUnitaire(obs, L.bilanMatiere(obs).corps, tok); cout = c.cout; methode = c.methode; } catch (e) { exception = String(e.message).slice(0, 200); }
    lues.push({ graine: g, etat, controle: avec, cout, methode, exception });
  }
  E.ouvrir();   // les seize lectures de cette entreprise sont faites : sa vérité s'ouvre
  const vrai = margeVraie(E, tok).cout_vrai;
  for (const l of lues) lectures.push({ ...l, cout_vrai: vrai, erreur: l.cout == null ? null : Math.abs(l.cout / vrai - 1) });
  console.error(`graine ${g} : ${((Date.now() - t0) / 1000).toFixed(1)} s`);
}
const cas = (etat, controle) => { const S = lectures.filter((l) => l.etat === etat && l.controle === controle);
  return { entreprises: S.length, juste: S.filter((l) => l.erreur != null && l.erreur < 0.05).length, exact: S.filter((l) => l.erreur != null && l.erreur < 0.001).length, faux_en_silence: S.filter((l) => l.erreur != null && l.erreur > 0.2).length,
    indisponible: S.filter((l) => l.cout == null && !l.exception).length, exceptions: S.filter((l) => l.exception).length, erreur_mediane: med(S.map((l) => l.erreur)) }; };
const noms = ['intact', ...DEGATS, 'tout'], T = Object.fromEntries(noms.flatMap((e) => [[e, cas(e, false)], [`${e}+contrôle`, cas(e, true)]])), n = T.intact.entreprises;
const abimes = lectures.filter((l) => l.etat !== 'intact' && !l.controle);
const criteres = { M1: Object.fromEntries(DEGATS.map((d) => [d, { juste: T[d].juste, sur: n, tenu: T[d].juste >= 0.9 * n }])),
  M2: { faux_en_silence: abimes.filter((l) => l.erreur != null && l.erreur > 0.2).length, lectures: abimes.length, tenu: abimes.filter((l) => l.erreur != null && l.erreur > 0.2).length <= 0.05 * abimes.length },
  M3: { juste_sain: T.intact.juste, juste_sain_avec_controle: T['intact+contrôle'].juste, doublons_avec_controle: T['doublon+contrôle'].juste, sur: n, tenu: T['intact+contrôle'].juste >= T.intact.juste - 1 && T['doublon+contrôle'].juste >= 0.9 * n } };
console.log(`${n} entreprises mesurées, ${ecartees.length} écartée(s)`);
console.log('cas                  juste  exact  faux en silence  indisponible  exceptions  erreur médiane');
for (const [nom, s] of Object.entries(T)) console.log(`${nom.padEnd(20)} ${String(s.juste).padStart(5)}  ${String(s.exact).padStart(5)}  ${String(s.faux_en_silence).padStart(15)}  ${String(s.indisponible).padStart(12)}  ${String(s.exceptions).padStart(10)}  ${s.erreur_mediane == null ? '—' : (100 * s.erreur_mediane).toFixed(2) + ' %'}`);
console.log(`M1 : ${Object.entries(criteres.M1).map(([d, c]) => `${d} ${c.juste}/${c.sur} ${c.tenu ? 'tenu' : 'manqué'}`).join(' · ')}`);
console.log(`M2 : ${criteres.M2.tenu ? 'tenu' : 'manqué'} ${JSON.stringify(criteres.M2)}`); console.log(`M3 : ${criteres.M3.tenu ? 'tenu' : 'manqué'} ${JSON.stringify(criteres.M3)}`);
if (opt('--sortie')) writeFileSync(opt('--sortie'), JSON.stringify({ protocole: 'programme/abime/PROTOCOLE_COUT_ABIME.md', moteur: L.IDENTITE, ecartees, criteres, cas: T, lectures }, null, 1) + '\n');
