export type CycleId = 'cycle1' | 'cycle2';
export type CycleCible = CycleId | 'deux';
export type Categorie = 'fixe' | 'variable' | 'investissement' | 'epargne' | 'dette';
export type CompteSrc = 'cheques' | 'credit' | 'CELIAPP' | 'CELI' | 'CELI_ENFANT' | 'wealthsimple';
export type Recurrence = 'mensuel' | 'deux_semaines' | 'annuel' | 'unique';
export type CompteInvestId = 'celiapp' | 'celi' | 'celi_enfant' | 'crypto';

export type Cycle = {
  id: CycleId;
  label: string;
  montant: number;
  jour: number;
};

export type Coussin = {
  actuel: number;
  objectif: number;
  minimum: number;
};

export type Depense = {
  id: string;
  nom: string;
  montant: number;
  categorie: Categorie;
  jour: number;
  cycle: CycleCible;
  compte: CompteSrc;
  recurrence: Recurrence;
  actif: boolean;
};

export type Carte = {
  limite: number;
  objectif: number; // pourcentage santé (30)
  solde: number;
  releve: number;
  echeance: number;
  autopayJour: number;
  autopayMontant: number;
};

export type CompteInvest = {
  id: CompteInvestId;
  nom: string;
  simple: string;
  valeur: number;
  parCycle: number;
  annee: number;
  plafondAnnuel: number;
  plafondVie: number;
  utilise: number;
};

export type Holding = {
  ticker: string;
  compte: string;
  actions: number;
  prix: number;
  cible: number; // 0..1
};

export type Reequilibrage = {
  tolerance: number; // pourcentage
  horizon: number; // mois
};

export type CeliConfig = {
  naissance: string; // "YYYY-MM-DD" (peut être vide)
  anneeDebutCotisation: number; // ex: 2020 (0 = pas encore renseigné)
  plafondsAnnuels: Record<number, number>; // par année, éditables
  cotisations: Record<number, number>; // total cotisé cette année-là, tous comptes CELI confondus
};

// Plafonds officiels CRA du CELI par année
export const CELI_PLAFONDS_OFFICIELS: Record<number, number> = {
  2009: 5000, 2010: 5000, 2011: 5000, 2012: 5000,
  2013: 5500, 2014: 5500,
  2015: 10000,
  2016: 5500, 2017: 5500, 2018: 5500,
  2019: 6000, 2020: 6000, 2021: 6000, 2022: 6000,
  2023: 6500,
  2024: 7000, 2025: 7000, 2026: 7000,
};

export type FinanceData = {
  cycles: [Cycle, Cycle];
  coussin: Coussin;
  depenses: Depense[];
  carte: Carte;
  comptes: CompteInvest[];
  holdings: Holding[];
  reequilibrage: Reequilibrage;
  rendementAnnuel: number;
  celi: CeliConfig;
};

