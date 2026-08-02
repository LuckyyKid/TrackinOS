import { useFinance } from '../FinanceContext';
import { analysePortefeuille, money, pct } from '../calc';
import { PageHeader } from '../App';
import { Bar, Card, NumInput } from '../ui';
import type { Cible, CompteInvest, Holding } from '../types';

const COULEURS = ['#1d2d3d', '#416180', '#5980a6', '#94bce3', '#d6ebff'];

const uid = (): string =>
  'h_' + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);

export const PagePortefeuille = () => {
  const { data, setData } = useFinance();

  const comptesStrategie = data.comptes.filter((c) => c.dansStrategie);
  const comptesHorsStrat = data.comptes.filter((c) => !c.dansStrategie);
  const idsPerso = new Set(comptesStrategie.map((c) => c.id));
  const idsConnus = new Set(data.comptes.map((c) => c.id));
  const holdingsHorsStrat = data.holdings.filter((h) => !idsPerso.has(h.compte));
  const holdingsPersoAComp = data.holdings.filter(
    (h) => idsPerso.has(h.compte) && !h.ticker,
  );

  const analyse = analysePortefeuille(data);

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

  const setReequilibrage = (patch: Partial<typeof data.reequilibrage>) =>
    setData((x) => ({ ...x, reequilibrage: { ...x.reequilibrage, ...patch } }));

  const setHolding = (id: string, patch: Partial<Holding>) =>
    setData((x) => ({
      ...x,
      holdings: x.holdings.map((h) => (h.id === id ? { ...h, ...patch } : h)),
    }));

  const removeHolding = (id: string) =>
    setData((x) => ({ ...x, holdings: x.holdings.filter((h) => h.id !== id) }));

  const setCompte = (id: string, patch: Partial<CompteInvest>) =>
    setData((x) => ({
      ...x,
      comptes: x.comptes.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }));

  const dupliquerLigne = (source: Holding) =>
    setData((x) => {
      const dejaComptes = x.holdings
        .filter((h) => h.ticker === source.ticker)
        .map((h) => h.compte);
      const libre = x.comptes.find((c) => !dejaComptes.includes(c.id)) ?? x.comptes[0];
      if (!libre) return x;
      return {
        ...x,
        holdings: [
          ...x.holdings,
          {
            id: uid(),
            ticker: source.ticker,
            compte: libre.id,
            actions: 0,
            prix: source.prix,
          },
        ],
      };
    });

  const ajouterActif = (compteId: string, ticker = '') => {
    if (!compteId) return;
    setData((x) => ({
      ...x,
      holdings: [
        ...x.holdings,
        { id: uid(), ticker, compte: compteId, actions: 0, prix: 0 },
      ],
    }));
  };

  const setCible = (index: number, patch: Partial<Cible>) =>
    setData((x) => ({
      ...x,
      cibles: x.cibles.map((c, i) => (i === index ? { ...c, ...patch } : c)),
    }));

  const removeCible = (index: number) =>
    setData((x) => ({ ...x, cibles: x.cibles.filter((_, i) => i !== index) }));

  const addCible = () =>
    setData((x) => ({ ...x, cibles: [...x.cibles, { ticker: '', part: 0 }] }));

  const cibleTotal = data.cibles.reduce((s, c) => s + c.part, 0);
  const cibleValide = data.cibles.length > 0 && Math.abs(cibleTotal - 1) < 0.0005;
  const cibleTrop = cibleTotal > 1.0005;
  const cibleMoins = !cibleValide && !cibleTrop && data.cibles.length > 0;
  const couleurTotal = cibleValide ? '#2b6a3d' : '#a4402f';

  const nomCompte = (id: string): string =>
    data.comptes.find((c) => c.id === id)?.nom ?? id ?? '—';

  if (data.comptes.length === 0) {
    return (
      <>
        <PageHeader
          section="Équilibre"
          title="Mon portefeuille"
          help="Une fois que tu auras créé au moins un compte de placement, tu pourras définir ta stratégie et suivre tes actifs ici."
        />
        <Card>
          <div className="pretty" style={{ fontSize: 17 }}>
            Va dans <strong>Mes placements</strong> pour créer ton premier compte.
          </div>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader
        section="Équilibre"
        title="Mon portefeuille"
        help="Saisis la quantité et le prix actuel de chaque actif. La valeur se calcule toute seule. On te dit ensuite quoi acheter à ta prochaine paie pour revenir à ta cible."
      />

      <Card plus="tl" style={{ padding: 26, marginBottom: 24 }}>
        <div className="row between center gap-10" style={{ flexWrap: 'wrap' }}>
          <div>
            <div className="section-label">Ma stratégie de répartition</div>
            <p className="pretty mt-6" style={{ fontSize: 16, color: '#424244', maxWidth: 720 }}>
              Décide quel % de ton portefeuille personnel tu veux dans chaque ticker. Seuls les comptes marqués « dans la stratégie » entrent dans ce calcul.
            </p>
          </div>
          <button className="btn btn--primary" onClick={addCible}>+ Ajouter un ticker cible</button>
        </div>

        <div className="stack mt-14 gap-10">
          {data.cibles.map((c, i) => (
            <div key={i} className="row center gap-10" style={{ flexWrap: 'wrap' }}>
              <input
                className="field__input"
                placeholder="TICKER"
                value={c.ticker}
                onChange={(e) => setCible(i, { ticker: e.target.value.toUpperCase() })}
                style={{
                  flex: '1 1 140px',
                  minWidth: 0,
                  maxWidth: 200,
                  fontFamily: "'Barlow Condensed'",
                  fontWeight: 700,
                  fontSize: 22,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}
              />
              <NumInput
                className="field__input"
                style={{ width: '100%', maxWidth: 110, flex: '0 1 110px', fontSize: 20 }}
                value={c.part * 100}
                onChange={(n) => setCible(i, { part: n / 100 })}
              />
              <span className="cd blue" style={{ fontWeight: 700, fontSize: 22 }}>%</span>
              <button className="btn" onClick={() => removeCible(i)}>Supprimer</button>
            </div>
          ))}
        </div>

        {data.cibles.length > 0 && (
          <div className="row between center gap-10 mt-16" style={{ borderTop: '2px solid #1d1f20', paddingTop: 14, flexWrap: 'wrap' }}>
            <div className="cd" style={{ fontWeight: 700, fontSize: 22, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Total : <span style={{ color: couleurTotal }}>{(cibleTotal * 100).toFixed(1)} %</span>
            </div>
            {cibleTrop && (
              <div style={{ color: couleurTotal, fontSize: 15 }}>
                Tu dépasses 100 %. Réduis une ou plusieurs cibles.
              </div>
            )}
            {cibleMoins && (
              <div style={{ color: couleurTotal, fontSize: 15 }}>
                Il manque {(100 - cibleTotal * 100).toFixed(1)} % pour arriver à 100 %.
              </div>
            )}
            {cibleValide && (
              <div style={{ color: couleurTotal, fontSize: 15 }}>Bien réparti sur 100 %.</div>
            )}
          </div>
        )}
      </Card>

      <div className="grid grid-auto-290 gap-20">
        <Card plus="tl" style={{ padding: 26 }}>
          <div className="section-label" style={{ width: '100%' }}>Répartition (perso)</div>
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
                <div className="muted" style={{ fontSize: 14 }}>Total perso</div>
                <div className="mono-cond" style={{ fontSize: 26 }}>{money(analyse.total)}</div>
              </div>
            </div>
            <div className="stack gap-8" style={{ width: '100%' }}>
              {analyse.positions.map((p, i) => (
                <div key={p.ticker || `_${i}`} className="row center gap-10" style={{ fontSize: 16 }}>
                  <span style={{ width: 14, height: 14, background: COULEURS[i % COULEURS.length] }} />
                  <span style={{ flex: 1 }}>{p.ticker || '—'}</span>
                  <span className="mono-cond" style={{ fontSize: 17 }}>{money(p.valeur)}</span>
                  <span style={{ fontWeight: 700, minWidth: 54, textAlign: 'right' }}>{pct(p.poids)}</span>
                </div>
              ))}
              {analyse.cash > 0 && (
                <div className="row center gap-10" style={{ fontSize: 16, borderTop: '1px dashed #cfd3d7', paddingTop: 8 }}>
                  <span style={{ width: 14, height: 14, background: '#e7e7ea' }} />
                  <span style={{ flex: 1 }} className="muted">Cash à investir</span>
                  <span className="mono-cond" style={{ fontSize: 17 }}>{money(analyse.cash)}</span>
                </div>
              )}
            </div>
          </div>
        </Card>

        <div style={{ border: '1px solid #cfd3d7', padding: 'clamp(16px, 4vw, 26px)' }}>
          <div className="row between center gap-10" style={{ flexWrap: 'wrap' }}>
            <div className="section-label">Mes actifs (perso)</div>
            <button
              className="btn btn--primary"
              onClick={() => ajouterActif(comptesStrategie[0]?.id ?? data.comptes[0]?.id ?? '')}
              disabled={comptesStrategie.length === 0}
            >+ Ajouter un actif</button>
          </div>
          {comptesStrategie.length === 0 && (
            <div className="subtle mt-8" style={{ fontSize: 14 }}>
              Aucun compte n'est marqué « dans la stratégie ». Coche cette case sur au moins un compte pour ajouter des actifs ici.
            </div>
          )}
          <div className="stack mt-14">
            {analyse.positions.map((p) => {
              const consigne = p.achat > 5 ? `Mets ${money(p.achat)} ici` : 'N\u2019ajoute rien';
              const couleur = p.aCorriger ? '#a4402f' : '#416180';
              const deriveTxt = p.cible === 0
                ? 'Aucune cible définie'
                : p.aCorriger
                  ? `${p.derive >= 0 ? 'Trop gros' : 'Trop petit'} de ${pct(Math.abs(p.derive))} — à corriger`
                  : `Écart ${pct(p.derive, 1)} — dans la tolérance`;
              return (
                <div key={p.ticker || `_orphan_${p.lignes[0]?.id}`} className="stack gap-10" style={{ borderTop: '1px solid #e7e7ea', padding: '16px 0' }}>
                  <div className="row between center gap-14" style={{ flexWrap: 'wrap' }}>
                    <div className="cd" style={{ fontWeight: 700, fontSize: 26, letterSpacing: '0.04em' }}>{p.ticker || '—'}</div>
                    <div className="mono-cond" style={{ fontSize: 22 }}>{money(p.valeur)}</div>
                  </div>
                  <div>
                    <Bar value={p.poids} height={12} marks={p.cible > 0 ? [{ at: p.cible, color: '#1d1f20', big: false }] : []} />
                    <div className="subtle mt-6" style={{ fontSize: 14 }}>
                      {pct(p.poids)}{p.cible > 0 ? ` · cible ${pct(p.cible)}` : ''}
                    </div>
                  </div>
                  <div className="row between center gap-10" style={{ flexWrap: 'wrap' }}>
                    <div className="muted" style={{ fontSize: 15 }}>{deriveTxt}</div>
                    <div style={{ fontWeight: 700, fontSize: 20, color: couleur }}>{consigne}</div>
                  </div>

                  <div className="stack gap-8 mt-6">
                    {p.lignes.map((h) => (
                      <div key={h.id} className="grid gap-8" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', alignItems: 'end' }}>
                        <label className="field">
                          <span className="field__label">Compte</span>
                          <select
                            className="field__input"
                            style={{ fontSize: 18 }}
                            value={h.compte}
                            onChange={(e) => setHolding(h.id, { compte: e.target.value })}
                          >
                            {data.comptes.map((c) => (
                              <option key={c.id} value={c.id}>{c.nom}</option>
                            ))}
                          </select>
                        </label>
                        <label className="field">
                          <span className="field__label">Quantité</span>
                          <NumInput className="field__input" style={{ fontSize: 20 }} value={h.actions}
                            onChange={(n) => setHolding(h.id, { actions: n })} />
                        </label>
                        <label className="field">
                          <span className="field__label">Prix ($)</span>
                          <NumInput className="field__input" style={{ fontSize: 20 }} value={h.prix}
                            onChange={(n) => setHolding(h.id, { prix: n })} />
                        </label>
                        <div className="row gap-6" style={{ paddingBottom: 6 }}>
                          <div className="mono-cond" style={{ fontSize: 18, flex: 1, textAlign: 'right' }}>
                            {money(h.actions * h.prix)}
                          </div>
                          <button className="btn" onClick={() => removeHolding(h.id)}>×</button>
                        </div>
                      </div>
                    ))}
                    {p.lignes.length > 0 && (
                      <div>
                        <button className="btn" onClick={() => dupliquerLigne(p.lignes[0])}>+ Dans un autre compte</button>
                      </div>
                    )}
                    {p.lignes.length === 0 && p.ticker && (
                      <div className="row between center gap-10" style={{ flexWrap: 'wrap' }}>
                        <div className="subtle" style={{ fontSize: 14 }}>
                          Aucune ligne pour ce ticker.
                        </div>
                        <button
                          className="btn btn--primary"
                          onClick={() => ajouterActif(comptesStrategie[0]?.id ?? '', p.ticker)}
                          disabled={comptesStrategie.length === 0}
                        >
                          + Ajouter une ligne pour {p.ticker}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {holdingsPersoAComp.length > 0 && (
            <div className="stack mt-14 gap-10" style={{ borderTop: '1px dashed #cfd3d7', paddingTop: 14 }}>
              <div className="row between center gap-10" style={{ flexWrap: 'wrap' }}>
                <div className="section-label" style={{ margin: 0 }}>À compléter</div>
                <div className="subtle" style={{ fontSize: 13 }}>Renseigne le ticker pour qu'il rejoigne sa ligne.</div>
              </div>
              {holdingsPersoAComp.map((h) => (
                <div key={h.id} className="grid gap-8" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', alignItems: 'end' }}>
                  <label className="field">
                    <span className="field__label">Ticker</span>
                    <input
                      className="field__input"
                      style={{ fontFamily: "'Barlow Condensed'", fontWeight: 700, fontSize: 20, letterSpacing: '0.04em', textTransform: 'uppercase' }}
                      placeholder="TICKER"
                      value={h.ticker}
                      onChange={(e) => setHolding(h.id, { ticker: e.target.value.toUpperCase() })}
                    />
                  </label>
                  <label className="field">
                    <span className="field__label">Compte</span>
                    <select
                      className="field__input"
                      style={{ fontSize: 18 }}
                      value={h.compte}
                      onChange={(e) => setHolding(h.id, { compte: e.target.value })}
                    >
                      {data.comptes.map((c) => (
                        <option key={c.id} value={c.id}>{c.nom}</option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span className="field__label">Quantité</span>
                    <NumInput className="field__input" style={{ fontSize: 20 }} value={h.actions}
                      onChange={(n) => setHolding(h.id, { actions: n })} />
                  </label>
                  <label className="field">
                    <span className="field__label">Prix ($)</span>
                    <NumInput className="field__input" style={{ fontSize: 20 }} value={h.prix}
                      onChange={(n) => setHolding(h.id, { prix: n })} />
                  </label>
                  <div className="row gap-6" style={{ paddingBottom: 6 }}>
                    <div className="mono-cond" style={{ fontSize: 18, flex: 1, textAlign: 'right' }}>
                      {money(h.actions * h.prix)}
                    </div>
                    <button className="btn" onClick={() => removeHolding(h.id)}>×</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="grid mt-16" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 18, borderTop: '2px solid #1d1f20', paddingTop: 16 }}>
            <label className="field">
              <span className="field__label">Je corrige si l'écart dépasse (%)</span>
              <NumInput className="field__input" style={{ width: '100%', maxWidth: 110, fontSize: 20 }} value={data.reequilibrage.tolerance}
                onChange={(n) => setReequilibrage({ tolerance: n })} />
            </label>
            <label className="field">
              <span className="field__label">Je corrige sur (mois)</span>
              <NumInput className="field__input" style={{ width: '100%', maxWidth: 110, fontSize: 20 }} integer value={data.reequilibrage.horizon}
                onChange={(n) => setReequilibrage({ horizon: n })} />
            </label>
            <div>
              <div className="muted" style={{ fontSize: 16 }}>Argent à répartir à la prochaine paie</div>
              <div className="mono-cond" style={{ fontSize: 30 }}>{money(analyse.aDistribuer)}</div>
              {analyse.cash > 0 && (
                <div className="subtle mt-6" style={{ fontSize: 13 }}>
                  {money(analyse.cash)} déjà en cash + {money(analyse.prochaineContribution)} à la prochaine paie
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {comptesStrategie.length > 0 && (
        <Card className="card--pad-md" plus="br" style={{ marginTop: 24 }}>
          <div className="section-label">Cash disponible dans mes comptes (perso)</div>
          <p className="pretty mt-6" style={{ fontSize: 15, color: '#424244', maxWidth: 720 }}>
            Ce que tu as en cash non investi dans chaque compte. Ça permet à la réconciliation avec « Mes placements » de tomber juste (holdings + cash = valeur saisie) et de savoir combien il te reste à placer avant la prochaine paie.
          </p>
          <div className="grid grid-auto-220 gap-14 mt-14">
            {comptesStrategie.map((c) => {
              const holdingsDuCompte = data.holdings.filter((h) => h.compte === c.id);
              const valeurCalculee = holdingsDuCompte.reduce((s, h) => s + h.actions * h.prix, 0);
              return (
                <div key={c.id} style={{ borderTop: '1px solid #e7e7ea', paddingTop: 12 }}>
                  <div className="cd" style={{ fontWeight: 700, fontSize: 18, letterSpacing: '0.03em' }}>{c.nom}</div>
                  <div className="subtle" style={{ fontSize: 13 }}>Actifs : {money(valeurCalculee)}</div>
                  <label className="field mt-8">
                    <span className="field__label">Cash ($)</span>
                    <NumInput className="field__input" style={{ fontSize: 20 }} value={c.cash}
                      onChange={(n) => setCompte(c.id, { cash: n })} />
                  </label>
                  <div className="mono-cond mt-6" style={{ fontSize: 16 }}>
                    Total compte : {money(valeurCalculee + c.cash)}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {comptesHorsStrat.length > 0 && (
        <Card className="card--pad-md" plus="br" style={{ marginTop: 24 }}>
          <div className="section-label">Comptes hors stratégie</div>
          <p className="pretty mt-6" style={{ fontSize: 15, color: '#424244', maxWidth: 720 }}>
            Ces comptes ne sont pas répartis selon tes cibles perso. Ils restent comptés dans ton avoir total.
          </p>
          <div className="stack mt-14 gap-16">
            {comptesHorsStrat.map((c) => {
              const lignes = data.holdings.filter((h) => h.compte === c.id);
              const valeur = lignes.reduce((s, h) => s + h.actions * h.prix, 0) + c.cash;
              return (
                <div key={c.id} style={{ borderTop: '1px solid #e7e7ea', paddingTop: 14 }}>
                  <div className="row between center gap-14" style={{ flexWrap: 'wrap' }}>
                    <div>
                      <div className="cd" style={{ fontWeight: 700, fontSize: 24, letterSpacing: '0.03em', textTransform: 'uppercase' }}>{c.nom}</div>
                      <div className="muted" style={{ fontSize: 15 }}>{c.simple}</div>
                    </div>
                    <div className="row center gap-12" style={{ flexWrap: 'wrap' }}>
                      <div>
                        <div className="muted" style={{ fontSize: 13 }}>Valeur</div>
                        <div className="mono-cond" style={{ fontSize: 26 }}>{money(valeur)}</div>
                      </div>
                      <button className="btn" onClick={() => setCompte(c.id, { dansStrategie: true })}>
                        Inclure dans la stratégie
                      </button>
                      <button className="btn btn--primary" onClick={() => ajouterActif(c.id)}>+ Ajouter un actif</button>
                    </div>
                  </div>

                  <div className="stack mt-10 gap-8">
                    {lignes.map((h) => (
                      <div key={h.id} className="grid gap-8" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', alignItems: 'end' }}>
                        <label className="field">
                          <span className="field__label">Ticker</span>
                          <input
                            className="field__input"
                            style={{ fontFamily: "'Barlow Condensed'", fontWeight: 700, fontSize: 20, letterSpacing: '0.04em', textTransform: 'uppercase' }}
                            placeholder="TICKER"
                            value={h.ticker}
                            onChange={(e) => setHolding(h.id, { ticker: e.target.value.toUpperCase() })}
                          />
                        </label>
                        <label className="field">
                          <span className="field__label">Compte</span>
                          <select
                            className="field__input"
                            style={{ fontSize: 18 }}
                            value={h.compte}
                            onChange={(e) => setHolding(h.id, { compte: e.target.value })}
                          >
                            {data.comptes.map((cc) => (
                              <option key={cc.id} value={cc.id}>{cc.nom}</option>
                            ))}
                          </select>
                        </label>
                        <label className="field">
                          <span className="field__label">Quantité</span>
                          <NumInput className="field__input" style={{ fontSize: 20 }} value={h.actions}
                            onChange={(n) => setHolding(h.id, { actions: n })} />
                        </label>
                        <label className="field">
                          <span className="field__label">Prix ($)</span>
                          <NumInput className="field__input" style={{ fontSize: 20 }} value={h.prix}
                            onChange={(n) => setHolding(h.id, { prix: n })} />
                        </label>
                        <div className="row gap-6" style={{ paddingBottom: 6 }}>
                          <div className="mono-cond" style={{ fontSize: 18, flex: 1, textAlign: 'right' }}>
                            {money(h.actions * h.prix)}
                          </div>
                          <button className="btn" onClick={() => removeHolding(h.id)}>×</button>
                        </div>
                      </div>
                    ))}
                    <label className="field" style={{ maxWidth: 220 }}>
                      <span className="field__label">Cash ($)</span>
                      <NumInput className="field__input" style={{ fontSize: 20 }} value={c.cash}
                        onChange={(n) => setCompte(c.id, { cash: n })} />
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {holdingsHorsStrat.some((h) => !idsConnus.has(h.compte)) && (
        <Card className="card--pad-md" style={{ marginTop: 24 }}>
          <div className="section-label">Actifs non rattachés à un compte connu</div>
          <p className="pretty mt-6" style={{ fontSize: 14, color: '#a4402f' }}>
            Ces actifs pointent vers un compte qui n'existe plus. Corrige leur compte ou supprime-les.
          </p>
          <div className="stack mt-10 gap-8">
            {holdingsHorsStrat
              .filter((h) => !idsConnus.has(h.compte))
              .map((h) => (
                <div key={h.id} className="row between center gap-10" style={{ flexWrap: 'wrap' }}>
                  <span>{h.ticker || '—'} · {nomCompte(h.compte)}</span>
                  <button className="btn" onClick={() => removeHolding(h.id)}>Supprimer</button>
                </div>
              ))}
          </div>
        </Card>
      )}
    </>
  );
};
