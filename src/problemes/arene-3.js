// ARÈNE-3 — décider un prix : l'arrêt anticipé à quatre semaines (tenant) face à la chaîne sans arrêt et à l'arrêt à trois semaines.
// Règles : programme/arene/REGLES.md ; protocole : programme/arene/PROTOCOLE_ARENE_3.md.
import { writeFileSync } from 'node:fs';
import * as L from '../adaptateurs/lavoisier.js';
import { couper, choisirObjet, coutUnitaire, donneesEssai, decider, margeVraie, planVers, prixDe, J1, BLOC } from './essai-prix.js';
import { planChaine, planPrudent } from './essai-prix-prudent.js';
import { arbitrer, direArene } from './arene.js';
import { estNet } from './arene-2.js';

export const TENANT_3 = 'arret4', PRETENDANTS_3 = ['sans_arret', 'arret3'];
const arr = (x, n = 5) => (x == null || !Number.isFinite(x) ? null : Number(x.toFixed(n)));
export function jouer3(graine, monde = 'arene3') {
  const t0 = Date.now(), nul = L.entreprisePilotee(graine, [], monde), avant = couper(nul.observe, J1), choix = choisirObjet(avant);
  if (!choix.objet) return { graine, ecartee: true, motif: `aucun objet éligible (${choix.objets} objets vendus)` };
  const { objet: tok, pref } = choix, coutAvant = coutUnitaire(avant, L.bilanMatiere(avant).corps, tok).cout;
  const courses = { nul }, lancer = (cle, plan) => (courses[cle] ??= L.entreprisePilotee(graine, plan, monde));
  const P = planPrudent(planChaine(), pref, coutAvant), essai = L.entreprisePilotee(graine, planVers(tok, pref, P), monde);
  const lire = (k) => { const niveaux = P.slice(0, k), obs = couper(essai.observe, J1 + BLOC * k), { corps } = L.bilanMatiere(obs), d = donneesEssai(obs, corps, tok, pref, niveaux); return decider({ table: d.table, loi: null, cout: coutUnitaire(obs, corps, tok).cout, pref, sansLoi: true }); };
  const d8 = lire(8), cle8 = `8:${d8.niveau}`, choisir = (k) => { const d = lire(k), net = d.par === 'table' && estNet(d.prevu); return { net, niveau: net ? d.niveau : d8.niveau, cle: net ? `${k}:${d.niveau}` : cle8, k }; };
  const a4 = choisir(4), a3 = choisir(3);
  lancer(cle8, planVers(tok, pref, P, d8.niveau));
  for (const a of [a4, a3]) if (a.net) lancer(a.cle, planVers(tok, pref, P.slice(0, a.k), a.niveau));
  lancer('tenu', [{ jour: J1, objet: tok, prix: prixDe(pref, 0) }]);
  const marges = {};
  for (const [cle, E] of Object.entries(courses)) { E.ouvrir(); marges[cle] = margeVraie(E, tok); }   // toutes les décisions sont prises : la vérité s'ouvre
  const nulT = marges.nul.total, gain = (cle) => arr((marges[cle].total - nulT) / Math.abs(nulT));
  return { graine, monde, ecartee: false, objet: tok, prix_reference: pref, cout_vrai: arr(marges.nul.cout_vrai, 3), plan: P, decision_sans_arret: d8.niveau, decision_arret4: a4.niveau, decision_arret3: a3.niveau, arret4: a4.net, arret3: a3.net,
    marge_temoin_nul: arr(nulT, 2), gains: { arret4: gain(a4.cle), sans_arret: gain(cle8), arret3: gain(a3.cle), tenu: gain('tenu') }, secs: arr((Date.now() - t0) / 1000, 1) };
}
export function arbitrer3(R) {
  const a = arbitrer(R, PRETENDANTS_3, [['arret4', 'decision_arret4'], ['sans_arret', 'decision_sans_arret'], ['arret3', 'decision_arret3']], TENANT_3), E = R.filter((r) => !r.ecartee);
  return { ...a, arrets4: E.filter((r) => r.arret4).length, arrets3: E.filter((r) => r.arret3).length, arret3_meme_decision_que_8: E.filter((r) => r.arret3 && r.decision_arret3 === r.decision_sans_arret).length, arret4_meme_decision_que_8: E.filter((r) => r.arret4 && r.decision_arret4 === r.decision_sans_arret).length };
}
export const direArene3 = (a) => `${direArene(a)}\narrêts à 4 semaines : ${a.arrets4} (même décision qu’à 8 : ${a.arret4_meme_decision_que_8}) · arrêts à 3 semaines : ${a.arrets3} (même décision qu’à 8 : ${a.arret3_meme_decision_que_8})`;

