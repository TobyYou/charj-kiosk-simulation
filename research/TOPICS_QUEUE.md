# Research Queue (ranked by value of information)

Yardstick: how much resolving the unknown would move profit/week or kiosk placement (see the sensitivity tab and STATS_TOOLKIT M4).

## Open
1. [ ] **Compute the hourly share of phones <20% ourselves** (p_low_peak, LOW_BATTERY_CURVE). 2026-11-10: no published hourly histogram exists, but two open datasets allow it: ExtraSensory (UCSD, 60 users, 215 MB zip, free, battery level per minute, UTC epoch → US/Pacific; participants carried an extra battery — bias) and GreenHub Farmer (Kaggle, 2.2 GB Parquet in ~30 MB parts, battery_level + timezone; Android, samples fire per 1% change → weight by time gap). Recipe: download ExtraSensory + 1–2 GreenHub US parts into a scratch folder, time-weight, compute share <20% by local hour, weekday vs weekend. Needs pyarrow for Parquet (not installed → ExtraSensory first, csv.gz). → P012, P051, P067
2. [ ] **Fix two engine artefacts found by Morris** (P068): (a) rebalancing never fires at 7–8 packs per 8 slots (surplus test is packs > desired+1), so 7 packs looks $130/wk better than 6; (b) overdue fees and forfeits count as revenue with no churn/goodwill cost, so longer holds and forgetting *raise* profit. Then re-run Morris and only then Sobol on the top ~6 factors.
3. [ ] **Rental-duration calibration** (P059, STATS_TOOLKIT M8): fit a 2-component mixture to ChargeSPOT bins; the engine has almost no <30-min rentals (0.2% vs 10%). Decide p_stay jointly with away_return_median_h; profit swings $336–652/wk over p_stay 0.7–0.3. Look for later INFORICH decks (FY2025, after the May 2025 minimum-fee change) for an updated histogram.
4. [ ] **Decide where to centre c** (P055) — unchanged; now c 3.6e-4 → 2.80/day, $471/wk; c 1.8e-4 → 1.47/day, $230/wk.
5. [ ] **Shared-pack phone charge speed:** Hangzhou test shows shared packs give 19% in 30 min (P062) vs our phone_rate_fast 1.8%/min (54% in 30 min). Check BST-0155 output spec (22.5 W claimed) vs typical 10 W shared packs. Morris says low profit impact, but it affects how long users stay (p_stay story).
6. [ ] **weekendFactor: OD vs hourly entries** (P070): OD gives 0.70/0.71/0.62 at 103/110/125 St vs current 0.60/0.62/0.55. Pick one source and justify.
7. [ ] **Daily-cap scenario:** add a $5–8/day cap lever (P049, P061). Caps are universal among comparables (Brick €5, HK$24–80, Naki €6); adoption effect still NOT FOUND.
8. [ ] **Event egress in engine:** replace uniform 90-min spread with MTA-fitted split (P040). Event low-battery multiplier now bracketed (≈2× city-wide, ≈5× at venue, P063) but still ASSUMPTION.
9. [ ] **Nashville footfall model:** Vanderbilt is car/walk (5% transit, 13% walk; P066), so WeGo stop counts (P065) are a small slice. Next: Vanderbilt parking/garage counts, campus dining swipes or Wi-Fi occupancy reports, Lower Broadway counters (none public yet).
10. [ ] Citi Bike gravity-model β for return location.
11. [ ] Day-level random effect in the engine (P035, CV 0.08).
12. [ ] Measured drain underground on a modern 5G phone (P013 LOW).
13. [ ] Per-rental non-return rate (still no operator figure; Japan ≥24 h share 5.1% is an upper reference for crossing 24 h).
14. [ ] Miami: term-time Metrorail reports once posted.

## Needs Toby (fieldwork, accounts, or decisions)
- [ ] Decide the calibration centre for c (queue #2): top-of-band 3.6e-4 vs prior-centre 2.0e-4.
- [x] ~~Library access to Hosio CHI 2016~~ — open author copy found 2026-11-10 (P067).
- [ ] Phone-charge street survey at candidate sites (GAME_PLAN §5) — now the single highest-value data item (queue #1).
- [ ] Bench test: pack recharge time vs. fill level; real output W.
- [ ] Export any pilot rental data from the app (anonymised aggregates).
- [ ] Decide whether to add a daily cap ($5–8/day) — pricing decision, see P049.
- [ ] Optional: `pip install pyarrow` (to read GreenHub Parquet, queue #1); `pip install numpy SALib` (or approve a project venv) for global sensitivity; Census API key if direct api.census.gov access is wanted.
- [ ] WeGo ridership data request (form at wegotransit.com) for Nashville.

## Done
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
