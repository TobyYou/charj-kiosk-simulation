// Morris elementary-effects screening (STATS_TOOLKIT M4) for the Charj digital twin.
// Morris (1991) trajectories on a p-level grid; Campolongo et al. (2007) mu* = mean |EE|.
//   EE_i = [f(x + Δ e_i) − f(x)] / Δ   (x in unit-cube coordinates, Δ = p / (2(p−1)))
// Outputs: profitPerWeek ($/week) and rentalsPerStationDay. Each model evaluation is the mean of
// `reps` replications with the SAME seed set (baseSeed..baseSeed+reps−1) => common random numbers.
// Factors: every PARAMS entry with low < high and conf != 'FACT', except p_low_peak and p_seek,
// with the funnel product c = p_aware × p_low_peak × p_seek as ONE factor (varied via p_aware,
// STATS_TOOLKIT M7), range c ∈ [5.9e-5, 3.9e-4].
// Usage: node research/scripts/morris_screening.mjs [r=20] [reps=10] [seed=20261110]
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { replicate, stats } from '../../simulator/js/montecarlo.js';
import { SITES } from '../../simulator/js/geo.js';
import { PARAMS } from '../../simulator/js/params.js';

const r = +(process.argv[2] || 20);
const reps = +(process.argv[3] || 10);
const seed = +(process.argv[4] || 20261110);
const P_LEVELS = 4;
const DELTA = P_LEVELS / (2 * (P_LEVELS - 1)); // 2/3
const DATE = '2026-11-10';
const here = dirname(fileURLToPath(import.meta.url));
const dataDir = join(here, '..', 'data');

