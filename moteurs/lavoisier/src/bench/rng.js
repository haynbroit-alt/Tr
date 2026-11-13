// Générateur pseudo-aléatoire déterministe (mulberry32) et lois usuelles.
export function makeRng(seed = 1) {
  let s = (seed >>> 0) || 1;
  const next = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  let spare = null;
  const normal = () => {
    if (spare !== null) { const v = spare; spare = null; return v; }
    let u = 0;
    while (u <= 1e-12) u = next();
    const v = next(), r = Math.sqrt(-2 * Math.log(u));
    spare = r * Math.sin(2 * Math.PI * v);
    return r * Math.cos(2 * Math.PI * v);
  };
  const uniform = (a, b) => a + (b - a) * next();
  const int = (a, b) => Math.floor(uniform(a, b + 1));
  const logUniform = (a, b) => Math.exp(uniform(Math.log(a), Math.log(b)));
  const chance = (p) => next() < p;
  const pick = (arr) => arr[Math.floor(next() * arr.length)];
  const poisson = (lambda) => {
    if (lambda <= 0) return 0;
    if (lambda > 60) return Math.max(0, Math.round(lambda + Math.sqrt(lambda) * normal()));
    const L = Math.exp(-lambda);
    let k = 0, p = 1;
    for (;;) { p *= next(); if (p <= L) return k; k++; }
  };
  const shuffle = (arr) => {
    for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(next() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; }
    return arr;
  };
  return { next, normal, uniform, int, logUniform, chance, pick, poisson, shuffle };
}

// Graine dérivée : un flux aléatoire indépendant par usage, pour qu'un usage n'en décale pas un autre.
export const derive = (seed, salt) => (Math.imul(seed >>> 0, 2654435761) ^ Math.imul(salt + 1, 40503) ^ 0x9e3779b9) >>> 0;
