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
| P007 | Pricing | Rental price | all | ~2 | USD/hr | FACT | Meeting transcript | 2026-11-07 | Check the app schema for the actual rate structure |
| P008 | Pricing | Deposit hold | all | 30 | USD | FACT | Meeting transcript; app schema | 2026-11-07 | Charged if overdue (hourly cron in the app) |
| P009 | Demand | Market awareness p_aware | NYC, Nashville | ASSUMPTION — sweep 0.5%–5% | fraction | ASSUMPTION | — | 2026-11-07 | Needs research and pilot data |
| P010 | Charging | Usable pack energy to phone | all | TBD | Wh | ASSUMPTION | — | 2026-11-07 | Research conversion efficiency |
| P011 | Demand | Hourly footfall near 116 St–Columbia | NYC (ET) | TBD | people/hr | — | — | — | Use MTA hourly ridership |
| P012 | Battery | Starting SoC distribution | NYC, Nashville | TBD | % | — | — | — | Field survey planned (GAME_PLAN §5) |
| P013 | Battery | Underground drain penalty (no signal) | NYC | TBD | %/hr | — | — | — | |
| P014 | Sites | Live kiosk locations | NYC | Happy Hot Hunan (969 Amsterdam Ave); Lerner Hall lobby (Columbia) | — | FACT | reference/04-app-data-model | 2026-11-07 | |
