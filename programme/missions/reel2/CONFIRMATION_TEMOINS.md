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

(complété après l'exécution)
