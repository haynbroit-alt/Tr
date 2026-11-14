// Bilan de matière, étape 3 bis : estimer la date réelle des mouvements quand la saisie est en retard.
// Les dates observées sont des dates d'enregistrement. Deux indices, sans connaissance de métier :
//   1. lots de fin de période : un type dont presque tous les enregistrements tombent dans les jours qui suivent
//      une fin de mois est produit en fin de mois, puis saisi en retard ; on le date de cette fin de mois ;
//   2. décalage moyen d'un type : sur les stocks relevés chaque mois, on cherche, type par type, le décalage
//      (0 à 10 jours) qui explique le mieux les relevés.
// Les relevés quotidiens des comptes sont exacts : les sources qui les expliquent ne sont jamais décalées.

const MAX_SHIFT = 10;

export function monthEnds(D) {
  const monthOf = (d) => Math.min(11, Math.floor((d * 12) / D));
  return Array.from({ length: 12 }, (_, m) => { let d = D - 1; while (monthOf(d) > m) d--; return d; });
}

export function estimateDates(observed, typeOf, S, links, rules) {
  const D = observed.jours, ends = monthEnds(D);
  const T = (r) => typeOf.get(r.id);
  const day = new Map(observed.journal.map((r) => [r.id, r.jour]));
  const byType = new Map();
  for (const r of observed.journal) { if (S.isBank(r)) continue; const t = T(r); if (!byType.has(t)) byType.set(t, []); byType.get(t).push(r); }
  const prevEnd = (j) => { let e = -1; for (const x of ends) if (x <= j) e = x; return e; };
  // ---- 1. lots de fin de mois ----
  const batch = new Set();
  for (const [t, rs] of byType) {
    if (rs.length < 6) continue;
    const months = new Set(rs.map((r) => prevEnd(r.jour)));
    const near = rs.filter((r) => { const e = prevEnd(r.jour); return e >= 0 && r.jour - e <= MAX_SHIFT + 1; });
    if (months.size >= 6 && near.length >= 0.85 * rs.length) {
      batch.add(t);
      for (const r of near) day.set(r.id, prevEnd(r.jour));
    }
  }
  // ---- 1 bis. intervalles stables entre pièces liées : un mouvement de trésorerie (daté exactement) suit sa pièce d'un délai propre
  // à chaque contrepartie ; le délai est estimé par
  // contrepartie, puis chaque date est ramenée à l'intersection de ce que disent les deux pièces ----
  const byId = new Map(observed.journal.map((r) => [r.id, r]));
  const fixed = new Set();
  const q = (arr, u) => { const s = [...arr].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(u * (s.length - 1)))]; };
  for (const rule of rules) {
    if (!rule.cp && !rule.obj) continue;
    if (batch.has(rule.ta) || batch.has(rule.tb)) continue;
    const pairs = [];
    for (const b of observed.journal) {
      if (T(b) !== rule.tb) continue;
      const as = [...links.get(b.id)].map((x) => byId.get(x)).filter((x) => T(x) === rule.ta);
      if (!as.length) continue;
      const a = as.reduce((m, x) => (x.jour < m.jour ? x : m));
      pairs.push([a, b, rule.cp ? b.contrepartie : b.objet]);
    }
    const byKey = new Map();
    for (const p of pairs) { if (!byKey.has(p[2])) byKey.set(p[2], []); byKey.get(p[2]).push(p); }
    for (const ps of byKey.values()) {
      if (ps.length < 4) continue;
      const L = ps.map(([a, b]) => a.jour - b.jour);
      if (q(L, 0.9) - q(L, 0.1) < 3 || q(L, 0.9) - q(L, 0.1) > 2 * MAX_SHIFT + 2) continue; // pas de retard visible, ou délai instable
      // seulement si l'une des deux pièces est datée exactement (trésorerie) : entre deux pièces saisies à la main,
      // l'écart varie aussi pour des raisons propres à l'opération, qu'on prendrait à tort pour des retards
      const aExact = S.isBank(ps[0][0]);
      if (!aExact) continue;
      const I = aExact ? q(L, 0.9) : (q(L, 0.1) + q(L, 0.9)) / 2;
      for (const [a, b] of ps) {
        if (fixed.has(b.id)) continue;
        const lo = Math.max(b.jour - MAX_SHIFT, a.jour - I - (aExact ? 0 : MAX_SHIFT)), hi = Math.min(b.jour, a.jour - I);
        const mb = lo <= hi ? Math.round((lo + hi) / 2) : Math.round(Math.min(b.jour, Math.max(b.jour - MAX_SHIFT, a.jour - I)));
        day.set(b.id, Math.max(0, mb)); fixed.add(b.id);
        if (!aExact && !fixed.has(a.id)) { day.set(a.id, Math.max(0, Math.min(a.jour, Math.max(a.jour - MAX_SHIFT, Math.round(mb + I))))); fixed.add(a.id); }
      }
    }
  }

  // ---- 2. décalage moyen des types qui portent des quantités sur des stocks relevés chaque mois ----
  const items = S.stocks.filter((s) => s.releveM && s.kind === 'item');
  const shift = new Map();
  if (items.length) {
    const qTypes = [...byType.keys()].filter((t) => !batch.has(t) && S.coef(t) && byType.get(t).some((r) => r.quantite != null) && byType.get(t).filter((r) => fixed.has(r.id)).length < 0.5 * byType.get(t).length);
    const rel = new Map(items.map((s) => [s.objet, s.releveM]));
    const recs = new Map(qTypes.map((t) => [t, byType.get(t).filter((r) => rel.has(r.objet) && r.quantite != null)]));
    const segOf = (days, d) => { for (let i = 0; i < days.length; i++) if (d <= days[i]) return i; return days.length; };
    // erreur absolue des variations des relevés, pour un jeu de décalages ; les autres types restent à leur date
    const others = new Map();
    for (const s of items) { const days = s.releveM.map((x) => x.jour); const o = new Float64Array(days.length + 1); others.set(s.objet, { days, o, y: s.releveM.map((x) => x.valeur) }); }
    for (const r of observed.journal) {
      if (r.objet == null || !others.has(r.objet) || r.quantite == null || qTypes.includes(T(r))) continue;
      const c = S.coef(T(r)); if (!c) continue;
      const e = others.get(r.objet); e.o[segOf(e.days, day.get(r.id))] += c * r.quantite;
    }
    const err = (sh) => {
      let tot = 0;
      for (const [o, e] of others) {
        const x = Float64Array.from(e.o);
        for (const t of qTypes) { const c = S.coef(t), k = sh.get(t) ?? 0; for (const r of recs.get(t)) if (r.objet === o) x[segOf(e.days, Math.max(0, day.get(r.id) - k))] += c * r.quantite; }
        const sc = 1 / (1 + Math.max(...e.y) - Math.min(...e.y));
        for (let i = 1; i < e.days.length; i++) tot += Math.abs(e.y[i] - e.y[i - 1] - x[i]) * sc;
      }
      return tot;
    };
    let best = err(shift);
    for (let round = 0; round < 2; round++) {
      for (const t of qTypes) {
        let bk = shift.get(t) ?? 0;
        for (let k = 0; k <= MAX_SHIFT; k++) { shift.set(t, k); const e = err(shift); if (e < best - 1e-9) { best = e; bk = k; } }
        shift.set(t, bk);
      }
    }
    for (const [t, k] of shift) if (k) for (const r of byType.get(t)) day.set(r.id, Math.max(0, r.jour - k));
    // ---- 3. un stock relevé ne devient jamais négatif : une entrée saisie en retard est arrivée au plus tard le
    // jour où, sans elle, le stock passerait sous zéro (les sorties automatiques sont datées exactement) ----
    for (const st of items) {
      const flows = [];
      for (const r of observed.journal) {
        if (r.objet !== st.objet || r.quantite == null) continue;
        const c = S.coef(T(r)); if (!c) continue;
        flows.push({ r, x: c * r.quantite });
      }
      const ins = flows.filter((f) => f.x > 0 && !S.isBank(f.r)).sort((a, b) => a.r.jour - b.r.jour);
      const isIn = new Set(ins.map((f) => f.r.id));
      const net = new Float64Array(D);
      for (const f of flows) if (!isIn.has(f.r.id)) net[day.get(f.r.id)] += f.x;
      // parcours chronologique : les entrées sont d'abord placées à leur date de saisie ; si le stock devient
      // négatif, l'entrée suivante (saisie au plus 10 jours plus tard) est ramenée à ce jour-là
      const at = new Map(ins.map((f) => [f.r.id, f.r.jour]));
      let level = st.offset;
      for (let d = 0; d < D; d++) {
        level += net[d];
        for (const f of ins) if (at.get(f.r.id) === d) level += f.x;
        while (level < -0.5) {
          const f = ins.find((g) => at.get(g.r.id) > d && g.r.jour - d <= MAX_SHIFT);
          if (!f) break;
          at.set(f.r.id, d); level += f.x; day.set(f.r.id, d);
        }
      }
    }
  }
  return { day, batch, shift };
}

