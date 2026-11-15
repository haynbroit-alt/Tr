# Protocole COÛT-ABÎMÉ — le coût unitaire résiste-t-il à un journal abîmé ?

Écrit et poussé **avant** son code et avant toute exécution. Suite de `programme/synergie/RESULTATS_SYNERGIE.md`
(la valeur de l'essai de prix vient du coût) et de `RESULTATS_JOURNAL_ABIME.md` (LAVOISIER perd les flux cachés dès
5 % de lignes abîmées). Moteur gelé, non modifié.

## 1. Question

Le coût unitaire que l'espace commun tire du bilan de LAVOISIER (`coutUnitaire`, médiane de rapports entre lignes
reliées) est exact dans presque toutes les entreprises simulées à journal sain. **Sur un journal abîmé, reste-t-il
juste — et, s'il est faux, le voit-on ?**

## 2. Dispositif

- 60 entreprises neuves du monde des essais de prix (négoce, demande sensible, hasard commun), **graines 8101 à
  8160**. Journal coupé au jour 183, comme pour un essai. L'objet est choisi sur le journal sain (un client sait
  de quel produit il parle).
- Dégâts de JOURNAL-ABÎMÉ : six dégâts à **5 %**, et « tout à la fois » à 2 % chacun ; plus le journal sain.
  Chaque lecture est faite **sans** puis **avec** le contrôle du journal (`src/controle-journal.js`). 16 lectures
  par entreprise.
- Mesure : le coût rendu comparé au coût vrai (ouvert après les 16 lectures de l'entreprise). **Juste** : à moins
  de 5 % du vrai. **Faux en silence** : un coût est rendu, à plus de 20 % du vrai. **Indisponible** : aucun coût
  rendu (c'est un refus, pas une erreur).

## 3. Critères

- **M1 — robustesse**, jugée dégât par dégât, sans contrôle : coût juste dans au moins 90 % des entreprises.
- **M2 — pas d'erreur silencieuse** : sur l'ensemble des lectures abîmées sans contrôle, au plus 5 % de coûts faux
  en silence.
- **M3 — le contrôle ne nuit pas** : sur journal sain, au plus une entreprise de moins avec un coût juste ; et avec
  5 % de doublons, coût juste dans au moins 90 % des entreprises.

Un critère manqué est publié comme tel.

## 4. Attendus, écrits avant toute exécution

Le coût est une médiane : il devrait bien mieux résister que la recherche de flux cachés.
1. M1 tenu pour doublons, dates, lignes perdues, références effacées et fautes de frappe ; **manqué pour les
   quantités effacées**, qui cassent les paires dont il est tiré. Cinq dégâts sur six.
2. M2 tenu. 3. M3 tenu.

## 5. Limites écrites d'avance

Un seul archétype (négoce), un seul objet par entreprise, dégâts aléatoires indépendants. « Juste à 5 % » est un
seuil choisi : un coût faux de 5 % déplace d'autant le taux de marge sur lequel le plan d'essai écarte des prix.
