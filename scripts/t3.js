// Essai de prix commun (T3) — mise au point et agrégation. Protocole : programme/t3/PROTOCOLE_T3.md.
// Usage : node scripts/t3.js [--monde t3b] --graines 201-220 [--sortie programme/t3/dev.json]   (mise au point seulement)
//         node scripts/t3.js --lire programme/t3/dev.json                           (agrégat d'un fichier déjà produit)
// Le test (6001 à 6040) ne passe pas par ici : exécution unique, par le registre (`commun.js executer essai-prix`).
import { readFileSync, writeFileSync } from 'node:fs';
import { essaiPrix, NIVEAUX } from '../src/problemes/essai-prix.js';

const opt = (n, d) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : d; };
const moy = (v) => v.reduce((a, b) => a + b, 0) / v.length;
const pct = (x) => `${(100 * x).toFixed(1)} %`;
// test t apparié unilatéral à 5 % (valeurs critiques de Student, 1 à 40 ddl)
const T95 = [6.314, 2.92, 2.353, 2.132, 2.015, 1.943, 1.895, 1.86, 1.833, 1.812, 1.796, 1.782, 1.771, 1.761, 1.753, 1.746, 1.74, 1.734, 1.729, 1.725, 1.721, 1.717, 1.714, 1.711, 1.708, 1.706, 1.703, 1.701, 1.699, 1.697, 1.696, 1.694, 1.692, 1.691, 1.69, 1.688, 1.687, 1.686, 1.685, 1.684];
export function tUnilateral(d) {
  const n = d.length, m = moy(d), et = Math.sqrt(d.reduce((s, x) => s + (x - m) ** 2, 0) / (n - 1) / n);
  const t = et > 0 ? m / et : 0;
  return { n, moyenne: m, t, seuil: T95[Math.min(n - 1, 40) - 1], etabli: t > T95[Math.min(n - 1, 40) - 1] };
}

