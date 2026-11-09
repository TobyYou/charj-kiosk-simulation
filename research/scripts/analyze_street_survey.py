#!/usr/bin/env python3
"""Analyse the Charj street battery survey and turn it into simulator inputs.

Usage:
    python3 -I research/scripts/analyze_street_survey.py <survey.csv> [--out research/survey/results]

Input: the CSV exported from the survey form (one row per response or refusal, see
research/survey/STREET_SURVEY_PLAN.md). Standard library only.
Outputs: summary.md (human-readable, with 95% intervals) and suggested_params.json.
"""
import csv, json, math, os, random, sys
from collections import Counter, defaultdict

Z = 1.959964
INTENT_W = {"definitely": 0.75, "probably": 0.25, "not_sure": 0.05, "probably_not": 0.0, "definitely_not": 0.0}  # ASSUMPTION
C_BAND = (5.9e-5, 3.6e-4, 3.9e-4)  # calibrated conversion c (low, default, high), research P055
BLOCKS = {"A": "08–10 weekday", "B": "midday", "C": "17–19 weekday", "D": "21–23 night"}
OLD_PHONES = {"iphone_11_or_older", "iphone_12", "iphone_13", "android_old"}  # ≥3 years old in Nov 2026


def wilson(k, n):
    if n == 0:
        return (float("nan"),) * 3
    p = k / n
    d = 1 + Z * Z / n
    c = (p + Z * Z / (2 * n)) / d
    h = Z * math.sqrt(p * (1 - p) / n + Z * Z / (4 * n * n)) / d
    return p, max(0.0, c - h), min(1.0, c + h)


def fmt_p(t):
    p, lo, hi = t
    return "n/a" if math.isnan(p) else f"{p*100:.1f}% ({lo*100:.1f}–{hi*100:.1f}%)"


def mean(xs):
    return sum(xs) / len(xs) if xs else float("nan")


def bootstrap_diff(a, b, reps=2000, seed=7):
    if len(a) < 5 or len(b) < 5:
        return float("nan"), float("nan"), float("nan")
    rng = random.Random(seed)
    ds = []
    for _ in range(reps):
        ra = [a[rng.randrange(len(a))] for _ in a]
        rb = [b[rng.randrange(len(b))] for _ in b]
        ds.append(mean(ra) - mean(rb))
    ds.sort()
    return mean(a) - mean(b), ds[int(0.025 * reps)], ds[int(0.975 * reps)]


