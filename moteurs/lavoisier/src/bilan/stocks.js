// Bilan de matière, étape 3 : reconstruire les stocks et la matrice d'incidence par conservation.
// Trois sources d'évidence, sans connaissance de métier :
//   1. un relevé quotidien dont les variations égalent la somme des montants d'une source : c'est un compte de
//      trésorerie, et cette source en enregistre tous les mouvements ;
//   2. un relevé mensuel : ses variations sont expliquées par une combinaison des quantités enregistrées, dont les
//      coefficients (+1, −1 ou 0 par type) donnent l'incidence ;
//   3. les liens : un type sans relevé dont les montants sont soldés par des mouvements de trésorerie crée un
//      stock « en cours » (ce que l'entreprise doit, ou ce qu'on lui doit), augmenté par l'un et diminué par l'autre.
// Unités déclarées : celles de unites.js (monnaie, objet relevé, décompte d'éléments ±1, quantité en cours).
import { UNITS } from './unites.js';

const monthOf = (d, D) => Math.min(11, Math.floor((d * 12) / D));

function solve(A, b) { // moindres carrés par équations normales (petite dimension), avec un léger ridge
  const n = A[0]?.length ?? 0;
  const M = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => A.reduce((s, r) => s + r[i] * r[j], 0) + (i === j ? 1e-6 : 0)));
  const v = Array.from({ length: n }, (_, i) => A.reduce((s, r, k) => s + r[i] * b[k], 0));
  for (let c = 0; c < n; c++) {
    let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    [M[c], M[p]] = [M[p], M[c]]; [v[c], v[p]] = [v[p], v[c]];
    for (let r = 0; r < n; r++) { if (r === c || !M[c][c]) continue; const f = M[r][c] / M[c][c]; for (let k = c; k < n; k++) M[r][k] -= f * M[c][k]; v[r] -= f * v[c]; }
  }
  return v.map((x, i) => (M[i][i] ? x / M[i][i] : 0));
}