export function agreger(R) {
  const E = R.filter((r) => !r.ecartee), A = NIVEAUX.map((u) => `aveugle:${u}`);
  const gain = (r, b, f) => (r.bras[b][f] - r.bras.nul[f]) / Math.abs(r.bras.nul.total);   // en part de la marge du témoin nul (fenêtre entière)
  const court = E.length > 0 && E.every((r) => r.bras.collectif_court);
  const autres = E.length ? Object.keys(E[0].bras).filter((b) => /^court\d+$/.test(b) && E.every((r) => r.bras[b])) : [];
  const retenue = E.length > 0 && E.every((r) => r.bras.chaine_retenue);
  const tous = ['collectif', ...(court ? ['collectif_court', 'collectif_bref'] : []), ...(retenue ? ['chaine_retenue'] : []), ...autres, 'sans_galilee', 'sans_lavoisier', 'sans_plan_cortex', ...A];
  const moyennes = Object.fromEntries(tous.map((b) => [b, Object.fromEntries(['essai', 'exploitation', 'total'].map((f) => [f, moy(E.map((r) => gain(r, b, f)))]))]));
  const euros = Object.fromEntries(tous.map((b) => [b, Math.round(E.reduce((s, r) => s + r.bras[b].total - r.bras.nul.total, 0))]));
  const meilleurAveugle = (f) => A.reduce((a, b) => (moyennes[b][f] > moyennes[a][f] ? b : a));
  const apresCoup = E.map((r) => A.reduce((a, b) => (r.bras[b].total > r.bras[a].total ? b : a)));
  const niveauApresCoup = (r, i) => Number(apresCoup[i].split(':')[1]);
  const K1 = tUnilateral(E.map((r) => gain(r, 'collectif', 'total')));
  const adversaire = meilleurAveugle('exploitation');
  const K2 = { adversaire, collectif: moyennes.collectif.exploitation, aveugle: moyennes[adversaire].exploitation, tenu: moyennes.collectif.exploitation > moyennes[adversaire].exploitation, apparie: tUnilateral(E.map((r) => gain(r, 'collectif', 'exploitation') - gain(r, adversaire, 'exploitation'))) };
  const K3 = Object.fromEntries(['sans_galilee', 'sans_lavoisier', 'sans_plan_cortex'].map((b) => [b, tUnilateral(E.map((r) => gain(r, 'collectif', 'exploitation') - gain(r, b, 'exploitation')))]));
  const coutOk = E.filter((r) => r.collectif.cout.cout != null && Math.abs(r.collectif.cout.cout / r.cout_vrai - 1) < 0.05).length;
  return { entreprises: R.length, pilotables: E.length, ecartees: R.length - E.length, moyennes, euros_simules: euros, marge_temoin_nul: Math.round(E.reduce((s, r) => s + r.bras.nul.total, 0)),
    ...(retenue ? { C1: (() => { const adv = meilleurAveugle('total'); return { adversaire: adv, retenue: moyennes.chaine_retenue.total, aveugle: moyennes[adv].total, apparie: tUnilateral(E.map((r) => gain(r, 'chaine_retenue', 'total') - gain(r, adv, 'total'))), contre_court: tUnilateral(E.map((r) => gain(r, 'chaine_retenue', 'total') - gain(r, 'collectif_court', 'total'))) }; })(), C2: tUnilateral(E.map((r) => gain(r, 'chaine_retenue', 'total'))),
      retenue_egale_apres_coup: E.filter((r, i) => r.court.decisions.sans_galilee.niveau === niveauApresCoup(r, i)).length, retenue_a_un_pas: E.filter((r, i) => Math.abs(r.court.decisions.sans_galilee.niveau - niveauApresCoup(r, i)) <= 0.5).length, retenue_en_perte: E.filter((r) => r.bras.chaine_retenue.total < r.bras.nul.total).length } : {}),
    K1, K2, K3, ...(court ? { K2b: (() => { const adv = meilleurAveugle('total'); return { adversaire: adv, collectif: moyennes.collectif.total, aveugle: moyennes[adv].total, tenu: moyennes.collectif.total > moyennes[adv].total, apparie: tUnilateral(E.map((r) => gain(r, 'collectif', 'total') - gain(r, adv, 'total'))), court: moyennes.collectif_court.total, court_tenu: moyennes.collectif_court.total > moyennes[adv].total, court_apparie: tUnilateral(E.map((r) => gain(r, 'collectif_court', 'total') - gain(r, adv, 'total'))) }; })(), K4: tUnilateral(E.map((r) => gain(r, 'collectif_court', 'total') - gain(r, 'collectif', 'total'))), K5: (() => { const adv = meilleurAveugle('total'); return { adversaire: adv, bref: moyennes.collectif_bref.total, aveugle: moyennes[adv].total, tenu: moyennes.collectif_bref.total > moyennes[adv].total, apparie: tUnilateral(E.map((r) => gain(r, 'collectif_bref', 'total') - gain(r, adv, 'total'))), contre_collectif: tUnilateral(E.map((r) => gain(r, 'collectif_bref', 'total') - gain(r, 'collectif', 'total'))), gain_bref: tUnilateral(E.map((r) => gain(r, 'collectif_bref', 'total'))) }; })() } : {}), fenetre_entiere: { meilleur_aveugle: meilleurAveugle('total'), aveugle: moyennes[meilleurAveugle('total')].total, collectif: moyennes.collectif.total },
    attendus: {
      apres_coup_plus_un: E.filter((r, i) => niveauApresCoup(r, i) === 1).length, repartition_apres_coup: Object.fromEntries(NIVEAUX.map((u) => [u, E.filter((r, i) => niveauApresCoup(r, i) === u).length])),
      cout_a_5_pct: coutOk, cout_indisponible: E.filter((r) => r.collectif.cout.cout == null).length,
      loi_retenue: E.filter((r) => r.collectif.loi.retenue).length, juge: E.reduce((c, r) => { c[r.collectif.juge.verdict] = (c[r.collectif.juge.verdict] ?? 0) + 1; return c; }, {}),
      decision_egale_apres_coup: E.filter((r, i) => r.collectif.decisions.complet.niveau === niveauApresCoup(r, i)).length,
      decision_a_un_pas: E.filter((r, i) => Math.abs(r.collectif.decisions.complet.niveau - niveauApresCoup(r, i)) <= 0.5).length,
      decisions: Object.fromEntries(NIVEAUX.map((u) => [u, E.filter((r) => r.collectif.decisions.complet.niveau === u).length])),
      decide_par: E.reduce((c, r) => { c[r.collectif.decisions.complet.par] = (c[r.collectif.decisions.complet.par] ?? 0) + 1; return c; }, {}),
      ...(court ? { bref_egale_apres_coup: E.filter((r, i) => r.bref.decisions.complet.niveau === niveauApresCoup(r, i)).length, bref_a_un_pas: E.filter((r, i) => Math.abs(r.bref.decisions.complet.niveau - niveauApresCoup(r, i)) <= 0.5).length } : {}) } };
}

