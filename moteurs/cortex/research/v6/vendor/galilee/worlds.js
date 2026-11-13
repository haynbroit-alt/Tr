// Les « mondes » : des lois cachées que l'agent ne peut qu'interroger par l'expérience.
import { parse, evalPoint, freeNames } from './expr.js';
import { rng } from './fit.js';

/**
 * Crée un monde à partir d'une formule. L'agent n'a accès qu'à measure(x).
 * vars : [{ name, min, max, unit?, label? }] ; noise : écart-type du bruit, en fraction de l'amplitude de y.
 */
export function makeWorld({ id, title, formula, sim, vars, noise = 0.01, target = 'y', story = '', seed = 1, extend = 2, known = null }) {
  const names = vars.map((v) => v.name);
  const truth = sim ? null : parse(formula, names);
  const f = sim || ((x) => evalPoint(truth, x));
  const r = rng(seed * 7919 + 13);
  // amplitude typique de y sur le domaine, pour dimensionner le bruit
  const pr = rng(4242);
  const ys = [];
  for (let k = 0; k < (sim ? 120 : 400); k++) {
    const v = f(vars.map((q) => q.min + pr() * (q.max - q.min)));
    if (isFinite(v)) ys.push(v);
  }
  const mean = ys.reduce((a, b) => a + b, 0) / ys.length;
  const scale = Math.sqrt(ys.reduce((a, b) => a + (b - mean) ** 2, 0) / ys.length) || Math.abs(mean) || 1;
  const sigma = noise * scale;
  let count = 0;
  return {
    id, title, story, target, vars, names, noise, extend,
    domain: vars.map((v) => [v.min, v.max]),
    /** Réalise une expérience : renvoie une mesure bruitée. */
    measure(x) { count++; return f(x) + sigma * r.normal(); },
    get experiments() { return count; },
    // --- réservé à la vérification finale : l'agent n'y touche jamais ---
    simulated: !!sim, known,
    secret: { formula: sim ? null : formula, truth, sigma, f },
  };
}

