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
- **Status:** planned.

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
