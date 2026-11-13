// Générateur d'entreprises opaques (protocole M0, § 2).
// Deux passes avec les mêmes graines : la première (sans flux caché) mesure les flux bruts de chaque stock, pour
// calibrer la force des flux cachés (0,5 % à 5 % du flux annuel du stock touché) ; la seconde produit l'entreprise.
import { Engine, DAYS } from './engine.js';
import { makeRng, derive } from './rng.js';
import { ARCHETYPES } from './archetypes.js';

function build(seed, archetype, level, plan) {
  const make = ARCHETYPES[archetype];
  if (!make) throw new Error(`archétype inconnu ou pas encore écrit : ${archetype}`);
  const eng = new Engine(seed, level);
  const ctx = {};
  make(eng, ctx);
  const remises = [];
  const hrng = makeRng(derive(seed, 5));
  for (const h of plan) {
    const H = { ...h, total: 0 };
    if (h.kind === 'demarque') H.apply = () => { const v = Math.floor(eng.value(h.stock)); const loss = Math.min(v, hrng.poisson(h.rate)); if (loss > 0) eng.move(h.stock, -loss); return loss; };
    else if (h.kind === 'frais') H.apply = (d) => { if ((d - h.debut) % 7) return 0; const a = Math.round(7 * h.rate * 100) / 100; eng.move(h.stock, -a); return a; };
    else if (h.kind === 'remise') { H.apply = () => 0; remises.push(H); }
    eng.hidden.push(H);
  }
  if (remises.length) {
    eng.onReceive = (it, amount) => {
      const H = remises.find((x) => x.cp === it.cp && eng.day >= x.debut);
      if (!H) return null;
      const recorded = Math.round(amount * (1 - H.rate) * 100) / 100;
      H.total += amount - recorded;
      return { recorded };
    };
  }
  eng.run();
  return { eng, ctx };
}

// cfg : { archetype, nHidden, level }
export function generate(seed, cfg) {
  const { archetype, nHidden = 0, level = 'realiste' } = cfg;
  const plan = [];
  if (nHidden > 0) {
    const { eng: e1, ctx } = build(seed, archetype, level, []);
    const hr = makeRng(derive(seed, 4));
    const kinds = hr.shuffle([...ctx.hiddenKinds]).slice(0, nHidden);
    for (const kind of kinds) {
      const debut = hr.int(60, 300), f = hr.logUniform(0.005, 0.05), span = DAYS - debut;
      if (kind === 'demarque') {
        const stock = hr.pick(ctx.objets), s = e1.stocks.get(stock);
        const mean = s.series.reduce((a, b) => a + b, 0) / DAYS;
        plan.push({ kind, stock, debut, rate: (f * s.gross) / span, threshold: e1.dis.invError * mean });
      } else if (kind === 'frais') {
        plan.push({ kind, stock: 'T0', debut, rate: (f * e1.stocks.get('T0').gross) / span, threshold: 0 });
      } else if (kind === 'remise') {
        const cands = ctx.clients.map((cp) => [cp, (ctx.invoiced[cp] ?? []).filter(([d]) => d >= debut).reduce((a, [, m]) => a + m, 0)]).filter(([, x]) => x > 0);
        if (!cands.length) continue;
        const [cp, X] = hr.pick(cands);
        plan.push({ kind, stock: 'CR', cp, debut, rate: Math.min(0.3, (f * e1.stocks.get('CR').gross) / X), threshold: 0 });
      }
    }
  }
  const { eng } = build(seed, archetype, level, plan);
  const out = eng.finalize();
  out.truth.archetype = archetype;
  out.truth.nHiddenPlanned = nHidden;
  return out;
}
