// Essai de prix T3h — prédire les perdantes avant l'essai, par l'atelier. Protocole : programme/t3h/PROTOCOLE_T3H.md.
// Usage (atelier seulement, graines 301 à 500) :
//   node src/problemes/essai-prix-atelier.js --lot 301-500 --sortie programme/t3h/dev.json
//   node src/problemes/essai-prix-atelier.js --atelier programme/t3h/dev.json --sortie programme/t3h/politique.json
import { readFileSync, writeFileSync } from 'node:fs';
import * as L from '../adaptateurs/lavoisier.js';
import { couper, choisirObjet, coutUnitaire, donneesEssai, decider, loiEssai, margeVraie, planVers, prixDe, J1, BLOC, PAS, NIVEAUX } from './essai-prix.js';
import { planChaine, planPrudent } from './essai-prix-prudent.js';
import { sigmaAvant } from './essai-prix-bandit.js';
import { atelier, appliquer, borne } from '../atelier.js';

export const SEMAINES_AVANT = 26, G_MAX = 9.99;
export const TRAITS = ['m', 'e', 't', 'etendue', 'g', 'g_galilee', 'loi_retenue', 'bruit'];
export const ACTIONS = ['tenu', 'chaine', 'direct', 'direct_galilee', 'niveau:-1', 'niveau:-0.5', 'niveau:0.5', 'niveau:1'], ACTIONS_RESTREINTES = ['tenu', 'chaine'];
const arr = (x, n = 3) => (x == null || !Number.isFinite(x) ? null : Number(x.toFixed(n)));
const estVente = (r) => r.montant != null && r.quantite;

// Les 26 semaines d'avant le jour 183 : quantité vendue et prix moyen de chaque semaine où l'objet s'est vendu.
export function semainesAvant(obs, tok) {
  const q = new Float64Array(SEMAINES_AVANT), ca = new Float64Array(SEMAINES_AVANT), debut = J1 - 7 * SEMAINES_AVANT;
  for (const r of obs.journal) if (r.objet === tok && estVente(r) && r.jour >= debut && r.jour < J1) { const k = Math.floor((r.jour - debut) / 7); q[k] += Math.abs(r.quantite); ca[k] += Math.abs(r.montant); }
  return Array.from(q, (x, k) => ({ q: x, p: x > 0 ? ca[k] / x : null })).filter((s) => s.q > 0);
}
// Droite des moindres carrés de ln(quantité) sur ln(prix) : e = −pente.
export function sensibilite(S) {
  const x = S.map((s) => Math.log(s.p)), y = S.map((s) => Math.log(s.q)), n = S.length;
  if (n < 4) return { e: null, se: null, etendue: null };
  const mx = x.reduce((a, b) => a + b, 0) / n, my = y.reduce((a, b) => a + b, 0) / n, sxx = x.reduce((s, v) => s + (v - mx) ** 2, 0), etendue = Math.sqrt(sxx / (n - 1));
  if (!(sxx > 1e-12)) return { e: null, se: null, etendue };
  const b = x.reduce((s, v, i) => s + (v - mx) * (y[i] - my), 0) / sxx, sse = y.reduce((s, v, i) => s + (v - my - b * (x[i] - mx)) ** 2, 0);
  return { e: -b, se: Math.sqrt(sse / (n - 2) / sxx), etendue };
}
// Niveau qui maximise (prix − coût) × demande prévue, et gain relatif prévu sur le prix tenu. Égalité : le plus proche de 0.
export function niveauPrevu(pref, cout, demande) {
  if (!(cout > 0) || !demande) return { u: 0, g: null };
  const v = NIVEAUX.map((u) => ({ u, v: (prixDe(pref, u) - cout) * demande(u) }));
  if (v.some((x) => !Number.isFinite(x.v))) return { u: 0, g: null };
  const max = Math.max(...v.map((x) => x.v)), best = v.filter((x) => x.v >= max - 1e-9 * Math.abs(max)).sort((a, b) => Math.abs(a.u) - Math.abs(b.u))[0], v0 = v.find((x) => x.u === 0).v;
  return { u: best.u, g: best.u === 0 ? 0 : v0 > 0 ? Math.min(G_MAX, best.v / v0 - 1) : G_MAX };
}
export function traitsAvant(obs, tok, pref, cout, { avecGalilee = true } = {}) {
  const S = semainesAvant(obs, tok), { e, se, etendue } = sensibilite(S), ols = niveauPrevu(pref, cout, e == null ? null : (u) => PAS ** (-e * u));
  let loi = null, gal = { u: 0, g: null };
  if (avecGalilee && S.length >= 4) {
    loi = loiEssai(S.map((s) => ({ u: Math.log(s.p / pref) / Math.log(PAS), q: s.q / 7 })));
    if (loi.retenue && !loi.sans_variable && loi.f) gal = niveauPrevu(pref, cout, (u) => { const y = loi.f(PAS ** u); return Number.isFinite(y) && y >= 0 ? y : NaN; });
  }
  const retenue = Boolean(loi?.retenue && !loi.sans_variable && loi.f), sigma = cout > 0 ? sigmaAvant(obs, tok, cout) : null;
  const margeHebdo = cout > 0 ? S.reduce((s, x) => s + (x.p - cout) * x.q, 0) / SEMAINES_AVANT : null;
  return { traits: { m: cout > 0 ? arr(pref / cout) : null, e: arr(e), t: e != null && se > 0 ? arr(e / se) : null, etendue: arr(etendue, 4), g: arr(ols.g), g_galilee: retenue ? arr(gal.g) : null, loi_retenue: retenue ? 1 : 0,
      bruit: sigma != null && margeHebdo > 0 ? arr(sigma / margeHebdo) : null },
    niveau_direct: ols.u, niveau_galilee: retenue ? gal.u : 0, loi: loi ? { texte: loi.loi, retenue: Boolean(loi.retenue), sans_variable: Boolean(loi.sans_variable) } : null, semaines: S.length };
}

