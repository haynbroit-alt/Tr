// Prototype P3 : CORTEX choisit les réglages de C pour confirmer (ou réfuter) la forme proposée par GALILÉE.
// Usage : node research/v6/p3.js --seeds 1-100 --out research/v6/p3-dev.json
import { writeFileSync } from 'node:fs';
import { runWorld } from './p2.js';

const C0 = 272, BLOCK = 7, NB = 13;
const U0 = [-1, -0.5, 0, 0.5, 1], U1 = [0, 1];
const CANDS = U0.flatMap((a) => U1.map((b) => [a, b]));
const BUDGET = { u0: 0.5 * NB, u1: Math.floor(0.3 * NB) };

// variance résiduelle de z après régression sur (1, u0, u1) — information sur le coefficient de la formule
function residualSS(pts) {
  const n = pts.length; if (n < 4) return 0;
  const X = pts.map(([u, z]) => [1, u[0], u[1], z]);
  // moindres carrés de z sur les 3 premières colonnes (petite crête)
  const A = [[0, 0, 0], [0, 0, 0], [0, 0, 0]], b = [0, 0, 0];
  for (const r of X) for (let i = 0; i < 3; i++) { b[i] += r[i] * r[3]; for (let j = 0; j < 3; j++) A[i][j] += r[i] * r[j]; }
  for (let i = 0; i < 3; i++) A[i][i] += 1e-6;
  // résolution 3×3 (Gauss)
  const M = A.map((r, i) => [...r, b[i]]);
  for (let c = 0; c < 3; c++) { let p = c; for (let r = c + 1; r < 3; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r; [M[c], M[p]] = [M[p], M[c]]; for (let r = 0; r < 3; r++) if (r !== c) { const f = M[r][c] / M[c][c]; for (let k = c; k < 4; k++) M[r][k] -= f * M[c][k]; } }
  const beta = M.map((r, i) => r[3] / r[i]);
  return X.reduce((s, r) => s + (r[3] - beta[0] - beta[1] * r[1] - beta[2] * r[2]) ** 2, 0);
}
// plan D-optimal sous budget, optimisé sur le plan ENTIER par échanges (type Fedorov) ; ne dépend que de la formule
// (figée avant C). Un glouton bloc par bloc dépensait tout le budget de u1 avant de voir les colinéarités.
export function activePlan(g) {
  if (!g) return null;
  const z = (u) => { const v = g.f(u); return Number.isFinite(v) ? v : null; };
  const cands = CANDS.filter((u) => z(u) != null);
  if (cands.length < 3) return null;
  const crit = (plan) => residualSS(plan.map((x) => [x, z(x)]));
  const ok = (plan) => plan.reduce((s, u) => s + Math.abs(u[0]), 0) <= BUDGET.u0 + 1e-9 && plan.reduce((s, u) => s + u[1], 0) <= BUDGET.u1;
  // plusieurs départs faisables et variés ; chacun est amélioré par échanges, le meilleur plan final l'emporte
  const pad = (head) => [...head, ...Array.from({ length: NB - head.length }, () => [0, 0])].map((u) => (cands.some((c) => c[0] === u[0] && c[1] === u[1]) ? u : [0, 0]));
  const starts = [
    pad([[-1, 0], [0, 0], [1, 0], [0, 0], [-1, 0], [0, 0], [1, 0], [0, 0], [-0.5, 0], [0.5, 0]]),
    pad([[-1, 1], [1, 1], [0, 1], [-1, 0], [1, 0], [-0.5, 0], [0.5, 0]]),
    pad([[-1, 1], [1, 1], [-1, 0], [1, 0], [-0.5, 0], [0.5, 0], [-0.5, 1]]),
  ].filter(ok);
  let bestPlan = null, bestCrit = -1;
  for (const start of starts) {
  let plan = start;
  let best = crit(plan);
  for (let iter = 0; iter < 50; iter++) {
    let improved = false;
    for (let b = 0; b < NB; b++) for (const u of cands) {
      const trial = plan.map((x, i) => (i === b ? u : x));
      if (!ok(trial)) continue;
      const c = crit(trial);
      if (c > best + 1e-12) { plan = trial; best = c; improved = true; }
    }
    if (!improved) {
      // échanges par paires : certaines formes (u0·u1) ne gagnent qu'avec deux blocs changés ensemble
      for (let b1 = 0; b1 < NB && !improved; b1++) for (let b2 = b1 + 1; b2 < NB && !improved; b2++) for (const u of cands) for (const v of cands) {
        const trial = plan.map((x, i) => (i === b1 ? u : i === b2 ? v : x));
        if (!ok(trial)) continue;
        const c = crit(trial);
        if (c > best + 1e-12) { plan = trial; best = c; improved = true; break; }
      }
    }
    if (!improved) break;
  }
  if (best > bestCrit) { bestCrit = best; bestPlan = plan; }
  }
  return bestPlan;
}
const toOverride = (plan) => (t) => (t >= C0 ? plan[Math.min(NB - 1, Math.floor((t - C0) / BLOCK))] : null);
const HABIT = () => (t) => (t >= C0 ? [0, 0] : null);

export function runP3(seed) {
  const cls = seed % 2 ? 'forme' : 'compris';
  const t0 = Date.now();
  // passe 0 : plan passif (= P2), et capture des formules (identiques pour tous les plans : A et B ne changent pas)
  const F = {};
  const r0 = runWorld(seed, { world: { cls }, oracleC: true, onFormula: ({ k, kind, g }) => { F[`${kind}:${k}`] = g; } });
  const out = { seed, cls, truth: r0.truth, plans: {}, targets: r0.targets.map((t) => ({ target: t.target, diag: t.diag, fam: t.fam, touched: t.touched })) };
  const pick = (r, k) => r.targets.find((t) => t.target === k);
  const summary = (r, k, key) => { const t = pick(r, k); const j = t?.[key]; return j ? { accepted: j.accepted, logE: j.logE ?? null, text: j.text, constant: !!j.constant } : null; };
  const used = (plan) => ({ u0: plan.reduce((s, u) => s + Math.abs(u[0]), 0) / NB, u1: plan.reduce((s, u) => s + u[1], 0) / NB });
  const rec = (name, r, k, key) => { (out.plans[name] ??= {})[`${key}:${k}`] = summary(r, k, key); };
  for (const t of r0.targets) { rec('passif', r0, t.target, 'galilee'); rec('passif', r0, t.target, 'galileeMelange'); rec('passif', r0, t.target, 'oracleC'); }
  // passe habitude
  const rh = runWorld(seed, { world: { cls, overrideU: HABIT() }, oracleC: true });
  for (const t of rh.targets) { rec('habitude', rh, t.target, 'galilee'); rec('habitude', rh, t.target, 'oracleC'); }
  // passes actives : un plan par formule à juger (vraie formule de GALILÉE, formule apprise sur des écarts mélangés)
  for (const [key, g] of Object.entries(F)) {
    const [kind, ks] = key.split(':'), k = Number(ks);
    const plan = activePlan(g); if (!plan) continue;
    const ra = runWorld(seed, { world: { cls, overrideU: toOverride(plan) }, oracleC: true });
    rec(`actif-${kind}`, ra, k, kind === 'reel' ? 'galilee' : 'galileeMelange');
    if (kind === 'reel') rec('actif-reel', ra, k, 'oracleC');
    (out.budget ??= {})[key] = used(plan);
  }
  // D2 direct : formules NON constantes injectées dans les mondes compris (fausses par construction), chacune jugée
  // sous un plan actif construit pour la confirmer
  if (cls === 'compris') {
    const INJ = [['u0²', (u) => u[0] * u[0]], ['|u0|', (u) => Math.abs(u[0])], ['u0·u1', (u) => u[0] * u[1]], ['cos(π·u0)', (u) => Math.cos(Math.PI * u[0])], ['u0³', (u) => u[0] ** 3], ['u0²·u1', (u) => u[0] * u[0] * u[1]]];
    for (const q of [seed % 6, (seed * 7 + 3) % 6].filter((v, i, a) => a.indexOf(v) === i)) {
      const k = (seed + q) % 3, g = { f: INJ[q][1], text: INJ[q][0] };
      const plan = activePlan(g);
      const ri = runWorld(seed, { world: { cls, overrideU: toOverride(plan) }, inject: { k, g } });
      const j = ri.targets.find((t) => t.target === k)?.injected;
      (out.injected ??= []).push({ text: g.text, k, accepted: !!j?.accepted, logE: j?.logE ?? null });
    }
  }
  // plafond oracle sous un plan actif construit pour la vraie forme (sans GALILÉE)
  if (cls === 'forme' && r0.truth.target != null) {
    const FORMS = { carre: (u) => 0.3 * u[0] * u[0], saturation: (u) => (0.4 * u[0]) / (1 + 2 * Math.abs(u[0])), interaction: (u) => 0.3 * u[0] * u[1] };
    const plan = activePlan({ f: FORMS[r0.truth.form] });
    const ro = runWorld(seed, { world: { cls, overrideU: toOverride(plan) }, oracleC: true });
    rec('actif-oracle', ro, r0.truth.target, 'oracleC');
  }
  out.secs = (Date.now() - t0) / 1000;
  return out;
}

if (process.argv[1]?.endsWith('p3.js')) {
  const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
  const [a, b] = arg('--seeds', '1-10').split('-').map(Number);
  const res = [];
  for (let s = a; s <= (b ?? a); s++) { res.push(runP3(s)); process.stderr.write(`\r${s}`); }
  writeFileSync(arg('--out', 'research/v6/p3-dev.json'), JSON.stringify(res));
  console.error('\nok', res.length);
}
