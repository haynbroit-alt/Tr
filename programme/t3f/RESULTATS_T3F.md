# Résultats T3f — la règle de marge sans essai

Exécution unique du 15 novembre 2026, graines 6281 à 6400 (120 entreprises, aucune écartée), dossier
`essai-prix#T3F` du registre, détail dans `programme/t3f/test.json`. Protocole : `PROTOCOLE_T3F.md`, poussé avant le
code. Marge simulée ; aucun euro réel.

## 1. Critères

| Critère | Résultat | Verdict |
|---|---|---|
| **F1** — la règle fait mieux que prix tenu | +8,2 points, t = 2,16 (seuil 1,684) | **tenu** |
| **F2** — la règle fait mieux que la chaîne | +0,9 point, t = 0,43 | **non établi** (l'inverse non plus) |
| **F3** — la mixte fait mieux que la chaîne | +1,9 point, t = 1,18 | **non établi** |
| **F4** — au plus moitié moins de perdantes | règle 27, chaîne 50 (il fallait 25 au plus) | **manqué**, de deux entreprises |

Gain moyen sur la marge de l'objet piloté : règle 17,1 % ; mixte 18,1 % ; chaîne 16,2 % ; prix tenu 8,9 % ;
+25 % à l'aveugle 4,4 % ; −20 % à l'aveugle −13,8 %.

## 2. Ce que cela dit

- **Sans aucun essai, la règle fait jeu égal avec la chaîne** (essai de huit semaines puis décision), et elle fait
  perdre presque deux fois moins d'entreprises : 27 contre 50 sur 120. C'est le coût unitaire de LAVOISIER, connu
  au jour 183, qui porte l'information. Coût exact sur 119 entreprises sur 120.
- **Elle ne fait pas mieux que la chaîne.** Les 3,6 points d'avance lus sur les 200 entreprises déjà vues n'étaient
  pas là : 0,9 point sur des entreprises neuves. Troisième effet vu après coup qui fond au test.
- **La mixte n'apporte rien d'établi** et fait perdre plus d'entreprises que la chaîne (56 contre 50).
- La chaîne, elle, gagne 7,3 points sur prix tenu (t = 2,59) : quatrième lot après 1,6, 11,6 et 6,0.

## 3. Par zone de marge (lecture descriptive, sans critère)

| Zone | Entreprises | Règle | Chaîne | Prix tenu | Perdantes : règle / chaîne |
|---|---|---|---|---|---|
| marge < 1,4 | 19 | 74,9 % | 55,2 % | 34,3 % | 5 / 8 |
| entre 1,4 et 2,1 | 63 | 2,4 % | 4,3 % | 2,4 % | 0 / 29 |
| marge > 2,1 | 38 | 12,5 % | 16,5 % | 7,0 % | 22 / 13 |

- **Marge faible** : la règle (+25 % d'emblée) dépasse la chaîne de 19,7 points (t = 3,28 sur 19 entreprises). La
  chaîne y décide pourtant « +25 % » 17 fois sur 19 : ce qu'elle perd, c'est l'essai lui-même, dont les semaines à
  prix baissé se vendent presque à prix coûtant. Même sens que sur les 200 entreprises déjà vues.
- **Marge forte** : ce que j'avais lu après coup était faux. « −20 % à l'aveugle » ne bat pas la chaîne (12,5 contre
  16,5 %) et fait perdre 22 entreprises sur 38 ; la chaîne, 13.
- **Entre les deux** : la chaîne gagne 1,9 point sur prix tenu, non établi, et fait perdre 29 entreprises sur 63.
  Quand elle conclut « ne rien changer » (14 entreprises sur 120), elle perd 14 fois : l'essai a coûté pour rien.

## 4. Attendus, relus

| Attendu | Constat |
|---|---|
| F1 tenu, 4 à 12 points | tenu, 8,2 points — **juste** |
| F2 non établi, 0 à +4 points | non établi, +0,9 — **juste** |
| F3 tenu, 1,5 à 5 points | 1,9 point mais non établi — **faux** |
| F4 tenu | manqué de deux entreprises — **faux** |
| 35 à 55 % d'entreprises aux extrêmes | 57 sur 120, soit 47,5 % — **juste** |

## 5. Cumul des quatre lots où la chaîne est la même (T3c, T3d, T3e, T3f)

320 entreprises : chaîne − prix tenu = **+6,5 points** (erreur type 1,37 ; t = 4,71). **134 entreprises sur 320 y
perdent**, soit 42 %.

## 6. Ce que cela change à la stratégie

1. **Rien à vendre de plus.** La règle repose sur une propriété du simulateur, écrite au protocole : le prix de
   référence y est tiré sans lien avec la sensibilité de la demande. On ne dit à aucun client de monter ou de
   baisser son prix d'après son seul taux de marge.
2. **Un défaut de notre essai est identifié, et il ne dépend pas du simulateur.** À marge faible, le plan fait
   passer des semaines à −20 % : la marge unitaire y tombe de 0,40 à 0,12 fois le coût, il faudrait vendre plus de
   trois fois plus pour s'y retrouver. C'est de l'arithmétique, vraie chez n'importe quel client. Suite proposée,
   à protocoler : un plan d'essai qui écarte d'avance les niveaux de prix dont le seuil de rentabilité est hors
   d'atteinte, calculé avec le coût de LAVOISIER.
3. **La question « reconnaître d'avance les entreprises où l'essai fait perdre » reste ouverte** pour la zone du
   milieu (29 perdantes sur 63) : le taux de marge n'y dit rien.
4. Les affirmations permises de l'offre ne changent pas : aucun gain promis.
