// Compare simulated rental durations with ChargeSPOT Japan bins (research/data/chargespot_duration_bins_2024.csv).
// Note: rentals still open (or lost) at the end of the 7-day run are not in m.durations, so the >24 h bin is understated.
// Usage: node research/scripts/sim_duration_bins.mjs [reps] [p_stay]
import { Simulation } from '../../simulator/js/engine.js';
import { SITES } from '../../simulator/js/geo.js';
const reps = +(process.argv[2] || 10);
const params = process.argv[3] ? { p_stay: +process.argv[3] } : {};
const edges = [0, 30, 60, 180, 360, 720, 1440, Infinity];
const jp = [10.0, 15.8, 38.3, 17.1, 7.9, 5.7, 5.1];
const counts = Array(7).fill(0); let n = 0; const all = [];
for (let i = 0; i < reps; i++) {
  const sim = new Simulation({ siteIds: SITES.map(s => s.id), scenario: 'normal', days: 7, rebalance: true, params, seed: 1000 + i, onEvent: null });
  sim.run();
  for (const d of sim.m.durations) { all.push(d); n++; for (let b = 0; b < 7; b++) if (d >= edges[b] && d < edges[b + 1]) counts[b]++; }
}
all.sort((a, b) => a - b);
console.log(`reps=${reps} params=${JSON.stringify(params)} completed rentals=${n} median=${all[Math.floor(n / 2)]} min`);
console.log('bin_min,sim_pct,chargespot_jp_2024_06_pct');
for (let b = 0; b < 7; b++) console.log(`${edges[b]}-${edges[b + 1]},${(100 * counts[b] / n).toFixed(1)},${jp[b]}`);
