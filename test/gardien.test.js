import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Registre } from '../src/registre.js';
import * as G from '../src/gardien.js';
import { RACINE, integrite } from '../src/adaptateurs/moteurs.js';

const dossier = () => mkdtempSync(join(tmpdir(), 'gardien-'));
const neuf = () => new Registre(join(dossier(), 'j.jsonl'));
const CONFIG = { mode: 'économique', modes: { 'économique': { calcul_s_par_mission: 10, calcul_s_total: 20, tokens_sortie: 1000, sans_progres_max: 1 } }, prix_par_million_de_tokens: null };
const IA0 = { mesurable: false, raison: 'test' };
const mission = (n) => ({ nom: 'essai', cle: `essai#${n}` });
// une mission factice : écrit un dossier et, si demandé, un acte de progrès
const faire = (reg, n, progres = true) => () => {
  reg.ajouter({ type: 'probleme', cle: `essai#${n}`, probleme: `essai#${n}`, auteur: 'registre', titre: 't', question: 'q', source: {} });
  if (progres) reg.ajouter({ type: 'aveu', probleme: `essai#${n}`, auteur: 'registre', motif: 'm' }), reg.ajouter({ type: 'jalon', probleme: `essai#${n}`, auteur: 'registre', travail: 'T', mesure: 'm', avant: 0, apres: 1, source: 's' });
};

test('le mode économique est le mode par défaut', () => {
  assert.equal(JSON.parse(readFileSync(join(RACINE, 'gardien.json'), 'utf8')).mode, 'économique');
});

