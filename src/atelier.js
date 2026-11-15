// L'atelier : une méthode qui écrit ses propres règles de décision, les valide et sait refuser d'en proposer une.
// Protocole : programme/t3h/PROTOCOLE_T3H.md § 5. Une ligne = { traits: { nom: nombre|null }, gains: { action: nombre } }.
// Une règle est un arbre : un nœud teste « trait < seuil », une feuille applique une action. Rien ici ne simule :
// l'atelier ne fait que choisir entre des actions dont le gain est déjà mesuré pour chaque ligne.
export const FEUILLE_MIN = 20, PLIS = 10, PROFONDEURS = [0, 1, 2, 3], T_REFUS = 1.684;
export const borne = (x) => Math.max(-1, Math.min(1, x));   // gains bornés à ±100 points pour apprendre
const moy = (v) => v.reduce((a, b) => a + b, 0) / v.length;
const stat = (v) => { const n = v.length, m = moy(v), et = n > 1 ? Math.sqrt(v.reduce((s, x) => s + (x - m) ** 2, 0) / (n - 1) / n) : 0; return { n, moyenne: m, erreur_type: et, t: et > 0 ? m / et : 0 }; };

function meilleure(L, actions) {
  let best = null;
  for (const a of actions) { const total = L.reduce((s, l) => s + borne(l.gains[a]), 0); if (!best || total > best.total + 1e-12) best = { action: a, total }; }
  return best;
}
const aGauche = (l, trait, seuil) => l.traits[trait] != null && Number.isFinite(l.traits[trait]) && l.traits[trait] < seuil;

export function construire(L, { actions, traits, profondeur, feuilleMin = FEUILLE_MIN }) {
  const f = meilleure(L, actions);
  if (profondeur === 0 || L.length < 2 * feuilleMin) return { action: f.action, n: L.length };
  let best = null;
  for (const trait of traits) {
    const v = L.map((l) => l.traits[trait]).filter((x) => x != null && Number.isFinite(x)).sort((a, b) => a - b);
    if (v.length < feuilleMin) continue;
    for (const seuil of new Set([1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => v[Math.floor((d * v.length) / 10)]))) {
      const G = L.filter((l) => aGauche(l, trait, seuil)), D = L.filter((l) => !aGauche(l, trait, seuil));
      if (G.length < feuilleMin || D.length < feuilleMin) continue;
      const total = meilleure(G, actions).total + meilleure(D, actions).total;
      if (!best || total > best.total + 1e-12) best = { trait, seuil, total, G, D };
    }
  }
  if (!best || best.total <= f.total + 1e-9) return { action: f.action, n: L.length };
  const suite = { actions, traits, profondeur: profondeur - 1, feuilleMin };
  return { trait: best.trait, seuil: best.seuil, n: L.length, si: construire(best.G, suite), sinon: construire(best.D, suite) };
}
export const appliquer = (arbre, traits) => (arbre.action != null ? arbre.action : appliquer(aGauche({ traits }, arbre.trait, arbre.seuil) ? arbre.si : arbre.sinon, traits));
export function dire(arbre, marge = '') {
  if (arbre.action != null) return [`${marge}→ ${arbre.action}${arbre.n != null ? ` (${arbre.n} entreprises de l’atelier)` : ''}`];
  return [`${marge}si ${arbre.trait} < ${Number(arbre.seuil.toFixed(3))} :`, ...dire(arbre.si, marge + '    '), `${marge}sinon :`, ...dire(arbre.sinon, marge + '    ')];
}
const utilise = (arbre, out = { traits: new Set(), actions: new Set() }) => { if (arbre.action != null) out.actions.add(arbre.action); else { out.traits.add(arbre.trait); utilise(arbre.si, out); utilise(arbre.sinon, out); } return out; };

// Validation croisée, choix de la profondeur (règle d'une erreur type), puis refus si l'avantage hors pli sur la
// référence n'est pas établi. Rend la règle apprise sur toutes les lignes, et ce que la validation annonce.
export function atelier(L, { actions, traits, reference = 'chaine' }) {
  const horsPli = PROFONDEURS.map((profondeur) => {
    const choix = new Array(L.length);
    for (let k = 0; k < PLIS; k++) { const arbre = construire(L.filter((_, i) => i % PLIS !== k), { actions, traits, profondeur }); L.forEach((l, i) => { if (i % PLIS === k) choix[i] = appliquer(arbre, l.traits); }); }
    return { profondeur, gain: stat(L.map((l, i) => borne(l.gains[choix[i]]))), avantage: stat(L.map((l, i) => borne(l.gains[choix[i]]) - borne(l.gains[reference]))) };
  });
  const top = horsPli.reduce((a, b) => (b.gain.moyenne > a.gain.moyenne ? b : a)), retenu = horsPli.find((h) => h.gain.moyenne >= top.gain.moyenne - top.gain.erreur_type);
  const refus = !(retenu.avantage.t >= T_REFUS), arbre = refus ? { action: reference, n: L.length } : construire(L, { actions, traits, profondeur: retenu.profondeur }), u = utilise(arbre);
  return { actions, traits, reference, validation: horsPli, profondeur: retenu.profondeur, refus, annonce: refus ? { n: L.length, moyenne: 0, erreur_type: 0, t: 0 } : retenu.avantage,
    regle: arbre, en_clair: dire(arbre), traits_utilises: [...u.traits], actions_utilisees: [...u.actions] };
}
