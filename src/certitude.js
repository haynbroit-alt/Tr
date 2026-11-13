// Échelle de certitude commune. Elle reprend le § 7 de la conception de LAVOISIER, qui fusionne déjà les
// vocabulaires de GALILÉE (« établie / empirique / incertaine ») et de CORTEX (« compris / mal estimé / hors de portée »).
export const NIVEAUX = {
  'identité': { rang: 5, decidable: true, sens: 'conservation vérifiée par addition' },
  'établie': { rang: 4, decidable: true, sens: 'pari gagné et contre-expertise passée (second avis, hors domaine)' },
  'empirique': { rang: 3, decidable: true, sens: 'pari gagné sur des jours neufs, dans le domaine observé seulement' },
  'hypothèse': { rang: 2, decidable: false, sens: 'crédible sur des données déjà vues, pas encore pariée : ne sert qu’à choisir une expérience' },
  'hors de portée': { rang: 1, decidable: false, sens: 'structure détectée que le langage du moteur n’exprime pas' },
  'réfutée': { rang: 0, decidable: false, sens: 'contredite par une vérification' },
};

// Une loi de GALILÉE tirée de données qu'il n'a pas choisies n'a gagné aucun pari : quel que soit son propre verdict,
// elle entre dans le registre comme hypothèse. Son verdict d'origine est conservé à côté.
export const depuisGalilee = (verdict) => ({ niveau: 'hypothèse', verdict_moteur: verdict ?? 'aucun' });

// Diagnostic de la sonde de CORTEX. « compris » et « mal estimé » décrivent l'état de son modèle, pas une découverte.
export const depuisSonde = (diag) => (diag === 'hors de portée' ? 'hors de portée' : null);

// Seule une vérification de portée « pari » (e-valeur au-dessus du seuil fixé d'avance, sur des données que
// l'affirmation n'a pas vues) peut élever un niveau. Une prévision réussie ou la vérité d'un banc d'essai sont
// consignées, mais n'élèvent rien : la première n'est pas garantie, la seconde n'existe pas hors simulation.
export const PORTEES = ['pari', 'prevision', 'verite-du-banc', 'temoin-negatif'];
