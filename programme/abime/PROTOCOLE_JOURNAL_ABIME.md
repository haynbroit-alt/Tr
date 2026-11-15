# Protocole JOURNAL-ABÎMÉ — LAVOISIER devant des écritures complexes et imparfaites

Écrit et poussé **avant** son code et avant toute exécution. Répond à la demande du propriétaire (15 novembre
2026) : « tester LAVOISIER sur des flux complexes et imparfaits ». Moteur : copie gelée de LAVOISIER (`2e66aa7`),
non modifiée.

## 1. Question

Le simulateur de LAVOISIER produit déjà un désordre « réaliste » (doublons, retards). Un vrai export comptable est
pire : lignes perdues, dates fausses, références absentes, fautes de frappe. **Que devient le bilan de LAVOISIER
quand on abîme le journal au-delà de ce pour quoi il a été réglé, et le dit-il ?**

## 2. Entreprises

40 entreprises neuves, **graines 8001 à 8040** (jamais utilisées ; hors des graines réservées). Classe : archétype
de développement `DEV_ARCHETYPES[graine mod 3]`, **1 ou 2 flux cachés** (1 + graine mod 2), désordre « réaliste ».
Les deux archétypes écrits après le gel (transformation, acompte) ne sont **pas** utilisés : ils restent scellés
pour le test final de M0.

## 3. Dégâts, appliqués au journal observé avant que LAVOISIER le lise

Chaque dégât touche une part `r` des lignes, tirées au hasard (graine fixe par entreprise et par dégât).

| Dégât | Ce qu'il fait |
|---|---|
| `perte` | la ligne disparaît |
| `doublon` | la ligne est recopiée sous un autre identifiant |
| `date` | le jour est décalé de 1 à 7 jours, en avant ou en arrière |
| `quantite` | la quantité est effacée |
| `reference` | référence et contrepartie sont effacées |
| `montant` | le montant est multiplié par 10 (faute de frappe) |
| `tout` | les six à la fois, 2 % chacun |

Taux : **5 %** et **20 %**. Avec le journal intact : 14 lectures par entreprise, 560 en tout. Les relevés ne sont
pas touchés.

## 4. Mesures

Celles du banc de LAVOISIER (`evaluate`), vérité scellée jusqu'à la fin de toutes les lectures : erreur de profit
`P`, erreur de stock `S`, liens `L`, flux cachés retrouvés `R` (comptés sur l'ensemble des entreprises), fausses
détections `FD` par entreprise. Plus : toute exception levée par le moteur.

Les lignes perdues ne peuvent pas être classées et un profit dont on a ôté 5 % des écritures ne peut pas être
juste : pour `perte`, `quantite` et `tout`, rien n'est exigé, tout est décrit.

## 5. Critères, à 5 % de lignes abîmées

- **B1 — il ne casse pas** : aucune exception sur les 560 lectures.
- **B2 — doublons** : erreur de profit médiane au plus double de celle du journal intact, et pas plus d'une demi
  fausse détection de plus par entreprise.
- **B3 — dates** : au moins 80 % des flux cachés retrouvés sur journal intact le sont encore, et pas plus d'une
  demi fausse détection de plus par entreprise.
- **B4 — références effacées** : la mesure des liens `L` ne baisse pas de plus de 0,05 (médiane).
- **B5 — fautes de frappe** : erreur de profit médiane au plus double de celle du journal intact.

Un critère manqué est publié comme tel.

## 6. Attendus, écrits avant toute exécution

1. B1 tenu. 2. B2 tenu (le simulateur produit déjà des doublons). 3. B3 tenu pour les flux retrouvés ; les fausses
détections montent, critère **manqué de peu**. 4. B4 tenu. 5. **B5 manqué** : rien dans LAVOISIER ne repère une
faute de frappe. 6. À 20 %, tout se dégrade nettement ; avec `perte`, les lignes manquantes sont lues comme des
fuites (fausses détections multipliées) — ce qui, pour un auditeur, est la bonne alerte au mauvais nom.

## 7. Limites écrites d'avance

- Dégâts tirés au hasard, indépendants : un vrai export a des dégâts groupés (un mois manquant, un logiciel qui
  tronque). Ce n'est pas encore un vrai journal.
- 40 entreprises, trois archétypes connus du moteur. Les flux « complexes » au sens de M0 (archétypes jamais vus)
  ne sont pas mesurés ici, pour ne pas entamer le test final de M0.
- L'évaluateur compte comme fausse détection un écart que LAVOISIER signale à juste titre sur une ligne perdue.

---

## 8. Vérification du code — écrit et poussé avant l'exécution

Le script (`scripts/journal-abime.js`) a tourné sur deux entreprises de développement de LAVOISIER (graines 1 et 2,
option `--dev`), connues du moteur et sans flux caché, pour vérifier qu'il va au bout. J'y ai vu des chiffres :
aucune exception, et une erreur de profit qui grimpe dès 5 % de doublons ou de dates décalées. Deux entreprises ne
prouvent rien ; rien n'a été changé aux dégâts, aux mesures ni aux critères. Mes attendus du § 6 restent ceux
écrits avant, même si cet aperçu fait douter de B2.

Exécution : `node scripts/journal-abime.js --sortie programme/abime/resultats.json`, une seule fois.

## 9. Incident et écart au protocole — écrit avant la relance

La première exécution s'est arrêtée faute de mémoire, avant d'avoir ouvert une seule vérité : le script gardait
les 560 bilans ouverts. Pour le comprendre, j'ai lancé la graine 8001 seule, jusqu'au bout : **j'ai donc vu les
chiffres d'une entreprise sur quarante** avant l'exécution complète. Rien n'a été changé aux dégâts, aux mesures ni
aux critères.

Écart au § 4 : la vérité s'ouvre désormais **entreprise par entreprise**, après les quatorze lectures de cette
entreprise, et non après les 560. Aucune lecture ne dépend d'une vérité ouverte (le script est fixe et poussé) ;
les résultats sont identiques à ceux qu'aurait donnés le déroulé prévu.
