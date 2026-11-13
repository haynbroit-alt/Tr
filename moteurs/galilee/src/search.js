// Recherche d'équations : programmation génétique avec ajustement des constantes,
// amorcée par des a priori « de physicien » (lois de puissance, relations linéaires, oscillations).
import {
  C, V, U, B, clone, simplify, complexity, size, nodes, constants, key, niceForm, evaluate, UNARY,
} from './expr.js';
import { rng, fitConstants, mse, linearFit, variance } from './fit.js';

const BIN_W = ['+', '+', '-', '*', '*', '*', '/', '/', '^'];
const POW_EXP = [2, 2, 3, 0.5, -1, -1, -2, 1.5];
const TRANSCENDENTAL = new Set(['sin', 'cos', 'exp', 'log']);

/** Valeur « simple » la plus proche (petit rationnel, éventuellement fois π). */
export function nearestNice(v) {
  let best = null, bd = Infinity;
  for (const pi of [1, Math.PI]) {
    for (const q of [1, 2, 3, 4]) {
      const cand = (Math.round((v / pi) * q) / q) * pi;
      if (cand === 0 || !niceForm(cand)) continue;
      const d = Math.abs(cand - v) / Math.abs(v || 1);
      if (d < bd - 1e-12) { bd = d; best = cand; }
    }
  }
  return best === null ? null : { value: best, rel: bd };
}

function valid(e, maxSize) {
  if (size(e) > maxSize) return false;
  const walk = (n, inT) => {
    if (n.t === 'c') return isFinite(n.v);
    if (n.t === 'v') return true;
    if (n.t === 'u') {
      const tr = TRANSCENDENTAL.has(n.op);
      if (tr && inT) return false;           // pas de sin(exp(…)) : a priori de plausibilité
      if (n.a.t === 'c') return false;
      return walk(n.a, inT || tr);
    }
    if (n.op === '^' && n.b.t !== 'c') return false; // exposants constants uniquement
    if (n.op === '^' && n.a.t === 'c') return false;
    return walk(n.a, inT) && walk(n.b, inT);
  };
  return walk(e, false);
}

export class Search {
  /**
   * @param {object} o  d = nombre de variables ; seed ; maxSize = taille max des arbres ;
   *                    popSize ; unary = opérateurs unaires autorisés.
   */
  constructor({ d, seed = 1, maxSize = 21, popSize = 300, unary = UNARY, parsimony = 0.035 } = {}) {
    this.d = d;
    this.r = rng(seed);
    this.maxSize = maxSize;
    this.popSize = popSize;
    this.unary = unary;
    this.parsimony = parsimony;
    this.pop = [];
    this.hof = new Map();      // complexité -> meilleur membre
    this.seen = new Map();
    this.data = null;
    this.varY = 1;
    this.floor = 0;            // plancher de MSE (variance du bruit), si connue
    this.evals = 0;
  }

  setNoise(sigma) { this.floor = sigma * sigma; this._refit(); }

  setData(data) {
    this.data = data;
    this.varY = variance(data.y) || 1;
    this.seen.clear();
    this._refit();
    for (const e of this._seeds()) this._offer(e, true);
    while (this.pop.length < this.popSize) this._offer(this._randTree(1 + this.r.int(3)), true);
  }

  _fitness(m) {
    return Math.log(Math.max(m.mse, this.floor * 0.9) / this.varY + 1e-18) + this.parsimony * m.cx;
  }

  _refit() {
    if (!this.data) return;
    for (const m of this.pop) { m.mse = mse(m.e, this.data); m.fit = this._fitness(m); }
    const old = [...this.hof.values()];
    this.hof.clear();
    for (const m of old) {
      const raw = { e: m.e, mse: mse(m.e, this.data), cx: m.cx };
      raw.fit = this._fitness(raw);
      this._hofOffer(raw);
      const e = clone(m.e);
      if (constants(e).length) {
        const v = fitConstants(e, this.data, 10);
        const mm = { e, mse: v, cx: complexity(e) };
        mm.fit = this._fitness(mm);
        this._hofOffer(mm);
      }
    }
  }

