# Page de travail commune — GALILÉE, CORTEX, LAVOISIER

Trois moteurs, un seul journal. GALILÉE découvre des lois, CORTEX des mécanismes, LAVOISIER reconstruit les comptes.
Ils travaillent ici sur les mêmes problèmes sans s'appeler entre eux et sans être modifiés : chacun lit et écrit dans
un **registre commun**, où tout acte porte son auteur, sa preuve, son coût et son niveau de certitude.

```bash
npm test                                                  # 10 tests
node bin/commun.js verifier                               # chaîne du registre + empreintes des moteurs
node bin/commun.js etat                                   # niveau courant de chaque affirmation
node bin/commun.js executer forme-manquante --graine 7    # nouveau problème (graines de développement, 1 à 100)
node bin/commun.js executer entreprise-opaque --graine 9
node bin/commun.js page                                   # régénère page/index.html
```

Node ≥ 20, aucune dépendance. La page (`page/index.html`) est entièrement déduite de `registre/journal.jsonl`.

## 1. Ce que les trois projets savent réellement faire

| | GALILÉE (`haynbroit-alt/All` @ `be42b7e`) | CORTEX (`haynbroit-alt/1` @ `758212a`) | LAVOISIER (`haynbroit-alt/A` @ `73618f9`) |
|---|---|---|---|
| Spécialité | lois symboliques | mécanismes cachés, stratégie | économie par conservation |
| Moteur | programmation génétique, agent qui choisit ses expériences, contre-expertise | modèle bayésien exact, modes à τ continu, pari invariant (e-valeur), sonde « hors de portée », plan d'essai D-optimal | bilan de matière : typage, appariement, stocks, écarts |
| État | terminé, banc publié | v5 évaluée ; v6 : P1 et P2 évalués, P3 gelé, test non exécuté | conception complète ; seul l'organe 1 existe, en développement, non gelé |
| Utilisable depuis l'extérieur | `Agent` en mode données fournies | `discover({Y, U})` (deux leviers exactement), `runWorld` et `activePlan` | `bilan(observed)`, générateur et évaluateur du banc M0 |
| **Non** utilisable | mode expérimental : il lui faut un monde interrogeable | sonde et pari sur une formule : liés à ses mondes P2, non exportés ; pilotage v3–v5 : non branché | organes 2 à 8 (atlas, jumeau, opportunités, gouverneur, registre des paris) : non écrits ; son générateur ne se pilote pas |

Les trois projets partagent la même discipline (protocole avant le code, graines réservées, échecs publiés) et la
conception de LAVOISIER décrit déjà le couplage visé (§ 6 et § 7). Cette page en construit la partie qui existe.

## 2. Architecture

```
moteurs/            copies GELÉES des trois moteurs (git show au commit), empreintes dans PROVENANCE.json
src/adaptateurs/    un fichier par moteur : importe la copie gelée, n'ajoute aucune capacité
src/registre.js     journal en ajout seul, chaîné par empreinte ; règles d'admission ; état déduit
src/certitude.js    échelle commune
src/problemes/      les problèmes communs : qui fait quoi, dans quel ordre
src/page.js         la page, générée à partir du journal
registre/journal.jsonl   les actes
```

Trois choix, chacun pour la solidité plutôt que pour l'ambition.

**Un tableau noir, pas un orchestrateur.** Les moteurs gardent leur architecture ; le seul point commun est le
journal. Huit types d'actes : `probleme`, `affirmation`, `contestation`, `verification`, `experience`, `resultat`,
`economie`, `aveu`. Chaque ligne contient l'empreinte de la précédente : une ligne modifiée, retirée ou déplacée
est détectée par `verifier`.

**Des règles d'admission, pas de la confiance.** Le registre refuse :
- une affirmation sans méthode, sans commande pour la reproduire, sans coût ou sans commit du moteur ;
- une vérification signée par l'auteur de l'affirmation ;
- un niveau de certitude hors de l'échelle ;
- une graine de test d'un des trois projets (elles sont réservées à leurs exécutions uniques).

**Une seule échelle de certitude**, celle du § 7 de la conception de LAVOISIER :

