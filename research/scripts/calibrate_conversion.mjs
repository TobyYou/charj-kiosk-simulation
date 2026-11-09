// Joint calibration of the demand funnel (STATS_TOOLKIT M7).
// The engine's arrival rate is λ = footfall × hourShare × p_aware × p_low(h) × p_seek, so the
// three funnel parameters are identified only through their product
//   c = p_aware × p_low_peak × p_seek   (renters per passer-by at the evening peak).
// This script (1) checks that outputs depend on c only, by reaching the same c via p_aware vs
// p_low_peak, and (2) sweeps c to find the range that keeps rentals/station/day inside the
// 0.5–3 benchmark band (Brick, ChargeSPOT, Recharge.city).
// Usage: node research/scripts/calibrate_conversion.mjs [reps]
import { replicate, stats } from '../../simulator/js/montecarlo.js';
import { SITES } from '../../simulator/js/geo.js';
import { PARAMS } from '../../simulator/js/params.js';

const reps = +(process.argv[2] || 30);
const siteIds = SITES.map(s => s.id);
const base = { aw: PARAMS.p_aware.value, low: PARAMS.p_low_peak.value, seek: PARAMS.p_seek.value };
const c0 = base.aw * base.low * base.seek;
const run = params => {
  const r = replicate({ siteIds, scenario: 'normal', days: 7, rebalance: true, params }, reps);
  const s = k => stats(r.map(x => x[k]));
  return { rps: s('rentalsPerStationDay'), profit: s('profitPerWeek'), unmetEmpty: s('unmetEmpty').mean };
};

console.log(`stations=${siteIds.length} reps=${reps}; default c = ${base.aw} × ${base.low} × ${base.seek} = ${c0.toExponential(3)}`);
console.log('\n(1) Identification check: same c reached two ways');
console.log('mult,c,via,rentals_per_station_day,profit_per_week');
for (const m of [0.5, 1, 2]) {
  const viaAware = run({ p_aware: base.aw * m });
  const viaLow = run({ p_low_peak: base.low * m });
  console.log(`${m},${(c0 * m).toExponential(3)},p_aware,${viaAware.rps.mean.toFixed(3)},${viaAware.profit.mean.toFixed(0)}`);
  console.log(`${m},${(c0 * m).toExponential(3)},p_low_peak,${viaLow.rps.mean.toFixed(3)},${viaLow.profit.mean.toFixed(0)}`);
}

console.log('\n(2) Sweep of c (varied via p_aware; p_low_peak and p_seek at defaults)');
console.log('c,rentals_per_station_day,ci95,profit_per_week,ci95,unmet_empty');
for (const m of [0.2, 0.3, 0.4, 0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3]) {
  const o = run({ p_aware: base.aw * m });
  console.log(`${(c0 * m).toExponential(3)},${o.rps.mean.toFixed(3)},${o.rps.ci95.toFixed(3)},${o.profit.mean.toFixed(0)},${o.profit.ci95.toFixed(0)},${o.unmetEmpty.toFixed(1)}`);
}
