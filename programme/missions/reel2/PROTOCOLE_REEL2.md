# Protocole RÉEL-2 — le garde-fou de livraison sur des données réelles neuves, tous domaines

Écrit le 14 novembre 2026, **avant toute exécution du moteur sur ces données**. Seuls les noms de colonnes et la
première ligne de chaque fichier ont été lus.

## Pourquoi

`RESULTATS_REEL.md` a montré, après coup, qu'un contrôle simple (la loi doit battre une droite et une constante sur
des mesures mises de côté) écartait 5 échecs sur 7. Un calcul après coup ne prouve rien. Ici le contrôle est jugé
sur des données qu'il n'a jamais vues, dans des domaines où personne ne fournit de référence certifiée : sciences
de la nature, technique, économie, finance.

## Données

Paquet public `vega-datasets` 3.3.1 (licence BSD-3, jeux réels de sources publiques), pris au registre de paquets.
Les colonnes utiles sont copiées dans `donnees/`. Un jeu de plus de 400 lignes est réduit à 400 lignes régulièrement
espacées dans l'ordre du fichier. Les lignes incomplètes sont écartées.

| | Domaine | Jeu | Réponse | Variables | Partage |
|---|---|---|---|---|---|
| S1 | nature | CO₂ à Mauna Loa | CO₂ | date | temps |
| S2 | nature | température mondiale | écart de température | année | temps |
| S3 | nature | manchots | masse | longueur de l'aile | entrelacé |
| S4 | nature | manchots | hauteur du bec | longueur du bec | entrelacé |
| T1 | technique | voitures | consommation (milles par gallon) | poids | entrelacé |
| T2 | technique | voitures | consommation | puissance | entrelacé |
| T3 | technique | voitures | accélération | puissance, poids | entrelacé |
| E1 | économie | pays (santé et revenu) | espérance de vie | revenu par habitant | entrelacé |
| E2 | économie | pays (plusieurs années) | espérance de vie | fécondité | entrelacé |
| E3 | économie | blé et salaires (Playfair) | prix du blé | salaire | entrelacé |
| E4 | économie | films | recettes mondiales | budget | entrelacé |
| E5 | économie | conduite aux États-Unis | milles parcourus par habitant | prix de l'essence | entrelacé |
| F1 | finance | indice S&P 500, mensuel | rendement du mois suivant | rendement du mois | temps |
| F2 | finance | action MSFT, mensuel | rendement du mois suivant | rendement du mois | temps |
| F3 | finance | indice S&P 500, mensuel | cours | date | temps |

**Témoins négatifs** : pour chaque tâche à partage entrelacé, la même tâche avec la réponse mélangée au hasard
(permutation de graine fixe) : il n'y a alors rien à trouver. F1 et F2 sont aussi attendus sans loi.

## Dispositif

- Chaîne de livraison telle quelle (`src/loi-client.js`, copie gelée de GALILÉE `be42b7e`, graine 1, variables
  réduites), sans réglage.
- Partage en trois, fixé ici. **Entrelacé** : mesures triées par variables puis réponse ; rangs 0 et 1 (modulo 4)
  vus par le moteur, rang 2 pour la décision, rang 3 pour le jugement final. **Temps** : première moitié vue, quart
  suivant pour la décision, dernier quart pour le jugement final — une prédiction de l'avenir.
- **Décision du garde-fou** : loi *retenue* si, sur la partie « décision », elle se trompe moins que la droite et
  que la constante ajustées sur la partie vue.
- **Jugement final** : une loi *tient* si elle bat encore ces deux témoins sur la partie finale, jamais utilisée.

## Critères, fixés avant le test

- **C1 (principal)** : parmi les lois retenues sur les 15 tâches réelles, au moins 80 % tiennent au jugement final.
  Moins de 5 lois retenues : non concluant.
- **C2 (témoins négatifs)** : sur les réponses mélangées et sur F1 et F2, au plus 1 loi retenue.
- Publié sans critère : les lois, tâche par tâche ; les lois écartées qui auraient tenu ; le verdict du moteur.

Exécution **unique**. Les échecs sont publiés.

## Limites connues d'avance

- « Battre une droite » est une barre basse : une loi qui tient n'est ni une loi de la nature ni un mécanisme
  économique, seulement une courbe qui prédit mieux qu'un trait.
- Quinze tâches choisies par moi dans un paquet de démonstration : des constats, pas des statistiques.
- En finance, une loi retenue sur un quart de l'historique ne dit rien d'un gain : ni frais, ni risque, ni exécution.
