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

if (cmd === 'executer' && !process.argv.includes('--sans-gardien')) {
  // Toute mission passe par le GARDIEN : il estime, décide, plafonne la durée, puis consigne ce qui a été dépensé.
  const { spawnSync } = await import('node:child_process');
  const G = await import('../src/gardien.js');
  const config = G.lireConfig(RACINE), graine = Number(opt('--graine')), fichier = opt('--fichier');
  const mission = { nom, cle: G.cleDe(nom, { graine, fichier }), arguments: process.argv.slice(4).filter((a) => a !== '--autorise') };
  const d = G.garder(reg, config, mission, (plafond_s) => {
    const r = spawnSync(process.execPath, [process.argv[1], ...process.argv.slice(2), '--sans-gardien'], { stdio: 'inherit', timeout: plafond_s * 1000 });
    return { arretee: r.error?.code === 'ETIMEDOUT' || r.signal === 'SIGTERM' };
  }, { autorise: process.argv.includes('--autorise') });
  console.error(`GARDIEN [${config.mode}] ${d.decision} — ${d.raison}${d.reel ? ` · ${d.reel.calcul_s} s, ${d.reel.progres} acte(s) de progrès` : ''}${d.anomalie ? ' · CONSOMMATION ANORMALE' : ''}`);
  process.exit(d.decision === 'lancée' || d.decision === 'évitée' ? 0 : 3);
} else if (cmd === 'gardien') {
  const G = await import('../src/gardien.js');
  if (nom === 'mode') console.log('mode :', G.changerMode(RACINE, process.argv[4]));
  else if (nom === 'autoriser') console.log(G.consigner(reg, { decision: 'autorisation', mode: G.lireConfig(RACINE).mode, accorde: { calcul_s: Number(opt('--calcul', 0)), tokens_sortie: Number(opt('--tokens', 0)) }, raison: opt('--raison', 'autorisation donnée par l’utilisateur') }));
  else if (nom === 'releve' || nom === 'remise-a-zero') console.log(G.consigner(reg, { decision: nom === 'releve' ? 'relevé' : 'remise à zéro', mode: G.lireConfig(RACINE).mode, ia: G.mesurerIA(), reference: true }));
  else console.log(JSON.stringify(G.etat(reg, G.lireConfig(RACINE)), null, 1));
} else if (cmd === 'executer') {
  const integ = integrite();
  if (!integ.ok) { console.error('Moteurs altérés, exécution refusée :\n' + integ.erreurs.join('\n')); process.exit(1); }
  const graine = Number(opt('--graine')), fichier = opt('--fichier');
  const cle = nom === 'opportunites' ? `opportunites#${fichier.replace(/\D/g, '')}` : nom === 'confrontation-t1' ? 'confrontation#T1' : nom === 'pistes' ? 'pistes#1' : nom === 'boutique-reelle' ? `boutique-reelle#${fichier.replace(/\D/g, '')}` : `${nom}#${graine}`;
  if (reg.lignes.some((r) => r.type === 'probleme' && r.cle === cle)) { console.error(`${cle} est déjà au registre (journal en ajout seul).`); process.exit(1); }
  const avant = reg.lignes.length;
  if (nom === 'forme-manquante') (await import('../src/problemes/forme-manquante.js')).formeManquante(reg, graine);
  else if (nom === 'entreprise-opaque') (await import('../src/problemes/entreprise-opaque.js')).entrepriseOpaque(reg, graine);
  else if (nom === 'boutique-reelle') (await import('../src/problemes/boutique-reelle.js')).boutiqueReelle(reg, fichier);
  else if (nom === 'confrontation-t1') console.error(JSON.stringify((await import('../src/problemes/confrontation-t1.js')).confrontationT1(reg)));
  else if (nom === 'opportunites') (await import('../src/opportunites.js')).opportunites(reg, fichier);
  else if (nom === 'pistes') (await import('../src/pistes.js')).pistes(reg);
  else { console.error('problèmes : forme-manquante, entreprise-opaque, boutique-reelle, pistes'); process.exit(1); }
  for (const r of reg.lignes.slice(avant)) console.log(`${String(r.n).padStart(3)} ${r.id} ${r.type.padEnd(12)} ${r.auteur.padEnd(9)} ${r.enonce ?? r.motif ?? r.titre ?? r.methode ?? ''}`.slice(0, 200));
} else if (cmd === 'verifier') {
  const a = reg.verifier(), b = integrite();
  console.log(`registre : ${a.lignes} enregistrements, chaîne ${a.ok ? 'intacte' : 'ROMPUE'}`); a.erreurs.forEach((e) => console.log('  ' + e));
  console.log(`moteurs  : ${b.fichiers} fichiers, ${b.ok ? 'identiques aux commits gelés' : 'ALTÉRÉS'}`); b.erreurs.forEach((e) => console.log('  ' + e));
  process.exit(a.ok && b.ok ? 0 : 2);
} else if (cmd === 'etat') {
  for (const e of reg.etat()) console.log(`${e.niveau.padEnd(15)} ${e.contestee ? 'contestée ' : '          '}${e.auteur.padEnd(9)} ${e.probleme.padEnd(22)} ${e.enonce}`.slice(0, 220));
} else if (cmd === 'jalon') {
  const { readFileSync } = await import('node:fs');
  const { jalon } = await import('../src/jalons.js');
  for (const j of JSON.parse(readFileSync(nom, 'utf8'))) console.log(jalon(reg, j), j.moteur, j.travail, j.mesure);
} else if (cmd === 'comptes') {
  const c = (await import('../src/comptes.js')).comptes(reg);
  for (const [m, x] of Object.entries(c.individuel)) { console.log(`\n${m} — ${x.etat}`); for (const r of x.reperes) console.log(`  ${r.atteint === true ? 'atteint ' : r.atteint === false ? 'MANQUE  ' : '        '}${r.mesure} : ${r.valeur ?? 'non mesuré'}${r.unite ? ' ' + r.unite : ''}${r.seuil != null ? ` (seuil ${r.seuil})` : r.cible != null ? ` (cible proposée ${r.cible})` : ''}${r.travail ? ' → ' + r.travail : ''}`); }
  console.log('\nCOLLECTIF', JSON.stringify({ ...c.collectif, jalons: c.collectif.jalons.length }, null, 1));
  console.log('COÛTS', JSON.stringify(c.couts));
  console.log('GAINS RÉELS', JSON.stringify(c.gains));
} else if (cmd === 'page') {
  const { ecrirePage } = await import('../src/page.js');
  console.log(ecrirePage(reg, join(RACINE, 'page', 'index.html')));
} else console.log('usage : commun.js executer <forme-manquante|entreprise-opaque> --graine N | verifier | etat | page');
