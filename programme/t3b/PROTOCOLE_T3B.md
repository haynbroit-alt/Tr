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

---

## 8. Mise au point (graines 221 à 240) — écrit et poussé avant le test

### Le monde convient à la question

Critère B3 de L2b tenu : le meilleur niveau après coup est en baisse dans 7 entreprises sur 20 (−20 % : 5 ;
−10,6 % : 2), en hausse dans 12 (+11,8 % : 7 ; +25 % : 5), inchangé dans 1. Aucune règle aveugle ne gagne plus de
1,3 % en moyenne.

### Ce que la mise au point a mesuré (20 entreprises, toutes pilotables)

| Bras | Gain en essai | Gain en exploitation | Gain total |
|---|---:|---:|---:|
| Collectif (13 blocs) | −1,9 % | 7,1 % | 5,2 % |
| Collectif court (8 blocs) | 0,4 % | 6,7 % | 7,1 % |
| Collectif bref (5 blocs) | 2,4 % | 7,4 % | 9,8 % |
| Sans GALILÉE | −1,9 % | 6,5 % | 4,6 % |
| Sans LAVOISIER | −1,9 % | −5,1 % | −7,0 % |
| Sans plan de CORTEX | −1,0 % | 5,9 % | 4,9 % |
| Meilleur aveugle (+11,8 %) | 0,1 % | 1,2 % | 1,3 % |

Détail : `programme/t3b/dev.json`. Les écarts-types sont larges (4 à 5 points sur chaque moyenne) : le témoin nul
change lui-même ses prix au hasard, et dans un monde élastique cela pèse.

### Ce que j'ai essayé et ce que j'en garde

1. **Une règle de décision révisée — retirée.** Choisir, entre la loi de GALILÉE et une droite, le modèle qui
   prédit le mieux les jours mis de côté : 5,4 % de gain total contre 5,2 %, et une décision à un cran près dans
   17 cas au lieu de 19. Aucun progrès : la règle de T3 reste celle du test.
2. **La durée de l'essai — gardée, comme un bras de plus.** Mesure : si le niveau décidé avait été appliqué dès le
   jour 183, il aurait rapporté 15,9 % ; l'essai de 13 blocs n'en laisse que 5,2 %. Ce n'est donc pas la décision
   qui pèche, c'est le temps passé à essayer. Courbe selon le nombre de blocs avant décision :

   | Blocs | 3 | 4 | 5 | 6 | 7 | 8 | 10 | 13 |
   |---|---:|---:|---:|---:|---:|---:|---:|---:|
   | Gain total | 7,9 % | 9,2 % | 9,8 % | 8,1 % | 7,4 % | 7,1 % | 5,9 % | 5,2 % |
   | Valeur du niveau décidé | 9,1 % | 14,5 % | 15,3 % | 12,8 % | 15,0 % | 14,3 % | 15,7 % | 15,9 % |

   La qualité de décision plafonne dès 4 ou 5 blocs ; ensuite chaque bloc coûte. **Bras ajouté : le collectif
   bref**, 5 premiers blocs du plan de CORTEX (−1, 0, +1, −1, +1), décision au jour 218. Cinq est le premier
   point où chaque extrême a été essayé deux fois ; je ne retiens pas 4 ou 5 sur la foi d'un écart de 0,6 point.
3. **Constat sans correction** : après une baisse de prix, une semaine d'essai vend plus que le réapprovisionnement
   ne soutient dans la durée ; une décision sur vingt en est faussée. Un modèle du stock le corrigerait. Non fait.

### Critère ajouté

- **K5 — le collectif bref fait mieux que le meilleur bras aveugle** sur la fenêtre entière, en moyenne ; l'écart
  apparié est donné avec son test unilatéral à 5 %.

Le collectif des critères K1, K2, K2b et K3 reste celui de 13 blocs, comme écrit avant la mise au point.

### Attendus pour le test, écrits avant son exécution

1. Le monde reste varié : meilleur niveau en baisse dans au moins 8 entreprises sur 40, en hausse dans au moins 8.
2. **K1 manqué** : gain du collectif positif (3 à 8 %) mais non significatif. En mise au point : 5,2 %, t = 1,17.
3. **K2 tenu** (environ 7 % contre 1 à 2 %). **K2b tenu en moyenne**, sans que l'écart apparié soit significatif.
4. **K3** : établi sans LAVOISIER ; non établi sans le plan de CORTEX ni sans GALILÉE.
5. **K4** : le collectif court fait mieux que le collectif, sans que ce soit établi.
6. **K5 tenu en moyenne** : collectif bref entre 6 et 12 %, meilleur aveugle sous 3 %. Je ne sais pas si l'écart
   apparié passera le seuil : en mise au point, t = 1,21.
7. Ordre attendu des gains totaux : bref > court > collectif > meilleur aveugle.
8. Coût de LAVOISIER exact dans au moins 95 % des entreprises ; juge de CORTEX : aucune confirmation.

Si ces attendus se vérifient, la conclusion sera : dans un monde où la direction varie, l'essai commun fait mieux
que toute règle aveugle en moyenne, surtout s'il est bref, mais 40 entreprises ne suffisent pas à l'établir avec
certitude.
