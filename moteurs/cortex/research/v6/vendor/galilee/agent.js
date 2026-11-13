// L'agent scientifique : il choisit ses expériences, confronte ses hypothèses aux mesures,
// révise ses croyances et s'arrête quand une loi s'impose.
//
// Boucle : OBSERVER → COMPRENDRE → CONFRONTER → (HYPOTHÈSES) → ANTICIPER → PRIORISER → DÉCIDER
//          → SIMULER → EXÉCUTER | REVUE HUMAINE → MESURER → APPRENDRE → RÉVISER → DREAMING → ↺
import { toString, evalPoint, shapeKey, clone } from './expr.js';
import { rng, makeData, fitConstants } from './fit.js';
import { Search } from './search.js';

export const PHASES = ['OBSERVER', 'COMPRENDRE', 'CONFRONTER', 'HYPOTHÈSES', 'ANTICIPER', 'PRIORISER', 'DÉCIDER',
  'SIMULER', 'EXÉCUTER', 'REVUE HUMAINE', 'MESURER', 'APPRENDRE', 'RÉVISER', 'DREAMING'];

/**
 * Classe les hypothèses du front de Pareto par vraisemblance pénalisée (type BIC, corrigé pour petits échantillons).
 * sigma connu  : score = χ² + pénalité ;  sinon : score = N·ln(MSE) + pénalité.
 * Renvoie les hypothèses triées, avec un poids a posteriori normalisé.
 */
export function rank(front, n, sigma, varY, names) {
  const hs = front.map((m) => {
    const pen = m.cx * Math.log(Math.max(n, 2)) * (n / Math.max(n - m.cx - 1, 1));
    const fitTerm = sigma > 0 ? (n * m.mse) / (sigma * sigma) : n * Math.log(Math.max(m.mse, 1e-12 * varY) / varY);
    return { expr: m.e, cx: m.cx, mse: m.mse, score: fitTerm + pen, chi2red: sigma > 0 ? m.mse / (sigma * sigma) : null };
  });
  hs.sort((a, b) => a.score - b.score);
  if (!hs.length) return hs;
  const s0 = hs[0].score;
  let z = 0;
  for (const h of hs) { h.weight = Math.exp(-(h.score - s0) / 2); z += h.weight; }
  for (const h of hs) { h.weight /= z; h.text = toString(h.expr, names); }
  // deux écritures identiques à l'affichage : on ne garde que la mieux classée
  const seen = new Set();
  return hs.filter((h) => (seen.has(h.text) ? false : seen.add(h.text)));
}

export class Agent {
  /**
   * @param world  monde à explorer (voir worlds.js) ; null en mode « données fournies ».
   * @param o      budget : nombre max d'expériences ; mode : 'actif' | 'aléatoire' ;
   *               effort : mutations explorées par cycle ; autoApprove : accepte seul les extensions de domaine.
   */
  constructor(world, { seed = 1, budget = 80, mode = 'actif', effort = 1500, autoApprove = true, data = null, maxCycles = 40 } = {}) {
    this.world = world;
    this.mode = mode;
    this.budget = budget;
    this.effort = effort;
    this.autoApprove = autoApprove;
    this.maxCycles = maxCycles;
    this.r = rng(seed * 104729 + 7);
    this.names = world ? world.names : data.names;
    this.target = world ? world.target : data.target || 'y';
    this.d = this.names.length;
    this.domain = world ? world.domain.map((b) => [...b]) : null;
    this.X = data ? data.X.map((r) => [...r]) : [];
    this.y = data ? [...data.y] : [];
    this.sigma = 0;
    this.noiseSS = 0; this.noiseDF = 0;
    this.sigmaKnown = false;
    this.search = new Search({ d: this.d, seed: seed * 31 + 5 });
    this.hyps = [];
    this.log = [];
    this.history = [];      // { cycle, n, top, weight }
    this.predictions = [];  // { x, pred, y, z }
    this.cycle = 0;
    this.status = 'prêt';
    this.phase = null;
    this.pending = null;    // proposition en attente de validation humaine
    this.decision = null;
    this.next = null;       // prochaine expérience choisie
    this.extended = false;
    this.holdUntil = 0;
    this.audits = 0;
    this.bilan = null;     // auto-évaluation finale : { verdict, validation, second, runs, notes }
    this.seed = seed;
    this.stable = 0;
    this._gen = this._loop();
  }

