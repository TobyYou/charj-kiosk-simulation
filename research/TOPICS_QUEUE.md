# Research Queue (ranked by value of information)

Yardstick: how much resolving the unknown would move profit/week or kiosk placement (see the sensitivity tab and STATS_TOOLKIT M4).

## Open
1. [ ] **Decide where to centre c** (P055, P091). wtp_mid is now calibrated (2.25), so c is the only big lever. The wide 0.5–3 band can't pin it; the price-matched Australia band (0.48–0.84/day) puts c at 6e-5–1e-4 (≈$30–90/wk at $1/hr; $45–220/wk at $2/hr). Present the profit curve over c at $1, $1.5 and $2/hr. This needs Toby's decision or pilot data.
2. [ ] **EVPPI ranking of uncertain inputs** (STATS_TOOLKIT M11). Decisions are price {1, 1.5, 2} × host_share. Uncertain inputs are c, rebalance_cost, forfeit_churn_cost, p_stay, away_return_median_h, wtp_mid. The regression or binning estimator replaces Sobol as the research-priority yardstick.
3. [ ] **Nashville footfall model in the engine** (P077, P078, P083, P092, P096). Inputs:
   - Campus zones: about 5,500 on-campus UG, 13.6k students and VU+VUMC staff, with the Melbourne/Chicago CT shape. The term/break ratio is 2.0 (1.45–2.6).
   - A Broadway night zone with the MNPD shape (P092). Its level comes from P078.
   - The stadium scenario.
   This needs a Nashville SITES set in geo.js.
4. [ ] **Student price segment.** INFORICH's youth churn and its U22 discount (P091) suggest steeper price response for students. Look for student-specific elasticities, e.g. campus transit or laundry, or the U22 uptake numbers in INFORICH decks.
5. [ ] **Rental-duration calibration** (P059, P076, M8 note): calibrate the stay share and stay median. State an effective N, and get df ≥ 1 by fixing the away tail.
6. [ ] **Term/break calendar scenario** for NYC and Nashville (P085, with ratio 2.0 from P096). Add a "break week" to SCENARIOS.
7. [ ] **forfeit_churn_cost from residual LTV.** P094 gives ≈4.4 rentals per yearly active user. Multiply by margin per rental, and assume the share of churners lost. The 30/90-day repeat share is still NOT FOUND.
8. [ ] **Habit dynamics:** a free-first-ride promo has lasting effects (Weschke 2024: +20% three months after). Consider a launch-promo scenario with a decaying uplift.
9. [ ] **Event egress sub-hourly** (P040, P086): digitise MARTA Fig. 13–14 and implement it in the engine.
10. [ ] Cross-check the 125 St footfall zone against NYC DOT W 125 St counts (P084).
11. [ ] Confirm BST-0155 real output (P072). Needs Toby or a bench test.
12. [ ] Daily-cap scenario ($5–8/day; P049, P089). The adoption effect is still NOT FOUND. Deposit-free uplift is ≈30% (P095, LOW).
13. [ ] GreenHub replication of the low-battery curve (needs pyarrow, Toby).
14. [ ] Citi Bike gravity-model β for return location.
15. [ ] Day-level random effect in the engine (P035, P083).
16. [ ] Measured drain underground on a modern 5G phone (P013 LOW).
17. [ ] Per-rental non-return rate (no operator figure yet).
18. [ ] Miami: term-time Metrorail reports once posted.

## Needs Toby (fieldwork, accounts, or decisions)
- [ ] Decide the calibration centre for c (queue #1): top-of-band 3.6e-4 vs prior-centre 2.0e-4 vs Australia-matched 6e-5–1e-4 (P091).
- [ ] Price decision: the calibrated model now says $2/hr beats $1/hr at every plausible c (P091), but the youth-churn evidence argues for a student discount. Decide whether to test $1.50–2.
- [x] ~~Library access to Hosio CHI 2016~~ — open author copy found 2026-11-10 (P067).
- [ ] Phone-charge street survey at candidate sites (GAME_PLAN §5) — now the single highest-value data item (queue #1).
- [ ] Bench test: pack recharge time vs. fill level; real output W — and whether the iOS cable delivers 9 V PD (P072: report says 20 W max, GAME_PLAN says 22.5 W).
- [ ] Rebalancing plan: who restocks, how often, on foot or by van, minutes per stop (P082 now assumes 10–15 min at $20–30/h → $7/stop).
- [ ] Export any pilot rental data from the app (anonymised aggregates).
- [ ] Decide whether to add a daily cap ($5–8/day) — pricing decision, see P049.
- [ ] Optional: `pip install pyarrow` (to read GreenHub Parquet, queue #1); `pip install numpy SALib` (or approve a project venv) for global sensitivity; Census API key if direct api.census.gov access is wanted.
- [ ] WeGo ridership data request (form at wegotransit.com) for Nashville.

## Done
- [x] 2026-11-13: Joint c + wtp_mid history match (M10, P091): wtp_mid 3.0 → 2.25. Former item 1 (c centre still open → item 1).
- [x] 2026-11-13: Sobol on uncertain inputs only, plus stocking optimised per c (P093, P097). Former item 2. Stocking is solved at 5–6 packs.
- [x] 2026-11-13: Nashville footfall inputs (P092 Broadway shape, P096 populations and the CT term ratio). Former item 3 (engine build still open → item 3).
- [x] 2026-11-13: Repeat use (P094) and deposit effect (P095). Former item 6 (partial).
- [x] 2026-11-12: Sobol indices on top-8 Morris factors (P090, M4 update). Former item 3.
- [x] 2026-11-12: Rebalancing cost grounded in wages (P082: 12 → 7, range 4–15); forfeit churn evidence (P087, value kept). Former item 2.
- [x] 2026-11-12: Simulator price elasticity vs comparables (P088) — flagged, folded into item 1. Former item 5.
- [x] 2026-11-12: weekendFactor resolved with 2025 hourly entries (P081, applied). Former item 7.
- [x] 2026-11-12: US/EU benchmark search (P089) — none audited; former item 1 evidence.
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
