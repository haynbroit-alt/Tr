// Harnais : génère une entreprise, donne au système les SEULES données observées, puis évalue.
import { generate } from './generator.js';
import { evaluate, perfectPrediction } from './evaluate.js';
import { devClass, testClass } from './classes.js';

// La vérité est scellée pendant l'exécution du système : toute lecture lève une exception.
export function seal(truth) {
  let open = false;
  const proxy = new Proxy(truth, { get(t, k) { if (!open) throw new Error('accès interdit à la vérité pendant l’exécution du système'); return t[k]; } });
  return { proxy, unlock: () => { open = true; } };
}

export function classOf(seed) { return seed <= 100 ? devClass(seed) : testClass(seed); }

export function runOne(seed, method, { cls = classOf(seed) } = {}) {
  const { observed, truth } = generate(seed, cls);
  const { proxy, unlock } = seal(truth);
  const t0 = Date.now();
  const pred = method === 'parfait' ? null : method(structuredClone(observed), { truth: proxy });
  const ms = Date.now() - t0;
  unlock();
  const m = evaluate(truth, pred ?? perfectPrediction(truth));
  return { seed, archetype: cls.archetype, level: cls.level, nHidden: truth.hidden.length, placebo: truth.hidden.length === 0, lignes: observed.journal.length, ms, ...m };
}
