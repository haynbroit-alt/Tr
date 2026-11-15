# Résultats PRIX-RÉEL — la lecture de marge par niveau de prix, sur des ventes réelles

Protocole : `PROTOCOLE_PRIX_REEL.md`, poussé avant tout calcul (commit `51058fd`). Calcul fait une fois, le
15 novembre 2026, par `scripts/prix-reel.js` ; chiffres dans `resultats.json`. Données : ventes hebdomadaires de la
chaîne Dominick's (paquet R `bayesm`), extraites par `scripts/prix-reel-extraire.py`, non copiées dans ce dépôt.

C'est le **premier contact de cette chaîne avec des ventes réelles**. Ce n'est pas un essai de prix : la chaîne de
magasins a choisi ses prix et ses promotions, pas au hasard. Aucun gain causal n'est affirmé, et aucun euro n'a été
gagné.

## 1. Résultat

**La lecture se confirme sur les semaines qu'elle n'a pas vues, mais presque tout ce qu'elle lit vient des
promotions.**

Jus d'orange : 83 magasins, 11 marques, 913 séries magasin × marque, 106 139 semaines de vente, dont 45 % avec une
promotion en magasin ou une annonce publicitaire.

| Critère | Toutes les semaines | Sans les semaines de promotion |
|---|---|---|
| **R1** gain de marge au niveau décidé, contre le prix de référence, sur les semaines non vues | **tenu** : +40,6 % en moyenne par magasin (médiane +35,3 %), t = 9,84 | **non établi** : +6,0 % (médiane +1,2 %), t = 1,60 pour un seuil de 1,684 |
| Séries où le niveau décidé gagne | 319 sur 509 | 80 sur 161 |
| **R2** le niveau le mieux classé bat le moins bien classé | **tenu** : 65 magasins sur 83 | tenu de justesse : 48 magasins sur 80 (p = 0,046) |

Sur les 913 séries : 700 décisions changent le prix, dont 486 vers le bas et 214 vers le haut ; 212 ne changent
rien ; 191 ne sont pas évaluables (trop peu de semaines de vérification au niveau décidé ou au niveau de
référence). 12 % des semaines tombent hors de la grille de ±25 %.

Thon (7 marques, niveau chaîne, sans critère) : la décision baisse le prix pour 6 marques sur 7 ; gain moyen de
+38 % sur les 6 séries évaluables, 5 en gain. Sans promotion : 3 séries évaluables, +18 %.

## 2. Lecture

La lecture « quel niveau de prix dégage le plus de marge » classe correctement les niveaux sur des données
réelles : ce qu'elle retient dans une moitié des semaines se retrouve dans l'autre. Mais sur des ventes observées,
un prix bas arrive presque toujours avec une promotion affichée, et c'est la promotion qui vend. Une fois ces
semaines écartées, le gain est sept fois plus petit et ne se distingue plus du hasard.

Conséquence directe : **une lecture de l'historique des ventes d'un client ne dit pas quel prix fixer.** Elle
confond le prix et tout ce qui l'accompagne. Seul un essai où le prix change seul peut le dire, et c'est
précisément ce que cette confrontation ne teste pas.

## 3. Attendus écrits d'avance, confrontés

| Attendu | Constat |
|---|---|
| La décision retient le plus souvent un niveau plus bas | tenu : 486 séries sur 700 |
| R1 tenu, gain moyen supérieur à 20 % | tenu : +40,6 % |
| R2 tenu | tenu |
| R3 : gain nettement plus faible, peut-être non significatif | tenu : +6,0 %, non significatif |
| Plus d'un quart des séries non évaluables ou sans changement | tenu : 404 sur 913, soit 44 % |

Précision de calcul, non écrite au protocole : pour R2, l'écart entre le niveau le mieux classé et le moins bien
classé est rapporté à la marge hebdomadaire moyenne de la série avant d'être moyenné par magasin.

## 4. Limites

- Observation, pas expérience ; une chaîne, deux produits, États-Unis, années 1990.
- Coût reconstitué depuis la marge déclarée dans les données, pas depuis des écritures.
- Le niveau de référence est le prix médian passé, pas un prix que le magasin aurait tenu.
- « Sans promotion » écarte les semaines signalées ; une remise non signalée y reste.
- Sans promotion, 335 séries deviennent trop courtes : le contrôle porte sur 161 séries seulement.

## 5. Ce que cela change

1. **L'outil de livraison écarte désormais les ventes signalées en promotion** quand l'export les signale, et le
   dit dans son rapport (colonne `promotion` facultative).
2. **Pour une mission** : ne jamais conclure sur l'historique seul ; demander au client ses semaines de promotion ;
   conduire l'essai hors promotion. Sur ces données réelles, près d'une semaine sur deux était en promotion : la
   condition « rien d'autre ne change pendant l'essai » sera la plus difficile à tenir.
3. **Pour le dossier** : un exemple sur ventes réelles, avec sa limite. Il montre surtout que nous savons
   distinguer l'effet d'un prix de celui d'une promotion, ce qu'une lecture naïve ne fait pas.
4. Le prochain pas reste un vrai essai, sur de vraies ventes, avec un client.
