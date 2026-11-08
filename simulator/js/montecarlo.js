// Monte Carlo layer: replications, layout comparison (common random numbers), sensitivity.
import { Simulation } from './engine.js';
import { PARAMS } from './params.js';

export function runOnce(cfg, seed) {
  const sim = new Simulation({ ...cfg, seed, onEvent: null });
  sim.run();
  return sim.summary();
}

export function stats(xs) {
  const n = xs.length;
  const mean = xs.reduce((a, b) => a + b, 0) / n;
  const sd = n > 1 ? Math.sqrt(xs.reduce((a, b) => a + (b - mean) ** 2, 0) / (n - 1)) : 0;
  const s = [...xs].sort((a, b) => a - b);
  const q = p => s[Math.min(n - 1, Math.max(0, Math.round(p * (n - 1))))];
  return { n, mean, sd, se: sd / Math.sqrt(n), ci95: 1.96 * sd / Math.sqrt(n), p10: q(0.1), p50: q(0.5), p90: q(0.9), min: s[0], max: s[n - 1],
           pPositive: xs.filter(x => x > 0).length / n };
}

// Run `reps` replications; calls onProgress(i, summaries) as it goes.
export function replicate(cfg, reps, onProgress, baseSeed = 1000) {
  const out = [];
  for (let i = 0; i < reps; i++) {
    out.push(runOnce(cfg, baseSeed + i));
    if (onProgress && (i % 5 === 4 || i === reps - 1)) onProgress(i + 1, out);
  }
  return out;
}

// A/B comparison with common random numbers: the same seeds -> same customers.
export function compare(cfgA, cfgB, reps, onProgress, baseSeed = 5000) {
  const diffs = [], a = [], b = [];
  for (let i = 0; i < reps; i++) {
    const ra = runOnce(cfgA, baseSeed + i), rb = runOnce(cfgB, baseSeed + i);
    a.push(ra); b.push(rb); diffs.push(rb.profitPerWeek - ra.profitPerWeek);
    if (onProgress && (i % 5 === 4 || i === reps - 1)) onProgress(i + 1, { a, b, diffs });
  }
  return { a, b, diffs };
}

// One-at-a-time sensitivity on weekly profit, each parameter at its low and high.
export const SENSITIVITY_KEYS = ['p_aware', 'p_low_peak', 'p_seek', 'price_per_hour', 'host_share', 'wtp_mid_hourly',
  'search_radius_m', 'p_stay', 'p_forget', 'packs_per_kiosk', 'footfall_116st', 'footfall_columbia', 'pack_recharge_h', 'away_return_median_h'];

export function sensitivity(cfg, reps, onProgress, keys = SENSITIVITY_KEYS, baseSeed = 9000) {
  const base = stats(replicate(cfg, reps, null, baseSeed).map(r => r.profitPerWeek)).mean;
  const rows = [];
  keys.forEach((k, idx) => {
    const p = PARAMS[k];
    const at = v => stats(replicate({ ...cfg, params: { ...(cfg.params || {}), [k]: v } }, reps, null, baseSeed).map(r => r.profitPerWeek)).mean;
    const lo = at(p.low), hi = at(p.high);
    rows.push({ key: k, label: p.label, conf: p.conf, lowVal: p.low, highVal: p.high, unit: p.unit, lowProfit: lo, highProfit: hi, swing: Math.abs(hi - lo) });
    if (onProgress) onProgress(idx + 1, keys.length, rows);
  });
  rows.sort((a, b) => b.swing - a.swing);
  return { base, rows };
}
