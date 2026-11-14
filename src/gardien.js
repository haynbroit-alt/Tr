// GARDIEN — gestion des ressources. Module indépendant : il ne lance aucun moteur lui-même, ne lit aucun fichier
// de moteurs/ et n'écrit que des actes « garde » en fin de journal. Il mesure ce qui est mesurable et affiche
// « non mesurable » pour le reste : aucune consommation ni aucune économie n'est inventée.
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

export const P = 'gardien#1';
const PROGRES = ['affirmation', 'verification', 'resultat', 'jalon', 'opportunite', 'piste'];
export const lireConfig = (racine) => JSON.parse(readFileSync(join(racine, 'gardien.json'), 'utf8'));
export function changerMode(racine, mode) {
  const c = lireConfig(racine);
  const m = Object.keys(c.modes).find((k) => k.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase() === mode.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase());
  if (!m) throw new Error(`mode inconnu « ${mode} » : ${Object.keys(c.modes).join(', ')}`);
  writeFileSync(join(racine, 'gardien.json'), JSON.stringify({ ...c, mode: m }, null, 2) + '\n');
  return m;
}

// Clé du dossier qu'une mission écrirait : sert à reconnaître un travail déjà fait.
export const cleDe = (nom, { graine, fichier } = {}) => (nom === 'opportunites' ? `opportunites#${String(fichier).replace(/\D/g, '')}` : nom === 'confrontation-t1' ? 'confrontation#T1'
  : nom === 'pistes' ? 'pistes#1' : nom === 'boutique-reelle' ? `boutique-reelle#${String(fichier).replace(/\D/g, '')}` : `${nom}#${graine}`);

const gardes = (reg) => reg.lignes.filter((r) => r.type === 'garde');
function ouvrir(reg) {
  if (!reg.lignes.some((r) => r.type === 'probleme' && r.cle === P)) reg.ajouter({ probleme: P, type: 'probleme', cle: P, auteur: 'registre', titre: 'Gardien : ressources consommées et évitées',
    question: 'Chaque mission vaut-elle ce qu’elle coûte, et lesquelles n’avaient pas besoin d’être lancées ?', source: { generateur: 'src/gardien.js', graine: '—', statut: 'journal des ressources' } });
}
export function consigner(reg, acte) { ouvrir(reg); return reg.ajouter({ probleme: P, type: 'garde', auteur: 'registre', ...acte }); }

// Relevé des appels IA : Claude Code écrit, sur la machine où il tourne, un fichier par session avec les tokens de
// chaque réponse. S'il est absent ou illisible, la consommation est « non mesurable ».
export function mesurerIA(dossier = process.env.GARDIEN_RELEVES ?? join(homedir(), '.claude', 'projects')) {
  const tot = { appels: 0, tokens_entree: 0, tokens_sortie: 0, tokens_cache_ecrits: 0, tokens_cache_lus: 0 };
  const par_depot = {}, par_modele = {};
  let fichiers = 0, cout_usd_rapporte = 0, sessions_avec_cout = 0;
  const parcourir = (d) => { for (const e of readdirSync(d, { withFileTypes: true })) { const p = join(d, e.name); if (e.isDirectory()) parcourir(p); else if (e.name.endsWith('.jsonl')) lire(p); } };
  const lire = (p) => {
    fichiers++;
    let cout = null;
    for (const l of readFileSync(p, 'utf8').split('\n')) {
      if (!l) continue;
      let j;
      if (l.includes('"totalCostUSD"')) { try { j = JSON.parse(l); } catch { continue; } if (typeof j.totalCostUSD === 'number') cout = j.totalCostUSD; continue; }
      if (!l.includes('"usage"')) continue;
      try { j = JSON.parse(l); } catch { continue; }
      const u = j.message?.usage;
      if (!u || typeof u.output_tokens !== 'number') continue;
      tot.appels++; tot.tokens_entree += u.input_tokens ?? 0; tot.tokens_sortie += u.output_tokens ?? 0;
      tot.tokens_cache_ecrits += u.cache_creation_input_tokens ?? 0; tot.tokens_cache_lus += u.cache_read_input_tokens ?? 0;
      const d = j.cwd ? j.cwd.split('/').filter(Boolean).pop() ?? j.cwd : '(sans dossier)';
      (par_depot[d] ??= { appels: 0, tokens_sortie: 0 }).appels++; par_depot[d].tokens_sortie += u.output_tokens ?? 0;
      const m = j.message.model ?? '(inconnu)';
      (par_modele[m] ??= { appels: 0, tokens_sortie: 0 }).appels++; par_modele[m].tokens_sortie += u.output_tokens ?? 0;
    }
    if (cout != null) { cout_usd_rapporte += cout; sessions_avec_cout++; }   // dernier résumé du fichier : cumul de la session
  };
  if (!existsSync(dossier)) return { mesurable: false, raison: `aucun relevé dans ${dossier}` };
  try { parcourir(dossier); } catch (e) { return { mesurable: false, raison: `relevé illisible : ${e.message}` }; }
  if (!tot.appels) return { mesurable: false, raison: 'relevé présent mais sans aucun appel enregistré' };
  return { mesurable: true, fichiers, ...tot, par_depot, par_modele,
    cout_usd_rapporte: sessions_avec_cout ? Number(cout_usd_rapporte.toFixed(2)) : null, sessions_avec_cout,
    note_cout: sessions_avec_cout ? 'coût écrit par Claude Code dans le relevé (dernier résumé de chaque session) ; des sessions sans résumé peuvent manquer' : 'aucun résumé de coût dans le relevé' };
}

