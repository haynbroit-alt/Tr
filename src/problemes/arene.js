// ARÈNE-1 — décider un prix : la chaîne prudente (tenant) face à deux prétendants sans essai.
// Règles : programme/arene/REGLES.md ; protocole : programme/arene/PROTOCOLE_ARENE_1.md.
import { writeFileSync } from 'node:fs';
import { PAS, J1 } from './essai-prix.js';
import { mesurer, niveauPrevu } from './essai-prix-atelier.js';
import { borne } from '../atelier.js';

export const MU = 1.651, TAU2 = 1.116, SEUIL = 1.97, TENANT = 'chaine', PRETENDANTS = ['direct', 'direct_tempere'];
// Estimateur bayésien empirique : la sensibilité est ramenée vers la moyenne, d'autant plus qu'elle est incertaine.
export function tempere(e, t) {
  if (e == null || !Number.isFinite(e) || t == null || !Number.isFinite(t) || t === 0) return MU;
  const se2 = (e / t) ** 2, w = TAU2 / (TAU2 + se2);
  return w * e + (1 - w) * MU;
}
const gainNiveau = (r, u) => (u === 0 ? r.gains.tenu : r.gains[`niveau:${u}`]);
export function entrer(graine, monde = 'arene1') {
  const r = mesurer(graine, monde);
  if (r.ecartee) return r;
  const e = tempere(r.traits.e, r.traits.t), u = niveauPrevu(r.prix_reference, r.cout_au_jour_183, (x) => PAS ** (-e * x)).u;
  return { ...r, e_tempere: Number(e.toFixed(3)), niveau_tempere: u, gains: { ...r.gains, direct_tempere: gainNiveau(r, u) } };
}
export function arbitrer(R, P = PRETENDANTS, decisions = [['direct', 'niveau_direct'], ['direct_tempere', 'niveau_tempere'], ['chaine', 'decision_chaine']], T = TENANT) {
  const E = R.filter((r) => !r.ecartee), moy = (v) => v.reduce((a, b) => a + b, 0) / v.length;
  const t = (d) => { const n = d.length, m = moy(d), et = Math.sqrt(d.reduce((s, x) => s + (x - m) ** 2, 0) / (n - 1) / n); return { n, moyenne: m, erreur_type: et, t: et > 0 ? m / et : 0 }; };
  const perd = (a) => E.filter((r) => r.gains[a] < r.gains.tenu).length, perdTenant = perd(T);
  const duels = Object.fromEntries(P.map((p) => {
    const brut = t(E.map((r) => r.gains[p] - r.gains[T])), bor = t(E.map((r) => borne(r.gains[p]) - borne(r.gains[T]))), perdantes = perd(p);
    const verdict = brut.t > SEUIL && perdantes <= perdTenant ? 'prend la place' : brut.t < -SEUIL ? 'relégué' : 'en lice';
    return [p, { ...brut, seuil: SEUIL, borne: bor, mieux: E.filter((r) => r.gains[p] > r.gains[T]).length, moins_bien: E.filter((r) => r.gains[p] < r.gains[T]).length, perdantes_face_a_prix_tenu: perdantes, verdict,
      lecture_bornee_contraire: (brut.t > SEUIL && bor.t <= 0) || (brut.t < -SEUIL && bor.t >= 0) }];
  }));
  return { entreprises: R.length, mesurees: E.length, moyennes: Object.fromEntries([T, ...P, 'tenu'].map((a) => [a, moy(E.map((r) => r.gains[a]))])), moyennes_bornees: Object.fromEntries([T, ...P, 'tenu'].map((a) => [a, moy(E.map((r) => borne(r.gains[a])))])),
    perdantes_du_tenant: perdTenant, duels, ...(P.includes('direct_tempere') ? { tempere_contre_direct: t(E.map((r) => r.gains.direct_tempere - r.gains.direct)) } : {}), tenant_contre_prix_tenu: t(E.map((r) => r.gains[T] - r.gains.tenu)),
    niveaux: Object.fromEntries(decisions.map(([a, k]) => [a, Object.fromEntries([-1, -0.5, 0, 0.5, 1].map((u) => [u, E.filter((r) => r[k] === u).length]))])),
    tenant_apres_le_tour: P.filter((p) => duels[p].verdict === 'prend la place').sort((a, b) => duels[b].moyenne - duels[a].moyenne)[0] ?? T };
}
export function direArene(a) {
  const pct = (x) => `${(100 * x).toFixed(1)} %`;
  return [`${a.mesurees} entreprises mesurées sur ${a.entreprises}`, ...Object.keys(a.moyennes).map((b) => `  ${b.padEnd(16)} ${pct(a.moyennes[b]).padStart(8)}   borné ${pct(a.moyennes_bornees[b]).padStart(7)}`),
    ...Object.keys(a.duels).map((p) => { const d = a.duels[p]; return `${p} − tenant : ${pct(d.moyenne)}, t = ${d.t.toFixed(2)} (seuil ±${d.seuil}) · borné ${pct(d.borne.moyenne)}, t = ${d.borne.t.toFixed(2)} · mieux dans ${d.mieux}, moins bien dans ${d.moins_bien} · perdantes face à prix tenu ${d.perdantes_face_a_prix_tenu} (tenant ${a.perdantes_du_tenant}) → ${d.verdict.toUpperCase()}`; }),
    `${a.tempere_contre_direct ? `tempéré − direct : ${pct(a.tempere_contre_direct.moyenne)}, t = ${a.tempere_contre_direct.t.toFixed(2)} · ` : ''}tenant − prix tenu : ${pct(a.tenant_contre_prix_tenu.moyenne)}, t = ${a.tenant_contre_prix_tenu.t.toFixed(2)}`,
    `niveaux choisis ${JSON.stringify(a.niveaux)}`, `tenant après le tour : ${a.tenant_apres_le_tour}`].join('\n');
}

