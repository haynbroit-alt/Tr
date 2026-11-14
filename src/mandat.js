// MANDAT — posture entrepreneuriale de l'espace commun. L'initiative est la règle ; la validation du propriétaire est
// réservée à ce qui engage son argent, sa parole ou l'irréversible. Ce module décide du droit d'agir et tient le compte
// de l'argent engagé ; il ne mesure aucun gain : un gain n'existe que consigné au journal avec sa preuve.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export const P = 'mandat#1';
export const lireMandat = (racine) => JSON.parse(readFileSync(join(racine, 'mandat.json'), 'utf8'));

const actes = (reg) => reg.lignes.filter((r) => r.type === 'initiative');
// dépense engagée : la somme des seules initiatives exécutées, telles que consignées — jamais une estimation
export const engage = (reg) => actes(reg).filter((r) => r.decision === 'exécutée').reduce((s, r) => s + r.nature.depense_eur, 0);

// nature : { depense_eur, tiers, engagement, irreversible, fictif, illegal }
//   tiers        : un message part vers quelqu'un d'autre que le propriétaire, en son nom
//   engagement   : prix affiché, contrat, promesse de livrer
//   irreversible : ne se défait pas en un geste (hors la dépense elle-même, couverte par le plafond)
export function classer(mandat, deja_engage, nature) {
  if (!(nature.depense_eur >= 0)) throw new Error('nature.depense_eur attendu : un nombre d’euros, 0 si aucune dépense');
  if (nature.fictif) return { decision: 'interdite', motifs: ['un résultat simulé ne se présente jamais comme réel'] };
  if (nature.illegal) return { decision: 'interdite', motifs: ['activité illégale'] };
  const motifs = [];
  if (deja_engage + nature.depense_eur > mandat.depense_max_eur) motifs.push(`dépense de ${nature.depense_eur} € au-delà du plafond (${deja_engage} € engagés sur ${mandat.depense_max_eur} €)`);
  if (nature.tiers && mandat.contacts !== 'envoi autorisé') motifs.push('message à un tiers au nom du propriétaire : brouillon seulement');
  if (nature.engagement) motifs.push('engagement de prix ou de contrat');
  if (nature.irreversible) motifs.push('ne se défait pas en un geste');
  return { decision: motifs.length ? 'à valider' : 'exécutée', motifs };
}

function ouvrir(reg) {
  if (!reg.lignes.some((r) => r.type === 'probleme' && r.cle === P)) reg.ajouter({ type: 'probleme', cle: P, probleme: P, auteur: 'registre', titre: 'Mandat entrepreneurial', question: 'Quelles initiatives ont été prises, lesquelles attendent le propriétaire, combien d’argent est engagé ?', source: 'mandat.json' });
}

// Consigne une initiative avec la décision du mandat. `valide` : le propriétaire a dit oui à cette action précise ;
// cela lève une attente, jamais une interdiction. `abandon` : clôt une attente sans l'exécuter.
export function consigner(reg, mandat, { cle, action, nature, attendu, resultat, auteur = 'registre' }, { valide = false, abandon = false } = {}) {
  ouvrir(reg);
  const c = classer(mandat, engage(reg), nature);
  const decision = abandon ? 'abandonnée' : c.decision === 'à valider' && valide ? 'exécutée' : c.decision;
  reg.ajouter({ probleme: P, type: 'initiative', auteur, cle, action, nature, decision, motifs: c.motifs, ...(decision === 'exécutée' && c.motifs.length ? { validation: 'propriétaire' } : {}), ...(attendu ? { attendu } : {}), ...(resultat ? { resultat } : {}) });
  return reg.lignes.at(-1);
}

// État : plafond, argent engagé, et la file de ce qui attend le propriétaire (dernier acte de chaque clé).
export function etat(reg, mandat) {
  const dernier = new Map();
  for (const r of actes(reg)) dernier.set(r.cle, r);
  const e = engage(reg);
  return {
    depense_max_eur: mandat.depense_max_eur, engage_eur: e, reste_eur: mandat.depense_max_eur - e, contacts: mandat.contacts,
    executees: [...dernier.values()].filter((r) => r.decision === 'exécutée'),
    a_valider: [...dernier.values()].filter((r) => r.decision === 'à valider'),
  };
}
