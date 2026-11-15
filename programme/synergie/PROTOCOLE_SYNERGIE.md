# Protocole SYNERGIE — ce que chaque moteur apporte, seul et avec les autres

Écrit et poussé **avant** son code et avant toute exécution. Répond à la demande du propriétaire (15 novembre
2026) : « mesurer la véritable synergie des trois moteurs ».

## 1. Question

Les essais de T3 à T3g ont retiré un moteur à la fois. Cela ne dit pas si les moteurs **se renforcent** : une
synergie, c'est quand l'ensemble vaut plus que la somme de ce que chacun apporte seul. Il faut les huit
combinaisons.

## 2. Ce que « avoir un moteur » veut dire, dans l'essai de prix

| Moteur | Avec | Sans |
|---|---|---|
| **LAVOISIER** | la décision maximise (prix − coût) × ventes ; le plan écarte les baisses non rentables (T3g) | la décision maximise le chiffre d'affaires ; plan complet |
| **CORTEX** | plan d'essai actif (huit semaines) | plan naïf « avant / après » : les huit premières semaines du plan `AVANT_APRES` de T3 |
| **GALILÉE** | la décision suit sa loi de demande si elle est retenue, sinon la table | la décision suit la table des ventes constatées |

Huit bras, de « aucun moteur » (plan naïf, table, chiffre d'affaires) à « les trois ». Le bras LAVOISIER + CORTEX
sans GALILÉE est la chaîne prudente actuelle. Le plan prudent demande à la fois le plan de CORTEX et le coût de
LAVOISIER : c'est le seul endroit où deux moteurs se combinent par construction.

## 3. Mesure

Monde de T3e à T3h. Marge vraie de l'objet piloté, jours 183 à 364, gain en % de la marge du témoin nul. Pour
chaque entreprise et chaque ensemble de moteurs S, v(S).

- **Apport de chaque moteur** : valeur de Shapley (moyenne de ce qu'il ajoute, sur les six ordres d'entrée).
- **Synergie** : I = v(les trois) − v(aucun) − Σ [v(un seul) − v(aucun)]. Positive : l'ensemble vaut plus que la
  somme des apports isolés.

## 4. Graines

Test : **6901 à 7000** (100 entreprises), exécution unique. Vérification du code sur 241 à 243 (déjà vues).

## 5. Critères (écarts appariés, test unilatéral à 5 %)

- **Y1** — les trois moteurs ensemble font mieux qu'aucun.
- **Y2** — chaque moteur a un apport de Shapley positif : **Y2-L**, **Y2-C**, **Y2-G**, jugés séparément.
- **Y3 — synergie** : I > 0.
- **Y4** — les trois ensemble font mieux que la chaîne actuelle (LAVOISIER + CORTEX) : c'est ce qu'ajoute GALILÉE.

Un critère manqué est publié comme tel.

## 6. Attendus, écrits avant toute exécution

1. Y1 tenu. 2. Y2-L tenu, et de loin le plus gros apport. 3. Y2-C tenu de peu ou non établi.
4. **Y2-G manqué** : apport nul ou négatif, comme dans T3b, T3c et T3h. 5. **Y4 manqué**.
6. Y3 : **non établi**. Une interaction positive entre LAVOISIER et CORTEX (le plan prudent), une négative avec
   GALILÉE ; au total je ne parie pas sur une synergie.

## 7. Limites écrites d'avance

- Une seule tâche (l'essai de prix), un seul monde simulé. La synergie mesurée est celle de **cette chaîne**, pas
  des moteurs en général.
- « Sans CORTEX » et « sans GALILÉE » sont remplacés par une méthode naïve précise ; un autre remplaçant donnerait
  d'autres apports.
- GALILÉE n'entre que par sa loi de demande sur huit semaines d'essai, là où il est le plus faible (petits jeux).

---

## 8. Vérification du code (graines 241 à 243) — écrit et poussé avant le test

Aucun réglage. `src/problemes/synergie.js` tourne sur trois entreprises déjà vues ; la somme des trois apports de
Shapley y égale bien v(les trois) − v(aucun). Trois entreprises ne permettent aucune lecture ; rien n'a été changé
aux bras ni aux critères.

Test : `SYNERGIE_TEST=exécution-unique node bin/commun.js executer synergie`, une seule fois.