  _hofOffer(m) {
    if (!isFinite(m.mse)) return false;
    const cur = this.hof.get(m.cx);
    if (!cur || m.mse < cur.mse) { this.hof.set(m.cx, m); return true; }
    return false;
  }

  /** Évalue un candidat, ajuste ses constantes et l'insère dans la population. */
  _offer(e0, force = false) {
    let e = simplify(e0);
    if (!valid(e, this.maxSize)) return null;
    const k0 = key(e);
    if (!force && this.seen.has(k0)) return null;
    if (this.seen.size > 200000) this.seen.clear();
    this.seen.set(k0, 1);
    this.evals++;
    let v = mse(e, this.data);
    if (constants(e).length) {
      if (!isFinite(v)) return null;
      v = fitConstants(e, this.data, 7);
      e = simplify(e);
      if (!valid(e, this.maxSize)) return null;
    }
    if (!isFinite(v)) return null;
    const m = { e, mse: v, cx: complexity(e) };
    m.fit = this._fitness(m);
    this._hofOffer(m);
    if (this.pop.length < this.popSize) this.pop.push(m);
    else {
      // remplace le moins bon de 3 tirés au hasard
      let w = this.r.int(this.pop.length);
      for (let t = 0; t < 2; t++) { const j = this.r.int(this.pop.length); if (this.pop[j].fit > this.pop[w].fit) w = j; }
      if (force || m.fit < this.pop[w].fit) this.pop[w] = m;
    }
    return m;
  }

  _leaf() {
    const r = this.r;
    if (r() < 0.7) return V(r.int(this.d));
    return C(r() < 0.5 ? r.pick([1, 2, 3, 0.5, -1]) : Number((r.normal() * 3).toPrecision(3)));
  }
  _randTree(depthLeft) {
    const r = this.r;
    if (depthLeft <= 0 || r() < 0.25) return this._leaf();
    if (r() < 0.22 && this.unary.length) return U(r.pick(this.unary), this._randTree(depthLeft - 1));
    const op = r.pick(BIN_W);
    if (op === '^') return B('^', this._randTree(depthLeft - 1), C(r.pick(POW_EXP)));
    return B(op, this._randTree(depthLeft - 1), this._randTree(depthLeft - 1));
  }

  _tournament(k = 5) {
    let b = this.r.pick(this.pop);
    for (let t = 1; t < k; t++) { const c = this.r.pick(this.pop); if (c.fit < b.fit) b = c; }
    return b;
  }

