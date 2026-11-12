// Simulator price response vs comparables (queue item: check the WTP logistic against P075).
// Runs the 13-station normal week at several hourly prices (CRN: same seeds at every price) and
// reports rentals/station/day, revenue per rental and the arc elasticity of rentals w.r.t. price
// between consecutive prices, plus the analytic point elasticity of the acceptance logistic:
//   p(P) = 1 / (1 + exp(s (P − m)))   ⇒   ε(P) = d ln p / d ln P = −s · P · (1 − p(P))
// Usage: node research/scripts/price_elasticity_check.mjs [reps=30] [seed=20261112]
import { replicate, stats } from '../../simulator/js/montecarlo.js';
import { SITES } from '../../simulator/js/geo.js';
import { PARAMS } from '../../simulator/js/params.js';

const reps = +(process.argv[2] || 30), seed = +(process.argv[3] || 20261112);
const siteIds = SITES.map(s => s.id);
const s = 2.0, m = PARAMS.wtp_mid_hourly.value; // slope hard-coded in engine.js (pAccept)
const prices = [1.0, 1.5, 2.0, 2.5, 3.0];
const rows = prices.map(P => {
  const res = replicate({ siteIds, scenario: 'normal', days: 7, rebalance: true, params: { price_per_hour: P } }, reps, null, seed);
  const g = k => stats(res.map(x => x[k])).mean;
  const pAcc = 1 / (1 + Math.exp(s * (P - m)));
  return { P, rps: g('rentalsPerStationDay'), rev: g('revenuePerWeek'), profit: g('profitPerWeek'), declined: g('declinedPrice'),
    pAcc, epsPoint: -s * P * (1 - pAcc) };
});
console.log(`wtp_mid_hourly m=${m}, slope s=${s}; reps=${reps}, seed=${seed} (CRN across prices)`);
console.log('price  rentals/stn/day  revenue/wk  profit/wk  declined/wk  p_accept  eps_point  eps_arc(vs prev)');
rows.forEach((r, i) => {
  let arc = '';
  if (i > 0) { const q = rows[i - 1]; arc = (((r.rps - q.rps) / ((r.rps + q.rps) / 2)) / ((r.P - q.P) / ((r.P + q.P) / 2))).toFixed(3); }
  console.log(`${r.P.toFixed(2).padStart(5)}  ${r.rps.toFixed(3).padStart(15)}  ${r.rev.toFixed(0).padStart(10)}  ${r.profit.toFixed(0).padStart(9)}  ${r.declined.toFixed(1).padStart(11)}  ${r.pAcc.toFixed(3).padStart(8)}  ${r.epsPoint.toFixed(3).padStart(9)}  ${arc.padStart(8)}`);
});
// wtp_mid that would give a target point elasticity ε* at price P: 1−p = ε*/(−sP) ⇒ m = P + ln((1−q)/q)/s with q = 1−p
for (const P of [1, 2]) for (const e of [-0.3, -0.8, -1.0]) {
  const oneMinusP = -e / (s * P);
  if (oneMinusP >= 1) { console.log(`P=$${P}: ε=${e} unreachable with slope ${s}`); continue; }
  const p = 1 - oneMinusP;
  console.log(`P=$${P}/hr: ε=${e} needs wtp_mid = ${(P + Math.log(p / (1 - p)) / s).toFixed(2)}`);
}
