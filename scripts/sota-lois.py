# Protocole SOTA-LOIS : Operon et gplearn sur les 15 jeux réels du NIST, même partage que RÉEL.
# Usage : python3 -I scripts/sota-lois.py <site-packages avec pyoperon et gplearn> <dossier exporté> <sortie.json>
import glob, json, math, os, sys, time, warnings
sys.path.insert(0, sys.argv[1])
warnings.filterwarnings('ignore')
import numpy as np
from pyoperon.sklearn import SymbolicRegressor as Operon
from gplearn.genetic import SymbolicRegressor as GPLearn

GRAINES = [1, 2, 3]
def erreur(pred, d):
    e = np.sqrt(np.mean((np.asarray(pred) * d['sy'] - np.asarray(d['ytest'])) ** 2))
    return float(e) if np.isfinite(e) else None

# chaque jeu terminé est enregistré aussitôt dans <sortie>.partiel ; une relance reprend là où elle s'est arrêtée
PARTIEL = sys.argv[3] + '.partiel'
res = [json.loads(l) for l in open(PARTIEL)] if os.path.exists(PARTIEL) else []
faits = {r['jeu'] for r in res}
for f in sorted(glob.glob(os.path.join(sys.argv[2], '*.json'))):
    d = json.load(open(f));
    if d['jeu'] in faits: continue
    X, y, Xt = np.array(d['Xvu']), np.array(d['yvu']), np.array(d['Xtest'])
    ligne = {'jeu': d['jeu'], 'points': len(y) + len(d['ytest']), 'sd': d['sd'], 'galilee': d['galilee']}
    for nom in ('operon', 'operon_regle', 'gplearn'):
        errs, longueurs, pannes, t0 = [], [], [], time.time()
        for g in GRAINES:
            try:
                if nom == 'operon':
                    m = Operon(random_state=g, max_time=60); m.fit(X, y); longueurs.append(int(m.stats_['model_length']))
                elif nom == 'operon_regle':
                    m = Operon(random_state=g, max_time=60, allowed_symbols='add,sub,mul,div,exp,log,sqrt,sin,cos,pow,constant,variable', optimizer_iterations=10); m.fit(X, y); longueurs.append(int(m.stats_['model_length']))
                else:
                    m = GPLearn(random_state=g, function_set=('add', 'sub', 'mul', 'div', 'sqrt', 'log', 'sin', 'cos')); m.fit(X, y); longueurs.append(int(m._program.length_))
                errs.append(erreur(m.predict(Xt), d))
            except Exception as ex:
                errs.append(None); longueurs.append(None); pannes.append(repr(ex)[:200])
        ok = sorted(e for e in errs if e is not None)
        mediane = ok[len(ok) // 2] if len(ok) == len(GRAINES) else (None if not ok else ok[-1])
        ligne[nom] = {'erreurs': errs, 'erreur': mediane, 'rapport': None if mediane is None else mediane / d['sd'], 'longueurs': longueurs, 'secs': round(time.time() - t0, 1), **({'pannes': pannes} if pannes else {})}
    res.append(ligne)
    open(PARTIEL, 'a').write(json.dumps(ligne) + '\n')
    r = lambda x: None if x is None else round(x, 2)
    print(d['jeu'], 'galilee', r(d['galilee']['rapport']), '| operon', r(ligne['operon']['rapport']), '| operon réglé', r(ligne['operon_regle']['rapport']), '| gplearn', r(ligne['gplearn']['rapport']), ligne['operon'].get('pannes', '')[:1] if ligne['operon'].get('pannes') else '', flush=True)
json.dump({'protocole': 'programme/sota/PROTOCOLE_SOTA_LOIS.md', 'graines': GRAINES, 'versions': {'pyoperon': '0.6.2', 'gplearn': '0.4.3', 'galilee': 'be42b7e'}, 'jeux': res}, open(sys.argv[3], 'w'), indent=1)