  /** Avance d'une phase. Renvoie { phase, status }. */
  step() {
    if (this.status === 'terminé') return { phase: this.phase, status: this.status };
    if (this.status === 'revue' && this.decision === null) return { phase: this.phase, status: this.status };
    const r = this._gen.next();
    if (r.done) this.status = 'terminé';
    return { phase: this.phase, status: this.status };
  }
  /** Exécute jusqu'à la fin (ou jusqu'à une demande de revue humaine). */
  run() { while (this.status !== 'terminé' && !(this.status === 'revue' && this.decision === null)) this.step(); return this.best(); }
  approve(ok) { this.decision = !!ok; }
  best() { return this.hyps[0] || null; }

  _say(phase, msg) { this.phase = phase; this.log.push({ cycle: this.cycle, phase, msg }); }
  _fmtX(x) { return x.map((v, j) => `${this.names[j]}=${Number(v.toPrecision(3))}`).join(', '); }
  _data() { return makeData(this.X, this.y); }
  _varY() { const n = this.y.length; const m = this.y.reduce((a, b) => a + b, 0) / n; return this.y.reduce((a, b) => a + (b - m) ** 2, 0) / n || 1; }
  _rand(dom = this.domain) { return dom.map(([a, b]) => a + this.r() * (b - a)); }
  _measure(x) {
    const y = this.world.measure(x);
    if (isFinite(y)) { this.X.push([...x]); this.y.push(y); }
    return y;
  }
  /** Répète k fois la même expérience en un point neuf et affine l'estimation du bruit. */
  _replicate(k) {
    const x = this._rand();
    const vals = [];
    for (let i = 0; i < k; i++) { const v = this._measure(x); if (isFinite(v)) vals.push(v); }
    if (vals.length >= 2) {
      const m = vals.reduce((a, b) => a + b, 0) / vals.length;
      this.noiseSS += vals.reduce((a, b) => a + (b - m) ** 2, 0); this.noiseDF += vals.length - 1;
    }
    this.sigma = Math.max(this.noiseDF ? Math.sqrt(this.noiseSS / this.noiseDF) : 0, 1e-7 * Math.sqrt(this._varY()));
  }
  _believe() {
    this.search.polish();
    this.hyps = rank(this.search.front(), this.y.length, this.sigmaKnown ? this.sigma : 0, this._varY(), this.names);
  }
  _minDist(x) {
    let best = Infinity;
    for (const p of this.X) {
      let s = 0;
      for (let j = 0; j < this.d; j++) { const w = this.domain[j][1] - this.domain[j][0]; const dd = (x[j] - p[j]) / w; s += dd * dd; }
      if (s < best) best = s;
    }
    return Math.sqrt(best);
  }
  /** Désaccord attendu (en σ²) entre la meilleure hypothèse et ses rivales en un point x. */
  _utility(x) {
    const hs = this.hyps;
    if (hs.length < 2) return 0;
    const top = evalPoint(hs[0].expr, x);
    if (!isFinite(top)) return 0;
    const s1 = hs[1].score;
    let u = 0, z = 0;
    for (let i = 1; i < Math.min(hs.length, 9); i++) {
      const w = Math.exp(-(hs[i].score - s1) / 6);
      const f = evalPoint(hs[i].expr, x);
      if (!isFinite(f)) continue;
      u += w * (f - top) ** 2; z += w;
    }
    return z ? u / z / (this.sigma * this.sigma) : 0;
  }

  /** Test des suites sur les résidus, triés selon chaque variable : z très négatif = écarts systématiques. */
  _runsTest(expr) {
    let worst = 0;
    const res = this.X.map((x, i) => this.y[i] - evalPoint(expr, x));
    for (let j = 0; j < this.d; j++) {
      const order = res.map((_, i) => i).sort((p, q) => this.X[p][j] - this.X[q][j]);
      const sg = order.map((i) => res[i]).filter((v) => v !== 0 && isFinite(v)).map((v) => v > 0);
      const n = sg.length, np = sg.filter(Boolean).length, nm = n - np;
      if (np < 3 || nm < 3) continue;
      let runs = 1;
      for (let i = 1; i < n; i++) if (sg[i] !== sg[i - 1]) runs++;
      const mu = (2 * np * nm) / n + 1, sd = Math.sqrt(((mu - 1) * (mu - 2)) / (n - 1));
      const z = (runs - mu) / sd;
      if (z < worst) worst = z;
    }
    return worst;
  }

