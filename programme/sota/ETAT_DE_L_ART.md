# État de l'art — où sont les meilleurs, où nous sommes (15 novembre 2026)

Demande du propriétaire : étudier les meilleurs acteurs et méthodes, et chercher une supériorité mesurable. Ce
document dit, domaine par domaine, qui est la référence, ce que nous avons **mesuré** contre elle, et ce qui reste
une supposition. Les sources sont des recherches web du jour ; plusieurs sont des pages commerciales.

| Domaine | La référence | Notre position | Preuve |
|---|---|---|---|
| **Découverte de lois** (GALILÉE) | [SRBench 2025](https://cavalab.org/srbench/) : 25 méthodes, [aucun vainqueur unique](https://arxiv.org/abs/2505.03977) ; Operon et PySR sont les plus utilisées | **inférieurs** en précision à Operon réglé (devant sur 1 jeu sur 15) ; à égalité apparente sur les jeux d'au moins 54 mesures ; devant la programmation génétique classique sans que ce soit établi | mesuré : `RESULTATS_SOTA_LOIS.md` |
| **Essais de prix** (collectif) | le bandit, [meilleur qu'un essai équilibré selon Misra, Schwartz et Abernethy (2019)](https://econpapers.repec.org/RePEc:inm:ormksc:v:38:y:2019:i:2:p:226-252) ; l'échantillonnage de Thompson est [le plus répandu dans l'industrie](https://careersatdoordash.com/blog/experimentation-at-doordash-with-a-multi-armed-bandit-platform/) | **à égalité** avec un bandit de Thompson standard sur six mois (+0,8 point pour le bandit sur 120 entreprises simulées, non établi) | mesuré : `../t3d/`, `../t3e/` |
| **Décision sous incertitude** (CORTEX) | l'inférence valide à tout instant, en production [chez Adobe](https://arxiv.org/abs/2302.10108) et [chez Netflix](https://proceedings.neurips.cc/paper_files/paper/2022/file/12f3bd5d2b7d93eadc1bf508a0872dc2-Paper-Conference.pdf) ; la frontière actuelle est [l'ajustement par covariables](https://neurips.cc/virtual/2026/172173) | **même famille de méthodes** ; son juge n'a rien décidé dans nos cinq essais de prix | **non mesuré** contre une référence |
| **Lecture d'écritures** (LAVOISIER) | pas de banc commun ; la méthode la plus citée, [les auto-encodeurs](https://arxiv.org/pdf/1709.05254), obtient des scores modestes sur données réelles | approche différente (conservation) ; coût unitaire exact sur 280 entreprises simulées | **non mesuré** contre une référence, ni sur écritures réelles |

## Ce que nous faisons que la référence ne fait pas d'office

- Écrire le critère et les attendus avant de mesurer, et publier ce qui échoue. Aujourd'hui : cinq critères
  principaux manqués sur neuf protocoles, tous consignés.
- Refuser de livrer : une loi non retenue, une décision sans coût, une lecture d'historique seule.

Ce n'est pas une supériorité technique. C'est une discipline, et c'est ce que l'offre vend.

## Ce qui donnerait une supériorité mesurable, par ordre de valeur

1. **Reconnaître d'avance les entreprises où un essai de prix fera perdre** : quatre sur dix en simulation. Ni
   notre chaîne ni le bandit ne le font. Non étudié.
2. **Donner à GALILÉE l'optimisation locale des constantes**, puis mesurer sa lisibilité contre Operon : viser la
   même précision avec des formules cinq fois plus courtes. Protocole à écrire.
3. **Mesurer CORTEX et LAVOISIER contre une référence publique.** Rien n'existe encore pour eux.
