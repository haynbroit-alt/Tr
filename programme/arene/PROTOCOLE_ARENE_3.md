# Protocole ARÈNE-3 — décider un prix : l'arrêt anticipé défend sa place

Écrit et poussé **avant** son code et avant toute exécution. Troisième tour de l'arène (`REGLES.md`).

## 1. Tenant

La **chaîne prudente à arrêt anticipé** (essai lu à quatre semaines ; décision immédiate si le meilleur prix essayé
dépasse le deuxième d'au moins 20 % en marge par jour, sinon huit semaines). Elle a pris la place à ARÈNE-2 de
peu : +0,8 point, t = 2,17.

## 2. Prétendants

- **`sans arrêt`** : la chaîne prudente de huit semaines, tenant détrôné. Si l'avance d'ARÈNE-2 était un hasard,
  elle doit la reprendre ou au moins l'annuler.
- **`arrêt à trois semaines`** : même règle, lue une semaine plus tôt. Les trois premières semaines du plan
  couvrent déjà tous les niveaux essayés. Seuil de 20 % inchangé, fixé ici.

## 3. Terrain

Monde de T3e à ARÈNE-2. **Graines 8401 à 8600** (200 entreprises neuves). Exécution unique. Référence : prix tenu.

## 4. Mesure et succession

Comme ARÈNE-1 et ARÈNE-2 : écarts appariés avec le tenant, deux prétendants, **seuil t = 1,97** ; prend la place :
avantage établi et pas plus de perdantes face à prix tenu ; relégué : désavantage établi ; en lice : sinon.

**Ce tour décide aussi d'une question pratique** (posée au propriétaire après ARÈNE-2) : si le tenant n'est pas
détrôné et que `sans arrêt` ne fait pas mieux que lui en moyenne, l'arrêt anticipé aura tenu deux tours et pourra
entrer dans l'outil de livraison.

## 5. Attendus, écrits avant toute exécution

1. Le tenant garde sa place. `sans arrêt` : derrière de 0 à 1,5 point, **en lice** (non relégué) — l'avance est
   réelle mais trop mince pour s'établir deux fois de suite.
2. `arrêt à trois semaines` : s'arrête plus souvent, se trompe plus souvent ; écart entre −1,5 et +1 point ; en lice.

## 6. Domaine de validité

Simulation, un monde, un objet par entreprise ; coût unitaire nécessaire.

---

## 7. Vérification du code (graines 241 à 246) — écrit et poussé avant le tour

`src/problemes/arene-3.js` tourne sur six entreprises déjà vues. Rien n'a été changé aux prétendants, au seuil ni à
la règle de succession.

Tour : `ARENE3_TEST=exécution-unique node bin/commun.js executer arene-3`, une seule fois.
