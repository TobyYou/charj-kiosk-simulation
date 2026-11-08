#!/usr/bin/env python3
"""Fit a piecewise-constant NHPP λ(h) and check overdispersion from MTA hourly entries.

Input : research/data/mta_116st_hourly_fall2026.csv  (columns day,hour,entries; local time ET)
        produced by the SoQL query in mta_116st_hourly_fall2026.meta.md
Output: printed tables + research/data/nhpp_116st_fit.csv

Pure standard library (no numpy) so it runs anywhere:  python3 -I research/scripts/fit_nhpp_mta.py [csv]

What it estimates
  * λ̂(h) = mean entries in hour h, separately for weekdays and weekends (piecewise-constant NHPP).
  * Dispersion index D(h) = Var/Mean across days. Poisson ⇒ D≈1. D≫1 ⇒ day-level heterogeneity.
  * Day random effect: daily total T_d = μ·G_d. CV of G across days ⇒ Gamma(shape=1/CV², scale=CV²).
    Conditional on G_d, hourly counts should be ~Poisson; we check D(h) after dividing out G_d.
  * Pooled negative-binomial size k (Var = μ + μ²/k) by method of moments.
"""
import csv, sys, statistics as st, datetime as dt, os

path = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), '..', 'data', 'mta_116st_hourly_fall2026.csv')
HOLIDAYS = {'2026-10-12'}  # Columbus/Indigenous Peoples' Day (Columbia classes held, but flag it)

rows = {}
with open(path) as f:
    for r in csv.DictReader(f):
        d = r['day'][:10]; h = int(r['hour']); rows.setdefault(d, [0.0] * 24)[h] = float(r['entries'])

days = sorted(rows)
def kind(d):
    wd = dt.date.fromisoformat(d).weekday()
    return 'weekend' if wd >= 5 else 'weekday'

out = []
for k in ('weekday', 'weekend'):
    ds = [d for d in days if kind(d) == k and d not in HOLIDAYS and sum(rows[d]) > 0]
    totals = [sum(rows[d]) for d in ds]
    mt, sdt = st.mean(totals), st.stdev(totals)
    cv = sdt / mt
    print(f"\n== {k}: n_days={len(ds)}  daily total mean={mt:.0f} sd={sdt:.0f} CV={cv:.3f}  min={min(totals):.0f} max={max(totals):.0f}")
    print(f"   day random effect G ~ Gamma(shape={1/cv**2:.1f}, scale={cv**2:.4f})  (mean 1)")
    num = den = 0.0
    print(" h   lambda   share%   D_raw   D_after_day_effect")
    for h in range(24):
        xs = [rows[d][h] for d in ds]
        m, v = st.mean(xs), st.variance(xs)
        # remove day effect: scale each day's count by mean total / that day's total
        adj = [rows[d][h] * mt / sum(rows[d]) for d in ds]
        va = st.variance(adj)
        D, Da = v / m if m else float('nan'), va / m if m else float('nan')
        num += m * m; den += max(v - m, 0)
        out.append({'daytype': k, 'hour_ET': h, 'lambda_per_h': round(m, 1), 'share_pct': round(100 * m / mt, 2),
                    'var': round(v, 1), 'dispersion_raw': round(D, 2), 'dispersion_after_day_effect': round(Da, 2)})
        print(f"{h:2d} {m:8.1f} {100*m/mt:7.2f} {D:7.2f} {Da:7.2f}")
    kk = num / den if den else float('inf')
    print(f"   pooled NB size k (Var = mu + mu^2/k): {kk:.1f}  -> extra-Poisson CV = 1/sqrt(k) = {1/kk**0.5:.3f}")

dst = os.path.join(os.path.dirname(path), 'nhpp_116st_fit.csv')
with open(dst, 'w', newline='') as f:
    w = csv.DictWriter(f, fieldnames=list(out[0])); w.writeheader(); w.writerows(out)
print('\nwrote', dst)
