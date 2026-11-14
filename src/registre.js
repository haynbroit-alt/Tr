// Le registre commun : un journal en ajout seul, une ligne JSON par enregistrement, chaîné par empreinte.
// C'est le seul point de contact entre les moteurs : aucun n'appelle l'autre, chacun lit et écrit ici.
import { createHash } from 'node:crypto';
import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { NIVEAUX, PORTEES } from './certitude.js';

const canon = (v) => (Array.isArray(v) ? `[${v.map(canon).join(',')}]`
  : v && typeof v === 'object' ? `{${Object.keys(v).sort().filter((k) => v[k] !== undefined).map((k) => `${JSON.stringify(k)}:${canon(v[k])}`).join(',')}}`
  : JSON.stringify(v ?? null));
export const empreinte = (v) => createHash('sha256').update(typeof v === 'string' ? v : canon(v)).digest('hex');

export const AUTEURS = ['GALILÉE', 'CORTEX', 'LAVOISIER', 'registre', 'banc', 'humain'];
// Champs obligatoires par type. Tout enregistrement porte en plus : probleme, auteur, date.
const TYPES = {
  probleme: ['titre', 'question', 'source'],
  affirmation: ['sujet', 'enonce', 'certitude', 'preuve', 'cout'],
  contestation: ['cible', 'motif'],
  verification: ['cible', 'methode', 'portee', 'verdict'],
  experience: ['but', 'plan', 'cout_prevu', 'risque', 'autorisation'],
  resultat: ['experience', 'mesures', 'cout_reel'],
  economie: ['cible', 'cout', 'risque', 'gain'],
  aveu: ['motif'],
  opportunite: ['secteur', 'titre', 'description', 'connu', 'inconnu', 'decouvrable', 'faisabilite', 'cout_verification', 'potentiel', 'essai', 'abandon', 'valeur', 'statut'],
  jalon: ['travail', 'mesure', 'avant', 'apres', 'source'],
  piste: ['titre', 'origine', 'potentiel', 'cout', 'risque', 'faisabilite', 'test', 'argent_reel'],
};

