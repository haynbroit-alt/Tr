# Confirmation de la règle corrigée — écrite avant l'exécution

`RESULTATS_REEL2.md` : 3 témoins négatifs sur 12 retenus à tort, tous des constantes. Règle ajoutée après coup dans
`src/loi-client.js` : ce qui ne dépend d'aucune variable n'est jamais retenu. Un correctif écrit en voyant les
erreurs ne prouve rien ; il est jugé ici sur des témoins qu'il n'a pas vus.

- **Témoins neufs** : les dix tâches non datées de RÉEL-2 (`donnees/`), chacune avec sa réponse mélangée par trois
  permutations nouvelles (graines 101, 202 et 303 ; RÉEL-2 utilisait 12345). Trente témoins, sans rien à trouver.
- **Chaîne jugée** : celle qui est livrée, sans autre changement — `analyser` de `src/loi-client.js` (une mesure sur
  quatre mise de côté, copie gelée de GALILÉE, graine 1).
- **Critère** : au plus 2 témoins retenus sur 30. Exécution unique, `scripts/reel2-temoins.js`.
- **Limite** : mêmes dix jeux de variables que RÉEL-2 ; seules les réponses mélangées sont neuves.

## Résultat

Exécution unique du 14 novembre 2026 (`node scripts/reel2-temoins.js`, sortie `temoins.json`).

**0 témoin retenu sur 30 : critère atteint.** Le moteur rend une constante dans 29 cas sur 30 ; sans la règle,
9 de ces 30 témoins auraient été retenus par le seul hasard. Le trentième (`cos(essence)`) dépend d'une variable
et est écarté parce qu'il ne bat pas les témoins simples.

La règle est donc confirmée sur des réponses mélangées neuves. Ce qui reste non mesuré : des témoins négatifs où
le moteur rendrait une loi non constante par hasard, et des jeux de variables autres que ces dix-là.
