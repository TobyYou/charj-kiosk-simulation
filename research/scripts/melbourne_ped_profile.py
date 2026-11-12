# Agent-written (2026-11-12), reviewed by orchestrator; input: City of Melbourne pedestrian-counting-system monthly counts per hour, 2025 CSV export (';'-separated). Usage: python3 -I research/scripts/melbourne_ped_profile.py <mel_2025.csv>
# Hourly share profiles (local AEST/AEDT) from City of Melbourne pedestrian counting system, 2025.
import csv, sys, datetime, collections, statistics
path = sys.argv[1]
TERM = {3,4,5,8,9,10}   # approx UniMelb teaching months (S1 Mar-May, S2 Aug-Oct)
BREAK = {1,12}
rows = list(csv.DictReader(open(path, encoding='utf-8-sig'), delimiter=';'))
# day totals per (loc, date) -> keep only complete days (24 hours)
byday = collections.defaultdict(dict)
for r in rows:
    byday[(r['location_id'], r['sensing_date'])][int(r['hourday'])] = int(r['pedestriancount'])
def profile(loc, daytype, months):
    acc = collections.defaultdict(list); totals=[]
    for (l, d), hrs in byday.items():
        if l != loc or len(hrs) < 24: continue
        dt = datetime.date.fromisoformat(d)
        if dt.month not in months: continue
        wk = dt.weekday() < 5
        if (daytype == 'wd') != wk: continue
        tot = sum(hrs.values())
        if tot == 0: continue
        totals.append(tot)
        for h in range(24): acc[h].append(hrs[h] / tot)
    if not totals: return None
    return [round(100*statistics.mean(acc[h]), 1) for h in range(24)], len(totals), round(statistics.median(totals)), round(statistics.pstdev(totals)/statistics.mean(totals), 2)
names = {'4':'Town Hall (West) CBD','43':'Monash Rd-Swanston (UniMelb)','44':'Tin Alley-Swanston (UniMelb)','59':'RMIT Building 80'}
for loc in ['44','43','59','4']:
    for dtp in ['wd','we']:
        for lab, m in [('term', TERM), ('break', BREAK)]:
            p = profile(loc, dtp, m)
            if p: print(names[loc], dtp, lab, 'n_days=%d median_daily=%d cv=%.2f' % (p[1], p[2], p[3])); print('  pct_by_hour0-23:', p[0])
