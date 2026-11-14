import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lireCSV, partage, temoins, analyser, rapport } from '../src/loi-client.js';

test('le lecteur accepte point-virgule et virgule décimale, et écarte les lignes illisibles', () => {
  const c = lireCSV('prix;ventes\n1,5;10\n2,5;8\nabc;3\n3,5;6\n');
  assert.deepEqual(c.noms, ['prix', 'ventes']);
  assert.deepEqual(c.lignes, [[1.5, 10], [2.5, 8], [3.5, 6]]);
  assert.equal(c.rejetees, 1);
});

test('une mesure sur quatre est mise de côté, et les témoins sont exacts sur une droite', () => {
  const X = Array.from({ length: 20 }, (_, i) => [i]), y = X.map(([x]) => 3 + 2 * x);
  const { vu, test: t } = partage(X, y);
  assert.equal(t.length, 5); assert.equal(vu.length, 15);
  const m = temoins(X, y, vu, t);
  assert.ok(m.droite < 1e-9 && m.constante > 5);
});

test('une courbe nette est retenue ; du bruit pur ne l’est pas', () => {
  let s = 7; const alea = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const X = Array.from({ length: 60 }, (_, i) => [0.5 + i * 0.1]);
  const courbe = analyser({ noms: ['x'], cible: 'y', X, y: X.map(([x]) => 4 * x / (1 + x) * (1 + 0.01 * (alea() - 0.5))) });
  assert.equal(courbe.retenue, true, JSON.stringify(courbe));
  assert.equal(courbe.peu_de_mesures, false);
  const bruit = analyser({ noms: ['x'], cible: 'y', X: X.slice(0, 24), y: X.slice(0, 24).map(() => 10 + alea()) });
  assert.equal(bruit.peu_de_mesures, true);
  assert.match(rapport(bruit), /ATTENTION/);
  assert.equal(bruit.retenue, false, JSON.stringify(bruit));
});

test('une constante n’est jamais retenue, même si elle bat les témoins par hasard', () => {
  let s = 3; const alea = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let k = 0; k < 6; k++) {
    const X = Array.from({ length: 80 }, () => [alea()]), a = analyser({ noms: ['x'], cible: 'y', X, y: X.map(() => 5 + alea()), graine: 1 });
    assert.ok(!(a.sans_variable && a.retenue), JSON.stringify(a));
  }
});
