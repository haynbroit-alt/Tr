// Problème commun n° 1 — « forme manquante » (monde de développement de CORTEX v6, prototype P2).
// CORTEX signale ce que son langage n'exprime pas ; GALILÉE propose une loi pour l'écart ; CORTEX la conteste par
// un pari sur des jours neufs, puis conçoit l'expérience qui tranche. LAVOISIER n'a rien à reconstruire ici.
import * as G from '../adaptateurs/galilee.js';
import * as C from '../adaptateurs/cortex.js';
import * as L from '../adaptateurs/lavoisier.js';

// Vérité du banc, recopiée de p2.js (FORMS n'y est pas exporté). Lue APRÈS tous les jugements.
const VRAIES = { carre: (u) => 0.3 * u[0] * u[0], saturation: (u) => (0.4 * u[0]) / (1 + 2 * Math.abs(u[0])), interaction: (u) => 0.3 * u[0] * u[1] };
const GRILLE = [-1, -0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75, 1].flatMap((a) => [0, 1].map((b) => [a, b]));
// part de la forme vraie (hors constante et effets linéaires, que le modèle de CORTEX contient déjà) expliquée par la formule
function accord(f, g) {
  const res = (h) => { const v = GRILLE.map(h), X = GRILLE.map((u) => [1, u[0], u[1]]); const b = mc(X, v); return v.map((y, i) => y - X[i].reduce((s, x, j) => s + x * b[j], 0)); };
  const a = res(f), b = res(g), ab = a.reduce((s, x, i) => s + x * b[i], 0), aa = a.reduce((s, x) => s + x * x, 0), bb = b.reduce((s, x) => s + x * x, 0);
  return aa > 1e-12 && bb > 1e-12 ? (ab * ab) / (aa * bb) : 0;
}
function mc(X, y) { // moindres carrés 3 colonnes
  const A = [0, 1, 2].map((i) => [0, 1, 2].map((j) => X.reduce((s, r) => s + r[i] * r[j], 0) + (i === j ? 1e-9 : 0))), b = [0, 1, 2].map((i) => X.reduce((s, r, q) => s + r[i] * y[q], 0));
  for (let c = 0; c < 3; c++) for (let r = 0; r < 3; r++) if (r !== c) { const k = A[r][c] / A[c][c]; for (let j = 0; j < 3; j++) A[r][j] -= k * A[c][j]; b[r] -= k * b[c]; }
  return b.map((v, i) => v / A[i][i]);
}
const arr = (x, n = 3) => (x == null || !Number.isFinite(x) ? null : Number(x.toFixed(n)));

