# Consignes de travail (GARDIEN, mode ÉCONOMIQUE par défaut)

Ce dépôt est l'espace commun de GALILÉE, CORTEX et LAVOISIER. Le journal `registre/journal.jsonl` est la mémoire :
on l'interroge, on ne le relit pas en entier.

## Avant tout travail
- `node bin/commun.js gardien` : mode, budget restant, tokens consommés. Budget atteint : s'arrêter et demander.
- `node bin/commun.js comptes` et `node bin/commun.js etat` : où en sont les moteurs. Ne pas recalculer ce qui s'y lit.
- `programme/PROGRAMME.md` : priorités et décisions en attente.

## Économie
- Lire un fichier avant de le modifier, et seulement celui-là. Ne jamais parcourir tout le dépôt.
- Ne pas ouvrir `moteurs/` (33 fichiers gelés, jamais modifiés ici), `page/index.html` (généré) ni le journal brut.
- Modifier par retouches ciblées ; ne pas réécrire un fichier entier. `src/page.js` est long : y chercher, pas le relire.
- Une mission se lance par `node bin/commun.js executer …` : le GARDIEN évite celles déjà faites et plafonne les autres.
- Ne lancer un moteur que si la tâche l'exige. Pas deux missions pour la même question.
- Aucune relance en boucle : après un refus du GARDIEN, demander une autorisation (`gardien autoriser`).
- Mode NORMAL ou INTENSIF seulement sur demande explicite : `node bin/commun.js gardien mode normal`.

## Portée globale (GALILÉE, CORTEX, LAVOISIER)
- Le gardien couvre les quatre dépôts : les tokens sont rattachés au dépôt où ils ont été produits.
- Avant un travail coûteux dans `../All`, `../1` ou `../A` (banc, campagne, boucle) :
  `node ../Tr/bin/commun.js gardien verifier-budget <Tr|1|A|All>` — code 3 = plafond atteint, s'arrêter et demander.
- `node bin/commun.js gardien repetitions` : commandes et lectures répétées, missions relancées après refus.
  Un signal = on s'arrête et on cherche la cause, on ne relance pas.

## Protections à ne pas casser
- `npm test` et `node bin/commun.js verifier` avant tout commit.
- Le journal est en ajout seul. Aucun chiffre sans mesure ; « non mesurable » plutôt qu'une estimation inventée.
