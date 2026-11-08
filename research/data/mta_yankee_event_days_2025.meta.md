# mta_yankee_event_days_2025.csv
- **Source:** MTA Subway Hourly Ridership: Beginning 2025 (data.ny.gov 5wq4-mkjj), station_complex_id 604 = 161 St–Yankee Stadium. Entries per hour, local ET.
- **Query:** $select=date_extract_hh(transit_timestamp) as hr,sum(ridership) as entries, one date per call, $group=hr.
- **Downloaded:** 2026-11-08.
- **Days:** 2025-04-03 (Thu, night game), 2025-04-04 (Fri, no game), 2025-03-29 (Sat, afternoon game), 2025-04-05 (Sat, no game). Game days were inferred from the spikes and NOT cross-checked against MLB box scores.
- **Use:** shape of post-event transit egress: ~60–65% of excess entries in the peak hour, ~25% in the hour before.
