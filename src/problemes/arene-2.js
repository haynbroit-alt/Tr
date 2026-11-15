// ARÈNE-2 — décider un prix : la chaîne prudente (tenant) face au plan naïf et à l'arrêt anticipé.
// Règles : programme/arene/REGLES.md ; protocole : programme/arene/PROTOCOLE_ARENE_2.md.
import { writeFileSync } from 'node:fs';
import * as L from '../adaptateurs/lavoisier.js';
import { couper, choisirObjet, coutUnitaire, donneesEssai, decider, margeVraie, planVers, prixDe, J1, BLOC, BLOCS_COURT, AVANT_APRES } from './essai-prix.js';
import { planChaine, planPrudent } from './essai-prix-prudent.js';
import { arbitrer, direArene } from './arene.js';

export const PRETENDANTS_2 = ['naif', 'anticipe'], SEMAINES_ARRET = 4, ECART_NET = 1.2;
const arr = (x, n = 5) => (x == null || !Number.isFinite(x) ? null : Number(x.toFixed(n)));
// Net : le meilleur niveau essayé dépasse le deuxième d'au moins 20 % en marge par jour (et il gagne de l'argent).
export function estNet(prevu) {
  const v = Object.values(prevu ?? {}).filter((x) => x != null).sort((a, b) => b - a);
  return v.length >= 2 && v[0] > 0 && v[0] >= ECART_NET * Math.max(v[1], 0) && (v[1] > 0 || v[0] > 0);
}
export function jouer(graine, monde = 'arene2') {
  const t0 = Date.now(), nul = L.entreprisePilotee(graine, [], monde), avant = couper(nul.observe, J1), choix = choisirObjet(avant);
  if (!choix.objet) return { graine, ecartee: true, motif: `aucun objet éligible (${choix.objets} objets vendus)` };
  const { objet: tok, pref } = choix, coutAvant = coutUnitaire(avant, L.bilanMatiere(avant).corps, tok).cout;
  const courses = { nul }, lancer = (cle, plan) => (courses[cle] ??= L.entreprisePilotee(graine, plan, monde));
  const lire = (essai, niveaux) => { const obs = couper(essai.observe, J1 + BLOC * niveaux.length), { corps } = L.bilanMatiere(obs), d = donneesEssai(obs, corps, tok, pref, niveaux); return decider({ table: d.table, loi: null, cout: coutUnitaire(obs, corps, tok).cout, pref, sansLoi: true }); };
  const P = planPrudent(planChaine(), pref, coutAvant), N = AVANT_APRES.slice(0, BLOCS_COURT), essaiP = L.entreprisePilotee(graine, planVers(tok, pref, P), monde);
  const dT = lire(essaiP, P), d4 = lire(essaiP, P.slice(0, SEMAINES_ARRET)), arret = d4.par === 'table' && estNet(d4.prevu), dN = lire(L.entreprisePilotee(graine, planVers(tok, pref, N), monde), N);
  lancer(`chaine:${dT.niveau}`, planVers(tok, pref, P, dT.niveau)); lancer(`naif:${dN.niveau}`, planVers(tok, pref, N, dN.niveau));
  if (arret) lancer(`arret:${d4.niveau}`, planVers(tok, pref, P.slice(0, SEMAINES_ARRET), d4.niveau));
  lancer('tenu', [{ jour: J1, objet: tok, prix: prixDe(pref, 0) }]);
  const marges = {};
  for (const [cle, E] of Object.entries(courses)) { E.ouvrir(); marges[cle] = margeVraie(E, tok); }   // toutes les décisions sont prises : la vérité s'ouvre
  const nulT = marges.nul.total, gain = (cle) => arr((marges[cle].total - nulT) / Math.abs(nulT));
  return { graine, monde, ecartee: false, objet: tok, prix_reference: pref, cout_au_jour_183: arr(coutAvant, 3), cout_vrai: arr(marges.nul.cout_vrai, 3), plan_chaine: P, decision_chaine: dT.niveau, decision_naif: dN.niveau, arret_anticipe: arret, decision_anticipe: arret ? d4.niveau : dT.niveau,
    marge_temoin_nul: arr(nulT, 2), gains: { chaine: gain(`chaine:${dT.niveau}`), naif: gain(`naif:${dN.niveau}`), anticipe: arret ? gain(`arret:${d4.niveau}`) : gain(`chaine:${dT.niveau}`), tenu: gain('tenu') }, secs: arr((Date.now() - t0) / 1000, 1) };
}
export function arbitrer2(R) {
  const a = arbitrer(R, PRETENDANTS_2, [['chaine', 'decision_chaine'], ['naif', 'decision_naif'], ['anticipe', 'decision_anticipe']]), E = R.filter((r) => !r.ecartee), S = E.filter((r) => r.arret_anticipe);
  const moy = (v) => (v.length ? v.reduce((x, y) => x + y, 0) / v.length : null);
  return { ...a, arrets: S.length, arret_meme_decision: S.filter((r) => r.decision_anticipe === r.decision_chaine).length, ecart_quand_arret: moy(S.map((r) => r.gains.anticipe - r.gains.chaine)), arret_mieux: S.filter((r) => r.gains.anticipe > r.gains.chaine).length };
}
export const direArene2 = (a) => `${direArene(a)}\narrêts à quatre semaines : ${a.arrets} sur ${a.mesurees} · même décision que le tenant : ${a.arret_meme_decision} · mieux que le tenant : ${a.arret_mieux} · écart moyen quand il s’arrête : ${a.ecart_quand_arret == null ? '—' : (100 * a.ecart_quand_arret).toFixed(1) + ' points'}`;

