# Charj Digital Twin

A minute-by-minute stochastic simulation of the Charj power-bank network in Morningside Heights. It includes a live map, Monte Carlo risk analysis, paired A/B layout comparison, sensitivity analysis and a full data-provenance table.

## Run it
From the project root:
```bash
python3 -m http.server 8765
```
Then open http://localhost:8765/simulator/. It needs an internet connection for map tiles and the Leaflet/Chart.js libraries.

Headless, for scripts and the research routine:
```bash
node simulator/cli.mjs 100 normal all        # reps, scenario, sites (live | all | id,id,...)
```

## Files
| File | Role |
|---|---|
| `js/params.js` | Every input with value, range, confidence (FACT / HIGH / MED / LOW / CALIBRATED / ASSUMPTION) and source. Mirrors `research/PARAMETERS.md`. Also holds the scenarios and real-world benchmarks. |
| `js/geo.js` | Footfall zones (MTA stations, campuses, retail) and candidate station sites. |
| `js/engine.js` | The simulation: Poisson demand, rentals, charging physics, returns, billing (matches Charj app code), costs. |
| `js/montecarlo.js` | Replications, common-random-number A/B, one-at-a-time sensitivity. |
| `js/app.js` | Dashboard UI. `mc-worker.js` runs analyses off the main thread. |

See the **Model** tab in the app for equations, validation and known limits.
