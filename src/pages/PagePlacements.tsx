import { useFinance } from '../FinanceContext';
import { money } from '../calc';
import { PageHeader } from '../App';
import { Card } from '../ui';
import type { CompteInvest } from '../types';

export const PagePlacements = () => {
  const { data, setData } = useFinance();

  const total = data.comptes.reduce((s, c) => s + c.valeur, 0);
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
        {data.comptes.map((c) => (
          <Card key={c.id} plus="br">
            <div className="cd" style={{ fontWeight: 700, fontSize: 30, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              {c.nom}
            </div>
            <div className="muted" style={{ fontSize: 16, marginTop: 2 }}>{c.simple}</div>
            <div className="mono-cond" style={{ fontSize: 38, marginTop: 16 }}>{money(c.valeur)}</div>
            <label className="field mt-14">
              <span className="field__label">À chaque paie, j'ajoute ($)</span>
              <input className="field__input" style={{ fontSize: 24 }} inputMode="numeric" value={c.parCycle}
                onChange={(e) => setCompte(c.id, { parCycle: Number(e.target.value) || 0 })} />
            </label>
            <div className="blue mt-10" style={{ fontSize: 16 }}>
              = {money(c.parCycle * 2)} par mois · {money(c.parCycle * 24)} par année
            </div>
          </Card>
        ))}
      </div>

      <div style={{ border: '1px solid #cfd3d7', padding: 24 }} className="grid grid-auto-260 gap-24 center">
        <div>
          <div className="section-label">Rendement attendu</div>
          <p className="pretty mt-8" style={{ fontSize: 17, color: '#424244' }}>
            Combien tu penses que tes placements rapportent par année. La moyenne d'un portefeuille équilibré tourne autour de 6 %.
          </p>
        </div>
        <div className="row center gap-12">
          <input className="field__input" style={{ width: 130, fontFamily: "'Barlow Condensed'", fontWeight: 700, fontSize: 34 }}
            inputMode="decimal" value={data.rendementAnnuel}
            onChange={(e) => setData((x) => ({ ...x, rendementAnnuel: Number(e.target.value) || 0 }))} />
          <span className="cd blue" style={{ fontWeight: 700, fontSize: 30 }}>% par année</span>
        </div>
      </div>
    </>
  );
};
