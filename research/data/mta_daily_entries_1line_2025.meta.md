# mta_daily_entries_1line_2025.csv
- **Source:** MTA Subway Hourly Ridership: Beginning 2025 (data.ny.gov dataset 5wq4-mkjj), https://data.ny.gov/resource/5wq4-mkjj.json; station_complex_id 306 125 St (1), 307 116 St-Columbia University (1), 308 Cathedral Pkwy (110 St) (1), 309 103 St (1), 310 96 St (1,2,3).
- **Query:** one station × one calendar month at a time, `$select=date_trunc_ymd(transit_timestamp) as day, sum(ridership) as entries`, `$group=day` (full-year aggregations time out). Script: `research/scripts/mta_daily_entries_2025.py` (60 queries, ≈3 min).
- **Downloaded:** 2026-11-12. Period 2025-01-01 to 2025-12-31, all days.
- **Units:** entries per day (OMNY + MetroCard, all fare classes), local date ET. No exits.
- **Columns:** station_complex_id, station, date, dow, holiday (US federal holiday 2025), entries.
- **Derived (P081):** avg (Sat+Sun)/2 ÷ avg non-holiday weekday: 96 St 0.704, 103 St 0.665, 110 St 0.676, 116 St 0.482, 125 St 0.594; Sep–Nov term only: 0.695 / 0.665 / 0.704 / 0.496 / 0.562. Sat/weekday 0.67–0.77 at 4 of 5 stations (116 St 0.54); Sun/weekday 0.42–0.64.
