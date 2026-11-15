// Problème commun n° 3 — essai de prix commun (T3). Protocole : programme/t3/PROTOCOLE_T3.md, écrit avant ce code.
// LAVOISIER reconstruit le corps (d'où le coût unitaire), CORTEX donne le plan d'essai et son verdict, GALILÉE la loi
// quantité–prix ; le registre décide un prix, et la marge se mesure dans la vérité, ouverte après toutes les décisions.
import * as L from '../adaptateurs/lavoisier.js';
import * as C from '../adaptateurs/cortex.js';
import * as G from '../adaptateurs/galilee.js';
import { analyser as chercherLoi } from '../loi-client.js';
import { recevable, analyser as sonder, jugerFormule } from '../../moteurs/cortex/research/v6/juge.js';
import { parse, evalPoint } from '../../moteurs/galilee/src/expr.js';

export const J1 = 183, J2 = 274, FIN = 365, BLOC = 7, NB = 13, PAS = 1.25, NIVEAUX = [-1, -0.5, 0, 0.5, 1];
export const AVANT_APRES = [...Array(6).fill(0.5), ...Array(7).fill(-0.5)];
export const BLOCS_COURT = 8, BLOCS_BREF = 5;
const JOURS_JUGE = 56; // la loi jugée par CORTEX n'a vu que les 8 premiers blocs ; le pari porte sur les 5 derniers
const med = (v) => { const s = [...v].sort((a, b) => a - b); return s.length ? s[s.length >> 1] : null; };
const arr = (x, n = 2) => (x == null || !Number.isFinite(x) ? null : Number(x.toFixed(n)));
const centimes = (x) => Math.round(x * 100) / 100;
export const prixDe = (pref, u) => centimes(pref * PAS ** u);
const estVente = (r) => r.montant != null && r.quantite;
const unitaire = (r) => Math.abs(r.montant / r.quantite);

// Ce que voit celui qui pilote au jour D : lignes saisies avant D, relevés avant D, références futures effacées.
// La durée annoncée est D : le bilan de LAVOISIER ne lit pas une année dont la fin manque (constat de mise au point).
export function couper(o, D) {
  const journal = o.journal.filter((r) => r.jour < D), ids = new Set(journal.map((r) => r.id));
  return { jours: D, journal: journal.map((r) => (r.reference && !ids.has(r.reference) ? { ...r, reference: null } : r)),
    releves: o.releves.map((rl) => ({ cle: rl.cle, valeurs: rl.valeurs.filter((v) => v.jour < D) })) };
}

export function choisirObjet(obs) {
  const g = new Map();
  for (const r of obs.journal) if (r.objet && estVente(r)) { const c = g.get(r.objet) ?? { n: 0, jours: new Set() }; c.n++; c.jours.add(r.jour); g.set(r.objet, c); }
  const elig = [...g].filter(([, c]) => c.jours.size >= obs.jours / 2).sort((a, b) => b[1].n - a[1].n || (a[0] < b[0] ? -1 : 1));
  if (!elig.length) return { objet: null, objets: g.size, eligibles: 0 };
  const tok = elig[0][0];
  const pref = med(obs.journal.filter((r) => r.objet === tok && estVente(r) && r.jour >= obs.jours - 14).map(unitaire));
  return { objet: pref ? tok : null, pref: pref ? centimes(pref) : null, objets: g.size, eligibles: elig.length, lignes: elig[0][1].n };
}

