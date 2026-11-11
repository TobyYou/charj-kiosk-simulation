#!/usr/bin/env python3
"""Share of phone-time with low battery by local hour, from the ExtraSensory dataset.

Source: ExtraSensory dataset, UC San Diego (Vaizman, Ellis & Lanckriet 2017),
http://extrasensory.ucsd.edu/  -> "primary data - features and labels"
(data/primary_data_files/ExtraSensory.per_uuid_features_labels.zip, 60 files
<UUID>.features_labels.csv.gz, one row per ~1-minute recording session).

Usage:
    python3 -I extrasensory_low_battery.py <data_dir> [out_csv]

Standard library only. Reads the data as data; never executes anything from it.

Columns used:
    timestamp                              UTC epoch seconds
    lf_measurements:battery_level          0..1
    discrete:battery_plugged:is_ac|is_usb|is_wireless   (Android only; iPhone = 'missing')
    discrete:battery_state:is_charging|is_full          (both platforms)
Plugged in := any battery_plugged flag == 1, or battery_state is_charging/is_full == 1.
(Android 'not_charging' is counted as NOT plugged; it is ~1% of rows.)

Method:
  * UTC epoch -> America/Los_Angeles local time (DST aware via zoneinfo).
    Checked against the dataset's own discrete:time_of_day:* flags (phone-local).
  * Time weighting: each sample is weighted by the gap to the user's next
    sample, capped at CAP_S (300 s); the last sample of a user gets NOMINAL_S
    (60 s). An unweighted (1 per sample) version is also produced.
  * Cell = local hour (0-23) x {weekday Mon-Fri, weekend Sat-Sun}.
  * Equal-user estimate: per-user share within the cell, averaged over users
    whose cell exposure >= MIN_USER_S seconds (time-weighted) or >= MIN_USER_N
    samples (unweighted). Pooled estimate: sum over all users / total weight.
  * 90% CI: cluster bootstrap over users (B resamples, fixed seed), percentile.
  * Daily minimum: per user x local date, min battery level; share of
    user-days with min < 0.20 / < 0.10 (all days, and days with >= 12 distinct
    local hours of data); local hour at which the daily min first occurs.
"""
import csv
import gzip
import os
import random
import statistics
import sys
from collections import defaultdict
from datetime import datetime
from zoneinfo import ZoneInfo

LA = ZoneInfo("America/Los_Angeles")
CAP_S = 300.0
NOMINAL_S = 60.0
MIN_USER_S = 600.0     # >= 10 min of weighted exposure in a cell for equal-user mean
MIN_USER_N = 10        # >= 10 samples (unweighted)
B = 500
SEED = 20261111
WELL_COVERED_HOURS = 12

BAT = "lf_measurements:battery_level"
PLUG = ["discrete:battery_plugged:is_ac", "discrete:battery_plugged:is_usb",
        "discrete:battery_plugged:is_wireless",
        "discrete:battery_state:is_charging", "discrete:battery_state:is_full"]
TOD = {"discrete:time_of_day:between0and6": (0, 6), "discrete:time_of_day:between6and12": (6, 12),
       "discrete:time_of_day:between12and18": (12, 18), "discrete:time_of_day:between18and24": (18, 24)}
METRICS = ["lt20", "lt30", "level", "plugged"]
DAYTYPES = ["weekday", "weekend"]


def one(v):
    return v not in ("nan", "") and float(v) == 1.0


def load_user(path):
    rows = []
    tz_check = [0, 0]
    with gzip.open(path, "rt", newline="") as fh:
        r = csv.reader(fh)
        h = next(r)
        bi = h.index(BAT)
        pi = [h.index(c) for c in PLUG]
        ti = {h.index(c): rng for c, rng in TOD.items()}
        for row in r:
            b = row[bi]
            if b in ("nan", ""):
                continue
            ts = float(row[0])
            dt = datetime.fromtimestamp(ts, LA)
            for i, (lo, hi) in ti.items():
                if one(row[i]):
                    tz_check[0] += 1
                    tz_check[1] += lo <= dt.hour < hi
            rows.append((ts, float(b), any(one(row[i]) for i in pi), dt))
    rows.sort(key=lambda x: x[0])
    return rows, tz_check


