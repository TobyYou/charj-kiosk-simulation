# Research Queue (ranked by value of information)

Yardstick: how much resolving the unknown would move profit/week or kiosk placement (see the sensitivity tab and STATS_TOOLKIT M4).

## Open
1. [ ] **Share of phones below 20% by hour (p_low_peak, top profit driver).** 2026-11-08: still no open hourly SoC histogram (Carat, Device Analyzer, LiveLab, Sherlock checked). Sweep shows profit/week $142 / $336 / $543 at p_low 0.04 / 0.08 / 0.12. Next: try to extract Hosio CHI 2016 and Li et al. arXiv 1801.04069 figures (PDF text extraction failed; try pypdf in a venv), and ask Toby for the street survey. → P012
2. [ ] **Joint calibration of p_aware × p_low_peak.** They are only identified as a product against the 0.5–3 band. Re-express the funnel as one calibrated "conversion per passer-by" with a Gamma prior (STATS_TOOLKIT M5) so lowering p_low doesn't silently shift p_aware.
3. [ ] **Morris → Sobol global sensitivity** (STATS_TOOLKIT M4): build a Node harness that reads a parameter CSV and writes outputs; needs numpy/SALib (not installed — needs Toby or a venv).
4. [ ] **Daily-cap scenario:** add a $5–8/day cap lever to the engine; comparables all cap (P049). Look for any evidence on caps vs adoption or chargebacks (still NOT FOUND).
5. [ ] **Citi Bike trip durations near Morningside** (download one monthly file, aggregate stations 110–125 St; fit lognormal; save only the aggregate + script). Also fit a gravity-model β for returns.
6. [ ] **Event egress in engine:** replace the uniform 90-min spread with the MTA-fitted split (≈25/62/10/3 % by hour, P040); re-check at a Barclays or MSG station (34 St–Penn) and at 116 St on a Columbia commencement/Homecoming day.
7. [ ] **Nashville footfall:** Nashville Downtown Partnership 2025 annual report has Placer.ai figures in an image/font-encoded PDF (read by eye or OCR); Vanderbilt campus visitor/class-change data; WeGo data request (needs Toby — form submission).
8. [ ] **Day-level random effect in the engine** (P035, CV 0.08 weekday). Low priority for rental counts; matters for multi-day stock-out risk.
9. [ ] Measured drain underground on a modern 5G phone (P013 still LOW); check 2026 NYC subway tunnel coverage (MTA/Transit Wireless).
10. [ ] Exit counts at 116 St: is "exits ≈ entries" right? (MTA hourly data only has entries; look for MTA origin–destination ridership estimates dataset on data.ny.gov.)
11. [ ] Shared power-bank rental-duration distribution and non-return rate from any operator filing (search Energy Monster 20-F text for "lost"/"sold" power banks; INFORICH quarterly decks).
12. [ ] Verify Columbia OPIR figures from the PDFs directly (taken from search snippets).
13. [ ] Miami-Dade Metrorail station averages (monthly PDFs; needs PDF text tools) and Miami Beach 2026 last-call status.

## Needs Toby (fieldwork, accounts, or decisions)
- [ ] Phone-charge street survey at candidate sites (GAME_PLAN §5) — now the single highest-value data item (queue #1).
- [ ] Bench test: pack recharge time vs. fill level; real output W.
- [ ] Export any pilot rental data from the app (anonymised aggregates).
- [ ] Decide whether to add a daily cap ($5–8/day) — pricing decision, see P049.
- [ ] Optional: `pip install numpy SALib` (or approve a project venv) for global sensitivity; Census API key if direct api.census.gov access is wanted.
- [ ] WeGo ridership data request (form at wegotransit.com) for Nashville.

## Done
- [x] 2026-11-07: MTA hourly profiles + weekday entries (P015–P018).
- [x] 2026-11-07: Comparables price/duration/benchmarks (P028–P031).
- [x] 2026-11-07: Pack energy and charge time (P022–P024).
- [x] 2026-11-08: NHPP fit + overdispersion at 116 St (P035, STATS_TOOLKIT M1). Former item 1 closed.
- [x] 2026-11-08: Battery drain by usage, no-signal multiplier, capacity fade, cold (P013, P037–P039). Former items 2 (partial: SoC-by-hour still open), 8, 13 (partial).
- [x] 2026-11-08: Events: venue sizes, egress shape, outages (P040–P043). Former item 7.
- [x] 2026-11-08: City/time-zone comparison: ACS mode share, Chicago CTA, sun times, last-call hours, Nashville campuses (P044–P048). Former items 6 (partial) and 10.
- [x] 2026-11-08: Methods: MC replication, CRN, Sobol/Morris, Gamma–Poisson EB, inventory models (STATS_TOOLKIT M3–M6). Former item 9.
- [x] 2026-11-08: Daily caps comparables (P049). Former item 14 (partial: effect on adoption not found).
