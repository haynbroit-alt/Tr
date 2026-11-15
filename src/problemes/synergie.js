// SYNERGIE — les huit combinaisons de moteurs dans l'essai de prix. Protocole : programme/synergie/PROTOCOLE_SYNERGIE.md.
// G : la décision suit la loi de GALILÉE si elle est retenue ; L : coût de LAVOISIER (décision, et plan prudent avec C) ;
// C : plan d'essai de CORTEX, sinon les huit premières semaines du plan naïf « avant / après ».
import * as L from '../adaptateurs/lavoisier.js';
import { couper, choisirObjet, coutUnitaire, donneesEssai, decider, loiEssai, margeVraie, planVers, prixDe, J1, BLOC, BLOCS_COURT, AVANT_APRES } from './essai-prix.js';
import { planChaine, planPrudent } from './essai-prix-prudent.js';

export const MOTEURS = ['G', 'L', 'C'], ENSEMBLES = ['', 'G', 'L', 'C', 'GL', 'GC', 'LC', 'GLC'];
const arr = (x, n = 5) => (x == null || !Number.isFinite(x) ? null : Number(x.toFixed(n)));
const fact = [1, 1, 2, 6];
// Valeur de Shapley de chaque moteur et interaction d'ensemble, à partir des huit valeurs v[S].
export function shapley(v) {
  const phi = Object.fromEntries(MOTEURS.map((m) => { let s = 0; for (const S of ENSEMBLES) if (!S.includes(m)) { const avec = ENSEMBLES.find((T) => T.length === S.length + 1 && T.includes(m) && [...S].every((x) => T.includes(x))); s += (fact[S.length] * fact[2 - S.length] / 6) * (v[avec] - v[S]); } return [m, s]; }));
  return { phi, interaction: v.GLC - v[''] - MOTEURS.reduce((s, m) => s + (v[m] - v['']), 0) };
}

export function mesurerSynergie(graine, monde = 'syn') {
  const t0 = Date.now(), nul = L.entreprisePilotee(graine, [], monde), avant = couper(nul.observe, J1), choix = choisirObjet(avant);
  if (!choix.objet) return { graine, ecartee: true, motif: `aucun objet éligible (${choix.objets} objets vendus)` };
  const { objet: tok, pref } = choix, coutAvant = coutUnitaire(avant, L.bilanMatiere(avant).corps, tok).cout;
  const courses = { nul }, lancer = (cle, plan) => (courses[cle] ??= L.entreprisePilotee(graine, plan, monde));
  const plans = { naif: AVANT_APRES.slice(0, BLOCS_COURT), cortex: planChaine(), prudent: planPrudent(planChaine(), pref, coutAvant) }, essais = {};
  for (const [nom, niveaux] of Object.entries(plans)) {
    const obs = couper(L.entreprisePilotee(graine, planVers(tok, pref, niveaux), monde).observe, J1 + BLOC * niveaux.length), { corps } = L.bilanMatiere(obs);
    const d = donneesEssai(obs, corps, tok, pref, niveaux);
    essais[nom] = { niveaux, table: d.table, loi: loiEssai(d.jours), cout: coutUnitaire(obs, corps, tok).cout };
  }
  const decisions = {}, cles = {};
  for (const S of ENSEMBLES) {
    const nom = !S.includes('C') ? 'naif' : S.includes('L') ? 'prudent' : 'cortex', e = essais[nom];
    const dec = decider({ table: e.table, loi: e.loi, cout: e.cout, pref, sansLoi: !S.includes('G'), sansCout: !S.includes('L') });
    decisions[S] = { plan: nom, niveau: dec.niveau, par: dec.par }; cles[S] = `${nom}:${dec.niveau}`; lancer(cles[S], planVers(tok, pref, e.niveaux, dec.niveau));
  }
  lancer('tenu', [{ jour: J1, objet: tok, prix: prixDe(pref, 0) }]);
  const marges = {};
  for (const [cle, E] of Object.entries(courses)) { E.ouvrir(); marges[cle] = margeVraie(E, tok); }   // toutes les décisions sont prises : la vérité s'ouvre
  const nulT = marges.nul.total, gain = (cle) => arr((marges[cle].total - nulT) / Math.abs(nulT)), v = Object.fromEntries(ENSEMBLES.map((S) => [S, gain(cles[S])]));
  return { graine, monde, ecartee: false, objet: tok, prix_reference: pref, cout_au_jour_183: arr(coutAvant, 3), cout_vrai: arr(marges.nul.cout_vrai, 3), plans, lois_retenues: Object.fromEntries(Object.entries(essais).map(([n, e]) => [n, Boolean(e.loi.retenue && !e.loi.sans_variable)])),
    decisions, marge_temoin_nul: arr(nulT, 2), v, tenu: gain('tenu'), ...shapley(v), secs: arr((Date.now() - t0) / 1000, 1) };
}

