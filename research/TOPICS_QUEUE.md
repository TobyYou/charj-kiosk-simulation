# Research Queue (ranked by value of information)

Yardstick: how much resolving the unknown would move profit/week or kiosk placement (see the sensitivity tab and STATS_TOOLKIT M4).

## Open
1. [ ] **Decide where to centre c** (P055) — now the dominant question. New evidence 2026-11-11: ChargeSPOT Australia (US-like price ≈US$7–8/rental) runs 0.48–0.84 rentals/station/day (P074), Japan 1.27, Taiwan 1.4; our default c gives 2.92 (top of band). Australia-level c (≈6e-5–1e-4) → $0–100/wk vs $416/wk at default. Present the profit curve over c to Toby/investors rather than a point; consider re-centring default at ≈1.5/day (c ≈ 1.75e-4).
2. [ ] **Pin down the two cost assumptions now in Morris top-5** (P080): rebalance_cost ($6–25/stop, μ* $227) and forfeit_churn_cost ($0–25, μ* $171). Ask Toby for planned rebalancing labour/route; look for bike-share/scooter rebalancing cost per stop (Citi Bike/Lyft filings, NACTO) and subscription-churn after a penalty charge.
3. [ ] **Sobol indices on the top ~8 Morris factors** (M4), now that the engine artefacts are fixed (P079/P080). Plain-JS Saltelli estimator; N≈256 × (k+2) evals × 10 reps ≈ 15–20 min.
4. [ ] **Rental-duration calibration** (P059, P076, M8): the engine's stay holds are far shorter than Japan's (36–51% in 30–60 min vs 16%); decide whether Charj's per-started-hour pricing justifies that or whether stay users keep the pack longer (dwell, not charge-to-target). Mixture fit says: calibrate stay share + stay median, not away_return_median_h.
5. [ ] **Use the implied price elasticity (−0.3 to −1.0, P075) to check the WTP logistic** (wtp_mid_hourly): compute the simulator's arc elasticity between $1 and $2/hr and compare.
6. [ ] **Confirm BST-0155 real output** (P072): 20 W per cable in the UN38.3 report vs 22.5 W in GAME_PLAN; does the Lightning cable negotiate 9 V PD? (Needs Toby / Besiter or a bench test.)
7. [ ] **weekendFactor: OD vs hourly entries** (P070). 2026-11-11: OD entries-only ratio reproduces hourly at 116 St (0.50 vs 0.49) but not at 103 St (0.68 vs 0.60), so the gap is year/source, not exits. Next: re-query 5wq4-mkjj one station and one month at a time (full-year multi-station aggregations time out).
8. [ ] **Nashville footfall model** (P066, P077, P078): build a campus-population anchor (≈7.5k UG mostly resident, ≈7.6k VU staff, VUMC 43k) + FirstBank Stadium game-day scenario (7 home games 2026). Hourly counts remain NOT public.
9. [ ] **Daily-cap scenario** ($5–8/day; P049, P061). Adoption effect still NOT FOUND.
10. [ ] **Event egress in engine** (P040, P063).
11. [ ] GreenHub replication of the low-battery curve on modern phones (needs pyarrow — Toby).
12. [ ] Citi Bike gravity-model β for return location.
13. [ ] Day-level random effect in the engine (P035, CV 0.08).
14. [ ] Measured drain underground on a modern 5G phone (P013 LOW).
15. [ ] Per-rental non-return rate (still no operator figure; China 2019 overdue <0.5% of orders is a pointer only).
16. [ ] Miami: term-time Metrorail reports once posted.

## Needs Toby (fieldwork, accounts, or decisions)
- [ ] Decide the calibration centre for c (queue #2): top-of-band 3.6e-4 vs prior-centre 2.0e-4.
- [x] ~~Library access to Hosio CHI 2016~~ — open author copy found 2026-11-10 (P067).
- [ ] Phone-charge street survey at candidate sites (GAME_PLAN §5) — now the single highest-value data item (queue #1).
- [ ] Bench test: pack recharge time vs. fill level; real output W — and whether the iOS cable delivers 9 V PD (P072: report says 20 W max, GAME_PLAN says 22.5 W).
- [ ] Rebalancing plan: who restocks, how often, cost per stop (rebalance_cost is now a top-4 profit lever, P080).
- [ ] Export any pilot rental data from the app (anonymised aggregates).
- [ ] Decide whether to add a daily cap ($5–8/day) — pricing decision, see P049.
- [ ] Optional: `pip install pyarrow` (to read GreenHub Parquet, queue #1); `pip install numpy SALib` (or approve a project venv) for global sensitivity; Census API key if direct api.census.gov access is wanted.
- [ ] WeGo ridership data request (form at wegotransit.com) for Nashville.

## Done
- [x] 2026-11-11: Hourly share of phones <20% computed from ExtraSensory (P071, M9); LOW_BATTERY_CURVE + weekend curve replaced. Former item 1.
- [x] 2026-11-11: Engine artefacts fixed — rebalancing fill policy and forfeit dispute/churn costs; Morris re-run (P079, P080). Former item 2 (Sobol → item 3).
- [x] 2026-11-11: Shared-pack charge speed (P072, P073): phone_rate_fast 1.8 → 1.5. Former item 5.
- [x] 2026-11-11: Duration mixture fit (P076) — partial; calibration still open (item 4).
- [x] 2026-11-10: Morris screening in plain JS (STATS_TOOLKIT M4, P068); found and fixed the failed-return billing artefact (grace_failed_return). Former item 4 (Sobol still open → item 2).
- [x] 2026-11-10: Per-station OD footfall profiles for 96/103/110/116/125 St, weekday + weekend (P069). Former item 3.
- [x] 2026-11-10: Power-bank hold-duration distribution found: ChargeSPOT Japan histogram + HK (P059, P060). Former item 8.
- [x] 2026-11-10: Nashville WeGo route/stop ridership and Vanderbilt commute mode (P065, P066). Former item 7 (partial).
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
