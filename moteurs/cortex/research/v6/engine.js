// Prototype P1 : modes cachés continus (A) + acceptation par pari, inférence universelle (B).
// Le moteur ne voit que Y (mesures en log) et U (leviers). Aucune vérité.
import { lgamma } from '../../src/rng.js';

// ---------- algèbre linéaire minimale ----------
function chol(A, p) {
  const L = new Float64Array(p * p);
  for (let i = 0; i < p; i++) for (let j = 0; j <= i; j++) {
    let s = A[i * p + j];
    for (let k = 0; k < j; k++) s -= L[i * p + k] * L[j * p + k];
    if (i === j) { if (s <= 1e-12) s = 1e-12; L[i * p + i] = Math.sqrt(s); } else L[i * p + j] = s / L[j * p + j];
  }
  return L;
}
function cholSolve(L, b, p) {
  const y = new Float64Array(p), x = new Float64Array(p);
  for (let i = 0; i < p; i++) { let s = b[i]; for (let k = 0; k < i; k++) s -= L[i * p + k] * y[k]; y[i] = s / L[i * p + i]; }
  for (let i = p - 1; i >= 0; i--) { let s = y[i]; for (let k = i + 1; k < p; k++) s -= L[k * p + i] * x[k]; x[i] = s / L[i * p + i]; }
  return x;
}
const logdetL = (L, p) => { let s = 0; for (let i = 0; i < p; i++) s += 2 * Math.log(L[i * p + i]); return s; };

// statistiques suffisantes d'une régression
class Stats {
  constructor(p) { this.p = p; this.XtX = new Float64Array(p * p); this.Xty = new Float64Array(p); this.yty = 0; this.n = 0; }
  add(x, y) { const p = this.p; for (let i = 0; i < p; i++) { const xi = x[i]; if (xi === 0) continue; for (let j = 0; j < p; j++) this.XtX[i * p + j] += xi * x[j]; this.Xty[i] += xi * y; } this.yty += y * y; this.n++; }
}
// sous-statistiques (colonnes retenues)
function subStats(S, idx) { const q = idx.length, R = new Stats(q); for (let a = 0; a < q; a++) { R.Xty[a] = S.Xty[idx[a]]; for (let b = 0; b < q; b++) R.XtX[a * q + b] = S.XtX[idx[a] * S.p + idx[b]]; } R.yty = S.yty; R.n = S.n; return R; }
// Normale–Inverse-Gamma : prior β|σ² ~ N(0, σ² V0), σ² ~ IG(A0, B0)
const A0 = 2, B0 = 0.02;
function nig(S, v0, a0 = A0, b0 = B0) {
  const p = S.p, P = new Float64Array(S.XtX);
  for (let i = 0; i < p; i++) P[i * p + i] += 1 / v0[i];
  const L = chol(P, p), m = cholSolve(L, S.Xty, p);
  let q = 0; for (let i = 0; i < p; i++) q += m[i] * S.Xty[i];
  const an = a0 + S.n / 2, bn = Math.max(1e-12, b0 + 0.5 * (S.yty - q));
  const logML = -0.5 * S.n * Math.log(2 * Math.PI) + 0.5 * (-logdetL(L, p) - v0.reduce((s, v) => s + Math.log(v), 0)) + a0 * Math.log(b0) - an * Math.log(bn) + lgamma(an) - lgamma(a0);
  return { L, m, an, bn, logML };
}
function predLogDens(post, x, y, p) {
  const v = cholSolve(post.L, x, p); let q = 0, mu = 0;
  for (let i = 0; i < p; i++) { q += x[i] * v[i]; mu += x[i] * post.m[i]; }
  const nu = 2 * post.an, s2 = (post.bn / post.an) * (1 + q), z = (y - mu) ** 2 / s2;
  return lgamma((nu + 1) / 2) - lgamma(nu / 2) - 0.5 * Math.log(nu * Math.PI * s2) - ((nu + 1) / 2) * Math.log(1 + z / nu);
}
// log-vraisemblance gaussienne MAXIMISÉE (β, σ libres) — dénominateur de l'inférence universelle
function maxLogLik(S) {
  const p = S.p, P = new Float64Array(S.XtX);
  for (let i = 0; i < p; i++) P[i * p + i] += 1e-9;
  const b = cholSolve(chol(P, p), S.Xty, p);
  let q = 0; for (let i = 0; i < p; i++) q += b[i] * S.Xty[i];
  const s2 = Math.max(1e-12, (S.yty - q) / S.n);
  return -0.5 * S.n * (Math.log(2 * Math.PI * s2) + 1);
}

