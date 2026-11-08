#!/usr/bin/env python3
"""Post-event transit egress shape from MTA hourly entries at 161 St-Yankee Stadium.

Input : research/data/mta_yankee_event_days_2025.csv (date,type,hour,entries)
Pairs : each game day with a same-weekday-type no-game baseline; excess(h) = game(h) - base(h).
Output: printed excess entries and the share of total excess per hour (local ET).
Run   : python3 -I research/scripts/event_egress_shape.py
"""
import csv, os, sys
p = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), '..', 'data', 'mta_yankee_event_days_2025.csv')
d = {}
for r in csv.DictReader(open(p)):
    d.setdefault(r['date'], {})[int(r['hour'])] = float(r['entries'])
pairs = [('2025-04-03', '2025-04-04', 'Thu night game vs Fri no game'), ('2025-03-29', '2025-04-05', 'Sat afternoon game vs Sat no game')]
for g, b, lab in pairs:
    ex = {h: d[g][h] - d[b][h] for h in range(24)}
    pos = {h: v for h, v in ex.items() if v > 300}
    tot = sum(pos.values())
    peak = max(pos, key=pos.get)
    print(f'{lab}: total excess (hours with >300 extra) = {tot:.0f}')
    for h in sorted(pos):
        print(f'  {h:02d}:00 ET  +{pos[h]:6.0f}  {100*pos[h]/tot:5.1f}%' + ('  <- peak' if h == peak else ''))