// Censure à droite : un type produit par lots en fin de mois, présent presque chaque mois pour une contrepartie,
// n'a pas de lot à la dernière fin de mois parce que sa saisie tombe après la fin des données. Ce lot est estimé
// (moyenne des trois derniers) pour le seul calcul des stocks et du profit ; il n'apparaît pas dans la sortie.
export function imputeCensored(observed, typeOf, batch, day) {
  const D = observed.jours, ends = monthEnds(D), last = ends[11];
  const groups = new Map();
  for (const r of observed.journal) {
    const t = typeOf.get(r.id);
    if (!batch.has(t)) continue;
    const k = t + '\u0000' + (r.contrepartie ?? '') + '\u0000' + (r.objet ?? '');
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(r);
  }
  const out = [];
  for (const rs of groups.values()) {
    const byEnd = new Map();
    for (const r of rs) { const e = day.get(r.id); if (!byEnd.has(e)) byEnd.set(e, []); byEnd.get(e).push(r); }
    if (byEnd.has(last)) continue;
    const prev = ends.slice(0, 11).filter((e) => byEnd.has(e));
    if (prev.length < 8 || !byEnd.has(ends[10])) continue;
    const recent = prev.slice(-3).map((e) => byEnd.get(e));
    const avg = (f) => { const v = recent.map((g) => g.reduce((s, r) => s + (r[f] ?? 0), 0)); return v.some((x, i) => recent[i].some((r) => r[f] != null)) ? v.reduce((a, b) => a + b, 0) / v.length : null; };
    const r0 = rs[0];
    out.push({ ...r0, id: `~estime:${out.length}`, modele: r0.id, jour: last, montant: avg('montant'), quantite: avg('quantite'), reference: null, estime: true });
  }
  return out;
}
