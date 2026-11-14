// Consigne un progrès individuel d'un moteur. Le jalon cite le dépôt, le commit et le fichier où le chiffre se lit :
// TR ne produit pas le chiffre, il le recopie.
import { moteur } from './adaptateurs/moteurs.js';

export function jalon(reg, j) {
  const P = 'progres#individuels';
  if (!reg.lignes.some((r) => r.type === 'probleme' && r.cle === P)) reg.ajouter({ probleme: P, type: 'probleme', cle: P, auteur: 'registre', titre: 'Progrès individuels des moteurs',
    question: 'Qu’est-ce que chaque moteur a gagné seul, dans son dépôt, mesuré sur son propre banc ?', source: { generateur: 'dépôts des moteurs', graine: '—', statut: 'jalons' } });
  const nom = { 'GALILÉE': 'galilee', CORTEX: 'cortex', LAVOISIER: 'lavoisier' }[j.moteur];
  return reg.ajouter({ probleme: P, type: 'jalon', auteur: j.moteur, moteur: { ...moteur(nom), commit: j.commit }, compte: 'individuel', travail: j.travail, mesure: j.mesure, ...(j.repere ? { repere: j.repere, valeur: j.valeur } : {}), avant: j.avant, apres: j.apres, seuil: j.seuil ?? null, source: j.source, portee: j.portee, note: j.note ?? null });
}
