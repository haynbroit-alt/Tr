// Expressions symboliques : représentation, évaluation vectorisée, simplification,
// affichage et analyse syntaxique. Aucune dépendance, aucun eval().

export const UNARY = ['sqrt', 'sin', 'cos', 'exp', 'log'];
export const BINARY = ['+', '-', '*', '/', '^'];

export const C = (v) => ({ t: 'c', v });
export const V = (i) => ({ t: 'v', i });
export const U = (op, a) => ({ t: 'u', op, a });
export const B = (op, a, b) => ({ t: 'b', op, a, b });

export function clone(e) {
  switch (e.t) {
    case 'c': return { t: 'c', v: e.v };
    case 'v': return { t: 'v', i: e.i };
    case 'u': return { t: 'u', op: e.op, a: clone(e.a) };
    default: return { t: 'b', op: e.op, a: clone(e.a), b: clone(e.b) };
  }
}

const OPC = { '+': 2, '-': 3, '*': 4, '/': 5, '^': 6, sqrt: 7, sin: 8, cos: 9, exp: 10, log: 11 };

/**
 * Compile l'expression en programme postfixé. Renvoie run(cols, n, out) qui évalue sur n points
 * sans allocation. Les constantes sont relues à chaque appel : on peut les modifier entre deux exécutions.
 */
export function compile(e) {
  const code = [], ref = [];
  (function post(n) {
    if (n.t === 'c') { code.push(0); ref.push(n); }
    else if (n.t === 'v') { code.push(1); ref.push(n.i); }
    else if (n.t === 'u') { post(n.a); code.push(OPC[n.op]); ref.push(null); }
    else { post(n.a); post(n.b); code.push(OPC[n.op]); ref.push(null); }
  })(e);
  const L = code.length;
  const st = new Float64Array(L + 1), cv = new Float64Array(L);
  return function run(cols, n, out) {
    for (let i = 0; i < L; i++) if (code[i] === 0) cv[i] = ref[i].v;
    for (let k = 0; k < n; k++) {
      let sp = 0;
      for (let i = 0; i < L; i++) {
        switch (code[i]) {
          case 0: st[sp++] = cv[i]; break;
          case 1: st[sp++] = cols[ref[i]][k]; break;
          case 2: sp--; st[sp - 1] += st[sp]; break;
          case 3: sp--; st[sp - 1] -= st[sp]; break;
          case 4: sp--; st[sp - 1] *= st[sp]; break;
          case 5: sp--; st[sp - 1] /= st[sp]; break;
          case 6: {
            sp--; const x = st[sp - 1], p = st[sp];
            st[sp - 1] = p === 2 ? x * x : p === 0.5 ? Math.sqrt(x) : p === -1 ? 1 / x : Math.pow(x, p);
            break;
          }
          case 7: st[sp - 1] = Math.sqrt(st[sp - 1]); break;
          case 8: st[sp - 1] = Math.sin(st[sp - 1]); break;
          case 9: st[sp - 1] = Math.cos(st[sp - 1]); break;
          case 10: st[sp - 1] = Math.exp(st[sp - 1]); break;
          default: st[sp - 1] = Math.log(st[sp - 1]);
        }
      }
      out[k] = st[0];
    }
    return out;
  };
}

/** Évalue l'expression sur n points. cols[i] = Float64Array des valeurs de la variable i. */
export function evaluate(e, cols, n) {
  return compile(e)(cols, n, new Float64Array(n));
}

/** Évalue en un seul point (x = tableau des variables). */
export function evalPoint(e, x) {
  switch (e.t) {
    case 'c': return e.v;
    case 'v': return x[e.i];
    case 'u': {
      const a = evalPoint(e.a, x);
      return e.op === 'sqrt' ? Math.sqrt(a) : e.op === 'sin' ? Math.sin(a) : e.op === 'cos' ? Math.cos(a)
        : e.op === 'exp' ? Math.exp(a) : Math.log(a);
    }
    default: {
      const a = evalPoint(e.a, x), b = evalPoint(e.b, x);
      return e.op === '+' ? a + b : e.op === '-' ? a - b : e.op === '*' ? a * b : e.op === '/' ? a / b : Math.pow(a, b);
    }
  }
}

