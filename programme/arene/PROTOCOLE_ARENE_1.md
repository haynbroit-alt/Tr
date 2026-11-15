# Protocole ARÈNE-1 — décider un prix : le tenant face à deux prétendants sans essai

Écrit et poussé **avant** son code et avant toute exécution. Premier tour de l'arène (`REGLES.md`).

## 1. Tâche et tenant

Décider le prix d'un objet au jour 183 pour les 26 semaines suivantes. **Tenant : la chaîne prudente** (plan
d'essai de CORTEX allégé par le coût de LAVOISIER, huit semaines, décision par la table ; T3g).

## 2. Prétendants

Tous deux décident **sans essai**, au jour 183, avec le coût de LAVOISIER.

- **`direct`** (interne, vu dans T3h) : sensibilité de la demande par la droite des moindres carrés de ln(quantité)
  sur ln(prix), 26 semaines d'historique ; niveau de prix qui maximise (prix − coût) × ventes prévues.
- **`direct tempéré`** (extérieur : estimateur bayésien empirique, la méthode classique de James et Stein) : la
  sensibilité de chaque entreprise est ramenée vers la moyenne des entreprises, d'autant plus que son estimation
  est incertaine : e* = w·e + (1 − w)·μ, w = τ² ÷ (τ² + erreur type²). **μ = 1,651 et τ² = 1,116**, calculés sur les
  199 entreprises du lot de l'atelier (graines 301 à 500) et gelés ici. Estimation indisponible : e* = μ.

Non inscrits à ce tour, restent en lice : le bandit de Thompson (jeu égal deux fois avec l'ancienne chaîne), un
essai à arrêt anticipé, une règle de l'atelier quand il en proposera une.

## 3. Terrain

Monde de T3e à T3h. **Graines 6701 à 6900** (200 entreprises) : réservées au test de T3h, qui n'a pas été exécuté ;
elles sont neuves. Exécution unique. Référence donnée à côté : prix tenu.

## 4. Mesure et succession

Marge vraie de l'objet, jours 183 à 364, gain en % de la marge du témoin nul. Écarts appariés avec le tenant.
Deux prétendants : test unilatéral à 2,5 % chacun (**seuil t = 1,97**).

- **Prend la place** : avantage établi sur le tenant **et** pas plus d'entreprises perdantes face à prix tenu.
- **Relégué** : désavantage établi (t < −1,97). **En lice** : sinon.
- Les gains bornés à ±100 points et le décompte « mieux / moins bien » sont donnés à côté ; si la lecture bornée
  contredit la lecture principale, c'est dit et personne ne change de place.

## 5. Attendus, écrits avant toute exécution

1. **Le tenant garde sa place.** Sur le lot de l'atelier, `direct` faisait 15,9 % contre 16,9 %.
2. `direct` : en lice, écart entre −4 et +2 points. Il fait mieux dans plus d'une entreprise sur deux, et perd
   gros dans quelques-unes.
3. `direct tempéré` fait un peu mieux que `direct` (0 à 3 points) parce qu'il écarte les estimations folles ; en
   lice aussi.
4. Personne n'est relégué.

## 6. Domaine de validité, écrit d'avance

Les deux prétendants supposent que **l'historique des prix dit la vérité sur la demande**. Dans le simulateur, les
prix d'avant essai bougent sans promotion. Sur des ventes réelles de grande distribution, l'effet lu sur le prix
venait surtout des promotions (`programme/missions/prix-reel/`). Une victoire ici vaudrait **en simulation** ; elle
n'entrerait dans aucun livrable sans un contrôle de l'historique du client.
