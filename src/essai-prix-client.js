// Chaîne de livraison « essai de prix » sur les ventes d'un client. Elle applique ce que trois tests en simulation
// ont laissé debout (programme/t3, t3b, t3c) : un essai court conduit par le plan de CORTEX, puis une décision par la
// table des ventes constatées, avec le coût unitaire. Aucune loi n'entre dans la décision, et sans coût elle refuse.
// Ce que ces tests n'ont PAS établi est écrit dans chaque rapport : l'outil ne promet pas de gain.
// Depuis T3g (programme/t3g) : quand le coût est connu, le plan écarte d'avance les baisses qui ne peuvent pas être
// rentables (il faudrait une demande plus sensible au prix que le seuil E_MAX pour qu'elles rapportent).
import { NIVEAUX, BLOC, BLOCS_COURT, prixDe } from './problemes/essai-prix.js';
import { planChaine, planPrudent, eRequise, E_MAX } from './problemes/essai-prix-prudent.js';

export const HISTORIQUE = 182, JOURS_REF = 14, TOLERANCE = 0.0051;
const med = (v) => { const s = [...v].sort((a, b) => a - b); return s.length ? s[s.length >> 1] : null; };
const sansAccent = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim().replace(/^"|"$/g, '');
const FACULTATIF = { promotion: ['promotion', 'promo', 'remise', 'en_promotion'], prix: ['prix_unitaire', 'prix unitaire', 'prix', 'lineitem price', 'unit price', 'price'] };
// Une ligne CSV, guillemets compris (« T-shirt, bleu » reste un seul champ ; "" vaut un guillemet). Un champ sur
// plusieurs lignes n'est pas pris en charge : la ligne est alors rejetée et comptée.
export function decouper(ligne, sep) {
  const out = []; let champ = '', dans = false;
  for (let i = 0; i < ligne.length; i++) {
    const c = ligne[i];
    if (dans) { if (c === '"' && ligne[i + 1] === '"') { champ += '"'; i++; } else if (c === '"') dans = false; else champ += c; }
    else if (c === '"') dans = true; else if (c === sep) { out.push(champ); champ = ''; } else champ += c;
  }
  out.push(champ);
  return out;
}
const ALIAS = { date: ['date', 'jour', 'created at', 'date de commande', 'order date'], produit: ['produit', 'article', 'reference', 'designation', 'lineitem name', 'nom du produit', 'product', 'item'],
  quantite: ['quantite', 'qte', 'quantity', 'lineitem quantity', 'qty'], montant: ['montant', 'total', 'ca', 'montant_ht', 'montant ht', 'net sales', 'ventes nettes'] };
const JOUR = 86400000, iso = (n) => new Date(n * JOUR).toISOString().slice(0, 10);
export function jourDe(texte) {
  const t = String(texte ?? '').trim(), i = t.match(/^(\d{4})-(\d{2})-(\d{2})/), f = t.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (!i && !f) return null;
  const [an, mois, jour] = i ? [i[1], i[2], i[3]] : [f[3], f[2], f[1]];
  const n = Date.UTC(Number(an), Number(mois) - 1, Number(jour)) / JOUR;
  return Number.isFinite(n) ? n : null;
}

// Export de ventes : une ligne par vente, colonnes date, produit, quantité, montant (noms souples, séparateur ; , ou tabulation).
export function lireVentes(texte) {
  const L = texte.replace(/^﻿/, '').split(/\r?\n/).filter((l) => l.trim());
  const sep = [';', '\t', ','].find((s) => L[0].includes(s)) ?? ',';
  const entete = decouper(L[0], sep).map(sansAccent), col = {};
  for (const [k, noms] of Object.entries(FACULTATIF)) col[k] = entete.findIndex((e) => noms.includes(e));
  for (const [k, noms] of Object.entries(ALIAS)) { col[k] = entete.findIndex((e) => noms.includes(e)); if (col[k] < 0 && k === 'montant' && col.prix >= 0) continue; if (col[k] < 0) throw new Error(`colonne « ${k} » introuvable (en-têtes lus : ${entete.join(', ')})`); }
  const oui = (v) => { const x = sansAccent(String(v ?? '')); return x !== '' && x !== '0' && x !== 'non' && x !== 'false' && x !== 'n'; };
  const num = (v) => { const x = String(v ?? '').trim().replace(/\s/g, ''); return Number(sep === ',' ? x : x.replace(',', '.')); };
  const lignes = [];
  let rejetees = 0;
  for (const l of L.slice(1)) {
    // sans colonne de montant, montant = prix unitaire × quantité (exports de commandes en ligne)
    const c = decouper(l, sep), jour = jourDe(c[col.date]), quantite = num(c[col.quantite]), montant = col.montant >= 0 ? num(c[col.montant]) : num(c[col.prix]) * quantite, produit = (c[col.produit] ?? '').trim();
    if (jour == null || !produit || !(quantite > 0) || !(montant > 0)) { rejetees++; continue; }
    lignes.push({ jour, produit, quantite, montant, promotion: col.promotion >= 0 && oui(c[col.promotion]) });
  }
  return { lignes, rejetees };
}

