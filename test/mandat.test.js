import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Registre } from '../src/registre.js';
import { classer, consigner, engage, etat } from '../src/mandat.js';

const neuf = () => new Registre(join(mkdtempSync(join(tmpdir(), 'mandat-')), 'journal.jsonl'));
const M0 = { depense_max_eur: 0, contacts: 'brouillons' };
const libre = { depense_eur: 0, tiers: false, engagement: false, irreversible: false };

test('mandat : une action gratuite, interne et défaisable s’exécute d’initiative', () => {
  assert.deepEqual(classer(M0, 0, libre), { decision: 'exécutée', motifs: [] });
});

test('mandat : aucune dépense au-delà du plafond, cumul compris', () => {
  assert.equal(classer(M0, 0, { ...libre, depense_eur: 1 }).decision, 'à valider');
  const M50 = { depense_max_eur: 50, contacts: 'brouillons' };
  assert.equal(classer(M50, 0, { ...libre, depense_eur: 45 }).decision, 'exécutée');
  assert.equal(classer(M50, 45, { ...libre, depense_eur: 10 }).decision, 'à valider');
  assert.throws(() => classer(M50, 0, { ...libre, depense_eur: undefined }));
});

test('mandat : un message à un tiers reste un brouillon tant que l’envoi n’est pas autorisé', () => {
  assert.equal(classer(M0, 0, { ...libre, tiers: true }).decision, 'à valider');
  assert.equal(classer({ ...M0, contacts: 'envoi autorisé' }, 0, { ...libre, tiers: true }).decision, 'exécutée');
});

test('mandat : engagement et irréversible attendent toujours le propriétaire ; fictif et illégal sont interdits', () => {
  const large = { depense_max_eur: 1000, contacts: 'envoi autorisé' };
  assert.equal(classer(large, 0, { ...libre, engagement: true }).decision, 'à valider');
  assert.equal(classer(large, 0, { ...libre, irreversible: true }).decision, 'à valider');
  assert.equal(classer(large, 0, { ...libre, fictif: true }).decision, 'interdite');
  assert.equal(classer(large, 0, { ...libre, illegal: true }).decision, 'interdite');
});

test('mandat : le journal tient le compte de l’argent engagé et la file d’attente ; la chaîne reste intacte', () => {
  const reg = neuf(), M = { depense_max_eur: 30, contacts: 'brouillons' };
  consigner(reg, M, { cle: 'a', action: 'achat d’un échantillon', nature: { ...libre, depense_eur: 20 } });
  const b = consigner(reg, M, { cle: 'b', action: 'second achat', nature: { ...libre, depense_eur: 20 } });
  assert.equal(b.decision, 'à valider');
  consigner(reg, M, { cle: 'c', action: 'proposer un audit à un tiers', nature: { ...libre, tiers: true } });
  assert.equal(engage(reg), 20);
  assert.deepEqual(etat(reg, M).a_valider.map((r) => r.cle), ['b', 'c']);
  // le propriétaire valide « c » : l'attente est levée ; il abandonne « b » : rien n'est dépensé
  assert.equal(consigner(reg, M, { cle: 'c', action: 'proposer un audit à un tiers', nature: { ...libre, tiers: true } }, { valide: true }).validation, 'propriétaire');
  consigner(reg, M, { cle: 'b', action: 'second achat', nature: { ...libre, depense_eur: 20 } }, { abandon: true });
  const e = etat(reg, M);
  assert.equal(e.a_valider.length, 0);
  assert.equal(e.engage_eur, 20);
  assert.equal(e.reste_eur, 10);
  assert.ok(reg.verifier().ok);
});

test('mandat : une interdiction ne se lève pas par validation, et le journal refuse une exécution à risque non validée', () => {
  const reg = neuf();
  assert.equal(consigner(reg, M0, { cle: 'x', action: 'annoncer une vente qui n’a pas eu lieu', nature: { ...libre, fictif: true } }, { valide: true }).decision, 'interdite');
  assert.throws(() => reg.ajouter({ probleme: 'mandat#1', type: 'initiative', auteur: 'registre', cle: 'y', action: 'payer', nature: { depense_eur: 5 }, decision: 'exécutée', motifs: ['au-delà du plafond'] }), /validation du propriétaire/);
});
