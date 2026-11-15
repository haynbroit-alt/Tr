// LAVOISIER — reconstruit l'ÉCONOMIE par conservation. Capacité utilisée ici : le bilan de matière (jalon M0, en
// développement, non gelé). Les organes 2 à 8 de sa conception (atlas, jumeau, générateur d'opportunités, gouverneur,
// registre des paris) ne sont pas écrits : ils ne sont donc ni branchés ni imités.
import { generate } from '../../moteurs/lavoisier/src/bench/generator.js';
import { devClass } from '../../moteurs/lavoisier/src/bench/classes.js';
import { seal } from '../../moteurs/lavoisier/src/bench/harness.js';
import { evaluate } from '../../moteurs/lavoisier/src/bench/evaluate.js';
import { bilan } from '../../moteurs/lavoisier/src/bilan/index.js';
import { moteur, graineDev } from './moteurs.js';

export const IDENTITE = moteur('lavoisier');
// Mesuré en développement (bench/DEV_M0_BILAN.md du dépôt, 100 graines) : ce ne sont pas des résultats de test.
export const RISQUE_DEV = { fausses_detections_par_entreprise: 0.06, placebos_touches: '1 sur 34', flux_retrouves: '85 sur 95', source: 'LAVOISIER bench/DEV_M0_BILAN.md (développement, bilan non gelé ; 0,12 fausse détection par entreprise en désordre réaliste)' };

// Entreprise opaque de développement. La vérité est scellée : toute lecture avant ouvrir() lève une exception.
export function entreprise(graine) {
  const classe = devClass(graineDev(graine));
  const { observed, truth } = generate(graine, classe);
  const { proxy, unlock } = seal(truth);
  return { classe, observe: observed, verite: proxy, ouvrir: unlock };
}

export function bilanMatiere(observe) {
  const t0 = Date.now();
  const corps = bilan(structuredClone(observe));
  return { corps, secs: (Date.now() - t0) / 1000 };
}

export const evaluer = (verite, corps) => evaluate(verite, corps);

// Essai de prix commun (programme/t3/PROTOCOLE_T3.md) : entreprise de négoce pilotable (L2), même vérité scellée.
// Graines de mise au point 201 à 220 ; graines de test 6001 à 6040, refusées hors de l'exécution unique.
export const T3_CLASSE = { archetype: 'negoce', nHidden: 1, level: 'realiste' };
export function entreprisePilotee(graine, pilotage = []) {
  const dev = graine >= 201 && graine <= 220, test = graine >= 6001 && graine <= 6040;
  if (!Number.isInteger(graine) || !(dev || test)) throw new Error(`graine ${graine} refusée : l’essai de prix travaille sur 201 à 220 (mise au point) et 6001 à 6040 (test)`);
  if (test && process.env.T3_TEST !== 'exécution-unique') throw new Error('graines de test de T3 refusées : exécution unique, après les réglages écrits au protocole');
  const { observed, truth } = generate(graine, T3_CLASSE, pilotage);
  const { proxy, unlock } = seal(truth);
  return { observe: observed, verite: proxy, ouvrir: unlock };
}