// Coût unitaire tiré du corps de LAVOISIER, sans mot de métier : lignes de l'objet portant un montant sans quantité
// et ayant une incidence sur un stock ; chacune est rapportée aux lignes « quantité sans montant » du même objet que
// le bilan lui relie (ou qu'elle cite).
export function coutUnitaire(obs, corps, tok) {
  const lignes = obs.journal.filter((r) => r.objet === tok), par = new Map(lignes.map((r) => [r.id, r]));
  const qteSeule = (r) => r && r.quantite && r.montant == null;
  const inc = (r) => corps.records[r.id]?.deltas ?? [];
  const couts = lignes.filter((r) => r.montant != null && r.quantite == null && inc(r).length);
  const ratios = [];
  for (const a of couts) {
    const q = [...new Set([...(corps.records[a.id]?.links ?? []), a.reference])].map((id) => par.get(id)).filter(qteSeule).map((r) => Math.abs(r.quantite));
    if (q.length) ratios.push(Math.abs(a.montant) / med(q));
  }
  if (ratios.length >= 3) return { cout: med(ratios), methode: 'paires reliées', paires: ratios.length };
  const unite = Object.fromEntries(corps.stocks.map((s) => [s.id, s.unit]));
  const entrees = lignes.filter((r) => qteSeule(r) && inc(r).some(([s, d]) => unite[s] !== '€' && d > 0));
  const m = couts.reduce((s, r) => s + Math.abs(r.montant), 0), q = entrees.reduce((s, r) => s + Math.abs(r.quantite), 0);
  return m > 0 && q > 0 ? { cout: m / q, methode: 'sommes', paires: ratios.length } : { cout: null, methode: 'indisponible', paires: ratios.length };
}

const planVers = (tok, pref, niveaux, final = null) => [...niveaux.map((u, b) => ({ jour: J1 + BLOC * b, objet: tok, prix: prixDe(pref, u) })),
  ...(final == null ? [] : [{ jour: J1 + BLOC * niveaux.length, objet: tok, prix: prixDe(pref, final) }])];

// Ventes de l'essai. Une vente est rattachée à un niveau par son propre prix unitaire, pas par sa date de saisie :
// une facture saisie en retard porte le prix du jour de la vente (constat de mise au point : la rattacher au prix du
// jour de saisie sous-comptait des deux tiers les ventes sur facture des blocs isolés). Un niveau ne reçoit rien avant
// son premier bloc. La loi, elle, a besoin de points datés : elle ne reçoit que les types de flux « à l'heure »
// (au moins 98 % de leurs lignes portent le prix du jour où elles sont saisies) ; le reste est la part « en retard ».
export function donneesEssai(obs, corps, tok, pref, niveaux) {
  const niveauDe = (t) => niveaux[Math.floor((t - J1) / BLOC)], colle = (r, u) => Math.abs(unitaire(r) - prixDe(pref, u)) <= 0.0051;
  const premier = (u) => (niveaux.indexOf(u) < 0 ? Infinity : J1 + BLOC * niveaux.indexOf(u));
  const ventes = obs.journal.filter((r) => r.objet === tok && estVente(r) && r.jour >= J1), typeDe = (r) => corps.records[r.id]?.type;
  const parType = new Map();
  for (const r of ventes) { const c = parType.get(typeDe(r)) ?? { n: 0, ok: 0 }; c.n++; if (colle(r, niveauDe(r.jour))) c.ok++; parType.set(typeDe(r), c); }
  const aLHeure = new Set([...parType].filter(([, c]) => c.ok >= 0.98 * c.n).map(([ty]) => ty));
  const q = new Float64Array(BLOC * niveaux.length), tout = new Map(NIVEAUX.map((u) => [u, 0])), tard = new Map(NIVEAUX.map((u) => [u, 0]));
  for (const r of ventes) {
    const u = NIVEAUX.find((x) => r.jour >= premier(x) && colle(r, x));
    if (u == null) continue;
    tout.set(u, tout.get(u) + Math.abs(r.quantite));
    if (!aLHeure.has(typeDe(r))) tard.set(u, tard.get(u) + Math.abs(r.quantite));
    else if (u === niveauDe(r.jour)) q[r.jour - J1] += Math.abs(r.quantite);
  }
  const jours = Array.from(q, (y, i) => ({ t: J1 + i, u: niveauDe(J1 + i), q: y }));
  const table = NIVEAUX.map((u) => { const n = jours.filter((x) => x.u === u).length; return { u, jours: n, parJour: n ? tout.get(u) / n : null, tardParJour: n ? tard.get(u) / n : null }; });
  return { jours, table, aLHeure };
}