const LIMITES = [
  'Méthode éprouvée en simulation seulement (454 entreprises simulées, sept tests) ; jamais encore sur une entreprise réelle.',
  'Établi en simulation : le prix choisi après l’essai fait mieux qu’une règle fixe pendant qu’on l’applique.',
  'Aucun gain n’est promis. En simulation l’essai fait en moyenne mieux que « ne rien changer », mais environ quatre entreprises sur dix y perdent.',
  'Les baisses écartées du plan le sont par un calcul sur votre coût : si votre produit est exceptionnellement sensible au prix, une baisse écartée aurait pu être la bonne.',
  'Une semaine à prix bas peut vendre plus que le réapprovisionnement ne soutient : la hausse des ventes est alors surestimée.',
  'Pendant l’essai, rien d’autre ne doit changer sur ce produit (promotion, publicité, rupture), sinon la lecture est faussée : sur des ventes réelles de grande distribution, l’effet lu sur le prix venait surtout des promotions.',
];

export function produitsEligibles(lignes, jd) {
  const g = new Map();
  for (const r of lignes) if (r.jour >= jd - HISTORIQUE && r.jour < jd) { const c = g.get(r.produit) ?? { lignes: 0, jours: new Set() }; c.lignes++; c.jours.add(r.jour); g.set(r.produit, c); }
  return [...g].map(([produit, c]) => ({ produit, lignes: c.lignes, jours_actifs: c.jours.size, eligible: c.jours.size >= HISTORIQUE / 2 })).sort((a, b) => b.lignes - a.lignes);
}

// Niveaux de l'essai : plan de CORTEX (P3 gelé) ; avec un coût, les baisses non rentables en sont écartées (T3g).
export function niveauxDuPlan(pref, cout) {
  const base = planChaine(), niveaux = cout > 0 ? planPrudent(base, pref, cout) : base;
  const ecartes = [...new Set(base.filter((u, i) => niveaux[i] !== u))].map((u) => { const prix = prixDe(pref, u), e = eRequise(pref, cout, prix); return { niveau: u, prix, sous_le_cout: prix <= cout, sensibilite_requise: Number.isFinite(e) ? Number(e.toFixed(1)) : null, ventes_a_multiplier_par: prix > cout ? Number(((pref - cout) / (prix - cout)).toFixed(1)) : null }; });
  return { niveaux, ecartes };
}

// Plan d'essai : 8 semaines, un prix par semaine.
export function plan({ lignes, produit, debut, cout = null }) {
  const jd = jourDe(debut);
  if (jd == null) return { possible: false, motif: `date de début illisible : ${debut}` };
  const e = produitsEligibles(lignes, jd).find((x) => x.produit === produit);
  if (!e) return { possible: false, motif: `aucune vente de « ${produit} » dans les ${HISTORIQUE} jours avant le ${iso(jd)}` };
  if (!e.eligible) return { possible: false, motif: `« ${produit} » n’est vendu que ${e.jours_actifs} jours sur ${HISTORIQUE} : il en faut au moins un sur deux pour qu’un essai de ${BLOCS_COURT} semaines se lise` };
  const ref = med(lignes.filter((r) => r.produit === produit && r.jour >= jd - JOURS_REF && r.jour < jd).map((r) => r.montant / r.quantite));
  if (!ref) return { possible: false, motif: `aucune vente de « ${produit} » dans les ${JOURS_REF} jours avant le début : pas de prix de référence` };
  const pref = Math.round(ref * 100) / 100, { niveaux, ecartes } = niveauxDuPlan(pref, cout);
  const semaines = niveaux.map((u, b) => ({ semaine: b + 1, du: iso(jd + BLOC * b), au: iso(jd + BLOC * b + BLOC - 1), niveau: u, prix: prixDe(pref, u), variation_pct: Number((100 * (prixDe(pref, u) / pref - 1)).toFixed(1)) }));
  const alertes = [];
  for (const x of ecartes) alertes.push(x.sous_le_cout ? `La baisse à ${x.prix} € a été écartée du plan : ce prix est sous le coût (${cout} €), chaque vente y serait à perte.`
    : `La baisse à ${x.prix} € a été écartée du plan : pour qu’elle rapporte autant que le prix actuel, il faudrait vendre ${x.ventes_a_multiplier_par.toLocaleString('fr-FR')} fois plus (sensibilité au prix de ${x.sensibilite_requise.toLocaleString('fr-FR')}, au-delà du seuil de ${E_MAX} retenu).`);
  if (cout != null && pref <= cout) alertes.push(`Le prix actuel (${pref} €) ne dépasse pas le coût (${cout} €) : vérifier le coût fourni avant tout essai.`);
  if (cout == null) alertes.push('Coût unitaire non fourni : il sera indispensable pour décider, et sans lui le plan ne peut pas écarter les baisses non rentables. Sans coût, on maximise le chiffre d’affaires et, en simulation, on y perd.');
  return { possible: true, produit, debut: iso(jd), decision_le: iso(jd + BLOC * BLOCS_COURT), prix_reference: pref, jours_actifs: e.jours_actifs, cout_au_plan: cout, niveaux, ecartes, semaines, alertes, limites: LIMITES };
}

