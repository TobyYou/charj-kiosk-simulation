# Parameters Register

Confidence levels:
- **HIGH**: primary data, directly applicable.
- **MED**: good data that needs transfer to our setting.
- **LOW**: weak or indirect data.
- **ASSUMPTION**: no data; a range has been chosen.
- **FACT**: Charj's own product or business fact.

| ID | Component | Parameter | City / scope | Value or distribution | Unit | Confidence | Source(s) | Last checked | Notes / history |
|---|---|---|---|---|---|---|---|---|---|
| P001 | Hardware | Station slots | all | 8 (2 stacks × 4), stackable to 32; 40–50-slot machines available | slots | FACT | GAME_PLAN §1.3; Besiter PO (BST-0265) | 2026-11-07 | |
| P002 | Hardware | Pack capacity | all | 8000 | mAh | FACT | reference/03-hardware-specs/Charj-Besiter-PO-必要数据摘要-2026-11-02.md | 2026-11-07 | Usable Wh to phone is unverified, see P010 |
| P003 | Hardware | Charging output | all | 22.5 nominal | W | LOW | Meeting transcript (Sophia) | 2026-11-07 | The PO says only "fast-charge"; needs a bench test |
| P004 | Cost | Station unit price | all | 82 | USD | FACT | Besiter PO 24 Jul 2026 | 2026-11-07 | Quote, not proof of payment |
| P005 | Cost | Pack unit price | all | 11 | USD | FACT | Besiter PO | 2026-11-07 | |
| P006 | Cost | Freight per set (50 sets) | all | ≈27.85 (1,392.31 / 50) | USD | FACT | Besiter PO | 2026-11-07 | DDP by sea, 45–50 days after sailing |
| P007 | Pricing | Rental price | all | ~2 → superseded by P034 ($1/hr) | USD/hr | FACT | Meeting transcript | 2026-11-07 | History: meeting said ~$2/hr; app code charges $1/hr |
| P008 | Pricing | Deposit hold | all | 30 | USD | FACT | Meeting transcript; app schema | 2026-11-07 | Charged if overdue (hourly cron in the app) |
| P009 | Demand | Market awareness p_aware | NYC, Nashville | ASSUMPTION — sweep 0.5%–5% | fraction | ASSUMPTION | — | 2026-11-07 | Needs research and pilot data |
| P010 | Charging | Usable pack energy to phone | all | TBD | Wh | ASSUMPTION | — | 2026-11-07 | Research conversion efficiency |
| P011 | Demand | Hourly footfall near 116 St–Columbia | NYC (ET) | TBD | people/hr | — | — | — | Use MTA hourly ridership |
| P012 | Battery | Starting SoC distribution | NYC, Nashville | TBD | % | — | — | — | Field survey planned (GAME_PLAN §5) |
| P013 | Battery | Underground drain penalty (no signal) | NYC | TBD | %/hr | — | — | — | |
| P014 | Sites | Live kiosk locations | NYC | Happy Hot Hunan (969 Amsterdam Ave); Lerner Hall lobby (Columbia) | — | FACT | reference/04-app-data-model | 2026-11-07 | |
| P015 | Demand | Weekday entries, 116 St–Columbia (fall-2026 term) | NYC (ET) | 14,517 (2024 annual avg 10,745; 2019 14,777) | entries/day | HIGH | MTA Subway Hourly Ridership data.ny.gov 5wq4-mkjj (agg 2026-09-14…10-25); MTA 2024 ridership table | 2026-11-07 | ×2 for entries+exits in simulator |
| P016 | Demand | Weekday entries 110 / 103 / 96 / 125 St | NYC (ET) | 10,754 / 9,897 / 29,138 / 7,353 | entries/day | HIGH | MTA hourly ridership (as P015) | 2026-11-07 | |
| P017 | Demand | Weekend ÷ weekday factor (96/103/110/116/125) | NYC | 0.73 / 0.60 / 0.62 / 0.49 / 0.55 | × | MED | MTA 2024 table, "Avg Wkend" read as Sat+Sun total ÷2 | 2026-11-07 | Fall-2026 weekend data distorted by likely 1-train service changes |
| P018 | Demand | Hourly entry profile, weekday (pooled 96/103/116/125) | NYC (ET) | 0.5,0.2,0.1,0.1,0.2,0.6,1.7,5.6,10.0,6.4,4.3,4.1,4.5,4.8,5.6,7.2,8.6,10.2,8.2,5.8,4.5,3.4,2.1,1.2 (%) | % of daily | HIGH | MTA hourly ridership | 2026-11-07 | 116 St alone peaks at 17:00 (14.2%), almost no AM peak |
| P019 | Demand | Columbia population | NYC | 35,769 students (Fall 2024); 4,739 FT faculty + 15,273 FT staff (2023) | people | HIGH/MED | Columbia OPIR | 2026-11-07 | ~45% assumed present on Morningside per weekday |
| P020 | Demand | Barnard / Teachers College students | NYC | 3,223 (2023) / 4,401 (Fall 2024) | people | HIGH/MED | Barnard CDS; IPEDS via Data USA | 2026-11-07 | |
| P021 | Demand | Manhattan pedestrian comparables (PM peak) | NYC | Broadway W63–64 ≈1,814/h; Columbus W75–76 ≈1,208/h | people/h | MED (transfer) | NYC DOT bi-annual ped counts Oct 2025 | 2026-11-07 | No counter at Broadway/116th |
| P022 | Battery | Pack usable energy | all | 60–70% of rated → 17.8–20.7 Wh for 8000 mAh | Wh | MED | Anker support article | 2026-11-07 | ≈1.4–1.6 iPhone 13–15 charges |
| P023 | Battery | iPhone battery size | all | iPhone 13 12.41, 14 12.68, 15 12.98, 15 Pro Max 17.11 | Wh | HIGH | Regulatory filings via MacRumors/9to5Mac | 2026-11-07 | |
| P024 | Battery | Fast charge speed | all | 0→50% ≈24–30 min at 20 W | min | MED | Apple claim; Android Authority test | 2026-11-07 | |
| P025 | Battery | Low-battery anxiety threshold | US/global | 92% report anxiety; onset ≈20% | — | HIGH | Tang et al. IMWUT 2020 (n=2,032) | 2026-11-07 | |
| P026 | Battery | SoC across day | global (2011 Android) | mean 67%; users rarely <30%; charging 18–20 h (~40%) and 01–02 h | % | HIGH (old data) | Ferreira et al. Pervasive 2011 | 2026-11-07 | Share <20% by hour NOT FOUND |
| P027 | Battery | Phone age | US | avg trade-in age 3.64 yrs (2024); 42% of iPhone buyers retired a ≥3-yr phone (2025) | yrs | MED/HIGH | Assurant; CIRP | 2026-11-07 | |
| P028 | Comparables | Rentals per station per day | EU / Japan / NYC | Brick 0.5–3; ChargeSPOT ≈1.3; Recharge.city NYC ≈2 | rentals | HIGH/HIGH/LOW | Brick FAQ; INFORICH FY2024; press release | 2026-11-07 | Used to calibrate p_aware |
| P029 | Comparables | Rental duration | EU / Japan | Brick median ≈45 min; ChargeSPOT >60% within 1 h | min | HIGH | Brick; INFORICH | 2026-11-07 | |
| P030 | Comparables | Venue commission | China / EU | Energy Monster 48–61% of revenue; Brick platform 15–30% | % | HIGH | Energy Monster 20-F; Brick | 2026-11-07 | |
| P031 | Comparables | Pricing | various | China ~RMB4/h, cap ~RMB30/24h; ChargeSPOT ¥330 <1h…¥640 <24h; Brick/Naki ~€3/h, €6–10/day cap | — | HIGH/MED | filings & operator pages | 2026-11-07 | Charj has no daily cap: a 23 h rental costs $23 |
| P032 | Costs | Card fees | US | 2.9% + $0.30 | — | HIGH | stripe.com/pricing | 2026-11-07 | |
| P033 | Costs | Depreciation life | China | banks 3 yrs, cabinets 5 yrs | yrs | HIGH | Energy Monster 20-F | 2026-11-07 | |
| P034 | Pricing | Actual Charj rate in app code | all | $1/hr per started hour; $30 hold captured at 24 h; reminder at 23 h | — | FACT | reference/04-app-data-model/functions-inventory.md | 2026-11-07 | Supersedes P007 ($2/hr from meeting) |
