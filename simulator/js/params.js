// Every model input lives here with its provenance.
// conf: FACT (Charj's own data) | HIGH (primary data, directly applicable) | MED (good data, transferred)
//       | LOW (weak/indirect) | CALIBRATED (unmeasured; tuned so outputs match real benchmarks)
//       | ASSUMPTION (no data yet: a range we test)
// `low`/`high` are the plausible range used for sensitivity analysis.
// Mirrors research/PARAMETERS.md — the daily research routine updates both.

export const PARAMS = {
  // ── Charj product & pricing (from Charj's own app code / purchase order) ──
  price_per_hour:   { group: 'Pricing', label: 'Rental price', value: 1.0, low: 1.0, high: 2.0, unit: '$/hr (billed per started hour)', conf: 'FACT',
                      source: 'charj-app functions: HOURLY_RATE_CENTS=100, hours × $1', ref: 'reference/04-app-data-model/functions-inventory.md',
                      note: 'Meeting transcript said ~$2/hr; the live app code charges $1/hr. Range covers both.' },
  deposit:          { group: 'Pricing', label: 'Card hold (forfeited if overdue)', value: 30, low: 30, high: 30, unit: '$', conf: 'FACT',
                      source: 'charj-app: DEPOSIT_CENTS=3000', ref: 'reference/04-app-data-model/functions-inventory.md' },
  overdue_hours:    { group: 'Pricing', label: 'Overdue cutoff', value: 24, low: 24, high: 24, unit: 'hours', conf: 'FACT',
                      source: 'charj-app: OVERDUE_HOURS=24 (hourly cron captures deposit, cancels rental fee)', ref: 'reference/04-app-data-model/functions-inventory.md' },
  slots_per_kiosk:  { group: 'Hardware', label: 'Slots per station', value: 8, low: 8, high: 16, unit: 'slots', conf: 'FACT',
                      source: 'Besiter PO: BST-0265 8-slot; stackable (meeting)', ref: 'reference/03-hardware-specs/Charj-Besiter-PO-必要数据摘要-2026-11-02.md' },
  packs_per_kiosk:  { group: 'Operations', label: 'Packs loaded per station', value: 6, low: 4, high: 8, unit: 'packs', conf: 'ASSUMPTION',
                      source: 'Operating decision. PO ratio is 8 packs per 8-slot station (400/50), which leaves no free slot for returns.', ref: '' },
  pack_mah:         { group: 'Hardware', label: 'Pack capacity', value: 8000, low: 8000, high: 8000, unit: 'mAh @3.7 V', conf: 'FACT',
                      source: 'Besiter PO: BST-0155 8000 mAh', ref: 'reference/03-hardware-specs/Charj-Besiter-PO-必要数据摘要-2026-11-02.md' },
  pack_efficiency: { group: 'Hardware', label: 'Pack → phone energy efficiency', value: 0.65, low: 0.60, high: 0.70, unit: 'fraction', conf: 'MED', source: 'Anker: usable ≈60–70% of rated capacity (3.7 V cells, boost + phone charging losses)', url: 'https://service.anker.com/article-description/Why-is-the-Rated-Capacity-of-Power-Banks-Lower-Than-Expected' },
  phone_wh: { group: 'Battery', label: 'Typical phone battery energy', value: 12.7, low: 12.4, high: 17.1, unit: 'Wh', conf: 'HIGH', source: 'Regulatory filings: iPhone 13 12.41 Wh, 14 12.68 Wh, 15 12.98 Wh, 15 Pro Max 17.11 Wh', url: 'https://www.macrumors.com/2023/09/15/iphone-15-battery-capacities-revealed/' },
  pack_recharge_h:  { group: 'Hardware', label: 'Station recharge time, empty → 80%', value: 2.5, low: 1.5, high: 4, unit: 'hours', conf: 'ASSUMPTION',
                      source: 'Not measured. Bench test needed (Needs Toby)', ref: '' },
  rentable_min_soc: { group: 'Operations', label: 'Min pack charge to release', value: 60, low: 40, high: 80, unit: '%', conf: 'ASSUMPTION',
                      source: 'Operating policy choice', ref: '' },
  hardware_cost_set:{ group: 'Costs', label: 'Station + 8 packs incl. freight', value: 197.85, low: 197.85, high: 260, unit: '$ / set', conf: 'FACT',
                      source: 'Besiter PO: $82 + 8×$11 + freight share $27.85 (installation not included)', ref: 'reference/03-hardware-specs/Charj-Besiter-PO-必要数据摘要-2026-11-02.md' },
  amortize_months: { group: 'Costs', label: 'Hardware write-off period', value: 36, low: 24, high: 60, unit: 'months', conf: 'MED', source: 'Energy Monster 20-F: power banks depreciated over 3 yrs, cabinets 5 yrs', url: 'https://www.sec.gov/Archives/edgar/data/1834253/000110465922050602/em-20211231x20f.htm' },
  pack_replace_cost:{ group: 'Costs', label: 'Replacement cost of a lost pack', value: 13.8, low: 11, high: 20, unit: '$', conf: 'FACT',
                      source: 'Besiter PO: $11 + freight share ($511.63/400)', ref: 'reference/03-hardware-specs/Charj-Besiter-PO-必要数据摘要-2026-11-02.md' },

  // ── Costs that still need data ──
  host_share: { group: 'Costs', label: 'Venue revenue share', value: 0.20, low: 0.0, high: 0.50, unit: 'of rental revenue', conf: 'MED', source: 'Energy Monster 20-F: venue incentive fees 48–61% of revenue (China, 2019–21); Brick (EU) platform fee 15–30%. Some Charj hosts asked $100–200 placement.', url: 'https://www.sec.gov/Archives/edgar/data/1834253/000110465922050602/em-20211231x20f.htm' },
  stripe_pct: { group: 'Costs', label: 'Card fee (percent)', value: 0.029, low: 0.029, high: 0.044, unit: 'of charge', conf: 'HIGH', source: 'Stripe US online card: 2.9% + $0.30 (+1.5% international cards)', url: 'https://stripe.com/pricing' },
  stripe_fixed: { group: 'Costs', label: 'Card fee (fixed)', value: 0.30, low: 0.30, high: 0.30, unit: '$ / charge', conf: 'HIGH', source: 'Stripe US online card pricing', url: 'https://stripe.com/pricing' },
  cs_ticket_cost:   { group: 'Costs', label: 'Cost per customer-service ticket', value: 3, low: 1, high: 8, unit: '$', conf: 'ASSUMPTION', source: 'AI-chatbot-first support (meeting); not measured', ref: '' },
  rebalance_cost: { group: 'Costs', label: 'Cost per rebalancing stop', value: 12, low: 6, high: 25, unit: '$ / station visit', conf: 'ASSUMPTION', source: 'Student labour estimate', ref: '' },
  placement_fee:    { group: 'Costs', label: 'One-time host placement fee', value: 150, low: 0, high: 200, unit: '$ / station (written off over 12 months)', conf: 'FACT',
                      source: 'Charj merchant visits: some hosts asked $100–200 for placement', ref: 'reference/02-business-strategy/Charj-Founding-Host与广告额度策略-2026-11-01.md' },
  software_weekly:  { group: 'Costs', label: 'Software, hosting, email, SMS', value: 15, low: 5, high: 40, unit: '$ / week', conf: 'ASSUMPTION', source: 'Supabase + Resend + domain; not invoiced yet', ref: '' },

  // ── Demand funnel: footfall × aware × low battery × will rent ──
  footfall_96st: { group: 'Footfall', label: '96 St station, people/day (entries+exits, weekday)', value: 58276, low: 48000, high: 62000, unit: 'people/day', conf: 'HIGH', source: 'MTA Subway Hourly Ridership, fall-2026 term weekdays (14 Sep–25 Oct): 29,138 entries/day × 2 (exits assumed ≈ entries)', url: 'https://data.ny.gov/resource/5wq4-mkjj.json' },
  footfall_103st: { group: 'Footfall', label: '103 St station, people/day (entries+exits, weekday)', value: 19794, low: 16000, high: 21000, unit: 'people/day', conf: 'HIGH', source: 'MTA Subway Hourly Ridership, fall-2026 term weekdays (14 Sep–25 Oct): 9,897 entries/day × 2 (exits assumed ≈ entries)', url: 'https://data.ny.gov/resource/5wq4-mkjj.json' },
  footfall_110st: { group: 'Footfall', label: 'Cathedral Pkwy–110 St station, people/day (entries+exits, weekday)', value: 21508, low: 17000, high: 23000, unit: 'people/day', conf: 'HIGH', source: 'MTA Subway Hourly Ridership, fall-2026 term weekdays (14 Sep–25 Oct): 10,754 entries/day × 2 (exits assumed ≈ entries)', url: 'https://data.ny.gov/resource/5wq4-mkjj.json' },
  footfall_116st: { group: 'Footfall', label: '116 St–Columbia station, people/day (entries+exits, weekday)', value: 29034, low: 21000, high: 31000, unit: 'people/day', conf: 'HIGH', source: 'MTA Subway Hourly Ridership, fall-2026 term weekdays (14 Sep–25 Oct): 14,517 entries/day × 2 (exits assumed ≈ entries)', url: 'https://data.ny.gov/resource/5wq4-mkjj.json' },
  footfall_125st: { group: 'Footfall', label: '125 St (1) station, people/day (entries+exits, weekday)', value: 14706, low: 12000, high: 16000, unit: 'people/day', conf: 'HIGH', source: 'MTA Subway Hourly Ridership, fall-2026 term weekdays (14 Sep–25 Oct): 7,353 entries/day × 2 (exits assumed ≈ entries)', url: 'https://data.ny.gov/resource/5wq4-mkjj.json' },
  footfall_columbia: { group: 'Footfall', label: 'Columbia main campus, people present/day', value: 25000, low: 18000, high: 35000, unit: 'people/day', conf: 'MED', source: 'Derived: 35,769 students (Fall 2024) + 4,739 faculty + 15,273 staff (2023) ≈ 55.8k affiliates; ~45% assumed on the Morningside campus on a given weekday (medical campus and part-time students elsewhere)', url: 'https://opir.columbia.edu/sites/default/files/content/Statistical%20Abstract/opir_enrollment_history.pdf' },
  footfall_barnard: { group: 'Footfall', label: 'Barnard, people present/day', value: 4000, low: 3000, high: 5000, unit: 'people/day', conf: 'MED', source: 'Derived: 3,223 students (Barnard CDS 2023-24) + ~800 staff/faculty (assumption)', url: 'https://barnard.edu/sites/default/files/inline-files/CDS_2023-2024-Barnard%20College.pdf' },
  footfall_tc: { group: 'Footfall', label: 'Teachers College, people present/day', value: 3000, low: 2000, high: 4500, unit: 'people/day', conf: 'MED', source: 'Derived: 4,401 students Fall 2024 (IPEDS via Data USA; 1,149 part-time), ~65% present on a weekday', url: 'https://datausa.io/profile/university/teachers-college-at-columbia-university' },
  footfall_mville: { group: 'Footfall', label: 'Manhattanville campus, people/day', value: 4000, low: 2500, high: 6000, unit: 'people/day', conf: 'ASSUMPTION', source: 'No data (Business School + other schools on site)', url: '' },
  footfall_broadway: { group: 'Footfall', label: 'Broadway 110–116 retail, people/day', value: 18000, low: 12000, high: 28000, unit: 'people/day', conf: 'LOW', source: 'Transferred from NYC DOT bi-annual pedestrian counts, Oct 2025: Broadway W 63–64 ≈1,814/h PM; Columbus Ave W 75–76 ≈1,208/h PM. No counter at Broadway/116th.', url: 'https://data.cityofnewyork.us/resource/cqsj-cfgu.json' },
  footfall_amsterdam: { group: 'Footfall', label: 'Amsterdam dining strip, people/day', value: 9000, low: 5000, high: 14000, unit: 'people/day', conf: 'LOW', source: 'Assumed ≈half of Broadway (NYC DOT comparables); no counter on Amsterdam 105–112', url: 'https://data.cityofnewyork.us/resource/cqsj-cfgu.json' },
  footfall_hospital: { group: 'Footfall', label: 'Mount Sinai Morningside, people/day', value: 6000, low: 4000, high: 9000, unit: 'people/day', conf: 'ASSUMPTION', source: 'No data (staff + patients + visitors)', url: '' },

  p_aware: { group: 'Demand', label: 'Share of passers-by who know Charj and would consider it', value: 0.01, low: 0.004, high: 0.03, unit: 'fraction', conf: 'CALIBRATED', source: 'Unmeasured pre-launch. Default calibrated so a 13-station network lands inside real operators\' 0.5–3 rentals per station per day (Brick, ChargeSPOT, Recharge.city NYC). Raw guess of 3% gave ~7/station/day, above every comparable.', url: 'https://articles.brick.tech/the-10-most-frequently-asked/' },
  p_low_peak: { group: 'Demand', label: 'Share of phones below ~20% at the evening peak', value: 0.12, low: 0.05, high: 0.20, unit: 'fraction', conf: 'LOW', source: 'Indirect: Ferreira 2011 (4,035 users, verified): mean SoC 67%, lowest hourly mean 65% at midnight, daily minimum ≈30%. A normal approximation (SD 25 pts) gives ≈4–8% below 20% in the evening; 0.12 kept because p_aware is calibrated against it (2026-11-08: range low widened 0.05→0.04). No hourly SoC histogram exists in open literature; street survey needed. 2026-11-09: low end raised 0.04→0.05: Li et al. 2018 (Sherlock, 51 users) 41% of discharge sessions end <20% and 5% die; Guo et al. 2017 (80k Android, China) charge-start levels roughly uniform and ~1 battery death per user per month — both inconsistent with ≈4%. Value 0.12 kept: only c = p_aware×p_low_peak×p_seek is identified (STATS_TOOLKIT M7).', url: 'https://ubicomp.oulu.fi/files/pervasive11.pdf' },
  p_seek: { group: 'Demand', label: 'Low-battery users with no charger of their own who would rent', value: 0.30, low: 0.15, high: 0.50, unit: 'fraction', conf: 'LOW', source: 'Tang et al. IMWUT 2020 (n=2,032): 92% feel low-battery anxiety, anxiety starts ~20%; 70% use portable chargers only occasionally, 10% frequently', url: 'https://arxiv.org/abs/2004.07662' },
  wtp_mid_hourly:   { group: 'Demand', label: 'Price where half of willing users decline', value: 3.0, low: 2.0, high: 5.0, unit: '$/hr', conf: 'ASSUMPTION',
                      source: 'No data. Campus test: $30 hold + $2/hr deterred some users (meeting).', ref: '' },
  search_radius_m:  { group: 'Behaviour', label: 'How far a low-battery user will walk to rent', value: 300, low: 150, high: 500, unit: 'm', conf: 'ASSUMPTION', source: 'No data', ref: '' },
  return_radius_m:  { group: 'Behaviour', label: 'How far a renter will walk to return', value: 350, low: 200, high: 600, unit: 'm', conf: 'ASSUMPTION', source: 'No data', ref: '' },
  p_forget: { group: 'Behaviour', label: 'Renters who forget (go past 24 h)', value: 0.04, low: 0.01, high: 0.10, unit: 'fraction', conf: 'LOW', source: 'Indirect: Energy Monster 2020 cost of power banks sold (incl. kept by users) = 3.4% of revenue. Direct non-return rate not disclosed.', url: 'https://www.sec.gov/Archives/edgar/data/1834253/000104746921000594/a2242952zf-1.htm' },
  away_return_median_h: { group: 'Behaviour', label: 'Hold time if no station near destination (median)', value: 12, low: 6, high: 20, unit: 'hours', conf: 'ASSUMPTION',
                      source: 'No data; typically back the next morning', ref: '' },
  grace_failed_return: { group: 'Behaviour', label: 'Clock paused after a failed return (1 = on)', value: 1, low: 1, high: 1, unit: 'flag', conf: 'FACT',
                      source: 'GAME_PLAN §1.3 grace policy: customer service pauses the clock or adds hours if the user could not find a kiosk. Added 2026-11-10: before this, full stations raised profit (billing ran on, deposits forfeited; Morris run).', ref: 'GAME_PLAN.md' },
  p_recover_after_forfeit: { group: 'Behaviour', label: 'Forfeited packs eventually returned', value: 0.4, low: 0.1, high: 0.7, unit: 'fraction', conf: 'ASSUMPTION', source: 'No data', ref: '' },

  p_stay:           { group: 'Behaviour', label: 'Renters who stay at the venue and return once charged', value: 0.5, low: 0.25, high: 0.75, unit: 'fraction', conf: 'LOW',
                      source: 'Sets the rental-duration mix. 0.5 gives a 70-min median, between Brick (≈45 min, €1/h like Charj) and ChargeSPOT Japan Jun 2024 (median ≈133 min: 10% <30 min, 26% <1 h, 64% <3 h, 5% ≥24 h) / HK 2024 (30% of users <1 h, 76% <3 h). p_stay 0.3 → 121-min median, $652/wk; 0.7 → 59 min, $336/wk. 2026-11-10: range widened from 0.3–0.7; old target ">60% within 1 h" is a share of users and conflicts with INFORICH\'s own histogram (P059).', url: 'https://www2.jpx.co.jp/disc/93380/140120241113521342.pdf' },

  // ── Phone charging physics ──
  phone_rate_fast: { group: 'Battery', label: 'Phone charge speed below 80%', value: 1.8, low: 1.4, high: 2.1, unit: '%/min', conf: 'MED', source: 'Apple 20 W: 0→50% in ~30 min; Android Authority test, iPhone 15: 50% at 24 min, 75% at 42 min', url: 'https://www.androidauthority.com/best-iphone-15-chargers-3363259/' },
  phone_rate_slow: { group: 'Battery', label: 'Phone charge speed above 80%', value: 0.5, low: 0.3, high: 0.7, unit: '%/min', conf: 'LOW', source: 'Apple: fast charge to 80%, then trickle (CC/CV). Exact taper rate not published.', url: 'https://www.apple.com/batteries/why-lithium-ion/' },
  old_phone_share: { group: 'Battery', label: 'Share of phones ≥3 years old', value: 0.40, low: 0.30, high: 0.50, unit: 'fraction', conf: 'MED', source: 'CIRP 2025: 42% of US iPhone buyers retired a phone kept ≥3 years; Assurant 2024: avg trade-in age 3.64 yrs', url: 'https://cirpapple.substack.com/p/new-iphone-buyers-upgrade-from-even' },
  old_phone_speed: { group: 'Battery', label: 'Charge speed factor for older phones', value: 0.8, low: 0.65, high: 0.9, unit: '×', conf: 'LOW', source: 'Apple: iPhone 14 and earlier designed for 80% capacity at 500 cycles; effect on charge speed not measured', url: 'https://support.apple.com/en-us/106348' },
};

