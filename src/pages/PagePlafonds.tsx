import { useFinance } from '../FinanceContext';
import { money } from '../calc';
import { PageHeader } from '../App';
import { Bar, Card } from '../ui';

export const PagePlafonds = () => {
  const { data } = useFinance();
  const comptes = data.comptes.filter((c) => c.plafondAnnuel > 0);

  return (
    <>
      <PageHeader
        section="Limites"
        title="Mes plafonds"
        help="Le gouvernement limite combien tu peux mettre dans ces comptes. Dépasser coûte une pénalité. Voici la place qu'il te reste."
      />

      <div className="stack gap-20" style={{ marginBottom: 24 }}>
        {comptes.map((c) => {
          const restantAnnuel = c.plafondAnnuel - c.annee;
          const enTrop = restantAnnuel < 0;
          const proche = restantAnnuel >= 0 && restantAnnuel < 1000;
          const couleur = enTrop ? '#a4402f' : proche ? '#a4402f' : '#5980a6';
          const bd = enTrop || proche ? '#e2705c' : '#cfd3d7';
          const bg = enTrop || proche ? '#fbf1ee' : 'transparent';
          const etat = enTrop ? 'Plafond dépassé' : proche ? 'Presque plein' : 'Il reste de la place';
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
                  {enTrop
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
