# conversion_calibration_sweep.csv

- **What:** simulator output (not external data). Rentals/station/day and profit/week for the 13-station network, normal week, 30 Monte Carlo reps per point with common random numbers, as the funnel product c = p_aware × p_low_peak × p_seek is swept.
- **Produced by:** `node research/scripts/calibrate_conversion.mjs 30` on 2026-11-09 (simulator after today's change of the weekday subway profile to MTA OD entries+exits; a first run on the old profile gave 2.927/day at the default).
- **Columns:** c (renters per passer-by at evening peak), rentals_per_station_day, its 95% CI half-width, profit_per_week (USD), its 95% CI half-width, unmet_empty (would-be renters who found an empty station, per week).
- **Identification check (same run):** reaching c = 1.8e-4, 3.6e-4, 7.2e-4 via p_aware or via p_low_peak gave identical outputs (1.494 / 2.815 / 5.175 rentals/station/day). The data can only pin down c, not its factors.
- **Caveat:** re-run whenever footfall profiles, LOW_BATTERY_CURVE, pricing, or stocking change; the c↔rentals map shifts with them.