// Hour-of-day share of daily footfall (24 values, local time). Labelled ASSUMPTION until fitted to MTA hourly data.
export const PROFILES = {
  conf: { subway: 'HIGH', sub96: 'HIGH', sub103: 'HIGH', sub110: 'HIGH', sub116: 'HIGH', sub125: 'HIGH', campus: 'ASSUMPTION', dining: 'ASSUMPTION', hospital: 'ASSUMPTION' },
  source: {
    subway: 'Weekday: MTA Subway Origin-Destination Ridership Estimate 2025 (data.ny.gov y2qv-fytt), 116 St–Columbia, entries (trips originating) + exits (trips destined, spread 50/50 over start hour and next), all weekdays 2025. Evening exits are only ~0.5× entries. Weekend: MTA hourly entries (5wq4-mkjj), fall 2026 blend.',
    sub96: 'Per-station weekday and weekend (Sat+Sun weighted by daily totals): MTA Subway OD Ridership Estimate 2025 (y2qv-fytt), all months, entries + exits (exits spread 50/50 over start hour and next). research/scripts/od_profiles_for_params.mjs. Added 2026-11-10.',
    sub103: 'Per-station weekday and weekend (Sat+Sun weighted by daily totals): MTA Subway OD Ridership Estimate 2025 (y2qv-fytt), all months, entries + exits (exits spread 50/50 over start hour and next). research/scripts/od_profiles_for_params.mjs. Added 2026-11-10.',
    sub110: 'Per-station weekday and weekend (Sat+Sun weighted by daily totals): MTA Subway OD Ridership Estimate 2025 (y2qv-fytt), all months, entries + exits (exits spread 50/50 over start hour and next). research/scripts/od_profiles_for_params.mjs. Added 2026-11-10.',
    sub116: 'Per-station weekday and weekend (Sat+Sun weighted by daily totals): MTA Subway OD Ridership Estimate 2025 (y2qv-fytt), all months, entries + exits (exits spread 50/50 over start hour and next). research/scripts/od_profiles_for_params.mjs. Added 2026-11-10.',
    sub125: 'Per-station weekday and weekend (Sat+Sun weighted by daily totals): MTA Subway OD Ridership Estimate 2025 (y2qv-fytt), all months, entries + exits (exits spread 50/50 over start hour and next). research/scripts/od_profiles_for_params.mjs. Added 2026-11-10.',
    campus: 'Shape assumption (class hours 9–17, library evenings)',
    dining: 'Shape assumption (lunch and dinner peaks)',
    hospital: 'Shape assumption (shift changes 7:00 / 19:00)',
  },
  url: { subway: 'https://data.ny.gov/resource/y2qv-fytt', sub96: 'https://data.ny.gov/resource/y2qv-fytt', sub103: 'https://data.ny.gov/resource/y2qv-fytt', sub110: 'https://data.ny.gov/resource/y2qv-fytt', sub116: 'https://data.ny.gov/resource/y2qv-fytt', sub125: 'https://data.ny.gov/resource/y2qv-fytt' },
  weekday: {
    // 2026-11-09: replaced with MTA OD 2025 entries+exits at 116 St (research/scripts/od_footfall_profile.mjs). Old blend: [0.55,0.15,0.1,0.1,0.15,0.4,1.15,3.8,6.55,4.45,3.45,3.8,4.45,5.05,6.0,7.55,9.95,12.2,9.35,7.2,5.85,4.1,2.4,1.35]
    subway:   [0.73, 0.25, 0.12, 0.09, 0.19, 0.81, 1.82, 3.7, 6.67, 7.01, 5.24, 4.76, 5.25, 5.49, 6.04, 7.27, 8.87, 10.3, 7.75, 5.58, 4.49, 3.44, 2.56, 1.57],
    // 2026-11-10: per-station OD profiles (zones now use these; 'subway' kept as the 116 St legacy curve).
    sub96: [0.79, 0.28, 0.15, 0.11, 0.23, 0.74, 2.34, 6.03, 9.62, 6.5, 4.38, 4.11, 4.36, 4.72, 5.6, 6.97, 7.71, 8.88, 8.43, 5.82, 4.22, 3.46, 2.78, 1.77],
    sub103: [0.93, 0.36, 0.18, 0.12, 0.19, 0.58, 1.85, 5.38, 8.87, 6.56, 4.69, 4.24, 4.5, 5, 5.42, 6.44, 7.33, 8.63, 8.48, 6.17, 4.88, 3.83, 3.28, 2.09],
    sub110: [0.88, 0.36, 0.17, 0.13, 0.21, 0.66, 2.03, 4.98, 8.18, 5.89, 4.4, 4.23, 4.63, 5.03, 5.8, 7.31, 8.08, 9.1, 8.22, 5.99, 4.58, 3.89, 3.11, 2.14],
    sub116: [0.73, 0.25, 0.12, 0.09, 0.19, 0.81, 1.82, 3.7, 6.67, 7.02, 5.24, 4.76, 5.25, 5.49, 6.04, 7.27, 8.87, 10.3, 7.75, 5.58, 4.49, 3.44, 2.56, 1.57],
    sub125: [0.96, 0.41, 0.2, 0.16, 0.25, 0.83, 2.24, 4.74, 7.75, 6.54, 4.79, 4.32, 4.77, 5.15, 5.69, 6.58, 8.02, 9.87, 7.85, 5.74, 4.31, 4.04, 2.89, 1.89],
    campus:   [0.5,0.3,0.1,0.1,0.1,0.2,0.8,3.0,6.5,8.5,9.5,9.5,9.0,9.0,8.5,8.0,7.0,5.5,4.0,3.5,3.0,2.0,1.4,1.0],
    dining:   [1.2,0.6,0.3,0.1,0.1,0.2,0.8,2.5,4.0,4.0,4.2,6.5,9.5,8.0,5.5,4.8,5.0,6.5,9.0,9.0,7.0,4.5,3.2,2.0],
    hospital: [2.0,1.5,1.2,1.2,1.5,2.5,5.5,7.0,6.5,6.0,5.5,5.5,5.5,5.5,5.5,5.5,5.0,5.0,4.5,4.0,3.5,3.2,3.0,3.0],
  },
  weekend: {
    subway:   [1.85, 0.6, 0.35, 0.25, 0.2, 0.35, 0.65, 1.65, 2.65, 4.0, 5.05, 6.75, 9.25, 8.9, 7.55, 7.5, 7.7, 7.75, 7.15, 5.95, 4.8, 3.9, 3.15, 2.1],
    // 2026-11-10: per-station OD (Sat+Sun). Old shared weekend 'subway' curve kept above.
    sub96: [1.73, 0.96, 0.52, 0.33, 0.31, 0.55, 1.2, 2.15, 3.25, 4.36, 5.41, 6.23, 6.97, 7.51, 7.46, 7.58, 7.69, 7.64, 7.17, 5.95, 4.73, 4.05, 3.63, 2.6],
    sub103: [1.99, 1.18, 0.65, 0.4, 0.32, 0.45, 0.99, 1.98, 3.27, 4.38, 5.21, 5.79, 6.48, 6.97, 6.95, 7.16, 7.47, 7.61, 7.36, 6.37, 5.39, 4.52, 4.12, 2.97],
    sub110: [2.01, 1.33, 0.76, 0.44, 0.33, 0.47, 0.91, 1.63, 2.48, 3.67, 4.89, 5.88, 6.88, 7.5, 7.47, 7.66, 7.85, 7.93, 7.47, 6.25, 5.03, 4.37, 3.86, 2.92],
    sub116: [2.02, 1.2, 0.72, 0.42, 0.28, 0.44, 0.89, 1.57, 2.34, 3.81, 4.95, 5.88, 7.33, 7.62, 7.45, 7.68, 7.91, 7.86, 7.35, 6.3, 4.99, 4.36, 3.82, 2.8],
    sub125: [2.19, 1.48, 0.82, 0.5, 0.4, 0.52, 1.07, 1.81, 2.96, 3.91, 4.68, 5.55, 6.37, 7.08, 7.24, 7.47, 7.71, 7.73, 7.48, 6.24, 5.23, 4.63, 4.03, 2.9],
    campus:   [1.0,0.6,0.3,0.2,0.1,0.1,0.3,1.0,2.5,4.5,6.5,8.0,9.0,9.5,9.5,9.0,8.0,7.0,6.0,5.0,4.0,3.0,2.5,1.5],
    dining:   [2.5,1.8,1.0,0.4,0.1,0.1,0.3,1.0,2.5,4.5,6.5,8.0,8.5,7.0,5.5,4.8,5.0,6.5,8.0,8.0,6.5,4.5,3.5,3.0],
    hospital: [2.5,2.0,1.6,1.5,1.5,2.0,3.5,5.0,5.5,6.0,6.0,6.0,5.8,5.8,5.6,5.4,5.2,5.0,4.6,4.2,3.8,3.4,3.2,3.0],
  },
};

