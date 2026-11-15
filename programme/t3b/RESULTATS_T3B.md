# Résultats T3b — l'essai de prix commun dans un monde où la bonne direction varie

Protocole : `PROTOCOLE_T3B.md` (écrit avant le code ; réglages et attendus du test poussés avant l'exécution, commit
`4a4442e`). Test : graines 6041 à 6080, **exécution unique** le 15 novembre 2026, 301 s de calcul, consignée au
registre sous `essai-prix#T3B`. Données : `test.json`.

> **Mise à jour du même jour.** La confirmation T3c (`programme/t3c/RESULTATS_T3C.md`, 80 entreprises neuves) **n'a pas
> reproduit** l'avantage de l'essai court sur les règles aveugles annoncé aux § 2, 3 et 7 (1,6 point, non
> significatif), ni l'effet négatif de la loi de GALILÉE. Les chiffres ci-dessous restent ceux du test T3b ; les
> conclusions qui en dépassent la portée sont corrigées dans T3c.

Tout ce qui suit est une **marge simulée**. Aucun euro réel n'est en jeu ; le compte des gains réels reste à 0 €.

## 1. Ce qui a été mesuré

40 entreprises de négoce dont toutes les ventes suivent le prix, toutes pilotables. Marge des objets pilotés quand
l'entreprise est laissée seule, jours 183 à 364 : 4 849 877 € simulés.

Le monde est bien varié : le meilleur niveau après coup est en baisse dans 19 entreprises (−20 % : 8 ; −10,6 % :
11), en hausse dans 18 (+11,8 % : 5 ; +25 % : 13), inchangé dans 3.

| Bras | Gain en essai | Gain en exploitation | Gain total | € simulés |
|---|---:|---:|---:|---:|
| Collectif (essai de 13 blocs) | −3,8 % | 5,0 % | 1,2 % | −10 536 |
| **Collectif court** (8 blocs) | −0,4 % | 6,7 % | **6,3 %** | 302 345 |
| **Collectif bref** (5 blocs) | 0,4 % | 4,6 % | **5,0 %** | 240 914 |
| Sans GALILÉE | −3,8 % | 6,2 % | 2,5 % | 45 815 |
| Sans LAVOISIER | −3,8 % | −3,9 % | −7,7 % | −479 937 |
| Sans plan de CORTEX | −3,8 % | 2,4 % | −1,4 % | −73 772 |
| Aveugle −20 % | −8,6 % | −8,5 % | −17,2 % | −699 191 |
| Aveugle −10,6 % | −1,8 % | −1,8 % | −3,6 % | −145 527 |
| **Aveugle 0 (prix tenu)** — le meilleur | −1,1 % | −1,4 % | **−2,5 %** | −149 982 |
| Aveugle +11,8 % | −3,8 % | −2,5 % | −6,3 % | −432 091 |
| Aveugle +25 % | −5,4 % | −5,6 % | −11,0 % | −672 266 |

Aucune règle aveugle ne gagne. La meilleure, tenir le prix, perd 2,5 %.

## 2. Critères

| Critère | Résultat |
|---|---|
| **K1** le collectif (13 blocs) produit un gain | **manqué** : 1,2 %, t = 0,50 pour un seuil de 1,685 |
| **K2** il décide mieux qu'une règle aveugle (exploitation) | **tenu** : 5,0 % contre −1,4 % ; écart apparié de 6,4 points, t = 3,73 |
| **K2b** il fait mieux apprentissage compris | **tenu en moyenne** : 1,2 % contre −2,5 % ; écart apparié non significatif (t = 1,64) |
| **K3** sans LAVOISIER | **établi** : 8,9 points de moins, t = 2,78 |
| **K3** sans le plan de CORTEX | **établi** : 2,6 points de moins, t = 1,84 |
| **K3** sans GALILÉE | **non établi, et dans le mauvais sens** : sans la loi le collectif fait 1,2 point de mieux (t = 2,00) |
| **K4** le collectif court fait mieux que le collectif | **établi** : 5,1 points de plus, t = 3,29 |
| **K5** le collectif bref fait mieux que le meilleur aveugle | **tenu** : 5,0 % contre −2,5 % ; écart apparié de 7,5 points, t = 2,43 |

Hors critère, calculé de la même façon : le collectif court contre le meilleur aveugle, fenêtre entière, écart
apparié de 8,8 points, t = 2,90.

## 3. Réponse à la question

**Oui, à une condition.** Dans un monde où la bonne direction de prix varie d'une entreprise à l'autre, les
moteurs ensemble font mieux que toute règle aveugle, apprentissage compris — **si l'essai est court**. Avec 5 ou 8
semaines d'essai, l'écart avec la meilleure règle aveugle est de 7,5 à 8,8 points de marge et il est significatif.
Avec 13 semaines, l'essai mange presque tout ce que la décision rapporte.

