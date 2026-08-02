import { useState } from 'react';
import { useFinance } from '../FinanceContext';
import { money, valeurCompte } from '../calc';
import { PageHeader } from '../App';
import { Card, NumInput } from '../ui';
import type { CompteInvest, TypeCompte } from '../types';
import { TYPES_COMPTE } from '../types';

const uid = (): string =>
  'c_' + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);

export const PagePlacements = () => {
  const { data, setData } = useFinance();
  const [ajoutOuvert, setAjoutOuvert] = useState(false);
  const [nouveau, setNouveau] = useState<{ nom: string; typeCompte: TypeCompte; simple: string }>({
    nom: '',
    typeCompte: 'CELI',
    simple: '',
  });

  const total = data.comptes.reduce((s, c) => s + valeurCompte(data, c.id), 0);
  const mensuel = data.comptes.reduce((s, c) => s + c.parCycle * 2, 0);

  const setCompte = (id: string, patch: Partial<CompteInvest>) =>
    setData((x) => ({
      ...x,
      comptes: x.comptes.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }));

  const supprimerCompte = (id: string) => {
    const compte = data.comptes.find((c) => c.id === id);
    if (!compte) return;
    if (
      !window.confirm(
        `Supprimer le compte « ${compte.nom} » ?\nLes actifs (holdings) rattachés à ce compte seront aussi supprimés.`,
      )
    )
      return;
    setData((x) => ({
      ...x,
      comptes: x.comptes.filter((c) => c.id !== id),
      holdings: x.holdings.filter((h) => h.compte !== id),
    }));
  };

  const ajouterCompte = () => {
    const nom = nouveau.nom.trim();
    if (!nom) return;
    const meta = TYPES_COMPTE.find((t) => t.id === nouveau.typeCompte);
    const compte: CompteInvest = {
      id: uid(),
      nom,
      typeCompte: nouveau.typeCompte,
      simple: nouveau.simple.trim() || meta?.description || '',
      valeur: 0,
      parCycle: 0,
      cash: 0,
      dansStrategie: true,
    };
    setData((x) => ({ ...x, comptes: [...x.comptes, compte] }));
    setNouveau({ nom: '', typeCompte: 'CELI', simple: '' });
    setAjoutOuvert(false);
  };

  return (
    <>
      <PageHeader
        section="Placements"
        title="Mes placements"
        help="Ajoute tes comptes d'investissement (CELI, CELIAPP, REER, non enregistré, crypto…). Pour chacun, indique combien tu y verses à chaque paie."
        right={
          <button className="btn btn--primary" onClick={() => setAjoutOuvert((v) => !v)}>
            {ajoutOuvert ? 'Annuler' : '+ Ajouter un compte'}
          </button>
        }
      />

      {ajoutOuvert && (
        <Card className="card--pad-sm" style={{ marginBottom: 24 }}>
          <div className="section-label">Nouveau compte</div>
          <div className="grid grid-auto-220 gap-14 mt-14">
            <label className="field">
              <span className="field__label">Nom (ex: CELI Wealthsimple)</span>
              <input
                className="field__input"
                style={{ fontSize: 18 }}
                value={nouveau.nom}
                onChange={(e) => setNouveau((n) => ({ ...n, nom: e.target.value }))}
                placeholder="Nom du compte"
              />
            </label>
            <label className="field">
              <span className="field__label">Type</span>
              <select
                className="field__input"
                style={{ fontSize: 18 }}
                value={nouveau.typeCompte}
                onChange={(e) =>
                  setNouveau((n) => ({ ...n, typeCompte: e.target.value as TypeCompte }))
                }
              >
                {TYPES_COMPTE.map((t) => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span className="field__label">Description (facultatif)</span>
              <input
                className="field__input"
                style={{ fontSize: 18 }}
                value={nouveau.simple}
                onChange={(e) => setNouveau((n) => ({ ...n, simple: e.target.value }))}
                placeholder={TYPES_COMPTE.find((t) => t.id === nouveau.typeCompte)?.description}
              />
            </label>
          </div>
          <div className="row mt-14 gap-10">
            <button className="btn btn--primary" onClick={ajouterCompte} disabled={!nouveau.nom.trim()}>
              Créer le compte
            </button>
          </div>
        </Card>
      )}

      {data.comptes.length === 0 ? (
        <Card>
          <div className="pretty" style={{ fontSize: 17 }}>
            Tu n'as encore aucun compte de placement. Clique sur <strong>+ Ajouter un compte</strong> pour commencer.
          </div>
        </Card>
      ) : (
        <>
          <Card className="card--pad-sm" plus="tl" style={{ marginBottom: 24 }}>
            <div className="grid grid-auto-220 gap-24">
              <div>
                <div className="muted" style={{ fontSize: 16 }}>Valeur de tous mes placements</div>
                <div className="figure figure--sm">{money(total)}</div>
              </div>
              <div>
                <div className="muted" style={{ fontSize: 16 }}>J'ajoute chaque mois</div>
                <div className="figure figure--sm blue">{money(mensuel)}</div>
              </div>
            </div>
          </Card>

          <div className="grid grid-auto-300 gap-20" style={{ marginBottom: 24 }}>
            {data.comptes.map((c) => {
              const holdingsDuCompte = data.holdings.filter((h) => h.compte === c.id);
              const valeurHoldings = holdingsDuCompte.reduce((s, h) => s + h.actions * h.prix, 0);
              const aHoldings = holdingsDuCompte.length > 0;
              const valeurCalculee = valeurHoldings + c.cash;
              const valeurAffichee = aHoldings ? valeurCalculee : c.valeur;
              const ecart = aHoldings ? valeurCalculee - c.valeur : 0;
              const ecartRelatif = c.valeur > 0 ? Math.abs(ecart) / c.valeur : 0;
              const divergent =
                aHoldings && c.valeur > 0 && (Math.abs(ecart) > 100 || ecartRelatif > 0.05);
              const typeMeta = TYPES_COMPTE.find((t) => t.id === c.typeCompte);
              return (
                <Card key={c.id} plus="br">
                  <div className="row between center gap-10" style={{ flexWrap: 'wrap' }}>
                    <div>
                      <div
                        className="cd"
                        style={{
                          fontWeight: 700,
                          fontSize: 26,
                          textTransform: 'uppercase',
                          letterSpacing: '0.03em',
                        }}
                      >
                        {c.nom}
                      </div>
                      <div className="subtle" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {typeMeta?.label ?? c.typeCompte}
                      </div>
                    </div>
                    <button
                      className="btn"
                      title="Supprimer ce compte"
                      onClick={() => supprimerCompte(c.id)}
                      style={{ fontSize: 12 }}
                    >
                      Supprimer
                    </button>
                  </div>
                  <label className="row center gap-6 mt-6" style={{ fontSize: 14, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={c.dansStrategie}
                      onChange={(e) => setCompte(c.id, { dansStrategie: e.target.checked })}
                    />
                    <span className="muted">Dans la stratégie de répartition</span>
                  </label>
                  <label className="field mt-8">
                    <span className="field__label">Description</span>
                    <input
                      className="field__input"
                      style={{ fontSize: 16 }}
                      value={c.simple}
                      onChange={(e) => setCompte(c.id, { simple: e.target.value })}
                    />
                  </label>
                  <div className="mono-cond" style={{ fontSize: 38, marginTop: 16 }}>
                    {money(valeurAffichee)}
                  </div>
                  {aHoldings && (
                    <div className="subtle mt-6" style={{ fontSize: 14 }}>
                      Actifs {money(valeurHoldings)} + cash {money(c.cash)} = {money(valeurCalculee)}
                    </div>
                  )}
                  <label className="field mt-10">
                    <span className="field__label">
                      Valeur actuelle saisie ($){aHoldings ? ' — pour vérification' : ''}
                    </span>
                    <NumInput
                      className="field__input"
                      style={{ fontSize: 22 }}
                      value={c.valeur}
                      onChange={(n) => setCompte(c.id, { valeur: n })}
                    />
                  </label>
                  {aHoldings && (
                    <label className="field mt-10">
                      <span className="field__label">Cash dans le compte ($)</span>
                      <NumInput
                        className="field__input"
                        style={{ fontSize: 20 }}
                        value={c.cash}
                        onChange={(n) => setCompte(c.id, { cash: n })}
                      />
                    </label>
                  )}
                  {aHoldings && (
                    <div
                      className="mt-8"
                      style={{
                        fontSize: 14,
                        color: divergent ? '#a4402f' : '#5980a6',
                        fontWeight: divergent ? 700 : 500,
                      }}
                    >
                      {c.valeur === 0
                        ? `Actifs + cash : ${money(valeurCalculee)}. Saisis ta valeur réelle pour vérifier.`
                        : divergent
                          ? `Écart de ${money(ecart)} entre saisi (${money(c.valeur)}) et actifs + cash (${money(valeurCalculee)}). Ajuste le cash ou vérifie tes quantités.`
                          : `Saisi ${money(c.valeur)} · actifs + cash ${money(valeurCalculee)} — cohérent.`}
                    </div>
                  )}
                  <label className="field mt-14">
                    <span className="field__label">À chaque paie, j'ajoute ($)</span>
                    <NumInput
                      className="field__input"
                      style={{ fontSize: 24 }}
                      value={c.parCycle}
                      onChange={(n) => setCompte(c.id, { parCycle: n })}
                    />
                  </label>
                  <div className="blue mt-10" style={{ fontSize: 16 }}>
                    = {money(c.parCycle * 2)} par mois · {money(c.parCycle * 24)} par année
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}

      <div
        style={{ border: '1px solid #cfd3d7', padding: 24 }}
        className="grid grid-auto-260 gap-24 center"
      >
        <div>
          <div className="section-label">Rendement attendu</div>
          <p className="pretty mt-8" style={{ fontSize: 17, color: '#424244' }}>
            Combien tu penses que tes placements rapportent par année. La moyenne d'un portefeuille équilibré tourne autour de 6 %.
          </p>
        </div>
        <div className="row center gap-12">
          <NumInput
            className="field__input"
            style={{
              width: 130,
              fontFamily: "'Barlow Condensed'",
              fontWeight: 700,
              fontSize: 34,
            }}
            value={data.rendementAnnuel}
            onChange={(n) => setData((x) => ({ ...x, rendementAnnuel: n }))}
          />
          <span className="cd blue" style={{ fontWeight: 700, fontSize: 30 }}>% par année</span>
        </div>
      </div>
    </>
  );
};
