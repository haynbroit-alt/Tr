# Résultats T3 — essai de prix commun sur une entreprise simulée

Protocole : `PROTOCOLE_T3.md` (écrit avant le code ; réglages et attendus du test poussés avant l'exécution, commit
`8e12dce`). Test : graines 6001 à 6040, **exécution unique** le 15 novembre 2026, 189 s de calcul, consignée au
registre sous `essai-prix#T3` (163 actes). Données : `test.json`.

Tout ce qui suit est une **marge simulée**. Aucun euro réel n'est en jeu ; le compte des gains réels reste à 0 €.

## 1. Ce qui a été mesuré

40 entreprises de négoce, toutes pilotables. Un objet piloté par entreprise. Marge de ces objets quand
l'entreprise est laissée seule, jours 183 à 364 : 2 937 112 € simulés.

| Bras | Gain en essai | Gain en exploitation | Gain total | € simulés |
|---|---:|---:|---:|---:|
| **Collectif** (trois moteurs) | −0,3 % | 19,4 % | **19,1 %** | 369 650 |
| Sans GALILÉE | −0,3 % | 20,2 % | 19,9 % | 388 857 |
| Sans LAVOISIER | −0,3 % | 8,6 % | 8,3 % | 219 576 |
| Sans plan de CORTEX | 0,1 % | 9,6 % | 9,6 % | 234 428 |
| Aveugle −20 % | −23,7 % | −24,1 % | −47,8 % | −856 819 |
| Aveugle −10,6 % | −10,5 % | −12,2 % | −22,8 % | −352 782 |
| Aveugle 0 (prix tenu) | −0,7 % | −1,3 % | −1,9 % | 66 168 |
| Aveugle +11,8 % | 11,8 % | 10,6 % | 22,4 % | 495 855 |
| **Aveugle +25 %** | 22,2 % | 19,6 % | **41,8 %** | 782 613 |

Les pourcentages sont des moyennes par entreprise, en part de la marge de l'entreprise laissée seule ; les euros
sont des sommes. Les deux ne se classent pas toujours pareil.

## 2. Critères

| Critère | Résultat |
|---|---|
| **K1** le collectif produit un gain | **tenu** : 19,1 % en moyenne, t = 4,01 pour un seuil de 1,685 |
| **K2** le collectif décide mieux qu'une règle aveugle | **manqué** : 19,4 % en exploitation contre 19,6 % pour « +25 % » |
| **K3** sans LAVOISIER | **établi** : le collectif fait 10,7 points de mieux, t = 3,45 |
| **K3** sans le plan de CORTEX | **établi** : 9,8 points de mieux, t = 4,17 |
| **K3** sans GALILÉE | **non établi** : −0,8 point, t = −1,14 ; la loi n'aide pas, elle gêne un peu |

Sur la fenêtre entière, la règle aveugle « +25 % » rapporte plus du double du collectif (41,8 % contre 19,1 %) : le
collectif passe 91 jours à essayer des prix pour un gain nul, et elle a raison dès le premier jour.

## 3. Attendus écrits d'avance, confrontés

| Attendu (protocole, § 11) | Constat |
|---|---|
| Meilleur niveau après coup = +25 % dans au moins 90 % des entreprises | **faux** : 34 sur 40, soit 85 % (+11,8 % : 5 ; prix tenu : 1) |
| K1 tenu, gain total entre 10 % et 20 % | tenu : 19,1 % |
| K2 manqué ; exploitation : collectif 13 à 18 %, « +25 % » 15 à 20 % | K2 manqué comme prévu ; le collectif fait 19,4 %, au-dessus de ma fourchette |
| K3 établi pour LAVOISIER et le plan de CORTEX, pas pour GALILÉE | tenu |
| La règle aveugle rapporte au moins le double sur la fenêtre entière | tenu : 41,8 % contre 19,1 % |
| Aucune confirmation du juge de CORTEX | tenu : 23 « indécis », 17 sans objet |

Attendus d'avant toute mise au point (§ 9) : le coût de LAVOISIER est exact dans 40 cas sur 40 (attendu : 80 % à
moins de 5 %) ; la loi de GALILÉE est retenue 13 fois sur 40 (attendu : moins de la moitié).

## 4. Ce que chaque moteur a apporté

- **LAVOISIER** : le coût unitaire, exact partout. Sans lui on maximise le chiffre d'affaires, et on perd plus de
  la moitié du gain. C'est l'apport le plus net.
- **CORTEX** : son plan d'essai (trois niveaux alternés) fait gagner 9,8 points de marge de plus qu'un essai
  « avant / après ». Son juge, lui, n'a rien décidé : il éprouve ce qu'une formule ajoute au-delà d'un effet
  linéaire, et sur ±25 % de prix il n'y a presque rien au-delà. C'était écrit d'avance.
- **GALILÉE** : aucune contribution mesurable. Sa loi est retenue 13 fois ; elle change 3 décisions, dont une
  coûte 19 666 € simulés. Avec trois niveaux de prix et des comptages journaliers, une simple table suffit.

Le collectif choisit le meilleur niveau après coup dans 32 entreprises sur 40, et à un cran près dans 38.

## 5. Pourquoi la règle aveugle gagne : le simulateur n'a pas de bon prix

Contrôle fait sur les graines de mise au point, en élargissant la plage jusqu'à près de quatre fois le prix : dans
19 entreprises sur 20, la marge monte sans limite avec le prix. La seule exception est l'entreprise qui ne vend
rien sur facture. Dans le simulateur, les ventes sur facture ne dépendent pas du prix : plus on monte, plus on
gagne. « Monter le prix » y est donc toujours la bonne réponse, et aucune méthode ne peut y battre une règle qui
monte à l'aveugle.

Ce test ne pouvait pas répondre « oui » à sa question. Il répond autre chose, et c'est utile : la chaîne des trois
moteurs fonctionne de bout en bout, elle produit un gain, deux moteurs sur trois y pèsent, et le terrain d'essai
est trop simple pour la question posée.

## 6. Limites

- Simulation, un objet par entreprise, une année, un levier.
- 10 entreprises sur 40 perdent de la marge avec le collectif, 4 avec « +25 % » : le témoin nul change lui-même
  ses prix au hasard, et la comparaison porte sur 182 jours.
- Mesure secondaire, bruitée par construction (L2, § 4) : écart de profit total du second semestre, collectif
  +722 715 € simulés, « +25 % » +562 518 €. Elle classe les deux bras à l'envers de la mesure principale ; je ne
  lui fais dire rien.
- L'attendu « au moins 90 % » sur le meilleur niveau était trop fort : 85 %.

## 7. Ce que cela change

1. Les six expériences de prix consignées « impossibles » ne le sont plus : le registre compte 41 expériences
   communes exécutées, contre 1.
2. Pour une offre réelle d'essais de prix, ce qui est démontré en simulation : reconstituer le coût depuis les
   écritures, et conduire un essai mieux qu'un « avant / après ». Ce qui ne l'est pas : faire mieux qu'une hausse
   aveugle. Aucun argument commercial ne doit dire le contraire.
3. La prochaine expérience utile est la même dans un monde où la bonne direction varie d'une entreprise à
   l'autre. Cela demande de changer la demande du simulateur (des ventes sur facture sensibles au prix), donc un
   protocole dans le dépôt de LAVOISIER avant tout code. Non commencé.
4. Raccourcir l'essai (s'arrêter dès que la décision est claire) réduirait le principal coût du collectif. Non
   essayé.
