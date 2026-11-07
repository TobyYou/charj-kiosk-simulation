# Charj — Venue-owner decision strategy

Updated October 6, 2026. Why the website is built the way it is. This is the reasoning, not proof that the approach works; that needs owner conversations and pilot data.

## First principles

Separate what we know, what we assume and what limits us, then build from those.

An owner of a restaurant, café, bar or other venue weighs guest value and rental income against counter space, staff attention, electricity, uncertainty and commitment. A station competes with every other use of that space and attention, not just with other charger brands. "No equipment cost" doesn't make every other cost zero.

**Known:** Charj supplies the equipment, offers a 20% rental share, handles maintenance and guest support, and lets an unhappy venue end the arrangement. Setup takes under five minutes once the location is ready. New York launches first, with Boston partnerships in development. These are founder statements, not measured results.

**Unknown:** paid demand, electricity use, exact station size, launch dates, service hours, how the share is calculated and paid, and exit logistics. Leave these out or label them clearly. Never fill gaps with reassuring guesses.

**Working hypotheses** (to test with owners, not assert):
- The everyday trigger is a guest asking "Can I charge my phone here?" Each answer an owner can give today costs them something: the guest leaves, staff get pulled away, or a table gets stuck by an outlet.
- A key objection is "Will this become another thing my team has to manage?"
- Many venues care about table turnover. A portable charger helps here, because nobody needs to sit by an outlet. Never promise longer stays.

Industry context: the [National Restaurant Association's 2025 operations release](https://restaurant.org/research-and-media/media/press-releases/new-resource-from-national-restaurant-association-provides-insights-into-operational-realities/) describes cost pressure and modest margins across more than 900 restaurants. That's a reason to respect operating costs, not proof of demand for Charj.

## The homepage order, and why

| Step | Question in the owner's mind | Website answer |
| --- | --- | --- |
| 01 Hook | What is this, and what's in it for me? | "Guests rent a phone charger. Your business gets paid." No equipment cost, we handle everything; already everyday in China and Europe, so be one of the first in New York. |
| 02 Problem | Do I actually have this problem? | The guest asks "Can I charge my phone here?" Today's three answers are crossed out with their cost (They leave · Staff pulled away · Table stuck), then Charj answers "Of course." |
| 03 How it works | How does it work, and what does it earn? | Four steps (we install it → guests scan & rent → they charge at the table → you earn), then the "See it add up" calculator. |
| 04 Request | What do I do next? | "Request a station. We'll be right there." A short form. Questions go to the FAQ at `/help`. |

Each section answers one question and points to the same action. No repetition: the share percentage appears once, on the calculator receipt. Detailed numbers (benchmarks, cost-of-the-problem maths) belong in conversations; see [sales talking points](../business/sales-talking-points.md).

## Persuasion, used responsibly

- **Easy to understand:** show the real station and charger, and say plainly who does what.
- **A small first step:** "Request a station" starts a conversation, not a contract. Exit flexibility is stated without promising "cancel instantly" or "free".
- **Progressive disclosure:** key facts stay visible; the FAQ holds the detail, without hiding real costs or terms ([NN/g](https://www.nngroup.com/articles/progressive-disclosure/)).
- **Honest evidence:** no invented partners, station counts, reviews or user statistics. Cite any outside figure, and replace it with Charj's own data when available.
- **Honest economics:** the calculator's default of 15 rentals/day × $2 × 30 days × 20% = $180/month is an example, not a forecast. No guaranteed income, foot traffic or electricity savings.
- **Operational fit:** never promise that guests stay longer.

## Electricity FAQ

Current safe copy: "Running costs depend on charger usage, the station model, its screen and your electricity rate. We're verifying power consumption for the final model, so a measured monthly cost estimate is not yet available."

To replace it with a real estimate: measure whole-station kWh across representative days, including idle time, the screen and battery recharging. Then average daily kWh × operating days × local energy rate gives the energy charge. Commercial tariffs may add demand or fixed charges. The charger's advertised 22.5W output is not the station's average consumption. See [DOE: measuring varying power consumption](https://www.energy.gov/cmei/femp/measuring-standby-power).

## Validate with owners

Show a few NYC and Boston owners the first screen without explaining it, and ask: "What does Charj do? What would your business need to do? What would stop you from trying it?" Note confusion and objections before changing the offer.

Measure qualified conversations, actual placements and whether venues keep the station after the pilot, not just clicks. Keep interest from friends and family separate from organic demand. Use pilot results only with dates, venue context and permission.
