# Protocole ÉTALONNAGE — l'atelier sait-il trouver quand il y a quelque chose, et se taire sinon ?

Écrit et poussé **avant** son code et avant tout calcul. Suite de `RESULTATS_T3H.md` § 5 : un refus ne prouve pas
que l'atelier sache trouver. On le met devant des cas dont la réponse est connue.

## 1. Matière

Les 199 entreprises de `dev.json` (traits et gains réels des huit actions). Atelier complet, tel que gelé dans
`src/atelier.js` : rien n'y est modifié.

## 2. Deux épreuves, 200 répétitions chacune (hasard à graine fixe)

- **Rien à trouver.** Les traits sont redistribués au hasard entre les entreprises : ils ne disent plus rien des
  gains. L'atelier doit refuser. On compte les **fausses inventions** (il rend une règle).
- **Quelque chose à trouver.** Traits redistribués de même, puis un effet est planté : pour les entreprises dont
  un trait (tour à tour `m`, `e`, `t`, `bruit`) est sous sa médiane, l'action `tenu` est mise à δ au-dessus de
  `chaîne`. La bonne règle est connue : « si ce trait est sous sa médiane, ne pas essayer ». δ = 5, 10 et 20
  points. **Trouvé** = l'atelier ne refuse pas, envoie vers `tenu` au moins 70 % des entreprises visées et au plus
  30 % des autres.

## 3. Critères

- **E1** — fausses inventions : au plus 10 % des 200 répétitions.
- **E2** — effet de 20 points : trouvé dans au moins 80 % des répétitions.
- Donné sans critère : 5 et 10 points ; la profondeur retenue.

## 4. Attendus, écrits avant tout calcul

E1 tenu (5 à 8 %). E2 tenu (plus de 90 %). À 10 points : trouvé une fois sur deux environ. À 5 points : rarement.

## 5. Limites

Effets plantés simples (un trait, un seuil à la médiane) : c'est le cas le plus favorable à des arbres. Un effet
réel peut dépendre de plusieurs traits à la fois, ou d'un trait que l'atelier ne lit pas.
