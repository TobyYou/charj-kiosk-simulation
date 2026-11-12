# Research Queue (ranked by value of information)

Yardstick: how much resolving the unknown would move profit/week or kiosk placement (see the sensitivity tab and STATS_TOOLKIT M4).

## Open
1. [ ] **Decide where to centre c, together with wtp_mid** (P055, P088). 2026-11-12: no audited US/EU benchmark exists (P089), so ChargeSPOT Australia (0.48–0.84/day) remains the best price-matched point. Refreshed sweep: Australia-level 0.62/day → $47/wk, Japan-level 1.25 → $182/wk, default 2.93 → $508/wk. New: the WTP logistic is nearly inelastic at $1/hr (ε −0.04 vs comparables −0.3 to −1.9), so c and wtp_mid must be re-calibrated *jointly* (two targets: rentals band + elasticity ≈ −0.3 to −0.8 at ~$2.5/rental). Present the profit curve over (c, wtp_mid) rather than a point.
2. [ ] **Sobol on uncertain inputs only** (M4 update): fix decisions (packs_per_kiosk, host_share, price) at candidate values, decompose c, rebalance_cost (new 4–15), forfeit_churn_cost, p_stay, away_return_median_h, forfeit_dispute_rate, wtp_mid, p_forget. Also optimise packs_per_kiosk per c draw (stocking × demand interaction drives ≈25% of variance).
3. [ ] **Nashville footfall model** (P077, P078, P083, P085): build zones from campus population × Melbourne campus-edge hourly shape × term/break ratio ≈2.5×, with the VU 2026–27 calendar; FirstBank Stadium 35,000 game-day scenario.
4. [ ] **Rental-duration calibration** (P059, P076, M8): calibrate stay share + stay median from operator bins.
5. [ ] **Term/break calendar scenario** for NYC and Nashville (P085 dates, P083 ratio) — a "break week" scenario in params SCENARIOS.
6. [ ] **forfeit_churn_cost: residual LTV** — power-bank or micromobility repeat-rental rates (rentals per user per month, 30/90-day return) still NOT FOUND; try ChargeSPOT member counts vs rentals in TDnet decks, Citi Bike casual→member conversion.
7. [ ] **Event egress sub-hourly** (P040, P086): digitise MARTA paper Fig. 13–14 (5-min bins) and implement event egress in the engine.
8. [ ] Cross-check 125 St footfall zone against NYC DOT W 125 St counts (P084).
9. [ ] Confirm BST-0155 real output (P072) — needs Toby / bench test.
10. [ ] Daily-cap scenario ($5–8/day; P049, P061, P089 EU caps €6–10). Adoption effect still NOT FOUND.
11. [ ] GreenHub replication of the low-battery curve (needs pyarrow — Toby).
12. [ ] Citi Bike gravity-model β for return location.
13. [ ] Day-level random effect in the engine (P035, CV 0.08; Melbourne campus sensors CV 0.26–0.29 weekdays, P083).
14. [ ] Measured drain underground on a modern 5G phone (P013 LOW).
15. [ ] Per-rental non-return rate (no operator figure).
16. [ ] Miami: term-time Metrorail reports once posted.

## Needs Toby (fieldwork, accounts, or decisions)
- [ ] Decide the calibration centre for c (queue #2): top-of-band 3.6e-4 vs prior-centre 2.0e-4.
- [x] ~~Library access to Hosio CHI 2016~~ — open author copy found 2026-11-10 (P067).
- [ ] Phone-charge street survey at candidate sites (GAME_PLAN §5) — now the single highest-value data item (queue #1).
- [ ] Bench test: pack recharge time vs. fill level; real output W — and whether the iOS cable delivers 9 V PD (P072: report says 20 W max, GAME_PLAN says 22.5 W).
- [ ] Rebalancing plan: who restocks, how often, on foot or by van, minutes per stop (P082 now assumes 10–15 min at $20–30/h → $7/stop).
- [ ] Export any pilot rental data from the app (anonymised aggregates).
- [ ] Decide whether to add a daily cap ($5–8/day) — pricing decision, see P049.
- [ ] Optional: `pip install pyarrow` (to read GreenHub Parquet, queue #1); `pip install numpy SALib` (or approve a project venv) for global sensitivity; Census API key if direct api.census.gov access is wanted.
- [ ] WeGo ridership data request (form at wegotransit.com) for Nashville.

## Done
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
