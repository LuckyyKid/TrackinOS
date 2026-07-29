import { useFinance } from '../FinanceContext';
import { money, projectionCoussin, soldesCycles } from '../calc';
import { PageHeader } from '../App';
import { Bar, Card, NumInput } from '../ui';

export const PageCoussin = () => {
  const { data, setData } = useFinance();
  const soldes = soldesCycles(data);
  const proj = projectionCoussin(data);
  const sousMin = proj < data.coussin.minimum;

  const barVal = data.coussin.actuel / Math.max(1, data.coussin.objectif);
  const minPos = data.coussin.minimum / Math.max(1, data.coussin.objectif);

  const set = (patch: Partial<typeof data.coussin>) =>
    setData((x) => ({ ...x, coussin: { ...x.coussin, ...patch } }));

  return (
    <>
      <PageHeader
        section="Sécurité"
        title="Mon coussin"
        help="C'est l'argent que tu gardes de côté pour les imprévus : le frigo qui brise, les pneus, une semaine sans travail. On ne l'investit pas."
      />

      <Card className="card--pad-md" style={{ marginBottom: 24 }}>
        <div className="section-label section-label--md">Tu as de côté</div>
        <div className="figure figure--lg mt-8">{money(data.coussin.actuel)}</div>
        <div className="mt-24">
          <Bar value={barVal} height={28} marks={[{ at: minPos }]} />
        </div>
        <div className="row between mt-8 muted" style={{ fontSize: 15 }}>
          <span>0 $</span>
          <span>Objectif : {money(data.coussin.objectif)}</span>
        </div>
        <div className="mt-6" style={{ fontSize: 16, color: '#a4402f' }}>
          La ligne rouge est ton minimum : {money(data.coussin.minimum)}
        </div>
      </Card>

      <div className="grid grid-auto-300 gap-20">
        <div style={{ border: '1px solid #cfd3d7', padding: 24 }}>
          <div className="section-label">Modifier</div>
          <div className="stack gap-14 mt-14">
            <label className="field">
              <span className="field__label">Argent de côté aujourd'hui ($)</span>
              <NumInput className="field__input field__input--num" value={data.coussin.actuel}
                onChange={(n) => set({ actuel: n })} />
            </label>
            <label className="field">
              <span className="field__label">Mon objectif ($)</span>
              <NumInput className="field__input field__input--num" value={data.coussin.objectif}
                onChange={(n) => set({ objectif: n })} />
            </label>
            <label className="field">
              <span className="field__label">Ne jamais descendre sous ($)</span>
              <NumInput className="field__input field__input--num" value={data.coussin.minimum}
                onChange={(n) => set({ minimum: n })} />
            </label>
          </div>
        </div>

        <div style={{ border: '1px solid #cfd3d7', padding: 24 }} className="stack gap-12">
          <div className="section-label">Dans deux paies</div>
          <p className="pretty" style={{ fontSize: 17, color: '#424244' }}>
            Si tu ne changes rien, ton coussin va ressembler à ceci après tes deux prochaines paies :
          </p>
          <div className="stack gap-8 mt-4">
            <div className="row-item"><span>Coussin aujourd'hui</span><span>{money(data.coussin.actuel)}</span></div>
            <div className="row-item"><span>Reste de la {data.cycles[0].label}</span><span>{money(soldes.cycle1) === '$0' ? '$0' : (soldes.cycle1 >= 0 ? '+ ' : '') + money(soldes.cycle1)}</span></div>
            <div className="row-item"><span>Reste de la {data.cycles[1].label}</span><span>{soldes.cycle2 >= 0 ? '+ ' : ''}{money(soldes.cycle2)}</span></div>
          </div>
          <div style={{
            background: sousMin ? '#fbf1ee' : '#eef6ff',
            border: `1px solid ${sousMin ? '#e2705c' : '#b5d9fd'}`,
            padding: 18,
            marginTop: 8,
          }}>
            <div className="blue" style={{ fontSize: 16 }}>Total dans deux paies</div>
            <div className="mono-cond" style={{ fontSize: 46, lineHeight: 1.05, color: sousMin ? '#a4402f' : '#1d1f20' }}>
              {money(proj)}
            </div>
            <div className="mt-4" style={{ fontSize: 16 }}>
              {sousMin
                ? `Ça passe sous ton minimum de ${money(data.coussin.minimum)}. Enlève une dépense ou repousse-la.`
                : proj >= data.coussin.objectif
                  ? 'Objectif atteint. Bravo.'
                  : `Il te manque ${money(data.coussin.objectif - proj)} pour atteindre ton objectif.`}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
