import { test } from 'node:test';
import assert from 'node:assert/strict';
import { controler } from '../src/controle-journal.js';

test('contrôle du journal : retire les copies exactes, corrige un montant dix fois trop grand, lève l’alerte', () => {
  const ligne = (i, extra = {}) => ({ id: `r${i}`, jour: i, source: 's', libelle: `l${i}`, montant: 20, quantite: -2, objet: 'o', contrepartie: null, auteur: 'a', reference: null, ...extra });
  const journal = Array.from({ length: 20 }, (_, i) => ligne(i));
  journal.push({ ...journal[3], id: 'r3~d' });                         // copie exacte
  journal.push(ligne(30, { montant: 200 }));                           // prix unitaire dix fois trop grand
  journal.push(ligne(31, { montant: 60 }));                            // trois fois : on n'y touche pas
  const { observe, rapport } = controler({ jours: 365, journal, releves: [] });
  assert.equal(rapport.copies_retirees, 1); assert.equal(rapport.montants_corriges, 1); assert.equal(rapport.alerte, true);
  assert.equal(observe.journal.length, 22); assert.equal(observe.journal.find((r) => r.id === 'r30').montant, 20); assert.equal(observe.journal.find((r) => r.id === 'r31').montant, 60);
  assert.equal(journal.find((r) => r.id === 'r30').montant, 200);     // l'entrée n'est pas modifiée
  assert.equal(controler({ jours: 365, journal: journal.slice(0, 20), releves: [] }).rapport.alerte, false);
});
