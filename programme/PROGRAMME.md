# Programme de développement parallèle — GALILÉE, CORTEX, LAVOISIER, TR

**Statut** : programme écrit avant tout code nouveau. Les protocoles ci-dessous sont des **projets** : leurs seuils
sont des propositions, à valider par l'auteur des moteurs. Aucun moteur gelé n'est modifié sans protocole validé.

Trois principes, repris de l'instruction de départ :

1. **Les architectures ne fusionnent pas.** Chaque moteur évolue dans son dépôt, avec ses méthodes et ses bancs.
   TR n'importe que des copies gelées (`moteurs/`), contrôlées par empreinte.
2. **La collaboration ne réduit aucune capacité.** Quand un échange exige une capacité qu'un moteur n'expose pas,
   le moteur l'**ajoute** (nouveau module, nouveau protocole) ; TR ne la contourne pas et ne l'imite pas.
3. **Quatre comptes séparés** (`node bin/commun.js comptes`) : progrès individuels, progrès collectifs, coûts, gains
   réels. Un chiffre ne passe jamais d'un compte à l'autre.

---

## 1. Travaux prioritaires de chaque moteur

Chaque priorité part d'un chiffre mesuré dans le dépôt du moteur (`programme/reperes.json` en donne la source).

### GALILÉE — chercher de nouvelles lois

| | Travail | Ce qui le justifie (mesuré) | Progrès mesuré par | Application |
|---|---|---|---|---|
| **G1** | Ne plus se dire convaincu à tort | À 5 % de bruit : 9 arrêts « convaincu » sur une forme fausse en 75 essais ; précision 71 % contre 96 % à 1 % ; capteur qui sature retrouvé 1 fois sur 5 | arrêts convaincus à tort ; précision à 5 % ; sans perte à 1 % | une loi fausse vendue comme sûre coûte plus qu'une loi manquante |
| **G2** | Lois sur des comptages | Sur les ventes reconstruites par LAVOISIER, il rend une constante pour 20 débits sur 26 : son bruit est supposé gaussien et constant, les ventes sont des comptages | part de lois de demande retrouvées sur un banc de comptages à vérité connue | loi de demande : piste « essais de prix » |
| **G3** | Terres inconnues | 4 simulateurs sans formule exacte aujourd'hui | nouveaux simulateurs, lois empiriques jugées sur points neufs | exploration ; aucun revenu attendu |

### CORTEX — chercher de nouveaux mécanismes, mieux comprendre et agir

| | Travail | Ce qui le justifie (mesuré) | Progrès mesuré par | Application |
|---|---|---|---|---|
| **C1** | Exécuter le test unique de P3 | Prototype gelé, protocole écrit, graines 5001–5400 jamais exécutées. En P2, 1 formule de GALILÉE confirmée sur 25 | critères D1 à D5 de `PROTOCOLE_P3.md` | condition de tout essai planifié |
| **C2** | Exporter son juge (sonde et pari sur une formule) pour des données extérieures | Dans TR, il n'a pu juger aucune loi de GALILÉE sur les débits de LAVOISIER ; la confrontation T1 montre qu'il faut aussi un contrôle de recevabilité des séries | mêmes valeurs que P2 sur les graines de P2 ; taux de fausses alarmes sur séries placebo, y compris rares | juger une loi de demande sur de vraies ventes |
| **C3** | P4 : plans d'essai pour les modes lents, arbitrage avec le profit | Annoncé dans `PROTOCOLE_P3.md`. v5 : 65,8 % de l'oracle, vélos sous 50 % | profit contre habitude et oracle, à budget d'exploration compté | pilotage d'une activité réelle |

### LAVOISIER — reconstruire et améliorer les systèmes économiques

