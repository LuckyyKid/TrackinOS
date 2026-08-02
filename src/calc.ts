import type {
  Carte,
  CompteInvest,
  Cycle,
  CycleId,
  Depense,
  FinanceData,
  Holding,
  TypeCompte,
} from './types';
import { CELI_PLAFONDS_OFFICIELS, REER_PLAFONDS_MAX } from './types';

export const money = (n: number): string => {
  const sign = n < 0 ? '\u2212 ' : '';
  const abs = Math.abs(Math.round(n));
  return sign + '$' + abs.toLocaleString('en-CA');
};

export const moneySigned = (n: number): string => (n >= 0 ? '+ ' + money(n) : money(n));

export const pct = (n: number, decimals = 1): string =>
  (n * 100).toFixed(decimals).replace(/\.0$/, '') + ' %';

export const soldeCycle = (cycle: Cycle, depenses: Depense[]): number => {
  const sortie = depenses
    .filter((d) => d.actif && (d.cycle === cycle.id || d.cycle === 'deux'))
    .reduce((s, d) => s + d.montant, 0);
  return cycle.montant - sortie;
};

export const soldesCycles = (data: FinanceData): { cycle1: number; cycle2: number } => ({
  cycle1: soldeCycle(data.cycles[0], data.depenses),
  cycle2: soldeCycle(data.cycles[1], data.depenses),
});

export const projectionCoussin = (data: FinanceData): number => {
  const s = soldesCycles(data);
  return data.coussin.actuel + s.cycle1 + s.cycle2;
};

export const totalDepensesMensuelles = (data: FinanceData): number =>
  data.depenses.filter((d) => d.actif).reduce((s, d) => s + d.montant, 0);

export const revenuMensuel = (data: FinanceData): number =>
  data.cycles.reduce((s, c) => s + c.montant, 0);

export const totalParCategorie = (data: FinanceData, cat: Depense['categorie']): number =>
  data.depenses.filter((d) => d.actif && d.categorie === cat).reduce((s, d) => s + d.montant, 0);

export const totalSurCompte = (data: FinanceData, compte: string): number =>
  data.depenses.filter((d) => d.actif && d.compte === compte).reduce((s, d) => s + d.montant, 0);

export const utilisationCarte = (carte: Carte): number =>
  carte.limite > 0 ? carte.solde / carte.limite : 0;

export const utilisationCarteProjetee = (data: FinanceData): number => {
  const surCarte = totalSurCompte(data, 'credit');
  return data.carte.limite > 0 ? (data.carte.solde + surCarte) / data.carte.limite : 0;
};

export const paiementPour30 = (carte: Carte): number =>
  Math.max(0, carte.solde - carte.limite * 0.30);

export const paiementPourZero = (carte: Carte): number => carte.solde;

export const rendementMensuel = (rendementAnnuelPct: number): number =>
  Math.pow(1 + rendementAnnuelPct / 100, 1 / 12) - 1;

export type ProjectionPoint = { annee: number; valeur: number; investi: number };

export const projection = (
  data: FinanceData,
  annees: number,
  valeurDepart?: number,
): ProjectionPoint[] => {
  const rMois = rendementMensuel(data.rendementAnnuel);
  const contribMensuelle = data.comptes.reduce((s, c) => s + c.parCycle * 2, 0);
  const depart = valeurDepart ?? data.comptes.reduce((s, c) => s + valeurCompte(data, c.id), 0);
  const points: ProjectionPoint[] = [{ annee: 0, valeur: depart, investi: depart }];
  let valeur = depart;
  let investi = depart;
  for (let m = 1; m <= annees * 12; m++) {
    valeur = valeur * (1 + rMois) + contribMensuelle;
    investi = investi + contribMensuelle;
    if (m % 12 === 0) points.push({ annee: m / 12, valeur, investi });
  }
  return points;
};

export type ProjectionFinAnnee = {
  annee: number;
  moisRestants: number;
  valeurProjetee: number;
  contributionsRestantes: number;
  gainsProjetes: number;
};

export const projectionFinAnnee = (
  data: FinanceData,
  valeurDepart: number,
  today = new Date(),
): ProjectionFinAnnee => {
  const annee = today.getFullYear();
  const moisRestants = Math.max(0, 12 - (today.getMonth() + 1));
  const rMois = rendementMensuel(data.rendementAnnuel);
  const contribMensuelle = data.comptes.reduce((s, c) => s + c.parCycle * 2, 0);
  let valeur = valeurDepart;
  for (let m = 0; m < moisRestants; m++) {
    valeur = valeur * (1 + rMois) + contribMensuelle;
  }
  const contributionsRestantes = contribMensuelle * moisRestants;
  const gainsProjetes = valeur - valeurDepart - contributionsRestantes;
  return {
    annee,
    moisRestants,
    valeurProjetee: valeur,
    contributionsRestantes,
    gainsProjetes,
  };
};

