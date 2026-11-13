# chicago_hydepark_scooter_hourly_2025.csv
- **Source:** City of Chicago Data Portal, E-Scooter Trips (`2i5w-ykuw`), https://data.cityofchicago.org/resource/2i5w-ykuw.json — trips starting in community area 41 (Hyde Park, UChicago). Start times rounded to the hour, local CT.
- **Query:** SoQL `$select=date_extract_hh(start_time) as hh, date_extract_dow(start_time) as dow, count(*)`, grouped by hh,dow; windows 2025-10-06…11-21 (autumn term) and 2025-07-07…08-22 (summer); 35 weekdays + 12 weekend days each.
- **Downloaded:** 2026-11-13 by research agent; orchestrator re-fetched with `research/scripts/chicago_fetch_scooter.sh` and re-aggregated with `chicago_scooter_hourly.py` — identical.
- **Headline:** weekday trips/day term 864 vs summer 597 → ratio 1.45 (≈1.7 at 11–15 h). Term weekday shape: step up 09:00, plateau 11–16, peak 17:00, decline to 23:00.
- **Caveats:** scooter trips over a whole community area, not pedestrians at the campus edge; summer weather inflates scooter use, so 1.45 is a lower bound on a pedestrian term/break ratio. Hour 00 is inflated (rounding artefact).
