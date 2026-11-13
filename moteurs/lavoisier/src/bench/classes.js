// Répartition des graines (protocole M0, § 2.5).
import { DEV_ARCHETYPES } from './archetypes.js';

// Développement (graines 1 à 100) : archétypes de développement en alternance, 0 à 2 flux cachés,
// les deux niveaux de désordre. Ce n'est pas un critère : c'est le terrain de mise au point.
export function devClass(seed) {
  if (seed < 1 || seed > 100) throw new Error('les graines de développement vont de 1 à 100');
  return { archetype: DEV_ARCHETYPES[seed % 3], nHidden: Math.floor(seed / 3) % 3, level: seed % 2 ? 'realiste' : 'propre' };
}

// Test (graines 5001 à 5300), exécution unique. Classe = graine mod 6 ; désordre « réaliste » partout.
export function testClass(seed) {
  if (seed < 5001 || seed > 5300) throw new Error('les graines de test vont de 5001 à 5300');
  const c = seed % 6, h = Math.floor(seed / 6);
  if (c <= 1) return { archetype: DEV_ARCHETYPES[h % 3], nHidden: 0, level: 'realiste', placebo: true };
  if (c <= 3) return { archetype: DEV_ARCHETYPES[h % 3], nHidden: 1 + (h % 2), level: 'realiste', placebo: false };
  // archétypes écrits après le gel : transformation (c = 4) et acompte (c = 5), 0 à 2 flux cachés
  return { archetype: c === 4 ? 'transformation' : 'acompte', nHidden: h % 3, level: 'realiste', placebo: h % 3 === 0 };
}
