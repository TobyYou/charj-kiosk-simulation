# Game Plan: Phone-Charger Kiosk Network Simulation (Digital Twin)

> Source: meeting transcript *"Battery Charging Network Simulation"* (Nov 6, 2026) with Dr. Smith (Speaker 1), Sophia (Speaker 2) and the team.
> Goal: Build a **digital twin** of the shared phone-charger network that reflects real life, so its results are **believable to investors** and useful for choosing where to place kiosks.

---

## 0. The core idea in one paragraph

Build a statistical, operations-research style model of the system and its users. Run it many times under different scenarios, with research-based personas and explicit assumptions. Report results as **profit and risk**, not just usage. In Dr. Smith's words, *"you can simulate the business before you run it."* The pitch becomes: "We've run it. We know where not to put kiosks, we have good ideas where to put them, and the next thing we need is investment to pilot and collect more data."

---

## 1. Key points from the transcript

### 1.1 Why simulate
- Placement and density decisions "are really tough to make" without simulation. With it, you can run experiments in silico and test cheaply: put kiosks here, there and here; if that fails, remove one and move another.
- Scooter companies counter-example: they spent heavily, put scooters everywhere, then tracked use (or didn't) and paid people to drive trucks around collecting them. **Simulating first avoids that waste.**
- The same model should tell you **what minimum number of kiosks you need**, **what density is required**, **how far apart kiosks should be**, and whether to **follow travel corridors such as subway lines**.
- It can also tell you to **concentrate**, for example "We shouldn't even try this if we can't get enough density here; collapse down to this corridor."

### 1.2 What the model must capture
- **Demand.** How many people need a charge, where and when (Poisson arrivals suggested).
- **Kiosk locations and capacity.** Default 8 slots (two stacks of 4). Stackable up to **32**. Larger machines with **40–50** slots can be ordered.
- **User travel and return behaviour.** Where users go after renting, and whether a kiosk is on their route when they want to return.
- **Charging turnaround of packs.** Packs charge at different rates depending on how full they are and the temperature (indoor = near optimal range). They become "ready" at different times. A pack does not need 100%, only "enough to meet needs."
- **Phone charging speed.** Depends on phone model and age (an iPhone 13 "charges very slow, and it drains very fast"), battery health, and cold weather. Output is **22.5 W**, enough for tablets. iPads are priced the same as phones.
- **Event-driven surges.** See §3.
- **Kiosk full/empty state.** A kiosk that is full (can't accept returns) or empty (can't rent) should be **hidden or flagged in the app** via live routing.
- **Failed returns and customer-service load.** "The best way to handle customer complaints is to avoid them in the first place." Use the simulation to minimise the need for those calls.

### 1.3 Current product facts (use as model inputs)
| Item | Current state |
|---|---|
| Kiosk size | 8 slots (2 stacks × 4), stackable to 32; 40–50-slot machines available on separate order |
| Charging output | 22.5 W (phones + tablets) |
| Pricing (mentioned) | ~$2/hour; same price for iPad and iPhone |
| Deposit | $30 card hold at scan; charged if not returned in time window |
| Reminders | Email reminders (web app only, no native app yet) |
| Grace policy | Customer service can pause the clock or give extra hours if a user couldn't find a kiosk |
| Not in first production | Cables to charge a dead phone at the kiosk; on-site card reader (POS). All payment is through the phone/web |
| Hours | Intended 24/7, which needs 24/7 host venues |

> Note from the meeting: the $30 deposit plus $2/hr discouraged people in an informal campus test. **Model price sensitivity / adoption explicitly.**

### 1.4 Statistics: why the results can be trusted
- **Don't hand-code all personas and parameters.** Then the model only reflects what *you* thought of. Let research agents derive the population from real data (employment, commute and neighbourhood profiles).
- **State every assumption clearly**, for example "early adopters are likely people with older phones; a brand-new iPhone lasts all day."
- **Broad sampling + many runs → the average converges on reality**, with a measurable variance (the *gumball jar / wisdom of crowds* analogy). Personas only need to be "in the ballpark" with the **right variety and breadth**.
- **High variance / no convergence ≠ failure.** It means *not enough data yet*, and it shows **exactly where to collect more data** or place a kiosk partly to learn.
- Classic OR reference: **airline overbooking** (seat capacity vs. no-shows). This maps to slot capacity vs. late or no returns.

### 1.5 Optimise money, not raw utilisation
- The most *used* layout is probably **not** the most *profitable* layout.
- Objective: **maximise rented hours / revenue, minimise non-returns and failed returns**, then report **profit**.
- Speak investor language, for example: "The difference between putting it here vs. here is **$400/week**."
- Network effects: each added kiosk improves the whole network. There is a **"hump"** (critical density) after which utilisation rises across the network. Find where that hump is.

---

## 2. Simulation architecture (multi-agent)

```
┌────────────────────┐   ┌─────────────────────┐   ┌──────────────────────┐
│ 1. Research agent  │──▶│ 2. Persona generator │──▶│ 3. Simulation engine │
│ area demographics, │   │ ~100+ representative │   │ Poisson demand, trips,│
│ commute/work data, │   │ users w/ schedules,  │   │ battery drain, kiosk  │
│ venues, events     │   │ phones, personality  │   │ inventory, returns    │
└────────────────────┘   └─────────────────────┘   └──────────┬───────────┘
                                                              │ Monte Carlo (many runs)
┌────────────────────┐   ┌─────────────────────┐              ▼
│ 6. Issue tracker   │◀──│ 5. Persona walk-     │◀──┌──────────────────────┐
│ findings → GitHub  │   │ through agent (LLM   │   │ 4. Financial layer   │
│ issues             │   │ role-plays the app)  │   │ revenue, deposits,   │
└────────────────────┘   └─────────────────────┘   │ CS cost, profit ± CI │
                                                   └──────────────────────┘
```

1. **Research agent.** Given a target area, it investigates where people live vs. work, occupations, transit lines (e.g. "you'd be travelling through here because you're on the red line"), venues and event calendars.
2. **Persona generator.** Creates realistic, representative personas (e.g. "works in finance downtown"). Each persona has: home/work/school, daily schedule, transit route, phone model and age, battery health, starting charge, and personality (risk-averse, penny-pinching, forgetful…).
   - Two modes: **targeted** ("that's who we're going after") or **capture everybody in the area**.
3. **Simulation engine (OR model).** A high-speed statistical simulation of arrivals, rentals, travel, battery drain, pack recharge and returns across the kiosk network.
4. **Financial layer.** Converts each run into revenue, cost and profit.
5. **Persona walk-through agent.** An LLM takes on a persona and "uses" the service step by step to surface UX failures. Example from the meeting: an old phone wasn't ready until later, there was no kiosk near work, and the user had to call customer service.
6. **Issue generation.** Turn findings (and meeting transcripts) into GitHub issues for future development.

---

## 3. Scenarios to simulate

| Scenario | What happens | Model it as |
|---|---|---|
| **Baseline weekday** | Normal commute and campus patterns | Time-of-day Poisson rates per location |
| **Large event nearby** (concert, game) | Phones drain at once during the event (poor cell coverage), then a burst of rentals **at the end** | Pre-event drain multiplier + post-event demand spike |
| **Marathon** (e.g. NYC Marathon) | Predictable mass event | Pre-stock **+2 extra units per kiosk** about a week before; compare vs. no pre-stocking |
| **Power outage** | All packs get taken ("they're all going to go away") | Demand spike across the whole area; kiosks can't recharge |
| **Subway exits (NYC)** | No cell coverage underground, so phones come out lower | Charge drop per trip ∝ trip length; highest at busiest/longest start–end pairs |
| **Late night / nightlife** | People out late, phones low | Night demand at 24/7 venues: bars, gas stations |
| **Cold weather** | Phones drain faster and charge slower | Temperature factor on drain and charge rate |
| **Kiosk full / empty** | Can't return / can't rent | Track failed attempts; test live-routing that hides full/empty kiosks |
| **Network density variants** | Concentrated vs. spread out | Same demand, vary kiosk count and spacing |
| **Capacity variants** | 8 vs. 16 vs. 32 slots, or 40–50 machines | Stack more only where needed |

---

## 4. Model parameters & assumptions register

Every number must be **sourced or flagged as an assumption** with a range. Run sensitivity analysis on each.

| Parameter | Initial source / plan | Status |
|---|---|---|
| Foot traffic per location per hour | Public transit ridership, campus counts, venue capacity | TODO research |
| % of people aware of the service (market penetration) | Assumption; sweep e.g. low / mid / high | Assumption |
| % who need a charge (battery < threshold) | **Field survey** (see §5) | TODO collect |
| Starting-charge distribution by location/time | Field survey; subway in/out comparison | TODO collect |
| Battery drain per hour (by phone model, age, signal) | Published specs + assumptions; heavier at events/underground | Assumption |
| Phone charge rate from pack (by model, health, temp) | 22.5 W spec; older phones slower | Assumption |
| Pack recharge time in kiosk (by fill level) | Manufacturer spec / bench test | TODO measure |
| Target charge users want (e.g. 50/60/80%) | Persona-driven ("getting on a plane → 80%") | Persona |
| Price elasticity ($2/hr, $30 hold) | Campus test feedback + survey | TODO collect |
| Return-delay / forgetfulness rate | Persona personality + comparable services | Assumption |
| Non-return (deposit forfeited) rate | Assumption range | Assumption |
| Customer-service cost per ticket | Assumption; reduced by AI chatbot triage | Assumption |
| Kiosk cost, venue fee, restocking cost | Supplier quotes / venue talks | TODO |

**Rule:** publish this table with the results. Investors should see every assumption.

---

## 5. Real-world data collection (to calibrate and validate)

- **Phone-charge street survey.** Ask people their current battery % (and ideally *where they're going*). Offer a small incentive such as candy. A little data supports strong population estimates.
  - Pick candidate sites first, then survey. If everyone says "80%, 80%, 60%", **no one will use it there**.
- **Subway in/out survey (NYC).** Measure charge going into vs. coming out of stations to estimate the drop per trip. Find the most popular and longest start–stop pairs ("someone who walks in with 20%… this trip costs them 10%… they're panicking").
- **Pilot data (once kiosks are live).** Rental and return locations and times give the origin→destination lines. Compare against the simulation.
- **Privacy.** No GPS tracking of users. Optional *registered phone model* (user enters "this is my phone") enables personalised charge-time predictions. Check what the Apple battery-health API allows to be shared.
- **Future upside.** Rental/return trip data could itself become a valuable dataset (like scooter-company mobility data). Handle it carefully for privacy and security.

---

## 6. Validation: making the results convincing

1. **Assumptions are explicit** (table in §4).
2. **Personas are research-derived** and representative of the target population, not hand-picked.
3. **Monte Carlo.** Run many simulations and report **mean ± variance / confidence intervals**, not one number.
4. **Convergence check.** If results don't converge, say so, and name the data needed to fix it.
5. **Calibrate against field data** (§5): simulated charge distributions should match surveyed ones.
6. **Sensitivity analysis.** Show which assumptions the profit is most sensitive to.
7. **Back-test against the pilot** once real kiosks run, and update the twin.
8. **Value of information.** The twin shows *which* new data would most reduce uncertainty, and how valuable collected data was.

---

## 7. Outputs / KPIs to report

- **Profit per week** (per kiosk and per network layout), with confidence interval.
- Revenue (rental hours × price), forfeited deposits, kiosk/venue/restock costs.
- **Failed-return rate** (e.g. "20% of people were never able to return"), failed-rent rate (empty kiosk).
- Customer-service tickets per 100 rentals.
- Utilisation and rented-hours per kiosk.
- Pack availability: % of time a kiosk has a pack charged "enough".
- **Minimum viable kiosk count & spacing** for a target area (the "hump").
- Layout comparison in dollars ("here vs. here = $400/week").

---

## 8. Product features the simulation should test

- **Trip-planning returns** (action item): user enters destination / target charge; app recommends where to drop off along the route ("where in your journey you'll already be at 60%"), similar to Citi Bike.
- **Personalised charge-time prediction** from phone model, battery health and temperature.
- **Kiosk detail view.** Number of packs available and each pack's charge level ("how many will get you through"), not just full vs. not full.
- **Fast charging.** Get users to a *safe level* quickly so they don't carry the pack for hours.
- **Live routing.** Hide or flag full/empty kiosks.
- **Return-anxiety reduction.** Grace period and customer-service pause. If all slots are full, allow photo proof to avoid charges (Taiwan bike-share example).
- **Reminders.** Email now; app push later (e.g. after ~3 hours when the pack is likely drained).
- **AI chatbot first-line support.** FAQ + chatbot triage, escalating to a human ticket only when needed.
- **Later:** loyalty incentives (e.g. free charge after N rentals), in-kiosk cables for dead phones, larger machines.
- **User-experience risk.** Users in China leave negative reviews over deposits and late returns. Model forgetfulness and test policies that protect the experience.

---

## 9. Deployment & growth strategy to test

- **Concentrate first** to build return density, but plan corridors that support travel between areas (e.g. Uptown→Downtown NYC).
- **Candidate sites:**
  - **NYC:** Columbia University, Juilliard, Times Square, subway corridors (e.g. 42nd St → 116th St).
  - **Nashville:** Vanderbilt campus, Belmont campus, downtown Nashville.
  - **24/7 hosts:** gas stations, bars (especially NYC).
- **Next markets:** reuse the same twin. Chicago is likely viable. Miami is uncertain: people drive rather than ride the subway, but they stay out late. **If no simulation run makes money in a city, don't go there.**
- For each new market, the twin lists **the information that must be collected** before entering.

---

## 10. Example persona to build first

> **Columbia student living in Midtown.** Takes the 1 train from 42nd St to 116th St. Leaves home at **80%**, ends the school day at **20%**. Older iPhone (slow charge, fast drain). Where do they rent, and where can they return on the way home? What happens if the nearest kiosk is full?

Also build: a finance worker downtown, a concert-goer, a late-night bar patron, a traveller needing 80% before a flight, a risk-averse user put off by the $30 hold, and a forgetful user who takes the pack home.

---

## 11. Action items

- [ ] **Build the digital-twin simulation** (research agent → personas → OR simulation → financial layer → persona walk-throughs).
- [ ] **Add trip planning** that recommends a return kiosk from route, kiosk locations and projected charge.
- [ ] **Assumptions register** (§4) with sources and ranges.
- [ ] **Field survey** of phone charge (+ destination) at candidate sites; subway in/out comparison.
- [ ] **Bench-test pack recharge time** vs. fill level.
- [ ] Run **scenario matrix** (§3) × **layout variants** with Monte Carlo; report profit ± CI.
- [ ] Convert this and future meeting transcripts into **GitHub issues** (keep recording meetings).
- [ ] **Apply to all relevant funding opportunities** (incl. Connected Computing funding).
- [ ] Prepare the **investor story**: "We simulated N representative users; here's what we found; here's where not to put kiosks; here's the $ difference."

---

## 12. Key dates

| Date | Item |
|---|---|
| ~Dec 4–5, 2026 | Hear back (application decision, "in a month") |
| Dec 11, 2026 (Fri), 2–4 pm | **AI Showcase**, day after classes end (Dr. Smith invited the digital twin) |
| Dec 11, 2026 | AI 1010 **final project due**; this simulation can be the final project |

---

## 13. Open questions

- What location and device data can we access while protecting privacy? Is Apple battery health shareable?
- How do we get representative demand data **before** the pilot?
- What kiosk density and placement give reliable returns **and** profit, especially around events and late-night venues?
- What return time window and late-fee policy balance revenue against negative reviews?
- Which 24/7 venues will host kiosks, and on what terms?
