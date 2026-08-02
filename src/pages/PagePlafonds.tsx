import { useMemo, useState } from 'react';
import { useFinance } from '../FinanceContext';
import {
  aUnCompteType,
  celiAnneeEligible,
  celiCotisationsCumulees,
  celiCotiseCetteAnnee,
  celiDisponible,
  celiPlafondAnnuel,
  celiPlafondCumule,
  celiValeurTotale,
  celiappCotisationsCumulees,
  celiappCotiseCetteAnnee,
  celiappDisponible,
  celiappDisponibleAnnee,
  celiappPlafondAnnuel,
  celiappValeurTotale,
  comptesParType,
  money,
  projectionCompte,
  reeeConfig,
  reeeCotisationsCumulees,
  reeeCotiseCetteAnnee,
  reeeDisponible,
  reeeIqeeAnnuelle,
  reeeIqeeTotale,
  reeeSceeAnnuelle,
  reeeSceeTotale,
  reerCotisationsCumulees,
  reerCotiseCetteAnnee,
  reerDisponible,
  reerDroitsCumules,
  reerPlafondAnnuel,
  reerPlafondMaxAnnuel,
  reerValeurTotale,
  valeurCompte,
} from '../calc';
import { PageHeader } from '../App';
import { Bar, Card, NumInput } from '../ui';
import type { CeliConfig, CeliappConfig, ReeeCompteConfig, ReerConfig } from '../types';
import {
  CELI_PLAFONDS_OFFICIELS,
  REEE_IQEE_ANNUELLE_MAX,
  REEE_IQEE_VIE_MAX,
  REEE_PLAFOND_VIE,
  REEE_SCEE_ANNUELLE_MAX,
  REEE_SCEE_VIE_MAX,
} from '../types';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export const PagePlafonds = () => {
  const { data, setData } = useFinance();
  const today = new Date();
  const anneeCourante = today.getFullYear();

  const aCeli = aUnCompteType(data, 'CELI');
  const aCeliapp = aUnCompteType(data, 'CELIAPP');
  const aReer = aUnCompteType(data, 'REER');
  const comptesReee = comptesParType(data, 'REEE');
  const aReee = comptesReee.length > 0;

  const setCeli = (patch: Partial<CeliConfig>) =>
    setData((x) => ({ ...x, celi: { ...x.celi, ...patch } }));
  const setCotisation = (annee: number, montant: number) =>
    setData((x) => ({
      ...x,
      celi: { ...x.celi, cotisations: { ...x.celi.cotisations, [annee]: Math.max(0, montant) } },
    }));

  const setCeliapp = (patch: Partial<CeliappConfig>) =>
    setData((x) => ({ ...x, celiapp: { ...x.celiapp, ...patch } }));
  const setCotisationCeliapp = (annee: number, montant: number) =>
    setData((x) => ({
      ...x,
      celiapp: { ...x.celiapp, cotisations: { ...x.celiapp.cotisations, [annee]: Math.max(0, montant) } },
    }));

  const setReer = (patch: Partial<ReerConfig>) =>
    setData((x) => ({ ...x, reer: { ...x.reer, ...patch } }));
  const setRevenuReer = (annee: number, montant: number) =>
    setData((x) => ({
      ...x,
      reer: {
        ...x.reer,
        revenusAnneesPrecedentes: {
          ...x.reer.revenusAnneesPrecedentes,
          [annee]: Math.max(0, montant),
        },
      },
    }));
  const setCotisationReer = (annee: number, montant: number) =>
    setData((x) => ({
      ...x,
      reer: { ...x.reer, cotisations: { ...x.reer.cotisations, [annee]: Math.max(0, montant) } },
    }));

  // ---------- CELI ----------
  const anneeEligible = celiAnneeEligible(data.celi.naissance, today);
  const debutSaisi = data.celi.anneeDebutCotisation || anneeEligible;
  const debutEffectif = Math.max(anneeEligible, debutSaisi || anneeEligible);
  const anneesCotisation = useMemo(() => {
    if (!data.celi.naissance) return [] as number[];
    const arr: number[] = [];
    for (let y = debutEffectif; y <= anneeCourante; y++) arr.push(y);
    return arr;
  }, [data.celi.naissance, debutEffectif, anneeCourante]);

  const plafondCumule = celiPlafondCumule(data, today);
  const cotiseTotal = celiCotisationsCumulees(data, today);
  const dispo = celiDisponible(data, today);
  const cotiseAnnee = celiCotiseCetteAnnee(data, today);
  const plafondAnneeCourante = celiPlafondAnnuel(data, anneeCourante);
  const valeurCELI = celiValeurTotale(data);

  const celiPret = Boolean(data.celi.naissance);
  const barTotal = plafondCumule > 0 ? Math.min(1, cotiseTotal / plafondCumule) : 0;
  const barAnnee = plafondAnneeCourante > 0 ? Math.min(1, cotiseAnnee / plafondAnneeCourante) : 0;
  const enTrop = dispo < 0;
  const proche = dispo >= 0 && dispo < 1000;
  const couleurCeli = enTrop || proche ? '#a4402f' : '#416180';

  // ---------- CELIAPP ----------
  const plafondAppVie = data.celiapp?.plafondVie ?? 40000;
  const debutApp = data.celiapp?.anneeDebutCotisation || anneeCourante;
  const anneesCotisationApp = useMemo(() => {
    const arr: number[] = [];
    for (let y = debutApp; y <= anneeCourante; y++) arr.push(y);
    return arr;
  }, [debutApp, anneeCourante]);
  const cotiseAppTotal = celiappCotisationsCumulees(data, today);
  const cotiseAppAnnee = celiappCotiseCetteAnnee(data, today);
  const dispoApp = celiappDisponible(data, today);
  const valeurCeliapp = celiappValeurTotale(data);
  const barApp = plafondAppVie > 0 ? Math.min(1, cotiseAppTotal / plafondAppVie) : 0;
  const enTropApp = dispoApp < 0;
  const procheApp = dispoApp >= 0 && dispoApp < 1000;
  const couleurApp = enTropApp || procheApp ? '#a4402f' : '#416180';
  const plafondAppAnnee = celiappPlafondAnnuel(data, anneeCourante);
  const dispoAppAnnee = celiappDisponibleAnnee(data, today);
  const barAppAnnee = plafondAppAnnee > 0 ? Math.min(1, cotiseAppAnnee / plafondAppAnnee) : 0;
  const enTropAppAnnee = data.celiapp?.anneeDebutCotisation ? cotiseAppAnnee > plafondAppAnnee : false;

  // ---------- REER ----------
  const revenusReerAnnees = useMemo(() => {
    const anneesSaisies = Object.keys(data.reer.revenusAnneesPrecedentes ?? {}).map(Number).filter((y) => !Number.isNaN(y));
    const debut = anneesSaisies.length > 0 ? Math.min(...anneesSaisies) : anneeCourante - 1;
    const arr: number[] = [];
    for (let y = debut; y <= anneeCourante; y++) arr.push(y);
    return arr;
  }, [data.reer.revenusAnneesPrecedentes, anneeCourante]);
  const cotisationsReerAnnees = useMemo(() => {
    const anneesSaisies = Object.keys(data.reer.cotisations ?? {}).map(Number).filter((y) => !Number.isNaN(y));
    const anneesRev = Object.keys(data.reer.revenusAnneesPrecedentes ?? {}).map(Number).filter((y) => !Number.isNaN(y));
    const debut = anneesRev.length > 0 ? Math.min(...anneesRev) + 1 : anneesSaisies.length > 0 ? Math.min(...anneesSaisies) : anneeCourante;
    const arr: number[] = [];
    for (let y = debut; y <= anneeCourante; y++) arr.push(y);
    return arr;
  }, [data.reer.cotisations, data.reer.revenusAnneesPrecedentes, anneeCourante]);

  const droitsReer = reerDroitsCumules(data, today);
  const cotiseReerTotal = reerCotisationsCumulees(data, today);
  const dispoReer = reerDisponible(data, today);
  const cotiseReerAnnee = reerCotiseCetteAnnee(data, today);
  const plafondReerAnnee = reerPlafondAnnuel(data, anneeCourante);
  const valeurReer = reerValeurTotale(data);
  const barReer = droitsReer > 0 ? Math.min(1, cotiseReerTotal / droitsReer) : 0;
  const barReerAnnee = plafondReerAnnee > 0 ? Math.min(1, cotiseReerAnnee / plafondReerAnnee) : 0;
  const enTropReer = dispoReer < 0;
  const procheReer = dispoReer >= 0 && dispoReer < 1000;
  const couleurReer = enTropReer || procheReer ? '#a4402f' : '#416180';

  if (!aCeli && !aCeliapp && !aReer && !aReee) {
    return (
      <>
        <PageHeader
          section="Limites"
          title="Mes plafonds"
          help="Le gouvernement limite combien tu peux mettre dans certains comptes (CELI, CELIAPP, REER, REEE). Ajoute d'abord un compte de ce type dans « Mes placements » pour voir ses plafonds ici."
        />
        <Card>
          <div className="pretty" style={{ fontSize: 17 }}>
            Aucun compte réglementé pour l'instant. Crée un compte CELI, CELIAPP, REER ou REEE dans <strong>Mes placements</strong>.
          </div>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader
        section="Limites"
        title="Mes plafonds"
        help="Le gouvernement limite combien tu peux mettre dans ces comptes. Dépasser coûte 1 % par mois. Les plafonds sont partagés entre tous tes comptes du même type."
      />

      {aCeli && (
        <Card
          plus="tl"
          style={{ marginBottom: 24, borderColor: enTrop ? '#a4402f' : '#cfd3d7' }}
        >
          <div className="row between center gap-12" style={{ flexWrap: 'wrap' }}>
            <div>
              <div className="cd" style={{ fontWeight: 700, fontSize: 32, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                CELI (partagé)
              </div>
              <div className="muted" style={{ fontSize: 16 }}>
                Somme des droits sur tous tes comptes CELI depuis que tu as le droit de cotiser.
              </div>
            </div>
            <div className="cd" style={{ fontWeight: 700, fontSize: 30, color: couleurCeli }}>
              {!celiPret ? 'Renseigne ta date de naissance' : enTrop ? 'Plafond dépassé' : proche ? 'Presque plein' : 'Il reste de la place'}
            </div>
          </div>

          <div className="grid grid-auto-260 gap-20 mt-24">
            <label className="field">
              <span className="field__label">Ma date de naissance</span>
              <input
                className="field__input"
                style={{ fontSize: 22 }}
                type="date"
                value={data.celi.naissance}
                onChange={(e) => setCeli({ naissance: e.target.value })}
              />
            </label>
            <label className="field">
              <span className="field__label">Année où j'ai commencé à cotiser</span>
              <NumInput
                className="field__input"
                style={{ fontSize: 22 }}
                integer
                emptyIsZero
                value={data.celi.anneeDebutCotisation || 0}
                placeholder={String(anneeEligible)}
                onChange={(n) => setCeli({ anneeDebutCotisation: n })}
              />
            </label>
            <div>
              <div className="muted" style={{ fontSize: 15 }}>Éligible depuis</div>
              <div className="mono-cond" style={{ fontSize: 30 }}>{celiPret ? anneeEligible : '—'}</div>
              <div className="subtle" style={{ fontSize: 14 }}>
                {celiPret ? 'Année de tes 18 ans (min. 2009).' : 'On l\u2019utilise pour calculer ton plafond.'}
              </div>
            </div>
          </div>

          {celiPret && (
            <>
              <div className="mt-24">
                <div className="row between" style={{ fontSize: 17 }}>
                  <span>Depuis que tu as le droit de cotiser</span>
                  <span>{money(cotiseTotal)} sur {money(plafondCumule)}</span>
                </div>
                <div className="mt-8"><Bar value={barTotal} color={couleurCeli} height={26} /></div>
                <div className="mt-8" style={{ fontSize: 17, color: '#424244' }}>
                  {enTrop
                    ? `Tu dépasses de ${money(-dispo)}. Pénalité de 1 % par mois sur ce trop-plein.`
                    : `Il te reste ${money(dispo)} à cotiser à vie (partagés entre tous tes CELI).`}
                </div>
              </div>

              <div className="mt-24">
                <div className="row between" style={{ fontSize: 17 }}>
                  <span>Cette année ({anneeCourante})</span>
                  <span>{money(cotiseAnnee)} sur {money(plafondAnneeCourante)}</span>
                </div>
                <div className="mt-8"><Bar value={barAnnee} color="#5980a6" height={26} /></div>
                <div className="mt-8" style={{ fontSize: 17, color: '#424244' }}>
                  Valeur actuelle de tes CELI : <strong>{money(valeurCELI)}</strong>. La valeur inclut les gains — elle peut dépasser tes cotisations sans pénalité.
                </div>
              </div>

              <div className="mt-24">
                <div className="section-label">Ce que j'ai cotisé chaque année (tous CELI ensemble)</div>
                <div className="grid grid-auto-190 gap-14 mt-14">
                  {anneesCotisation.map((y) => (
                    <label key={y} className="field">
                      <span className="field__label">
                        {y} · plafond {money(celiPlafondAnnuel(data, y))}
                      </span>
                      <NumInput
                        className="field__input"
                        style={{ fontSize: 22 }}
                        emptyIsZero
                        min={0}
                        value={data.celi.cotisations?.[y] ?? 0}
                        placeholder="0"
                        onChange={(n) => setCotisation(y, n)}
                      />
                    </label>
                  ))}
                </div>
                <div className="subtle mt-8" style={{ fontSize: 14 }}>
                  Astuce : additionne ce que tu as mis dans TOUS tes comptes CELI cette année-là.
                </div>
              </div>

              <details className="mt-24">
                <summary className="section-label" style={{ cursor: 'pointer' }}>Modifier les plafonds officiels (si CRA change)</summary>
                <div className="grid grid-auto-160 gap-10 mt-14">
                  {Array.from({ length: anneeCourante - 2008 }, (_, i) => 2009 + i).map((y) => (
                    <label key={y} className="field">
                      <span className="field__label">Plafond {y}</span>
                      <NumInput
                        className="field__input"
                        style={{ fontSize: 18 }}
                        value={data.celi.plafondsAnnuels?.[y] ?? CELI_PLAFONDS_OFFICIELS[y] ?? 0}
                        onChange={(n) =>
                          setCeli({
                            plafondsAnnuels: { ...data.celi.plafondsAnnuels, [y]: n },
                          })
                        }
                      />
                    </label>
                  ))}
                </div>
              </details>
            </>
          )}
        </Card>
      )}

      {aCeliapp && (
        <Card
          plus="tl"
          style={{ marginBottom: 24, borderColor: enTropApp ? '#a4402f' : '#cfd3d7' }}
        >
          <div className="row between center gap-12" style={{ flexWrap: 'wrap' }}>
            <div>
              <div className="cd" style={{ fontWeight: 700, fontSize: 32, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                CELIAPP
              </div>
              <div className="muted" style={{ fontSize: 16 }}>
                Compte pour ma première maison — un seul plafond à vie de {money(plafondAppVie)}.
              </div>
            </div>
            <div className="cd" style={{ fontWeight: 700, fontSize: 30, color: couleurApp }}>
              {enTropApp ? 'Plafond dépassé' : procheApp ? 'Presque plein' : 'Il reste de la place'}
            </div>
          </div>

          <div className="grid grid-auto-260 gap-20 mt-24">
            <label className="field">
              <span className="field__label">Année où j'ai commencé à cotiser</span>
              <NumInput
                className="field__input"
                style={{ fontSize: 22 }}
                integer
                emptyIsZero
                value={data.celiapp?.anneeDebutCotisation || 0}
                placeholder={String(anneeCourante)}
                onChange={(n) => setCeliapp({ anneeDebutCotisation: n })}
              />
            </label>
            <label className="field">
              <span className="field__label">Plafond à vie ($)</span>
              <NumInput
                className="field__input"
                style={{ fontSize: 22 }}
                value={plafondAppVie}
                onChange={(n) => setCeliapp({ plafondVie: n })}
              />
            </label>
            <div>
              <div className="muted" style={{ fontSize: 15 }}>Cotisé cette année</div>
              <div className="mono-cond" style={{ fontSize: 30 }}>{money(cotiseAppAnnee)}</div>
              <div className="subtle" style={{ fontSize: 14 }}>
                Compte à la fois pour le plafond annuel et le plafond à vie.
              </div>
            </div>
          </div>

          <div className="mt-24">
            <div className="row between" style={{ fontSize: 17 }}>
              <span>Depuis le début</span>
              <span>{money(cotiseAppTotal)} sur {money(plafondAppVie)}</span>
            </div>
            <div className="mt-8"><Bar value={barApp} color={couleurApp} height={26} /></div>
            <div className="mt-8" style={{ fontSize: 17, color: '#424244' }}>
              {enTropApp
                ? `Tu dépasses de ${money(-dispoApp)}. Pénalité de 1 % par mois sur ce trop-plein.`
                : `Il te reste ${money(dispoApp)} à cotiser à vie dans le CELIAPP.`}
            </div>
            <div className="mt-8" style={{ fontSize: 17, color: '#424244' }}>
              Valeur actuelle : <strong>{money(valeurCeliapp)}</strong>. La valeur inclut les gains — elle peut dépasser tes cotisations sans pénalité.
            </div>
          </div>

          {data.celiapp?.anneeDebutCotisation ? (
            <div className="mt-24">
              <div className="row between" style={{ fontSize: 17 }}>
                <span>Cette année ({anneeCourante})</span>
                <span>{money(cotiseAppAnnee)} sur {money(plafondAppAnnee)}</span>
              </div>
              <div className="mt-8">
                <Bar value={barAppAnnee} color={enTropAppAnnee ? '#a4402f' : '#5980a6'} height={26} />
              </div>
              <div className="mt-8" style={{ fontSize: 15, color: '#424244' }}>
                Plafond annuel de base : <strong>8 000 $</strong>. Report d'un maximum de <strong>8 000 $</strong> inutilisés de l'année précédente (donc jusqu'à 16 000 $ dans une seule année).
                {enTropAppAnnee && (
                  <>
                    {' '}<span style={{ color: '#a4402f', fontWeight: 700 }}>
                      Tu dépasses de {money(cotiseAppAnnee - plafondAppAnnee)} cette année.
                    </span>
                  </>
                )}
                {!enTropAppAnnee && dispoAppAnnee >= 0 && (
                  <> Il te reste <strong>{money(dispoAppAnnee)}</strong> à cotiser en {anneeCourante}.</>
                )}
              </div>
            </div>
          ) : null}

          <div className="mt-24">
            <div className="section-label">Ce que j'ai cotisé chaque année</div>
            {anneesCotisationApp.length === 0 ? (
              <div className="subtle mt-8" style={{ fontSize: 14 }}>
                Renseigne d'abord l'année où tu as commencé à cotiser.
              </div>
            ) : (
              <div className="grid grid-auto-190 gap-14 mt-14">
                {anneesCotisationApp.map((y) => (
                  <label key={y} className="field">
                    <span className="field__label">
                      {y} · plafond {money(celiappPlafondAnnuel(data, y))}
                    </span>
                    <NumInput
                      className="field__input"
                      style={{ fontSize: 22 }}
                      emptyIsZero
                      min={0}
                      value={data.celiapp?.cotisations?.[y] ?? 0}
                      placeholder="0"
                      onChange={(n) => setCotisationCeliapp(y, n)}
                    />
                  </label>
                ))}
              </div>
            )}
            <div className="subtle mt-8" style={{ fontSize: 13 }}>
              Le plafond de chaque année tient compte du report de l'année précédente (max 8 000 $ reportables à la fois).
            </div>
          </div>
        </Card>
      )}

      {aReer && (
        <Card
          plus="tl"
          style={{ marginBottom: 24, borderColor: enTropReer ? '#a4402f' : '#cfd3d7' }}
        >
          <div className="row between center gap-12" style={{ flexWrap: 'wrap' }}>
            <div>
              <div className="cd" style={{ fontWeight: 700, fontSize: 32, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                REER
              </div>
              <div className="muted" style={{ fontSize: 16 }}>
                Plafond = 18 % du revenu de l'année précédente, jusqu'au maximum CRA ({money(reerPlafondMaxAnnuel(anneeCourante))} en {anneeCourante}).
              </div>
            </div>
            <div className="cd" style={{ fontWeight: 700, fontSize: 30, color: couleurReer }}>
              {enTropReer ? 'Plafond dépassé' : procheReer ? 'Presque plein' : 'Il reste de la place'}
            </div>
          </div>

          <div className="grid grid-auto-260 gap-20 mt-24">
            <label className="field">
              <span className="field__label">Droits inutilisés reportés au début ($)</span>
              <NumInput
                className="field__input"
                style={{ fontSize: 22 }}
                value={data.reer?.droitsReport ?? 0}
                onChange={(n) => setReer({ droitsReport: Math.max(0, n) })}
              />
              <div className="subtle mt-6" style={{ fontSize: 13 }}>
                Regarde ton avis de cotisation CRA pour ce montant.
              </div>
            </label>
            <div>
              <div className="muted" style={{ fontSize: 15 }}>Plafond {anneeCourante}</div>
              <div className="mono-cond" style={{ fontSize: 30 }}>{money(plafondReerAnnee)}</div>
              <div className="subtle" style={{ fontSize: 14 }}>
                = 18 % du revenu {anneeCourante - 1} plafonné à {money(reerPlafondMaxAnnuel(anneeCourante))}.
              </div>
            </div>
            <div>
              <div className="muted" style={{ fontSize: 15 }}>Droits cumulés</div>
              <div className="mono-cond" style={{ fontSize: 30 }}>{money(droitsReer)}</div>
              <div className="subtle" style={{ fontSize: 14 }}>
                Report + plafonds annuels calculés depuis tes revenus.
              </div>
            </div>
          </div>

          <div className="mt-24">
            <div className="row between" style={{ fontSize: 17 }}>
              <span>Depuis le début</span>
              <span>{money(cotiseReerTotal)} sur {money(droitsReer)}</span>
            </div>
            <div className="mt-8"><Bar value={barReer} color={couleurReer} height={26} /></div>
            <div className="mt-8" style={{ fontSize: 17, color: '#424244' }}>
              {enTropReer
                ? `Tu dépasses de ${money(-dispoReer)}. Au-delà de 2 000 $ de trop-plein, pénalité de 1 % par mois.`
                : `Il te reste ${money(dispoReer)} de droits REER cumulés.`}
            </div>
            <div className="mt-8" style={{ fontSize: 17, color: '#424244' }}>
              Valeur actuelle : <strong>{money(valeurReer)}</strong>.
            </div>
          </div>

          <div className="mt-24">
            <div className="row between" style={{ fontSize: 17 }}>
              <span>Cette année ({anneeCourante})</span>
              <span>{money(cotiseReerAnnee)} sur {money(plafondReerAnnee)}</span>
            </div>
            <div className="mt-8"><Bar value={barReerAnnee} color="#5980a6" height={26} /></div>
          </div>

          <div className="mt-24">
            <div className="section-label">Mes revenus par année</div>
            <div className="subtle mt-6" style={{ fontSize: 13 }}>
              Le revenu d'une année sert à calculer les droits REER de l'année suivante (18 %).
            </div>
            <div className="grid grid-auto-190 gap-14 mt-14">
              {revenusReerAnnees.map((y) => (
                <label key={y} className="field">
                  <span className="field__label">Revenu {y}</span>
                  <NumInput
                    className="field__input"
                    style={{ fontSize: 22 }}
                    emptyIsZero
                    min={0}
                    value={data.reer.revenusAnneesPrecedentes?.[y] ?? 0}
                    onChange={(n) => setRevenuReer(y, n)}
                  />
                  <div className="subtle mt-4" style={{ fontSize: 12 }}>
                    → droits {y + 1} : {money(reerPlafondAnnuel(data, y + 1))}
                  </div>
                </label>
              ))}
            </div>
            <div className="row mt-10 gap-8">
              <button
                className="btn"
                onClick={() => {
                  const anneesSaisies = Object.keys(data.reer.revenusAnneesPrecedentes ?? {})
                    .map(Number)
                    .filter((y) => !Number.isNaN(y));
                  const min = anneesSaisies.length > 0 ? Math.min(...anneesSaisies) : anneeCourante - 1;
                  setRevenuReer(min - 1, 0);
                }}
              >
                + Ajouter une année plus ancienne
              </button>
            </div>
          </div>

          <div className="mt-24">
            <div className="section-label">Mes cotisations REER par année</div>
            <div className="grid grid-auto-190 gap-14 mt-14">
              {cotisationsReerAnnees.map((y) => (
                <label key={y} className="field">
                  <span className="field__label">
                    {y} · plafond {money(reerPlafondAnnuel(data, y))}
                  </span>
                  <NumInput
                    className="field__input"
                    style={{ fontSize: 22 }}
                    emptyIsZero
                    min={0}
                    value={data.reer.cotisations?.[y] ?? 0}
                    onChange={(n) => setCotisationReer(y, n)}
                  />
                </label>
              ))}
            </div>
          </div>
        </Card>
      )}

      {aReee && (
        <div style={{ marginBottom: 24 }}>
          <div className="section-label section-label--md" style={{ marginBottom: 14 }}>
            REEE — un compte par enfant
          </div>
          <div className="muted" style={{ fontSize: 15, marginBottom: 18 }}>
            Le gouvernement fédéral ajoute <strong>20 %</strong> (SCEE, max {money(REEE_SCEE_ANNUELLE_MAX)}/an, {money(REEE_SCEE_VIE_MAX)} à vie) sur tes cotisations.
            Au Québec, l'IQEE ajoute <strong>10 %</strong> (max {money(REEE_IQEE_ANNUELLE_MAX)}/an, {money(REEE_IQEE_VIE_MAX)} à vie). Plafond à vie de cotisation : {money(REEE_PLAFOND_VIE)} par bénéficiaire.
          </div>
          {comptesReee.map((c) => (
            <ReeeCompteCard key={c.id} compteId={c.id} compteNom={c.nom} />
          ))}
        </div>
      )}

      <div style={{ border: '1px solid #cfd3d7', padding: 22, fontSize: 17, color: '#424244' }} className="pretty">
        Si tu mets plus que la limite, le gouvernement charge <strong>1 % par mois</strong> sur le montant en trop (au-delà d'une marge de 2 000 $ pour le REER).
      </div>
    </>
  );
};

// -------- Carte REEE (une par enfant / bénéficiaire) --------

const ReeeCompteCard = ({ compteId, compteNom }: { compteId: string; compteNom: string }) => {
  const { data, setData } = useFinance();
  const today = new Date();
  const anneeCourante = today.getFullYear();
  const [annees, setAnnees] = useState(18);

  const cfg = reeeConfig(data, compteId);

  const setCfg = (patch: Partial<ReeeCompteConfig>) =>
    setData((x) => ({
      ...x,
      reee: {
        ...(x.reee ?? {}),
        [compteId]: { ...reeeConfig(x, compteId), ...patch },
      },
    }));
  const setCotisation = (annee: number, montant: number) =>
    setData((x) => {
      const c = reeeConfig(x, compteId);
      return {
        ...x,
        reee: {
          ...(x.reee ?? {}),
          [compteId]: {
            ...c,
            cotisations: { ...c.cotisations, [annee]: Math.max(0, montant) },
          },
        },
      };
    });

  const debut = useMemo(() => {
    const anneesSaisies = Object.keys(cfg.cotisations ?? {})
      .map(Number)
      .filter((y) => !Number.isNaN(y));
    if (anneesSaisies.length > 0) return Math.min(...anneesSaisies);
    if (cfg.anneeNaissanceBeneficiaire && cfg.anneeNaissanceBeneficiaire > 1900) {
      return cfg.anneeNaissanceBeneficiaire;
    }
    return anneeCourante;
  }, [cfg.cotisations, cfg.anneeNaissanceBeneficiaire, anneeCourante]);

  const anneesCotisation = useMemo(() => {
    const arr: number[] = [];
    for (let y = debut; y <= anneeCourante; y++) arr.push(y);
    return arr;
  }, [debut, anneeCourante]);

  const cotiseTotal = reeeCotisationsCumulees(data, compteId, today);
  const cotiseAnnee = reeeCotiseCetteAnnee(data, compteId, today);
  const dispo = reeeDisponible(data, compteId, today);
  const valeur = valeurCompte(data, compteId);
  const scee = reeeSceeTotale(data, compteId, today);
  const iqee = reeeIqeeTotale(data, compteId, today);
  const sceeAn = reeeSceeAnnuelle(cotiseAnnee);
  const iqeeAn = cfg.iqeeActif ? reeeIqeeAnnuelle(cotiseAnnee) : 0;

  const bar = Math.min(1, cotiseTotal / REEE_PLAFOND_VIE);
  const enTrop = dispo < 0;
  const proche = dispo >= 0 && dispo < 1000;
  const couleur = enTrop || proche ? '#a4402f' : '#416180';

  const points = projectionCompte(data, compteId, annees);
  const dernier = points[points.length - 1];
  const investi = dernier?.investi ?? 0;
  const valeurProjetee = dernier?.valeur ?? 0;
  const gain = valeurProjetee - investi;

  return (
    <Card plus="tl" style={{ marginBottom: 20, borderColor: enTrop ? '#a4402f' : '#cfd3d7' }}>
      <div className="row between center gap-12" style={{ flexWrap: 'wrap' }}>
        <div>
          <div className="cd" style={{ fontWeight: 700, fontSize: 28, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            {compteNom}
          </div>
          <div className="muted" style={{ fontSize: 15 }}>
            REEE — plafond à vie {money(REEE_PLAFOND_VIE)} par bénéficiaire.
          </div>
        </div>
        <div className="cd" style={{ fontWeight: 700, fontSize: 26, color: couleur }}>
          {enTrop ? 'Plafond dépassé' : proche ? 'Presque plein' : 'Il reste de la place'}
        </div>
      </div>

      <div className="grid grid-auto-260 gap-20 mt-24">
        <label className="field">
          <span className="field__label">Année de naissance du bénéficiaire</span>
          <NumInput
            className="field__input"
            style={{ fontSize: 22 }}
            integer
            emptyIsZero
            value={cfg.anneeNaissanceBeneficiaire || 0}
            placeholder="ex: 2018"
            onChange={(n) => setCfg({ anneeNaissanceBeneficiaire: n })}
          />
          <div className="subtle mt-4" style={{ fontSize: 12 }}>Info seulement, pour t'aider à visualiser l'horizon.</div>
        </label>
        <div>
          <div className="muted" style={{ fontSize: 15 }}>Cotisé cette année</div>
          <div className="mono-cond" style={{ fontSize: 30 }}>{money(cotiseAnnee)}</div>
          <div className="subtle" style={{ fontSize: 13 }}>
            SCEE {anneeCourante} : <strong>{money(sceeAn)}</strong>
            {cfg.iqeeActif && <> · IQEE {anneeCourante} : <strong>{money(iqeeAn)}</strong></>}
          </div>
        </div>
        <label className="row center gap-8" style={{ fontSize: 16, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={cfg.iqeeActif}
            onChange={(e) => setCfg({ iqeeActif: e.target.checked })}
          />
          <span>Résident du Québec — activer l'IQEE (+10 %)</span>
        </label>
      </div>

      <div className="mt-24">
        <div className="row between" style={{ fontSize: 17 }}>
          <span>Cotisations à vie</span>
          <span>{money(cotiseTotal)} sur {money(REEE_PLAFOND_VIE)}</span>
        </div>
        <div className="mt-8"><Bar value={bar} color={couleur} height={26} /></div>
        <div className="mt-8" style={{ fontSize: 17, color: '#424244' }}>
          {enTrop
            ? `Tu dépasses de ${money(-dispo)}. Aucun retour de SCEE au-delà du plafond.`
            : `Il te reste ${money(dispo)} à cotiser à vie pour ce bénéficiaire.`}
        </div>
        <div className="mt-8" style={{ fontSize: 17, color: '#424244' }}>
          Valeur actuelle du compte : <strong>{money(valeur)}</strong>.
        </div>
      </div>

      <div className="grid grid-auto-220 gap-20 mt-24">
        <div>
          <div className="section-label">SCEE reçue à vie</div>
          <div className="mono-cond mt-4" style={{ fontSize: 30, color: '#416180' }}>
            {money(scee)} <span style={{ fontSize: 16, color: '#7a7a7d' }}>/ {money(REEE_SCEE_VIE_MAX)}</span>
          </div>
          <div className="subtle" style={{ fontSize: 13 }}>20 % du fédéral, max {money(REEE_SCEE_ANNUELLE_MAX)}/an.</div>
        </div>
        {cfg.iqeeActif && (
          <div>
            <div className="section-label">IQEE reçu à vie</div>
            <div className="mono-cond mt-4" style={{ fontSize: 30, color: '#416180' }}>
              {money(iqee)} <span style={{ fontSize: 16, color: '#7a7a7d' }}>/ {money(REEE_IQEE_VIE_MAX)}</span>
            </div>
            <div className="subtle" style={{ fontSize: 13 }}>10 % du Québec, max {money(REEE_IQEE_ANNUELLE_MAX)}/an.</div>
          </div>
        )}
      </div>

      <div className="mt-24">
        <div className="section-label">Ce que j'ai cotisé chaque année pour ce bénéficiaire</div>
        <div className="grid grid-auto-190 gap-14 mt-14">
          {anneesCotisation.map((y) => {
            const c = cfg.cotisations?.[y] ?? 0;
            const s = reeeSceeAnnuelle(c);
            const i = cfg.iqeeActif ? reeeIqeeAnnuelle(c) : 0;
            return (
              <label key={y} className="field">
                <span className="field__label">{y}</span>
                <NumInput
                  className="field__input"
                  style={{ fontSize: 22 }}
                  emptyIsZero
                  min={0}
                  value={c}
                  onChange={(n) => setCotisation(y, n)}
                />
                <div className="subtle mt-4" style={{ fontSize: 12 }}>
                  → subvention : {money(s + i)}
                </div>
              </label>
            );
          })}
        </div>
        <div className="row mt-10 gap-8">
          <button
            className="btn"
            onClick={() => setCotisation(debut - 1, cfg.cotisations?.[debut - 1] ?? 0)}
          >
            + Ajouter une année plus ancienne
          </button>
        </div>
      </div>

      <details className="mt-24">
        <summary className="section-label" style={{ cursor: 'pointer' }}>
          SCEE / IQEE déjà reçus avant le suivi
        </summary>
        <div className="grid grid-auto-220 gap-14 mt-14">
          <label className="field">
            <span className="field__label">SCEE déjà reçue ($)</span>
            <NumInput
              className="field__input"
              style={{ fontSize: 20 }}
              emptyIsZero
              min={0}
              value={cfg.sceeRecuAvant}
              onChange={(n) => setCfg({ sceeRecuAvant: n })}
            />
          </label>
          {cfg.iqeeActif && (
            <label className="field">
              <span className="field__label">IQEE déjà reçu ($)</span>
              <NumInput
                className="field__input"
                style={{ fontSize: 20 }}
                emptyIsZero
                min={0}
                value={cfg.iqeeRecuAvant}
                onChange={(n) => setCfg({ iqeeRecuAvant: n })}
              />
            </label>
          )}
        </div>
      </details>

      <div className="mt-24" style={{ borderTop: '1px solid #e7e7ea', paddingTop: 24 }}>
        <div className="section-label section-label--md">Croissance projetée de ce compte</div>
        <p className="pretty mt-8" style={{ fontSize: 16, color: '#424244' }}>
          Dans {annees} {annees === 1 ? 'an' : 'ans'}, ce REEE pourrait valoir <strong>{money(valeurProjetee)}</strong>.
          Tu aurais déposé {money(investi)} de ta poche ; le reste ({money(gain)}) vient des subventions gouvernementales et des gains.
        </p>
        <div className="row between mt-14 muted" style={{ fontSize: 15 }}>
          <span>1 an</span>
          <span>Fais glisser pour changer</span>
          <span>25 ans</span>
        </div>
        <input
          type="range"
          min={1}
          max={25}
          step={1}
          value={annees}
          onChange={(e) => setAnnees(Number(e.target.value))}
          style={{ width: '100%', marginTop: 8 }}
        />
        <div style={{ height: 240, marginTop: 20 }}>
          <ResponsiveContainer>
            <AreaChart data={points} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id={`g-reee-val-${compteId}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#5980a6" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#5980a6" stopOpacity={0.15} />
                </linearGradient>
                <linearGradient id={`g-reee-inv-${compteId}`} x1="0" y1="0" x2="0" y2="1">
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
              <Area type="monotone" dataKey="valeur" stroke="#5980a6" fill={`url(#g-reee-val-${compteId})`} strokeWidth={2} />
              <Area type="monotone" dataKey="investi" stroke="#416180" fill={`url(#g-reee-inv-${compteId})`} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="row gap-20 mt-10" style={{ flexWrap: 'wrap', fontSize: 15 }}>
          <div className="row center gap-8"><span style={{ width: 14, height: 14, background: '#b5d9fd' }} /> Ce que tu déposes</div>
          <div className="row center gap-8"><span style={{ width: 14, height: 14, background: '#5980a6' }} /> Valeur totale avec subventions et gains</div>
        </div>
      </div>
    </Card>
  );
};