  _mutate(parent) {
    const r = this.r;
    const e = clone(parent);
    const ns = nodes(e);
    const n = r.pick(ns);
    const replace = (target, src) => { for (const k of Object.keys(target)) delete target[k]; Object.assign(target, src); };
    const kind = r();
    if (kind < 0.16) {                       // perturbation d'une constante
      const cs = constants(e);
      if (!cs.length) return null;
      const c = r.pick(cs);
      const u = r();
      if (u < 0.5) c.v *= 1 + r.normal() * 0.3;
      else if (u < 0.7) c.v = -c.v;
      else if (u < 0.85) c.v = r.pick([1, 2, 3, 4, 0.5, -1, -2, 1.5, Math.PI, 2 * Math.PI]);
      else c.v = r.normal() * 5;
    } else if (kind < 0.30) {                // changement d'opérateur
      const ops = ns.filter((x) => x.t === 'u' || x.t === 'b');
      if (!ops.length) return null;
      const o = r.pick(ops);
      if (o.t === 'u') o.op = r.pick(this.unary);
      else { o.op = r.pick(BIN_W); if (o.op === '^') o.b = C(r.pick(POW_EXP)); }
    } else if (kind < 0.44) {                // remplacement d'un sous-arbre
      replace(n, this._randTree(r.int(3)));
    } else if (kind < 0.60) {                // insertion au-dessus d'un nœud
      const inner = clone(n);
      const u = r();
      if (u < 0.25 && this.unary.length) replace(n, U(r.pick(this.unary), inner));
      else if (u < 0.40) replace(n, B('^', inner, C(r.pick(POW_EXP))));
      else if (u < 0.55) replace(n, B('+', B('*', C(1 + r.normal() * 0.2), inner), C(r.normal())));
      else {
        const op = r.pick(['+', '-', '*', '/']);
        replace(n, r() < 0.5 ? B(op, inner, this._leaf()) : B(op, this._leaf(), inner));
      }
    } else if (kind < 0.72) {                // suppression : un nœud est remplacé par un de ses enfants
      const ops = ns.filter((x) => x.t === 'u' || x.t === 'b');
      if (!ops.length) return null;
      const o = r.pick(ops);
      replace(o, clone(o.t === 'u' ? o.a : r() < 0.5 ? o.a : o.b));
    } else if (kind < 0.90) {                // croisement
      const other = this.r() < 0.3 && this.hof.size ? r.pick([...this.hof.values()]) : this._tournament();
      replace(n, clone(r.pick(nodes(other.e))));
    } else if (kind < 0.95) {                // échange d'opérandes
      const ops = ns.filter((x) => x.t === 'b' && x.op !== '^');
      if (!ops.length) return null;
      const o = r.pick(ops);
      [o.a, o.b] = [o.b, o.a];
    } else {                                 // changement de variable
      const vs = ns.filter((x) => x.t === 'v');
      if (!vs.length || this.d < 2) return null;
      r.pick(vs).i = r.int(this.d);
    }
    return e;
  }

  /** Effectue n tentatives de mutation. */
  step(n) {
    for (let i = 0; i < n; i++) {
      const fromHof = this.r() < 0.12 && this.hof.size;
      const parent = fromHof ? this.r.pick([...this.hof.values()]) : this._tournament();
      const child = this._mutate(parent.e);
      if (child) this._offer(child);
    }
  }

  /** Tente de remplacer les constantes ajustées par des valeurs simples (2, 1/2, 2π…). */
  polish() {
    for (const m of [...this.hof.values()]) {
      let e = clone(m.e);
      for (let pass = 0; pass < 4; pass++) {
        const cs = constants(e).filter((c) => !niceForm(c.v));
        let bestC = null, bestRel = 0.04, bestV = 0;
        for (const c of cs) {
          const nn = nearestNice(c.v);
          if (nn && nn.rel < bestRel) { bestRel = nn.rel; bestC = c; bestV = nn.value; }
        }
        if (!bestC) break;
        const trial = clone(e);
        const tc = constants(trial)[constants(e).indexOf(bestC)];
        tc.v = bestV;
        // réajuste les autres constantes en gelant celles qui sont déjà « simples »
        const free = constants(trial).filter((c) => !niceForm(c.v));
        if (free.length) fitConstants(trial, this.data, 8, free);
        const s = simplify(trial);
        if (!valid(s, this.maxSize)) break;
        const v = mse(s, this.data);
        if (!isFinite(v)) break;
        const mm = { e: s, mse: v, cx: complexity(s) };
        mm.fit = this._fitness(mm);
        this._hofOffer(mm);
        e = s;
      }
    }
  }

  /** Front de Pareto (complexité croissante, erreur strictement décroissante). */
  front() {
    const ms = [...this.hof.values()].sort((a, b) => a.cx - b.cx);
    const out = [];
    let best = Infinity;
    for (const m of ms) if (m.mse < best * 0.999) { out.push(m); best = m.mse; }
    return out;
  }

