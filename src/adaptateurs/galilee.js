// GALILÉE — découvre des LOIS (formes symboliques). Capacité utilisée ici : son mode « données fournies ».
// Son mode expérimental (il choisit ses mesures) exige un monde interrogeable, world.measure(x) : aucun des
// problèmes communs n'en offre aujourd'hui, donc il n'est pas branché.
import { Agent } from '../../moteurs/galilee/src/agent.js';
import { evalPoint, toString } from '../../moteurs/galilee/src/expr.js';
import { moteur } from './moteurs.js';

export const IDENTITE = moteur('galilee');

export function loiSurDonnees({ noms, cible, X, y, graine = 1 }) {
  const t0 = Date.now();
  const a = new Agent(null, { seed: graine, data: { names: noms, target: cible, X, y } });
  const h = a.run();
  const secs = (Date.now() - t0) / 1000;
  if (!h) return { texte: null, secs };
  return { texte: toString(h.expr, noms), f: (x) => evalPoint(h.expr, x), verdict: a.bilan?.verdict ?? null, pourquoi: a.bilan?.why ?? null, notes: a.bilan?.notes ?? [], points: y.length, secs };
}
