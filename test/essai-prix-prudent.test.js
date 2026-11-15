import { test } from 'node:test';
import assert from 'node:assert/strict';
import { eRequise, ecarte, planPrudent, E_MAX } from '../src/problemes/essai-prix-prudent.js';

test('plan prudent T3g : sensibilité requise, niveaux écartés, repli', () => {
  assert.equal(E_MAX, 4);
  assert.ok(Math.abs(eRequise(1.4, 1, 1.12) - Math.log(0.4 / 0.12) / Math.log(1.25)) < 1e-12);   // marge 1,4, baisse de 20 % : 5,4
  assert.equal(eRequise(1.2, 1, 0.96), Infinity);                                                 // prix sous le coût
  const S = [-1, 0, 1, -1, 1, 1, -1, 0];
  assert.deepEqual(planPrudent(S, 14, 10), [0, 0, 1, 0, 1, 1, 0, 0]);             // marge 1,40 : −1 et −0,5 écartés
  assert.deepEqual(planPrudent(S, 14.6, 10), [-0.5, 0, 1, -0.5, 1, 1, -0.5, 0]);   // marge 1,46 : −1 écarté, −0,5 admis
  assert.deepEqual(planPrudent(S, 16, 10), S);                                     // marge 1,60 : rien n'est écarté
  assert.deepEqual(planPrudent(S, 16, null), S);                                   // coût indisponible : plan inchangé
  assert.deepEqual(planPrudent(S, 9, 10), [0, 0, 1, 0, 1, 1, 0, 0]);               // prix de référence sous le coût
  assert.equal(ecarte(14, 10, 1), false);                                          // aucune hausse n'est écartée
});