export function size(e) {
  return e.t === 'c' || e.t === 'v' ? 1 : e.t === 'u' ? 1 + size(e.a) : 1 + size(e.a) + size(e.b);
}
export function depth(e) {
  return e.t === 'c' || e.t === 'v' ? 1 : e.t === 'u' ? 1 + depth(e.a) : 1 + Math.max(depth(e.a), depth(e.b));
}

/** Une constante « simple » est un petit rationnel, ou un petit rationnel fois π. */
export function niceForm(v) {
  if (!isFinite(v)) return null;
  const a = Math.abs(v);
  for (const q of [1, 2, 3, 4]) {
    const p = v * q;
    if (Math.abs(p - Math.round(p)) > 1e-9) continue;
    if (a <= (q === 1 ? 20 : q === 2 ? 6 : 2)) return { p: Math.round(p), q, pi: false };
  }
  for (const [p, q] of [[1, 2], [1, 1], [2, 1]]) {   // π/2, π, 2π seulement : au-delà, on « reconnaît » π partout
    if (Math.abs(a - (p / q) * Math.PI) < 1e-9) return { p: Math.sign(v) * p, q, pi: true };
  }
  return null;
}

/** Complexité : chaque nœud coûte 1 ; une constante réelle arbitraire coûte 3 (elle porte de l'information). */
export function complexity(e) {
  switch (e.t) {
    case 'c': return niceForm(e.v) ? 1 : 3;
    case 'v': return 1;
    case 'u': return 1 + complexity(e.a);
    default: return 1 + complexity(e.a) + complexity(e.b);
  }
}

export function constants(e, out = []) {
  if (e.t === 'c') out.push(e);
  else if (e.t === 'u') constants(e.a, out);
  else if (e.t === 'b') { constants(e.a, out); constants(e.b, out); }
  return out;
}
export function nodes(e, out = []) {
  out.push(e);
  if (e.t === 'u') nodes(e.a, out);
  else if (e.t === 'b') { nodes(e.a, out); nodes(e.b, out); }
  return out;
}
export function usesVar(e, i) {
  return e.t === 'v' ? e.i === i : e.t === 'c' ? false : e.t === 'u' ? usesVar(e.a, i) : usesVar(e.a, i) || usesVar(e.b, i);
}

const isC = (e, v) => e.t === 'c' && (v === undefined || e.v === v);

