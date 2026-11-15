# Protocole T3e — la même confrontation, avec le hasard commun

Écrit et poussé **avant** son code et avant toute exécution. Suite de `programme/t3d/RESULTATS_T3D.md` et de L2c
(`haynbroit-alt/A`, `PROTOCOLE_L2C.md`).

## 1. Question

Sur trois lots d'entreprises, l'avantage de notre chaîne sur « ne rien changer » a valu 8,8, puis 1,6, puis 11,6
points. Cette dispersion venait d'une contrainte du simulateur que L2c a levée : deux relances de la même
entreprise ne partageaient pas leur hasard. Lever une contrainte ne vaut que si cela se mesure.

1. **Avec le hasard commun, les écarts entre bras sont-ils nettement moins incertains, à nombre d'entreprises
   égal ?**
2. Dans ce monde, la chaîne et le bandit battent-ils toujours les règles aveugles, et l'un bat-il l'autre ?

Marge simulée ; aucun euro réel.

## 2. Dispositif

Celui de T3d, à l'identique (mêmes bras, même calendrier, même mesure), dans le monde « demande sensible » **avec
l'option `alea: 'commun'`**. Ce monde n'est pas celui de T3d : une graine n'y produit pas la même entreprise.

## 3. Graines

- Mise au point : 241 à 260 (les graines 241 à 250 ont servi aux tests de L2c ; aucune décision n'y a été prise).
- Test : **6221 à 6280**, soit 60 entreprises comme dans T3d, exécution unique.

## 4. Critères, sur le test

Écarts appariés sur le gain total, test unilatéral à 5 %, comme dans T3d.

- **V1 — la contrainte levée a de la valeur.** L'erreur type de l'écart « chaîne − prix tenu » est au plus la
  **moitié** de celle de T3d (3,05 points pour 60 entreprises).
- **E1 — la chaîne fait mieux que la meilleure règle aveugle.**
- **E2 — le bandit fait mieux que la chaîne**, ou **E2 inverse**, ou « pas de différence établie ».
- **E3 — la chaîne sans engagement fait mieux que la chaîne.**

Les seuils ne seront pas retouchés. Un critère manqué est publié comme tel.

## 5. Attendus, écrits avant toute mise au point

1. **V1 tenu** : erreur type divisée par deux au moins. C'est le pari de ce protocole.
2. E1 tenu, avec un écart entre 4 et 10 points.
3. E2 : pas de différence établie, écart de moins de 2 points.
4. E3 : pas de différence établie.
5. Le meilleur bras aveugle est encore « prix tenu ».

## 6. Limites écrites d'avance

- V1 compare deux mondes différents (T3d sans hasard commun, T3e avec) : la dispersion entre entreprises n'y est
  pas forcément la même, et une partie de l'écart d'erreur type peut venir de là.
- Le désordre du journal observé diffère toujours d'une relance à l'autre : les décisions des bras restent un peu
  bruitées par la saisie.
- Simulation, un monde, un objet par entreprise, 26 semaines.
