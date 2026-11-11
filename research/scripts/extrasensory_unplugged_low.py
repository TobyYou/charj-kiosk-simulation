#!/usr/bin/env python3
"""Companion to extrasensory_low_battery.py: share of UNPLUGGED phone-time below 20% / 30%
by local hour (weekday/weekend), equal-user, time-weighted, 90% cluster-bootstrap CI.
Why: a person walking past a kiosk is unplugged. At night ~75% of ExtraSensory phone-time is
plugged in, so the all-time share understates low battery among people who are out.
Usage: python3 -I research/scripts/extrasensory_unplugged_low.py <data_dir> [out_csv]
Reuses load_user() and constants from extrasensory_low_battery.py (same folder). Stdlib only.
"""
import csv, glob, os, random, statistics, sys
from collections import defaultdict
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import extrasensory_low_battery as E

data_dir = sys.argv[1]
out = sys.argv[2] if len(sys.argv) > 2 else None
users = []
for p in sorted(glob.glob(os.path.join(data_dir, '*.features_labels.csv.gz'))):
    rows, _ = E.load_user(p)
    cell = defaultdict(lambda: [0.0, 0.0, 0.0])  # unplugged w, w*<20, w*<30
    for j, (ts, lvl, plug, dt) in enumerate(rows):
        if plug: continue
        w = min(rows[j + 1][0] - ts, E.CAP_S) if j + 1 < len(rows) else E.NOMINAL_S
        c = cell[('weekend' if dt.weekday() >= 5 else 'weekday', dt.hour)]
        c[0] += w; c[1] += w * (lvl < 0.20); c[2] += w * (lvl < 0.30)
    users.append(cell)

def eq(us, key, m):
    v = [u[key][m] / u[key][0] for u in us if u[key][0] >= E.MIN_USER_S]
    return (statistics.fmean(v), len(v)) if v else (float('nan'), 0)

rnd = random.Random(E.SEED)
boots = [[rnd.choice(users) for _ in users] for _ in range(E.B)]
res = []
for dt in E.DAYTYPES:
    for h in range(24):
        key = (dt, h); r = {'daytype': dt, 'hour_local': h}
        for m, name in ((1, 'lt20_unplugged'), (2, 'lt30_unplugged')):
            est, n = eq(users, key, m)
            bs = sorted(x for x in (eq(b, key, m)[0] for b in boots) if x == x)
            r[name] = round(est, 4); r['n_users'] = n
            r[name + '_lo90'] = round(bs[int(0.05 * len(bs))], 4) if bs else ''
            r[name + '_hi90'] = round(bs[int(0.95 * len(bs)) - 1], 4) if bs else ''
        res.append(r)
        print(f"{dt} {h:02d}: <20% {r['lt20_unplugged']:.3f} [{r['lt20_unplugged_lo90']},{r['lt20_unplugged_hi90']}]  "
              f"<30% {r['lt30_unplugged']:.3f}  users {r['n_users']}")
if out:
    with open(out, 'w', newline='') as fh:
        w = csv.DictWriter(fh, fieldnames=list(res[0].keys())); w.writeheader(); w.writerows(res)
