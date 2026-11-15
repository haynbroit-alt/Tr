# Protocole PRIX-RÉEL — la lecture « quel prix dégage le plus de marge » sur des ventes réelles

Écrit et poussé **avant** tout calcul. À ce stade je n'ai lu que la structure des fichiers (noms de colonnes, trois
lignes), aucun résultat.

## 1. Question

Les essais T3, T3b et T3c sont simulés. La décision de leur chaîne tient en une lecture : parmi les niveaux de prix
observés, retenir celui qui dégage le plus de marge par période, (prix − coût) × ventes. **Sur des ventes réelles,
le niveau que cette lecture retient dégage-t-il encore plus de marge sur des semaines qu'elle n'a pas vues ?**

Ce n'est **pas** un essai de prix : personne n'a fixé ces prix pour apprendre quelque chose. C'est une
confrontation rétrospective de la lecture à des données réelles, et rien de plus.

## 2. Données

Ventes hebdomadaires de la chaîne Dominick's Finer Foods (région de Chicago), distribuées avec le paquet R `bayesm`
(licence GPL), obtenu par le dépôt de paquets Debian (`r-cran-bayesm` 3.1-6). Les données brutes ne sont pas
copiées dans ce dépôt ; un script les extrait.

- **Jus d'orange** (`orangeJuice`) : 83 magasins, 11 marques, 106 139 lignes magasin × marque × semaine. Par
  ligne : unités vendues (exponentielle de `logmove`), prix de la marque, marge brute en pourcentage (`profit`),
  promotion en magasin (`deal`) et annonce publicitaire (`feat`). Coût unitaire = prix × (1 − marge ÷ 100).
- **Thon** (`tuna`) : 7 marques, 338 semaines, niveau chaîne. Unités, prix, prix de gros (pris comme coût).

Une **série** est un couple magasin × marque (jus d'orange) ou une marque (thon).

## 3. Lecture appliquée à chaque série

1. Les semaines de la série sont coupées en deux dans l'ordre du temps : première moitié pour **lire**, seconde
   moitié pour **vérifier**.
2. Prix de référence : médiane des prix de la moitié de lecture.
3. Chaque semaine est rangée dans un niveau, comme dans les essais : u = log(prix ÷ référence) ÷ log(1,25), ramené
   au plus proche de −1 ; −0,5 ; 0 ; +0,5 ; +1 s'il en est à moins de 0,25. Les autres semaines sont « hors
   grille » et écartées.
4. Marge d'une semaine = (prix − coût) × unités, avec le prix et le coût de cette semaine-là.
5. **Décision** : parmi les niveaux vus au moins 3 semaines dans la moitié de lecture, celui dont la marge
   hebdomadaire moyenne est la plus haute.

Série retenue : au moins 60 semaines, et au moins deux niveaux vus 3 semaines ou plus en lecture.

## 4. Mesure

Sur la moitié de vérification : marge hebdomadaire moyenne au niveau décidé, comparée à celle du niveau 0 (le prix
de référence, « ne rien changer »). **Gain relatif** = (marge au niveau décidé − marge au niveau 0) ÷ marge au
niveau 0. Il faut au moins 2 semaines de vérification à chacun des deux niveaux ; sinon la série est « non
évaluable », et comptée. Une série dont la décision est le niveau 0 ne change rien : elle est comptée à part.

Les séries d'un même magasin partagent leurs semaines et leurs clients : elles ne sont pas indépendantes. Tout
test porte donc sur **une valeur par magasin** (moyenne de ses séries).

## 5. Critères

- **R1 — la lecture se confirme.** Sur les séries où la décision change le prix : gain relatif moyen par magasin
  supérieur à 0, test unilatéral à 5 % sur les magasins.
- **R2 — le classement se confirme.** Le niveau le mieux classé en lecture dégage, en vérification, plus de marge
  que le niveau le moins bien classé en lecture, dans plus de la moitié des magasins (test des signes à 5 %).
  C'est le contrôle : si le pire niveau faisait aussi bien, la lecture ne lirait rien.
- **R3 — sans promotion affichée.** R1 recalculé en écartant toutes les semaines où `deal` ou `feat` est non nul.
  Si R1 ne tient qu'avec les promotions, ce sera dit : la lecture aurait alors lu l'effet de la publicité, pas
  celui du prix.

Thon : 7 séries seulement. Mêmes calculs, donnés sans critère.

Les seuils ne seront pas retouchés. Un critère manqué est publié comme tel.

## 6. Attendus, écrits avant tout calcul

1. Dans la majorité des séries où la décision change le prix, elle retient un niveau **plus bas** que la
   référence : les semaines de promotion vendent beaucoup.
2. R1 tenu, avec un gain moyen supérieur à 20 %.
3. R2 tenu.
4. **R3 : gain nettement plus faible, peut-être non significatif.** C'est le résultat que je crois le plus
   instructif : une bonne part de ce que la lecture attribue au prix vient de la promotion qui l'accompagne.
5. Plus d'un quart des séries sont non évaluables ou ne changent rien.

## 7. Limites écrites d'avance

- Observation, pas expérience : la chaîne a choisi ses prix et ses promotions, pas au hasard. Aucun gain causal
  ne peut être affirmé.
- Coût reconstitué depuis la marge déclarée, pas depuis des écritures.
- Données hebdomadaires et prix continus : l'outil de livraison (ventes ligne à ligne, prix du plan) ne s'applique
  pas tel quel ; c'est sa règle de décision qui est éprouvée, pas l'outil.
- Le « niveau 0 » est le prix médian passé, pas un prix que le magasin aurait tenu.
- Une chaîne, deux produits, États-Unis, années 1990.
