import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Registre } from '../src/registre.js';
import { integrite, graineDev, RACINE } from '../src/adaptateurs/moteurs.js';
import * as C from '../src/adaptateurs/cortex.js';
import * as L from '../src/adaptateurs/lavoisier.js';

const neuf = () => new Registre(join(mkdtempSync(join(tmpdir(), 'commun-')), 'j.jsonl'));
const pb = (r) => r.ajouter({ type: 'probleme', cle: 'p', probleme: 'p', auteur: 'registre', titre: 't', question: 'q', source: {} });
const aff = (r, auteur = 'GALILÉE', niveau = 'hypothèse') => r.ajouter({ type: 'affirmation', probleme: 'p', auteur, moteur: { commit: 'abc' }, sujet: 's', enonce: 'e', certitude: { niveau }, preuve: { methode: 'm', reproduire: 'cmd' }, cout: { calcul_s: 1 } });

test('les moteurs gelés sont identiques aux commits consignés', () => {
  const i = integrite();
  assert.deepEqual(i.erreurs, []);
  assert.equal(i.fichiers, 33);
});

test('la copie de GALILÉE embarquée par CORTEX est celle du dépôt GALILÉE', () => {
  for (const f of ['agent', 'expr', 'fit', 'search', 'worlds']) assert.equal(readFileSync(join(RACINE, `moteurs/galilee/src/${f}.js`), 'utf8'), readFileSync(join(RACINE, `moteurs/cortex/research/v6/vendor/galilee/${f}.js`), 'utf8'));
});

test('le registre détecte une ligne modifiée après coup', () => {
  const r = neuf(); pb(r); aff(r);
  assert.ok(r.verifier().ok);
  const lignes = readFileSync(r.chemin, 'utf8').replace('"e"', '"autre chose"');
  writeFileSync(r.chemin, lignes);
  assert.equal(new Registre(r.chemin).verifier().ok, false);
});

test('une affirmation sans preuve reproductible ou sans coût est refusée', () => {
  const r = neuf(); pb(r);
  assert.throws(() => r.ajouter({ type: 'affirmation', probleme: 'p', auteur: 'CORTEX', moteur: { commit: 'a' }, sujet: 's', enonce: 'e', certitude: { niveau: 'hypothèse' }, preuve: { methode: 'm' }, cout: {} }), /reproduire/);
  assert.throws(() => r.ajouter({ type: 'affirmation', probleme: 'p', auteur: 'CORTEX', moteur: { commit: 'a' }, sujet: 's', enonce: 'e', certitude: { niveau: 'certain' }, preuve: { methode: 'm', reproduire: 'c' }, cout: {} }), /niveau/);
  assert.throws(() => r.ajouter({ type: 'affirmation', probleme: 'p', auteur: 'CORTEX', moteur: { commit: 'a' }, sujet: 's', enonce: 'e', certitude: { niveau: 'hypothèse' }, preuve: { methode: 'm', reproduire: 'c' } }), /cout/);
});

test('personne ne vérifie sa propre affirmation', () => {
  const r = neuf(); pb(r); const a = aff(r, 'GALILÉE');
  assert.throws(() => r.ajouter({ type: 'verification', probleme: 'p', auteur: 'GALILÉE', cible: a, methode: 'm', portee: 'pari', verdict: 'confirme' }), /propre/);
});

test('seul un pari gagné élève un niveau ; une réfutation l’emporte ; la vérité du banc ne change rien', () => {
  const r = neuf(); pb(r); const a = aff(r), b = aff(r), c = aff(r);
  r.ajouter({ type: 'verification', probleme: 'p', auteur: 'registre', cible: a, methode: 'm', portee: 'prevision', verdict: 'confirme', eleve_a: 'empirique' });
  r.ajouter({ type: 'verification', probleme: 'p', auteur: 'banc', cible: a, methode: 'm', portee: 'verite-du-banc', verdict: 'refute' });
  r.ajouter({ type: 'contestation', probleme: 'p', auteur: 'CORTEX', cible: b, motif: 'pari perdu' });
  assert.equal(r.etat()[1].contestee, true);
  r.ajouter({ type: 'verification', probleme: 'p', auteur: 'CORTEX', cible: b, methode: 'm', portee: 'pari', verdict: 'confirme', eleve_a: 'empirique' });
  r.ajouter({ type: 'verification', probleme: 'p', auteur: 'registre', cible: c, methode: 'm', portee: 'prevision', verdict: 'refute' });
  const [ea, eb, ec] = r.etat();
  assert.equal(ea.niveau, 'hypothèse'); assert.equal(ea.banc, 'refute');
  assert.equal(eb.niveau, 'empirique'); assert.equal(eb.contestee, false); assert.equal(eb.decidable, true);
  assert.equal(ec.niveau, 'réfutée'); assert.equal(ec.decidable, false);
});

test('les graines de test des moteurs sont refusées', () => {
  for (const g of [0, 101, 3001, 5001, 5300]) assert.throws(() => graineDev(g), /refusée/);
  assert.throws(() => L.entreprise(5001), /refusée/);
  assert.throws(() => C.sonder(5001, 'forme'), /refusée/);
});

test('la vérité d’une entreprise reste scellée tant qu’on ne l’ouvre pas', () => {
  const E = L.entreprise(2);
  assert.throws(() => E.verite.hidden, /interdit/);
  E.ouvrir();
  assert.ok(Array.isArray(E.verite.hidden));
});

test('CORTEX refuse des données qu’il ne sait pas traiter', () => {
  const Y = Array.from({ length: 120 }, () => [0, 0, 0]);
  assert.throws(() => C.modesCaches({ Y, U: Y.map(() => [0]) }), /deux leviers/);
});

test('le registre publié est intact', () => {
  const r = new Registre(join(RACINE, 'registre', 'journal.jsonl'));
  const v = r.verifier();
  assert.deepEqual(v.erreurs, []);
  assert.ok(v.lignes > 0);
  for (const p of r.lignes.filter((x) => x.type === "piste")) assert.equal(p.argent_reel, 0);
});
