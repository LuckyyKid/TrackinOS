export type CycleId = 'cycle1' | 'cycle2';
export type CycleCible = CycleId | 'deux';
export type Categorie = 'fixe' | 'variable' | 'investissement' | 'epargne' | 'dette';
export type CompteSrc = 'cheques' | 'credit' | 'placement';
export type Recurrence = 'mensuel' | 'deux_semaines' | 'annuel' | 'unique';

// Types de comptes d'investissement supportés (choix générique pour tout utilisateur)
export type TypeCompte =
  | 'CELI'
  | 'CELIAPP'
  | 'REER'
  | 'NON_ENREGISTRE'
  | 'CRYPTO'
  | 'AUTRE';

export const TYPES_COMPTE: Array<{ id: TypeCompte; label: string; description: string; aPlafond: boolean }> = [
  { id: 'CELI', label: 'CELI', description: 'Compte d\u2019épargne libre d\u2019impôt', aPlafond: true },
  { id: 'CELIAPP', label: 'CELIAPP', description: 'Compte d\u2019épargne pour la première maison', aPlafond: true },
  { id: 'REER', label: 'REER', description: 'Régime enregistré d\u2019épargne-retraite', aPlafond: true },
  { id: 'NON_ENREGISTRE', label: 'Non enregistré', description: 'Compte de placement imposable', aPlafond: false },
  { id: 'CRYPTO', label: 'Crypto', description: 'Cryptomonnaies', aPlafond: false },
  { id: 'AUTRE', label: 'Autre', description: 'Compte personnalisé', aPlafond: false },
];

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
  compte: string; // libre : cheques, credit, ou n'importe quel nom / id de compte d'investissement
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

// Un compte d'investissement. L'id est généré, le nom est libre, le typeCompte détermine le plafond.
export type CompteInvest = {
  id: string;
  nom: string;
  typeCompte: TypeCompte;
  simple: string; // description libre
  valeur: number; // valeur saisie manuellement (croisement)
  parCycle: number; // versement à chaque paie
  cash: number; // cash non investi dans le compte
  dansStrategie: boolean; // inclus dans la stratégie de répartition
};

export type Holding = {
  id: string;
  ticker: string;
  compte: string; // id du compte d'investissement
  actions: number;
  prix: number;
};

export type Cible = {
  ticker: string;
  part: number; // 0..1
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

export type CeliappConfig = {
  anneeDebutCotisation: number;
  cotisations: Record<number, number>;
  plafondVie: number; // 40 000 $ par défaut
};

// REER : le plafond de l'année N vient de 18% du revenu gagné en N-1, plafonné au max CRA de N.
// L'utilisateur saisit ses revenus par année ; on calcule les droits.
export type ReerConfig = {
  revenusAnneesPrecedentes: Record<number, number>; // revenu gagné dans l'année (utilisé pour calculer les droits de l'année suivante)
  cotisations: Record<number, number>;
  droitsReport: number; // droits inutilisés reportés au tout début (souvent 0 si nouveau)
};

export type ObjectifFinancier = {
  montant: number;
  ageCible: number;
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

// Plafonds annuels maximums CRA du REER (le plafond individuel = min(18% revenu N-1, ce max))
export const REER_PLAFONDS_MAX: Record<number, number> = {
  2019: 26500, 2020: 27230, 2021: 27830, 2022: 29210, 2023: 30780,
  2024: 31560, 2025: 32490, 2026: 33810,
};

export type FinanceData = {
  cycles: [Cycle, Cycle];
  coussin: Coussin;
  depenses: Depense[];
  carte: Carte;
  comptes: CompteInvest[];
  holdings: Holding[];
  cibles: Cible[];
  reequilibrage: Reequilibrage;
  rendementAnnuel: number;
  celi: CeliConfig;
  celiapp: CeliappConfig;
  reer: ReerConfig;
  objectif: ObjectifFinancier;
};

export const DEFAULT_DATA: FinanceData = {
  cycles: [
    { id: 'cycle1', label: 'Paie du 1er', montant: 0, jour: 1 },
    { id: 'cycle2', label: 'Paie du 15', montant: 0, jour: 15 },
  ],
  coussin: { actuel: 0, objectif: 0, minimum: 0 },
  depenses: [],
  carte: {
    limite: 0,
    solde: 0,
    objectif: 30,
    releve: 1,
    echeance: 21,
    autopayJour: 21,
    autopayMontant: 0,
  },
  comptes: [],
  holdings: [],
  cibles: [],
  reequilibrage: { tolerance: 5, horizon: 3 },
  rendementAnnuel: 6.5,
  celi: {
    naissance: '',
    anneeDebutCotisation: 0,
    plafondsAnnuels: { ...CELI_PLAFONDS_OFFICIELS },
    cotisations: {},
  },
  celiapp: {
    anneeDebutCotisation: 0,
    cotisations: {},
    plafondVie: 40000,
  },
  reer: {
    revenusAnneesPrecedentes: {},
    cotisations: {},
    droitsReport: 0,
  },
  objectif: {
    montant: 1000000,
    ageCible: 45,
  },
};
