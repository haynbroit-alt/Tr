// LAVOISIER — organe 1 : le bilan de matière (protocole M0).
// Entrée : les seules données observées. Sortie : la déclaration de corps (format de src/bench/evaluate.js).
import { inferTypes } from './types.js';
import { inferLinks } from './links.js';
import { inferStocks } from './stocks.js';
import { inferEcarts } from './ecarts.js';
import { estimateDates, imputeCensored } from './dates.js';

export function bilan(observed) {
  const { journal } = observed;
  const typeOf = inferTypes(journal);
  const { links, dup, rules } = inferLinks(journal, typeOf);
  // premier passage aux dates de saisie, puis estimation des dates réelles et second passage
  const S0 = inferStocks(observed, typeOf, links, new Set(dup), rules);
  const { day, batch } = estimateDates(observed, typeOf, S0);
  const est = imputeCensored(observed, typeOf, batch, day);
  for (const e of est) { typeOf.set(e.id, typeOf.get(e.modele)); links.set(e.id, new Set()); }
  const dated = { ...observed, journal: [...journal.map((r) => ({ ...r, jour: day.get(r.id) })), ...est] };
  const S = inferStocks(dated, typeOf, links, dup, rules);
  const ecarts = inferEcarts(dated, S, typeOf, links, dup);
  const records = {};
  for (const r of journal) records[r.id] = { type: typeOf.get(r.id), links: [...links.get(r.id)], deltas: S.deltas.get(r.id) };
  return {
    records,
    stocks: S.stocks.map((s) => ({ id: s.id, unit: s.unit, series: s.series })),
    profitMensuel: S.profit,
    ecarts,
  };
}
