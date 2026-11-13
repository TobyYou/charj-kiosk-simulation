// Joint calibration of the conversion factor c and the WTP midpoint wtp_mid_hourly (queue item 1, P055/P088).
// Two targets (STATS_TOOLKIT M10, history matching):
//   (a) rentals/station/day at today's price ($1/hr) — benchmark band 0.5–3, price-matched anchor
//       ChargeSPOT Australia 0.48–0.84 (≈US$7–8/rental, so Charj at $1/hr should sit at or above it);
//   (b) arc price elasticity of rentals between $1.00 and $2.00/hr in [−1.0, −0.3] (P075, P088).
// For each (c, wtp_mid) grid point the 13-station normal week is run at $1.00, $1.50 and $2.00/hr with the
// SAME seeds (common random numbers), so elasticity is a paired difference and MC noise is small.
// Implausibility on the log scale (Vernon, Goldstein & Bower 2010; Andrianakis et al. 2015):
//   I_k(x) = |z_k − E[f_k(x)]| / sqrt(V_obs,k + V_disc,k + V_mc,k(x))       cut-off 3 (Pukelsheim 3σ)
//   rentals: z = ln(1.22) (log-centre of 0.5–3), V_obs = (ln 6 / 4)^2 (band = ±2σ), V_disc = 0.2^2
//   elasticity: z = −0.6, V_obs = 0.2^2 (range −1.0…−0.3 ≈ ±2σ, rounded), V_disc = 0.1^2
// Output: CSV to stdout (and research/data/joint_calibration_c_wtp_<date>.csv when a date is given).
// Usage: node research/scripts/joint_calibration_c_wtp.mjs [reps=20] [seed=20261113] [date]
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { replicate, stats } from '../../simulator/js/montecarlo.js';
import { SITES } from '../../simulator/js/geo.js';
import { PARAMS } from '../../simulator/js/params.js';

const reps = +(process.argv[2] || 20), seed = +(process.argv[3] || 20261113), DATE = process.argv[4];
const siteIds = SITES.map(s => s.id);
const funnelOther = PARAMS.p_low_peak.value * PARAMS.p_seek.value;
const C = [6e-5, 1e-4, 1.5e-4, 2e-4, 2.5e-4, 3e-4, 3.6e-4];
const W = [1.25, 1.5, 1.75, 2.0, 2.5, 3.0, 4.0];
const PRICES = [1.0, 1.5, 2.0];
const Z_R = Math.log(Math.sqrt(0.5 * 3)), V_R = (Math.log(6) / 4) ** 2 + 0.2 ** 2;
const Z_E = -0.6, V_E = 0.2 ** 2 + 0.1 ** 2;
const arc = (q0, q1, p0, p1) => ((q1 - q0) / ((q1 + q0) / 2)) / ((p1 - p0) / ((p1 + p0) / 2));

const rows = ['c,wtp_mid,rps_1,rps_1_se,rps_2,eps_arc_1to2,eps_arc_se,profit_1,profit_1_se,profit_1p5,profit_2,best_price,I_rentals,I_elasticity,I_max,non_implausible'];
const t0 = Date.now();
for (const c of C) for (const w of W) {
  const res = PRICES.map(P => replicate({ siteIds, scenario: 'normal', days: 7, rebalance: true,
    params: { p_aware: c / funnelOther, wtp_mid_hourly: w, price_per_hour: P } }, reps, null, seed));
  const rps = res.map(r => r.map(x => x.rentalsPerStationDay));
  const prof = res.map(r => r.map(x => x.profitPerWeek));
  // paired (CRN) elasticity per seed, then mean ± se
  const epsSeed = rps[0].map((q0, i) => arc(q0, rps[2][i], 1.0, 2.0)).filter(Number.isFinite);
  const e = stats(epsSeed), r1 = stats(rps[0]), r2 = stats(rps[2]), p1 = stats(prof[0]);
  const pm = prof.map(p => stats(p).mean);
  const best = PRICES[pm.indexOf(Math.max(...pm))];
  const lr = Math.log(Math.max(r1.mean, 1e-3));
  const vmcR = (r1.se / Math.max(r1.mean, 1e-3)) ** 2; // delta method on log scale
  const IR = Math.abs(lr - Z_R) / Math.sqrt(V_R + vmcR);
  const IE = Math.abs(e.mean - Z_E) / Math.sqrt(V_E + e.se ** 2);
  const Imax = Math.max(IR, IE);
  rows.push([c.toExponential(2), w, r1.mean.toFixed(3), r1.se.toFixed(3), r2.mean.toFixed(3), e.mean.toFixed(3), e.se.toFixed(3),
    p1.mean.toFixed(0), p1.se.toFixed(0), pm[1].toFixed(0), pm[2].toFixed(0), best, IR.toFixed(2), IE.toFixed(2), Imax.toFixed(2), Imax <= 3 ? 1 : 0].join(','));
}
const out = rows.join('\n') + '\n';
process.stdout.write(out);
console.error(`${C.length * W.length} grid points × ${PRICES.length} prices × ${reps} reps in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
if (DATE) {
  const f = join(dirname(fileURLToPath(import.meta.url)), '..', 'data', `joint_calibration_c_wtp_${DATE}.csv`);
  writeFileSync(f, out); console.error('saved ' + f);
}
