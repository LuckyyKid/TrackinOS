import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import { FinanceDataProvider } from './FinanceContext';
import { App } from './App';

const root = createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <FinanceDataProvider>
      <App />
    </FinanceDataProvider>
  </React.StrictMode>,
);
