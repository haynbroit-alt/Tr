// Composant E (travail C2 du programme commun) : la sonde et le pari de P2, exportés pour des données extérieures.
// Protocole : PROTOCOLE_C2.md. p2.js (gelé 1121b10) et engine.js ne sont PAS modifiés : les primitives internes
// de p2.js (invariantLogE, probeFamilies, quad, logmeanexp, SDU) sont recopiées ici À L'IDENTIQUE, et l'épreuve
// E1 prouve que les verdicts sont exactement ceux de runWorld sur ses propres mondes.
import { discover, Stats, subStats, nig, sources, filtered, baseRow, WARM, HUGE, TINY } from './engine.js';

export const ALPHA = 0.1;
const MODE_TAUS = [5, 15, 40, 100, 200];

// ---------- primitives recopiées de p2.js (commit 1121b10), sans modification ----------
const logmeanexp = (d) => { const m = Math.max(...d); return m + Math.log(d.reduce((s, x) => s + Math.exp(x - m), 0) / d.length); };
const SDU = { u0sq: 0.298, abs: 0.289, inter: 0.33, cube: 0.378 };
function probeFamilies(t, Y, U, k, sdk, bEnd) {
  const u0 = U[t][0], u1 = U[t][1] ?? 0;
  const forme = [(u0 * u0 - 1 / 3) / SDU.u0sq, (Math.abs(u0) - 0.5) / SDU.abs, (u0 * u1) / SDU.inter, (u0 ** 3) / SDU.cube];
  const knots = []; for (let q = 45; q < bEnd; q += 15) knots.push(q);
  const temps = knots.map((q) => Math.max(0, t - q) / 30);
  const lag = (Y[t - 1][k]) / sdk, m7 = Y.slice(t - 7, t).reduce((s, y) => s + y[k], 0) / 7 / sdk;
  return { forme, temps, memoire: [lag, m7] };
}
function invariantLogE(rows, ys, p0, fams) {
  const n = rows.length;
  const S0 = new Stats(p0); rows.forEach((x, i) => S0.add(x.slice(0, p0), ys[i]));
  const keep = []; for (let j = 0; j < p0; j++) { if (j === 0) { keep.push(0); continue; } const v = n * S0.XtX[j * p0 + j] - S0.XtX[j] ** 2; if (v > 1e-9 * n * n) keep.push(j); }
  const pri = (a, b) => Array.from({ length: a + b }, (_, i) => (i < a ? HUGE : 1));
  const m0 = nig(subStats(S0, keep), pri(keep.length, 0), TINY, TINY).logML;
  return fams.map(({ cols }) => {
    const p = p0 + cols.length, S1 = new Stats(p);
    rows.forEach((x, i) => S1.add([...x.slice(0, p0), ...cols[i]], ys[i]));
    const extra = []; for (let q = 0; q < cols.length; q++) { const j = p0 + q; const v = n * S1.XtX[j * p + j] - S1.XtX[j] ** 2; if (v > 1e-9 * n * n) extra.push(j); }
    if (!extra.length) return 0;
    return nig(subStats(S1, [...keep, ...extra]), pri(keep.length, extra.length), TINY, TINY).logML - m0;
  });
}
function ols(rows, ys, p) { const S = new Stats(p); rows.forEach((x, i) => S.add(x, ys[i])); const post = nig(S, Array.from({ length: p }, (_, i) => (i === 0 ? 100 : 4))); return post.m; }
const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
function quad(P, x, p) {
  const L = new Float64Array(p * p);
  for (let i = 0; i < p; i++) for (let j = 0; j <= i; j++) { let s = P[i * p + j]; for (let q = 0; q < j; q++) s -= L[i * p + q] * L[j * p + q]; L[i * p + j] = i === j ? Math.sqrt(Math.max(s, 1e-12)) : s / L[j * p + j]; }
  const y = new Float64Array(p); for (let i = 0; i < p; i++) { let s = x[i]; for (let q = 0; q < i; q++) s -= L[i * p + q] * y[q]; y[i] = s / L[i * p + i]; }
  return y.reduce((s, v) => s + v * v, 0);
}

