# Protocole T3g — un essai qui n'essaie pas les prix ruineux

Écrit et poussé **avant** son code et avant toute exécution. Suite de `programme/t3f/RESULTATS_T3F.md`.

## 1. D'où vient la question

T3f a montré un défaut de notre essai : quand la marge est faible (prix de référence ÷ coût < 1,4), la chaîne
conclut presque toujours « monter le prix », mais elle a d'abord passé trois semaines sur huit à −20 %, où l'on vend
presque à prix coûtant. Sur 19 entreprises, monter d'emblée faisait 19,7 points de mieux que la chaîne.

Ce défaut ne dépend pas du simulateur. Baisser un prix de p à p′ ne rapporte que si les ventes sont multipliées par
plus de (p − c) ÷ (p′ − c), c étant le coût unitaire. Cela exige une sensibilité de la demande d'au moins

    e_requise = ln((p − c) ÷ (p′ − c)) ÷ ln(p ÷ p′)

À marge 1,4 et pour −20 %, il faut e ≥ 5,4. Or la moyenne publiée de 1 851 élasticités-prix mesurées dans 81
études est de −2,62 (Bijmolt, van Heerde et Pieters, *Journal of Marketing Research*, 2005).

## 2. Question

Un plan d'essai « prudent », qui écarte d'avance les niveaux de prix dont le seuil de rentabilité est hors
d'atteinte, fait-il mieux que le plan actuel sur les entreprises où il change quelque chose ?

Marge simulée ; aucun euro réel.

## 3. Dispositif

- Monde : demande sensible, hasard commun (classe de T3e et T3f).
- **Règle d'exclusion, fixée ici** : un niveau de baisse est écarté si son prix ne dépasse pas le coût, ou si
  e_requise > **4**. Le coût est celui que LAVOISIER estime sur le journal coupé au jour 183. Le seuil 4 vient de la
  littérature citée, pas du simulateur ; il n'est pas réglé. Aucun niveau de hausse n'est écarté.
- **Plan prudent** : le plan de la chaîne (−1, 0, +1, −1, +1, +1, −1, 0 ; huit semaines), où chaque niveau écarté est
  remplacé par le niveau de baisse admis le plus bas (−0,5 s'il est admis, sinon 0). Décision par la table, coût de
  LAVOISIER, sans loi : comme la chaîne.
- En pratique : le niveau −1 (−20 %) est écarté pour une marge sous 1,51 environ ; le niveau −0,5 (−10,6 %) aussi
  sous 1,42 environ.
- **Entreprises concernées** : celles dont le plan prudent diffère du plan de la chaîne. Les autres ne sont pas
  simulées au-delà du calcul de leur marge : les deux bras y sont identiques par construction.
- Bras mesurés sur les concernées : témoin nul, prix tenu, +25 % d'emblée, chaîne, chaîne prudente.
- Coût indisponible : entreprise non concernée (plan inchangé).
- Mesure : marge vraie de l'objet piloté, jours 183 à 364, gain en % de la marge du témoin nul.

## 4. Graines

- Mise au point : aucune. Vérification que le code tourne sur les graines 241 à 260 (déjà vues).
- Test : **6401 à 6700**, soit 300 entreprises parcourues, exécution unique.

## 5. Critères, sur les entreprises concernées du test

Écarts appariés sur le gain total, test unilatéral à 5 % (même table que T3 à T3f).

- **G1 — la chaîne prudente fait mieux que la chaîne.**
- **G2 — la chaîne prudente fait mieux que prix tenu.**
- **G3 — garde-fou** : la chaîne prudente ne fait pas perdre plus d'entreprises face à prix tenu que la chaîne.

Donné sans critère : la part d'entreprises concernées ; l'effet rapporté à l'ensemble des 300 ; l'écart restant
avec « +25 % d'emblée ».

Un critère manqué est publié comme tel.

## 6. Attendus, écrits avant toute exécution

1. 20 à 32 % des entreprises sont concernées.
2. G1 tenu, entre 5 et 14 points sur les concernées.
3. G2 tenu.
4. G3 tenu.
5. La chaîne prudente reste derrière « +25 % d'emblée » sur les concernées : un essai, même prudent, coûte.

## 7. Limites écrites d'avance

- Le seuil 4 est un choix appuyé sur une moyenne publiée, pas une mesure chez le client. Un produit très sensible
  au prix (e > 4) existe ; le plan prudent s'interdit alors de le découvrir par une forte baisse.
- Le simulateur tire la sensibilité entre 0,8 et 5 : peu d'entreprises y dépassent 4. Il est donc plutôt indulgent
  avec cette règle ; le monde réel peut l'être moins.
- Un monde, un objet par entreprise, 26 semaines. La population testée est choisie par la règle elle-même (marge
  faible) : le résultat ne dit rien des autres entreprises, où rien ne change.
