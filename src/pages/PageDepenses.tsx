import { useMemo, useState } from 'react';
import { useFinance } from '../FinanceContext';
import { money, soldesCycles, totalCyclePaye } from '../calc';
import type { Categorie, CompteInvest, CycleCible, Depense } from '../types';
import { PageHeader } from '../App';
import { Card, NumInput } from '../ui';

const NOMS_COMPTES_FIXES: Record<string, string> = {
  cheques: 'Compte chèques',
  credit: 'Carte de crédit',
};

const buildNomsComptes = (comptes: CompteInvest[]): Record<string, string> => {
  const out: Record<string, string> = { ...NOMS_COMPTES_FIXES };
  comptes.forEach((c) => {
    out[c.id] = c.nom;
  });
  return out;
};

const buildComptesList = (comptes: CompteInvest[]): string[] => [
  'cheques',
  'credit',
  ...comptes.map((c) => c.id),
];

const NOM_CAT: Record<Categorie, string> = {
  fixe: 'Facture fixe',
  variable: 'Dépense variable',
  investissement: 'Placement',
  epargne: 'Épargne',
  dette: 'Dette',
};

const CAT_LIST: Categorie[] = ['fixe', 'variable', 'investissement', 'epargne', 'dette'];

const uid = () => 'd' + Math.random().toString(36).slice(2, 9);

const nouvelle = (): Depense => ({
  id: uid(),
  nom: '',
  montant: 0,
  categorie: 'variable',
  jour: 1,
  cycle: 'cycle1',
  compte: 'cheques',
  recurrence: 'mensuel',
  actif: true,
});

