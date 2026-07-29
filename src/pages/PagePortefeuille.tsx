import { useFinance } from '../FinanceContext';
import { analysePortefeuille, money, pct } from '../calc';
import { PageHeader } from '../App';
import { Bar, Card, NumInput } from '../ui';
import type { Holding } from '../types';
import { COMPTES_HOLDING } from '../types';

const COULEURS = ['#1d2d3d', '#416180', '#5980a6', '#94bce3', '#d6ebff'];
const COMPTE_ENFANT = 'CELI enfant';

const estEnfant = (h: Holding) => h.compte === COMPTE_ENFANT;

const uid = (): string =>
  'h_' + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);

export const PagePortefeuille = () => {
  const { data, setData } = useFinance();

  const holdingsAdulte = data.holdings.filter((h) => !estEnfant(h));
  const holdingsEnfant = data.holdings.filter(estEnfant);

  const analyse = analysePortefeuille({ ...data, holdings: holdingsAdulte });

  const conic =
    analyse.positions.length > 0 && analyse.total > 0
      ? analyse.positions
          .map(
            (p, i) =>
              `${COULEURS[i % COULEURS.length]} 0 ${(
                analyse.positions.slice(0, i + 1).reduce((s, x) => s + x.poids, 0) * 360
              ).toFixed(2)}deg`,
          )
          .join(', ')
      : '#e7e7ea 0 360deg';

  const totalEnfant = holdingsEnfant.reduce((s, h) => s + h.actions * h.prix, 0);

  const setReequilibrage = (patch: Partial<typeof data.reequilibrage>) =>
    setData((x) => ({ ...x, reequilibrage: { ...x.reequilibrage, ...patch } }));

  const setHolding = (id: string, patch: Partial<Holding>) =>
    setData((x) => ({
      ...x,
      holdings: x.holdings.map((h) => (h.id === id ? { ...h, ...patch } : h)),
    }));

  const removeHolding = (id: string) =>
    setData((x) => ({ ...x, holdings: x.holdings.filter((h) => h.id !== id) }));

  const dupliquer = (source: Holding) =>
    setData((x) => {
      const dejaComptes = x.holdings.filter((h) => h.ticker === source.ticker).map((h) => h.compte);
      const libre = COMPTES_HOLDING.find((c) => !dejaComptes.includes(c)) ?? COMPTES_HOLDING[0];
      return {
        ...x,
        holdings: [
          ...x.holdings,
          {
            id: uid(),
            ticker: source.ticker,
            compte: libre,
            actions: 0,
            prix: source.prix,
            cible: 0,
          },
        ],
      };
    });

  const ajouterActif = (enfant: boolean) =>
    setData((x) => ({
      ...x,
      holdings: [
        ...x.holdings,
        {
          id: uid(),
          ticker: '',
          compte: enfant ? COMPTE_ENFANT : 'CELI',
          actions: 0,
          prix: 0,
          cible: 0,
        },
      ],
    }));

  return (
    <>
      <PageHeader
        section="Équilibre"
        title="Mon portefeuille"
        help="Saisis la quantité et le prix actuel de chaque actif. La valeur se calcule toute seule. On te dit ensuite quoi acheter à ta prochaine paie pour revenir à ta cible."
      />

      <div className="grid grid-auto-290 gap-20">
        <Card plus="tl" style={{ padding: 26 }}>
          <div className="section-label" style={{ width: '100%' }}>Répartition (adulte)</div>
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
                <div className="muted" style={{ fontSize: 14 }}>Total adulte</div>
                <div className="mono-cond" style={{ fontSize: 26 }}>{money(analyse.total)}</div>
              </div>
            </div>
            <div className="stack gap-8" style={{ width: '100%' }}>
              {analyse.positions.map((p, i) => (
                <div key={p.h.id} className="row center gap-10" style={{ fontSize: 16 }}>
                  <span style={{ width: 14, height: 14, background: COULEURS[i % COULEURS.length] }} />
                  <span style={{ flex: 1 }}>{p.h.ticker || '—'} · {p.h.compte}</span>
                  <span className="mono-cond" style={{ fontSize: 17 }}>{money(p.valeur)}</span>
                  <span style={{ fontWeight: 700, minWidth: 54, textAlign: 'right' }}>{pct(p.poids)}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <div style={{ border: '1px solid #cfd3d7', padding: 26, minWidth: 280 }}>
          <div className="row between center gap-10" style={{ flexWrap: 'wrap' }}>
            <div className="section-label">Mes actifs (adulte)</div>
            <button className="btn btn--primary" onClick={() => ajouterActif(false)}>+ Ajouter un actif</button>
          </div>
          <div className="stack mt-14">
            {analyse.positions.map((p) => {
              const consigne = p.achat > 5 ? `Mets ${money(p.achat)} ici` : 'N\u2019ajoute rien';
              const couleur = p.aCorriger ? '#a4402f' : '#416180';
              const deriveTxt = p.aCorriger
                ? `${p.derive >= 0 ? 'Trop gros' : 'Trop petit'} de ${pct(Math.abs(p.derive))} — à corriger`
                : `Écart ${pct(p.derive, 1)} — dans la tolérance`;
              return (
                <div key={p.h.id} className="stack gap-10" style={{ borderTop: '1px solid #e7e7ea', padding: '16px 0' }}>
                  <div className="row between center gap-14" style={{ flexWrap: 'wrap' }}>
                    <input
                      className="field__input"
                      style={{ maxWidth: 160, fontFamily: "'Barlow Condensed'", fontWeight: 700, fontSize: 24, letterSpacing: '0.04em', textTransform: 'uppercase' }}
                      placeholder="TICKER"
                      value={p.h.ticker}
                      onChange={(e) => setHolding(p.h.id, { ticker: e.target.value.toUpperCase() })}
                    />
                    <div className="mono-cond" style={{ fontSize: 22 }}>{money(p.valeur)}</div>
                  </div>
                  <div className="grid grid-auto-160 gap-10">
                    <label className="field">
                      <span className="field__label">Compte</span>
                      <select
                        className="field__input"
                        style={{ fontSize: 18 }}
                        value={p.h.compte}
                        onChange={(e) => setHolding(p.h.id, { compte: e.target.value })}
                      >
                        {COMPTES_HOLDING.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </label>
                    <label className="field">
                      <span className="field__label">Quantité</span>
                      <NumInput
                        className="field__input"
                        style={{ fontSize: 20 }}
                        value={p.h.actions}
                        onChange={(n) => setHolding(p.h.id, { actions: n })}
                      />
                    </label>
                    <label className="field">
                      <span className="field__label">Prix actuel ($)</span>
                      <NumInput
                        className="field__input"
                        style={{ fontSize: 20 }}
                        value={p.h.prix}
                        onChange={(n) => setHolding(p.h.id, { prix: n })}
                      />
                    </label>
                    <label className="field">
                      <span className="field__label">Cible (%)</span>
                      <NumInput
                        className="field__input"
                        style={{ fontSize: 20 }}
                        value={p.h.cible * 100}
                        onChange={(n) => setHolding(p.h.id, { cible: n / 100 })}
                      />
                    </label>
                  </div>
                  <div>
                    <Bar value={p.poids} height={12} marks={[{ at: p.h.cible, color: '#1d1f20', big: false }]} />
                    <div className="subtle mt-6" style={{ fontSize: 14 }}>{pct(p.poids)} · cible {pct(p.h.cible)}</div>
                  </div>
                  <div className="row between center gap-10" style={{ flexWrap: 'wrap' }}>
                    <div className="muted" style={{ fontSize: 15 }}>{deriveTxt}</div>
                    <div style={{ fontWeight: 700, fontSize: 20, color: couleur }}>{consigne}</div>
                  </div>
                  <div className="row gap-8" style={{ flexWrap: 'wrap' }}>
                    <button className="btn" onClick={() => dupliquer(p.h)}>+ Dans un autre compte</button>
                    <button className="btn" onClick={() => removeHolding(p.h.id)}>Supprimer</button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid mt-16" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 18, borderTop: '2px solid #1d1f20', paddingTop: 16 }}>
            <label className="field">
              <span className="field__label">Je corrige si l'écart dépasse (%)</span>
              <NumInput className="field__input" style={{ width: 110, fontSize: 20 }} value={data.reequilibrage.tolerance}
                onChange={(n) => setReequilibrage({ tolerance: n })} />
            </label>
            <label className="field">
              <span className="field__label">Je corrige sur (mois)</span>
              <NumInput className="field__input" style={{ width: 110, fontSize: 20 }} integer value={data.reequilibrage.horizon}
                onChange={(n) => setReequilibrage({ horizon: n })} />
            </label>
            <div>
              <div className="muted" style={{ fontSize: 16 }}>Argent à répartir à la prochaine paie</div>
              <div className="mono-cond" style={{ fontSize: 30 }}>{money(analyse.prochaineContribution)}</div>
            </div>
          </div>
        </div>
      </div>

      <Card className="card--pad-md" plus="br" style={{ marginTop: 24 }}>
        <div className="row between center gap-12" style={{ flexWrap: 'wrap' }}>
          <div>
            <div className="section-label">Portefeuille enfant</div>
            <div className="cd" style={{ fontWeight: 700, fontSize: 30, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              Compte CELI dédié · XEQT
            </div>
            <div className="muted" style={{ fontSize: 16, maxWidth: 620 }}>
              Ce compte partage la même limite CELI que ton compte principal — chaque dollar cotisé ici réduit ta place disponible dans l'autre.
            </div>
          </div>
          <div className="row center gap-12" style={{ flexWrap: 'wrap' }}>
            <div>
              <div className="muted" style={{ fontSize: 14 }}>Valeur</div>
              <div className="mono-cond" style={{ fontSize: 34 }}>{money(totalEnfant)}</div>
            </div>
            <button className="btn btn--primary" onClick={() => ajouterActif(true)}>+ Ajouter un actif</button>
          </div>
        </div>

        <div className="stack mt-14">
          {holdingsEnfant.map((h) => {
            const valeur = h.actions * h.prix;
            return (
              <div key={h.id} className="stack gap-10" style={{ borderTop: '1px solid #e7e7ea', padding: '16px 0' }}>
                <div className="row between center gap-14" style={{ flexWrap: 'wrap' }}>
                  <input
                    className="field__input"
                    style={{ maxWidth: 160, fontFamily: "'Barlow Condensed'", fontWeight: 700, fontSize: 24, letterSpacing: '0.04em', textTransform: 'uppercase' }}
                    placeholder="TICKER"
                    value={h.ticker}
                    onChange={(e) => setHolding(h.id, { ticker: e.target.value.toUpperCase() })}
                  />
                  <div className="mono-cond" style={{ fontSize: 22 }}>{money(valeur)}</div>
                </div>
                <div className="grid grid-auto-160 gap-10">
                  <label className="field">
                    <span className="field__label">Quantité</span>
                    <NumInput
                      className="field__input"
                      style={{ fontSize: 20 }}
                      value={h.actions}
                      onChange={(n) => setHolding(h.id, { actions: n })}
                    />
                  </label>
                  <label className="field">
                    <span className="field__label">Prix actuel ($)</span>
                    <NumInput
                      className="field__input"
                      style={{ fontSize: 20 }}
                      value={h.prix}
                      onChange={(n) => setHolding(h.id, { prix: n })}
                    />
                  </label>
                </div>
                <div className="row gap-8">
                  <button className="btn" onClick={() => removeHolding(h.id)}>Supprimer</button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </>
  );
};
