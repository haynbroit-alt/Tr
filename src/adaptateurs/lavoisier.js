// LAVOISIER — reconstruit l'ÉCONOMIE par conservation. Capacité utilisée ici : le bilan de matière (jalon M0, en
// développement, non gelé). Les organes 2 à 8 de sa conception (atlas, jumeau, générateur d'opportunités, gouverneur,
// registre des paris) ne sont pas écrits : ils ne sont donc ni branchés ni imités.
import { generate } from '../../moteurs/lavoisier/src/bench/generator.js';
import { devClass } from '../../moteurs/lavoisier/src/bench/classes.js';
import { DEV_ARCHETYPES } from '../../moteurs/lavoisier/src/bench/archetypes.js';
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

// Épreuve JOURNAL-ABÎMÉ (programme/abime) : 40 entreprises neuves, archétypes de développement, 1 ou 2 flux cachés.
export function entrepriseAbimee(graine) {
  if (!Number.isInteger(graine) || graine < 8001 || graine > 8040) throw new Error('JOURNAL-ABÎMÉ : graines 8001 à 8040 seulement');
  const classe = { archetype: DEV_ARCHETYPES[graine % 3], nHidden: 1 + (graine % 2), level: 'realiste' };
  const { observed, truth } = generate(graine, classe), { proxy, unlock } = seal(truth);
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
//   monde 't3b' (programme/t3b) : demande sensible au prix (L2b) ; mise au point 221 à 240, test 6041 à 6080 ;
//   monde 't3c' (programme/t3c) : même monde, confirmation de la chaîne retenue ; test 6081 à 6160.
// Les graines de test sont refusées hors de leur exécution unique.
export const T3_CLASSE = { archetype: 'negoce', nHidden: 1, level: 'realiste' };
const MONDES = { t3: { classe: T3_CLASSE, dev: [201, 220], test: [6001, 6040], cle: 'T3_TEST' }, t3b: { classe: { ...T3_CLASSE, demande: 'sensible' }, dev: [221, 240], test: [6041, 6080], cle: 'T3B_TEST' },
  t3c: { classe: { ...T3_CLASSE, demande: 'sensible' }, dev: [0, -1], test: [6081, 6160], cle: 'T3C_TEST' },
  t3d: { classe: { ...T3_CLASSE, demande: 'sensible' }, dev: [221, 240], test: [6161, 6220], cle: 'T3D_TEST' },   // T3d : face au bandit de Thompson
  t3e: { classe: { ...T3_CLASSE, demande: 'sensible', alea: 'commun' }, dev: [241, 260], test: [6221, 6280], cle: 'T3E_TEST' },
  t3f: { classe: { ...T3_CLASSE, demande: 'sensible', alea: 'commun' }, dev: [241, 260], test: [6281, 6400], cle: 'T3F_TEST' },
  t3g: { classe: { ...T3_CLASSE, demande: 'sensible', alea: 'commun' }, dev: [241, 260], test: [6401, 6700], cle: 'T3G_TEST' },
  t3h: { classe: { ...T3_CLASSE, demande: 'sensible', alea: 'commun' }, dev: [301, 500], test: [0, -1], cle: 'T3H_TEST' },   // test de T3h non exécuté (l'atelier a refusé) : ses graines passent à l'arène
  arene1: { classe: { ...T3_CLASSE, demande: 'sensible', alea: 'commun' }, dev: [301, 500], test: [6701, 6900], cle: 'ARENE1_TEST' },
  syn: { classe: { ...T3_CLASSE, demande: 'sensible', alea: 'commun' }, dev: [241, 260], test: [6901, 7000], cle: 'SYNERGIE_TEST' } };   // T3h : lot de l'atelier 301 à 500   // T3f : règle de marge sans essai, monde de T3e   // T3e : la même confrontation, hasard commun (L2c)   // T3c : confirmation, sans mise au point
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
