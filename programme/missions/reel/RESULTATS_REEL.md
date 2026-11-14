# Résultats RÉEL — GALILÉE sur des mesures réelles de référence

Protocole : `PROTOCOLE_REEL.md`, poussé avant toute exécution (commit `7be7418`) ; script et mise à l'échelle gelés
avant le test (commit `2eae4bf`). Exécution unique du 14 novembre 2026, 41 secondes de calcul :
`node scripts/reel-nist.js --lot observe --echelle norme --out programme/missions/reel/test-observe.json`.
Moteur : copie gelée de GALILÉE (`be42b7e`), mode « données fournies », graine 1. Une mesure sur quatre mise de côté.

## Verdict

| | Critère | Seuil | Mesuré | Verdict |
|---|---|---|---|---|
| **E1** | jeux au niveau de la référence (erreur sur points non vus ≤ 2 fois l'écart-type certifié) | au moins 8 | 8 sur 15 | **atteint, sans aucune marge** |
| **E2** | jeux très éloignés (rapport > 10) dits « établie » | aucun | 0 sur 2 | atteint |

Trois réserves, à lire avant de citer ce résultat :

1. **Le protocole annonçait 16 jeux distincts ; il y en a 15.** Les quatre fichiers Misra portent les mêmes mesures
   (j'en avais compté deux paires, sur une comparaison de texte fautive). La règle écrite — un jeu répété compte une
   fois, avec le plus petit écart-type certifié — a été appliquée telle quelle par le script. Le seuil reste 8.
2. **Un des 8 est une constante.** Sur ENSO, le moteur rend une constante et reste « au niveau » parce que le modèle
   de l'étude fait à peine mieux que la moyenne. Sans lui : 7 sur 15, sous la moitié.
3. **Le verdict du moteur n'a pas prévenu.** Les deux lois dites « incertaine » sont parmi les meilleures (Kirby2,
   Nelson) ; les sept échecs sont tous dits « empirique ». Même constat que G4 : en données fournies, le niveau de
   confiance ne vaut pas garantie.

## Jeu par jeu

Rapport = erreur sur les mesures mises de côté ÷ écart-type certifié. La loi est écrite dans les variables réduites.

| Jeu | Mesures | Rapport | Verdict du moteur | Modèle de l'étude | Loi rendue |
|---|---:|---:|---|---|---|
| Kirby2 | 151 | **0,09** | incertaine | quotient de deux polynômes de degré 2 | `14 / ((x^(4/3) + 0.3156)^1.609·(1 / x^4.093 + 8 / x^2))` |
| Nelson | 128 | **0,69** | incertaine | `log[y] = b1 - b2*x1 * exp[-b3*x2]` | `1 − sin(x1 / (1 / x2^16 − 1/4) + 0.133·x2)` |
| Chwirut1 | 214 | **0,89** | empirique | `exp[-b1*x]/(b2+b3*x)` | `0.06087 / (x^(π/2) + 0.05131)` |
| Bennett5 | 154 | **0,94** | empirique | `b1 * (b2+x)**(-1/b3)` | `−4.099 / (x + 3.492)` |
| Hahn1 | 236 | **1,09** | empirique | quotient de deux polynômes de degré 3 | `0.2718·(exp(−0.09401 / x) + x)^2 / x^0.8101` |
| Chwirut2 | 54 | **1,16** | empirique | `exp(-b1*x)/(b2+b3*x)` | `sin(0.08884 / x)` |
| ENSO | 168 | **1,55** | empirique | constante plus sinusoïdes | `0.6034` (une constante) |
| Misra1a à 1d | 14 | **1,76** | empirique | quatre modèles proposés, dont `b1*b2*x/(1+b2*x)` | `11·x / ((x + 9/2)·2)` |
| Rat43 | 15 | 3,55 | empirique | courbe de croissance en S | `x` |
| BoxBOD | 6 | 4,79 | empirique | `b1*(1-exp[-b2*x])` | `x` |
| Rat42 | 9 | 5,05 | empirique | courbe de croissance en S | `x` |
| Roszman1 | 25 | 5,41 | empirique | droite moins un arc tangente | `exp(x)` |
| Thurber | 37 | 6,72 | empirique | quotient de deux polynômes de degré 3 | `sin(2.2 − x)` |
| Eckerle4 | 35 | 17,16 | empirique | pic en cloche | `0.2109` (une constante) |
| DanWood | 6 | 19,72 | empirique | `b1*x**b2` | `3/4` (une constante) |

## Ce qui est solide

- **Kirby2, vérifié à part** : sur les 38 mesures mises de côté, le modèle certifié du NIST se trompe de 0,156 et
  la loi de GALILÉE de 0,015 — dix fois moins, sur des points qu'elle n'a pas vus. Le calcul de l'erreur du modèle
  certifié retombe sur l'écart-type publié (0,164), ce qui valide la chaîne de mesure.
- **Deux formes de la même famille que l'étude** : Bennett5 (le modèle de l'étude avec l'exposant fixé à 1) et Misra
  (la forme de l'un des quatre modèles proposés).
- Les autres lois « au niveau » prédisent bien mais n'ont pas la forme de l'étude : ce sont des courbes
  d'interpolation, pas des lois à interpréter.

## Ce que cela change

- **Constat après coup, pas un critère** : les 7 jeux de 54 mesures ou plus sont tous au niveau de la référence ;
  sur les 8 jeux de 37 mesures ou moins, un seul. Hypothèse à confirmer sur d'autres données : sous une cinquantaine
  de mesures, le moteur rend une loi triviale (`x`, une constante) sans le signaler.
- Pour l'offre de mission : n'accepter une demande « trouver la loi » qu'avec une cinquantaine de mesures au moins ;
  promettre une prédiction vérifiée sur points mis de côté, pas « la vraie loi » ; ne jamais s'appuyer sur le seul
  verdict du moteur.

## Limites

Interpolation seulement, l'extrapolation n'est pas mesurée. Quinze jeux. Mesures de laboratoire, pas des données
d'entreprise. Une seule graine. Les 9 jeux générés du réglage : aucun au niveau de la référence.
