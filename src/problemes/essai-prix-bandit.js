// Essai de prix T3d — la chaîne retenue face au bandit de Thompson. Protocole : programme/t3d/PROTOCOLE_T3D.md.
// Un bandit décide un prix par semaine pendant 26 semaines ; chaque décision relance la même entreprise avec le plan
// complété (L2 : rien ne change avant le jour d'une intervention) et ne lit que le journal coupé au jour de la décision.
import * as L from '../adaptateurs/lavoisier.js';
import * as C from '../adaptateurs/cortex.js';
import { essaiPrix, couper, choisirObjet, coutUnitaire, margeVraie, prixDe, J1, BLOC, PAS, NIVEAUX, BLOCS_COURT } from './essai-prix.js';

export const SEMAINES = 26, ORDRE_INITIAL = [0, 0.5, -0.5, 1, -1];
const arr = (x, n = 2) => (x == null || !Number.isFinite(x) ? null : Number(x.toFixed(n)));
const estVente = (r) => r.montant != null && r.quantite, unitaire = (r) => Math.abs(r.montant / r.quantite);
// générateur à graine fixe (mulberry32) et loi normale par Box-Muller : tout se rejoue à l'identique
function hasard(graine) { let a = graine >>> 0; const u = () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; return () => Math.sqrt(-2 * Math.log(1 - u())) * Math.cos(2 * Math.PI * u()); }

// Marge hebdomadaire constatée par niveau, au jour de la décision : (prix − coût) × ventes par jour à ce prix × 7.
export function marges(obs, tok, pref, cout, niveaux) {
  const premier = (u) => (niveaux.indexOf(u) < 0 ? Infinity : J1 + BLOC * niveaux.indexOf(u)), q = new Map(NIVEAUX.map((u) => [u, 0]));
  for (const r of obs.journal) { if (r.objet !== tok || !estVente(r) || r.jour < J1) continue; const u = NIVEAUX.find((x) => r.jour >= premier(x) && Math.abs(unitaire(r) - prixDe(pref, x)) <= 0.0051); if (u != null) q.set(u, q.get(u) + Math.abs(r.quantite)); }
  return NIVEAUX.map((u) => { const n = niveaux.filter((x) => x === u).length; return { u, n, marge: n ? ((prixDe(pref, u) - cout) * q.get(u)) / n : null }; });
}
// σ : écart-type de la marge hebdomadaire de l'objet sur les 26 semaines d'avant le jour 183
export function sigmaAvant(obs, tok, cout) {
  const m = new Float64Array(26);
  for (const r of obs.journal) if (r.objet === tok && estVente(r) && r.jour < J1 && r.jour >= J1 - 182) m[Math.floor((r.jour - (J1 - 182)) / 7)] += (unitaire(r) - cout) * Math.abs(r.quantite);
  const mu = m.reduce((a, b) => a + b, 0) / 26;
  return Math.sqrt(m.reduce((s, x) => s + (x - mu) ** 2, 0) / 25);
}

// Pilote semaine par semaine. depart : niveaux imposés au début ; candidats : niveaux que le tirage de Thompson peut jouer.
export function piloter(graine, monde, { tok, pref, cout, sigma }, { depart, candidats }) {
  const niveaux = [...depart], z = hasard(graine), plan = () => niveaux.map((u, b) => ({ jour: J1 + BLOC * b, objet: tok, prix: prixDe(pref, u) }));
  while (niveaux.length < SEMAINES) {
    const obs = couper(L.entreprisePilotee(graine, plan(), monde).observe, J1 + BLOC * niveaux.length);
    const tirages = marges(obs, tok, pref, cout, niveaux).filter((x) => candidats.includes(x.u) && x.n > 0).map((x) => ({ u: x.u, v: x.marge + (sigma / Math.sqrt(x.n)) * z() }));
    niveaux.push(tirages.reduce((a, b) => (b.v > a.v ? b : a)).u);
  }
  return { niveaux, course: L.entreprisePilotee(graine, plan(), monde) };
}

