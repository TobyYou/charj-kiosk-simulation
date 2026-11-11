"""Fit a 2-component lognormal mixture ("stay" + "away") to binned rental-duration shares
(interval-censored multinomial MLE; STATS_TOOLKIT M8). Stdlib only.
Input:  research/data/chargespot_duration_bins_2024.csv (INFORICH FY2024 Q3 deck, slide 22)
Usage:  python3 -I research/scripts/fit_duration_mixture.py
Parameters: w = share in the 'stay' component; (mu1, s1) stay, (mu2, s2) away, in ln-minutes.
7 bins => 6 free shares, 5 parameters => 1 residual dof, so treat the fit as a shape summary,
not a test. Sigmas are bounded to [0.2, 2.0] to stop a component collapsing onto one bin.
"""
import csv, math, os, random

here = os.path.dirname(os.path.abspath(__file__))
rows = list(csv.DictReader(open(os.path.join(here, '..', 'data', 'chargespot_duration_bins_2024.csv'))))
Phi = lambda z: 0.5 * (1 + math.erf(z / math.sqrt(2)))

def cdf_ln(x, mu, s):
    if x <= 0: return 0.0
    if x == float('inf'): return 1.0
    return Phi((math.log(x) - mu) / s)

def cdf_mix(x, th):
    w, m1, s1, m2, s2 = th
    return w * cdf_ln(x, m1, s1) + (1 - w) * cdf_ln(x, m2, s2)

def nll(bins, th):
    w, m1, s1, m2, s2 = th
    if not (0.02 < w < 0.98 and 0.2 <= s1 <= 2.0 and 0.2 <= s2 <= 2.0 and m1 < m2): return 1e9
    return -sum(p * math.log(max(1e-12, cdf_mix(hi, th) - cdf_mix(lo, th))) for lo, hi, p in bins)

def nelder_mead(f, x0, step, iters=4000):
    n = len(x0)
    pts = [list(x0)] + [[x0[j] + (step[j] if j == i else 0) for j in range(n)] for i in range(n)]
    vals = [f(p) for p in pts]
    for _ in range(iters):
        order = sorted(range(n + 1), key=lambda i: vals[i]); pts = [pts[i] for i in order]; vals = [vals[i] for i in order]
        c = [sum(p[j] for p in pts[:-1]) / n for j in range(n)]
        xr = [c[j] + (c[j] - pts[-1][j]) for j in range(n)]; fr = f(xr)
        if fr < vals[0]:
            xe = [c[j] + 2 * (c[j] - pts[-1][j]) for j in range(n)]; fe = f(xe)
            pts[-1], vals[-1] = (xe, fe) if fe < fr else (xr, fr)
        elif fr < vals[-2]:
            pts[-1], vals[-1] = xr, fr
        else:
            xc = [c[j] + 0.5 * (pts[-1][j] - c[j]) for j in range(n)]; fc = f(xc)
            if fc < vals[-1]: pts[-1], vals[-1] = xc, fc
            else:
                pts = [pts[0]] + [[pts[0][j] + 0.5 * (p[j] - pts[0][j]) for j in range(n)] for p in pts[1:]]
                vals = [f(p) for p in pts]
    i = min(range(n + 1), key=lambda i: vals[i]); return pts[i], vals[i]

random.seed(20261111)
for month in sorted({r['month'] for r in rows}):
    bins = [(float(r['lo_min']), float(r['hi_min']), float(r['share_pct']) / 100) for r in rows if r['month'] == month]
    tot = sum(p for _, _, p in bins); bins = [(a, b, p / tot) for a, b, p in bins]
    ent = -sum(p * math.log(p) for _, _, p in bins)  # NLL of a perfect fit
    best = None
    for _ in range(60):  # multistart
        x0 = [random.uniform(0.3, 0.9), random.uniform(3.0, 5.0), random.uniform(0.4, 1.2),
              random.uniform(5.5, 7.5), random.uniform(0.4, 1.5)]
        th, v = nelder_mead(lambda t: nll(bins, t), x0, [0.1, 0.3, 0.2, 0.3, 0.2])
        if best is None or v < best[1]: best = (th, v)
    th, v = best
    w, m1, s1, m2, s2 = th
    print(f'{month}: w_stay={w:.3f}  stay median {math.exp(m1):.0f} min (sigma {s1:.2f})  '
          f'away median {math.exp(m2)/60:.1f} h (sigma {s2:.2f});  KL to data {v - ent:.5f} nats')
    print('  bin, observed%, fitted%')
    for lo, hi, p in bins:
        print(f'  {lo:g}-{hi:g}, {100*p:.1f}, {100*(cdf_mix(hi, th) - cdf_mix(lo, th)):.1f}')
    # mixture median
    lo, hi = 1.0, 10000.0
    for _ in range(60):
        mid = (lo + hi) / 2
        lo, hi = (mid, hi) if cdf_mix(mid, th) < 0.5 else (lo, mid)
    print(f'  mixture median {lo:.0f} min; P(<60) {100*cdf_mix(60, th):.1f}%; P(>=24h) {100*(1-cdf_mix(1440, th)):.1f}%')
