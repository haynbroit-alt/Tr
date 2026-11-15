# Protocole SOTA-LOIS — GALILÉE face aux meilleures méthodes publiques de découverte de lois

Écrit et poussé **avant** d'avoir fait tourner un seul concurrent sur ces données.

## 1. Question

Sur des mesures réelles, GALILÉE prédit-il mieux, aussi bien ou moins bien que les méthodes de référence
mondiales ? Le banc international SRBench (édition 2025, 25 méthodes) ne désigne aucun vainqueur unique ; Operon
et PySR y sont les implémentations modernes les plus utilisées. Jusqu'ici GALILÉE n'a été mesuré que contre un
modèle certifié et contre des témoins (droite, constante), jamais contre une méthode concurrente.

## 2. Épreuve

Celle du protocole RÉEL (`programme/missions/reel/`), sans rien y changer : les **15 jeux de mesures de laboratoire
du NIST** (lot « observé »), même partage (une mesure sur quatre mise de côté, rangs 2, 6, 10…), même mise à
l'échelle (division par le plus grand écart des mesures vues). Mesure : l'erreur quadratique moyenne sur les
mesures mises de côté, et son **rapport** à l'écart-type résiduel du modèle certifié par le NIST. Un jeu est « au
niveau de la référence » si ce rapport est au plus 2, comme dans RÉEL.

## 3. Concurrents

- **GALILÉE** (copie gelée `be42b7e`) : ses erreurs sont celles déjà publiées dans
  `programme/missions/reel/test-observe.json`. Elles ne sont pas recalculées.
- **Operon** (`pyoperon` 0.6.2), la référence : réglages par défaut de la bibliothèque, plafond de 60 secondes
  par ajustement.
- **gplearn** 0.4.3, programmation génétique classique : réglages par défaut, avec les fonctions élémentaires
  que GALILÉE possède (addition, soustraction, multiplication, division, racine, logarithme, sinus, cosinus).

Chaque concurrent est lancé avec trois graines (1, 2, 3) ; son score sur un jeu est la **médiane** de ses trois
erreurs. GALILÉE n'a qu'une graine : cet écart de traitement avantage légèrement les concurrents, et il est assumé.

## 4. Critères

- **S1 — GALILÉE fait mieux qu'Operon** : erreur plus basse sur les mesures mises de côté dans au moins 12 jeux
  sur 15 (test des signes à 5 %). **S1 inverse** : Operon fait mieux dans au moins 12 jeux sur 15.
  Entre les deux : « pas de différence établie ».
- **S2 — GALILÉE fait mieux que gplearn** : même règle.
- Donné sans critère : nombre de jeux au niveau de la référence pour chacun, et le détail sur les 7 jeux d'au
  moins 54 mesures, où RÉEL avait montré que GALILÉE réussit.

## 5. Attendus, écrits avant tout calcul

1. Operon fait mieux que GALILÉE sur la majorité des jeux : GALILÉE est devant sur 5 jeux au plus.
2. GALILÉE fait mieux que gplearn sur 9 jeux au moins.
3. Operon est au niveau de la référence sur 9 jeux au moins (GALILÉE : 8).
4. Sur les jeux de moins de 20 mesures, personne n'est au niveau de la référence.

## 6. Limites écrites d'avance

- Quinze jeux, une seule famille de données (mesures de laboratoire à une ou deux variables).
- L'erreur de prédiction n'est pas tout : la lisibilité de la loi et le coût de calcul ne sont pas comparés ici ;
  la longueur des formules est seulement relevée.
- Réglages par défaut : un concurrent mieux réglé ferait peut-être mieux. PySR n'est pas mesuré (il demande un
  environnement Julia que cet environnement ne peut pas télécharger).