// ---------- recevabilité (leçon de la confrontation T1 de l'espace commun) ----------
export function recevable({ Y, U }) {
  const raisons = [];
  const T = Y?.length ?? 0;
  if (T < 120) raisons.push(`série trop courte : ${T} jours, il en faut au moins 120`);
  else {
    const K = Y[0].length, L = U?.[0]?.length ?? 0;
    if (L < 1) raisons.push('aucun levier');
    if (U && U.length !== T) raisons.push('Y et U n’ont pas la même longueur');
    for (let k = 0; k < K; k++) {
      const col = Y.map((y) => y[k]);
      if (col.some((v) => !Number.isFinite(v))) { raisons.push(`mesure ${k} : valeurs non finies`); continue; }
      const tri = [...col].sort((a, b) => a - b), med = tri[T >> 1];
      const informatifs = col.filter((v) => v !== med).length;
      if (informatifs === 0) raisons.push(`mesure ${k} : constante`);
      else if (informatifs < T / 3) raisons.push(`mesure ${k} : ${informatifs} jours informatifs sur ${T} (il en faut un tiers) — une série mensuelle ou rare n’est pas une mesure quotidienne`);
    }
  }
  return { ok: raisons.length === 0, raisons };
}

// ---------- la chaîne de runWorld, paramétrée par la longueur (identique à p2.js pour T = 365) ----------
export function analyser({ Y, U }, { aEnd = null, bEnd = null, standardiserLeviers = false } = {}) {
  const r = recevable({ Y, U });
  if (!r.ok) throw new Error('série non recevable : ' + r.raisons.join(' ; '));
  const T = Y.length, K = Y[0].length;
  if (standardiserLeviers) {
    const L = U[0].length, mu = [], sd = [];
    for (let l = 0; l < L; l++) { const v = U.map((u) => u[l]); const m = v.reduce((s, x) => s + x, 0) / T; mu.push(m); sd.push(Math.sqrt(v.reduce((s, x) => s + (x - m) ** 2, 0) / T) || 1); }
    U = U.map((u) => u.map((x, l) => (x - mu[l]) / sd[l]));
  }
  // Le moteur gelé suppose au moins deux leviers (engine.js teste les colonnes 7 et 8 de la nuisance).
  // Avec un seul levier, un levier nul est ajouté : constant, il est retiré par le moteur lui-même.
  if (U[0].length === 1) U = U.map((u) => [...u, 0]);
  aEnd ??= Math.floor((T * 150) / 365); bEnd ??= Math.floor((T * 272) / 365);
  const resA = discover({ Y: Y.slice(0, aEnd), U: U.slice(0, aEnd) }, { method: 'p1' });
  const X = sources(Y, U);
  const modeF = resA.accepted.map((a) => { const F = filtered(X, 1 - 1 / a.tau); return { target: a.target, f: F.map((row) => row.reduce((s, v, j) => s + a.w[j] * v, 0)) }; });
  const modeFam = resA.accepted.map((a) => { const sub = a.w.map((v, j) => (v !== 0 ? j : -1)).filter((j) => j >= 0); const cols = [a.tau / 1.5, a.tau, a.tau * 1.5].flatMap((tau) => { const F = filtered(X, 1 - 1 / Math.max(1.01, tau)); return sub.map((j) => F.map((rr) => rr[j])); }); return { target: a.target, cols }; });
  const sdk = Array.from({ length: K }, (_, k) => { const v = Y.slice(0, WARM).map((y) => y[k]); const m = v.reduce((s, x) => s + x, 0) / v.length; return Math.sqrt(v.reduce((s, x) => s + (x - m) ** 2, 0) / v.length) || 1; });
  const FS = MODE_TAUS.map((tau) => filtered(X, 1 - 1 / tau));
  const mesures = [], interne = { U, dC: [], prows: [], p0s: [] };
  for (let k = 0; k < K; k++) {
    const mrow = (t) => [...baseRow(t, U), ...modeF.filter((m) => m.target === k).map((m) => m.f[t])];
    const p0 = mrow(0).length;
    const dA = [], dB = [], dC = [];
    for (let t = WARM; t < T; t++) (t < aEnd ? dA : t < bEnd ? dB : dC).push(t);
    const SA = new Stats(p0); dA.forEach((t) => SA.add(mrow(t), Y[t][k]));
    const qB = dB.map((t) => { const x = mrow(t); const P = new Float64Array(SA.XtX); for (let i = 0; i < p0; i++) P[i * p0 + i] += i === 0 ? 1 / 100 : 1 / 4; return quad(P, x, p0); });
    const uncert = qB.reduce((s, x) => s + x, 0) / qB.length;
    const dW = [...dA, ...dB];
    const prow = (t) => [...baseRow(t, U), ...modeFam.filter((m) => m.target === k).flatMap((m) => m.cols.map((c) => c[t]))];
    const pw = prow(0).length;
    const rowsB = dW.map(prow), yB = dW.map((t) => Y[t][k]);
    const famsB = dW.map((t) => probeFamilies(t, Y, U, k, sdk[k], bEnd));
    const names = ['forme', 'temps', 'memoire'];
    const fams = names.map((nm) => ({ name: nm, cols: famsB.map((f) => f[nm]) }));
    const S = X[0].length, subs = [];
    for (let i = 0; i < S; i++) subs.push([i]);
    for (let i = 0; i < S; i++) for (let j = i + 1; j < S; j++) subs.push([i, j]);
    const langFams = FS.flatMap((F) => subs.map((sub) => ({ name: 'mode', cols: dW.map((t) => sub.map((j) => F[t][j])) })));
    const dOut = invariantLogE(rowsB, yB, pw, fams), dLang = invariantLogE(rowsB, yB, pw, langFams);
    const dG = [...names.map((nm, i) => dOut[i]), logmeanexp(dLang)];
    const logE = logmeanexp(dG), fam = [...names, 'mode'][dG.indexOf(Math.max(...dG))];
    const missing = logE >= Math.log(K / ALPHA);
    const attr = [...names.map((nm, i) => dOut[i]), Math.max(...dLang)];
    const famAttr = [...names, 'mode'][attr.indexOf(Math.max(...attr))];
    const hors = missing && famAttr !== 'mode';
    const diag = hors ? 'hors de portée' : missing || uncert > 0.25 ? 'mal estimé' : 'compris';
    mesures.push({ mesure: k, logE, fam: hors ? famAttr : fam, diag, uncert, missing });
    interne.dC.push(dC); interne.prows.push(prow); interne.p0s.push(pw);
  }
  return { mesures, seuil_sonde: Math.log(K / ALPHA), modesA: resA.accepted.map(({ target, tau }) => ({ target, tau })), Y, interne };
}

