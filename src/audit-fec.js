// Audit des comptes de tiers sur un fichier des écritures comptables (FEC, format légal français).
// Contrôles déterministes, sans moteur : chaque anomalie cite ses écritures et se vérifie pièce en main.
// Ce que l'outil trouve est de l'argent À RÉCLAMER — jamais de l'argent encaissé.
const nombre = (x) => Number(String(x ?? '').replace(/\s/g, '').replace(',', '.')) || 0;
const jour = (x) => { const s = String(x ?? '').replace(/\D/g, ''); return s.length >= 8 ? Date.UTC(+s.slice(0, 4), +s.slice(4, 6) - 1, +s.slice(6, 8)) / 864e5 : null; };
const cents = (x) => Math.round(x * 100);
const eur = (c) => c / 100;

export function lireFEC(texte) {
  const lignes = texte.replace(/^﻿/, '').split(/\r?\n/).filter((l) => l.trim());
  if (lignes.length < 2) throw new Error('fichier vide');
  const sep = lignes[0].includes('\t') ? '\t' : lignes[0].includes('|') ? '|' : ';';
  const tete = lignes[0].split(sep).map((c) => c.trim().toLowerCase());
  const col = (n) => tete.indexOf(n.toLowerCase());
  for (const c of ['EcritureNum', 'EcritureDate', 'CompteNum']) if (col(c) < 0) throw new Error(`colonne FEC manquante : ${c}`);
  const sens = col('Sens') >= 0 && col('Montant') >= 0; // variante Montant/Sens admise par la norme
  if (!sens && (col('Debit') < 0 || col('Credit') < 0)) throw new Error('colonnes Debit/Credit ou Montant/Sens manquantes');
  return lignes.slice(1).map((l, i) => {
    const c = l.split(sep), v = (n) => (col(n) >= 0 ? (c[col(n)] ?? '').trim() : '');
    const m = nombre(v('Montant'));
    return {
      ligne: i + 2, ecriture: `${v('JournalCode')}/${v('EcritureNum')}`, date: v('EcritureDate'), jour: jour(v('EcritureDate')), compte: v('CompteNum'),
      tiers: v('CompAuxNum') || v('CompteNum'), piece: v('PieceRef'), lettre: v('EcritureLet') || v('EcritureLettrage'),
      debit: cents(sens ? (/^d/i.test(v('Sens')) ? m : 0) : nombre(v('Debit'))), credit: cents(sens ? (/^c/i.test(v('Sens')) ? m : 0) : nombre(v('Credit'))),
    };
  });
}

const groupes = (xs, cle) => { const m = new Map(); for (const x of xs) { const k = cle(x); if (!m.has(k)) m.set(k, []); m.get(k).push(x); } return m; };
const reference = (p) => p.toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/^0+/, '');

export function auditer(E, { fenetre_j = 60, anciennete_j = 90, seuil_eur = 1 } = {}) {
  // contrôle de lecture : un fichier déséquilibré est un fichier mal lu, aucun résultat n'en est tiré
  const ecart = E.reduce((s, e) => s + e.debit - e.credit, 0);
  if (ecart !== 0) throw new Error(`fichier déséquilibré de ${eur(ecart)} € : lecture non fiable, audit refusé`);
  if (E.some((e) => e.jour == null)) throw new Error('date d’écriture illisible : audit refusé');
  const fin = Math.max(...E.map((e) => e.jour));
  const F = E.filter((e) => e.compte.startsWith('401')), C = E.filter((e) => e.compte.startsWith('411'));

  // 1. facture fournisseur comptabilisée deux fois : même tiers, même montant, même référence de pièce, écritures distinctes
  const doubles = [];
  for (const g of groupes(F.filter((e) => e.credit > 0 && reference(e.piece)), (e) => `${e.tiers}|${e.credit}|${reference(e.piece)}`).values()) {
    const u = [...new Map(g.map((e) => [e.ecriture, e])).values()].sort((a, b) => a.jour - b.jour);
    for (let i = 1; i < u.length; i++) if (u[i].jour - u[i - 1].jour <= fenetre_j) doubles.push({ tiers: u[i].tiers, piece: u[i].piece, montant_eur: eur(u[i].credit), ecritures: [u[i - 1].ecriture, u[i].ecriture], dates: [u[i - 1].date, u[i].date] });
  }
  // 2. fournisseur débiteur à la date de fin : il doit de l'argent (trop-payé, double règlement, avoir non récupéré)
  const debiteurs = [];
  for (const [t, g] of groupes(F, (e) => e.tiers)) { const s = g.reduce((x, e) => x + e.debit - e.credit, 0); if (s > seuil_eur * 100) debiteurs.push({ tiers: t, montant_eur: eur(s), ecritures: [...new Set(g.filter((e) => e.debit > 0).map((e) => e.ecriture))] }); }
  // 3. créance client ancienne : facture non lettrée de plus de `anciennete_j` jours, chez un client encore débiteur
  const lettrage = C.some((e) => e.lettre);
  const anciennes = [];
  for (const [t, g] of groupes(C, (e) => e.tiers)) {
    const solde = g.reduce((x, e) => x + e.debit - e.credit, 0);
    if (solde <= seuil_eur * 100) continue;
    const vieilles = g.filter((e) => e.debit > 0 && fin - e.jour > anciennete_j && (lettrage ? !e.lettre : true));
    const m = Math.min(solde, vieilles.reduce((x, e) => x + e.debit, 0));
    if (m > seuil_eur * 100) anciennes.push({ tiers: t, montant_eur: eur(m), ecritures: vieilles.map((e) => e.ecriture), plus_ancienne: vieilles.reduce((a, e) => (e.jour < a.jour ? e : a)).date });
  }
  const total = (xs) => Math.round(xs.reduce((s, x) => s + x.montant_eur, 0) * 100) / 100;
  return {
    lu: { lignes: E.length, ecritures: new Set(E.map((e) => e.ecriture)).size, du: E.reduce((a, e) => (e.jour < a.jour ? e : a)).date, au: E.reduce((a, e) => (e.jour > a.jour ? e : a)).date, lettrage_clients: lettrage },
    factures_en_double: { cas: doubles, montant_eur: total(doubles) },
    fournisseurs_debiteurs: { cas: debiteurs, montant_eur: total(debiteurs) },
    creances_anciennes: { cas: anciennes, montant_eur: total(anciennes) },
    nature: 'montants à vérifier pièce en main puis à réclamer ; aucun euro n’est encaissé tant qu’un tiers n’a pas payé',
  };
}
