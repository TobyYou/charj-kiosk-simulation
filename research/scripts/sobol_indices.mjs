// Sobol variance-based sensitivity (STATS_TOOLKIT M4, step 2 after Morris) for the Charj digital twin.
// Saltelli (2010) sampling: matrices A, B (N×k, iid uniform), AB_i = A with column i from B.
//   First-order  S_i  = mean( f(B) · (f(AB_i) − f(A)) ) / Var(Y)          (Saltelli et al. 2010, eq. b)
//   Total-order  ST_i = mean( (f(A) − f(AB_i))^2 ) / (2 Var(Y))           (Jansen 1999)
// Var(Y) from the pooled f(A) ∪ f(B). CIs: bootstrap over the N rows (B_boot resamples).
// Each model evaluation = mean of `reps` replications with the SAME seed set (CRN), 7-day normal week,
// 13-station network, nightly rebalancing on (same model as morris_screening.mjs).
// Factors: the top-8 Morris factors of 2026-11-11 (others held at params.js defaults), each uniform on
// params.js [low, high]; c = p_aware×p_low_peak×p_seek varied via p_aware (STATS_TOOLKIT M7).
// Usage: node research/scripts/sobol_indices.mjs [N=256] [reps=6] [seed=20261112] [date=today]
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { replicate } from '../../simulator/js/montecarlo.js';
import { SITES } from '../../simulator/js/geo.js';
import { PARAMS } from '../../simulator/js/params.js';

const N = +(process.argv[2] || 256);
const reps = +(process.argv[3] || 6);
const seed = +(process.argv[4] || 20261112);
const DATE = process.argv[5] || new Date().toISOString().slice(0, 10);
const BOOT = 500;
const here = dirname(fileURLToPath(import.meta.url));
const dataDir = join(here, '..', 'data');

