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
export const RISQUE_DEV = { fausses_detections_par_entreprise: 0.20, placebos_touches: '1 sur 34', flux_retrouves: '70 sur 95', source: 'LAVOISIER bench/DEV_M0_BILAN.md (développement, bilan non gelé)' };

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
