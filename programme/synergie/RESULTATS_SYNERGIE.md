# Résultats SYNERGIE — ce que chaque moteur apporte, seul et avec les autres

Exécution unique du 15 novembre 2026, graines 6901 à 7000 (99 entreprises mesurées, une écartée : aucun objet
éligible), dossier `synergie#1` du registre, détail dans `test.json`. Protocole `PROTOCOLE_SYNERGIE.md`, poussé
avant le code. Marge simulée ; aucun euro réel.

## 1. Les huit combinaisons

Gain moyen sur la marge de l'objet piloté ; entre parenthèses, gain borné à ±100 points, moins sensible aux
entreprises à marge infime.

| Moteurs présents | Gain | (borné) |
|---|---|---|
| aucun | 25,8 % | (6,8 %) |
| GALILÉE seul | 25,6 % | (6,5 %) |
| LAVOISIER seul | 41,1 % | (10,4 %) |
| CORTEX seul | **−5,0 %** | (−10,8 %) |
| GALILÉE + LAVOISIER | 40,9 % | (10,3 %) |
| GALILÉE + CORTEX | −4,5 % | (−10,3 %) |
| LAVOISIER + CORTEX (chaîne actuelle) | 41,9 % | (15,1 %) |
| les trois | 42,0 % | (15,2 %) |
| *prix tenu, pour mémoire* | *29,6 %* | *(5,2 %)* |

## 2. Critères

| Critère | Résultat | Verdict |
|---|---|---|
| **Y1** — les trois font mieux qu'aucun | +16,1 points, t = 2,54 | **tenu** |
| **Y2-L** — apport de LAVOISIER | +31,0 points, t = 2,08 | **tenu** |
| **Y2-C** — apport de CORTEX | −14,8 points, t = −1,68 | **manqué** |
| **Y2-G** — apport de GALILÉE | 0,0 point, t = −0,29 | **manqué** |
| **Y3** — synergie | +32,0 points, t = 4,11 (borné : +22,5, t = 6,18) | **tenu** |
| **Y4** — les trois font mieux que LAVOISIER + CORTEX | 0,0 point, t = 0,21 | **manqué** |

## 3. Ce que cela dit

- **Il y a une synergie, et elle tient tout entière entre LAVOISIER et CORTEX** (interaction de la paire : +31,7
  points, t = 4,07). Mais il faut la lire pour ce qu'elle est :
  - **le plan de CORTEX, seul, détruit de la valeur** (−5,0 % contre 25,8 % sans aucun moteur). Il essaie des prix
    de −20 % à +25 % ; sans le coût, la décision maximise le chiffre d'affaires et choisit −20 % dans 88
    entreprises sur 99 ;
  - **avec le coût de LAVOISIER, le même plan devient le meilleur bras.** La synergie mesurée est celle d'un
    outil dangereux rendu sûr par un autre, pas de deux forces qui s'ajoutent.
- **Ce que CORTEX ajoute une fois le coût connu est petit et incertain** : chaîne actuelle contre « LAVOISIER +
  plan naïf », +0,9 point (t = 0,15) en lecture principale ; +4,7 points (t = 3,56) en gains bornés ; mieux dans 60
  entreprises, moins bien dans 39. Les deux lectures ne s'accordent pas : **non établi**.
- **LAVOISIER porte l'essentiel** : à lui seul 41,1 % sur les 42,0 % de l'ensemble.
- **GALILÉE n'apporte rien à cette chaîne** : sa loi est retenue dans 29 entreprises sur 99, change la décision
  dans 8, pour un écart nul. Quatrième mesure du même constat (T3b, T3c, T3h).
- Sans aucun moteur, un essai fait **moins bien que ne rien changer** (25,8 contre 29,6 %, non établi).

## 4. Attendus, relus

Y1 tenu : juste. Y2-L tenu et le plus gros : juste. Y2-C « tenu de peu ou non établi » : **faux**, l'apport est
négatif. Y2-G manqué : juste. Y4 manqué : juste. Y3 « non établi » : **faux**, la synergie est nette — j'avais vu
l'interaction LAVOISIER × CORTEX sans mesurer sa taille.

## 5. Limites

Une seule tâche, un seul monde simulé. « Sans LAVOISIER » veut dire décider sur le chiffre d'affaires : c'est ce
remplaçant-là qui rend le plan de CORTEX désastreux ; un autre (une marge supposée de 30 %, par exemple) donnerait
un autre apport. GALILÉE n'entre que par une loi sur huit semaines, là où il est le plus faible. Les moyennes
brutes sont tirées par quelques entreprises à marge infime : d'où la lecture bornée à côté.

## 6. Ce que cela change à la stratégie

1. **Dans l'essai de prix, la valeur vient du coût.** Ce qu'on vend, c'est d'abord la reconstitution du coût par
   LAVOISIER ; l'essai vient ensuite. Or JOURNAL-ABÎMÉ montre que LAVOISIER est fragile sur des écritures
   imparfaites : **c'est le maillon à renforcer en premier.**
2. **Ne jamais livrer un plan d'essai sans coût.** L'outil le refuse déjà à la décision ; la mesure dit pourquoi.
3. **Le plan de CORTEX doit défendre sa place** face au plan naïf quand le coût est connu : prétendant inscrit à
   l'arène (`programme/arene/`).
4. **GALILÉE n'a pas de place dans cette chaîne** en l'état. Sa place éventuelle est ailleurs : la loi commune à
   plusieurs petits jeux (protocole G5), qui devra la gagner à l'arène.
