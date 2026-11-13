// Problème commun n° 2 — « entreprise opaque » (banc de développement de LAVOISIER, jalon M0).
// LAVOISIER reconstruit le corps et cherche les fuites de conservation ; ses débits reconstruits sont transmis à
// GALILÉE (loi quantité–prix) et à CORTEX (modes lents). Le registre met la loi à l'épreuve sur des semaines neuves.
import * as G from '../adaptateurs/galilee.js';
import * as C from '../adaptateurs/cortex.js';
import * as L from '../adaptateurs/lavoisier.js';
import { empreinte } from '../registre.js';

const JOURS = 365, SEM_APPRENTISSAGE = 39, SEM = 52;
const arr = (x, n = 3) => (x == null || !Number.isFinite(x) ? null : Number(x.toFixed(n)));
const mediane = (v) => { const s = [...v].sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : null; };

// Règle de transmission, sans aucun savoir de métier : pour chaque couple (type de flux reconstruit, objet) dont les
// lignes portent un montant ET une quantité, débit journalier = somme des quantités, prix unitaire = montant / quantité.
function debits(observe, corps, n) {
  const groupes = new Map();
  for (const r of observe.journal) {
    if (r.montant == null || !r.quantite || !r.objet) continue;
    const cle = `${corps.records[r.id]?.type}@${r.objet}`;
    if (!groupes.has(cle)) groupes.set(cle, []);
    groupes.get(cle).push(r);
  }
  return [...groupes].sort((a, b) => b[1].length - a[1].length).slice(0, n).map(([cle, lignes]) => {
    const q = new Float64Array(JOURS), prixJour = new Map();
    for (const r of lignes) { q[r.jour] += Math.abs(r.quantite); prixJour.set(r.jour, Math.abs(r.montant / r.quantite)); }
    const p0 = prixJour.get(Math.min(...prixJour.keys())), p = new Float64Array(JOURS);
    let dernier = p0;
    for (let t = 0; t < JOURS; t++) { if (prixJour.has(t)) dernier = prixJour.get(t); p[t] = dernier / p0; }
    return { cle, objet: lignes[0].objet, lignes: lignes.length, q, p, prix_initial: p0 };
  });
}
const hebdo = (d) => Array.from({ length: SEM }, (_, w) => { let q = 0, p = 0; for (let j = 0; j < 7; j++) { q += d.q[w * 7 + j]; p += d.p[w * 7 + j] / 7; } return { q, p }; });

