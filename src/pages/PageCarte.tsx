import { useFinance } from '../FinanceContext';
import {
  money,
  paiementPour30,
  pct,
  prochainJour,
  utilisationCarte,
  utilisationCarteProjetee,
} from '../calc';
import { PageHeader } from '../App';
import { Bar, Card } from '../ui';

export const PageCarte = () => {
  const { data, setData } = useFinance();
  const u = utilisationCarte(data.carte);
  const uProj = utilisationCarteProjetee(data);
  const paye30 = paiementPour30(data.carte);
  const surLimite = u > 0.30;
  const couleur = surLimite ? '#a4402f' : '#5980a6';

  const set = (patch: Partial<typeof data.carte>) =>
    setData((x) => ({ ...x, carte: { ...x.carte, ...patch } }));

  const surCarte = data.depenses.filter((d) => d.actif && d.compte === 'credit');
  const totalCarte = surCarte.reduce((s, d) => s + d.montant, 0);

  return (
    <>
      <PageHeader
        section="Crédit"
        title="Ma carte de crédit"
        help="Une règle simple : ne jamais utiliser plus de 30 % de ta limite. Au-dessus, ta cote de crédit baisse — même si tu payes tout."
      />

      <Card className={'card--pad-md ' + (surLimite ? 'card--danger' : '')} style={{ marginBottom: 24 }}>
        <div className="section-label section-label--md">Tu utilises</div>
        <div className="figure figure--lg mt-8" style={{ color: couleur }}>{pct(u)}</div>
        <div className="row gap-16 baseline mt-8" style={{ fontSize: 19, color: '#5d5d60' }}>
          de ta limite — {money(data.carte.solde)} sur {money(data.carte.limite)}
        </div>
        <div className="mt-24">
          <Bar value={u} color={couleur} height={32} marks={[{ at: 0.30, color: '#1d1f20', big: true }]} />
        </div>
        <div className="row between mt-10 muted" style={{ fontSize: 15 }}>
          <span>0 $</span>
          <span>La ligne noire = 30 %, ta limite santé</span>
          <span>{money(data.carte.limite)}</span>
        </div>
        <div className="grid grid-auto-240 mt-26" style={{ gap: 16 }}>
          <div style={{ border: '1px solid #cfd3d7', padding: 18 }}>
            <div className="muted" style={{ fontSize: 16 }}>Pour revenir sous 30 %, paye</div>
            <div className="mono-cond" style={{ fontSize: 40, lineHeight: 1.05 }}>{money(paye30)}</div>
            <div className="subtle" style={{ fontSize: 15 }}>avant le {prochainJour(data.carte.echeance)}</div>
          </div>
          <div style={{ border: '1px solid #cfd3d7', padding: 18 }}>
            <div className="muted" style={{ fontSize: 16 }}>Pour tout effacer, paye</div>
            <div className="mono-cond" style={{ fontSize: 40, lineHeight: 1.05 }}>{money(data.carte.solde)}</div>
            <div className="subtle" style={{ fontSize: 15 }}>le solde complet</div>
          </div>
          <div style={{ border: '1px solid #cfd3d7', padding: 18 }}>
            <div className="muted" style={{ fontSize: 16 }}>Si tu ne payes rien, tu seras à</div>
            <div className="mono-cond" style={{ fontSize: 40, lineHeight: 1.05, color: uProj > 0.30 ? '#a4402f' : '#5980a6' }}>{pct(uProj)}</div>
            <div className="subtle" style={{ fontSize: 15 }}>avec les dépenses à venir</div>
          </div>
        </div>
      </Card>

      <div className="grid grid-auto-300 gap-20">
        <div style={{ border: '1px solid #cfd3d7', padding: 24 }}>
          <div className="section-label">Mes chiffres</div>
          <div className="stack gap-14 mt-14">
            <label className="field">
              <span className="field__label">Ce que je dois aujourd'hui ($)</span>
              <input className="field__input field__input--num" inputMode="numeric" value={data.carte.solde}
                onChange={(e) => set({ solde: Number(e.target.value) || 0 })} />
            </label>
            <label className="field">
              <span className="field__label">Ma limite ($)</span>
              <input className="field__input field__input--num" inputMode="numeric" value={data.carte.limite}
                onChange={(e) => set({ limite: Number(e.target.value) || 0 })} />
            </label>
            <label className="field">
              <span className="field__label">Jour du relevé</span>
              <input className="field__input" inputMode="numeric" value={data.carte.releve}
                onChange={(e) => set({ releve: Number(e.target.value) || 1 })} />
            </label>
            <label className="field">
              <span className="field__label">Jour de l'échéance</span>
              <input className="field__input" inputMode="numeric" value={data.carte.echeance}
                onChange={(e) => set({ echeance: Number(e.target.value) || 1 })} />
            </label>
          </div>
          <div className="stack mt-20">
            <div className="row-item"><span>Relevé fermé le</span><span>{prochainJour(data.carte.releve)}</span></div>
            <div className="row-item"><span>Date limite de paiement</span><span>{prochainJour(data.carte.echeance)}</span></div>
            <div className="row-item"><span>Paiement automatique</span><span>{money(data.carte.autopayMontant)} le {prochainJour(data.carte.autopayJour)}</span></div>
          </div>
        </div>

        <div style={{ border: '1px solid #cfd3d7', padding: 24 }}>
          <div className="section-label">Ce qui passe sur la carte ce mois-ci</div>
          <div className="stack mt-14">
            {surCarte.map((d) => (
              <div key={d.id} className="row-item">
                <span>{d.nom} · le {d.jour}</span>
                <span style={{ fontWeight: 700 }}>{money(d.montant)}</span>
              </div>
            ))}
            <div className="row" style={{ justifyContent: 'space-between', borderTop: '2px solid #1d1f20', padding: '12px 0 0', marginTop: 6, fontSize: 19 }}>
              <span>Total</span>
              <span style={{ fontWeight: 700 }}>{money(totalCarte)}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