// ---------- caractéristiques ----------
const WARM = 28;
export const TAU_GRID = Array.from({ length: 48 }, (_, i) => Math.exp(Math.log(1.5) + (i * (Math.log(250) - Math.log(1.5))) / 47));
export const TAU_V5 = [10 / 3, 10, 100 / 3];

function sources(Y, U) {
  const K = Y[0].length, T = Y.length;
  const mu = [], sd = [];
  for (let k = 0; k < K; k++) { const v = Y.slice(0, WARM).map((y) => y[k]); const m = v.reduce((s, x) => s + x, 0) / v.length; mu.push(m); sd.push(Math.sqrt(v.reduce((s, x) => s + (x - m) ** 2, 0) / v.length) || 1); }
  return Array.from({ length: T }, (_, t) => [...Y[t].map((y, k) => (y - mu[k]) / sd[k]), ...U[t]]);
}
// F_j(λ)_t = λ F_{t−1} + (1−λ) x_{j,t−1} : n'utilise que le passé
// normalisé par l'échelle théorique √((1+λ)/(1−λ)) (variance unité pour une source blanche unitaire) : l'a priori sur
// l'effet ne dépend pas de τ — sans cela, les modes lents (petite variance filtrée) sont rétrécis et τ sous-estimé
function filtered(X, lam) {
  const T = X.length, S = X[0].length, F = Array.from({ length: T }, () => new Float64Array(S));
  const k = Math.sqrt((1 + lam) / (1 - lam));
  let prev = new Float64Array(S);
  for (let t = 1; t < T; t++) for (let j = 0; j < S; j++) { prev[j] = lam * prev[j] + (1 - lam) * X[t - 1][j]; F[t][j] = k * prev[j]; }
  return F;
}
const baseRow = (t, U) => { const r = [1, 0, 0, 0, 0, 0, 0, ...U[t]]; const d = t % 7; if (d) r[d] = 1; return r; };

// ---------- découverte ----------
// method : 'p1' (τ continu + pari), 'grille' (τ ∈ v5 + pari), 'bayes' (τ continu, acceptation log BF > 5 sans pari)
export function discover(world, opts = {}) { return opts.method === 'ui' ? discoverUI(world, opts) : discoverMix(world, opts); }

