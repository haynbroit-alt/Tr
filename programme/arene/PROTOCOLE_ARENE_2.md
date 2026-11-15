# Protocole ARÈNE-2 — décider un prix : le tenant face au plan naïf et à l'arrêt anticipé

Écrit et poussé **avant** son code et avant toute exécution. Deuxième tour de l'arène (`REGLES.md`).

## 1. Tenant

La **chaîne prudente** (plan de CORTEX allégé par le coût de LAVOISIER, huit semaines, décision par la table), qui a
tenu le premier tour.

## 2. Prétendants

- **`plan naïf`** (inscrit après SYNERGIE) : même coût, même décision, mais un plan d'essai sans CORTEX — six
  semaines à +11,8 % puis deux à −10,6 % (les huit premières semaines du plan `AVANT_APRES`). Il met en jeu la
  place du plan de CORTEX : dans SYNERGIE, l'écart avec le tenant était de 0,9 point en lecture principale et de
  4,7 points en lecture bornée.
- **`arrêt anticipé`** (extérieur : principe des essais séquentiels) : le plan du tenant, lu au bout de **quatre
  semaines**. Si le meilleur niveau essayé dépasse le deuxième d'au moins **20 %** en marge par jour, on décide tout
  de suite et on applique ce prix pendant les 22 semaines restantes ; sinon l'essai va à son terme comme le tenant.
  Le seuil de 20 % est fixé ici, sans réglage. T3h a montré que les perdantes sont celles qui paient un essai pour
  rien : l'arrêt anticipé vise à raccourcir ce paiement.

Restent en lice sans jouer ce tour : le bandit de Thompson (coûteux à simuler), la chaîne qui refuse un coût « par
sommes » (une entreprise sur 60 concernée : un tour de 200 entreprises ne peut rien en dire), une règle de l'atelier.

## 3. Terrain

Monde de T3e à ARÈNE-1. **Graines 8201 à 8400** (200 entreprises neuves). Exécution unique. Référence donnée à
côté : prix tenu.

## 4. Mesure et succession

Comme ARÈNE-1 : marge vraie de l'objet, jours 183 à 364, gain en % de la marge du témoin nul ; écarts appariés avec
le tenant ; deux prétendants, **seuil t = 1,97**. Prend la place : avantage établi **et** pas plus de perdantes face
à prix tenu. Relégué : désavantage établi. En lice : sinon. Lecture bornée et décompte donnés à côté ; si la lecture
bornée contredit la principale, c'est dit et personne ne change de place.

## 5. Attendus, écrits avant toute exécution

1. **Le tenant garde sa place.**
2. `plan naïf` : derrière le tenant de 1 à 5 points ; **relégué en lecture bornée seulement**, donc en lice selon la
   règle. Le plan de CORTEX garde sa place sans l'avoir prouvée.
3. `arrêt anticipé` : s'arrête à quatre semaines dans un tiers à la moitié des entreprises ; écart avec le tenant
   entre −1 et +3 points ; en lice.

## 6. Domaine de validité

Simulation, un monde, un objet par entreprise. Les deux prétendants ont besoin du coût unitaire, comme le tenant.

---

## 7. Vérification du code (graines 241 à 246) — écrit et poussé avant le tour

`src/problemes/arene-2.js` tourne sur six entreprises déjà vues. L'arrêt anticipé ne s'y déclenche qu'une fois sur
six, moins que ce que j'attendais ; je ne touche pas au seuil de 20 %. Six entreprises ne permettent aucune
lecture ; rien n'a été changé aux prétendants ni à la règle de succession.

Tour : `ARENE2_TEST=exécution-unique node bin/commun.js executer arene-2`, une seule fois.
