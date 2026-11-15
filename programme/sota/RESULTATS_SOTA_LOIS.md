# Résultats SOTA-LOIS — GALILÉE face à Operon et gplearn

Protocole : `PROTOCOLE_SOTA_LOIS.md`, poussé avant tout calcul, précisé avant toute mesure d'Operon (commit
`60cfbef`). Calcul du 15 novembre 2026, `scripts/sota-lois.py` ; chiffres dans `sota-lois.json`. Épreuve : les 15
jeux de mesures de laboratoire du NIST du protocole RÉEL, une mesure sur quatre mise de côté.

## 1. Résultat

**GALILÉE n'est pas au niveau de la meilleure méthode publique. Operon bien réglé prédit mieux sur 14 jeux sur
15.** GALILÉE reste devant la programmation génétique classique, sans que ce soit établi.

Rapport = erreur sur les mesures mises de côté ÷ écart-type du modèle certifié par le NIST (1 = aussi bien que le
modèle certifié ; « au niveau » si 2 au plus).

| Jeu | Mesures | GALILÉE | Operon par défaut | Operon réglé | gplearn |
|---|---:|---:|---:|---:|---:|
| Hahn1 | 236 | 1,09 | 2,08 | 1,07 | 17,14 |
| Chwirut1 | 214 | 0,89 | 0,89 | 0,87 | 1,15 |
| ENSO | 168 | 1,55 | 1,86 | 1,25 | 1,55 |
| Bennett5 | 154 | 0,94 | 0,88 | 0,90 | 75,00 |
| Kirby2 | 151 | 0,09 | 0,82 | 0,07 | 29,27 |
| Nelson | 128 | 0,69 | 0,62 | 0,45 | 1,76 |
| Chwirut2 | 54 | 1,16 | 1,33 | 0,85 | 1,44 |
| Thurber | 37 | 6,72 | 1,58 | 2,24 | 5,02 |
| Eckerle4 | 35 | 17,16 | 35,87 | 0,03 | 19,41 |
| Roszman1 | 25 | 5,41 | 1,04 | 4,93 | 1,67 |
| Rat43 | 15 | 3,55 | 2,45 | 4,17 | 2,70 |
| Misra1a | 14 | 1,76 | 0,74 | 1,74 | 11,48 |
| Rat42 | 9 | 5,05 | 1,84 | 1,95 | 1,53 |
| BoxBOD | 6 | 4,79 | 1,21 | 1,05 | 1,00 |
| DanWood | 6 | 19,72 | 0,38 | 0,31 | 1,87 |
| **Au niveau de la référence** | | **8** | **12** | **12** | **8** |
| **Rapport médian** | | 1,76 | 1,21 | 1,05 | 1,87 |

| Critère | Résultat |
|---|---|
| **S1** GALILÉE fait mieux qu'Operon par défaut | **manqué** : devant sur 5 jeux sur 15. S1 inverse non atteint non plus (Operon devant sur 10, il en fallait 12) : pas de différence établie |
| **S1 bis** face à Operon réglé | **l'inverse est établi** : Operon réglé est devant sur 14 jeux sur 15 |
| **S2** GALILÉE fait mieux que gplearn | **non établi** : devant sur 9 jeux sur 15 (il en fallait 12) |

## 2. Où est l'écart

- **Sur les 7 jeux d'au moins 54 mesures**, GALILÉE est au niveau de la référence partout (7 sur 7, comme Operon
  réglé) et son erreur est proche : rapport médian 0,94 contre 0,87. Il est derrière Operon réglé sur les 7, de peu.
- **Sur les 5 jeux de moins de 20 mesures**, GALILÉE n'est au niveau qu'une fois, Operon quatre fois, gplearn
  trois fois. GALILÉE y rend une droite ou une constante (« x », « 3/4 ») là où les autres ajustent une courbe.
  Réserve : avec 1 à 4 mesures mises de côté, ces rapports sont très bruités.
- **Eckerle4** (35 mesures, un pic) : seul Operon réglé le trouve (0,03) ; les trois autres échouent.

Ce qui fait la force d'Operon réglé est connu : l'optimisation locale des constantes de chaque formule candidate,
que ses réglages par défaut n'activent pas — d'où l'écart entre ses deux colonnes.

## 3. Ce que GALILÉE garde

Les formules d'Operon comptent une cinquantaine de nœuds (médiane 51 à 54 selon le jeu), celles de gplearn une
dizaine. Celles de GALILÉE sont courtes — par exemple « −4,099 / (x + 3,492) » pour Bennett5, à 0,94 du modèle
certifié. **Je n'ai pas mesuré cette lisibilité** : la longueur des lois de GALILÉE n'a pas été comptée dans la
même unité, et « court » n'est pas « juste ». C'est une piste d'avantage, pas un résultat.

## 4. Attendus écrits d'avance, confrontés

| Attendu | Constat |
|---|---|
| GALILÉE devant Operon par défaut sur 5 jeux au plus | tenu : 5 |
| GALILÉE devant gplearn sur 9 jeux au moins | tenu : 9 |
| Operon au niveau de la référence sur 9 jeux au moins | tenu : 12 |
| Sur les jeux de moins de 20 mesures, personne au niveau | **faux** : Operon 4 sur 5, gplearn 3 sur 5 |
| Operon réglé devant GALILÉE sur 10 jeux au moins | tenu : 14 |

## 5. Limites

Quinze jeux, une seule famille de données. Trois graines pour les concurrents, une pour GALILÉE. Operon réglé a
eu 60 secondes par ajustement, GALILÉE quelques secondes : le coût de calcul n'est pas comparé. PySR, l'autre
référence, n'a pas pu être installé. Deux exécutions de mon script ont échoué avant celle-ci (un nom de paramètre
faux, puis une durée dépassée sans sauvegarde) ; aucun chiffre d'Operon n'avait été vu avant que ses réglages
soient fixés.

## 6. Ce que cela change

1. **Aucune supériorité de GALILÉE sur l'état de l'art n'est à revendiquer en précision.** L'offre ne doit pas le
   laisser entendre.
2. **Ce qu'il faut apprendre de la référence** : optimiser localement les constantes de chaque formule candidate.
   C'est un changement de moteur, donc un protocole écrit dans le dépôt de GALILÉE avant tout code, avec ce banc
   comme mesure : passer de 8 à 12 jeux au niveau de la référence, sans allonger les formules.
3. **Ce qu'il faut mesurer avant de le vanter** : la lisibilité, dans la même unité que les concurrents.
4. **Pour la prestation « loi dans vos mesures »** : la règle de livraison (une loi n'est rendue que si elle tient
   sur des mesures non vues) ne dépend pas du moteur. Elle peut s'appliquer à Operon aussi bien qu'à GALILÉE ; pour
   un client, le meilleur moteur disponible est le bon.