export const PageDepenses = () => {
  const { data, setData } = useFinance();
  const [mode, setMode] = useState<'assistant' | 'ligne'>('assistant');
  const [filtre, setFiltre] = useState<'toutes' | 'cycle1' | 'cycle2'>('toutes');

  const listeAffichee = useMemo(
    () =>
      data.depenses.filter((d) => {
        if (filtre === 'toutes') return true;
        return d.cycle === filtre || d.cycle === 'deux';
      }),
    [data.depenses, filtre],
  );

  const soldes = soldesCycles(data);
  const total1 = totalCyclePaye(data, 'cycle1');
  const total2 = totalCyclePaye(data, 'cycle2');
  const nomsComptes = useMemo(() => buildNomsComptes(data.comptes), [data.comptes]);
  const comptesList = useMemo(() => buildComptesList(data.comptes), [data.comptes]);

  const ajouter = (d: Depense) => setData((x) => ({ ...x, depenses: [...x.depenses, d] }));
  const modifier = (id: string, patch: Partial<Depense>) =>
    setData((x) => ({
      ...x,
      depenses: x.depenses.map((d) => (d.id === id ? { ...d, ...patch } : d)),
    }));
  const supprimer = (id: string) =>
    setData((x) => ({ ...x, depenses: x.depenses.filter((d) => d.id !== id) }));

  const nbActives = data.depenses.filter((d) => d.actif).length;

  return (
    <>
      <PageHeader
        section={`${nbActives} dépenses actives`}
        title="Mes dépenses"
        right={
          <div className="toggle">
            <button className={'toggle__btn' + (mode === 'assistant' ? ' toggle__btn--active' : '')} onClick={() => setMode('assistant')}>Assistant</button>
            <button className={'toggle__btn' + (mode === 'ligne' ? ' toggle__btn--active' : '')} onClick={() => setMode('ligne')}>Ligne rapide</button>
          </div>
        }
      />

      {mode === 'assistant' ? (
        <Assistant
          onSave={ajouter}
          labels={[data.cycles[0].label, data.cycles[1].label]}
          nomsComptes={nomsComptes}
          comptesList={comptesList}
        />
      ) : (
        <LigneRapide
          onSave={ajouter}
          labels={[data.cycles[0].label, data.cycles[1].label]}
          nomsComptes={nomsComptes}
          comptesList={comptesList}
        />
      )}

      <div className="row gap-10 mt-24" style={{ flexWrap: 'wrap' }}>
        {(
          [
            ['toutes', 'Toutes'],
            ['cycle1', data.cycles[0].label],
            ['cycle2', data.cycles[1].label],
          ] as const
        ).map(([id, lbl]) => (
          <button
            key={id}
            className={'btn' + (filtre === id ? ' btn--primary' : '')}
            onClick={() => setFiltre(id as any)}
          >
            {lbl}
          </button>
        ))}
      </div>

      <div className="grid grid-auto-260 gap-20 mt-24" style={{ border: '1px solid #cfd3d7', padding: 24 }}>
        <div>
          <div className="muted" style={{ fontSize: 15 }}>Payé par {data.cycles[0].label}</div>
          <div className="mono-cond" style={{ fontSize: 34 }}>{money(total1)}</div>
          <div className="subtle" style={{ fontSize: 15 }}>Reste {money(soldes.cycle1)}</div>
        </div>
        <div>
          <div className="muted" style={{ fontSize: 15 }}>Payé par {data.cycles[1].label}</div>
          <div className="mono-cond" style={{ fontSize: 34 }}>{money(total2)}</div>
          <div className="subtle" style={{ fontSize: 15 }}>Reste {money(soldes.cycle2)}</div>
        </div>
      </div>

      <div className="mt-24" style={{ border: '1px solid #cfd3d7' }}>
        {listeAffichee.map((d) => {
          const cycleLbl =
            d.cycle === 'deux' ? 'les deux paies' : d.cycle === 'cycle1' ? data.cycles[0].label : data.cycles[1].label;
          const detail = `Le ${d.jour} · ${cycleLbl} · ${nomsComptes[d.compte] ?? d.compte}`;
          const barPct = Math.min(100, (d.montant / Math.max(...data.depenses.map((x) => x.montant))) * 100);
          const barColor =
            d.categorie === 'investissement' ? '#94bce3' : d.categorie === 'dette' ? '#a4402f' : '#5980a6';
          return (
            <div
              key={d.id}
              className="row"
              style={{
                gap: 14,
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid #e7e7ea',
                padding: '16px 20px',
                opacity: d.actif ? 1 : 0.45,
              }}
            >
              <div style={{ minWidth: 200, flex: '1 1 220px' }}>
                <div className="cd" style={{ fontWeight: 600, fontSize: 23, textTransform: 'uppercase', letterSpacing: '0.03em' }}>{d.nom}</div>
                <div className="muted" style={{ fontSize: 15 }}>{detail}</div>
              </div>
              <div style={{ flex: '1 1 160px', minWidth: 120 }}>
                <div style={{ height: 10, background: '#e7e7ea' }}>
                  <div style={{ height: 10, background: barColor, width: `${barPct}%` }} />
                </div>
              </div>
              <div className="mono-cond" style={{ fontSize: 26, minWidth: 110, textAlign: 'right' }}>{money(d.montant)}</div>
              <div className="row gap-8">
                <button className="btn btn--sm" onClick={() => modifier(d.id, { actif: !d.actif })}>
                  {d.actif ? 'En pause' : 'Réactiver'}
                </button>
                <button className="btn btn--sm btn--danger" onClick={() => supprimer(d.id)}>Effacer</button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

/* ------------------ Wizard (Assistant) ------------------ */

const Assistant = ({
  onSave,
  labels,
  nomsComptes,
  comptesList,
}: {
  onSave: (d: Depense) => void;
  labels: [string, string];
  nomsComptes: Record<string, string>;
  comptesList: string[];
}) => {
  const [etape, setEtape] = useState(1);
  const [d, setD] = useState<Depense>(nouvelle);
  const set = (patch: Partial<Depense>) => setD({ ...d, ...patch });

  const questions = [
    { q: "C'est quoi, cette dépense ?", a: "Écris-le comme tu le dirais à voix haute." },
    { q: 'Combien ça coûte ?', a: 'Le montant par mois. Approximatif, c\u2019est correct.' },
    { q: 'Quand est-ce que ça sort ?', a: 'Le jour du mois et la paie qui doit payer.' },
    { q: "D'où sort l'argent ?", a: 'Le compte et le genre de dépense.' },
  ];
  const cur = questions[etape - 1];
  const total = questions.length;

  const suivant = () => {
    if (etape < total) return setEtape(etape + 1);
    if (!d.nom.trim() || d.montant <= 0) return;
    onSave({ ...d, id: uid() });
    setD(nouvelle());
    setEtape(1);
  };
  const retour = () => setEtape(Math.max(1, etape - 1));

  const cycleLbl =
    d.cycle === 'cycle1' ? labels[0] : d.cycle === 'cycle2' ? labels[1] : 'les deux paies';
  const resume = `${d.nom || 'Cette dépense'} — ${money(d.montant)} le ${d.jour}, ${cycleLbl}, ${nomsComptes[d.compte] ?? d.compte}, ${NOM_CAT[d.categorie].toLowerCase()}.`;

  return (
    <Card className="card--info card--pad-sm">
      <div className="row between center gap-12" style={{ flexWrap: 'wrap' }}>
        <div className="section-label section-label--md blue">Question {etape} sur {total}</div>
        <div className="row gap-6">
          {[1, 2, 3, 4].map((i) => (
            <span key={i} style={{ width: 34, height: 6, background: i <= etape ? '#5980a6' : '#b5d9fd' }} />
          ))}
        </div>
      </div>
      <div className="cd mt-12" style={{ fontWeight: 700, fontSize: 'clamp(28px, 4.4vw, 44px)', textTransform: 'uppercase', lineHeight: 1.05 }}>
        {cur.q}
      </div>
      <div className="blue mt-6" style={{ fontSize: 17 }}>{cur.a}</div>

      {etape === 1 && (
        <input
          className="field__input"
          placeholder="Ex. Épicerie"
          value={d.nom}
          onChange={(e) => set({ nom: e.target.value })}
          style={{ maxWidth: 520, marginTop: 20, fontSize: 24, borderColor: '#5980a6' }}
        />
      )}

      {etape === 2 && (
        <div className="row center gap-12 mt-20" style={{ flexWrap: 'wrap' }}>
          <NumInput
            className="field__input"
            placeholder="0"
            emptyIsZero
            value={d.montant}
            onChange={(n) => set({ montant: n })}
            style={{ width: 220, borderColor: '#5980a6', fontFamily: "'Barlow Condensed'", fontWeight: 700, fontSize: 44, padding: 18 }}
          />
          <span className="cd blue" style={{ fontWeight: 700, fontSize: 38 }}>$ par mois</span>
        </div>
      )}

      {etape === 3 && (
        <div className="stack gap-18 mt-20">
          <div>
            <div className="blue" style={{ fontSize: 16, marginBottom: 8 }}>Quelle paie doit payer ça ?</div>
            <div className="row gap-8" style={{ flexWrap: 'wrap' }}>
              {(
                [
                  ['cycle1', labels[0]],
                  ['cycle2', labels[1]],
                  ['deux', 'Les deux'],
                ] as const
              ).map(([id, lbl]) => (
                <button
                  key={id}
                  className={'btn' + (d.cycle === id ? ' btn--primary' : '')}
                  onClick={() => set({ cycle: id as CycleCible })}
                >
                  {lbl}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="blue" style={{ fontSize: 16, marginBottom: 6 }}>Quel jour du mois l'argent sort ?</div>
            <NumInput
              integer
              min={1}
              max={31}
              value={d.jour}
              onChange={(n) => set({ jour: Math.max(1, n) })}
              className="field__input"
              style={{ width: 130, borderColor: '#5980a6', fontSize: 24, padding: 16 }}
            />
          </div>
        </div>
      )}

      {etape === 4 && (
        <div className="stack gap-18 mt-20">
          <div>
            <div className="blue" style={{ fontSize: 16, marginBottom: 8 }}>D'où sort l'argent ?</div>
            <div className="row gap-8" style={{ flexWrap: 'wrap' }}>
              {comptesList.map((c) => (
                <button
                  key={c}
                  className={'btn' + (d.compte === c ? ' btn--primary' : '')}
                  onClick={() => set({ compte: c })}
                >
                  {nomsComptes[c] ?? c}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="blue" style={{ fontSize: 16, marginBottom: 8 }}>C'est quel genre de dépense ?</div>
            <div className="row gap-8" style={{ flexWrap: 'wrap' }}>
              {CAT_LIST.map((c) => (
                <button
                  key={c}
                  className={'btn' + (d.categorie === c ? ' btn--primary' : '')}
                  onClick={() => set({ categorie: c })}
                >
                  {NOM_CAT[c]}
                </button>
              ))}
            </div>
          </div>
          <div style={{ background: '#fff', border: '1px solid #b5d9fd', padding: 18 }}>
            <div className="muted" style={{ fontSize: 16 }}>Résumé</div>
            <div className="pretty" style={{ fontSize: 21, marginTop: 4 }}>{resume}</div>
          </div>
        </div>
      )}

      <div className="row gap-12 mt-26" style={{ flexWrap: 'wrap' }}>
        {etape > 1 && (
          <button className="btn btn--lg btn--ghost" onClick={retour}>Retour</button>
        )}
        <button className="btn btn--lg btn--primary" onClick={suivant}>
          {etape < total ? 'Continuer' : 'Enregistrer cette dépense'}
        </button>
      </div>
    </Card>
  );
};

/* ------------------ Quick line ------------------ */

const LigneRapide = ({
  onSave,
  labels,
  nomsComptes,
  comptesList,
}: {
  onSave: (d: Depense) => void;
  labels: [string, string];
  nomsComptes: Record<string, string>;
  comptesList: string[];
}) => {
  const [d, setD] = useState<Depense>(nouvelle);
  const set = (patch: Partial<Depense>) => setD({ ...d, ...patch });
  const enregistrer = () => {
    if (!d.nom.trim() || d.montant <= 0) return;
    onSave({ ...d, id: uid() });
    setD(nouvelle());
  };
  return (
    <div style={{ border: '1px solid #cfd3d7', padding: 22 }}>
      <div className="section-label">Ajouter en une ligne</div>
      <div className="grid mt-14" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, alignItems: 'end' }}>
        <label className="field">
          <span className="field__label">Quoi</span>
          <input className="field__input" placeholder="Épicerie" value={d.nom} onChange={(e) => set({ nom: e.target.value })} />
        </label>
        <label className="field">
          <span className="field__label">Combien ($)</span>
          <NumInput className="field__input" placeholder="0" emptyIsZero value={d.montant} onChange={(n) => set({ montant: n })} />
        </label>
        <label className="field">
          <span className="field__label">Jour</span>
          <NumInput className="field__input" integer min={1} max={31} value={d.jour} onChange={(n) => set({ jour: Math.max(1, n) })} />
        </label>
        <label className="field">
          <span className="field__label">Quelle paie</span>
          <select className="field__input" value={d.cycle} onChange={(e) => set({ cycle: e.target.value as CycleCible })}>
            <option value="cycle1">{labels[0]}</option>
            <option value="cycle2">{labels[1]}</option>
            <option value="deux">Les deux</option>
          </select>
        </label>
        <label className="field">
          <span className="field__label">D'où</span>
          <select className="field__input" value={d.compte} onChange={(e) => set({ compte: e.target.value })}>
            {comptesList.map((c) => (
              <option key={c} value={c}>{nomsComptes[c] ?? c}</option>
            ))}
          </select>
        </label>
        <button className="btn btn--primary" onClick={enregistrer} style={{ minHeight: 50 }}>Ajouter</button>
      </div>
    </div>
  );
};
