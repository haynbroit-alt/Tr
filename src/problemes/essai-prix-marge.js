// Essai de prix T3f — la règle de marge, sans essai. Protocole : programme/t3f/PROTOCOLE_T3F.md.
// Aucun bras simulé en plus : « règle » et « mixte » se composent des bras aveugles et de la chaîne retenue, selon le
// taux de marge m = prix de référence ÷ coût unitaire estimé par LAVOISIER sur le journal coupé au jour 183.
import * as L from '../adaptateurs/lavoisier.js';
import { essaiPrix, couper, coutUnitaire, J1, NIVEAUX } from './essai-prix.js';

export const SEUIL_BAS = 1.4, SEUIL_HAUT = 2.1;   // fixés au protocole, bornes strictes
export const zone = (m) => (m == null || !Number.isFinite(m) ? 'milieu' : m < SEUIL_BAS ? 'bas' : m > SEUIL_HAUT ? 'haut' : 'milieu');
const arr = (x, n = 2) => (x == null || !Number.isFinite(x) ? null : Number(x.toFixed(n)));

export function essaiMarge(graine, monde = 't3f') {
  const t0 = Date.now(), base = essaiPrix(graine, monde);
  if (base.ecartee) return base;
  const tok = base.objet, avant = couper(L.entreprisePilotee(graine, [], monde).observe, J1);
  const { corps } = L.bilanMatiere(avant), cout = coutUnitaire(avant, corps, tok).cout;
  const m = cout != null && cout > 0 ? base.prix_reference / cout : null, z = zone(m), extreme = z === 'bas' ? 'aveugle:1' : z === 'haut' ? 'aveugle:-1' : null;
  const bras = { nul: base.bras.nul, chaine: base.bras.chaine_retenue, ...Object.fromEntries(NIVEAUX.map((u) => [`aveugle:${u}`, base.bras[`aveugle:${u}`]])),
    regle: base.bras[extreme ?? 'aveugle:0'], mixte: base.bras[extreme ?? 'chaine_retenue'] };
  return { graine, monde, ecartee: false, objet: tok, prix_reference: base.prix_reference, cout_vrai: base.cout_vrai, cout_au_jour_183: arr(cout, 3), taux_de_marge: arr(m, 3), zone: z,
    decision_regle: z === 'bas' ? 1 : z === 'haut' ? -1 : 0, decision_chaine: base.court.decisions.sans_galilee.niveau, bras, secs: arr((Date.now() - t0) / 1000, 1) };
}

export async function agregerMarge(R) {
  const { tUnilateral } = await import('../../scripts/t3.js');
  const E = R.filter((r) => !r.ecartee), A = NIVEAUX.map((u) => `aveugle:${u}`), moy = (v) => v.reduce((a, b) => a + b, 0) / v.length;
  const gain = (r, b) => (r.bras[b].total - r.bras.nul.total) / Math.abs(r.bras.nul.total), tous = ['regle', 'mixte', 'chaine', ...A];
  const moyennes = Object.fromEntries(tous.map((b) => [b, moy(E.map((r) => gain(r, b)))])), ecart = (x, y, S = E) => (S.length > 2 ? tUnilateral(S.map((r) => gain(r, x) - gain(r, y))) : null);
  const perd = (b) => E.filter((r) => gain(r, b) < gain(r, 'aveugle:0')).length, zones = Object.fromEntries(['bas', 'milieu', 'haut'].map((z) => [z, E.filter((r) => r.zone === z)]));
  const F4 = { regle: perd('regle'), mixte: perd('mixte'), chaine: perd('chaine') }; F4.tenu = F4.regle <= F4.chaine / 2;
  return { entreprises: R.length, mesurees: E.length, moyennes, F1: ecart('regle', 'aveugle:0'), F2: ecart('regle', 'chaine'), F2_inverse: ecart('chaine', 'regle'), F3: ecart('mixte', 'chaine'), F4,
    chaine_contre_prix_tenu: ecart('chaine', 'aveugle:0'), mixte_contre_prix_tenu: ecart('mixte', 'aveugle:0'), mixte_contre_regle: ecart('mixte', 'regle'),
    cout_exact: E.filter((r) => r.cout_au_jour_183 != null && Math.abs(r.cout_au_jour_183 / r.cout_vrai - 1) < 0.001).length, cout_indisponible: E.filter((r) => r.cout_au_jour_183 == null).length,
    par_zone: Object.fromEntries(Object.entries(zones).map(([z, S]) => [z, { n: S.length, ...Object.fromEntries(tous.map((b) => [b, S.length ? moy(S.map((r) => gain(r, b))) : null])), chaine_contre_prix_tenu: ecart('chaine', 'aveugle:0', S), regle_contre_chaine: ecart('regle', 'chaine', S) }])) };
}
export function direMarge(a) {
  const pct = (x) => (x == null ? '—' : `${(100 * x).toFixed(1)} %`), t = (k) => (k ? `${pct(k.moyenne)}, t = ${k.t.toFixed(2)} (seuil ${k.seuil}) → ${k.etabli ? 'établi' : 'non établi'}` : 'trop peu d’entreprises');
  return [`${a.mesurees} entreprises mesurées sur ${a.entreprises}`, ...Object.entries(a.moyennes).map(([b, m]) => `  ${b.padEnd(14)} ${pct(m).padStart(8)}`),
    `F1 règle > prix tenu : ${t(a.F1)}`, `F2 règle > chaîne : ${t(a.F2)}`, `F2 inverse chaîne > règle : ${t(a.F2_inverse)}`, `F3 mixte > chaîne : ${t(a.F3)}`,
    `F4 perdantes face à prix tenu : règle ${a.F4.regle}, mixte ${a.F4.mixte}, chaîne ${a.F4.chaine} → ${a.F4.tenu ? 'tenu' : 'manqué'}`,
    `chaîne > prix tenu : ${t(a.chaine_contre_prix_tenu)} · mixte > prix tenu : ${t(a.mixte_contre_prix_tenu)} · mixte > règle : ${t(a.mixte_contre_regle)}`,
    ...Object.entries(a.par_zone).map(([z, s]) => `  marge ${z.padEnd(6)} n = ${String(s.n).padStart(3)} · règle ${pct(s.regle)} · chaîne ${pct(s.chaine)} · prix tenu ${pct(s['aveugle:0'])} · +25 % ${pct(s['aveugle:1'])} · −20 % ${pct(s['aveugle:-1'])}`),
    `coût exact au jour 183 : ${a.cout_exact} sur ${a.mesurees} · coût indisponible : ${a.cout_indisponible}`].join('\n');
}

