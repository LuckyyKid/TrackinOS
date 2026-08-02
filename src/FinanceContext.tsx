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
import { DEFAULT_DATA, type FinanceData } from './types';
import { supabase } from './supabase';
import { useAuth } from './AuthContext';

type Ctx = {
  data: FinanceData;
  setData: (updater: (d: FinanceData) => FinanceData) => void;
  loading: boolean;
  saving: boolean;
  reset: () => void;
};

const FinanceContext = createContext<Ctx | null>(null);

const merge = (loaded: Partial<FinanceData>): FinanceData => ({
  ...DEFAULT_DATA,
  ...loaded,
  celi: { ...DEFAULT_DATA.celi, ...(loaded.celi ?? {}) },
  celiapp: { ...DEFAULT_DATA.celiapp, ...(loaded.celiapp ?? {}) },
  reer: { ...DEFAULT_DATA.reer, ...(loaded.reer ?? {}) },
  reee: { ...DEFAULT_DATA.reee, ...(loaded.reee ?? {}) },
  objectif: { ...DEFAULT_DATA.objectif, ...(loaded.objectif ?? {}) },
  reequilibrage: { ...DEFAULT_DATA.reequilibrage, ...(loaded.reequilibrage ?? {}) },
  coussin: { ...DEFAULT_DATA.coussin, ...(loaded.coussin ?? {}) },
  carte: { ...DEFAULT_DATA.carte, ...(loaded.carte ?? {}) },
  comptes: loaded.comptes ?? DEFAULT_DATA.comptes,
  holdings: loaded.holdings ?? DEFAULT_DATA.holdings,
  cibles: loaded.cibles ?? DEFAULT_DATA.cibles,
});

export const FinanceDataProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [data, setDataState] = useState<FinanceData>(DEFAULT_DATA);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const timer = useRef<number | null>(null);
  const skipNextSave = useRef(true);
  const currentUserId = useRef<string | null>(null);

  // Chargement initial depuis Supabase à chaque changement d'utilisateur
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setLoading(true);
    skipNextSave.current = true;
    currentUserId.current = user.id;

    (async () => {
      const { data: row, error } = await supabase
        .from('finance_data')
        .select('data')
        .eq('user_id', user.id)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        console.error('Erreur chargement finance_data', error);
        setDataState(DEFAULT_DATA);
        setLoading(false);
        return;
      }

      if (row?.data) {
        setDataState(merge(row.data as Partial<FinanceData>));
      } else {
        // Première connexion : créer une ligne vide
        setDataState(DEFAULT_DATA);
        await supabase
          .from('finance_data')
          .insert({ user_id: user.id, data: DEFAULT_DATA });
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  // Sauvegarde debounced à chaque modification
  useEffect(() => {
    if (!user || loading) return;
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    if (currentUserId.current !== user.id) return;

    if (timer.current) window.clearTimeout(timer.current);
    setSaving(true);
    timer.current = window.setTimeout(async () => {
      const { error } = await supabase
        .from('finance_data')
        .upsert({ user_id: user.id, data, updated_at: new Date().toISOString() });
      if (error) console.error('Erreur sauvegarde finance_data', error);
      setSaving(false);
    }, 500);

    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [data, user, loading]);

  const setData = useCallback(
    (updater: (d: FinanceData) => FinanceData) => setDataState((d) => updater(d)),
    [],
  );

  const reset = useCallback(async () => {
    setDataState(DEFAULT_DATA);
    if (user) {
      await supabase
        .from('finance_data')
        .upsert({ user_id: user.id, data: DEFAULT_DATA, updated_at: new Date().toISOString() });
    }
  }, [user]);

  const value = useMemo(
    () => ({ data, setData, loading, saving, reset }),
    [data, setData, loading, saving, reset],
  );
  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
};

export const useFinance = (): Ctx => {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error('useFinance must be used inside FinanceDataProvider');
  return ctx;
};