export function entrepriseOpaque(reg, graine) {
  const P = `entreprise-opaque#${graine}`, reproduire = `node bin/commun.js executer entreprise-opaque --graine ${graine}`;
  const base = { probleme: P };
  const E = L.entreprise(graine);
  reg.ajouter({ ...base, type: 'probleme', cle: P, auteur: 'registre', titre: `Entreprise opaque (graine ${graine})`,
    question: 'Un an de journaux bruts aux libellés opaques. Quel est le corps de l’entreprise, où l’argent fuit-il, et quelles lois gouvernent ses débits ?',
    source: { generateur: 'LAVOISIER src/bench/generator.js', graine, classe: E.classe, lignes: E.observe.journal.length, statut: 'graine de développement' },
    roles: { LAVOISIER: 'bilan de matière, fuites', GALILÉE: 'loi quantité–prix des débits', CORTEX: 'modes lents entre débits' } });

  // 1. LAVOISIER : le corps
  const { corps, secs } = L.bilanMatiere(E.observe);
  const types = new Set(Object.values(corps.records).map((r) => r.type));
  const profit = corps.profitMensuel.reduce((a, b) => a + b, 0);
  const idCorps = reg.ajouter({ ...base, type: 'affirmation', auteur: 'LAVOISIER', moteur: L.IDENTITE, sujet: 'corps de l’entreprise',
    enonce: `${E.observe.journal.length} lignes regroupées en ${types.size} types de flux et ${corps.stocks.length} stocks ; profit reconstruit par conservation : ${Math.round(profit).toLocaleString('fr-FR')} € sur l’année.`,
    certitude: { niveau: 'hypothèse', garantie: 'aucune hors développement : le bilan de matière n’est pas gelé et son évaluation unique (M0) n’a pas eu lieu' },
    contenu: { types: types.size, stocks: corps.stocks.map((s) => `${s.id} (${s.unit})`), profit_mensuel: corps.profitMensuel.map((x) => Math.round(x)) },
    preuve: { methode: 'bilan de matière : typage, appariement par conservation, intégration des stocks, datation', donnees: empreinte(E.observe).slice(0, 16), reproduire },
    cout: { calcul_s: arr(secs, 1), experiences: 0 } });

  // 2. LAVOISIER : les fuites (écarts de conservation), chiffrées
  const prixObjet = (tok) => { const v = E.observe.journal.filter((r) => r.objet === tok && r.montant != null && r.quantite).map((r) => Math.abs(r.montant / r.quantite)); return v.length ? { bas: Math.min(...v), median: mediane(v), haut: Math.max(...v) } : null; };
  const fuites = corps.ecarts.map((e) => {
    const stock = corps.stocks.find((s) => s.id === e.stock), enEuros = stock?.unit === '€';
    const px = enEuros ? null : prixObjet(e.stock.split(':')[1]);
    const jours = JOURS - e.debut, perdu = Math.abs(e.debit) * jours;
    const eur = (x) => (enEuros ? x : px ? x * px.median : null);
    const id = reg.ajouter({ ...base, type: 'affirmation', auteur: 'LAVOISIER', moteur: L.IDENTITE, depend_de: [idCorps], sujet: `fuite sur ${e.stock}`,
      enonce: `Flux non enregistré sur le stock ${e.stock} depuis le jour ${e.debut} : ${arr(Math.abs(e.debit), 2)} ${stock?.unit ?? '?'} par jour.`,
      certitude: { niveau: 'hypothèse', mesure: { nom: 'preuve', valeur: e.preuve }, garantie: 'écart de conservation : le montant est comptable, mais la détection elle-même n’est pas garantie (voir risque)' },
      contenu: { stock: e.stock, unite: stock?.unit, debut: e.debut, debit_par_jour: arr(Math.abs(e.debit), 4) },
      preuve: { methode: 'résidu de conservation entre stock intégré et relevés', reproduire }, cout: { calcul_s: null, note: 'inclus dans le bilan', experiences: 0 } });
    reg.ajouter({ ...base, type: 'economie', auteur: 'LAVOISIER', moteur: L.IDENTITE, cible: id,
      cout: { calcul_s: arr(secs, 1), note: 'coût du bilan entier ; aucune expérience, aucune action sur l’entreprise' },
      risque: { fausse_detection: L.RISQUE_DEV, cause: 'inconnue : le bilan chiffre la fuite, il n’en donne pas la cause' },
      gain: { base: 'comptable', unite: '€', deja_perdu: arr(eur(perdu), 0), par_an_si_colmatee: arr(eur(Math.abs(e.debit) * JOURS), 0),
        en_unites: enEuros ? null : { perdu: arr(perdu, 1), unite: stock?.unit }, valorisation: enEuros ? 'directe (stock en euros)' : px ? `au prix unitaire médian observé (${arr(px.median, 2)} € ; de ${arr(px.bas, 2)} à ${arr(px.haut, 2)} €)` : 'impossible : aucun prix observé',
        nature: 'gain potentiel si la fuite est colmatée ; rien n’a été colmaté' } });
    return { e, id, enEuros };
  });
  if (!fuites.length) reg.ajouter({ ...base, type: 'aveu', auteur: 'LAVOISIER', moteur: L.IDENTITE, depend_de: [idCorps], motif: 'Aucun écart de conservation détecté : aucune fuite à signaler.' });

  // 3. Transmission des débits reconstruits
  const D = debits(E.observe, corps, 3);
  if (D.length < 3) { reg.ajouter({ ...base, type: 'aveu', auteur: 'registre', depend_de: [idCorps], motif: 'Moins de trois débits portant montant et quantité : rien à transmettre à GALILÉE ni à CORTEX.' }); }
  else {
    // 3a. GALILÉE : quantité hebdomadaire en fonction du prix relatif, sur les 39 premières semaines seulement
    for (const d of D) {
      const H = hebdo(d), app = H.slice(0, SEM_APPRENTISSAGE), neuf = H.slice(SEM_APPRENTISSAGE);
      const prixVus = new Set(app.map((h) => h.p.toFixed(3))).size;
      if (prixVus < 3) { reg.ajouter({ ...base, type: 'aveu', auteur: 'GALILÉE', moteur: G.IDENTITE, depend_de: [idCorps], motif: `Débit ${d.objet} : ${prixVus} niveau(x) de prix seulement en 39 semaines, pas de loi à chercher.` }); continue; }
      const loi = G.loiSurDonnees({ noms: ['p'], cible: 'q', X: app.map((h) => [h.p]), y: app.map((h) => h.q), graine });
      const vals = loi.texte ? app.map((h) => loi.f([h.p])) : [];
      if (!loi.texte || Math.max(...vals) - Math.min(...vals) < 1e-9 * (Math.abs(vals[0]) + 1)) { reg.ajouter({ ...base, type: 'aveu', auteur: 'GALILÉE', moteur: G.IDENTITE, depend_de: [idCorps], motif: `Débit ${d.objet} : je ne trouve qu’une constante (${loi.texte ?? 'rien'}) sur 39 semaines et ${prixVus} niveaux de prix. Aucun effet du prix n’est détectable dans ces données ; ce n’est pas la preuve qu’il n’y en a pas.`, cout: { calcul_s: arr(loi.secs, 1) } }); continue; }
      const idLoi = reg.ajouter({ ...base, type: 'affirmation', auteur: 'GALILÉE', moteur: G.IDENTITE, depend_de: [idCorps], sujet: `débit ${d.objet} : loi quantité–prix`,
        enonce: `quantité hebdomadaire de ${d.objet} ≈ ${loi.texte}, où p est le prix rapporté au prix initial (${arr(d.prix_initial, 2)} €).`,
        certitude: { niveau: 'hypothèse', verdict_moteur: loi.verdict ?? 'aucun', garantie: `aucune : données subies, prix non randomisé. ${loi.pourquoi ?? ''}`.trim() },
        contenu: { formule: loi.texte, variable: 'p = prix / prix initial', semaines: SEM_APPRENTISSAGE, niveaux_de_prix: prixVus },
        preuve: { methode: 'recherche symbolique sur 39 semaines de débit reconstruit par LAVOISIER', donnees: empreinte(app).slice(0, 16), reproduire },
        cout: { calcul_s: arr(loi.secs, 1), experiences: 0 } });
      // mise à l'épreuve par le registre : 13 semaines neuves, contre la moyenne des 39 premières
      const moy = app.reduce((s, h) => s + h.q, 0) / app.length;
      const dif = neuf.map((h) => { const v = loi.f([h.p]); return (h.q - moy) ** 2 - (h.q - (Number.isFinite(v) ? v : moy)) ** 2; });
      const md = dif.reduce((a, b) => a + b, 0) / dif.length, et = Math.sqrt(dif.reduce((s, x) => s + (x - md) ** 2, 0) / (dif.length - 1) / dif.length);
      const t = et > 0 ? md / et : 0, rm = (f) => Math.sqrt(neuf.reduce((s, h) => s + (h.q - f(h)) ** 2, 0) / neuf.length);
      reg.ajouter({ ...base, type: 'verification', auteur: 'registre', cible: idLoi, portee: 'prevision',
        methode: '13 semaines neuves (40 à 52) : la loi prévoit-elle mieux que la moyenne des 39 premières ? Test unilatéral à 5 % sur les écarts quadratiques appariés, dans les deux sens',
        verdict: t > 1.782 ? 'confirme' : t < -1.782 ? 'refute' : 'indecis',
        mesure: { nom: 't (12 ddl)', valeur: arr(t, 2), seuil: 1.782, rmse_loi: arr(rm((h) => loi.f([h.p])), 2), rmse_moyenne: arr(rm(() => moy), 2), niveaux_de_prix_neufs: new Set(neuf.map((h) => h.p.toFixed(3))).size } });
      reg.ajouter({ ...base, type: 'experience', auteur: 'registre', but: [idLoi],
        plan: { principe: 'faire varier le prix de cet objet au hasard, par blocs, pour que la loi puisse gagner ou perdre un pari (conception de LAVOISIER, § 10.2)' },
        cout_prevu: { valeur: null, raison: 'non chiffrable : le jumeau épistémique de LAVOISIER, qui chiffrerait le coût d’un essai de prix, n’est pas écrit' },
        risque: { reversible: true, note: 'un prix se défait ; l’effet sur la marge reste inconnu tant que la loi est une hypothèse' },
        autorisation: 'impossible', raison: 'le générateur d’entreprises de LAVOISIER ne se pilote pas (on ne peut pas y fixer un prix), et son registre des paris n’est pas écrit' });
    }
    // 3b. CORTEX : modes lents entre les trois débits, prix relatifs des deux premiers en leviers
    const Y = Array.from({ length: JOURS }, (_, t) => D.map((d) => Math.log(d.q[t] + 1)));
    const U = Array.from({ length: JOURS }, (_, t) => [Math.log(D[0].p[t]), Math.log(D[1].p[t])]);
    const mc = C.modesCaches({ Y, U });
    const noms = [...D.map((d) => `débit ${d.objet}`), `prix ${D[0].objet}`, `prix ${D[1].objet}`];
    if (!mc.modes.length) reg.ajouter({ ...base, type: 'aveu', auteur: 'CORTEX', moteur: C.IDENTITE, depend_de: [idCorps],
      motif: `Aucun mode lent n’a gagné son pari sur les trois débits transmis (seuil log E = ${arr(mc.seuil, 2)}, ${arr(mc.secs, 1)} s de calcul). Je ne propose aucun mécanisme caché, et je ne peux pas juger la loi de GALILÉE : mon pari sur une formule n’existe que dans mes propres mondes.`,
      contenu: { mesures: noms.slice(0, 3), leviers: noms.slice(3), transformation: 'log(quantité + 1), log(prix relatif)', donnees: empreinte({ Y, U }).slice(0, 16) } });
    for (const md of mc.modes) {
      const src = md.poids.map((w, j) => (w ? `${noms[j]} (${arr(w, 2)})` : null)).filter(Boolean).join(', ');
      reg.ajouter({ ...base, type: 'affirmation', auteur: 'CORTEX', moteur: C.IDENTITE, depend_de: [idCorps], sujet: `${noms[md.cible]} : mode caché`,
        enonce: `Le ${noms[md.cible]} dépend d’une mémoire lente (constante de temps ≈ ${arr(md.tau, 0)} jours) de : ${src}.`,
        certitude: { niveau: 'hypothèse', mesure: { nom: 'log E', valeur: arr(md.logE, 2), seuil: arr(mc.seuil, 2) }, garantie: 'le pari est gagné, mais sa garantie suppose des leviers exogènes : ici les prix sont subis, donc le niveau reste « hypothèse ». Le pari certifie une existence, pas cette description.' },
        contenu: { tau: arr(md.tau, 1), accepte_au_jour: md.accepte_au_jour, transformation: 'log(quantité + 1), log(prix relatif)' },
        preuve: { methode: 'modes à τ continu, pari invariant (engine.js, P1)', donnees: empreinte({ Y, U }).slice(0, 16), reproduire }, cout: { calcul_s: arr(mc.secs, 1), experiences: 0 } });
    }
  }

  // 4. Vérité du banc, ouverte après tous les jugements
  E.ouvrir();
  const m = L.evaluer(E.verite, corps), cachés = E.verite.hidden.map((h) => ({ ...h, pris: false }));
  const profitVrai = E.verite.profitMensuel.reduce((a, b) => a + b, 0);
  reg.ajouter({ ...base, type: 'verification', auteur: 'banc', cible: idCorps, portee: 'verite-du-banc', methode: 'évaluateur du protocole M0 (src/bench/evaluate.js)',
    verdict: m.F >= 0.9 && m.P != null && m.P <= 0.05 ? 'confirme' : m.F < 0.7 ? 'refute' : 'indecis',
    mesure: { F_types: arr(m.F), L_appariement: arr(m.L), G_incidence: arr(m.G), S_stocks: arr(m.S), P_profit: arr(m.P), profit_vrai: Math.round(profitVrai), profit_reconstruit: Math.round(profit), flux_caches: `${m.hiddenFound} retrouvé(s) sur ${m.hiddenAbove}`, fausses_detections: m.FD } });
  for (const f of fuites) {
    const h = cachés.find((x) => !x.pris && Math.abs(f.e.debut - x.debut) <= 21 && Math.abs(Math.abs(f.e.debit) - x.debit) <= 0.5 * x.debit);
    if (h) h.pris = true;
    reg.ajouter({ ...base, type: 'verification', auteur: 'banc', cible: f.id, portee: 'verite-du-banc', methode: 'flux caché du générateur de même début (± 21 jours) et de même débit (± 50 %)',
      verdict: h ? 'confirme' : 'refute', mesure: h ? { nature: h.kind, debut_vrai: h.debut, debit_vrai: arr(h.debit, 4), total_vrai: arr(h.total, 2), unite: f.enEuros ? '€' : 'unités' } : { note: 'aucun flux caché ne correspond : fausse détection' } });
  }
  for (const h of cachés.filter((x) => !x.pris)) reg.ajouter({ ...base, type: 'aveu', auteur: 'banc', motif: `Flux caché non retrouvé par le bilan : ${h.kind} depuis le jour ${h.debut} (${arr(h.debit, 3)} par jour, ${h.above ? 'au-dessus' : 'au-dessous'} du seuil de détection du protocole).` });
}
