# Résultats ARÈNE-3 — l'arrêt anticipé tient sa place ; les deux prétendants sont relégués

Exécution unique du 15 novembre 2026, graines 8401 à 8600 (199 entreprises mesurées, une écartée), dossier `arene#3`
du registre, détail dans `tour-3.json`. Protocole `PROTOCOLE_ARENE_3.md`, poussé avant le code. Marge simulée.

| Méthode | Gain moyen | Face au tenant | Mieux / moins bien | Perdantes face à prix tenu | Verdict |
|---|---|---|---|---|---|
| **arrêt anticipé à 4 semaines** (tenant) | 12,4 % | — | — | 90 | **garde sa place** |
| `sans arrêt` (8 semaines) | 11,5 % | −0,9 point, t = −2,25 | 38 / 97 | 86 | **relégué** |
| `arrêt à 3 semaines` | 10,8 % | −1,6 point, t = −2,31 | 83 / 71 | 98 | **relégué** |
| *prix tenu* | *4,3 %* | | | | |

Seuil : t = ±1,97. Lecture bornée : −0,8 point (t = −1,91) et −1,2 point (t = −2,00) ; même sens, elle ne contredit
rien, mais pour `sans arrêt` elle reste juste sous le seuil.

## Ce que cela dit

- **L'avance d'ARÈNE-2 n'était pas un hasard** : +0,8 point alors, +0,9 point ici, sur 200 autres entreprises. Le
  tenant fait mieux que la chaîne de huit semaines dans 97 entreprises et moins bien dans 38. Il s'arrête dans 135
  entreprises sur 199, avec la même décision qu'à huit semaines 101 fois.
- **Quatre semaines, pas trois.** S'arrêter une semaine plus tôt se trompe plus souvent (92 décisions identiques
  sur 143 arrêts) et fait perdre plus d'entreprises (98 contre 90).
- L'avantage reste petit (moins d'un point), et le tenant fait perdre un peu plus d'entreprises face à prix tenu
  que la chaîne sans arrêt (90 contre 86).

## Attendus, relus

Le tenant garde sa place : **juste**. `sans arrêt` derrière de 0 à 1,5 point : juste ; « en lice » : **faux**, il est
relégué. `arrêt à trois semaines` entre −1,5 et +1 point, en lice : **faux**, −1,6 et relégué.

## Suite

La condition écrite au protocole (§ 4) est remplie : l'arrêt anticipé a tenu deux tours. Il peut entrer dans
l'outil de livraison, comme une lecture à quatre semaines qui dit « net : décidez » ou « pas net : poursuivez ».
