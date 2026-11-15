# Protocole T3c — confirmation de la chaîne retenue

Écrit et poussé **avant** son code et avant toute exécution. Suite de `programme/t3b/RESULTATS_T3B.md`, § 7.

## 1. Question

T3b a désigné une chaîne : coût reconstitué par LAVOISIER, plan de CORTEX arrêté à 8 blocs, décision par la table
des ventes constatées, **sans** la loi de GALILÉE. Cette chaîne n'a jamais été testée telle quelle : dans T3b, le
bras court décidait encore par la loi quand elle était retenue, et le bras « sans GALILÉE » avait un essai de 13
blocs. Choisie après avoir vu des résultats, elle doit être confirmée sur des entreprises neuves.

**La chaîne retenue fait-elle mieux que la meilleure règle aveugle, apprentissage compris ?**

Simulation, comme avant : aucun euro réel n'est en jeu.

## 2. Dispositif

Celui de T3b, sans aucun réglage nouveau : même monde (demande sensible), même calendrier, mêmes niveaux, même
mesure, mêmes bras aveugles.

**Bras jugé — la chaîne retenue** : les 8 premiers blocs du plan de CORTEX (jours 183 à 238), puis, au jour 239,
le niveau qui maximise (prix − coût de LAVOISIER) × ventes par jour constatées, parmi les niveaux essayés. Aucune
loi n'entre dans la décision.

Bras donnés pour comparaison, sans critère : le collectif court de T3b (même essai, loi admise), le collectif
bref, le collectif à 13 blocs.

Il n'y a pas de mise au point : rien n'est à régler.

## 3. Graines

**6081 à 6160**, soit 80 entreprises, exécution unique. Deux fois plus que dans T3b, parce que la dispersion y
était forte.

## 4. Critères

- **C1 — la chaîne retenue bat la meilleure règle aveugle** sur la fenêtre entière (jours 183 à 364) : écart
  apparié, en part de la marge de l'entreprise laissée seule, supérieur à 0 au test unilatéral à 5 %. La règle
  aveugle est la meilleure des cinq en moyenne sur les 80 entreprises, désignée après coup. Seuil de t retenu :
  1,684 (celui de 40 degrés de liberté, un peu plus sévère que celui de 79).
- **C2 — elle produit un gain** contre l'entreprise laissée seule : gain moyen supérieur à 0, même test.
- **Invalide** si moins de 40 des 80 entreprises ont un objet pilotable.

Les seuils ne seront pas retouchés. Un critère manqué est publié comme tel.

## 5. Attendus, écrits avant l'exécution

1. Meilleure règle aveugle : « prix tenu », entre −4 % et +1 %.
2. Chaîne retenue : gain total entre 4 % et 9 %.
3. **C1 tenu.** Je lui donne environ deux chances sur trois.
4. **C2 incertain** : dans T3b, le gain absolu des essais courts frôlait le seuil sans le passer.
5. La chaîne retenue fait au moins aussi bien que le collectif court avec loi ; l'écart sera petit et non
   significatif.
6. Coût de LAVOISIER exact dans au moins 95 % des entreprises.

## 6. Limites écrites d'avance

Celles de T3 et de T3b. En plus : une confirmation dans le même monde simulé ne dit rien d'un autre monde, ni d'une
entreprise réelle.
