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

---

## 6. Avancement (14 novembre 2026)

Les quatre décisions ont été données d'un bloc (« j'autorise tout »). Jalons consignés au registre
(`programme/jalons-2026-11-14.json`, `node bin/commun.js comptes`).

| Travail | État | Mesure |
|---|---|---|
| **C1** CORTEX | test unique lancé, graines 5001–5400 | résultat à consigner à la fin de l'exécution |
| **L1** LAVOISIER | en cours, PR `haynbroit-alt/A#7` | FD2 0,20 → 0,08 (0,12 sur données réalistes) ; R 70/95 → 80/95 ; P inchangé à 3,8 % |
| **G2** GALILÉE | mesuré puis suspendu, PR `haynbroit-alt/All#2` | le moteur actuel retrouve déjà 79 % des lois détectables sur comptages : l'hypothèse du programme était fausse, le module n'est pas écrit |
| **T4** boutique | toujours bloqué | il manque des faits, pas une autorisation : stock, coût d'achat, budget ; connexion à la boutique à rétablir |

Conséquence pour le programme : les constantes rendues par GALILÉE sur les ventes de LAVOISIER ne viennent pas du
bruit de comptage. Piste suivante, non vérifiée : l'effet du prix n'y est pas détectable (prix qui bougent de
−12 % à +15 %). Cela renforce L2 (entreprise pilotable) : seule une expérience qui fait varier le prix peut trancher.

---

## 7. Passage à la valeur réelle (14 novembre 2026, suite)

- **C1 terminé** : test unique de CORTEX P3 exécuté, trois critères atteints (84 % des formules confirmées sous plan
  actif contre 23 % en passif ; 4 fausses confirmations sur 404). PR `haynbroit-alt/1#11`.
- **L1 remesuré** après fusion avec un autre travail parallèle : FD2 0,09 sur toutes les graines, 0,15 sur données
  réalistes. PR `haynbroit-alt/A#8`. La copie gelée de LAVOISIER dans `moteurs/` passe au commit `a25b206`.
- **Opportunités** : acte `opportunite` en dix points (`programme/opportunites-2026-11-14.json`,
  `node bin/commun.js executer opportunites --fichier …`). Huit opportunités instruites ; une retenue en premier, la
  boutique existante, parce que son expérience ne demande aucune dépense nouvelle et qu'elle se termine dans tous
  les cas par une valeur réelle : une première vente, ou une raison mesurée d'arrêter une perte mensuelle.

## 8. Mandat entrepreneurial et décisions déléguées (14 novembre 2026, soir)

Le propriétaire a demandé que l'initiative soit la règle, puis a délégué les décisions en attente (« à toi de choisir
et prendre de décision »). Ce qui suit est décidé, pas proposé ; il garde un droit de veto sur chaque point.

- **Mandat** (`mandat.json`, `src/mandat.js`, `node bin/commun.js mandat`) : ce qui ne coûte rien, n'engage personne
  et se défait en un geste s'exécute sans attendre ; dépense au-delà du plafond, message à un tiers, engagement et
  irréversible attendent sa validation ; fictif et illégal sont interdits. L'argent engagé se lit au journal.
- **Dépense : 0 € aujourd'hui.** Rien d'achetable n'a de retour mesurable tant que la boutique est inaccessible ;
  l'audit a besoin d'un fichier, pas d'argent. Au point d'étape de la boutique (28 jours après reconnexion), si moins
  de 30 visites françaises : un seul essai payant plafonné à 30 €, montant choisi pour borner la perte, ou la fermeture.
- **Contacts : brouillons.** Aucun message ne part au nom du propriétaire. Première cible retenue pour l'audit : les
  cabinets d'expertise comptable (ils détiennent les fichiers ; l'outil tourne chez eux, aucun fichier ne sort).
- **Ordre de travail** : 1. audit des comptes de tiers — obtenir un premier fichier réel ; 2. boutique — dès la
  reconnexion du connecteur, sinon mise en pause proposée au 28 novembre pour arrêter l'abonnement ; 3. moteurs —
  C2 puis T2, puis la cause de l'erreur médiane de profit de LAVOISIER.
- **Première initiative exécutée** : outil d'audit des comptes de tiers (`src/audit-fec.js`,
  `node bin/commun.js audit-fec <fichier> [--detail]`). Testé sur anomalies plantées seulement : aucun fichier réel
  audité, 0 € réclamé, 0 € encaissé. Les fichiers réels se déposent dans `prive/`, ignoré par git.
- **L1** : un cas extrême de profit corrigé (graine 1 : 178 % → 42 %), médiane inchangée à 3,8 % pour un seuil de
  2 %. Une première version, mesurée, a été retirée parce qu'elle dégradait le regroupement. PR `haynbroit-alt/A#9`.
- **C2** : première épreuve terminée, seconde en cours (200 mondes placebo, exécution unique). T2 attend son verdict
  et une autorisation du GARDIEN.