// ── small seeded PRNG for the design (independent of the simulator's streams) ──
function mulberry32(a) {
  return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const rand = mulberry32(seed);
const randint = n => Math.floor(rand() * n);

// ── factors ──
const funnelOther = PARAMS.p_low_peak.value * PARAMS.p_seek.value;
const C_LOW = 5.9e-5, C_HIGH = 3.9e-4;
const C_DEFAULT = PARAMS.p_aware.value * funnelOther;
const factors = [];
for (const [k, p] of Object.entries(PARAMS)) {
  if (!(p.low < p.high) || p.conf === 'FACT') continue;
  if (k === 'p_low_peak' || k === 'p_seek') continue;
  if (k === 'p_aware') {
    factors.push({ key: 'c', label: 'Funnel product c = p_aware×p_low_peak×p_seek (via p_aware)', low: C_LOW, high: C_HIGH,
      base: C_DEFAULT, conf: 'CALIBRATED', apply: (o, v) => { o.p_aware = v / funnelOther; } });
    continue;
  }
  const integer = k === 'packs_per_kiosk';
  factors.push({ key: k, label: p.label, low: p.low, high: p.high, base: p.value, conf: p.conf, integer,
    apply: (o, v) => { o[k] = integer ? Math.round(v) : v; } });
}
const k = factors.length;
const toParams = x => { const o = {}; factors.forEach((f, i) => f.apply(o, f.low + x[i] * (f.high - f.low))); return o; };

// ── model ──
const siteIds = SITES.map(s => s.id);
let nEval = 0;
function f(params, baseSeed = seed) {
  nEval++;
  const res = replicate({ siteIds, scenario: 'normal', days: 7, rebalance: true, params }, reps, null, baseSeed);
  return { profit: stats(res.map(x => x.profitPerWeek)), rps: stats(res.map(x => x.rentalsPerStationDay)) };
}

// ── Morris trajectories: x0 on grid {0,1/3,2/3,1}, factors moved once each in random order,
//    +Δ if it stays in [0,1] else −Δ (with p=4, Δ=2/3 this is always feasible) ──
function trajectory() {
  const x = Array.from({ length: k }, () => randint(P_LEVELS) / (P_LEVELS - 1));
  const order = Array.from({ length: k }, (_, i) => i);
  for (let i = k - 1; i > 0; i--) { const j = randint(i + 1); [order[i], order[j]] = [order[j], order[i]]; }
  const pts = [x.slice()], steps = [];
  for (const i of order) {
    const d = x[i] + DELTA <= 1 + 1e-12 ? DELTA : -DELTA;
    x[i] += d; pts.push(x.slice()); steps.push({ i, d });
  }
  return { pts, steps };
}

function runTrajectory(tr, baseSeed) {
  const y = tr.pts.map(x => f(toParams(x), baseSeed));
  const ee = [];
  tr.steps.forEach(({ i, d }, s) => {
    ee[i] = { profit: (y[s + 1].profit.mean - y[s].profit.mean) / d, rps: (y[s + 1].rps.mean - y[s].rps.mean) / d };
  });
  return { ee, y };
}

const t0 = Date.now();
// base point (all defaults) for scaling
const base = f({});
console.log(`Morris screening: k=${k} factors, r=${r}, p=${P_LEVELS}, Δ=${DELTA.toFixed(4)}, reps/eval=${reps}, seed=${seed}`);
console.log(`base (defaults, c=${C_DEFAULT.toExponential(2)}): profit/week $${base.profit.mean.toFixed(1)} ± ${base.profit.ci95.toFixed(1)}, rentals/station/day ${base.rps.mean.toFixed(3)} ± ${base.rps.ci95.toFixed(3)}`);

const trajs = [], EE = factors.map(() => ({ profit: [], rps: [] }));
for (let t = 0; t < r; t++) {
  const tr = trajectory();
  const { ee } = runTrajectory(tr, seed);
  trajs.push(tr);
  ee.forEach((e, i) => { EE[i].profit.push(e.profit); EE[i].rps.push(e.rps); });
  process.stderr.write(`  trajectory ${t + 1}/${r} done (${((Date.now() - t0) / 1000).toFixed(0)} s)\n`);
}
const tMain = (Date.now() - t0) / 1000;

// ── noise floor ──
// (a) CRN noise: re-run trajectory 1 with a disjoint seed set; EE differences between the two seed
//     sets estimate the Monte Carlo noise of a single EE under CRN: sd_EE ≈ sd(EE_A − EE_B)/√2.
const seedB = seed + 100000;
const { ee: eeB } = runTrajectory(trajs[0], seedB);
const dP = [], dR = [];
eeB.forEach((e, i) => { dP.push(EE[i].profit[0] - e.profit); dR.push(EE[i].rps[0] - e.rps); });
const rms = a => Math.sqrt(a.reduce((s, v) => s + v * v, 0) / a.length);
const sdEE_P = rms(dP) / Math.SQRT2, sdEE_R = rms(dR) / Math.SQRT2;
// For a factor with zero true effect, E|EE| = sqrt(2/π)·sd_EE: that is the μ* noise floor.
const floorP = Math.sqrt(2 / Math.PI) * sdEE_P, floorR = Math.sqrt(2 / Math.PI) * sdEE_R;
// (b) No-CRN (independent seed sets) floor: base point with seed set B; |Δf|/Δ.
const baseB = f({}, seedB);
const indepP = Math.SQRT2 * base.profit.se / DELTA, indepR = Math.SQRT2 * base.rps.se / DELTA;
const tTotal = (Date.now() - t0) / 1000;

// ── summarise ──
const mean = a => a.reduce((s, v) => s + v, 0) / a.length;
const sd = a => { const m = mean(a); return a.length > 1 ? Math.sqrt(a.reduce((s, v) => s + (v - m) ** 2, 0) / (a.length - 1)) : 0; };
const rows = factors.map((fa, i) => {
  const p = EE[i].profit, q = EE[i].rps;
  return { key: fa.key, conf: fa.conf, low: fa.low, high: fa.high, base: fa.base,
    muStarP: mean(p.map(Math.abs)), muP: mean(p), sigmaP: sd(p),
    muStarR: mean(q.map(Math.abs)), muR: mean(q), sigmaR: sd(q) };
}).sort((a, b) => b.muStarP - a.muStarP);
rows.forEach((x, i) => { x.rankP = i + 1; });
[...rows].sort((a, b) => b.muStarR - a.muStarR).forEach((x, i) => { x.rankR = i + 1; });
for (const x of rows) {
  x.muStarPpct = 100 * x.muStarP / base.profit.mean;
  x.ratioP = x.muStarP > 0 ? x.sigmaP / x.muStarP : 0;
  x.ratioR = x.muStarR > 0 ? x.sigmaR / x.muStarR : 0;
  x.belowFloorP = x.muStarP < 2 * floorP; x.belowFloorR = x.muStarR < 2 * floorR;
}

const fmt = (v, d = 1) => (Math.abs(v) >= 1e4 || (Math.abs(v) < 1e-3 && v !== 0)) ? v.toExponential(2) : v.toFixed(d);
console.log(`\nEE in output units per full factor range (x scaled to [0,1]). μ*% = μ*/base profit.`);
console.log(`noise floor (CRN, E|EE| of a null factor): profit $${floorP.toFixed(1)}/wk, rentals ${floorR.toFixed(4)}/stn/day; 'flag' = μ* < 2×floor`);
console.log('rank  factor                     conf        | μ*_P $/wk  μ*_P %  μ_P $/wk  σ_P $/wk σ/μ*  | μ*_R      μ_R       σ_R      σ/μ*  rkR');
for (const x of rows) {
  console.log(`${String(x.rankP).padStart(3)}   ${x.key.padEnd(26)} ${x.conf.padEnd(11)} | ${fmt(x.muStarP).padStart(9)} ${x.muStarPpct.toFixed(1).padStart(6)}% ${fmt(x.muP).padStart(9)} ${fmt(x.sigmaP).padStart(8)} ${x.ratioP.toFixed(2).padStart(5)}${x.belowFloorP ? '*' : ' '}| ${x.muStarR.toFixed(4).padStart(8)} ${x.muR.toFixed(4).padStart(9)} ${x.sigmaR.toFixed(4).padStart(8)} ${x.ratioR.toFixed(2).padStart(5)}${x.belowFloorR ? '*' : ' '} ${String(x.rankR).padStart(3)}`);
}
console.log(`\nNoise: CRN single-EE sd: profit $${sdEE_P.toFixed(1)}, rentals ${sdEE_R.toFixed(4)} (from trajectory 1 re-run with seeds ${seedB}..${seedB + reps - 1});`);
console.log(`       no-CRN reference |EE| sd: profit $${indepP.toFixed(1)}, rentals ${indepR.toFixed(4)}; base with seed set B: profit $${baseB.profit.mean.toFixed(1)} (A: ${base.profit.mean.toFixed(1)}), rentals ${baseB.rps.mean.toFixed(3)} (A: ${base.rps.mean.toFixed(3)})`);
console.log(`evaluations=${nEval}, simulation runs=${nEval * reps}, runtime main=${tMain.toFixed(0)} s, total=${tTotal.toFixed(0)} s`);

// ── save ──
const csv = ['rank_profit,factor,conf,range_low,range_high,default,mu_star_profit_usd_wk,mu_star_profit_pct_base,mu_profit_usd_wk,sigma_profit_usd_wk,sigma_over_mustar_profit,below_2x_noise_profit,rank_rps,mu_star_rps,mu_rps,sigma_rps,sigma_over_mustar_rps,below_2x_noise_rps'];
for (const x of rows) csv.push([x.rankP, x.key, x.conf, x.low, x.high, x.base, x.muStarP.toFixed(2), x.muStarPpct.toFixed(2), x.muP.toFixed(2), x.sigmaP.toFixed(2), x.ratioP.toFixed(3), x.belowFloorP, x.rankR, x.muStarR.toFixed(5), x.muR.toFixed(5), x.sigmaR.toFixed(5), x.ratioR.toFixed(3), x.belowFloorR].join(','));
const csvPath = join(dataDir, `morris_screening_${DATE}.csv`);
writeFileSync(csvPath, csv.join('\n') + '\n');

const meta = `# morris_screening_${DATE}.csv

- **What:** simulator output (not external data). Morris elementary-effects screening (Morris 1991; μ* = mean|EE| per Campolongo, Cariboni & Saltelli 2007) of the 13-station Charj network, normal week, nightly rebalancing on, for weekly profit (profitPerWeek, $/week) and rentals per station per day (rentalsPerStationDay).
- **Produced by:** \`node research/scripts/morris_screening.mjs ${r} ${reps} ${seed}\` on ${DATE}.
- **Design:** k=${k} factors, r=${r} trajectories, p=${P_LEVELS} levels, Δ=${DELTA.toFixed(4)} (in unit-cube coordinates; each factor mapped uniformly to [low, high] from params.js). Trajectory start drawn uniformly from the grid {0, 1/3, 2/3, 1}^k, factors moved once each in random order (+Δ if feasible, else −Δ). No trajectory-spread optimisation (Campolongo 2007) was applied. ${nEval} model evaluations × ${reps} reps = ${nEval * reps} simulation runs.
- **EE definition:** EE_i = [f(x + Δe_i) − f(x)]/Δ with x in [0,1]; so EE is in output units per full low→high range of the factor. μ = mean EE (sign), μ* = mean |EE|, σ = SD of EE across trajectories (high σ/μ* ⇒ nonlinear or interacting).
- **Seeds / CRN:** every evaluation is the mean of replicate(..., ${reps}, null, ${seed}) i.e. seeds ${seed}..${seed + reps - 1} (common random numbers). Design PRNG: mulberry32(${seed}).
- **Funnel:** c = p_aware × p_low_peak × p_seek is one factor (STATS_TOOLKIT M7), range ${C_LOW.toExponential(1)}–${C_HIGH.toExponential(1)} (benchmark band 0.5–3 rentals/station/day), varied via p_aware = c/(${PARAMS.p_low_peak.value}×${PARAMS.p_seek.value}); p_low_peak and p_seek held at defaults and not screened. Default c = ${C_DEFAULT.toExponential(2)}.
- **Excluded:** conf FACT parameters (price_per_hour, slots_per_kiosk, hardware_cost_set, pack_replace_cost, placement_fee, deposit, …) and any with low = high. packs_per_kiosk is rounded to an integer (grid 4, 5.33→5, 6.67→7, 8).
- **Base point (all defaults, seeds A):** profit $${base.profit.mean.toFixed(1)} ± ${base.profit.ci95.toFixed(1)}/week (95% CI), rentals ${base.rps.mean.toFixed(3)} ± ${base.rps.ci95.toFixed(3)}/station/day. μ*% = μ*_profit / base profit.
- **Noise floor:** trajectory 1 re-run with disjoint seeds ${seedB}..${seedB + reps - 1}: single-EE Monte Carlo sd under CRN ≈ $${sdEE_P.toFixed(1)}/wk (profit), ${sdEE_R.toFixed(4)} (rentals); the μ* of a null factor would be ≈ √(2/π)·sd = $${floorP.toFixed(1)} / ${floorR.toFixed(4)}. Column below_2x_noise flags μ* < 2× that. For reference, without CRN the single-EE sd would be ≈ √2·SE/Δ = $${indepP.toFixed(1)} / ${indepR.toFixed(4)}. The sd estimate comes from only k=${k} paired EEs in one trajectory, so it is itself rough (±~12%).
- **Runtime:** ${tTotal.toFixed(0)} s total (Node ${process.version}).
- **Columns:** rank_profit, factor, conf, range_low, range_high, default, mu_star_profit_usd_wk, mu_star_profit_pct_base, mu_profit_usd_wk, sigma_profit_usd_wk, sigma_over_mustar_profit, below_2x_noise_profit, rank_rps, mu_star_rps, mu_rps, sigma_rps, sigma_over_mustar_rps, below_2x_noise_rps.
- **Caveats:** Morris is a screening ranking, not a variance decomposition; r=${r} gives coarse σ. Ranges are params.js low/high, several of them ASSUMPTION; μ* scales with range width. Results are for the normal-week scenario only.
`;
writeFileSync(join(dataDir, `morris_screening_${DATE}.meta.md`), meta);
console.log(`saved ${csvPath} and .meta.md`);
