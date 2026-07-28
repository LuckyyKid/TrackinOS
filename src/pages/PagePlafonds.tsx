import { useMemo } from 'react';
import { useFinance } from '../FinanceContext';
import {
  celiAnneeEligible,
  celiCotisationsCumulees,
  celiCotiseCetteAnnee,
  celiDisponible,
  celiPlafondAnnuel,
  celiPlafondCumule,
  celiValeurTotale,
  money,
} from '../calc';
import { PageHeader } from '../App';
import { Bar, Card } from '../ui';
import type { CeliConfig } from '../types';
import { CELI_PLAFONDS_OFFICIELS } from '../types';

export const PagePlafonds = () => {
  const { data, setData } = useFinance();
  const today = new Date();
  const anneeCourante = today.getFullYear();
  const comptesFixes = data.comptes.filter(
    (c) => c.plafondAnnuel > 0 && c.id !== 'celi' && c.id !== 'celi_enfant',
  );

  const setCeli = (patch: Partial<CeliConfig>) =>
    setData((x) => ({ ...x, celi: { ...x.celi, ...patch } }));

  const setCotisation = (annee: number, montant: number) =>
    setData((x) => ({
      ...x,
      celi: {
        ...x.celi,
        cotisations: { ...x.celi.cotisations, [annee]: Math.max(0, montant) },
      },
    }));

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
  const couleurCeli = enTrop ? '#a4402f' : proche ? '#a4402f' : '#416180';

  return (
    <>
      <PageHeader
        section="Limites"
        title="Mes plafonds"
        help="Le gouvernement limite combien tu peux mettre dans ces comptes. Dépasser coûte 1 % par mois. Le CELI se partage entre tous tes comptes CELI (compte principal + portefeuille enfant)."
      />

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
            <input
              className="field__input"
              style={{ fontSize: 22 }}
              inputMode="numeric"
              value={data.celi.anneeDebutCotisation || ''}
              placeholder={String(anneeEligible)}
              onChange={(e) => setCeli({ anneeDebutCotisation: Number(e.target.value) || 0 })}
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
                  : `Il te reste ${money(dispo)} à cotiser à vie (partagés entre CELI + CELI enfant).`}
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
                    <input
                      className="field__input"
                      style={{ fontSize: 22 }}
                      inputMode="decimal"
                      value={data.celi.cotisations?.[y] ?? ''}
                      placeholder="0"
                      onChange={(e) => setCotisation(y, Number(e.target.value) || 0)}
                    />
                  </label>
                ))}
              </div>
              <div className="subtle mt-8" style={{ fontSize: 14 }}>
                Astuce : additionne ce que tu as mis dans TOUS tes comptes CELI cette année-là (compte principal + enfant).
              </div>
            </div>

            <details className="mt-24">
              <summary className="section-label" style={{ cursor: 'pointer' }}>Modifier les plafonds officiels (si CRA change)</summary>
              <div className="grid grid-auto-160 gap-10 mt-14">
                {Array.from({ length: anneeCourante - 2008 }, (_, i) => 2009 + i).map((y) => (
                  <label key={y} className="field">
                    <span className="field__label">Plafond {y}</span>
                    <input
                      className="field__input"
                      style={{ fontSize: 18 }}
                      inputMode="decimal"
                      value={data.celi.plafondsAnnuels?.[y] ?? CELI_PLAFONDS_OFFICIELS[y] ?? 0}
                      onChange={(e) =>
                        setCeli({
                          plafondsAnnuels: {
                            ...data.celi.plafondsAnnuels,
                            [y]: Number(e.target.value) || 0,
                          },
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

      <div className="stack gap-20" style={{ marginBottom: 24 }}>
        {comptesFixes.map((c) => {
          const restantAnnuel = c.plafondAnnuel - c.annee;
          const enTropCpt = restantAnnuel < 0;
          const procheCpt = restantAnnuel >= 0 && restantAnnuel < 1000;
          const couleur = enTropCpt ? '#a4402f' : procheCpt ? '#a4402f' : '#5980a6';
          const bd = enTropCpt || procheCpt ? '#e2705c' : '#cfd3d7';
          const bg = enTropCpt || procheCpt ? '#fbf1ee' : 'transparent';
          const etat = enTropCpt ? 'Plafond dépassé' : procheCpt ? 'Presque plein' : 'Il reste de la place';
          const versements = Math.max(0, Math.floor(restantAnnuel / Math.max(1, c.parCycle)));
          const barAnnuel = c.annee / Math.max(1, c.plafondAnnuel);
          const barVie = c.utilise / Math.max(1, c.plafondVie);
          return (
            <Card key={c.id} className="card--pad-sm" style={{ background: bg, borderColor: bd }}>
              <div className="row between center gap-12" style={{ flexWrap: 'wrap' }}>
                <div>
                  <div className="cd" style={{ fontWeight: 700, fontSize: 32, textTransform: 'uppercase', letterSpacing: '0.03em' }}>{c.nom}</div>
                  <div className="muted" style={{ fontSize: 16 }}>{c.simple}</div>
                </div>
                <div className="cd" style={{ fontWeight: 700, fontSize: 30, color: couleur }}>{etat}</div>
              </div>

              <div className="mt-24">
                <div className="row between" style={{ fontSize: 17 }}>
                  <span>Cette année</span>
                  <span>{money(c.annee)} sur {money(c.plafondAnnuel)}</span>
                </div>
                <div className="mt-8"><Bar value={barAnnuel} color={couleur} height={26} /></div>
                <div className="mt-8" style={{ fontSize: 17, color: '#424244' }}>
                  {enTropCpt
                    ? `Tu dépasses de ${money(-restantAnnuel)}. Tu paies 1 % de pénalité par mois sur ce trop-plein.`
                    : `Il te reste ${money(restantAnnuel)} — environ ${versements} versements de ${money(c.parCycle)} à cette paie.`}
                </div>
              </div>

              <div className="mt-24">
                <div className="row between" style={{ fontSize: 17 }}>
                  <span>Depuis le début (maximum à vie)</span>
                  <span>{money(c.utilise)} sur {money(c.plafondVie)}</span>
                </div>
                <div className="mt-8"><Bar value={barVie} color="#416180" height={26} /></div>
                <div className="mt-8" style={{ fontSize: 17, color: '#424244' }}>
                  {c.utilise > c.plafondVie
                    ? `Tu es au-delà du maximum à vie de ${money(c.plafondVie)}.`
                    : `Il reste ${money(c.plafondVie - c.utilise)} de droits pour toute ta vie.`}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div style={{ border: '1px solid #cfd3d7', padding: 22, fontSize: 17, color: '#424244' }} className="pretty">
        Si tu mets plus que la limite, le gouvernement charge <strong>1 % par mois</strong> sur le montant en trop, tant qu'il reste dans le compte.
      </div>
    </>
  );
};
