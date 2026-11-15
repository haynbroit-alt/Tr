# Protocole SOTA-LOIS-2 — à longueur de formule égale, GALILÉE fait-il mieux ?

Écrit et poussé **avant** tout calcul sur ces jeux. Suite de `RESULTATS_SOTA_LOIS.md`.

## 1. Question

SOTA-LOIS a montré qu'Operon bien réglé prédit mieux que GALILÉE, avec des formules d'une cinquantaine de nœuds
là où celles de GALILÉE sont courtes. Une formule courte se lit, se discute et se règle ; c'est ce qu'un client
attend d'une « loi ». Mais je n'ai rien mesuré : ni la longueur des lois de GALILÉE, ni ce que vaut Operon quand
on lui impose d'être court.

**Quand Operon est limité à des formules courtes, GALILÉE prédit-il mieux que lui ?** Si oui, GALILÉE a une niche
mesurable : la précision à lisibilité égale. Si non, la chaîne de livraison doit adopter Operon.

## 2. Jeux — neufs, choisis par une règle mécanique

Les 15 jeux du NIST ont servi. Ceux-ci n'ont jamais été vus par aucun moteur du dépôt. Ils viennent de la
collection Rdatasets, distribuée avec le paquet Python `pydataset` 0.2.0 (non copiée ici). Règle, appliquée sans
regarder aucun résultat :

- exactement deux colonnes numériques (hors numéro de ligne) ; la première est x, la seconde y ;
- de 54 à 600 lignes ; au moins 10 valeurs distinctes dans chaque colonne ;
- deux jeux de contenu identique n'en font qu'un ; le jeu `co2` est écarté (déjà utilisé dans RÉEL-2).

La règle rend 32 jeux avant dédoublonnage : durée d'éruption d'un geyser, masse du cerveau selon celle du corps,
dépense alimentaire selon le revenu, accélération lors d'un choc, séries annuelles ou mensuelles… Beaucoup sont
des séries temporelles, où aucune formule simple n'est attendue : cela fait partie de l'épreuve.

## 3. Épreuve

Celle de la chaîne de livraison (`src/loi-client.js`), sans rien y changer : une mesure sur quatre mise de côté
(rangs 2, 6, 10… après tri), mise à l'échelle par le plus grand écart des mesures vues. Mesure : l'erreur
quadratique moyenne sur les mesures mises de côté, et son **rapport au meilleur témoin** (droite ou constante) ;
sous 1, la formule fait mieux qu'un modèle trivial. Longueur : le nombre de nœuds de la formule (pour GALILÉE,
`size` de son propre module ; pour les concurrents, la longueur qu'ils déclarent).

## 4. Concurrents

- **GALILÉE** (copie gelée `be42b7e`), par la chaîne de livraison, graine 1.
- **Operon court** : Operon réglé comme dans SOTA-LOIS (fonctions de GALILÉE, optimisation locale des constantes),
  avec une longueur de formule plafonnée à **15 nœuds**.
- **Operon long** : le même, plafond par défaut de 50 nœuds.
- **gplearn** : comme dans SOTA-LOIS.

Operon a 20 secondes par ajustement (60 dans SOTA-LOIS : le nombre de jeux a doublé). Trois graines pour chaque
concurrent, score = médiane des trois erreurs.

## 5. Critères

Test des signes à 5 %, unilatéral, sur les jeux.

- **Q1 — à longueur comparable, GALILÉE fait mieux qu'Operon court.** **Q1 inverse** : Operon court fait mieux.
  Entre les deux : pas de différence établie.
- **Q2 — GALILÉE face à Operon long** : même règle.
- Donné sans critère : longueurs médianes ; part des jeux où chacun bat le meilleur témoin ; GALILÉE face à
  gplearn.

Les seuils ne seront pas retouchés. Un critère manqué est publié comme tel.

## 6. Attendus, écrits avant tout calcul

1. **Q1 inverse tenu ou presque** : Operon court est devant GALILÉE sur 17 à 23 jeux. Je ne crois pas à la niche.
2. Q2 inverse tenu : Operon long est devant sur 20 jeux au moins.
3. Longueur médiane : GALILÉE 5 à 9 nœuds ; Operon court 12 à 15 ; Operon long plus de 40.
4. Sur plus d'un tiers des jeux, personne ne bat le meilleur témoin (séries temporelles).

## 7. Limites écrites d'avance

- Une seule variable explicative partout ; rien sur les lois à plusieurs variables.
- Vingt secondes pour Operon, quelques secondes pour GALILÉE : le coût de calcul n'est pas égalisé.
- La longueur en nœuds n'est pas comptée exactement de la même façon par les deux outils (Operon porte un
  coefficient sur chaque nœud) : l'ordre de grandeur se compare, pas l'unité près.
- Interpolation seulement : les mesures mises de côté sont entre les mesures vues.
