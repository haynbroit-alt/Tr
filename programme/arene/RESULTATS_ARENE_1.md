# Résultats ARÈNE-1 — le tenant garde sa place, les deux prétendants sont relégués

Exécution unique du 15 novembre 2026, graines 6701 à 6900 (200 entreprises, aucune écartée), dossier `arene#1` du
registre, détail dans `tour-1.json`. Protocole `PROTOCOLE_ARENE_1.md`, poussé avant le code. Marge simulée.

| Méthode | Gain moyen | Face au tenant | Mieux / moins bien | Verdict |
|---|---|---|---|---|
| **chaîne prudente** (tenant) | 11,6 % | — | — | **garde sa place** |
| `direct` (droite sur l'historique, sans essai) | 6,9 % | −4,7 points, t = −2,94 | 118 / 82 | **relégué** |
| `direct tempéré` (bayésien empirique, sans essai) | 8,0 % | −3,6 points, t = −2,19 | 125 / 75 | **relégué** |
| *prix tenu* | *3,7 %* | | | |

Seuil : t = ±1,97. La lecture bornée dit la même chose (−5,1 et −4,0 points).

## Ce que cela dit

- **Décider sans essai fait mieux dans six entreprises sur dix, et moins bien en moyenne.** Quand l'historique
  trompe, il trompe gravement ; l'essai, lui, limite la casse. C'est ce que l'essai achète : pas un meilleur prix
  le plus souvent, mais l'absence de grosse erreur.
- **Tempérer aide** (+1,1 point sur `direct`, t = 1,36, non établi) et ne suffit pas.
- Le tenant gagne 7,9 points sur prix tenu (t = 5,79) ; 88 entreprises sur 200 y perdent (44 %).
- Sur le lot de l'atelier, `direct` n'était qu'à 1,0 point du tenant. Sur des entreprises neuves : 4,7. Une
  quatrième fois, ce qui se lit sur des entreprises déjà vues est plus flatteur que la mesure.

## Attendus, relus

Le tenant garde sa place : **juste**. `direct` entre −4 et +2 points, en lice : **faux**, −4,7 et relégué.
`direct tempéré` un peu mieux que `direct` : juste (+1,1). Personne n'est relégué : **faux**, les deux le sont.

## Suite à l'arène

`direct` et `direct tempéré` sortent de la liste. Ils n'y reviennent que modifiés : par exemple une décision
directe **seulement** quand l'essai est impossible, ou bornée à un pas de prix. Prétendants inscrits pour le
prochain tour : le plan naïf avec coût (face au plan de CORTEX, voir `programme/synergie/`), le bandit de Thompson,
un essai à arrêt anticipé.
