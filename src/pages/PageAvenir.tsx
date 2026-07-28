import { useState } from 'react';
import { useFinance } from '../FinanceContext';
import { money, projection } from '../calc';
import { PageHeader } from '../App';
import { Card } from '../ui';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export const PageAvenir = () => {
  const { data } = useFinance();
  const [annees, setAnnees] = useState(20);
  const points = projection(data, annees);
  const dernier = points[points.length - 1];
  const investi = dernier?.investi ?? 0;
  const valeur = dernier?.valeur ?? 0;
  const gain = valeur - investi;

  return (
    <>
      <PageHeader
        section="Projection"
        title="Mon avenir"
        help="Si tu continues exactement comme aujourd'hui, voici ce que tes placements pourraient valoir. Ce n'est pas une garantie, c'est une estimation."
      />

      <Card className="card--pad-md" style={{ marginBottom: 24 }}>
        <div className="section-label section-label--md">Dans {annees} {annees === 1 ? 'an' : 'ans'}, tu pourrais avoir</div>
        <div className="figure figure--xl mt-8">{money(valeur)}</div>
        <p className="pretty mt-14" style={{ maxWidth: 660 }}>
          Tu aurais déposé <strong>{money(investi)}</strong> de ta poche. Le reste, <strong>{money(gain)}</strong>, serait gagné par tes placements.
        </p>

        <div className="row between mt-24 muted" style={{ fontSize: 16 }}>
          <span>1 an</span>
          <span>Fais glisser pour changer</span>
          <span>40 ans</span>
        </div>
        <input type="range" min={1} max={40} step={1} value={annees}
          onChange={(e) => setAnnees(Number(e.target.value))}
          style={{ width: '100%', marginTop: 10 }}
        />

        <div style={{ height: 260, marginTop: 26 }}>
          <ResponsiveContainer>
            <AreaChart data={points} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="g-valeur" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#5980a6" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#5980a6" stopOpacity={0.15} />
                </linearGradient>
                <linearGradient id="g-inv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#b5d9fd" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#b5d9fd" stopOpacity={0.15} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#e7e7ea" vertical={false} />
              <XAxis dataKey="annee" stroke="#7a7a7d" tickFormatter={(v) => `${v} an${v > 1 ? 's' : ''}`} />
              <YAxis stroke="#7a7a7d" tickFormatter={(v) => `${Math.round(v / 1000)} k$`} width={60} />
              <Tooltip
                formatter={(v: number) => money(v)}
                labelFormatter={(v) => `${v} an${(v as number) > 1 ? 's' : ''}`}
                contentStyle={{ background: '#fff', border: '1px solid #cfd3d7', borderRadius: 0 }}
              />
              <Area type="monotone" dataKey="valeur" stroke="#5980a6" fill="url(#g-valeur)" strokeWidth={2} />
              <Area type="monotone" dataKey="investi" stroke="#416180" fill="url(#g-inv)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="row gap-20 mt-14" style={{ flexWrap: 'wrap', fontSize: 16 }}>
          <div className="row center gap-8"><span style={{ width: 14, height: 14, background: '#b5d9fd' }} /> Ce que tu déposes</div>
          <div className="row center gap-8"><span style={{ width: 14, height: 14, background: '#5980a6' }} /> Valeur totale avec les gains</div>
        </div>
      </Card>
    </>
  );
};
