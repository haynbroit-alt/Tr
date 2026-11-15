# Résultats COÛT-ABÎMÉ — le coût unitaire tient sur un journal abîmé

Exécution unique du 15 novembre 2026, graines 8101 à 8160 (60 entreprises, aucune écartée, 960 lectures, aucune
exception), copie gelée `2e66aa7`. Protocole `PROTOCOLE_COUT_ABIME.md`, poussé avant le code. Détail : `cout.json`.

## 1. Coût juste (à moins de 5 % du vrai), sur 60 entreprises

| Journal | Sans contrôle | Avec contrôle |
|---|---|---|
| sain | 59 | 59 |
| 5 % de lignes perdues | 60 | 60 |
| 5 % de doublons | 59 | 59 |
| 5 % de dates décalées | 57 (2 indisponibles) | 57 |
| 5 % de quantités effacées | 59 | 59 |
| 5 % de références effacées | 59 | 59 |
| 5 % de montants × 10 | 59 | 59 |
| tout à la fois (2 % chacun) | 57 (2 indisponibles) | 59 |

Quand il est juste, il est exact (à moins d'un millième) dans tous les cas sauf un.

## 2. Critères

| Critère | Résultat | Verdict |
|---|---|---|
| **M1** — robustesse, dégât par dégât | 57 à 60 entreprises sur 60 pour chacun des six | **tenu, six sur six** |
| **M2** — pas d'erreur silencieuse | 6 coûts faux en silence sur 420 lectures abîmées (1,4 %) | **tenu** |
| **M3** — le contrôle ne nuit pas | 59 contre 59 sur journal sain ; 59 avec doublons | **tenu** |

## 3. Ce que cela dit

- **Le coût unitaire résiste là où la recherche de flux cachés s'effondre.** Il est tiré d'une médiane de
  rapports entre lignes reliées : 5 % de lignes abîmées ne déplacent pas une médiane. Le socle de l'essai de prix
  tient donc sur un journal imparfait.
- **Une entreprise sur 60 a un coût faux, en silence, même sur journal sain** (graine 8133 : 7,03 au lieu de
  10,55, soit −33 %). C'est la seule où le coût vient de la méthode de repli « par sommes », faute de paires
  reliées ; et ce repli varie du simple au décuple selon le dégât (3,51 à 38,64). **Les six erreurs silencieuses
  viennent toutes de cette entreprise et de cette méthode.**
- Quand les dates sont abîmées, le coût devient parfois indisponible (2 entreprises) : il refuse, il ne se trompe pas.
- Le contrôle du journal ne change presque rien ici ; il rattrape deux coûts indisponibles dans « tout à la fois ».

## 4. Attendus, relus

M1 tenu pour cinq dégâts, **manqué pour les quantités effacées** : **faux**, il tient aussi (59 sur 60). M2 tenu,
M3 tenu : justes.

## 5. Limites

Un seul archétype (négoce), un objet par entreprise, dégâts aléatoires indépendants, 5 % seulement.

## 6. Ce que cela change

1. **Le maillon faible n'est pas celui que je croyais.** Après SYNERGIE et JOURNAL-ABÎMÉ j'ai écrit que LAVOISIER
   était « le maillon à renforcer en premier » pour l'essai de prix. Pour le coût, c'est faux : il tient. La
   fragilité concerne l'audit (flux cachés), pas l'essai de prix.
2. **Un coût obtenu « par sommes » ne doit pas servir.** Prétendant inscrit à l'arène : la chaîne prudente qui
   refuse d'essayer (prix tenu, et le dit) quand le coût ne vient pas de paires reliées.
3. Dans un livrable, la méthode d'obtention du coût doit figurer à côté du coût.