// Répétitions : commandes identiques ou lectures du même fichier répétées dans une même session (relevé),
// et missions relancées après refus (journal). Seuils : SEUIL_REPETITION occurrences.
export const SEUIL_REPETITION = 3;
export function repetitions(reg, dossier = process.env.GARDIEN_RELEVES ?? join(homedir(), '.claude', 'projects')) {
  const signaux = [];
  const scan = (p) => {
    const bash = {}, lect = {};
    for (const l of readFileSync(p, 'utf8').split('\n')) {
      if (!l.includes('"tool_use"')) continue;
      let j; try { j = JSON.parse(l); } catch { continue; }
      const cont = j.message?.content;
      if (!Array.isArray(cont)) continue;
      for (const c of cont) {
        if (c.type !== 'tool_use') continue;
        if (c.name === 'Bash' && c.input?.command) bash[c.input.command] = (bash[c.input.command] ?? 0) + 1;
        if (c.name === 'Read' && c.input?.file_path) lect[c.input.file_path] = (lect[c.input.file_path] ?? 0) + 1;
      }
    }
    const session = p.split('/').pop();
    for (const [t, n] of Object.entries(bash)) if (n >= SEUIL_REPETITION) signaux.push({ type: 'commande répétée', fois: n, texte: t.slice(0, 120), session });
    for (const [t, n] of Object.entries(lect)) if (n >= SEUIL_REPETITION) signaux.push({ type: 'lecture répétée', fois: n, texte: t, session });
  };
  const parcourir = (d) => { for (const e of readdirSync(d, { withFileTypes: true })) { const p = join(d, e.name); if (e.isDirectory()) parcourir(p); else if (e.name.endsWith('.jsonl')) scan(p); } };
  let releve_lu = true;
  try { if (existsSync(dossier)) parcourir(dossier); else releve_lu = false; } catch { releve_lu = false; }
  const parCle = {};
  for (const g of reg.lignes.filter((r) => r.type === 'garde' && r.mission?.cle)) (parCle[g.mission.cle] ??= []).push(g.decision);
  for (const [cle, ds] of Object.entries(parCle)) {
    const refus = ds.filter((d) => ['refusée', 'évitée'].includes(d)).length;
    if (refus >= 2) signaux.push({ type: 'mission relancée après refus ou doublon', fois: refus, texte: cle, session: 'journal' });
  }
  return { releve_lu, seuil: SEUIL_REPETITION, signaux };
}

