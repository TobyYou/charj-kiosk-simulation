# Stats Toolkit: methods chosen for the simulation

Start candidates: `.claude/skills/charj-sim-research/references/stats-methods.md`. Promote a method here only after checking it against data.

Each entry should cover:
- the component it serves,
- the equation,
- its assumptions,
- how it is fitted (data + script),
- how it is validated,
- its status.

---

## M1. Arrivals: piecewise-constant NHPP with a day-level Gamma random effect (added 2026-11-08)
- **Component:** footfall → rental requests (`engine.js` arrival loop).
- **Equation:** for day d and hour h, N_{d,h} | G_d ~ Poisson(G_d · λ(h)), with G_d ~ Gamma(shape=1/CV², scale=CV²) (mean 1). The marginal N_{d,h} is negative binomial with Var = μ + μ²·CV².
- **Assumptions:** hourly shape λ(h) is stable within a term; days differ by a common multiplier (weather, exams, service changes); within an hour, arrivals are Poisson.
- **Fit:** `python3 -I research/scripts/fit_nhpp_mta.py` on `research/data/mta_116st_hourly_fall2026.csv` (MTA 116 St–Columbia, 14 Sep–29 Oct 2026, ET).
  - Weekday (n=33): daily total 14,815 ± 1,179 entries ⇒ **CV_day = 0.080** ⇒ G ~ Gamma(158, 0.0063).
  - Weekend (n=12): 3,860 ± 1,631 ⇒ CV_day = 0.42 (inflated by weekend 1-train service changes; do not use as base case).
  - Pooled NB size k (weekday) = 54 ⇒ extra-Poisson CV 0.14 per hour. After removing the day effect, dispersion is still >1 in afternoon/evening hours (D≈5–49), so hour-level shocks (class changes, events) remain.