// Exécution unique (graines 6701 à 6900), consignée au registre : la clé du dossier interdit de la refaire.
export async function areneTest(reg, { sortie = null, monde = 'arene1', graines = Array.from({ length: 200 }, (_, i) => 6701 + i) } = {}) {
  const P = 'arene#1';
  reg.ajouter({ probleme: P, type: 'probleme', cle: P, auteur: 'registre', titre: 'Arène, premier tour : décider un prix — la chaîne prudente face à deux méthodes sans essai',
    question: 'Une décision de prix prise sans essai, d’après l’historique des ventes et le coût de LAVOISIER (droite des moindres carrés, puis sa version bayésienne empirique), détrône-t-elle la chaîne prudente ? Marge simulée.',
    source: { generateur: 'LAVOISIER src/bench/generator.js piloté (L2, demande sensible L2b, hasard commun L2c) ; protocole programme/arene/PROTOCOLE_ARENE_1.md', graine: `${graines[0]} à ${graines.at(-1)}`, statut: 'graines de test d’ARÈNE-1, exécution unique' },
    roles: { LAVOISIER: 'corps de l’entreprise, coût unitaire', CORTEX: 'plan d’essai du tenant', registre: 'prétendants : droite sur l’historique, estimateur bayésien empirique' } });
  const R = [];
  for (const g of graines) {
    const r = entrer(g, monde); R.push(r);
    if (r.ecartee) { reg.ajouter({ probleme: P, type: 'aveu', auteur: 'registre', motif: `Graine ${g} : écartée (${r.motif}).` }); continue; }
    const eur = (x) => Math.round(x * Math.abs(r.marge_temoin_nul));
    const idExp = reg.ajouter({ probleme: P, type: 'experience', auteur: 'registre', but: [],
      plan: { duree: `Graine ${g} : 26 semaines sur le prix de ${r.objet}, jours ${J1} à 364 ; tenant (chaîne prudente, 8 semaines d’essai) face à deux décisions sans essai`, niveaux: r.plan_chaine },
      cout_prevu: { raison: 'non chiffré d’avance : c’est ce que le tour mesure' }, risque: { reversible: true, note: 'entreprise simulée : rien ne sort, aucun euro réel n’est en jeu' }, autorisation: 'automatique' });
    reg.ajouter({ probleme: P, type: 'resultat', auteur: 'banc', experience: idExp,
      mesures: { essai_prix: true, graine: g, decision: r.decision_chaine, decide_par: 'table, plan prudent (tenant)', juge_cortex: 'non sollicité', marge_temoin_nul: Math.round(r.marge_temoin_nul), gain_collectif: eur(r.gains.chaine), gain_aveugle_plus_25: eur(r.gains['niveau:1']),
        gain_direct: eur(r.gains.direct), gain_direct_tempere: eur(r.gains.direct_tempere), gain_prix_tenu: eur(r.gains.tenu), cout_vrai: r.cout_vrai, unite: '€ simulés, marge sur ventes de l’objet, jours 183 à 364' },
      cout_reel: { calcul_s: r.secs, jours: 182 } });
  }
  const a = arbitrer(R), pct = (x) => `${(100 * x).toFixed(1)} %`;
  if (sortie) writeFileSync(sortie, JSON.stringify({ protocole: 'programme/arene/PROTOCOLE_ARENE_1.md', agregat: a, entreprises: R }, null, 1) + '\n');
  reg.ajouter({ probleme: P, type: 'jalon', auteur: 'registre', compte: 'collectif', travail: 'ARENE-1', mesure: 'gain moyen sur la marge de l’objet piloté, jours 183 à 364 : tenant et prétendants du premier tour de l’arène (simulation)',
    avant: `tenant : chaîne prudente ${pct(a.moyennes.chaine)}`, apres: `direct ${pct(a.moyennes.direct)} (${a.duels.direct.verdict}), direct tempéré ${pct(a.moyennes.direct_tempere)} (${a.duels.direct_tempere.verdict}) ; tenant après le tour : ${a.tenant_apres_le_tour}`, source: 'programme/arene/tour-1.json' });
  console.error(direArene(a));
  return a;
}