export async function agregerSynergie(R) {
  const { tUnilateral } = await import('../../scripts/t3.js');
  const E = R.filter((r) => !r.ecartee), moy = (f) => E.reduce((s, r) => s + f(r), 0) / E.length, t = (f) => tUnilateral(E.map(f));
  const v = Object.fromEntries(ENSEMBLES.map((S) => [S === '' ? 'aucun' : S, moy((r) => r.v[S])]));
  return { entreprises: R.length, mesurees: E.length, v, prix_tenu: moy((r) => r.tenu), Y1: t((r) => r.v.GLC - r.v['']), Y2: Object.fromEntries(MOTEURS.map((m) => [m, t((r) => r.phi[m])])), Y3: t((r) => r.interaction), Y4: t((r) => r.v.GLC - r.v.LC),
    Y4_inverse: t((r) => r.v.LC - r.v.GLC), paires: { LC: t((r) => r.v.LC - r.v.L - r.v.C + r.v['']), GL: t((r) => r.v.GL - r.v.G - r.v.L + r.v['']), GC: t((r) => r.v.GC - r.v.G - r.v.C + r.v['']) },
    chaine_contre_tenu: t((r) => r.v.LC - r.tenu), aucun_contre_tenu: t((r) => r.v[''] - r.tenu), loi_retenue: Object.fromEntries(['naif', 'cortex', 'prudent'].map((n) => [n, E.filter((r) => r.lois_retenues[n]).length])),
    decide_par_la_loi: E.filter((r) => r.decisions.GLC.par === 'loi').length, GLC_differe_de_LC: E.filter((r) => r.decisions.GLC.niveau !== r.decisions.LC.niveau).length };
}
export function direSynergie(a) {
  const pct = (x) => `${(100 * x).toFixed(1)} %`, t = (k) => `${pct(k.moyenne)}, t = ${k.t.toFixed(2)} (seuil ${k.seuil}) → ${k.etabli ? 'établi' : 'non établi'}`;
  return [`${a.mesurees} entreprises mesurées sur ${a.entreprises}`, ...Object.entries(a.v).map(([S, m]) => `  v(${S.padEnd(5)}) ${pct(m).padStart(8)}`), `  prix tenu ${pct(a.prix_tenu).padStart(8)}`,
    `Y1 les trois > aucun : ${t(a.Y1)}`, ...MOTEURS.map((m) => `Y2-${m} apport de Shapley > 0 : ${t(a.Y2[m])}`), `Y3 synergie I > 0 : ${t(a.Y3)}`, `Y4 les trois > LAVOISIER + CORTEX : ${t(a.Y4)} · inverse : ${t(a.Y4_inverse)}`,
    `interactions par paire — L×C : ${t(a.paires.LC)} · G×L : ${t(a.paires.GL)} · G×C : ${t(a.paires.GC)}`, `chaîne (L+C) > prix tenu : ${t(a.chaine_contre_tenu)} · aucun moteur > prix tenu : ${t(a.aucun_contre_tenu)}`,
    `loi retenue : ${JSON.stringify(a.loi_retenue)} · décision des trois prise par la loi : ${a.decide_par_la_loi} · décision des trois ≠ chaîne : ${a.GLC_differe_de_LC}`].join('\n');
}