export function loiEssai(jours) {
  const a = chercherLoi({ noms: ['p'], cible: 'q', X: jours.map((d) => [PAS ** d.u]), y: jours.map((d) => d.q), graine: 1 });
  let f = null;
  if (a.loi) { try { const e = parse(a.loi, ['p']); f = (p) => a.echelles.reponse * evalPoint(e, [p / a.echelles.variables[0]]); } catch { f = null; } }
  return { ...a, f };
}

// Décision du protocole (T3, § 4). sansLoi : la table seule ; sansCout : on maximise le chiffre d'affaires.
// Une règle révisée (le meilleur prédicteur entre la loi et une droite) a été essayée en mise au point de T3b : elle
// ne décidait pas mieux, elle a été retirée.
export function decider({ table, loi, cout, pref, sansLoi = false, sansCout = false }) {
  if (!sansCout && cout == null) return { niveau: 0, par: 'coût indisponible' };
  const essayes = table.filter((x) => x.jours > 0), lo = Math.min(...essayes.map((x) => x.u)), hi = Math.max(...essayes.map((x) => x.u));
  const valeur = (u, q) => (prixDe(pref, u) - (sansCout ? 0 : cout)) * q;
  const parLoi = !sansLoi && loi?.retenue && loi.f;
  // part en retard à un niveau non essayé : interpolée entre les deux niveaux essayés qui l'encadrent
  const tard = (u) => { const e = essayes.find((x) => x.u === u); if (e) return e.tardParJour; const a = essayes.filter((x) => x.u < u).at(-1), b = essayes.find((x) => x.u > u); return a.tardParJour + ((u - a.u) / (b.u - a.u)) * (b.tardParJour - a.tardParJour); };
  const cands = (parLoi ? NIVEAUX.filter((u) => u >= lo && u <= hi).map((u) => ({ u, v: valeur(u, loi.f(PAS ** u) + tard(u)) })) : essayes.map((x) => ({ u: x.u, v: valeur(x.u, x.parJour) }))).filter((c) => Number.isFinite(c.v));
  if (!cands.length || !essayes.some((x) => x.parJour > 0)) return { niveau: 0, par: 'aucune vente' };
  const max = Math.max(...cands.map((c) => c.v));
  const gagnants = cands.filter((c) => c.v >= max - 1e-9 * Math.abs(max)).sort((a, b) => Math.abs(a.u) - Math.abs(b.u));
  return { niveau: gagnants[0].u, par: parLoi ? 'loi' : 'table', prevu: Object.fromEntries(cands.map((c) => [c.u, arr(c.v)])) };
}

// Verdict de CORTEX : pari de son juge exporté sur une loi de GALILÉE qui n'a vu que les 56 premiers jours de l'essai.
export function verdictCortex(obs, corps, tok, pref, niveaux, jours, aLHeure) {
  const T = J1 + BLOC * niveaux.length, q = new Float64Array(T), u = new Float64Array(T), pj = new Map();
  for (const r of obs.journal) if (r.objet === tok && estVente(r) && r.jour < J1 && aLHeure.has(corps.records[r.id]?.type)) { q[r.jour] += Math.abs(r.quantite); if (!pj.has(r.jour)) pj.set(r.jour, []); pj.get(r.jour).push(unitaire(r)); }
  let dernier = pref;
  for (let t = 0; t < J1; t++) { if (pj.has(t)) dernier = med(pj.get(t)); u[t] = Math.log(dernier / pref) / Math.log(PAS); }
  for (const d of jours) { q[d.t] = d.q; u[d.t] = d.u; }
  const Y = Array.from(q, (v) => [Math.log(v + 1)]), U = Array.from(u, (v) => [v]);
  const rec = recevable({ Y, U });
  if (!rec.ok) return { verdict: 'irrecevable', raison: rec.raisons[0] };
  const loi = loiEssai(jours.slice(0, JOURS_JUGE));
  if (!loi.f || loi.sans_variable) return { verdict: 'sans objet', raison: 'aucune loi dépendant du prix sur les 56 premiers jours', loi: loi.loi };
  const t0 = Date.now(), an = sonder({ Y, U }, { aEnd: Math.floor((J1 * 150) / 272), bEnd: J1 + JOURS_JUGE });
  const v = jugerFormule(an, 0, { text: loi.loi, f: (x) => loi.f(PAS ** x[0]) });
  return { verdict: v.constant ? 'indecis' : v.accepted ? 'confirme' : 'indecis', loi: loi.loi, logE: arr(v.logE), seuil: arr(v.seuil), diagnostic: an.mesures[0].diag, secs: (Date.now() - t0) / 1000 };
}

