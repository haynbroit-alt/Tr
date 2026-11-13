// Moteur de simulation des « entreprises opaques » (protocole M0, § 2).
// Il tient deux comptabilités séparées :
//   - la RÉALITÉ : les stocks réels, modifiés par les mouvements réels (y compris les flux cachés) ;
//   - les ENREGISTREMENTS : ce que les systèmes d'information de l'entreprise en ont noté, avec leur désordre.
// Le système évalué ne verra que les enregistrements (renommés en jetons opaques) et des relevés périodiques.
import { makeRng, derive } from './rng.js';

export const DAYS = 365;
export const MONTHS = 12;
export const monthOf = (d) => Math.min(MONTHS - 1, Math.floor((d * MONTHS) / DAYS));
export const lastDayOfMonth = (m) => { let d = DAYS - 1; while (monthOf(d) > m) d--; return d; };

export const DISORDER = {
  propre: { refMissing: 0.05, refWrong: 0, delayMax: 1, dup: 0, splitGroup: false, qtyError: 0, invError: 0, libelleNoise: 0 },
  realiste: { refMissing: 0.35, refWrong: 0.03, delayMax: 10, dup: 0.01, splitGroup: true, qtyError: 0.005, invError: 0.01, libelleNoise: 0.15 },
};

const CONS = 'bcdfghjklmnpqrstvwxz', VOW = 'aeiou';

export class Engine {
  constructor(seed, level = 'realiste') {
    this.seed = seed;
    this.level = level;
    this.dis = DISORDER[level];
    this.rng = makeRng(derive(seed, 1)); // réalité économique
    this.drng = makeRng(derive(seed, 2)); // désordre des enregistrements
    this.trng = makeRng(derive(seed, 3)); // jetons opaques
    this.used = new Set();
    this.stocks = new Map();
    this.records = [];
    this.txCount = 0;
    this.srcTok = {};
    this.types = {};
    this.parties = {}; // jeton → nature (vérité)
    this.shared = Array.from({ length: 6 }, () => this.tok());
    this.humans = Array.from({ length: this.trng.int(1, 4) }, () => this.tok());
    this.robots = {};
    this.releves = [];
    this.hidden = [];
    this.ca = new Float64Array(MONTHS);
    this.agenda = new Map();
    this.daily = [];
    this.day = 0;
    this.statut = {};
  }

  // ---------- jetons opaques ----------
  tok() {
    for (;;) {
      const r = this.trng;
      let s = '';
      const n = r.int(2, 3);
      for (let i = 0; i < n; i++) s += CONS[r.int(0, CONS.length - 1)] + VOW[r.int(0, VOW.length - 1)];
      s += r.int(0, 9);
      if (!this.used.has(s)) { this.used.add(s); return s; }
    }
  }
  source(name) { return (this.srcTok[name] ??= this.tok()); }
  robot(name) { return (this.robots[name] ??= this.tok()); }
  party(kind) { const t = this.tok(); this.parties[t] = kind; return t; }

  // ---------- réalité ----------
  // na : coefficient dans l'actif net (1 actif, −1 passif, coût unitaire pour un objet, 0 hors actif net)
  addStock(id, unit, init = 0, na = 0, extra = {}) {
    this.stocks.set(id, { id, unit, value: init, init, na, series: new Float64Array(DAYS), gross: 0, ...extra });
    return id;
  }
  value(id) { return this.stocks.get(id).value; }
  move(id, delta) { const s = this.stocks.get(id); s.value += delta; s.gross += Math.abs(delta); }
  netAssets() { let v = 0; for (const s of this.stocks.values()) v += s.na * s.value; return v; }

  // ---------- types de flux (vérité) ----------
  type(name, { bank = false, auteur = 'humain', statut = 'flux' } = {}) {
    if (!this.types[name]) {
      const r = this.trng;
      this.types[name] = {
        name, bank, auteur,
        signM: bank ? 1 : r.chance(0.5) ? 1 : -1,
        signQ: r.chance(0.5) ? 1 : -1,
        vocab: Array.from({ length: r.int(3, 5) }, () => this.tok()),
      };
      this.statut[name] = statut;
    }
    return this.types[name];
  }
  newTx() { return ++this.txCount; }