// ---------- Objectif financier ----------

export const ageActuel = (naissance: string, today = new Date()): number | null => {
  if (!naissance) return null;
  const d = new Date(naissance);
  if (Number.isNaN(d.getTime())) return null;
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age;
};

export const moisJusquAge = (
  naissance: string,
  ageCible: number,
  today = new Date(),
): number | null => {
  if (!naissance) return null;
  const d = new Date(naissance);
  if (Number.isNaN(d.getTime())) return null;
  const cible = new Date(d.getFullYear() + ageCible, d.getMonth(), d.getDate());
  const mois =
    (cible.getFullYear() - today.getFullYear()) * 12 +
    (cible.getMonth() - today.getMonth());
  return mois;
};

const valeurFuture = (pv: number, pmt: number, rMois: number, n: number): number => {
  if (n <= 0) return pv;
  if (rMois === 0) return pv + pmt * n;
  const facteur = Math.pow(1 + rMois, n);
  return pv * facteur + pmt * ((facteur - 1) / rMois);
};

export type EtatObjectif =
  | { type: 'pas_de_naissance' }
  | { type: 'age_deja_atteint'; ageActuel: number; ageCible: number }
  | {
      type: 'ok';
      ageActuel: number;
      ageCible: number;
      moisRestants: number;
      valeurActuelle: number;
      contribMensuelle: number;
      rMois: number;
      rendementAnnuel: number;
      valeurALAgeCible: number;
      moisPourAtteindre: number | null;
      ageAtteinte: number | null;
      anneeAtteinte: number | null;
      manquePourAgeCible: number;
      contribSupplementaire: number | null;
      contribTotaleRequise: number | null;
      rendementAnnuelRequis: number | null;
    };

export const etatObjectif = (data: FinanceData, today = new Date()): EtatObjectif => {
  const naissance = data.celi.naissance;
  const age = ageActuel(naissance, today);
  if (age === null) return { type: 'pas_de_naissance' };

  const ageCible = data.objectif.ageCible;
  if (ageCible <= age) return { type: 'age_deja_atteint', ageActuel: age, ageCible };

  const mois = moisJusquAge(naissance, ageCible, today);
  if (mois === null || mois <= 0) {
    return { type: 'age_deja_atteint', ageActuel: age, ageCible };
  }

  const rMois = rendementMensuel(data.rendementAnnuel);
  const contribMensuelle = data.comptes.reduce((s, c) => s + c.parCycle * 2, 0);
  const valeurActuelle = data.comptes.reduce((s, c) => s + valeurCompte(data, c.id), 0);
  const objectif = data.objectif.montant;

  const valeurALAgeCible = valeurFuture(valeurActuelle, contribMensuelle, rMois, mois);

  let moisPourAtteindre: number | null = null;
  if (valeurActuelle >= objectif) {
    moisPourAtteindre = 0;
  } else {
    let v = valeurActuelle;
    const maxMois = 12 * 100;
    for (let m = 1; m <= maxMois; m++) {
      v = v * (1 + rMois) + contribMensuelle;
      if (v >= objectif) {
        moisPourAtteindre = m;
        break;
      }
    }
  }
  const anneesAtteinte = moisPourAtteindre === null ? null : moisPourAtteindre / 12;
  const ageAtteinte =
    anneesAtteinte === null ? null : Math.round((age + anneesAtteinte) * 10) / 10;
  const anneeAtteinte =
    anneesAtteinte === null
      ? null
      : today.getFullYear() +
        Math.floor((today.getMonth() + (moisPourAtteindre as number)) / 12);

  const manquePourAgeCible = Math.max(0, objectif - valeurALAgeCible);

  let contribTotaleRequise: number | null = null;
  let contribSupplementaire: number | null = null;
  if (manquePourAgeCible > 0) {
    const facteur = rMois === 0 ? mois : (Math.pow(1 + rMois, mois) - 1) / rMois;
    const futureSansContrib = rMois === 0 ? valeurActuelle : valeurActuelle * Math.pow(1 + rMois, mois);
    contribTotaleRequise = Math.max(0, (objectif - futureSansContrib) / facteur);
    contribSupplementaire = Math.max(0, contribTotaleRequise - contribMensuelle);
  }

  let rendementAnnuelRequis: number | null = null;
  if (manquePourAgeCible > 0) {
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < 80; i++) {
      const mid = (lo + hi) / 2;
      const vf = valeurFuture(valeurActuelle, contribMensuelle, mid, mois);
      if (vf < objectif) lo = mid;
      else hi = mid;
    }
    const rMoisRequis = (lo + hi) / 2;
    if (rMoisRequis < 0.99) {
      rendementAnnuelRequis = (Math.pow(1 + rMoisRequis, 12) - 1) * 100;
    }
  }

  return {
    type: 'ok',
    ageActuel: age,
    ageCible,
    moisRestants: mois,
    valeurActuelle,
    contribMensuelle,
    rMois,
    rendementAnnuel: data.rendementAnnuel,
    valeurALAgeCible,
    moisPourAtteindre,
    ageAtteinte,
    anneeAtteinte,
    manquePourAgeCible,
    contribSupplementaire,
    contribTotaleRequise,
    rendementAnnuelRequis,
  };
};

