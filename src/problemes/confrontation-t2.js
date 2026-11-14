// Confrontation T2 — CORTEX juge les lois quantité–prix de GALILÉE sur les débits reconstruits par LAVOISIER.
// Possible depuis que CORTEX exporte son juge (travail C2, research/v6/juge.js, copie gelée dans moteurs/cortex).
// Le pari est joué sur les jours 272 à 364, que ni LAVOISIER ni GALILÉE n'ont choisis : leviers subis, donc une
// confirmation n'élève la loi qu'à « empirique » si le pari est gagné ; l'exogénéité restant non garantie, la
// réserve est consignée dans la vérification.
import * as L from '../adaptateurs/lavoisier.js';
import { moteur } from '../adaptateurs/moteurs.js';
import { recevable, analyser, jugerFormule } from '../../moteurs/cortex/research/v6/juge.js';
import { parse, evalPoint } from '../../moteurs/galilee/src/expr.js';
import { debits } from './entreprise-opaque.js';

const JOURS = 365;
const arr = (x, n = 2) => (x == null || !Number.isFinite(x) ? null : Number(x.toFixed(n)));

export function confrontationT2(reg) {
  const P = 'confrontation#T2', IDC = { ...moteur('cortex') };
  const lois = reg.etat().filter((e) => e.auteur === 'GALILÉE' && e.sujet.includes('loi quantité–prix') && e.niveau === 'hypothèse');
  reg.ajouter({ probleme: P, type: 'probleme', cle: P, auteur: 'registre', titre: 'Confrontation T2 : CORTEX juge les lois de prix de GALILÉE',
    question: `${lois.length} lois quantité–prix de GALILÉE sont restées des hypothèses faute de juge. Le juge exporté de CORTEX (C2) peut-il les confirmer ou non sur les jours 272 à 364, jamais vus par elles ?`,
    source: { generateur: 'juge exporté de CORTEX (research/v6/juge.js) sur les débits de LAVOISIER', graine: 'graines de développement', statut: 'confrontation' } });
  let n = 0;
  const parProbleme = {};
  for (const l of lois) (parProbleme[l.probleme] ??= []).push(l);
  for (const [pb, ls] of Object.entries(parProbleme)) {
    const graine = Number(pb.split('#')[1]);
    const E = L.entreprise(graine), { corps } = L.bilanMatiere(E.observe);
    const D = debits(E.observe, corps, 3);
    if (D.length < 3) { reg.ajouter({ probleme: pb, type: 'aveu', auteur: 'registre', motif: `T2 : la transmission corrigée (183 jours actifs) ne rend plus trois débits pour la graine ${graine} ; les lois de ce dossier ne peuvent pas être rejugées.` }); continue; }
    const Y = Array.from({ length: JOURS }, (_, t) => D.map((d) => Math.log(d.q[t] + 1)));
    const U = Array.from({ length: JOURS }, (_, t) => [Math.log(D[0].p[t]), Math.log(D[1].p[t])]);
    const rec = recevable({ Y, U });
    if (!rec.ok) { reg.ajouter({ probleme: pb, type: 'aveu', auteur: 'CORTEX', moteur: IDC, motif: `T2 : séries non recevables (${rec.raisons[0]}).` }); continue; }
    const an = analyser({ Y, U });
    for (const l of ls) {
      const objet = reg.get(l.id).enonce.match(/quantité hebdomadaire de (\S+)/)?.[1];
      const k = D.findIndex((d) => d.objet === objet);
      const j = k >= 0 && k <= 1 ? k : -1;   // le prix transmis comme levier n'existe que pour les deux premiers débits
      if (k < 0 || j < 0) { reg.ajouter({ probleme: pb, type: 'aveu', auteur: 'CORTEX', moteur: IDC, depend_de: [l.id], motif: `T2 : le débit ${objet} n’a pas de levier de prix transmis ; sa loi ne peut pas être mise en pari.` }); continue; }
      const formule = reg.get(l.id).contenu.formule;
      let expr; try { expr = parse(formule, ['p']); } catch { reg.ajouter({ probleme: pb, type: 'aveu', auteur: 'CORTEX', moteur: IDC, depend_de: [l.id], motif: `T2 : formule illisible (${formule}).` }); continue; }
      const g = { text: formule, f: (u) => evalPoint(expr, [Math.exp(u[j])]) };
      const v = jugerFormule(an, k, g);
      n++;
      reg.ajouter({ probleme: pb, type: 'verification', auteur: 'CORTEX', moteur: IDC, cible: l.id, portee: 'pari', eleve_a: 'empirique',
        methode: `juge exporté (C2) : pari invariant de la loi « ${formule} » sur les jours 272–364 du débit ${objet}, leviers tels qu’ils se sont produits. Réserve : prix subis, exogénéité non garantie ; le pari certifie que la forme explique des jours neufs, pas qu’un changement de prix produirait cet effet.`,
        verdict: v.constant ? 'indecis' : v.accepted ? 'confirme' : 'indecis',
        mesure: { nom: 'log E', valeur: arr(v.logE), seuil: arr(v.seuil), rmse_sans: arr(v.rmse0, 4), rmse_avec: arr(v.rmse1, 4) } });
    }
  }
  reg.ajouter({ probleme: P, type: 'jalon', auteur: 'registre', compte: 'collectif', travail: 'T2', mesure: 'lois de GALILÉE jugées par CORTEX sur les débits de LAVOISIER', avant: 0, apres: n, source: 'src/problemes/confrontation-t2.js' });
  return { lois: lois.length, jugees: n };
}