export const CATALOG = [
  { id: 'pendule', title: 'Pendule simple', target: 'T', formula: '2*pi*sqrt(L/g)',
    story: 'Période d’un pendule de longueur L sur une planète de gravité g.',
    vars: [{ name: 'L', min: 0.2, max: 3, unit: 'm' }, { name: 'g', min: 1.5, max: 25, unit: 'm/s²' }] },
  { id: 'gravitation', title: 'Gravitation universelle', target: 'F', formula: 'm1*m2/r^2',
    story: 'Force entre deux masses (unités où G = 1).',
    vars: [{ name: 'm1', min: 1, max: 10 }, { name: 'm2', min: 1, max: 10 }, { name: 'r', min: 1, max: 5 }] },
  { id: 'gaz', title: 'Gaz parfait', target: 'P', formula: '8.314*n*T/V',
    story: 'Pression de n moles à la température T dans un volume V.',
    vars: [{ name: 'n', min: 0.5, max: 5, unit: 'mol' }, { name: 'T', min: 250, max: 500, unit: 'K' }, { name: 'V', min: 0.01, max: 0.1, unit: 'm³' }] },
  { id: 'lentille', title: 'Lentille mince', target: 'f', formula: 'a*b/(a+b)',
    story: 'Distance focale à partir des distances objet et image (même loi que deux résistances en parallèle).',
    vars: [{ name: 'a', min: 0.5, max: 10 }, { name: 'b', min: 0.5, max: 10 }] },
  { id: 'relativite', title: 'Facteur de Lorentz', target: 'γ', formula: '1/sqrt(1-v^2)',
    story: 'Dilatation du temps en fonction de la vitesse v (en fraction de c).',
    vars: [{ name: 'v', min: 0, max: 0.95 }], extend: 1 },
  { id: 'condensateur', title: 'Charge d’un condensateur', target: 'U', formula: '5*(1-exp(-t/2))',
    story: 'Tension aux bornes d’un condensateur en charge.',
    vars: [{ name: 't', min: 0, max: 8, unit: 's' }] },
  { id: 'enzyme', title: 'Michaelis–Menten', target: 'v', formula: '3*S/(S+0.8)',
    story: 'Vitesse d’une réaction enzymatique selon la concentration S du substrat.',
    vars: [{ name: 'S', min: 0.05, max: 10 }] },
  { id: 'arrhenius', title: 'Loi d’Arrhenius', target: 'k', formula: '50*exp(-8/T)',
    story: 'Constante de vitesse d’une réaction selon la température (unités réduites).',
    vars: [{ name: 'T', min: 1, max: 10 }] },
  { id: 'oscillateur', title: 'Oscillateur harmonique', target: 'x', formula: '2*cos(3*t)',
    story: 'Position d’une masse au bout d’un ressort.',
    vars: [{ name: 't', min: 0, max: 6, unit: 's' }] },
  { id: 'amorti', title: 'Oscillateur amorti', target: 'x', formula: 'exp(-t/2)*cos(3*t)',
    story: 'La même masse, avec frottement.',
    vars: [{ name: 't', min: 0, max: 6, unit: 's' }] },
  { id: 'saturation', title: 'Capteur qui sature', target: 's', formula: 'x/(1+x/40)', extend: 8,
    story: 'Réponse d’un capteur : une droite en apparence, tant qu’on reste dans la plage sûre. Seule une expérience hors domaine révèle la saturation.',
    vars: [{ name: 'x', min: 0, max: 2 }] },
  { id: 'chute', title: 'Chute libre', target: 'h', formula: 'v*t-4.905*t^2',
    story: 'Hauteur d’un projectile lancé vers le haut à la vitesse v.',
    vars: [{ name: 'v', min: 0, max: 30, unit: 'm/s' }, { name: 't', min: 0, max: 5, unit: 's' }] },
  { id: 'cinetique', title: 'Énergie cinétique', target: 'E', formula: 'm*v^2/2',
    story: 'Énergie d’une masse m à la vitesse v.',
    vars: [{ name: 'm', min: 1, max: 20, unit: 'kg' }, { name: 'v', min: 1, max: 30, unit: 'm/s' }] },
  { id: 'coulomb-ecran', title: 'Potentiel de Yukawa', target: 'U', formula: 'exp(-r)/r',
    story: 'Potentiel écranté à la distance r.',
    vars: [{ name: 'r', min: 0.3, max: 5 }] },
  { id: 'stefan', title: 'Rayonnement du corps noir', target: 'P', formula: '5.67*A*T^4',
    story: 'Puissance rayonnée par une surface A à la température T (unités réduites).',
    vars: [{ name: 'A', min: 0.5, max: 5 }, { name: 'T', min: 1, max: 6 }] },
];

// ---------------------------------------------------------------- terra incognita
// Des systèmes dont seul le micro-mécanisme est codé (une équation différentielle intégrée pas à pas).
// La grandeur mesurée n'a pas de formule exacte en fonctions élémentaires : personne n'a écrit la réponse.

/** Runge–Kutta d'ordre 4 pour un système à 4 composantes au plus ; f écrit la dérivée dans out. */
function rk4(state, f, dt, k1, k2, k3, k4, tmp) {
  const n = state.length;
  f(state, k1);
  for (let i = 0; i < n; i++) tmp[i] = state[i] + 0.5 * dt * k1[i];
  f(tmp, k2);
  for (let i = 0; i < n; i++) tmp[i] = state[i] + 0.5 * dt * k2[i];
  f(tmp, k3);
  for (let i = 0; i < n; i++) tmp[i] = state[i] + dt * k3[i];
  f(tmp, k4);
  for (let i = 0; i < n; i++) state[i] += (dt / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]);
}
const buf = (n) => [0, 1, 2, 3, 4].map(() => new Float64Array(n));