/** Simplification algébrique légère (pliage de constantes, éléments neutres, fusion de puissances). */
export function simplify(e) {
  if (e.t === 'c' || e.t === 'v') return e;
  if (e.t === 'u') {
    const a = simplify(e.a);
    if (a.t === 'c') { const v = evalPoint(U(e.op, a), []); if (isFinite(v)) return C(v); }
    if (e.op === 'sqrt') return simplify(B('^', a, C(0.5)));
    if (e.op === 'exp' && a.t === 'u' && a.op === 'log') return a.a;
    if (e.op === 'log' && a.t === 'u' && a.op === 'exp') return a.a;
    if ((e.op === 'cos' || e.op === 'sin') && a.t === 'b' && a.op === '*' && a.a.t === 'c' && a.a.v < 0) {
      const flipped = U(e.op, B('*', C(-a.a.v), a.b));       // cos(−u) = cos(u) ; sin(−u) = −sin(u)
      return e.op === 'cos' ? flipped : B('*', C(-1), flipped);
    }
    return U(e.op, a);
  }
  let a = simplify(e.a), b = simplify(e.b);
  const op = e.op;
  if (a.t === 'c' && b.t === 'c') { const v = evalPoint(B(op, a, b), []); if (isFinite(v)) return C(v); }
  switch (op) {
    case '+':
      if (isC(a, 0)) return b;
      if (isC(b, 0)) return a;
      if (a.t === 'c') [a, b] = [b, a]; // constante à droite
      if (b.t === 'c' && a.t === 'b' && (a.op === '+' || a.op === '-') && a.b.t === 'c')
        return simplify(B('+', a.a, C(a.op === '+' ? a.b.v + b.v : b.v - a.b.v)));
      if (b.t === 'c' && b.v < 0) return B('-', a, C(-b.v));
      break;
    case '-':
      if (isC(b, 0)) return a;
      if (b.t === 'c' && a.t !== 'c') return simplify(B('+', a, C(-b.v)));
      if (equal(a, b)) return C(0);
      break;
    case '*':
      if (isC(a, 0) || isC(b, 0)) return C(0);
      if (isC(a, 1)) return b;
      if (isC(b, 1)) return a;
      if (b.t === 'c') [a, b] = [b, a]; // constante à gauche
      if (a.t === 'c' && b.t === 'b' && b.op === '*' && b.a.t === 'c') return simplify(B('*', C(a.v * b.a.v), b.b));
      if (a.t === 'c' && b.t === 'b' && b.op === '/' && b.a.t === 'c') return simplify(B('/', C(a.v * b.a.v), b.b));
      if (a.t === 'c' && b.t === 'b' && b.op === '/' && b.b.t === 'c') return simplify(B('*', C(a.v / b.b.v), b.a));
      if (equal(a, b)) return simplify(B('^', a, C(2)));
      { // x^p * x^q -> x^(p+q)
        const [ba, pa] = basePow(a), [bb, pb] = basePow(b);
        if (pa !== null && pb !== null && equal(ba, bb)) return simplify(B('^', ba, C(pa + pb)));
      }
      break;
    case '/':
      if (isC(a, 0)) return C(0);
      if (isC(b, 1)) return a;
      if (b.t === 'c' && b.v !== 0) return simplify(B('*', C(1 / b.v), a));
      if (equal(a, b)) return C(1);
      if (a.t === 'b' && a.op === '*' && a.a.t === 'c' && b.t === 'b' && b.op === '*' && b.a.t === 'c')
        return simplify(B('/', B('*', C(a.a.v / b.a.v), a.b), b.b));
      if (b.t === 'b' && b.op === '*' && b.a.t === 'c' && b.a.v !== 0)
        return simplify(B('/', B('*', C(1 / b.a.v), a), b.b));
      {
        const [ba, pa] = basePow(a), [bb, pb] = basePow(b);
        if (pa !== null && pb !== null && equal(ba, bb)) return simplify(B('^', ba, C(pa - pb)));
      }
      break;
    case '^':
      if (isC(b, 1)) return a;
      if (isC(b, 0)) return C(1);
      if (isC(a, 1)) return C(1);
      if (b.t === 'c' && a.t === 'b' && a.op === '^' && a.b.t === 'c') {
        // (x^p)^q = x^(pq), valable sans condition si p n'est pas un entier pair
        const p = a.b.v;
        if (!(Number.isInteger(p) && p % 2 === 0)) return simplify(B('^', a.a, C(p * b.v)));
      }
      if (b.t === 'c' && a.t === 'u' && a.op === 'exp') return simplify(U('exp', B('*', C(b.v), a.a)));   // exp(u)^p = exp(p·u)
      if (b.t === 'c' && a.t === 'b' && (a.op === '*' || a.op === '/')) {                                  // (c·X)^p = c^p · X^p
        const [coef, rest] = splitCoef(a);
        if (rest && coef > 0 && coef !== 1) return simplify(B('*', C(Math.pow(coef, b.v)), B('^', rest, C(b.v))));
      }
      break;
  }
  return B(op, a, b);
}

/** Sépare le coefficient numérique d'un produit/quotient : e = coef · reste (reste = null si e est constant). */
function splitCoef(e) {
  if (e.t === 'c') return [e.v, null];
  if (e.t === 'b' && (e.op === '*' || e.op === '/')) {
    const [ca, ra] = splitCoef(e.a), [cb, rb] = splitCoef(e.b);
    const coef = e.op === '*' ? ca * cb : ca / cb;
    if (!isFinite(coef) || coef === 0) return [1, e];
    if (e.op === '*') return [coef, ra && rb ? B('*', ra, rb) : ra || rb];
    return [coef, rb ? B('/', ra || C(1), rb) : ra];
  }
  return [1, e];
}

