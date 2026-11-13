# Charj Digital Twin

**Simulating a phone power-bank rental network before building it.**

Charj rents portable power banks from kiosks in cafés, bars, campuses and transit hubs. This repo is the digital twin of that network: a minute-by-minute simulation that answers the questions we face before launch.

- Where should kiosks go?
- How many do we need?
- What will they earn each week?

It also shows how sure we can be of each answer. Every kiosk we install feeds real data back in, so the forecasts get sharper over time.

> AI 1010 final project · Vanderbilt AI Showcase, Dec 11, 2026
> White paper: https://claude.ai/artifact/AYXY3RuCVQwjKtbWsNwfbR

---

## Quick start

You need Python 3 (for a local web server) and an internet connection (map tiles and chart libraries).

```bash
python3 -m http.server 8765
```

Then open **http://localhost:8765/simulator/**.

To run it headless (no browser), you need Node.js 18+:

```bash
node simulator/cli.mjs 100 normal all     # replications, scenario, sites (live | all | id,id,...)
node showcase/demo_numbers.mjs            # re-run the figures used in the showcase demo
```

## What the simulator does

| Tab | What it answers |
|---|---|
| **Live network** | Plays one week on a map of Morningside Heights. Kiosks fill and empty slot by slot, renters move as dots coloured by phone battery, and red rings mark missed demand. You can change sites, price, awareness, packs, venue share and scenarios. |
| **Monte Carlo** | Replays the week hundreds of times. Shows expected weekly profit with a 95% confidence interval, the P10–P90 range, the chance of a profitable week, and a check against real operators. |
| **Layout A/B** | Compares two layouts against the same simulated customers (common random numbers), e.g. "is a new kiosk worth it?" |
| **Sensitivity** | Shows which uncertain inputs move profit the most, i.e. what to measure next. |
| **Data & sources** | Lists all 50 inputs with value, range, confidence label and a link to its source. |
| **Model** | The equations, validation and known limits. |

**How it works, in one paragraph.** People arrive at subway stations, campuses and retail strips by a non-homogeneous Poisson process. Arrival rates come from MTA hourly ridership and university enrollment. Only people with a low phone, who know Charj and carry no charger become customers. Each looks for a kiosk within walking distance and accepts or declines the price on a calibrated logistic curve. Renters charge their phones at measured speeds and walk to destinations chosen by a gravity model. They return packs to nearby kiosks and are billed exactly as Charj's app does: $1 per started hour, with the $30 hold captured after 24 h. Weekly profit subtracts card fees, venue share, support, disputes, lost packs, rebalancing, hardware write-off, placement fees and software. The full explanation is in the white paper and the Model tab.

## Data and honesty

Every input carries one of six labels:

- **FACT:** Charj's own records
- **HIGH:** primary data that applies directly
- **MED:** good data, adapted to our setting
- **LOW:** weak or indirect evidence
- **CALIBRATED:** not measured; tuned to match real operators
- **ASSUMPTION:** no data yet; a range we test

The current mix is 9 / 9 / 9 / 8 / 2 / 13, with sources including:
- MTA open data
- Columbia, Barnard and Teachers College statistics
- peer-reviewed battery studies
- SEC and securities filings (Energy Monster, INFORICH/ChargeSPOT)
- Stripe pricing
- Charj's purchase order and app code

The model is checked against real operators' 0.5–3 rentals per kiosk per day. It has **not yet** been validated on Charj's own rental data; the pilot and the street survey will do that.

## Repository layout

| Path | Contents |
|---|---|
| `simulator/` | The digital twin: `js/engine.js` (simulation), `js/params.js` (every input + provenance), `js/montecarlo.js`, `js/app.js` (dashboard), `cli.mjs` (headless runner) |
| `research/` | Evidence base: `PARAMETERS.md` (register of every number), `SOURCES.md`, `STATS_TOOLKIT.md` (methods), `TOPICS_QUEUE.md`, `daily-reports/`, `data/` (small datasets + `.meta.md`), `scripts/` (fitting and calibration scripts) |
| `research/survey/` | Street battery survey: plan and protocol, phone form, linked to `research/scripts/analyze_street_survey.py` |
| `reference/` | Charj's own documents: pitches, purchase-order summary, hardware certificates, app data model, product images |
| `showcase/` | AI Showcase materials and the demo-numbers script |
| `GAME_PLAN.md` | The plan from the Nov 6, 2026 meeting that started the project |
| `.claude/skills/charj-sim-research/` | The AI research routine that updates this repo daily |

## How it keeps improving

A scheduled AI research routine runs every morning. It:
1. picks the most valuable open questions,
2. researches them with parallel agents,
3. verifies every number at its source,
4. updates `research/PARAMETERS.md` and `simulator/js/params.js`,
5. re-runs the benchmark check,
6. writes a daily report and pushes it here.

As kiosks go live, survey results and pilot rental logs replace the calibrated and assumed inputs, and the model is re-checked against what actually happened.

## Known limits

- Contribution profit only: no salaries, insurance, installation or marketing.
- Awareness and uptake are calibrated, not measured. They are the largest uncertainty (about two-thirds of the profit variance in Sobol analysis).
- Campus, dining and hospital hour-of-day shapes are assumed; subway shapes are measured.
- Walking uses grid distance, not street routing.
- Only Morningside Heights is live in the model. Nashville, Chicago and Miami inputs are being gathered.

## Team

Charj (CharjCo LLC) · built with Claude as engineering, data-science and research partner.