def user_aggregates(rows):
    """Return per-cell sums for time-weighted (tw) and unweighted (uw), user-hour set, day info."""
    cells = {k: defaultdict(lambda: [0.0, 0.0, 0.0, 0.0, 0.0]) for k in ("tw", "uw")}  # w, lt20, lt30, level, plugged
    uhours = defaultdict(set)
    days = defaultdict(lambda: {"min": 2.0, "minhour": None, "hours": set(), "dt": None})
    n = len(rows)
    for j, (ts, lvl, plug, dt) in enumerate(rows):
        w_tw = min(rows[j + 1][0] - ts, CAP_S) if j + 1 < n else NOMINAL_S
        dtype = "weekend" if dt.weekday() >= 5 else "weekday"
        key = (dtype, dt.hour)
        for kind, w in (("tw", w_tw), ("uw", 1.0)):
            c = cells[kind][key]
            c[0] += w
            c[1] += w * (lvl < 0.20)
            c[2] += w * (lvl < 0.30)
            c[3] += w * lvl
            c[4] += w * plug
        uhours[key].add(dt.date())
        d = days[dt.date()]
        d["hours"].add(dt.hour)
        d["dt"] = dtype
        if lvl < d["min"]:
            d["min"], d["minhour"] = lvl, dt.hour
    return cells, uhours, days


def estimate(users, idx, kind, key, min_w):
    """Equal-user and pooled estimates for one cell over a (possibly resampled) list of user indices."""
    per_user = {m: [] for m in METRICS}
    tot = [0.0] * 5
    for i in idx:
        c = users[i]["cells"][kind].get(key)
        if not c or c[0] <= 0:
            continue
        for k in range(5):
            tot[k] += c[k]
        if c[0] >= min_w:
            for m, k in zip(METRICS, (1, 2, 3, 4)):
                per_user[m].append(c[k] / c[0])
    eq = {m: (statistics.fmean(v) if v else float("nan")) for m, v in per_user.items()}
    pooled = {m: (tot[k] / tot[0] if tot[0] > 0 else float("nan")) for m, k in zip(METRICS, (1, 2, 3, 4))}
    return eq, pooled, len(per_user["lt20"])


def pct(vals, q):
    vals = sorted(v for v in vals if v == v)
    if not vals:
        return float("nan")
    k = (len(vals) - 1) * q
    lo = int(k)
    hi = min(lo + 1, len(vals) - 1)
    return vals[lo] + (vals[hi] - vals[lo]) * (k - lo)


def daily_min_stats(users, idx, min_hours):
    eq20, eq10, all_days = [], [], []
    for i in idx:
        ds = [d for d in users[i]["days"].values() if len(d["hours"]) >= min_hours]
        if not ds:
            continue
        eq20.append(statistics.fmean(d["min"] < 0.20 for d in ds))
        eq10.append(statistics.fmean(d["min"] < 0.10 for d in ds))
        all_days.extend(ds)
    pooled20 = statistics.fmean(d["min"] < 0.20 for d in all_days) if all_days else float("nan")
    pooled10 = statistics.fmean(d["min"] < 0.10 for d in all_days) if all_days else float("nan")
    return {"eq_lt20": statistics.fmean(eq20) if eq20 else float("nan"),
            "eq_lt10": statistics.fmean(eq10) if eq10 else float("nan"),
            "pooled_lt20": pooled20, "pooled_lt10": pooled10,
            "n_users": len(eq20), "n_days": len(all_days)}


