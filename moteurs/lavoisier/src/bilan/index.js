// LAVOISIER — organe 1 : le bilan de matière (protocole M0).
// Entrée : les seules données observées. Sortie : la déclaration de corps (format de src/bench/evaluate.js).
import { inferTypes, adoptCounterpartType } from './types.js';
import { inferLinks } from './links.js';
import { inferStocks, retirerManques } from './stocks.js';
import { inferEcarts } from './ecarts.js';
import { estimateDates, imputeCensored } from './dates.js';

export function bilan(observed) {
  const { journal } = observed;
  const typeOf0 = inferTypes(journal);
  const { links, dup, rules } = inferLinks(journal, typeOf0);
  const typeOf = adoptCounterpartType(journal, typeOf0);
  // premier passage aux dates de saisie, puis estimation des dates réelles et second passage
  const S0 = inferStocks(observed, typeOf, links, new Set(dup), rules);
  const { day, batch } = estimateDates(observed, typeOf, S0, links, rules);
  const est = imputeCensored(observed, typeOf, batch, day);
  for (const e of est) { typeOf.set(e.id, typeOf.get(e.modele)); links.set(e.id, new Set()); }
  let dated = { ...observed, journal: [...journal.map((r) => ({ ...r, jour: day.get(r.id) })), ...est] };
  let S = inferStocks(dated, typeOf, links, dup, rules);
  // premier passage aveugle : s'il n'a attribué d'incidence à aucun type portant des quantités sur un stock relevé
  // chaque mois, les étapes de datation qui en dépendent n'ont pas pu s'exécuter ; les dates sont réestimées une
  // fois avec l'incidence trouvée au second passage
  const suivis = new Set(S0.stocks.filter((x) => x.releveM && x.objet != null).map((x) => x.objet));
  const porteurs = new Set(journal.filter((r) => r.quantite != null && suivis.has(r.objet)).map((r) => typeOf.get(r.id)));
  if (porteurs.size && [...porteurs].every((t) => !S0.coef(t))) {
    const d2 = estimateDates(observed, typeOf, S, links, rules);
    const est2 = imputeCensored(observed, typeOf, d2.batch, d2.day);
    for (const e of est2) { typeOf.set(e.id, typeOf.get(e.modele)); links.set(e.id, new Set()); }
    dated = { ...observed, journal: [...journal.map((r) => ({ ...r, jour: d2.day.get(r.id) })), ...est2] };
    S = inferStocks(dated, typeOf, links, dup, rules);
  }
  const ecarts = inferEcarts(dated, S, typeOf, links, dup);
  retirerManques(S, dated.jours);
  const records = {};
  for (const r of journal) records[r.id] = { type: typeOf.get(r.id), links: [...links.get(r.id)], deltas: S.deltas.get(r.id) };
  return {
    records,
    stocks: S.stocks.map((s) => ({ id: s.id, unit: s.unit, series: s.series })),
    profitMensuel: S.profit,
    ecarts,
  };
}