// Exécution unique (graines 8201 à 8400), consignée au registre : la clé du dossier interdit de la refaire.
export async function arene2Test(reg, { sortie = null, monde = 'arene2', graines = Array.from({ length: 200 }, (_, i) => 8201 + i) } = {}) {
  const P = 'arene#2';
  reg.ajouter({ probleme: P, type: 'probleme', cle: P, auteur: 'registre', titre: 'Arène, deuxième tour : décider un prix — la chaîne prudente face au plan naïf et à l’arrêt anticipé',
    question: 'Avec le coût de LAVOISIER, un plan d’essai naïf fait-il aussi bien que celui de CORTEX ? Et lire l’essai au bout de quatre semaines, pour s’arrêter quand la réponse est nette, fait-il mieux que d’aller au bout ? Marge simulée.',
    source: { generateur: 'LAVOISIER src/bench/generator.js piloté (L2, demande sensible L2b, hasard commun L2c) ; protocole programme/arene/PROTOCOLE_ARENE_2.md', graine: `${graines[0]} à ${graines.at(-1)}`, statut: 'graines de test d’ARÈNE-2, exécution unique' },
    roles: { LAVOISIER: 'corps de l’entreprise, coût unitaire', CORTEX: 'plan d’essai du tenant et de l’arrêt anticipé', registre: 'prétendants : plan naïf, arrêt anticipé à quatre semaines' } });
  const R = [];
  for (const g of graines) {
    const r = jouer(g, monde); R.push(r);
    if (r.ecartee) { reg.ajouter({ probleme: P, type: 'aveu', auteur: 'registre', motif: `Graine ${g} : écartée (${r.motif}).` }); continue; }
    const eur = (x) => Math.round(x * Math.abs(r.marge_temoin_nul));
    const idExp = reg.ajouter({ probleme: P, type: 'experience', auteur: 'registre', but: [],
      plan: { duree: `Graine ${g} : 26 semaines sur le prix de ${r.objet}, jours ${J1} à 364 ; tenant (8 semaines d’essai) face au plan naïf et à l’arrêt anticipé${r.arret_anticipe ? ' (arrêté à 4 semaines)' : ''}`, niveaux: r.plan_chaine },
      cout_prevu: { raison: 'non chiffré d’avance : c’est ce que le tour mesure' }, risque: { reversible: true, note: 'entreprise simulée : rien ne sort, aucun euro réel n’est en jeu' }, autorisation: 'automatique' });
    reg.ajouter({ probleme: P, type: 'resultat', auteur: 'banc', experience: idExp,
      mesures: { essai_prix: true, graine: g, decision: r.decision_chaine, decide_par: 'table, plan prudent (tenant)', juge_cortex: 'non sollicité', marge_temoin_nul: Math.round(r.marge_temoin_nul), gain_collectif: eur(r.gains.chaine), gain_aveugle_plus_25: null,
        gain_plan_naif: eur(r.gains.naif), gain_arret_anticipe: eur(r.gains.anticipe), arret_anticipe: r.arret_anticipe, gain_prix_tenu: eur(r.gains.tenu), cout_vrai: r.cout_vrai, unite: '€ simulés, marge sur ventes de l’objet, jours 183 à 364' },
      cout_reel: { calcul_s: r.secs, jours: 182 } });
  }
  const a = arbitrer2(R), pct = (x) => `${(100 * x).toFixed(1)} %`;
  if (sortie) writeFileSync(sortie, JSON.stringify({ protocole: 'programme/arene/PROTOCOLE_ARENE_2.md', agregat: a, entreprises: R }, null, 1) + '\n');
  reg.ajouter({ probleme: P, type: 'jalon', auteur: 'registre', compte: 'collectif', travail: 'ARENE-2', mesure: 'gain moyen sur la marge de l’objet piloté, jours 183 à 364 : tenant et prétendants du deuxième tour de l’arène (simulation)',
    avant: `tenant : chaîne prudente ${pct(a.moyennes.chaine)}`, apres: `plan naïf ${pct(a.moyennes.naif)} (${a.duels.naif.verdict}), arrêt anticipé ${pct(a.moyennes.anticipe)} (${a.duels.anticipe.verdict}) ; tenant après le tour : ${a.tenant_apres_le_tour}`, source: 'programme/arene/tour-2.json' });
  console.error(direArene2(a));
  return a;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const opt = (n, d) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : d; }, [a, b] = opt('--graines', '241-243').split('-').map(Number);
  if (a < 241 || (b ?? a) > 260) { console.error('vérification du code : graines 241 à 260 seulement'); process.exit(1); }
  const R = [];
  for (let g = a; g <= (b ?? a); g++) { const r = jouer(g); R.push(r); console.error(`graine ${g} : ${r.ecartee ? 'écartée' : `chaîne ${r.decision_chaine} · naïf ${r.decision_naif} · ${r.arret_anticipe ? `arrêt à 4 semaines sur ${r.decision_anticipe}` : 'pas d’arrêt'} · ${r.secs} s`}`); }
  console.log(direArene2(arbitrer2(R)));
}
