# Résultats T3h — l'atelier a refusé : rien ne désigne les perdantes avant l'essai

15 novembre 2026. Protocole `PROTOCOLE_T3H.md`, poussé avant le code. Lot de l'atelier : graines 301 à 500 (199
entreprises mesurées, une écartée), `dev.json`. Règles rendues : `politique.json`. Marge simulée ; aucun euro réel.

## 1. Ce que l'atelier a rendu

- **Règle restreinte (où ne pas essayer)** : refus. À aucune profondeur, pour aucun des huit traits, il n'existe un
  groupe d'au moins 20 entreprises où « prix tenu » fait mieux que la chaîne. Rien n'est proposé, même en
  apprentissage, là où une recherche trouve d'ordinaire trop.
- **Règle complète (huit actions)** : refus. En apprentissage l'arbre trouve une règle (« si l'historique est
  net et la demande sensible, décider sans essai ; si la marge est faible et l'historique flou, +25 % »), mais
  hors pli elle fait 1,0 point de **moins** que la chaîne (t = −1,07). L'atelier rend donc la chaîne partout.

## 2. Critères

Les règles gelées étant « la chaîne partout », les critères sont réglés sans exécuter le test :

| Critère | Verdict |
|---|---|
| **P1** — les perdantes sont désignées | **manqué** (refus : aucune entreprise désignée) |
| **P2** — n'essayer que là où c'est désigné rapporte | **manqué** (règle identique à la chaîne) |
| **H1** — la méthode inventée fait mieux que la chaîne | **manqué** (rien d'inventé) |
| **H2** — moins de perdantes | **manqué** |
| **H3** — l'atelier ne se raconte pas d'histoire | **sans objet** : il n'a rien annoncé |

**Le test (graines 6701 à 6900) n'a pas été exécuté** : il comparerait la chaîne à elle-même. Ces 200 graines
restent neuves.

## 3. Ce que le lot de l'atelier montre (199 entreprises, lecture descriptive)

| Action | Gain moyen | Gain borné à ±100 points |
|---|---|---|
| chaîne prudente | 16,9 % | 12,4 % |
| décision directe, sans essai (droite sur l'historique + coût de LAVOISIER) | 15,9 % | 9,6 % |
| décision directe par la loi de GALILÉE | 7,7 % | 4,6 % |
| prix tenu | 4,0 % | 3,4 % |
| le meilleur des huit, connu après coup | — | 22,4 % |

- **89 entreprises sur 199 perdent avec la chaîne (45 %), mais elles perdent peu** : perte médiane 4,8 points,
  quand les 110 gagnantes gagnent 16,0 points en médiane. Perdre, ici, c'est avoir payé l'essai pour apprendre que
  le prix était déjà bon : 30 des 38 entreprises où la chaîne conclut « ne rien changer » sont perdantes.
- **Savoir d'avance qui perdra revient à savoir d'avance que le prix est déjà bon** — l'information même que
  l'essai sert à obtenir. Ni la marge, ni la sensibilité lue sur l'historique, ni le bruit ne la donnent.
- **Décider sans essai fait presque aussi bien en moyenne** (15,9 contre 16,9 %) et mieux dans 121 entreprises sur
  199, mais avec de plus grosses erreurs. Quand l'historique est net (t > 3, 59 entreprises), 18,0 contre 14,9 %
  en borné : lu après coup, non retenu par la validation croisée, donc **non établi**.
- **La loi de GALILÉE n'est retenue que dans 39 entreprises sur 199**, et la décision qu'elle dicte fait moitié
  moins bien que celle d'une simple droite.

## 4. Attendus, relus

| Attendu | Constat |
|---|---|
| « direct » fait mieux que la chaîne ; l'atelier ne refuse pas | **faux** deux fois |
| H1 tenu, 4 à 15 points ; H2 ; P1 ; P2 | **faux** |
| H3 tenu (deux chances sur trois) | sans objet |
| Loi de GALILÉE retenue dans moins d'une entreprise sur deux, pas mieux que la droite, non utilisée | **juste** |

## 5. La méthode qui invente ses méthodes : ce qui est évalué, ce qui ne l'est pas

- **Évalué** : elle sait ne rien proposer. C'est la première fois dans ce programme qu'une règle séduisante en
  apprentissage est arrêtée avant de coûter un test — T3b, T3e et T3f avaient chacun payé un test pour l'apprendre.
- **Pas évalué** : qu'elle sache trouver quand il y a quelque chose. Un refus ne le prouve pas. Il faut l'étalonner
  sur des cas à réponse connue (effet planté, traits brouillés) : taux de fausses inventions, puissance.
- Son vocabulaire est étroit : huit actions, huit traits, des arbres.

## 6. Ce que cela change à la stratégie

1. **On arrête de chercher à prédire les perdantes avec ces traits.** La question utile devient : réduire ce que
   coûte l'essai quand il ne trouve rien (essai plus court, arrêt anticipé dès que les premières semaines ne
   montrent aucun écart).
2. **À un client, on peut dire la vérité simple** : « près d'une fois sur deux l'essai confirmera votre prix
   actuel ; il vous aura alors coûté quelques points de marge pendant huit semaines ».
3. La décision sans essai reste une piste, pas un produit : historique simulé sans promotions.
