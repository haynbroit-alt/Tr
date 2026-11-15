// Essai de prix T3g — un plan d'essai qui écarte les prix ruineux. Protocole : programme/t3g/PROTOCOLE_T3G.md.
// Un niveau de baisse est écarté si son prix ne dépasse pas le coût, ou si la sensibilité de la demande qu'il faudrait
// pour qu'il rapporte dépasse E_MAX. Le coût est celui de LAVOISIER sur le journal coupé au jour 183.
import * as L from '../adaptateurs/lavoisier.js';
import * as C from '../adaptateurs/cortex.js';
import { couper, choisirObjet, coutUnitaire, donneesEssai, decider, margeVraie, planVers, prixDe, J1, BLOC, PAS, BLOCS_COURT } from './essai-prix.js';

export const E_MAX = 4;   // fixé au protocole ; moyenne publiée des élasticités-prix : −2,62 (Bijmolt et al., 2005)
const arr = (x, n = 2) => (x == null || !Number.isFinite(x) ? null : Number(x.toFixed(n)));
// sensibilité de la demande à partir de laquelle vendre à p2 plutôt qu'à p rapporte autant
export const eRequise = (p, cout, p2) => (p2 <= cout ? Infinity : Math.log((p - cout) / (p2 - cout)) / Math.log(p / p2));
export const ecarte = (pref, cout, u) => u < 0 && (prixDe(pref, u) <= cout || eRequise(pref, cout, prixDe(pref, u)) > E_MAX);
export function planPrudent(niveaux, pref, cout) {
  if (cout == null || !(cout > 0)) return [...niveaux];
  const repli = [-0.5, 0].find((u) => !ecarte(pref, cout, u));   // le niveau 0 n'est jamais écarté
  return niveaux.map((u) => (ecarte(pref, cout, u) ? repli : u));
}
export const planChaine = () => C.planActif({ text: '1 / p', f: (u) => PAS ** -u[0] }).plan.slice(0, BLOCS_COURT).map((u) => u[0]);

export function essaiPrudent(graine, monde = 't3g') {
  const t0 = Date.now(), nul = L.entreprisePilotee(graine, [], monde), avant = couper(nul.observe, J1), choix = choisirObjet(avant);
  if (!choix.objet) return { graine, ecartee: true, motif: `aucun objet éligible (${choix.objets} objets vendus)` };
  const { objet: tok, pref } = choix, cout = coutUnitaire(avant, L.bilanMatiere(avant).corps, tok).cout;
  const S = planChaine(), P = planPrudent(S, pref, cout), concernee = P.some((u, i) => u !== S[i]);
  const base = { graine, monde, ecartee: false, objet: tok, prix_reference: pref, cout_au_jour_183: arr(cout, 3), taux_de_marge: cout > 0 ? arr(pref / cout, 3) : null, concernee, plan_prudent: P };
  if (!concernee) return { ...base, secs: arr((Date.now() - t0) / 1000, 1) };
  const courses = { nul }, lancer = (cle, plan) => (courses[cle] ??= L.entreprisePilotee(graine, plan, monde));
  for (const u of [0, 1]) lancer(`aveugle:${u}`, [{ jour: J1, objet: tok, prix: prixDe(pref, u) }]);
  const conduire = (nom, niveaux) => {
    const obs = couper(L.entreprisePilotee(graine, planVers(tok, pref, niveaux), monde).observe, J1 + BLOC * niveaux.length);
    const { corps } = L.bilanMatiere(obs), d = donneesEssai(obs, corps, tok, pref, niveaux), dec = decider({ table: d.table, loi: null, cout: coutUnitaire(obs, corps, tok).cout, pref, sansLoi: true });
    lancer(`${nom}:${dec.niveau}`, planVers(tok, pref, niveaux, dec.niveau));
    return dec.niveau;
  };
  const dC = conduire('chaine', S), dP = conduire('prudente', P), marges = {};
  for (const [cle, E] of Object.entries(courses)) { E.ouvrir(); marges[cle] = margeVraie(E, tok); }   // toutes les décisions sont prises : la vérité s'ouvre
  const copie = ({ cout_vrai, ...m }) => m;
  return { ...base, cout_vrai: arr(marges.nul.cout_vrai, 3), decision_chaine: dC, decision_prudente: dP,
    bras: { nul: copie(marges.nul), 'aveugle:0': copie(marges['aveugle:0']), 'aveugle:1': copie(marges['aveugle:1']), chaine: copie(marges[`chaine:${dC}`]), prudente: copie(marges[`prudente:${dP}`]) }, secs: arr((Date.now() - t0) / 1000, 1) };
}

