# Résultats CONTRÔLE — le contrôle du journal prend la place devant LAVOISIER seul

Exécution du 15 novembre 2026, graines 8041 à 8080 (40 entreprises neuves, 320 lectures, aucune exception), copie
gelée `2e66aa7`. Protocole `PROTOCOLE_CONTROLE.md`, poussé avant le code. Détail : `controle.json`.

## 1. Flux cachés retrouvés, sur 55

| Journal | LAVOISIER seul | Contrôle puis LAVOISIER |
|---|---|---|
| intact | 42 | 42 |
| 5 % de doublons | 11 | **42** |
| 5 % de montants × 10 | 5 | 6 |
| tout à la fois (2 % de chaque dégât) | 8 | 11 |

## 2. Critères

| Critère | Résultat | Verdict |
|---|---|---|
| **K1** — il n'abîme pas un journal sain | 42 flux contre 42 ; 0,13 fausse détection contre 0,10 | **tenu** |
| **K2** — doublons | 42 flux retrouvés, autant que sur journal intact | **tenu** |
| **K3** — fautes de frappe | 6 flux sur 42 ; erreur de profit 0,38 contre 0,025 | **manqué** |
| **K4** — il le dit | alerte sur 107 journaux abîmés sur 120 (il en fallait 114) ; aucune fausse alerte sur 40 | **manqué** |

**Succession (règle de l'arène) : le prétendant prend la place.** Tâche « lire un journal » : le tenant est
désormais « contrôle du journal, puis LAVOISIER ». LAVOISIER seul devient prétendant.

## 3. Ce que cela dit

- **Un dégât sur six est réglé, entièrement** : un journal importé deux fois ne gêne plus.
- **Les fautes de frappe ne le sont pas** : la règle des montants dix fois trop grands ne rattrape presque rien
  (5 → 6 flux) et ne lève l'alerte que 27 fois sur 40. La plupart des montants n'ont ni quantité ni groupe assez
  resserré pour qu'on reconnaisse l'intrus.
- Dates fausses et lignes perdues restent sans réponse.
- L'épreuve confirme JOURNAL-ABÎMÉ sur 40 autres entreprises : 11, 5 et 8 flux retrouvés sur 55 sans contrôle.

## 4. Attendus, relus

K1 tenu, K2 tenu, K3 manqué : **justes**. K4 tenu : **faux** — il se tait sur un tiers des journaux à fautes de
frappe, pour la même raison qu'il ne les répare pas.

## 5. Limites

Mes doublons sont des copies exactes, le cas facile ; un vrai double enregistrement diffère souvent d'un détail.
Dégâts aléatoires, indépendants ; trois archétypes connus du moteur.

## 6. Ce que cela change

1. Le contrôle passe avant toute lecture de LAVOISIER dans un livrable. Reste à le brancher dans la chaîne
   d'audit (`src/audit-fec.js`) — non fait ici.
2. Prochains prétendants sur cette tâche : reconnaître les fautes de frappe par les relevés de stock et de
   trésorerie (que le contrôle ne lit pas encore) ; signaler les trous de dates.
3. Le coût unitaire sur journal abîmé reste à mesurer : c'est lui qui porte l'essai de prix.
