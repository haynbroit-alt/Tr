# Protocole T3 — essai de prix commun sur une entreprise simulée

Écrit et poussé **avant** le code de l'essai et avant toute exécution. Dépend de L2 (entreprise pilotable,
`haynbroit-alt/A`, `PROTOCOLE_L2.md`).

## 1. Question

Les trois moteurs, ensemble, produisent-ils un résultat économique qu'une règle aveugle ne produit pas ?

Le résultat économique est ici une **marge en euros simulés**, mesurée dans la vérité scellée du simulateur, contre
la même entreprise laissée sans intervention. Ce n'est pas un revenu : aucun euro réel n'est en jeu, et le compte
des gains réels reste à 0 €.

## 2. Dispositif

**Entreprises.** Générateur de LAVOISIER, classe fixe : négoce, un flux caché, désordre réaliste.

**Calendrier** (jours de l'année simulée) :

| Jours | Phase |
|---|---|
| 0 à 182 | l'entreprise vit seule ; rien n'est piloté |
| 183 à 273 | essai : 13 blocs de 7 jours, un niveau de prix par bloc |
| 274 à 364 | exploitation : un seul prix, tenu jusqu'à la fin |

**Ce que voit celui qui pilote.** Le journal observé, coupé au jour de la décision (lignes saisies avant ce jour,
relevés avant ce jour, références vers des lignes futures effacées). Jamais la vérité.

**Objet piloté.** Un seul par entreprise : au jour 183, parmi les objets dont les ventes (lignes portant à la fois
un montant et une quantité) sont actives au moins un jour sur deux, celui qui a le plus de lignes. Aucun objet
éligible : l'entreprise est écartée, et comptée.

**Prix de référence** `p_ref` : médiane du prix unitaire (montant ÷ quantité) des ventes de l'objet saisies dans
les 14 derniers jours avant le jour 183.

**Niveaux.** u ∈ {−1 ; −0,5 ; 0 ; +0,5 ; +1}, prix = `p_ref` × 1,25^u, soit −20 %, −10,6 %, 0, +11,8 %, +25 %.

## 3. Rôles

Aucun moteur n'est modifié. Chacun apporte ce qu'il sait faire ; ce qu'il ne sait pas faire est écrit ci-dessous.

- **LAVOISIER** — bilan de matière sur le journal coupé. Il donne le type de chaque ligne et son incidence sur
  les stocks. Le registre en tire le **coût unitaire** de l'objet, sans mot de métier : lignes de l'objet portant
  un montant sans quantité et ayant une incidence sur un stock (le coût), lignes de l'objet portant une quantité
  sans montant et faisant monter un stock (les entrées) ; coût = médiane, sur les paires reliées par le bilan,
  de montant ÷ quantité ; à défaut de trois paires, somme des montants ÷ somme des quantités.
- **CORTEX** — le plan d'essai : `activePlan` (prototype P3 gelé) appliqué à la forme à éprouver, sous son propre
  budget (moyenne de |u| ≤ 0,5). Faute de loi avant l'essai, la forme éprouvée est l'hypothèse de travail
  « quantité ∝ 1 ÷ prix ». CORTEX rend aussi son **verdict** : pari de son juge exporté sur la loi de GALILÉE.
- **GALILÉE** — la loi quantité–prix, cherchée sur les 91 jours de l'essai (un point par jour : prix relatif du
  jour, quantité vendue ce jour-là à ce prix), par la chaîne de livraison du dépôt (`src/loi-client.js`) : une
  mesure sur quatre mise de côté, loi retenue seulement si elle y prédit mieux qu'une droite et qu'une constante.

**Ce que je sais d'avance sur le juge de CORTEX.** Son modèle de base contient déjà un terme linéaire en chaque
levier ; son pari éprouve ce qu'une formule ajoute **au-delà** de ce terme. Sur ±25 % de prix, toute loi lisse est
presque linéaire. J'attends donc des verdicts « indécis » presque partout. Le verdict est consigné et comparé au
gain, mais il **ne conditionne pas** la décision : en faire un verrou reviendrait à décider d'avance que le
collectif n'agit pas.

## 4. Décision au jour 274

