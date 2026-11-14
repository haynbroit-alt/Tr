// Quatre comptes tenus séparément, pour ne jamais confondre un progrès de moteur, un progrès commun, une dépense
// et un euro encaissé. Les trois derniers sont déduits du journal ; le premier vient des résultats des moteurs.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { RACINE } from './adaptateurs/moteurs.js';
import { NIVEAUX } from './certitude.js';

const atteint = (r) => (r.valeur == null || r.seuil == null ? null : r.sens === 'haut' ? r.valeur >= r.seuil : r.valeur <= r.seuil);

export function comptes(reg) {
  const rep = JSON.parse(readFileSync(join(RACINE, 'programme', 'reperes.json'), 'utf8')), L = reg.lignes, etat = reg.etat();
  const moteurs = ['GALILÉE', 'CORTEX', 'LAVOISIER'];
  const jalons = L.filter((r) => r.type === 'jalon');
  const individuel = Object.fromEntries(moteurs.map((m) => [m, { ...rep[m], reperes: rep[m].reperes.map((r) => ({ ...r, atteint: atteint(r) })), jalons: jalons.filter((j) => j.auteur === m) }]));
  const verifs = L.filter((r) => r.type === 'verification'), auteurDe = (id) => reg.get(id)?.auteur;
  const croisees = verifs.filter((v) => moteurs.includes(v.auteur) && moteurs.includes(auteurDe(v.cible)) && v.portee !== 'temoin-negatif');
  const collectif = {
    problemes_communs: L.filter((r) => r.type === 'probleme' && /^(forme-manquante|entreprise-opaque|boutique-reelle)#/.test(r.cle)).length,
    affirmations_par_moteur: Object.fromEntries(moteurs.map((m) => [m, etat.filter((e) => e.auteur === m).length])),
    verifications_d_un_moteur_par_un_autre: croisees.length,
    contestations: L.filter((r) => r.type === 'contestation').length,
    experiences_communes_executees: L.filter((r) => r.type === 'resultat').length,
    experiences_impossibles: L.filter((r) => r.type === 'experience' && r.autorisation === 'impossible').length,
    lois_passees_a_empirique: etat.filter((e) => e.historique.length > 1 && NIVEAUX[e.niveau].rang >= 3).length,
    affirmations_ecartees: etat.filter((e) => e.niveau === 'réfutée').length,
    aveux: L.filter((r) => r.type === 'aveu').length,
    jalons: jalons.filter((j) => j.compte === 'collectif'),
  };
  const calcul = L.reduce((s, r) => s + (r.type === 'affirmation' ? r.cout.calcul_s ?? 0 : r.type === 'resultat' ? r.cout_reel.calcul_s ?? 0 : 0), 0);
  const couts = { calcul_s: Math.round(calcul), jours_d_essai_simules: L.filter((r) => r.type === 'resultat').reduce((s, r) => s + (r.cout_reel.jours ?? 0), 0),
    euros_depenses: 0, non_releve: ['abonnement et frais de la boutique', 'temps humain'] };
  const eco = L.filter((r) => r.type === 'economie');
  const gains = { euros_encaisses: eco.reduce((s, e) => s + (e.gain.encaisse ?? 0), 0) + L.filter((r) => r.type === 'piste').reduce((s, p) => s + p.argent_reel, 0),
    a_part_potentiel_simule_par_an: Math.round(eco.filter((e) => e.gain.base === 'comptable' && etat.find((x) => x.id === e.cible)?.banc === 'confirme').reduce((s, e) => s + (e.gain.par_an_si_colmatee ?? 0), 0)) };
  return { individuel, collectif, couts, gains };
}
