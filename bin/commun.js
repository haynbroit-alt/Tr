#!/usr/bin/env node
// Page de travail commune — ligne de commande.
//   executer <probleme> --graine N   exécute un problème commun et consigne chaque acte dans le registre
//   verifier                         recalcule la chaîne du registre et les empreintes des moteurs gelés
//   etat                             niveau de certitude courant de chaque affirmation
//   page                             régénère page/index.html à partir du registre
import { join } from 'node:path';
import { Registre } from '../src/registre.js';
import { RACINE, integrite } from '../src/adaptateurs/moteurs.js';

const [cmd, nom] = process.argv.slice(2);
const opt = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const reg = new Registre(opt('--registre', join(RACINE, 'registre', 'journal.jsonl')));

if (cmd === 'executer') {
  const integ = integrite();
  if (!integ.ok) { console.error('Moteurs altérés, exécution refusée :\n' + integ.erreurs.join('\n')); process.exit(1); }
  const graine = Number(opt('--graine'));
  const cle = `${nom}#${graine}`;
  if (reg.lignes.some((r) => r.type === 'probleme' && r.cle === cle)) { console.error(`${cle} est déjà au registre (journal en ajout seul).`); process.exit(1); }
  const avant = reg.lignes.length;
  if (nom === 'forme-manquante') (await import('../src/problemes/forme-manquante.js')).formeManquante(reg, graine);
  else if (nom === 'entreprise-opaque') (await import('../src/problemes/entreprise-opaque.js')).entrepriseOpaque(reg, graine);
  else { console.error('problèmes : forme-manquante, entreprise-opaque'); process.exit(1); }
  for (const r of reg.lignes.slice(avant)) console.log(`${String(r.n).padStart(3)} ${r.id} ${r.type.padEnd(12)} ${r.auteur.padEnd(9)} ${r.enonce ?? r.motif ?? r.titre ?? r.methode ?? ''}`.slice(0, 200));
} else if (cmd === 'verifier') {
  const a = reg.verifier(), b = integrite();
  console.log(`registre : ${a.lignes} enregistrements, chaîne ${a.ok ? 'intacte' : 'ROMPUE'}`); a.erreurs.forEach((e) => console.log('  ' + e));
  console.log(`moteurs  : ${b.fichiers} fichiers, ${b.ok ? 'identiques aux commits gelés' : 'ALTÉRÉS'}`); b.erreurs.forEach((e) => console.log('  ' + e));
  process.exit(a.ok && b.ok ? 0 : 2);
} else if (cmd === 'etat') {
  for (const e of reg.etat()) console.log(`${e.niveau.padEnd(15)} ${e.contestee ? 'contestée ' : '          '}${e.auteur.padEnd(9)} ${e.probleme.padEnd(22)} ${e.enonce}`.slice(0, 220));
} else if (cmd === 'page') {
  const { ecrirePage } = await import('../src/page.js');
  console.log(ecrirePage(reg, join(RACINE, 'page', 'index.html')));
} else console.log('usage : commun.js executer <forme-manquante|entreprise-opaque> --graine N | verifier | etat | page');
