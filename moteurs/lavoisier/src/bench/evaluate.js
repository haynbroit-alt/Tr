// Évaluateur du protocole M0 (§ 5). Il est le seul à lire la vérité.
//
// Format de la prédiction (la « déclaration de corps », § 3) :
// {
//   records: { [id]: { type: string, links: string[], deltas: [[stockId, Δ], …] } },
//   stocks: [{ id, unit: '€' | 'qte' | 'contrats' | 'heures', series: number[365] }],
//   profitMensuel: number[12],
//   ecarts: [{ stock, debut, debit }],          // débit : perte moyenne par jour, dans l'unité du stock
// }
// La matrice d'incidence (§ 3, point 3) est lue à partir des Δ de chaque enregistrement : un type de flux touche le
// stock s avec le signe σ si l'un de ses enregistrements y porte un Δ de signe σ. Cette forme est équivalente à une
// matrice par type et permet aussi les types qui touchent un stock par objet.
import { DAYS, MONTHS } from './engine.js';

const c2 = (n) => (n * (n - 1)) / 2;
const f1 = (p, r) => (p + r > 0 ? (2 * p * r) / (p + r) : 0);
const median = (a) => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y), k = s.length >> 1; return s.length % 2 ? s[k] : (s[k - 1] + s[k]) / 2; };

class UF {
  constructor() { this.p = new Map(); }
  find(x) { if (!this.p.has(x)) this.p.set(x, x); let r = x; while (this.p.get(r) !== r) r = this.p.get(r); while (this.p.get(x) !== r) { const n = this.p.get(x); this.p.set(x, r); x = n; } return r; }
  union(a, b) { const ra = this.find(a), rb = this.find(b); if (ra !== rb) this.p.set(ra, rb); }
}

// ---------- F : regroupement des flux (B-cubé) ----------
export function bcubed(ids, truthOf, predOf) {
  const nt = new Map(), np = new Map(), ntp = new Map();
  const inc = (m, k) => m.set(k, (m.get(k) ?? 0) + 1);
  for (const id of ids) { const t = truthOf(id), p = predOf(id); inc(nt, t); inc(np, p); inc(ntp, t + '\u0000' + p); }
  let P = 0, R = 0;
  for (const id of ids) { const t = truthOf(id), p = predOf(id), x = ntp.get(t + '\u0000' + p); P += x / np.get(p); R += x / nt.get(t); }
  P /= ids.length; R /= ids.length;
  // variante équilibrée (rapportée sans seuil) : chaque vrai type pèse autant, quel que soit son volume
  const byType = new Map();
  for (const id of ids) { const t = truthOf(id), p = predOf(id), x = ntp.get(t + '\u0000' + p); const a = byType.get(t) ?? [0, 0, 0]; a[0] += x / np.get(p); a[1] += x / nt.get(t); a[2]++; byType.set(t, a); }
  const macro = [...byType.values()].reduce((s, [p, r, n]) => s + f1(p / n, r / n), 0) / byType.size;
  return { precision: P, recall: R, f1: f1(P, R), macro };
}

// ---------- L : appariement (paires, clôture transitive des deux côtés) ----------
export function pairF1(ids, truthComp, predComp) {
  const ct = new Map(), cp = new Map(), ctp = new Map();
  const inc = (m, k) => m.set(k, (m.get(k) ?? 0) + 1);
  for (const id of ids) { const t = truthComp(id), p = predComp(id); inc(ct, t); inc(cp, p); inc(ctp, t + '\u0000' + p); }
  let tp = 0, tt = 0, pp = 0;
  for (const n of ctp.values()) tp += c2(n);
  for (const n of ct.values()) tt += c2(n);
  for (const n of cp.values()) pp += c2(n);
  const precision = pp ? tp / pp : tt ? 1 : 1, recall = tt ? tp / tt : 1;
  return { precision, recall, f1: f1(precision, recall), truePairs: tt, predPairs: pp };
}

// ---------- appariement hongrois (minimise le coût ; matrice rectangulaire complétée par des coûts 1) ----------
export function hungarian(cost) {
  const n = cost.length, m = cost[0]?.length ?? 0, N = Math.max(n, m);
  if (!N) return [];
  const a = Array.from({ length: N }, (_, i) => Array.from({ length: N }, (_, j) => (i < n && j < m ? cost[i][j] : 1)));
  const u = new Float64Array(N + 1), v = new Float64Array(N + 1), p = new Int32Array(N + 1), way = new Int32Array(N + 1);
  for (let i = 1; i <= N; i++) {
    p[0] = i;
    let j0 = 0;
    const minv = new Float64Array(N + 1).fill(Infinity), used = new Uint8Array(N + 1);
    do {
      used[j0] = 1;
      const i0 = p[j0];
      let delta = Infinity, j1 = 0;
      for (let j = 1; j <= N; j++) {
        if (used[j]) continue;
        const cur = a[i0 - 1][j - 1] - u[i0] - v[j];
        if (cur < minv[j]) { minv[j] = cur; way[j] = j0; }
        if (minv[j] < delta) { delta = minv[j]; j1 = j; }
      }
      for (let j = 0; j <= N; j++) { if (used[j]) { u[p[j]] += delta; v[j] -= delta; } else minv[j] -= delta; }
      j0 = j1;
    } while (p[j0] !== 0);
    do { const j1 = way[j0]; p[j0] = p[j1]; j0 = j1; } while (j0);
  }
  const res = [];
  for (let j = 1; j <= N; j++) if (p[j] && p[j] - 1 < n && j - 1 < m) res.push([p[j] - 1, j - 1]);
  return res;
}

