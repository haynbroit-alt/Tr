// Identité des moteurs gelés et contrôle d'intégrité : les adaptateurs importent ces copies et rien d'autre.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const PROVENANCE = JSON.parse(readFileSync(join(RACINE, 'moteurs', 'PROVENANCE.json'), 'utf8'));
export const moteur = (nom) => { const m = PROVENANCE.moteurs.find((x) => x.nom === nom); return { nom: m.titre, depot: m.depot, commit: m.commit.slice(0, 7) }; };

export function integrite() {
  const erreurs = [];
  for (const m of PROVENANCE.moteurs) for (const [f, h] of Object.entries(m.fichiers)) {
    let lu = null;
    try { lu = createHash('sha256').update(readFileSync(join(RACINE, 'moteurs', m.nom, f))).digest('hex'); } catch { /* absent */ }
    if (lu !== h) erreurs.push(`${m.titre} : ${f} ${lu ? 'a été modifié' : 'est absent'}`);
  }
  return { ok: erreurs.length === 0, fichiers: PROVENANCE.moteurs.reduce((s, m) => s + Object.keys(m.fichiers).length, 0), erreurs };
}

// Graines : seules les graines de DÉVELOPPEMENT des moteurs sont permises ici. Les graines de test de LAVOISIER M0
// (5001–5300) et de CORTEX P3 (5001–5400) sont réservées à leur exécution unique ; celles de P2 (3001–3300) ont servi.
export function graineDev(g) {
  if (!Number.isInteger(g) || g < 1 || g > 100) throw new Error(`graine ${g} refusée : la page commune ne travaille que sur les graines de développement (1 à 100)`);
  return g;
}
