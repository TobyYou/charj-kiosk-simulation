#!/usr/bin/env python3
"""Citi Bike trip durations for trips STARTING near Columbia (Morningside Heights).

Usage: python3 -I citibike_morningside_durations.py <path/to/YYYYMM-citibike-tripdata.zip> [out.csv]

Standard library only. Streams every CSV inside the zip (Citi Bike splits a month
into several CSVs), filters by START lat/lng box, and writes aggregate metrics only.

Filter box (start station): 40.800 <= lat <= 40.815, -73.970 <= lng <= -73.955
(~W 110th St to W 125th St, Riverside Dr to Morningside/Amsterdam Ave).
"Local return" = end lat/lng also inside the same box.
Times in the files are local NYC wall-clock time (ET), so start hour is used as-is.
"""
import csv
import io
import math
import statistics
import sys
import zipfile
from datetime import datetime

LAT_MIN, LAT_MAX = 40.800, 40.815
LNG_MIN, LNG_MAX = -73.970, -73.955


def in_box(lat, lng):
    return LAT_MIN <= lat <= LAT_MAX and LNG_MIN <= lng <= LNG_MAX


def haversine_km(lat1, lng1, lat2, lng2):
    r = 6371.0088
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = p2 - p1
    dl = math.radians(lng2 - lng1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def parse_ts(s):
    s = s.strip()
    for fmt in ("%Y-%m-%d %H:%M:%S.%f", "%Y-%m-%d %H:%M:%S"):
        try:
            return datetime.strptime(s, fmt)
        except ValueError:
            pass
    return None


def quantile(sorted_vals, q):
    # linear interpolation (type 7)
    n = len(sorted_vals)
    if n == 0:
        return float("nan")
    h = (n - 1) * q
    lo = math.floor(h)
    hi = min(lo + 1, n - 1)
    return sorted_vals[lo] + (h - lo) * (sorted_vals[hi] - sorted_vals[lo])


def main():
    zpath = sys.argv[1]
    out = sys.argv[2] if len(sys.argv) > 2 else None
    total_rows = 0
    bad_rows = 0
    durs = []           # minutes, all filtered trips with valid times
    member = casual = other_type = 0
    hours_wd = [0] * 24
    hours_we = [0] * 24
    local_end = elsewhere_end = missing_end = 0
    dists = []
    days = set()
    ebike = classic = 0
    with zipfile.ZipFile(zpath) as zf:
        names = [n for n in zf.namelist()
                 if n.lower().endswith(".csv") and not n.startswith("__MACOSX")]
        for name in names:
            with zf.open(name) as fh:
                rdr = csv.DictReader(io.TextIOWrapper(fh, encoding="utf-8", newline=""))
                for row in rdr:
                    total_rows += 1
                    try:
                        slat = float(row["start_lat"]); slng = float(row["start_lng"])
                    except (ValueError, KeyError, TypeError):
                        bad_rows += 1
                        continue
                    if not in_box(slat, slng):
                        continue
                    t0 = parse_ts(row["started_at"]); t1 = parse_ts(row["ended_at"])
                    if t0 is None or t1 is None:
                        bad_rows += 1
                        continue
                    m = (t1 - t0).total_seconds() / 60.0
                    durs.append(m)
                    days.add(t0.date())
                    mc = (row.get("member_casual") or "").strip().lower()
                    if mc == "member":
                        member += 1
                    elif mc == "casual":
                        casual += 1
                    else:
                        other_type += 1
                    rt = (row.get("rideable_type") or "").lower()
                    if "electric" in rt:
                        ebike += 1
                    elif "classic" in rt:
                        classic += 1
                    (hours_we if t0.weekday() >= 5 else hours_wd)[t0.hour] += 1
                    try:
                        elat = float(row["end_lat"]); elng = float(row["end_lng"])
                    except (ValueError, KeyError, TypeError):
                        missing_end += 1
                        continue
                    if in_box(elat, elng):
                        local_end += 1
                    else:
                        elsewhere_end += 1
                    dists.append(haversine_km(slat, slng, elat, elng))

    n = len(durs)
    s = sorted(durs)
    clean = [d for d in s if 1.0 <= d <= 1440.0]
    logs = [math.log(d) for d in clean]
    mu = statistics.fmean(logs)
    sigma = math.sqrt(sum((x - mu) ** 2 for x in logs) / len(logs))  # MLE (1/n)
    n_wd_days = sum(1 for d in days if d.weekday() < 5)
    n_we_days = sum(1 for d in days if d.weekday() >= 5)
    with_end = local_end + elsewhere_end

    rows = [
        ("rows_scanned_all_nyc", total_rows, "count", ""),
        ("rows_unparseable", bad_rows, "count", "missing start coords or timestamps"),
        ("n_trips_in_box", n, "count", "start inside box"),
        ("days_covered", len(days), "days", f"weekday={n_wd_days} weekend={n_we_days}"),
        ("trips_per_day_mean", round(n / max(len(days), 1), 1), "trips/day", ""),
    ]
    for q in (0.10, 0.25, 0.50, 0.75, 0.90, 0.99):
        rows.append((f"dur_p{int(q*100)}_min", round(quantile(s, q), 2), "minutes", "all trips in box"))
    rows += [
        ("dur_mean_min", round(statistics.fmean(s), 2), "minutes", "all trips in box"),
        ("n_clean_1min_24h", len(clean), "count", "dropped <1 min and >24 h"),
        ("lognorm_mu_ln_min", round(mu, 4), "ln(minutes)", "MLE on clean trips"),
        ("lognorm_sigma_ln_min", round(sigma, 4), "ln(minutes)", "MLE (1/n) on clean trips"),
        ("lognorm_median_min", round(math.exp(mu), 2), "minutes", "exp(mu)"),
        ("share_gt_60min", round(sum(d > 60 for d in s) / n, 5), "share", ""),
        ("share_gt_180min", round(sum(d > 180 for d in s) / n, 5), "share", ""),
        ("share_gt_24h", round(sum(d > 1440 for d in s) / n, 6), "share", ""),
        ("share_lt_1min", round(sum(d < 1 for d in s) / n, 5), "share", "false starts/redocks"),
        ("member_share", round(member / n, 4), "share", f"member={member} casual={casual} other={other_type}"),
        ("casual_share", round(casual / n, 4), "share", ""),
        ("ebike_share", round(ebike / n, 4), "share", f"electric={ebike} classic={classic}"),
        ("share_end_in_box", round(local_end / with_end, 4), "share", "end lat/lng inside same box (of trips with end coords)"),
        ("share_end_elsewhere", round(elsewhere_end / with_end, 4), "share", ""),
        ("n_missing_end_coords", missing_end, "count", "no end coords (often lost/unreturned bikes)"),
        ("dist_median_km", round(statistics.median(dists), 3), "km", "haversine start->end"),
        ("dist_p90_km", round(quantile(sorted(dists), 0.9), 3), "km", "haversine start->end"),
        ("share_dist_lt_50m", round(sum(d < 0.05 for d in dists) / len(dists), 4), "share", "same-station round trips approx"),
    ]
    for h in range(24):
        rows.append((f"weekday_hour_{h:02d}_trips_per_day", round(hours_wd[h] / max(n_wd_days, 1), 2), "trips/day", f"total={hours_wd[h]}"))
    for h in range(24):
        rows.append((f"weekend_hour_{h:02d}_trips_per_day", round(hours_we[h] / max(n_we_days, 1), 2), "trips/day", f"total={hours_we[h]}"))

    fh = open(out, "w", newline="") if out else sys.stdout
    w = csv.writer(fh)
    w.writerow(["metric", "value", "unit", "note"])
    w.writerows(rows)
    if out:
        fh.close()


if __name__ == "__main__":
    main()