Deux réserves. Le gain du collectif bref contre l'entreprise laissée seule (5,0 %) frôle le seuil sans le passer
(t = 1,68 pour 1,685) : ce qui est établi, c'est l'avantage sur les règles aveugles, pas un gain absolu. Et le
collectif court n'avait pas de critère propre contre les règles aveugles ; son t de 2,90 est donné à titre
indicatif.

## 4. Attendus écrits d'avance, confrontés

| Attendu (protocole, § 8) | Constat |
|---|---|
| Monde varié : au moins 8 en baisse et 8 en hausse | tenu : 19 et 18 |
| K1 manqué, gain de 3 à 8 % non significatif | manqué comme prévu ; le gain est plus bas que ma fourchette : 1,2 % |
| K2 tenu, K2b tenu en moyenne sans écart significatif | tenu ; l'écart de K2 est plus net que prévu |
| K3 établi sans LAVOISIER ; non établi sans le plan de CORTEX ni sans GALILÉE | **faux pour CORTEX** : son plan compte (établi) ; juste pour les deux autres |
| K4 : le court fait mieux, sans que ce soit établi | **faux, en mieux** : établi |
| K5 tenu en moyenne, bref entre 6 et 12 % | tenu, écart significatif ; le bref est à 5,0 %, sous ma fourchette |
| Ordre : bref > court > collectif > meilleur aveugle | **faux** : court (6,3 %) > bref (5,0 %) > collectif (1,2 %) > aveugle (−2,5 %) |
| Coût exact dans au moins 95 % des entreprises ; aucune confirmation du juge | tenu : 40 sur 40 ; 26 « indécis », 14 sans objet |

## 5. Ce que chaque moteur a apporté, sur les deux tests

| | T3 (monter est toujours juste) | T3b (la direction varie) |
|---|---|---|
| LAVOISIER, le coût | exact 40 fois sur 40 ; +10,7 points | exact 40 fois sur 40 ; +8,9 points |
| CORTEX, le plan d'essai | +9,8 points | +2,6 points |
| CORTEX, le juge | aucune décision | aucune décision |
| GALILÉE, la loi | −0,8 point (non établi) | −1,2 point (t = 2,00) |

- **LAVOISIER** est l'apport le plus sûr : sans le coût, on décide sur le chiffre d'affaires et on perd.
- **Le plan de CORTEX** compte dans les deux mondes. Son juge ne sert pas à cette décision.
- **La loi de GALILÉE gêne.** Elle est retenue 16 fois et change 10 décisions ; sur ces 10 cas elle coûte 4,9
  points en moyenne, presque toujours en préférant −10,6 % là où la table disait −20 %. Avec trois niveaux essayés
  et des comptages journaliers, la table des ventes constatées décide mieux qu'une formule. Sur ce problème, la
  chaîne devrait décider sans elle.

Le niveau choisi par le collectif est le meilleur après coup dans 20 entreprises sur 40, et à un cran près dans 34.

## 6. Limites

- Simulation ; un objet par entreprise ; un monde changé pour que la question ait un sens (demande à élasticité
  constante, pas de concurrent).
- La dispersion est forte : 17 entreprises sur 40 perdent de la marge avec le collectif court, 24 avec la
  meilleure règle aveugle. L'avantage est une moyenne, pas une garantie par entreprise.
- Le bras bref a été ajouté après la mise au point, sur la foi d'une courbe mesurée sur 20 entreprises ; au test
  c'est le court, prévu d'avance, qui fait le mieux. Je n'aurais pas dû attendre « bref > court ».
- Après une baisse de prix, une semaine d'essai vend plus que le réapprovisionnement ne soutient. Non corrigé.
- Mesure secondaire, bruitée par construction : écart de profit total du second semestre, court +371 130 €
  simulés, bref +320 871 €, collectif +90 111 €, prix tenu −349 976 €. Elle va dans le même sens cette fois ; je
  ne m'appuie pas dessus.

## 7. Ce que cela change

1. **La chaîne à retenir** pour un essai de prix : coût reconstitué par LAVOISIER, plan de CORTEX arrêté à 5 à 8
   semaines, décision par la table des ventes, sans loi. Cette chaîne-là, telle quelle, n'a pas encore été
   testée : le prochain test doit l'écrire d'avance et la confronter aux mêmes règles aveugles.
2. **Argument commercial permis** : « quand on ne sait pas dans quel sens bouger un prix, un essai court conduit
   depuis les écritures fait mieux que toute règle fixe, en simulation ». **Interdit** : promettre un gain à une
   entreprise donnée, ou citer ces pourcentages comme des résultats réels.
3. **Pistes suivantes** : un modèle du stock pour ne pas surestimer l'effet d'une baisse ; un arrêt de l'essai
   décidé par les données plutôt que fixé d'avance ; et, surtout, un premier jeu de ventes réelles — rien de ce
   qui précède n'a touché une entreprise réelle.