- **Why it matters (and doesn't):** rentals are a heavy thinning of footfall (≈1 rental per ~10⁴ passers-by). Thinning a NB with mean m by p gives Var = pm + (pm)²/k; at pm ≈ 1–3 rentals/station/day the Poisson term dominates (CV ≈ 0.6–1.0 vs 0.14). **Conclusion: footfall overdispersion is a second-order effect for rental counts; parameter uncertainty (p_aware, p_low) dominates.** Adding G_d to the engine is low priority, but would matter for multi-day stock-outs.
- **Validation:** once pilot data exists, compare daily rental variance/mean against 1 + m·CV²; a ratio ≫ that implies funnel-level day shocks (weather, events).
- **Status:** fitted; not yet in engine (queue item).

## M2. Post-event egress shape (added 2026-11-08)
- **Component:** `event` scenario in `params.js`.
- **Equation:** excess arrivals E(h) = N_event(h) − N_baseline(h) on a matched non-event day; share s(h) = E(h)/ΣE.
- **Fit:** `python3 -I research/scripts/event_egress_shape.py` on `research/data/mta_yankee_event_days_2025.csv` (161 St–Yankee Stadium, two game days vs matched non-game days).
  - Night game: 27.5% of excess in the hour before the peak hour, **62% in the peak hour**, ~5% after.
  - Afternoon game: 15% before, **65% peak**, 10% + 5% + 2% in the next three hours.
  - ⇒ ~90% of transit egress within a 2-hour window; ~60–65% in one hour. Bowl-only egress (Green Guide 8 min; observed >17 min at a 20k+ stadium) is much shorter than neighbourhood dispersal.
- **Assumptions:** subway entries are a proxy for all egress (misses walkers/drivers); game days inferred from spikes, not box scores.
- **Validation:** repeat on Barclays/MSG (34 St–Penn) days; check the shape is stable across venue sizes.
- **Status:** shape accepted (HIGH for NYC stadium transit, MED transfer); engine still spreads event arrivals uniformly over 90 min — a front-loaded split is a queue item.

## M3. Monte Carlo replication count and CRN (added 2026-11-08, from literature)
- **Equations:** R = ⌈(z_{1−α/2}·s/ε)²⌉ for absolute half-width ε; relative: R = ⌈(z·s/(ε·x̄))²⌉. Sequential: add replications until t·s/√R / x̄ < target over a look-ahead window (Hoad, Robinson & Davies 2010; sim-tools docs).
- **CRN:** Var(X−Y) = Var X + Var Y − 2 Cov(X,Y); separate RNG streams per event type keep designs synchronised (Glasserman & Yao 1992). Already implemented in `simulator/js/rng.js` streams.
- **Applied:** 50 reps at baseline gives profit/week ±$30 (95% CI) on mean $543 ⇒ relative half-width 5.5%. For ±2% you need R ≈ 50·(5.5/2)² ≈ 380.
- **Status:** adopted; report the half-width with every CLI result.

## M4. Global sensitivity: Morris screening → Sobol (added 2026-11-08, from literature; not yet run)
- **Why:** the demand funnel is multiplicative (footfall × p_aware × p_low × p_seek × WTP), so one-at-a-time tornado charts miss interactions (Saltelli & Annoni 2010).
- **Equations:** Morris EE_i = [f(x+Δe_i) − f(x)]/Δ, cost r·(k+1) runs, rank by μ* = mean|EE|. Sobol S_i = V[E(Y|X_i)]/V(Y), S_Ti = E[V(Y|X_~i)]/V(Y); Saltelli/Sobol sampling cost N·(D+2) (first+total) or N·(2D+2) (with second-order), N a power of 2 (SALib `SALib.sample.sobol`).
- **Plan:** Morris with r≈15 over the ~12 SENSITIVITY_KEYS (195 runs × R reps), then Sobol on the top ~5 (N=512 ⇒ 3,584 evaluations). Needs a Node→CSV harness; SALib is Python (numpy not installed on this Mac — needs Toby to `pip install SALib` or run in a venv).
- **Status:** Morris RUN 2026-11-10 in plain JS (no numpy needed); Sobol still planned.
- **Run 2026-11-10** (`node research/scripts/morris_screening.mjs 20 10 20261110` → `data/morris_screening_2026-11-10.csv`): EE_i = [f(x + Δe_i) − f(x)]/Δ on the unit cube (each factor uniform on its params.js [low, high]; p = 4, Δ = 2/3), r = 20 random trajectories, k = 35 factors (all non-FACT ranged parameters; the funnel as ONE factor c ∈ [5.9e-5, 3.9e-4] via p_aware, per M7), 758 evaluations × 10 CRN reps (≈150 s). μ* = mean|EE| (Campolongo 2007) ranks importance in output units per full range; μ ≪ μ* ⇒ sign changes; σ/μ* > ~0.5 ⇒ interaction/nonlinearity. CRN noise floor for μ*: ≈$16/wk (3% of base) and 0.027 rentals/station/day; CRN cut EE noise ≈2.7× vs independent seeds.
  - **Profit ranking (after the grace-policy fix):** c $379 > host_share $255 > away_return_median_h $237 > p_stay $199 > packs_per_kiosk $176 > p_forget $121 > rebalance_cost $118 > cs_ticket_cost $75 > search_radius_m $61 > p_recover_after_forfeit $46. Rentals: c (2.25) ≫ search_radius_m (0.39) > footfall_broadway (0.19) > p_stay, wtp_mid_hourly, footfall_columbia (0.11–0.14).
  - **Fix for Sobol:** phone/pack physics (charge rates, phone_wh, pack_efficiency, recharge time, min SoC, old-phone mix), stripe_pct, amortize_months and most single-site footfalls are at or below the floor.
  - **Model check it produced:** the first run ranked packs_per_kiosk #2 ($389) because full stations kept billing failed returners and forfeited their deposits. Fixed by `grace_failed_return` (GAME_PLAN §1.3). Remaining artefacts: rebalancing never fires at 7–8 packs per 8 slots; overdue fees and forfeits count as revenue with no churn penalty, so away_return_median_h and p_forget have *positive* μ. Read those two ranks as "revenue exposure", not as levers to pull.
  - **Lesson:** run Morris after any engine change — it is a cheap bug detector (a factor that should hurt profit but helps it is a red flag).

## M5. Gamma–Poisson updating with empirical-Bayes pooling across stations (added 2026-11-08, from literature)
- **Equations:** prior λ ~ Gamma(α, β); after y rentals in exposure t station-days ⇒ posterior Gamma(α+y, β+t); predictive count in exposure t′ ~ NegBin(r=α′, p=β′/(β′+t′)).
- **Pooling:** across stations j, estimate α, β by method of moments: m = mean rate, v = between-station variance minus Poisson noise m·mean(1/t_j); α = m²/v, β = m/v. Each station shrinks toward m.
- **Prior for Charj before pilot:** benchmark band 0.5–3 rentals/station/day ⇒ e.g. Gamma(α=2.5, β=1.5) (mean 1.67/day, 90% interval ≈0.4–3.5). ASSUMPTION; replace with pilot data.
- **Status:** adopted as the pilot-calibration method; not yet coded.

## M6. Station inventory: birth–death chain / user-dissatisfaction function (from literature; for reference)
- Raviv & Kolka (2013): inventory I(t)∈{0..C}, rentals λ(t) as deaths, returns μ(t) as births; F(x) = E_x[∫λ·1{I=0} + ∫μ·1{I=C}] is convex in starting stock x ⇒ choose packs_per_kiosk by minimising F. Kaspi, Raviv & Tzur extend to unusable units (= packs still recharging).
- George & Xia (2011): closed queueing network to size total fleet N.
- **Use for Charj:** analytic cross-check of `packs_per_kiosk` (currently 6 of 8 slots, ASSUMPTION). The DES remains the main tool.
- **Status:** reference only.

## M7. Funnel identifiability: calibrate one conversion rate c, not p_aware and p_low separately (added 2026-11-09, run)
- **Equation:** λ_z(t) = footfall_z(t) × p_low(h)/p_low_peak × **c** × scenario, with c = p_aware × p_low_peak × p_seek (renters per passer-by at the evening peak).
- **Serves:** demand/arrival component; calibration against the 0.5–3 rentals/station/day benchmark band.
- **Finding:** the engine's outputs are bit-identical whether c is reached via p_aware or via p_low_peak (data/conversion_calibration_sweep.csv, CRN seeds). Benchmarks therefore identify only c. Benchmark band 0.5–3 ↔ c ≈ 5.9e-5 – 3.9e-4 (13-station normal week, after the 2026-11-09 OD footfall profile). Rentals scale ≈ linearly with c (≈7,800–8,500 rentals/station/day per unit c) until empty stations bite above c ≈ 3e-4.
- **Prior:** put the uncertainty on c directly: Gamma prior mapped from M5's Gamma(2.5, 1.5) on rentals/station/day (mean 1.67) ⇒ c centred ≈ 2.0e-4, 90% interval ≈ 0.5e-4 – 4.7e-4 (rentals 0.4–3.5/day; ASSUMPTION, via the near-linear map). The current default c = 3.6e-4 gives 2.82/day, near the top edge of the band.
- **How to fit with pilot data:** posterior on station rate (M5) → divide by simulated rentals per unit c at that site's footfall ⇒ posterior on c. A street survey fixes p_low_peak and p_seek separately; then p_aware = c / (p_low_peak × p_seek) becomes a derived, not tuned, number.
- **Validation:** after any change to footfall, LOW_BATTERY_CURVE, prices or stocking, re-run `node research/scripts/calibrate_conversion.mjs` and check the band mapping.
- **Implication for sensitivity analysis (M4):** p_aware, p_low_peak and p_seek must not be treated as three independent inputs in Sobol/tornado runs; vary c as one factor (its range from the band) plus the hourly shape.

## M8. Interval-censored MLE for binned operator distributions (added 2026-11-10, run)
- **Serves:** rental-duration (hold-time) distribution; any operator chart that reports shares per bucket rather than raw data.
- **Equation:** for bins [a_j, b_j) with observed shares w_j, maximise ℓ(θ) = Σ_j w_j · ln[F(b_j; θ) − F(a_j; θ)], here F = lognormal CDF Φ((ln t − μ)/σ). Grid search is enough for 2 parameters (`research/scripts/fit_rental_duration_bins.py`, stdlib only).
- **Assumptions:** shares are of rentals (INFORICH labels them 利用者割合, "share of users"); one distribution for all rentals.
- **Validation:** compare fitted vs observed per bin. ChargeSPOT Jun 2024: μ 4.89, σ 1.27 ln-min (median 133 min) underfits ≥24 h (3.0% vs 5.1%) and 6–12 h overfits ⇒ a two-component mixture (stay-at-venue short + away/next-day long) is the right shape, which is what the engine already does via p_stay. Next: fit the mixture and use it as the calibration target for p_stay and away_return_median_h together (`research/scripts/sim_duration_bins.mjs` gives the simulated bins).
- **Update 2026-11-11 (run, `scripts/fit_duration_mixture.py`):** 2-component lognormal mixture, f(t) = w·LN(μ₁,σ₁) + (1−w)·LN(μ₂,σ₂), interval-censored MLE by multistart Nelder–Mead (σ bounded 0.2–2.0). 7 bins − 1 = 6 free shares vs 5 parameters ⇒ 1 residual dof: the fit is a shape summary, not a test. Jun vs Sep 2024 give very different away components (25 h σ 0.2 vs 7.6 h σ 1.25) but a stable "stay" component (median 86–107 min, weight 0.73–0.92). **Lesson:** don't calibrate away_return_median_h from these bins alone; calibrate the stay share and stay median, and pin the away tail with the ≥24 h share (≈5%).

## M9. Conditional low-battery share from open phone logs (added 2026-11-11, run)
- **Serves:** LOW_BATTERY_CURVE (hour-of-day shape) and p_low_peak (level) in the demand funnel λ_rent(h) = foot(h) · p_aware · p_low_peak · curve(h) · p_seek.
- **Estimator:** for user u and cell (daytype d, local hour h), time-weighted share s_u(d,h) = Σ_i g_i·1[b_i < 0.2]·1[unplugged_i] / Σ_i g_i·1[unplugged_i], with g_i = min(t_{i+1} − t_i, 300 s). Population value = mean over users with ≥10 min exposure (equal-user weighting), 90% CI by cluster bootstrap over users (500 resamples). Curve = 1-2-1 circular smoothing, normalised to weekday 21:00.
- **Why condition on unplugged:** someone walking past a kiosk is not on a charger. Overnight ~75% of phone-time is plugged in, so the unconditional share (0.02–0.05 at night) understates low battery among people who are out (0.08–0.17 weekday, 0.30 weekend).
- **Assumptions:** local-clock routines transfer across time zones (PT → ET/CT); the sampled users' phones represent passers-by; weekend night data are thin, so the weekend curve is shrunk 50/50 to the weekday curve (a crude empirical-Bayes step; replace with a proper Beta–Binomial shrinkage by cell exposure if this curve becomes a top Morris factor).
- **Validation:** re-run reproduces the agent's CSV exactly; TZ conversion checked against the dataset's own phone-local time-of-day flags (377,027/377,027 rows agree). External check: Hosio 2016 (P067) population mean SoC lowest at 22–24 h — same timing as the 21–22 h peak here.
- **Next:** GreenHub (Android, 2018–2026, global) would give a modern-phone replication once pyarrow is available.

### M4 update (2026-11-12): Sobol indices run
- **Run:** `research/scripts/sobol_indices.mjs` — Saltelli (2010) A/B/AB_i design, iid uniform, k = 8 top Morris factors, N = 512 → 5,120 evaluations × 6 CRN reps (≈10 min). Estimators: S_i = mean(f(B)(f(AB_i) − f(A)))/V (Saltelli 2010); ST_i = mean((f(A) − f(AB_i))²)/(2V) (Jansen 1999); 500-row bootstrap CIs. Output: `data/sobol_indices_2026-11-12.csv`.
- **Result (profit):** ST packs_per_kiosk 0.32 [0.26, 0.38], rebalance_cost 0.23 (old 6–25 range), c 0.22 [0.19, 0.26] with S1 only 0.10, host_share 0.19, forfeit_churn_cost 0.06, p_stay 0.06, away_return_median_h 0.05, forfeit_dispute_rate 0.03. ΣS1 = 0.75 → ≈25% of variance is interactions (mostly c × stocking). For rentals/station/day, c alone explains S1 0.89 / ST 0.995.
- **Lesson:** separate *decision variables* (packs_per_kiosk, host_share, price) from *uncertain inputs* before reading a variance decomposition. Next run: fix decisions at their candidate values (or optimise them per c draw) and decompose only the unknowns; the investor message is then "profit uncertainty is X% c, Y% costs".
- **Validation:** ΣS1 ≤ 1 and ST ≥ S1 within CI for all factors (p_stay S1 slightly negative = noise); rentals ST_c ≈ 1 matches the M7 identifiability result that rentals depend only on c.

- **M8 note 2026-11-13 (methods agent; S130):** with counts unknown, CIs from binned shares are arbitrary — state an assumed effective N, then use profile likelihood (2[ℓ̂ − ℓ_p] ≤ 3.84) or parametric bootstrap (Multinomial(N, p̂), B = 1,000 refits). G-test: G = 2 Σ n_j ln(n_j / N p̂_j), df = K − 1 − q; merge bins with expected count < 5. Compare simulated bins at the *data's* N, not the simulator's huge N (which rejects any model). Fix σ_stay or the away component to get df ≥ 1.

## M10. History matching for jointly calibrated parameters (added 2026-11-13, run)
- **Serves:** demand funnel c and price acceptance wtp_mid (P055, P091); any later pair calibrated against several benchmark targets.
- **Equation (Vernon, Goldstein & Bower 2010; Andrianakis et al. 2015, S126–S127):** for each target k, I_k(x) = |z_k − Ê[f_k(x)]| / sqrt(V_obs,k + V_disc,k + V_MC,k(x)), with V_MC = s²/R from R replicate runs. Non-implausible region: max_k I_k(x) ≤ 3 (Pukelsheim 3σ rule: any unimodal density has P(|X−μ| ≥ 3σ) ≤ 4/81 ≈ 0.05). Later waves may add a joint test: the quadratic form compared with χ²₂ at 95% (5.99).
- **Our setting (`scripts/joint_calibration_c_wtp.mjs`):**
  - Rentals/station/day on the log scale: z = ln √(0.5·3), and the band edges are ±2σ_obs.
  - Elasticity: z = −0.6, σ_obs = 0.2.
  - Discrepancy SDs: 0.2 (log rentals) and 0.1 (elasticity).
  - The elasticity is a *paired* arc difference across $1 and $2/hr on the same seeds (CRN), so V_MC is tiny.
  - Note: Andrianakis instead use 10% of the output variance for V_disc. The agent's alternative of σ_obs = half-width/3 puts I = 3 exactly at the band edges and is looser.
- **Assumptions:**
  - The targets are transferred from other markets (P074, P075, P088).
  - Discrepancy variances are judgement calls. State them, and show what doubling them does.
- **Fit:**
  - Wave 1 is a 7×7 grid × 3 prices × 20 reps (≈3k runs, 70 s). No emulator is needed at this cost.
  - Wave 2 (if needed) re-samples ≈200 non-implausible points at R = 30.
- **Result 2026-11-13:**
  - Elasticity pins wtp_mid at about 1.9–2.6, independent of c.
  - The wide band does not pin c.
  - The price-matched Australia band would pin c at about 6e-5–1e-4.
- **Validation:**
  - Re-run held-out non-implausible points with fresh seeds and check I ≤ 3.
  - Check that parameter-free outputs (median rental minutes, P059 band 30–90/120) still sit in their bands.
- **Alternative: ABC rejection** (Beaumont, Zhang & Balding 2002).
  - Draw from uniform priors and accept if ‖(s − z)/σ‖ ≤ τ, with τ set so 1–5% of draws are accepted.
  - The accepted draws give a predictive profit distribution.
- **Presentation:**
  - Draw a heatmap of I_max with the I = 3 contour and overlay profit contours.
  - Report the min, median and max of profit over the non-implausible set.

## M11. Value of information (EVPI / EVPPI) to rank research when some inputs are decisions (added 2026-11-13, not yet run)
- **Serves:**
  - The research queue ranking ("which unknown, if resolved, would change the decision or profit most").
  - Separating decisions (packs, host share, price, layout) from uncertainties (c, rebalance_cost, churn, …).
- **Equations** (Heath et al. 2017; Strong, Oakley & Brennan 2014; S128–S129):
  - EVPI = E_θ[max_d U(d,θ)] − max_d E_θ[U(d,θ)].
  - EVPPI(φ) = E_φ[max_d E_{ψ|φ} U(d,θ)] − max_d E_θ U(d,θ).
- **Regression estimator** (Strong et al. 2014):
  - Fit U(d,θ_s) = g_d(φ_s) + ε. Use a spline, LOESS or binning for 1-D φ, and a GAM/GP for 2–5 inputs.
  - Then EVPPI ≈ mean_s max_d ĝ_d(φ_s) − max_d mean_s ĝ_d(φ_s).
  - Simulation noise does not bias this upward, because regression comes before the max. Nested Monte Carlo is upward-biased for small inner loops.
- **Binning shortcut** (Strong & Oakley 2013): sort the draws by φ, split them into M bins, average U per decision within each bin, take the max, and average over bins.
  - Too many bins pushes the estimate toward EVPI.
  - Too few bins pushes it toward 0.
- **Plan:**
  1. Discretise D. For example, price {1, 1.5, 2} × host_share {low, mid, high} × layout variants; packs is now fixed at 5–6 (P093).
  2. Draw S = 2,000–5,000 θ over the uncertain inputs and run every d on the same seeds.
  3. Fit ĝ_d per φ.
  4. Bootstrap the SE.
- **Pitfalls:**
  - EVPPI is not additive.
  - EVPPI(group) ≥ max of the single-input values.
  - Scale by network × horizon (weeks) to express it in dollars.
  - Felli & Hazen (1998): variance-based indices overstate decision relevance, so use EVPPI rather than Sobol ST for research priority.

### M4 update (2026-11-13): Sobol indices on uncertain inputs only
- **Setup:**
  - Decisions were fixed at packs 6, $1/hr and the default host share.
  - k = 8 uncertain inputs, N = 512 (`SOBOL_FACTORS=c,rebalance_cost,forfeit_churn_cost,p_stay,away_return_median_h,forfeit_dispute_rate,wtp_mid_hourly,p_forget`).
- **Result:**
  - ST: c 0.64, forfeit_churn_cost 0.16, p_stay 0.11, away_return_median_h 0.085, rebalance_cost 0.065. Everything else is under 0.05.
  - Interactions are now small (ΣS1 ≈ 1).
  - What looked like stocking × demand interaction on 11-12 was the 7–8-pack return-blocking cliff (P093).
- **Caveat:** the S1 estimator was unstable (S1_c > ST_c within CI). If S1 is needed, switch to the Jansen S1 form or raise N.
