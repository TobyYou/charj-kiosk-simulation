# melbourne_ped_hourly_profiles_2025.csv
- **Source:** City of Melbourne Open Data, "Pedestrian Counting System – Monthly (counts per hour)", CC BY 4.0. https://data.melbourne.vic.gov.au/explore/dataset/pedestrian-counting-system-monthly-counts-per-hour/ — 2025 export for sensors 4 (Town Hall West, CBD), 43 (Monash Rd–Swanston, UniMelb), 44 (Tin Alley–Swanston, UniMelb), 59 (RMIT Building 80).
- **Downloaded:** 2026-11-12 by research agent C (raw CSV ≈0.95 MB kept in session scratchpad, not in repo). Re-run by orchestrator: output identical.
- **Script:** `research/scripts/melbourne_ped_profile.py` (stdlib).
- **What:** mean share of the daily count in each local hour (h00–h23, Melbourne AEST/AEDT, `hourday` assumed = hour beginning — not confirmed), complete 24-hour days only; wd = Mon–Fri, we = Sat–Sun. "term" = Mar–May + Aug–Oct, "break" = Dec–Jan (APPROXIMATE university semesters, not official dates). n_days, median daily count, CV of daily totals.
- **Use:** shape prior for campus-edge pedestrian footfall where no local hourly counts exist (Nashville / Vanderbilt, P083). Term/break ratio at RMIT B80 2.6× and UniMelb Monash Rd 2.4× (weekday medians); CBD sensor shows no term effect.
- **Caveats:** southern hemisphere, Australian city-centre campuses (denser than Vanderbilt), approximate terms; weekday holidays not excluded.