const amplitude = (s) => { let lo = Infinity, hi = -Infinity, sum = 0; for (const x of s) { lo = Math.min(lo, x); hi = Math.max(hi, x); sum += x; } return hi - lo > 1e-9 ? hi - lo : Math.max(1, Math.abs(sum / s.length)); };
export function seriesError(p, t) { let e = 0; for (let d = 0; d < DAYS; d++) e += Math.abs((p[d] ?? 0) - t[d]); return e / DAYS / amplitude(t); }

export function matchStocks(truthStocks, predStocks) {
  const cost = predStocks.map((p) => truthStocks.map((t) => (p.unit === t.unit ? Math.min(1, seriesError(p.series, t.series)) : 1)));
  const map = new Map(), err = new Map();
  for (const [i, j] of hungarian(cost)) if (cost[i][j] < 1) { map.set(predStocks[i].id, truthStocks[j].id); err.set(truthStocks[j].id, seriesError(predStocks[i].series, truthStocks[j].series)); }
  return { map, err };
}

export function evaluate(truth, pred) {
  const ids = Object.keys(truth.records);
  const T = truth.records, Pr = pred.records ?? {};
  const ptype = (id) => (Pr[id] ? 'p:' + Pr[id].type : 'manquant:' + id);
  // F
  const F = bcubed(ids, (id) => T[id].type, ptype);
  // L
  const ut = new UF(), firstOfTx = new Map();
  for (const id of ids) { ut.find(id); for (const x of T[id].tx) { if (firstOfTx.has(x)) ut.union(id, firstOfTx.get(x)); else firstOfTx.set(x, id); } }
  const up = new UF();
  for (const id of ids) { up.find(id); for (const l of Pr[id]?.links ?? []) if (T[l]) up.union(id, l); }
  const L = pairF1(ids, (id) => ut.find(id), (id) => up.find(id));
  // stocks
  const predStocks = (pred.stocks ?? []).filter((s) => Array.isArray(s.series) && s.series.length === DAYS);
  const { map: smap, err } = matchStocks(truth.stocks, predStocks);
  const S = median([...err.values()]);
  // G : incidence traduite (type prédit → type vrai majoritaire ; stock prédit → stock associé)
  const maj = new Map();
  for (const id of ids) { const k = ptype(id); if (!maj.has(k)) maj.set(k, new Map()); const m = maj.get(k); m.set(T[id].type, (m.get(T[id].type) ?? 0) + 1); }
  const tmap = new Map([...maj].map(([k, m]) => [k, [...m].sort((a, b) => b[1] - a[1])[0][0]]));
  const gt = new Set(), gp = new Set();
  for (const id of ids) {
    for (const [s, x] of T[id].deltas) if (x) gt.add(`${T[id].type}|${s}|${Math.sign(x)}`);
    for (const [s, x] of Pr[id]?.deltas ?? []) if (x) gp.add(`${tmap.get(ptype(id))}|${smap.get(s) ?? '?' + s}|${Math.sign(x)}`);
  }
  let gtp = 0;
  for (const k of gp) if (gt.has(k)) gtp++;
  const G = { precision: gp.size ? gtp / gp.size : 0, recall: gt.size ? gtp / gt.size : 1 };
  G.f1 = f1(G.precision, G.recall);
  // P : profit mensuel, rapporté au chiffre d'affaires mensuel moyen
  const caMean = truth.caMensuel.reduce((a, b) => a + b, 0) / MONTHS;
  const pm = pred.profitMensuel;
  const P = Array.isArray(pm) && pm.length === MONTHS ? pm.reduce((s, x, m) => s + Math.abs(x - truth.profitMensuel[m]), 0) / MONTHS / Math.max(1, caMean) : null;
  // R, FD : écarts de conservation
  const hidden = truth.hidden.map((h) => ({ ...h, found: false }));
  let fd = 0;
  for (const e of pred.ecarts ?? []) {
    const ts = smap.get(e.stock);
    const h = hidden.find((x) => !x.found && x.stock === ts && Math.abs(e.debut - x.debut) <= 21 && Math.abs(Math.abs(e.debit) - x.debit) <= 0.5 * x.debit);
    if (h) h.found = true; else fd++;
  }
  const above = hidden.filter((h) => h.above);
  return {
    F: F.f1, Fp: F.precision, Fr: F.recall, Fmacro: F.macro,
    L: L.f1, Lp: L.precision, Lr: L.recall,
    G: G.f1, S, P,
    R: above.length ? above.filter((h) => h.found).length / above.length : null,
    hiddenAbove: above.length, hiddenFound: above.filter((h) => h.found).length, belowFound: hidden.filter((h) => !h.above && h.found).length,
    FD: fd, stocksTruth: truth.stocks.length, stocksMatched: err.size,
  };
}

// Prédiction parfaite construite à partir de la vérité : sert à vérifier l'évaluateur (toutes les métriques doivent
// être idéales). Ce n'est pas une méthode comparée.
export function perfectPrediction(truth) {
  const byTx = new Map();
  for (const [id, r] of Object.entries(truth.records)) for (const x of r.tx) if (!byTx.has(x)) byTx.set(x, id);
  const records = {};
  for (const [id, r] of Object.entries(truth.records)) records[id] = { type: r.type, links: r.tx.map((x) => byTx.get(x)).filter((l) => l !== id), deltas: r.deltas };
  return {
    records,
    stocks: truth.stocks.map((s) => ({ id: s.id, unit: s.unit, series: s.series })),
    profitMensuel: truth.profitMensuel,
    ecarts: truth.hidden.map((h) => ({ stock: h.stock, debut: h.debut, debit: h.debit })),
  };
}
