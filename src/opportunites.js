// Les opportunités de valeur réelle. Chaque opportunité suit les dix points de la mission commune ; le registre
// refuse celles qui chiffrent un potentiel sans mesure, qui n'ont pas d'expérience falsifiable ou pas d'abandon.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { RACINE } from './adaptateurs/moteurs.js';

export function opportunites(reg, fichier) {
  const P = `opportunites#${fichier.replace(/\D/g, '')}`, liste = JSON.parse(readFileSync(join(RACINE, 'programme', fichier), 'utf8'));
  const id = (sujet) => reg.lignes.filter((r) => (r.type === 'affirmation' && r.sujet === sujet) || (r.type === 'piste' && r.titre === sujet) || (r.type === 'jalon' && r.mesure === sujet)).map((r) => r.id);
  reg.ajouter({ probleme: P, type: 'probleme', cle: P, auteur: 'registre', titre: 'Opportunités de valeur réelle',
    question: 'Dans tous les secteurs : quelle opportunité peut être démontrée puis encaissée dans le monde réel, à quel coût de vérification, avec quelle expérience falsifiable et quelles conditions d’abandon ?',
    source: { generateur: `programme/${fichier}`, graine: '—', statut: 'instruction en dix points' } });
  for (const o of liste) reg.ajouter({ ...o, probleme: P, type: 'opportunite', auteur: 'registre', preuves: undefined, depend_de: (o.preuves ?? []).flatMap(id) });
  return liste.length;
}