// ---------- Portefeuille ----------

export type PortefeuillePos = {
  ticker: string;
  lignes: Holding[];
  valeur: number;
  poids: number;
  cible: number; // 0..1
  derive: number;
  besoin: number;
  achat: number;
  aCorriger: boolean;
};

export const analysePortefeuille = (data: FinanceData): {
  positions: PortefeuillePos[];
  total: number;
  totalHoldings: number;
  cash: number;
  prochaineContribution: number;
  aDistribuer: number;
} => {
  const comptesStrategie = data.comptes.filter((c) => c.dansStrategie);
  const idsPerso = new Set(comptesStrategie.map((c) => c.id));
  const holdingsPerso = data.holdings.filter((h) => idsPerso.has(h.compte));
  const cash = comptesStrategie.reduce((s, c) => s + (c.cash || 0), 0);
  const prochaineContribution = comptesStrategie.reduce((s, c) => s + c.parCycle, 0);
  const aDistribuer = cash + prochaineContribution;

  const parTicker = new Map<string, Holding[]>();
  holdingsPerso.forEach((h) => {
    if (!h.ticker) return;
    const arr = parTicker.get(h.ticker) ?? [];
    arr.push(h);
    parTicker.set(h.ticker, arr);
  });

  const cibleParTicker = new Map<string, number>();
  data.cibles.forEach((c) => {
    if (c.ticker) cibleParTicker.set(c.ticker, c.part);
  });

  const tickers: string[] = [];
  data.cibles.forEach((c) => {
    if (c.ticker && !tickers.includes(c.ticker)) tickers.push(c.ticker);
  });
  parTicker.forEach((_, t) => {
    if (!tickers.includes(t)) tickers.push(t);
  });

  const valeurs = new Map<string, number>();
  tickers.forEach((t) => {
    const lignes = parTicker.get(t) ?? [];
    valeurs.set(t, lignes.reduce((s, h) => s + h.actions * h.prix, 0));
  });
  const totalHoldings = Array.from(valeurs.values()).reduce((s, v) => s + v, 0);
  const total = totalHoldings + cash;
  const totalCible = total + prochaineContribution;

  const positions: PortefeuillePos[] = tickers.map((ticker) => {
    const lignes = parTicker.get(ticker) ?? [];
    const valeur = valeurs.get(ticker) ?? 0;
    const poids = total > 0 ? valeur / total : 0;
    const cible = cibleParTicker.get(ticker) ?? 0;
    const derive = poids - cible;
    const besoin = Math.max(0, totalCible * cible - valeur);
    const aCorriger = cible > 0 && Math.abs(derive) > data.reequilibrage.tolerance / 100;
    return { ticker, lignes, valeur, poids, cible, derive, besoin, achat: 0, aCorriger };
  });

  const besoinTotal = positions.reduce((s, p) => s + p.besoin, 0);
  if (besoinTotal <= 0 || aDistribuer <= 0) {
    positions.forEach((p) => (p.achat = 0));
  } else if (besoinTotal <= aDistribuer) {
    positions.forEach((p) => (p.achat = p.besoin));
  } else {
    const facteur = aDistribuer / besoinTotal;
    positions.forEach((p) => (p.achat = p.besoin * facteur));
  }

  return { positions, total, totalHoldings, cash, prochaineContribution, aDistribuer };
};

