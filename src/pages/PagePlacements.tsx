import { useFinance } from '../FinanceContext';
import { money, valeurCompte } from '../calc';
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
          const valeur = valeurCompte(data, c.id);
          const aHoldings = data.holdings.some(
            (h) =>
              (c.id === 'celiapp' && h.compte === 'CELIAPP') ||
              (c.id === 'celi' && h.compte === 'CELI') ||
              (c.id === 'celi_enfant' && h.compte === 'CELI enfant') ||
              (c.id === 'crypto' && h.compte === 'Wealthsimple'),
          );
          return (
            <Card key={c.id} plus="br">
              <div className="cd" style={{ fontWeight: 700, fontSize: 30, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                {c.nom}
              </div>
              <div className="muted" style={{ fontSize: 16, marginTop: 2 }}>{c.simple}</div>
              <div className="mono-cond" style={{ fontSize: 38, marginTop: 16 }}>{money(valeur)}</div>
              {aHoldings ? (
                <div className="subtle mt-6" style={{ fontSize: 14 }}>
                  Calculé depuis tes actifs (quantité × prix) dans « Portefeuille ».
                </div>
              ) : (
                <label className="field mt-10">
                  <span className="field__label">Valeur actuelle ($)</span>
                  <NumInput className="field__input" style={{ fontSize: 22 }} value={c.valeur}
                    onChange={(n) => setCompte(c.id, { valeur: n })} />
                </label>
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
