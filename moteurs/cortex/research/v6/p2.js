// Prototype P2 : sonde de structure manquante (C) + formes proposées par GALILÉE, jugées sur des jours neufs.
// Usage : node research/v6/p2.js --seeds 1-100 --out research/v6/p2-dev.json
import { writeFileSync } from 'node:fs';
import { makeRng } from '../../src/rng.js';
import { makeWorld, K, T } from './worlds.js';
import { discover, Stats, subStats, nig, sources, filtered, baseRow, WARM, HUGE, TINY } from './engine.js';
import { Agent } from './vendor/galilee/agent.js';
import { evalPoint, toString } from './vendor/galilee/expr.js';

const A_END = 150, B_END = 272, ALPHA = 0.1;
const MODE_TAUS = [5, 15, 40, 100, 200];
const CLASSES = ['compris', 'forme', 'rupture', 'regime', 'flou'];
const FORMS = {
  carre: (u) => 0.3 * u[0] * u[0],
  saturation: (u) => (0.4 * u[0]) / (1 + 2 * Math.abs(u[0])),
  interaction: (u) => 0.3 * u[0] * u[1],
};

// ---------- mondes P2 (vérité connue) ----------
export function makeWorld2(seed, xo = {}) {
  const cls = xo.cls ?? CLASSES[seed % 5];
  const r = makeRng(seed * 7121 + 3);
  const base = r.next() < 2 / 3 ? 'modes' : 'placebo';
  const target = r.int(0, K - 1);
  let truth = { cls, target: null, family: null, active: false };
  let opts = {};
  if (cls === 'forme') {
    const name = Object.keys(FORMS)[r.int(0, 2)], f = FORMS[name];
    opts.extra = (k, t, U) => (k === target ? f(U[t]) : 0);
    truth = { cls, target, family: 'forme', active: true, form: name };
  } else if (cls === 'rupture') {
    const at = r.int(190, 260), jump = (r.next() < 0.5 ? -1 : 1) * r.uniform(0.2, 0.4);
    opts.extra = (k, t) => (k === target && t >= at ? jump : 0);
    truth = { cls, target, family: 'temps', active: true, at, jump };
  } else if (cls === 'regime') {
    const st = []; let s = r.next() < 0.5 ? 1 : -1, switchesB = 0;
    for (let t = 0; t < T; t++) { if (t > 0 && r.next() < 1 / 30) { s = -s; if (t >= A_END && t < B_END) switchesB++; } st.push(s); }
    opts.extra = (k, t) => (k === target ? 0.2 * st[t] : 0);
    truth = { cls, target, family: 'temps', active: switchesB > 0, switchesB };
  } else if (cls === 'flou') {
    opts.flouLever = r.int(0, 1);
    truth = { cls, target: null, family: null, active: false, lever: opts.flouLever };
  }
  if (xo.overrideU) opts.overrideU = xo.overrideU;
  const w = makeWorld(seed + 500000, cls === 'flou' ? 'modes' : base, opts);
  return { ...w, p2: truth };
}