  /**
   * Contre-expertise avant de conclure. Trois épreuves que la loi n'a pas pu « apprendre » :
   *  1. second avis : une recherche indépendante, repartie de zéro sur les mêmes mesures ;
   *  2. validation : des expériences neuves, jamais utilisées pour l'ajustement ;
   *  3. résidus : les écarts restants doivent ressembler à du bruit.
   * Renvoie true si la loi résiste.
   */
  *_audit() {
    this.audits++;
    const passive = !this.world;
    const top = this.hyps[0];
    const b = { n: this.audits, law: top.text, notes: [] };
    this.bilan = b;
    const dom = this.domain || this.names.map((_, j) => { const c = this.X.map((r) => r[j]); return [Math.min(...c), Math.max(...c)]; });
    const sig = this.sigmaKnown ? this.sigma : Math.sqrt(top.mse) || 1e-9;

    // ---- 1. second avis
    const s2 = new Search({ d: this.d, seed: this.seed * 977 + 131 * this.audits });
    if (this.sigmaKnown) s2.setNoise(this.sigma);
    s2.setData(this._data());
    for (let c = 0; c < 6; c++) { s2.step(Math.round(this.effort / 2)); this.phase = 'DREAMING'; yield; }
    s2.polish();
    const other = rank(s2.front(), this.y.length, this.sigmaKnown ? this.sigma : 0, this._varY(), this.names)[0];
    let dIn = 0, xIn = null, dOut = 0;
    for (let k = 0; k < 600; k++) {
      const x = this._rand(dom);
      const f1 = evalPoint(top.expr, x), f2 = evalPoint(other.expr, x);
      if (!isFinite(f1)) continue;
      const dd = isFinite(f2) ? Math.abs(f1 - f2) / sig : 99;
      if (dd > dIn) { dIn = dd; xIn = x; }
    }
    const ext = this.world ? Math.min(this.world.extend, 1.5) : 1.5;
    if (ext > 1) {
      const wide = dom.map(([lo, hi]) => [lo, lo + (hi - lo) * ext]);
      for (let k = 0; k < 600; k++) {
        const x = this._rand(wide);
        if (x.every((v, j) => v <= dom[j][1])) continue;
        const f1 = evalPoint(top.expr, x), f2 = evalPoint(other.expr, x);
        if (!isFinite(f1) || !isFinite(f2)) { dOut = Math.max(dOut, 1); continue; }
        const rel = Math.abs(f1 - f2) / (0.5 * (Math.abs(f1) + Math.abs(f2)) + 3 * sig);
        if (rel > dOut) dOut = rel;
      }
    }
    const gap = other.score - top.score;          // > 0 : le second avis explique moins bien les mesures que ma loi
    const same = dIn < 0.5 && dOut < 0.005;   // même fonction, quelle que soit son écriture
    b.second = { text: other.text, same, dIn, dOut, gap, weak: gap > 10 && !same };
    for (const m of s2.front()) this.search._offer(clone(m.e), true);   // les idées du second avis rejoignent le débat
    const head = `Second avis (recherche indépendante) : ${this.target} = ${other.text}. `;
    if (passive) {
      this._say('DREAMING', head + (b.second.same ? 'Même loi.' : `Écart maximal avec ma loi : ${dIn.toFixed(1)} écarts-types.`));
      b.pass = dIn <= 2 || b.second.weak; b.runsZ = this._runsTest(top.expr);
      yield;
      return b.pass;
    }
    const left = () => this.budget - this.world.experiments;
    if (gap < -2) {
      this._believe();
      b.pass = false; b.notes.push('le second avis expliquait mieux les mesures');
      this._say('DREAMING', head + 'Il explique mieux mes mesures que ma propre loi : je l\'adopte et je reprends.');
      yield;
      return false;
    }
    if (b.second.weak) this._say('DREAMING', head + 'Il explique nettement moins bien les mesures que ma loi : je l\'écarte, mais je n\'ai donc aucune confirmation indépendante.');
    else this._say('DREAMING', head + (b.second.same ? 'Même loi.' : `Écart maximal avec ma loi : ${dIn.toFixed(1)} σ dans le domaine` + (ext > 1 ? `, ${(dOut * 100).toFixed(1)} % en extrapolation.` : '.')));
    yield;
    if (!b.second.weak && dIn > 2 && left() > 0) {
      const pred = evalPoint(top.expr, xIn), y = this._measure(xIn);
      if (isFinite(y)) this.predictions.push({ cycle: this.cycle, x: xIn, pred, y, z: (y - pred) / this.sigma });
      this.search.setData(this._data()); this._believe();
      b.pass = false; b.notes.push('désaccord avec le second avis');
      this._say('DREAMING', `Nos deux lois sont aussi crédibles l'une que l'autre et se contredisent en ${this._fmtX(xIn)} : j'y fais l'expérience plutôt que de conclure. Mesuré ${Number(y.toPrecision(4))}, j'attendais ${Number(pred.toPrecision(4))}.`);
      yield;
      return false;
    }

    // ---- 2. validation sur des expériences neuves
    const nVal = 6 + 2 * this.d;
    if (left() < nVal) {
      b.pass = false; b.notes.push('budget insuffisant pour la validation');
      this._say('DREAMING', `Il me reste ${left()} expérience(s) : pas assez pour une validation indépendante (${nVal}). Je ne peux pas certifier ma loi.`);
      this.exhausted = true; this.audits = 99;
      yield;
      return false;
    }
    const zs = [], start = this.y.length;
    for (let i = 0; i < nVal; i++) {
      const x = this._rand();
      const pred = evalPoint(top.expr, x), y = this._measure(x);
      if (isFinite(y) && isFinite(pred)) zs.push((y - pred) / this.sigma);
    }
    const chi = zs.reduce((a, z) => a + z * z, 0) / Math.max(zs.length, 1), maxZ = Math.max(...zs.map(Math.abs));
    const okVal = zs.length >= nVal - 1 && maxZ < 3.5 && chi < 1 + 3 * Math.sqrt(2 / zs.length);
    b.validation = { n: zs.length, chi, maxZ, ok: okVal, rmse: Math.sqrt(zs.reduce((a, z) => a + z * z, 0) / Math.max(zs.length, 1)) * this.sigma, from: start };
    this._say('DREAMING', `Validation : ${zs.length} expériences neuves, jamais utilisées pour ajuster ma loi. Écart quadratique moyen ${Math.sqrt(chi).toFixed(2)} σ, pire écart ${maxZ.toFixed(1)} σ → ${okVal ? 'la loi tient.' : 'la loi échoue. Je me trompais.'}`);
    yield;
    this.search.setData(this._data()); this._believe();
    if (!okVal) { b.pass = false; b.notes.push('validation échouée'); return false; }

    // ---- 2 bis. épreuve d'extrapolation : une prédiction risquée, hors du domaine où la loi a été construite
    if (this.world.extend > 1 && !this.extended) {
      if (left() < 3) b.extrapolation = { tested: false, why: 'budget épuisé' };
      else {
        const extD = this.domain.map(([lo, hi]) => [lo, lo + (hi - lo) * this.world.extend]);
        this.pending = { ext: extD };
        this.status = 'revue'; this.decision = this.autoApprove ? true : null;
        this._say('REVUE HUMAINE', 'Ma loi tient dans le domaine sûr. Avant de la dire établie, je veux risquer une prédiction là où je n\'ai jamais mesuré : je demande l\'autorisation de faire 3 expériences hors du domaine.');
        yield;
        while (this.decision === null) yield;
        this.status = 'en cours';
        const ok = this.decision;
        this.pending = null; this.decision = null; this.extended = true;
        if (!ok) {
          b.extrapolation = { tested: false, why: 'extension refusée' };
          this._say('DÉCIDER', 'Extension refusée : je reste dans le domaine sûr, et je ne dirai donc rien de ce qui se passe au-delà.');
          yield;
        } else {
          const inner = this.domain;
          const zs2 = [];
          for (let i = 0; i < 3; i++) {
            let x = this._rand(extD);
            for (let t = 0; t < 60 && x.every((v, j) => v <= inner[j][1]); t++) x = this._rand(extD);
            const pred = evalPoint(top.expr, x), y = this._measure(x);
            if (isFinite(y) && isFinite(pred)) { const z = (y - pred) / this.sigma; zs2.push(z); this.predictions.push({ cycle: this.cycle, x, pred, y, z }); }
            else if (isFinite(y)) zs2.push(99);
          }
          this.domain = extD;
          const maxZ2 = zs2.length ? Math.max(...zs2.map(Math.abs)) : 0;
          const okExt = zs2.length >= 2 && maxZ2 < 3.5;
          b.extrapolation = { tested: true, n: zs2.length, maxZ: maxZ2, ok: okExt };
          this.search.setData(this._data()); this._believe();
          this._say('DREAMING', `Épreuve d'extrapolation : ${zs2.length} expériences hors du domaine, pire écart ${maxZ2 > 50 ? 'énorme' : maxZ2.toFixed(1) + ' σ'} → ${okExt ? 'ma prédiction risquée était juste.' : 'ma loi ne valait que localement. Je reprends avec le domaine élargi.'}`);
          yield;
          if (!okExt) { b.pass = false; b.notes.push('échec hors du domaine'); return false; }
        }
      }
    }

    // ---- 3. structure des résidus
    b.runsZ = this._runsTest(top.expr);
    if (b.runsZ < -3) this._say('DREAMING', `Mes résidus ne ressemblent pas à du bruit (test des suites : ${b.runsZ.toFixed(1)}). Ma loi est une approximation, pas la loi exacte.`);
    b.pass = true;
    this._auditShape = shapeKey(this.hyps[0].expr);
    yield;
    return true;
  }

