import { useState } from 'react';
import { useFinance } from '../FinanceContext';
import { etatObjectif, money, pct, projection } from '../calc';
import { PageHeader } from '../App';
import { Card, NumInput } from '../ui';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export const PageAvenir = () => {
  const { data, setData } = useFinance();
  const [annees, setAnnees] = useState(20);
  const points = projection(data, annees);
  const dernier = points[points.length - 1];
  const investi = dernier?.investi ?? 0;
  const valeur = dernier?.valeur ?? 0;
  const gain = valeur - investi;

  const objetat = etatObjectif(data);
  const setObjectif = (patch: Partial<typeof data.objectif>) =>
    setData((x) => ({ ...x, objectif: { ...x.objectif, ...patch } }));
  const setNaissance = (v: string) =>
    setData((x) => ({ ...x, celi: { ...x.celi, naissance: v } }));

  const anneesJusquCible =
    objetat.type === 'ok' ? Math.max(1, Math.ceil(objetat.moisRestants / 12)) : 0;
  const pointsObjectif =
    objetat.type === 'ok' ? projection(data, anneesJusquCible) : [];

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

      <Card plus="tl" className="card--pad-md" style={{ marginBottom: 24 }}>
        <div className="section-label section-label--md">Mon objectif financier</div>
        <h2 className="h1 mt-8" style={{ fontSize: 'clamp(26px, 3.4vw, 38px)' }}>
          Je veux avoir {money(data.objectif.montant)} à {data.objectif.ageCible} ans
        </h2>
        <p className="pretty mt-14" style={{ maxWidth: 660 }}>
          Renseigne ton objectif et ta date de naissance. On calcule à quel âge tu y arriveras
          au rythme actuel, et ce qu'il faudrait ajuster pour tomber pile à l'âge visé.
        </p>

        <div className="grid grid-auto-260 gap-20 mt-24">
          <label className="field">
            <span className="field__label">Montant visé ($)</span>
            <NumInput
              className="field__input"
              style={{ fontSize: 22 }}
              integer
              min={0}
              value={data.objectif.montant}
              onChange={(n) => setObjectif({ montant: n })}
            />
          </label>
          <label className="field">
            <span className="field__label">Âge cible</span>
            <NumInput
              className="field__input"
              style={{ fontSize: 22 }}
              integer
              min={1}
              max={120}
              value={data.objectif.ageCible}
              onChange={(n) => setObjectif({ ageCible: n })}
            />
          </label>
          <label className="field">
            <span className="field__label">Ma date de naissance</span>
            <input
              className="field__input"
              style={{ fontSize: 22 }}
              type="date"
              value={data.celi.naissance}
              onChange={(e) => setNaissance(e.target.value)}
            />
          </label>
        </div>

        {objetat.type === 'pas_de_naissance' && (
          <div className="mt-24" style={{ fontSize: 17, color: '#424244' }}>
            Renseigne ta date de naissance pour lancer le calcul.
          </div>
        )}

        {objetat.type === 'age_deja_atteint' && (
          <div className="mt-24" style={{ fontSize: 17, color: '#424244' }}>
            Ton âge cible ({objetat.ageCible} ans) est déjà passé — tu en as {objetat.ageActuel}.
            Choisis un âge plus grand pour projeter.
          </div>
        )}

        {objetat.type === 'ok' && (
          <>
            <div className="grid grid-auto-260 gap-20 mt-24">
              <div>
                <div className="section-label">Au rythme actuel</div>
                <div className="mono-cond mt-8" style={{ fontSize: 44, color: '#416180' }}>
                  {objetat.ageAtteinte === null ? '—' : `${objetat.ageAtteinte} ans`}
                </div>
                <div className="subtle" style={{ fontSize: 15 }}>
                  {objetat.ageAtteinte === null
                    ? 'Objectif hors de portée avant 100 ans avec ce rythme.'
                    : `Vers ${objetat.anneeAtteinte}, avec ${money(objetat.contribMensuelle)} / mois à ${pct(objetat.rendementAnnuel / 100)} de rendement.`}
                </div>
              </div>
              <div>
                <div className="section-label">Valeur projetée à {objetat.ageCible} ans</div>
                <div className="mono-cond mt-8" style={{ fontSize: 44, color: '#416180' }}>
                  {money(objetat.valeurALAgeCible)}
                </div>
                <div className="subtle" style={{ fontSize: 15 }}>
                  {objetat.manquePourAgeCible > 0
                    ? `Il manquerait ${money(objetat.manquePourAgeCible)} pour atteindre ${money(data.objectif.montant)}.`
                    : `Tu dépasserais l'objectif de ${money(objetat.valeurALAgeCible - data.objectif.montant)}.`}
                </div>
              </div>
              <div>
                <div className="section-label">Temps restant</div>
                <div className="mono-cond mt-8" style={{ fontSize: 44, color: '#416180' }}>
                  {Math.floor(objetat.moisRestants / 12)} ans {objetat.moisRestants % 12} mois
                </div>
                <div className="subtle" style={{ fontSize: 15 }}>
                  Tu as {objetat.ageActuel} ans aujourd'hui.
                </div>
              </div>
            </div>

            {objetat.manquePourAgeCible > 0 ? (
              <>
                <div className="section-label mt-24">Pour atteindre l'objectif à {objetat.ageCible} ans</div>
                <div className="grid grid-auto-260 gap-20 mt-14">
                  <Card className="card--pad-sm" plus="none" style={{ background: '#f7f9fc' }}>
                    <div className="section-label">Option A · Cotiser plus</div>
                    <div className="mono-cond mt-8" style={{ fontSize: 40, color: '#1d2d3d' }}>
                      + {money(objetat.contribSupplementaire ?? 0)} / mois
                    </div>
                    <div className="mt-8" style={{ fontSize: 16, color: '#424244' }}>
                      En passant de {money(objetat.contribMensuelle)} à
                      {' '}<strong>{money(objetat.contribTotaleRequise ?? 0)}</strong> par mois,
                      en gardant un rendement de {pct(objetat.rendementAnnuel / 100)}.
                    </div>
                  </Card>
                  <Card className="card--pad-sm" plus="none" style={{ background: '#f7f9fc' }}>
                    <div className="section-label">Option B · Chercher plus de rendement</div>
                    <div className="mono-cond mt-8" style={{ fontSize: 40, color: '#1d2d3d' }}>
                      {objetat.rendementAnnuelRequis === null
                        ? '— %'
                        : `${objetat.rendementAnnuelRequis.toFixed(1)} % / an`}
                    </div>
                    <div className="mt-8" style={{ fontSize: 16, color: '#424244' }}>
                      {objetat.rendementAnnuelRequis === null
                        ? 'Aucun rendement raisonnable ne suffit avec cette contribution.'
                        : `En gardant ${money(objetat.contribMensuelle)} / mois, il faut trouver un véhicule qui rapporte ce taux (contre ${pct(objetat.rendementAnnuel / 100)} aujourd'hui).`}
                    </div>
                  </Card>
                </div>
                <p className="pretty mt-14" style={{ maxWidth: 720, fontSize: 16, color: '#424244' }}>
                  Deux leviers, à toi de choisir la combinaison — ou un mix des deux. À toi ensuite de
                  trouver le véhicule (compte, produit, stratégie) qui rend ça possible.
                </p>
              </>
            ) : (
              <div
                className="mt-24"
                style={{ fontSize: 18, color: '#1d2d3d', border: '1px solid #cfd3d7', padding: 18, background: '#f2f7ff' }}
              >
                Bonne nouvelle : au rythme actuel, tu atteindrais {money(data.objectif.montant)}
                {objetat.ageAtteinte !== null && ` vers ${objetat.ageAtteinte} ans`}
                {' '}— avant tes {objetat.ageCible} ans.
              </div>
            )}

            <div style={{ height: 260, marginTop: 26 }}>
              <ResponsiveContainer>
                <AreaChart
                  data={pointsObjectif}
                  margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="g-obj" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#5980a6" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#5980a6" stopOpacity={0.15} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#e7e7ea" vertical={false} />
                  <XAxis
                    dataKey="annee"
                    stroke="#7a7a7d"
                    tickFormatter={(v) => `${objetat.ageActuel + v} ans`}
                  />
                  <YAxis stroke="#7a7a7d" tickFormatter={(v) => `${Math.round(v / 1000)} k$`} width={60} />
                  <Tooltip
                    formatter={(v: number) => money(v)}
                    labelFormatter={(v) => `${objetat.ageActuel + (v as number)} ans`}
                    contentStyle={{ background: '#fff', border: '1px solid #cfd3d7', borderRadius: 0 }}
                  />
                  <ReferenceLine
                    y={data.objectif.montant}
                    stroke="#a4402f"
                    strokeDasharray="4 4"
                    label={{
                      value: `Objectif ${money(data.objectif.montant)}`,
                      position: 'insideTopRight',
                      fill: '#a4402f',
                      fontSize: 13,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="valeur"
                    stroke="#5980a6"
                    fill="url(#g-obj)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </Card>
    </>
  );
};
