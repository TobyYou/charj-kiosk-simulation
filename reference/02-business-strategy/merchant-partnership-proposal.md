# Charj — Merchant Partnership Proposal / 商户合作方案

**B02 · Updated September 29, 2026.** The founder has selected **20% rental revenue share**, now reflected in the local website. Only the percentage is approved; calculation basis, payout timing, fee allocation and other proposed financial terms below still need confirmation. The earlier 25% founding incentive is withdrawn. This is not a contract or a live payout implementation.

## Recommendation: a useful guest amenity, with a simple share

Use a **20% venue share**. The proposed calculation basis is eligible rental revenue before payment-processing expenses, but the founder has not yet approved that basis. NYC launches first, while Boston venue partnerships develop in parallel. Do not advertise a separate founding rate or an approved trial duration.

The commercial story is: guests get portable power, the venue receives a useful amenity and rental income, and Charj runs the service. Do not pitch this as a large passive-income stream or guaranteed foot traffic. For many venues, longer dwell time is not desirable: guest convenience is a better lead, and the portable charger means nobody needs to hold an outlet seat.

## Current examples and what to borrow

Official provider pages checked September 28, 2026. These are advertised models, not independently audited performance or industry-average rates.

| Example | Advertised structure | Useful lesson for Charj |
| --- | --- | --- |
| [ChargerGoGo: free station](https://www.chargergogo.com/request-a-free-station) | No purchase price or monthly fee for hosts, rental revenue share, transaction tracking; this page does not state the percentage. | Make equipment access and earnings easy to explain; do not borrow its growth claims. |
| [Joos: hospitality](https://joospower.com/hospitality/) | Guest-paid rental with venue revenue share, or venue-funded charging free to guests; maintenance and customer support are managed by Joos. | Lead with hospitality and managed service. Guest-paid fits Charj's current plan; venue-funded can wait. |
| [full.bar](https://full.bar/) | Advertises 33% to venues, 37% to placement operators and 30% to the network, based on net revenue after stated costs. Its page describes a DMV launch. | A published percentage needs a clear denominator. Its 33% net is not directly comparable to Charj's approved 20% with calculation basis still to confirm, nor proof of proven NYC demand. |

**The founder selected 20%; it is not a rate established by these examples.** Charj still needs to review equipment, payment fees, local servicing and battery replacement costs before agreeing the full economics. ChargerGoGo's separate [host FAQ](https://www.chargergogo.com/help-category/business) advertises a 30% venue share; do not describe Charj's 20% as market-leading without comparing terms.

## Suggested term sheet

| Item | Proposed rule |
| --- | --- |
| Hardware | Charj retains ownership and supplies the station for use at the venue, without a purchase fee. |
| Venue fees | Propose no installation or recurring service fee during the pilot, subject to founder confirmation. The venue provides agreed counter space and power; connectivity is confirmed per site. Do not say literally zero cost before B01/B03 are resolved. |
| Revenue share | 20%, founder-confirmed. No 25% founding incentive. |
| Eligible revenue | Actual collected hourly rental charges, after discounts and rental-fee refunds or reversals, excluding sales tax, deposits and replacement/non-return charges. Processing, servicing and hardware costs are not deducted from the merchant's calculation base. |
| Attribution | Credit the venue where the rental began, using its station ID. A return to a different location does not create a second commission or transfer the original commission. No bonus for return-only events initially. |
| Settlement | Propose a monthly statement and payment by the 15th of the following month, via an agreed bank-payment method. No minimum payout for the pilot. Confirm payout fees and finance capacity before committing. |
| Later refunds/disputes | Show the related rental ID and adjustment on the next statement. Restore eligible revenue if a dispute is resolved in Charj's favor. Reconcile any balance at exit; Charj absorbs processor dispute fees rather than passing them to the venue. |
| Rental timing | Proposed: include settled rental revenue in the statement month when collected. Record the applicable rate at rental start. |
| Service | Confirmed: Charj handles maintenance and email/phone support, with in-person help when needed. Exact public phone number, service hours and response times remain unconfirmed. |
| Setup | Confirmed: less than five minutes once the agreed counter location is ready; not a promise about delivery or end-to-end activation time. Exact dimensions and power/connectivity requirements pending. |
| Trial and exit | Confirmed: a venue can end the arrangement if not satisfied. Trial duration, notice, collection and exclusivity remain to agree. Do not imply a refund guarantee or an immediate penalty-free exit. |
| Minimum earnings | None. No rental volume, additional sales, navigation traffic or income guarantees. |

No live agreement, bank transfer, database change or payout automation has been created. Before use, review the final terms with appropriate business/legal/accounting advisers, including taxes and reporting. This document is a commercial design, not a legal agreement.

## Why exclude the $30 deposit?

The founder has confirmed **$30 is the deposit, not an all-in rental cap**. An authorization is not collected rental income. Returned deposits do not belong in the split, and non-return charges should support loss recovery rather than incentivize retained chargers. Final overdue policy remains separate from B02.

## Illustrative merchant income — not a forecast

Assumptions: 30 operating days, **$2 collected eligible rental fee per rental**, no reversals, and the proposed calculation basis. There is no evidence yet that a Charj location achieves any of these volumes.

| Rentals/day | Monthly eligible rental revenue | Venue share, 20% |
| ---: | ---: | ---: |
| 1 | $60 | $12 |
| 2 | $120 | $24 |
| 5 | $300 | $60 |
| 10 | $600 | $120 |

The realistic takeaway: at low utilization this is a modest extra, not a rent payment. The venue's main reason to host should be a valuable, professionally managed guest service. The website's calculator is labelled as an illustration; keep benchmarks and detailed income discussion for sales conversations ([talking points](sales-talking-points.md)).

## Check Charj's margin before approving the offer

For an illustration, [Stripe's published US standard domestic online card rate](https://stripe.com/pricing) is 2.9% + $0.30 per successful transaction. Actual account terms, international cards and additional products can change costs. Assume **one successful rental-fee charge** below, with no captured deposit, tax, refund or other fee.

| Collected rental fee | Assumed processor cost | Venue at 20% | Charj remainder before other costs |
| ---: | ---: | ---: | ---: |
| $2.00 | $0.36 | $0.40 | $1.24 |
| $4.00 | $0.42 | $0.80 | $2.78 |

Rounded to cents for illustration; these are not profit figures. Station amortization, delivery, connectivity, replacement batteries, field servicing, support, refunds, disputes and payout costs still come out of Charj's remainder. Existing code can use supplemental rental charges, so the single-charge assumption must be checked against actual settlement records; multiple successful charges may add fixed fees. The current billing implementation still uses $1/hour, not the planned $2.

Useful internal calculation:

`monthly contribution = eligible rental revenue − venue share − actual processing/payout fees − connectivity − service/support − unrecovered losses − allocated equipment cost`

If a location is unprofitable, improve placement and operating efficiency or reconsider the location. Do not change an agreed commission retroactively.

## A creative incentive that does not need new software

Use the founding-partner identity as a real launch collaboration, not artificial scarcity:

1. The founder-selected 20% rental share, with clear financial terms to agree.
2. A verified venue listing when its station is actually operational.
3. A short monthly statement showing rentals, eligible revenue and the venue's share.
4. A day-60 placement review: keep, reposition, or coordinate collection based on usage and fit.

Propose starting with 5–10 nearby pilot venues to learn servicing patterns, not a fabricated public claim that only a few places remain. Use a simple spreadsheet/export for statements at first; do not promise a host dashboard that has not been built. Later, assess guest charging vouchers or co-marketing only if costs, software support and merchant demand justify them. No referral commissions or ad-revenue guarantees in the first offer.

## Revenue-share disclosure — approve before publishing

**Participating venues receive 20% of eligible rental revenue.**

Supporting disclosure: Eligible revenue means collected rental fees after discounts, refunds and reversals, excluding tax, deposits and replacement charges. Attribution is to the pickup location; Charj covers processing costs from its share. No guaranteed earnings. Monthly settlement and all other terms must match the actual agreement.

## Needed before approval

- [ ] B01: installation, delivery, ongoing service fees and who supplies power/connectivity.
- [ ] Landed cost of one station with chargers, spare charger cost, monthly connectivity, and expected local servicing cost.
- [ ] Actual processing and payout arrangement; whether billing produces more than one successful fee charge.
- [x] Select revenue share: 20%.
- [ ] Approve the calculation basis, fee allocation, payout schedule and exit logistics; do not infer approval from the percentage alone.
- [ ] Confirm the contact channel and team capacity for direct customer support; do not invent service hours.
- [ ] Review actual rental volume, average collected fee, refunds and losses during the pilot before expanding.

Related: [sales talking points](sales-talking-points.md) · [before launch](../website/unfinished-work.md) · [asset checklist](../website/asset-checklist.md) · [README](../../README.md)
