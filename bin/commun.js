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
  else if (nom === 'repetitions') { const r = G.repetitions(reg); console.log(`relevé lu : ${r.releve_lu} · seuil : ${r.seuil} occurrences`); for (const x of r.signaux) console.log(`${String(x.fois).padStart(3)}× ${x.type.padEnd(38)} ${x.texte}  [${x.session}]`); if (!r.signaux.length) console.log('aucune répétition au-dessus du seuil'); }
  else if (nom === 'verifier-budget') {
    // Barrière utilisable depuis les quatre dépôts : code 0 si les budgets tiennent, 3 sinon.
    const b = G.budget(reg, G.lireConfig(RACINE));
    const dep = process.argv[4];
    const lignes = [['calcul (s)', b.calcul_s.consomme, b.calcul_s.total, b.calcul_s.restant]];
    if (b.tokens_sortie.mesurable) lignes.push(['tokens produits (global)', b.tokens_sortie.consomme, b.tokens_sortie.total, b.tokens_sortie.restant]);
    for (const [d, x] of Object.entries(b.depots)) if (x.mesurable && (!dep || d === dep)) lignes.push([`tokens produits (${d})`, x.consomme, x.total, x.restant]);
    let depasse = false;
    for (const [n, c, t, r] of lignes) { if (r <= 0) depasse = true; console.log(`${r <= 0 ? 'DÉPASSÉ ' : 'ok      '}${n} : ${c} sur ${t}`); }
    process.exit(depasse ? 3 : 0);
  }
  else console.log(JSON.stringify(G.etat(reg, G.lireConfig(RACINE)), null, 1));
} else if (cmd === 'executer') {
  const integ = integrite();
  if (!integ.ok) { console.error('Moteurs altérés, exécution refusée :\n' + integ.erreurs.join('\n')); process.exit(1); }
  const graine = Number(opt('--graine')), fichier = opt('--fichier');
  const cle = nom === 'confrontation-t2' ? 'confrontation#T2' : nom === 'opportunites' ? `opportunites#${fichier.replace(/\D/g, '')}` : nom === 'confrontation-t1' ? 'confrontation#T1' : nom === 'pistes' ? 'pistes#1' : nom === 'boutique-reelle' ? `boutique-reelle#${fichier.replace(/\D/g, '')}` : `${nom}#${graine}`;
  if (reg.lignes.some((r) => r.type === 'probleme' && r.cle === cle)) { console.error(`${cle} est déjà au registre (journal en ajout seul).`); process.exit(1); }
  const avant = reg.lignes.length;
  if (nom === 'forme-manquante') (await import('../src/problemes/forme-manquante.js')).formeManquante(reg, graine);
  else if (nom === 'entreprise-opaque') (await import('../src/problemes/entreprise-opaque.js')).entrepriseOpaque(reg, graine);
  else if (nom === 'boutique-reelle') (await import('../src/problemes/boutique-reelle.js')).boutiqueReelle(reg, fichier);
  else if (nom === 'confrontation-t1') console.error(JSON.stringify((await import('../src/problemes/confrontation-t1.js')).confrontationT1(reg)));
  else if (nom === 'confrontation-t2') console.error(JSON.stringify((await import('../src/problemes/confrontation-t2.js')).confrontationT2(reg)));
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
} else if (cmd === 'loi') {
  // loi <fichier.csv> [--cible nom] : loi sur les données d'un client, vérifiée sur des mesures mises de côté
  const { readFileSync } = await import('node:fs');
  const { lireCSV, analyser, rapport } = await import('../src/loi-client.js');
  const { noms, lignes, rejetees } = lireCSV(readFileSync(nom, 'utf8'));
  const ic = process.argv.indexOf('--cible'), cible = ic > 0 ? process.argv[ic + 1] : noms.at(-1), k = noms.indexOf(cible);
  if (k < 0 || lignes.length < 8) { console.error(k < 0 ? `colonne « ${cible} » absente` : 'moins de 8 lignes lisibles'); process.exit(2); }
  if (rejetees) console.log(`${rejetees} ligne(s) illisible(s) écartée(s)`);
  console.log(rapport(analyser({ noms: noms.filter((_, i) => i !== k), cible, X: lignes.map((r) => r.filter((_, i) => i !== k)), y: lignes.map((r) => r[k]) })));
} else if (cmd === 'audit-fec') {
  // Audit des comptes de tiers d'un fichier d'écritures comptables réel. Rien n'est écrit au journal : le fichier est privé.
  const { readFileSync } = await import('node:fs');
  const { lireFEC, auditer } = await import('../src/audit-fec.js');
  const brut = readFileSync(nom), utf8 = brut.toString('utf8'); // beaucoup de FEC sont en Latin-1 : repli si l'UTF-8 est invalide
  const r = auditer(lireFEC(utf8.includes('\uFFFD') ? brut.toString('latin1') : utf8));
  console.log(`lu : ${r.lu.lignes} lignes, ${r.lu.ecritures} écritures, du ${r.lu.du} au ${r.lu.au} · lettrage clients : ${r.lu.lettrage_clients ? 'tenu' : 'absent'}`);
  for (const [k, t] of [['factures_en_double', 'factures fournisseur saisies deux fois'], ['fournisseurs_debiteurs', 'fournisseurs qui doivent de l’argent'], ['creances_anciennes', 'créances clients de plus de 90 jours']]) {
    console.log(`${t} : ${r[k].cas.length} cas, ${r[k].montant_eur} € à vérifier`);
    if (process.argv.includes('--detail')) for (const c of r[k].cas) console.log('   ', JSON.stringify(c));
  }
  console.log(r.nature);
} else if (cmd === 'mandat') {
  // Posture entrepreneuriale : ce qui s'exécute d'initiative, ce qui attend le propriétaire, l'argent engagé.
  const M = await import('../src/mandat.js');
  const mandat = M.lireMandat(RACINE);
  const dire = (r) => console.log(`${r.decision.padEnd(10)} ${r.cle} — ${r.action}${r.motifs.length ? ` (${r.motifs.join(' ; ')})` : ''}`);
  if (nom === 'proposer') { const { readFileSync } = await import('node:fs'); for (const i of JSON.parse(readFileSync(process.argv[4], 'utf8'))) dire(M.consigner(reg, mandat, i)); }
  else if (nom === 'valider' || nom === 'abandonner') {
    // « valider » ne s'emploie que si le propriétaire a dit oui à cette action précise.
    const d = M.etat(reg, mandat).a_valider.find((r) => r.cle === process.argv[4]);
    if (!d) { console.error('aucune initiative en attente sous cette clé'); process.exit(1); }
    dire(M.consigner(reg, mandat, d, { valide: nom === 'valider', abandon: nom === 'abandonner' }));
  } else {
    const e = M.etat(reg, mandat);
    console.log(`plafond de dépense : ${e.depense_max_eur} € · engagé : ${e.engage_eur} € · reste : ${e.reste_eur} € · contacts : ${e.contacts}`);
    console.log(`initiatives exécutées : ${e.executees.length} · en attente du propriétaire : ${e.a_valider.length}`);
    for (const r of e.a_valider) dire(r);
  }
} else if (cmd === 'page') {
  const { ecrirePage } = await import('../src/page.js');
  console.log(ecrirePage(reg, join(RACINE, 'page', 'index.html')));
} else console.log('usage : commun.js executer <forme-manquante|entreprise-opaque> --graine N | verifier | etat | comptes | gardien | mandat | page');