// ---------- outils ----------
const logmeanexp = (d) => { const m = Math.max(...d); return m + Math.log(d.reduce((s, x) => s + Math.exp(x - m), 0) / d.length); };
const SDU = { u0sq: 0.298, abs: 0.289, inter: 0.33, cube: 0.378 };
function probeFamilies(t, Y, U, k, sdk) {
  const u0 = U[t][0], u1 = U[t][1];
  const forme = [(u0 * u0 - 1 / 3) / SDU.u0sq, (Math.abs(u0) - 0.5) / SDU.abs, (u0 * u1) / SDU.inter, (u0 ** 3) / SDU.cube];
  const knots = []; for (let q = 45; q < B_END; q += 15) knots.push(q);
  const temps = knots.map((q) => Math.max(0, t - q) / 30);
  const lag = (Y[t - 1][k]) / sdk, m7 = Y.slice(t - 7, t).reduce((s, y) => s + y[k], 0) / 7 / sdk;
  return { forme, temps, memoire: [lag, m7] };
}
// pari invariant : nuisance (colonnes 0..p0-1, a priori de Haar) contre nuisance + famille (a priori propre g = 1)
function invariantLogE(rows, ys, p0, fams) {
  const n = rows.length;
  const S0 = new Stats(p0); rows.forEach((x, i) => S0.add(x.slice(0, p0), ys[i]));
  // colonnes de nuisance constantes sur la fenêtre (levier immobile) : retirées
  const keep = []; for (let j = 0; j < p0; j++) { if (j === 0) { keep.push(0); continue; } const v = n * S0.XtX[j * p0 + j] - S0.XtX[j] ** 2; if (v > 1e-9 * n * n) keep.push(j); }
  const pri = (a, b) => Array.from({ length: a + b }, (_, i) => (i < a ? HUGE : 1));
  const m0 = nig(subStats(S0, keep), pri(keep.length, 0), TINY, TINY).logML;
  return fams.map(({ cols }) => {
    const p = p0 + cols.length, S1 = new Stats(p);
    rows.forEach((x, i) => S1.add([...x.slice(0, p0), ...cols[i]], ys[i]));
    // colonnes de la famille nulles ou constantes : sans information → elles ne comptent pas
    const extra = []; for (let q = 0; q < cols.length; q++) { const j = p0 + q; const v = n * S1.XtX[j * p + j] - S1.XtX[j] ** 2; if (v > 1e-9 * n * n) extra.push(j); }
    if (!extra.length) return 0;
    return nig(subStats(S1, [...keep, ...extra]), pri(keep.length, extra.length), TINY, TINY).logML - m0;
  });
}
function ols(rows, ys, p) { const S = new Stats(p); rows.forEach((x, i) => S.add(x, ys[i])); const post = nig(S, Array.from({ length: p }, (_, i) => (i === 0 ? 100 : 4))); return post.m; }
const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);

// GALILÉE sur des écarts ; renvoie la formule figée (fonction de u0,u1) ou null
function galilee(seed, Xu, res) {
  const a = new Agent(null, { seed, data: { names: ['u0', 'u1'], target: 'ecart', X: Xu, y: res } });
  const h = a.run();
  if (!h) return null;
  return { text: toString(h.expr, ['u0', 'u1']), f: (u) => evalPoint(h.expr, u), verdict: a.bilan?.verdict ?? null };
}

