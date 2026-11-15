# Offre commerciale — brouillon de travail

**Rien de ce document n'est publié ni envoyé.** Décision du propriétaire (15 novembre 2026) : le travail technique
et la préparation de l'offre continuent sans attendre l'immatriculation ; la structure sera régularisée avant le
démarrage de l'activité commerciale. Tout ce qui est entre crochets reste à décider par lui.

## 1. En une phrase

> J'aide les petites entreprises à décider un prix ou à lire leurs mesures, avec une règle simple : la question et
> le critère de réussite sont écrits avant de regarder les résultats, et ce que les données ne permettent pas de
> dire est dit.

Ce qui nous distingue n'est pas un algorithme plus fort que les autres — nous l'avons mesuré, ce n'est pas le cas
(§ 6). C'est la méthode : protocole écrit d'avance, témoins, résultat négatif rendu comme tel.

## 2. Les trois prestations

### A. Essai de prix — la prestation phare

**Pour qui** : un commerce ou un négoce qui vend un produit au moins un jour sur deux et qui ne sait pas dans quel
sens bouger son prix.

**Ce que le client fournit** : l'export de ses ventes des six derniers mois (date, produit, quantité, montant, et
ses promotions s'il les note), le coût d'achat du produit.

**Déroulé**

| Étape | Durée | Livrable |
|---|---|---|
| 1. Vérification | sous 48 h, sans engagement | « l'essai est possible sur tel produit » ou « il ne l'est pas, et pourquoi » |
| 2. Plan | 1 jour | huit semaines, un prix par semaine, avec les prix exacts et les points à régler avant de lancer |
| 3. Essai | 8 semaines chez le client | un point à mi-parcours si le client envoie ses ventes |
| 4. Décision | 2 jours | le prix à retenir, la table des ventes par prix, les réserves sur la lecture |

**Ce que nous refusons** : un produit vendu trop rarement ; une décision sans coût d'achat ; une conclusion tirée
de l'historique seul. Un exemple de livrable est dans `EXEMPLE_LIVRABLE.md`.

### B. Trouver une loi dans vos mesures

**Pour qui** : un atelier, un laboratoire, un bureau d'études qui a au moins une cinquantaine de mesures et veut
une formule pour prédire ou régler.

**Livrable** : la formule, vérifiée sur des mesures mises de côté ; elle n'est rendue que si elle prédit mieux
qu'une droite et qu'une constante. Sinon le client reçoit « pas de loi dans ces données », et la raison.

### C. Contre-lecture d'une analyse ou d'un historique

**Pour qui** : une entreprise qui s'apprête à décider sur la foi d'un tableau de bord ou d'une étude.

**Livrable** : le calcul refait, ce qui se reproduit, ce qui est fragile. Exemple type : distinguer l'effet d'un
prix de celui de la promotion qui l'accompagne.

## 3. Ce que nous avons le droit de dire, et ce qui est interdit

| Nous pouvons dire | Preuve |
|---|---|
| Nous reconstituons le coût d'un produit depuis les écritures | exact sur les 160 entreprises simulées des trois tests |
| Après un essai, le prix choisi fait mieux qu'une règle fixe pendant qu'on l'applique | mesuré deux fois, 120 entreprises simulées |
| Un essai de 8 semaines vaut mieux qu'un essai de 13 | mesuré deux fois |
| Notre essai fait jeu égal avec la méthode de référence publiée (bandit de Thompson) sur six mois | 60 entreprises simulées, écart de 0,6 point |
| Lire l'historique ne dit pas quel prix fixer : la promotion vend plus que le prix | ventes réelles, 83 magasins |
| Une loi n'est rendue que si elle tient sur des mesures non vues | 9 lois retenues sur 9 ont tenu, données réelles |

