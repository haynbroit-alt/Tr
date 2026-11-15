# Protocole SOTA-LOIS-2 : lecture des critères Q1 et Q2 (test des signes unilatéral à 5 %) sur 31 puis 29 jeux.
# Usage : python3 scripts/sota-lois-2-analyse.py programme/sota/sota-lois-2.json
# Égalité : erreurs égales à un millionième près en relatif ; les égalités sortent du test des signes.
import json, sys
from math import comb
from statistics import median

DOUBLONS = {'datasets.USAccDeaths', 'datasets.UKDriverDeaths'}   # seconds des deux paires, protocole § 8
J = json.load(open(sys.argv[1]))['jeux']
p_signes = lambda g, n: sum(comb(n, k) for k in range(g, n + 1)) / 2 ** n if n else 1.0

def duel(jeux, a, b):
    ga = gb = eg = 0
    for r in jeux:
        x, y = r[a]['erreur'], r[b]['erreur']
        if x is None and y is None: eg += 1
        elif y is None or (x is not None and x < y * (1 - 1e-6)): ga += 1
        elif x is None or y < x * (1 - 1e-6): gb += 1
        else: eg += 1
    n = ga + gb
    return {'devant': ga, 'derriere': gb, 'egalites': eg, 'p': round(p_signes(ga, n), 4), 'p_inverse': round(p_signes(gb, n), 4)}

def lire(jeux):
    noms = ('galilee', 'operon_court', 'operon_long', 'gplearn')
    lon = lambda r, k: r[k]['noeuds'] if k == 'galilee' else median(x for x in r[k]['longueurs'] if x is not None)
    bat = lambda r, k: r[k]['erreur'] is not None and r[k]['erreur'] < r['temoin'] * (1 - 1e-6)
    return {'jeux': len(jeux), 'Q1_galilee_contre_operon_court': duel(jeux, 'galilee', 'operon_court'), 'Q2_galilee_contre_operon_long': duel(jeux, 'galilee', 'operon_long'),
            'galilee_contre_gplearn': duel(jeux, 'galilee', 'gplearn'), 'operon_court_contre_operon_long': duel(jeux, 'operon_court', 'operon_long'),
            'longueur_mediane': {k: median(lon(r, k) for r in jeux) for k in noms}, 'bat_le_meilleur_temoin': {k: sum(bat(r, k) for r in jeux) for k in noms},
            'personne_ne_bat_le_temoin': sum(not any(bat(r, k) for k in noms) for r in jeux), 'meilleur_du_jeu': {k: sum(all(r[k]['erreur'] is not None and (r[o]['erreur'] is None or r[k]['erreur'] <= r[o]['erreur']) for o in noms) for r in jeux) for k in noms},
            'erreur_relative_au_temoin_mediane': {k: round(median((r[k]['erreur'] if r[k]['erreur'] is not None else float('inf')) / r['temoin'] for r in jeux), 3) for k in noms},
            'pannes': {k: sum(len(r[k].get('pannes', [])) for r in jeux) for k in noms[1:]}}

print(json.dumps({'sur_31': lire(J), 'sur_29': lire([r for r in J if r['jeu'] not in DOUBLONS])}, ensure_ascii=False, indent=1))
