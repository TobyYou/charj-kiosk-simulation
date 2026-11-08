# Routine Notes: lessons for running the daily research job

- 2026-11-07: Routine created. First run should prioritise queue items 1–4: footfall, battery state, comparables, and pack energy.
- 2026-11-07: First research batch done by hand (3 parallel agents) while building the simulator. Good sources: data.ny.gov MTA hourly API (aggregatable with SoQL), SEC EDGAR full-text of Energy Monster filings, INFORICH securities report on edinetdb. Dead ends: share of phones <20% by hour; measured subway drain; US shared-power-bank adoption.
- 2026-11-07: The simulator (simulator/js/params.js) is now the consumer of PARAMETERS.md. Whenever a value changes here, update params.js with the same value, range, confidence and URL, then run `node simulator/cli.mjs 50 normal all` and record rentals/station/day vs the 0.5–3 benchmark band in the daily report.

