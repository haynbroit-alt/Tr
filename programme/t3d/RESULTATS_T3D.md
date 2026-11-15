# Résultats T3d — notre chaîne d'essai de prix face au bandit de Thompson

Protocole : `PROTOCOLE_T3D.md` (écrit avant le code ; attendus du test poussés avant l'exécution, commit `a92e758`).
Test : graines 6161 à 6220, **exécution unique** le 15 novembre 2026, 619 s de calcul, consignée au registre sous
`essai-prix#T3D`. Données : `test.json`.

> **Mise à jour du même jour.** Le § 3 attribue la dispersion d'un lot à l'autre au hasard non partagé du
> simulateur. Le test T3e (`programme/t3e/RESULTATS_T3E.md`) montre que c'est faux pour l'essentiel : avec un
> hasard commun l'incertitude ne baisse que de 19 %. La dispersion est réelle, d'une entreprise à l'autre.

Marge simulée. Aucun euro réel ; le compte des gains réels reste à 0 €.

## 1. Résultat

**Le bandit de Thompson, méthode de référence publiée, ne fait pas mieux que notre chaîne ; notre chaîne ne fait
pas mieux que lui. Et cette fois les deux battent nettement toute règle aveugle.**

60 entreprises, toutes mesurées. Marge des objets pilotés quand l'entreprise est laissée seule : 5 372 449 €
simulés.

| Bras | Gain total (jours 183 à 364) | € simulés | Entreprises en perte |
|---|---:|---:|---:|
| Chaîne retenue (8 blocs, table) | 11,5 % | 496 410 | 21 sur 60 |
| Bandit de Thompson | 12,0 % | 570 292 | 20 sur 60 |
| Chaîne sans engagement | 12,7 % | 459 493 | — |
| **Meilleur aveugle : prix tenu** | −0,2 % | 78 479 | 31 sur 60 |
| Aveugle +11,8 % | −1,1 % | | |
| Aveugle +25 % | −4,3 % | | |
| Aveugle −10,6 % | −7,0 % | | |
| Aveugle −20 % | −19,9 % | | |

| Critère | Résultat |
|---|---|
| **D1** le bandit fait mieux que la chaîne | **non établi** : +0,6 point, t = 0,32 |
| **D1 inverse** la chaîne fait mieux que le bandit | **non établi** |
| **D2** le bandit fait mieux que la meilleure règle aveugle | **établi** : +12,2 points, t = 3,95 pour un seuil de 1,684 |
| **D3** la chaîne sans engagement fait mieux que la chaîne | **non établi** : +1,2 point, t = 1,21 |

Hors critère, calculé de la même façon : la chaîne dépasse la meilleure règle aveugle de 11,6 points (t = 3,80).

Le coût de LAVOISIER au jour 183 est exact dans 59 entreprises sur 60. Après ses cinq semaines d'initialisation,
le bandit joue encore 3,9 niveaux différents en moyenne et ne passe l'essentiel de ses huit dernières semaines au
meilleur niveau après coup que dans 22 entreprises sur 60.

## 2. Attendus écrits d'avance, confrontés

| Attendu | Constat |
|---|---|
| D1 et D1 inverse manqués, écart de 0 à +4 points pour le bandit | tenu : +0,6 point |
| D2 manqué | **faux** : établi, et largement |
| D3 manqué | tenu |
| Coût exact dans au moins 95 % des entreprises | tenu : 59 sur 60 |

## 3. Ce que cela dit, avec T3b et T3c

L'avantage de la chaîne sur « ne rien changer », apprentissage compris, a été mesuré sur trois lots indépendants :

| Lot | Entreprises | Chaîne − prix tenu |
|---|---:|---|
| T3b | 40 | +8,8 points (t = 2,90) |
| T3c | 80 | +1,6 point (t = 0,90) — critère manqué |
| T3d | 60 | +11,6 points (t = 3,80) |

Réunis après coup (180 entreprises, hors protocole) : +6,6 points, t = 4,40. Après T3c j'avais écrit que
l'avantage n'était « pas établi » et que T3b avait eu de la chance. La lecture juste est autre : **l'avantage
existe, de l'ordre de six points, mais il varie de 2 à 12 points d'un lot à l'autre.** Un seul lot de 40 à 80
entreprises ne suffit ni à le prouver ni à le réfuter. La cause est connue : dans ce simulateur deux relances de
la même entreprise ne partagent pas leur hasard. C'est la contrainte que L2c vient de lever (`haynbroit-alt/A`,
`PROTOCOLE_L2C.md`).

## 4. Face à la méthode de référence

La littérature donne le bandit gagnant sur un essai équilibré parce qu'il montre moins longtemps les mauvais prix.
Ici, sur 26 semaines et cinq niveaux, il n'en a pas le temps : il explore encore quand l'année finit. Notre chaîne
— trois niveaux choisis par le plan de CORTEX, huit semaines, puis une décision ferme avec le coût de LAVOISIER —
fait jeu égal avec lui. **Ni supériorité, ni infériorité : égalité mesurée avec la référence, sur cet horizon.**
Rien n'est dit d'un horizon plus long, où un bandit devrait prendre l'avantage, ni de bandits plus savants.

## 5. Limites

Simulation, un monde, un objet par entreprise, 26 semaines. Un tiers des entreprises perdent de la marge avec la
chaîne comme avec le bandit, la moitié avec « prix tenu ». Le bandit est standard et non réglé.

## 6. Ce que cela change

1. L'argument « un essai de prix fait mieux que de ne rien changer » redevient défendable **en simulation**, avec
   sa dispersion : six points en moyenne sur 180 entreprises, pas une promesse par entreprise.
2. Pour une mission, la chaîne garde un avantage pratique sur le bandit : huit prix fixés d'avance, un seul
   changement ensuite, là où un bandit demande de changer le prix chaque semaine pendant six mois.
3. La prochaine mesure doit se faire avec le hasard commun de L2c, qui devrait donner des écarts bien plus serrés.