// Décision après l'essai : parmi les prix essayés, celui qui maximise (prix − coût) × ventes par jour constatées.
// Une vente est rattachée à un prix par son propre prix unitaire, et un prix ne reçoit rien avant sa première semaine.
// Le plan relu est celui que `plan` a rendu : avec le coût donné alors (cout_plan, par défaut le coût de la décision),
// ou le plan complet si l'essai a été lancé sans coût (plan_standard).
export function decider({ lignes, produit, debut, prix_reference, cout, cout_plan = null, plan_standard = false, semaines = BLOCS_COURT }) {
  const jd = jourDe(debut), pref = Number(prix_reference);
  if (jd == null || !(pref > 0)) return { possible: false, motif: 'date de début ou prix de référence illisible' };
  if (!(cout > 0)) return { possible: false, motif: 'coût unitaire manquant : sans lui la décision se prend sur le chiffre d’affaires, ce qui a perdu plus de la moitié du gain dans les trois tests' };
  // semaines = 4 : lecture anticipée (arène, tours 2 et 3). Nette si le meilleur prix dépasse le deuxième de 20 % en marge par jour.
  if (![4, BLOCS_COURT].includes(semaines)) return { possible: false, motif: `lecture possible à 4 ou à ${BLOCS_COURT} semaines seulement` };
  const niveaux = niveauxDuPlan(pref, plan_standard ? null : cout_plan ?? cout).niveaux.slice(0, semaines), fin = jd + BLOC * semaines;
  const premier = (u) => (niveaux.indexOf(u) < 0 ? Infinity : jd + BLOC * niveaux.indexOf(u));
  const q = new Map(NIVEAUX.map((u) => [u, 0]));
  let hors = 0, total = 0, promo = 0;
  for (const r of lignes) {
    if (r.produit !== produit || r.jour < jd || r.jour >= fin) continue;
    // ventes signalées en promotion : écartées (PRIX-RÉEL : sur ventes réelles, la promotion vend plus que le prix)
    if (r.promotion) { promo += r.quantite; continue; }
    total += r.quantite;
    const u = NIVEAUX.find((x) => r.jour >= premier(x) && Math.abs(r.montant / r.quantite - prixDe(pref, x)) <= TOLERANCE);
    if (u == null) hors += r.quantite; else q.set(u, q.get(u) + r.quantite);
  }
  if (!(total > 0)) return { possible: false, motif: `aucune vente de « ${produit} » hors promotion entre le ${iso(jd)} et le ${iso(fin - 1)}` };
  const table = NIVEAUX.map((u) => ({ niveau: u, prix: prixDe(pref, u), jours: BLOC * niveaux.filter((x) => x === u).length, quantite: q.get(u) })).filter((x) => x.jours > 0)
    .map((x) => ({ ...x, par_jour: Number((x.quantite / x.jours).toFixed(3)), marge_par_jour: Number(((x.prix - cout) * x.quantite / x.jours).toFixed(2)) }));
  const max = Math.max(...table.map((x) => x.marge_par_jour)), tri = [...table].sort((a, b) => b.marge_par_jour - a.marge_par_jour || Math.abs(a.niveau) - Math.abs(b.niveau));
  const choisi = table.filter((x) => x.marge_par_jour >= max - 1e-9).sort((a, b) => Math.abs(a.niveau) - Math.abs(b.niveau))[0], second = tri.find((x) => x !== choisi);
  const anticipee = semaines < BLOCS_COURT, net = anticipee && table.length >= 2 && max > 0 && max >= 1.2 * Math.max(second?.marge_par_jour ?? 0, 0);
  const alertes = [];
  if (hors / total > 0.1) alertes.push(`${Math.round((100 * hors) / total)} % des quantités ont été vendues à un prix qui n’est pas celui du plan (remises, autre tarif) : elles ne sont pas comptées, et la lecture en est affaiblie.`);
  if (second && max > 0 && second.marge_par_jour >= 0.9 * max) alertes.push(`Décision fragile : le deuxième prix (${second.prix} €) est à moins de 10 % du premier en marge par jour.`);
  if (promo > 0) alertes.push(`${Math.round((100 * promo) / (promo + total))} % des quantités étaient signalées en promotion : elles sont écartées, parce qu’une promotion vend plus que son prix. Si elles sont nombreuses, l’essai n’a pas été conduit « toutes choses égales ».`);
  if (max <= 0) alertes.push('Aucun prix essayé ne dégage de marge avec ce coût : vérifier le coût fourni.');
  return { possible: true, produit, periode: `${iso(jd)} au ${iso(fin - 1)}`, prix_reference: pref, cout, table, ...(anticipee ? { lecture_anticipee: { semaines, net } } : {}), prix_retenu: choisi.prix, niveau_retenu: choisi.niveau, change: choisi.niveau !== 0, hors_plan_pct: Number(((100 * hors) / total).toFixed(1)), promotion_pct: Number(((100 * promo) / (promo + total)).toFixed(1)), alertes, limites: LIMITES };
}

