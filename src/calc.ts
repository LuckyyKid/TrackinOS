import type { Carte, Cycle, CycleId, Depense, FinanceData, Holding } from './types';

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

export const totalSurCompte = (data: FinanceData, compte: Depense['compte']): number =>
  data.depenses.filter((d) => d.actif && d.compte === compte).reduce((s, d) => s + d.montant, 0);

export const utilisationCarte = (carte: Carte): number => carte.solde / carte.limite;

export const utilisationCarteProjetee = (data: FinanceData): number => {
  const surCarte = totalSurCompte(data, 'credit');
  return (data.carte.solde + surCarte) / data.carte.limite;
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
  const depart = valeurDepart ?? data.comptes.reduce((s, c) => s + c.valeur, 0);
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

export type PortefeuillePos = {
  h: Holding;
  valeur: number;
  poids: number;
  derive: number; // poids - cible
  besoin: number; // avant prorata
  achat: number; // après prorata
  aCorriger: boolean;
};

export const analysePortefeuille = (data: FinanceData): {
  positions: PortefeuillePos[];
  total: number;
  prochaineContribution: number;
} => {
  const prochaineContribution = data.comptes.reduce((s, c) => s + c.parCycle, 0);
  const valeurs = data.holdings.map((h) => h.actions * h.prix);
  const total = valeurs.reduce((s, v) => s + v, 0);
  const totalCible = total + prochaineContribution;

  const positions: PortefeuillePos[] = data.holdings.map((h, i) => {
    const valeur = valeurs[i];
    const poids = total > 0 ? valeur / total : 0;
    const derive = poids - h.cible;
    const besoin = Math.max(0, totalCible * h.cible - valeur);
    const aCorriger = Math.abs(derive) > data.reequilibrage.tolerance / 100;
    return { h, valeur, poids, derive, besoin, achat: 0, aCorriger };
  });

  const besoinTotal = positions.reduce((s, p) => s + p.besoin, 0);
  if (besoinTotal <= 0 || prochaineContribution <= 0) {
    positions.forEach((p) => (p.achat = 0));
  } else if (besoinTotal <= prochaineContribution) {
    positions.forEach((p) => (p.achat = p.besoin));
  } else {
    // prorata
    const facteur = prochaineContribution / besoinTotal;
    positions.forEach((p) => (p.achat = p.besoin * facteur));
  }

  return { positions, total, prochaineContribution };
};

export type Alerte = {
  id: string;
  titre: string;
  detail: string;
  cible: string; // page id
};

export const alertes = (data: FinanceData, today = new Date()): Alerte[] => {
  const out: Alerte[] = [];
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
  const s = soldesCycles(data);
  data.cycles.forEach((c, i) => {
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
  const proj = projectionCoussin(data);
  if (proj < data.coussin.minimum) {
    out.push({
      id: 'coussin-min',
      titre: 'Ton coussin va tomber trop bas',
      detail: `Après tes deux paies, ton coussin projeté est ${money(proj)}, sous ton minimum de ${money(data.coussin.minimum)}.`,
      cible: 'coussin',
    });
  }
  data.comptes.forEach((c) => {
    if (c.plafondAnnuel > 0) {
      const restant = c.plafondAnnuel - c.annee;
      if (restant < 1000 && restant >= 0) {
        out.push({
          id: `plafond-${c.id}-annuel`,
          titre: `${c.nom} : bientôt au plafond de l\u2019année`,
          detail: `Il te reste ${money(restant)} avant le plafond annuel. Dépasser coûte 1 % par mois.`,
          cible: 'plafonds',
        });
      }
      if (c.utilise > c.plafondVie) {
        out.push({
          id: `plafond-${c.id}-vie`,
          titre: `${c.nom} : plafond à vie dépassé`,
          detail: `Tu as dépassé le maximum à vie de ${money(c.plafondVie)}. Le gouvernement charge 1 % par mois sur le trop-plein.`,
          cible: 'plafonds',
        });
      }
    }
  });
  return out;
};

// helper for alert copy
export const prochainJour = (jour: number, today = new Date()): string => {
  const y = today.getFullYear();
  const m = today.getMonth();
  const j = today.getDate();
  const date =
    jour >= j
      ? new Date(y, m, jour)
      : new Date(y, m + 1, jour);
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
