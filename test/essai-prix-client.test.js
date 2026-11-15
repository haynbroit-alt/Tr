// Outil de livraison « essai de prix » : lecture d'un export de ventes, plan, décision, refus.
import test from 'node:test';
import assert from 'node:assert/strict';
import { lireVentes, plan, decider, jourDe, produitsEligibles } from '../src/essai-prix-client.js';

const iso = (n) => new Date(n * 86400000).toISOString().slice(0, 10), J0 = jourDe('2026-01-01'), DEBUT = J0 + 182;
// 182 jours à 10 €, 5 unités par jour ; puis 8 semaines au prix du plan, demande 5 × (prix ÷ 10)^−2
function ventes({ rare = false } = {}) {
  const L = ['Date;Produit;Quantité;Montant'];
  for (let t = 0; t < 182; t++) if (!rare || t % 3 === 0) L.push(`${iso(J0 + t)};lampe;5;50,00`);
  const prix = [8, 10, 12.5, 8, 12.5, 12.5, 8, 10];
  for (let b = 0; b < 8; b++) for (let j = 0; j < 7; j++) { const q = Math.round(5 * (prix[b] / 10) ** -2); L.push(`${iso(DEBUT + 7 * b + j)};lampe;${q};${(q * prix[b]).toFixed(2).replace('.', ',')}`); }
  return L.join('\n');
}

test('lecture : en-têtes accentués, virgule décimale, deux formats de date, lignes illisibles comptées', () => {
  const { lignes, rejetees } = lireVentes('date;article;qte;total\n2026-03-01;a;2;7,50\n02/03/2026;a;1;3,75\n2026-03-03;a;zéro;1\n;a;1;1');
  assert.equal(lignes.length, 2); assert.equal(rejetees, 2);
  assert.equal(lignes[1].jour - lignes[0].jour, 1); assert.equal(lignes[0].montant, 7.5);
  assert.throws(() => lireVentes('date;produit;montant\n2026-03-01;a;1'), /quantite/);
});

test('plan : huit semaines, niveaux du plan de CORTEX, prix au centime', () => {
  const { lignes } = lireVentes(ventes()), p = plan({ lignes, produit: 'lampe', debut: iso(DEBUT) });
  assert.equal(p.possible, true); assert.equal(p.prix_reference, 10);
  assert.deepEqual(p.semaines.map((s) => s.niveau), [-1, 0, 1, -1, 1, 1, -1, 0]);
  assert.deepEqual(p.semaines.map((s) => s.prix), [8, 10, 12.5, 8, 12.5, 12.5, 8, 10]);
  assert.equal(p.decision_le, iso(DEBUT + 56));
  assert.match(p.alertes.join(' '), /Coût unitaire non fourni/);
  assert.match(plan({ lignes, produit: 'lampe', debut: iso(DEBUT), cout: 9 }).alertes.join(' '), /sous le coût/);
});

test('plan : un produit vendu moins d’un jour sur deux est refusé, et dit pourquoi', () => {
  const { lignes } = lireVentes(ventes({ rare: true })), p = plan({ lignes, produit: 'lampe', debut: iso(DEBUT) });
  assert.equal(p.possible, false); assert.match(p.motif, /61 jours sur 182/);
  assert.equal(produitsEligibles(lignes, DEBUT)[0].eligible, false);
  assert.equal(plan({ lignes, produit: 'inconnu', debut: iso(DEBUT) }).possible, false);
});

test('décision : le prix qui maximise (prix − coût) × ventes par jour, parmi les prix essayés', () => {
  const { lignes } = lireVentes(ventes());
  // ventes par jour : 8 à 8 €, 5 à 10 €, 3 à 12,50 € ; avec un coût de 6 € : 16, 20 et 19,5 € par jour
  const d = decider({ lignes, produit: 'lampe', debut: iso(DEBUT), prix_reference: 10, cout: 6 });
  assert.equal(d.possible, true); assert.equal(d.niveau_retenu, 0); assert.equal(d.change, false);
  assert.deepEqual(d.table.map((x) => x.marge_par_jour), [16, 20, 19.5]);
  assert.match(d.alertes.join(' '), /fragile/);
  // avec un coût de 2 € : 48, 40 et 31,5 € par jour → baisser
  assert.equal(decider({ lignes, produit: 'lampe', debut: iso(DEBUT), prix_reference: 10, cout: 2 }).niveau_retenu, -1);
});

test('décision : sans coût elle refuse ; les ventes hors plan sont comptées à part', () => {
  const { lignes } = lireVentes(ventes());
  assert.equal(decider({ lignes, produit: 'lampe', debut: iso(DEBUT), prix_reference: 10, cout: null }).possible, false);
  const remises = [...lignes, ...Array.from({ length: 40 }, (_, i) => ({ jour: DEBUT + i, produit: 'lampe', quantite: 3, montant: 21 }))];
  const d = decider({ lignes: remises, produit: 'lampe', debut: iso(DEBUT), prix_reference: 10, cout: 6 });
  assert.ok(d.hors_plan_pct > 10); assert.match(d.alertes.join(' '), /prix qui n’est pas celui du plan/);
  assert.deepEqual(d.table.map((x) => x.quantite), [168, 70, 63]);
});

