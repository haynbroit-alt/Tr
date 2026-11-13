// Archétypes de DÉVELOPPEMENT (protocole M0, § 2.4) : négoce, abonnement, service.
// Un archétype n'est qu'une combinaison de primitives génériques. Les archétypes de test (transformation,
// acompte) seront écrits APRÈS le gel du bilan de matière, dans un fichier séparé.
import { DAYS, lastDayOfMonth, MONTHS } from './engine.js';

const round2 = (x) => Math.round(x * 100) / 100;

// ---------- socle : trésorerie, créances, dettes ----------
function base(eng, ctx) {
  const r = eng.rng;
  eng.addStock('T0', '€', round2(r.logUniform(20000, 150000)), 1);
  eng.releve('T0', 'daily', 0, eng.source('banque0'));
  ctx.accounts = ['T0'];
  if (r.chance(0.3)) {
    eng.addStock('T1', '€', round2(r.logUniform(5000, 50000)), 1);
    eng.releve('T1', 'daily', 0, eng.source('banque1'));
    ctx.accounts.push('T1');
  }
  eng.addStock('CR', '€', 0, 1);
  eng.addStock('DE', '€', 0, -1);
  eng.addStock('DS', '€', 0, -1);
  eng.addStock('EM', '€', 0, -1);
  ctx.account = () => (ctx.accounts.length > 1 && r.chance(0.3) ? 'T1' : 'T0');
  ctx.bankOf = (acc) => (acc === 'T1' ? 'banque1' : 'banque0');
  ctx.invoiced = {};
  ctx.clients = [];
  ctx.objets = [];
  ctx.pubEffect = () => 1;
}

function supplierPay(eng, ctx, day, rec, cp, amount, account, type = 'fournisseur.paiement', counter = 'DE') {
  eng.pay(day, { kind: 'out', type, cp, amount, tx: rec.tx, ref: rec, account, counter, bankSrc: ctx.bankOf(account) });
}
function clientPay(eng, ctx, day, rec, cp, amount, account) {
  eng.pay(day, { kind: 'in', type: 'client.encaissement', cp, amount, tx: rec.tx, ref: rec, account, counter: 'CR', bankSrc: ctx.bankOf(account) });
}
function invoiceClient(ctx, cp, day, m) { (ctx.invoiced[cp] ??= []).push([day, m]); }

// ---------- charges fixes ----------
function charges(eng, ctx) {
  const r = eng.rng;
  const n = r.int(2, 6);
  for (let i = 0; i < n; i++) {
    const cp = eng.party('fournisseur de charges'), A = r.logUniform(200, 5000), period = r.chance(0.7) ? 30 : 91;
    const off = r.int(0, Math.min(27, period - 1)), terms = r.int(0, 30), acc = ctx.account();
    eng.every((d) => {
      if (d % period !== off) return;
      const m = round2(A * (1 + 0.05 * r.normal()));
      const rec = eng.record('charge.facture', 'achats', { m, cp, tx: [eng.newTx()], d: [['DE', 1, 'm']] });
      supplierPay(eng, ctx, d + terms, rec, cp, m, acc);
    });
  }
}

// ---------- publicité (levier) ----------
function pub(eng, ctx) {
  const r = eng.rng;
  const cp = eng.party('régie publicitaire'), levels = [0, r.logUniform(300, 1500), r.logUniform(1500, 6000)];
  const gain = r.uniform(0.1, 0.5), scale = levels[2];
  let spend = 0, ad = 0;
  eng.every((d) => {
    if (d === 0 || d % 30 === 0) {
      spend = r.pick(levels);
      if (spend > 0) {
        const m = round2(spend);
        const rec = eng.record('charge.facture', 'achats', { m, cp, tx: [eng.newTx()], d: [['DE', 1, 'm']] });
        supplierPay(eng, ctx, d + 30, rec, cp, m, 'T0');
      }
    }
    ad = 0.9 * ad + 0.1 * (spend / scale);
  });
  ctx.pubEffect = () => 1 + gain * ad;
}

// ---------- paie ----------
function payroll(eng, ctx, n) {
  const r = eng.rng;
  const staff = Array.from({ length: n }, () => ({ cp: eng.party('salarié'), sal: r.logUniform(1800, 4500) }));
  const org = eng.party('organisme social');
  for (let m = 0; m < MONTHS; m++) {
    const d = lastDayOfMonth(m);
    eng.at(d, () => {
      let tot = 0;
      for (const s of staff) {
        const sal = round2(s.sal);
        tot += sal;
        const rec = eng.record('paie.salaire', 'paie', { m: sal, cp: s.cp, tx: [eng.newTx()], d: [['DS', 1, 'm']] });
        supplierPay(eng, ctx, d + 2, rec, s.cp, sal, 'T0', 'paie.virement', 'DS');
      }
      const c = round2(0.42 * tot);
      const rec = eng.record('paie.cotisation', 'paie', { m: c, cp: org, tx: [eng.newTx()], d: [['DS', 1, 'm']] });
      supplierPay(eng, ctx, d + 15, rec, org, c, 'T0', 'paie.cotisation_paiement', 'DS');
    });
  }
  return staff;
}

