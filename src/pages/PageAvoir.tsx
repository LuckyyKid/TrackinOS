import { useFinance } from '../FinanceContext';
import { avoirTotal, money, pct } from '../calc';
import { PageHeader } from '../App';
import { Bar, Card } from '../ui';

export const PageAvoir = () => {
  const { data } = useFinance();
  const { total, parts } = avoirTotal(data);

  const conic =
    total > 0
      ? parts
          .map((p, i) => {
            const cumul = parts.slice(0, i + 1).reduce((s, x) => s + x.poids, 0);
            return `${p.couleur} 0 ${(cumul * 360).toFixed(2)}deg`;
          })
          .join(', ')
      : '#e7e7ea 0 360deg';

  return (
    <>
      <PageHeader
        section="Vue d'ensemble"
        title="Mon avoir total"
        help="Tout ce que tu possèdes, en un seul endroit — CELIAPP, CELI, portefeuille enfant, crypto et fond d'urgence."
      />

      {total === 0 ? (
        <Card style={{ marginBottom: 24 }}>
          <div className="pretty" style={{ fontSize: 17 }}>
            Rien à afficher pour l'instant. Ajoute des actifs dans « Portefeuille » ou une valeur dans « Placements » et « Coussin ».
          </div>
        </Card>
      ) : (
        <>
          <Card className="card--pad-md" plus="tl" style={{ marginBottom: 24 }}>
            <div className="section-label section-label--md">Valeur totale</div>
            <div className="figure figure--xl mt-8">{money(total)}</div>
            <p className="help pretty">Somme de tous tes comptes et de ton coussin. La valeur des placements suit la quantité × prix que tu as saisis.</p>
          </Card>

          <div className="grid grid-auto-290 gap-20" style={{ marginBottom: 24 }}>
            <Card plus="tl" style={{ padding: 26 }}>
              <div className="section-label">Répartition en %</div>
              <div className="stack center gap-14 mt-14">
                <div
                  style={{
                    width: 'min(260px, 70vw)',
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
              </div>
            </Card>

            <Card plus="br" style={{ padding: 26 }}>
              <div className="section-label">Détail par compte</div>
              <div className="stack mt-14">
                {parts.map((p) => (
                  <div key={p.cle} style={{ borderTop: '1px solid #e7e7ea', padding: '14px 0' }}>
                    <div className="row between center gap-10">
                      <div className="row center gap-10" style={{ fontSize: 17 }}>
                        <span style={{ width: 14, height: 14, background: p.couleur }} />
                        <span style={{ fontWeight: 600 }}>{p.nom}</span>
                      </div>
                      <div className="mono-cond" style={{ fontSize: 22 }}>{money(p.valeur)}</div>
                    </div>
                    <div className="mt-8"><Bar value={p.poids} color={p.couleur} height={14} /></div>
                    <div className="subtle mt-6" style={{ fontSize: 14 }}>{pct(p.poids)} de ton avoir</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </>
      )}
    </>
  );
};