function mulberry32(a) {
  return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const rand = mulberry32(seed);

const funnelOther = PARAMS.p_low_peak.value * PARAMS.p_seek.value;
const C_LOW = 5.9e-5, C_HIGH = 3.9e-4;
const KEYS = (process.env.SOBOL_FACTORS || 'c,packs_per_kiosk,host_share,rebalance_cost,forfeit_churn_cost,away_return_median_h,forfeit_dispute_rate,p_stay').split(',');
const factors = KEYS.map(key => {
  if (key === 'c') return { key, low: C_LOW, high: C_HIGH, base: PARAMS.p_aware.value * funnelOther,
    apply: (o, v) => { o.p_aware = v / funnelOther; } };
  const p = PARAMS[key];
  if (!p) throw new Error(`unknown factor ${key}`);
  const integer = key === 'packs_per_kiosk';
  // integer factor: map u∈[0,1) to equal-probability integers low..high
  return { key, low: p.low, high: p.high, base: p.value, integer,
    apply: (o, u01) => { o[key] = integer ? Math.min(p.high, p.low + Math.floor(u01 * (p.high - p.low + 1))) : p.low + u01 * (p.high - p.low); } };
});
const k = factors.length;
const toParams = u => { const o = {}; factors.forEach((f, i) => {
  if (f.key === 'c') f.apply(o, C_LOW + u[i] * (C_HIGH - C_LOW)); else f.apply(o, u[i]); }); return o; };

const siteIds = SITES.map(s => s.id);
let nEval = 0;
function f(u) {
  nEval++;
  const res = replicate({ siteIds, scenario: 'normal', days: 7, rebalance: true, params: toParams(u) }, reps, null, seed);
  const m = a => a.reduce((s, v) => s + v, 0) / a.length;
  return { profit: m(res.map(x => x.profitPerWeek)), rps: m(res.map(x => x.rentalsPerStationDay)) };
}

const t0 = Date.now();
const A = Array.from({ length: N }, () => Array.from({ length: k }, rand));
const B = Array.from({ length: N }, () => Array.from({ length: k }, rand));
const fA = [], fB = [], fAB = factors.map(() => []);
for (let j = 0; j < N; j++) {
  fA.push(f(A[j])); fB.push(f(B[j]));
  for (let i = 0; i < k; i++) { const u = A[j].slice(); u[i] = B[j][i]; fAB[i].push(f(u)); }
  if ((j + 1) % 16 === 0) process.stderr.write(`  row ${j + 1}/${N} (${((Date.now() - t0) / 1000).toFixed(0)} s)\n`);
}

function indices(out, rows) {
  const ya = rows.map(j => fA[j][out]), yb = rows.map(j => fB[j][out]);
  const all = ya.concat(yb), mu = all.reduce((s, v) => s + v, 0) / all.length;
  const V = all.reduce((s, v) => s + (v - mu) ** 2, 0) / (all.length - 1);
  return factors.map((_, i) => {
    let s1 = 0, st = 0;
    rows.forEach((j, r) => { const yab = fAB[i][j][out]; s1 += yb[r] * (yab - ya[r]); st += (ya[r] - yab) ** 2; });
    return { S1: s1 / rows.length / V, ST: st / rows.length / (2 * V), V, mu };
  });
}
const allRows = Array.from({ length: N }, (_, j) => j);
const brand = mulberry32(seed + 7);
const q = (a, p) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
const summary = {};
for (const out of ['profit', 'rps']) {
  const point = indices(out, allRows);
  const boots = factors.map(() => ({ S1: [], ST: [] }));
  for (let b = 0; b < BOOT; b++) {
    const rows = allRows.map(() => Math.floor(brand() * N));
    indices(out, rows).forEach((x, i) => { boots[i].S1.push(x.S1); boots[i].ST.push(x.ST); });
  }
  summary[out] = point.map((x, i) => ({ ...x, S1lo: q(boots[i].S1, 0.025), S1hi: q(boots[i].S1, 0.975), STlo: q(boots[i].ST, 0.025), SThi: q(boots[i].ST, 0.975) }));
}
const tTotal = (Date.now() - t0) / 1000;

const P = summary.profit, R = summary.rps;
console.log(`Sobol (Saltelli 2010 / Jansen), k=${k}, N=${N}, reps/eval=${reps}, seed=${seed}, evals=${nEval}, runs=${nEval * reps}, ${tTotal.toFixed(0)} s`);
console.log(`profit/week: mean $${P[0].mu.toFixed(1)}, SD $${Math.sqrt(P[0].V).toFixed(1)};  rentals/station/day: mean ${R[0].mu.toFixed(3)}, SD ${Math.sqrt(R[0].V).toFixed(3)}`);
console.log('factor                  | S1_profit [95% CI]        ST_profit [95% CI]        | S1_rps   ST_rps');
const order = factors.map((_, i) => i).sort((a, b) => P[b].ST - P[a].ST);
for (const i of order) {
  const p = P[i], r = R[i];
  console.log(`${factors[i].key.padEnd(23)} | ${p.S1.toFixed(3).padStart(6)} [${p.S1lo.toFixed(3)}, ${p.S1hi.toFixed(3)}]  ${p.ST.toFixed(3).padStart(6)} [${p.STlo.toFixed(3)}, ${p.SThi.toFixed(3)}]  | ${r.S1.toFixed(3).padStart(6)} ${r.ST.toFixed(3).padStart(6)}`);
}
console.log(`sum S1 (profit) = ${P.reduce((s, x) => s + x.S1, 0).toFixed(3)}  (1 − ΣS1 ≈ share of variance from interactions)`);

const csv = ['factor,range_low,range_high,default,S1_profit,S1_profit_lo95,S1_profit_hi95,ST_profit,ST_profit_lo95,ST_profit_hi95,S1_rps,S1_rps_lo95,S1_rps_hi95,ST_rps,ST_rps_lo95,ST_rps_hi95'];
for (const i of order) { const p = P[i], r = R[i], fa = factors[i];
  csv.push([fa.key, fa.low, fa.high, fa.base, p.S1, p.S1lo, p.S1hi, p.ST, p.STlo, p.SThi, r.S1, r.S1lo, r.S1hi, r.ST, r.STlo, r.SThi].map(v => typeof v === 'number' ? +v.toFixed(4) : v).join(',')); }
writeFileSync(join(dataDir, `sobol_indices_${DATE}.csv`), csv.join('\n') + '\n');
writeFileSync(join(dataDir, `sobol_indices_${DATE}.meta.md`), `# sobol_indices_${DATE}.csv

- **What:** simulator output (not external data). Variance-based (Sobol) sensitivity of weekly profit ($/week) and rentals per station per day for the 13-station Charj network, normal week, nightly rebalancing on.
- **Produced by:** \`node research/scripts/sobol_indices.mjs ${N} ${reps} ${seed}\` on ${DATE}; ${nEval} model evaluations × ${reps} reps = ${nEval * reps} simulation runs, ${tTotal.toFixed(0)} s.
- **Design:** Saltelli (2010) A/B/AB_i scheme with iid uniform samples (mulberry32(${seed})); first-order S1 by Saltelli 2010 estimator, total ST by Jansen (1999). 95% CIs: ${BOOT} bootstrap resamples of the N rows. Each evaluation is the mean of ${reps} replications with a fixed seed set (CRN), so residual Monte Carlo noise is partly absorbed into the inputs' effect; with CRN it is small relative to the factor variance.
- **Factors (k=${k}):** top-8 by Morris μ* on 2026-11-11, uniform over params.js [low, high]: ${factors.map(f => `${f.key} [${f.low}, ${f.high}]`).join('; ')}. c varied via p_aware = c/(p_low_peak×p_seek). packs_per_kiosk uniform over integers ${PARAMS.packs_per_kiosk.low}..${PARAMS.packs_per_kiosk.high}. All other parameters fixed at defaults, so indices are shares of the variance *generated by these 8 factors*, not of all uncertainty.
- **Output summary:** profit mean $${P[0].mu.toFixed(1)}/wk, SD $${Math.sqrt(P[0].V).toFixed(1)}; rentals mean ${R[0].mu.toFixed(3)}, SD ${Math.sqrt(R[0].V).toFixed(3)}. ΣS1 (profit) = ${P.reduce((s, x) => s + x.S1, 0).toFixed(3)}.
- **Caveats:** uniform ranges are mostly ASSUMPTION widths, and indices scale with them. Estimator negatives near 0 are sampling noise. Normal-week scenario only.
`);
console.log('saved research/data/sobol_indices_' + DATE + '.csv and .meta.md');