| Nous ne devons jamais dire | Pourquoi |
|---|---|
| « Un essai de prix rapporte plus que de ne rien changer », **sans dire que c'est une simulation et une moyenne** | en simulation : +6,6 points en moyenne sur 180 entreprises, mais de 2 à 12 points selon le lot, et un tiers des entreprises y perdent |
| « Vous gagnerez X % » | en simulation, près d'une entreprise sur deux y perd |
| « Notre méthode bat les meilleures du marché » | voir § 6 |
| « Déjà éprouvé chez des clients » | aucun client à ce jour |

## 4. Prix — proposition à valider

Repères de marché, sources non officielles mais concordantes : un analyste de données indépendant facture en France
de l'ordre de 350 à 500 € par jour en début d'activité et 450 à 650 € confirmé ; le baromètre Free-Work relève
348 € par jour en direct.

Proposition, à discuter : des **forfaits à périmètre fermé**, calculés à 400 € par jour, soit le bas de la
fourchette — nous n'avons aucune référence client.

| Prestation | Jours | Forfait proposé (HT) |
|---|---:|---:|
| A. Essai de prix : vérification | — | gratuite |
| A. Essai de prix : plan | 1 | [400 €] |
| A. Essai de prix : décision et rapport | 2 | [800 €] |
| B. Loi dans vos mesures | 2 | [800 €] |
| C. Contre-lecture | 1 à 3 | [400 à 1 200 €] |

Deux règles proposées avec ces prix :

- **La décision n'est facturée que si l'essai se lit.** Si l'outil refuse (ventes hors plan, promotions, produit
  devenu trop rare), le client ne paie que le plan. C'est une garantie que nous pouvons tenir.
- **Première mission** : [prix réduit de moitié, en échange du droit de citer le cas, anonymisé].

Aucune garantie de gain : nous ne pouvons pas la tenir.

## 5. Avant le démarrage commercial

Ce qui est prêt : les trois outils de livraison (`essai-prix-client`, `loi`, contre-lecture à la main), le dossier
de missions, six exemples de travaux, un exemple de livrable.

Ce qui reste, dans l'ordre :

1. **Immatriculation.** D'après les sources lues (sites d'information, pas l'administration — à vérifier sur
   le site de l'Urssaf) : prospecter avant l'immatriculation n'est pas interdit ; un devis est toléré une fois la
   demande déposée, avec une mention provisoire ; **facturer sans SIRET est interdit**. Donc : préparer et montrer
   l'offre est possible dès maintenant ; signer et encaisser attend le numéro.
   **Deux autres voies légales pour facturer sans créer d'entreprise**, à étudier si l'on veut un premier client
   avant l'immatriculation (sources : sites d'information, conditions à vérifier auprès de la structure choisie) :
   - le **portage salarial** : une société de portage signe avec le client, facture, et reverse un salaire ; frais
     de 5 à 10 % du chiffre d'affaires, environ la moitié du montant facturé en net ; il existe un tarif
     journalier plancher, de l'ordre de 250 à 300 € — compatible avec les forfaits du § 4 ;
   - la **coopérative d'activité et d'emploi**, avec un contrat d'appui au projet d'entreprise : il est fait pour
     tester une activité sans créer de structure, en gardant ses droits ; contribution d'environ 10 % du chiffre
     d'affaires.
   Dans les deux cas c'est une signature du propriétaire, pas la mienne.
2. **Prix** : valider ou corriger le § 4.
3. **Moyen d'encaissement** : aucun n'est relié aujourd'hui.
4. **Conditions de mission** : un modèle court à écrire (périmètre, délai, confidentialité, propriété des données).
5. **Données des clients** : elles restent dans `prive/`, jamais dans le dépôt ; le dire au client par écrit.
6. **Profil sur la plateforme d'indépendants** : toujours « à valider » au mandat.

## 6. Où nous en sommes face aux meilleures méthodes — mesuré, pas supposé

Voir `programme/sota/` pour la découverte de lois et `programme/t3d/` pour les essais de prix. Les résultats y
sont consignés tels qu'ils sortent, favorables ou non ; ce paragraphe sera complété quand les deux mesures en
cours seront terminées.
