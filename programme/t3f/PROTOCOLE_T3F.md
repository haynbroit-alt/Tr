# Protocole T3f — le taux de marge suffit-il à dire le sens, sans essai ?

Écrit et poussé **avant** son code et avant toute exécution. Suite de `programme/t3c/`, `t3d/` et `t3e/`.

## 1. D'où vient la question

Sur les 200 entreprises déjà testées (T3c : 80, T3d : 60, T3e : 60), la chaîne retenue (essai de 8 semaines puis
décision par la table) gagne en moyenne 6,0 points sur « prix tenu », mais **84 entreprises sur 200 y perdent**.
Relecture après coup de ces mêmes entreprises, sans nouvelle simulation :

- quand la chaîne conclut « ne rien changer » (44 entreprises), elle perd dans 37 : l'essai a coûté pour rien ;
- les pertes se rangent selon le **taux de marge** m = prix de référence ÷ coût unitaire, que LAVOISIER donne
  avant tout essai : m < 1,4 → la chaîne gagne 13,4 points mais « +25 % à l'aveugle » en gagnerait 32,6 ;
  m entre 1,4 et 1,7 → la chaîne perd 3,5 points ; m > 2,1 → « −20 % à l'aveugle » fait mieux que la chaîne.

Une règle sans essai, lue sur ces 200 entreprises : **m < 1,4 → +25 % ; m > 2,1 → −20 % ; sinon prix tenu**.
Sur ces mêmes entreprises elle gagne 9,6 points sur prix tenu et 3,6 sur la chaîne, avec 30 perdantes au lieu de 84.

**Ces chiffres ne prouvent rien** : les seuils ont été choisis sur les entreprises qui servent à les juger, et
l'effet n'est pas régulier d'un lot à l'autre (règle − prix tenu : 1,4 point sur T3c, 18,8 sur T3d, 11,2 sur T3e).
Deux fois déjà un effet vu après coup ou en mise au point n'a pas tenu au test (bras « bref » de T3b, erreur type
de T3e). D'où ce protocole, sur des entreprises neuves.

## 2. Question

1. La règle de marge, sans aucun essai, fait-elle mieux que « prix tenu » ?
2. Fait-elle mieux que la chaîne retenue ?
3. La variante **mixte** (règle aux extrêmes, chaîne entre 1,4 et 2,1) fait-elle mieux que la chaîne seule ?

Marge simulée ; aucun euro réel.

## 3. Dispositif

- Monde : demande sensible, hasard commun (classe de T3e : `demande: 'sensible'`, `alea: 'commun'`).
- Pour chaque entreprise, les bras déjà définis : témoin nul, cinq règles aveugles, chaîne retenue. **Aucune
  nouvelle simulation** pour les deux bras ajoutés, qui se composent des précédents :
  - **règle** : m < 1,4 → bras « aveugle +25 % » ; m > 2,1 → bras « aveugle −20 % » ; sinon bras « prix tenu » ;
  - **mixte** : m < 1,4 → « aveugle +25 % » ; m > 2,1 → « aveugle −20 % » ; sinon chaîne retenue.
- m = prix de référence ÷ **coût unitaire estimé par LAVOISIER sur le journal coupé au jour 183** (ce qu'un client
  aurait en main), jamais le coût vrai. Coût indisponible : la règle et la mixte valent « prix tenu ».
- Seuils 1,4 et 2,1 **fixés ici**, non retouchés. Bornes strictes : m = 1,4 ou m = 2,1 → zone du milieu.
- Pas de bandit : il n'entre pas dans la question et coûterait l'essentiel du calcul.
- Mesure : marge vraie de l'objet piloté, jours 183 à 364, gain en % de la marge du témoin nul.

## 4. Graines

- Mise au point : aucune. Vérification que le code tourne sur les graines 241 à 243 (déjà vues, T3e).
- Test : **6281 à 6400**, soit 120 entreprises, exécution unique. 120 et non 60 parce que l'écart « chaîne − prix
  tenu » a varié de 1,6 à 11,6 points entre lots de 60 à 80.

## 5. Critères, sur le test

Écarts appariés sur le gain total, test unilatéral à 5 % (même table que T3 à T3e).

- **F1 — la règle fait mieux que prix tenu.**
- **F2 — la règle fait mieux que la chaîne.**
- **F3 — la mixte fait mieux que la chaîne.**
- **F4 — moins de perdantes** : le nombre d'entreprises où la règle fait moins bien que prix tenu est au plus la
  **moitié** du nombre d'entreprises où la chaîne fait moins bien que prix tenu.

Un critère manqué est publié comme tel.

## 6. Attendus, écrits avant toute exécution

1. F1 tenu, écart entre 4 et 12 points (les 9,6 points vus sont flattés par le choix des seuils).
2. F2 **non établi** : écart entre 0 et +4 points. Sur T3c la règle ne battait pas la chaîne.
3. F3 tenu, écart entre 1,5 et 5 points.
4. F4 tenu.
5. Entre 35 et 55 % des entreprises ont m < 1,4 ou m > 2,1 (88 sur les 200 déjà vues : 30 en dessous, 58 au-dessus).

## 7. Limites écrites d'avance

- **La règle exploite une propriété du simulateur.** Dans LAVOISIER, le prix de référence est tiré sans lien avec
  la sensibilité de la demande. Une marge très faible y signale donc un prix probablement sous l'optimum, une
  marge très forte un prix probablement au-dessus. Une entreprise réelle fixe son prix en connaissant un peu ses
  clients : rien ne dit que la règle s'y transporte. Un succès ici dirait « dans ce monde, le coût seul porte
  l'essentiel de l'information », pas « baissez vos prix si votre marge dépasse 2,1 ».
- Ce que le résultat peut apporter hors simulation est plus modeste : savoir **quand un essai est inutile** parce
  que la structure de coût désigne déjà le sens, et réserver l'essai aux cas incertains (bras mixte).
- Un monde, un objet par entreprise, 26 semaines, seuils lus sur trois lots de ce même simulateur.
- Le lot T3c (même simulateur sans hasard commun) ne montrait presque rien : l'effet peut ne pas se reproduire.