test('le gardien n’importe aucun moteur et ne touche pas aux fichiers protégés', () => {
  const src = readFileSync(join(RACINE, 'src', 'gardien.js'), 'utf8');
  assert.ok(!/moteurs\/|adaptateurs\//.test(src.replace(/\/\/.*$/gm, '')));
  assert.deepEqual(integrite().erreurs, []);
  assert.equal(integrite().fichiers, 33);
});

test('une mission déjà au registre est évitée, sans économie inventée', () => {
  const r = neuf();
  assert.equal(G.garder(r, CONFIG, mission(1), faire(r, 1), { ia: IA0 }).decision, 'lancée');
  let appels = 0;
  const d = G.garder(r, CONFIG, mission(1), () => { appels++; }, { ia: IA0 });
  assert.equal(d.decision, 'évitée'); assert.equal(appels, 0);
  const e = G.etat(r, CONFIG, IA0);
  assert.equal(e.missions.evitees, 1);
  assert.equal(e.economie.tokens, null);
  assert.equal(e.economie.sur, 1);                       // chiffrée, car une durée réelle du même type a été mesurée
  const r2 = neuf(); r2.ajouter({ type: 'probleme', cle: 'essai#9', probleme: 'essai#9', auteur: 'registre', titre: 't', question: 'q', source: {} });
  G.garder(r2, CONFIG, mission(9), () => {}, { ia: IA0 });
  assert.equal(G.etat(r2, CONFIG, IA0).economie.calcul_s, null);   // aucune durée mesurée : économie non chiffrée
  assert.equal(G.etat(r2, CONFIG, IA0).economie.non_chiffrees, 1);
});

test('arrêt quand le budget est atteint ; seule une autorisation relance', () => {
  const r = neuf();
  G.consigner(r, { decision: 'lancée', mode: 'économique', mission: { nom: 'autre', cle: 'autre#0' }, reel: { calcul_s: 25, actes: 2, progres: 1 } });
  let appels = 0;
  const d = G.garder(r, CONFIG, mission(2), () => { appels++; }, { ia: IA0 });
  assert.equal(d.decision, 'refusée'); assert.match(d.raison, /budget de calcul/); assert.equal(appels, 0);
  assert.equal(G.garder(r, CONFIG, mission(2), () => { appels++; }, { ia: IA0 }).decision, 'refusée');   // pas de relance automatique
  G.consigner(r, { decision: 'autorisation', mode: 'économique', accorde: { calcul_s: 100, tokens_sortie: 0 } });
  assert.equal(G.garder(r, CONFIG, mission(2), faire(r, 2), { ia: IA0 }).decision, 'lancée');
});

test('arrêt quand une mission ne produit aucun progrès mesurable', () => {
  const r = neuf();
  assert.equal(G.garder(r, CONFIG, mission(3), faire(r, 3, false), { ia: IA0 }).reel.progres, 0);
  const d = G.garder(r, CONFIG, mission(4), faire(r, 4), { ia: IA0 });
  assert.equal(d.decision, 'refusée'); assert.match(d.raison, /sans progrès/);
  assert.equal(G.garder(r, CONFIG, mission(4), faire(r, 4), { ia: IA0, autorise: true }).decision, 'lancée');
});

test('une mission estimée au-dessus du plafond du mode est refusée avant lancement', () => {
  const r = neuf();
  G.consigner(r, { decision: 'remise à zéro', mode: 'économique' });
  G.consigner(r, { decision: 'lancée', mode: 'économique', mission: mission(0), reel: { calcul_s: 15, actes: 2, progres: 1 } });
  assert.deepEqual(G.estimer(r, 'essai'), { calcul_s: 15, base: 'mesuré', sur: 1 });
  assert.match(G.decider(r, CONFIG, mission(5), { ia: IA0 }).raison, /plafond par mission/);
  assert.equal(G.estimer(r, 'autre').base, 'inconnu');
});

test('une consommation anormale est signalée', () => {
  const r = neuf();
  G.consigner(r, { decision: 'lancée', mode: 'économique', mission: mission(0), reel: { calcul_s: 0.01, actes: 2, progres: 1 } });
  const d = G.garder(r, CONFIG, mission(6), () => { const t = Date.now(); while (Date.now() - t < 120); faire(r, 6)(); }, { ia: IA0 });
  assert.equal(d.anomalie, true);
  assert.equal(G.etat(r, CONFIG, IA0).missions.anomalies, 1);
});

test('les tokens ne sont comptés que s’ils sont mesurables', () => {
  assert.equal(G.mesurerIA(join(dossier(), 'absent')).mesurable, false);
  const d = dossier();
  writeFileSync(join(d, 's.jsonl'), [{ message: { usage: { input_tokens: 10, output_tokens: 300, cache_read_input_tokens: 5 } } }, { message: { usage: { input_tokens: 1, output_tokens: 900 } } }, { autre: 1 }].map((x) => JSON.stringify(x)).join('\n') + '\npas du json "usage"\n');
  const ia = G.mesurerIA(d);
  assert.deepEqual([ia.mesurable, ia.appels, ia.tokens_entree, ia.tokens_sortie, ia.tokens_cache_lus], [true, 2, 11, 1200, 5]);
  const r = neuf();
  assert.equal(G.budget(r, CONFIG, ia).tokens_sortie.mesurable, false);      // pas de point de référence : rien n’est affirmé
  G.consigner(r, { decision: 'remise à zéro', mode: 'économique', ia: { ...ia, tokens_sortie: 100 }, reference: true });
  assert.equal(G.budget(r, CONFIG, ia).tokens_sortie.consomme, 1100);
  assert.match(G.decider(r, CONFIG, mission(7), { ia }).raison, /budget de tokens/);
  assert.equal(G.etat(r, CONFIG, ia).ia.cout_estime, null);                  // aucun prix renseigné : aucun coût affiché
});

test('les actes du gardien ne rompent pas la chaîne, et le registre refuse une garde incomplète', () => {
  const r = neuf();
  G.garder(r, CONFIG, mission(8), faire(r, 8), { ia: IA0 });
  assert.ok(new Registre(r.chemin).verifier().ok);
  assert.throws(() => G.consigner(r, { decision: 'lancée', mode: 'économique', mission: mission(0) }), /durée réelle/);
  assert.throws(() => G.consigner(r, { decision: 'évitée', mode: 'économique', economie: { calcul_s: 12, base: 'estimé' } }), /mesurées/);
});