| | Travail | Ce qui le justifie (mesuré) | Progrès mesuré par | Application |
|---|---|---|---|---|
| **L1** | Atteindre les seuils de M0, geler, exécuter le test | En développement : 6 critères sur 8 atteints. Manquent le profit (P médian 3,8 %, seuil 2 %) et les fausses détections (FD2 0,20 par entreprise, seuil 0,10) | critères de `PROTOCOLE_M0.md`, puis exécution unique 5001–5300 | fiabilité de l'audit de fuites |
| **L2** | Entreprise pilotable | Dans TR, 6 expériences de prix consignées « impossibles » : son générateur ne se pilote pas | un simulateur où l'on fixe un levier par jour ; même vérité scellée | rend possibles M2, M3 et les essais communs |
| **L3** | Lecteur d'écritures réelles | Le bilan ne lit que le format de son banc | un jeu d'écritures réel lu sans perte (fichier des écritures comptables, relevés) | piste « audit de fuites » : sans lui, aucun client possible |

### TR — organiser les échanges, les confrontations, les expériences communes

| | Travail | État |
|---|---|---|
| **T1** | Confronter les mécanismes de CORTEX aux débits de LAVOISIER | **Fait.** 39 mécanismes sur 43 écartés : erreur de transmission de TR (factures mensuelles prises pour des mesures quotidiennes). Règle corrigée |
| **T2** | Faire juger par CORTEX les lois de prix de GALILÉE sur les débits de LAVOISIER | attend C2 |
| **T3** | Essais de prix communs sur une entreprise simulée | attend L2 et C1 |
| **T4** | Essai réel sur la boutique | attend trois réponses : stock et coût d'achat, budget et canal, conformité légale |
| **T5** | Quatre comptes séparés, jalons au registre | **Fait** (`src/comptes.js`, acte `jalon`) |

---

## 2. Programme parallèle

Pas de dates : seulement l'ordre et les dépendances. Dans une vague, les travaux sont indépendants et avancent en
même temps. Une vague ne commence pour un moteur que lorsque son travail précédent est publié, échecs compris.

```
            GALILÉE              CORTEX                LAVOISIER             TR
Vague 1     G1 conviction        C1 test P3            L1 seuils M0, gel     T1 fait · T5 fait
            (protocole, banc)    (exécution unique)    (développement)       T4 dès les réponses
               │                    │                     │
Vague 2     G2 comptages         C2 juge exporté       L1 test unique        T2 dès C2
               │                    │                   L3 lecteur réel
Vague 3     G3 terres inconnues  C3 P4 (agir)          L2 entreprise         T3 dès L2 + C1
                                                        pilotable
```

**Ce que chaque moteur apporte aux autres, sans dépendre d'eux :**

- GALILÉE → une loi, son verdict propre et, quand il existe, son classement d'hypothèses rivales.
- CORTEX → un jugement (pari gagné ou non), un signal de structure manquante, un plan d'essai.
- LAVOISIER → des séries reconstruites avec leur unité et leur densité, des fuites chiffrées, un coût et un gain en euros.

Chaque apport passe par le registre, signé, avec sa preuve. Un moteur peut toujours travailler seul : si les deux
autres n'existaient pas, son banc d'essai et ses jalons resteraient entiers.

---

## 3. Projets de protocoles

### G1 — conviction (GALILÉE)

- **Question** : peut-on réduire les arrêts « convaincu » sur une forme fausse sans perdre de lois vraies ?
- **Dispositif** : le banc actuel (15 lois, 4 simulateurs, bruits 1 % et 5 %). Développement sur les graines déjà
  publiées ; test sur des graines neuves et sur des lois écrites après le gel.
- **Critères proposés** : à 5 % de bruit, au plus 2 arrêts convaincus à tort sur 75 ; précision ≥ 80 % ; à 1 %,
  précision ≥ 95 %.
- **Abandon** : si la précision à 1 % passe sous 90 %.

### G2 — comptages (GALILÉE)

- **Question** : avec une vraisemblance adaptée aux comptages, retrouve-t-il une loi de demande là où il rend
  aujourd'hui une constante ?
