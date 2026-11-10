// Hourly footfall profiles for the five 1-train stations (96, 103, 110, 116, 125 St) from the
// MTA Subway Origin-Destination Ridership Estimate 2025 (data.ny.gov y2qv-fytt).
// Input: research/data/mta_od_5stations_2025.csv (station,station_complex_id,daytype,hour,entries,exits),
// values = average trips per day of that type (entries = trips originating, exits = trips destined), ET.
// OD hour_of_day is the trip START hour, so exits are spread 50/50 over that hour and the next
// (ASSUMPTION, same as od_footfall_profile.mjs). Entries stay in their hour.
// Profile = % of daily (entries + exits) per hour, 24 values summing to 100.
// Usage: node research/scripts/od_station_profiles.mjs [daytype-filter-substring]
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(new URL('.', import.meta.url));
const rows = readFileSync(here + '../data/mta_od_5stations_2025.csv', 'utf8').trim().split('\n').slice(1).map(l => l.split(','));
const filt = process.argv[2] || '';
// Current shared weekday subway profile in simulator/js/params.js (PROFILES.weekday.subway), copied for comparison.
const CURRENT = [0.73,0.25,0.12,0.09,0.19,0.81,1.82,3.7,6.67,7.01,5.24,4.76,5.25,5.49,6.04,7.27,8.87,10.3,7.75,5.58,4.49,3.44,2.56,1.57];
const curSum = CURRENT.reduce((a, b) => a + b);
const curPct = CURRENT.map(v => 100 * v / curSum);

const groups = new Map();
for (const [station, , daytype, h, en, ex] of rows) {
  const key = `${station}|${daytype}`;
  if (!groups.has(key)) groups.set(key, { station, daytype, en: Array(24).fill(0), ex: Array(24).fill(0) });
  const g = groups.get(key); g.en[+h] = +en; g.ex[+h] = +ex;
}
const sum = a => a.reduce((x, y) => x + y, 0);
const win = (p, a, b) => { let s = 0; for (let h = a; h !== b; h = (h + 1) % 24) s += p[h]; return s; }; // [a,b) wraps midnight
const results = {};
for (const g of groups.values()) {
  const exSpread = Array(24).fill(0);
  g.ex.forEach((v, h) => { exSpread[h] += v / 2; exSpread[(h + 1) % 24] += v / 2; });
  const foot = g.en.map((v, h) => v + exSpread[h]);
  const tot = sum(foot);
  const prof = foot.map(v => +(100 * v / tot).toFixed(2));
  results[`${g.station}|${g.daytype}`] = { ...g, tot, prof };
  if (!g.daytype.includes(filt)) continue;
  const E = sum(g.en), X = sum(g.ex);
  console.log(`\n== ${g.station} — ${g.daytype} ==`);
  console.log(`profile: [${prof.join(',')}]`);
  console.log(`daily entries ${E.toFixed(0)}, exits ${X.toFixed(0)}, total ${(E + X).toFixed(0)}`);
  console.log(`share 07-10 ${win(prof, 7, 10).toFixed(1)}%  11-14 ${win(prof, 11, 14).toFixed(1)}%  17-21 ${win(prof, 17, 21).toFixed(1)}%  22-02 ${win(prof, 22, 2).toFixed(1)}%`);
  console.log(`exit/entry ratio (start-hour basis) 07-10: ${(win(g.ex, 7, 10) / win(g.en, 7, 10)).toFixed(2)}  17-20: ${(win(g.ex, 17, 20) / win(g.en, 17, 20)).toFixed(2)}`);
  if (g.daytype.startsWith('weekday')) {
    const d = 0.5 * prof.reduce((s, v, h) => s + Math.abs(v - curPct[h]), 0);
    console.log(`dissimilarity vs current shared weekday subway profile (½·L1, % of footfall moved): ${d.toFixed(1)}%`);
  }
}
console.log('\n== weekend-day / weekday daily (entries+exits) ratios ==');
const stations = [...new Set([...groups.values()].map(g => g.station))];
for (const sfx of ['', '_term', '_summer']) {
  for (const s of stations) {
    const wd = results[`${s}|weekday${sfx}`], sa = results[`${s}|saturday${sfx}`], su = results[`${s}|sunday${sfx}`];
    if (!wd || !sa || !su) continue;
    console.log(`${(sfx || '_all').slice(1).padEnd(6)} ${s.padEnd(22)} Sat ${(sa.tot / wd.tot).toFixed(2)}  Sun ${(su.tot / wd.tot).toFixed(2)}  avg ${((sa.tot + su.tot) / 2 / wd.tot).toFixed(2)}`);
  }
}
console.log('\n== term vs summer weekday daily totals ==');
for (const s of stations) {
  const t = results[`${s}|weekday_term`], u = results[`${s}|weekday_summer`], a = results[`${s}|weekday`];
  if (t && u) console.log(`${s.padEnd(22)} term ${t.tot.toFixed(0)}  summer ${u.tot.toFixed(0)}  all ${a.tot.toFixed(0)}  summer/term ${(u.tot / t.tot).toFixed(2)}  profile ½·L1(term,summer) ${(0.5 * t.prof.reduce((x, v, h) => x + Math.abs(v - u.prof[h]), 0)).toFixed(1)}%`);
}