  /** Verdict gradué. L'agent ne dit « établie » que si rien ne l'autorise à douter. */
  _verdict() {
    const b = this.bilan || (this.bilan = { notes: ['aucune contre-expertise n\'a pu être menée'] });
    const top = this.hyps[0];
    if (!this.world) {
      b.verdict = b.pass ? 'empirique' : 'incertaine';
      b.why = b.pass ? 'Compatible avec les données et confirmée par un second avis, mais aucune expérience n\'a pu la mettre à l\'épreuve.'
        : 'Deux recherches indépendantes donnent des lois différentes sur ces données.';
      return;
    }
    if (!b.pass || b.law !== top.text && shapeKey(top.expr) !== this._auditShape) {
      b.verdict = 'incertaine';
      b.why = b.notes.length ? `Je ne certifie pas cette loi : ${b.notes.join(', ')}.` : 'La loi a changé après la contre-expertise.';
      return;
    }
    const approx = b.runsZ < -3, sec = b.second;
    const confirmed = !sec.weak && sec.dIn < 0.5 && sec.dOut < 0.005;
    const ex = b.extrapolation, untested = this.world.extend > 1 && ex && !ex.tested;
    if (!approx && confirmed && !untested) { b.verdict = 'établie'; b.why = 'Validée sur des expériences neuves' + (ex && ex.tested ? ', y compris hors du domaine où elle a été construite' : '') + ', et une recherche indépendante aboutit à la même loi.'; }
    else {
      b.verdict = 'empirique';
      b.why = 'Validée sur des expériences neuves dans le domaine exploré, mais ' + [
        approx && 'ses résidus sont structurés (c\'est une approximation)',
        sec.weak && 'aucune recherche indépendante ne l\'a confirmée',
        untested && `elle n'a pas été testée hors du domaine (${ex.why})`,
        !sec.weak && !confirmed && `une loi rivale aussi crédible s'en écarte de ${sec.dOut >= 0.005 ? (sec.dOut * 100).toFixed(1) + ' % hors du domaine' : sec.dIn.toFixed(1) + ' σ'}`,
      ].filter(Boolean).join(' et ') + '. Je ne garantis rien en extrapolation.';
    }
  }