| Niveau | Sens | Fonde une décision ? |
|---|---|---|
| identité | conservation vérifiée | oui |
| établie | pari gagné et contre-expertise passée | oui |
| empirique | pari gagné sur des jours neufs, dans le domaine observé | oui, dans le domaine |
| hypothèse | crédible sur des données déjà vues | non : sert à choisir une expérience |
| hors de portée | structure détectée, non exprimable | non |
| réfutée | contredite par une vérification | non |

Le niveau courant n'est jamais stocké : il est recalculé. Une loi tirée de données subies entre comme
« hypothèse », même si GALILÉE la juge « empirique » (son verdict est conservé à côté). **Seul un pari gagné élève
un niveau.** Une prévision réussie est consignée sans rien élever. La vérité d'un simulateur, lue après tous les
jugements, est affichée à part : elle n'existe pas dans une vraie entreprise.

## 3. Ce qui a été exécuté

Quatre problèmes, 44 actes, tous produits par les moteurs gelés.

**Forme manquante, monde 5** (monde de développement de CORTEX). CORTEX signale sur la mesure 2 une structure que
son modèle n'exprime pas (log E = 18,3 ; seuil 3,4). GALILÉE propose `0.3931 − cos(u0) / 2` et la juge
« empirique ». CORTEX la conteste : sur 93 jours neufs, elle ne gagne pas son pari (log E = −0,05 ; seuil 2,3).
CORTEX conçoit alors un plan d'essai de 91 jours dans le budget de leviers. Sous ce plan, la même formule gagne
(log E = 36,5) et passe à « empirique ». Une formule fausse injectée exprès, jugée sous un plan fait pour la
confirmer, est refusée (log E = −1,6). Vérité du banc : la forme vraie est 0,3·u0², expliquée à 99,9 % par la
formule. Gain économique : non mesurable, ce monde n'a pas d'euros.

**Forme manquante, monde 3.** La sonde ne signale rien alors qu'une forme existe : CORTEX le dit, le travail
s'arrête.

**Entreprise opaque, graine 6** (négoce, 13 192 lignes). LAVOISIER reconstruit 17 types de flux et 32 stocks, et
trouve deux fuites : 67,82 € par jour sur les créances depuis le jour 168 (13 360 € déjà perdus, 24 754 € par an)
et 0,65 unité par jour sur un article (363 € perdus). Le banc confirme les deux, et le total vrai de la première
est 13 360,23 €. Sur ses débits, GALILÉE propose deux lois en 1/p et n'en trouve aucune pour le troisième
article ; sur 13 semaines neuves, aucune des deux ne bat nettement la moyenne. CORTEX ne trouve aucun mode lent.
Les expériences de prix qui trancheraient sont consignées comme impossibles.

**Entreprise opaque, graine 3.** LAVOISIER ne voit aucune fuite ; le banc en cachait une (démarque de 0,08 unité
par jour). L'échec est au journal.

## 4. Limites

1. Tout est simulé, sur des graines de développement. Rien ici n'est un résultat de test.
2. Aucune loi économique n'a gagné de pari : on ne peut fixer aucun prix dans le simulateur de LAVOISIER.
3. Aucun gain n'a été réalisé. Les euros affichés sont des fuites chiffrées par conservation, pas des profits.
4. La détection des fuites n'est pas garantie : 0,20 fausse détection par entreprise en développement.
5. La transmission des débits (quantité et prix unitaire par type de flux et par objet) est une règle du registre,
   pas une capacité de LAVOISIER ; elle ne dit pas si un prix est un levier.
6. Le test de prévision du registre (13 semaines) n'est pas corrigé pour les comparaisons multiples.

## 5. Ce qui débloquerait la suite, côté moteurs

- **CORTEX** : exporter la sonde et le pari sur une formule pour des données quelconques (`invariantLogE`,
  `probeFamilies` dans `p2.js`). Il pourrait alors juger les lois de GALILÉE sur les débits de LAVOISIER.
- **LAVOISIER** : un simulateur d'entreprise pilotable, puis le registre des paris (§ 10 de sa conception). GALILÉE
  pourrait alors choisir ses expériences de prix, et une loi économique pourrait devenir « empirique ».
- **LAVOISIER** : geler le bilan et exécuter M0, pour remplacer les risques de développement par des risques mesurés.

Licence MIT, comme les trois moteurs.
