// Chaîne de livraison « essai de prix » sur les ventes d'un client. Elle applique ce que trois tests en simulation
// ont laissé debout (programme/t3, t3b, t3c) : un essai court conduit par le plan de CORTEX, puis une décision par la
// table des ventes constatées, avec le coût unitaire. Aucune loi n'entre dans la décision, et sans coût elle refuse.
// Ce que ces tests n'ont PAS établi est écrit dans chaque rapport : l'outil ne promet pas de gain.
import * as C from './adaptateurs/cortex.js';
import { PAS, NIVEAUX, BLOC, BLOCS_COURT, prixDe } from './problemes/essai-prix.js';

export const HISTORIQUE = 182, JOURS_REF = 14, TOLERANCE = 0.0051;
const med = (v) => { const s = [...v].sort((a, b) => a - b); return s.length ? s[s.length >> 1] : null; };
const sansAccent = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim().replace(/^"|"$/g, '');
const FACULTATIF = { promotion: ['promotion', 'promo', 'remise', 'en_promotion'] };
const ALIAS = { date: ['date', 'jour'], produit: ['produit', 'article', 'reference', 'designation'], quantite: ['quantite', 'qte', 'quantity'], montant: ['montant', 'total', 'ca', 'montant_ht', 'montant ht'] };
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
  const entete = L[0].split(sep).map(sansAccent), col = {};
  for (const [k, noms] of Object.entries(ALIAS)) { col[k] = entete.findIndex((e) => noms.includes(e)); if (col[k] < 0) throw new Error(`colonne « ${k} » introuvable (en-têtes lus : ${entete.join(', ')})`); }
  for (const [k, noms] of Object.entries(FACULTATIF)) col[k] = entete.findIndex((e) => noms.includes(e));
  const oui = (v) => { const x = sansAccent(String(v ?? '')); return x !== '' && x !== '0' && x !== 'non' && x !== 'false' && x !== 'n'; };
  const num = (v) => { const x = String(v ?? '').trim().replace(/\s/g, ''); return Number(sep === ',' ? x : x.replace(',', '.')); };
  const lignes = [];
  let rejetees = 0;
  for (const l of L.slice(1)) {
    const c = l.split(sep), jour = jourDe(c[col.date]), quantite = num(c[col.quantite]), montant = num(c[col.montant]), produit = (c[col.produit] ?? '').trim().replace(/^"|"$/g, '');
    if (jour == null || !produit || !(quantite > 0) || !(montant > 0)) { rejetees++; continue; }
    lignes.push({ jour, produit, quantite, montant, promotion: col.promotion >= 0 && oui(c[col.promotion]) });
  }
  return { lignes, rejetees };
}

const LIMITES = [
  'Méthode éprouvée en simulation seulement (200 entreprises simulées, trois tests) ; jamais encore sur une entreprise réelle.',
  'Établi en simulation : le prix choisi après l’essai fait mieux qu’une règle fixe pendant qu’on l’applique.',
  'NON établi : que l’essai se rembourse face à « ne rien changer ». En simulation, près d’une entreprise sur deux y perd.',
  'Une semaine à prix bas peut vendre plus que le réapprovisionnement ne soutient : la hausse des ventes est alors surestimée.',
  'Pendant l’essai, rien d’autre ne doit changer sur ce produit (promotion, publicité, rupture), sinon la lecture est faussée : sur des ventes réelles de grande distribution, l’effet lu sur le prix venait surtout des promotions.',
];

export function produitsEligibles(lignes, jd) {
  const g = new Map();
  for (const r of lignes) if (r.jour >= jd - HISTORIQUE && r.jour < jd) { const c = g.get(r.produit) ?? { lignes: 0, jours: new Set() }; c.lignes++; c.jours.add(r.jour); g.set(r.produit, c); }
  return [...g].map(([produit, c]) => ({ produit, lignes: c.lignes, jours_actifs: c.jours.size, eligible: c.jours.size >= HISTORIQUE / 2 })).sort((a, b) => b.lignes - a.lignes);
}

