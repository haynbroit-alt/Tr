// Les pistes de revenu. Chaque critère dit sur quoi il repose : mesuré (données réelles), mesuré en simulation,
// estimé, ou inconnu. Aucun chiffre de marché n'est inventé : ce qui n'a pas été mesuré est écrit « inconnu ».
import { NIVEAUX } from './certitude.js';

const med = (v) => { const s = [...v].sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : null; };
const som = (v) => v.reduce((a, b) => a + b, 0);

// Bilan chiffré des campagnes en simulation, entièrement déduit du journal.
export function bilanCampagne(reg) {
  const etat = reg.etat(), de = (pfx) => reg.lignes.filter((r) => r.type === 'probleme' && r.cle.startsWith(pfx)).map((p) => p.cle);
  const E = de('entreprise-opaque#'), F = de('forme-manquante#');
  const dans = (cles) => (r) => cles.includes(r.probleme);
  const fuites = etat.filter((e) => E.includes(e.probleme) && e.sujet.startsWith('fuite sur'));
  const eco = (id) => reg.lignes.find((r) => r.type === 'economie' && r.cible === id)?.gain;
  const vraies = fuites.filter((f) => f.banc === 'confirme'), fausses = fuites.filter((f) => f.banc === 'refute');
  const manquees = reg.lignes.filter((r) => E.includes(r.probleme) && r.type === 'aveu' && r.auteur === 'banc').length;
  const corps = reg.lignes.filter((r) => E.includes(r.probleme) && r.type === 'affirmation' && r.sujet === 'corps de l’entreprise');
  const lois = etat.filter((e) => E.includes(e.probleme) && e.sujet.includes('loi quantité–prix'));
  const prev = reg.lignes.filter((r) => E.includes(r.probleme) && r.type === 'verification' && r.portee === 'prevision');
  const sondes = etat.filter((e) => F.includes(e.probleme) && e.sujet.includes('structure manquante'));
  const loisF = etat.filter((e) => F.includes(e.probleme) && e.sujet.includes('loi de l’écart'));
  const temoins = reg.lignes.filter((r) => F.includes(r.probleme) && r.type === 'verification' && r.portee === 'temoin-negatif');
  const essais = reg.lignes.filter((r) => F.includes(r.probleme) && r.type === 'resultat');
  return {
    entreprises: { n: E.length, avec_fuite_signalee: new Set(fuites.map((f) => f.probleme)).size, fuites_signalees: fuites.length, confirmees: vraies.length, fausses: fausses.length, manquees,
      eur_deja_perdus: Math.round(som(vraies.map((f) => eco(f.id)?.deja_perdu ?? 0))), eur_par_an: Math.round(som(vraies.map((f) => eco(f.id)?.par_an_si_colmatee ?? 0))),
      eur_par_an_mediane: med(vraies.map((f) => eco(f.id)?.par_an_si_colmatee ?? 0)), eur_fausses_par_an: Math.round(som(fausses.map((f) => eco(f.id)?.par_an_si_colmatee ?? 0))),
      profit_median: Math.round(med(corps.map((c) => som(c.contenu.profit_mensuel)))), corps_confirmes: etat.filter((e) => E.includes(e.probleme) && e.sujet === 'corps de l’entreprise' && e.banc === 'confirme').length,
      calcul_s_median: med(corps.map((c) => c.cout.calcul_s)),
      lois_prix: lois.length, lois_prevision_confirmee: prev.filter((v) => v.verdict === 'confirme').length, lois_prevision_refutee: prev.filter((v) => v.verdict === 'refute').length,
      modes_cortex: etat.filter((e) => E.includes(e.probleme) && e.sujet.includes('mode caché')).length },
    formes: { n: F.length, signalees: sondes.length, signal_juste: sondes.filter((s) => s.banc === 'confirme').length, lois: loisF.length, lois_empiriques: loisF.filter((l) => NIVEAUX[l.niveau].rang >= 3).length,
      lois_justes: loisF.filter((l) => l.banc === 'confirme').length, empiriques_et_justes: loisF.filter((l) => NIVEAUX[l.niveau].rang >= 3 && l.banc === 'confirme').length,
      temoins: temoins.length, temoins_refuses: temoins.filter((t) => t.verdict === 'indecis').length, jours_essai: som(essais.map((r) => r.cout_reel.jours ?? 0)) },
  };
}

