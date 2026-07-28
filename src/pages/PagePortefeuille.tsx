import { useFinance } from '../FinanceContext';
import { analysePortefeuille, money, pct } from '../calc';
import { PageHeader } from '../App';
import { Bar, Card } from '../ui';

const COULEURS = ['#1d2d3d', '#416180', '#5980a6', '#94bce3', '#d6ebff'];

export const PagePortefeuille = () => {
  const { data, setData } = useFinance();
  const { positions, total, prochaineContribution } = analysePortefeuille(data);

  const conic = positions
    .map((p, i) => `${COULEURS[i % COULEURS.length]} 0 ${(positions.slice(0, i + 1).reduce((s, x) => s + x.poids, 0) * 360).toFixed(2)}deg`)
    .join(', ');

  const set = (patch: Partial<typeof data.reequilibrage>) =>
    setData((x) => ({ ...x, reequilibrage: { ...x.reequilibrage, ...patch } }));

  return (
    <>
      <PageHeader
        section="Équilibre"
        title="Mon portefeuille"
        help="Tu as choisi une recette : tant de pourcentage dans chaque placement. Avec le temps les prix bougent et la recette se déforme. On te dit quoi acheter à ta prochaine paie pour revenir à la recette."
      />

      <div className="grid grid-auto-290 gap-20">
        <Card plus="tl" style={{ padding: 26 }}>
          <div className="section-label" style={{ width: '100%' }}>Répartition actuelle</div>
          <div className="stack center gap-14 mt-14">
            <div
              style={{
                width: 'min(250px, 70vw)',
                aspectRatio: '1 / 1',
                borderRadius: '50%',
                background: `conic-gradient(${conic})`,
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div style={{
                width: '60%', height: '60%', borderRadius: '50%', background: '#f2f2f3',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              }}>
                <div className="muted" style={{ fontSize: 14 }}>Total</div>
                <div className="mono-cond" style={{ fontSize: 26 }}>{money(total)}</div>
              </div>
            </div>
            <div className="stack gap-8" style={{ width: '100%' }}>
              {positions.map((p, i) => (
                <div key={p.h.ticker} className="row center gap-10" style={{ fontSize: 16 }}>
                  <span style={{ width: 14, height: 14, background: COULEURS[i % COULEURS.length] }} />
                  <span style={{ flex: 1 }}>{p.h.ticker} · {p.h.compte}</span>
                  <span style={{ fontWeight: 700 }}>{pct(p.poids)}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <div style={{ border: '1px solid #cfd3d7', padding: 26, minWidth: 280 }}>
          <div className="section-label">Quoi faire à ta prochaine paie</div>
          <div className="stack mt-14">
            {positions.map((p) => {
              const consigne = p.achat > 5 ? `Mets ${money(p.achat)} ici` : 'N\u2019ajoute rien';
              const couleur = p.aCorriger ? '#a4402f' : '#416180';
              const deriveTxt = p.aCorriger
                ? `${p.derive >= 0 ? 'Trop gros' : 'Trop petit'} de ${pct(Math.abs(p.derive))} — à corriger`
                : `Écart ${pct(p.derive, 1)} — dans la tolérance`;
              return (
                <div key={p.h.ticker} className="row gap-14 center between" style={{ borderTop: '1px solid #e7e7ea', padding: '16px 0', flexWrap: 'wrap' }}>
                  <div style={{ minWidth: 150, flex: '1 1 170px' }}>
                    <div className="cd" style={{ fontWeight: 700, fontSize: 24, letterSpacing: '0.04em' }}>{p.h.ticker}</div>
                    <div className="muted" style={{ fontSize: 15 }}>
                      {p.h.compte} · {p.h.actions} × {money(p.h.prix)} = {money(p.valeur)}
                    </div>
                  </div>
                  <div style={{ flex: '1 1 180px', minWidth: 150 }}>
                    <Bar value={p.poids} height={12} marks={[{ at: p.h.cible, color: '#1d1f20', big: false }]} />
                    <div className="subtle mt-6" style={{ fontSize: 14 }}>{pct(p.poids)} · cible {pct(p.h.cible)}</div>
                  </div>
                  <div style={{ minWidth: 170, textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, fontSize: 21, color: couleur }}>{consigne}</div>
                    <div className="muted" style={{ fontSize: 15 }}>{deriveTxt}</div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid mt-16" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 18, borderTop: '2px solid #1d1f20', paddingTop: 16 }}>
            <label className="field">
              <span className="field__label">Je corrige si l'écart dépasse (%)</span>
              <input className="field__input" style={{ width: 110, fontSize: 20 }} inputMode="numeric" value={data.reequilibrage.tolerance}
                onChange={(e) => set({ tolerance: Number(e.target.value) || 0 })} />
            </label>
            <label className="field">
              <span className="field__label">Je corrige sur (mois)</span>
              <input className="field__input" style={{ width: 110, fontSize: 20 }} inputMode="numeric" value={data.reequilibrage.horizon}
                onChange={(e) => set({ horizon: Number(e.target.value) || 0 })} />
            </label>
            <div>
              <div className="muted" style={{ fontSize: 16 }}>Argent à répartir à la prochaine paie</div>
              <div className="mono-cond" style={{ fontSize: 30 }}>{money(prochaineContribution)}</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
