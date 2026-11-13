// Mondes synthétiques du prototype P1 : la vérité (modes cachés) n'est lue que par l'évaluation.
import { makeRng } from '../../src/rng.js';

export const T = 365, K = 3, L = 2, SD = 0.15;

export function kindOf(seed) { const m = seed % 6; return m <= 1 ? 'placebo' : m <= 4 ? 'modes' : 'mal-specifie'; }

// opts (prototype P2 uniquement ; sans opts, le monde de P1 est inchangé) :
//   flouLever : indice d'un levier qui ne change que 2 fois dans l'année, et l'unique mode s'en nourrit
//   extra(k, t, U) : terme additif sur la log-moyenne de la mesure k (forme statique, rupture, régime)
export function makeWorld(seed, kind = kindOf(seed), opts = {}) {
  const r = makeRng(seed * 9973 + 17);
  // structure de base
  const c = Array.from({ length: K }, () => r.uniform(1, 4));
  const dow = Array.from({ length: K }, () => Array.from({ length: 7 }, (_, d) => (d === 0 ? 0 : r.normal() * 0.15)));
  const g = Array.from({ length: K }, () => Array.from({ length: L }, () => r.normal() * 0.3));
  // leviers par blocs (excitation persistante)
  const U = [];
  let left = 0, cur = [0, 0];
  for (let t = 0; t < T; t++) {
    if (left <= 0) { cur = [r.uniform(-1, 1), r.next() < 0.3 ? 1 : 0]; left = r.int(5, 40); }
    U.push([...cur]); left--;
  }
  if (opts.flouLever != null) {
    const r2 = makeRng(seed * 31 + 7), l = opts.flouLever;
    const t1 = r2.int(60, 150), t2 = r2.int(200, 300), v = l === 0 ? [r2.uniform(-1, 1), r2.uniform(-1, 1), r2.uniform(-1, 1)] : [0, 1, 0];
    for (let t = 0; t < T; t++) U[t][l] = t < t1 ? v[0] : t < t2 ? v[1] : v[2];
  }
  // modes cachés
  const modes = [];
  if (kind === 'modes') {
    const n = r.next() < 0.5 ? 1 : 2;
    for (let i = 0; i < n; i++) {
      const tau = Math.exp(r.uniform(Math.log(3), Math.log(120)));
      const ns = r.next() < 0.6 ? 1 : 2;
      const idx = [];
      while (idx.length < ns) { const j = r.int(0, K + L - 1); if (!idx.includes(j)) idx.push(j); }
      modes.push({ tau, lam: 1 - 1 / tau, target: r.int(0, K - 1), sources: idx.map((j, q) => ({ idx: j, w: (q === 0 ? 1 : r.uniform(0.4, 1)) * (r.next() < 0.5 ? -1 : 1) })), strength: r.uniform(0.05, 0.25), a: 1 });
    }
  }
  // P3 : leviers imposés (plan d'expériences) à partir d'un jour donné ; rien ne change avant
  if (opts.overrideU) for (let t = 0; t < T; t++) { const v = opts.overrideU(t); if (v) U[t] = [...v]; }
  if (opts.flouLever != null) {
    const r3 = makeRng(seed * 37 + 11);
    modes.length = 0;
    modes.push({ tau: Math.exp(r3.uniform(Math.log(5), Math.log(40))), target: r3.int(0, K - 1), sources: [{ idx: K + opts.flouLever, w: 1 }], strength: 0.2, a: 1 });
    modes[0].lam = 1 - 1 / modes[0].tau;
  }
  const noise = Array.from({ length: T }, () => Array.from({ length: K }, () => r.normal()));
  const mis = kind === 'mal-specifie' ? { target: r.int(0, K - 1), t: r.int(100, 280), jump: (r.next() < 0.5 ? -1 : 1) * r.uniform(0.2, 0.4), volT: r.int(0, K - 1), volAt: r.int(100, 280), vol: r.uniform(1.6, 2.2) } : null;
  const simulate = () => {
    const Y = [], Z = modes.map(() => [0]);
    const zs = modes.map(() => 0);
    for (let t = 0; t < T; t++) {
      const y = [];
      for (let k = 0; k < K; k++) {
        let mu = c[k] + dow[k][t % 7] + g[k].reduce((s, gk, l) => s + gk * U[t][l], 0);
        modes.forEach((m, i) => { if (m.target === k) mu += m.a * zs[i]; });
        if (opts.extra) mu += opts.extra(k, t, U);
        let sd = SD;
        if (mis) { if (k === mis.target && t >= mis.t) mu += mis.jump; if (k === mis.volT && t >= mis.volAt) sd *= mis.vol; }
        y.push(mu + sd * noise[t][k]);
      }
      Y.push(y);
      // mise à jour des modes (sources du jour t → effet à partir de t+1)
      const src = [...y.map((v, k) => (v - c[k]) / 0.3), ...U[t]];
      modes.forEach((m, i) => { zs[i] = m.lam * zs[i] + (1 - m.lam) * m.sources.reduce((s, q) => s + q.w * src[q.idx], 0); Z[i].push(zs[i]); });
    }
    return { Y, Z };
  };
  // calibrage amorti : l'effet a l'écart-type voulu, même avec rétroaction (même bruit à chaque passe)
  if (modes.length) {
    const realized = () => { const { Z } = simulate(); return modes.map((m, i) => { const z = Z[i].slice(30).map((x) => m.a * x); const mu = z.reduce((s, x) => s + x, 0) / z.length; return Math.sqrt(z.reduce((s, x) => s + (x - mu) ** 2, 0) / z.length); }); };
    modes.forEach((m) => { m.a = 0; });
    const z0 = (() => { const { Z } = simulate(); return Z.map((z) => { const v = z.slice(30); const mu = v.reduce((s, x) => s + x, 0) / v.length; return Math.sqrt(v.reduce((s, x) => s + (x - mu) ** 2, 0) / v.length) || 1; }); })();
    modes.forEach((m, i) => { m.a = m.strength / z0[i]; });
    for (let pass = 0; pass < 8; pass++) {
      const r = realized();
      modes.forEach((m, i) => { if (!Number.isFinite(r[i]) || r[i] > 5) m.a /= 4; else if (r[i] > 0) m.a *= Math.sqrt(m.strength / r[i]); });
    }
  }
  const { Y, Z } = simulate();
  modes.forEach((m, i) => { const z = Z[i].slice(30).map((x) => m.a * x); const mu = z.reduce((s, x) => s + x, 0) / z.length; m.realized = Math.sqrt(z.reduce((s, x) => s + (x - mu) ** 2, 0) / z.length); });
  return { seed, kind, Y, U, truth: { modes: modes.map(({ tau, target, sources, realized }) => ({ tau, target, sources, realized })), mis } };
}
