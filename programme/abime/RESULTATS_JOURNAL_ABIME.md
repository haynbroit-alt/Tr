# Résultats JOURNAL-ABÎMÉ — LAVOISIER devant des écritures imparfaites

Exécution du 15 novembre 2026, graines 8001 à 8040 (40 entreprises, 560 lectures), copie gelée `2e66aa7`. Protocole
`PROTOCOLE_JOURNAL_ABIME.md` (incident de mémoire et écart : § 9). Détail : `resultats.json`.

## 1. Critères, à 5 % de lignes abîmées

| Critère | Résultat | Verdict |
|---|---|---|
| **B1** — il ne casse pas | 0 exception sur 560 lectures | **tenu** |
| **B2** — doublons : profit et fausses détections | erreur de profit 0,086 contre 0,057 ; 0,53 fausse détection contre 0,10 | **tenu à la lettre** (voir § 2) |
| **B3** — dates : flux cachés encore retrouvés | 18 contre 43 (il en fallait 35) | **manqué** |
| **B4** — références effacées : liens | 0,73 contre 0,98 | **manqué** |
| **B5** — fautes de frappe : profit | 0,54 contre 0,057 | **manqué** |

## 2. Le tableau entier

Flux cachés retrouvés sur 56 (journal intact : 43, soit 77 %) ; erreur de profit médiane (intact : 0,057).

| Dégât | Flux retrouvés à 5 % | à 20 % | Erreur de profit à 5 % | à 20 % |
|---|---|---|---|---|
| lignes perdues | 16 | 7 | 0,11 | 0,25 |
| doublons | 15 | 6 | 0,09 | 0,22 |
| dates décalées | 18 | 10 | 0,10 | 0,26 |
| quantités effacées | **42** | **38** | 0,07 | 0,07 |
| références effacées | **40** | 31 | 0,11 | 0,20 |
| montants × 10 | 8 | 1 | 0,54 | 0,70 |
| tout à la fois (2 % chacun) | 7 | — | 0,40 | — |

- **La capacité qui fait la valeur de LAVOISIER — retrouver un flux caché — s'effondre dès 5 % de lignes
  perdues, doublées ou mal datées** : de 77 % à moins de 33 %. B2 est tenu parce que je n'y avais pas mis cette
  mesure ; c'est un défaut de mon critère, pas une qualité du moteur.
- **Il tient bien quand il manque des quantités ou des références** : 42 et 40 flux retrouvés sur 43.
- **Il ne dit rien.** Aucune exception, aucun signalement : devant un journal abîmé il rend un bilan d'apparence
  normale, moins bon. Les fausses détections restent rares (0,7 par entreprise au plus) : il se tait plutôt qu'il
  n'invente.

## 3. Attendus, relus

B1 tenu : juste. B2 tenu : juste, mais sur un critère trop étroit. B3 « tenu pour les flux retrouvés » : **faux**,
c'est là qu'il tombe. B4 tenu : **faux**. B5 manqué : juste. « Les lignes perdues lues comme des fuites » : **faux**,
les fausses détections ne se multiplient pas.

## 4. Limites

Dégâts tirés au hasard et indépendants ; 40 entreprises ; trois archétypes connus du moteur. Une entreprise sur
quarante vue avant l'exécution complète (§ 9 du protocole). Les archétypes jamais vus restent scellés pour M0.

## 5. Ce que cela change à la stratégie

1. **On ne livre pas un audit de LAVOISIER sur un export brut.** L'offre doit le dire : la recherche de flux
   cachés suppose un journal sans doublons, sans trous et bien daté.
2. **Il manque un organe : un contrôle de qualité du journal avant lecture** (doublons, montants aberrants,
   ruptures de dates, trous de numérotation), qui refuse ou nettoie, et qui le dise. Il peut s'écrire dans l'espace
   commun, sans toucher au moteur, et se mesurer sur cette même épreuve avec des graines neuves.
3. Le coût unitaire, qui sert aux essais de prix, s'appuie sur quantités et références : à vérifier sur journal
   abîmé avant toute livraison (non mesuré ici).