  // ------------------------------------------------------------ a priori (amorces)
  _seeds() {
    const { cols, y, n } = this.data, d = this.d;
    const out = [];
    const ones = new Float64Array(n).fill(1);
    let mean = 0;
    for (let k = 0; k < n; k++) mean += y[k];
    out.push(C(mean / n));
    // relation affine
    const w = linearFit([ones, ...cols], y, n);
    if (w) {
      let e = C(w[0]);
      for (let j = 0; j < d; j++) e = B('+', e, B('*', C(w[j + 1]), V(j)));
      out.push(e);
    }
    // loi de puissance  y = c · Π x_j^a_j  (régression log-linéaire)
    const pos = cols.every((c) => c.every((v) => v > 0));
    const sgn = y.every((v) => v > 0) ? 1 : y.every((v) => v < 0) ? -1 : 0;
    if (pos && sgn !== 0 && n >= d + 2) {
      const ly = Float64Array.from(y, (v) => Math.log(sgn * v));
      const lx = cols.map((c) => Float64Array.from(c, Math.log));
      const a = linearFit([ones, ...lx], ly, n);
      if (a) {
        const snap = (v) => {
          for (const q of [1, 2, 3]) { const p = Math.round(v * q); if (Math.abs(v - p / q) < 0.06) return p / q; }
          return v;
        };
        for (const exps of [a.slice(1), a.slice(1).map(snap)]) {
          let e = C(sgn * Math.exp(a[0]));
          for (let j = 0; j < d; j++) if (exps[j] !== 0) e = B('*', e, B('^', V(j), C(exps[j])));
          out.push(e);
        }
      }
    }
    // gabarits à une variable : y ≈ a·f(x_j) + b
    const tpl = [
      (x) => B('^', x, C(2)), (x) => B('/', C(1), x), (x) => B('^', x, C(0.5)), (x) => U('log', x),
      (x) => U('exp', x), (x) => U('exp', B('*', C(-1), x)), (x) => B('^', x, C(-2)),
      (x) => U('exp', B('/', C(-1), x)), (x) => U('exp', B('/', C(-4), x)),
    ];
    for (let j = 0; j < d; j++) {
      for (const f of tpl) {
        const fe = f(V(j));
        const fv = evaluate(fe, cols, n);
        if (!fv.every(isFinite)) continue;
        const ww = linearFit([ones, fv], y, n);
        if (ww) out.push(B('+', B('*', C(ww[1]), fe), C(ww[0])));
      }
      // oscillation : balayage de fréquence puis moindres carrés sur sin/cos
      let lo = Infinity, hi = -Infinity;
      for (const v of cols[j]) { if (v < lo) lo = v; if (v > hi) hi = v; }
      const span = hi - lo;
      if (span > 0 && n >= 8) {
        let bestW = 0, bestErr = Infinity, bestCoef = null;
        for (let s = 1; s <= 60; s++) {
          const om = (s * 0.25 * 2 * Math.PI) / span;
          const sn = Float64Array.from(cols[j], (v) => Math.sin(om * v));
          const cn = Float64Array.from(cols[j], (v) => Math.cos(om * v));
          const ww = linearFit([ones, sn, cn], y, n);
          if (!ww) continue;
          let err = 0;
          for (let k = 0; k < n; k++) { const dd = ww[0] + ww[1] * sn[k] + ww[2] * cn[k] - y[k]; err += dd * dd; }
          if (err < bestErr) { bestErr = err; bestW = om; bestCoef = ww; }
        }
        if (bestCoef && bestErr / n < 0.5 * this.varY) {
          const arg = () => B('*', C(bestW), V(j));
          out.push(B('+', B('+', B('*', C(bestCoef[1]), U('sin', arg())), B('*', C(bestCoef[2]), U('cos', arg()))), C(bestCoef[0])));
          out.push(B('*', C(Math.hypot(bestCoef[1], bestCoef[2])), U('sin', B('+', arg(), C(Math.atan2(bestCoef[2], bestCoef[1]))))));
          out.push(B('*', C(bestCoef[1]), U('sin', arg())));
          out.push(B('*', C(bestCoef[2]), U('cos', arg())));
        }
      }
    }
    return out;
  }
}