export const DEFAULT_DATA: FinanceData = {
  cycles: [
    { id: 'cycle1', label: 'Paie du 1er', montant: 2340, jour: 1 },
    { id: 'cycle2', label: 'Paie du 15', montant: 2340, jour: 15 },
  ],
  coussin: { actuel: 1850, objectif: 4000, minimum: 1200 },
  depenses: [
    { id: 'd1', nom: 'Loyer', montant: 1150, categorie: 'fixe', jour: 1, cycle: 'cycle1', compte: 'cheques', recurrence: 'mensuel', actif: true },
    { id: 'd2', nom: 'Hydro-Québec', montant: 78, categorie: 'fixe', jour: 8, cycle: 'cycle1', compte: 'cheques', recurrence: 'mensuel', actif: true },
    { id: 'd3', nom: 'Internet', montant: 85, categorie: 'fixe', jour: 5, cycle: 'cycle1', compte: 'credit', recurrence: 'mensuel', actif: true },
    { id: 'd4', nom: 'Cellulaire', montant: 55, categorie: 'fixe', jour: 12, cycle: 'cycle1', compte: 'credit', recurrence: 'mensuel', actif: true },
    { id: 'd5', nom: 'Gym', montant: 45, categorie: 'variable', jour: 3, cycle: 'cycle1', compte: 'credit', recurrence: 'mensuel', actif: true },
    { id: 'd6', nom: 'CELIAPP', montant: 400, categorie: 'investissement', jour: 1, cycle: 'cycle1', compte: 'CELIAPP', recurrence: 'mensuel', actif: true },
    { id: 'd7', nom: 'Épicerie', montant: 260, categorie: 'variable', jour: 15, cycle: 'deux', compte: 'credit', recurrence: 'mensuel', actif: true },
    { id: 'd8', nom: 'Essence', montant: 120, categorie: 'variable', jour: 18, cycle: 'cycle2', compte: 'credit', recurrence: 'mensuel', actif: true },
    { id: 'd9', nom: 'Netflix + Spotify', montant: 32, categorie: 'variable', jour: 22, cycle: 'cycle2', compte: 'credit', recurrence: 'mensuel', actif: true },
    { id: 'd10', nom: 'Assurance auto', montant: 96, categorie: 'fixe', jour: 20, cycle: 'cycle2', compte: 'cheques', recurrence: 'mensuel', actif: true },
    { id: 'd11', nom: 'Restos & sorties', montant: 180, categorie: 'variable', jour: 24, cycle: 'cycle2', compte: 'credit', recurrence: 'mensuel', actif: true },
    { id: 'd12', nom: 'CELI', montant: 300, categorie: 'investissement', jour: 15, cycle: 'cycle2', compte: 'CELI', recurrence: 'mensuel', actif: true },
    { id: 'd13', nom: 'Crypto', montant: 100, categorie: 'investissement', jour: 15, cycle: 'cycle2', compte: 'wealthsimple', recurrence: 'mensuel', actif: true },
    { id: 'd14', nom: 'Prêt étudiant', montant: 145, categorie: 'dette', jour: 25, cycle: 'cycle2', compte: 'cheques', recurrence: 'mensuel', actif: true },
  ],
  carte: {
    limite: 5000,
    solde: 1740,
    objectif: 30,
    releve: 21,
    echeance: 14,
    autopayJour: 14,
    autopayMontant: 1740,
  },
  comptes: [
    { id: 'celiapp', nom: 'CELIAPP', simple: 'Compte pour ma première maison', valeur: 11848, parCycle: 200, annee: 7250, plafondAnnuel: 8000, plafondVie: 40000, utilise: 15400 },
    { id: 'celi', nom: 'CELI', simple: 'Compte à l\u2019abri d\u2019impôt', valeur: 16101, parCycle: 150, annee: 0, plafondAnnuel: 0, plafondVie: 0, utilise: 0 },
    { id: 'celi_enfant', nom: 'CELI enfant', simple: 'CELI dédié à mon portefeuille enfant (XEQT)', valeur: 0, parCycle: 0, annee: 0, plafondAnnuel: 0, plafondVie: 0, utilise: 0 },
    { id: 'crypto', nom: 'Crypto', simple: 'Placements Wealthsimple', valeur: 4301, parCycle: 50, annee: 0, plafondAnnuel: 0, plafondVie: 0, utilise: 0 },
  ],
  holdings: [
    { ticker: 'SPUS', compte: 'CELI', actions: 0, prix: 0, cible: 0.40 },
    { ticker: 'UPRO', compte: 'CELI', actions: 0, prix: 0, cible: 0.20 },
    { ticker: 'XEF', compte: 'CELI', actions: 0, prix: 0, cible: 0.40 },
    { ticker: 'XEQT', compte: 'CELI enfant', actions: 0, prix: 0, cible: 1.00 },
  ],
  reequilibrage: { tolerance: 5, horizon: 3 },
  rendementAnnuel: 6.5,
  celi: {
    naissance: '',
    anneeDebutCotisation: 0,
    plafondsAnnuels: { ...CELI_PLAFONDS_OFFICIELS },
    cotisations: {},
  },
};