// Marge sur ventes de l'objet, lue dans la vérité ouverte : montant − coût vrai × quantité, doublons exclus.
function margeVraie(E, tok) {
  const T = E.verite, stock = T.releves.find((r) => r.cle === tok).stock, c = T.stocks.find((s) => s.id === stock).na;
  const lignes = E.observe.journal.filter((r) => r.objet === tok && estVente(r) && !T.records[r.id].dup && T.records[r.id].type.startsWith('vente.'));
  const pj = new Map();
  for (const r of lignes) { const d = T.records[r.id].realDay; if (!pj.has(d)) pj.set(d, []); pj.get(d).push(unitaire(r)); }
  const m = { essai: 0, exploitation: 0 };
  for (const r of lignes) { const d = T.records[r.id].realDay; if (d < J1) continue; m[d < J2 ? 'essai' : 'exploitation'] += Math.abs(r.montant) - c * Math.round(Math.abs(r.montant) / med(pj.get(d))); }
  return { essai: arr(m.essai), exploitation: arr(m.exploitation), total: arr(m.essai + m.exploitation), profit_2e_semestre: arr(T.profitMensuel.slice(6).reduce((a, b) => a + b, 0)), cout_vrai: c };
}

// monde : 't3' (simulateur d'origine), 't3b' ou 't3c' (demande sensible, L2b : bras court et bref, et la chaîne
// retenue par T3b — essai de 8 blocs, décision par la table, sans loi).
export function essaiPrix(graine, monde = 't3') {
  const t0 = Date.now(), nul = L.entreprisePilotee(graine, [], monde);
  const choix = choisirObjet(couper(nul.observe, J1));
  if (!choix.objet) return { graine, ecartee: true, motif: `aucun objet éligible (${choix.objets} objets vendus)` };
  const { objet: tok, pref } = choix, courses = { nul }, lancer = (cle, plan) => (courses[cle] ??= L.entreprisePilotee(graine, plan, monde));
  for (const u of NIVEAUX) lancer(`aveugle:${u}`, [{ jour: J1, objet: tok, prix: prixDe(pref, u) }]);

  // essai conduit par un plan, puis les décisions qu'il permet
  const conduire = (nom, niveaux, { avecJuge }) => {
    const essai = L.entreprisePilotee(graine, planVers(tok, pref, niveaux), monde), obs = couper(essai.observe, J1 + BLOC * niveaux.length);
    const { corps, secs } = L.bilanMatiere(obs), cout = coutUnitaire(obs, corps, tok), d = donneesEssai(obs, corps, tok, pref, niveaux), loi = loiEssai(d.jours);
    const base = { table: d.table, loi, cout: cout.cout, pref };
    const decisions = { complet: decider(base), sans_galilee: decider({ ...base, sansLoi: true }), sans_lavoisier: decider({ ...base, sansCout: true }) };
    for (const dec of Object.values(decisions)) lancer(`${nom}:${dec.niveau}`, planVers(tok, pref, niveaux, dec.niveau));
    return { niveaux, cout, table: d.table.map((x) => ({ ...x, parJour: arr(x.parJour, 3), tardParJour: arr(x.tardParJour, 3) })), types_a_l_heure: d.aLHeure.size, bilan_s: arr(secs, 1),
      loi: { texte: loi.loi, retenue: loi.retenue, sans_variable: loi.sans_variable, erreur_loi: arr(loi.erreur_loi, 3), erreur_constante: arr(loi.erreur_constante, 3), erreur_droite: arr(loi.erreur_droite, 3), secs: arr(loi.secs, 1) },
      decisions, juge: avecJuge ? verdictCortex(obs, corps, tok, pref, niveaux, d.jours, d.aLHeure) : null };
  };
  const planC = C.planActif({ text: '1 / p', f: (u) => PAS ** -u[0] });
  const collectif = conduire('collectif', planC.plan.map((u) => u[0]), { avecJuge: true });
  const naif = conduire('naif', AVANT_APRES, { avecJuge: false });
  const sensible = monde !== 't3';
  const court = sensible ? conduire('court', collectif.niveaux.slice(0, BLOCS_COURT), { avecJuge: false }) : null;
  const bref = sensible ? conduire('bref', collectif.niveaux.slice(0, BLOCS_BREF), { avecJuge: false }) : null;
  const essais = sensible && process.env.T3B_LONGUEURS ? Object.fromEntries(process.env.T3B_LONGUEURS.split(',').map(Number).map((k) => [k, conduire(`court${k}`, collectif.niveaux.slice(0, k), { avecJuge: false })])) : {};   // mise au point seulement

  // toutes les décisions sont prises : la vérité s'ouvre
  const marges = {};
  for (const [cle, E] of Object.entries(courses)) { E.ouvrir(); marges[cle] = margeVraie(E, tok); }
  const copie = (m) => { const { cout_vrai, ...reste } = m; return reste; };
  const coutVrai = marges.nul.cout_vrai;
  const bras = { nul: marges.nul };
  for (const u of NIVEAUX) bras[`aveugle:${u}`] = marges[`aveugle:${u}`];
  bras.collectif = marges[`collectif:${collectif.decisions.complet.niveau}`];
  bras.sans_galilee = marges[`collectif:${collectif.decisions.sans_galilee.niveau}`];
  bras.sans_lavoisier = marges[`collectif:${collectif.decisions.sans_lavoisier.niveau}`];
  bras.sans_plan_cortex = marges[`naif:${naif.decisions.complet.niveau}`];
  if (court) { bras.collectif_court = marges[`court:${court.decisions.complet.niveau}`]; bras.collectif_bref = marges[`bref:${bref.decisions.complet.niveau}`]; bras.chaine_retenue = marges[`court:${court.decisions.sans_galilee.niveau}`]; }
  for (const [k, e] of Object.entries(essais)) bras[`court${k}`] = marges[`court${k}:${e.decisions.complet.niveau}`];
  for (const k of Object.keys(bras)) bras[k] = copie(bras[k]);
  return { graine, monde, ecartee: false, objet: tok, prix_reference: pref, cout_vrai: arr(coutVrai, 3), eligibles: choix.eligibles, objets: choix.objets,
    plan_cortex: { niveaux: collectif.niveaux, budget: planC.cout }, collectif, naif, ...(court ? { court, bref } : {}), ...(Object.keys(essais).length ? { essais: Object.fromEntries(Object.entries(essais).map(([k, e]) => [k, { niveau: e.decisions.complet.niveau, par: e.decisions.complet.par }])) } : {}), bras, courses: Object.keys(courses).length, secs: arr((Date.now() - t0) / 1000, 1),
    identites: { lavoisier: L.IDENTITE, cortex: C.IDENTITE, galilee: G.IDENTITE } };
}