// ---------- Helpers comptes ----------

export const comptesParType = (data: FinanceData, type: TypeCompte): CompteInvest[] =>
  data.comptes.filter((c) => c.typeCompte === type);

export const aUnCompteType = (data: FinanceData, type: TypeCompte): boolean =>
  comptesParType(data, type).length > 0;

export const valeurCompte = (data: FinanceData, compteId: string): number => {
  const compte = data.comptes.find((c) => c.id === compteId);
  if (!compte) return 0;
  const desHoldings = data.holdings.filter((h) => h.compte === compteId);
  if (desHoldings.length > 0) {
    const invest = desHoldings.reduce((s, h) => s + h.actions * h.prix, 0);
    return invest + (compte.cash ?? 0);
  }
  return compte.valeur ?? 0;
};

export const valeurTypeCompte = (data: FinanceData, type: TypeCompte): number =>
  comptesParType(data, type).reduce((s, c) => s + valeurCompte(data, c.id), 0);

// ---------- CELI ----------

export const celiAnneeEligible = (naissance: string, today = new Date()): number => {
  const anneeMin = 2009;
  if (!naissance) return anneeMin;
  const parts = naissance.split('-');
  const y = Number(parts[0]);
  if (!y) return anneeMin;
  return Math.max(anneeMin, y + 18);
};

export const celiPlafondAnnuel = (data: FinanceData, annee: number): number => {
  const custom = data.celi.plafondsAnnuels?.[annee];
  if (typeof custom === 'number') return custom;
  return CELI_PLAFONDS_OFFICIELS[annee] ?? 0;
};

export const celiPlafondCumule = (data: FinanceData, today = new Date()): number => {
  const anneeCourante = today.getFullYear();
  const debut = celiAnneeEligible(data.celi.naissance, today);
  let s = 0;
  for (let y = debut; y <= anneeCourante; y++) s += celiPlafondAnnuel(data, y);
  return s;
};

export const celiCotisationsCumulees = (data: FinanceData, today = new Date()): number => {
  const anneeCourante = today.getFullYear();
  let s = 0;
  for (const [k, v] of Object.entries(data.celi.cotisations ?? {})) {
    if (Number(k) <= anneeCourante) s += v || 0;
  }
  return s;
};

export const celiDisponible = (data: FinanceData, today = new Date()): number =>
  celiPlafondCumule(data, today) - celiCotisationsCumulees(data, today);

export const celiCotiseCetteAnnee = (data: FinanceData, today = new Date()): number =>
  data.celi.cotisations?.[today.getFullYear()] ?? 0;

export const celiValeurTotale = (data: FinanceData): number => valeurTypeCompte(data, 'CELI');

// ---------- CELIAPP ----------

export const celiappCotisationsCumulees = (data: FinanceData, today = new Date()): number => {
  const anneeCourante = today.getFullYear();
  let s = 0;
  for (const [k, v] of Object.entries(data.celiapp?.cotisations ?? {})) {
    if (Number(k) <= anneeCourante) s += v || 0;
  }
  return s;
};

export const celiappCotiseCetteAnnee = (data: FinanceData, today = new Date()): number =>
  data.celiapp?.cotisations?.[today.getFullYear()] ?? 0;

export const celiappDisponible = (data: FinanceData, today = new Date()): number =>
  (data.celiapp?.plafondVie ?? 40000) - celiappCotisationsCumulees(data, today);

export const celiappValeurTotale = (data: FinanceData): number => valeurTypeCompte(data, 'CELIAPP');

// ---------- REER ----------

export const reerPlafondMaxAnnuel = (annee: number): number => REER_PLAFONDS_MAX[annee] ?? 0;

// Plafond de l'année N = min(18% du revenu gagné en N-1, max CRA de N)
export const reerPlafondAnnuel = (data: FinanceData, annee: number): number => {
  const revenuAnneePrec = data.reer?.revenusAnneesPrecedentes?.[annee - 1] ?? 0;
  const max = reerPlafondMaxAnnuel(annee);
  const dix8 = revenuAnneePrec * 0.18;
  if (max <= 0 && dix8 <= 0) return 0;
  if (max <= 0) return dix8;
  return Math.min(dix8, max);
};

