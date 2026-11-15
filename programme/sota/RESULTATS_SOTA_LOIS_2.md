# Résultats SOTA-LOIS-2 — GALILÉE face à Operon, à longueur de formule comparable

Exécution du 15 novembre 2026. Protocole : `PROTOCOLE_SOTA_LOIS_2.md`, poussé avant tout calcul. Détail :
`sota-lois-2.json` ; lecture : `python3 scripts/sota-lois-2-analyse.py programme/sota/sota-lois-2.json`. 31 jeux
réels neufs (29 sans les deux quasi-doublons), erreur sur des mesures mises de côté. Aucune panne.

## 1. Critères (test des signes unilatéral à 5 %)

| Critère | Sur 31 jeux | Sur 29 jeux | Verdict |
|---|---|---|---|
| **Q1** — GALILÉE devant Operon court | 11 contre 20 (p = 0,96) | 11 contre 18 | **manqué** |
| **Q1 inverse** — Operon court devant | 20 contre 11 (p = 0,075) | 18 contre 11 (p = 0,13) | **non établi** |
| **Q2** — GALILÉE devant Operon long | 13 contre 18 | 13 contre 16 | **manqué** |
| **Q2 inverse** — Operon long devant | 18 contre 13 (p = 0,24) | 16 contre 13 (p = 0,36) | **non établi** |

Aucune différence n'est établie entre GALILÉE et Operon, ni court ni long, sur ces jeux.

## 2. Sans critère

| | GALILÉE | Operon court | Operon long | gplearn |
|---|---|---|---|---|
| Longueur médiane (nœuds) | **5** | 19 | 53 | 4 |
| Jeux où il bat le meilleur témoin (sur 31) | 16 | 18 | 19 | 10 |
| Meilleur des quatre (sur 31) | 7 | 3 | 16 | 5 |
| Erreur médiane ÷ meilleur témoin | 1,00 | 0,90 | 0,67 (0,80 sur 29) | 1,03 |

- GALILÉE est devant gplearn sur 21 jeux sur 31 (p = 0,035), avec des formules aussi courtes.
- Operon « court » rend 19 nœuds et non 15 : il compte en plus les quatre nœuds de sa mise à l'échelle.
- Sur 4 jeux seulement, personne ne bat le meilleur témoin.

## 3. Ce que cela dit

- **GALILÉE n'est pas devant Operon**, même quand on bride Operon. En précision médiane il reste derrière (1,00
  contre 0,90 et 0,67) : sur la moitié des jeux il ne fait pas mieux qu'une droite ou une constante.
- **Il n'est pas non plus nettement derrière** : 11 à 13 jeux gagnés sur 31, avec des formules quatre à dix fois
  plus courtes, et il est le meilleur des quatre sur 7 jeux, plus qu'Operon court.
- La « niche » espérée (meilleur à longueur égale) n'est pas démontrée. Ce qui est mesuré : formules très courtes,
  devant gplearn, pas de défaite établie face à Operon sur des jeux réels à une variable.

## 4. Attendus, relus

| Attendu | Constat |
|---|---|
| Q1 inverse tenu ou presque, Operon court devant sur 17 à 23 jeux | 20 jeux, non établi — **juste** (« presque ») |
| Q2 inverse tenu, Operon long devant sur 20 jeux au moins | 18 jeux, non établi — **faux** |
| Longueurs : GALILÉE 5 à 9 ; Operon court 12 à 15 ; long plus de 40 | 5 ; 19 ; 53 — **juste, faux, juste** |
| Sur plus d'un tiers des jeux personne ne bat le témoin | 4 jeux sur 31 — **faux** |

## 5. Limites

- Une variable explicative, interpolation seulement, 20 secondes par ajustement pour Operon.
- **D'autres calculs (T3f, T3g, lot de T3h) ont tourné sur la même machine pendant le passage des concurrents**
  (quatre cœurs, jamais plus de trois occupés). Si cela a ralenti quelqu'un, c'est Operon, limité en temps : le
  biais éventuel joue contre lui. La conclusion « aucune différence établie » en est d'autant moins solide en
  faveur de GALILÉE.
- Les longueurs ne se comptent pas à l'unité près de la même façon.

## 6. Ce que cela change

Aucune supériorité à annoncer. La piste « optimisation locale des constantes » rattraperait Operon sans rien
apporter de propre. Une capacité réellement différente doit porter sur ce qu'Operon ne fait pas : voir
`haynbroit-alt/All`, protocole G5 (une loi commune à plusieurs petits jeux, constantes propres à chacun).
