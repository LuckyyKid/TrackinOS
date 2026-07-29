import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { DEFAULT_DATA, type FinanceData, type CompteInvest } from './types';

type Ctx = {
  data: FinanceData;
  setData: (updater: (d: FinanceData) => FinanceData) => void;
  loading: boolean;
  saving: boolean;
  reset: () => void;
};

const FinanceContext = createContext<Ctx | null>(null);

const KEY = 'cyclepay.finance.v1';

const uid = (): string =>
  'h_' + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);

const merge = (loaded: Partial<FinanceData>): FinanceData => {
  const rawHoldings = (loaded.holdings ?? DEFAULT_DATA.holdings) as Array<
    FinanceData['holdings'][number] & { cible?: number }
  >;
  const holdings = rawHoldings.map((h) => ({
    id: h.id ?? uid(),
    ticker: h.ticker,
    compte: h.compte,
    actions: h.actions,
    prix: h.prix,
  }));
  let cibles = loaded.cibles;
  if (!cibles) {
    const seen = new Map<string, number>();
    rawHoldings.forEach((h) => {
      // CELI enfant est un pool séparé (XEQT dédié aux enfants) — hors stratégie perso
      if (h.compte === 'CELI enfant') return;
      if (h.ticker && typeof h.cible === 'number' && !seen.has(h.ticker)) {
        seen.set(h.ticker, h.cible);
      }
    });
    cibles = seen.size
      ? Array.from(seen, ([ticker, part]) => ({ ticker, part }))
      : DEFAULT_DATA.cibles;
  }
  const rawComptes = (loaded.comptes ?? DEFAULT_DATA.comptes) as Array<
    Partial<CompteInvest> & Pick<CompteInvest, 'id'>
  >;
  const comptes: CompteInvest[] = rawComptes.map((c) => {
    const defaut = DEFAULT_DATA.comptes.find((d) => d.id === c.id);
    const base = defaut ?? DEFAULT_DATA.comptes[0];
    return {
      ...base,
      ...c,
      cash: typeof c.cash === 'number' ? c.cash : 0,
      dansStrategie:
        typeof c.dansStrategie === 'boolean' ? c.dansStrategie : defaut?.dansStrategie ?? true,
    };
  });
  return {
    ...DEFAULT_DATA,
    ...loaded,
    celi: { ...DEFAULT_DATA.celi, ...(loaded.celi ?? {}) },
    celiapp: { ...DEFAULT_DATA.celiapp, ...(loaded.celiapp ?? {}) },
    objectif: { ...DEFAULT_DATA.objectif, ...(loaded.objectif ?? {}) },
    reequilibrage: { ...DEFAULT_DATA.reequilibrage, ...(loaded.reequilibrage ?? {}) },
    coussin: { ...DEFAULT_DATA.coussin, ...(loaded.coussin ?? {}) },
    carte: { ...DEFAULT_DATA.carte, ...(loaded.carte ?? {}) },
    comptes,
    holdings,
    cibles,
  };
};

const chargerInitial = (): FinanceData => {
  try {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(KEY) : null;
    if (!raw) return DEFAULT_DATA;
    return merge(JSON.parse(raw));
  } catch {
    return DEFAULT_DATA;
  }
};

export const FinanceDataProvider = ({ children }: { children: ReactNode }) => {
  const [data, setDataState] = useState<FinanceData>(chargerInitial);
  const [saving, setSaving] = useState(false);
  const timer = useRef<number | null>(null);
  const firstLoad = useRef(true);

  useEffect(() => {
    if (firstLoad.current) {
      firstLoad.current = false;
      return;
    }
    if (timer.current) window.clearTimeout(timer.current);
    setSaving(true);
    timer.current = window.setTimeout(() => {
      try {
        window.localStorage.setItem(KEY, JSON.stringify(data));
      } catch {
        // stockage plein ou bloqué — on abandonne silencieusement
      }
      setSaving(false);
    }, 300);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [data]);

  const setData = useCallback(
    (updater: (d: FinanceData) => FinanceData) => setDataState((d) => updater(d)),
    [],
  );

  const reset = useCallback(() => {
    try {
      window.localStorage.removeItem(KEY);
    } catch {}
    setDataState(DEFAULT_DATA);
  }, []);

  const value = useMemo(
    () => ({ data, setData, loading: false, saving, reset }),
    [data, setData, saving, reset],
  );
  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
};

export const useFinance = (): Ctx => {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error('useFinance must be used inside FinanceDataProvider');
  return ctx;
};
