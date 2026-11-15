// Contrôle de qualité d'un journal avant lecture. Protocole : programme/abime/PROTOCOLE_CONTROLE.md.
// Ne répare que ce qui se reconnaît sans connaître le métier, et dit ce qu'il a fait.
export const SEUIL_ALERTE = 0.01, GROUPE_MIN = 8, FACTEUR = [8, 12.5];
const med = (v) => { const s = [...v].sort((a, b) => a - b); return s.length ? (s[Math.floor((s.length - 1) / 2)] + s[Math.ceil((s.length - 1) / 2)]) / 2 : null; };
const quartile = (v, p) => { const s = [...v].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };

export function controler(observe) {
  // 1. copies exactes : tout identique sauf l'identifiant
  const vus = new Set(), journal = [];
  let copies = 0;
  for (const r of observe.journal) {
    const cle = JSON.stringify([r.jour, r.source, r.libelle, r.montant, r.quantite, r.objet, r.contrepartie, r.auteur, r.reference]);
    if (vus.has(cle)) { copies++; continue; }
    vus.add(cle); journal.push({ ...r });
  }
  const gardes = new Set(journal.map((r) => r.id));
  for (const r of journal) if (r.reference && !gardes.has(r.reference)) r.reference = null;
  // 2. montants dix fois trop grands
  const unitaires = new Map(), seuls = new Map(), ajouter = (m, k, x) => { if (!m.has(k)) m.set(k, []); m.get(k).push(x); };
  for (const r of journal) {
    if (r.montant == null || r.montant === 0) continue;
    if (r.quantite) ajouter(unitaires, r.objet ?? '', Math.abs(r.montant / r.quantite)); else ajouter(seuls, JSON.stringify([r.source, r.objet, r.contrepartie]), Math.abs(r.montant));
  }
  const repere = (m, resserre) => new Map([...m].filter(([, v]) => v.length >= GROUPE_MIN).map(([k, v]) => [k, { mediane: med(v), ok: !resserre || quartile(v, 0.75) - quartile(v, 0.25) < 0.5 * med(v) }]));
  const refU = repere(unitaires, false), refS = repere(seuls, true);
  let corriges = 0;
  for (const r of journal) {
    if (r.montant == null || r.montant === 0) continue;
    const ref = r.quantite ? refU.get(r.objet ?? '') : refS.get(JSON.stringify([r.source, r.objet, r.contrepartie])), x = r.quantite ? Math.abs(r.montant / r.quantite) : Math.abs(r.montant);
    if (ref?.ok && ref.mediane > 0 && x >= FACTEUR[0] * ref.mediane && x <= FACTEUR[1] * ref.mediane) { r.montant = Number((r.montant / 10).toFixed(2)); corriges++; }
  }
  const part = observe.journal.length ? (copies + corriges) / observe.journal.length : 0;
  return { observe: { ...observe, journal }, rapport: { lignes: observe.journal.length, copies_retirees: copies, montants_corriges: corriges, part_touchee: Number(part.toFixed(4)), alerte: part > SEUIL_ALERTE } };
}
