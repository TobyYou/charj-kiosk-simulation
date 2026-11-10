# chargespot_duration_bins_2024.csv
- **Source:** INFORICH Inc., FY2024 Q3 results presentation, slide 22 "利用時間ごとの利用者割合" (share by usage time), ChargeSPOT Japan. TDnet PDF: https://www2.jpx.co.jp/disc/93380/140120241113521342.pdf (disclosed ~2024-11-13). Downloaded 2026-11-10; values checked by the orchestrator against both the extracted PDF text and the rendered slide image.
- **Months:** 2024-06 (before the 1 July 2024 price change) and 2024-09 (after). Jul and Aug are on the slide too but not copied.
- **Caveat:** the Sep-2024 3–6 h label on the slide repeats the 1–3 h value (38.4%); 17.1% here is 100 − other buckets (our arithmetic). Footnote: special-price stands and subscription-linked rentals excluded from MAU/ARPR (possibly also from this chart).
- **Pricing context:** Japan tariff then ¥165 <30 min, ¥360 <3 h, ¥450 <6 h, ¥540 <24 h — flat over 30 min–3 h, which favours 1–3 h holds. Charj bills $1/started hour, so US holds may be shorter.
- **Fit:** research/scripts/fit_rental_duration_bins.py → Lognormal(μ 4.89, σ 1.27 ln-min), median 133 min; the single lognormal underfits the >24 h tail (3.0% fitted vs 5.1% observed).
