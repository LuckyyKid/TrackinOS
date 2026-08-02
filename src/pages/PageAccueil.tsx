import { useState } from 'react';
import { useFinance } from '../FinanceContext';
import {
  alertes,
  engagementPct,
  money,
  moneySigned,
  pct,
  projection,
  projectionCoussin,
  revenuMensuel,
  semaineProchaine,
  soldesCycles,
  totalDepensesMensuelles,
  totalParCategorie,
  totalSurCompte,
  utilisationCarte,
} from '../calc';
import { PageHeader, type PageId } from '../App';
import { Bar, Card, Fact } from '../ui';

export const PageAccueil = ({ go }: { go: (p: PageId) => void }) => {
  const { data } = useFinance();
  const [vue, setVue] = useState<'simple' | 'deux'>('simple');
  const soldes = soldesCycles(data);
  const alertesList = alertes(data);
  const semaine = semaineProchaine(data);

  const revenu = revenuMensuel(data);
  const depMens = totalDepensesMensuelles(data);
  const libre = revenu - depMens;

  const invest = totalParCategorie(data, 'investissement');
  const fixe = totalParCategorie(data, 'fixe');
  const surCarte = totalSurCompte(data, 'credit');
  const utilisation = utilisationCarte(data.carte);
  const projA20 = projection(data, 20).slice(-1)[0]?.valeur ?? 0;

  const cycleActuel = new Date().getDate() < data.cycles[1].jour ? 0 : 1;
  const soldeCourant = cycleActuel === 0 ? soldes.cycle1 : soldes.cycle2;

  return (
    <>
      <PageHeader
        section="Accueil"
        title="Bonjour. Voici où tu en es."
        right={
          <div className="toggle" role="tablist" aria-label="Choix de vue">
            <button
              className={'toggle__btn' + (vue === 'simple' ? ' toggle__btn--active' : '')}
              onClick={() => setVue('simple')}
              role="tab"
              aria-selected={vue === 'simple'}
            >
              Vue simple
            </button>
            <button
              className={'toggle__btn' + (vue === 'deux' ? ' toggle__btn--active' : '')}
              onClick={() => setVue('deux')}
              role="tab"
              aria-selected={vue === 'deux'}
            >
              Vue 2 paies
            </button>
          </div>
        }
      />

      {alertesList.length > 0 && (
        <Card className="card--dark" plus="none" style={{ marginBottom: 24 }}>
          <div className="section-label section-label--md on-dark-hi">À régler maintenant</div>
          <div className="stack gap-14 mt-14">
            {alertesList.map((a) => (
              <div key={a.id} className="row between center gap-16" style={{ borderTop: '1px solid #416180', paddingTop: 14 }}>
                <div className="row gap-14" style={{ alignItems: 'flex-start' }}>
                  <span style={{ width: 12, height: 12, background: '#e2705c', marginTop: 8, flex: '0 0 auto' }} />
                  <div>
                    <div className="cd" style={{ fontWeight: 700, fontSize: 'clamp(21px, 2.6vw, 27px)', textTransform: 'uppercase', lineHeight: 1.1 }}>
                      {a.titre}
                    </div>
                    <div className="on-dark" style={{ fontSize: 17, marginTop: 4 }}>{a.detail}</div>
                  </div>
                </div>
                <button className="btn btn--alert" onClick={() => go(a.cible as PageId)}>Régler</button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {vue === 'simple' ? (
        <Card className="card--pad-lg" style={{ marginBottom: 24 }}>
          <div className="section-label section-label--md">Ce que tu peux dépenser d'ici ta prochaine paie</div>
          <div className={'figure figure--xl mt-8 ' + (soldeCourant < 0 ? 'neg' : 'pos')}>
            {money(soldeCourant)}
          </div>
          <p className="help pretty">
            {soldeCourant >= 0
              ? `Tu as ${money(soldeCourant)} libres sur « ${data.cycles[cycleActuel].label} » après avoir payé toutes tes dépenses prévues.`
              : `Il manque ${money(-soldeCourant)} sur « ${data.cycles[cycleActuel].label} ». Va voir tes dépenses.`}
          </p>
          <div className="divider" />
          <div className="grid grid-auto-190 gap-20">
            <Fact label="Je place chaque mois" value={money(invest)} note="Tous tes comptes de placement" />
            <Fact label="Mes factures fixes" value={money(fixe)} note="Loyer, électricité, assurances" />
            <Fact label="Sur ma carte de crédit" value={money(surCarte)} note="À rembourser ce mois-ci" />
            <Fact label="Libre dans le mois" value={money(libre)} note="Les deux paies ensemble" />
          </div>
        </Card>
      ) : (
        <div className="grid grid-auto-320 gap-20" style={{ marginBottom: 24 }}>
          {data.cycles.map((c, i) => {
            const solde = i === 0 ? soldes.cycle1 : soldes.cycle2;
            const engag = engagementPct(data, c.id);
            return (
              <Card key={c.id} style={{ padding: 26 }}>
                <div className="section-label">Le {c.jour} de chaque mois</div>
                <div className="cd" style={{ fontWeight: 700, fontSize: 30, textTransform: 'uppercase', marginTop: 4 }}>
                  {c.label}
                </div>
                <div className="row between mt-14" style={{ fontSize: 17 }}>
                  <span>Tu reçois</span><span>{money(c.montant)}</span>
                </div>
                <div className="row between mt-6 muted" style={{ fontSize: 17 }}>
                  <span>Tu paies</span><span>{moneySigned(-(c.montant - solde))}</span>
                </div>
                <div className="divider--soft" />
                <div className="muted" style={{ fontSize: 15 }}>Il te reste</div>
                <div className={'figure figure--md ' + (solde < 0 ? 'neg' : 'pos')} style={{ marginTop: 4 }}>
                  {money(solde)}
                </div>
                <div className="mt-16"><Bar value={engag} height={16} /></div>
                <div className="subtle mt-8" style={{ fontSize: 14 }}>
                  {pct(engag)} de cette paie est déjà engagé
                </div>
              </Card>
            );
          })}
          <Card style={{ padding: 26 }} plus="tl">
            <div className="section-label">Ce mois-ci</div>
            <div className="grid grid-auto-190 gap-20 mt-14">
              <Fact label="Je place chaque mois" value={money(invest)} note="Tous tes comptes de placement" />
              <Fact label="Mes factures fixes" value={money(fixe)} note="Loyer, électricité, assurances" />
              <Fact label="Sur ma carte de crédit" value={money(surCarte)} note="À rembourser ce mois-ci" />
              <Fact label="Libre dans le mois" value={money(libre)} note="Les deux paies ensemble" />
            </div>
          </Card>
        </div>
      )}

      <div className="grid grid-auto-300 gap-20" style={{ marginBottom: 24 }}>
        <Card plus="tl">
          <div className="section-label">Ton coussin de sécurité</div>
          <div className="mt-8" style={{ fontFamily: "'Barlow Condensed'", fontWeight: 700, fontSize: 46, lineHeight: 1 }}>
            {money(data.coussin.actuel)}
          </div>
          <div className="muted mt-4">sur {money(data.coussin.objectif)}</div>
          <div className="mt-14">
            <Bar
              value={data.coussin.actuel / data.coussin.objectif}
              height={22}
              marks={[{ at: data.coussin.minimum / data.coussin.objectif }]}
            />
          </div>
          <p className="pretty mt-14" style={{ fontSize: 17 }}>
            {projectionCoussin(data) >= data.coussin.minimum
              ? `Après tes deux prochaines paies, tu aurais ${money(projectionCoussin(data))} de coussin. Au-dessus de ton minimum.`
              : `Attention : après tes deux prochaines paies, ton coussin passerait à ${money(projectionCoussin(data))}, sous ton minimum.`}
          </p>
          <div className="mt-14"><button className="btn btn--ghost" onClick={() => go('coussin')}>Voir mon coussin</button></div>
        </Card>

        <Card plus="br">
          <div className="section-label">Ce qui sort cette semaine</div>
          <div className="row-list mt-14">
            {semaine.length === 0 && (
              <div className="muted" style={{ fontSize: 17 }}>Rien de prévu dans les 7 prochains jours.</div>
            )}
            {semaine.map((s, i) => (
              <div key={i} className="row-item">
                <div><span className="subtle" style={{ marginRight: 8 }}>{s.jourTxt}</span>{s.nom}</div>
                <div style={{ fontWeight: 700 }}>{moneySigned(s.montant)}</div>
              </div>
            ))}
          </div>
          <div className="mt-14"><button className="btn btn--ghost" onClick={() => go('calendrier')}>Voir les 30 jours</button></div>
        </Card>
      </div>

      <div className="grid grid-auto-240" style={{ gap: 14 }}>
        <button
          onClick={() => go('depenses')}
          style={{ textAlign: 'left', background: '#5980a6', color: '#fff', border: '1px solid #5980a6', padding: 22, cursor: 'pointer' }}
        >
          <span className="cd" style={{ display: 'block', fontWeight: 700, fontSize: 26, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Ajouter une dépense
          </span>
          <span style={{ display: 'block', fontSize: 16, marginTop: 4, color: '#d6ebff' }}>
            3 questions, c'est tout
          </span>
        </button>
        <button
          onClick={() => go('carte')}
          className="card"
          style={{ textAlign: 'left', padding: 22, cursor: 'pointer', background: 'transparent' }}
        >
          <span className="cd" style={{ display: 'block', fontWeight: 700, fontSize: 26, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Ma carte de crédit
          </span>
          <span className="muted" style={{ display: 'block', fontSize: 16, marginTop: 4 }}>
            {pct(utilisation)} utilisé
          </span>
        </button>
        <button
          onClick={() => go('avenir')}
          className="card"
          style={{ textAlign: 'left', padding: 22, cursor: 'pointer', background: 'transparent' }}
        >
          <span className="cd" style={{ display: 'block', fontWeight: 700, fontSize: 26, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Mon avenir
          </span>
          <span className="muted" style={{ display: 'block', fontSize: 16, marginTop: 4 }}>
            Dans 20 ans : {money(projA20)}
          </span>
        </button>
      </div>
    </>
  );
};