- **Dispositif** : nouveau banc de lois de demande (puissance, seuil, saturation) observées par des comptages de
  Poisson, quelques dizaines de points, peu de niveaux de prix. Nouveau module ; le moteur gaussien reste tel quel.
- **Critères proposés** : bonne forme retrouvée ≥ 50 % quand l'effet du prix est détectable ; constante rendue
  ≥ 90 % du temps quand il n'y a aucun effet.
- **Abandon** : si une loi non constante sort dans plus de 10 % des mondes sans effet.

### C1 — test de P3 (CORTEX)

Protocole existant et gelé : `research/v6/PROTOCOLE_P3.md`. Commande :
`node research/v6/p3.js --seeds 5001-5400` en quatre tranches, puis `p3-report.js`. **Exécution unique, donc
décision de l'auteur : elle n'a pas été lancée.**

### C2 — juge exporté (CORTEX)

- **Question** : la sonde et le pari de P2 gardent-ils leurs garanties sur des séries qui ne viennent pas de ses mondes ?
- **Dispositif** : un nouveau fichier qui expose la sonde et le pari pour des données `{Y, U}` et une formule
  quelconques, sans toucher `p2.js` (gelé `1121b10`). Contrôle de recevabilité en entrée : densité, longueur,
  nombre de leviers.
- **Critères proposés** : sur les graines de P2, valeurs identiques à celles publiées ; sur 200 séries placebo
  extérieures, dont des comptages et des séries rares, au plus 10 % de fausses alarmes ; refus explicite des séries
  non recevables.
- **Abandon** : si les valeurs de P2 ne sont pas reproduites.

### L1 — seuils de M0 (LAVOISIER)

Protocole existant : `PROTOCOLE_M0.md`. Le bilan n'est pas gelé : le développement continue sur les graines 1 à 100,
consigné au § 9 du protocole. Cibles : FD2 ≤ 0,10 et P médian ≤ 2 %, sans faire tomber R sous 70 %. Puis gel,
écriture des deux archétypes de test, exécution unique.

### L2 — entreprise pilotable (LAVOISIER)

- **Question** : peut-on agir sur une entreprise opaque sans connaître sa vérité ?
- **Dispositif** : le moteur de simulation accepte, jour après jour, la valeur d'un levier (prix d'un objet,
  dépense de publicité) et rend les événements du jour. La vérité reste scellée.
- **Critères proposés** : sans intervention, journal identique à celui du générateur actuel, à l'octet ; avec
  intervention, rien ne change avant le jour de l'intervention.
- **Abandon** : si l'identité sans intervention n'est pas obtenue.

### L3 — lecteur d'écritures réelles (LAVOISIER)

Pas de critère statistique : un format (fichier des écritures comptables), un lecteur, et un premier jeu réel fourni
avec l'accord écrit de l'entreprise. Résultat attendu : le bilan tourne, et dit ce qu'il ne sait pas lire.

---

## 4. Applications et revenus

Le compte des gains réels vaut **0 €**. Trois voies peuvent le faire bouger ; aucune ne dépend d'un progrès scientifique.

| Voie | Ce qui manque | Qui débloque |
|---|---|---|
| Boutique existante : amener de vrais visiteurs français | coût d'achat, stock, budget, conformité | l'utilisateur (T4) |
| Audit de fuites comme service | lecteur réel (L3), bilan gelé et testé (L1), un premier jeu d'écritures | LAVOISIER, puis un client |
| Essais de prix garantis | juge exporté (C2), test P3 (C1), des ventes régulières | CORTEX, GALILÉE, puis la boutique |

Règle : une piste n'entre au compte des gains que par un encaissement constaté dans une comptabilité réelle.

---

## 5. Décisions attendues

1. **Lancer le test unique de CORTEX P3** (environ une heure de calcul, irréversible par nature).
2. **Valider ou corriger les seuils** des projets G1, G2, C2, L2.
3. **Boutique** : stock réel et coût d'achat ; budget maximal et canal ; conformité légale des fiches.