// Droits cumulés = report initial + somme des plafonds annuels de la 1re année cotisée jusqu'à aujourd'hui
export const reerDroitsCumules = (data: FinanceData, today = new Date()): number => {
  const anneeCourante = today.getFullYear();
  const anneesAvecRevenu = Object.keys(data.reer?.revenusAnneesPrecedentes ?? {})
    .map(Number)
    .filter((y) => !Number.isNaN(y));
  if (anneesAvecRevenu.length === 0) return data.reer?.droitsReport ?? 0;
  const debut = Math.min(...anneesAvecRevenu) + 1;
  let s = data.reer?.droitsReport ?? 0;
  for (let y = debut; y <= anneeCourante; y++) s += reerPlafondAnnuel(data, y);
  return s;
};

export const reerCotisationsCumulees = (data: FinanceData, today = new Date()): number => {
  const anneeCourante = today.getFullYear();
  let s = 0;
  for (const [k, v] of Object.entries(data.reer?.cotisations ?? {})) {
    if (Number(k) <= anneeCourante) s += v || 0;
  }
  return s;
};

export const reerDisponible = (data: FinanceData, today = new Date()): number =>
  reerDroitsCumules(data, today) - reerCotisationsCumulees(data, today);

export const reerCotiseCetteAnnee = (data: FinanceData, today = new Date()): number =>
  data.reer?.cotisations?.[today.getFullYear()] ?? 0;

export const reerValeurTotale = (data: FinanceData): number => valeurTypeCompte(data, 'REER');

// ---------- Avoir total ----------

export type PartAvoir = {
  cle: string;
  nom: string;
  valeur: number;
  poids: number;
  couleur: string;
};

const PALETTE_AVOIR = ['#1d2d3d', '#416180', '#5980a6', '#94bce3', '#d6ebff', '#7ba3c9', '#2c4d6b', '#a8c5e0'];

export const avoirTotal = (data: FinanceData): { total: number; parts: PartAvoir[] } => {
  const parts: PartAvoir[] = [];
  data.comptes.forEach((c, i) => {
    const v = valeurCompte(data, c.id);
    if (v > 0) parts.push({
      cle: c.id,
      nom: c.nom,
      valeur: v,
      poids: 0,
      couleur: PALETTE_AVOIR[i % PALETTE_AVOIR.length],
    });
  });
  if (data.coussin.actuel > 0) {
    parts.push({
      cle: 'coussin',
      nom: 'Fond d\u2019urgence',
      valeur: data.coussin.actuel,
      poids: 0,
      couleur: '#d6ebff',
    });
  }
  const total = parts.reduce((s, p) => s + p.valeur, 0);
  parts.forEach((p) => (p.poids = total > 0 ? p.valeur / total : 0));
  parts.sort((a, b) => b.valeur - a.valeur);
  return { total, parts };
};

// ---------- Alertes ----------

export type Alerte = {
  id: string;
  titre: string;
  detail: string;
  cible: string;
};