export function pistes(reg) {
  const P = 'pistes#1', base = { probleme: P, type: 'piste', auteur: 'registre', argent_reel: 0 };
  const b = bilanCampagne(reg), e = b.entreprises, f = b.formes, fr = (x) => Math.round(x).toLocaleString('fr-FR');
  const boutique = reg.lignes.filter((r) => r.type === 'affirmation' && r.probleme.startsWith('boutique-reelle#')).map((r) => r.id);
  reg.ajouter({ probleme: P, type: 'probleme', cle: P, auteur: 'registre', titre: 'Pistes de revenu',
    question: 'Quelles pistes peuvent rapporter de l’argent réel, légal et durable ? Que vaut chacune, sur quoi repose l’évaluation, et quel est le plus petit essai qui trancherait ?',
    source: { generateur: 'synthèse du journal', graine: '—', statut: 'évaluation' }, bilan: b });

  reg.ajouter({ ...base, rang: 1, origine: 'connu', depend_de: boutique, titre: 'Amener de vrais visiteurs français sur la boutique existante',
    resume: 'La boutique est ouverte, configurée, livre en France et n’a jamais reçu une visite française. C’est la seule piste dont l’actif existe déjà et dont le revenu se mesure directement en euros encaissés.',
    potentiel: { base: 'inconnu', texte: 'Inconnu, et c’est le premier point à mesurer : aucun visiteur réel n’a encore vu les fiches. Prix de vente de 19,90 à 69,90 € ; marge inconnue tant que le coût d’achat n’est pas renseigné.' },
    cout: { base: 'inconnu', texte: 'Le budget d’un essai est une décision de l’utilisateur. À fixer avant, avec un plafond de perte.' },
    risque: { base: 'estimé', texte: 'Perdre le budget de l’essai. Vendre sans stock réel ni marge connue serait pire que ne pas vendre. À vérifier avant toute publicité : mentions légales, droit de rétractation, marquage CE des appareils électriques.' },
    faisabilite: { base: 'mesuré', texte: 'Boutique ouverte sans mot de passe, paiement et livraison configurés (relevé du 13 novembre 2026). Il manque : coût d’achat, source du stock, un canal d’acquisition.' },
    test: { etat: 'attend une décision', protocole: 'Écrit avant : un produit, un canal, un budget plafonné, une durée. Mesures : visites françaises, ajouts au panier, commandes, marge après coût d’achat et coût d’acquisition. Arrêt dès le plafond atteint. Succès = marge encaissée > dépense ; sinon la piste est notée réfutée.', role_des_moteurs: 'Aucun avant les premières ventes. Ensuite : LAVOISIER sur les commandes et versements réels, puis CORTEX pour planifier un essai de prix et GALILÉE pour la loi de demande.' } });

  reg.ajouter({ ...base, rang: 2, origine: 'connu', titre: 'Service d’audit de fuites par conservation (LAVOISIER)',
    resume: 'Retrouver dans les écritures d’une entreprise l’argent qui disparaît sans être enregistré : remises non saisies, démarque, frais oubliés.',
    potentiel: { base: 'mesuré en simulation', texte: `Sur ${e.n} entreprises simulées : ${e.confirmees} fuites réelles retrouvées, valant ${fr(e.eur_par_an)} € par an au total (médiane ${fr(e.eur_par_an_mediane)} € par an, pour un profit médian de ${fr(e.profit_median)} €). Ce qu’un client paierait pour cela est inconnu.` },
    cout: { base: 'mesuré en simulation', texte: `Calcul : ${e.calcul_s_median} s par entreprise (médiane). Le vrai coût est ailleurs et n’est pas mesuré : lire des écritures réelles, trouver un premier client.` },
    risque: { base: 'mesuré en simulation', texte: `${e.fausses} fausse(s) alerte(s) sur ${e.fuites_signalees} (${fr(e.eur_fausses_par_an)} € par an annoncés à tort) et ${e.manquees} fuite(s) manquée(s). Graines de développement : le bilan n’est pas gelé, son test M0 n’a pas eu lieu. Données comptables : confidentialité et RGPD.` },
    faisabilite: { base: 'estimé', texte: 'Le moteur ne lit que le format de son banc d’essai. Il faudrait un lecteur d’écritures réelles (en France, le fichier des écritures comptables est un format légal standard) et des relevés bancaires. Non écrit.' },
    test: { etat: 'fait en simulation', resultat: `${e.confirmees} fuites justes, ${e.fausses} fausses, ${e.manquees} manquées sur ${e.n} entreprises`, reste: 'Geler le bilan et exécuter M0. Puis un seul jeu d’écritures réelles, avec l’accord écrit de l’entreprise, sans rien facturer : la fuite annoncée existe-t-elle ?' } });

  reg.ajouter({ ...base, rang: 3, origine: 'inconnu', titre: 'Essais de prix à garantie statistique (GALILÉE + CORTEX)',
    resume: 'Trouver une loi de demande que personne n’a donnée, puis la démontrer par un essai planifié, avec un risque de fausse découverte fixé d’avance.',
    potentiel: { base: 'inconnu', texte: `En simulation, la chaîne fonctionne sur des leviers abstraits, sans euros : ${f.lois_empiriques} loi(s) démontrée(s) sur ${f.n} mondes, dont ${f.empiriques_et_justes} conforme(s) à la vérité. Aucun gain en euros n’a été mesuré, nulle part.` },
    cout: { base: 'mesuré en simulation', texte: `${f.jours_essai} jours d’essai simulés au total, 91 par loi. Sur une boutique réelle, un essai de prix demande assez de ventes pour conclure : la boutique actuelle en a zéro.` },
    risque: { base: 'mesuré en simulation', texte: `${f.temoins_refuses} formule(s) fausse(s) refusée(s) sur ${f.temoins} injectée(s). La sonde ne signale que ${f.signalees} monde(s) sur ${f.n} alors que tous contenaient une forme. Dans les entreprises simulées : ${e.lois_prix} lois quantité–prix proposées, ${e.lois_prevision_confirmee} confirmée(s) en prévision.` },
    faisabilite: { base: 'estimé', texte: 'Bloquée deux fois : le pari de CORTEX n’est pas exporté hors de ses mondes, et il faut un commerce avec des ventes régulières où faire varier un prix.' },
    test: { etat: 'fait en simulation', resultat: `${f.lois_empiriques} loi(s) passée(s) d’hypothèse à empirique par essai commun`, reste: 'Dépend de la piste 1 : sans ventes, rien à tester.' } });

  reg.ajouter({ ...base, rang: 4, origine: 'connu', titre: 'Vendre GALILÉE comme outil de découverte de lois',
    resume: 'Proposer le moteur à des laboratoires ou des bureaux d’études.',
    potentiel: { base: 'inconnu', texte: 'Aucune donnée de marché n’a pu être relevée (le service de mots-clés connecté n’a plus d’unités). Des outils gratuits de régression symbolique existent déjà.' },
    cout: { base: 'estimé', texte: 'Faible en calcul ; élevé en prospection.' },
    risque: { base: 'estimé', texte: 'Marché étroit et déjà servi gratuitement.' },
    faisabilite: { base: 'mesuré', texte: 'Le moteur est terminé, testé, et tourne dans un navigateur.' },
    test: { etat: 'non fait', reste: 'Aucun essai sérieux possible sans données de marché. Piste gardée en réserve.' } });
  if (e.modes_cortex > 0) reg.ajouter({ probleme: P, type: 'aveu', auteur: 'registre',
    motif: `Mise en garde : CORTEX propose ${e.modes_cortex} mécanismes cachés sur les débits des entreprises simulées, presque tous une mémoire d’un débit sur lui-même. Ce nombre est trop élevé pour être pris tel quel. Deux lectures, non départagées : des ruptures de stock réelles (après de fortes ventes, moins de ventes), ou un artefact de la transmission (des comptages journaliers souvent nuls, que son modèle ne prévoit pas). Ils restent tous « hypothèse ». L’épreuve à faire : les comparer aux stocks que LAVOISIER reconstruit.` });
  return b;
}
