# Charj Street Battery Survey: Plan & Protocol

**Purpose:** replace the simulator's weakest inputs with measured Morningside Heights data, so the investor answer to "is the demand real?" is "we measured it".

**Form (phones):** https://claude.ai/artifact/AykC2TExA4zB7DCTzdJid7. Share it with each surveyor as a **Contributor** (Share menu). Source: `research/survey/survey-form.html`.

**Time per respondent:** about 60 seconds. **Target:** 600+ completed interviews over 5–7 days, done by 2 pairs of surveyors.

---

## 1. What the survey must measure (and why)

The Nov 9 research run found that real-operator benchmarks only identify the product **c = p_aware × p_low × p_seek**. That product is the share of passers-by who become renters. Profit swings by about 2× inside the plausible range of c (≈$240 vs ≈$490/week for 13 stations), and the benchmarks can't tell us which. The survey measures two of the three factors directly. The third is then derived: **p_aware = c ÷ (p_low × p_seek)**.

| Model input | Today | Survey question | Becomes |
|---|---|---|---|
| `p_low_peak` + `LOW_BATTERY_CURVE` (share of phones below ~20% by hour) | LOW, from 2011 Android data | **Q1** battery %, read off the screen and recorded with time and place | HIGH (local, by hour) |
| `p_seek` (low-battery people with no charger option) | LOW | **Q3** carrying a power bank or cable? **Q4** minutes until next chance to charge | MED–HIGH |
| `p_aware` / conversion | CALIBRATED | **Q6** heard of shared power banks / Charj; **Q7** intent to rent | derived, then cross-checked against stated intent |
| `wtp_mid_hourly` (price sensitivity) | ASSUMPTION | **Q7** with a **randomised price arm** ($1 vs $2/hr, $30 hold vs no hold) | MED (stated preference) |
| `p_stay`, hold time, return geography | LOW / ASSUMPTION | **Q4** next charge opportunity, **Q5** where heading next | MED |
| `old_phone_share` | MED | **Q2** phone model | HIGH (local) |
| Subway battery drop (Dr. Smith's idea) | not modelled | Interview direction at subway sites: **entering vs exiting** | first local estimate |
| Battery-anxiety threshold | HIGH (2020 survey) | **Q8** % at which they start to worry | local check |

---

## 2. Sampling plan

### Sites (each maps to a simulator zone)
| Code | Site | Zone in model | Notes |
|---|---|---|---|
| S116 | 116 St–Columbia station entrances (Broadway) | `z116` | Tag **IN** (entering) vs **OUT** (exiting) |
| S110 | Cathedral Pkwy–110 St station | `z110` | Tag IN/OUT |
| S96 | 96 St station (Broadway) | `z96` | Busiest; also tests the Broadway & 97th candidate |
| CU | Broadway sidewalk at the Columbia gates, 116th | `zCU` | Stay on the **public sidewalk** unless Columbia gives permission to survey on campus |
| BWY | Broadway 110–114 St retail | `zBWY` | |
| AMS | Amsterdam Ave 106–111 St (dining/bars) | `zAMS` | Evening and late blocks matter most here |
| BC | Broadway at the Barnard gate, 117th | `zBC` | Optional |

### Time blocks (local ET)
| Block | Weekday | Saturday | Why |
|---|---|---|---|
| A | 08:00–10:00 | — | Morning commute: phones should be full (baseline) |
| B | 12:00–14:00 | 13:00–15:00 | Midday |
| C | 17:00–19:00 | — | Evening peak, the key `p_low_peak` estimate |
| D | 21:00–23:00 | 21:00–23:00 | Night/nightlife: lowest batteries expected |

### Sample sizes (why 600)
- The key estimate is the share below 20% in the evening (expected ≈8–12%). For ±4 points at 95% confidence: n = 1.96² × 0.1 × 0.9 / 0.04² ≈ **216 in blocks C+D**.
- Per site type (subway / campus / retail-dining) at ±8 points, about **60 each**.
- Per time block, for the hourly curve shape: about **100 each**.
- The price experiment needs about **150 per arm** to see a 10-point intent difference.
- **`p_seek` caveat (found while testing the analysis):** only ~10% of people are below 20%, so 600 interviews give only ~60 low-battery people. That pins `p_seek` to about ±12 points. The analysis therefore also estimates it across **everyone**, and uses that tighter pooled number unless the low-battery group is significantly different. To measure the low-battery group directly, **oversample block D (night)**, where low batteries are most common.
- **Total ≈ 600–700 completed.** At about 20 completes per surveyor-hour, that is ≈32 surveyor-hours, or 8 two-hour shifts for a pair.

### Shift schedule (suggested)
| Day | Shift 1 | Shift 2 |
|---|---|---|
| Mon | A @ S116 (IN/OUT) | C @ S116 (IN/OUT) |
| Tue | B @ CU | D @ AMS |
| Wed | A @ S96 | C @ BWY |
| Thu | B @ S110 | C @ S96 |
| Fri | C @ CU | D @ AMS |
| Sat | B @ BWY | D @ AMS / S116 |
| Spare | Fill the thinnest cells in the quota table (see the form's live counts) | |

### Who to approach: systematic intercept
1. Stand at a fixed spot and pick a line on the pavement.
2. Approach **every 3rd adult** who crosses it.
3. Count everyone you approach, including refusals, with the form's "+ refused" button.

Surveyors must **not** choose friendly-looking people or people already holding a phone, because both bias the battery numbers.

---

## 3. Questionnaire (read exactly; about 60 seconds)

> **Intro / consent:** "Hi! We're Vanderbilt students researching phone charging in the neighbourhood. One minute, anonymous, no names. Want a candy/sticker either way?"
> If no, tap **+ refused**. If yes, continue. Adults only.

| # | Question (say) | Record | Notes |
|---|---|---|---|
| — | (surveyor) | time and site are auto-filled; tap **IN / OUT** at subway sites | |
| Q1 | "Could you check your phone's battery percentage right now and tell me the number?" | 0–100. Tick **"saw screen"** if they showed it | Don't take their phone. If the phone is dead, record 0 and tick **dead** |
| Q2 | "What phone is it?" | Model from a list (iPhone 11 or older … iPhone 17 / Samsung / Pixel / other) | Converted to phone age later |
| Q3 | "Do you have a charger or power bank with you right now?" | Power bank / Cable only / Neither | |
| Q4 | "When will you next be somewhere you can charge?" | <30 min / 30–60 min / 1–3 h / 3 h+ | |
| Q5 | "Where are you heading next?" | Class/campus / Work / Home (nearby) / Out of the neighbourhood / Food-drink nearby / Other | Feeds return geography |
| Q6 | "Have you ever used a rental power bank, like the station ones in Asia or at airports? Heard of **Charj**?" | Used before Y/N · Heard of Charj Y/N | |
| Q7 | Read the offer from the form, which picks the version at random: "If a station 2 minutes from here let you borrow a power bank for **[$1 / $2] an hour**, [with a **$30** temporary card hold that's released when you return it / with no deposit], and return it at any station, would you use it **right now**?" | Definitely / Probably / Not sure / Probably not / Definitely not | Read the arm the form shows. Never choose the arm yourself |
| Q8 | "At what battery % do you start to worry?" | 0–100 | |
| Q9 | "Are you mainly a student here, work here, live here, or visiting?" | Student / Work / Live / Visiting | Matches the model's personas |

**Close:** "Thanks!" Hand over the incentive. No contact details are collected.

---

## 4. Ethics, privacy and permissions
- **Anonymous by design:**
  - No names, emails, phone numbers, photos or exact ages.
  - Q2's phone model is a coarse category.
  - The form never records GPS, only the site code.
- **Consent:** verbal, using the intro script. People may stop at any time. Adults only.
- **Location rules:**
  - Public sidewalks are fine.
  - Stand on the sidewalk **outside** subway entrances, never inside stations or fare control. The MTA's rules of conduct restrict non-transit activities in stations; check them before the first shift.
  - Do not survey on Columbia or Barnard property without permission.
  - Don't block entrances.
- **IRB:** this is product and market research for Charj. Before using the results in a class paper or publication, **check with Dr. Smith / Vanderbilt HRPP whether IRB review is needed.** Course projects and published research can fall under different rules.
- **Data handling:**
  - Responses go only to the team's survey page and this private repo.
  - Publish only aggregates.

---

## 5. Data quality rules
- Do a **pilot** first: 20 interviews on day 1. Time them, fix any confusing wording, and mark those rows `pilot`. Pilot rows are excluded from the analysis if the wording changed.
- Battery % must be a number someone read off a screen. Mark self-reports without looking as **"not seen"**. The analysis reports both.
- Log refusals for every shift. The response rate is reported, and a large gap between sites or blocks is flagged as possible bias.
- Don't survey the same person twice; ask "Have we asked you already this week?"
- Weather: the form records a weather tag. Cold days lower batteries (scenario `cold`).

---

## 6. Analysis plan: how results feed the simulator

Script: `research/scripts/analyze_street_survey.py`. It uses only the standard library; run it with `python3 -I`. Its input is the CSV exported from the form. Its outputs are `research/survey/results/summary.md` and `suggested_params.json`.

1. **`p_low` by block and site:** share with battery < 20% (also < 10% and < 30%), with Wilson 95% intervals. The evening block C+D value becomes `p_low_peak`. The block ratios reshape `LOW_BATTERY_CURVE`.
2. **`p_seek`:** among people below 20%, the share with **no power bank** *and* no charging chance within 60 min. The cable-only answers are reported separately, since a cable only helps near an outlet.
3. **Price and hold response:** intent by arm. Intent is converted to an expected rental probability with the standard stated-intent discount (Definitely × 0.75 + Probably × 0.25 + Not sure × 0.05). Those weights are **ASSUMPTION** and reported as such, with a sensitivity range. The $2 − $1 difference gives a slope for `wtp_mid_hourly`.
4. **Derived awareness:** p_aware = c ÷ (p_low × p_seek), using the calibrated c band (5.9e-5 to 3.9e-4). If the result is implausible (e.g. > 20% in month 1), the calibration band or the funnel structure is wrong. That inconsistency is a finding in itself.
5. **Subway drop:** OUT minus IN at the same station and block: mean battery difference and share < 20%, with a bootstrap 95% interval.
6. **Hold and return:** Q4 and Q5 give the share who would stay put (`p_stay` proxy) and the share leaving the area (`pOutside`).
7. **Phone age:** Q2 → share ≥ 3 years old (`old_phone_share`).

Each result goes into `research/PARAMETERS.md` and `simulator/js/params.js` with source *"Charj street survey, Nov 2026, n=…"* and confidence **HIGH** (or **MED** for stated-preference items). Then rerun the benchmark check (`node simulator/cli.mjs 50 normal all`) and `calibrate_conversion.mjs`.

---

## 7. What to tell investors afterwards
> "We surveyed N people at 6 Morningside sites across 4 time blocks. X% had under 20% battery at the evening peak (95% CI …), and Y% of them had no charger with them. At $1/hour, Z% said they'd definitely rent on the spot. Plugging these into the simulator gives …"