export async function agregerPrudent(R) {
  const { tUnilateral } = await import('../../scripts/t3.js');
  const E = R.filter((r) => !r.ecartee), K = E.filter((r) => r.concernee), moy = (v) => (v.length ? v.reduce((a, b) => a + b, 0) / v.length : null);
  const gain = (r, b) => (r.bras[b].total - r.bras.nul.total) / Math.abs(r.bras.nul.total), tous = ['prudente', 'chaine', 'aveugle:0', 'aveugle:1'];
  const ecart = (x, y) => (K.length > 2 ? tUnilateral(K.map((r) => gain(r, x) - gain(r, y))) : null), perd = (b) => K.filter((r) => gain(r, b) < gain(r, 'aveugle:0')).length;
  const G3 = { prudente: perd('prudente'), chaine: perd('chaine') }; G3.tenu = G3.prudente <= G3.chaine;
  const G1 = ecart('prudente', 'chaine');
  return { parcourues: R.length, mesurables: E.length, concernees: K.length, part_concernee: E.length ? K.length / E.length : null, moyennes: Object.fromEntries(tous.map((b) => [b, moy(K.map((r) => gain(r, b)))])),
    G1, G2: ecart('prudente', 'aveugle:0'), G3, chaine_contre_prix_tenu: ecart('chaine', 'aveugle:0'), plus_25_contre_prudente: ecart('aveugle:1', 'prudente'),
    effet_sur_l_ensemble: G1 && E.length ? (G1.moyenne * K.length) / E.length : null, sans_niveau_de_baisse: K.filter((r) => r.plan_prudent.every((u) => u >= 0)).length,
    decisions: { chaine: Object.fromEntries([-1, -0.5, 0, 0.5, 1].map((u) => [u, K.filter((r) => r.decision_chaine === u).length])), prudente: Object.fromEntries([-1, -0.5, 0, 0.5, 1].map((u) => [u, K.filter((r) => r.decision_prudente === u).length])) },
    cout_exact: K.filter((r) => Math.abs(r.cout_au_jour_183 / r.cout_vrai - 1) < 0.001).length, cout_indisponible: E.filter((r) => r.cout_au_jour_183 == null).length };
}
export function direPrudent(a) {
  const pct = (x) => (x == null ? '—' : `${(100 * x).toFixed(1)} %`), t = (k) => (k ? `${pct(k.moyenne)}, t = ${k.t.toFixed(2)} (seuil ${k.seuil}) → ${k.etabli ? 'établi' : 'non établi'}` : 'trop peu d’entreprises');
  return [`${a.parcourues} entreprises parcourues, ${a.mesurables} mesurables, ${a.concernees} concernées (${pct(a.part_concernee)}), dont ${a.sans_niveau_de_baisse} sans aucun niveau de baisse`,
    ...Object.entries(a.moyennes).map(([b, m]) => `  ${b.padEnd(12)} ${pct(m).padStart(8)}`),
    `G1 prudente > chaîne : ${t(a.G1)}`, `G2 prudente > prix tenu : ${t(a.G2)}`, `G3 perdantes face à prix tenu : prudente ${a.G3.prudente}, chaîne ${a.G3.chaine} → ${a.G3.tenu ? 'tenu' : 'manqué'}`,
    `chaîne > prix tenu : ${t(a.chaine_contre_prix_tenu)} · +25 % d’emblée > prudente : ${t(a.plus_25_contre_prudente)}`,
    `effet rapporté à l’ensemble : ${a.effet_sur_l_ensemble == null ? '—' : (100 * a.effet_sur_l_ensemble).toFixed(2) + ' point(s)'} · décisions chaîne ${JSON.stringify(a.decisions.chaine)} · prudente ${JSON.stringify(a.decisions.prudente)}`,
    `coût exact au jour 183 : ${a.cout_exact} sur ${a.concernees} · coût indisponible : ${a.cout_indisponible}`].join('\n');
}