/** Portée d'un projectile tiré à 45° avec une traînée quadratique (a = −g − k·|v|·v). */
function simProjectile([v0, k]) {
  const s = Float64Array.from([0, 0, v0 * Math.SQRT1_2, v0 * Math.SQRT1_2]);
  const [k1, k2, k3, k4, tmp] = buf(4);
  const f = (q, o) => { const sp = Math.hypot(q[2], q[3]); o[0] = q[2]; o[1] = q[3]; o[2] = -k * sp * q[2]; o[3] = -9.81 - k * sp * q[3]; };
  const dt = 0.002;
  for (let i = 0; i < 200000; i++) {
    const px = s[0], py = s[1];
    rk4(s, f, dt, k1, k2, k3, k4, tmp);
    if (s[1] < 0) return px + ((s[0] - px) * py) / (py - s[1]);
  }
  return NaN;
}
/** Période d'un pendule lâché sans vitesse depuis l'angle θ0 (θ'' = −sin θ), sans approximation des petits angles. */
function simPendulum([th0]) {
  const s = Float64Array.from([th0, 0]);
  const [k1, k2, k3, k4, tmp] = buf(2);
  const f = (q, o) => { o[0] = q[1]; o[1] = -Math.sin(q[0]); };
  const dt = 0.001;
  for (let i = 0; i < 400000; i++) {
    const p = s[0];
    rk4(s, f, dt, k1, k2, k3, k4, tmp);
    if (s[0] <= 0) return 4 * (i * dt + (dt * p) / (p - s[0]));
  }
  return NaN;
}
/** Période d'un cycle proies–prédateurs (x' = x(1−y), y' = a·y(x−1)) partant de (x0, 1). */
function simLotka([x0, a]) {
  const s = Float64Array.from([x0, 1]);
  const [k1, k2, k3, k4, tmp] = buf(2);
  const f = (q, o) => { o[0] = q[0] * (1 - q[1]); o[1] = a * q[1] * (q[0] - 1); };
  const dt = 0.002;
  let crossings = 0;
  for (let i = 0; i < 400000; i++) {
    const py = s[1];
    rk4(s, f, dt, k1, k2, k3, k4, tmp);
    if (i > 5 && py < 1 && s[1] >= 1) { crossings++; if (crossings === 1) return i * dt + (dt * (1 - py)) / (s[1] - py); }
  }
  return NaN;
}
/** Période d'un ressort durcissant (x'' = −x − β·x³) lâché depuis l'amplitude A. */
function simDuffing([A, beta]) {
  const s = Float64Array.from([A, 0]);
  const [k1, k2, k3, k4, tmp] = buf(2);
  const f = (q, o) => { o[0] = q[1]; o[1] = -q[0] - beta * q[0] * q[0] * q[0]; };
  const dt = 0.001;
  for (let i = 0; i < 400000; i++) {
    const p = s[0];
    rk4(s, f, dt, k1, k2, k3, k4, tmp);
    if (s[0] <= 0) return 4 * (i * dt + (dt * p) / (p - s[0]));
  }
  return NaN;
}

export const SIMULATORS = [
  { id: 'trainee', title: 'Portée avec traînée de l’air', target: 'R', sim: simProjectile, extend: 1.5,
    story: 'Un projectile tiré à 45° à la vitesse v, freiné par une traînée quadratique de coefficient k. Aucune formule exacte n’existe.',
    known: 'Sans traînée : R = v²/g. Avec traînée quadratique, pas de solution en fonctions élémentaires.',
    vars: [{ name: 'v', min: 5, max: 40, unit: 'm/s' }, { name: 'k', min: 0.005, max: 0.08, unit: '1/m' }] },
  { id: 'grand-pendule', title: 'Pendule aux grands angles', target: 'T', sim: simPendulum, extend: 1.1,
    story: 'La période d’un pendule lâché depuis un grand angle θ : la formule 2π de Galilée ne tient plus.',
    known: 'Solution exacte : une intégrale elliptique, sans écriture en fonctions élémentaires.',
    vars: [{ name: 'θ', min: 0.1, max: 2.6, unit: 'rad' }] },
  { id: 'proies', title: 'Cycle proies–prédateurs', target: 'T', sim: simLotka, extend: 1.5,
    story: 'Durée d’un cycle de Lotka–Volterra selon la population initiale de proies x et le rythme a des prédateurs.',
    known: 'Près de l’équilibre : T ≈ 2π/√a. Loin de l’équilibre, pas de formule fermée.',
    vars: [{ name: 'x', min: 1.2, max: 4 }, { name: 'a', min: 0.5, max: 3 }] },
  { id: 'ressort-dur', title: 'Ressort durcissant', target: 'T', sim: simDuffing, extend: 1.5,
    story: 'Période d’un oscillateur de Duffing d’amplitude A et de raideur cubique β.',
    known: 'Solution exacte : une intégrale elliptique. Petites amplitudes : T ≈ 2π(1 − 3βA²/8).',
    vars: [{ name: 'A', min: 0.2, max: 3 }, { name: 'β', min: 0.1, max: 2 }] },
];