export function essaiBandit(graine, monde = 't3d') {
  const t0 = Date.now(), base = essaiPrix(graine, monde);
  if (base.ecartee) return base;
  const tok = base.objet, pref = base.prix_reference, avant = couper(L.entreprisePilotee(graine, [], monde).observe, J1);
  const { corps } = L.bilanMatiere(avant), cout = coutUnitaire(avant, corps, tok);
  const bras = { nul: base.bras.nul, chaine: base.bras.chaine_retenue, ...Object.fromEntries(NIVEAUX.map((u) => [`aveugle:${u}`, base.bras[`aveugle:${u}`]])) }, joues = {};
  if (cout.cout != null) {
    const ctx = { tok, pref, cout: cout.cout, sigma: sigmaAvant(avant, tok, cout.cout) }, planC = C.planActif({ text: '1 / p', f: (u) => PAS ** -u[0] }).plan.slice(0, BLOCS_COURT).map((u) => u[0]);
    const mesurer = (nom, r) => { r.course.ouvrir(); const { cout_vrai, ...m } = margeVraie(r.course, tok); bras[nom] = m; joues[nom] = r.niveaux; };
    mesurer('bandit', piloter(graine, monde, ctx, { depart: ORDRE_INITIAL, candidats: NIVEAUX }));
    mesurer('sans_engagement', piloter(graine, monde, ctx, { depart: planC, candidats: [...new Set(planC)] }));
  }
  return { graine, monde, ecartee: false, objet: tok, prix_reference: pref, cout_vrai: base.cout_vrai, cout_au_jour_183: arr(cout.cout, 3), decision_chaine: base.court.decisions.sans_galilee.niveau, joues, bras, secs: arr((Date.now() - t0) / 1000, 1) };
}

export async function agregerBandit(R) {
  const { tUnilateral } = await import('../../scripts/t3.js');
  const E = R.filter((r) => !r.ecartee && r.bras.bandit), A = NIVEAUX.map((u) => `aveugle:${u}`), moy = (v) => v.reduce((a, b) => a + b, 0) / v.length;
  const gain = (r, b, f = 'total') => (r.bras[b][f] - r.bras.nul[f]) / Math.abs(r.bras.nul.total), tous = ['chaine', 'bandit', 'sans_engagement', ...A];
  const moyennes = Object.fromEntries(tous.map((b) => [b, moy(E.map((r) => gain(r, b)))])), adv = A.reduce((a, b) => (moyennes[b] > moyennes[a] ? b : a));
  const ecart = (x, y) => tUnilateral(E.map((r) => gain(r, x) - gain(r, y)));
  const derniers = (r, b) => r.joues[b].slice(-8), apres = (r) => Number(A.reduce((a, b) => (r.bras[b].total > r.bras[a].total ? b : a)).split(':')[1]);
  return { entreprises: R.length, mesurees: E.length, moyennes, meilleur_aveugle: adv, D1: ecart('bandit', 'chaine'), D1_inverse: ecart('chaine', 'bandit'), D2: ecart('bandit', adv), D3: ecart('sans_engagement', 'chaine'),
    chaine_contre_aveugle: ecart('chaine', adv), sans_engagement_contre_aveugle: ecart('sans_engagement', adv), gain_bandit: tUnilateral(E.map((r) => gain(r, 'bandit'))), gain_chaine: tUnilateral(E.map((r) => gain(r, 'chaine'))),
    cout_exact: E.filter((r) => Math.abs(r.cout_au_jour_183 / r.cout_vrai - 1) < 0.001).length, cout_indisponible: R.filter((r) => !r.ecartee && !r.bras.bandit).length,
    bandit_finit_au_meilleur: E.filter((r) => { const d = derniers(r, 'bandit'), m = apres(r); return d.filter((u) => u === m).length >= 5; }).length,
    niveaux_distincts_bandit: moy(E.map((r) => new Set(r.joues.bandit.slice(5)).size)) };
}
export function direBandit(a) {
  const pct = (x) => `${(100 * x).toFixed(1)} %`, t = (k) => `${pct(k.moyenne)}, t = ${k.t.toFixed(2)} (seuil ${k.seuil}) → ${k.etabli ? 'établi' : 'non établi'}`;
  return [`${a.mesurees} entreprises mesurées sur ${a.entreprises}`, ...Object.entries(a.moyennes).map(([b, m]) => `  ${b.padEnd(18)} ${pct(m).padStart(8)}`),
    `D1 bandit > chaîne : ${t(a.D1)}`, `D1 inverse chaîne > bandit : ${t(a.D1_inverse)}`, `D2 bandit > meilleur aveugle (${a.meilleur_aveugle}) : ${t(a.D2)}`, `D3 sans engagement > chaîne : ${t(a.D3)}`,
    `chaîne > meilleur aveugle : ${t(a.chaine_contre_aveugle)} · sans engagement > meilleur aveugle : ${t(a.sans_engagement_contre_aveugle)}`,
    `coût exact au jour 183 : ${a.cout_exact} sur ${a.mesurees} · le bandit finit au meilleur niveau après coup : ${a.bandit_finit_au_meilleur} · niveaux distincts joués après l'initialisation : ${a.niveaux_distincts_bandit.toFixed(1)}`].join('\n');
}

