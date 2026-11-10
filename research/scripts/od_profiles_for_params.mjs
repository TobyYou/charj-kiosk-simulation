// Turn research/data/mta_od_5stations_2025.csv into per-station 24-h footfall profiles for params.js.
// Weekday: all-month weekday averages. Weekend: Saturday and Sunday profiles weighted by their daily totals.
// Exits (trips destined) are spread 50/50 over the start hour and the next (ASSUMPTION, as in od_footfall_profile.mjs).
// Usage: node research/scripts/od_profiles_for_params.mjs
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const here = fileURLToPath(new URL('.', import.meta.url));
const rows = readFileSync(here + '../data/mta_od_5stations_2025.csv', 'utf8').trim().split('\n').slice(1).map(l => l.split(','));
const key = { '96 St': 'sub96', '103 St': 'sub103', 'Cathedral Pkwy-110 St': 'sub110', '116 St-Columbia': 'sub116', '125 St (1)': 'sub125' };
const raw = (st, dt) => { const v = Array(24).fill(0);
  for (const r of rows) if (r[0] === st && r[2] === dt) { const h = +r[3]; v[h] += +r[4]; v[h] += 0.5 * +r[5]; v[(h + 1) % 24] += 0.5 * +r[5]; }
  return v; };
const pct = v => { const t = v.reduce((a, b) => a + b); return v.map(x => +(100 * x / t).toFixed(2)); };
const stations = [...new Set(rows.map(r => r[0]))].filter(s => key[s]);
const out = { weekday: {}, weekend: {} };
for (const st of stations) {
  out.weekday[key[st]] = pct(raw(st, 'weekday'));
  const sat = raw(st, 'saturday'), sun = raw(st, 'sunday');
  out.weekend[key[st]] = pct(sat.map((x, h) => x + sun[h]));
}
for (const wk of ['weekday', 'weekend']) for (const [k, v] of Object.entries(out[wk])) console.log(`${wk} ${k}: [${v.join(', ')}],`);
