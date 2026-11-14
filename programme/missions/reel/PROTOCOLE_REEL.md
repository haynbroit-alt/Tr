# Protocole RÉEL — GALILÉE sur des mesures réelles de référence

Écrit le 14 novembre 2026, **avant toute exécution du moteur sur ces données**. Seuls les en-têtes des fichiers ont
été lus (nom, nature « observé » ou « généré », nombre de points, modèle de l'étude, écart-type certifié).

## Pourquoi

Les trois exemples du dossier de mission sont sur données simulées. Un client fournit des mesures réelles, dans ses
unités, sans monde à interroger. Question : sur des mesures réelles dont une référence indépendante existe, la loi
rendue par GALILÉE en mode « données fournies » prédit-elle des points qu'elle n'a pas vus aussi bien que la référence ?

## Données

Jeux de régression non linéaire du NIST (Statistical Reference Datasets), œuvre du gouvernement des États-Unis,
domaine public. Copie dans `nist/`, tirée de l'archive source publique `lmfit-1.3.4.tar.gz` (dossier `NIST_STRD`) :
le site du NIST n'est pas joignable depuis cet environnement. Chaque fichier donne les mesures, le modèle retenu par
l'étude d'origine et l'écart-type résiduel certifié de ce modèle ajusté sur toutes les mesures.

- **Lot de réglage** — les 9 jeux marqués « Generated Data » : Gauss1 à 3, Lanczos1 à 3, MGH09, MGH10, MGH17.
  Ils servent à écrire le lecteur et à fixer la mise à l'échelle. Leurs scores sont publiés, sans critère.
- **Lot de test** — tous les jeux marqués « Observed Data », sans exclusion : 18 fichiers, 16 jeux distincts
  (Misra1a et Misra1b portent les mêmes mesures, Misra1c et Misra1d aussi ; un jeu répété compte une fois, avec le
  plus petit des écarts-types certifiés). Bennett5, BoxBOD, Chwirut1, Chwirut2, DanWood, ENSO, Eckerle4, Hahn1,
  Kirby2, Misra1a, Misra1c, Nelson, Rat42, Rat43, Roszman1, Thurber.

La grandeur à prédire est celle que le modèle du NIST prédit (pour Nelson : le logarithme de la réponse), afin que
l'écart-type certifié soit comparable.

## Dispositif

- Moteur : copie gelée de GALILÉE (`moteurs/galilee`, commit `be42b7e`), par `loiSurDonnees` de
  `src/adaptateurs/galilee.js`, graine 1. Aucun fichier de moteur n'est modifié. Le moteur ne reçoit ni le modèle de
  l'étude ni l'écart-type certifié.
- Partage, fixé ici : mesures triées par variable explicative (puis par réponse) ; une mesure sur quatre est mise de
  côté (rangs 2, 6, 10, …). Le moteur voit les autres. C'est un test d'interpolation ; l'extrapolation n'est pas mesurée.
- Mise à l'échelle : choisie sur le lot de réglage, écrite au journal ci-dessous avant le test, puis inchangée.
- Mesure par jeu : erreur quadratique moyenne de la loi rendue sur les mesures mises de côté, divisée par
  l'écart-type certifié. Aucune loi rendue, ou valeur non finie : échec.

## Critères, fixés avant le test

- Un jeu est **au niveau de la référence** si ce rapport est au plus 2.
- **E1 (principal)** : au moins 8 jeux sur 16 au niveau de la référence.
- **E2 (franchise)** : aucun jeu dont le rapport dépasse 10 n'est dit « établie » par le moteur.
- Publiés sans critère : la forme rendue à côté du modèle de l'étude, le verdict du moteur, le temps de calcul.

Exécution **unique** du lot de test. Les échecs sont publiés. Un critère manqué n'est pas rattrapé par un second essai.

## Limites connues d'avance

- L'écart-type certifié vient d'un ajustement sur toutes les mesures, avec le modèle choisi par des spécialistes :
  la barre est haute, et le rapport 2 est un choix.
- Seize jeux : une proportion à ±25 points près, pas une statistique.
- Mesures de laboratoire, propres et denses pour certaines : ce ne sont pas des données d'entreprise.

## Journal de réglage

14 novembre 2026, avant le test. Script : `scripts/reel-nist.js`. Sorties : `reglage-brut.json`, `reglage-norme.json`.

| Jeu généré | Rapport, données brutes | Rapport, données mises à l'échelle |
|---|---:|---:|
| Gauss1 | 4,50 | 3,58 |
| Gauss2 | 4,77 | 4,76 |
| Gauss3 | 2,93 | 2,83 |
| Lanczos1 | 2,1 × 10¹⁰ | 3,8 × 10¹⁰ |
| Lanczos2 | 6 913 | 3 082 |
| Lanczos3 | 328 | 115 |
| MGH09 | 10,5 | 17,8 |
| MGH10 | 246 | 146 |
| MGH17 | 18,9 | 8,9 |

Aucun jeu généré n'est au niveau de la référence, dans un cas comme dans l'autre. Ces jeux sont presque sans bruit
(écart-type certifié jusqu'à 10⁻¹¹) : le rapport y est sans pitié et dit surtout que le moteur ne retrouve pas ces
formes à plusieurs termes.

**Choix fixé** : mise à l'échelle (chaque variable et la réponse divisées par leur plus grande valeur absolue sur
les mesures vues), meilleure sur 7 jeux sur 9, et indépendante des unités du client. La loi rendue s'écrit donc
dans ces variables réduites. Le script n'est plus modifié avant le test.

Commande du test, une seule fois :
`node scripts/reel-nist.js --lot observe --echelle norme --out programme/missions/reel/test-observe.json`