// Plan d'essai : 8 semaines, un prix par semaine, niveaux donnés par le plan de CORTEX (P3 gelé).
export function plan({ lignes, produit, debut, cout = null }) {
  const jd = jourDe(debut);
  if (jd == null) return { possible: false, motif: `date de début illisible : ${debut}` };
  const e = produitsEligibles(lignes, jd).find((x) => x.produit === produit);
  if (!e) return { possible: false, motif: `aucune vente de « ${produit} » dans les ${HISTORIQUE} jours avant le ${iso(jd)}` };
  if (!e.eligible) return { possible: false, motif: `« ${produit} » n’est vendu que ${e.jours_actifs} jours sur ${HISTORIQUE} : il en faut au moins un sur deux pour qu’un essai de ${BLOCS_COURT} semaines se lise` };
  const ref = med(lignes.filter((r) => r.produit === produit && r.jour >= jd - JOURS_REF && r.jour < jd).map((r) => r.montant / r.quantite));
  if (!ref) return { possible: false, motif: `aucune vente de « ${produit} » dans les ${JOURS_REF} jours avant le début : pas de prix de référence` };
  const pref = Math.round(ref * 100) / 100, niveaux = C.planActif({ text: '1 / p', f: (u) => PAS ** -u[0] }).plan.slice(0, BLOCS_COURT).map((u) => u[0]);
  const semaines = niveaux.map((u, b) => ({ semaine: b + 1, du: iso(jd + BLOC * b), au: iso(jd + BLOC * b + BLOC - 1), niveau: u, prix: prixDe(pref, u), variation_pct: Number((100 * (prixDe(pref, u) / pref - 1)).toFixed(1)) }));
  const alertes = [];
  if (cout != null && semaines.some((s) => s.prix <= cout)) alertes.push(`Le prix bas (${Math.min(...semaines.map((s) => s.prix))} €) est sous le coût (${cout} €) : ces semaines se vendent à perte. À discuter avant de lancer.`);
  if (cout == null) alertes.push('Coût unitaire non fourni : il sera indispensable pour décider. Sans coût, on maximise le chiffre d’affaires et, en simulation, on y perd.');
  return { possible: true, produit, debut: iso(jd), decision_le: iso(jd + BLOC * BLOCS_COURT), prix_reference: pref, jours_actifs: e.jours_actifs, semaines, alertes, limites: LIMITES };
}

// Décision après l'essai : parmi les prix essayés, celui qui maximise (prix − coût) × ventes par jour constatées.
// Une vente est rattachée à un prix par son propre prix unitaire, et un prix ne reçoit rien avant sa première semaine.
export function decider({ lignes, produit, debut, prix_reference, cout }) {
  const jd = jourDe(debut), pref = Number(prix_reference);
  if (jd == null || !(pref > 0)) return { possible: false, motif: 'date de début ou prix de référence illisible' };
  if (!(cout > 0)) return { possible: false, motif: 'coût unitaire manquant : sans lui la décision se prend sur le chiffre d’affaires, ce qui a perdu plus de la moitié du gain dans les trois tests' };
  const niveaux = C.planActif({ text: '1 / p', f: (u) => PAS ** -u[0] }).plan.slice(0, BLOCS_COURT).map((u) => u[0]), fin = jd + BLOC * BLOCS_COURT;
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
  const alertes = [];
  if (hors / total > 0.1) alertes.push(`${Math.round((100 * hors) / total)} % des quantités ont été vendues à un prix qui n’est pas celui du plan (remises, autre tarif) : elles ne sont pas comptées, et la lecture en est affaiblie.`);
  if (second && max > 0 && second.marge_par_jour >= 0.9 * max) alertes.push(`Décision fragile : le deuxième prix (${second.prix} €) est à moins de 10 % du premier en marge par jour.`);
  if (promo > 0) alertes.push(`${Math.round((100 * promo) / (promo + total))} % des quantités étaient signalées en promotion : elles sont écartées, parce qu’une promotion vend plus que son prix. Si elles sont nombreuses, l’essai n’a pas été conduit « toutes choses égales ».`);
  if (max <= 0) alertes.push('Aucun prix essayé ne dégage de marge avec ce coût : vérifier le coût fourni.');
  return { possible: true, produit, periode: `${iso(jd)} au ${iso(fin - 1)}`, prix_reference: pref, cout, table, prix_retenu: choisi.prix, niveau_retenu: choisi.niveau, change: choisi.niveau !== 0, hors_plan_pct: Number(((100 * hors) / total).toFixed(1)), promotion_pct: Number(((100 * promo) / (promo + total)).toFixed(1)), alertes, limites: LIMITES };
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
    d.change ? `Prix retenu : ${eur(d.prix_retenu)} (au lieu de ${eur(d.prix_reference)}).` : `Prix retenu : ${eur(d.prix_retenu)} — ne rien changer.`,
    ...(d.alertes.length ? ['', 'Réserves sur cette lecture :', ...d.alertes.map((a) => `  - ${a}`)] : []), '', 'Portée de cette décision :', ...d.limites.map((l) => `  - ${l}`)].join('\n');
}