export function inferStocks(observed, typeOf, links, dup, rules = []) {
  const { journal, releves } = observed;
  const D = observed.jours;
  const T = (r) => typeOf.get(r.id);
  const byId = new Map(journal.map((r) => [r.id, r]));
  const deltas = new Map(journal.map((r) => [r.id, []]));
  const stocks = [];
  const add = (st) => { st.daily = new Float64Array(D); stocks.push(st); return st; };
  const put = (r, st, x) => { if (!x || dup.has(r.id)) return; deltas.get(r.id).push([st.id, x]); st.daily[r.jour] += x; };
  const bySource = new Map();
  for (const r of journal) { if (!bySource.has(r.source)) bySource.set(r.source, []); bySource.get(r.source).push(r); }

  // ---- 1. comptes de trésorerie ----
  const cash = [];
  const bankSources = new Set();
  for (const rl of releves) {
    if (rl.valeurs.length !== D) continue;
    const v = rl.valeurs.map((x) => x.valeur);
    let best = null, bestErr = Infinity;
    for (const [src, rs] of bySource) {
      if (bankSources.has(src)) continue;
      const S = new Float64Array(D);
      for (const r of rs) if (r.montant != null) S[r.jour] += r.montant;
      let bad = 0;
      for (let d = 1; d < D; d++) if (Math.abs(v[d] - v[d - 1] - S[d]) > 0.02) bad++;
      if (bad < bestErr) { bestErr = bad; best = { src, S }; }
    }
    if (!best || bestErr > 0.5 * D) continue;
    bankSources.add(best.src);
    // un relevé bancaire ne contient pas de doublon : deux mouvements identiques sont deux mouvements
    for (const r of bySource.get(best.src)) dup.delete(r.id);
    const st = add({ id: `tresorerie:${rl.cle}`, unit: UNITS.money, na: 1, releve: v, kind: 'cash' });
    for (const r of bySource.get(best.src)) put(r, st, r.montant);
    st.init = v[0] - best.S[0];
    cash.push(st);
  }
  const isBank = (r) => bankSources.has(r.source);

  // ---- 2. relevés mensuels : objets inventoriés et décomptes ----
  const qTypes = new Map(); // type → enregistrements avec quantité et objet
  for (const r of journal) if (r.quantite != null && r.objet != null && !dup.has(r.id)) { const t = T(r); if (!qTypes.has(t)) qTypes.set(t, []); qTypes.get(t).push(r); }
  const objets = new Set(journal.filter((r) => r.objet != null).map((r) => r.objet));
  const monthly = releves.filter((rl) => rl.valeurs.length < D && rl.valeurs.length >= 6);
  const segOf = (days) => (d) => { for (let i = 0; i < days.length; i++) if (d <= days[i]) return i; return days.length; };
  // pour un relevé et un ensemble d'objets : variations du relevé ~ Σ_types c_t · quantités du type dans l'intervalle
  const fitReleve = (rl, objSet) => {
    const days = rl.valeurs.map((x) => x.jour), y = rl.valeurs.map((x) => x.valeur), seg = segOf(days);
    const types = [...qTypes.keys()].filter((t) => qTypes.get(t).some((r) => objSet.has(r.objet)));
    if (!types.length) return null;
    const X = Array.from({ length: days.length }, () => new Array(types.length).fill(0));
    types.forEach((t, j) => { for (const r of qTypes.get(t)) if (objSet.has(r.objet)) { const k = seg(r.jour); if (k < days.length) X[k][j] += r.quantite; } });
    const A = [], b = [];
    for (let k = 1; k < days.length; k++) { A.push(X[k]); b.push(y[k] - y[k - 1]); }
    const c = solve(A, b).map((x) => (Math.abs(x) < 0.3 ? 0 : Math.sign(x)));
    const err = A.reduce((s, row, k) => s + Math.abs(row.reduce((u, x, j) => u + x * c[j], 0) - b[k]), 0);
    const scale = b.reduce((s, x) => s + Math.abs(x), 0) + 1;
    return { types, c, err: err / scale };
  };
  const coefByType = new Map(); // type → coefficient le plus souvent retenu
  const countStocks = [];
  const vote = (t, c) => { if (!coefByType.has(t)) coefByType.set(t, new Map()); const m = coefByType.get(t); m.set(c, (m.get(c) ?? 0) + 1); };
  const inventory = [];
  for (const rl of monthly) (objets.has(rl.cle) ? inventory : countStocks).push(rl);
  // une seule régression pour tous les objets inventoriés : les coefficients sont ceux des TYPES, communs à tous les
  // objets, et la mise en commun départage deux types aux quantités presque égales (un ordre et son exécution)
  if (inventory.length) {
    const types = [...qTypes.keys()].filter((t) => qTypes.get(t).some((r) => inventory.some((rl) => rl.cle === r.objet)));
    const A = [], b = [];
    for (const rl of inventory) {
      const days = rl.valeurs.map((x) => x.jour), y = rl.valeurs.map((x) => x.valeur), seg = segOf(days);
      const X = Array.from({ length: days.length }, () => new Array(types.length).fill(0));
      types.forEach((t, j) => { for (const r of qTypes.get(t)) if (r.objet === rl.cle) { const k = seg(r.jour); if (k < days.length) X[k][j] += r.quantite; } });
      const sc = 1 / (1 + Math.max(...y) - Math.min(...y));
      for (let k = 1; k < days.length; k++) { A.push(X[k].map((x) => x * sc)); b.push((y[k] - y[k - 1]) * sc); }
    }
    // recherche exhaustive des coefficients dans {−1, 0, 1} (peu de types), erreur absolue : robuste aux erreurs de saisie
    const err = (c) => A.reduce((s, row, k) => s + Math.abs(row.reduce((u, x, j) => u + x * c[j], 0) - b[k]), 0);
    let best = types.map(() => 0), be = err(best);
    if (types.length <= 8) {
      const total = 3 ** types.length;
      for (let code = 1; code < total; code++) { const c = []; let x = code; for (let j = 0; j < types.length; j++) { c.push((x % 3) - 1); x = Math.floor(x / 3); } const e = err(c); if (e < be) { be = e; best = c; } }
    } else best = solve(A, b).map((x) => (Math.abs(x) < 0.3 ? 0 : Math.sign(x)));
    // un enregistrement qui en reprend un autre avec la même quantité (règle apprise des références) est daté de
    // l'exécution, l'autre de l'intention : tant que l’erreur reste du même ordre (au plus le triple) (les retards de saisie brouillent les dates), le mouvement est porté par le plus tardif
    for (const rule of rules) {
      if (!rule.qq || rule.med <= 0) continue;
      const ja = types.indexOf(rule.ta), jb = types.indexOf(rule.tb);
      if (ja < 0 || jb < 0 || !best[jb] || best[ja]) continue;
      const sa = Math.sign(qTypes.get(rule.ta)[0].quantite), sb = Math.sign(qTypes.get(rule.tb)[0].quantite);
      const alt = [...best]; alt[ja] = best[jb] * sb * sa; alt[jb] = 0;
      if (err(alt) <= 3 * be) best = alt;
    }
    types.forEach((t, j) => vote(t, best[j]));
  }
  const coef = (t) => { const m = coefByType.get(t); return m ? [...m].sort((a, b) => b[1] - a[1])[0][0] : 0; };
  const invStock = new Map();
  for (const rl of inventory) {
    const st = add({ id: `objet:${rl.cle}`, unit: UNITS.item, na: 0, releveM: rl.valeurs, kind: 'item', objet: rl.cle });
    invStock.set(rl.cle, st);
  }
  for (const [t, rs] of qTypes) { const c = coef(t); if (!c) continue; for (const r of rs) { const st = invStock.get(r.objet); if (st) put(r, st, c * r.quantite); } }
  const invById = new Map([...invStock.values()].map((st) => [st.id, st]));
  // décomptes : relevés mensuels qui ne portent pas le nom d'un objet ; on cherche l'objet dont les quantités les expliquent
  const usedObj = new Set(invStock.keys());
  for (const rl of countStocks) {
    let best = null;
    for (const o of objets) {
      if (usedObj.has(o)) continue;
      const f = fitReleve(rl, new Set([o]));
      if (f && f.c.some((x) => x) && (!best || f.err < best.f.err)) best = { o, f };
    }
    if (!best || best.f.err > 0.5) continue;
    usedObj.add(best.o);
    const st = add({ id: `decompte:${rl.cle}`, unit: UNITS.count, na: 0, releveM: rl.valeurs, kind: 'count' });
    best.f.types.forEach((t, j) => { if (best.f.c[j]) for (const r of qTypes.get(t)) if (r.objet === best.o) put(r, st, best.f.c[j] * r.quantite); });
  }

  // ---- 3. stocks « en cours » révélés par les liens ----
  const typeLinks = new Map();
  for (const r of journal) for (const x of links.get(r.id)) { const o = byId.get(x); const k = T(r) + '\u0000' + T(o); typeLinks.set(k, (typeLinks.get(k) ?? 0) + 1); }
  const count = new Map(); for (const r of journal) count.set(T(r), (count.get(T(r)) ?? 0) + 1);
  const connected = (a, b) => { const n = typeLinks.get(a + '\u0000' + b) ?? 0; return n >= 3 && n >= 0.2 * Math.min(count.get(a), count.get(b)); };
  const types = [...count.keys()];
  const sample = new Map(); for (const r of journal) if (!sample.has(T(r))) sample.set(T(r), r);
  const bankT = types.filter((t) => isBank(sample.get(t)));
  const recsOf0 = new Map(); for (const r of journal) { if (!recsOf0.has(T(r))) recsOf0.set(T(r), []); recsOf0.get(T(r)).push(r); }
  const moneyT = types.filter((t) => !isBank(sample.get(t)) && sample.get(t).montant != null);
  // union-find : un type monétaire non bancaire et un type bancaire liés appartiennent au même stock en cours
  const par = new Map(types.map((t) => [t, t]));
  const find = (t) => { while (par.get(t) !== t) t = par.get(t); return t; };
  const members = new Set();
  for (const a of moneyT) for (const b of bankT) if (connected(a, b)) { par.set(find(a), find(b)); members.add(a); members.add(b); }
  // deux types de pièces du même système, soldés dans le même sens, alimentent le même stock en cours
  const inMembers = moneyT.filter((t) => members.has(t));
  const dirOf = (t) => { const o = bankT.filter((b) => connected(t, b)).flatMap((b) => recsOf0.get(b)); return Math.sign(o.reduce((s, r) => s + r.montant, 0)); };
  for (let i = 0; i < inMembers.length; i++) for (let j = i + 1; j < inMembers.length; j++) {
    const a = inMembers[i], b = inMembers[j];
    if (sample.get(a).source === sample.get(b).source && dirOf(a) === dirOf(b)) par.set(find(a), find(b));
  }
  const comps = new Map();
  for (const t of members) { const k = find(t); if (!comps.has(k)) comps.set(k, []); comps.get(k).push(t); }
  const recsOf = new Map(); for (const r of journal) { if (!recsOf.has(T(r))) recsOf.set(T(r), []); recsOf.get(T(r)).push(r); }
  let ci = 0;
  for (const ts of comps.values()) {
    const bankRecs = ts.filter((t) => bankT.includes(t)).flatMap((t) => recsOf.get(t));
    const inflow = bankRecs.reduce((s, r) => s + r.montant, 0) > 0;
    const st = add({ id: `en-cours:${ci++}`, unit: UNITS.money, na: inflow ? 1 : -1, kind: inflow ? 'receivable' : 'payable' });
    for (const t of ts) for (const r of recsOf.get(t)) put(r, st, isBank(r) ? (inflow ? -r.montant : r.montant) : Math.abs(r.montant));
  }
  // quantités en cours : un type à quantité sans montant, agrégé dans un type à quantité et montant, hors stocks relevés
  let hi = 0;
  for (const a of types) {
    const sa = sample.get(a);
    if (sa.quantite == null || sa.montant != null || coef(a)) continue;
    for (const b of types) {
      const sb = sample.get(b);
      if (a === b || sb.quantite == null || sb.montant == null || !connected(a, b)) continue;
      const st = add({ id: `quantite-en-cours:${hi++}`, unit: UNITS.time, na: 0, kind: 'wip' });
      for (const r of recsOf.get(a)) put(r, st, Math.abs(r.quantite));
      for (const r of recsOf.get(b)) put(r, st, -Math.abs(r.quantite));
    }
  }
  // financement : une contrepartie qui verse une somme puis reçoit des remboursements périodiques constants
  const bankByCp = new Map();
  for (const r of journal) if (isBank(r) && r.contrepartie != null) { if (!bankByCp.has(r.contrepartie)) bankByCp.set(r.contrepartie, []); bankByCp.get(r.contrepartie).push(r); }
  for (const [cp, rs] of bankByCp) {
    const ins = rs.filter((r) => r.montant > 0), outs = rs.filter((r) => r.montant < 0);
    if (!ins.length || outs.length < 4 || ins.length > 2) continue;
    const modal = new Map(); for (const r of outs) modal.set(r.montant, (modal.get(r.montant) ?? 0) + 1);
    const [m0, n0] = [...modal].sort((a, b) => b[1] - a[1])[0];
    if (n0 < 4 || n0 < 0.4 * outs.length || Math.abs(m0) * n0 > 1.2 * ins.reduce((s, r) => s + r.montant, 0)) continue;
    const st = add({ id: `financement:${cp}`, unit: UNITS.money, na: -1, kind: 'debt' });
    for (const r of ins) put(r, st, r.montant);
    for (const r of outs) if (r.montant === m0) put(r, st, r.montant);
  }

  // ---- erreurs de saisie de quantité : une pièce qui porte le mouvement et sa pièce liée (même quantité attendue)
  // ne s'accordent pas ; on garde la valeur qui rapproche le stock reconstruit de son relevé ----
  for (const rule of rules) {
    if (!rule.qq) continue;
    for (const r of journal) {
      if (T(r) !== rule.ta && T(r) !== rule.tb) continue;
      const dl = deltas.get(r.id).find(([sid]) => invById.get(sid));
      if (!dl) continue;
      const st = invById.get(dl[0]);
      const other = [...links.get(r.id)].map((x) => byId.get(x)).find((o) => o.quantite != null && (T(o) === rule.ta || T(o) === rule.tb) && T(o) !== T(r));
      if (!other || Math.abs(Math.abs(other.quantite) - Math.abs(r.quantite)) < 1e-9) continue;
      const days = st.releveM.map((x) => x.jour), y = st.releveM.map((x) => x.valeur);
      const k = days.findIndex((d) => r.jour <= d);
      if (k <= 0) continue;
      let flow = 0;
      for (let d = days[k - 1] + 1; d <= days[k]; d++) flow += st.daily[d];
      const resid = y[k] - y[k - 1] - flow;
      const newDelta = Math.sign(dl[1]) * Math.abs(other.quantite), change = newDelta - dl[1];
      if (Math.abs(resid - change) < Math.abs(resid)) { st.daily[r.jour] += change; dl[1] = newDelta; }
    }
  }

  // ---- séries : intégration des Δ, calée sur les relevés quand il y en a ----
  for (const st of stocks) {
    const s = new Float64Array(D);
    let c = 0;
    for (let d = 0; d < D; d++) { c += st.daily[d]; s[d] = c; }
    let off = 0;
    if (st.releve) off = st.init;
    else if (st.releveM) { const diffs = st.releveM.map((x) => x.valeur - s[x.jour]).sort((a, b) => a - b); off = diffs[diffs.length >> 1]; }
    st.offset = off;
    st.raw = Array.from(s);
    st.series = Array.from(s, (x) => x + off);
    if (st.releve) st.series = [...st.releve];
  }

  // ---- coût unitaire des objets : montant des pièces liées aux entrées d'un objet / quantité entrée ----
  const comp = new Map();
  { // composantes connexes des liens
    const p = new Map();
    const f = (x) => { if (!p.has(x)) p.set(x, x); while (p.get(x) !== x) { p.set(x, p.get(p.get(x))); x = p.get(x); } return x; };
    for (const r of journal) for (const x of links.get(r.id)) p.set(f(r.id), f(x));
    for (const r of journal) comp.set(r.id, f(r.id));
  }
  const inQ = new Map(), inM = new Map();
  for (const r of journal) {
    if (dup.has(r.id) || r.objet == null || !invStock.has(r.objet)) continue;
    if (r.quantite != null && coef(T(r)) * r.quantite > 0) inQ.set(comp.get(r.id), [r.objet, Math.abs(r.quantite)]);
  }
  const cost = new Map();
  for (const r of journal) {
    if (dup.has(r.id) || r.montant == null || r.quantite != null || r.objet == null || isBank(r)) continue;
    const q = inQ.get(comp.get(r.id));
    if (!q || q[0] !== r.objet) continue;
    const a = cost.get(r.objet) ?? [0, 0]; a[0] += Math.abs(r.montant); a[1] += q[1]; cost.set(r.objet, a);
  }
  for (const st of stocks) if (st.kind === 'item') { const a = cost.get(st.objet); st.na = a && a[1] ? a[0] / a[1] : 0; }

  // ---- profit mensuel : variation de l'actif net, hors financement ----
  const na = (d) => stocks.reduce((s, st) => s + st.na * (d < 0 ? st.series[0] - st.daily[0] : st.series[d]), 0);
  const ends = Array.from({ length: 12 }, (_, m) => { let d = D - 1; while (monthOf(d, D) > m) d--; return d; });
  const profit = ends.map((d, m) => na(d) - na(m === 0 ? -1 : ends[m - 1]));
  return { stocks, deltas, profit, cash, isBank, coef };
}
