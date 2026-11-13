// Outils numériques : générateur pseudo-aléatoire reproductible, moindres carrés linéaires,
// ajustement non linéaire des constantes (Levenberg–Marquardt).
import { compile, constants } from './expr.js';

/** PRNG déterministe (mulberry32). */
export function rng(seed) {
  let a = (seed >>> 0) || 1;
  const r = () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  r.int = (n) => Math.floor(r() * n);
  r.pick = (arr) => arr[Math.floor(r() * arr.length)];
  r.normal = () => {
    let u = 0, v = 0;
    while (u === 0) u = r();
    v = r();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
  return r;
}

/** Résout A x = b (A carrée, petite) par élimination de Gauss avec pivot partiel. null si singulière. */
export function solve(A, b) {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    if (Math.abs(M[p][c]) < 1e-300 || !isFinite(M[p][c])) return null;
    [M[c], M[p]] = [M[p], M[c]];
    for (let r = c + 1; r < n; r++) {
      const f = M[r][c] / M[c][c];
      if (f === 0) continue;
      for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k];
    }
  }
  const x = new Array(n);
  for (let r = n - 1; r >= 0; r--) {
    let s = M[r][n];
    for (let k = r + 1; k < n; k++) s -= M[r][k] * x[k];
    x[r] = s / M[r][r];
    if (!isFinite(x[r])) return null;
  }
  return x;
}

/** Moindres carrés linéaires : y ≈ Σ w_j · feats[j]. */
export function linearFit(feats, y, n) {
  const m = feats.length;
  const A = Array.from({ length: m }, () => new Array(m).fill(0));
  const b = new Array(m).fill(0);
  for (let i = 0; i < m; i++) {
    for (let j = i; j < m; j++) {
      let s = 0;
      for (let k = 0; k < n; k++) s += feats[i][k] * feats[j][k];
      A[i][j] = A[j][i] = s;
    }
    let s = 0;
    for (let k = 0; k < n; k++) s += feats[i][k] * y[k];
    b[i] = s;
    A[i][i] *= 1 + 1e-12;
  }
  return solve(A, b);
}

/** Erreur quadratique moyenne ; Infinity si l'expression n'est pas définie sur les données. */
export function mse(e, data) { return mseRun(compile(e), data, new Float64Array(data.n)); }
function mseRun(run, data, buf) {
  const p = run(data.cols, data.n, buf), y = data.y;
  let s = 0;
  for (let k = 0; k < data.n; k++) { const d = p[k] - y[k]; s += d * d; }
  s /= data.n;
  return isFinite(s) ? s : Infinity;
}

/**
 * Ajuste en place les constantes de l'expression (Levenberg–Marquardt, jacobien numérique).
 * only : sous-ensemble de constantes à ajuster (les autres restent gelées). Renvoie la MSE obtenue.
 */
export function fitConstants(e, data, iters = 12, only = null) {
  const cs = only || constants(e);
  const m = cs.length, n = data.n, y = data.y;
  const run = compile(e);
  const buf = new Float64Array(n);
  let best = mseRun(run, data, buf);
  if (m === 0 || n === 0 || !isFinite(best)) return best;
  let lambda = 1e-2;
  const r0 = new Float64Array(n);
  const J = Array.from({ length: m }, () => new Float64Array(n));
  const A = Array.from({ length: m }, () => new Array(m).fill(0));
  const g = new Array(m).fill(0), old = new Array(m);
  for (let it = 0; it < iters; it++) {
    run(data.cols, n, r0);
    for (let k = 0; k < n; k++) r0[k] -= y[k];
    for (let j = 0; j < m; j++) {
      const v = cs[j].v, h = Math.abs(v) * 1e-6 + 1e-8, Jj = J[j];
      cs[j].v = v + h;
      run(data.cols, n, Jj);
      cs[j].v = v;
      for (let k = 0; k < n; k++) Jj[k] = (Jj[k] - y[k] - r0[k]) / h;
    }
    let ok = true;
    for (let i = 0; i < m; i++) {
      for (let j = i; j < m; j++) {
        let s = 0;
        for (let k = 0; k < n; k++) s += J[i][k] * J[j][k];
        A[i][j] = A[j][i] = s;
      }
      let s = 0;
      for (let k = 0; k < n; k++) s += J[i][k] * r0[k];
      g[i] = -s;
      if (!isFinite(s)) ok = false;
    }
    if (!ok) break;
    let improved = false;
    for (let tries = 0; tries < 6; tries++) {
      const Ad = A.map((row, i) => row.map((v, j) => (i === j ? v * (1 + lambda) + 1e-12 : v)));
      const step = solve(Ad, g);
      if (!step) { lambda *= 10; continue; }
      for (let j = 0; j < m; j++) { old[j] = cs[j].v; cs[j].v = old[j] + step[j]; }
      const cur = mseRun(run, data, buf);
      if (cur < best) {
        const rel = (best - cur) / (best + 1e-300);
        best = cur; lambda = Math.max(lambda / 5, 1e-9); improved = true;
        if (rel < 1e-10) it = iters;
        break;
      }
      for (let j = 0; j < m; j++) cs[j].v = old[j];
      lambda *= 10;
    }
    if (!improved) break;
  }
  return best;
}

export function makeData(X, y) {
  const n = y.length, d = n ? X[0].length : 0;
  const cols = Array.from({ length: d }, (_, j) => Float64Array.from(X, (r) => r[j]));
  return { n, d, cols, y: Float64Array.from(y), X };
}

export function variance(y) {
  const n = y.length;
  if (!n) return 0;
  let m = 0;
  for (const v of y) m += v;
  m /= n;
  let s = 0;
  for (const v of y) s += (v - m) * (v - m);
  return s / n;
}
