# Dossier « missions d'analyse de données » — brouillons

Rien de ce dossier n'est publié ni envoyé. Tout ce qui est entre crochets est à compléter ou à corriger par le
propriétaire : une phrase fausse sur son parcours ne doit jamais partir.

## 1. Avant tout : l'immatriculation (geste du propriétaire)

La plateforme étudiée exige un numéro SIRET. Sans lui, le profil ne peut pas être ouvert.

1. Aller sur le guichet unique, `formalites.entreprises.gouv.fr`, cliquer sur « Déclarer », s'identifier.
2. Déclarer une entreprise individuelle et choisir le régime micro-entrepreneur pendant la déclaration.
3. Pièces demandées d'après les sources lues : numéro de Sécurité sociale, pièce d'identité, déclaration de
   non-condamnation.
4. À réception du SIRET : ouvrir l'espace en ligne de l'Urssaf, puis le profil sur la plateforme.

Ce qui est sourcé : la démarche est gratuite et entièrement en ligne. Ce qui ne l'est pas : le délai d'obtention du
SIRET (non trouvé) ; le classement exact de l'activité, libérale ou commerciale, qui se choisit pendant la
déclaration et conditionne le régime — à vérifier au moment de déclarer.

À vérifier par le propriétaire avant de déclarer, parce que cela dépend de sa situation et que ce dossier n'est pas
un conseil juridique : effet sur d'éventuelles allocations, clause d'exclusivité d'un contrat de travail en cours,
cotisations dues sur le chiffre d'affaires encaissé.

Sources : economie.gouv.fr/entreprises/gerer-sa-micro-entreprise/comment-creer-une-micro-entreprise ·
formalites.entreprises.gouv.fr/preparer.php ·
autoentrepreneur.urssaf.fr/portail/accueil/creer-mon-auto-entreprise/guichet-unique.html

## 2. Profil (brouillon)

**Titre** : Analyse de données et plans d'essais — résultats reproductibles, taux d'erreur annoncé

**Présentation**

> [Une ou deux phrases vraies sur votre parcours.]
>
> J'aide les petites entreprises à décider à partir de leurs données, sans leur promettre plus que ce que les
> données permettent. Je travaille avec trois moteurs d'analyse que j'ai fait développer avec l'aide d'une IA de
> programmation, et dont les bancs d'essai sont publics et reproductibles. Chaque mission suit la même règle : la
> question et le critère de succès sont écrits avant de regarder les résultats, et un résultat négatif est rendu
> comme tel.
>
> Ces moteurs ont été éprouvés sur des données simulées ; je cherche mes premières missions sur données réelles et
> je le dis.

**Ce que je propose**

1. *Plan d'essais de prix ou de promotions* — quels essais mener, dans quel ordre et sur quelle durée, pour qu'une
   conclusion soit possible avec le budget disponible ; règle de décision fixée d'avance.
2. *Recherche d'une loi dans vos données* — par exemple le lien entre prix et quantités vendues, avec ce que les
   données ne permettent pas de dire.
3. *Relecture d'une analyse existante* — refaire le calcul, vérifier qu'il se reproduit, dire où il est fragile.

**Tarif** : [à fixer par vous — aucun tarif de marché sourcé n'a été trouvé ; une première mission courte, à
périmètre fermé, limite le risque des deux côtés.]

## 3. Quatre exemples de travaux (trois sur données simulées, un sur mesures réelles)

Aucun n'est un travail pour un client. Chacun se relit dans les dépôts.

**A. Un plan d'essais actif retrouve bien plus de lois qu'une observation passive.**
Sur 200 mondes simulés jamais vus pendant la mise au point, 44 arrivaient jusqu'au pari : le plan actif en confirme
37 (84 %), contre 23 % en observation passive ; 4 fausses confirmations sur 404. Limite : mondes simulés ; seuls 44
mondes sur 200 vont jusqu'au pari. Source : dépôt CORTEX, `research/v6/RESULTATS_P3.md`.

**B. Retrouver une loi de demande dans des ventes comptées à l'unité.**
Sur des comptages journaliers simulés, 105 bonnes lois retrouvées sur 133 effets détectables (79 %) ; 2 fausses lois
sur 50 mondes sans effet. Limites : la précision baisse quand le bruit monte (97 % des lois à bruit faible, 83 % à
bruit plus fort, sur graines neuves du banc général) ; et quand les données sont fournies telles quelles, sans
pouvoir demander de nouvelles mesures, le moteur ne signale qu'une forme fausse sur deux environ (13 sur 28) — son
niveau de confiance n'est alors pas une garantie. Source : dépôt GALILÉE, `bench/COMPTAGES_BASE.md`,
`RESULTATS_G1.md`, `RESULTATS_G4.md`.

**D. Prédire des mesures réelles jamais vues — le seul exemple sur données réelles.**
Sur 15 jeux de mesures de laboratoire publiés par le NIST avec un modèle certifié, une mesure sur quatre étant mise
de côté : la loi trouvée prédit les mesures non vues au niveau du modèle certifié pour 8 jeux (dont un où une simple
constante suffit). Sur un jeu de 151 mesures, elle se trompe dix fois moins que le modèle certifié. Limites : les 7
jeux de 54 mesures ou plus réussissent tous, un seul des 8 jeux plus petits — donc pas de mission « trouver la loi »
sous une cinquantaine de mesures ; les lois trouvées prédisent mais ne s'interprètent pas toujours ; interpolation
seulement ; le niveau de confiance affiché par le moteur n'a prévenu d'aucun échec. Source : dépôt commun,
`programme/missions/reel/RESULTATS_REEL.md`.
Outil de livraison prêt : `node bin/commun.js loi <fichier.csv>` met une mesure sur quatre de côté et ne retient la
loi que si elle y prédit mieux qu'une droite et qu'une constante (calculé après coup sur ces 15 jeux : 5 échecs sur
7 écartés, 2 passent encore).

**C. Repérer des flux cachés dans les écritures d'une entreprise.**
Sur 100 entreprises simulées de développement : 80 flux cachés retrouvés sur 95 ; 1 entreprise sans flux caché
touchée à tort sur 34. Limite assumée : l'erreur médiane sur le profit est de 2,9 % pour un objectif de 2 %, et le
test final n'a pas été exécuté. Source : dépôt LAVOISIER, `bench/DEV_M0_BILAN.md`, `PROTOCOLE_M0.md` § 9.

## 4. Première réponse à une demande (brouillon)

> Bonjour [prénom],
>
> Merci pour votre message. Pour vous dire si je peux vous être utile, j'ai besoin de trois choses : la décision que
> vous devez prendre, les données dont vous disposez (période, nombre de lignes, ce qu'elles mesurent), et la date à
> laquelle il vous faut une réponse.
>
> Je vous proposerai ensuite un périmètre fermé : la question exacte, le critère qui dira si la réponse est fiable,
> et un prix. Si vos données ne permettent pas de conclure, je vous le dirai avant de commencer.
>
> [votre nom]

## 5. Essai et abandon

Succès : au moins une demande de mission en 28 jours de profil en ligne. Abandon : aucune demande, ou une demande
qui exige une compétence absente. Un euro n'est compté qu'une fois une mission payée.
