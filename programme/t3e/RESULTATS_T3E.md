# Résultats T3e — la même confrontation, avec le hasard commun

Protocole : `PROTOCOLE_T3E.md` (écrit avant le code ; attendus du test poussés avant l'exécution, commit `536769f`).
Test : graines 6221 à 6280, **exécution unique** le 15 novembre 2026, 620 s, dossier `essai-prix#T3E`.
Données : `test.json`. Marge simulée ; gains réels : 0 €.

## 1. Résultat

**Lever la contrainte n'a presque pas resserré les écarts : mon pari était faux, et mon diagnostic aussi.**

| Critère | Résultat |
|---|---|
| **V1** l'erreur type de « chaîne − prix tenu » tombe à la moitié de celle de T3d (1,53 point) | **manqué** : 2,48 points, contre 3,06 dans T3d — 19 % de moins, pas 50 % |
| **E1** la chaîne fait mieux que la meilleure règle aveugle | **tenu** : +6,0 points, t = 2,44 |
| **E2** le bandit fait mieux que la chaîne | **pas de différence établie** : +1,1 point, t = 0,78 |
| **E3** la chaîne sans engagement fait mieux que la chaîne | **non établi** : −0,3 point |

60 entreprises, toutes mesurées ; coût de LAVOISIER exact 60 fois sur 60.

| Bras | Gain total | Entreprises en perte |
|---|---:|---:|
| Chaîne retenue | 9,3 % | 19 sur 60 |
| Bandit de Thompson | 10,4 % | 18 sur 60 |
| Chaîne sans engagement | 9,0 % | — |
| Meilleur aveugle : prix tenu | 3,3 % | 23 sur 60 |

## 2. Ce que V1 manqué veut dire

Dans `RESULTATS_T3D.md`, j'ai écrit que la dispersion d'un lot à l'autre venait du hasard non partagé du
simulateur. C'était faux pour l'essentiel. Avec un hasard commun, deux relances ne diffèrent plus que par l'effet
du prix (critère C2 de L2c, tenu 10 fois sur 10), et pourtant l'erreur type ne baisse que de 19 %. **La dispersion
est donc réelle : l'essai rapporte beaucoup à certaines entreprises et coûte à d'autres.** Ici la chaîne fait
moins bien que « ne rien changer » dans 27 entreprises sur 60, tout en faisant 6 points de mieux en moyenne.

La mise au point m'avait trompé : sur 20 entreprises l'erreur type semblait 2,5 fois plus petite. C'était un
écart entre deux petits lots, que j'ai pris pour un effet.

L'option garde une utilité, plus modeste que celle annoncée : elle rend deux relances comparables objet par objet,
ce qui sert à comprendre un cas, pas à réduire le nombre d'entreprises nécessaire.

## 3. Attendus écrits d'avance, confrontés

| Attendu | Constat |
|---|---|
| V1 au bord, erreur type entre 1,3 et 1,8 | **faux** : 2,48 |
| E1 incertain, écart de 1 à 5 points | tenu, écart un peu au-dessus : 6,0 |
| E2 et E3 sans différence établie | tenu |
| Meilleur aveugle : prix tenu | tenu |

## 4. Quatre lots, une conclusion

| Lot | Monde | Entreprises | Chaîne − prix tenu |
|---|---|---:|---|
| T3b | demande sensible | 40 | +8,8 points |
| T3c | demande sensible | 80 | +1,6 point |
| T3d | demande sensible | 60 | +11,6 points |
| T3e | demande sensible, hasard commun | 60 | +6,0 points |

Réunis après coup (240 entreprises, hors protocole) : **+6,4 points, t = 5,04.** Un essai court suivi d'une
décision fait mieux que de ne rien changer, en moyenne, dans ce monde simulé ; l'écart est établi sur trois lots
sur quatre et sur l'ensemble. Il ne dit rien d'une entreprise donnée : quatre sur dix environ y perdent.

Le bandit de Thompson et notre chaîne font jeu égal sur les deux lots où ils se sont affrontés (120 entreprises :
+0,8 point pour le bandit, t = 0,74).

## 5. Ce que cela change

1. **Pour l'offre** : « en moyenne un essai fait mieux que de ne rien changer » tient en simulation ; « votre
   entreprise y gagnera » ne tient pas. La garantie proposée — ne facturer la décision que si l'essai se lit — ne
   couvre pas ce risque. Il faut le dire au client avant de commencer.
2. **Pour la recherche** : la question utile n'est plus « l'essai gagne-t-il en moyenne ? » mais « peut-on
   reconnaître d'avance les entreprises où il perd ? ». Non étudié.
3. **Pour la méthode** : un effet vu sur 20 entreprises de mise au point n'est pas un effet. C'est la deuxième
   fois aujourd'hui (le bras « bref » de T3b était la première).