export function formeManquante(reg, graine) {
  const P = `forme-manquante#${graine}`, reproduire = `node bin/commun.js executer forme-manquante --graine ${graine}`;
  const base = { probleme: P };
  reg.ajouter({ ...base, type: 'probleme', cle: P, auteur: 'registre', titre: `Forme manquante (monde ${graine})`,
    question: 'Trois mesures quotidiennes, deux leviers, 365 jours. Le modèle de CORTEX suffit-il ? Sinon, quelle loi manque, et peut-on la démontrer ?',
    source: { generateur: 'CORTEX research/v6/p2.js, makeWorld2', graine, classe: 'forme', statut: 'graine de développement' },
    roles: { CORTEX: 'sonde, pari, plan d’expériences', GALILÉE: 'forme de l’écart', LAVOISIER: 'aucun (pas de comptabilité)' } });

  // 1. CORTEX : modèle sur les jours 0–149, sonde sur 28–271, pari passif sur 272–364
  const s = C.sonder(graine, 'forme');
  const k = s.mesures.findIndex((m) => m.diag === 'hors de portée' && m.fam === 'forme' && s.formules[`reel:${m.target}`]);
  const diagnostics = s.mesures.map((m) => ({ mesure: m.target, diagnostic: m.diag, famille: m.fam, logE: arr(m.logE, 2) }));
  if (k < 0) {
    reg.ajouter({ ...base, type: 'aveu', auteur: 'CORTEX', moteur: C.IDENTITE, motif: 'La sonde ne signale aucune forme manquante dans ce monde : rien à transmettre à GALILÉE.', contenu: { diagnostics, seuil: arr(s.seuil_sonde, 2) } });
    return;
  }
  const m = s.mesures[k], g = s.formules[`reel:${m.target}`];
  const idSonde = reg.ajouter({ ...base, type: 'affirmation', auteur: 'CORTEX', moteur: C.IDENTITE, sujet: `mesure ${m.target} : structure manquante`,
    enonce: `La mesure ${m.target} contient une structure prévisible que mon modèle n’exprime pas, de la famille « forme » (fonction non linéaire des leviers).`,
    certitude: { niveau: 'hors de portée', mesure: { nom: 'log E (pari invariant)', valeur: arr(m.logE, 2), seuil: arr(s.seuil_sonde, 2) }, garantie: `existence garantie au risque α = ${C.ALPHA} sur les trois mesures ; la famille est une attribution, non garantie` },
    contenu: { diagnostics },
    preuve: { methode: 'modes cachés ajustés sur les jours 0–149, sonde par pari invariant sur les jours 28–271', reproduire },
    cout: { calcul_s: arr(s.secs, 1), experiences: 0 } });

  // 2. GALILÉE : la forme de l'écart (appel fait par p2.js à sa copie gelée de GALILÉE, identique à moteurs/galilee)
  if (!g || m.galilee?.constant) {
    reg.ajouter({ ...base, type: 'aveu', auteur: 'GALILÉE', moteur: G.IDENTITE, depend_de: [idSonde], motif: `Aucune loi non constante trouvée pour l’écart de la mesure ${m.target}.` });
    return;
  }
  const idLoi = reg.ajouter({ ...base, type: 'affirmation', auteur: 'GALILÉE', moteur: G.IDENTITE, depend_de: [idSonde], sujet: `mesure ${m.target} : loi de l’écart`,
    enonce: `écart(mesure ${m.target}) ≈ ${g.text}`,
    certitude: { ...{ niveau: 'hypothèse', verdict_moteur: g.verdict ?? 'aucun' }, garantie: 'aucune : loi ajustée sur des jours déjà observés, leviers subis' },
    contenu: { formule: g.text, variables: ['u0', 'u1'] },
    preuve: { methode: 'recherche symbolique sur les écarts du modèle de CORTEX (jours 28–271), avec second avis interne', reproduire },
    cout: { calcul_s: null, note: 'inclus dans le temps de la sonde', experiences: 0 } });

  // 3. CORTEX conteste : pari passif sur les 93 jours suivants
  const j0 = m.galilee;
  reg.ajouter({ ...base, type: 'verification', auteur: 'CORTEX', moteur: C.IDENTITE, cible: idLoi, portee: 'pari', eleve_a: 'empirique',
    methode: 'pari invariant sur les jours 272–364, leviers tels qu’ils se sont produits (plan passif)', verdict: j0.accepted ? 'confirme' : 'indecis',
    mesure: { nom: 'log E', valeur: arr(j0.logE, 2), seuil: arr(C.SEUIL_PARI, 2) } });
  if (!j0.accepted) reg.ajouter({ ...base, type: 'contestation', auteur: 'CORTEX', moteur: C.IDENTITE, cible: idLoi,
    motif: `GALILÉE juge sa loi « ${g.verdict ?? 'sans verdict'} ». Sur 93 jours neufs, elle ne gagne pas son pari (log E = ${arr(j0.logE, 2)}, seuil ${arr(C.SEUIL_PARI, 2)}) et ne réduit pas mon erreur de prévision (${arr(j0.rmse0, 4)} → ${arr(j0.rmse1, 4)}). Les leviers ont peut-être trop peu varié pour départager : je propose une expérience.`,
    preuve: { logE: arr(j0.logE, 2), rmse_sans: arr(j0.rmse0, 4), rmse_avec: arr(j0.rmse1, 4) } });

  // 4. Expérience commune : CORTEX choisit les réglages là où la loi de GALILÉE et son modèle divergent le plus
  let totalCalcul = s.secs;
  if (!j0.accepted) {
    const p = C.planActif(g);
    if (!p) { reg.ajouter({ ...base, type: 'aveu', auteur: 'CORTEX', moteur: C.IDENTITE, depend_de: [idLoi], motif: 'Aucun plan d’expériences faisable pour cette formule.' }); return; }
    const dansBudget = p.cout.u0 <= C.BUDGET.u0 + 1e-9 && p.cout.u1 <= C.BUDGET.u1 + 1e-9;
    const idExp = reg.ajouter({ ...base, type: 'experience', auteur: 'CORTEX', moteur: C.IDENTITE, but: [idLoi],
      plan: { duree: `${C.NB} blocs de ${C.BLOC} jours (jours ${C.C0} à 364)`, reglages: p.plan, fixe_avant: 'le plan ne dépend que de la formule, figée avant les jours neufs' },
      cout_prevu: { moyenne_abs_u0: arr(p.cout.u0), part_jours_u1: arr(p.cout.u1), jours: p.cout.jours, plafond: C.BUDGET, unite: 'effort de levier (ce monde n’a pas d’euros)' },
      risque: { fausse_confirmation: `≤ ${C.ALPHA} (garantie du pari, plan fixé d’avance)`, domaine: 'réglages déjà observés (u0 ∈ [−1 ; 1], u1 ∈ {0 ; 1})', reversible: true },
      autorisation: dansBudget ? 'automatique' : 'humaine requise' });
    if (!dansBudget) return;
    const s2 = C.sonder(graine, 'forme', { plan: p.plan });
    totalCalcul += s2.secs;
    const j1 = s2.mesures[k].galilee, g2 = s2.formules[`reel:${m.target}`];
    reg.ajouter({ ...base, type: 'resultat', auteur: 'CORTEX', moteur: C.IDENTITE, experience: idExp,
      mesures: { logE: arr(j1?.logE, 2), seuil: arr(C.SEUIL_PARI, 2), pari_gagne: !!j1?.accepted, rmse_sans: arr(j1?.rmse0, 4), rmse_avec: arr(j1?.rmse1, 4), meme_formule: g2?.text === g.text },
      cout_reel: { moyenne_abs_u0: arr(p.cout.u0), part_jours_u1: arr(p.cout.u1), jours: p.cout.jours, calcul_s: arr(s2.secs, 1) } });
    if (g2?.text === g.text) reg.ajouter({ ...base, type: 'verification', auteur: 'CORTEX', moteur: C.IDENTITE, cible: idLoi, portee: 'pari', eleve_a: 'empirique',
      methode: 'pari invariant sur les jours 272–364, réglages du plan d’expériences commun', verdict: j1.accepted ? 'confirme' : 'indecis',
      mesure: { nom: 'log E', valeur: arr(j1.logE, 2), seuil: arr(C.SEUIL_PARI, 2) } });

    // 5. Témoin négatif : une formule fausse par construction, jugée sous un plan construit pour la confirmer
    const autre = s.mesures.find((x) => x.target !== m.target && x.diag === 'compris');
    if (autre) {
      const faux = { text: 'u0³', f: (u) => u[0] ** 3 }, pf = C.planActif(faux);
      const idFaux = reg.ajouter({ ...base, type: 'affirmation', auteur: 'registre', sujet: `mesure ${autre.target} : témoin négatif`,
        enonce: `écart(mesure ${autre.target}) ≈ ${faux.text} — formule injectée exprès, que rien ne soutient (mesure diagnostiquée « compris »).`,
        certitude: { niveau: 'hypothèse', garantie: 'aucune : elle sert à éprouver la procédure de confirmation' },
        preuve: { methode: 'injection (crochet inject de p2.js)', reproduire }, cout: { calcul_s: 0, experiences: 0 } });
      const s3 = C.sonder(graine, 'forme', { plan: pf.plan, injecter: { k: autre.target, g: faux } });
      totalCalcul += s3.secs;
      const j3 = s3.mesures.find((x) => x.target === autre.target).injected;
      reg.ajouter({ ...base, type: 'verification', auteur: 'CORTEX', moteur: C.IDENTITE, cible: idFaux, portee: 'temoin-negatif',
        methode: 'même pari, sous un plan d’expériences construit pour confirmer la formule fausse', verdict: j3.accepted ? 'confirme' : 'indecis',
        mesure: { nom: 'log E', valeur: arr(j3.logE, 2), seuil: arr(C.SEUIL_PARI, 2) }, attendu: 'indecis' });
    }
    reg.ajouter({ ...base, type: 'economie', auteur: 'registre', cible: idExp,
      cout: { leviers: { moyenne_abs_u0: arr(p.cout.u0), part_jours_u1: arr(p.cout.u1), jours: p.cout.jours }, calcul_s: arr(totalCalcul, 1) },
      risque: { fausse_confirmation: `≤ ${C.ALPHA}` },
      gain: { base: 'non mesurable', valeur: null, unite: '€', raison: 'ce monde synthétique n’a ni prix ni comptabilité : confirmer la loi ne peut pas y être converti en euros' } });
  }

  // 6. Vérité du banc (ouverte seulement maintenant)
  const v = s.verite, r2 = v.form && v.target === m.target ? accord(VRAIES[v.form], g.f) : 0;
  reg.ajouter({ ...base, type: 'verification', auteur: 'banc', cible: idSonde, portee: 'verite-du-banc', methode: 'lecture de la vérité du générateur après tous les jugements',
    verdict: v.target === m.target && v.family === 'forme' ? 'confirme' : 'refute', mesure: { mesure_touchee: v.target, famille: v.family } });
  reg.ajouter({ ...base, type: 'verification', auteur: 'banc', cible: idLoi, portee: 'verite-du-banc', methode: 'part de la forme vraie (hors constante et effets linéaires) expliquée par la formule, sur la grille des réglages',
    verdict: r2 >= 0.9 ? 'confirme' : r2 < 0.5 ? 'refute' : 'indecis', mesure: { nom: 'R²', valeur: arr(r2), forme_vraie: v.form } });

  reg.ajouter({ ...base, type: 'aveu', auteur: 'LAVOISIER', moteur: L.IDENTITE, motif: 'Ce monde ne contient aucun journal d’événements ni aucun euro : il n’y a pas de bilan de matière à dresser, donc aucun gain économique à mesurer.' });
}