// Une entreprise : ce que l'atelier peut lire au jour 183, puis les huit actions, toutes simulées.
export function mesurer(graine, monde = 't3h') {
  const t0 = Date.now(), nul = L.entreprisePilotee(graine, [], monde), avant = couper(nul.observe, J1), choix = choisirObjet(avant);
  if (!choix.objet) return { graine, ecartee: true, motif: `aucun objet éligible (${choix.objets} objets vendus)` };
  const { objet: tok, pref } = choix, cout = coutUnitaire(avant, L.bilanMatiere(avant).corps, tok).cout, lu = traitsAvant(avant, tok, pref, cout);
  const courses = { nul }, lancer = (cle, plan) => (courses[cle] ??= L.entreprisePilotee(graine, plan, monde));
  for (const u of NIVEAUX) lancer(`aveugle:${u}`, [{ jour: J1, objet: tok, prix: prixDe(pref, u) }]);
  const P = planPrudent(planChaine(), pref, cout), obs = couper(L.entreprisePilotee(graine, planVers(tok, pref, P), monde).observe, J1 + BLOC * P.length);
  const { corps } = L.bilanMatiere(obs), d = donneesEssai(obs, corps, tok, pref, P), dec = decider({ table: d.table, loi: null, cout: coutUnitaire(obs, corps, tok).cout, pref, sansLoi: true }).niveau;
  lancer(`chaine:${dec}`, planVers(tok, pref, P, dec));
  const marges = {};
  for (const [cle, E] of Object.entries(courses)) { E.ouvrir(); marges[cle] = margeVraie(E, tok); }   // toutes les décisions sont prises : la vérité s'ouvre
  const total = (cle) => marges[cle].total, nulT = total('nul'), gain = (cle) => arr((total(cle) - nulT) / Math.abs(nulT), 5);
  const gains = { tenu: gain('aveugle:0'), chaine: gain(`chaine:${dec}`), direct: gain(`aveugle:${lu.niveau_direct}`), direct_galilee: gain(`aveugle:${lu.niveau_galilee}`), ...Object.fromEntries([-1, -0.5, 0.5, 1].map((u) => [`niveau:${u}`, gain(`aveugle:${u}`)])) };
  return { graine, monde, ecartee: false, objet: tok, prix_reference: pref, cout_au_jour_183: arr(cout), cout_vrai: arr(marges.nul.cout_vrai), ...lu, plan_chaine: P, decision_chaine: dec, marge_temoin_nul: arr(nulT, 2), gains, secs: arr((Date.now() - t0) / 1000, 1) };
}
export const lignes = (R) => R.filter((r) => !r.ecartee).map((r) => ({ graine: r.graine, traits: r.traits, gains: r.gains }));
export function ecrireRegles(R) {
  const Lg = lignes(R);
  return { protocole: 'programme/t3h/PROTOCOLE_T3H.md', entreprises: Lg.length, restreinte: atelier(Lg, { actions: ACTIONS_RESTREINTES, traits: TRAITS }), complete: atelier(Lg, { actions: ACTIONS, traits: TRAITS }) };
}