// Estimation avant lancement : moyenne des durées RÉELLES déjà mesurées pour la même mission. Sinon : inconnu.
export function estimer(reg, nom) {
  const v = gardes(reg).filter((g) => g.decision === 'lancée' && g.mission.nom === nom && g.reel?.calcul_s != null).map((g) => g.reel.calcul_s);
  return v.length ? { calcul_s: Number((v.reduce((a, b) => a + b, 0) / v.length).toFixed(1)), base: 'mesuré', sur: v.length } : { calcul_s: null, base: 'inconnu', sur: 0 };
}

// Budget restant du mode courant : ce qui a été dépensé depuis la dernière remise à zéro, plus ce qui a été autorisé.
export function budget(reg, config, ia = mesurerIA()) {
  const m = config.modes[config.mode], g = gardes(reg);
  const depuis = g.map((x) => x.decision).lastIndexOf('remise à zéro'), periode = g.slice(depuis + 1);
  const calcul = periode.filter((x) => ['lancée', 'arrêtée'].includes(x.decision)).reduce((s, x) => s + (x.reel?.calcul_s ?? 0), 0);
  const accorde = periode.filter((x) => x.decision === 'autorisation');
  const base = [...g].reverse().find((x) => ['remise à zéro', 'relevé'].includes(x.decision) && x.ia?.mesurable && x.reference);
  const sortie = ia.mesurable && base ? Math.max(0, ia.tokens_sortie - base.ia.tokens_sortie) : null;
  const totalCalcul = m.calcul_s_total + accorde.reduce((s, x) => s + (x.accorde?.calcul_s ?? 0), 0), totalTokens = m.tokens_sortie + accorde.reduce((s, x) => s + (x.accorde?.tokens_sortie ?? 0), 0);
  const depots = {};
  for (const [dep, cap] of Object.entries(config.plafonds_tokens_sortie_par_depot ?? {})) {
    if (cap == null) continue;
    if (!ia.mesurable || !base) { depots[dep] = { mesurable: false, total: cap }; continue; }
    const conso = Math.max(0, (ia.par_depot?.[dep]?.tokens_sortie ?? 0) - (base.ia.par_depot?.[dep]?.tokens_sortie ?? 0));
    depots[dep] = { mesurable: true, consomme: conso, total: cap, restant: cap - conso };
  }
  return { mode: config.mode, calcul_s: { consomme: Number(calcul.toFixed(1)), total: totalCalcul, restant: Number((totalCalcul - calcul).toFixed(1)) },
    tokens_sortie: sortie == null ? { mesurable: false } : { mesurable: true, consomme: sortie, total: totalTokens, restant: totalTokens - sortie },
    depots };
}

// Décision avant lancement. Renvoie { lancer, decision, raison, estimation }.
export function decider(reg, config, mission, { autorise = false, ia } = {}) {
  const m = config.modes[config.mode], est = estimer(reg, mission.nom), b = budget(reg, config, ia);
  const non = (decision, raison) => ({ lancer: false, decision, raison, estimation: est });
  if (reg.lignes.some((r) => r.type === 'probleme' && r.cle === mission.cle)) return non('évitée', `déjà au registre (${mission.cle}) : le résultat existe, il se relit au lieu de se refaire`);
  if (autorise) return { lancer: true, decision: 'lancée', raison: 'autorisation explicite', estimation: est, plafond_s: Math.max(m.calcul_s_par_mission, est.calcul_s ?? 0) * 3 };
  const recents = gardes(reg).filter((g) => ['lancée', 'arrêtée', 'autorisation', 'remise à zéro'].includes(g.decision)).slice(-m.sans_progres_max);
  if (recents.length === m.sans_progres_max && recents.every((g) => ['lancée', 'arrêtée'].includes(g.decision) && g.reel?.progres === 0)) return non('refusée', `${m.sans_progres_max} mission(s) de suite sans progrès mesurable : arrêt, une autorisation est requise`);
  if (b.calcul_s.restant <= 0) return non('refusée', `budget de calcul du mode ${config.mode} atteint (${b.calcul_s.consomme} s sur ${b.calcul_s.total} s) : une autorisation est requise`);
  for (const [dep, x] of Object.entries(b.depots)) if (x.mesurable && x.restant <= 0 && (mission.depot ?? 'Tr') === dep) return non('refusée', `plafond de tokens du dépôt ${dep} atteint (${x.consomme} sur ${x.total}) : une autorisation est requise`);
  if (b.tokens_sortie.mesurable && b.tokens_sortie.restant <= 0) return non('refusée', `budget de tokens du mode ${config.mode} atteint (${b.tokens_sortie.consomme} sur ${b.tokens_sortie.total}) : une autorisation est requise`);
  if (est.calcul_s != null && est.calcul_s > m.calcul_s_par_mission) return non('refusée', `coût estimé ${est.calcul_s} s, au-dessus du plafond par mission du mode ${config.mode} (${m.calcul_s_par_mission} s) : une autorisation est requise`);
  return { lancer: true, decision: 'lancée', raison: est.base === 'inconnu' ? 'coût inconnu : première mission de ce type, plafonnée par le mode' : 'dans le budget', estimation: est, plafond_s: Math.min(m.calcul_s_par_mission, Math.max(1, b.calcul_s.restant)) };
}