// ---------- P1 : facteur de Bayes invariant (Haar à droite sur la nuisance), mélange sur λ, histoire entière ----------
// E_t = mélange_λ ML_λ / ML_0, la nuisance (constante, jours, leviers, modes déjà acceptés) et σ ayant des a priori
// impropres communs (limite V0→∞, a0,b0→0) : c'est un e-processus sous H0 par invariance de groupe (variables exogènes).
// Seuls les coefficients du mode ont un a priori propre, γ | σ ~ N(0, σ²·g).
// Acceptation : log E_t ≥ log(2K/α) (au plus deux tests par mesure : premier mode sur toute l'histoire, second mode
// sur les jours qui suivent l'acceptation du premier, mode figé). Probabilité d'au moins une fausse acceptation ≤ α.
// method 'bayes' (référence naïve, à la v4/v5) : meilleur λ seul, a priori propres, log BF > seuil, contrôlé tous les 30 j.
const HUGE = 1e6, TINY = 1e-6;
// sous-ensembles de 1 ou 2 sources : un concept met en jeu peu de sources
const subsets = (S) => { const r = []; for (let i = 0; i < S; i++) r.push([i]); for (let i = 0; i < S; i++) for (let j = i + 1; j < S; j++) r.push([i, j]); return r; };
function discoverMix(world, { method = 'p1', alpha = 0.1, g = 1, bayesThr = 3, every = 2 } = {}) {
  const { Y, U } = world, T = Y.length, K = Y[0].length;
  const X = sources(Y, U), S = X[0].length;
  const grid = method === 'grille' ? TAU_V5 : TAU_GRID;
  const Fs = grid.map((tau) => filtered(X, 1 - 1 / tau));
  const models = grid.flatMap((tau, li) => subsets(S).map((sub) => ({ tau, li, sub })));
  const feat = (m, t) => m.sub.map((j) => Fs[m.li][t][j]);
  const thr = Math.log((2 * K) / alpha);
  const naive = method === 'bayes';
  const [a0, b0] = naive ? [A0, B0] : [TINY, TINY];
  const pri = (p0, extra) => Array.from({ length: p0 + extra }, (_, i) => (i < p0 ? (naive ? (i === 0 ? 100 : 4) : HUGE) : g));
  const st = Array.from({ length: K }, () => ({ stage: 0, frozen: [], acc: [] }));
    // après une acceptation, la famille du mode accepté (ses sources filtrées à τ̂/1,5, τ̂, τ̂·1,5) devient une nuisance libre :
  // le test suivant ne peut pas « découvrir » l'erreur d'estimation du premier mode
  const famCols = (m) => { const taus = [m.tau / 1.5, m.tau, m.tau * 1.5]; return taus.flatMap((tau) => { const F = filtered(X, 1 - 1 / Math.max(1.01, tau)); return m.sub.map((j) => F.map((r) => r[j])); }); };
  const reset = (k) => { const c = st[k], p0 = 9 + c.frozen.length; c.p0 = p0; c.S0 = new Stats(p0); c.Sm = models.map((m) => new Stats(p0 + m.sub.length)); };
  for (let k = 0; k < K; k++) reset(k);
  const nullRow = (k, t) => [...baseRow(t, U), ...st[k].frozen.map((f) => f[t])];
  const fit = (Sx, p0, m) => nig(Sx, pri(p0, m.sub.length), a0, b0);
  const freeze = (m, w) => { const f = new Float64Array(T); for (let i = 0; i < T; i++) f[i] = m.sub.reduce((s, j, q) => s + w[q] * Fs[m.li][i][j], 0); return f; };
  for (let t = WARM; t < T; t++) for (let k = 0; k < K; k++) {
    const c = st[k]; if (c.stage >= 2) continue;
    const x0 = nullRow(k, t);
    c.S0.add(x0, Y[t][k]);
    models.forEach((m, i) => c.Sm[i].add([...x0, ...feat(m, t)], Y[t][k]));
    if (t < 60 || c.S0.n < c.p0 + 8) continue;
    if (naive ? t % 30 !== 0 : (t % every !== 0 && t !== T - 1)) continue;
    // colonnes de nuisance encore constantes (levier jamais bougé) : colinéaires à la constante, retirées comme le ferait
    // la limite impropre ; les alternatives fondées sur ce levier parient neutre (rapport 1)
    const n = c.S0.n, flat = [];
    for (const j of [7, 8]) { const v = n * c.S0.XtX[j * c.p0 + j] - c.S0.XtX[j] ** 2; if (v < 1e-9 * n * n) flat.push(j); }
    const keep0 = Array.from({ length: c.p0 }, (_, i) => i).filter((i) => !flat.includes(i));
    const flatSrc = flat.map((j) => K + (j - 7));
    const m0 = nig(subStats(c.S0, keep0), pri(keep0.length, 0), a0, b0).logML;
    const d = models.map((m, i) => {
      if (m.sub.some((j) => flatSrc.includes(j))) return 0;
      const idx = [...keep0, ...m.sub.map((_, q) => c.p0 + q)];
      return nig(subStats(c.Sm[i], idx), pri(keep0.length, m.sub.length), a0, b0).logML - m0;
    });
    const mx = Math.max(...d);
    const logE = naive ? mx : mx + Math.log(d.reduce((s, x) => s + Math.exp(x - mx), 0) / d.length);
    if (logE < (naive ? bayesThr : thr)) continue;
    const bi = d.indexOf(mx);
    c.acc.push({ acceptedAt: t, logE, stage: c.stage });
    c.frozen.push(...famCols(models[bi])); c.stage++; reset(k);
  }
  // description finale : ré-estimation sur toute l'année (l'existence a été certifiée par le pari ; le « quoi » est estimé),
  // par ajustements alternés quand deux modes sont acceptés sur la même mesure
  const accepted = [];
  for (let k = 0; k < K; k++) {
    const n = st[k].acc.length; if (!n) continue;
    const best = (others) => {
      const p0 = 9 + others.length, S0x = models.map((m) => new Stats(p0 + m.sub.length));
      for (let t = WARM; t < T; t++) { const x0 = [...baseRow(t, U), ...others.map((f) => f[t])]; models.forEach((m, i) => S0x[i].add([...x0, ...feat(m, t)], Y[t][k])); }
      const posts = S0x.map((Sx, i) => fit(Sx, p0, models[i]));
      let bi = 0; posts.forEach((p, i) => { if (p.logML > posts[bi].logML) bi = i; });
      const wsub = Array.from(posts[bi].m.slice(p0));
      return { m: models[bi], wsub, f: freeze(models[bi], wsub) };
    };
    let est = [best([])];
    if (n >= 2) { est.push(best([est[0].f])); for (let round = 0; round < 2; round++) { est[0] = best([est[1].f]); est[1] = best([est[0].f]); } }
    est.forEach((e, q) => { const w = Array(S).fill(0); e.m.sub.forEach((j, r) => { w[j] = e.wsub[r]; }); accepted.push({ target: k, tau: e.m.tau, w, acceptedAt: st[k].acc[q].acceptedAt, logE: st[k].acc[q].logE, stage: q }); });
  }
  return { accepted, nCand: 0 };
}