const moy = (v) => (v.length ? v.reduce((a, b) => a + b, 0) / v.length : null), vari = (v) => { const m = moy(v); return v.reduce((s, x) => s + (x - m) ** 2, 0) / (v.length - 1); };
const SEUIL_NORMAL = 1.684;   // seuil unilatéral à 5 % retenu pour plus de 40 degrés de liberté, comme de T3 à T3g
export function welch(a, b) {   // moyenne(a) > moyenne(b) ?
  if (a.length < 2 || b.length < 2) return null;
  const va = vari(a) / a.length, vb = vari(b) / b.length, t = va + vb > 0 ? (moy(a) - moy(b)) / Math.sqrt(va + vb) : 0, ddl = (va + vb) ** 2 / (va ** 2 / (a.length - 1) + vb ** 2 / (b.length - 1));
  return { na: a.length, nb: b.length, ecart: moy(a) - moy(b), t, ddl, seuil: ddl > 40 ? SEUIL_NORMAL : 2.132, etabli: t > (ddl > 40 ? SEUIL_NORMAL : 2.132), note: ddl > 40 ? undefined : 'moins de 40 degrés de liberté : seuil prudent de 2,132 (4 ddl)' };
}
export async function juger(R, politique) {
  const { tUnilateral } = await import('../../scripts/t3.js');
  const E = R.filter((r) => !r.ecartee), choixR = E.map((r) => appliquer(politique.restreinte.regle, r.traits)), choixC = E.map((r) => appliquer(politique.complete.regle, r.traits));
  const g = (r, a) => r.gains[a], avantage = E.map((r) => g(r, 'chaine') - g(r, 'tenu')), perd = (choix) => E.filter((r, i) => g(r, choix[i]) < g(r, 'tenu')).length;
  const designees = E.map((_, i) => choixR[i] === 'tenu'), ecart = (choix, ref, f = (x) => x) => tUnilateral(E.map((r, i) => f(g(r, choix[i])) - f(g(r, ref))));
  const P1 = politique.restreinte.refus ? null : welch(avantage.filter((_, i) => !designees[i]), avantage.filter((_, i) => designees[i]));
  const H1b = ecart(choixC, 'chaine', borne), an = politique.complete.annonce, et = H1b.t ? Math.abs(H1b.moyenne / H1b.t) : 0, tol = 2 * Math.sqrt(et ** 2 + an.erreur_type ** 2);
  const H2 = { complete: perd(choixC), chaine: E.filter((r) => g(r, 'chaine') < g(r, 'tenu')).length, restreinte: perd(choixR) }; H2.tenu = H2.complete < H2.chaine;
  const compte = (v) => Object.fromEntries([...new Set(v)].map((a) => [a, v.filter((x) => x === a).length]));
  return { entreprises: R.length, mesurees: E.length, moyennes: { complete: moy(E.map((r, i) => g(r, choixC[i]))), restreinte: moy(E.map((r, i) => g(r, choixR[i]))), ...Object.fromEntries(ACTIONS.map((a) => [a, moy(E.map((r) => g(r, a)))])), meilleur_apres_coup: moy(E.map((r) => Math.max(...ACTIONS.map((a) => g(r, a))))) },
    P1: P1 ? { ...P1, designees: designees.filter(Boolean).length, perdantes_parmi_designees: E.filter((_, i) => designees[i] && avantage[i] < 0).length, perdantes_parmi_les_autres: E.filter((_, i) => !designees[i] && avantage[i] < 0).length } : { etabli: false, note: politique.restreinte.refus ? 'l’atelier a refusé : aucune entreprise désignée' : 'trop peu d’entreprises dans un groupe', designees: designees.filter(Boolean).length },
    P2: ecart(choixR, 'chaine'), H1: ecart(choixC, 'chaine'), H1_borne: H1b, H1_mieux: E.filter((r, i) => g(r, choixC[i]) > g(r, 'chaine')).length, H1_moins_bien: E.filter((r, i) => g(r, choixC[i]) < g(r, 'chaine')).length, H2,
    H3: { annonce: an.moyenne, mesure: H1b.moyenne, ecart: H1b.moyenne - an.moyenne, tolerance: tol, tenu: !politique.complete.refus && Math.abs(H1b.moyenne - an.moyenne) <= tol, note: politique.complete.refus ? 'l’atelier a refusé : rien n’est annoncé' : undefined },
    direct_contre_galilee: ecart(E.map(() => 'direct'), 'direct_galilee'), direct_contre_chaine: ecart(E.map(() => 'direct'), 'chaine'), chaine_contre_tenu: ecart(E.map(() => 'chaine'), 'tenu'), complete_contre_tenu: ecart(choixC, 'tenu'),
    loi_retenue: E.filter((r) => r.traits.loi_retenue === 1).length, choix_complete: compte(choixC), choix_restreinte: compte(choixR), cout_exact: E.filter((r) => r.cout_au_jour_183 != null && Math.abs(r.cout_au_jour_183 / r.cout_vrai - 1) < 0.001).length };
}
export function direJugement(a) {
  const pct = (x) => (x == null ? '—' : `${(100 * x).toFixed(1)} %`), t = (k) => `${pct(k.moyenne)}, t = ${k.t.toFixed(2)} (seuil ${k.seuil}) → ${k.etabli ? 'établi' : 'non établi'}`;
  return [`${a.mesurees} entreprises mesurées sur ${a.entreprises}`, ...Object.entries(a.moyennes).map(([b, m]) => `  ${b.padEnd(20)} ${pct(m).padStart(8)}`),
    a.P1.t != null ? `P1 perdantes désignées : ${a.P1.designees} désignées ; avantage de l’essai chez les autres − chez les désignées : ${pct(a.P1.ecart)}, t = ${a.P1.t.toFixed(2)} (seuil ${a.P1.seuil}) → ${a.P1.etabli ? 'établi' : 'non établi'} ; vraies perdantes : ${a.P1.perdantes_parmi_designees} sur ${a.P1.designees} désignées, ${a.P1.perdantes_parmi_les_autres} sur ${a.mesurees - a.P1.designees} autres` : `P1 : manqué (${a.P1.note})`,
    `P2 règle restreinte > chaîne : ${t(a.P2)}`, `H1 règle complète > chaîne : ${t(a.H1)} · gains bornés : ${t(a.H1_borne)} · mieux dans ${a.H1_mieux}, moins bien dans ${a.H1_moins_bien}`,
    `H2 perdantes face à prix tenu : complète ${a.H2.complete}, chaîne ${a.H2.chaine} (restreinte ${a.H2.restreinte}) → ${a.H2.tenu ? 'tenu' : 'manqué'}`,
    `H3 annoncé ${pct(a.H3.annonce)}, mesuré ${pct(a.H3.mesure)}, tolérance ${pct(a.H3.tolerance)} → ${a.H3.tenu ? 'tenu' : 'manqué'}${a.H3.note ? ` (${a.H3.note})` : ''}`,
    `direct > direct GALILÉE : ${t(a.direct_contre_galilee)} · direct > chaîne : ${t(a.direct_contre_chaine)} · chaîne > prix tenu : ${t(a.chaine_contre_tenu)} · complète > prix tenu : ${t(a.complete_contre_tenu)}`,
    `loi de GALILÉE retenue : ${a.loi_retenue} sur ${a.mesurees} · choix de la règle complète ${JSON.stringify(a.choix_complete)} · restreinte ${JSON.stringify(a.choix_restreinte)} · coût exact ${a.cout_exact}`].join('\n');
}

