import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lireFEC, auditer } from '../src/audit-fec.js';

const TETE = 'JournalCode\tJournalLib\tEcritureNum\tEcritureDate\tCompteNum\tCompteLib\tCompAuxNum\tCompAuxLib\tPieceRef\tPieceDate\tEcritureLib\tDebit\tCredit\tEcritureLet\tDateLet\tValidDate\tMontantdevise\tIdevise';
const L = (j, n, d, compte, aux, piece, debit, credit, let_ = '') => [j, '', n, d, compte, '', aux, '', piece, d, '', debit, credit, let_, '', d, '', ''].join('\t');
// achat = charge au débit, fournisseur au crédit ; règlement = fournisseur au débit, banque au crédit
const achat = (n, d, f, piece, m) => [L('AC', n, d, '606000', '', piece, m, '0,00'), L('AC', n, d, '401000', f, piece, '0,00', m)];
const paie = (n, d, f, m) => [L('BQ', n, d, '401000', f, '', m, '0,00'), L('BQ', n, d, '512000', '', '', '0,00', m)];
const vente = (n, d, c, piece, m, l = '') => [L('VT', n, d, '411000', c, piece, m, '0,00', l), L('VT', n, d, '706000', '', piece, '0,00', m)];
const encaisse = (n, d, c, m, l = '') => [L('BQ', n, d, '512000', '', '', m, '0,00'), L('BQ', n, d, '411000', c, '', '0,00', m, l)];

const FEC = [TETE,
  ...achat('1', '20250110', 'F1', 'FA-0012', '100,00'), ...achat('2', '20250120', 'F1', 'FA 0012', '100,00'), // même facture saisie deux fois
  ...achat('3', '20250105', 'F2', 'AB-01', '49,90'), ...achat('4', '20250205', 'F2', 'AB-02', '49,90'),       // abonnement : même montant, pièces différentes
  ...achat('5', '20250301', 'F3', 'F3-77', '250,00'), ...paie('6', '20250315', 'F3', '250,00'), ...paie('7', '20250320', 'F3', '250,00'), // réglé deux fois
  ...vente('8', '20250115', 'C1', 'V1', '500,00'),                                                              // jamais encaissée
  ...vente('9', '20250116', 'C2', 'V2', '300,00', 'AA'), ...encaisse('10', '20250210', 'C2', '300,00', 'AA'),   // encaissée et lettrée
  ...vente('11', '20250901', 'C3', 'V3', '80,00'),                                                              // récente
  ...achat('12', '20250930', 'F2', 'AB-09', '49,90'),
].join('\r\n');

test('audit FEC : trouve les anomalies plantées, et elles seules', () => {
  const r = auditer(lireFEC(FEC));
  assert.equal(r.lu.lignes, 24);
  assert.deepEqual(r.factures_en_double.cas.map((c) => [c.tiers, c.montant_eur, c.ecritures]), [['F1', 100, ['AC/1', 'AC/2']]]);
  assert.deepEqual(r.fournisseurs_debiteurs.cas.map((c) => [c.tiers, c.montant_eur]), [['F3', 250]]);
  assert.deepEqual(r.creances_anciennes.cas.map((c) => [c.tiers, c.montant_eur, c.plus_ancienne]), [['C1', 500, '20250115']]);
});

test('audit FEC : un fichier déséquilibré ou sans colonnes n’est pas audité', () => {
  assert.throws(() => auditer(lireFEC(FEC + '\r\n' + L('OD', '99', '20250930', '471000', '', '', '10,00', '0,00'))), /déséquilibré/);
  assert.throws(() => lireFEC('a;b\n1;2'), /colonne FEC manquante/);
});

test('audit FEC : variante Montant/Sens, séparateur barre verticale, sans lettrage', () => {
  const t = 'JournalCode|EcritureNum|EcritureDate|CompteNum|CompAuxNum|PieceRef|Montant|Sens|EcritureLet';
  const f = [t, 'VT|1|20250101|411000|C9|V9|120.50|D|', 'VT|1|20250101|706000||V9|120.50|C|', 'VT|2|20250801|411000|C8|V8|10.00|D|', 'VT|2|20250801|706000||V8|10.00|C|'].join('\n');
  const r = auditer(lireFEC(f));
  assert.equal(r.lu.lettrage_clients, false);
  assert.deepEqual(r.creances_anciennes.cas.map((c) => [c.tiers, c.montant_eur]), [['C9', 120.5]]);
});