// Pari invariant d'une formule figée sur les jours C (jamais vus par elle). Identique au juge interne de p2.js.
export function jugerFormule(analyse, k, g) {
  const { Y, interne } = analyse, { U } = interne;
  const dC = interne.dC[k], prow = interne.prows[k], pw = interne.p0s[k];
  if (!g || typeof g.f !== 'function') return { accepted: false, text: g?.text ?? null, constant: true };
  const dW = []; for (let t = WARM; t < Y.length; t++) if (!dC.includes(t)) dW.push(t);
  const vB = dW.map((t) => g.f(U[t])), mu = vB.reduce((s, x) => s + x, 0) / vB.length, sd = Math.sqrt(vB.reduce((s, x) => s + (x - mu) ** 2, 0) / vB.length);
  if (!(sd > 1e-9) || !Number.isFinite(sd)) return { accepted: false, text: g.text, constant: true };
  const z = (t) => { const v = (g.f(U[t]) - mu) / sd; return Number.isFinite(v) ? v : 0; };
  const rowsC = dC.map(prow), yC = dC.map((t) => Y[t][k]);
  const lE = invariantLogE(rowsC, yC, pw, [{ cols: dC.map((t) => [z(t)]) }])[0];
  const b0 = ols(dW.map(prow), dW.map((t) => Y[t][k]), pw), b1 = ols(dW.map((t) => [...prow(t), z(t)]), dW.map((t) => Y[t][k]), pw + 1);
  const rm = (f) => Math.sqrt(dC.reduce((s, t) => s + (Y[t][k] - f(t)) ** 2, 0) / dC.length);
  return { accepted: lE >= Math.log(1 / ALPHA), logE: lE, seuil: Math.log(1 / ALPHA), text: g.text, rmse0: rm((t) => dot(b0, prow(t))), rmse1: rm((t) => dot(b1, [...prow(t), z(t)])) };
}