// Share of phones below ~20% by hour (multiplier on p_low_peak; 1.0 = evening peak).
// Shape informed by Ferreira et al. 2011: SoC lowest around midnight, charging windows 18–20 h and 01–02 h,
// highest at ~05 h. Exact values are an ASSUMPTION.
export const LOW_BATTERY_CURVE = [0.75,0.8,0.8,0.7,0.4,0.15,0.08,0.08,0.12,0.18,0.25,0.33,0.4,0.48,0.56,0.64,0.72,0.82,0.92,1.0,1.0,0.95,0.9,0.82];

export function paramValues(overrides = {}) {
  const v = {};
  for (const [k, p] of Object.entries(PARAMS)) v[k] = p.value;
  return Object.assign(v, overrides);
}

// Scenarios: modifiers on the base week.
export const SCENARIOS = {
  normal:   { label: 'Normal week', description: 'Typical semester week: Mon–Fri term-time, Sat–Sun weekend profile.' },
  finals:   { label: 'Finals week', description: 'Campus footfall +25%, late-night campus traffic doubled, phones run lower (+20%).',
              campusMult: 1.25, lateNightCampusMult: 2.0, lowMult: 1.2 },
  event:    { label: 'Big event egress (Fri 22:00)', description: 'STRESS TEST: large event lets out near Columbia on Friday at 22:00: 8,000 people, phones drained by poor cell coverage (low-battery share ×2.5, ASSUMPTION 1.5–3, for 90 min). Real check (2026-11-08): 116 St sees only ~380 entries at 22:00 on Fridays and no 8k venue is within walking distance (Kraft Field is at 218 St; Apollo 1,500 seats). MTA Yankee Stadium data: ~62–65% of event egress falls in one hour, ~90% within 2 h (research/data/mta_yankee_event_days_2025.csv).',
              event: { day: 4, startMin: 22 * 60, durMin: 90, people: 8000, zone: 'zCU', lowMult: 2.5 } },
  outage:   { label: 'Power outage (Wed 17:00–23:00)', description: 'Neighbourhood blackout Wednesday 17:00–23:00: stations cannot recharge, nearly everyone looks for power (low-battery share ×3, own chargers useless). Rare in Manhattan: Con Ed 2025 SAIFI 0.013 outages/customer/yr, CAIDI 5.25 h; Tennessee 2025 SAIFI 1.54/yr, ~98 min each (EIA Table 11.3).',
              outage: { day: 2, startMin: 17 * 60, endMin: 23 * 60, lowMult: 3.0, seekMult: 2.0 } },
  cold:     { label: 'Cold snap', description: 'Week below 0 °C: phones drain faster (low-battery share ×1.35, ASSUMPTION) and charge 20% slower. Battery University BU-502: generic Li-ion gives ~50% capacity at −18 °C vs 27 °C; Apple operating range 0–35 °C.',
              lowMult: 1.35, chargeMult: 0.8 },
  summer:   { label: 'Summer break', description: 'Campus footfall −70%, other zones −10%.', campusMult: 0.3, otherMult: 0.9 },
};

