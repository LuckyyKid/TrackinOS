import { useState } from 'react';
import { useAuth } from './AuthContext';
import { useFinance } from './FinanceContext';
import { alertes, aujourdhuiTxt } from './calc';
import { PageAccueil } from './pages/PageAccueil';
import { PagePaies } from './pages/PagePaies';
import { PageCoussin } from './pages/PageCoussin';
import { PageDepenses } from './pages/PageDepenses';
import { PageCarte } from './pages/PageCarte';
import { PagePlacements } from './pages/PagePlacements';
import { PagePlafonds } from './pages/PagePlafonds';
import { PagePortefeuille } from './pages/PagePortefeuille';
import { PageAvenir } from './pages/PageAvenir';
import { PageCalendrier } from './pages/PageCalendrier';
import { PageAvoir } from './pages/PageAvoir';

export type PageId =
  | 'accueil'
  | 'paies'
  | 'coussin'
  | 'depenses'
  | 'carte'
  | 'placements'
  | 'plafonds'
  | 'portefeuille'
  | 'avoir'
  | 'avenir'
  | 'calendrier';

const TABS: Array<{ id: PageId; num: string; label: string }> = [
  { id: 'accueil', num: '01', label: 'Accueil' },
  { id: 'paies', num: '02', label: 'Mes paies' },
  { id: 'coussin', num: '03', label: 'Mon coussin' },
  { id: 'depenses', num: '04', label: 'Mes dépenses' },
  { id: 'carte', num: '05', label: 'Ma carte' },
  { id: 'placements', num: '06', label: 'Mes placements' },
  { id: 'plafonds', num: '07', label: 'Mes plafonds' },
  { id: 'portefeuille', num: '08', label: 'Portefeuille' },
  { id: 'avoir', num: '09', label: 'Avoir total' },
  { id: 'avenir', num: '10', label: 'Mon avenir' },
  { id: 'calendrier', num: '11', label: 'Calendrier' },
];

export const App = () => {
  const { data, loading, saving, error } = useFinance();
  const { user, signOut } = useAuth();
  const [page, setPage] = useState<PageId>('accueil');
  const alertesList = alertes(data);
  const nbAlertes = alertesList.length;

  return (
    <div>
      <header className="header">
        <div className="header__inner">
          <div>
            <div className="logo">CyclePay</div>
            <div className="tagline">Ton argent, deux paies à la fois</div>
          </div>
          <div className="row center gap-14">
            <div className="muted" style={{ fontSize: 15 }}>{aujourdhuiTxt()}</div>
            {saving && <span className="chip chip--saving">Enregistré</span>}
            {nbAlertes > 0 && (
              <button
                className="alert-pastille"
                onClick={() => setPage('accueil')}
              >
                {nbAlertes === 1 ? '1 chose à régler' : `${nbAlertes} choses à régler`}
              </button>
            )}
            {user && (
              <div className="header__user">
                <span>{user.email}</span>
                <button className="header__signout" onClick={signOut}>Déconnexion</button>
              </div>
            )}
          </div>
        </div>
        <nav className="nav" aria-label="Sections">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={'nav__tab' + (t.id === page ? ' nav__tab--active' : '')}
              onClick={() => setPage(t.id)}
              aria-current={t.id === page ? 'page' : undefined}
            >
              <span className="nav__tab__num">{t.num}</span>
              <span className="nav__tab__label">{t.label}</span>
            </button>
          ))}
        </nav>
      </header>
      <main className="main">
        {error && (
          <div
            style={{
              background: '#fdecea',
              border: '1px solid #a4402f',
              color: '#a4402f',
              padding: 14,
              marginBottom: 18,
              fontSize: 15,
              fontWeight: 600,
            }}
          >
            ⚠ {error}
          </div>
        )}
        {loading ? (
          <div className="section-label">Chargement…</div>
        ) : (
          <PageSwitch page={page} go={setPage} />
        )}
      </main>
    </div>
  );
};

const PageSwitch = ({ page, go }: { page: PageId; go: (p: PageId) => void }) => {
  switch (page) {
    case 'accueil': return <PageAccueil go={go} />;
    case 'paies': return <PagePaies />;
    case 'coussin': return <PageCoussin />;
    case 'depenses': return <PageDepenses />;
    case 'carte': return <PageCarte />;
    case 'placements': return <PagePlacements />;
    case 'plafonds': return <PagePlafonds />;
    case 'portefeuille': return <PagePortefeuille />;
    case 'avoir': return <PageAvoir />;
    case 'avenir': return <PageAvenir />;
    case 'calendrier': return <PageCalendrier />;
  }
};

export const PageHeader = ({
  section,
  title,
  help,
  right,
}: {
  section: string;
  title: string;
  help?: string;
  right?: React.ReactNode;
}) => (
  <div className="row between center gap-16" style={{ marginBottom: 24 }}>
    <div className="page-header">
      <div className="section-label">{section}</div>
      <h1 className="h1">{title}</h1>
      {help && <p className="help">{help}</p>}
    </div>
    {right && <div>{right}</div>}
  </div>
);