// ---------- chaîne complète pour un monde ----------
export function runWorld(seed, hooks = {}) {
  const w = makeWorld2(seed, hooks.world), { Y, U } = w;
  const t0 = Date.now();
  // A : P1 gelé sur les jours de A seulement
  const resA = discover({ Y: Y.slice(0, A_END), U: U.slice(0, A_END) }, { method: 'p1' });
  const X = sources(Y, U);
  const modeF = resA.accepted.map((a) => { const F = filtered(X, 1 - 1 / a.tau); return { target: a.target, f: F.map((row) => row.reduce((s, v, j) => s + a.w[j] * v, 0)) }; });
  // famille de chaque mode accepté sur A : ses sources filtrées à τ̂/1,5, τ̂, τ̂·1,5 (coefficients libres dans la sonde)
  const modeFam = resA.accepted.map((a) => { const sub = a.w.map((v, j) => (v !== 0 ? j : -1)).filter((j) => j >= 0); const cols = [a.tau / 1.5, a.tau, a.tau * 1.5].flatMap((tau) => { const F = filtered(X, 1 - 1 / Math.max(1.01, tau)); return sub.map((j) => F.map((r) => r[j])); }); return { target: a.target, cols }; });
  const sdk = Array.from({ length: K }, (_, k) => { const v = Y.slice(0, WARM).map((y) => y[k]); const m = v.reduce((s, x) => s + x, 0) / v.length; return Math.sqrt(v.reduce((s, x) => s + (x - m) ** 2, 0) / v.length) || 1; });
  const FS = MODE_TAUS.map((tau) => filtered(X, 1 - 1 / tau));
  const out = [];
  const rng = makeRng(seed * 13 + 1);
  for (let k = 0; k < K; k++) {
    const mrow = (t) => [...baseRow(t, U), ...modeF.filter((m) => m.target === k).map((m) => m.f[t])];
    const p0 = mrow(0).length;
    const dA = [], dB = [], dC = [];
    for (let t = WARM; t < T; t++) (t < A_END ? dA : t < B_END ? dB : dC).push(t);
    // incertitude des paramètres (modèle ajusté sur A) sur les jours de B
    const SA = new Stats(p0); dA.forEach((t) => SA.add(mrow(t), Y[t][k]));
    const postA = nig(SA, Array.from({ length: p0 }, (_, i) => (i === 0 ? 100 : 4)));
    const qB = dB.map((t) => { const x = mrow(t); const P = new Float64Array(SA.XtX); for (let i = 0; i < p0; i++) P[i * p0 + i] += i === 0 ? 1 / 100 : 1 / 4; return quad(P, x, p0); });
    const uncert = qB.reduce((s, x) => s + x, 0) / qB.length;
    // sonde sur A ∪ B (C reste intact pour juger GALILÉE)
    const dW = [...dA, ...dB];
    const prow = (t) => [...baseRow(t, U), ...modeFam.filter((m) => m.target === k).flatMap((m) => m.cols.map((c) => c[t]))];
    const pw = prow(0).length;
    const rowsB = dW.map(prow), yB = dW.map((t) => Y[t][k]);
    const famsB = dW.map((t) => probeFamilies(t, Y, U, k, sdk[k]));
    const names = ['forme', 'temps', 'memoire'];
    const fams = names.map((nm) => ({ name: nm, cols: famsB.map((f) => f[nm]) }));
    // famille « langage du modèle » : un mode supplémentaire à 1 ou 2 sources, τ ∈ {5, 15, 40, 100, 200}
    const S = X[0].length, subs = [];
    for (let i = 0; i < S; i++) subs.push([i]);
    for (let i = 0; i < S; i++) for (let j = i + 1; j < S; j++) subs.push([i, j]);
    const langFams = FS.flatMap((F) => subs.map((sub) => ({ name: 'mode', cols: dW.map((t) => sub.map((j) => F[t][j])) })));
    const dOut = invariantLogE(rowsB, yB, pw, fams), dLang = invariantLogE(rowsB, yB, pw, langFams);
    const dG = [...names.map((nm, i) => dOut[i]), logmeanexp(dLang)];
    const logE = logmeanexp(dG), fam = [...names, 'mode'][dG.indexOf(Math.max(...dG))];
    const missing = logE >= Math.log(K / ALPHA);
    // existence (pari garanti) : logE ci-dessus. Attribution : le meilleur modèle de chaque famille, le langage
    // (meilleur mode à 1 ou 2 sources) concourant avec la forme, le temps et la mémoire. « Hors de portée » si
    // une structure manque ET que le langage du modèle ne l'emporte pas.
    const attr = [...names.map((nm, i) => dOut[i]), Math.max(...dLang)];
    const famAttr = [...names, 'mode'][attr.indexOf(Math.max(...attr))];
    const hors = missing && famAttr !== 'mode';
    const logEout = logmeanexp(dOut), famOut = famAttr;
    const diag = hors ? 'hors de portée' : missing || uncert > 0.25 ? 'mal estimé' : 'compris';
    const rec = { target: k, logE, logEout, fam: hors ? famOut : fam, diag, uncert, missing, touched: w.p2.target === k && w.p2.active };
    // GALILÉE
    const touched = w.p2.target === k;
    const wantG1 = hors && fam === 'forme';
    const wantG2 = w.p2.cls === 'forme' && touched;
    const wantG3 = w.p2.cls === 'compris' && k === 0;
    if (wantG1 || wantG2 || wantG3 || (hooks.inject && hooks.inject.k === k)) {
      const bB = ols(rowsB, yB, pw), resB = dW.map((t, i) => yB[i] - dot(bB, rowsB[i]));
      const Xu = dW.map((t) => [U[t][0], U[t][1]]);
      const judge = (g) => {
        if (!g) return { accepted: false, text: null };
        const vB = dW.map((t) => g.f(U[t])), mu = vB.reduce((s, x) => s + x, 0) / vB.length, sd = Math.sqrt(vB.reduce((s, x) => s + (x - mu) ** 2, 0) / vB.length);
        if (!(sd > 1e-9) || !Number.isFinite(sd)) return { accepted: false, text: g.text, constant: true };
        const z = (t) => { const v = (g.f(U[t]) - mu) / sd; return Number.isFinite(v) ? v : 0; };
        const rowsC = dC.map(prow), yC = dC.map((t) => Y[t][k]);
        const lE = invariantLogE(rowsC, yC, pw, [{ cols: dC.map((t) => [z(t)]) }])[0];
        // erreur de prévision sur C : modèle ajusté sur A∪B, avec et sans la formule
        const dAB = [...dA, ...dB];
        const b0 = ols(dAB.map(prow), dAB.map((t) => Y[t][k]), pw), b1 = ols(dAB.map((t) => [...prow(t), z(t)]), dAB.map((t) => Y[t][k]), pw + 1);
        const rm = (f) => Math.sqrt(dC.reduce((s, t) => s + (Y[t][k] - f(t)) ** 2, 0) / dC.length);
        return { accepted: lE >= Math.log(1 / ALPHA), logE: lE, text: g.text, verdict: g.verdict, rmse0: rm((t) => dot(b0, prow(t))), rmse1: rm((t) => dot(b1, [...prow(t), z(t)])) };
      };
      if (wantG1 || wantG3) { const g = galilee(seed * 10 + k, Xu, resB); hooks.onFormula?.({ k, kind: 'reel', g, Xu }); rec.galilee = judge(g); }
      if (hooks.oracleC && w.p2.cls === 'forme' && touched) rec.oracleC = judge({ f: FORMS[w.p2.form], text: 'oracle' });
      if (hooks.inject && hooks.inject.k === k) rec.injected = judge(hooks.inject.g);
      if (wantG2) { const perm = resB.map((_, i) => i); for (let i = perm.length - 1; i > 0; i--) { const j = Math.floor(rng.next() * (i + 1)); [perm[i], perm[j]] = [perm[j], perm[i]]; } const gm = galilee(seed * 10 + k + 5, Xu, perm.map((i) => resB[i])); hooks.onFormula?.({ k, kind: 'melange', g: gm, Xu }); rec.galileeMelange = judge(gm); }
    }
    if (w.p2.cls === 'forme' && touched) { const f = FORMS[w.p2.form]; rec.oracleLogE = invariantLogE(rowsB, yB, pw, [{ cols: dW.map((t) => [f(U[t]) / 0.1]) }])[0]; }
    out.push(rec);
  }
  return { seed, cls: w.p2.cls, truth: w.p2, modesA: resA.accepted.map(({ target, tau }) => ({ target, tau })), targets: out, secs: (Date.now() - t0) / 1000 };
}
function quad(P, x, p) {
  // xᵀ P⁻¹ x par Cholesky
  const L = new Float64Array(p * p);
  for (let i = 0; i < p; i++) for (let j = 0; j <= i; j++) { let s = P[i * p + j]; for (let q = 0; q < j; q++) s -= L[i * p + q] * L[j * p + q]; L[i * p + j] = i === j ? Math.sqrt(Math.max(s, 1e-12)) : s / L[j * p + j]; }
  const y = new Float64Array(p); for (let i = 0; i < p; i++) { let s = x[i]; for (let q = 0; q < i; q++) s -= L[i * p + q] * y[q]; y[i] = s / L[i * p + i]; }
  return y.reduce((s, v) => s + v * v, 0);
}

if (process.argv[1]?.endsWith('p2.js')) {
  const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
  const [a, b] = arg('--seeds', '1-10').split('-').map(Number);
  const res = [];
  for (let s = a; s <= (b ?? a); s++) { res.push(runWorld(s)); process.stderr.write(`\r${s}`); }
  writeFileSync(arg('--out', 'research/v6/p2-dev.json'), JSON.stringify(res));
  console.error('\nok', res.length);
}