export class Registre {
  constructor(chemin) { this.chemin = chemin; this.lignes = []; if (existsSync(chemin)) this.lignes = readFileSync(chemin, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)); }
  get(id) { return this.lignes.find((r) => r.id === id); }

  _valider(r) {
    const faux = (m) => { throw new Error(`enregistrement refusé (${r.type ?? '?'}) : ${m}`); };
    if (!TYPES[r.type]) faux('type inconnu');
    if (!AUTEURS.includes(r.auteur)) faux(`auteur inconnu « ${r.auteur} »`);
    if (r.type !== 'probleme' && !this.lignes.some((x) => x.type === 'probleme' && x.cle === r.probleme)) faux(`problème inconnu « ${r.probleme} »`);
    for (const c of TYPES[r.type]) if (r[c] === undefined || r[c] === null || r[c] === '') faux(`champ manquant « ${c} »`);
    for (const ref of [r.cible, r.experience, ...(r.depend_de ?? []), ...(r.but ?? [])].filter(Boolean)) if (!this.get(ref)) faux(`référence inconnue ${ref}`);
    if (r.type === 'affirmation') {
      if (!NIVEAUX[r.certitude.niveau]) faux(`niveau de certitude inconnu « ${r.certitude.niveau} »`);
      if (!r.preuve.methode || !r.preuve.reproduire) faux('une affirmation doit dire comment elle a été obtenue et comment la reproduire');
      if (['GALILÉE', 'CORTEX', 'LAVOISIER'].includes(r.auteur) && !r.moteur?.commit) faux('une affirmation d’un moteur doit porter le commit du moteur');
    }
    if (r.type === 'verification') {
      if (!PORTEES.includes(r.portee)) faux(`portée inconnue « ${r.portee} »`);
      if (!['confirme', 'refute', 'indecis'].includes(r.verdict)) faux('verdict attendu : confirme, refute ou indecis');
      const cible = this.get(r.cible);
      if (cible.type !== 'affirmation') faux('on ne vérifie qu’une affirmation');
      if (cible.auteur === r.auteur) faux('personne ne vérifie sa propre affirmation');
    }
    if (r.type === 'piste') {
      for (const c of ['potentiel', 'cout', 'risque', 'faisabilite']) if (!['mesuré', 'mesuré en simulation', 'estimé', 'inconnu'].includes(r[c].base)) faux(`${c}.base attendu : mesuré, mesuré en simulation, estimé ou inconnu`);
      if (typeof r.argent_reel !== 'number') faux('argent_reel doit être un nombre d’euros réellement encaissés');
    }
    if (r.type === 'opportunite') {
      const BASES = ['mesuré', 'mesuré en simulation', 'estimé', 'inconnu'];
      for (const c of ['faisabilite', 'cout_verification', 'potentiel']) if (!BASES.includes(r[c].base) || !r[c].texte) faux(`${c} doit porter un texte et une base (${BASES.join(', ')})`);
      // pas de chiffre inventé : un montant en euros dans le potentiel exige une mesure, et une mesure exige sa preuve
      if (/\d\s*(€|euros?)/i.test(r.potentiel.texte) && !['mesuré', 'mesuré en simulation'].includes(r.potentiel.base)) faux('un potentiel chiffré en euros doit reposer sur une mesure, pas sur une estimation');
      if (['mesuré', 'mesuré en simulation'].includes(r.potentiel.base) && !(r.depend_de ?? []).length) faux('un potentiel mesuré doit citer les actes du registre qui le prouvent');
      if (typeof r.cout_verification.depense_eur !== 'number') faux('cout_verification.depense_eur : la dépense nouvelle à engager, en euros (0 si aucune)');
      for (const c of ['hypothese', 'mesure', 'succes']) if (!r.essai[c]) faux(`expérience falsifiable incomplète : « ${c} » manque`);
      if (!Array.isArray(r.abandon) || !r.abandon.length) faux('au moins une condition d’abandon');
      if (typeof r.valeur.argent_reel_eur !== 'number' || !['aucune', 'simulation', 'estimation', 'argent réel'].includes(r.valeur.nature_de_la_preuve)) faux('valeur : argent_reel_eur (nombre) et nature_de_la_preuve (aucune, simulation, estimation, argent réel)');
      if (r.valeur.argent_reel_eur > 0 && r.valeur.nature_de_la_preuve !== 'argent réel') faux('de l’argent réel ne peut pas reposer sur une simulation ou une estimation');
      if (!['retenue en premier', 'en attente', 'non instruisible', 'écartée'].includes(r.statut)) faux('statut attendu : retenue en premier, en attente, non instruisible ou écartée');
    }
    if (r.type === 'economie' && !['comptable', 'simulé', 'non mesurable'].includes(r.gain.base)) faux('gain.base attendu : comptable, simulé ou non mesurable');
    if (r.type === 'experience' && !['automatique', 'humaine requise', 'impossible'].includes(r.autorisation)) faux('autorisation attendue : automatique, humaine requise ou impossible');
  }

  ajouter(corps) {
    const r = { n: this.lignes.length, precedent: this.lignes.at(-1)?.id ?? null, date: new Date().toISOString(), ...corps };
    this._valider(r);
    r.id = empreinte(r).slice(0, 16);
    mkdirSync(dirname(this.chemin), { recursive: true });
    appendFileSync(this.chemin, JSON.stringify(r) + '\n');
    this.lignes.push(r);
    return r.id;
  }

  // Recalcule toute la chaîne : une ligne modifiée, retirée ou déplacée après coup est détectée.
  verifier() {
    const erreurs = [];
    this.lignes.forEach((r, i) => {
      const { id, ...reste } = r;
      if (r.n !== i) erreurs.push(`ligne ${i} : numéro ${r.n}`);
      if (r.precedent !== (i ? this.lignes[i - 1].id : null)) erreurs.push(`ligne ${i} : chaînage rompu`);
      if (empreinte(reste).slice(0, 16) !== id) erreurs.push(`ligne ${i} : contenu modifié (empreinte ${id})`);
    });
    return { ok: erreurs.length === 0, lignes: this.lignes.length, erreurs };
  }

  // État courant de chaque affirmation, déduit du journal (jamais stocké).
  etat() {
    return this.lignes.filter((r) => r.type === 'affirmation').map((a) => {
      const verifs = this.lignes.filter((r) => r.type === 'verification' && r.cible === a.id);
      const contest = this.lignes.filter((r) => r.type === 'contestation' && r.cible === a.id);
      let niveau = a.certitude.niveau;
      const historique = [niveau];
      for (const v of verifs) {
        if (v.portee === 'temoin-negatif' || v.portee === 'verite-du-banc') continue;
        if (v.verdict === 'refute') niveau = 'réfutée';
        else if (v.verdict === 'confirme' && v.portee === 'pari' && v.eleve_a && niveau !== 'réfutée' && NIVEAUX[v.eleve_a].rang > NIVEAUX[niveau].rang) niveau = v.eleve_a;
        if (historique.at(-1) !== niveau) historique.push(niveau);
      }
      const pariGagne = verifs.some((v) => v.portee === 'pari' && v.verdict === 'confirme');
      const banc = verifs.filter((v) => v.portee === 'verite-du-banc').at(-1)?.verdict ?? null;
      return { id: a.id, probleme: a.probleme, auteur: a.auteur, sujet: a.sujet, enonce: a.enonce, niveau, historique, decidable: NIVEAUX[niveau].decidable,
        contestee: contest.length > 0 && !pariGagne && niveau !== 'réfutée', contestations: contest.length, verifications: verifs.length, banc };
    });
  }
}
