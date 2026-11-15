# Résultats T3g — un essai qui n'essaie pas les prix ruineux

Exécution unique du 15 novembre 2026, graines 6401 à 6700 (300 entreprises parcourues, aucune écartée), dossier
`essai-prix#T3G` du registre, détail dans `programme/t3g/test.json`. Protocole : `PROTOCOLE_T3G.md`, poussé avant le
code. Marge simulée ; aucun euro réel.

## 1. Critères, sur les 54 entreprises concernées

| Critère | Résultat | Verdict |
|---|---|---|
| **G1** — la chaîne prudente fait mieux que la chaîne | +17,6 points, t = 3,67 (seuil 1,684) | **tenu** |
| **G2** — la chaîne prudente fait mieux que prix tenu | +52,9 points, t = 2,14 | **tenu** |
| **G3** — pas plus de perdantes face à prix tenu | prudente 14, chaîne 24 | **tenu** |

Gain moyen sur la marge de l'objet piloté : chaîne prudente 60,0 % ; chaîne 42,4 % ; prix tenu 7,1 % ; +25 %
d'emblée 69,1 %.

## 2. Le résultat ne tient pas à quelques entreprises

Ces moyennes sont tirées vers le haut par des entreprises à marge très mince, où tout gain est énorme en
proportion (une vend sous son coût : marge 0,93). Lectures qui n'en dépendent pas :

- la chaîne prudente fait mieux que la chaîne dans **52 entreprises sur 54**, moins bien dans 2 (de 1,3 et 6,2
  points) ;
- écart médian : **+10,5 points** ; gain médian : prudente 13,7 %, chaîne 4,3 %, prix tenu 0,2 % ;
- sans l'entreprise au plus fort écart (215 points) : +13,9 points, t = 4,50.

## 3. Ce qui se passe

- 36 entreprises (marge sous 1,42 environ) : le plan prudent n'essaie plus aucune baisse. Écart sur la chaîne :
  +23,1 points (t = 3,29).
- 18 entreprises (marge entre 1,42 et 1,51) : la baisse de 20 % est remplacée par une baisse de 10,6 %. Écart :
  +6,7 points (t = 3,95).
- Les décisions finales ne diffèrent que dans 12 entreprises sur 54 : **l'essentiel du gain vient des semaines
  d'essai elles-mêmes**, qui ne se passent plus à un prix presque coûtant.
- La chaîne avait conclu « −20 % » dans 5 de ces entreprises ; dans les 5, la chaîne prudente fait mieux. Une
  baisse que l'arithmétique du coût écarte était bien une mauvaise décision, prise sur du bruit.
- « +25 % d'emblée » reste 9,1 points devant la chaîne prudente, non établi (t = 1,21).

## 4. Attendus, relus

| Attendu | Constat |
|---|---|
| 20 à 32 % d'entreprises concernées | 18,0 % (54 sur 300) — **faux**, un peu en dessous |
| G1 tenu, 5 à 14 points | tenu, 17,6 points (médiane 10,5) — tenu, **au-dessus de ma fourchette** |
| G2 tenu | tenu — **juste** |
| G3 tenu | tenu — **juste** |
| la prudente reste derrière « +25 % d'emblée » | 9,1 points derrière, non établi — **sens juste, non prouvé** |

## 5. Rapporté à l'ensemble

Sur les 300 entreprises, 246 ne sont pas concernées et leur essai ne change pas. L'effet moyen sur l'ensemble est de
**+3,2 points** de gain. Pour mémoire, la chaîne gagnait 6,5 points sur prix tenu en cumul (320 entreprises).

## 6. Limites

- Simulation. Le simulateur tire la sensibilité de la demande entre 0,8 et 5 : la règle (seuil 4) n'y interdit
  presque jamais une baisse qui aurait été bonne. Chez un client dont le produit est très sensible au prix, elle
  peut en interdire une.
- La population est choisie par la règle : rien n'est dit des entreprises à marge plus forte.
- Les pourcentages rapportés à une marge de départ très mince sont instables ; les lectures du § 2 sont celles à
  retenir.

## 7. Ce que cela change à la stratégie

1. **La chaîne retenue change** : son plan d'essai écarte désormais les baisses dont le seuil de rentabilité est
   hors d'atteinte. C'est la première amélioration de la chaîne qui tienne à un test depuis T3b, et elle vient
   d'une contrainte regardée en face : « il faut essayer pour savoir » n'oblige pas à essayer n'importe quoi.
2. **Elle entre dans l'outil de livraison** (`essai-prix-client plan`), où elle repose sur une arithmétique vraie
   chez tout client : baisser de p à p′ ne rapporte que si les ventes sont multipliées par (p − c) ÷ (p′ − c).
3. **Ce qu'on peut dire à un client** : « avant l'essai, nous écartons les prix qui ne peuvent pas être rentables
   compte tenu de votre coût ». Ce qu'on ne dit toujours pas : un gain chiffré.
4. Reste ouvert : la zone du milieu (marge entre 1,5 et 2,1), où l'essai fait perdre près d'une entreprise sur deux
   et où ni le taux de marge ni cette règle ne disent rien.
