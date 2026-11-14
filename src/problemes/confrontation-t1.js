// Confrontation T1 — les mécanismes cachés proposés par CORTEX sur les débits de LAVOISIER résistent-ils à l'examen ?
// Protocole : programme/PROGRAMME.md, § T1. Aucun moteur n'est relancé : on relit ce que le registre avait transmis.
import * as L from '../adaptateurs/lavoisier.js';
import { JOURS_ACTIFS_MIN } from './entreprise-opaque.js';

export function confrontationT1(reg) {
  const P = 'confrontation#T1';
  const modes = reg.lignes.filter((r) => r.type === 'affirmation' && r.auteur === 'CORTEX' && r.probleme.startsWith('entreprise-opaque#') && r.sujet.includes('mode caché'));
  reg.ajouter({ probleme: P, type: 'probleme', cle: P, auteur: 'registre', titre: 'Confrontation T1 : mécanismes de CORTEX contre débits de LAVOISIER',
    question: `CORTEX a proposé ${modes.length} mécanismes cachés sur les débits reconstruits par LAVOISIER. Les séries transmises étaient-elles des mesures quotidiennes, comme son modèle le suppose ?`,
    source: { generateur: 'relecture du journal et des journaux d’événements (graines de développement)', graine: '1 à 24', statut: 'confrontation' } });
  const parEntreprise = new Map();
  for (const m of modes) { if (!parEntreprise.has(m.probleme)) parEntreprise.set(m.probleme, []); parEntreprise.get(m.probleme).push(m); }
  let ecartes = 0, gardes = 0;
  for (const [pb, liste] of parEntreprise) {
    const graine = Number(pb.split('#')[1]), E = L.entreprise(graine), { corps } = L.bilanMatiere(E.observe);
    const jours = new Map();
    for (const r of E.observe.journal) { if (r.montant == null || !r.quantite || !r.objet) continue; if (!jours.has(r.objet)) jours.set(r.objet, new Map()); const t = corps.records[r.id]?.type, o = jours.get(r.objet); if (!o.has(t)) o.set(t, new Set()); o.get(t).add(r.jour); }
    for (const m of liste) {
      const objet = m.sujet.replace('débit ', '').split(' ')[0];
      const actifs = Math.max(...[...(jours.get(objet)?.values() ?? [])].map((s) => s.size), 0);
      if (actifs < JOURS_ACTIFS_MIN) {
        ecartes++;
        reg.ajouter({ probleme: pb, type: 'verification', auteur: 'registre', cible: m.id, portee: 'recevabilite', verdict: 'refute',
          methode: `recevabilité de la série transmise : il faut au moins ${JOURS_ACTIFS_MIN} jours actifs sur 365 pour une mesure quotidienne`,
          mesure: { nom: 'jours actifs', valeur: actifs, seuil: JOURS_ACTIFS_MIN }, note: 'la faute est dans la transmission du registre (une facture mensuelle prise pour un débit), pas dans le moteur de CORTEX' });
      } else gardes++;
    }
  }
  reg.ajouter({ probleme: P, type: 'aveu', auteur: 'registre',
    motif: `Erreur du registre, pas de CORTEX : ${ecartes} des ${modes.length} mécanismes venaient de séries à une douzaine de jours actifs par an (factures mensuelles des entreprises de service). Ils sont écartés. ${gardes} restent, sur des séries quotidiennes, à l’état d’hypothèse. La règle de transmission exige désormais ${JOURS_ACTIFS_MIN} jours actifs.` });
  reg.ajouter({ probleme: P, type: 'jalon', auteur: 'registre', travail: 'T1', mesure: 'mécanismes cachés non recevables encore au registre', avant: ecartes, apres: 0,
    source: 'src/problemes/confrontation-t1.js', compte: 'collectif' });
  return { total: modes.length, ecartes, gardes };
}
