# Research Queue (ranked by value of information)

Yardstick: how much resolving the unknown would move profit/week or kiosk placement (see the sensitivity tab and STATS_TOOLKIT M4).

## Open
1. [ ] **Share of phones below 20% by hour (p_low_peak).** 2026-11-09: still no hourly histogram. New bounds: Li 2018 (41% of sessions end <20%), Guo 2017 (charge-start ≈ uniform, ~1 death/user/month) → low end raised to 0.05 (P051). Only the product c is identified (M7), so this matters for *placement and hourly shape*, not the calibrated total. Next: Hosio CHI 2016 full text (closed access — ask Toby for Vanderbilt library access); street survey remains the real fix. → P012, P051
2. [ ] **Decide where to centre c** (P055). Default c = 3.6e-4 gives 2.82 rentals/station/day (top of the 0.5–3 band, $492/week); the M5 prior centre 2.0e-4 gives ≈1.6/day (≈$240/week). Profit roughly halves. Present both to Toby; until then report profit as a function of c.
3. [ ] **Per-station OD footfall profiles:** today only 116 St OD drives the shared weekday 'subway' profile. Pull MTA OD 2025 (y2qv-fytt) for 96/103/110/125 St and weekends; give residential stations their own (AM-exit-light) shape; consider 2026 OD (28vm-gjqr) once a full term is in.
4. [ ] **Morris → Sobol global sensitivity** (M4), now with c as ONE factor (M7), not three. Needs numpy/SALib (needs Toby or a venv); or write Morris in plain JS.
5. [ ] **Daily-cap scenario:** add a $5–8/day cap lever to the engine (P049). Cap-vs-adoption/chargeback evidence: NOT FOUND again 2026-11-09 (only unverified '<1% non-return' Trustdata snippet).
6. [ ] **Event egress in engine:** replace the uniform 90-min spread with the MTA-fitted split (≈25/62/10/3 %, P040). Event low-battery multiplier: UK festival report (67% recharged at festival) unreachable (HTTP 500); still ASSUMPTION.
7. [ ] **Nashville footfall:** WeGo system 29.9k/weekday and time-of-day shares found (P056), but no pedestrian counts near Vanderbilt. Next: Vanderbilt campus pedestrian/shuttle (VandyRide) ridership; Nashville Downtown Partnership PDF by OCR; WeGo data request (needs Toby).
8. [ ] **Power-bank hold durations:** Citi Bike is far too short (median 9 min vs ChargeSPOT <60% in 1 h). Look for a better proxy: library laptop/charger loan durations, umbrella-share or locker-rental durations; INFORICH IR PDFs (needs PDF extraction).
9. [ ] Citi Bike gravity-model β for return location (from the saved script: extend to an end-distance histogram).
10. [ ] **Day-level random effect in the engine** (P035, CV 0.08).
11. [ ] Measured drain underground on a modern 5G phone (P013 LOW).
12. [ ] Shared power-bank non-return rate per rental (P053 gives only revenue-share proxies).
13. [ ] Miami: term-time (Sep–Oct 2026) Metrorail reports once posted; Miami Beach last-call status.

## Needs Toby (fieldwork, accounts, or decisions)
- [ ] Decide the calibration centre for c (queue #2): top-of-band 3.6e-4 vs prior-centre 2.0e-4.
- [ ] Library access to Hosio et al. CHI 2016 full text (closed access).
- [ ] Phone-charge street survey at candidate sites (GAME_PLAN §5) — now the single highest-value data item (queue #1).
- [ ] Bench test: pack recharge time vs. fill level; real output W.
- [ ] Export any pilot rental data from the app (anonymised aggregates).
- [ ] Decide whether to add a daily cap ($5–8/day) — pricing decision, see P049.
- [ ] Optional: `pip install numpy SALib` (or approve a project venv) for global sensitivity; Census API key if direct api.census.gov access is wanted.
- [ ] WeGo ridership data request (form at wegotransit.com) for Nashville.

## Done
- [x] 2026-11-09: Joint calibration p_aware × p_low_peak → single factor c (STATS_TOOLKIT M7, P055). Former item 2.
- [x] 2026-11-09: MTA OD exits vs entries at 116 St; weekday subway profile replaced (P054). Former item 10.
- [x] 2026-11-09: Citi Bike Morningside durations/end-locations (P052). Former item 5 (gravity β still open → item 9).
- [x] 2026-11-09: Columbia OPIR verified + Fall 2025 (P058). Former item 12.
- [x] 2026-11-09: Miami Metrorail station averages (P057). Former item 13 (partial).
- [x] 2026-11-09: Operator buyout/deposit proxies (P053). Former item 11 (partial).
- [x] 2026-11-07: MTA hourly profiles + weekday entries (P015–P018).
- [x] 2026-11-07: Comparables price/duration/benchmarks (P028–P031).
- [x] 2026-11-07: Pack energy and charge time (P022–P024).
- [x] 2026-11-08: NHPP fit + overdispersion at 116 St (P035, STATS_TOOLKIT M1). Former item 1 closed.
- [x] 2026-11-08: Battery drain by usage, no-signal multiplier, capacity fade, cold (P013, P037–P039). Former items 2 (partial: SoC-by-hour still open), 8, 13 (partial).
- [x] 2026-11-08: Events: venue sizes, egress shape, outages (P040–P043). Former item 7.
- [x] 2026-11-08: City/time-zone comparison: ACS mode share, Chicago CTA, sun times, last-call hours, Nashville campuses (P044–P048). Former items 6 (partial) and 10.
- [x] 2026-11-08: Methods: MC replication, CRN, Sobol/Morris, Gamma–Poisson EB, inventory models (STATS_TOOLKIT M3–M6). Former item 9.
- [x] 2026-11-08: Daily caps comparables (P049). Former item 14 (partial: effect on adoption not found).