function basePow(e) {
  if (e.t === 'b' && e.op === '^' && e.b.t === 'c') return [e.a, e.b.v];
  if (e.t === 'v') return [e, 1];
  return [e, e.t === 'c' ? null : 1];
}

export function equal(a, b) {
  if (a.t !== b.t) return false;
  switch (a.t) {
    case 'c': return a.v === b.v;
    case 'v': return a.i === b.i;
    case 'u': return a.op === b.op && equal(a.a, b.a);
    default: return a.op === b.op && equal(a.a, b.a) && equal(a.b, b.b);
  }
}

export function fmtNum(v, digits = 4) {
  const nf = niceForm(v);
  if (nf) {
    const frac = nf.q === 1 ? `${nf.p}` : `${nf.p}/${nf.q}`;
    if (!nf.pi) return frac;
    if (nf.q === 1) return nf.p === 1 ? 'π' : nf.p === -1 ? '-π' : `${nf.p}π`;
    return `${nf.p === 1 ? '' : nf.p === -1 ? '-' : nf.p}π/${nf.q}`;
  }
  const a = Math.abs(v);
  if (a !== 0 && (a < 1e-3 || a >= 1e5)) return v.toExponential(digits - 1).replace(/\.?0+e/, 'e').replace('e+', 'e');
  return String(Number(v.toPrecision(digits)));
}

/** Décompose un produit en coefficient × facteurs^exposants. */
function mulParts(e, exp, acc) {
  if (e.t === 'c') {
    const v = Math.pow(e.v, exp);
    if (isFinite(v)) { acc.coef *= v; return; }
  }
  if (e.t === 'b' && e.op === '*') { mulParts(e.a, exp, acc); mulParts(e.b, exp, acc); return; }
  if (e.t === 'b' && e.op === '/') { mulParts(e.a, exp, acc); mulParts(e.b, -exp, acc); return; }
  if (e.t === 'b' && e.op === '^' && e.b.t === 'c') {
    const inner = e.a;
    if (inner.t === 'b' && (inner.op === '*' || inner.op === '/' || inner.op === '^') && Number.isInteger(e.b.v)) mulParts(inner, exp * e.b.v, acc);
    else if (inner.t === 'b' && inner.op === '/' && exp * e.b.v < 0) addFactor(acc, B('/', inner.b, inner.a), -exp * e.b.v); // (A/B)^(−p) = (B/A)^p
    else addFactor(acc, inner, exp * e.b.v);
    return;
  }
  if (e.t === 'u' && e.op === 'sqrt') { addFactor(acc, e.a, exp / 2); return; }
  addFactor(acc, e, exp);
}
function addFactor(acc, base, exp) {
  const f = acc.factors.find((q) => equal(q.base, base));
  if (f) f.exp += exp; else acc.factors.push({ base, exp });
}
function addParts(e, sign, out) {
  if (e.t === 'b' && e.op === '+') { addParts(e.a, sign, out); addParts(e.b, sign, out); }
  else if (e.t === 'b' && e.op === '-') { addParts(e.a, sign, out); addParts(e.b, -sign, out); }
  else out.push({ sign, e });
}