// ---------- variante « ui » (première version, conservée pour mémoire) : candidat figé + inférence universelle ----------
function discoverUI(world, { method = 'p1', alpha = 0.1, propose = 3, bayesThr = 5, closeAfter = 150 } = {}) {
  const { Y, U } = world, T = Y.length, K = Y[0].length;
  const X = sources(Y, U), S = X[0].length;
  const grid = method === 'grille' ? TAU_V5 : TAU_GRID;
  const Fs = new Map(grid.map((tau) => [tau, filtered(X, 1 - 1 / tau)]));
  const acc = Array.from({ length: K }, () => []);        // modes acceptés : séries figées
  const open = Array(K).fill(null);
  const accepted = [];
  let nCand = 0;
  const cands = [];
  const nullRow = (k, t) => [...baseRow(t, U), ...acc[k].map((m) => m.f[t])];
  const prior = (p, extra = 0) => Array.from({ length: p + extra }, (_, i) => (i === 0 ? 100 : 4));
  for (let t = WARM; t < T; t++) {
    // 1) proposer (données passées seulement)
    if (t >= 60 && t % 30 === 0) for (let k = 0; k < K; k++) {
      if (open[k]) continue;
      const p0 = 9 + acc[k].length;
      const S0 = new Stats(p0);
      for (let i = WARM; i < t; i++) S0.add(nullRow(k, i), Y[i][k]);
      const ml0 = nig(S0, prior(p0)).logML;
      let best = null;
      for (const tau of grid) {
        const F = Fs.get(tau), S1 = new Stats(p0 + S);
        for (let i = WARM; i < t; i++) S1.add([...nullRow(k, i), ...F[i]], Y[i][k]);
        const post = nig(S1, prior(p0, S));
        if (!best || post.logML > best.logML) best = { tau, logML: post.logML, w: Array.from(post.m.slice(p0)) };
      }
      const logBF = best.logML - ml0;
      if (logBF <= (method === 'bayes' ? bayesThr : propose)) continue;
      const F = Fs.get(best.tau), f = new Float64Array(T);
      for (let i = 0; i < T; i++) { let s = 0; for (let j = 0; j < S; j++) s += best.w[j] * F[i][j]; f[i] = s; }
      const cand = { target: k, tau: best.tau, w: best.w, f, proposedAt: t, logBF };
      if (method === 'bayes') { acc[k].push(cand); accepted.push({ ...cand, f: undefined, acceptedAt: t }); continue; }
      nCand++;
      const alphaI = (alpha * 6) / (Math.PI ** 2 * nCand ** 2);
      // pari : numérateur prévisible (toutes les données passées), dénominateur nul maximisé sur les jours de test
      const num = new Stats(p0 + 1);
      for (let i = WARM; i < t; i++) num.add([...nullRow(k, i), f[i]], Y[i][k]);
      open[k] = { ...cand, logThr: Math.log(1 / alphaI), num, den: new Stats(p0), logNum: 0, logE: -Infinity, maxE: -Infinity, p0 };
      cands.push(open[k]);
    }
    // 2) parier sur le jour t
    for (let k = 0; k < K; k++) {
      const c = open[k]; if (!c || t < c.proposedAt) continue;
      const xn = nullRow(k, t).slice(0, c.p0), x1 = [...xn, c.f[t]];
      c.logNum += predLogDens(nig(c.num, prior(c.p0 + 1)), Float64Array.from(x1), Y[t][k], c.p0 + 1);
      c.num.add(x1, Y[t][k]); c.den.add(xn, Y[t][k]);
      if (c.den.n >= 20) {
        c.logE = c.logNum - maxLogLik(c.den); c.maxE = Math.max(c.maxE, c.logE);
        if (c.logE >= c.logThr) { acc[k].push(c); accepted.push({ target: k, tau: c.tau, w: c.w, proposedAt: c.proposedAt, acceptedAt: t, logE: c.logE }); open[k] = null; continue; }
      }
      if (t - c.proposedAt >= closeAfter) open[k] = null;
    }
  }
  return { accepted, nCand, cands: cands.map((c) => ({ target: c.target, tau: c.tau, proposedAt: c.proposedAt, logBF: c.logBF, maxE: c.maxE, thr: c.logThr })) };
}

// ---------- notation (lit la vérité) ----------
export function score(world, res) {
  const modes = world.truth.modes;
  const K = world.Y[0].length;
  const match = (a, m) => a.target === m.target && Math.abs(Math.log(a.tau / m.tau)) < Math.log(1.5) && m.sources.some((s) => s.idx === a.w.reduce((bi, v, j, w) => (Math.abs(v) > Math.abs(w[bi]) ? j : bi), 0));
  const found = modes.map((m) => res.accepted.find((a) => match(a, m)) ?? null);
  const falseOnEmpty = res.accepted.filter((a) => !modes.some((m) => m.target === a.target)).length;
  const imprecise = res.accepted.filter((a) => modes.some((m) => m.target === a.target) && !modes.some((m) => match(a, m))).length;
  return { modes: modes.map((m, i) => ({ tau: m.tau, realized: m.realized, found: !!found[i], tauHat: found[i]?.tau ?? null, delay: found[i] ? found[i].acceptedAt : null })), nAccepted: res.accepted.length, falseOnEmpty, imprecise, K };
}
export { Stats, subStats, nig, sources, filtered, baseRow, WARM, HUGE, TINY };
