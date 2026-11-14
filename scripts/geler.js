// Copie GELÉE des trois moteurs, lue dans leurs dépôts git à un commit précis (jamais dans l'arbre de travail).
// Rien n'est modifié : chaque fichier est écrit tel quel et son empreinte SHA-256 est consignée dans
// moteurs/PROVENANCE.json. `node bin/commun.js verifier` recalcule ces empreintes.
// Usage : node scripts/geler.js [--racine /chemin/contenant/All,1,A]
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ici = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const i = process.argv.indexOf('--racine');
const racine = i > 0 ? resolve(process.argv[i + 1]) : resolve(ici, '..');

const MOTEURS = [
  { nom: 'galilee', titre: 'GALILÉE', depot: 'haynbroit-alt/All', dossier: 'All', commit: 'be42b7e',
    fichiers: ['package.json', ...['agent', 'expr', 'fit', 'search', 'worlds'].map((f) => `src/${f}.js`)] },
  { nom: 'cortex', titre: 'CORTEX', depot: 'haynbroit-alt/1', dossier: '1', commit: '93931fb',
    fichiers: ['package.json', 'src/rng.js', ...['engine', 'worlds', 'p2', 'p3', 'juge'].map((f) => `research/v6/${f}.js`),
      'research/v6/vendor/galilee/PROVENANCE.md', ...['agent', 'expr', 'fit', 'search', 'worlds'].map((f) => `research/v6/vendor/galilee/${f}.js`)] },
  { nom: 'lavoisier', titre: 'LAVOISIER', depot: 'haynbroit-alt/A', dossier: 'A', commit: 'a25b206',
    fichiers: ['package.json', ...['dates', 'ecarts', 'index', 'links', 'stocks', 'types', 'unites'].map((f) => `src/bilan/${f}.js`),
      ...['archetypes', 'classes', 'engine', 'evaluate', 'generator', 'harness', 'rng'].map((f) => `src/bench/${f}.js`)] },
];

const prov = { note: 'Copies non modifiées. Licence MIT (déclarée dans le package.json de chaque dépôt).', moteurs: [] };
for (const m of MOTEURS) {
  const repo = join(racine, m.dossier);
  const commit = execFileSync('git', ['-C', repo, 'rev-parse', m.commit], { encoding: 'utf8' }).trim();
  rmSync(join(ici, 'moteurs', m.nom), { recursive: true, force: true });
  const fichiers = {};
  for (const f of m.fichiers) {
    const buf = execFileSync('git', ['-C', repo, 'show', `${commit}:${f}`], { maxBuffer: 1 << 26 });
    const dest = join(ici, 'moteurs', m.nom, f);
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, buf);
    fichiers[f] = createHash('sha256').update(buf).digest('hex');
  }
  prov.moteurs.push({ nom: m.nom, titre: m.titre, depot: m.depot, commit, fichiers });
  console.log(`${m.titre} : ${m.fichiers.length} fichiers gelés au commit ${commit.slice(0, 7)}`);
}
writeFileSync(join(ici, 'moteurs', 'PROVENANCE.json'), JSON.stringify(prov, null, 2) + '\n');
