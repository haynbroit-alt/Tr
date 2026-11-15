# Protocole T3h — prédire les perdantes avant l'essai, par une méthode qui écrit ses propres règles

Écrit et poussé **avant** son code et avant toute exécution. Répond à deux demandes du propriétaire (15 novembre
2026) : « prédire les entreprises perdantes avant les essais » et « construire et évaluer une méthode capable
d'inventer ses propres méthodes ». Suite de `programme/t3f/` et `programme/t3g/`.

## 1. Constat de départ

- Sur 320 entreprises, l'essai gagne 6,5 points sur « prix tenu » et 42 % y perdent. Le taux de marge seul ne les
  désigne pas dans la zone du milieu (T3f).
- Trois fois, une règle que j'ai lue après coup sur des entreprises déjà vues a fondu au test (T3b, T3e, T3f). Le
  défaut n'est pas la règle, c'est la façon de la trouver : à la main, sans garde contre l'illusion.
- Avant tout essai, le journal contient déjà six mois de ventes à des prix qui ont bougé d'eux-mêmes. Vu sur six
  entreprises de mise au point (241 à 246), sans rien décider : plusieurs prix pratiqués, des ventes qui suivent.

## 2. Questions

1. Peut-on désigner, **au jour 183 et sans essai**, les entreprises où l'essai fera perdre ?
2. Une méthode automatique — l'**atelier** — qui compose elle-même des règles de décision, les valide et sait
   refuser d'en proposer une, fait-elle mieux que la chaîne écrite à la main ? Et ce qu'elle annonce tient-il ?

Marge simulée ; aucun euro réel.

## 3. Ce que l'atelier a le droit de lire (au jour 183, journal coupé)

- `m` : prix de référence ÷ coût unitaire de LAVOISIER.
- Historique en 26 semaines : quantité vendue et prix moyen de chaque semaine. Droite des moindres carrés de
  ln(quantité) sur ln(prix) : sensibilité `e`, son erreur type, `t = e ÷ erreur type`, étendue des prix.
- Loi de GALILÉE sur ces mêmes points (chaîne de livraison, graine 1) : retenue ou non.
- Pour chaque modèle de demande (droite, loi de GALILÉE) : le niveau de prix qui maximise (prix − coût) × ventes
  prévues parmi les cinq niveaux, et le gain relatif prévu `g`.
- `bruit` : écart-type ÷ moyenne de la marge hebdomadaire de l'objet.

## 4. Les actions qu'une règle peut choisir

`tenu` (prix tenu) · `chaîne` (chaîne prudente de T3g) · `direct` (niveau prévu par la droite, sans essai) ·
`direct GALILÉE` (niveau prévu par sa loi si elle est retenue, sinon prix tenu) · les quatre niveaux fixes
(−20 %, −10,6 %, +11,8 %, +25 %). Huit actions, toutes simulées pour chaque entreprise ; une règle ne fait que
choisir entre elles : aucune simulation n'est refaite pour évaluer une règle.

## 5. L'atelier

- **Forme des règles** : arbre de décision. Un nœud teste « trait < seuil » (traits du § 3 ; seuils : déciles du
  trait dans le nœud) ; une feuille applique une action. Au moins 20 entreprises par feuille. Profondeur 0 à 3.
- **Construction** : gloutonne, chaque coupe et chaque action de feuille maximisant le gain moyen.
- **Gains bornés pour apprendre** : gain en % de la marge du témoin nul, borné à ±100 points (T3g a montré des
  gains de plus de 200 points sur des marges infimes ; ils ne doivent pas écrire la règle).
- **Choix de la profondeur** : validation croisée en 10 plis (pli = rang de la graine modulo 10) ; la plus petite
  profondeur dont le gain hors pli est à moins d'une erreur type du meilleur.
- **Refus** : si, hors pli, l'avantage apparié de la règle sur `chaîne` n'atteint pas t = 1,684, l'atelier rend
  `chaîne` partout et dit qu'il n'a rien trouvé.
- Deux passes : **restreinte** (actions `tenu` et `chaîne` seulement : elle dit où ne pas essayer, donc qui serait
  perdante) et **complète** (huit actions : la méthode inventée).
- Les deux règles sont écrites dans `programme/t3h/politique.json`, avec l'avantage annoncé par la validation
  croisée, et **poussées avant le test**.

## 6. Graines

- Atelier : **301 à 500** (200 entreprises, monde de T3e à T3g). Vérification du code sur 301 à 303.
- Test : **6701 à 6900** (200 entreprises), exécution unique, règles gelées.

## 7. Critères, sur le test

Écarts appariés, test unilatéral à 5 %, gains **non bornés** comme de T3 à T3g ; la lecture bornée et le décompte
des entreprises sont donnés à côté.

- **P1 — les perdantes sont désignées.** L'avantage « chaîne − prix tenu » est plus faible chez les entreprises que
  la règle restreinte envoie vers `tenu` que chez les autres (écart de moyennes, test de Welch unilatéral). Si
  l'atelier a refusé : manqué.
- **P2 — n'essayer que là où c'est désigné rapporte.** La règle restreinte fait mieux que `chaîne` partout.
- **H1 — la méthode inventée fait mieux que la chaîne écrite à la main.** Règle complète contre `chaîne`.
- **H2 — moins de perdantes.** Strictement moins d'entreprises sous « prix tenu » avec la règle complète qu'avec
  `chaîne`.
- **H3 — l'atelier ne se raconte pas d'histoire.** L'avantage mesuré au test (gains bornés) est à moins de deux
  erreurs types combinées de celui annoncé par la validation croisée.

Donné sans critère : `direct` contre `direct GALILÉE` ; si la règle retenue se sert de GALILÉE ; la règle en clair.

Un critère manqué est publié comme tel. Un refus de l'atelier est un résultat.

## 8. Attendus, écrits avant toute exécution

1. L'historique porte de l'information : `direct` fait mieux que `chaîne` en moyenne, et la règle complète choisit
   surtout des actions sans essai. L'atelier ne refuse pas.
2. H1 tenu, entre 4 et 15 points. H2 tenu.
3. H3 tenu — mais trois illusions précédentes : je n'y mets pas plus de deux chances sur trois.
4. P1 tenu ; P2 tenu de peu (1 à 4 points).
5. La loi de GALILÉE est retenue dans moins d'une entreprise sur deux ; `direct GALILÉE` ne fait pas mieux que
   `direct` ; la règle retenue ne s'en sert pas.

## 9. Limites écrites d'avance

- **L'historique du simulateur est propre** : les prix y bougent sans promotion ni publicité. Sur des ventes
  réelles, l'effet lu sur le prix venait surtout des promotions (`programme/missions/prix-reel/`). Une règle « sans
  essai » qui gagne ici ne se livre pas à un client sans vérifier d'abord que son historique n'est pas confondu.
- « Inventer » est pris au sens étroit : composer des conditions et des actions connues. L'atelier n'imagine ni
  nouvelle expérience ni nouveau trait.
- Un monde, un objet par entreprise, 26 semaines ; atelier et test tirés du même simulateur.