  *_loop() {
    const passive = !this.world;
    this.status = 'en cours';

    // ------------------------------------------------------------------ OBSERVER
    if (!passive) {
      const n0 = Math.max(8, 5 * this.d + 2);
      // plan initial : hypercube latin
      const perms = this.domain.map(() => Array.from({ length: n0 }, (_, i) => i).sort(() => this.r() - 0.5));
      for (let i = 0; i < n0; i++) this._measure(this.domain.map(([a, b], j) => a + ((perms[j][i] + this.r()) / n0) * (b - a)));
      // répétitions : la même expérience plusieurs fois, pour estimer le bruit de mesure
      for (let g = 0; g < 3; g++) this._replicate(3);
      this.sigmaKnown = true;
      this._say('OBSERVER', `${this.y.length} mesures initiales, dont 3 expériences répétées 3 fois : bruit de mesure estimé σ ≈ ${Number(this.sigma.toPrecision(2))}.`);
    } else {
      this._say('OBSERVER', `${this.y.length} observations fournies ; aucune expérience possible, le bruit est inconnu.`);
    }
    this.search.setData(this._data());
    if (this.sigmaKnown) this.search.setNoise(this.sigma);
    yield;

    let extraEffort = 1, contradiction = false, prevShape = null, calibrated = 0;
    for (this.cycle = 1; this.cycle <= this.maxCycles; this.cycle++) {
      // ---------------------------------------------------------------- COMPRENDRE
      const chunks = 4;
      for (let c = 0; c < chunks; c++) {
        this.search.step(Math.round((this.effort * extraEffort) / chunks));
        this.phase = 'COMPRENDRE';
        yield;
      }
      this._believe();
      const top = this.hyps[0];
      this._say('COMPRENDRE', `Meilleure explication : ${this.target} = ${top.text}  (confiance ${(top.weight * 100).toFixed(0)} %, ${this.hyps.length} hypothèses en lice).`);
      yield;

      // ---------------------------------------------------------------- CONFRONTER
      const last = this.predictions[this.predictions.length - 1];
      if (last && last.cycle === this.cycle - 1) {
        contradiction = Math.abs(last.z) > 3;
        this._say('CONFRONTER', contradiction
          ? `Contradiction : la mesure s'écarte de ${Math.abs(last.z).toFixed(1)} σ de ma prédiction. Ma théorie était fausse à cet endroit.`
          : `Confirmation : la mesure tombe à ${Math.abs(last.z).toFixed(1)} σ de ma prédiction.`);
        yield;
      } else contradiction = false;

      // ---------------------------------------------------------------- HYPOTHÈSES
      if (contradiction) {
        this.search.step(this.effort);
        this._believe();
        this._say('HYPOTHÈSES', `Je cherche de nouvelles formes de loi. Candidate actuelle : ${this.target} = ${this.hyps[0].text}.`);
        yield;
      }
      const shape = shapeKey(this.hyps[0].expr);
      this.stable = shape === prevShape ? this.stable + 1 : 0;
      prevShape = shape;
      this.history.push({ cycle: this.cycle, n: this.y.length, top: this.hyps[0].text, weight: this.hyps[0].weight });

      if (passive) {
        this._say('DREAMING', `Auto-audit : forme ${this.stable ? `stable depuis ${this.stable} cycle(s)` : 'encore changeante'}.`);
        yield;
        if (this.stable >= 4 && this.cycle >= 6) { yield* this._audit(); break; }
        continue;
      }

      // ---------------------------------------------------------------- ANTICIPER
      const cands = [];
      for (let k = 0; k < 400; k++) { const x = this._rand(); cands.push({ x, u: this._utility(x), dmin: this._minDist(x) }); }
      const spacing = Math.pow(this.y.length, -1 / this.d);
      let maxU = 0;
      for (const c of cands) { c.gain = c.u * (0.4 + Math.min(c.dmin / spacing, 1.5)); if (c.u > maxU) maxU = c.u; }
      this.candidates = cands;
      this._say('ANTICIPER', maxU >= 0.25
        ? `Mes hypothèses se contredisent jusqu'à ${Math.sqrt(maxU).toFixed(1)} σ dans le domaine : une expérience peut les départager.`
        : `Mes hypothèses sont indiscernables dans le domaine (écart max ${Math.sqrt(maxU).toFixed(2)} σ).`);
      yield;

      // ---------------------------------------------------------------- PRIORISER
      let choice;
      if (this.mode === 'aléatoire') choice = { x: this._rand(), why: 'tirage au hasard (mode témoin)' };
      else if (maxU >= 0.25) {
        const c = cands.reduce((a, b) => (b.gain > a.gain ? b : a));
        choice = { x: c.x, why: `désaccord attendu ${Math.sqrt(c.u).toFixed(1)} σ` };
      } else {
        const c = cands.reduce((a, b) => (b.dmin > a.dmin ? b : a));
        choice = { x: c.x, why: 'zone la moins explorée' };
      }
      this.next = choice;
      this._say('PRIORISER', `Expérience la plus utile : ${this._fmtX(choice.x)} (${choice.why}).`);
      yield;

      // ---------------------------------------------------------------- DÉCIDER
      const topH = this.hyps[0];
      const recent = this.predictions.slice(-3);
      const confirmed = recent.length >= 3 && recent.every((p) => Math.abs(p.z) < 3);
      const adequate = topH.chi2red !== null && topH.chi2red < 2.2;
      const settled = topH.weight >= 0.9 && this.stable >= 3 && confirmed && adequate;
      const left = this.budget - this.world.experiments;
      if (settled && this.mode === 'actif' && maxU < 0.25 && !this.extended && this.world.extend > 1) {
        // Risque : sortir du domaine sûr pour tester la loi en extrapolation.
        const ext = this.domain.map(([a, b]) => [a, a + (b - a) * this.world.extend]);
        let bestExt = null;
        for (let k = 0; k < 300; k++) { const x = this._rand(ext); const u = this._utility(x); if (!bestExt || u > bestExt.u) bestExt = { x, u }; }
        if (bestExt && bestExt.u > 9) {
          this.pending = { ext, x: bestExt.x, u: bestExt.u };
          this.status = 'revue'; this.decision = this.autoApprove ? true : null;
          this._say('REVUE HUMAINE', `Dans le domaine sûr, plus rien ne distingue mes hypothèses ; hors domaine (${this._fmtX(bestExt.x)}) elles divergent de ${Math.sqrt(bestExt.u).toFixed(0)} σ. Je demande l'autorisation d'élargir le domaine d'expérience.`);
          yield;
          while (this.decision === null) yield;
          this.status = 'en cours';
          if (this.decision) {
            this.domain = ext; this.extended = true; this.next = { x: bestExt.x, why: 'extrapolation autorisée' };
            this.holdUntil = this.world.experiments + 3;   // au moins 3 mesures hors de l'ancien domaine avant de conclure
            this._say('DÉCIDER', this.autoApprove ? 'Extension approuvée automatiquement (mode sans supervision).' : 'Extension approuvée par l’humain.');
          } else {
            this.extended = true;
            this._say('DÉCIDER', 'Extension refusée : je reste dans le domaine sûr.');
          }
          this.pending = null; this.decision = null;
          yield;
        }
      }
      if (settled && this.world.experiments >= this.holdUntil && (maxU < 0.25 || this.stable >= 10) && this.audits < 4) {
        const passed = yield* this._audit();
        if (passed) {
          this._say('DÉCIDER', `J'arrête : la loi tient depuis ${this.stable} cycles, χ² réduit = ${this.hyps[0].chi2red.toFixed(2)}, et elle a résisté à la contre-expertise.`);
          yield;
          break;
        }
        this.holdUntil = this.world.experiments + 3;
        prevShape = null;
        continue;
      }
      if (left <= 0) {
        this._say('DÉCIDER', `Budget d'expériences épuisé (${this.budget}). Je rends ma meilleure hypothèse sans certitude.`);
        this.exhausted = true;
        yield;
        break;
      }
      this._say('DÉCIDER', `Je continue (${left} expérience(s) restante(s)).`);
      yield;

      // ---------------------------------------------------------------- SIMULER
      const x = this.next.x;
      const pred = evalPoint(topH.expr, x);
      const rivals = this.hyps.slice(1, 4).map((h) => evalPoint(h.expr, x)).filter(isFinite);
      this._say('SIMULER', `Si ma loi est juste, je mesurerai ${this.target} ≈ ${Number(pred.toPrecision(4))}` +
        (rivals.length ? ` ; mes rivales prédisent ${rivals.map((v) => Number(v.toPrecision(4))).join(', ')}.` : '.'));
      yield;

      // ---------------------------------------------------------------- EXÉCUTER + MESURER
      this.phase = 'EXÉCUTER';
      const y = this._measure(x);
      if (!isFinite(y)) {
        this._say('MESURER', `L'expérience ${this._fmtX(x)} est impossible (résultat non défini). Je l'écarte.`);
        yield;
        continue;
      }
      const z = (y - pred) / this.sigma;
      this.predictions.push({ cycle: this.cycle, x, pred, y, z });
      this._say('MESURER', `Mesuré ${this.target} = ${Number(y.toPrecision(4))} en ${this._fmtX(x)}.`);
      yield;

      // ---------------------------------------------------------------- APPRENDRE + RÉVISER
      this.search.setData(this._data());
      this._believe();
      this._say('RÉVISER', `Croyances mises à jour sur ${this.y.length} mesures. En tête : ${this.target} = ${this.hyps[0].text} (${(this.hyps[0].weight * 100).toFixed(0)} %).`);
      yield;

      // ---------------------------------------------------------------- DREAMING (auto-audit)
      const zs = this.predictions.slice(-8).map((p) => Math.abs(p.z));
      calibrated = zs.filter((v) => v < 2).length / zs.length;
      const chi = this.hyps[0].chi2red;
      const left2 = this.budget - this.world.experiments;
      if (chi > 1.6 && this.noiseDF < 16 && left2 >= 3 && this.stable >= 1) {
        // Avant d'accuser la loi, je doute de ma propre estimation du bruit.
        const before = this.sigma;
        this._replicate(3);
        this.search.setNoise(this.sigma);
        this.search.setData(this._data());
        this._believe();
        this._say('DREAMING', `Auto-audit : χ² réduit = ${chi.toFixed(1)}. Soit ma loi est fausse, soit j'ai sous-estimé le bruit : je répète une expérience 3 fois. σ : ${Number(before.toPrecision(2))} → ${Number(this.sigma.toPrecision(2))}.`);
      } else if (chi > 2.2 && this.cycle >= 3) {
        extraEffort = Math.min(extraEffort * 1.5, 2.5);
        this._say('DREAMING', `Auto-audit : χ² réduit = ${chi.toFixed(1)} — ma meilleure loi n'explique pas les données. J'augmente l'effort de recherche (×${extraEffort.toFixed(1)}).`);
      } else {
        extraEffort = Math.max(1, extraEffort / 1.5);
        this._say('DREAMING', `Auto-audit : ${(calibrated * 100).toFixed(0)} % de mes dernières prédictions à moins de 2 σ ; χ² réduit = ${chi.toFixed(2)}.`);
      }
      yield;
    }
    this._believe();
    this._verdict();
    this.phase = null;
    this.status = 'terminé';
  }
}

