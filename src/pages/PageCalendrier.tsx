import { useFinance } from '../FinanceContext';
import { money } from '../calc';
import { PageHeader } from '../App';

const MOIS_COURT = ['jan', 'fév', 'mar', 'avr', 'mai', 'juin', 'juil', 'août', 'sep', 'oct', 'nov', 'déc'];

export const PageCalendrier = () => {
  const { data } = useFinance();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const aujourdhuiTs = today.getTime();

  // 30 vrais prochains jours à partir d'aujourd'hui — traverse les mois automatiquement
  const dates = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d;
  });

  return (
    <>
      <PageHeader
        section="30 prochains jours"
        title="Mon calendrier"
        help="Tes paies et tes dépenses fixes reviennent tout seuls chaque mois selon le jour saisi. Ce calendrier montre ce qui s'en vient à partir d'aujourd'hui."
      />

      <div className="cal">
        {dates.map((d) => {
          const jour = d.getDate();
          const mois = d.getMonth();
          const paie = data.cycles.find((c) => c.jour === jour);
          const deps = data.depenses.filter((x) => x.actif && x.jour === jour);
          const estAujourdhui = d.getTime() === aujourdhuiTs;
          const cls =
            'cal__cell' +
            (paie ? ' cal__cell--paie' : estAujourdhui ? ' cal__cell--today' : '');
          const marque = paie ? 'Paie' : estAujourdhui ? "Aujourd'hui" : '';
          return (
            <div key={d.toISOString()} className={cls}>
              <div className="row between baseline">
                <div className="cal__num">
                  {jour}
                  <span className="subtle" style={{ fontSize: 11, marginLeft: 4 }}>
                    {MOIS_COURT[mois]}
                  </span>
                </div>
                {marque && <div className="cal__marque">{marque}</div>}
              </div>
              {paie && <div className="cal__paie-txt">+ {money(paie.montant)}</div>}
              {deps.length > 0 && (
                <div className="cal__list">
                  {deps.map((x) => `${x.nom}  − ${money(x.montant)}`).join('\n')}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
};
