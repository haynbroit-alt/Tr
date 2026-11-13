// CORTEX — découvre des MÉCANISMES (modes cachés, structure manquante) et conçoit des plans d'expériences.
// Capacités utilisées, toutes issues de research/v6 (prototypes P1, P2, P3), sans modification :
//   - discover({Y, U})      : modes lents à τ continu, acceptés par pari invariant (générique, mais 2 leviers exactement) ;
//   - runWorld(graine, …)   : sonde « hors de portée » + appel à sa copie de GALILÉE + pari sur des jours neufs
//                             (lié à SES mondes synthétiques : la sonde n'est pas exportée pour d'autres données) ;
//   - activePlan(formule)   : plan d'expériences D-optimal sous budget pour confirmer une formule.
import { discover } from '../../moteurs/cortex/research/v6/engine.js';
import { runWorld } from '../../moteurs/cortex/research/v6/p2.js';
import { activePlan } from '../../moteurs/cortex/research/v6/p3.js';
import { moteur, graineDev } from './moteurs.js';

export const IDENTITE = moteur('cortex');
export const ALPHA = 0.1;                       // risque fixé dans engine.js et p2.js
export const SEUIL_PARI = Math.log(1 / ALPHA);  // pari sur une formule figée (p2.js, judge)
export const C0 = 272, BLOC = 7, NB = 13;       // jours neufs (p3.js)
export const BUDGET = { u0: 0.5, u1: 0.3 };     // moyenne de |u0| et part de jours u1 = 1 (PROTOCOLE_P3.md)

export function modesCaches({ Y, U }) {
  if (!Y.length || Y.length < 90) throw new Error('CORTEX : il faut au moins 90 jours');
  if (U.some((u) => u.length !== 2)) throw new Error('CORTEX (engine.js) suppose exactement deux leviers');
  const K = Y[0].length, t0 = Date.now();
  const res = discover({ Y, U }, { method: 'p1' });
  return { modes: res.accepted.map((a) => ({ cible: a.target, tau: a.tau, poids: a.w, accepte_au_jour: a.acceptedAt, logE: a.logE })), seuil: Math.log((2 * K) / ALPHA), secs: (Date.now() - t0) / 1000 };
}

// Sonde + formule de GALILÉE + pari passif, sur un monde de développement de P2.
export function sonder(graine, classe, { plan = null, injecter = null } = {}) {
  graineDev(graine);
  const formules = {};
  const world = { cls: classe };
  if (plan) world.overrideU = (t) => (t >= C0 ? plan[Math.min(NB - 1, Math.floor((t - C0) / BLOC))] : null);
  const r = runWorld(graine, { world, inject: injecter ?? undefined, onFormula: ({ k, kind, g }) => { formules[`${kind}:${k}`] = g; } });
  return { mesures: r.targets, formules, verite: r.truth, secs: r.secs, seuil_sonde: Math.log(3 / ALPHA) };
}

export function planActif(formule) {
  const plan = activePlan(formule);
  if (!plan) return null;
  return { plan, cout: { u0: plan.reduce((s, u) => s + Math.abs(u[0]), 0) / NB, u1: plan.reduce((s, u) => s + u[1], 0) / NB, jours: NB * BLOC } };
}
