# Protocole T3d — notre chaîne d'essai de prix face au bandit de Thompson

Écrit et poussé **avant** son code et avant toute exécution. Suite de `programme/t3c/RESULTATS_T3C.md`.

## 1. Question

Pour chercher un prix, la méthode de référence publiée n'est pas un essai équilibré suivi d'une décision : c'est un
**bandit**, qui apprend en vendant. Misra, Schwartz et Abernethy (Marketing Science, 2019) rapportent qu'un bandit
fait mieux qu'un essai équilibré parce qu'il montre moins longtemps les mauvais prix ; l'échantillonnage de Thompson
est le choix le plus répandu dans l'industrie. Notre chaîne (T3c) est précisément un essai équilibré, et son gain
est mangé par le coût de l'essai.

**Dans notre monde simulé où la bonne direction varie, un bandit de Thompson nourri du coût de LAVOISIER fait-il
mieux que notre chaîne ?** Et un mélange des deux fait-il mieux que chacun ?

Marge simulée, comme avant : aucun euro réel.

## 2. Dispositif

Celui de T3c : même monde (demande sensible), même objet piloté, même prix de référence, mêmes cinq niveaux, même
mesure de marge dans la vérité, mêmes bras aveugles. Les 182 jours pilotés (183 à 364) font exactement 26 semaines.

Le coût unitaire donné aux bandits est celui que LAVOISIER reconstitue sur le journal coupé au jour 183.

**Ce que voit un bandit chaque semaine** : le journal coupé au jour de la décision. Pour chaque niveau déjà joué,
la marge hebdomadaire constatée = (prix − coût) × ventes par jour à ce prix × 7, une vente étant rattachée à un
niveau par son propre prix unitaire.

## 3. Bras

| Bras | Règle |
|---|---|
| Chaîne retenue (T3c) | 8 blocs du plan de CORTEX, décision par la table, prix tenu ensuite |
| **Bandit de Thompson** | les cinq niveaux joués une semaine chacun, dans l'ordre 0, +0,5, −0,5, +1, −1 ; puis, chaque semaine, un tirage par niveau dans une loi normale centrée sur sa marge constatée, d'écart-type σ ÷ √(semaines jouées), et le niveau du plus grand tirage est joué |
| **Chaîne sans engagement** | 8 blocs du plan de CORTEX, puis le même tirage de Thompson sur les trois niveaux essayés, au lieu de tenir un prix |
| Aveugles, témoin nul | comme avant |

σ est l'écart-type de la marge hebdomadaire de l'objet sur les 26 semaines d'avant le jour 183. Les tirages
aléatoires des bandits viennent d'un générateur à graine fixe : tout se rejoue à l'identique.

## 4. Graines

- Mise au point : 221 à 240.
- Test : **6161 à 6220**, soit 60 entreprises, exécution unique, après que les réglages ont été écrits ici.

## 5. Critères, sur le test

Tous sur le gain total (jours 183 à 364), en écart apparié, test unilatéral à 5 %.

- **D1 — le bandit fait mieux que la chaîne.** **D1 inverse** : la chaîne fait mieux que le bandit. Ni l'un ni
  l'autre : « pas de différence établie ».
- **D2 — le bandit fait mieux que la meilleure règle aveugle** (désignée après coup).
- **D3 — la chaîne sans engagement fait mieux que la chaîne.**

Les seuils ne seront pas retouchés. Un critère manqué est publié comme tel.

## 6. Attendus, écrits avant toute mise au point

1. **Pas de différence établie entre le bandit et la chaîne** (D1 et D1 inverse manqués), à moins de trois points
   d'écart. Motif : cinq niveaux à explorer en 26 semaines avec des marges hebdomadaires très bruitées, c'est peu
   pour un bandit ; la littérature le montre gagnant avec bien plus d'observations.
2. D2 manqué, comme C1 dans T3c.
3. D3 : la chaîne sans engagement fait un peu mieux que la chaîne, sans que ce soit établi.
4. Le coût de LAVOISIER au jour 183 est exact dans au moins 95 % des entreprises.

## 7. Limites écrites d'avance

- Un bandit standard, sans réglage fin ni modèle de la demande ; des variantes plus savantes existent (bandits
  paramétriques, unimodaux) et ne sont pas mesurées.
- 26 semaines : l'avantage d'un bandit croît avec la durée ; ce test ne dit rien d'un horizon plus long.
- Simulation, un monde, un objet par entreprise.

---

## 8. Mise au point (graines 221 à 240) — écrit et poussé avant le test

Aucun réglage n'a été changé : le bandit est celui du § 3, tel qu'écrit avant le code.

| Bras | Gain total, 20 entreprises |
|---|---:|
| Chaîne retenue | 6,4 % |
| Bandit de Thompson | 8,7 % |
| Chaîne sans engagement | 7,6 % |
| Meilleur aveugle (+11,8 %) | 1,3 % |

Écarts appariés : bandit − chaîne +2,3 points (t = 0,72) ; sans engagement − chaîne +1,2 point (t = 0,73) ;
bandit − meilleur aveugle +7,4 points (t = 1,05). Rien n'est établi sur 20 entreprises. Le coût de LAVOISIER au jour
183 est exact 20 fois sur 20. Après ses cinq semaines d'initialisation, le bandit joue encore 3,6 niveaux
différents en moyenne, et ne passe l'essentiel de ses huit dernières semaines au meilleur niveau après coup que
dans 7 entreprises sur 20 : il explore encore quand l'année finit. Détail : `programme/t3d/dev.json`.

Je n'ai pas cherché à régler le bandit sur ces 20 entreprises : avec quatre à cinq points d'incertitude sur chaque
moyenne, tout réglage aurait suivi le bruit.

### Attendus pour le test, écrits avant son exécution

1. **D1 et D1 inverse manqués** : pas de différence établie entre le bandit et la chaîne ; écart entre 0 et +4
   points en faveur du bandit.
2. **D2 manqué** : le bandit dépasse le meilleur aveugle en moyenne, sans que ce soit établi.
3. **D3 manqué** : la chaîne sans engagement fait à peu près comme la chaîne.
4. Coût exact au jour 183 dans au moins 95 % des entreprises.