export const alertes = (data: FinanceData, today = new Date()): Alerte[] => {
  const out: Alerte[] = [];
  if (data.carte.limite > 0) {
    const u = utilisationCarte(data.carte);
    if (u > 0.30) {
      const paye = paiementPour30(data.carte);
      const dateEcheance = prochainJour(data.carte.echeance, today);
      out.push({
        id: 'carte-30',
        titre: 'Ta carte de crédit est trop chargée',
        detail: `Tu utilises ${(u * 100).toFixed(1)} % de ta limite. Paye ${money(paye)} avant le ${dateEcheance} pour revenir sous 30 %.`,
        cible: 'carte',
      });
    }
  }
  const s = soldesCycles(data);
  data.cycles.forEach((c, i) => {
    if (c.montant <= 0) return;
    const solde = i === 0 ? s.cycle1 : s.cycle2;
    if (solde < 0) {
      out.push({
        id: `cycle-${c.id}`,
        titre: `« ${c.label} » ne suffit pas`,
        detail: `Il manque ${money(-solde)} sur cette paie. Enlève une dépense ou déplace-la sur l\u2019autre paie.`,
        cible: 'depenses',
      });
    }
  });
  if (data.coussin.objectif > 0 || data.coussin.minimum > 0) {
    const proj = projectionCoussin(data);
    if (proj < data.coussin.minimum) {
      out.push({
        id: 'coussin-min',
        titre: 'Ton coussin va tomber trop bas',
        detail: `Après tes deux paies, ton coussin projeté est ${money(proj)}, sous ton minimum de ${money(data.coussin.minimum)}.`,
        cible: 'coussin',
      });
    }
  }
  if (aUnCompteType(data, 'CELIAPP')) {
    const dispoApp = celiappDisponible(data, today);
    const plafondApp = data.celiapp?.plafondVie ?? 40000;
    if (dispoApp < 0) {
      out.push({
        id: 'celiapp-depasse',
        titre: 'CELIAPP : plafond à vie dépassé',
        detail: `Tu as cotisé ${money(-dispoApp)} de trop sur le plafond à vie de ${money(plafondApp)}. Pénalité de 1 % par mois sur le trop-plein.`,
        cible: 'plafonds',
      });
    } else if (dispoApp < 1000 && dispoApp >= 0) {
      out.push({
        id: 'celiapp-presque',
        titre: 'CELIAPP : bientôt plein',
        detail: `Il te reste ${money(dispoApp)} de droits sur le plafond à vie.`,
        cible: 'plafonds',
      });
    }
  }
  if (aUnCompteType(data, 'CELI') && data.celi.naissance) {
    const dispo = celiDisponible(data, today);
    if (dispo < 0) {
      out.push({
        id: 'celi-depasse',
        titre: 'CELI : plafond dépassé',
        detail: `Tu as cotisé ${money(-dispo)} de trop dans tes CELI (tous comptes confondus). Pénalité de 1 % par mois sur le trop-plein.`,
        cible: 'plafonds',
      });
    } else if (dispo < 1000) {
      out.push({
        id: 'celi-presque',
        titre: 'CELI : bientôt plein',
        detail: `Il te reste ${money(dispo)} de droits CELI (partagés entre tous tes comptes CELI).`,
        cible: 'plafonds',
      });
    }
  }
  if (aUnCompteType(data, 'REER')) {
    const dispoReer = reerDisponible(data, today);
    if (dispoReer < 0) {
      out.push({
        id: 'reer-depasse',
        titre: 'REER : plafond dépassé',
        detail: `Tu as cotisé ${money(-dispoReer)} de trop dans tes REER. Pénalité de 1 % par mois au-delà de 2 000 $ de trop-plein.`,
        cible: 'plafonds',
      });
    } else if (dispoReer < 1000 && dispoReer > 0) {
      out.push({
        id: 'reer-presque',
        titre: 'REER : bientôt plein',
        detail: `Il te reste ${money(dispoReer)} de droits REER.`,
        cible: 'plafonds',
      });
    }
  }
  return out;
};

export const prochainJour = (jour: number, today = new Date()): string => {
  const y = today.getFullYear();
  const m = today.getMonth();
  const j = today.getDate();
  const date = jour >= j ? new Date(y, m, jour) : new Date(y, m + 1, jour);
  return date.toLocaleDateString('fr-CA', { day: 'numeric', month: 'long' });
};

export const depensesActivesParCycle = (
  data: FinanceData,
  cycle: CycleId,
): Depense[] =>
  data.depenses.filter((d) => d.actif && (d.cycle === cycle || d.cycle === 'deux'));

export const totalCyclePaye = (data: FinanceData, cycle: CycleId): number =>
  depensesActivesParCycle(data, cycle).reduce((s, d) => s + d.montant, 0);

export const engagementPct = (data: FinanceData, cycle: CycleId): number => {
  const c = data.cycles.find((c) => c.id === cycle)!;
  return c.montant > 0 ? Math.min(1, totalCyclePaye(data, cycle) / c.montant) : 0;
};

export const semaineProchaine = (data: FinanceData, today = new Date()): Array<{
  jour: number;
  jourTxt: string;
  nom: string;
  montant: number;
  paie: boolean;
}> => {
  const j = today.getDate();
  const fin = j + 7;
  const items: Array<{ jour: number; jourTxt: string; nom: string; montant: number; paie: boolean }> = [];
  data.cycles.forEach((c) => {
    if (c.jour >= j && c.jour <= fin) {
      items.push({ jour: c.jour, jourTxt: formatJourCourt(c.jour, today), nom: c.label, montant: c.montant, paie: true });
    }
  });
  data.depenses.forEach((d) => {
    if (!d.actif) return;
    if (d.jour >= j && d.jour <= fin) {
      items.push({ jour: d.jour, jourTxt: formatJourCourt(d.jour, today), nom: d.nom, montant: -d.montant, paie: false });
    }
  });
  return items.sort((a, b) => a.jour - b.jour);
};

const MOIS_COURTS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
export const formatJourCourt = (jour: number, today = new Date()): string =>
  `${jour} ${MOIS_COURTS[today.getMonth()]}`;

export const aujourdhuiTxt = (today = new Date()): string =>
  today.toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' });