test('décision : les ventes signalées en promotion sont écartées et comptées', () => {
  const { lignes } = lireVentes(ventes());
  // une promotion gonfle les ventes au prix haut pendant ses trois semaines : sans la colonne, elle fausse la lecture
  const avec = [...lignes, ...Array.from({ length: 21 }, (_, i) => ({ jour: DEBUT + [14, 28, 35][Math.floor(i / 7)] + (i % 7), produit: 'lampe', quantite: 6, montant: 75, promotion: true }))];
  const sans = avec.map((r) => ({ ...r, promotion: false }));
  assert.equal(decider({ lignes: sans, produit: 'lampe', debut: iso(DEBUT), prix_reference: 10, cout: 6 }).niveau_retenu, 1);
  const d = decider({ lignes: avec, produit: 'lampe', debut: iso(DEBUT), prix_reference: 10, cout: 6 });
  assert.equal(d.niveau_retenu, 0); assert.ok(d.promotion_pct > 20); assert.match(d.alertes.join(' '), /signalées en promotion/);
  const lu = lireVentes('date;produit;quantite;montant;promo\n2026-03-01;a;2;7,50;oui\n2026-03-02;a;1;3,75;0\n2026-03-03;a;1;3,75;');
  assert.deepEqual(lu.lignes.map((r) => r.promotion), [true, false, false]);
});

test('plan prudent (T3g) : avec un coût, les baisses non rentables sont écartées, et la décision relit le même plan', () => {
  const { lignes } = lireVentes(ventes());
  const p = plan({ lignes, produit: 'lampe', debut: iso(DEBUT), cout: 7.2 });           // marge 1,39 : −20 % et −10,6 % écartés
  assert.deepEqual(p.semaines.map((s) => s.niveau), [0, 0, 1, 0, 1, 1, 0, 0]);
  assert.deepEqual(p.ecartes.map((x) => x.niveau), [-1]);
  assert.match(p.alertes.join(' '), /écartée du plan : pour qu’elle rapporte/);
  assert.deepEqual(plan({ lignes, produit: 'lampe', debut: iso(DEBUT), cout: 6.8 }).semaines.map((s) => s.niveau), [-0.5, 0, 1, -0.5, 1, 1, -0.5, 0]);   // marge 1,47
  assert.deepEqual(plan({ lignes, produit: 'lampe', debut: iso(DEBUT), cout: 6 }).semaines.map((s) => s.niveau), [-1, 0, 1, -1, 1, 1, -1, 0]);            // marge 1,67 : plan complet
  // décision : par défaut le plan relu est celui du coût fourni ; --plan-standard relit le plan complet
  const d = decider({ lignes, produit: 'lampe', debut: iso(DEBUT), prix_reference: 10, cout: 7.2 });
  assert.equal(d.possible, true); assert.deepEqual(d.table.map((x) => x.niveau), [0, 1]);
  assert.deepEqual(decider({ lignes, produit: 'lampe', debut: iso(DEBUT), prix_reference: 10, cout: 7.2, plan_standard: true }).table.map((x) => x.niveau), [-1, 0, 1]);
  assert.deepEqual(decider({ lignes, produit: 'lampe', debut: iso(DEBUT), prix_reference: 10, cout: 7.2, cout_plan: 6 }).table.map((x) => x.niveau), [-1, 0, 1]);
});

test('lecture anticipée à quatre semaines : dit si la décision est nette', () => {
  const { lignes } = lireVentes(ventes());
  const d = decider({ lignes, produit: 'lampe', debut: iso(DEBUT), prix_reference: 10, cout: 6, semaines: 4 });
  assert.equal(d.possible, true); assert.equal(d.lecture_anticipee.semaines, 4); assert.equal(typeof d.lecture_anticipee.net, 'boolean');
  assert.equal(d.table.reduce((s, x) => s + x.jours, 0), 28);
  assert.equal(decider({ lignes, produit: 'lampe', debut: iso(DEBUT), prix_reference: 10, cout: 6 }).lecture_anticipee, undefined);
  assert.equal(decider({ lignes, produit: 'lampe', debut: iso(DEBUT), prix_reference: 10, cout: 6, semaines: 5 }).possible, false);
});

test('lecture d’un export de commandes en ligne : guillemets, prix unitaire, en-têtes anglais', () => {
  const csv = 'Name,Created at,Lineitem quantity,Lineitem name,Lineitem price\n#1001,2026-03-01 10:22:33 +0100,2,"T-shirt, bleu",12.50\n#1002,2026-03-02 09:00:00 +0100,1,"Mug ""classique""",8\n#1003,pas une date,1,X,3';
  const { lignes, rejetees } = lireVentes(csv);
  assert.equal(lignes.length, 2); assert.equal(rejetees, 1);
  assert.equal(lignes[0].produit, 'T-shirt, bleu'); assert.equal(lignes[0].quantite, 2); assert.equal(lignes[0].montant, 25);
  assert.equal(lignes[1].produit, 'Mug "classique"'); assert.equal(lignes[1].montant, 8);
});