// Exécution unique du test T3g (graines 6401 à 6700), consignée au registre : la clé du dossier interdit de la refaire.
export async function essaiPrudentTest(reg, { sortie = null, monde = 't3g', graines = Array.from({ length: 300 }, (_, i) => 6401 + i) } = {}) {
  const P = 'essai-prix#T3G';
  reg.ajouter({ probleme: P, type: 'probleme', cle: P, auteur: 'registre', titre: 'Essai de prix commun (T3G) : un plan d’essai qui écarte les prix ruineux',
    question: 'Un plan d’essai qui écarte d’avance les niveaux de baisse dont le seuil de rentabilité est hors d’atteinte (coût de LAVOISIER, sensibilité requise > 4) fait-il mieux que le plan actuel, là où il change quelque chose ? Marge simulée.',
    source: { generateur: 'LAVOISIER src/bench/generator.js piloté (L2, demande sensible L2b, hasard commun L2c) ; protocole programme/t3g/PROTOCOLE_T3G.md', graine: `${graines[0]} à ${graines.at(-1)}`, statut: 'graines de test de T3G, exécution unique' },
    roles: { LAVOISIER: 'corps de l’entreprise, coût unitaire au jour 183 et en fin d’essai', CORTEX: 'plan d’essai de la chaîne', registre: 'règle d’exclusion à seuil fixé au protocole' } });
  const R = [];
  for (const g of graines) {
    const r = essaiPrudent(g, monde); R.push(r);
    if (r.ecartee) { reg.ajouter({ probleme: P, type: 'aveu', auteur: 'registre', motif: `Graine ${g} : écartée (${r.motif}).` }); continue; }
    if (!r.concernee) continue;   // plan inchangé : les deux bras sont identiques par construction, rien n'est simulé de plus
    const gain = (b) => Math.round(r.bras[b].total - r.bras.nul.total);
    const idExp = reg.ajouter({ probleme: P, type: 'experience', auteur: 'registre', but: [],
      plan: { duree: `Graine ${g} : 8 semaines d’essai sur le prix de ${r.objet} puis décision, jours ${J1} à 364 ; plan prudent (taux de marge ${r.taux_de_marge}) face au plan de la chaîne`, niveaux: r.plan_prudent },
      cout_prevu: { raison: 'non chiffré d’avance : c’est ce que l’essai mesure' }, risque: { reversible: true, note: 'entreprise simulée : rien ne sort, aucun euro réel n’est en jeu' }, autorisation: 'automatique' });
    reg.ajouter({ probleme: P, type: 'resultat', auteur: 'banc', experience: idExp,
      mesures: { essai_prix: true, graine: g, decision: r.decision_prudente, decide_par: 'table, plan prudent', juge_cortex: 'non sollicité', marge_temoin_nul: Math.round(r.bras.nul.total), gain_collectif: gain('prudente'), gain_aveugle_plus_25: gain('aveugle:1'),
        gain_chaine: gain('chaine'), gain_prix_tenu: gain('aveugle:0'), decision_chaine: r.decision_chaine, taux_de_marge: r.taux_de_marge, cout_vrai: r.cout_vrai, unite: '€ simulés, marge sur ventes de l’objet, jours 183 à 364' },
      cout_reel: { calcul_s: r.secs, jours: 182 } });
  }
  const a = await agregerPrudent(R);
  if (sortie) (await import('node:fs')).writeFileSync(sortie, JSON.stringify({ protocole: 'programme/t3g/PROTOCOLE_T3G.md', agregat: a, entreprises: R }, null, 1) + '\n');
  const pct = (x) => (x == null ? 'non mesurable' : `${(100 * x).toFixed(1)} %`);
  reg.ajouter({ probleme: P, type: 'jalon', auteur: 'registre', compte: 'collectif', travail: 'T3G', mesure: 'gain moyen sur la marge de l’objet piloté, jours 183 à 364, sur les entreprises où le plan prudent change l’essai (simulation)',
    avant: `chaîne ${pct(a.moyennes.chaine)}`, apres: `chaîne prudente ${pct(a.moyennes.prudente)} (${a.concernees} entreprises concernées sur ${a.mesurables} ; prix tenu ${pct(a.moyennes['aveugle:0'])}, +25 % d’emblée ${pct(a.moyennes['aveugle:1'])})`, source: 'programme/t3g/test.json' });
  console.error(direPrudent(a));
  return a;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const opt = (n, d) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : d; }, [a, b] = opt('--graines', '241-260').split('-').map(Number);
  if (a < 241 || (b ?? a) > 260) { console.error('vérification du code : graines 241 à 260 seulement'); process.exit(1); }
  const R = [];
  for (let g = a; g <= (b ?? a); g++) { const r = essaiPrudent(g); R.push(r); console.error(`graine ${g} : ${r.ecartee ? 'écartée' : `marge ${r.taux_de_marge} · ${r.concernee ? `plan ${r.plan_prudent.join(' ')} · chaîne ${r.decision_chaine} · prudente ${r.decision_prudente}` : 'non concernée'} · ${r.secs} s`}`); }
  console.log(direPrudent(await agregerPrudent(R)));
}
