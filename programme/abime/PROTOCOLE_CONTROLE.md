# Protocole CONTRÔLE — un contrôle de qualité du journal avant la lecture de LAVOISIER

Écrit et poussé **avant** son code et avant toute exécution. Suite de `RESULTATS_JOURNAL_ABIME.md` § 5 et des
règles de l'arène (`programme/arene/REGLES.md`) : tâche « lire un journal », tenant LAVOISIER seul, **prétendant :
contrôle puis LAVOISIER**. Le moteur n'est pas modifié ; le contrôle s'écrit dans l'espace commun.

## 1. Ce que fait le contrôle (`src/controle-journal.js`)

Il ne répare que ce qui se reconnaît sans connaître le métier, et il **dit ce qu'il a fait**.

- **Copies exactes** : deux lignes identiques en tout sauf l'identifiant (jour, source, libellé, montant,
  quantité, objet, contrepartie, auteur, référence) — la seconde est retirée. C'est la trace d'un fichier importé
  deux fois.
- **Montants dix fois trop grands** :
  - ligne portant montant et quantité : son prix unitaire vaut entre 8 et 12,5 fois le prix unitaire médian du
    même objet (au moins 8 lignes) → montant divisé par 10 ;
  - ligne portant un montant seul : même règle sur le montant, dans le groupe (source, objet, contrepartie), si ce
    groupe a au moins 8 lignes et des montants resserrés (écart interquartile inférieur à la moitié de la médiane).
- **Alerte** : si plus de 1 % des lignes ont été retirées ou corrigées, le journal est déclaré abîmé.
- Il ne touche ni aux dates ni aux lignes manquantes : il ne sait pas les reconnaître.

Vu sur trois entreprises déjà utilisées (8001 à 8003), avant d'écrire la règle : les doublons « naturels » du
simulateur ne sont pas des copies exactes ; des copies exactes légitimes existent (deux ventes identiques le même
jour), jusqu'à 0,25 % des lignes. Le contrôle en retirera donc à tort : c'est le prix, mesuré par K1.

## 2. Terrain

40 entreprises neuves, **graines 8041 à 8080**, même classe et mêmes dégâts que JOURNAL-ABÎMÉ. Pour chacune, huit
lectures : journal intact, 5 % de doublons, 5 % de montants × 10, « tout à la fois » (2 % de chaque dégât) —
chacune **sans** puis **avec** contrôle. La vérité d'une entreprise s'ouvre après ses huit lectures.

## 3. Critères

Flux cachés retrouvés comptés sur l'ensemble des entreprises ; référence : journal intact sans contrôle.

- **K1 — il n'abîme pas un journal sain** : sur journal intact, avec contrôle, au plus 2 flux retrouvés de moins,
  et pas plus de 0,2 fausse détection de plus par entreprise.
- **K2 — doublons** : avec contrôle, au moins 80 % des flux de la référence sont retrouvés.
- **K3 — fautes de frappe** : avec contrôle, au moins 80 % des flux de la référence, et une erreur de profit
  médiane au plus double de la référence.
- **K4 — il le dit** : alerte levée sur au moins 95 % des journaux abîmés (doublons, montants, tout) et sur au plus
  10 % des journaux intacts.

**Succession** : le prétendant prend la place s'il tient K1 et au moins un de K2, K3. Un critère manqué est publié.

## 4. Attendus, écrits avant toute exécution

K1 tenu. **K2 tenu** : une copie exacte se reconnaît sans peine. **K3 manqué** : la règle rattrape les lignes à
prix unitaire, pas les montants seuls, qui font l'essentiel de certains archétypes. K4 tenu.

## 5. Limites écrites d'avance

- Mes doublons sont des copies exactes ; un vrai double enregistrement diffère souvent d'un détail (date, libellé).
- Dates fausses et lignes perdues restent sans réponse : ce sont deux des trois dégâts les plus destructeurs.
- Mêmes dégâts aléatoires que JOURNAL-ABÎMÉ ; un vrai export a des dégâts groupés.
