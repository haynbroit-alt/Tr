# Protocole T3b — l'essai de prix commun dans un monde où la bonne direction varie

Écrit et poussé **avant** son code et avant toute exécution. Suite de `programme/t3/` ; dépend de L2b
(`haynbroit-alt/A`, `PROTOCOLE_L2B.md`).

## 1. Question

T3 n'a pas pu trancher : dans son simulateur, monter le prix était presque toujours juste, et une règle aveugle
gagnait. La question est reposée dans un monde où toutes les ventes suivent le prix et où la bonne direction change
d'une entreprise à l'autre :

**les trois moteurs, ensemble, font-ils mieux que la meilleure règle aveugle, apprentissage compris ?**

Comme pour T3, tout est une marge simulée ; aucun euro réel n'est en jeu.

## 2. Ce qui ne change pas

Tout le dispositif de `programme/t3/PROTOCOLE_T3.md`, réglages du § 11 compris : calendrier (jours 183, 274, 364),
cinq niveaux de prix, choix de l'objet, prix de référence, rôles des trois moteurs, règle de décision, mesure de la
marge, bras aveugles, bras « sans un moteur ». Aucun moteur n'est modifié.

## 3. Ce qui change

1. **Le monde.** Classe : négoce, un flux caché, désordre réaliste, **demande sensible** (L2b) : élasticité de 0,8
   à 5, ventes sur facture comprises.
2. **Un bras de plus, le collectif court.** Même plan de CORTEX, arrêté après ses 8 premiers blocs ; décision au
   jour 239 avec la même règle ; exploitation des jours 239 à 364. Motif : dans T3 l'essai coûtait 91 jours pour un
   gain nul, et les cinq derniers blocs du plan sont tous au niveau 0.
3. **Un critère de plus**, sur la fenêtre entière (K2b).

## 4. Graines

- Mise au point : **221 à 240**.
- Test : **6041 à 6080**, exécution unique, après que les réglages ont été écrits ici et poussés.

## 5. Critères, sur le test

- **K1 — le collectif produit un gain** sur la fenêtre entière (183–364) : moyenne supérieure à 0, test unilatéral
  apparié à 5 %.
- **K2 — il décide mieux qu'une règle aveugle** : en exploitation (274–364), gain moyen du collectif supérieur à
  celui du meilleur des cinq bras aveugles, désigné après coup sur les entreprises du test.
- **K2b — il fait mieux apprentissage compris** : sur la fenêtre entière, gain moyen du collectif supérieur à
  celui du meilleur bras aveugle. C'est le critère économique : l'essai doit se rembourser.
- **K3 — chaque moteur compte** : pour chaque bras « sans », gain en exploitation inférieur à celui du collectif ;
  « établi » seulement si le test unilatéral apparié à 5 % le dit.
- **K4 — le collectif court fait mieux que le collectif** sur la fenêtre entière ; « établi » ou « non établi » de
  la même façon.
- **Invalide** si moins de 20 des 40 entreprises ont un objet pilotable, ou si le critère B3 de L2b (la bonne
  direction varie) n'est pas tenu en mise au point.

Les seuils ne seront pas retouchés. Un critère manqué est publié comme tel.

## 6. Attendus, écrits avant toute mise au point

1. La bonne direction varie : en mise au point, au moins 4 entreprises sur 20 ont leur meilleur niveau en baisse
   et au moins 4 en hausse.
2. Aucun bras aveugle ne gagne plus de 8 % en moyenne ; le meilleur est le niveau 0 ou +11,8 %.
3. K1 tenu. K2 tenu. **K2b tenu, de peu** : c'est le critère dont je suis le moins sûr.
4. K3 établi sans LAVOISIER et sans le plan de CORTEX. Sans GALILÉE : non établi — mais c'est ici qu'elle a sa
   chance, parce que le plan de CORTEX n'essaie que trois niveaux et que seule une loi peut choisir les deux
   niveaux intermédiaires.
5. K4 établi : le collectif court gagne davantage.
6. Le collectif choisit le meilleur niveau après coup dans 40 à 60 % des entreprises, et à un cran près dans au
   moins 75 %.
7. Coût de LAVOISIER exact dans au moins 90 % des entreprises. Juge de CORTEX : aucune confirmation.

## 7. Limites écrites d'avance

Celles de T3 (§ 10), plus : le monde a été changé pour que la question ait un sens. Ce choix est fait avant toute
mesure, et les règles aveugles restent les adversaires ; mais un résultat favorable vaudra pour ce monde simulé, pas
pour une entreprise réelle.
