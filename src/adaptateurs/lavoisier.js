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

// Essais de prix communs : entreprise de négoce pilotable (L2), même vérité scellée.
//   monde 't3'  (programme/t3)  : simulateur d'origine ; mise au point 201 à 220, test 6001 à 6040 ;
//   monde 't3b' (programme/t3b) : demande sensible au prix (L2b) ; mise au point 221 à 240, test 6041 à 6080.
// Les graines de test sont refusées hors de leur exécution unique.
export const T3_CLASSE = { archetype: 'negoce', nHidden: 1, level: 'realiste' };
const MONDES = { t3: { classe: T3_CLASSE, dev: [201, 220], test: [6001, 6040], cle: 'T3_TEST' }, t3b: { classe: { ...T3_CLASSE, demande: 'sensible' }, dev: [221, 240], test: [6041, 6080], cle: 'T3B_TEST' } };
export function entreprisePilotee(graine, pilotage = [], monde = 't3') {
  const M = MONDES[monde];
  if (!M) throw new Error(`monde inconnu : ${monde}`);
  const dans = ([a, b]) => Number.isInteger(graine) && graine >= a && graine <= b;
  if (!dans(M.dev) && !dans(M.test)) throw new Error(`graine ${graine} refusée : ce monde travaille sur ${M.dev.join(' à ')} (mise au point) et ${M.test.join(' à ')} (test)`);
  if (dans(M.test) && process.env[M.cle] !== 'exécution-unique') throw new Error('graines de test refusées : exécution unique, après les réglages écrits au protocole');
  const { observed, truth } = generate(graine, M.classe, pilotage);
  const { proxy, unlock } = seal(truth);
  return { observe: observed, verite: proxy, ouvrir: unlock };
}