export function dire(a) {
  const L = [`${a.pilotables} entreprises pilotables sur ${a.entreprises} · marge du témoin nul : ${a.marge_temoin_nul.toLocaleString('fr-FR')} € simulés`, '', 'gain moyen (part de la marge du témoin nul)   essai   exploitation   total   € simulés'];
  for (const [b, m] of Object.entries(a.moyennes)) L.push(`  ${b.padEnd(18)} ${pct(m.essai).padStart(9)} ${pct(m.exploitation).padStart(9)} ${pct(m.total).padStart(9)} ${String(a.euros_simules[b].toLocaleString('fr-FR')).padStart(12)}`);
  L.push('', `K1 gain du collectif > 0 (fenêtre entière) : moyenne ${pct(a.K1.moyenne)}, t = ${a.K1.t.toFixed(2)} (seuil ${a.K1.seuil}) → ${a.K1.etabli ? 'tenu' : 'MANQUÉ'}`);
  L.push(`K2 collectif > meilleur aveugle en exploitation (${a.K2.adversaire}) : ${pct(a.K2.collectif)} contre ${pct(a.K2.aveugle)} → ${a.K2.tenu ? 'tenu' : 'MANQUÉ'} (écart apparié t = ${a.K2.apparie.t.toFixed(2)})`);
  for (const [b, k] of Object.entries(a.K3)) L.push(`K3 ${b} : le collectif fait ${pct(k.moyenne)} de mieux, t = ${k.t.toFixed(2)} → ${k.etabli ? 'établi' : 'non établi'}`);
  if (a.K2b) L.push(`K2b collectif > meilleur aveugle sur la fenêtre entière (${a.K2b.adversaire}) : ${pct(a.K2b.collectif)} contre ${pct(a.K2b.aveugle)} → ${a.K2b.tenu ? 'tenu' : 'MANQUÉ'} (écart apparié t = ${a.K2b.apparie.t.toFixed(2)}) · collectif court ${pct(a.K2b.court)} → ${a.K2b.court_tenu ? 'au-dessus' : 'au-dessous'} (t = ${a.K2b.court_apparie.t.toFixed(2)})`, `K4 collectif court > collectif (fenêtre entière) : ${pct(a.K4.moyenne)} de mieux, t = ${a.K4.t.toFixed(2)} → ${a.K4.etabli ? 'établi' : 'non établi'}`);
  if (a.C1) L.push(`C1 chaîne retenue > meilleur aveugle sur la fenêtre entière (${a.C1.adversaire}) : ${pct(a.C1.retenue)} contre ${pct(a.C1.aveugle)}, écart apparié ${pct(a.C1.apparie.moyenne)}, t = ${a.C1.apparie.t.toFixed(2)} (seuil ${a.C1.apparie.seuil}) → ${a.C1.apparie.etabli ? 'tenu' : 'MANQUÉ'}`, `C2 gain de la chaîne retenue > 0 : ${pct(a.C2.moyenne)}, t = ${a.C2.t.toFixed(2)} → ${a.C2.etabli ? 'tenu' : 'MANQUÉ'} · retenue − court avec loi : ${pct(a.C1.contre_court.moyenne)}, t = ${a.C1.contre_court.t.toFixed(2)} · décision exacte ${a.retenue_egale_apres_coup}, à un cran ${a.retenue_a_un_pas}, entreprises en perte ${a.retenue_en_perte}`);
  if (a.K5) L.push(`K5 collectif bref > meilleur aveugle sur la fenêtre entière (${a.K5.adversaire}) : ${pct(a.K5.bref)} contre ${pct(a.K5.aveugle)} → ${a.K5.tenu ? 'tenu' : 'MANQUÉ'} (écart apparié t = ${a.K5.apparie.t.toFixed(2)}, seuil ${a.K5.apparie.seuil}) · gain du bref > 0 : t = ${a.K5.gain_bref.t.toFixed(2)} · bref − collectif : ${pct(a.K5.contre_collectif.moyenne)}, t = ${a.K5.contre_collectif.t.toFixed(2)}`);
  L.push(`fenêtre entière : meilleur aveugle ${a.fenetre_entiere.meilleur_aveugle} ${pct(a.fenetre_entiere.aveugle)} · collectif ${pct(a.fenetre_entiere.collectif)}`, `attendus : ${JSON.stringify(a.attendus)}`);
  return L.join('\n');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  let R;
  if (opt('--lire')) R = JSON.parse(readFileSync(opt('--lire'), 'utf8')).entreprises;
  else {
    const monde = opt('--monde', 't3'), [lo, hi] = monde === 't3b' ? [221, 240] : [201, 220];
    const [a, b] = opt('--graines', `${lo}-${lo + 3}`).split('-').map(Number);
    if (a < lo || (b ?? a) > hi) { console.error(`mise au point : graines ${lo} à ${hi} seulement`); process.exit(1); }
    R = [];
    for (let g = a; g <= (b ?? a); g++) { const r = essaiPrix(g, monde); R.push(r); console.error(r.ecartee ? `graine ${g} : écartée (${r.motif})` : `graine ${g} : ${r.objet} · coût ${r.collectif.cout.cout?.toFixed(2)} (vrai ${r.cout_vrai}) · loi ${r.collectif.loi.retenue ? 'retenue' : 'non retenue'} « ${r.collectif.loi.texte} » · décision ${r.collectif.decisions.complet.niveau} par ${r.collectif.decisions.complet.par} · juge ${r.collectif.juge.verdict} · ${r.secs} s`); }
    if (opt('--sortie')) writeFileSync(opt('--sortie'), JSON.stringify({ protocole: monde === 't3b' ? 'programme/t3b/PROTOCOLE_T3B.md' : 'programme/t3/PROTOCOLE_T3.md', entreprises: R }, null, 1) + '\n');
  }
  console.log(dire(agreger(R)));
}
