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

type Ctx = {
  data: FinanceData;
  setData: (updater: (d: FinanceData) => FinanceData) => void;
  loading: boolean;
  saving: boolean;
};

const FinanceContext = createContext<Ctx | null>(null);

export const FinanceDataProvider = ({ children }: { children: ReactNode }) => {
  const [data, setDataState] = useState<FinanceData>(DEFAULT_DATA);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const timer = useRef<number | null>(null);
  const firstLoad = useRef(true);

  useEffect(() => {
    fetch('/api/finance')
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (json) setDataState(json as FinanceData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (loading) return;
    if (firstLoad.current) {
      firstLoad.current = false;
      return;
    }
    if (timer.current) window.clearTimeout(timer.current);
    setSaving(true);
    timer.current = window.setTimeout(() => {
      fetch('/api/finance', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(data),
      })
        .catch(() => {})
        .finally(() => setSaving(false));
    }, 800);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [data, loading]);

  const setData = useCallback(
    (updater: (d: FinanceData) => FinanceData) => setDataState((d) => updater(d)),
    [],
  );

  const value = useMemo(() => ({ data, setData, loading, saving }), [data, setData, loading, saving]);
  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
};

export const useFinance = (): Ctx => {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error('useFinance must be used inside FinanceDataProvider');
  return ctx;
};
