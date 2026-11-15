import { test } from 'node:test';
import assert from 'node:assert/strict';
import { zone, SEUIL_BAS, SEUIL_HAUT } from '../src/problemes/essai-prix-marge.js';

test('règle de marge T3f : seuils du protocole, bornes strictes, coût indisponible au milieu', () => {
  assert.equal(SEUIL_BAS, 1.4); assert.equal(SEUIL_HAUT, 2.1);
  assert.equal(zone(1.399), 'bas'); assert.equal(zone(1.4), 'milieu'); assert.equal(zone(2.1), 'milieu'); assert.equal(zone(2.101), 'haut');
  assert.equal(zone(null), 'milieu'); assert.equal(zone(NaN), 'milieu'); assert.equal(zone(Infinity), 'milieu');
});
