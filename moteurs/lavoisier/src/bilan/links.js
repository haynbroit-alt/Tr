// Bilan de matière, étape 2 : apparier les enregistrements qui décrivent la même opération.
// Le champ « reference » sert d'indice, jamais de vérité : il apprend QUELS types se répondent, avec quel délai et
// quelle relation de valeur (même montant, même quantité, même contrepartie, même objet). Ces règles apprises
// servent ensuite à retrouver les liens manquants, et à rejeter les références incohérentes.
// Trois formes de conservation sans référence sont aussi cherchées : agrégation d'un jour (un montant égal à la
// somme des montants d'un autre type la veille), agrégation par objet (une quantité égale à la somme des quantités
// d'un autre type depuis la fois précédente), et enregistrements datés du même jour pour la même contrepartie.

const EPS = 0.011;
const absM = (r) => (r.montant == null ? null : Math.abs(r.montant));
const absQ = (r) => (r.quantite == null ? null : Math.abs(r.quantite));
const near = (a, b, tol = EPS) => a != null && b != null && Math.abs(a - b) <= tol;

export function inferLinks(journal, typeOf) {
  const byId = new Map(journal.map((r) => [r.id, r]));
  const T = (r) => typeOf.get(r.id);
  const links = new Map(journal.map((r) => [r.id, new Set()]));
  const link = (a, b) => { if (a !== b) { links.get(a).add(b); links.get(b).add(a); } };
  const byType = new Map();
  for (const r of journal) { const t = T(r); if (!byType.has(t)) byType.set(t, []); byType.get(t).push(r); }
  const dup = new Set();

  // ---- doublons : même type, même contrepartie, mêmes valeurs, à un jour près ----
  const seen = new Map();
  for (const r of journal) {
    if (r.contrepartie == null) continue;
    const k = [T(r), r.contrepartie, r.montant, r.quantite, r.objet].join('|');
    const prev = seen.get(k);
    if (prev && r.jour - prev.jour <= 1) { dup.add(r.id); link(r.id, prev.id); continue; }
    seen.set(k, r);
  }

  // ---- règles apprises des références ----
  const pairs = new Map();
  const withRef = new Map();
  for (const r of journal) {
    if (dup.has(r.id)) continue;
    const b = r.reference && byId.get(r.reference);
    if (!b) continue;
    withRef.set(T(r), (withRef.get(T(r)) ?? 0) + 1);
    const k = T(r) + '\u0000' + T(b);
    if (!pairs.has(k)) pairs.set(k, { ta: T(r), tb: T(b), obs: [] });
    pairs.get(k).obs.push([r, b]);
  }
  const rules = [];
  for (const p of pairs.values()) {
    // règle retenue si la paire pèse dans les références du type source, ou si elle couvre une bonne part du type cible
    const nb = (byType.get(p.tb) ?? []).length;
    if (p.obs.length < 3 || (p.obs.length < 0.2 * withRef.get(p.ta) && p.obs.length < 0.3 * nb)) continue;
    const frac = (f) => p.obs.filter(f).length / p.obs.length;
    const lags = p.obs.map(([a, b]) => a.jour - b.jour).sort((x, y) => x - y);
    const q = (u) => lags[Math.min(lags.length - 1, Math.floor(u * lags.length))];
    const rule = {
      ta: p.ta, tb: p.tb, lo: q(0.02) - 2, hi: q(0.98) + 2, med: q(0.5),
      cp: frac(([a, b]) => a.contrepartie != null && a.contrepartie === b.contrepartie) > 0.8,
      obj: frac(([a, b]) => a.objet != null && a.objet === b.objet) > 0.8,
      m: frac(([a, b]) => near(absM(a), absM(b))) > 0.5,
      qq: frac(([a, b]) => near(absQ(a), absQ(b))) > 0.5,
    };
    rules.push(rule);
  }
  const fits = (rule, a, b) => {
    const lag = a.jour - b.jour;
    if (lag < rule.lo || lag > rule.hi) return false;
    if (rule.cp && a.contrepartie !== b.contrepartie) return false;
    if (rule.obj && a.objet !== b.objet) return false;
    return true;
  };
  const ruleOf = new Map(rules.map((x) => [x.ta + '\u0000' + x.tb, x]));
  // références acceptées si elles respectent la règle de leur paire de types
  for (const r of journal) {
    if (dup.has(r.id) || !r.reference) continue;
    const b = byId.get(r.reference);
    const rule = b && ruleOf.get(T(r) + '\u0000' + T(b));
    if (rule && fits(rule, r, b)) link(r.id, b.id);
  }
  const linkedTo = (a, tb) => [...links.get(a.id)].some((x) => T(byId.get(x)) === tb);
  const lowerBound = (arr, day) => { let lo = 0, hi = arr.length; while (lo < hi) { const m = (lo + hi) >> 1; if (arr[m].jour < day) lo = m + 1; else hi = m; } return lo; };
  // candidats de B pour A : même clé (contrepartie ou objet si la règle l'exige), date dans la fenêtre de délai
  const window = (idx, key, a, rule) => { const arr = idx.get(key) ?? []; const out = []; for (let i = lowerBound(arr, a.jour - rule.hi); i < arr.length && arr[i].jour <= a.jour - rule.lo; i++) out.push(arr[i]); return out; };
  for (const rule of rules) {
    const keyOf = (r) => (rule.cp ? r.contrepartie : rule.obj ? r.objet : '*');
    const indexBy = (rs) => { const m = new Map(); for (const r of rs) { const k = keyOf(r); if (!m.has(k)) m.set(k, []); m.get(k).push(r); } for (const v of m.values()) v.sort((x, y) => x.jour - y.jour); return m; };
    const targets = (byType.get(rule.tb) ?? []).filter((b) => !dup.has(b.id));
    const sources = (byType.get(rule.ta) ?? []).filter((a) => !dup.has(a.id));
    const idx = indexBy(targets);
    const usedB = new Map();
    for (const a of sources) for (const x of links.get(a.id)) if (T(byId.get(x)) === rule.tb) usedB.set(x, (usedB.get(x) ?? 0) + 1);
    const pick = (a, test) => {
      let best = null, bd = Infinity;
      for (const b of window(idx, keyOf(a), a, rule)) {
        if (!fits(rule, a, b) || !test(b)) continue;
        const d = Math.abs(a.jour - b.jour - rule.med) + (usedB.get(b.id) ? 1000 : 0);
        if (d < bd) { bd = d; best = b; }
      }
      return best;
    };
    for (const a of sources) {
      if (linkedTo(a, rule.tb)) continue;
      let b = null;
      if (rule.m) b = pick(a, (x) => near(absM(a), absM(x)));
      else if (rule.qq) b = pick(a, (x) => near(absQ(a), absQ(x)));
      else if (rule.cp || rule.obj) b = pick(a, () => true);
      // valeur proche mais inférieure (solde partiel ou réduit) : seulement s'il n'y a qu'un candidat libre
      if (!b && rule.m && rule.cp) {
        const c = window(idx, keyOf(a), a, rule).filter((x) => fits(rule, a, x) && !usedB.get(x.id) && absM(a) >= 0.69 * absM(x) && absM(a) < absM(x));
        if (c.length === 1) b = c[0];
      }
      if (b) { link(a.id, b.id); usedB.set(b.id, (usedB.get(b.id) ?? 0) + 1); }
    }
    // regroupements et fractionnements : le reste d'un côté est égal à une pièce libre de l'autre côté
    if (rule.m && rule.cp) {
      for (const a of sources) {
        const linked = [...links.get(a.id)].map((x) => byId.get(x)).filter((x) => T(x) === rule.tb);
        if (!linked.length) continue;
        const rest = absM(a) - linked.reduce((s, x) => s + absM(x), 0);
        if (rest > EPS) { const b = pick(a, (x) => !usedB.get(x.id) && near(absM(x), rest, 0.02)); if (b) { link(a.id, b.id); usedB.set(b.id, 1); } }
      }
      const srcIdx = indexBy(sources);
      for (const b of targets) {
        const linked = [...links.get(b.id)].map((x) => byId.get(x)).filter((x) => T(x) === rule.ta);
        if (!linked.length) continue;
        const rest = absM(b) - linked.reduce((s, x) => s + absM(x), 0);
        if (rest <= EPS) continue;
        const arr = srcIdx.get(b.contrepartie) ?? [];
        const c = arr.find((a) => !linkedTo(a, rule.tb) && fits(rule, a, b) && near(absM(a), rest, 0.02));
        if (c) link(c.id, b.id);
      }
    }
  }

  // ---- agrégation d'un jour : |m(B)| = Σ |m(A)| des enregistrements de A datés k jours plus tôt ----
  const types = [...byType.keys()];
  const sumByDay = (rs) => { const s = new Map(); for (const r of rs) if (r.montant != null && !dup.has(r.id)) { const e = s.get(r.jour) ?? { m: 0, ids: [] }; e.m += absM(r); e.ids.push(r.id); s.set(r.jour, e); } return s; };
  const daySums = new Map(types.map((t) => [t, sumByDay(byType.get(t))]));
  for (const tb of types) {
    const B = byType.get(tb).filter((r) => r.montant != null && r.contrepartie == null && r.objet == null);
    if (B.length < 5) continue;
    for (const ta of types) {
      if (ta === tb) continue;
      const A = byType.get(ta);
      if (A.length < B.length || A.some((r) => r.contrepartie != null)) continue;
      for (let k = 0; k <= 3; k++) {
        const S = daySums.get(ta);
        const hits = B.filter((b) => near(absM(b), S.get(b.jour - k)?.m, 0.05));
        if (hits.length < 0.5 * B.length) continue;
        for (const b of B) {
          const ids = S.get(b.jour - k)?.ids ?? [];
          for (const id of ids) link(b.id, id);
          // conservation : un surplus exactement égal à une pièce qui a une jumelle (mêmes valeurs, même jour ou
          // la veille) révèle un doublon
          const surplus = (S.get(b.jour - k)?.m ?? 0) - absM(b);
          if (surplus <= EPS) continue;
          const prev = S.get(b.jour - k - 1)?.ids ?? [];
          const twinKey = (r) => [r.montant, r.quantite, r.objet].join('|');
          const keys = new Map();
          for (const id of [...prev, ...ids]) { const r = byId.get(id), kk = twinKey(r); keys.set(kk, (keys.get(kk) ?? 0) + 1); }
          const d = ids.map((id) => byId.get(id)).find((r) => near(absM(r), surplus, 0.02) && keys.get(twinKey(r)) >= 2);
          if (d) dup.add(d.id);
        }
        break;
      }
    }
  }

  // ---- agrégation par objet : |q(B)| = Σ |q(A)| des enregistrements de A de même objet depuis le B précédent ----
  for (const tb of types) {
    const B = byType.get(tb).filter((r) => r.quantite != null && r.objet != null);
    if (B.length < 5) continue;
    for (const ta of types) {
      if (ta === tb) continue;
      const A = byType.get(ta).filter((r) => r.quantite != null && r.objet != null && !dup.has(r.id));
      if (A.length < 2 * B.length) continue;
      const aBy = new Map();
      for (const r of A) { if (!aBy.has(r.objet)) aBy.set(r.objet, []); aBy.get(r.objet).push(r); }
      const windows = [];
      const bBy = new Map();
      for (const r of B) { if (!bBy.has(r.objet)) bBy.set(r.objet, []); bBy.get(r.objet).push(r); }
      for (const [o, bs] of bBy) {
        const as = (aBy.get(o) ?? []).sort((x, y) => x.jour - y.jour);
        let i = 0;
        for (const b of bs.sort((x, y) => x.jour - y.jour)) { const w = []; while (i < as.length && as[i].jour <= b.jour) w.push(as[i++]); windows.push([b, w]); }
      }
      const ok = windows.filter(([b, w]) => w.length && Math.abs(w.reduce((s, a) => s + absQ(a), 0) - absQ(b)) <= 0.1 * absQ(b));
      if (ok.length < 0.3 * windows.length) continue;
      for (const [b, w] of windows) for (const a of w) link(b.id, a.id);
    }
  }

  // ---- même contrepartie, même jour, deux types qui vont toujours ensemble ----
  const byCpDay = new Map();
  for (const r of journal) { if (r.contrepartie == null || dup.has(r.id)) continue; const k = r.contrepartie + '|' + r.jour; if (!byCpDay.has(k)) byCpDay.set(k, []); byCpDay.get(k).push(r); }
  const co = new Map();
  for (const rs of byCpDay.values()) { const ts = [...new Set(rs.map(T))]; for (const a of ts) for (const b of ts) if (a < b) co.set(a + '\u0000' + b, (co.get(a + '\u0000' + b) ?? 0) + 1); }
  for (const [k, n] of co) {
    const [a, b] = k.split('\u0000');
    const na = byType.get(a).length, nb = byType.get(b).length;
    if (n < 3 || n < 0.8 * Math.max(na, nb)) continue;
    for (const rs of byCpDay.values()) { const ra = rs.filter((r) => T(r) === a), rb = rs.filter((r) => T(r) === b); for (const x of ra) for (const y of rb) link(x.id, y.id); }
  }
  return { links, dup, rules };
}
