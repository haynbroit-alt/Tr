// Bilan de matière, étape 4 : chercher les flux que personne n'a enregistrés (méthode « Neptune »).
// Un écart de conservation, c'est la différence entre un stock observé et le stock reconstruit à partir des
// enregistrements. Trois lieux où l'observer, sans connaissance de métier :
//   1. un compte relevé chaque jour : la différence est exacte, chaque jour ;
//   2. un stock relevé chaque mois : la différence est bruitée ; on cherche une perte régulière à partir d'une date,
//      qui explique les relevés nettement mieux que « pas de perte » et mieux qu'un simple saut (erreur ponctuelle) ;
//   3. un stock en cours soldé par la trésorerie : pour une contrepartie, les opérations sont soldées à un taux
//      constant inférieur à 1 à partir d'une date (le manque n'est écrit nulle part).

// seuil du rapport de vraisemblance pour les stocks relevés chaque mois, par stock (fixé sur les graines de
// développement uniquement ; voir PROTOCOLE_M0.md, § 9)
export const LR_MONTHLY = 22;

function fitLoss(t, e) {
  // e_k = a − b·max(0, t_k − τ), b > 0 ; τ parcourt les jours ; moindres carrés en (a, b) pour chaque τ
  const n = t.length, mean = e.reduce((s, x) => s + x, 0) / n;
  const rss0 = e.reduce((s, x) => s + (x - mean) ** 2, 0);
  let best = { rss: rss0, b: 0, tau: null, a: mean };
  for (let tau = t[0]; tau < t[n - 2]; tau++) {
    const h = t.map((x) => Math.max(0, x - tau));
    const hm = h.reduce((s, x) => s + x, 0) / n;
    const shh = h.reduce((s, x) => s + (x - hm) ** 2, 0);
    if (shh <= 0) continue;
    const she = h.reduce((s, x, k) => s + (x - hm) * (e[k] - mean), 0);
    const slope = she / shh;
    if (slope >= 0) continue;
    const rss = rss0 - (she * she) / shh;
    if (rss < best.rss) best = { rss, b: -slope, tau, a: mean - slope * hm };
  }
  let step = rss0;
  for (let k = 1; k < n; k++) {
    const m1 = e.slice(0, k).reduce((s, x) => s + x, 0) / k, m2 = e.slice(k).reduce((s, x) => s + x, 0) / (n - k);
    step = Math.min(step, e.reduce((s, x, j) => s + (x - (j < k ? m1 : m2)) ** 2, 0));
  }
  return { ...best, rss0, step, n };
}

export function inferEcarts(observed, S, typeOf, links, dup) {
  const D = observed.jours;
  const ecarts = [];
  // ---- 1. comptes relevés chaque jour ----
  for (const st of S.stocks.filter((x) => x.kind === 'cash')) {
    const r = [];
    for (let d = 1; d < D; d++) { const x = st.releve[d] - st.releve[d - 1] - st.daily[d]; if (Math.abs(x) > 0.02) r.push([d, x]); }
    const neg = r.filter(([, x]) => x < 0);
    if (neg.length < 3 || neg.length < 0.8 * r.length) continue;
    const tau = neg[0][0];
    ecarts.push({ stock: st.id, debut: tau, debit: -neg.reduce((s, [, x]) => s + x, 0) / (D - tau), preuve: `${neg.length} jours où le relevé baisse plus que les enregistrements` });
  }
  // ---- 2. stocks relevés chaque mois ----
  for (const st of S.stocks.filter((x) => x.releveM)) {
    const t = st.releveM.map((x) => x.jour), e = st.releveM.map((x) => x.valeur - (st.series[x.jour] - st.offset));
    const f = fitLoss(t, e);
    if (f.tau == null || f.rss <= 0) continue;
    const lr = f.n * Math.log(f.rss0 / f.rss), lrStep = f.n * Math.log(f.step / f.rss);
    // explication concurrente : des enregistrements au type incertain ont été comptés dans le mauvais sens
    // (e_k = a + β·cumul de leurs Δ) ; si elle explique les relevés au moins aussi bien, rien n'est déclaré
    const amb = new Float64Array(D);
    for (const r of observed.journal) if (typeOf.ambiguous?.has(r.id)) { const dl = S.deltas.get(r.id).find(([s]) => s === st.id); if (dl) amb[r.jour] += dl[1]; }
    for (let d = 1; d < D; d++) amb[d] += amb[d - 1];
    const A = t.map((d) => amb[d]), am = A.reduce((s, x) => s + x, 0) / A.length, em = e.reduce((s, x) => s + x, 0) / e.length;
    const saa = A.reduce((s, x) => s + (x - am) ** 2, 0), sae = A.reduce((s, x, k) => s + (x - am) * (e[k] - em), 0);
    const rssTypage = saa > 0 ? f.rss0 - (sae * sae) / saa : f.rss0;
    if (lr >= LR_MONTHLY && lrStep > 2 && rssTypage > f.rss) ecarts.push({ stock: st.id, debut: f.tau, debit: f.b, preuve: `rapport de vraisemblance ${lr.toFixed(1)}` });
  }
  // ---- 3. stocks en cours soldés à taux constant < 1 ----
  const byId = new Map(observed.journal.map((r) => [r.id, r]));
  const comp = new Map();
  {
    const p = new Map();
    const f = (x) => { if (!p.has(x)) p.set(x, x); while (p.get(x) !== x) { p.set(x, p.get(p.get(x))); x = p.get(x); } return x; };
    for (const r of observed.journal) for (const x of links.get(r.id)) p.set(f(r.id), f(x));
    for (const r of observed.journal) comp.set(r.id, f(r.id));
  }
  for (const st of S.stocks.filter((x) => x.kind === 'receivable')) {
    const groups = new Map();
    for (const r of observed.journal) {
      if (dup.has(r.id)) continue;
      const dl = S.deltas.get(r.id).find(([s]) => s === st.id);
      if (!dl) continue;
      const c = comp.get(r.id);
      if (!groups.has(c)) groups.set(c, { inv: 0, paid: 0, cps: new Set(), day: Infinity, payDay: Infinity });
      const g = groups.get(c);
      if (S.isBank(r)) { g.paid += r.montant; g.payDay = Math.min(g.payDay, r.jour); } else { g.inv += Math.abs(r.montant); g.day = Math.min(g.day, r.jour); if (r.contrepartie) g.cps.add(r.contrepartie); }
    }
    const byCp = new Map();
    for (const g of groups.values()) { if (g.inv <= 0 || g.paid <= 0 || g.cps.size !== 1) continue; const cp = [...g.cps][0]; if (!byCp.has(cp)) byCp.set(cp, []); byCp.get(cp).push(g); }
    for (const gs of byCp.values()) {
      gs.sort((a, b) => a.payDay - b.payDay);
      const ratio = gs.map((g) => g.paid / g.inv);
      // plus longue suite finale de soldes au même taux ρ < 1 (à 0,5 % près)
      let k = gs.length - 1;
      while (k >= 0 && !(ratio[k] > 0.69 && ratio[k] < 0.998)) k--;
      if (k < 0) continue;
      const rho = ratio[k];
      let j = k;
      while (j > 0 && Math.abs(ratio[j - 1] - rho) < 0.005) j--;
      const run = gs.slice(j, k + 1);
      if (run.length < 3) continue;
      const tau = run[0].payDay;
      ecarts.push({ stock: st.id, debut: tau, debit: run.reduce((s, g) => s + g.inv - g.paid, 0) / (D - tau), preuve: `${run.length} opérations soldées à ${(100 * rho).toFixed(1)} %` });
    }
  }
  return ecarts;
}