const eur = (x) => `${Number(x).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
export function rapportPlan(p) {
  if (!p.possible) return `Essai impossible : ${p.motif}.`;
  return [`Plan d’essai de prix — ${p.produit}`, `Prix de référence : ${eur(p.prix_reference)} (médiane des ${JOURS_REF} derniers jours) · vendu ${p.jours_actifs} jours sur ${HISTORIQUE}`, '',
    'Semaine   du           au           prix        écart', ...p.semaines.map((s) => `   ${s.semaine}      ${s.du}   ${s.au}   ${eur(s.prix).padStart(10)}   ${(s.variation_pct > 0 ? '+' : '') + s.variation_pct.toLocaleString('fr-FR')} %`), '',
    `Décision possible à partir du ${p.decision_le}, avec l’export des ventes de la période et le coût unitaire.`,
    ...(p.alertes.length ? ['', 'À régler avant de lancer :', ...p.alertes.map((a) => `  - ${a}`)] : []), '', 'Ce que cet essai permet et ne permet pas :', ...p.limites.map((l) => `  - ${l}`)].join('\n');
}
export function rapportDecision(d) {
  if (!d.possible) return `Décision impossible : ${d.motif}.`;
  return [`Décision de prix — ${d.produit} (essai du ${d.periode})`, `Coût unitaire : ${eur(d.cout)} · prix de référence : ${eur(d.prix_reference)}`, '',
    'Prix essayé    jours   ventes par jour   marge par jour', ...d.table.map((x) => `${eur(x.prix).padStart(11)}   ${String(x.jours).padStart(5)}   ${x.par_jour.toLocaleString('fr-FR').padStart(15)}   ${eur(x.marge_par_jour).padStart(14)}${x.niveau === d.niveau_retenu ? '   ← retenu' : ''}`), '',
    ...(d.lecture_anticipee && !d.lecture_anticipee.net ? [`Lecture à ${d.lecture_anticipee.semaines} semaines : pas encore nette (le meilleur prix ne dépasse pas le deuxième de 20 %). Poursuivre l’essai jusqu’à 8 semaines ; le prix ci-dessous n’est qu’indicatif.`] : []),
    ...(d.lecture_anticipee?.net ? [`Lecture à ${d.lecture_anticipee.semaines} semaines : nette. On peut décider maintenant et arrêter l’essai.`] : []),
    d.change ? `Prix retenu : ${eur(d.prix_retenu)} (au lieu de ${eur(d.prix_reference)}).` : `Prix retenu : ${eur(d.prix_retenu)} — ne rien changer.`,
    ...(d.alertes.length ? ['', 'Réserves sur cette lecture :', ...d.alertes.map((a) => `  - ${a}`)] : []), '', 'Portée de cette décision :', ...d.limites.map((l) => `  - ${l}`)].join('\n');
}