// ---------- financement ----------
function loan(eng, ctx) {
  const r = eng.rng;
  if (!r.chance(0.5)) return;
  const d0 = r.int(0, 150), L = round2(r.logUniform(20000, 200000)), n = r.int(24, 84), rate = r.uniform(0.02, 0.06);
  const cp = eng.party('prêteur');
  let rem = L;
  eng.at(d0, () => eng.record('financement.emprunt', 'banque0', { m: L, cp, tx: [eng.newTx()], d: [['T0', 1, 'm'], ['EM', 1, 'm']] }, { bank: true, auteur: 'auto' }));
  for (let k = 1; d0 + 30 * k < DAYS; k++) {
    eng.at(d0 + 30 * k, () => {
      const p = round2(L / n), i = round2((rem * rate) / 12);
      rem -= p;
      const tx = eng.newTx();
      eng.record('financement.remboursement', 'banque0', { m: -p, cp, tx: [tx], d: [['T0', 1, 'm'], ['EM', 1, 'm']] }, { bank: true, auteur: 'auto' });
      eng.record('financement.interets', 'banque0', { m: -i, cp, tx: [tx], d: [['T0', 1, 'm']] }, { bank: true, auteur: 'auto' });
    });
  }
}

// ---------- objets stockés : achats, ventes au comptant et sur facture ----------
function products(eng, ctx, { n, phi, nClients, scale = 1 }) {
  const r = eng.rng;
  const dow = [1, 1, 1, 1, 1.2, 1.4, 0.6].map((x) => x * (1 + 0.1 * r.normal()));
  const suppliers = Array.from({ length: r.int(1, 4) }, () => ({ cp: eng.party('fournisseur'), terms: r.int(15, 60), acc: ctx.account() }));
  const objs = Array.from({ length: n }, (_, k) => {
    const c = r.logUniform(2, 200), lam = r.logUniform(0.3, 15) * scale, lead = r.int(2, 10);
    const o = { k, id: `O${k}`, tok: eng.tok(), cost: c, p0: c * r.uniform(1.3, 2.5), lam, e: r.uniform(0.8, 2.5), lead, sup: r.pick(suppliers), onOrder: 0 };
    o.p = o.p0;
    o.s = Math.ceil(lam * lead * 1.5) + 1;
    o.S = o.s + Math.ceil(lam * r.int(15, 40));
    eng.parties[o.tok] = 'objet';
    eng.addStock(o.id, 'qte', r.int(o.s, o.S), c);
    eng.releve(o.id, 'monthly', eng.dis.invError, o.tok);
    return o;
  });
  ctx.objets.push(...objs.map((o) => o.id));
  if (phi > 0 && !eng.stocks.has('CA')) eng.addStock('CA', '€', 0, 1);
  const clients = Array.from({ length: nClients }, () => ({ cp: eng.party('client'), rho: r.uniform(0.05, 0.4), terms: r.int(15, 60), acc: ctx.account() }));
  ctx.clients.push(...clients.map((c) => c.cp));
  const wsum = objs.reduce((s, o) => s + o.lam, 0);
  const pickObj = () => { let u = r.next() * wsum; for (const o of objs) { u -= o.lam; if (u <= 0) return o; } return objs[objs.length - 1]; };
  const sell = (o, want) => Math.min(want, Math.floor(eng.value(o.id)));
  eng.every((d) => {
    const tickets = [];
    let total = 0;
    for (const o of objs) {
      if (r.chance(1 / 60)) {
        o.p *= 1 + r.uniform(-0.12, 0.15);
        eng.record('tarif.changement', 'tarif', { m: o.p, objet: o.tok }, { statut: 'levier' });
      }
      const lamEff = o.lam * dow[d % 7] * (o.p / o.p0) ** -o.e * ctx.pubEffect();
      if (phi > 0) {
        const nt = r.poisson((phi * lamEff) / 2);
        for (let i = 0; i < nt; i++) {
          const q = sell(o, r.int(1, 3));
          if (q <= 0) break;
          const m = round2(q * o.p);
          const rec = eng.record('vente.ticket', 'caisse', { m, q, objet: o.tok, tx: [eng.newTx()], d: [[o.id, -1, 'q'], ['CA', 1, 'm']] }, { auteur: 'auto', statut: 'mesure' });
          eng.ca[Math.min(11, Math.floor((d * 12) / DAYS))] += m;
          tickets.push(...rec.tx);
          total += m;
        }
      }
    }
    if (tickets.length) {
      const tot = round2(total);
      eng.at(d + 1, () => eng.record('caisse.depot', 'banque0', { m: tot, tx: tickets, d: [['T0', 1, 'm'], ['CA', -1, 'm']] }, { bank: true, auteur: 'auto' }));
    }
    for (const c of clients) {
      if (!r.chance(c.rho)) continue;
      const o = pickObj(), q = sell(o, r.int(2, 20));
      if (q <= 0) continue;
      const m = round2(q * o.p);
      const rec = eng.record('vente.facture', 'ventes', { m, q, objet: o.tok, cp: c.cp, tx: [eng.newTx()], d: [[o.id, -1, 'q'], ['CR', 1, 'm']] }, { statut: 'mesure' });
      eng.ca[Math.min(11, Math.floor((d * 12) / DAYS))] += m;
      invoiceClient(ctx, c.cp, d, m);
      clientPay(eng, ctx, d + c.terms, rec, c.cp, m, c.acc);
    }
    for (const o of objs) {
      const v = eng.value(o.id);
      if (v + o.onOrder > o.s) continue;
      const q = Math.ceil(o.S - v - o.onOrder);
      const tx = eng.newTx(), sup = o.sup;
      const cmd = eng.record('achat.commande', 'achats', { q, objet: o.tok, cp: sup.cp, tx: [tx] }, { statut: 'levier' });
      o.onOrder += q;
      eng.at(d + o.lead, (dd) => {
        o.onOrder -= q;
        eng.record('achat.reception', 'stock', { q, objet: o.tok, cp: sup.cp, tx: [tx], ref: cmd, d: [[o.id, 1, 'q']] });
        eng.at(dd + r.int(0, 5), (d3) => {
          const m = round2(q * o.cost);
          const f = eng.record('achat.facture', 'achats', { m, objet: o.tok, cp: sup.cp, tx: [tx], ref: cmd, d: [['DE', 1, 'm']] });
          supplierPay(eng, ctx, d3 + sup.terms, f, sup.cp, m, sup.acc);
        });
      });
    }
  });
}

