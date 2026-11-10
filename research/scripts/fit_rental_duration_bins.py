"""Fit a lognormal rental-duration distribution to binned operator shares (interval-censored MLE).
Input: research/data/chargespot_duration_bins_2024.csv (INFORICH FY2024 Q3 deck, slide 22).
Note: the Sep-2024 3-6 h share is printed wrongly on the slide (it repeats the 1-3 h label);
17.1% is the remainder 100 - other buckets (our arithmetic). Stdlib only: python3 -I this_script.py
"""
import csv, math, os, sys
here = os.path.dirname(os.path.abspath(__file__))
path = os.path.join(here, '..', 'data', 'chargespot_duration_bins_2024.csv')
rows = list(csv.DictReader(open(path)))
Phi = lambda z: 0.5 * (1 + math.erf(z / math.sqrt(2)))
def cdf(x, mu, s):
    if x == 0: return 0.0
    if x == float('inf'): return 1.0
    return Phi((math.log(x) - mu) / s)
def nll(bins, mu, s):
    return -sum(w * math.log(max(1e-12, cdf(hi, mu, s) - cdf(lo, mu, s))) for lo, hi, w in bins)
for month in sorted({r['month'] for r in rows}):
    bins = [(float(r['lo_min']), float(r['hi_min']), float(r['share_pct']) / 100) for r in rows if r['month'] == month]
    best = None
    for i in range(300, 701):            # mu in ln-minutes 3.00..7.00
        mu = i / 100
        for j in range(30, 301):         # sigma 0.30..3.00
            s = j / 100
            v = nll(bins, mu, s)
            if best is None or v < best[0]: best = (v, mu, s)
    _, mu, s = best
    print(f'{month}: Lognormal mu={mu:.2f} ln-min, sigma={s:.2f}; median {math.exp(mu):.0f} min, mean {math.exp(mu + s*s/2):.0f} min')
    print('  bin, observed%, fitted%')
    for lo, hi, w in bins:
        print(f'  {lo:g}-{hi:g}, {100*w:.1f}, {100*(cdf(hi,mu,s)-cdf(lo,mu,s)):.1f}')
    print(f'  P(<60 min) fitted {100*cdf(60,mu,s):.1f}%; P(>24 h) fitted {100*(1-cdf(1440,mu,s)):.1f}%')
