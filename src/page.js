// Génère page/index.html à partir du registre. La page n'ajoute aucun fait : tout ce qu'elle montre est une ligne
// du journal ou une valeur déduite de ces lignes (niveau courant, totaux).
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { NIVEAUX } from './certitude.js';
import { PROVENANCE, integrite } from './adaptateurs/moteurs.js';
import { bilanCampagne } from './pistes.js';
import { comptes } from './comptes.js';

const h = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const nb = (x, d = 2) => (x == null ? '—' : Number(x).toLocaleString('fr-FR', { maximumFractionDigits: d }));
const eur = (x) => (x == null ? '—' : `${Math.round(x).toLocaleString('fr-FR')} €`);
const cls = (a) => ({ 'GALILÉE': 'galilee', CORTEX: 'cortex', LAVOISIER: 'lavoisier' }[a] ?? 'neutre');
const puce = (a) => `<span class="qui ${cls(a)}">${h(a)}</span>`;
const niv = (n, extra = '') => `<span class="niv n${NIVEAUX[n].rang}">${h(n)}${extra}</span>`;
const TYPE_FR = { probleme: 'Problème', affirmation: 'Affirmation', contestation: 'Contestation', verification: 'Vérification', experience: 'Expérience', resultat: 'Résultat', economie: 'Économie', aveu: 'Aveu', piste: 'Piste', jalon: 'Jalon', opportunite: 'Opportunité' };
const VERDICT = { confirme: ['confirme', 'bon'], refute: ['réfute', 'mauvais'], indecis: ['ne tranche pas', 'alerte'] };
const PORTEE = { pari: 'pari', prevision: 'prévision', 'verite-du-banc': 'vérité du banc', 'temoin-negatif': 'témoin négatif', recevabilite: 'recevabilité' };

function mesure(m) {
  if (!m) return '';
  if (m.valeur != null && m.seuil != null) return `<span class="mes">${h(m.nom ?? 'mesure')} = ${nb(m.valeur)} <span class="sur">seuil ${nb(m.seuil)}</span></span>`;
  if (m.valeur != null) return `<span class="mes">${h(m.nom ?? 'mesure')} : ${h(typeof m.valeur === 'number' ? nb(m.valeur, 3) : m.valeur)}</span>`;
  return '';
}

function corps(r, reg) {
  const cible = r.cible ? reg.get(r.cible) : null;
  const vers = cible ? `<p class="vers">à propos de <a href="#r${cible.n}">n° ${cible.n}</a> — ${h((cible.enonce ?? cible.plan?.duree ?? cible.plan?.principe ?? '').slice(0, 110))}</p>` : '';
  switch (r.type) {
    case 'probleme': return `<p class="fort">${h(r.question)}</p><p class="petit">Source : ${h(r.source.generateur)} · graine ${h(r.source.graine)} (${h(r.source.statut)})</p>`;
    case 'affirmation': return `<p class="fort">${h(r.enonce)}</p><p>${niv(r.certitude.niveau, ' à l’entrée')} ${r.certitude.verdict_moteur ? `<span class="mes">verdict propre du moteur : ${h(r.certitude.verdict_moteur)}</span>` : ''} ${mesure(r.certitude.mesure)}</p><p class="petit">Garantie : ${h(r.certitude.garantie ?? '—')}</p><p class="petit">Obtenue par : ${h(r.preuve.methode)}${r.cout.calcul_s != null ? ` · ${nb(r.cout.calcul_s, 1)} s de calcul` : ''}</p>`;
    case 'contestation': return `${vers}<p>${h(r.motif)}</p>`;
    case 'verification': { const [t, c] = VERDICT[r.verdict]; const temoin = r.portee === 'temoin-negatif'; return `${vers}<p><span class="verd ${temoin ? (r.verdict === r.attendu ? 'bon' : 'mauvais') : c}">${temoin ? (r.verdict === r.attendu ? 'non confirmé, comme attendu' : 'CONFIRMÉ À TORT') : t}</span> <span class="mes">${h(PORTEE[r.portee])}</span> ${mesure(r.mesure)}</p><p class="petit">${h(r.methode)}</p>${r.mesure && r.mesure.valeur == null ? `<p class="petit donnees">${Object.entries(r.mesure).map(([k, v]) => `${h(k.replaceAll('_', ' '))} : ${h(typeof v === 'number' ? nb(v, 4) : v)}`).join(' · ')}</p>` : ''}${r.mesure?.rmse_loi != null ? `<p class="petit donnees">erreur de la loi ${nb(r.mesure.rmse_loi)} · erreur de la moyenne ${nb(r.mesure.rmse_moyenne)}</p>` : ''}`; }
    case 'experience': { const a = r.autorisation; return `<p><span class="verd ${a === 'automatique' ? 'bon' : a === 'impossible' ? 'mauvais' : 'alerte'}">${a === 'automatique' ? 'exécutée sans revue' : a === 'impossible' ? 'impossible aujourd’hui' : 'revue humaine requise'}</span></p><p>${h(r.plan.duree ?? r.plan.principe)}</p>${r.plan.reglages ? `<p class="petit donnees">réglages (u0, u1) par bloc : ${r.plan.reglages.map((u) => `(${u[0]} ; ${u[1]})`).join(' ')}</p>` : ''}${r.raison ? `<p class="petit">${h(r.raison)}</p>` : ''}<p class="petit">Coût prévu : ${r.cout_prevu.jours ? `${r.cout_prevu.jours} jours, |u0| moyen ${nb(r.cout_prevu.moyenne_abs_u0)} (plafond ${nb(r.cout_prevu.plafond.u0)}), part de jours u1 ${nb(r.cout_prevu.part_jours_u1)} (plafond ${nb(r.cout_prevu.plafond.u1)})` : h(r.cout_prevu.raison)}</p><p class="petit">Risque : ${h(r.risque.fausse_confirmation ? `fausse confirmation ${r.risque.fausse_confirmation}` : r.risque.note)}</p>`; }
    case 'resultat': { const e = reg.get(r.experience); return `<p class="vers">résultat de l’expérience <a href="#r${e.n}">n° ${e.n}</a></p><p><span class="verd ${r.mesures.pari_gagne ? 'bon' : 'alerte'}">${r.mesures.pari_gagne ? 'pari gagné' : 'pari non gagné'}</span> <span class="mes">log E = ${nb(r.mesures.logE)} <span class="sur">seuil ${nb(r.mesures.seuil)}</span></span></p><p class="petit donnees">erreur de prévision ${nb(r.mesures.rmse_sans, 4)} → ${nb(r.mesures.rmse_avec, 4)} avec la loi · ${nb(r.cout_reel.calcul_s, 1)} s de calcul</p>`; }
    case 'opportunite': return `<p class="fort">${h(r.titre)}</p><p>${h(r.description)}</p><p><span class="mes">${h(r.secteur)}</span> <span class="mes">${h(r.statut)}</span></p>`;
    case 'jalon': return `<p class="fort">${h(r.travail)} — ${h(r.mesure)}</p><p><span class="mes">avant : ${h(r.avant)}</span> <span class="mes">après : ${h(r.apres)}</span></p>`;
    case 'piste': return `<p class="fort">${h(r.titre)}</p><p>${h(r.resume)}</p>`;
    case 'economie': { const g = r.gain; if (g.encaisse != null) return `${vers}<p><span class="mes">encaissé : ${eur(g.encaisse)}</span></p><p class="petit">${h(g.nature)}</p>`; return `${vers}<p>${g.base === 'non mesurable' ? `<span class="verd alerte">gain non mesurable</span></p><p class="petit">${h(g.raison)}` : `<span class="mes">déjà perdu : ${eur(g.deja_perdu)}</span> <span class="mes">par an si colmatée : ${eur(g.par_an_si_colmatee)}</span></p><p class="petit">${h(g.valorisation)} · ${h(g.nature)}`}</p>`; }
    case 'aveu': return `<p>${h(r.motif)}</p>`;
    default: return '';
  }
}

