// Headless runner: node simulator/cli.mjs [reps] [scenario] [siteIds comma-separated|all|live]
import { replicate, stats } from './js/montecarlo.js';
import { SITES } from './js/geo.js';
const reps = +(process.argv[2] || 50);
const scenario = process.argv[3] || 'normal';
const sel = process.argv[4] || 'live';
const siteIds = sel === 'all' ? SITES.map(s => s.id) : sel === 'live' ? SITES.filter(s => s.live).map(s => s.id) : sel.split(',');
const t0 = Date.now();
const runs = replicate({ siteIds, scenario, days: 7, rebalance: true }, reps);
const f = k => stats(runs.map(r => r[k]));
const show = (k, d = 1) => { const s = f(k); console.log(`${k.padEnd(22)} mean ${s.mean.toFixed(d).padStart(9)}  ±${s.ci95.toFixed(d)} (95% CI)  p10 ${s.p10.toFixed(d)}  p90 ${s.p90.toFixed(d)}`); };
console.log(`Scenario=${scenario} stations=${siteIds.length} reps=${reps} (${Date.now() - t0} ms)`);
['rentalsPerDay','rentalsPerStationDay','medianRentalMin','serviceLevel','captureRate','unmetNoKiosk','unmetEmpty','declinedPrice','failedReturnAttempts','forfeits','lost','utilization','revenuePerWeek','profitPerWeek'].forEach(k => show(k, k.match(/Level|Rate|utiliz/) ? 3 : 1));
console.log('P(profit>0) =', f('profitPerWeek').pPositive.toFixed(2));
