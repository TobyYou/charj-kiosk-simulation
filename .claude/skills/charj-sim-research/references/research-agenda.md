# Research Agenda (seed) and Source-Quality Bar

This is a seed list. The live, ranked backlog is `research/TOPICS_QUEUE.md`; this file is where those topics started. Add lasting insights about *where good data lives* to the bottom section.

## Source-quality bar

Rank sources from best to worst:

1. **Primary open data** you can download and fit yourself. Examples: MTA ridership, NYC Open Data, Citi Bike trip files, US Census ACS/LEHD (where people live vs. work), BTS, Metro Nashville open data, WeGo transit, NOAA weather.
2. **Peer-reviewed papers or conference proceedings**, such as ACM MobiSys/UbiComp/SenSys for phone energy studies, or Transportation Research journals for bike-share and mobility.
3. **Manufacturer and regulator documents**: Apple battery and support pages, the GSMA, FCC, and Charj's own UN38.3/MSDS/CE docs in `reference/03-hardware-specs/`.
4. **Reputable industry reports with stated methodology and sample size**, such as Pew smartphone ownership, Counterpoint/Kantar market share, and the shared power-bank market (Meituan, Anker Power Bank Station, ChargeSPOT, Naki, Brick, Juice/FuelRod in the US).
5. **News and blogs.** Use these only as pointers to one of the above. Never cite them as the source of a number.

For every number, record the sample, the year, the geography, and why it transfers (or doesn't) to Charj's users in NYC or Nashville in 2026.

## Seed topics by simulation component

### A. Demand and foot traffic (arrivals)
- NYC subway hourly entries/exits by station (MTA hourly ridership dataset), especially 116 St–Columbia (1 train), 110 St, 96 St, Times Sq–42 St, and 42 St lines.
- NYC pedestrian counts (NYC DOT bi-annual counts) near the candidate sites.
- Nashville: WeGo ridership, downtown and Broadway foot traffic, Vanderbilt and Belmont enrollment and campus daily population, nightlife district patterns.
- Hour-of-day × day-of-week profiles, plus seasonality and the academic calendar.
- Origin–destination proxy: **Citi Bike trip data** (start/end station, timestamps). Use it for how far people travel and where they return, which is a strong analogue for power-bank return behaviour. Also check Nashville BCycle.

### B. Battery state of users
- Distribution of phone battery % across the day. Look for academic smartphone-usage traces, e.g. the Carat dataset, Device Analyzer, LiveLab, and papers on "battery level distribution" and "low battery anxiety".
- Drain rate %/hr by usage type, signal strength (poor signal and underground costs), screen-on time, and phone age. Find cellular-search energy cost when there's no signal in subways.
- Battery health degradation versus phone age (capacity fade per year and per cycle count). Get the iPhone and Android installed-base age mix in the US.
- Cold-temperature effects on drain and on charge acceptance.

### C. Charging physics
- Phone charge-rate curves (CC/CV) at ~20–22.5 W: time to 50/60/80% by model.
- Charj's actual BST-0155 pack: 8000 mAh, output spec, conversion efficiency (usable Wh ≈ 8000 mAh × 3.7 V × efficiency), and how many % of a typical phone one pack delivers.
- Kiosk recharge time for a pack as a function of fill level, and how many packs can charge at once per station power budget.

### D. Behaviour and adoption
- Willingness to pay and adoption of shared power banks. Look at price points in China (¥/hr), Japan (ChargeSPOT), and US competitors; record deposit vs. no-deposit effects and late-return rates.
- Low-battery anxiety / nomophobia prevalence (see `reference/05-research-and-notes/Charj-Nomophobia与电量焦虑研究-2026-11-02.md`, and trace its primary sources).
- Rental durations and return-delay distributions from comparable services and bike-share.

### E. Events and surges
- NYC and Nashville event calendars and attendance: MSG, Barclays, Bridgestone Arena, Nissan Stadium, Ryman, the NYC Marathon, Broadway shows, CMA Fest, and New Year's Eve on Broadway.
- Phone drain at crowded events (cell congestion), and post-event egress curves.
- Power-outage frequency (Con Edison and NES outage stats).

### F. Time zones and city differences
- Compare commute peaks, nightlife hours, and daylight/sunset times by season and DST (NYC ET vs. Nashville CT vs. Chicago CT vs. Miami ET).
- Transit vs. car mode share by city (ACS commute mode). This matters for Miami.

### G. Economics
- Venue host deals and revenue share for kiosks.
- Payment fees (Stripe ~2.9% + 30¢), card-hold mechanics, and chargebacks.
- Replacement or loss rate of packs, and maintenance and restock labour.

### H. Methods and validation
- Non-homogeneous Poisson processes for arrivals, plus fitting and thinning.
- Queueing for slots (Erlang loss / M/M/c/K) and bike-share rebalancing literature.
- Monte Carlo replication count and convergence (CI half-width), sensitivity analysis (one-at-a-time, Sobol), and Bayesian updating as pilot data arrives.
- Agent-based persona generation from ACS/LEHD.

## Where good data lives (append lessons here)
- **NYC hourly transit:** MTA Subway Hourly Ridership `data.ny.gov/resource/5wq4-mkjj` (SoQL `date_extract_hh`, `date_trunc_ymd`, `sum(ridership)`; entries only, no exits). Complex IDs: 307 = 116 St–Columbia, 604 = 161 St–Yankee Stadium. Event days show up clearly as hourly spikes.
- **ACS without a key:** `api.censusreporter.org/1.0/data/show/latest?table_ids=B08301&geo_ids=16000US…` (api.census.gov now needs a key).
- **Sun times:** USNO `aa.usno.navy.mil/api/rstt/oneday` (timeanddate.com blocks bots).
- **Chicago:** CTA 'L' daily entries `data.cityofchicago.org/resource/5neh-572f` (daily only, no hourly).
- **Nashville / Miami:** no open hourly transit data (WeGo needs a request form; Miami-Dade monthly PDFs).
- **Outages:** EIA Electric Power Annual Table 11.3 (state SAIFI/SAIDI); Con Ed's annual reliability report to the NY PSC (by network).
- **Phone SoC by hour:** no open dataset found (checked 2026-11-08). Ferreira 2011 is the only open, extractable source. Don't re-search unless a new dataset is named.