// Exécution unique du test T3d (graines 6161 à 6220), consignée au registre : la clé du dossier interdit de la refaire.
export async function essaiBanditTest(reg, { sortie = null, graines = Array.from({ length: 60 }, (_, i) => 6161 + i), monde = 't3d' } = {}) {
  const P = 'essai-prix#T3D';
  reg.ajouter({ probleme: P, type: 'probleme', cle: P, auteur: 'registre', titre: 'Essai de prix commun (T3D) : la chaîne face au bandit de Thompson',
    question: 'Dans le monde où la bonne direction de prix varie, un bandit de Thompson nourri du coût de LAVOISIER fait-il mieux que la chaîne retenue (essai de 8 blocs puis décision) ? Marge simulée.',
    source: { generateur: 'LAVOISIER src/bench/generator.js piloté (L2, demande sensible L2b) ; protocole programme/t3d/PROTOCOLE_T3D.md', graine: `${graines[0]} à ${graines.at(-1)}`, statut: 'graines de test de T3D, exécution unique' },
    roles: { LAVOISIER: 'corps de l’entreprise, coût unitaire', CORTEX: 'plan d’essai de la chaîne', registre: 'bandit de Thompson, méthode de référence publiée' } });
  const R = [];
  for (const g of graines) {
    const r = essaiBandit(g, monde); R.push(r);
    if (r.ecartee || !r.bras.bandit) { reg.ajouter({ probleme: P, type: 'aveu', auteur: 'registre', motif: `Graine ${g} : ${r.ecartee ? `écartée (${r.motif})` : 'coût unitaire indisponible au jour 183, bandits non lancés'}.` }); continue; }
    const gain = (b) => Math.round(r.bras[b].total - r.bras.nul.total);
    const idExp = reg.ajouter({ probleme: P, type: 'experience', auteur: 'registre', but: [],
      plan: { duree: `Graine ${g} : 26 semaines sur le prix de ${r.objet}, jours ${J1} à 364 ; un prix par semaine, décidé par un bandit de Thompson sur cinq niveaux`, niveaux: r.joues.bandit },
      cout_prevu: { raison: 'non chiffré d’avance : le bandit choisit ses prix en cours de route' }, risque: { reversible: true, note: 'entreprise simulée : rien ne sort, aucun euro réel n’est en jeu' }, autorisation: 'automatique' });
    reg.ajouter({ probleme: P, type: 'resultat', auteur: 'banc', experience: idExp,
      mesures: { essai_prix: true, graine: g, decision: r.decision_chaine, decide_par: 'table', juge_cortex: 'non sollicité', marge_temoin_nul: Math.round(r.bras.nul.total), gain_collectif: gain('chaine'), gain_aveugle_plus_25: gain('aveugle:1'),
        gain_bandit: gain('bandit'), gain_sans_engagement: gain('sans_engagement'), gain_prix_tenu: gain('aveugle:0'), cout_vrai: r.cout_vrai, unite: '€ simulés, marge sur ventes de l’objet, jours 183 à 364' },
      cout_reel: { calcul_s: r.secs, jours: SEMAINES * BLOC } });
  }
  const a = await agregerBandit(R);
  if (sortie) (await import('node:fs')).writeFileSync(sortie, JSON.stringify({ protocole: 'programme/t3d/PROTOCOLE_T3D.md', agregat: a, entreprises: R }, null, 1) + '\n');
  reg.ajouter({ probleme: P, type: 'jalon', auteur: 'registre', compte: 'collectif', travail: 'T3D', mesure: 'gain moyen sur la marge de l’objet piloté, jours 183 à 364 : chaîne retenue contre bandit de Thompson (simulation)',
    avant: 'non mesuré', apres: `chaîne ${(100 * a.moyennes.chaine).toFixed(1)} %, bandit ${(100 * a.moyennes.bandit).toFixed(1)} %, sans engagement ${(100 * a.moyennes.sans_engagement).toFixed(1)} % (meilleur bras aveugle : ${(100 * a.moyennes[a.meilleur_aveugle]).toFixed(1)} %)`, source: 'programme/t3d/test.json' });
  console.error(direBandit(a));
  return a;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { writeFileSync } = await import('node:fs');
  const opt = (n, d) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : d; }, [a, b] = opt('--graines', '221-222').split('-').map(Number);
  if (a < 221 || (b ?? a) > 240) { console.error('mise au point : graines 221 à 240 seulement'); process.exit(1); }
  const R = [];
  for (let g = a; g <= (b ?? a); g++) { const r = essaiBandit(g); R.push(r); console.error(`graine ${g} : ${r.ecartee ? 'écartée' : `coût ${r.cout_au_jour_183} (vrai ${r.cout_vrai}) · bandit ${r.joues.bandit?.join(' ')} · ${r.secs} s`}`); }
  if (opt('--sortie')) writeFileSync(opt('--sortie'), JSON.stringify({ protocole: 'programme/t3d/PROTOCOLE_T3D.md', entreprises: R }, null, 1) + '\n');
  console.log(direBandit(await agregerBandit(R)));
}
