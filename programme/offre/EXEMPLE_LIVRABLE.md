# Exemple de livrable — essai de prix (ventes simulées)

Les deux rapports ci-dessous sont produits tels quels par l’outil, sur des ventes **simulées** (`programme/missions/essai-prix/exemple-ventes-simulees.csv`). Ils montrent la forme du livrable, pas un résultat client.

## 1. Avant l’essai : le plan

```
Plan d’essai de prix — xeqagi9
Prix de référence : 12,04 € (médiane des 14 derniers jours) · vendu 178 jours sur 182

Semaine   du           au           prix        écart
   1      2026-07-03   2026-07-09       9,63 €   -20 %
   2      2026-07-10   2026-07-16      12,04 €   0 %
   3      2026-07-17   2026-07-23      15,05 €   +25 %
   4      2026-07-24   2026-07-30       9,63 €   -20 %
   5      2026-07-31   2026-08-06      15,05 €   +25 %
   6      2026-08-07   2026-08-13      15,05 €   +25 %
   7      2026-08-14   2026-08-20       9,63 €   -20 %
   8      2026-08-21   2026-08-27      12,04 €   0 %

Décision possible à partir du 2026-08-28, avec l’export des ventes de la période et le coût unitaire.

Ce que cet essai permet et ne permet pas :
  - Méthode éprouvée en simulation seulement (160 entreprises simulées, trois tests) ; jamais encore sur une entreprise réelle.
  - Établi en simulation : le prix choisi après l’essai fait mieux qu’une règle fixe pendant qu’on l’applique.
  - NON établi : que l’essai se rembourse face à « ne rien changer ». En simulation, près d’une entreprise sur deux y perd.
  - Une semaine à prix bas peut vendre plus que le réapprovisionnement ne soutient : la hausse des ventes est alors surestimée.
  - Pendant l’essai, rien d’autre ne doit changer sur ce produit (promotion, publicité, rupture), sinon la lecture est faussée : sur des ventes réelles de grande distribution, l’effet lu sur le prix venait surtout des promotions.
```

## 2. Après l’essai : la décision

```
Décision de prix — xeqagi9 (essai du 2026-07-03 au 2026-08-27)
Coût unitaire : 5,55 € · prix de référence : 12,04 €

Prix essayé    jours   ventes par jour   marge par jour
     9,63 €      21            19,619          80,05 €   ← retenu
    12,04 €      14             8,643          56,09 €
    15,05 €      21                 3          28,50 €

Prix retenu : 9,63 € (au lieu de 12,04 €).

Portée de cette décision :
  - Méthode éprouvée en simulation seulement (160 entreprises simulées, trois tests) ; jamais encore sur une entreprise réelle.
  - Établi en simulation : le prix choisi après l’essai fait mieux qu’une règle fixe pendant qu’on l’applique.
  - NON établi : que l’essai se rembourse face à « ne rien changer ». En simulation, près d’une entreprise sur deux y perd.
  - Une semaine à prix bas peut vendre plus que le réapprovisionnement ne soutient : la hausse des ventes est alors surestimée.
  - Pendant l’essai, rien d’autre ne doit changer sur ce produit (promotion, publicité, rupture), sinon la lecture est faussée : sur des ventes réelles de grande distribution, l’effet lu sur le prix venait surtout des promotions.
```
