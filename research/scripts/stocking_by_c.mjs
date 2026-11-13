// Optimal stocking (packs_per_kiosk) per demand level c (queue item 2: stocking × demand interaction, Sobol 2026-11-12).
// For each c on a grid, runs the 13-station normal week at packs_per_kiosk = 4..8 with common random numbers and
// reports profit/week ± se, the profit-maximising packs, and the regret of fixing packs at the params.js default.
// Usage: node research/scripts/stocking_by_c.mjs [reps=20] [seed=20261113] [wtp_mid]
import { replicate, stats } from '../../simulator/js/montecarlo.js';
import { SITES } from '../../simulator/js/geo.js';
import { PARAMS } from '../../simulator/js/params.js';

const reps = +(process.argv[2] || 20), seed = +(process.argv[3] || 20261113);
const wtp = process.argv[4] ? +process.argv[4] : PARAMS.wtp_mid_hourly.value;
const siteIds = SITES.map(s => s.id);
const funnelOther = PARAMS.p_low_peak.value * PARAMS.p_seek.value;
const C = [6e-5, 1e-4, 1.5e-4, 2e-4, 2.5e-4, 3e-4, 3.6e-4];
const PACKS = [4, 5, 6, 7, 8];
const def = PARAMS.packs_per_kiosk.value;
console.log(`wtp_mid=${wtp}; reps=${reps}; default packs=${def}`);
console.log('c,' + PACKS.map(k => `profit_k${k}`).join(',') + ',best_k,profit_best,regret_default,rps_best,unmet_empty_best');
for (const c of C) {
  const r = PACKS.map(k => replicate({ siteIds, scenario: 'normal', days: 7, rebalance: true,
    params: { p_aware: c / funnelOther, packs_per_kiosk: k, wtp_mid_hourly: wtp } }, reps, null, seed));
  const pm = r.map(x => stats(x.map(y => y.profitPerWeek)).mean);
  const bi = pm.indexOf(Math.max(...pm));
  const rps = stats(r[bi].map(y => y.rentalsPerStationDay)).mean;
  const ue = stats(r[bi].map(y => y.unmetEmpty)).mean;
  console.log([c.toExponential(2), ...pm.map(v => v.toFixed(0)), PACKS[bi], pm[bi].toFixed(0),
    (pm[bi] - pm[PACKS.indexOf(def)]).toFixed(0), rps.toFixed(2), ue.toFixed(1)].join(','));
}