def main():
    datadir = sys.argv[1]
    out_csv = sys.argv[2] if len(sys.argv) > 2 else None
    files = sorted(f for f in os.listdir(datadir) if f.endswith(".features_labels.csv.gz"))
    users = []
    tz_tot = [0, 0]
    nrows = 0
    for f in files:
        rows, tzc = load_user(os.path.join(datadir, f))
        tz_tot[0] += tzc[0]
        tz_tot[1] += tzc[1]
        nrows += len(rows)
        if not rows:
            continue
        cells, uhours, days = user_aggregates(rows)
        users.append({"id": f.split(".")[0], "cells": cells, "uhours": uhours, "days": days, "n": len(rows)})
    print(f"files={len(files)} users_with_battery={len(users)} rows_with_battery={nrows}")
    print(f"TZ check: LA-hour agrees with phone time_of_day flags in {tz_tot[1]}/{tz_tot[0]} flag-instances")

    keys = [(dt, h) for dt in DAYTYPES for h in range(24)]
    allidx = list(range(len(users)))
    rng = random.Random(SEED)
    boots = [[rng.randrange(len(users)) for _ in allidx] for _ in range(B)]

    out = []
    for key in keys:
        rec = {"daytype": key[0], "hour_local": key[1]}
        n_users = sum(1 for u in users if u["cells"]["tw"].get(key, [0])[0] > 0)
        rec["n_users_any"] = n_users
        rec["n_user_hours"] = sum(len(u["uhours"].get(key, ())) for u in users)
        rec["n_samples"] = int(sum(u["cells"]["uw"].get(key, [0])[0] for u in users))
        rec["weighted_hours"] = round(sum(u["cells"]["tw"].get(key, [0])[0] for u in users) / 3600, 1)
        for kind, min_w in (("tw", MIN_USER_S), ("uw", MIN_USER_N)):
            eq, pooled, n_eq = estimate(users, allidx, kind, key, min_w)
            rec[f"n_users_eq_{kind}"] = n_eq
            bs_eq = {m: [] for m in METRICS}
            bs_po = {m: [] for m in METRICS}
            for bi in boots:
                e, p, _ = estimate(users, bi, kind, key, min_w)
                for m in METRICS:
                    bs_eq[m].append(e[m])
                    bs_po[m].append(p[m])
            for m in METRICS:
                for est, pt, bs in (("eq", eq, bs_eq), ("pooled", pooled, bs_po)):
                    rec[f"{m}_{est}_{kind}"] = round(pt[m], 4)
                    rec[f"{m}_{est}_{kind}_lo90"] = round(pct(bs[m], 0.05), 4)
                    rec[f"{m}_{est}_{kind}_hi90"] = round(pct(bs[m], 0.95), 4)
        out.append(rec)

    if out_csv:
        with open(out_csv, "w", newline="") as fh:
            w = csv.DictWriter(fh, fieldnames=list(out[0].keys()))
            w.writeheader()
            w.writerows(out)
        print(f"wrote {out_csv} ({os.path.getsize(out_csv)} bytes)")

    # ---- printed summary ----
    print("\nShare of time battery < 20% (equal-user, time-weighted), 90% cluster-bootstrap CI")
    print("hour | weekday est [lo,hi] (users, user-hours, samples) | weekend est [lo,hi] (users, user-hours, samples)")
    by = {(r["daytype"], r["hour_local"]): r for r in out}
    for h in range(24):
        a, b = by[("weekday", h)], by[("weekend", h)]
        f = lambda r: (f"{r['lt20_eq_tw']:.3f} [{r['lt20_eq_tw_lo90']:.3f},{r['lt20_eq_tw_hi90']:.3f}] "
                       f"({r['n_users_eq_tw']}u,{r['n_user_hours']}uh,{r['n_samples']}s)")
        print(f"{h:02d} | {f(a)} | {f(b)}")
    print("\nOther estimators for <20% (pooled_tw / eq_uw / pooled_uw) and <30% eq_tw, mean level eq_tw, plugged eq_tw:")
    for dt in DAYTYPES:
        for h in range(24):
            r = by[(dt, h)]
            print(f"{dt} {h:02d}: lt20 pooled_tw={r['lt20_pooled_tw']:.3f} eq_uw={r['lt20_eq_uw']:.3f} "
                  f"pooled_uw={r['lt20_pooled_uw']:.3f} | lt30 eq_tw={r['lt30_eq_tw']:.3f} "
                  f"[{r['lt30_eq_tw_lo90']:.3f},{r['lt30_eq_tw_hi90']:.3f}] | level={r['level_eq_tw']:.3f} "
                  f"| plugged={r['plugged_eq_tw']:.3f}")
    for m in ("lt20", "lt30"):
        for dt in DAYTYPES:
            best = max((r for r in out if r["daytype"] == dt), key=lambda r: r[f"{m}_eq_tw"])
            print(f"peak {m} {dt}: hour {best['hour_local']:02d} = {best[f'{m}_eq_tw']:.3f} "
                  f"[{best[f'{m}_eq_tw_lo90']:.3f},{best[f'{m}_eq_tw_hi90']:.3f}]")
    # daytime/evening window averages (simple mean of hourly eq_tw)
    for dt in DAYTYPES:
        for lo, hi in ((8, 12), (12, 17), (17, 21), (21, 24), (0, 6)):
            v = [by[(dt, h)]["lt20_eq_tw"] for h in range(lo, hi)]
            print(f"mean lt20_eq_tw {dt} {lo:02d}-{hi:02d}h: {statistics.fmean(v):.3f}")

    print("\nCoverage (time-weighted user-hours of exposure per cell); cells with < 20 users or < 100 user-hours flagged:")
    for r in out:
        flag = " LOW" if (r["n_users_any"] < 20 or r["n_user_hours"] < 100) else ""
        print(f"  {r['daytype']} {r['hour_local']:02d}: users={r['n_users_any']} user-hours={r['n_user_hours']} "
              f"weighted_h={r['weighted_hours']} samples={r['n_samples']}{flag}")

    print("\nDaily minimum battery (per user x local date)")
    for mh in (1, WELL_COVERED_HOURS):
        pt = daily_min_stats(users, allidx, mh)
        bs = [daily_min_stats(users, bi, mh) for bi in boots]
        s = f"  days with >= {mh} distinct local hours: users={pt['n_users']} user-days={pt['n_days']}"
        for k in ("eq_lt20", "eq_lt10", "pooled_lt20", "pooled_lt10"):
            s += (f"\n    {k}: {pt[k]:.3f} [{pct([b[k] for b in bs], 0.05):.3f},"
                  f"{pct([b[k] for b in bs], 0.95):.3f}]")
        print(s)
    for mh in (1, WELL_COVERED_HOURS):
        hist = [0] * 24
        hist_low = [0] * 24
        for u in users:
            for d in u["days"].values():
                if len(d["hours"]) >= mh:
                    hist[d["minhour"]] += 1
                    if d["min"] < 0.20:
                        hist_low[d["minhour"]] += 1
        tot, totl = sum(hist), sum(hist_low)
        print(f"  hour-of-day of daily minimum (days with >= {mh} hours, n={tot}):")
        print("    " + " ".join(f"{h:02d}:{c / tot:.3f}" for h, c in enumerate(hist)))
        print(f"  ...restricted to days whose min < 20% (n={totl}):")
        print("    " + " ".join(f"{h:02d}:{(c / totl if totl else 0):.3f}" for h, c in enumerate(hist_low)))

    # per-user participation length
    ndays = [len(u["days"]) for u in users]
    print(f"\nper-user distinct local dates: median={statistics.median(ndays)} min={min(ndays)} max={max(ndays)}")
    span_lo = min(min(u["days"]) for u in users)
    span_hi = max(max(u["days"]) for u in users)
    print(f"local date span: {span_lo} .. {span_hi}")


if __name__ == "__main__":
    main()