// Exécution unique du test T3h (graines 6701 à 6900), règles gelées dans programme/t3h/politique.json.
export async function essaiAtelierTest(reg, { sortie = null, politique, monde = 't3h', graines = Array.from({ length: 200 }, (_, i) => 6701 + i) } = {}) {
  const P = 'essai-prix#T3H', niveauDe = (r, a) => (a === 'tenu' ? 0 : a === 'chaine' ? r.decision_chaine : a === 'direct' ? r.niveau_direct : a === 'direct_galilee' ? r.niveau_galilee : Number(a.split(':')[1]));
  reg.ajouter({ probleme: P, type: 'probleme', cle: P, auteur: 'registre', titre: 'Essai de prix commun (T3H) : prédire les perdantes avant l’essai, par un atelier qui écrit ses propres règles',
    question: 'Des règles de décision écrites par une méthode automatique sur 200 entreprises (lecture du seul journal d’avant essai) désignent-elles les entreprises où l’essai fait perdre, et font-elles mieux que la chaîne écrite à la main ? Marge simulée.',
    source: { generateur: 'LAVOISIER src/bench/generator.js piloté (L2, demande sensible L2b, hasard commun L2c) ; protocole programme/t3h/PROTOCOLE_T3H.md ; règles gelées programme/t3h/politique.json', graine: `${graines[0]} à ${graines.at(-1)}`, statut: 'graines de test de T3H, exécution unique' },
    roles: { LAVOISIER: 'corps de l’entreprise, coût unitaire', GALILEE: 'loi de demande sur l’historique d’avant essai', CORTEX: 'plan d’essai de la chaîne', registre: 'atelier : arbres de décision appris sur les graines 301 à 500' } });
  const R = [];
  for (const g of graines) {
    const r = mesurer(g, monde); R.push(r);
    if (r.ecartee) { reg.ajouter({ probleme: P, type: 'aveu', auteur: 'registre', motif: `Graine ${g} : écartée (${r.motif}).` }); continue; }
    const a = appliquer(politique.complete.regle, r.traits), eur = (x) => Math.round(x * Math.abs(r.marge_temoin_nul));
    const idExp = reg.ajouter({ probleme: P, type: 'experience', auteur: 'registre', but: [],
      plan: { duree: `Graine ${g} : 26 semaines sur le prix de ${r.objet}, jours ${J1} à 364 ; action choisie au jour 183 par la règle de l’atelier : ${a}`, niveaux: a === 'chaine' ? r.plan_chaine : [niveauDe(r, a)] },
      cout_prevu: { raison: 'non chiffré d’avance : la règle choisit entre essayer et décider sans essai' }, risque: { reversible: true, note: 'entreprise simulée : rien ne sort, aucun euro réel n’est en jeu' }, autorisation: 'automatique' });
    reg.ajouter({ probleme: P, type: 'resultat', auteur: 'banc', experience: idExp,
      mesures: { essai_prix: true, graine: g, decision: niveauDe(r, a), decide_par: `atelier : ${a}`, juge_cortex: 'non sollicité', marge_temoin_nul: Math.round(r.marge_temoin_nul), gain_collectif: eur(r.gains[a]), gain_aveugle_plus_25: eur(r.gains['niveau:1']),
        gain_chaine: eur(r.gains.chaine), gain_prix_tenu: eur(r.gains.tenu), designee_perdante: appliquer(politique.restreinte.regle, r.traits) === 'tenu', cout_vrai: r.cout_vrai, unite: '€ simulés, marge sur ventes de l’objet, jours 183 à 364' },
      cout_reel: { calcul_s: r.secs, jours: 182 } });
  }
  const a = await juger(R, politique), pct = (x) => `${(100 * x).toFixed(1)} %`;
  if (sortie) writeFileSync(sortie, JSON.stringify({ protocole: 'programme/t3h/PROTOCOLE_T3H.md', politique: 'programme/t3h/politique.json', agregat: a, entreprises: R }, null, 1) + '\n');
  reg.ajouter({ probleme: P, type: 'jalon', auteur: 'registre', compte: 'collectif', travail: 'T3H', mesure: 'gain moyen sur la marge de l’objet piloté, jours 183 à 364 : règle écrite par l’atelier contre chaîne prudente (simulation)',
    avant: `chaîne prudente ${pct(a.moyennes.chaine)}`, apres: `règle complète ${pct(a.moyennes.complete)}, règle restreinte ${pct(a.moyennes.restreinte)} (prix tenu ${pct(a.moyennes.tenu)})`, source: 'programme/t3h/test.json' });
  console.error(direJugement(a));
  return a;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const opt = (n, d) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : d; };
  if (opt('--lot')) {
    const [a, b] = opt('--lot').split('-').map(Number);
    if (a < 301 || (b ?? a) > 500) { console.error('atelier : graines 301 à 500 seulement'); process.exit(1); }
    const sortie = opt('--sortie'), R = sortie && process.argv.includes('--reprendre') ? JSON.parse(readFileSync(sortie, 'utf8')).entreprises : [], faits = new Set(R.map((r) => r.graine));
    for (let g = a; g <= (b ?? a); g++) {
      if (faits.has(g)) continue;
      const r = mesurer(g); R.push(r);
      console.error(`graine ${g} : ${r.ecartee ? 'écartée' : `m ${r.traits.m} · e ${r.traits.e} (t ${r.traits.t}) · direct ${r.niveau_direct} · loi ${r.loi?.retenue ? 'retenue' : 'non'} · chaîne ${r.decision_chaine} · ${r.secs} s`}`);
      if (sortie && (g % 20 === 0 || g === (b ?? a))) writeFileSync(sortie, JSON.stringify({ protocole: 'programme/t3h/PROTOCOLE_T3H.md', entreprises: R }, null, 1) + '\n');
    }
  } else if (opt('--atelier')) {
    const R = JSON.parse(readFileSync(opt('--atelier'), 'utf8')).entreprises, pol = ecrireRegles(R), pct = (x) => `${(100 * x).toFixed(1)} %`;
    for (const nom of ['restreinte', 'complete']) { const p = pol[nom]; console.log(`\n== règle ${nom} ==`); for (const v of p.validation) console.log(`  profondeur ${v.profondeur} : gain hors pli ${pct(v.gain.moyenne)} ± ${pct(v.gain.erreur_type)} · avantage sur la chaîne ${pct(v.avantage.moyenne)} (t = ${v.avantage.t.toFixed(2)})`); console.log(`  profondeur retenue : ${p.profondeur} · ${p.refus ? 'REFUS : rien trouvé qui tienne' : `annonce ${pct(p.annonce.moyenne)} ± ${pct(p.annonce.erreur_type)}`}`); console.log(p.en_clair.map((l) => '  ' + l).join('\n')); }
    if (opt('--sortie')) writeFileSync(opt('--sortie'), JSON.stringify(pol, null, 1) + '\n');
  }
}
