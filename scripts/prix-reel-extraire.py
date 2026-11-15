# Protocole PRIX-RÉEL : extrait les ventes réelles du paquet R « bayesm » (GPL) en deux fichiers CSV.
# Les données brutes ne sont pas dans ce dépôt. Pour les obtenir :
#   apt-get update && apt-get download r-cran-bayesm && dpkg-deb -x r-cran-bayesm_*.deb x
#   pip install --target ./py rdata
#   python3 -I scripts/prix-reel-extraire.py ./py x/usr/lib/R/site-library/bayesm/data prive/prix-reel
import math, os, sys
sys.path.insert(0, sys.argv[1])
import rdata

src, dest = sys.argv[2], sys.argv[3]
os.makedirs(dest, exist_ok=True)
lire = lambda nom: rdata.conversion.convert(rdata.parser.parse_file(os.path.join(src, nom)))

oj = lire('orangeJuice.rda')['orangeJuice']['yx']
with open(os.path.join(dest, 'jus.csv'), 'w') as f:
    f.write('magasin;marque;semaine;unites;prix;marge_pct;deal;feat\n')
    for r in oj.itertuples(index=False):
        d = r._asdict(); b = int(d['brand'])
        f.write(f"{int(d['store'])};{b};{int(d['week'])};{math.exp(d['logmove']):.4f};{d['price%d' % b]:.8f};{d['profit']:.6f};{int(d['deal'])};{d['feat']:.4f}\n")

tuna = lire('tuna.rda')['tuna']
with open(os.path.join(dest, 'thon.csv'), 'w') as f:
    f.write('marque;semaine;unites;prix;cout;promotion\n')
    for r in tuna.itertuples(index=False):
        d = r._asdict()
        for b in range(1, 8):
            f.write(f"{b};{int(d['WEEK'])};{d['MOVE%d' % b]:.4f};{math.exp(d['LPRICE%d' % b]):.8f};{math.exp(d['LWHPRIC%d' % b]):.8f};{d['NSALE%d' % b]:.4f}\n")
print('écrit :', dest)
