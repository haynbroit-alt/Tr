// Problème commun n° 3 — la boutique réelle. Ici, rien n'est simulé : les chiffres sont un relevé en lecture seule
// de la boutique en ligne de l'utilisateur. C'est le seul endroit de cette page où un euro peut être réellement gagné.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import * as C from '../adaptateurs/cortex.js';
import { RACINE } from '../adaptateurs/moteurs.js';
import { empreinte } from '../registre.js';

const arr = (x, n = 3) => Number(x.toFixed(n));

export function boutiqueReelle(reg, fichier) {
  const d = JSON.parse(readFileSync(join(RACINE, 'registre', 'donnees', fichier), 'utf8'));
  const P = `boutique-reelle#${fichier.replace(/\D/g, '')}`, base = { probleme: P }, reproduire = `node bin/commun.js executer boutique-reelle --fichier ${fichier}`;
  const preuve = (methode) => ({ methode, donnees: empreinte(d).slice(0, 16), reproduire });
  reg.ajouter({ ...base, type: 'probleme', cle: P, auteur: 'registre', titre: 'Boutique réelle',
    question: 'Une vraie boutique en ligne, ouverte depuis 111 jours. Combien a-t-elle gagné, qu’est-ce qui l’empêche de vendre, et que peuvent y faire les trois moteurs ?',
    source: { generateur: d.source, graine: '—', statut: 'données réelles' }, roles: { CORTEX: 'modes lents sur les visites', LAVOISIER: 'rien à reconstruire encore', GALILÉE: 'rien à ajuster encore' } });

  const liv = new Set(d.boutique.pays_livres), parPays = d.visites_par_pays, total = d.entonnoir.visites;
  const livrables = Object.entries(parPays).filter(([c]) => liv.has(c)).reduce((s, [, n]) => s + n, 0);
  const idFait = reg.ajouter({ ...base, type: 'affirmation', auteur: 'registre', sujet: 'revenu réel',
    enonce: `Depuis l’ouverture (${d.boutique.ouverte_le}) : ${d.ventes.ventes_brutes_eur} € de ventes, ${d.ventes.commandes_payantes} commande payante, ${total} visites, ${d.entonnoir.ajouts_au_panier} ajout au panier.`,
    certitude: { niveau: 'identité', garantie: 'comptages lus dans la plateforme, sans aucune inférence' },
    contenu: { ventes: d.ventes, entonnoir: d.entonnoir, visites_par_mois: d.visites_par_mois },
    preuve: preuve('relevé ShopifyQL, lecture seule'), cout: { calcul_s: 0, experiences: 0 } });
  const idPays = reg.ajouter({ ...base, type: 'affirmation', auteur: 'registre', depend_de: [idFait], sujet: 'origine des visites',
    enonce: `${parPays.FR ?? 0} visite depuis la France. ${parPays.US} visites sur ${total} viennent des États-Unis, où la boutique ne livre pas ; ${livrables} seulement viennent d’un pays livré.`,
    certitude: { niveau: 'identité', garantie: 'comptages lus dans la plateforme ; la géolocalisation est celle de la plateforme' },
    contenu: { visites_par_pays: parPays, visites_par_source: d.visites_par_source, pays_livres: d.boutique.pays_livres.length },
    preuve: preuve('croisement des visites par pays avec la liste des pays livrés'), cout: { calcul_s: 0, experiences: 0 } });
  reg.ajouter({ ...base, type: 'affirmation', auteur: 'registre', depend_de: [idPays], sujet: 'cause de l’absence de ventes',
    enonce: `La boutique n’a pas été refusée par ses clients : elle ne les a pas rencontrés. Le trafic observé (${arr((100 * d.visites_ordinateur_etats_unis) / total, 0)} % d’ordinateurs américains, ${arr((100 * d.visites_par_source.direct) / total, 0)} % d’accès directs) ressemble à des visites automatiques.`,
    certitude: { niveau: 'hypothèse', garantie: 'aucune : l’origine automatique est une interprétation ; seul un essai avec de vrais visiteurs français peut dire si les fiches vendent' },
    contenu: { visites_utiles: livrables, taux_ajout_panier: `non estimable sur ${livrables} visites` },
    preuve: preuve('lecture des comptages'), cout: { calcul_s: 0, experiences: 0 } });

  // CORTEX, pour de vrai, sur la seule série quotidienne qui existe
  const v = d.visites_par_jour_depuis_ouverture, Y = v.map((x) => [Math.log(x + 1)]), U = v.map(() => [0, 0]);
  const mc = C.modesCaches({ Y, U });
  if (!mc.modes.length) reg.ajouter({ ...base, type: 'aveu', auteur: 'CORTEX', moteur: C.IDENTITE, depend_de: [idFait],
    motif: `Sur ${v.length} jours de visites réelles, aucun mode lent ne gagne son pari (seuil log E = ${arr(mc.seuil, 2)}, ${arr(mc.secs, 1)} s). Aucun levier n’a bougé et il n’y a aucune vente : je n’ai rien à expliquer ni à piloter.` });
  else for (const m of mc.modes) reg.ajouter({ ...base, type: 'affirmation', auteur: 'CORTEX', moteur: C.IDENTITE, depend_de: [idFait], sujet: 'visites : mode caché',
    enonce: `Les visites quotidiennes portent une mémoire lente (constante de temps ≈ ${arr(m.tau, 0)} jours) de leur propre passé.`,
    certitude: { niveau: 'hypothèse', mesure: { nom: 'log E', valeur: arr(m.logE, 2), seuil: arr(mc.seuil, 2) }, garantie: 'pari gagné sur une série de visites surtout automatiques : cela décrit ce trafic, pas des acheteurs' },
    preuve: preuve('modes à τ continu, pari invariant, sur log(visites + 1)'), cout: { calcul_s: arr(mc.secs, 1), experiences: 0 } });
  reg.ajouter({ ...base, type: 'aveu', auteur: 'registre', depend_de: [idFait],
    motif: `LAVOISIER et GALILÉE n’ont pas été lancés sur la boutique. Il n’y a aucun flux d’argent à apparier (une commande à 0 €) ni aucun coût d’achat renseigné, donc pas de bilan ni de marge ; aucun prix n’a varié et rien ne s’est vendu, donc aucune loi à ajuster.` });
  reg.ajouter({ ...base, type: 'economie', auteur: 'registre', cible: idFait,
    cout: { calcul_s: arr(mc.secs, 1), note: 'abonnement de la boutique et frais déjà payés : non relevés' }, risque: { note: 'chaque mois sans visiteur réel coûte l’abonnement sans rien apprendre' },
    gain: { base: 'comptable', unite: '€', encaisse: d.ventes.ventes_brutes_eur, nature: 'revenu réellement encaissé depuis l’ouverture' } });
  return { idFait, idPays, livrables };
}