// Real-world benchmarks the model is checked against (validation, not inputs).
export const BENCHMARKS = [
  { metric: 'rentalsPerStationDay', label: 'Rentals per station per day', low: 0.5, high: 3.0,
    points: [
      { name: 'Brick (EU, 2025)', value: '0.5–3', conf: 'HIGH', url: 'https://articles.brick.tech/the-10-most-frequently-asked/' },
      { name: 'ChargeSPOT Japan (Dec 2024)', value: '≈1.3', conf: 'HIGH', url: 'https://edinetdb.jp/company/E38192/text?fy=2024' },
      { name: 'Recharge.city NYC (2023)', value: '≈2', conf: 'LOW', url: 'https://www.digitaljournal.com/pr/news/accesswire/recharge-city-takes-over-new-york' },
    ] },
  { metric: 'medianRentalMin', label: 'Median rental duration (min)', low: 30, high: 90,
    points: [
      { name: 'Brick median (2025)', value: '≈45 min', conf: 'HIGH', url: 'https://articles.brick.tech/the-10-most-frequently-asked/' },
      { name: 'ChargeSPOT Japan', value: '>60% within 1 h', conf: 'HIGH', url: 'https://inforich.net/en/6617/chargespot-to-revise-minimum-rental-fee-from-may-1-2025/' },
    ] },
];