// Passe une mission sous garde. `lancer(plafond_s)` exécute la mission et renvoie { arretee }.
export function garder(reg, config, mission, lancer, opts = {}) {
  const d = decider(reg, config, mission, opts);
  if (!d.lancer) {
    consigner(reg, { decision: d.decision, mission, mode: config.mode, raison: d.raison, estimation: d.estimation,
      economie: d.decision === 'évitée' ? { calcul_s: d.estimation.calcul_s, base: d.estimation.base, tokens: null, note: 'tokens évités : non mesurable' } : undefined });
    return d;
  }
  const avant = reg.lignes.length, t0 = Date.now(), r = lancer(d.plafond_s) ?? {};
  reg.recharger?.();
  const calcul_s = Number(((Date.now() - t0) / 1000).toFixed(1)), neufs = reg.lignes.slice(avant);
  const progres = neufs.filter((x) => PROGRES.includes(x.type)).length;
  const anormal = d.estimation.calcul_s != null && calcul_s > 3 * d.estimation.calcul_s;
  consigner(reg, { decision: r.arretee ? 'arrêtée' : 'lancée', mission, mode: config.mode, raison: r.arretee ? `plafond de ${d.plafond_s} s atteint : mission interrompue` : d.raison, estimation: d.estimation,
    reel: { calcul_s, actes: neufs.length, progres }, anomalie: anormal ? `durée réelle ${calcul_s} s, plus de trois fois l’estimation (${d.estimation.calcul_s} s)` : undefined });
  return { ...d, decision: r.arretee ? 'arrêtée' : 'lancée', reel: { calcul_s, actes: neufs.length, progres }, anomalie: anormal };
}

// Tableau de transparence, entièrement déduit du journal et du relevé local.
export function etat(reg, config, ia = mesurerIA()) {
  const g = gardes(reg), de = (d) => g.filter((x) => x.decision === d);
  const evitees = de('évitée'), lancees = [...de('lancée'), ...de('arrêtée')];
  const eco = evitees.filter((x) => x.economie?.calcul_s != null);
  const prix = config.prix_par_million_de_tokens;
  return { mode: config.mode, budget: budget(reg, config, ia),
    ia: ia.mesurable ? { ...ia, par_depot: ia.par_depot, cout_estime: prix ? Number((((ia.tokens_entree * (prix.entree ?? 0)) + (ia.tokens_sortie * (prix.sortie ?? 0)) + (ia.tokens_cache_ecrits * (prix.cache_ecrit ?? 0)) + (ia.tokens_cache_lus * (prix.cache_lu ?? 0))) / 1e6).toFixed(2)) : null, devise: prix?.devise ?? null } : ia,
    missions: { lancees: lancees.length, evitees: evitees.length, refusees: de('refusée').length, arretees: de('arrêtée').length, anomalies: g.filter((x) => x.anomalie).length },
    calcul_s_mesure: Number(lancees.reduce((s, x) => s + (x.reel?.calcul_s ?? 0), 0).toFixed(1)),
    economie: { calcul_s: eco.length ? Number(eco.reduce((s, x) => s + x.economie.calcul_s, 0).toFixed(1)) : null, sur: eco.length, non_chiffrees: evitees.length - eco.length, tokens: null } };
}
