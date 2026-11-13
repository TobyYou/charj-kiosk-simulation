"""Lower Broadway (Nashville, CT) nightlife hourly shape from MNPD Calls for Service 2024+2025 (P092).
Reads the paged ArcGIS JSON saved by mnpd_fetch_calls.sh (2025) and its 2024 variant into <dir>/mnpd and
<dir>/mnpd2024 (files broadway_*.json). Service day starts 05:00 local (America/Chicago). The 15:00 shift-change
spike (B shift start, officer-initiated calls) is replaced by the mean of 14:00 and 16:00. Output: share of the
day-type's calls by local hour, averaged over the two years, and a multiplier relative to the Fri/Sat peak hour.
Usage: python3 -I research/scripts/broadway_night_profile.py <download_dir> <out.csv>"""
import json, glob, sys, csv, collections, datetime
from zoneinfo import ZoneInfo
TZ = ZoneInfo("America/Chicago")
D, OUT = sys.argv[1], sys.argv[2]
def load(sub):
    out = []
    for f in sorted(glob.glob(f"{D}/{sub}/broadway_*.json")):
        for ft in json.load(open(f))["features"]:
            a = ft["attributes"]
            if a["Call_Received"]:
                out.append(datetime.datetime.fromtimestamp(a["Call_Received"] / 1000, datetime.timezone.utc).astimezone(TZ))
    return out
def dtype(t):
    w = (t - datetime.timedelta(hours=5)).weekday()
    return "MonThu" if w <= 3 else ("FriSat" if w in (4, 5) else "Sun")
def shares(rows, dt):
    c = collections.Counter(t.hour for t in rows if dtype(t) == dt)
    s = [c[h] for h in range(24)]
    s[15] = (s[14] + s[16]) / 2  # shift-change artefact
    n = sum(s); return [v / n for v in s]
yrs = {"2024": load("mnpd2024"), "2025": load("mnpd")}
prof = {dt: [sum(shares(r, dt)[h] for r in yrs.values()) / len(yrs) for h in range(24)] for dt in ("MonThu", "FriSat", "Sun")}
peak = max(prof["FriSat"])
with open(OUT, "w", newline="") as fo:
    w = csv.writer(fo); w.writerow(["local_hour_CT", "share_MonThu", "share_FriSat", "share_Sun", "mult_FriSat_vs_peak", "n_years"])
    for h in range(24):
        w.writerow([h] + [round(prof[d][h], 4) for d in ("MonThu", "FriSat", "Sun")] + [round(prof["FriSat"][h] / peak, 3), len(yrs)])
print({y: len(r) for y, r in yrs.items()})
for h in range(24): print(h, *(f"{prof[d][h]:.3f}" for d in ("MonThu", "FriSat", "Sun")))
