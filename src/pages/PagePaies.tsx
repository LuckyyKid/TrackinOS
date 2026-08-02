import { useFinance } from '../FinanceContext';
import {
  money,
  revenuMensuel,
  soldeCycle,
  totalCyclePaye,
  totalDepensesMensuelles,
} from '../calc';
import { PageHeader } from '../App';
import { Card, NumInput } from '../ui';
import type { Cycle } from '../types';

export const PagePaies = () => {
  const { data, setData } = useFinance();

  const set = (i: 0 | 1, patch: Partial<Cycle>) =>
    setData((x) => {
      const cycles = [...x.cycles] as [Cycle, Cycle];
      cycles[i] = { ...cycles[i], ...patch };
      return { ...x, cycles };
    });

  const revenu = revenuMensuel(data);
  const depMens = totalDepensesMensuelles(data);
  const libre = revenu - depMens;

  return (
    <>
      <PageHeader
        section="Étape 1"
        title="Mes deux paies"
        help="Tu es payé deux fois par mois. Écris combien tu reçois et quel jour. Tout le reste de l'application se calcule à partir de ces deux chiffres."
      />

      <div className="grid grid-auto-330 gap-20" style={{ marginBottom: 24 }}>
        {data.cycles.map((c, i) => {
          const nbDep = data.depenses.filter((d) => d.actif && (d.cycle === c.id || d.cycle === 'deux')).length;
          const solde = soldeCycle(c, data.depenses);
          const paye = totalCyclePaye(data, c.id);
          return (
            <Card key={c.id} style={{ padding: 26 }}>
              <div className="section-label">Paie {i + 1}</div>
              <div className="stack gap-16 mt-14">
                <label className="field">
                  <span className="field__label">Nom de cette paie</span>
                  <input className="field__input" value={c.label}
                    onChange={(e) => set(i as 0 | 1, { label: e.target.value })} />
                </label>
                <label className="field">
                  <span className="field__label">Combien tu reçois ($)</span>
                  <NumInput className="field__input field__input--big" value={c.montant}
                    onChange={(n) => set(i as 0 | 1, { montant: n })} />
                </label>
                <label className="field">
                  <span className="field__label">Quel jour du mois</span>
                  <NumInput className="field__input" style={{ width: '100%', maxWidth: 120 }} integer min={1} max={31} value={c.jour}
                    onChange={(n) => set(i as 0 | 1, { jour: Math.max(1, n) })} />
                </label>
              </div>
              <div style={{ background: '#eef6ff', border: '1px solid #b5d9fd', padding: 16, marginTop: 20 }}>
                <div className="blue" style={{ fontSize: 16 }}>Après tes dépenses de cette paie, il te reste</div>
                <div className="mono-cond" style={{ fontSize: 42, lineHeight: 1.05, color: solde < 0 ? '#a4402f' : '#1d1f20' }}>
                  {money(solde)}
                </div>
                <div className="muted" style={{ fontSize: 15 }}>
                  {nbDep} {nbDep === 1 ? 'dépense est payée' : 'dépenses sont payées'} par cette paie ({money(paye)} au total)
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-auto-220 gap-20" style={{ border: '1px solid #cfd3d7', padding: 24 }}>
        <div>
          <div className="muted" style={{ fontSize: 16 }}>Total reçu par mois</div>
          <div className="mono-cond" style={{ fontSize: 34 }}>{money(revenu)}</div>
        </div>
        <div>
          <div className="muted" style={{ fontSize: 16 }}>Total payé par mois</div>
          <div className="mono-cond" style={{ fontSize: 34 }}>{money(depMens)}</div>
        </div>
        <div>
          <div className="muted" style={{ fontSize: 16 }}>Ce qui reste dans le mois</div>
          <div className="mono-cond" style={{ fontSize: 34, color: libre < 0 ? '#a4402f' : '#1d1f20' }}>{money(libre)}</div>
        </div>
      </div>
    </>
  );
};
