// Build a weekday hourly footfall profile for 116 St–Columbia from MTA origin–destination
// estimates (entries = trips originating, exits = trips destined), and measure how much it
// changes simulated rentals versus the current 'subway' profile in params.js.
// Input: research/data/mta_od_116st.csv (MTA OD 2025, y2qv-fytt, weekday averages, ET).
// OD hours are the hour the trip STARTS at its origin, so destination trips are spread 50/50
// over that hour and the next (typical in-system time 10–40 min). ASSUMPTION, stated.
// Usage: node research/scripts/od_footfall_profile.mjs [reps]
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { PROFILES } from '../../simulator/js/params.js';
import { replicate, stats } from '../../simulator/js/montecarlo.js';
import { SITES } from '../../simulator/js/geo.js';

const here = fileURLToPath(new URL('.', import.meta.url));
const rows = readFileSync(here + '../data/mta_od_116st.csv', 'utf8').trim().split('\n').slice(1)
  .map(l => l.split(',')).filter(r => r[0] !== 'all');
const dest = Array(24).fill(0), orig = Array(24).fill(0);
for (const r of rows) { const h = +r[0]; orig[h] += +r[2]; dest[h] += 0.5 * +r[1]; dest[(h + 1) % 24] += 0.5 * +r[1]; }
const tot = orig.reduce((a, b) => a + b) + dest.reduce((a, b) => a + b);
const od = orig.map((o, h) => +(100 * (o + dest[h]) / tot).toFixed(2));
const cur = PROFILES.weekday.subway;
const curSum = cur.reduce((a, b) => a + b);
const win = (p, a, b) => p.slice(a, b).reduce((x, y) => x + y, 0);
console.log('hour,od_profile_pct,current_profile_pct');
od.forEach((v, h) => console.log(`${h},${v},${(100 * cur[h] / curSum).toFixed(2)}`));
console.log(`17:00-20:59 share: OD ${win(od, 17, 21).toFixed(1)}%  current ${(100 * win(cur, 17, 21) / curSum).toFixed(1)}%`);
console.log(`07:00-09:59 share: OD ${win(od, 7, 10).toFixed(1)}%  current ${(100 * win(cur, 7, 10) / curSum).toFixed(1)}%`);

const reps = +(process.argv[2] || 30);
const siteIds = SITES.map(s => s.id);
const run = () => {
  const r = replicate({ siteIds, scenario: 'normal', days: 7, rebalance: true }, reps);
  return ['rentalsPerStationDay', 'profitPerWeek'].map(k => stats(r.map(x => x[k])));
};
const [a1, a2] = run();
PROFILES.weekday.subway = od; // in-memory only; params.js is not modified
const [b1, b2] = run();
console.log(`\nreps=${reps}, 13 stations, normal week (weekday subway profile swapped; weekend unchanged)`);
console.log(`current profile: rentals/station/day ${a1.mean.toFixed(3)} ±${a1.ci95.toFixed(3)}, profit/week $${a2.mean.toFixed(0)} ±${a2.ci95.toFixed(0)}`);
console.log(`OD profile:      rentals/station/day ${b1.mean.toFixed(3)} ±${b1.ci95.toFixed(3)}, profit/week $${b2.mean.toFixed(0)} ±${b2.ci95.toFixed(0)}`);