  // Enregistre un événement et applique le mouvement réel correspondant.
  //   d : [[stock, coef, 'm'|'q'], …] — ce que l'enregistrement implique (Δstock = coef × valeur du champ)
  //   real : mouvement réel différent de celui qu'indique l'enregistrement (remise non saisie…), [[stock, Δ], …]
  record(typeName, src, f, typeOpts) {
    const ty = this.type(typeName, typeOpts);
    const day = f.day ?? this.day;
    let q = f.q ?? null;
    const m = f.m == null ? null : Math.round(f.m * 100) / 100;
    let qRec = q;
    if (q != null && this.dis.qtyError && this.drng.chance(this.dis.qtyError)) qRec = this.drng.chance(0.3) ? q * 10 : Math.max(0, q + (this.drng.chance(0.5) ? 1 : -1));
    const val = (field, recorded) => (field === 'm' ? m : recorded ? qRec : q);
    const d = f.d ?? [];
    const deltas = d.map(([st, c, field]) => [st, c * val(field, true)]);
    const real = f.real ?? d.map(([st, c, field]) => [st, c * val(field, false)]);
    for (const [st, x] of real) this.move(st, x);
    const rec = {
      realDay: day, src: this.source(src), type: typeName, tx: f.tx ?? [],
      montant: m == null ? null : ty.signM * m, quantite: qRec == null ? null : ty.signQ * qRec,
      objet: f.objet ?? null, contrepartie: f.cp ?? null,
      auteur: ty.auteur === 'humain' ? this.drng.pick(this.humans) : this.robot(src),
      ref: f.ref ?? null, deltas, bank: ty.bank, human: ty.auteur === 'humain', dup: false,
    };
    this.records.push(rec);
    return rec;
  }

  at(day, fn) { if (day < DAYS) { if (!this.agenda.has(day)) this.agenda.set(day, []); this.agenda.get(day).push(fn); } }
  every(fn) { this.daily.push(fn); }

  // ---------- relevés ----------
  releve(stock, freq, noise = 0, cle = this.tok()) { this.releves.push({ cle, stock, freq, noise, valeurs: [] }); return cle; }

  // ---------- paiements (avec regroupements et fractionnements du désordre réaliste) ----------
  // kind 'out' : l'entreprise paie (dette → trésorerie) ; 'in' : elle encaisse (créance → trésorerie)
  pay(dueDay, item) { this.at(dueDay, () => { (this._due ??= []).push(item); }); }
  _settle() {
    const due = this._due ?? [];
    this._due = [];
    const groups = new Map();
    for (const it of due) { const k = `${it.kind}|${it.cp}|${it.type}`; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(it); }
    for (const items of groups.values()) {
      const batches = this.dis.splitGroup && items.length > 1 && this.drng.chance(0.5) ? [items] : items.map((x) => [x]);
      for (const b of batches) {
        const amount = b.reduce((s, x) => s + x.amount, 0);
        const tx = b.flatMap((x) => x.tx);
        if (this.dis.splitGroup && b.length === 1 && this.drng.chance(0.1)) {
          const a1 = Math.round(amount * 0.6 * 100) / 100;
          this._payRecord(b, a1, tx);
          const rest = { ...b[0], amount: amount - a1, tx };
          this.at(this.day + 7, () => this._payRecord([rest], rest.amount, tx));
        } else this._payRecord(b, amount, tx);
      }
    }
  }
  _payRecord(items, amount, tx) {
    const it = items[0], T = it.account, sgn = it.kind === 'in' ? 1 : -1;
    const hook = it.kind === 'in' && this.onReceive ? this.onReceive(it, amount) : null;
    const recorded = hook ? hook.recorded : amount;
    this.record(it.type, it.bankSrc, {
      m: sgn * recorded, cp: it.cp, tx, ref: it.ref,
      // montant signé du point de vue de la trésorerie : entrée > 0, sortie < 0 ; la créance (ou la dette) baisse d'autant
      d: [[T, 1, 'm'], [it.counter, it.kind === 'in' ? -1 : 1, 'm']],
      real: hook ? [[T, recorded], [it.counter, -amount]] : undefined,
    }, { bank: true, auteur: 'auto' });
  }