const carte = (r, reg) => `<article class="acte ${cls(r.auteur)} t-${r.type}" id="r${r.n}" data-qui="${cls(r.auteur)}">
  <header><span class="num">n° ${r.n}</span><span class="type">${TYPE_FR[r.type]}</span>${puce(r.auteur)}${r.moteur ? `<span class="commit">${h(r.moteur.commit)}</span>` : ''}<span class="id">${h(r.id)}</span></header>
  ${corps(r, reg)}
  <details><summary>Ligne brute du journal</summary><pre>${h(JSON.stringify(r, null, 1))}</pre></details>
</article>`;

export function ecrirePage(reg, chemin) {
  const v = reg.verifier(), integ = integrite(), etat = reg.etat();
  const problemes = reg.lignes.filter((r) => r.type === 'probleme');
  const eco = reg.lignes.filter((r) => r.type === 'economie');
  const comptable = eco.filter((e) => e.gain.base === 'comptable' && e.gain.encaisse == null);
  const calcul = reg.lignes.reduce((s, r) => s + (r.type === 'affirmation' ? r.cout.calcul_s ?? 0 : r.type === 'resultat' ? r.cout_reel.calcul_s ?? 0 : 0), 0);
  const jours = reg.lignes.filter((r) => r.type === 'resultat').reduce((s, r) => s + (r.cout_reel.jours ?? 0), 0);
  const parNiveau = Object.keys(NIVEAUX).map((n) => [n, etat.filter((e) => e.niveau === n).length]).filter(([, c]) => c);
  const vraiesAff = etat.filter((e) => !e.sujet.includes('témoin négatif'));
  const bc = bilanCampagne(reg), E = bc.entreprises, F = bc.formes;
  const cp = comptes(reg);
  const repere = (r) => `<tr><td>${r.atteint === true ? '<span class="verd bon">atteint</span>' : r.atteint === false ? '<span class="verd mauvais">manque</span>' : '<span class="sur">—</span>'}</td><td>${h(r.mesure)}${r.note ? `<div class="petit">${h(r.note)}</div>` : ''}</td><td class="n">${r.valeur == null ? 'non mesuré' : nb(r.valeur, 3) + (r.unite ? ' ' + r.unite : '')}</td><td class="n">${r.seuil != null ? nb(r.seuil, 3) : r.cible != null ? `<span class="sur">${nb(r.cible, 3)} proposé</span>` : '—'}</td><td>${r.travail ? `<span class="mes">${h(r.travail)}</span>` : ''}</td></tr>`;
  const TRAVAUX = { 'GALILÉE': [['G1', 'Ne plus se dire convaincu à tort'], ['G2', 'Lois sur des comptages : mesuré, hypothèse contredite, module non écrit'], ['G3', 'Terres inconnues']], CORTEX: [['C1', 'Test unique de P3 : fait, trois critères atteints (84 % contre 23 %)'], ['C2', 'Exporter son juge pour des données extérieures'], ['C3', 'P4 : agir, arbitrer avec le profit']], LAVOISIER: [['L1', 'Seuils de M0 : fausses détections 0,20 → 0,09 ; profit encore hors seuil'], ['L2', 'Entreprise pilotable'], ['L3', 'Lecteur d’écritures réelles']] };
  const opps = reg.lignes.filter((r) => r.type === 'opportunite').sort((a, b) => a.rang - b.rang);
  const ST = { 'retenue en premier': 'bon', 'en attente': 'alerte', 'non instruisible': 'sur', 'écartée': 'mauvais' };
  const pistes = reg.lignes.filter((r) => r.type === 'piste').sort((a, b) => a.rang - b.rang);
  const boutique = reg.lignes.find((r) => r.type === 'affirmation' && r.sujet === 'revenu réel');
  const pays = reg.lignes.find((r) => r.type === 'affirmation' && r.sujet === 'origine des visites');
  const encaisse = eco.filter((e) => e.gain.encaisse != null).reduce((s, e) => s + e.gain.encaisse, 0) + pistes.reduce((s, x) => s + x.argent_reel, 0);
  const BASE = { 'mesuré': 'bon', 'mesuré en simulation': 'alerte', 'estimé': 'alerte', 'inconnu': 'mauvais' };
  const critere = (nom, c) => `<div class="crit"><dt>${nom} <span class="base ${BASE[c.base]}">${h(c.base)}</span></dt><dd>${h(c.texte)}</dd></div>`;
  const notables = vraiesAff.filter((e) => e.niveau !== 'hypothèse');
  const ecoSim = eco.filter((e) => e.gain.encaisse == null);
  const barres = (obj, livres) => { const max = Math.max(...Object.values(obj)); return Object.entries(obj).slice(0, 6).map(([k, n]) => `<div class="barre"><span>${h(k)}${livres ? (livres.includes(k) ? '' : ' <i>non livré</i>') : ''}</span><b style="width:${Math.max(1, (100 * n) / max)}%"></b><em>${n}</em></div>`).join(''); };
  const bancOk = (b) => (b === 'confirme' ? '<span class="verd bon">confirmée</span>' : b === 'refute' ? '<span class="verd mauvais">démentie</span>' : b === 'indecis' ? '<span class="verd alerte">indécise</span>' : '<span class="sur">—</span>');

  const html = `<title>Page de travail commune</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Serif:wght@500;600&display=swap">
<style>
/* Mise en page : un cahier de laboratoire. Une colonne de lecture, le journal en fil chronologique, chaque acte marqué de la couleur de son auteur. */
:root{--fond:#f3f5f7;--carte:#fff;--encre:#17212b;--sourd:#586573;--trait:#d8dfe6;--creux:#eaeef2;
--galilee:#2a5db0;--cortex:#9c3a80;--lavoisier:#1c7a60;--neutre:#66717d;--bon:#24764a;--alerte:#9a5f00;--mauvais:#b0362e;
--titre:"IBM Plex Serif",Georgia,serif;--texte:"IBM Plex Sans",system-ui,sans-serif;--mono:"IBM Plex Mono",ui-monospace,Menlo,monospace}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--fond:#11161c;--carte:#19212a;--encre:#e6ebf0;--sourd:#9aa7b4;--trait:#2c3743;--creux:#212b36;--galilee:#7fa9ee;--cortex:#dc8cc6;--lavoisier:#63c5a6;--neutre:#a0abb6;--bon:#6fcf97;--alerte:#e2b25a;--mauvais:#f08a80;color-scheme:dark}}
:root[data-theme="dark"]{--fond:#11161c;--carte:#19212a;--encre:#e6ebf0;--sourd:#9aa7b4;--trait:#2c3743;--creux:#212b36;--galilee:#7fa9ee;--cortex:#dc8cc6;--lavoisier:#63c5a6;--neutre:#a0abb6;--bon:#6fcf97;--alerte:#e2b25a;--mauvais:#f08a80;color-scheme:dark}
*{box-sizing:border-box}
body{background:var(--fond);color:var(--encre);font:15px/1.55 var(--texte);padding-block:28px 64px;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))}
main{max-width:920px;margin:0 auto;display:flex;flex-direction:column;gap:40px}
section{display:flex;flex-direction:column;gap:14px;min-width:0}
h1{font:600 30px/1.2 var(--titre);margin:0;text-wrap:balance}
h2{font:600 21px/1.3 var(--titre);margin:0;text-wrap:balance}
h3{font:600 16px/1.35 var(--texte);margin:0}
p{margin:0;max-width:68ch}
a{color:inherit}
.chapo{color:var(--sourd);font-size:16px}
.petit{font-size:13px;color:var(--sourd)}
.donnees,.num,.id,.commit,.mes,td.n{font-family:var(--mono);font-variant-numeric:tabular-nums}
.etat{display:flex;flex-wrap:wrap;gap:8px 22px;font-size:13px;border-block:1px solid var(--trait);padding-block:10px}
.etat b{font-weight:600}
.qui{font:500 12px/1 var(--mono);letter-spacing:.04em;padding:4px 7px;border:1px solid currentColor;border-radius:3px;white-space:nowrap}
.galilee{--c:var(--galilee)}.cortex{--c:var(--cortex)}.lavoisier{--c:var(--lavoisier)}.neutre{--c:var(--neutre)}
.qui{color:var(--c)}
.niv{font:500 12px/1 var(--texte);padding:4px 8px;border-radius:99px;border:1.5px solid var(--encre);white-space:nowrap;display:inline-block}
.niv.n5,.niv.n4,.niv.n3{background:var(--encre);color:var(--carte)}
.niv.n2{border-style:dashed}
.niv.n1{border-style:dotted;color:var(--sourd);border-color:var(--sourd)}
.niv.n0{text-decoration:line-through;color:var(--mauvais);border-color:var(--mauvais)}
.verd{font-weight:600}.bon{color:var(--bon)}.alerte{color:var(--alerte)}.mauvais{color:var(--mauvais)}
.mes{font-size:12.5px;background:var(--creux);padding:2px 6px;border-radius:3px;display:inline-block}
.sur{color:var(--sourd)}
.moteurs{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:12px}
.moteur{background:var(--carte);border-top:3px solid var(--c);padding:14px 16px;display:flex;flex-direction:column;gap:8px;min-width:0}
.moteur h3{color:var(--c)}
.moteur ul,.limites{margin:0;padding-left:18px;display:flex;flex-direction:column;gap:4px;font-size:13.5px}
.moteur .non{color:var(--sourd)}
.schema{background:var(--carte);padding:12px;overflow-x:auto}
.schema svg{display:block;min-width:620px;width:100%;height:auto}
.schema text{font-family:var(--texte);fill:var(--encre)}
.schema .l{font-size:11px;fill:var(--sourd)}
.schema .b{fill:var(--carte);stroke-width:1.5}
.schema .f{fill:none;stroke:var(--sourd);stroke-width:1.2}
.tableau{overflow-x:auto;background:var(--carte)}
table{border-collapse:collapse;width:100%;font-size:13.5px;min-width:640px}
th{font:500 11.5px/1.3 var(--texte);letter-spacing:.06em;text-transform:uppercase;color:var(--sourd);text-align:left;padding:9px 10px;border-bottom:1px solid var(--trait)}
td{padding:9px 10px;border-bottom:1px solid var(--trait);vertical-align:top}
td.n{text-align:right;white-space:nowrap}
tr:last-child td{border-bottom:0}
.filtres{display:flex;flex-wrap:wrap;gap:8px}
.filtres button{font:500 13px/1 var(--texte);padding:8px 12px;border:1px solid var(--trait);background:var(--carte);color:var(--encre);border-radius:4px;cursor:pointer}
.filtres button[aria-pressed="true"]{background:var(--encre);color:var(--carte);border-color:var(--encre)}
.filtres button:focus-visible,a:focus-visible,summary:focus-visible{outline:2px solid var(--galilee);outline-offset:2px}
.fil{display:flex;flex-direction:column;gap:8px}
.acte{background:var(--carte);border-left:3px solid var(--c);padding:12px 14px;display:flex;flex-direction:column;gap:6px;min-width:0}
.acte header{display:flex;flex-wrap:wrap;align-items:center;gap:8px;font-size:12px}
.acte .num{color:var(--sourd)}.acte .type{font-weight:600;font-size:13px}
.acte .id,.acte .commit{color:var(--sourd);font-size:11px}.acte .id{margin-left:auto}
.acte .fort{font-size:15.5px;font-weight:500}
.acte .vers{font-size:13px;color:var(--sourd)}
.acte.t-probleme{border-left-width:0;background:none;padding-inline:0}
details summary{font-size:12px;color:var(--sourd);cursor:pointer}
pre{font:11.5px/1.5 var(--mono);background:var(--creux);padding:10px;margin:6px 0 0;overflow-x:auto;white-space:pre-wrap;word-break:break-word}
.argent{display:flex;flex-wrap:wrap;align-items:baseline;gap:6px 18px;background:var(--carte);padding:16px 18px;border-top:3px solid var(--encre)}
.argent strong{font:600 34px/1 var(--titre);font-variant-numeric:tabular-nums}
.deux{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px}
.bloc{background:var(--carte);padding:14px 16px;display:flex;flex-direction:column;gap:8px;min-width:0}
.barre{display:grid;grid-template-columns:118px 1fr 34px;gap:8px;align-items:center;font-size:12.5px}
.barre b{height:10px;background:var(--neutre);display:block}.barre em{font-style:normal;text-align:right;font-family:var(--mono)}.barre i{color:var(--mauvais);font-style:normal}
.entonnoir{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:var(--trait)}
.entonnoir div{background:var(--carte);padding:10px 8px;text-align:center;font-size:12px;color:var(--sourd);min-width:0}
.entonnoir b{display:block;font:600 22px/1.2 var(--mono);color:var(--encre)}
.piste{background:var(--carte);padding:16px 18px;display:flex;flex-direction:column;gap:10px;min-width:0}
.piste .rang{font:500 12px var(--mono);color:var(--sourd)}
.piste dl{margin:0;display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:10px 20px}
.crit{min-width:0}.crit dt{font:600 12px/1.4 var(--texte);letter-spacing:.05em;text-transform:uppercase}.crit dd{margin:2px 0 0;font-size:13.5px}
.base{font:500 11px var(--mono);letter-spacing:0;text-transform:none;border:1px solid currentColor;border-radius:3px;padding:1px 5px;margin-left:4px}
.essai{border-top:1px solid var(--trait);padding-top:10px;font-size:13.5px}
.chiffres{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:1px;background:var(--trait)}
.chiffres div{background:var(--carte);padding:12px;font-size:12.5px;color:var(--sourd);min-width:0}
.chiffres b{display:block;font:600 20px/1.2 var(--mono);color:var(--encre)}
details.opp{background:var(--carte);padding:14px 18px;display:block}
details.opp>summary{cursor:pointer;display:flex;flex-wrap:wrap;gap:8px;align-items:center;font-size:15px}
details.opp>summary .rang{font:600 13px var(--mono);border:1.5px solid var(--encre);border-radius:99px;width:24px;height:24px;display:inline-flex;align-items:center;justify-content:center}
details.opp[open]>summary{margin-bottom:10px}
details.opp>p{margin-bottom:10px}
details.opp dl{margin:0 0 10px;display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:10px 20px}
details.opp .essai{margin-top:8px}
details.pli>summary{font:600 15px var(--texte);color:var(--encre);padding:10px 0;border-top:1px solid var(--trait)}
code{font:13px var(--mono);background:var(--creux);padding:1px 5px;border-radius:3px}
</style>
<main>
<section>
  <h1>Page de travail commune</h1>
  <p class="chapo">GALILÉE cherche les lois, CORTEX les mécanismes, LAVOISIER les comptes. Ils ne s’appellent pas entre eux : chacun lit et écrit dans un même journal, où tout acte porte son auteur, sa preuve, son coût et son niveau de certitude.</p>
  <div class="etat">
    <span><b>${v.lignes}</b> actes au journal</span>
    <span class="${v.ok ? 'bon' : 'mauvais'}"><b>Chaîne ${v.ok ? 'intacte' : 'rompue'}</b></span>
    <span class="${integ.ok ? 'bon' : 'mauvais'}"><b>${integ.fichiers} fichiers moteurs ${integ.ok ? 'non modifiés' : 'altérés'}</b></span>
    <span><b>${problemes.length}</b> dossiers</span>
    <span>dernier acte : ${h(reg.lignes.at(-1)?.date.slice(0, 16).replace('T', ' '))} UTC</span>
  </div>
</section>

<section>
  <div class="argent"><strong>${eur(encaisse)}</strong><span>réellement encaissés à ce jour, toutes pistes confondues.</span><span class="petit">Tout autre montant sur cette page est un potentiel ou une simulation.</span></div>
</section>
${boutique ? `<section>
  <h2>La boutique réelle</h2>
  <p>Le seul terrain où un euro peut être gagné aujourd’hui. Relevé en lecture seule du 13 novembre 2026 ; rien n’y a été modifié.</p>
  <div class="entonnoir"><div><b>${boutique.contenu.entonnoir.visites}</b>visites en 111 jours</div><div><b>${boutique.contenu.entonnoir.ajouts_au_panier}</b>ajouts au panier</div><div><b>${boutique.contenu.ventes.commandes_payantes}</b>commandes payantes</div><div><b>${eur(boutique.contenu.ventes.ventes_brutes_eur)}</b>de ventes</div></div>
  <div class="deux">
    <div class="bloc"><h3>D’où viennent les visites</h3>${barres(pays.contenu.visites_par_pays, ['IE', 'DE', 'BE', 'FR'])}<p class="petit">France : ${pays.contenu.visites_par_pays.FR ?? 0}. La boutique livre ${pays.contenu.pays_livres} pays d’Europe, pas les États-Unis.</p></div>
    <div class="bloc"><h3>Par quel chemin</h3>${barres(pays.contenu.visites_par_source)}<p class="petit">Visites par mois : ${Object.entries(boutique.contenu.visites_par_mois).map(([m, n]) => `${m.slice(5)}/${m.slice(2, 4)} : ${n}`).join(' · ')}</p></div>
  </div>
  <p><b>Lecture.</b> La boutique n’a pas été refusée par ses clients : elle ne les a pas rencontrés. Quatre visites seulement viennent d’un pays qu’elle livre, aucune de France. Chercher une loi de prix ou une fuite comptable n’a pas de sens ici tant qu’il n’y a ni visiteur réel ni vente. CORTEX a été lancé sur la série des visites et n’y trouve rien ; LAVOISIER et GALILÉE n’ont rien à traiter.</p>
</section>` : ''}
${opps.length ? `<section>
  <h2>Opportunités de valeur réelle</h2>
  <p>Huit opportunités instruites dans tous les secteurs, selon les mêmes dix points. Le registre refuse un potentiel chiffré en euros sans mesure, une opportunité sans expérience falsifiable ou sans condition d’abandon. Aucune n’a encore produit d’argent réel.</p>
  ${opps.map((o) => `<details class="opp" id="r${o.n}"${o.rang === 1 ? ' open' : ''}><summary><span class="rang">${o.rang}</span> <b>${h(o.titre)}</b> <span class="mes">${h(o.secteur)}</span> <span class="verd ${ST[o.statut]}">${h(o.statut)}</span></summary>
    <p>${h(o.description)}</p>
    <dl>
      <div class="crit"><dt>Déjà connu</dt><dd>${h(o.connu)}</dd></div>
      <div class="crit"><dt>Encore inconnu</dt><dd>${h(o.inconnu)}</dd></div>
      <div class="crit"><dt>Ce qui peut être découvert</dt><dd>${h(o.decouvrable)}</dd></div>
      ${critere('Faisabilité', o.faisabilite)}
      <div class="crit"><dt>Coût de la vérification <span class="base ${BASE[o.cout_verification.base]}">${h(o.cout_verification.base)}</span></dt><dd>Dépense nouvelle : ${eur(o.cout_verification.depense_eur)}. ${h(o.cout_verification.texte)}</dd></div>
      ${critere('Potentiel', o.potentiel)}
    </dl>
    <div class="essai"><b>Expérience falsifiable.</b> ${h(o.essai.hypothese)}<br><span class="sur">Mesure :</span> ${h(o.essai.mesure)}<br><span class="sur">Succès :</span> ${h(o.essai.succes)}${o.essai.duree ? `<br><span class="sur">Durée :</span> ${h(o.essai.duree)}` : ''}${o.essai.seuils_proposes ? `<br><span class="sur">Seuils :</span> ${h(o.essai.seuils_proposes)}` : ''}</div>
    <div class="essai"><b>Conditions d’abandon.</b><ul class="limites">${o.abandon.map((x) => `<li>${h(x)}</li>`).join('')}</ul></div>
    <div class="essai"><b>Valeur à ce jour :</b> ${eur(o.valeur.argent_reel_eur)} d’argent réel · preuve disponible : ${h(o.valeur.nature_de_la_preuve)} · ${o.depend_de.length} acte(s) du registre à l’appui<br><span class="sur">${Object.entries(o.moteurs).map(([m, t]) => `${h(m)} : ${h(t)}`).join(' · ')}</span></div>
  </details>`).join('')}
</section>` : ''}
${pistes.length ? `<section>
  <h2>Pistes de revenu : première évaluation</h2>
  <p>Évaluation du 13 novembre, conservée telle quelle ; les opportunités ci-dessus la reprennent et la complètent. Chaque critère porte la nature de sa preuve. « Inconnu » veut dire que personne ne l’a mesuré, pas que c’est nul.</p>
  ${pistes.map((x) => `<div class="piste" id="r${x.n}"><div class="rang">Piste ${x.rang} · issue du ${h(x.origine)} · encaissé : ${eur(x.argent_reel)}</div><h3>${h(x.titre)}</h3><p>${h(x.resume)}</p><dl>${critere('Potentiel', x.potentiel)}${critere('Coût', x.cout)}${critere('Risque', x.risque)}${critere('Faisabilité', x.faisabilite)}</dl><div class="essai"><b>Essai à petite échelle — ${h(x.test.etat)}.</b> ${h(x.test.resultat ?? x.test.protocole ?? '')} ${x.test.reste ? `<br><span class="sur">Reste à faire : ${h(x.test.reste)}</span>` : ''}${x.test.role_des_moteurs ? `<br><span class="sur">Rôle des moteurs : ${h(x.test.role_des_moteurs)}</span>` : ''}</div></div>`).join('')}
</section>` : ''}
<section>
  <h2>Ce que les moteurs ont trouvé ensemble, en simulation</h2>
  <p>Le connu : ${E.n} entreprises simulées, où LAVOISIER cherche les fuites puis transmet ses débits. L’inconnu : ${F.n} mondes où une loi cachée manque au modèle de CORTEX. Vérité des simulateurs lue après coup.</p>
  <div class="chiffres">
    <div><b>${E.confirmees} / ${E.fuites_signalees}</b>fuites signalées qui existaient</div>
    <div><b>${E.manquees}</b>fuites manquées</div>
    <div><b>${eur(E.eur_par_an)}</b>par an de fuites réelles retrouvées (simulé)</div>
    <div><b>${E.lois_prevision_confirmee} / ${E.lois_prix}</b>lois de prix confirmées en prévision</div>
    <div><b>${E.modes_cortex - cp.collectif.affirmations_ecartees} / ${E.modes_cortex}</b>mécanismes de CORTEX encore recevables</div>
    <div><b>${F.signalees} / ${F.n}</b>formes manquantes signalées</div>
    <div><b>${F.lois_empiriques} / ${F.lois}</b>lois démontrées par essai commun</div>
    <div><b>${F.temoins_refuses} / ${F.temoins}</b>formules fausses refusées</div>
  </div>
</section>

<section>
  <h2>Quatre comptes séparés</h2>
  <p>Un progrès de moteur, un progrès commun, une dépense et un euro encaissé ne se mélangent pas. Les repères individuels sont recopiés des résultats de chaque moteur ; les trois autres comptes sont déduits du journal.</p>
  <div class="chiffres">
    <div><b>${cp.collectif.lois_passees_a_empirique}</b>loi démontrée par essai commun</div>
    <div><b>${cp.collectif.affirmations_ecartees}</b>affirmations écartées après confrontation</div>
    <div><b>${cp.collectif.verifications_d_un_moteur_par_un_autre}</b>vérifications d’un moteur par un autre</div>
    <div><b>${cp.collectif.experiences_impossibles}</b>expériences consignées impossibles</div>
    <div><b>${nb(cp.couts.calcul_s, 0)} s</b>de calcul consigné</div>
    <div><b>${cp.couts.jours_d_essai_simules}</b>jours d’essai simulés</div>
    <div><b>${eur(cp.couts.euros_depenses)}</b>dépensés (abonnement de la boutique non relevé)</div>
    <div><b>${eur(cp.gains.euros_encaisses)}</b>encaissés</div>
  </div>
  <div class="moteurs">${Object.entries(cp.individuel).map(([m, x]) => `<div class="moteur ${cls(m)}"><h3>${h(m)}</h3><p class="petit">${h(x.etat)}</p><ul>${TRAVAUX[m].map(([c, t]) => `<li><b>${c}</b> ${h(t)}</li>`).join('')}</ul></div>`).join('')}</div>
  ${Object.entries(cp.individuel).map(([m, x]) => `<details class="pli"><summary>${h(m)} : repères individuels <span class="sur">· ${x.reperes.filter((r) => r.atteint === false).length} seuil(s) manqué(s) · ${x.jalons.length} jalon(s) · source ${h(x.source)} @ ${h(x.commit)}</span></summary><div class="tableau"><table><thead><tr><th>État</th><th>Mesure</th><th>Valeur</th><th>Seuil</th><th>Travail</th></tr></thead><tbody>${x.reperes.map(repere).join('')}</tbody></table></div>${x.jalons.length ? `<div class="tableau"><table><thead><tr><th>Travail</th><th>Progrès mesuré dans son dépôt</th><th>Avant</th><th>Après</th><th>Seuil</th></tr></thead><tbody>${x.jalons.map((j) => `<tr><td><span class="mes">${h(j.travail)}</span></td><td>${h(j.mesure)}<div class="petit">${h(j.portee)} · ${h(j.source)} @ ${h(j.moteur.commit)}${j.note ? ' · ' + h(j.note) : ''}</div></td><td class="n">${h(j.avant)}</td><td class="n">${h(j.apres)}</td><td class="n">${h(j.seuil ?? '—')}</td></tr>`).join('')}</tbody></table></div>` : ''}</details>`).join('')}
  <p class="petit">Confrontation T1 : ${cp.collectif.affirmations_ecartees} des 43 mécanismes de CORTEX venaient de factures mensuelles que le registre avait transmises comme des mesures quotidiennes. L’erreur était celle du registre ; la règle de transmission est corrigée. Programme complet : <code>programme/PROGRAMME.md</code>.</p>
</section>

<section>
  <h2>Ce qui est établi, et à quel degré</h2>
  <p>Le niveau affiché est recalculé à partir du journal. Une loi tirée de données subies entre comme hypothèse, quel que soit l’avis de son auteur. Seul un pari gagné sur des jours neufs la rend utilisable pour décider. La colonne « banc » compare à la vérité du simulateur, lue après coup : elle n’existe pas dans une vraie entreprise et ne change aucun niveau.</p>
  <div class="tableau"><table>
    <thead><tr><th>Niveau</th><th>Auteur</th><th>Affirmation</th><th>Problème</th><th>Banc</th></tr></thead>
    <tbody>${notables.map((e) => `<tr><td>${niv(e.niveau)}${e.historique.length > 1 ? `<div class="petit">entrée : ${h(e.historique[0])}</div>` : ''}${e.contestee ? '<div class="petit alerte">contestée</div>' : e.contestations ? '<div class="petit">contestée, puis tranchée</div>' : ''}</td><td>${puce(e.auteur)}</td><td><a href="#r${reg.get(e.id).n}">${h(e.enonce)}</a></td><td class="petit">${h(e.probleme)}</td><td>${bancOk(e.banc)}</td></tr>`).join('')}</tbody>
  </table></div>
  <p class="petit">${parNiveau.map(([n, c]) => `${c} ${n}`).join(' · ')} (témoins négatifs compris). Le tableau montre tout ce qui n’est pas une simple hypothèse ; les hypothèses sont dans le journal. Niveaux qui autorisent une décision : identité, établie, empirique.</p>
</section>

<section>
  <h2>Coûts, risques et gains en simulation</h2>
  <p>Dans les simulations, un gain n’est compté en euros que s’il sort d’une comptabilité : ce sont les fuites que LAVOISIER lit dans la conservation. Ce sont des gains possibles d’entreprises fictives ; rien n’a été colmaté, rien n’a été encaissé.</p>
  <div class="tableau"><table>
    <thead><tr><th>Objet</th><th>Coût</th><th>Risque</th><th>Déjà perdu</th><th>Par an si colmatée</th><th>Banc</th></tr></thead>
    <tbody>${ecoSim.filter((e) => e.gain.base !== 'comptable' || etat.find((x) => x.id === e.cible)?.banc !== undefined).map((e) => { const c = reg.get(e.cible), et = etat.find((x) => x.id === e.cible); const g = e.gain; return `<tr><td><a href="#r${c.n}">${h(c.enonce ?? `Expérience n° ${c.n} : ${c.plan.duree}`)}</a><div class="petit">${h(g.base === 'comptable' ? g.valorisation : 'gain ' + g.base)}</div></td><td class="petit">${e.cout.leviers ? `${e.cout.leviers.jours} jours d’essai, |u0| moyen ${nb(e.cout.leviers.moyenne_abs_u0)}<br>` : ''}${nb(e.cout.calcul_s, 1)} s de calcul${e.cout.leviers ? '' : '<br>aucune action'}</td><td class="petit">${e.risque.fausse_confirmation ? `fausse confirmation ${h(e.risque.fausse_confirmation)}` : `${nb(e.risque.fausse_detection.fausses_detections_par_entreprise)} fausse détection par entreprise en développement ; cause de la fuite inconnue`}</td><td class="n">${g.base === 'comptable' ? eur(g.deja_perdu) : '—'}</td><td class="n">${g.base === 'comptable' ? eur(g.par_an_si_colmatee) : '—'}</td><td>${et ? bancOk(et.banc) : '<span class="sur">—</span>'}</td></tr>`; }).join('')}</tbody>
  </table></div>
  <p class="petit">Total des fuites chiffrées : ${eur(comptable.reduce((s, e) => s + (e.gain.deja_perdu ?? 0), 0))} déjà perdus, ${eur(comptable.reduce((s, e) => s + (e.gain.par_an_si_colmatee ?? 0), 0))} par an si elles étaient colmatées. Dépense totale de la page : ${nb(calcul, 0)} s de calcul et ${jours} jours d’essai simulés. Tout cela est simulé : gain réalisé, 0 €.</p>
</section>

<section>
  <h2>Comment l’information circule</h2>
  <div class="schema"><svg viewBox="0 0 760 300" role="img" aria-label="Les trois moteurs écrivent dans le registre commun et y lisent les actes des autres">
    <defs><marker id="fl" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="var(--sourd)"/></marker></defs>
    <rect class="b" x="20" y="20" width="200" height="64" stroke="var(--galilee)"/><text x="120" y="47" text-anchor="middle" font-weight="600" fill="var(--galilee)" style="fill:var(--galilee)">GALILÉE</text><text class="l" x="120" y="66" text-anchor="middle">lois : formes symboliques</text>
    <rect class="b" x="280" y="20" width="200" height="64" stroke="var(--cortex)"/><text x="380" y="47" text-anchor="middle" font-weight="600" style="fill:var(--cortex)">CORTEX</text><text class="l" x="380" y="66" text-anchor="middle">mécanismes, paris, plans d’essai</text>
    <rect class="b" x="540" y="20" width="200" height="64" stroke="var(--lavoisier)"/><text x="640" y="47" text-anchor="middle" font-weight="600" style="fill:var(--lavoisier)">LAVOISIER</text><text class="l" x="640" y="66" text-anchor="middle">corps, fuites, euros</text>
    <rect class="b" x="110" y="150" width="540" height="72" stroke="var(--encre)"/><text x="380" y="180" text-anchor="middle" font-weight="600">Registre commun (journal chaîné, ajout seul)</text><text class="l" x="380" y="200" text-anchor="middle">problème · affirmation · contestation · vérification · expérience · résultat · économie · aveu</text>
    <path class="f" d="M120 84V150" marker-end="url(#fl)" marker-start="url(#fl)"/><path class="f" d="M380 84V150" marker-end="url(#fl)" marker-start="url(#fl)"/><path class="f" d="M640 84V150" marker-end="url(#fl)" marker-start="url(#fl)"/>
    <text class="l" x="128" y="112">loi de l’écart, loi des débits</text><text class="l" x="388" y="112">structure manquante, pari, plan</text><text class="l" x="528" y="112" text-anchor="start">débits reconstruits, fuites</text>
    <text class="l" x="128" y="128">verdict propre conservé</text><text class="l" x="388" y="128">conteste et tranche</text><text class="l" x="528" y="128">coût et gain en euros</text>
    <path class="f" d="M380 222V262" marker-end="url(#fl)"/><text x="380" y="282" text-anchor="middle" font-size="13">Niveau de certitude courant, recalculé à chaque lecture</text>
  </svg></div>
  <div class="moteurs">
    ${[['galilee', 'GALILÉE', ['Loi symbolique sur des données fournies', 'Verdict propre : établie, empirique, incertaine'], ['Choix de ses propres expériences : aucun problème commun n’offre de monde qu’il puisse interroger']],
       ['cortex', 'CORTEX', ['Modes lents acceptés par pari (deux leviers exactement)', 'Sonde « hors de portée », pari sur une formule, plan d’essai sous budget'], ['Sonde et pari sur des données extérieures : ils ne sont pas exportés hors de ses mondes', 'Pilotage d’une activité (v3 à v5) : non branché']],
       ['lavoisier', 'LAVOISIER', ['Bilan de matière : types de flux, stocks, profit, fuites', 'Vérité scellée jusqu’à la fin du jugement'], ['Atlas, jumeau, générateur d’opportunités, gouverneur, registre des paris : non écrits', 'Agir sur l’entreprise : son générateur ne se pilote pas']]]
      .map(([c, t, oui, non]) => { const m = PROVENANCE.moteurs.find((x) => x.nom === c); return `<div class="moteur ${c}"><h3>${t}</h3><p class="petit donnees">${h(m.depot)} @ ${h(m.commit.slice(0, 7))} · ${Object.keys(m.fichiers).length} fichiers gelés</p><ul>${oui.map((x) => `<li>${h(x)}</li>`).join('')}${non.map((x) => `<li class="non">Pas ici — ${h(x)}</li>`).join('')}</ul></div>`; }).join('')}
  </div>
</section>

<section>
  <h2>Le journal</h2>
  <div class="filtres" role="group" aria-label="Filtrer par auteur">
    ${[['tous', 'Tous'], ['galilee', 'GALILÉE'], ['cortex', 'CORTEX'], ['lavoisier', 'LAVOISIER'], ['neutre', 'Registre et banc']].map(([k, t], i) => `<button type="button" id="f-${k}" data-f="${k}" aria-pressed="${i === 0}">${t}</button>`).join('')}
  </div>
  ${problemes.map((p) => { const l = reg.lignes.filter((r) => r.probleme === p.cle); return `<details class="pli" id="${h(p.cle)}"><summary>${h(p.titre)} <span class="sur">· ${l.length} actes</span></summary><div class="fil">${l.map((r) => carte(r, reg)).join('\n')}</div></details>`; }).join('\n')}
</section>

<section>
  <h2>Ce que cette page ne fait pas</h2>
  <ul class="limites">
    <li>Aucun euro n’a été gagné. La seule donnée réelle est le relevé de la boutique ; tout le reste vient des simulateurs de développement de CORTEX et de LAVOISIER, dont les graines de test restent refusées.</li>
    <li>Aucun marché n’a été mesuré : le service de mots-clés connecté n’avait plus d’unités, et l’affichage public de la boutique n’a pas pu être contrôlé d’ici.</li>
    <li>Rien n’a été modifié dans la boutique et aucune dépense n’a été engagée : un essai réel demande une décision et un budget.</li>
    <li>Aucune loi économique n’a gagné de pari. Les lois quantité–prix restent des hypothèses, parce qu’on ne peut fixer aucun prix dans le simulateur de LAVOISIER.</li>
    <li>CORTEX ne peut juger une loi de GALILÉE que dans ses propres mondes. Pour qu’il la juge sur les débits de LAVOISIER, il faudrait qu’il exporte sa sonde et son pari.</li>
    <li>Le bilan de matière n’est pas gelé : ses résultats ici sont des résultats de développement, et son taux de fausses détections aussi.</li>
    <li>Aucune recherche d’opportunité au-delà des fuites : l’organe de LAVOISIER qui chiffrerait le gain d’un changement de prix n’existe pas encore.</li>
  </ul>
  <p class="petit">Refaire un problème : <code>node bin/commun.js executer forme-manquante --graine 7</code> · tout recontrôler : <code>node bin/commun.js verifier</code></p>
</section>
</main>
<script>
(function(){function ouvre(){var e=document.getElementById(location.hash.slice(1));if(e){var d=e.closest('details.pli');if(d){d.open=true;e.scrollIntoView()}}}window.addEventListener('hashchange',ouvre);ouvre();var bs=document.querySelectorAll('.filtres button');bs.forEach(function(b){b.addEventListener('click',function(){var f=b.dataset.f;bs.forEach(function(x){x.setAttribute('aria-pressed',x===b)});document.querySelectorAll('.acte').forEach(function(a){a.hidden=f!=='tous'&&a.dataset.qui!==f&&!a.classList.contains('t-probleme')})})})})();
</script>
`;
  mkdirSync(dirname(chemin), { recursive: true });
  writeFileSync(chemin, html);
  return `${chemin} (${Math.round(html.length / 1024)} ko, ${v.lignes} actes)`;
}