/** Affichage lisible, proche de l'écriture manuscrite : 2π·√(L/g), m·v^2 / 2, 5 − 5·exp(−t/2). */
export function toString(e, names, digits = 4) {
  const atomic = (s) => /^[\p{L}\p{N}_.]+$/u.test(s) || /^(√|sin|cos|exp|log)\([^()]*(\([^()]*\)[^()]*)*\)$/.test(s);
  const wrap = (s) => (atomic(s) ? s : `(${s})`);
  const prodStr = (list) => list.join('·');
  function term(e) { // -> { neg, s }
    if (e.t === 'c') return { neg: e.v < 0, s: fmtNum(Math.abs(e.v), digits) };
    if (e.t === 'v') return { neg: false, s: names ? names[e.i] : `x${e.i}` };
    if (e.t === 'u') return { neg: false, s: `${e.op === 'sqrt' ? '√' : e.op}(${sum(e.a)})` };
    if (e.op === '+' || e.op === '-') return { neg: false, s: sum(e) };
    const acc = { coef: 1, factors: [] };
    mulParts(e, 1, acc);
    const neg = acc.coef < 0;
    let coef = Math.abs(acc.coef);
    const num = [], den = [], sn = [], sd = [];
    for (const f of acc.factors) {
      if (f.exp === 0) continue;
      if (f.exp < 0 && f.base.t === 'u' && f.base.op === 'exp') { f.exp = -f.exp; f.base = U('exp', simplify(B('*', C(-1), f.base.a))); } // 1/exp(u) = exp(−u)
      const b = sum(f.base), a = Math.abs(f.exp);
      const tgt = f.exp > 0 ? (a === 0.5 ? sn : num) : (a === 0.5 ? sd : den);
      if (a === 0.5) tgt.push(b);
      else tgt.push(a === 1 ? (atomic(b) ? b : `(${b})`) : `${wrap(b)}^${fmtNum(a, digits).includes('/') ? `(${fmtNum(a, digits)})` : fmtNum(a, digits)}`);
    }
    if (sn.length) {
      num.push(`√(${prodStr(sn.map((x) => (sn.length + sd.length > 1 ? wrap(x) : x)))}${sd.length ? ' / ' + (sd.length > 1 ? `(${prodStr(sd.map(wrap))})` : wrap(sd[0])) : ''})`);
    } else if (sd.length) den.push(`√(${sd.length > 1 ? prodStr(sd.map(wrap)) : sd[0]})`);
    const nf = niceForm(coef);
    let cnum = '', cden = '';
    if (nf && nf.q > 1 && (num.length || den.length)) {
      cnum = nf.pi ? (nf.p === 1 ? 'π' : `${nf.p}π`) : (nf.p === 1 ? '' : `${nf.p}`); cden = `${nf.q}`;
    } else if (coef !== 1 || !num.length) cnum = fmtNum(coef, digits);
    const top = [cnum, ...num].filter(Boolean);
    const bot = [...den, cden].filter(Boolean);
    let s = top.length ? prodStr(top) : '1';
    if (bot.length) s += ' / ' + (bot.length > 1 ? `(${prodStr(bot)})` : bot[0]);
    return { neg, s };
  }
  function sum(e) {
    const parts = [];
    addParts(e, 1, parts);
    const ts = parts.map((p) => { const t = term(p.e); return { neg: (p.sign < 0) !== t.neg, s: t.s, isC: p.e.t === 'c' }; });
    ts.sort((a, b) => (a.isC - b.isC) || (a.neg - b.neg));   // termes positifs d'abord, constante en dernier
    if (ts.length > 1 && ts[0].neg) { const i = ts.findIndex((t) => !t.neg); if (i > 0) ts.unshift(ts.splice(i, 1)[0]); }
    let out = '';
    ts.forEach((t, i) => {
      const body = ts.length > 1 && / [+−] /.test(t.s) && !atomic(t.s) && !t.s.includes('·') && !t.s.includes('/') ? `(${t.s})` : t.s;
      out += i === 0 ? (t.neg ? '−' : '') + body : (t.neg ? ' − ' : ' + ') + body;
    });
    return out;
  }
  return sum(e);
}

/** Clé canonique pour repérer les doublons (constantes arrondies). */
export function key(e) {
  switch (e.t) {
    case 'c': return e.v.toPrecision(6);
    case 'v': return 'x' + e.i;
    case 'u': return `${e.op}(${key(e.a)})`;
    default: {
      let ka = key(e.a), kb = key(e.b);
      if ((e.op === '+' || e.op === '*') && ka > kb) [ka, kb] = [kb, ka];
      return `(${ka}${e.op}${kb})`;
    }
  }
}
/** Clé de structure : les constantes sont anonymisées. */
export function shapeKey(e) {
  switch (e.t) {
    case 'c': return 'c';
    case 'v': return 'x' + e.i;
    case 'u': return `${e.op}(${shapeKey(e.a)})`;
    default: {
      let ka = shapeKey(e.a), kb = shapeKey(e.b);
      if ((e.op === '+' || e.op === '*') && ka > kb) [ka, kb] = [kb, ka];
      return `(${ka}${e.op}${kb})`;
    }
  }
}

