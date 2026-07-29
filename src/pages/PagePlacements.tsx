import { useFinance } from '../FinanceContext';
import { LABEL_HOLDING, money, valeurCompte } from '../calc';
import { PageHeader } from '../App';
import { Card, NumInput } from '../ui';
import type { CompteInvest } from '../types';

export const PagePlacements = () => {
  const { data, setData } = useFinance();

  const total = data.comptes.reduce((s, c) => s + valeurCompte(data, c.id), 0);
  const mensuel = data.comptes.reduce((s, c) => s + c.parCycle * 2, 0);

  const setCompte = (id: CompteInvest['id'], patch: Partial<CompteInvest>) =>
    setData((x) => ({
      ...x,
      comptes: x.comptes.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }));

  return (
    <>
      <PageHeader
        section="Placements"
        title="Mes placements"
        help="Ici, tu décides combien tu mets de côté à chaque paie. Ce montant part automatiquement le jour de la paie."
      />

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
          const label = LABEL_HOLDING[c.id];
          const holdingsDuCompte = data.holdings.filter((h) => h.compte === label);
          const valeurHoldings = holdingsDuCompte.reduce((s, h) => s + h.actions * h.prix, 0);
          const aHoldings = holdingsDuCompte.length > 0;
          const valeurCalculee = valeurHoldings + c.cash;
          const valeurAffichee = aHoldings ? valeurCalculee : c.valeur;
          const ecart = aHoldings ? valeurCalculee - c.valeur : 0;
          const ecartRelatif = c.valeur > 0 ? Math.abs(ecart) / c.valeur : 0;
          const divergent = aHoldings && c.valeur > 0 && (Math.abs(ecart) > 100 || ecartRelatif > 0.05);
          return (
            <Card key={c.id} plus="br">
              <div className="row between center gap-10" style={{ flexWrap: 'wrap' }}>
                <div className="cd" style={{ fontWeight: 700, fontSize: 30, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  {c.nom}
                </div>
                <label className="row center gap-6" style={{ fontSize: 14, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={c.dansStrategie}
                    onChange={(e) => setCompte(c.id, { dansStrategie: e.target.checked })}
                  />
                  <span className="muted">Dans la stratégie</span>
                </label>
              </div>
              <div className="muted" style={{ fontSize: 16, marginTop: 2 }}>{c.simple}</div>
              <div className="mono-cond" style={{ fontSize: 38, marginTop: 16 }}>{money(valeurAffichee)}</div>
              {aHoldings && (
                <div className="subtle mt-6" style={{ fontSize: 14 }}>
                  Actifs {money(valeurHoldings)} + cash {money(c.cash)} = {money(valeurCalculee)}
                </div>
              )}
              <label className="field mt-10">
                <span className="field__label">
                  Valeur actuelle saisie ($){aHoldings ? ' — pour vérification' : ''}
                </span>
                <NumInput className="field__input" style={{ fontSize: 22 }} value={c.valeur}
                  onChange={(n) => setCompte(c.id, { valeur: n })} />
              </label>
              {aHoldings && (
                <label className="field mt-10">
                  <span className="field__label">Cash dans le compte ($)</span>
                  <NumInput className="field__input" style={{ fontSize: 20 }} value={c.cash}
                    onChange={(n) => setCompte(c.id, { cash: n })} />
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
                <NumInput className="field__input" style={{ fontSize: 24 }} value={c.parCycle}
                  onChange={(n) => setCompte(c.id, { parCycle: n })} />
              </label>
              <div className="blue mt-10" style={{ fontSize: 16 }}>
                = {money(c.parCycle * 2)} par mois · {money(c.parCycle * 24)} par année
              </div>
            </Card>
          );
        })}
      </div>

      <div style={{ border: '1px solid #cfd3d7', padding: 24 }} className="grid grid-auto-260 gap-24 center">
        <div>
          <div className="section-label">Rendement attendu</div>
          <p className="pretty mt-8" style={{ fontSize: 17, color: '#424244' }}>
            Combien tu penses que tes placements rapportent par année. La moyenne d'un portefeuille équilibré tourne autour de 6 %.
          </p>
        </div>
        <div className="row center gap-12">
          <NumInput className="field__input" style={{ width: 130, fontFamily: "'Barlow Condensed'", fontWeight: 700, fontSize: 34 }}
            value={data.rendementAnnuel}
            onChange={(n) => setData((x) => ({ ...x, rendementAnnuel: n }))} />
          <span className="cd blue" style={{ fontWeight: 700, fontSize: 30 }}>% par année</span>
        </div>
      </div>
    </>
  );
};
