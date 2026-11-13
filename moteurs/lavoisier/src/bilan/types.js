// Bilan de matière, étape 1 : regrouper les enregistrements en types de flux.
// Aucune connaissance de métier : la forme d'un enregistrement (source, champs présents, signe) donne une première
// partition ; le vocabulaire des libellés la raffine. Les mots présents partout (vocabulaire commun) sont écartés ;
// les autres sont regroupés quand ils apparaissent ensemble, et chaque enregistrement suit ses mots.

const isNum = (w) => /^\d+$/.test(w);
export const shapeKey = (r) => [r.source, Math.sign(r.montant ?? 0), Math.sign(r.quantite ?? 0), r.montant != null, r.quantite != null, r.objet != null, r.contrepartie != null].join('|');

export function inferTypes(journal) {
  const groups = new Map();
  for (const r of journal) { const k = shapeKey(r); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(r); }
  const words = (r) => [...new Set(r.libelle.split(' ').filter((w) => !isNum(w)))];
  // vocabulaire commun : mots fréquents (≥ 4 %) dans au moins 60 % (et au moins 3) des groupes d’au moins 20 enregistrements
  const big = [...groups.values()].filter((g) => g.length >= 20);
  const spread = new Map();
  for (const g of big) {
    const c = new Map();
    for (const r of g) for (const w of words(r)) c.set(w, (c.get(w) ?? 0) + 1);
    for (const [w, n] of c) if (n >= 0.04 * g.length) spread.set(w, (spread.get(w) ?? 0) + 1);
  }
  const common = new Set([...spread].filter(([, n]) => big.length >= 3 && n >= Math.max(3, 0.6 * big.length)).map(([w]) => w));
  const type = new Map();
  const ambiguous = new Set();
  for (const [k, g] of groups) {
    const cnt = new Map(), co = new Map();
    const ws = g.map((r) => words(r).filter((w) => !common.has(w)));
    for (const s of ws) for (const w of s) cnt.set(w, (cnt.get(w) ?? 0) + 1);
    const core = new Set([...cnt].filter(([, n]) => n >= Math.max(3, 0.002 * g.length)).map(([w]) => w));
    for (const s of ws) {
      const c = s.filter((w) => core.has(w));
      for (let i = 0; i < c.length; i++) for (let j = i + 1; j < c.length; j++) { const key = c[i] < c[j] ? c[i] + ' ' + c[j] : c[j] + ' ' + c[i]; co.set(key, (co.get(key) ?? 0) + 1); }
    }
    // composantes connexes des mots qui apparaissent ensemble assez souvent
    const parent = new Map([...core].map((w) => [w, w]));
    const find = (w) => { while (parent.get(w) !== w) { parent.set(w, parent.get(parent.get(w))); w = parent.get(w); } return w; };
    // deux mots du même type apparaissent ensemble bien plus souvent que le hasard (« lift » ≥ 3), ou assez souvent dans l’absolu (groupe dominé par un seul type)
    for (const [key, n] of co) {
      const [a, b] = key.split(' ');
      if (n >= 2 && (n >= (3 * cnt.get(a) * cnt.get(b)) / g.length || n >= 0.04 * Math.max(cnt.get(a), cnt.get(b)))) parent.set(find(a), find(b));
    }
    // les enregistrements d'une même contrepartie partagent en général leur type : les mots
    // récurrents d'une contrepartie sont regroupés (un mot de bruit n'y apparaît qu'une fois)
    for (const field of ['contrepartie']) {
      const byKey = new Map();
      g.forEach((r, i) => { const v = r[field]; if (v == null) return; if (!byKey.has(v)) byKey.set(v, []); byKey.get(v).push(i); });
      for (const idx of byKey.values()) {
        if (idx.length < 3 || byKey.size > 0.5 * g.length) continue;
        const c = new Map();
        for (const i of idx) for (const w of ws[i]) if (core.has(w)) c.set(w, (c.get(w) ?? 0) + 1);
        const rec = [...c].filter(([, n]) => n >= Math.max(2, 0.2 * idx.length)).map(([w]) => w);
        for (let i = 1; i < rec.length; i++) parent.set(find(rec[i]), find(rec[0]));
      }
    }
    g.forEach((r, i) => {
      const votes = new Map();
      for (const w of ws[i]) if (core.has(w)) { const c = find(w); votes.set(c, (votes.get(c) ?? 0) + 1 + cnt.get(w) / (1e3 * g.length)); }
      const sorted = [...votes].sort((a, b) => b[1] - a[1]), best = sorted[0];
      type.set(r.id, best ? `${k}#${best[0]}` : `${k}#?`);
      // autant de mots d'un groupe que d'un autre : type incertain (départagé vers le groupe le plus fréquent)
      if (sorted.length > 1 && Math.floor(sorted[0][1]) === Math.floor(sorted[1][1])) ambiguous.add(r.id);
    });
  }
  type.ambiguous = ambiguous;
  return type;
}

// Raffinement par les liens : deux enregistrements de même forme et de même vocabulaire apparent qui soldent des
// pièces venues de systèmes différents (sources différentes) ne sont pas le même flux. Un type est scindé selon la
// source des pièces auxquelles ses enregistrements sont liés ; les enregistrements sans lien rejoignent le plus
// grand sous-groupe.
export function refineByLinks(journal, typeOf, links) {
  const byId = new Map(journal.map((r) => [r.id, r]));
  const groups = new Map();
  for (const r of journal) { const t = typeOf.get(r.id); if (!groups.has(t)) groups.set(t, []); groups.get(t).push(r); }
  const out = new Map(typeOf);
  for (const [t, rs] of groups) {
    const key = new Map();
    for (const r of rs) {
      const c = new Map();
      for (const x of links.get(r.id)) { const o = byId.get(x); if (o.source !== r.source) c.set(o.source, (c.get(o.source) ?? 0) + 1); }
      const best = [...c].sort((a, b) => b[1] - a[1])[0];
      key.set(r.id, best ? best[0] : null);
    }
    const sizes = new Map();
    for (const k of key.values()) if (k) sizes.set(k, (sizes.get(k) ?? 0) + 1);
    const big = [...sizes].filter(([, n]) => n >= Math.max(3, 0.05 * rs.length)).sort((a, b) => b[1] - a[1]);
    if (big.length < 2) continue;
    const keep = new Set(big.map(([k]) => k));
    for (const r of rs) { const k = key.get(r.id); out.set(r.id, `${t}@${keep.has(k) ? k : big[0][0]}`); }
  }
  return out;
}