// Exécution unique (graines 6901 à 7000), consignée au registre : la clé du dossier interdit de la refaire.
export async function synergieTest(reg, { sortie = null, monde = 'syn', graines = Array.from({ length: 100 }, (_, i) => 6901 + i) } = {}) {
  const P = 'synergie#1';
  reg.ajouter({ probleme: P, type: 'probleme', cle: P, auteur: 'registre', titre: 'Synergie des trois moteurs dans l’essai de prix : les huit combinaisons',
    question: 'Dans l’essai de prix, l’ensemble GALILÉE + LAVOISIER + CORTEX vaut-il plus que la somme de ce que chacun apporte seul ? Apports de Shapley et interaction, marge simulée.',
    source: { generateur: 'LAVOISIER src/bench/generator.js piloté (L2, demande sensible L2b, hasard commun L2c) ; protocole programme/synergie/PROTOCOLE_SYNERGIE.md', graine: `${graines[0]} à ${graines.at(-1)}`, statut: 'graines de test de SYNERGIE, exécution unique' },
    roles: { LAVOISIER: 'coût unitaire : décision par la marge, plan prudent', CORTEX: 'plan d’essai actif', GALILEE: 'loi de demande sur les ventes de l’essai' } });
  const R = [];
  for (const g of graines) {
    const r = mesurerSynergie(g, monde); R.push(r);
    if (r.ecartee) { reg.ajouter({ probleme: P, type: 'aveu', auteur: 'registre', motif: `Graine ${g} : écartée (${r.motif}).` }); continue; }
    const eur = (x) => Math.round(x * Math.abs(r.marge_temoin_nul));
    const idExp = reg.ajouter({ probleme: P, type: 'experience', auteur: 'registre', but: [],
      plan: { duree: `Graine ${g} : 8 semaines d’essai sur le prix de ${r.objet} puis décision, jours ${J1} à 364 ; huit combinaisons de moteurs, trois plans d’essai`, niveaux: r.plans.prudent },
      cout_prevu: { raison: 'non chiffré d’avance : c’est ce que l’essai mesure' }, risque: { reversible: true, note: 'entreprise simulée : rien ne sort, aucun euro réel n’est en jeu' }, autorisation: 'automatique' });
    reg.ajouter({ probleme: P, type: 'resultat', auteur: 'banc', experience: idExp,
      mesures: { essai_prix: true, graine: g, decision: r.decisions.GLC.niveau, decide_par: r.decisions.GLC.par, juge_cortex: 'non sollicité', marge_temoin_nul: Math.round(r.marge_temoin_nul), gain_collectif: eur(r.v.GLC), gain_aveugle_plus_25: null,
        gain_aucun_moteur: eur(r.v['']), gain_chaine: eur(r.v.LC), gain_prix_tenu: eur(r.tenu), interaction: eur(r.interaction), cout_vrai: r.cout_vrai, unite: '€ simulés, marge sur ventes de l’objet, jours 183 à 364' },
      cout_reel: { calcul_s: r.secs, jours: 182 } });
  }
  const a = await agregerSynergie(R), pct = (x) => `${(100 * x).toFixed(1)} %`;
  if (sortie) (await import('node:fs')).writeFileSync(sortie, JSON.stringify({ protocole: 'programme/synergie/PROTOCOLE_SYNERGIE.md', agregat: a, entreprises: R }, null, 1) + '\n');
  reg.ajouter({ probleme: P, type: 'jalon', auteur: 'registre', compte: 'collectif', travail: 'SYNERGIE', mesure: 'gain moyen sur la marge de l’objet piloté selon les moteurs présents, et interaction d’ensemble (simulation)',
    avant: `aucun moteur ${pct(a.v.aucun)}`, apres: `les trois ${pct(a.v.GLC)} ; LAVOISIER + CORTEX ${pct(a.v.LC)} ; apports de Shapley : LAVOISIER ${pct(a.Y2.L.moyenne)}, CORTEX ${pct(a.Y2.C.moyenne)}, GALILÉE ${pct(a.Y2.G.moyenne)} ; interaction ${pct(a.Y3.moyenne)}`, source: 'programme/synergie/test.json' });
  console.error(direSynergie(a));
  return a;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const opt = (n, d) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : d; }, [a, b] = opt('--graines', '241-243').split('-').map(Number);
  if (a < 241 || (b ?? a) > 260) { console.error('vérification du code : graines 241 à 260 seulement'); process.exit(1); }
  const R = [];
  for (let g = a; g <= (b ?? a); g++) { const r = mesurerSynergie(g); R.push(r); console.error(`graine ${g} : ${r.ecartee ? 'écartée' : `${ENSEMBLES.map((S) => `${S || '∅'} ${r.decisions[S].niveau}`).join(' · ')} · ${r.secs} s`}`); }
  console.log(direSynergie(await agregerSynergie(R)));
}