// Exécution unique (graines 8401 à 8600), consignée au registre : la clé du dossier interdit de la refaire.
export async function arene3Test(reg, { sortie = null, monde = 'arene3', graines = Array.from({ length: 200 }, (_, i) => 8401 + i) } = {}) {
  const P = 'arene#3';
  reg.ajouter({ probleme: P, type: 'probleme', cle: P, auteur: 'registre', titre: 'Arène, troisième tour : décider un prix — l’arrêt anticipé défend sa place',
    question: 'L’arrêt anticipé à quatre semaines, tenant depuis ARÈNE-2 de peu, tient-il face à la chaîne sans arrêt et à un arrêt à trois semaines ? Marge simulée.',
    source: { generateur: 'LAVOISIER src/bench/generator.js piloté (L2, demande sensible L2b, hasard commun L2c) ; protocole programme/arene/PROTOCOLE_ARENE_3.md', graine: `${graines[0]} à ${graines.at(-1)}`, statut: 'graines de test d’ARÈNE-3, exécution unique' },
    roles: { LAVOISIER: 'corps de l’entreprise, coût unitaire', CORTEX: 'plan d’essai', registre: 'règles d’arrêt à trois et quatre semaines' } });
  const R = [];
  for (const g of graines) {
    const r = jouer3(g, monde); R.push(r);
    if (r.ecartee) { reg.ajouter({ probleme: P, type: 'aveu', auteur: 'registre', motif: `Graine ${g} : écartée (${r.motif}).` }); continue; }
    const eur = (x) => Math.round(x * Math.abs(r.marge_temoin_nul));
    const idExp = reg.ajouter({ probleme: P, type: 'experience', auteur: 'registre', but: [],
      plan: { duree: `Graine ${g} : 26 semaines sur le prix de ${r.objet}, jours ${J1} à 364 ; essai lu à 3, 4 et 8 semaines${r.arret4 ? ' (tenant arrêté à 4 semaines)' : ''}`, niveaux: r.plan },
      cout_prevu: { raison: 'non chiffré d’avance : c’est ce que le tour mesure' }, risque: { reversible: true, note: 'entreprise simulée : rien ne sort, aucun euro réel n’est en jeu' }, autorisation: 'automatique' });
    reg.ajouter({ probleme: P, type: 'resultat', auteur: 'banc', experience: idExp,
      mesures: { essai_prix: true, graine: g, decision: r.decision_arret4, decide_par: r.arret4 ? 'table, arrêt à 4 semaines (tenant)' : 'table, 8 semaines (tenant)', juge_cortex: 'non sollicité', marge_temoin_nul: Math.round(r.marge_temoin_nul), gain_collectif: eur(r.gains.arret4), gain_aveugle_plus_25: null,
        gain_sans_arret: eur(r.gains.sans_arret), gain_arret_3_semaines: eur(r.gains.arret3), gain_prix_tenu: eur(r.gains.tenu), cout_vrai: r.cout_vrai, unite: '€ simulés, marge sur ventes de l’objet, jours 183 à 364' },
      cout_reel: { calcul_s: r.secs, jours: 182 } });
  }
  const a = arbitrer3(R), pct = (x) => `${(100 * x).toFixed(1)} %`;
  if (sortie) writeFileSync(sortie, JSON.stringify({ protocole: 'programme/arene/PROTOCOLE_ARENE_3.md', agregat: a, entreprises: R }, null, 1) + '\n');
  reg.ajouter({ probleme: P, type: 'jalon', auteur: 'registre', compte: 'collectif', travail: 'ARENE-3', mesure: 'gain moyen sur la marge de l’objet piloté, jours 183 à 364 : tenant et prétendants du troisième tour de l’arène (simulation)',
    avant: `tenant : arrêt anticipé à 4 semaines ${pct(a.moyennes.arret4)}`, apres: `sans arrêt ${pct(a.moyennes.sans_arret)} (${a.duels.sans_arret.verdict}), arrêt à 3 semaines ${pct(a.moyennes.arret3)} (${a.duels.arret3.verdict}) ; tenant après le tour : ${a.tenant_apres_le_tour}`, source: 'programme/arene/tour-3.json' });
  console.error(direArene3(a));
  return a;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const R = [];
  for (let g = 241; g <= 246; g++) { const r = jouer3(g); R.push(r); console.error(`graine ${g} : 8 sem. ${r.decision_sans_arret} · 4 sem. ${r.arret4 ? r.decision_arret4 : '—'} · 3 sem. ${r.arret3 ? r.decision_arret3 : '—'} · ${r.secs} s`); }
  console.log(direArene3(arbitrer3(R)));
}
