# mta_116st_hourly_fall2026.csv
- **Source:** MTA Subway Hourly Ridership: Beginning 2025 (data.ny.gov dataset 5wq4-mkjj), station_complex_id 307 = "116 St-Columbia University (1)".
- **URL:** https://data.ny.gov/resource/5wq4-mkjj.csv
- **Query (SoQL):** `$select=date_trunc_ymd(transit_timestamp) as day, date_extract_hh(transit_timestamp) as hour, sum(ridership) as entries` `$where=station_complex_id='307' AND transit_timestamp >= '2026-09-14T00:00:00' AND transit_timestamp < '2026-11-01T00:00:00'` `$group=day,hour` `$order=day,hour`
- **Downloaded:** 2026-11-08. Data available through 2026-10-29 (46 days × 24 h = 1,104 rows).
- **Units:** entries (OMNY + MetroCard swipes, all fare classes) per hour, local time ET. Exits are NOT in this dataset.
- **Caveats:** weekend days in this window show very large day-to-day swings (CV 0.42), consistent with weekend 1-train service changes; use the MTA 2024 annual weekend ratios (P017) for the base case.
- **Derived:** `nhpp_116st_fit.csv` via `research/scripts/fit_nhpp_mta.py`.