// ---------------------------------------------------------------- analyse syntaxique

/** Analyse une formule texte, ex. "2*pi*sqrt(L/g)". names = variables autorisées. */
export function parse(src, names) {
  const s = src.replace(/·|×/g, '*').replace(/−/g, '-').replace(/(\d)\s*π/g, '$1*pi').replace(/π/g, 'pi').replace(/√/g, 'sqrt').replace(/\*\*/g, '^');
  let i = 0;
  const ws = () => { while (i < s.length && /\s/.test(s[i])) i++; };
  const fail = (m) => { throw new Error(`Formule invalide (position ${i + 1}) : ${m}`); };
  const peek = () => { ws(); return s[i]; };
  function expr() {
    let a = term();
    for (;;) { const c = peek(); if (c === '+' || c === '-') { i++; a = B(c, a, term()); } else return a; }
  }
  function term() {
    let a = unary();
    for (;;) { const c = peek(); if (c === '*' || c === '/') { i++; a = B(c, a, unary()); } else return a; }
  }
  function unary() {
    const c = peek();
    if (c === '-') { i++; const a = unary(); return a.t === 'c' ? C(-a.v) : B('*', C(-1), a); }
    if (c === '+') { i++; return unary(); }
    return power();
  }
  function power() {
    const a = atom();
    if (peek() === '^') { i++; return B('^', a, unary()); }
    return a;
  }
  function atom() {
    const c = peek();
    if (c === undefined) fail('fin inattendue');
    if (c === '(') { i++; const a = expr(); if (peek() !== ')') fail('")" attendue'); i++; return a; }
    const num = /^(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?/.exec(s.slice(i));
    if (num) { i += num[0].length; return C(parseFloat(num[0])); }
    const id = /^[A-Za-z_À-ɏͰ-Ͽ][A-Za-z_0-9À-ɏͰ-Ͽ]*/.exec(s.slice(i));
    if (!id) fail(`caractère inattendu « ${c} »`);
    i += id[0].length;
    const name = id[0];
    if (peek() === '(' && (UNARY.includes(name) || name === 'ln' || name === 'abs' || name === 'tan' || name === 'tanh')) {
      i++; const a = expr(); if (peek() !== ')') fail('")" attendue'); i++;
      if (name === 'ln') return U('log', a);
      if (name === 'tan') return B('/', U('sin', a), U('cos', clone(a)));
      if (name === 'tanh') { // (e^{2a} - 1)/(e^{2a} + 1)
        const e2 = () => U('exp', B('*', C(2), clone(a)));
        return B('/', B('-', e2(), C(1)), B('+', e2(), C(1)));
      }
      if (name === 'abs') return B('^', B('^', a, C(2)), C(0.5));
      return U(name, a);
    }
    if (name === 'pi') return C(Math.PI);
    if (name === 'e' && !(names || []).includes('e')) return C(Math.E);
    const idx = (names || []).indexOf(name);
    if (idx < 0) fail(`variable inconnue « ${name} »`);
    return V(idx);
  }
  const e = expr();
  if (peek() !== undefined) fail(`caractère inattendu « ${s[i]} »`);
  return e;
}

/** Devine les variables d'une formule (identifiants qui ne sont ni fonctions ni constantes). */
export function freeNames(src) {
  const s = src.replace(/π/g, 'pi').replace(/√/g, 'sqrt');
  const out = [];
  const re = /[A-Za-z_À-ɏͰ-Ͽ][A-Za-z_0-9À-ɏͰ-Ͽ]*/g;
  let m;
  while ((m = re.exec(s))) {
    const n = m[0];
    if (/^\d/.test(n)) continue;
    const before = s[m.index - 1];
    if (before && /[\d.]/.test(before) && /^[eE]\d*$/.test(n)) continue; // 1e5
    if ([...UNARY, 'ln', 'abs', 'tan', 'tanh', 'pi', 'e'].includes(n)) continue;
    if (!out.includes(n)) out.push(n);
  }
  return out;
}
