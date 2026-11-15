# Résultats ARÈNE-2 — l'arrêt anticipé prend la place ; le plan naïf est relégué

Exécution unique du 15 novembre 2026, graines 8201 à 8400 (200 entreprises, aucune écartée), dossier `arene#2` du
registre, détail dans `tour-2.json`. Protocole `PROTOCOLE_ARENE_2.md`, poussé avant le code. Marge simulée.

| Méthode | Gain moyen | Face au tenant | Mieux / moins bien | Perdantes face à prix tenu | Verdict |
|---|---|---|---|---|---|
| chaîne prudente (tenant) | 9,1 % | — | — | 87 | **détrônée** |
| `arrêt anticipé` | 9,8 % | +0,8 point, t = 2,17 | 80 / 25 | 84 | **prend la place** |
| `plan naïf` | 5,8 % | −3,3 points, t = −3,83 | 80 / 120 | 73 | **relégué** |
| *prix tenu* | *2,0 %* | | | | |

Seuil : t = ±1,97. Lecture bornée : +0,7 point (t = 1,98) et −3,2 points (t = −3,76) ; elle ne contredit rien.

## Ce que cela dit

- **Lire l'essai à quatre semaines et s'arrêter quand la réponse est nette fait un peu mieux que d'aller au bout.**
  L'arrêt se déclenche dans 105 entreprises sur 200 ; il y prend la même décision que le tenant 84 fois, quatre
  semaines plus tôt, et gagne alors 1,5 point en moyenne. Mieux dans 80 entreprises, moins bien dans 25.
- **L'avantage est mince** : 0,8 point, tout juste au-dessus du seuil (2,17 pour 1,97 ; 1,98 en lecture bornée).
  La règle de succession est remplie, donc la place change — mais c'est une place à défendre au prochain tour, pas
  un acquis.
- **Le plan de CORTEX a maintenant gagné sa place** : avec le même coût et la même décision, le plan naïf fait 3,3
  points de moins. SYNERGIE laissait la question ouverte (0,9 point en lecture principale) ; sur 200 entreprises
  neuves elle est tranchée. Le plan naïf fait pourtant perdre moins d'entreprises (73 contre 87) : il n'essaie que
  de petits écarts de prix, il risque peu et trouve peu.
- Le tenant sortant gagne 7,0 points sur prix tenu (t = 5,03) ; 87 entreprises sur 200 y perdent (44 %).

## Attendus, relus

Le tenant garde sa place : **faux**. `plan naïf` en lice, relégué en lecture bornée seulement : **faux**, relégué
dans les deux lectures. `arrêt anticipé` : arrêt dans un tiers à la moitié des entreprises — 52 %, **juste à la
marge** ; écart entre −1 et +3 points — **juste** ; en lice — **faux**, il prend la place.

## Suite

- Tenant de la tâche « décider un prix » : **chaîne prudente à arrêt anticipé**. La chaîne prudente sans arrêt
  devient prétendante.
- **L'outil de livraison n'est pas encore changé.** L'écart est mince ; je propose de n'y brancher la lecture à
  quatre semaines qu'après un tour où le nouveau tenant aura tenu. C'est une prudence de ma part, que la règle 1
  de l'arène ne prévoit pas : au propriétaire de trancher.
- Prétendants du prochain tour : la chaîne prudente sans arrêt, un arrêt plus précoce ou à seuil différent
  (décrit avant le tour), le bandit de Thompson.
