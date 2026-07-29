import assert from 'node:assert/strict';
import {
  analysePortefeuille,
  paiementPour30,
  paiementPourZero,
  projection,
  projectionCoussin,
  rendementMensuel,
  soldeCycle,
  soldesCycles,
  utilisationCarte,
  utilisationCarteProjetee,
} from '../src/calc.ts';
import { DEFAULT_DATA } from '../src/types.ts';

let passed = 0;
let failed = 0;
const t = (name: string, fn: () => void) => {
  try {
    fn();
    passed++;
    console.log('  \u2713 ' + name);
  } catch (e) {
    failed++;
    console.log('  \u2717 ' + name);
    console.log('    ' + (e as Error).message);
  }
};

console.log('\n[calc]');

t('soldeCycle subtracts active expenses for that cycle', () => {
  const s = soldeCycle(DEFAULT_DATA.cycles[0], DEFAULT_DATA.depenses);
  // paie 1 = 2340; cycle1 deps + deux
  const attendu =
    2340 - (1150 + 78 + 85 + 55 + 45 + 400 + 260); // cycle1 + les deux (Épicerie)
  assert.equal(s, attendu);
});

t('soldeCycle ignores paused expenses', () => {
  const data = {
    ...DEFAULT_DATA,
    depenses: DEFAULT_DATA.depenses.map((d) =>
      d.id === 'd1' ? { ...d, actif: false } : d,
    ),
  };
  const s = soldeCycle(data.cycles[0], data.depenses);
  const attendu = 2340 - (78 + 85 + 55 + 45 + 400 + 260); // loyer paused
  assert.equal(s, attendu);
});

t('projectionCoussin adds both cycle balances', () => {
  const s = soldesCycles(DEFAULT_DATA);
  assert.equal(projectionCoussin(DEFAULT_DATA), DEFAULT_DATA.coussin.actuel + s.cycle1 + s.cycle2);
});

t('utilisationCarte simple ratio', () => {
  assert.equal(utilisationCarte(DEFAULT_DATA.carte), 1740 / 5000);
});

t('utilisationCarteProjetee adds credit-card expenses', () => {
  const surCarte = 85 + 55 + 45 + 260 + 120 + 32 + 180; // internet, cell, gym, épicerie, essence, netflix, restos
  assert.equal(utilisationCarteProjetee(DEFAULT_DATA), (1740 + surCarte) / 5000);
});

t('paiementPour30 keeps you under 30%', () => {
  const p = paiementPour30(DEFAULT_DATA.carte);
  assert.equal(p, Math.max(0, 1740 - 5000 * 0.30));
});

t('paiementPourZero equals full balance', () => {
  assert.equal(paiementPourZero(DEFAULT_DATA.carte), 1740);
});

t('rendementMensuel matches compound formula', () => {
  const r = rendementMensuel(6.5);
  assert.ok(Math.abs(r - (Math.pow(1.065, 1 / 12) - 1)) < 1e-12);
});

t('projection grows value across months', () => {
  const p = projection(DEFAULT_DATA, 5);
  assert.equal(p.length, 6); // year 0 + 5 yearly points
  assert.ok(p[5].valeur > p[0].valeur);
  assert.ok(p[5].investi > p[0].investi);
  assert.ok(p[5].valeur >= p[5].investi, 'value must include gains');
});

t('portefeuille: prorata when needs exceed contribution', () => {
  const data = {
    ...DEFAULT_DATA,
    // make positions massively under target so needs sum >> contribution
    holdings: DEFAULT_DATA.holdings.map((h) => ({ ...h, actions: 1, prix: 1 })),
  };
  const { positions, prochaineContribution } = analysePortefeuille(data);
  const totalAchat = positions.reduce((s, p) => s + p.achat, 0);
  assert.ok(Math.abs(totalAchat - prochaineContribution) < 1e-6, 'sum of achat == contribution');
  positions.forEach((p) => assert.ok(p.achat >= 0));
});

t('portefeuille: no achat when already balanced', () => {
  // Cibles définies globalement par ticker (nouveau modèle)
  const cibleParTicker = new Map<string, number>();
  DEFAULT_DATA.cibles.forEach((c) => cibleParTicker.set(c.ticker, c.part));
  // On garde uniquement les tickers avec une cible (le CELI enfant XEQT n'en a pas)
  const holdings = DEFAULT_DATA.holdings
    .filter((h) => cibleParTicker.has(h.ticker))
    .map((h) => ({
      ...h,
      actions: (cibleParTicker.get(h.ticker) ?? 0) * 1000,
      prix: 1,
    }));
  const data = { ...DEFAULT_DATA, holdings };
  const { positions } = analysePortefeuille(data);
  positions.forEach((p) => {
    if (p.cible > 0) assert.ok(!p.aCorriger, `${p.ticker} should be within tolerance`);
  });
});

console.log(`\n${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
