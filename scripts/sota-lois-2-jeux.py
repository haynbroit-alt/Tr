# Protocole SOTA-LOIS-2 : choisit par leur seule structure les jeux réels à deux colonnes numériques de la
# collection Rdatasets (paquet pydataset 0.2.0, non copié dans ce dépôt) et les écrit en CSV « x;y ».
#   pip download --no-deps pydataset==0.2.0 ; extraire pydataset/resources.tar.gz
#   python3 -I scripts/sota-lois-2-jeux.py <dossier rdata> <dossier de sortie>
import csv, glob, hashlib, os, sys
racine, dest = sys.argv[1], sys.argv[2]
os.makedirs(dest, exist_ok=True)
vus, n = set(), 0
def num(v):
    try: float(v); return True
    except Exception: return False
for f in sorted(glob.glob(os.path.join(racine, '**', '*.csv'), recursive=True)):
    nom = os.path.basename(f)[:-4]
    if nom.startswith('datasets') or nom == 'co2': continue
    with open(f, encoding='utf-8', errors='replace') as h: rows = list(csv.reader(h))
    if len(rows) < 55: continue
    tete, corps = rows[0], rows[1:]
    cols = list(range(1, len(tete))) if tete and tete[0] in ('', 'rownames') else list(range(len(tete)))
    if len(cols) != 2 or not (54 <= len(corps) <= 600): continue
    if not all(len(r) > max(cols) and num(r[cols[0]]) and num(r[cols[1]]) for r in corps): continue
    xy = [(float(r[cols[0]]), float(r[cols[1]])) for r in corps]
    if len({a for a, _ in xy}) < 10 or len({b for _, b in xy}) < 10: continue
    cle = hashlib.sha256(repr(sorted(xy)).encode()).hexdigest()
    if cle in vus: continue
    vus.add(cle); n += 1
    with open(os.path.join(dest, f"{os.path.basename(os.path.dirname(f))}.{nom}.csv"), 'w') as o:
        o.write('x;y\n'); o.writelines(f"{a!r};{b!r}\n" for a, b in xy)
print(n, 'jeux écrits dans', dest)
