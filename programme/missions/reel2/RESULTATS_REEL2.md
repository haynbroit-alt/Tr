# Résultats RÉEL-2 — le garde-fou de livraison sur des données réelles neuves

Protocole : `PROTOCOLE_REEL2.md`, poussé avant toute exécution (commit `4a6a1dd`) ; script et données gelés avant le
test (commit `0b5687b`). Exécution unique du 14 novembre 2026, 39 secondes :
`node scripts/reel2.js --out programme/missions/reel2/test.json`. Copie gelée de GALILÉE (`be42b7e`), graine 1.

## Verdict

| | Critère | Seuil | Mesuré | Verdict |
|---|---|---|---|---|
| **C1** | lois retenues qui tiennent sur la partie finale, jamais utilisée | au moins 80 % | **9 sur 9** | **atteint** |
| **C2** | témoins négatifs retenus à tort (réponses mélangées, rendements boursiers) | au plus 1 | **3 sur 12** | **manqué** |

Le garde-fou ne laisse passer aucune loi qui s'effondre ensuite ; mais quand il n'y a rien à trouver, il retient
quand même quelque chose une fois sur quatre. Les trois erreurs (T1, E2, E4 à réponse mélangée) sont toutes des
**constantes** : le moteur rend un nombre, ce nombre bat de 0,1 à 1 % la moyenne et la droite ajustées, par hasard.

## Tâche par tâche (données réelles)

Erreur sur la partie finale : loi, puis droite, puis constante.

| | Domaine | Tâche | Décision | Final | Erreurs finales |
|---|---|---|---|---|---|
| S1 | nature | CO₂ à Mauna Loa selon la date (avenir : 2004 à 2020) | retenue | tient | 3,8 · 18,4 · 64,7 |
| S2 | nature | température mondiale selon l'année (avenir : 1988 à 2023) | écartée | — | 0,90 · 0,55 · 0,85 |
| S3 | nature | masse des manchots selon la longueur de l'aile | retenue | tient | 434 · 436 · 783 |
| S4 | nature | hauteur du bec selon sa longueur | écartée | — | 2,03 · 1,98 · 2,03 |
| T1 | technique | consommation des voitures selon le poids | retenue | tient | 4,60 · 4,82 · 8,22 |
| T2 | technique | consommation selon la puissance | retenue | tient | 3,73 · 4,37 · 7,35 |
| T3 | technique | accélération selon puissance et poids | retenue | tient | 1,47 · 1,58 · 2,74 |
| E1 | économie | espérance de vie selon le revenu | retenue | tient | 5,67 · 6,22 · 8,37 |
| E2 | économie | espérance de vie selon la fécondité | écartée | aurait tenu | 4,47 · 4,48 · 8,94 |
| E3 | économie | prix du blé selon le salaire (50 mesures) | retenue | tient | 10,8 · 11,7 · 14,4 |
| E4 | économie | recettes des films selon le budget | retenue | tient | 236 M · 244 M · 295 M |
| E5 | économie | milles parcourus selon le prix de l'essence | écartée | — | 2 450 · 2 130 · 2 160 |
| F1 | finance | rendement S&P 500 du mois suivant | écartée | — | égalité avec les témoins |
| F2 | finance | rendement MSFT du mois suivant | écartée | — | 0,094 · 0,095 · 0,088 |
| F3 | finance | cours du S&P 500 selon la date (avenir : fin 2007 à 2010) | retenue | tient | 163 · 510 · 228 |

Ce qui est solide :

- **CO₂** : la loi construite sur 1958–1989 prédit 2004–2020 à 3,8 ppm près ; une droite se trompe de 18, la
  dernière valeur vue de 41 (calcul après coup pour ce dernier témoin).
- **Aucun rendement boursier prévisible n'est retenu** (F1, F2) : sur ce point le garde-fou fait ce qu'on attend.
- **Température** : le moteur rend une oscillation absurde, le garde-fou l'écarte.

Ce qui est mince :

- Six des neuf lois retenues battent la droite de moins de 10 % (S3 0,5 %, E4 3 %, T1 5 %, T3 7 %, E3 8 %,
  E1 9 %). « Tient » veut dire « un peu mieux qu'un trait », pas « loi ».
- **F3 n'est pas une stratégie.** Battre une droite et une constante sur le cours d'un indice ne dit rien d'un gain :
  ni frais, ni risque, ni exécution, une seule période, et l'erreur reste de 163 points sur un indice vers 1 100.
- Le verdict du moteur est « empirique » 24 fois sur 25, réussites et échecs confondus : il n'informe pas.

## Correction, après coup (sans valeur de preuve)

Règle ajoutée à la chaîne de livraison (`src/loi-client.js`) : **ce qui ne dépend d'aucune variable n'est pas une
loi et n'est jamais retenu**. Sans réglage. Appliquée aux résultats ci-dessus, elle supprime les trois erreurs et ne
retire aucune des neuf lois retenues. Elle reste à confirmer sur des témoins neufs.

## Limites

Quinze tâches choisies par moi dans un paquet de démonstration. Une graine. Partage entrelacé pour les tâches non
datées : interpolation. Battre une droite est une barre basse.
