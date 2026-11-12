"""Daily subway entries for the five Broadway-1-line stations, 2025, from MTA hourly ridership
(data.ny.gov 5wq4-mkjj), queried one station x one month at a time (bigger aggregations time out,
ROUTINE_NOTES 2026-11-11). Writes research/data/mta_daily_entries_1line_2025.csv and prints the
weekend/weekday ratio per station (avg Sat+Sun day / avg Mon-Fri day), excluding US federal holidays.
Usage: python3 -I research/scripts/mta_daily_entries_2025.py
"""
import csv, datetime as dt, json, os, subprocess, sys, time, urllib.parse

STATIONS = {'306': '125 St (1)', '307': '116 St-Columbia (1)', '308': '110 St (1)', '309': '103 St (1)', '310': '96 St (1,2,3)'}
HOLIDAYS = {'2025-01-01', '2025-01-20', '2025-02-17', '2025-05-26', '2025-06-19', '2025-07-04', '2025-09-01',
            '2025-10-13', '2025-11-11', '2025-11-27', '2025-12-25'}
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'data', 'mta_daily_entries_1line_2025.csv')
BASE = 'https://data.ny.gov/resource/5wq4-mkjj.json'


def month_query(sid, y, m):
    start = dt.date(y, m, 1)
    end = dt.date(y + (m == 12), m % 12 + 1, 1)
    q = {'$select': 'date_trunc_ymd(transit_timestamp) as day, sum(ridership) as entries',
         '$where': f"station_complex_id='{sid}' AND transit_timestamp >= '{start}T00:00:00' AND transit_timestamp < '{end}T00:00:00'",
         '$group': 'day', '$order': 'day', '$limit': '100'}
    url = BASE + '?' + urllib.parse.urlencode(q)
    for attempt in range(3):
        try:
            # curl, not urllib: the macOS python.org build here has no CA bundle configured
            return json.loads(subprocess.run(['curl', '-s', '-m', '120', url], check=True, capture_output=True).stdout)
        except Exception as e:  # network hiccup: retry
            print(f'  retry {sid} {y}-{m:02d}: {e}', file=sys.stderr)
            time.sleep(3)
    raise RuntimeError(f'failed {sid} {y}-{m}')


rows = []
for sid, name in STATIONS.items():
    for m in range(1, 13):
        for rec in month_query(sid, 2025, m):
            rows.append((sid, name, rec['day'][:10], float(rec['entries'])))
    print(f'{name}: done', file=sys.stderr)

with open(OUT, 'w', newline='') as f:
    w = csv.writer(f)
    w.writerow(['station_complex_id', 'station', 'date', 'dow', 'holiday', 'entries'])
    for sid, name, d, e in rows:
        day = dt.date.fromisoformat(d)
        w.writerow([sid, name, d, day.strftime('%a'), d in HOLIDAYS, int(e)])

print('station               n_wkday  avg_wkday  avg_sat  avg_sun  wkend/wkday  sat/wkday  sun/wkday  term(Sep-Nov) wkend/wkday')
for sid, name in STATIONS.items():
    def avg(pred):
        v = [e for s, _, d, e in rows if s == sid and pred(dt.date.fromisoformat(d), d)]
        return (sum(v) / len(v) if v else float('nan')), len(v)
    wk, n = avg(lambda x, d: x.weekday() < 5 and d not in HOLIDAYS)
    sa, _ = avg(lambda x, d: x.weekday() == 5)
    su, _ = avg(lambda x, d: x.weekday() == 6)
    twk, _ = avg(lambda x, d: x.weekday() < 5 and d not in HOLIDAYS and 9 <= x.month <= 11)
    twe, _ = avg(lambda x, d: x.weekday() >= 5 and 9 <= x.month <= 11)
    print(f'{name:22s} {n:7d} {wk:10.0f} {sa:8.0f} {su:8.0f} {((sa + su) / 2) / wk:12.3f} {sa / wk:10.3f} {su / wk:10.3f} {twe / twk:12.3f}')
