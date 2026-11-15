# L'arène — aucune méthode n'a de place définitive

Consigne du propriétaire (15 novembre 2026) : ne donner aucune place définitive aux objets existants ; laisser
entrer les approches extérieures, même inattendues ; que chaque méthode fasse ses preuves, que les meilleures
évoluent et que les moins performantes cèdent leur place. Le but n'est pas de perfectionner ce qui existe, mais de
découvrir ce qui pourrait le dépasser.

## Règles

1. **Une tâche, un tenant.** Pour chaque tâche mesurable (décider un prix, trouver une loi, lire un journal), une
   seule méthode tient la place : celle qui sert dans les livrables. Elle la tient **jusqu'au prochain tour**, pas
   au-delà. Les moteurs GALILÉE, CORTEX et LAVOISIER y sont des méthodes comme les autres.
2. **Tout le monde peut entrer** : une idée interne, une méthode publiée, un outil extérieur, une règle écrite par
   l'atelier. Une seule condition : être décrite entièrement **avant** le tour, sans réglage sur ses entreprises.
3. **Un tour** = un protocole poussé avant le code, des entreprises ou des jeux neufs, une exécution unique, la
   même mesure pour tous.
4. **Succession.** Un prétendant prend la place s'il fait mieux que le tenant (écart apparié, test unilatéral à
   5 % partagé entre les prétendants du tour) **et** ne fait pas perdre plus d'entreprises que lui. Le tenant
   détrôné devient prétendant du tour suivant : il peut revenir.
5. **Relégation.** Un prétendant dont il est établi qu'il fait moins bien que le tenant sort de la liste. Il n'y
   revient que modifié, et dit en quoi.
6. **En lice.** Ni l'un ni l'autre : il reste prétendant.
7. **Domaine de validité.** Chaque méthode porte ce qu'elle suppose du monde. Une méthode qui gagne en simulation
   sur une hypothèse que le réel ne tient pas (historique sans promotions, par exemple) tient la place **en
   simulation** et ne sert dans aucun livrable tant que cette hypothèse n'est pas vérifiée chez le client.
8. Le classement est tenu dans `classement.json` : place, tours joués, résultat de chaque tour, domaine de validité.

## Ce que l'arène ne fait pas

Elle ne dit pas qu'une méthode est bonne, seulement qu'aucune autre n'a encore fait mieux sur ce terrain. Et un
terrain simulé ne vaut pas un client.