- **GARDIEN** : plafond de tokens du mode économique dépassé (266 869 sur 200 000). Lever ce plafond n'est pas une
  décision déléguée : elle revient au propriétaire (`gardien mode normal` ou `intensif`, ou `gardien autoriser`).
  D'ici là, aucune nouvelle mission ni travail coûteux.

### Relevé des connecteurs et révision (14 novembre 2026, plus tard)

Le propriétaire a demandé d'utiliser tous les connecteurs. Relevé en lecture seule, consigné au journal
(`programme/initiatives-2026-11-14-b.json`) :

- **Aucune audience, nulle part** : 3 abonnés sur le seul réseau relié, aucun contact réel au carnet, aucune liste
  d'e-mails. **Aucun moyen d'encaissement relié.** Boutique, messagerie et envoi d'e-mails inaccessibles sans
  reconnexion par le propriétaire.
- **Seule portée gratuite mesurée** : cinq vidéos courtes publiées en août, 1 282 personnes touchées sans abonnés.
- **Hypothèse contredite** : l'outil d'audit n'est pas vendable tel quel. Des outils équivalents existent (l'un
  affiché à 200 €, plusieurs gratuits à l'essai) et la vérification des comptes est réservée aux experts-comptables.
  L'initiative « proposer l'audit à des tiers » est abandonnée ; l'outil reste un utilitaire et une entrée pour L3.
- **Ordre de travail révisé** : 1. boutique — essai de vidéos courtes dès la reconnexion (en attente de validation,
  car publication au nom du propriétaire) ; 2. relier un moyen d'encaissement, sans quoi aucun euro ne peut être
  reçu ; 3. moteurs — C2 puis T2, L1 ; l'audit ne revient que si L3 démontre un avantage sur un fichier réel.

### C2, T2 et arrêt de la boutique (14 novembre 2026, soir)

- **C2 terminé, trois critères atteints** : E1 60/60 mondes identiques au juge du moteur ; E2 6 fausses alarmes sur
  401 mesures placebo (1,5 %, borne 3,2 %, seuil 10 %) ; E3 4/4 séries dégénérées refusées. PR `haynbroit-alt/1#13`.
  La copie gelée de CORTEX passe au commit `93931fb` et compte `juge.js` : 34 fichiers moteurs.
- **T2 exécutée** : six lois de prix de GALILÉE examinées ; trois mises en pari par CORTEX, **trois verdicts
  « indécis »** ; deux débits sans levier de prix transmis et un dossier non rejouable, consignés comme aveux. Aucune
  loi n'est élevée, aucune n'est réfutée : la chaîne GALILÉE → CORTEX fonctionne, elle n'a encore rien établi.
- **Boutique arrêtée** sur décision du propriétaire (« pas de Shopify ») : l'opportunité n° 1 et l'essai de vidéos
  courtes sont abandonnés. Il n'y a plus d'opportunité retenue en premier ; l'étude sourcée qui devait en choisir une
  n'a pas abouti (limite d'usage atteinte avant tout résultat) et reste à refaire, à petite échelle.
- **Travaux à plusieurs agents** : les trois chantiers lancés en mode intensif ont échoué sans résultat sur la limite
  d'usage du compte ; ils ont néanmoins consommé des tokens. Plafond de l'espace commun presque atteint.

### Diagnostic et pistes sans boutique (14 novembre 2026, nuit)

- **Comptes corrigés** : `comptes` affichait les repères de départ. Un jalon qui nomme un repère (champ `repere`) en
  donne désormais la valeur courante. Le plafond de tokens de l'espace commun passe de 600 000 à 900 000 sur
  décision du propriétaire.
- **Pistes instruites** (`programme/opportunites-2026-11-14-2.json`, avec sources) : la boutique est écartée ; les
  primes sur logiciels libres sont écartées (marché décrit comme saturé de propositions automatiques) ; la vente
  d'un outil et les concours restent en attente.
- **Retenue en premier : missions d'analyse de données sur une plateforme d'indépendants**, parce que c'est la seule
  piste où la plateforme apporte elle-même les clients. Elle dépend de trois gestes du propriétaire :
  immatriculation, profil sous son identité, réponse aux clients. Aucun tarif ni délai n'a été trouvé dans les
  sources : son potentiel est inconnu. Essai : au moins une demande en 28 jours de profil en ligne.

### G1 clos sans modifier le moteur (14 novembre 2026, nuit)

Le banc publié de GALILÉE datait d'avant l'auto-évaluation du moteur. Relancé tel quel : à 5 % de bruit, 62 lois
précises sur 75 au lieu de 53, 4 formes fausses au lieu de 9, aucune dite « établie ». Confirmation sur graines
neuves (6 à 10), protocole poussé avant l'exécution : trois critères atteints (0 « établie » à tort, 83 % et 97 %
de lois précises). Restent ouverts, sans chantier : 6 formes fausses à 5 % de bruit sur deux lois, et un garde-fou
moins sûr en stratégie « hasard » (2 formes fausses dites « établie »). PR `haynbroit-alt/All#4`.