// Exécution unique du test T3f (graines 6281 à 6400), consignée au registre : la clé du dossier interdit de la refaire.
export async function essaiMargeTest(reg, { sortie = null, monde = 't3f', graines = Array.from({ length: 120 }, (_, i) => 6281 + i) } = {}) {
  const P = 'essai-prix#T3F';
  reg.ajouter({ probleme: P, type: 'probleme', cle: P, auteur: 'registre', titre: 'Essai de prix commun (T3F) : le taux de marge suffit-il à dire le sens, sans essai ?',
    question: 'Une règle sans essai, lue sur le coût de LAVOISIER (marge < 1,4 : +25 % ; marge > 2,1 : −20 % ; sinon prix tenu), fait-elle mieux que prix tenu et que la chaîne retenue ? Marge simulée.',
    source: { generateur: 'LAVOISIER src/bench/generator.js piloté (L2, demande sensible L2b, hasard commun L2c) ; protocole programme/t3f/PROTOCOLE_T3F.md', graine: `${graines[0]} à ${graines.at(-1)}`, statut: 'graines de test de T3F, exécution unique' },
    roles: { LAVOISIER: 'corps de l’entreprise, coût unitaire au jour 183', CORTEX: 'plan d’essai de la chaîne', registre: 'règle de marge à seuils fixés au protocole' } });
  const R = [];
  for (const g of graines) {
    const r = essaiMarge(g, monde); R.push(r);
    if (r.ecartee) { reg.ajouter({ probleme: P, type: 'aveu', auteur: 'registre', motif: `Graine ${g} : écartée (${r.motif}).` }); continue; }
    const gain = (b) => Math.round(r.bras[b].total - r.bras.nul.total);
    const idExp = reg.ajouter({ probleme: P, type: 'experience', auteur: 'registre', but: [],
      plan: { duree: `Graine ${g} : 26 semaines sur le prix de ${r.objet}, jours ${J1} à 364 ; règle de marge sans essai (taux ${r.taux_de_marge ?? 'indisponible'}) face à la chaîne retenue`, niveaux: [r.decision_regle] },
      cout_prevu: { raison: 'aucun essai : la règle décide au jour 183 d’après le coût déjà connu' }, risque: { reversible: true, note: 'entreprise simulée : rien ne sort, aucun euro réel n’est en jeu' }, autorisation: 'automatique' });
    reg.ajouter({ probleme: P, type: 'resultat', auteur: 'banc', experience: idExp,
      mesures: { essai_prix: true, graine: g, decision: r.decision_regle, decide_par: 'règle de marge', juge_cortex: 'non sollicité', marge_temoin_nul: Math.round(r.bras.nul.total), gain_collectif: gain('chaine'), gain_aveugle_plus_25: gain('aveugle:1'),
        gain_regle: gain('regle'), gain_mixte: gain('mixte'), gain_prix_tenu: gain('aveugle:0'), taux_de_marge: r.taux_de_marge, cout_vrai: r.cout_vrai, unite: '€ simulés, marge sur ventes de l’objet, jours 183 à 364' },
      cout_reel: { calcul_s: r.secs, jours: 182 } });
  }
  const a = await agregerMarge(R);
  if (sortie) (await import('node:fs')).writeFileSync(sortie, JSON.stringify({ protocole: 'programme/t3f/PROTOCOLE_T3F.md', agregat: a, entreprises: R }, null, 1) + '\n');
  reg.ajouter({ probleme: P, type: 'jalon', auteur: 'registre', compte: 'collectif', travail: 'T3F', mesure: 'gain moyen sur la marge de l’objet piloté, jours 183 à 364 : règle de marge sans essai contre chaîne retenue (simulation)',
    avant: 'non mesuré', apres: `règle ${(100 * a.moyennes.regle).toFixed(1)} %, mixte ${(100 * a.moyennes.mixte).toFixed(1)} %, chaîne ${(100 * a.moyennes.chaine).toFixed(1)} %, prix tenu ${(100 * a.moyennes['aveugle:0']).toFixed(1)} %`, source: 'programme/t3f/test.json' });
  console.error(direMarge(a));
  return a;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const opt = (n, d) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : d; }, [a, b] = opt('--graines', '241-243').split('-').map(Number);
  if (a < 241 || (b ?? a) > 260) { console.error('vérification du code : graines 241 à 260 seulement'); process.exit(1); }
  const R = [];
  for (let g = a; g <= (b ?? a); g++) { const r = essaiMarge(g); R.push(r); console.error(`graine ${g} : ${r.ecartee ? 'écartée' : `marge ${r.taux_de_marge} (${r.zone}) · règle ${r.decision_regle} · chaîne ${r.decision_chaine} · ${r.secs} s`}`); }
  console.log(direMarge(await agregerMarge(R)));
}