Niveaux candidats : ceux compris entre le plus bas et le plus haut niveau essayés (jamais d'extrapolation).

- **Par la loi** (si elle est retenue) : niveau qui maximise (prix − coût) × quantité prévue par la loi.
- **Par la table** (sinon) : parmi les niveaux essayés, celui qui maximise (prix − coût) × ventes par jour
  constatées à ce niveau. Une vente est rattachée à un niveau par son propre prix unitaire, pas par sa date de
  saisie.
- Égalité, coût indisponible ou aucune vente : niveau 0.

## 5. Bras

Chaque bras est une relance de la même entreprise (même graine) avec un plan de prix différent.

| Bras | Essai (183–273) | Exploitation (274–364) |
|---|---|---|
| **Témoin nul** | aucune intervention de toute l'année | — |
| **Aveugles** (cinq bras) | un niveau fixe dès le jour 183, sans essai | le même niveau |
| **Collectif** | plan de CORTEX | décision du § 4 avec loi de GALILÉE et coût de LAVOISIER |
| Sans GALILÉE | plan de CORTEX | décision par la table seule |
| Sans LAVOISIER | plan de CORTEX | coût inconnu : on maximise le chiffre d'affaires |
| Sans plan de CORTEX | « avant / après » : 6 blocs à +0,5 puis 7 blocs à −0,5 | décision du § 4 |

Le **meilleur niveau après coup** d'une entreprise est celui des cinq bras aveugles qui a la plus forte marge. Il
est connu trop tard pour servir : c'est une borne, gonflée par le hasard.

## 6. Mesure

Pour chaque bras : **marge sur ventes de l'objet piloté**, jours 183 à 364, lue dans la vérité après son
ouverture : somme, sur les ventes réelles de l'objet (doublons exclus), de montant − coût vrai × quantité.
**Gain** d'un bras = sa marge − celle du témoin nul, en euros simulés et en pourcentage de la marge du témoin nul.
Le gain est aussi donné par fenêtre (essai, exploitation).

Mesure secondaire, donnée sans critère : écart de profit total de l'entreprise. Elle est bruitée par construction
(L2, § 4).

## 7. Graines

- Mise au point : graines **201 à 220**. Tout réglage se fait là.
- Test : graines **6001 à 6040**, exécution unique, après que les réglages ont été écrits ici et poussés.
- Ces plages sont disjointes des graines réservées des moteurs (LAVOISIER 5001–5300, CORTEX 3001–3300 et
  5001–5400, GALILÉE 7001–7400).

## 8. Critères, sur le test

- **K1 — le collectif produit un gain.** Gain moyen du bras collectif sur la fenêtre entière (183–364), en
  pourcentage de la marge du témoin nul : supérieur à 0, test unilatéral apparié à 5 %.
- **K2 — le collectif décide mieux qu'une règle aveugle.** Sur la fenêtre d'exploitation, gain moyen du collectif
  supérieur à celui du meilleur des cinq bras aveugles (le meilleur en moyenne sur les entreprises du test,
  désigné après coup : c'est l'adversaire le plus dur).
- **K3 — chaque moteur compte.** Pour chacun des trois bras « sans », gain moyen en exploitation inférieur à celui
  du collectif ; déclaré « établi » seulement si le test unilatéral apparié à 5 % le dit, « non établi » sinon.
- **Invalide** si moins de 20 des 40 entreprises ont un objet pilotable.

Les seuils ne seront pas retouchés. Un critère manqué est publié comme tel.

## 9. Attendus, écrits avant toute mise au point

1. Le meilleur niveau après coup est +1 (+25 %) dans au moins 60 % des entreprises : la moitié des ventes
   environ passe par des factures dont la quantité ne dépend pas du prix dans ce simulateur.
2. Le coût de LAVOISIER est à moins de 5 % du coût vrai dans au moins 80 % des entreprises.
3. La loi de GALILÉE est retenue dans moins de la moitié des entreprises (comptages journaliers bruités).
4. Le juge de CORTEX confirme dans moins de 10 % des entreprises.
5. K1 est tenu. K2 est incertain. K3 n'est établi pour aucun moteur, ou pour un seul.
6. **Sur la fenêtre entière, le meilleur bras aveugle fait mieux que le collectif** : le collectif passe la moitié
   de la fenêtre à essayer des prix, y compris de mauvais. Si c'est le cas, la conclusion sera que dans ce
   simulateur l'essai ne se rembourse pas en 91 jours.

## 10. Limites écrites d'avance

- Demande à élasticité constante, ventes sur facture insensibles au prix, pas de concurrent : ce que l'essai
  établira vaut dans ce simulateur.
- Un seul objet par entreprise, une seule année, un seul levier.
- Le désordre du journal observé n'est pas le même d'une relance à l'autre (L2, § 4) ; chaque décision repart du
  journal de sa propre relance.
- Les ventes saisies en retard après le jour 273 manquent à la décision : les derniers blocs de l'essai sont un
  peu sous-comptés.