def load(path):
    with open(path, newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    resp, refusals = [], []
    for r in rows:
        if r.get("kind") == "refusal":
            refusals.append(r)
            continue
        if r.get("pilot") in ("1", "true", "True"):
            continue
        try:
            r["battery"] = float(r["battery_pct"])
        except (TypeError, ValueError):
            continue
        if not (0 <= r["battery"] <= 100):
            continue
        r["seen"] = r.get("battery_seen") in ("1", "true", "True")
        resp.append(r)
    return resp, refusals


def share_low(rows, thr=20):
    return wilson(sum(1 for r in rows if r["battery"] < thr), len(rows))


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    path = sys.argv[1]
    out = sys.argv[sys.argv.index("--out") + 1] if "--out" in sys.argv else "research/survey/results"
    os.makedirs(out, exist_ok=True)
    resp, refusals = load(path)
    n = len(resp)
    if n == 0:
        print("No usable responses.")
        sys.exit(1)

    L = []  # markdown lines
    L.append("# Charj street battery survey: results\n")
    L.append(f"Source file: `{os.path.basename(path)}` · completed interviews **{n}** · refusals logged **{len(refusals)}** · "
             f"response rate **{n / (n + len(refusals)) * 100:.0f}%**" if refusals else
             f"Source file: `{os.path.basename(path)}` · completed interviews **{n}** · refusals not logged (response rate unknown)")
    seen = [r for r in resp if r["seen"]]
    L.append(f"\nBattery read off the screen in {len(seen)} of {n} ({len(seen)/n*100:.0f}%). Low-battery shares are shown for all responses and for screen-verified ones.\n")

    # 1. Low battery by block / site
    L.append("## 1. Share of phones below 20% (95% Wilson interval)\n")
    L.append("| Group | n | < 10% | < 20% | < 30% | < 20% (screen-verified) |\n|---|---|---|---|---|---|")
    def row(label, rs):
        v = [r for r in rs if r["seen"]]
        L.append(f"| {label} | {len(rs)} | {fmt_p(share_low(rs,10))} | {fmt_p(share_low(rs,20))} | {fmt_p(share_low(rs,30))} | {fmt_p(share_low(v,20))} |")
    row("**All**", resp)
    by_block = defaultdict(list)
    for r in resp:
        by_block[r.get("block", "?")].append(r)
    for b in sorted(by_block):
        row(f"Block {b} ({BLOCKS.get(b, '?')})", by_block[b])
    by_site = defaultdict(list)
    for r in resp:
        by_site[r.get("site", "?")].append(r)
    for s in sorted(by_site):
        row(f"Site {s}", by_site[s])
    evening = by_block.get("C", []) + by_block.get("D", [])
    p_low = share_low(evening, 20) if evening else share_low(resp, 20)

    # 2. p_seek
    low = [r for r in resp if r["battery"] < 20]
    no_opt = [r for r in low if r.get("carry") == "neither" and r.get("next_charge") in ("1-3h", "3h+")]
    no_pb = [r for r in low if r.get("carry") != "powerbank"]
    p_seek_low = wilson(len(no_opt), len(low))
    all_no_opt = [r for r in resp if r.get("carry") == "neither" and r.get("next_charge") in ("1-3h", "3h+")]
    p_seek_all = wilson(len(all_no_opt), n)
    # Use the pooled estimate unless the low-battery group clearly differs (non-overlapping intervals),
    # because only ~10% of respondents are below 20% and that subgroup is small.
    differs = len(low) >= 20 and (p_seek_low[2] < p_seek_all[1] or p_seek_low[1] > p_seek_all[2])
    p_seek = p_seek_low if differs else p_seek_all
    L.append("\n## 2. Without a charging option (no power bank, no cable, no chance to charge within 60 min)\n")
    L.append(f"- Among low-battery people (< 20%): **{fmt_p(p_seek_low)}** (n={len(low)})")
    L.append(f"- Among everyone: **{fmt_p(p_seek_all)}** (n={n})")
    L.append(f"- Used for `p_seek`: **{'low-battery group (it differs significantly)' if differs else 'pooled estimate (low-battery group not significantly different; much tighter interval)'}**")
    L.append(f"- No power bank, any cable/timing (loose upper bound): {fmt_p(wilson(len(no_pb), len(low)))}")
    carry_all = Counter(r.get("carry", "?") for r in resp)
    L.append(f"- Everyone: carrying power bank {carry_all['powerbank']}, cable only {carry_all['cable']}, neither {carry_all['neither']}")

    # 3. Intent by arm
    L.append("\n## 3. Stated intent to rent right now, by randomised offer\n")
    L.append("Expected rental probability = Definitely×0.75 + Probably×0.25 + Not sure×0.05 (stated-intent discount weights are an **ASSUMPTION**).\n")
    L.append("| Offer arm | n | Definitely | Probably | Expected P(rent) | Expected P(rent), battery < 20% only |\n|---|---|---|---|---|---|")
    arms = defaultdict(list)
    for r in resp:
        arms[(r.get("arm_price", "?"), r.get("arm_hold", "?"))].append(r)
    exp_by_arm = {}
    for (pr, hd), rs in sorted(arms.items()):
        c = Counter(r.get("intent") for r in rs)
        e = mean([INTENT_W.get(r.get("intent"), 0) for r in rs])
        el = mean([INTENT_W.get(r.get("intent"), 0) for r in rs if r["battery"] < 20])
        exp_by_arm[(pr, hd)] = e
        L.append(f"| ${pr}/hr, hold ${hd} | {len(rs)} | {c['definitely']} | {c['probably']} | {e*100:.1f}% | {'n/a' if math.isnan(el) else f'{el*100:.1f}%'} |")
    def arm_mean(price):
        rs = [INTENT_W.get(r.get("intent"), 0) for r in resp if r.get("arm_price") == price]
        return mean(rs), len(rs)
    e1, n1 = arm_mean("1")
    e2, n2 = arm_mean("2")
    wtp_note = "insufficient data"
    wtp_mid = None
    if n1 >= 30 and n2 >= 30 and e1 > 0 and e2 > 0 and e1 != e2:
        # Fit the simulator's logistic P = 1/(1+exp(2(price - WTP))) through the two arms (relative to $1 arm).
        ratio = e2 / e1
        if 0 < ratio < 1:
            # Solve 1/(1+exp(2(2-w))) / (1/(1+exp(2(1-w)))) = ratio numerically.
            lo, hi = 0.0, 20.0
            f = lambda w: (1 / (1 + math.exp(2 * (2 - w)))) / (1 / (1 + math.exp(2 * (1 - w)))) - ratio
            if f(lo) * f(hi) < 0:
                for _ in range(80):
                    mid = (lo + hi) / 2
                    if f(lo) * f(mid) <= 0:
                        hi = mid
                    else:
                        lo = mid
                wtp_mid = round((lo + hi) / 2, 2)
                wtp_note = f"$2 arm keeps {ratio*100:.0f}% of the $1 arm's intent → logistic midpoint ≈ ${wtp_mid}/hr"
        else:
            wtp_note = f"$2 arm intent ≥ $1 arm (ratio {ratio:.2f}): no price sensitivity detected at this sample size"
    L.append(f"\nPrice sensitivity: {wtp_note}.")
    h30 = mean([INTENT_W.get(r.get("intent"), 0) for r in resp if r.get("arm_hold") == "30"])
    h0 = mean([INTENT_W.get(r.get("intent"), 0) for r in resp if r.get("arm_hold") == "0"])
    if not (math.isnan(h30) or math.isnan(h0)):
        L.append(f"Deposit effect: expected P(rent) with $30 hold {h30*100:.1f}% vs no hold {h0*100:.1f}%.")

    # 4. Awareness
    used = wilson(sum(1 for r in resp if r.get("used_before") == "Y"), n)
    heard = wilson(sum(1 for r in resp if r.get("heard_charj") == "Y"), n)
    L.append("\n## 4. Awareness and the conversion funnel\n")
    L.append(f"- Ever used a rental power bank: {fmt_p(used)}")
    L.append(f"- Heard of Charj: {fmt_p(heard)}")
    implied = {}
    if not math.isnan(p_low[0]) and not math.isnan(p_seek[0]) and p_low[0] * p_seek[0] > 0:
        for name, c in zip(("low", "default", "high"), C_BAND):
            implied[name] = c / (p_low[0] * p_seek[0])
        L.append(f"- Implied p_aware = c ÷ (p_low × p_seek) = {implied['low']*100:.2f}% / {implied['default']*100:.2f}% / {implied['high']*100:.2f}% "
                 f"for c = {C_BAND[0]:.1e} / {C_BAND[1]:.1e} / {C_BAND[2]:.1e}.")
        L.append(f"  Compare with measured 'heard of Charj' {heard[0]*100:.1f}%. If they disagree by more than about 3×, the calibration band or the funnel structure needs revisiting.")

    # 5. Subway drop
    L.append("\n## 5. Subway: exiting vs entering\n")
    L.append("| Station | Block | n IN | n OUT | Mean battery OUT − IN (95% bootstrap) | < 20% IN | < 20% OUT |\n|---|---|---|---|---|---|---|")
    subway_drop = {}
    for st in ("S116", "S110", "S96"):
        for b in sorted(BLOCKS):
            ins = [r["battery"] for r in resp if r.get("site") == st and r.get("block") == b and r.get("direction") == "IN"]
            outs = [r["battery"] for r in resp if r.get("site") == st and r.get("block") == b and r.get("direction") == "OUT"]
            if len(ins) + len(outs) == 0:
                continue
            d, lo, hi = bootstrap_diff(outs, ins)
            subway_drop[f"{st}_{b}"] = d
            ds = "n/a (need ≥5 each)" if math.isnan(d) else f"{d:+.1f} pts ({lo:+.1f} to {hi:+.1f})"
            L.append(f"| {st} | {b} | {len(ins)} | {len(outs)} | {ds} | {fmt_p(wilson(sum(x < 20 for x in ins), len(ins)))} | {fmt_p(wilson(sum(x < 20 for x in outs), len(outs)))} |")

    L.append("\n**Pooled across blocks** (IN/OUT are interviewed at the same spot and times, so pooling is fair):\n")
    L.append("| Station | n IN | n OUT | Mean battery OUT − IN (95% bootstrap) |\n|---|---|---|---|")
    for st in ("S116", "S110", "S96"):
        ins = [r["battery"] for r in resp if r.get("site") == st and r.get("direction") == "IN"]
        outs = [r["battery"] for r in resp if r.get("site") == st and r.get("direction") == "OUT"]
        if not ins and not outs:
            continue
        d, lo, hi = bootstrap_diff(outs, ins)
        if not math.isnan(d):
            subway_drop[f"{st}_pooled"] = d
        L.append(f"| {st} | {len(ins)} | {len(outs)} | {'n/a' if math.isnan(d) else f'{d:+.1f} pts ({lo:+.1f} to {hi:+.1f})'} |")
    L.append("\nNote: a block mix that differs between IN and OUT (e.g. more OUT interviews in the evening) biases the pooled number. Check the per-block table.")

    # 6. Hold / return behaviour
    L.append("\n## 6. Hold time and return geography (proxies)\n")
    nc = Counter(r.get("next_charge") for r in resp)
    hd = Counter(r.get("heading") for r in resp)
    L.append("- Next chance to charge: " + ", ".join(f"{k} {v} ({v/n*100:.0f}%)" for k, v in nc.most_common()))
    L.append("- Heading next: " + ", ".join(f"{k} {v} ({v/n*100:.0f}%)" for k, v in hd.most_common()))
    p_outside = wilson(hd.get("out_of_area", 0), n)
    L.append(f"- Leaving the neighbourhood (→ `pOutside`): {fmt_p(p_outside)}")

    # 7. Phones and anxiety
    old = wilson(sum(1 for r in resp if r.get("phone") in OLD_PHONES), sum(1 for r in resp if r.get("phone") not in ("", "unknown", None)))
    worry = [float(r["worry_pct"]) for r in resp if r.get("worry_pct") not in ("", None)]
    worry.sort()
    L.append("\n## 7. Phones and battery anxiety\n")
    L.append(f"- Phones ≥ 3 years old: {fmt_p(old)}")
    if worry:
        L.append(f"- 'Start to worry' at: median {worry[len(worry)//2]:.0f}% (IQR {worry[len(worry)//4]:.0f}–{worry[3*len(worry)//4]:.0f}%), n={len(worry)}")

    # Response-rate bias check
    if refusals:
        L.append("\n## 8. Response rates (bias check)\n")
        L.append("| Site | Block | completed | refused | rate |\n|---|---|---|---|---|")
        comp = Counter((r.get("site"), r.get("block")) for r in resp)
        ref = Counter((r.get("site"), r.get("block")) for r in refusals)
        for key in sorted(set(comp) | set(ref)):
            c, f_ = comp[key], ref[key]
            L.append(f"| {key[0]} | {key[1]} | {c} | {f_} | {c/(c+f_)*100:.0f}% |")

    # Suggested params
    blocks_low = {b: share_low(rs, 20)[0] for b, rs in by_block.items() if rs}
    peak = max(blocks_low.values()) if blocks_low else float("nan")
    suggested = {
        "_source": f"Charj street survey, n={n}, file {os.path.basename(path)}",
        "p_low_peak": {"value": round(p_low[0], 4), "low": round(p_low[1], 4), "high": round(p_low[2], 4), "conf": "HIGH" if len(evening) >= 200 else "MED"},
        "low_battery_block_ratio": {b: round(v / peak, 3) for b, v in blocks_low.items()} if peak and not math.isnan(peak) and peak > 0 else {},
        "p_seek": {"value": round(p_seek[0], 4), "low": round(p_seek[1], 4), "high": round(p_seek[2], 4), "conf": "MED", "basis": "low-battery group" if differs else "pooled (all respondents)"},
        "wtp_mid_hourly": {"value": wtp_mid, "conf": "MED (stated preference)" if wtp_mid else None, "note": wtp_note},
        "p_aware_implied": {k: round(v, 5) for k, v in implied.items()},
        "heard_of_charj": round(heard[0], 4),
        "old_phone_share": {"value": round(old[0], 4), "low": round(old[1], 4), "high": round(old[2], 4)},
        "p_outside": {"value": round(p_outside[0], 4), "low": round(p_outside[1], 4), "high": round(p_outside[2], 4)},
        "subway_drop_pts": {k: round(v, 2) for k, v in subway_drop.items() if not math.isnan(v)},
    }
    L.append("\n## Suggested simulator updates\n")
    L.append("Copy into `simulator/js/params.js` and `research/PARAMETERS.md` with source *Charj street survey*. Then rerun `node simulator/cli.mjs 50 normal all` and `research/scripts/calibrate_conversion.mjs`.\n")
    L.append("```json\n" + json.dumps(suggested, indent=2, ensure_ascii=False) + "\n```")

    with open(os.path.join(out, "summary.md"), "w", encoding="utf-8") as f:
        f.write("\n".join(L) + "\n")
    with open(os.path.join(out, "suggested_params.json"), "w", encoding="utf-8") as f:
        json.dump(suggested, f, indent=2, ensure_ascii=False)
    print(f"Wrote {out}/summary.md and suggested_params.json  (n={n}, evening n={len(evening)}, p_low={p_low[0]:.3f}, p_seek={p_seek[0]:.3f})")


if __name__ == "__main__":
    main()