/**
 * Vérification indépendante : compare une loi trouvée à la vérité sur des points neufs,
 * dans le domaine puis en extrapolation (domaine élargi de 50 %). Erreurs normalisées par l'écart-type de la vérité.
 */
export function verify(world, expr, seed = 12345) {
  const r = rng(seed);
  const nPts = world.secret.formula ? 2000 : 400;   // un simulateur coûte plus cher qu'une formule
  const nrmse = (dom) => {
    let se = 0, n = 0; const ys = [];
    for (let k = 0; k < nPts; k++) {
      const x = dom.map(([a, b]) => a + r() * (b - a));
      const t = world.secret.f(x);
      if (!isFinite(t)) continue;
      const p = evalPoint(expr, x);
      se += isFinite(p) ? (p - t) ** 2 : Infinity; n++; ys.push(t);
    }
    const m = ys.reduce((a, b) => a + b, 0) / n;
    const v = ys.reduce((a, b) => a + (b - m) ** 2, 0) / n;
    return Math.sqrt(se / n / v);
  };
  const base = world.vars.map((v) => [v.min, v.max]);
  const k = world.extend > 2 ? world.extend : Math.min(world.extend, 1.5);   // les mondes à grande extension sont jugés sur toute leur plage
  const inDomain = nrmse(base);
  const extrapolation = nrmse(base.map(([a, b]) => [a, a + (b - a) * k]));
  // Même forme ? On réajuste les constantes de la loi trouvée sur la vérité sans bruit (domaine élargi) :
  // si l'erreur tombe sous 0,1 %, la structure est la bonne et seules les constantes étaient imprécises.
  const wide = base.map(([a, b]) => [a, a + (b - a) * k]);
  const X = [], y = [];
  for (let i = 0; i < 300; i++) { const x = wide.map(([a, b]) => a + r() * (b - a)); const t = world.secret.f(x); if (isFinite(t)) { X.push(x); y.push(t); } }
  const refit = clone(expr);
  const data = makeData(X, y);
  const m = y.reduce((a, b) => a + b, 0) / y.length, varT = y.reduce((a, b) => a + (b - m) ** 2, 0) / y.length;
  const sameForm = world.secret.formula ? Math.sqrt(fitConstants(refit, data, 40) / varT) < 1e-3 : null;
  return { inDomain, extrapolation, sameForm, points: nPts, recovered: inDomain < 0.005 && extrapolation < 0.01 };
}
