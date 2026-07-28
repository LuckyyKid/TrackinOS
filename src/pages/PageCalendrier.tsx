import { useFinance } from '../FinanceContext';
import { money } from '../calc';
import { PageHeader } from '../App';

export const PageCalendrier = () => {
  const { data } = useFinance();
  const today = new Date();
  const aujourdhui = today.getDate();

  const jours = Array.from({ length: 30 }, (_, i) => i + 1);

  return (
    <>
      <PageHeader
        section="30 prochains jours"
        title="Mon calendrier"
        help="Bleu foncé : tu reçois de l'argent. Les lignes en dessous : l'argent qui sort ce jour-là."
      />

      <div className="cal">
        {jours.map((n) => {
          const paie = data.cycles.find((c) => c.jour === n);
          const deps = data.depenses.filter((d) => d.actif && d.jour === n);
          const cls =
            'cal__cell' +
            (paie ? ' cal__cell--paie' : n === aujourdhui ? ' cal__cell--today' : '');
          const marque = paie ? 'Paie' : n === aujourdhui ? "Aujourd'hui" : '';
          return (
            <div key={n} className={cls}>
              <div className="row between baseline">
                <div className="cal__num">{n}</div>
                {marque && <div className="cal__marque">{marque}</div>}
              </div>
              {paie && <div className="cal__paie-txt">+ {money(paie.montant)}</div>}
              {deps.length > 0 && (
                <div className="cal__list">
                  {deps.map((d) => `${d.nom}  − ${money(d.montant).replace('$', '$')}`).join('\n')}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
};