// Exécution unique d'un test, consignée acte par acte. Le journal étant en ajout seul, la clé du dossier interdit
// toute seconde exécution. T3 : graines 6001 à 6040 ; T3b (demande sensible) : graines 6041 à 6080.
export async function essaiPrixTest(reg, { monde = 't3', sortie = null, graines = null } = {}) {
  const T = { t3: ['T3', 6001, 40, ''], t3b: ['T3B', 6041, 40, '-b'], t3c: ['T3C', 6081, 80, '-c'] }[monde], NOM = T[0], P = `essai-prix#${NOM}`, dossier = `programme/${NOM.toLowerCase()}`;
  graines ??= Array.from({ length: T[2] }, (_, i) => T[1] + i);
  const reproduire = `${NOM}_TEST=exécution-unique node bin/commun.js executer essai-prix${T[3]} (exécution unique : ne se relance pas)`;
  reg.ajouter({ probleme: P, type: 'probleme', cle: P, auteur: 'registre', titre: `Essai de prix commun (${NOM}) : test`,
    question: monde === 't3c' ? 'La chaîne retenue par T3b (coût de LAVOISIER, plan de CORTEX arrêté à 8 blocs, décision par la table, sans loi) fait-elle mieux que la meilleure règle aveugle, apprentissage compris ? Marge simulée, sur des entreprises neuves.'
      : monde === 't3b' ? 'Dans un monde où la bonne direction de prix varie d’une entreprise à l’autre, les trois moteurs font-ils mieux que la meilleure règle aveugle, apprentissage compris ? Marge simulée, mesurée contre la même entreprise laissée seule.'
      : 'Les trois moteurs, ensemble, produisent-ils sur le prix d’un objet un gain de marge qu’une règle aveugle ne produit pas ? Marge simulée, mesurée contre la même entreprise laissée seule.',
    source: { generateur: `LAVOISIER src/bench/generator.js piloté (L2${monde === 't3' ? '' : ', demande sensible L2b'}) ; protocole ${dossier}/PROTOCOLE_${NOM}.md`, graine: `${graines[0]} à ${graines.at(-1)}`, statut: `graines de test de ${NOM}, exécution unique` },
    roles: { LAVOISIER: 'corps de l’entreprise, coût unitaire', CORTEX: 'plan d’essai, verdict du juge', GALILÉE: 'loi quantité–prix' } });
  const R = [];
  for (const g of graines) {
    const r = essaiPrix(g, monde); R.push(r);
    if (r.ecartee) { reg.ajouter({ probleme: P, type: 'aveu', auteur: 'registre', motif: `Graine ${g} écartée : ${r.motif}.` }); continue; }
    const c = r.collectif, dec = c.decisions.complet, gain = (b) => Math.round(r.bras[b].total - r.bras.nul.total);
    const idCout = c.cout.cout == null
      ? reg.ajouter({ probleme: P, type: 'aveu', auteur: 'LAVOISIER', moteur: L.IDENTITE, motif: `Graine ${g} : le bilan ne permet pas de chiffrer le coût unitaire de l’objet ${r.objet} ; aucun prix n’est décidé.` })
      : reg.ajouter({ probleme: P, type: 'affirmation', auteur: 'LAVOISIER', moteur: L.IDENTITE, sujet: `graine ${g} : coût unitaire de ${r.objet}`,
        enonce: `Graine ${g} : l’objet ${r.objet} coûte ${arr(c.cout.cout)} € l’unité (prix de vente de référence ${r.prix_reference} €).`,
        certitude: { niveau: 'hypothèse', garantie: 'aucune hors développement : le bilan de matière n’est pas gelé ; le coût vrai n’est comparé qu’après toutes les décisions' },
        contenu: { cout: arr(c.cout.cout, 4), methode: c.cout.methode, paires: c.cout.paires, prix_reference: r.prix_reference },
        preuve: { methode: `bilan de matière sur le journal coupé au jour ${J2}, puis ${c.cout.methode}`, reproduire }, cout: { calcul_s: c.bilan_s, experiences: 0 } });
    const idExp = reg.ajouter({ probleme: P, type: 'experience', auteur: 'CORTEX', moteur: C.IDENTITE, but: [idCout],
      plan: { duree: `Graine ${g} : 13 blocs de 7 jours sur le prix de ${r.objet}, jours ${J1} à ${J2 - 1} ; niveaux (puissances de ${PAS}) : ${c.niveaux.join(' ; ')}`, niveaux: c.niveaux },
      cout_prevu: { raison: `non chiffré d’avance en euros ; budget du plan : |u| moyen ${arr(r.plan_cortex.budget.u0)} (plafond ${C.BUDGET.u0})` },
      risque: { reversible: true, note: 'entreprise simulée : rien ne sort, aucun euro réel n’est en jeu' }, autorisation: 'automatique' });
    if (c.loi.texte && !c.loi.sans_variable) reg.ajouter({ probleme: P, type: 'affirmation', auteur: 'GALILÉE', moteur: G.IDENTITE, depend_de: [idExp], sujet: `graine ${g} : loi quantité–prix de ${r.objet}`,
      enonce: `Graine ${g} : ventes journalières datées de ${r.objet} ≈ ${c.loi.texte} (variables réduites), p étant le prix rapporté au prix de référence.`,
      certitude: { niveau: 'hypothèse', garantie: c.loi.retenue ? 'retenue par la chaîne de livraison : prédit les jours mis de côté mieux qu’une droite et qu’une constante ; aucun pari gagné' : 'non retenue : ne prédit pas les jours mis de côté mieux que les témoins ; elle n’a pas servi à décider' },
      contenu: { formule: c.loi.texte, retenue: c.loi.retenue, erreur_loi: c.loi.erreur_loi, erreur_constante: c.loi.erreur_constante, erreur_droite: c.loi.erreur_droite },
      preuve: { methode: 'recherche symbolique sur 91 jours d’essai, une mesure sur quatre mise de côté (src/loi-client.js)', reproduire }, cout: { calcul_s: c.loi.secs, experiences: 0 } });
    else reg.ajouter({ probleme: P, type: 'aveu', auteur: 'GALILÉE', moteur: G.IDENTITE, depend_de: [idExp], motif: `Graine ${g} : sur 91 jours d’essai je ne trouve aucune loi qui dépende du prix (${c.loi.texte ?? 'rien'}). La décision est prise par la table.` });
    reg.ajouter({ probleme: P, type: 'resultat', auteur: 'banc', experience: idExp,
      mesures: { essai_prix: true, graine: g, decision: dec.niveau, decide_par: dec.par, juge_cortex: c.juge.verdict, marge_temoin_nul: Math.round(r.bras.nul.total), gain_collectif: gain('collectif'), gain_aveugle_plus_25: gain('aveugle:1'),
        gain_sans_galilee: gain('sans_galilee'), gain_sans_lavoisier: gain('sans_lavoisier'), gain_sans_plan_cortex: gain('sans_plan_cortex'), ...(r.bras.collectif_court ? { gain_collectif_court: gain('collectif_court'), gain_collectif_bref: gain('collectif_bref'), decision_bref: r.bref.decisions.complet.niveau, gain_chaine_retenue: gain('chaine_retenue'), decision_chaine_retenue: r.court.decisions.sans_galilee.niveau } : {}), cout_vrai: r.cout_vrai, unite: '€ simulés, marge sur ventes de l’objet, jours 183 à 364' },
      cout_reel: { calcul_s: r.secs, jours: FIN - J1 } });
  }
  const { agreger, dire } = await import('../../scripts/t3.js');
  const a = agreger(R);
  if (sortie) (await import('node:fs')).writeFileSync(sortie, JSON.stringify({ protocole: `${dossier}/PROTOCOLE_${NOM}.md`, agregat: a, entreprises: R }, null, 1) + '\n');
  reg.ajouter({ probleme: P, type: 'jalon', auteur: 'registre', compte: 'collectif', travail: NOM, mesure: 'gain moyen du collectif sur la marge de l’objet piloté, jours 183 à 364, en part de la marge de l’entreprise laissée seule (simulation)',
    avant: 'non mesuré', apres: monde === 't3c' ? `chaîne retenue ${(100 * a.C1.retenue).toFixed(1)} % (meilleur bras aveugle : ${(100 * a.C1.aveugle).toFixed(1)} %)` : `${(100 * a.K1.moyenne).toFixed(1)} % (meilleur bras aveugle : ${(100 * a.fenetre_entiere.aveugle).toFixed(1)} %)`, source: `${dossier}/test.json` });
  console.error(dire(a));
  return a;
}