  // ---------- boucle ----------
  run() {
    const naHist = [];
    const na0 = this.netAssets();
    for (let d = 0; d < DAYS; d++) {
      this.day = d;
      for (const fn of this.agenda.get(d) ?? []) fn(d);
      for (const fn of this.daily) fn(d);
      this._settle();
      for (const h of this.hidden) if (d >= h.debut) h.total += h.apply(d) ?? 0;
      for (const s of this.stocks.values()) s.series[d] = s.value;
      const m = monthOf(d), end = d === DAYS - 1 || monthOf(d + 1) !== m;
      for (const rl of this.releves) {
        if (rl.freq === 'daily' || end) {
          const v = this.value(rl.stock);
          const noisy = rl.noise ? Math.max(0, Math.round(v * (1 + rl.noise * this.drng.normal()))) : Math.round(v * 100) / 100;
          rl.valeurs.push({ jour: d, valeur: noisy });
        }
      }
      naHist.push(this.netAssets());
    }
    this.profit = Array.from({ length: MONTHS }, (_, m) => naHist[lastDayOfMonth(m)] - (m === 0 ? na0 : naHist[lastDayOfMonth(m - 1)]));
  }

  // ---------- assemblage des données observées et de la vérité ----------
  finalize() {
    const dis = this.dis, r = this.drng;
    const recs = [];
    for (const rec of this.records) {
      // seuls les enregistrements saisis par une personne arrivent en retard ; les systèmes automatiques horodatent
      rec.jour = rec.human ? rec.realDay + r.int(0, dis.delayMax) : rec.realDay;
      recs.push(rec);
      if (!rec.bank && dis.dup && r.chance(dis.dup)) recs.push({ ...rec, jour: rec.jour + r.int(0, 1), dup: true });
    }
    const kept = recs.filter((x) => x.jour < DAYS);
    const dropped = recs.length - kept.length;
    // identifiants aléatoires : l'ordre de création ne doit pas trahir les appariements
    const ids = new Set();
    for (const x of kept) { let id; do { id = 'r' + Math.floor(r.next() * 2 ** 40).toString(36); } while (ids.has(id)); ids.add(id); x.id = id; }
    r.shuffle(kept);
    kept.sort((a, b) => a.jour - b.jour);
    const bySrc = {};
    for (const x of kept) (bySrc[x.src] ??= []).push(x.id);
    const allTypes = Object.values(this.types);
    const journal = kept.map((x) => {
      const ty = this.types[x.type];
      let reference = x.ref && x.ref.id && x.ref.jour < DAYS ? x.ref.id : null;
      if (reference && r.chance(dis.refMissing)) reference = null;
      if (reference && dis.refWrong && r.chance(dis.refWrong)) reference = r.pick(bySrc[x.src]);
      const words = [r.pick(ty.vocab)];
      if (r.chance(0.5)) words.push(r.pick(ty.vocab));
      if (r.chance(0.5)) words.push(r.pick(this.shared));
      if (dis.libelleNoise && r.chance(dis.libelleNoise)) words.push(r.pick(r.pick(allTypes).vocab));
      if (r.chance(0.3)) words.push(String(r.int(1000, 9999)));
      return { id: x.id, jour: x.jour, source: x.src, libelle: words.join(' '), montant: x.montant, quantite: x.quantite, objet: x.objet, contrepartie: x.contrepartie, auteur: x.auteur, reference };
    });
    const observed = { jours: DAYS, journal, releves: this.releves.map((rl) => ({ cle: rl.cle, valeurs: rl.valeurs })) };
    const truth = {
      seed: this.seed, level: this.level,
      records: Object.fromEntries(kept.map((x) => [x.id, { type: x.type, tx: x.tx, deltas: x.deltas, realDay: x.realDay, dup: x.dup }])),
      stocks: [...this.stocks.values()].filter((s) => s.gross > 0 || s.init !== 0).map((s) => ({ id: s.id, unit: s.unit, init: s.init, na: s.na, series: Array.from(s.series) })),
      releves: this.releves.map((rl) => ({ cle: rl.cle, stock: rl.stock, freq: rl.freq, noise: rl.noise })),
      profitMensuel: this.profit, caMensuel: Array.from(this.ca),
      hidden: this.hidden.map((h) => ({ kind: h.kind, stock: h.stock, debut: h.debut, total: h.total, debit: h.total / (DAYS - h.debut), above: h.total > h.threshold, threshold: h.threshold })),
      statut: this.statut, sources: { ...this.srcTok }, parties: { ...this.parties }, dropped,
    };
    return { observed, truth };
  }
}
