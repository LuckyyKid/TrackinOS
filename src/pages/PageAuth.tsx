import { useState } from 'react';
import { useAuth } from '../AuthContext';

export const PageAuth = () => {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'connexion' | 'inscription'>('connexion');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErreur(null);
    setInfo(null);
    if (!email || !password) {
      setErreur('Email et mot de passe requis');
      return;
    }
    if (password.length < 6) {
      setErreur('Mot de passe : 6 caractères minimum');
      return;
    }
    setBusy(true);
    const { error } =
      mode === 'connexion' ? await signIn(email, password) : await signUp(email, password);
    setBusy(false);
    if (error) {
      setErreur(error);
      return;
    }
    if (mode === 'inscription') {
      setInfo('Compte créé. Vérifie ta boîte mail si une confirmation est demandée.');
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="logo" style={{ marginBottom: 4 }}>CyclePay</div>
        <div className="tagline" style={{ marginBottom: 24 }}>
          Ton argent, deux paies à la fois
        </div>

        <div className="auth-tabs">
          <button
            type="button"
            className={'auth-tab' + (mode === 'connexion' ? ' auth-tab--active' : '')}
            onClick={() => {
              setMode('connexion');
              setErreur(null);
              setInfo(null);
            }}
          >
            Connexion
          </button>
          <button
            type="button"
            className={'auth-tab' + (mode === 'inscription' ? ' auth-tab--active' : '')}
            onClick={() => {
              setMode('inscription');
              setErreur(null);
              setInfo(null);
            }}
          >
            Inscription
          </button>
        </div>

        <form onSubmit={submit} className="auth-form">
          <label className="auth-label">
            <span>Email</span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={busy}
              required
            />
          </label>
          <label className="auth-label">
            <span>Mot de passe</span>
            <input
              type="password"
              autoComplete={mode === 'connexion' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={busy}
              minLength={6}
              required
            />
          </label>

          {erreur && <div className="auth-error">{erreur}</div>}
          {info && <div className="auth-info">{info}</div>}

          <button type="submit" className="auth-submit" disabled={busy}>
            {busy
              ? '…'
              : mode === 'connexion'
                ? 'Se connecter'
                : 'Créer mon compte'}
          </button>
        </form>

        <div className="auth-foot">
          {mode === 'connexion' ? (
            <>
              Pas encore de compte ?{' '}
              <button type="button" className="auth-link" onClick={() => setMode('inscription')}>
                Inscris-toi
              </button>
            </>
          ) : (
            <>
              Déjà un compte ?{' '}
              <button type="button" className="auth-link" onClick={() => setMode('connexion')}>
                Connecte-toi
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