// ---------- contrats (abonnements) ----------
function subscriptions(eng, ctx, nOffers) {
  const r = eng.rng;
  const offers = Array.from({ length: nOffers }, (_, i) => {
    const o = { id: `CT${i}`, tok: eng.tok(), p0: r.logUniform(8, 60), lam: r.logUniform(0.5, 8), h: r.uniform(0.0007, 0.004), e: r.uniform(0.5, 2) };
    o.p = o.p0;
    eng.parties[o.tok] = 'offre';
    const n0 = r.int(50, 1500);
    eng.addStock(o.id, 'contrats', n0, 0);
    eng.releve(o.id, 'monthly', 0);
    o.n0 = n0;
    return o;
  });
  const acc = ctx.account();
  let contracts = [];
  const add = (o, d) => { const c = { o, cp: eng.party('client'), bill: r.int(0, 27) }; contracts.push(c); return c; };
  for (const o of offers) for (let i = 0; i < o.n0; i++) add(o);
  eng.every((d) => {
    for (const o of offers) {
      if (r.chance(1 / 120)) { o.p *= 1 + r.uniform(-0.1, 0.15); eng.record('tarif.changement', 'tarif', { m: o.p, objet: o.tok }, { statut: 'levier' }); }
      const k = r.poisson(o.lam * (o.p / o.p0) ** -o.e * ctx.pubEffect());
      for (let i = 0; i < k; i++) { const c = add(o, d); eng.record('abo.souscription', 'crm', { q: 1, objet: o.tok, cp: c.cp, tx: [eng.newTx()], d: [[o.id, 1, 'q']] }, { auteur: 'auto', statut: 'mesure' }); }
    }
    const keep = [];
    for (const c of contracts) {
      if (r.chance(c.o.h * (c.o.p / c.o.p0))) { eng.record('abo.resiliation', 'crm', { q: 1, objet: c.o.tok, cp: c.cp, tx: [eng.newTx()], d: [[c.o.id, -1, 'q']] }, { auteur: 'auto', statut: 'mesure' }); continue; }
      keep.push(c);
      if (d % 28 !== c.bill) continue;
      const m = round2(c.o.p);
      const rec = eng.record('abo.facture', 'facturation', { m, objet: c.o.tok, cp: c.cp, tx: [eng.newTx()], d: [['CR', 1, 'm']] }, { auteur: 'auto' });
      eng.ca[Math.min(11, Math.floor((d * 12) / DAYS))] += m;
      clientPay(eng, ctx, d + 2, rec, c.cp, m, acc);
      if (r.chance(0.03)) {
        eng.at(d + 5, () => eng.record('abo.rejet', ctx.bankOf(acc), { m: -m, cp: c.cp, tx: rec.tx, ref: rec, d: [[acc, 1, 'm'], ['CR', -1, 'm']] }, { bank: true, auteur: 'auto' }));
        clientPay(eng, ctx, d + 9, rec, c.cp, m, acc);
      }
    }
    contracts = keep;
  });
}

