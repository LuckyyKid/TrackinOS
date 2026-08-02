import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import { AuthProvider, useAuth } from './AuthContext';
import { FinanceDataProvider } from './FinanceContext';
import { App } from './App';
import { PageAuth } from './pages/PageAuth';

const Gate = () => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="auth-wrap">
        <div className="section-label">Chargement…</div>
      </div>
    );
  }
  if (!user) return <PageAuth />;
  return (
    <FinanceDataProvider>
      <App />
    </FinanceDataProvider>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <AuthProvider>
      <Gate />
    </AuthProvider>
  </React.StrictMode>,
);