export function getWorld(id, opts = {}) {
  const spec = CATALOG.find((w) => w.id === id) || SIMULATORS.find((w) => w.id === id);
  if (!spec) throw new Error(`Monde inconnu : ${id}. Disponibles : ${[...CATALOG, ...SIMULATORS].map((w) => w.id).join(', ')}`);
  return makeWorld({ ...spec, ...opts });
}

/** Monde défini par l'utilisateur : une formule libre, des bornes par variable. */
export function customWorld(formula, { ranges = {}, noise = 0.01, seed = 1 } = {}) {
  const names = freeNames(formula);
  if (!names.length) throw new Error('La formule doit contenir au moins une variable.');
  if (names.length > 4) throw new Error('Quatre variables au maximum.');
  const vars = names.map((name) => ({ name, min: (ranges[name] || [1, 5])[0], max: (ranges[name] || [1, 5])[1] }));
  for (const v of vars) if (!(v.max > v.min)) throw new Error(`Bornes invalides pour ${v.name}.`);
  const w = makeWorld({ id: 'perso', title: 'Loi personnalisée', formula, vars, noise, seed, target: names.includes('y') ? 'f' : 'y' });
  let bad = 0;
  const pr = rng(99);
  for (let k = 0; k < 200; k++) if (!isFinite(w.secret.f(vars.map((q) => q.min + pr() * (q.max - q.min))))) bad++;
  if (bad) throw new Error('La formule n’est pas définie sur tout le domaine choisi (division par zéro, racine d’un négatif…).');
  return w;
}

/** Données réelles : demi-grand axe (UA) et période orbitale (années) des huit planètes. */
export const PLANETS = {
  title: 'Planètes du système solaire (données réelles)',
  names: ['a'], target: 'T',
  rows: [
    ['Mercure', 0.3871, 0.2408], ['Vénus', 0.7233, 0.6152], ['Terre', 1.0, 1.0], ['Mars', 1.5237, 1.8808],
    ['Jupiter', 5.2034, 11.862], ['Saturne', 9.5371, 29.457], ['Uranus', 19.191, 84.011], ['Neptune', 30.069, 164.79],
  ],
};

/** Lit un tableau CSV (séparateur virgule, point-virgule, tabulation ou espaces). Dernière colonne = grandeur à expliquer. */
export function parseCsv(text) {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
  const split = (l) => l.split(/[;,\t]|\s+/).map((c) => c.trim()).filter((c) => c !== '');
  let header = split(lines[0]);
  let rows = lines;
  if (header.some((c) => isNaN(Number(c)))) rows = lines.slice(1);
  else header = header.map((_, i, a) => (i === a.length - 1 ? 'y' : `x${i + 1}`));
  const data = rows.map((l) => split(l).map(Number));
  if (data.some((r) => r.length !== header.length || r.some((v) => !isFinite(v)))) throw new Error('CSV invalide : toutes les lignes doivent être numériques et de même longueur.');
  return { names: header.slice(0, -1), target: header[header.length - 1], X: data.map((r) => r.slice(0, -1)), y: data.map((r) => r[r.length - 1]) };
}

