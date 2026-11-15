# Registre des contraintes

Consigne du propriétaire (15 novembre 2026) : ne tenir aucune contrainte pour éternelle. Pour chacune : sa
fonction, comment la supprimer, la remplacer ou la dépasser, puis faisabilité, sécurité et valeur. Ce registre se
complète ; une contrainte n'en sort que levée ou mesurée infranchissable.

| Contrainte | Sa fonction | La dépasser | Faisable | Sûr | Valeur | État |
|---|---|---|---|---|---|---|
| **Il faut un SIRET pour encaisser** | pouvoir facturer légalement | portage salarial (la société de portage facture ; 5 à 10 % de frais, tarif journalier plancher de 250 à 300 €) ; coopérative d'activité et d'emploi avec contrat d'appui (tester l'activité sans créer de structure, environ 10 % du chiffre d'affaires) | oui, par une signature du propriétaire | cadres légaux ; conditions exactes à vérifier auprès de la structure et de l'Urssaf | forte : premier euro sans créer d'entreprise | **proposé au propriétaire** (`offre/OFFRE.md`, § 5) |
| **Le hasard du simulateur n'est pas le même d'une relance à l'autre** (je l'avais écrit comme une limite définitive dans L2) | l'identité à l'octet protège les mesures de M0 | une option de hasard commun : chaque tirage qui dépend du prix vient d'un flux propre à l'objet et au jour ; sans l'option rien ne change | oui : une quinzaine de lignes dans le simulateur | oui : option, identité à l'octet conservée | forte : deux relances ne diffèrent plus que par l'effet du prix ; chaque essai demande bien moins d'entreprises pour trancher | **levée** (L2c) : avec l'option, les autres objets sont identiques d'une relance à l'autre dans 10 entreprises sur 10, contre 0 sans ; pas encore utilisée dans un essai |
| **L'essai coûte ce que la décision rapporte** | il faut de l'information avant de décider | un bandit, qui apprend en vendant (mesuré : T3d) ; des essais simultanés dans plusieurs points de vente, qui ne coûtent pas de temps ; des niveaux de prix plus serrés | bandit : oui ; plusieurs points de vente : dépend du client | oui | à mesurer | **bandit mesuré** (`t3d/`) : il fait jeu égal avec notre chaîne (+0,6 point, non établi) ; le reste non essayé |
| **Aucune vente réelle sous la main** | prouver hors simulation | jeux publics (fait : mesures du NIST, ventes de Dominick's) ; un premier client | jeux publics : oui | données publiques, non copiées | moyenne : aucun n'est un essai conduit par nous | **partiellement levée** |
| **PySR, l'autre référence mondiale, ne s'installe pas ici** | le réseau de l'environnement n'autorise que certains hôtes | faire ouvrir les deux hôtes de téléchargement de Julia | oui, avec l'accord du propriétaire | hôtes officiels | faible à moyenne : Operon est déjà mesuré | **non demandé** |
| **Rien ne part au nom du propriétaire ; dépense plafonnée à 0 €** | le protéger d'un engagement non voulu | ne se lève pas par moi ; se remplace par une validation action par action, déjà en place (« à valider ») | — | — | — | **tenue telle quelle** |
| **Protocole avant le code, moteurs gelés, graines réservées** | que chaque chiffre soit une preuve | ne se supprime pas ; son coût se réduit par des options à identité d'octet (L2, L2b, L2c) | — | — | — | **tenue telle quelle** |
| **Plafonds du GARDIEN** | maîtriser la dépense de calcul | ne se lève que par le propriétaire | — | — | — | **tenue** ; l'espace commun approche de son plafond |

## Pistes qui semblent illogiques, notées pour ne pas les perdre

- **Apprendre le prix d'un produit sans jamais toucher à son prix** : en essayant sur un produit voisin, ou en lisant
  les semaines où un fournisseur a changé son tarif. Non vérifié ; l'essai PRIX-RÉEL montre que l'historique seul
  trompe.
- **Vendre le refus** : la prestation la plus sûre est peut-être de dire à un client que ses données ne permettent
  pas de conclure, avant qu'il ne paie une étude. C'est déjà la première étape, gratuite, de l'offre.
- **Laisser le client conduire l'essai seul** : l'outil rend le plan et la décision ; la mission pourrait devenir un
  abonnement à l'outil plutôt qu'une prestation. Non étudié : cela change le modèle économique et la responsabilité.
