# Résultats T3c — la confirmation de la chaîne retenue

Protocole : `PROTOCOLE_T3C.md` (écrit avant le code, commit `10d8b7b`). Test : graines 6081 à 6160, **exécution
unique** le 15 novembre 2026, 596 s de calcul, consignée au registre sous `essai-prix#T3C`. Données : `test.json`.

Marge simulée, comme avant. Aucun euro réel ; le compte des gains réels reste à 0 €.

## 1. Résultat

**La confirmation échoue sur son critère principal.** Sur 80 entreprises neuves, la chaîne retenue gagne 4,8 % et
la meilleure règle aveugle, « ne rien changer », gagne 3,2 % : 1,6 point d'écart, non significatif.

| Critère | Résultat |
|---|---|
| **C1** la chaîne retenue bat la meilleure règle aveugle, apprentissage compris | **manqué** : écart apparié de 1,6 point, t = 0,90 pour un seuil de 1,684 |
| **C2** elle produit un gain contre l'entreprise laissée seule | **tenu** : 4,8 %, t = 2,40 |

80 entreprises pilotables sur 80. Marge des objets pilotés quand l'entreprise est laissée seule : 6 872 390 €
simulés.

| Bras | Gain en essai | Gain en exploitation | Gain total |
|---|---:|---:|---:|
| **Chaîne retenue** (8 blocs, table, sans loi) | −1,7 % | 6,5 % | **4,8 %** |
| Collectif court (8 blocs, loi admise) | −1,6 % | 6,1 % | 4,5 % |
| Collectif bref (5 blocs) | −0,9 % | 2,9 % | 2,0 % |
| Collectif (13 blocs) | −3,3 % | 5,9 % | 2,6 % |
| Sans LAVOISIER | −3,3 % | −5,7 % | −9,0 % |
| **Aveugle 0 (prix tenu)** — le meilleur | 0,9 % | 2,2 % | **3,2 %** |
| Aveugle +11,8 % | −0,6 % | 1,1 % | 0,5 % |
| Aveugle −10,6 % | −2,0 % | −0,5 % | −2,4 % |
| Aveugle +25 % | −4,0 % | −2,1 % | −6,1 % |
| Aveugle −20 % | −10,0 % | −8,6 % | −18,5 % |

## 2. Ce que T3b avait annoncé et qui ne se reproduit pas

- **L'avantage de 8,8 points de l'essai court sur les règles aveugles.** Ici : 1,4 point (t = 0,77). Dans T3b, la
  règle « prix tenu » perdait 2,5 % ; ici elle gagne 3,2 %. Le témoin nul change ses prix au hasard, et cet aléa
  suffit à déplacer la meilleure règle aveugle de près de six points d'un lot de 40 à un lot de 80. L'écart de T3b
  était en bonne partie de la chance.
- **« La loi de GALILÉE gêne. »** Ici le collectif fait 1,0 point de **mieux** avec la loi (t = 2,95), l'inverse
  de T3b. La chaîne sans loi et la chaîne avec loi font la même chose à 0,3 point près. La loi ne gêne ni n'aide.
- **Le bras bref** : 2,0 %, moins bien que « prix tenu ». Cinq blocs ne suffisent pas.
- **Le plan de CORTEX** : 0,3 point de mieux qu'un essai « avant / après », non établi (2,6 points dans T3b).

J'avais écrit dans `RESULTATS_T3B.md` que les moteurs faisaient « mieux que toute règle aveugle, apprentissage
compris, si l'essai est court ». **Ce n'est pas établi.**

## 3. Ce qui se reproduit

| Constat | T3b (40) | T3c (80) |
|---|---|---|
| Le coût de LAVOISIER est exact | 40 sur 40 | 80 sur 80 |
| Sans ce coût, le collectif perd | 8,9 points, t = 2,78 | 11,6 points, t = 6,11 |
| En exploitation, le collectif décide mieux que la meilleure règle aveugle | 6,4 points, t = 3,73 | 3,7 points, t = 3,48 |
| Un essai de 8 blocs vaut mieux qu'un essai de 13 | 5,1 points, t = 3,29 | 1,9 point, t = 2,40 |
| Le juge de CORTEX ne décide rien | aucune confirmation | aucune confirmation |

Le niveau choisi par la chaîne retenue est le meilleur après coup dans 35 entreprises sur 80, et à un cran près
dans 66.

## 4. Les deux tests réunis — calcul fait après coup, hors protocole

Sur les 120 entreprises du monde sensible, l'essai court dépasse « prix tenu » de 3,8 points (t = 2,44) et gagne
5,1 % contre l'entreprise laissée seule (t = 3,10). Ce chiffre n'a pas la valeur d'un test : j'ai réuni les lots
après avoir vu les deux résultats. Il dit seulement que, si avantage il y a, il est de l'ordre de quatre points et
non de neuf.

## 5. Attendus écrits d'avance, confrontés

| Attendu | Constat |
|---|---|
| Meilleure règle aveugle : « prix tenu », entre −4 % et +1 % | **faux** : +3,2 % |
| Chaîne retenue entre 4 % et 9 % | tenu : 4,8 % |
| C1 tenu, deux chances sur trois | **manqué** |
| C2 incertain | tenu |
| La chaîne retenue fait au moins aussi bien que le court avec loi, écart petit | tenu : +0,3 point |
| Coût exact dans au moins 95 % des entreprises | tenu : 80 sur 80 |

## 6. Limites

- Simulation, un seul monde, un objet par entreprise.
- 36 entreprises sur 80 perdent de la marge avec la chaîne retenue, 35 avec « prix tenu ».
- La mesure secondaire (profit total du second semestre, bruitée par construction) va cette fois à l'envers de la
  mesure principale. Je ne lui fais rien dire, pas plus que dans T3b où elle allait dans le bon sens.
- Le comparateur lui-même est bruité : l'entreprise laissée seule change ses prix au hasard. Un comparateur à prix
  tenu donnerait des mesures plus serrées. Non fait : le protocole fixait le comparateur.

## 7. Ce que cela change

1. **Ce qui est solide, sur 160 entreprises et trois tests** (40 + 40 + 80 ; une première version de ce compte
   rendu disait 200, par erreur d'addition) : reconstituer le coût depuis les écritures (exact 160 fois sur 160,
   et décisif pour la décision) ; choisir, après un essai, un meilleur prix qu'une règle fixe
   **pendant la période d'exploitation** ; ne pas faire durer l'essai.
2. **Ce qui ne l'est pas** : que l'essai se rembourse face à « ne rien changer » sur six mois. L'avantage, s'il
   existe, est de quelques points et demande plus de 80 entreprises pour être établi.
3. **Argument commercial permis** : le coût reconstitué et la qualité de la décision. **Interdit** : dire qu'un
   essai de prix rapporte plus que de ne rien changer.
4. **La leçon de méthode** : une chaîne choisie sur un test de 40 entreprises n'a pas tenu sur 80. La
   confirmation était nécessaire ; elle a évité de bâtir sur une conclusion fausse.
5. **Pistes** : réduire le coût de l'essai (c'est lui qui mange le gain : la décision vaut 10,7 % si on l'applique
   dès le premier jour, la chaîne n'en garde que 4,8 %) ; un comparateur moins bruité ; et un premier jeu de ventes
   réelles.
