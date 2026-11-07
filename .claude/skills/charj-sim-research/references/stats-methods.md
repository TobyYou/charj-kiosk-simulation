# Candidate Statistical Methods (starting catalogue)

These are starting points, not final choices. The project's live record of chosen methods is `research/STATS_TOOLKIT.md`. Before promoting a method there, check it against data. Each entry lists what it models, the core equation, and how to fit and validate it.

## 1. Arrivals: non-homogeneous Poisson process (NHPP)
- **Models:** rental requests at a kiosk, by hour of day.
- **Core equation:** N(t) ~ Poisson(Λ), where Λ = ∫ λ(s) ds, and λ(t) = footfall(t) × p_aware × p_low_battery(t) × p_rent | low.
- **Fit:** start from an hourly footfall profile (e.g. MTA station exits, pedestrian counts) and multiply by the conversion funnel. Each funnel factor is its own parameter with a range.
- **Simulate:** by thinning (Lewis–Shedler).
- **Validate:** compare simulated hourly counts with pilot rentals. Check overdispersion; if variance ≫ mean, switch to a negative binomial (Poisson–Gamma mixture).

## 2. Overdispersion and uncertainty in rates: Gamma–Poisson (Bayesian)
- **Prior:** λ ~ Gamma(α, β).
- **Updating:** after observing k rentals in time T, the posterior is Gamma(α + k, β + T).
- **Why:** this is the clean way to update estimates as pilot data arrives, and it gives credible intervals for investors.

## 3. Slot capacity / blocking: Erlang-B and M/M/c/K
- **Models:** the probability that a return finds a full kiosk, or a rental finds an empty one.
- **Erlang B:** B(c, A) = (A^c / c!) / Σ_{k=0..c} A^k / k!, where A = λ / μ.
- **Limits:** it is an approximation only. A kiosk is a closed inventory system: packs leave and come back elsewhere, which is like bike-share. **Prefer discrete-event simulation (DES)** for the real answers, and use Erlang as a sanity check.

## 4. Network inventory: bike-share station models
- Model each kiosk's inventory as a birth–death chain, with rentals as deaths and returns as births.
- Returns come from an origin→destination matrix P(i→j). Fit P from Citi Bike or BCycle trips, using a gravity model: T_ij ∝ O_i D_j f(d_ij), with f(d) = exp(−βd) or d^−γ.
- Literature: "bike-sharing rebalancing", "station inventory Markov chain".

## 5. Battery state and drain
- **Starting charge** at time t: Beta(a, b) on [0, 1], fitted per hour or location from survey data. Until survey data exists, use published usage traces.
- **Drain:** dSoC/dt = −(base + usage + signal_penalty(location)) / capacity_eff(age, temp). Treat it as piecewise linear, with lognormal variation across users.
- **Capacity fade:** capacity_eff ≈ 1 − k × age_years, or per cycle. Check iPhone's "maximum capacity" data.
- **Rental trigger:** a logistic model, P(rent | SoC, time-to-destination, persona) = σ(β0 + β1 × SoC + …).

## 6. Charging time
- **CC/CV approximation:** a fast linear phase up to about 50–80%, then a slowing exponential tail.
- **Time to target:** t(s0 → s1) = ∫ ds / rate(s). The rate depends on phone model, battery health, temperature, and the pack's output limit (22.5 W nominal).
- **Pack energy:** usable energy ≈ 8000 mAh × 3.7 V × η (η ≈ 0.6–0.7 at 5 V output, to be verified). Convert that to phone % via phone capacity in Wh.

## 7. Durations and delays
- **Rental duration:** lognormal or Weibull, fitted to comparable data such as Citi Bike trip durations or published power-bank rental stats.
- **Late or no return:** a mixture, i.e. P(forget) × long-tail delay + P(normal) × on-time.

## 8. Monte Carlo and convergence
- Run R replications per scenario and report the mean ± t × s/√R.
- Choose R so that the 95% CI half-width is under ε. Required R ≈ (1.96 s / ε)².
- Use common random numbers when comparing layouts, which reduces the variance of the difference.
- If the CI doesn't shrink, the model is telling you which input lacks data. That is a "value of information" signal.

## 9. Sensitivity and value of information
- **One-at-a-time tornado chart:** profit vs. each parameter's low/high value.
- **Sobol or Morris indices** for global sensitivity (e.g. SALib).
- **Expected value of perfect information:** the expected profit gain if a given uncertainty were resolved. Use it to rank the research queue.

## 10. Persona and population generation
- Use ACS and LEHD LODES (origin–destination employment) for home→work flows by census block, plus university enrollment for students.
- Sample personas proportionally, then attach phone age, battery health, schedule, and price sensitivity from the fitted distributions.

## 11. Financial layer
- Profit/week = Σ rental_hours × price + forfeited_deposits − payment_fees − venue_share − restock/maintenance − amortised hardware ($170/set, ≈$198 with freight) − CS ticket cost.
- Report the distribution, not just the mean.
