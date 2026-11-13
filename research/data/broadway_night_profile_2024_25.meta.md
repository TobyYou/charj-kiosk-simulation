# broadway_night_profile_2024_25.csv
- **Derived from:** MNPD Calls for Service 2024 (6,375 calls) + 2025 (5,088 calls) in the Lower Broadway envelope (see mnpd_calls_hourly_broadway_vandy_2025.meta.md). Built 2026-11-13 by `research/scripts/broadway_night_profile.py`.
- **Method:** share of each day type's calls by local hour (America/Chicago, service day from 05:00), 15:00 replaced by mean(14:00,16:00) (shift-change artefact) and renormalised; averaged over 2024 and 2025. `mult_FriSat_vs_peak` = share / max Fri/Sat share (peak 00:00).
- **Stability:** Fri/Sat hourly shares correlate r = 0.969 between 2024 and 2025; Sun–Thu r = 0.855.
- **Volume ratio:** Fri/Sat 20.3 calls/day vs Mon–Thu 11.4 and Sun 11.3 (2025) → ≈1.8× per day, ≈4–6× at 22:00–02:00.
- **Use:** hourly SHAPE prior for a Nashville "Broadway nightlife" zone (P092). Absolute level must come from P078 (17M visitors, 191 venues) — not from call counts. Confidence MED (proxy).