// ---------- temps de travail facturé ----------
function service(eng, ctx, staff) {
  const r = eng.rng;
  eng.addStock('HE', 'heures', 0, 0);
  const clients = Array.from({ length: r.int(3, 15) }, () => ({ cp: eng.party('client'), mission: eng.tok(), rate: r.logUniform(40, 150), terms: r.int(20, 60), acc: ctx.account(), w: r.next() + 0.2, h: 0, tx: [] }));
  ctx.clients.push(...clients.map((c) => c.cp));
  const closed = new Set(Array.from({ length: 8 }, () => r.int(0, DAYS - 1)));
  const wsum = clients.reduce((s, c) => s + c.w, 0);
  const pick = () => { let u = r.next() * wsum; for (const c of clients) { u -= c.w; if (u <= 0) return c; } return clients[0]; };
  eng.every((d) => {
    if (d % 7 < 5 && !closed.has(d)) {
      for (const s of staff) {
        const H = r.int(6, 8), parts = r.chance(0.7) ? [[pick(), H]] : [[pick(), 4], [pick(), H - 4]];
        for (const [c, h] of parts) {
          const rec = eng.record('heures.releve', 'temps', { q: h, objet: c.mission, cp: s.cp, tx: [eng.newTx()], d: [['HE', 1, 'q']] });
          c.h += h;
          c.tx.push(...rec.tx);
        }
      }
    }
    const m = Math.min(11, Math.floor((d * 12) / DAYS));
    if (d !== lastDayOfMonth(m)) return;
    for (const c of clients) {
      if (!c.h) continue;
      const amt = round2(c.h * c.rate);
      const rec = eng.record('service.facture', 'ventes', { m: amt, q: c.h, objet: c.mission, cp: c.cp, tx: c.tx, d: [['HE', -1, 'q'], ['CR', 1, 'm']] }, { statut: 'mesure' });
      eng.ca[m] += amt;
      invoiceClient(ctx, c.cp, d, amt);
      clientPay(eng, ctx, d + c.terms, rec, c.cp, amt, c.acc);
      c.h = 0;
      c.tx = [];
    }
  });
}

// ---------- les trois archétypes de développement ----------
export const ARCHETYPES = {
  negoce(eng, ctx) {
    const r = eng.rng;
    base(eng, ctx);
    if (r.chance(0.6)) pub(eng, ctx);
    const phi = r.uniform(0.2, 1);
    products(eng, ctx, { n: r.int(5, 30), phi, nClients: phi < 0.9 ? r.int(3, 25) : 0 });
    charges(eng, ctx);
    payroll(eng, ctx, r.int(1, 6));
    loan(eng, ctx);
    ctx.hiddenKinds = ['demarque', 'frais', ...(ctx.clients.length ? ['remise'] : [])];
  },
  abonnement(eng, ctx) {
    const r = eng.rng;
    base(eng, ctx);
    pub(eng, ctx);
    subscriptions(eng, ctx, r.int(1, 3));
    if (r.chance(0.5)) products(eng, ctx, { n: r.int(1, 3), phi: 1, nClients: 0, scale: 0.3 });
    payroll(eng, ctx, r.int(2, 8));
    charges(eng, ctx);
    loan(eng, ctx);
    ctx.hiddenKinds = ['frais', ...(ctx.objets.length ? ['demarque'] : [])];
  },
  service(eng, ctx) {
    const r = eng.rng;
    base(eng, ctx);
    const staff = payroll(eng, ctx, r.int(3, 12));
    service(eng, ctx, staff);
    charges(eng, ctx);
    loan(eng, ctx);
    ctx.hiddenKinds = ['remise', 'frais'];
  },
};
export const DEV_ARCHETYPES = Object.keys(ARCHETYPES);
