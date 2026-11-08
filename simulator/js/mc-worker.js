import { replicate, compare, sensitivity } from './montecarlo.js';
self.onmessage = (e) => {
  const { kind, cfg, cfgB, reps } = e.data;
  try {
    if (kind === 'replicate') {
      const res = replicate(cfg, reps, (i, out) => self.postMessage({ kind, progress: i, total: reps, results: out.map(slim) }));
      self.postMessage({ kind, done: true, results: res.map(slim) });
    } else if (kind === 'compare') {
      compare(cfg, cfgB, reps, (i, r) => self.postMessage({ kind, progress: i, total: reps, diffs: r.diffs,
        a: r.a.map(x => x.profitPerWeek), b: r.b.map(x => x.profitPerWeek) }));
      self.postMessage({ kind, done: true });
    } else if (kind === 'sensitivity') {
      const r = sensitivity(cfg, reps, (i, n, rows) => self.postMessage({ kind, progress: i, total: n, rows }));
      self.postMessage({ kind, done: true, base: r.base, rows: r.rows });
    }
  } catch (err) { self.postMessage({ kind, error: String(err && err.stack || err) }); }
};
function slim(s) {
  return { profitPerWeek: s.profitPerWeek, revenuePerWeek: s.revenuePerWeek, rentalsPerDay: s.rentalsPerDay, rentalsPerStationDay: s.rentalsPerStationDay,
           serviceLevel: s.serviceLevel, unmetNoKiosk: s.unmetNoKiosk, unmetEmpty: s.unmetEmpty, failedReturnAttempts: s.failedReturnAttempts,
           forfeits: s.forfeits, medianRentalMin: s.medianRentalMin, utilization: s.utilization, csTickets: s.csTickets };
}
