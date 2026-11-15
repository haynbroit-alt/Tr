# Protocole SOTA-LOIS-2 : Operon court (15 nœuds), Operon long (50) et gplearn sur les jeux exportés.
# Usage : <python avec pyoperon et gplearn> scripts/sota-lois-2.py <dossier exporté> <sortie.json>
# Chaque jeu terminé est enregistré dans <sortie>.partiel ; une relance reprend là où elle s'est arrêtée.
import glob, json, os, sys, time, warnings
warnings.filterwarnings('ignore')
import numpy as np
from pyoperon.sklearn import SymbolicRegressor as Operon
from gplearn.genetic import SymbolicRegressor as GPLearn

GRAINES, SYMBOLES = [1, 2, 3], 'add,sub,mul,div,exp,log,sqrt,sin,cos,pow,constant,variable'
PARTIEL = sys.argv[2] + '.partiel'
res = [json.loads(l) for l in open(PARTIEL)] if os.path.exists(PARTIEL) else []
faits = {r['jeu'] for r in res}
for f in sorted(glob.glob(os.path.join(sys.argv[1], '*.json'))):
    d = json.load(open(f))
    if d['jeu'] in faits: continue
    X, y, Xt, yt = np.array(d['Xvu']), np.array(d['yvu']), np.array(d['Xtest']), np.array(d['ytest'])
    ligne = {k: d[k] for k in ('jeu', 'points', 'temoin', 'galilee')}
    for nom in ('operon_court', 'operon_long', 'gplearn'):
        errs, longueurs, pannes, t0 = [], [], [], time.time()
        for g in GRAINES:
            try:
                if nom == 'gplearn':
                    m = GPLearn(random_state=g, function_set=('add', 'sub', 'mul', 'div', 'sqrt', 'log', 'sin', 'cos')); m.fit(X, y); longueurs.append(int(m._program.length_))
                else:
                    m = Operon(random_state=g, max_time=20, allowed_symbols=SYMBOLES, optimizer_iterations=10, **({'max_length': 15} if nom == 'operon_court' else {})); m.fit(X, y); longueurs.append(int(m.stats_['model_length']))
                e = float(np.sqrt(np.mean((np.asarray(m.predict(Xt)) * d['sy'] - yt) ** 2)))
                errs.append(e if np.isfinite(e) else None)
            except Exception as ex:
                errs.append(None); longueurs.append(None); pannes.append(repr(ex)[:200])
        ok = sorted(e for e in errs if e is not None)
        mediane = ok[len(ok) // 2] if len(ok) == len(GRAINES) else (None if not ok else ok[-1])
        ligne[nom] = {'erreurs': errs, 'erreur': mediane, 'longueurs': longueurs, 'secs': round(time.time() - t0, 1), **({'pannes': pannes} if pannes else {})}
    res.append(ligne); open(PARTIEL, 'a').write(json.dumps(ligne) + '\n')
    r = lambda x: None if x is None else round(x / d['temoin'], 2)
    print(d['jeu'], '| galilee', r(d['galilee']['erreur']), d['galilee']['noeuds'], '| operon court', r(ligne['operon_court']['erreur']), ligne['operon_court']['longueurs'], '| long', r(ligne['operon_long']['erreur']), '| gplearn', r(ligne['gplearn']['erreur']), flush=True)
json.dump({'protocole': 'programme/sota/PROTOCOLE_SOTA_LOIS_2.md', 'graines': GRAINES, 'versions': {'pyoperon': '0.6.2', 'gplearn': '0.4.3', 'galilee': 'be42b7e'}, 'jeux': res}, open(sys.argv[2], 'w'), indent=1)