### G4 : critère principal manqué (14 novembre 2026, nuit)

Question : quand le client fournit ses données, GALILÉE sait-il dire qu'une forme est douteuse ? Protocole et règle
(R3) écrits avant le test, exécution unique sur les graines 11 à 20. À 5 % de bruit et 40 points, 13 formes fausses
signalées sur 28 — le seuil était la moitié, il est manqué à un essai près. Les trois autres critères sont atteints
(confiance gardée 96 % et 97 %, lois rendues inchangées). L'option reste donc absente par défaut. La règle fait
passer le signalement de 5 à 13 formes fausses, mais un tiers d'entre elles (capteur qui sature) ne se distinguent
pas avec les seules données fournies. Conséquence pour l'offre : en mode « données fournies », le verdict de
confiance ne se vend pas comme une garantie ; il faut le dire dans le dossier de mission. PR `haynbroit-alt/All#5`.

### Premier résultat sur mesures réelles (14 novembre 2026, nuit)

Hors chantiers de moteur, pour le dossier de mission : la copie gelée de GALILÉE sur les jeux de référence du NIST
(mesures de laboratoire, modèle certifié), protocole poussé avant l'exécution, réglage sur les seuls jeux générés,
test unique. 8 jeux sur 15 prédisent les mesures non vues au niveau du modèle certifié — le seuil était 8, atteint
sans marge, et l'un des 8 n'est qu'une constante. Un jeu (151 mesures) est prédit dix fois mieux que par le modèle
certifié. Constat après coup : 7 sur 7 au-dessus de 54 mesures, 1 sur 8 en dessous, et le verdict du moteur ne
prévient d'aucun échec. Ce que cela change : l'offre exige une cinquantaine de mesures au moins et promet une
prédiction vérifiée sur points mis de côté, pas « la vraie loi ». Détail : `programme/missions/reel/RESULTATS_REEL.md`.
Pistes ouvertes, sans chantier : confirmer le seuil de cinquante mesures sur d'autres données réelles ; comprendre
pourquoi le moteur rend `x` ou une constante sur les petits jeux sans se dire incertain.

Suite, même nuit : la leçon est passée dans un outil de livraison, `node bin/commun.js loi <fichier.csv>`. Il met une
mesure sur quatre de côté et ne retient la loi que si elle bat une droite et une constante sur ces points. Calculé
après coup sur les 15 jeux (donc sans valeur de preuve) : 5 échecs sur 7 écartés, la constante écartée, 7 bonnes lois
gardées. Une mission « trouver la loi » peut maintenant se livrer en une commande, avec son contrôle.

### Exploration libre (14 novembre 2026, nuit) — mandat « explore le connu et l'inconnu »

Trois travaux, chacun avec protocole ou prédictions poussés avant le calcul. Détail dans les fichiers cités.

1. **G3, objets mathématiques exacts comme mondes** (`haynbroit-alt/All`, `RESULTATS_G3.md`). GALILÉE interroge un
   objet arithmétique et sa loi est jugée 100 fois plus loin. Cinq lois démontrées sur six prédites (seuil 4) ; la
   forme `n·ln n` est retrouvée seule. Six terres inconnues : aucune prédite, et le moteur le dit lui-même.
2. **Une théorie de la suite `a → a + d(a)`** (`THEORIE_B1.md`). Deux lemmes démontrés ; un piège vérifié (99,85 %
   des termes de la forme `2 × impair`) ; une loi empirique confirmée à 0,033 % près sur vingt millions de termes
   neufs ; une confluence vérifiée sur 24 départs ; trois de mes prédictions réfutées et publiées. Non confronté à
   la littérature : résultat vérifié par le calcul, pas découverte.
3. **RÉEL-2, le garde-fou de livraison sur 15 tâches réelles neuves** (`programme/missions/reel2/`). Les 9 lois
   retenues tiennent toutes (seuil 80 %) ; mais 3 témoins négatifs sur 12 sont retenus à tort (seuil 1) : manqué.
   Règle corrigée après coup — une constante n'est jamais retenue — à confirmer.

Ce que cela change : le verdict de GALILÉE vaut quelque chose quand il choisit ses mesures, rien quand on lui donne
les données ; l'offre de mission doit donc proposer, quand c'est possible, de **choisir les prochaines mesures**.
Aucune stratégie financière n'est sortie de ce travail, et aucune n'est revendiquée.

**Bloqué** : le plafond de tokens du gardien pour GALILÉE est dépassé (308 000 sur 300 000). Plus aucun travail
dans ce dépôt sans relèvement par le propriétaire.
