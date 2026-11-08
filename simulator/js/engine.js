// Charj network digital twin: discrete-time (1-minute) stochastic simulation.
// Pure logic, no DOM, so the same code runs the live map, the Monte Carlo worker and the Node CLI.
//
// Demand model (non-homogeneous Poisson):
//   λ_z(t) = footfall_z × hourShare_z(h) / 60 × p_aware × p_low(h) × p_seek × scenario
// Each arrival is a low-battery person who knows Charj and has no charger of their own. They look for
// a station within `search_radius_m`; rent if a charged pack is available and they accept the price.

import { RNG } from './rng.js';
import { ZONES, SITES, PERSONA_MIX, DWELL, walkDist } from './geo.js';
import { PROFILES, LOW_BATTERY_CURVE, SCENARIOS, paramValues } from './params.js';

const WALK_M_PER_MIN = 75;   // ≈1.25 m/s
const DAY = 1440;
const PERSONAS = ['student', 'worker', 'resident', 'visitor'];

export class Simulation {
  /**
   * @param {object} cfg
   *  - params: overrides of parameter values
   *  - siteIds: ids of SITES with a station
   *  - siteConfig: optional { [siteId]: { slots, packs } }
   *  - scenario: key of SCENARIOS
   *  - days: number of days (default 7, starting Monday)
   *  - seed
   *  - routeAware: return-routing feature on (recommend a station on the way)
   *  - rebalance: nightly rebalancing on
   *  - onEvent: optional callback(evt) for the live feed
   */
  constructor(cfg = {}) {
    this.P = paramValues(cfg.params || {});
    this.scenario = SCENARIOS[cfg.scenario || 'normal'];
    this.scenarioKey = cfg.scenario || 'normal';
    this.days = cfg.days ?? 7;
    // Separate streams: customers (arrivals + who they are) vs. everything else, so two layouts
    // run with the same seed face exactly the same customers (common random numbers).
    this.rng = new RNG((cfg.seed ?? 1) * 7919 + 17);
    this.rngA = new RNG(cfg.seed ?? 1);
    this.routeAware = !!cfg.routeAware;
    this.rebalance = cfg.rebalance ?? true;
    this.onEvent = cfg.onEvent || null;
    this.t = 0;

    const siteIds = cfg.siteIds || SITES.filter(s => s.live).map(s => s.id);
    this.kiosks = siteIds.map(id => {
      const s = SITES.find(x => x.id === id);
      const sc = (cfg.siteConfig && cfg.siteConfig[id]) || {};
      const slots = sc.slots ?? this.P.slots_per_kiosk;
      const nPacks = Math.min(slots, sc.packs ?? this.P.packs_per_kiosk);
      const packs = [];
      for (let i = 0; i < nPacks; i++) packs.push({ id: `${id}-${i}`, soc: 100 });
      return { ...s, slots, packs, rentals: 0, returns: 0, unmetEmpty: 0, failedReturns: 0, revenue: 0 };
    });

    // Precompute which stations each zone can reach, sorted by walking distance.
    this.zoneKiosks = {};
    for (const z of ZONES) {
      this.zoneKiosks[z.id] = this.kiosks
        .map(k => ({ k, d: walkDist(z, k) }))
        .sort((a, b) => a.d - b.d);
    }
    this.zoneById = Object.fromEntries(ZONES.map(z => [z.id, z]));

    this.active = [];   // rentals in progress
    this.pending = [];  // scheduled future events: { t, fn }
    this.lostPacks = 0;
    this.m = this._emptyMetrics();
  }

  _emptyMetrics() {
    const H = this.days * 24;
    return {
      candidates: 0, rentals: 0, unmetNoKiosk: 0, unmetEmpty: 0, declinedPrice: 0,
      returns: 0, failedReturnAttempts: 0, csTickets: 0, forfeits: 0, lost: 0,
      rentalRevenue: 0, forfeitRevenue: 0, cardFees: 0, hostShare: 0, csCost: 0,
      rebalanceCost: 0, lossCost: 0, rebalanceStops: 0,
      packMinutesOut: 0, packMinutesTotal: 0,
      durations: [],
      hourly: Array.from({ length: H }, () => ({ rentals: 0, unmet: 0, failed: 0, out: 0, avail: 0 })),
      unmetByZone: Object.fromEntries(ZONES.map(z => [z.id, 0])),
      rentalsByZone: Object.fromEntries(ZONES.map(z => [z.id, 0])),
    };
  }

  // ── helpers ──
  dayIndex(t = this.t) { return Math.floor(t / DAY); }
  isWeekend(t = this.t) { const d = this.dayIndex(t) % 7; return d === 5 || d === 6; }
  hour(t = this.t) { return Math.floor((t % DAY) / 60); }
  schedule(t, fn) { this.pending.push({ t, fn }); }
  emit(type, data) { if (this.onEvent) this.onEvent({ type, t: this.t, ...data }); }

  outageActive(t = this.t) {
    const o = this.scenario.outage;
    if (!o) return false;
    const d = this.dayIndex(t), m = t % DAY;
    return d === o.day && m >= o.startMin && m < o.endMin;
  }

  zoneRate(z, t) {
    const h = this.hour(t);
    const wk = this.isWeekend(t) ? 'weekend' : 'weekday';
    const prof = PROFILES[wk][z.profile];
    const share = prof[h] / prof.reduce((a, b) => a + b, 0);
    let foot = this.P[z.footfallKey] * share;
    const sc = this.scenario;
    if (z.type === 'campus') {
      if (sc.campusMult) foot *= sc.campusMult;
      if (sc.lateNightCampusMult && (h >= 22 || h < 3)) foot *= sc.lateNightCampusMult;
      if (wk === 'weekend') foot *= 0.6;
    } else if (sc.otherMult) foot *= sc.otherMult;
    if (wk === 'weekend' && z.weekendFactor) foot *= z.weekendFactor;

    let pLow = this.P.p_low_peak * LOW_BATTERY_CURVE[h] * (sc.lowMult || 1);
    let pSeek = this.P.p_seek;
    if (this.outageActive(t)) { pLow *= sc.outage.lowMult; pSeek = Math.min(1, pSeek * sc.outage.seekMult); }
    pLow = Math.min(0.9, pLow);
    return (foot / 60) * this.P.p_aware * pLow * pSeek;
  }

  // ── main loop ──
  step() {
    const t = this.t;
    const mod = t % DAY;

    // 1. Scheduled events due now
    if (this.pending.length) {
      const due = [];
      const keep = [];
      for (const e of this.pending) (e.t <= t ? due : keep).push(e);
      this.pending = keep;
      for (const e of due) e.fn();
    }

    // 2. New demand
    for (const z of ZONES) {
      let lam = this.zoneRate(z, t);
      const ev = this.scenario.event;
      if (ev && ev.zone === z.id && this.dayIndex(t) === ev.day && mod >= ev.startMin && mod < ev.startMin + ev.durMin) {
        const pLow = Math.min(0.9, this.P.p_low_peak * ev.lowMult);
        lam += (ev.people / ev.durMin) * this.P.p_aware * pLow * this.P.p_seek;
      }
      const n = this.rngA.poisson(lam);
      for (let i = 0; i < n; i++) this.newCandidate(z);
    }

    // 3. Station charging
    const outage = this.outageActive(t);
    const fastRate = 80 / (this.P.pack_recharge_h * 60);
    for (const k of this.kiosks) {
      if (!outage) {
        for (const p of k.packs) {
          if (p.soc < 100) p.soc = Math.min(100, p.soc + (p.soc < 80 ? fastRate : fastRate * 0.4));
        }
      }
    }

    // 4. Move active renters (for the map) and accumulate utilisation
    for (const r of this.active) this.updatePosition(r);
    let packsAtKiosks = 0, avail = 0;
    for (const k of this.kiosks) {
      packsAtKiosks += k.packs.length;
      for (const p of k.packs) if (p.soc >= this.P.rentable_min_soc) avail++;
    }
    const out = this.active.length;
    this.m.packMinutesOut += out;
    this.m.packMinutesTotal += out + packsAtKiosks;
    const hr = this.m.hourly[Math.floor(t / 60)];
    if (hr && mod % 60 === 59) { hr.out = out; hr.avail = avail; }

    // 5. Hourly overdue sweep (mirrors the app's hourly cron)
    if (mod % 60 === 0) this.overdueSweep();

    // 6. Nightly rebalancing at 04:00
    if (this.rebalance && mod === 4 * 60) this.doRebalance();

    this.t++;
  }

  run(untilT = this.days * DAY) { while (this.t < untilT) this.step(); return this; }
  get done() { return this.t >= this.days * DAY; }

  // ── demand ──
  newCandidate(z) {
    this.m.candidates++;
    const persona = this.rngA.pickWeighted(PERSONAS, PERSONAS.map(p => PERSONA_MIX[z.type][p]));
    const old = this.rngA.u() < this.P.old_phone_share;
    const soc = Math.max(1, Math.min(25, this.rngA.normal(13, 6)));
    const uPrice = this.rngA.u();
    // Every later random choice for this person is drawn now, from the customer stream.
    const U = [this.rngA.u(), this.rngA.u(), this.rngA.u(), this.rngA.u(), this.rngA.u(), this.rngA.u(), this.rngA.u()];
    const N = [this.rngA.normal(), this.rngA.normal()];
    const radius = this.P.search_radius_m * (soc < 8 ? 1.5 : 1);

    const options = this.zoneKiosks[z.id].filter(o => o.d <= radius);
    if (!options.length) {
      this.m.unmetNoKiosk++; this.m.unmetByZone[z.id]++;
      this._hourly('unmet');
      this.emit('unmet', { reason: 'no station nearby', zone: z.id });
      return;
    }
    let chosen = null, pack = null;
    for (const o of options) {
      const best = this.bestPack(o.k);
      if (best) { chosen = o; pack = best; break; }
    }
    if (!chosen) {
      options[0].k.unmetEmpty++;
      this.m.unmetEmpty++; this.m.unmetByZone[z.id]++;
      this._hourly('unmet');
      this.emit('unmet', { reason: 'station empty', zone: z.id, kiosk: options[0].k.id });
      return;
    }
    // Price acceptance: logistic around the willingness-to-pay midpoint.
    const pAccept = 1 / (1 + Math.exp(2.0 * (this.P.price_per_hour - this.P.wtp_mid_hourly)));
    if (uPrice >= pAccept) {
      this.m.declinedPrice++;
      this.emit('declined', { zone: z.id, kiosk: chosen.k.id });
      return;
    }
    this.startRental(z, chosen.k, pack, { persona, old, soc, U, N });
  }

  bestPack(k) {
    let best = null;
    for (const p of k.packs) if (p.soc >= this.P.rentable_min_soc && (!best || p.soc > best.soc)) best = p;
    return best;
  }

  startRental(z, k, pack, person) {
    k.packs.splice(k.packs.indexOf(pack), 1);
    k.rentals++;
    this.m.rentals++; this.m.rentalsByZone[z.id]++;
    this._hourly('rentals');

    // Where are they heading?
    const { U, N } = person;
    const goesOutside = U[0] < z.pOutside;
    let dest = null;
    if (!goesOutside) {
      const cands = ZONES.filter(x => x.id !== z.id);
      const w = cands.map(x => this.P[x.footfallKey] * Math.exp(-walkDist(z, x) / 900));
      const tot = w.reduce((a, b) => a + b, 0);
      let acc = 0; dest = cands[cands.length - 1];
      for (let i = 0; i < cands.length; i++) { acc += w[i]; if (U[1] * tot <= acc) { dest = cands[i]; break; } }
    }
    const travel = dest ? Math.max(3, walkDist(k, dest) / WALK_M_PER_MIN) : 15;
    const d = DWELL[person.persona];
    const dwell = d.median * Math.exp(d.sigma * N[0]);

    // Phone charging target and time.
    const target = 60 + 30 * U[2];
    const speed = (person.old ? this.P.old_phone_speed : 1) * (this.scenario.chargeMult || 1);
    const fast = Math.max(0, Math.min(80, target) - person.soc) / (this.P.phone_rate_fast * speed);
    const slow = Math.max(0, target - 80) / (this.P.phone_rate_slow * speed);
    const chargeMin = fast + slow;
    // Energy drawn from the pack, in pack-% (phone Wh / usable pack Wh).
    const packWh = (this.P.pack_mah / 1000) * 3.7 * this.P.pack_efficiency;
    const drawPct = ((target - person.soc) / 100) * this.P.phone_wh / packWh * 100;

    const r = {
      id: `${k.id}-${this.t}-${Math.floor(this.rng.u() * 1e6)}`,
      pack, from: k, origin: z, dest, persona: person.persona, old: person.old,
      socStart: person.soc, target, chargeMin, drawPct,
      t0: this.t, travel, dwell, outside: !dest, x: k.x, y: k.y, phase: 'travel',
      returnKiosk: null, forfeited: false, attempts: 0,
    };
    this.active.push(r);
    this.emit('rent', { kiosk: k.id, zone: z.id, persona: r.persona, soc: Math.round(person.soc) });

    // Decide when and where they will try to return it.
    // Many renters stay put (café, library, bar) and hand it back once charged, matching
    // comparables (Brick median ≈45 min; ChargeSPOT >60% returned within 1 h).
    if (U[3] < this.P.p_stay) {
      r.dest = z; r.travel = 1; r.outside = false; r.stay = true;
      this.schedule(this.t + chargeMin + 3 + 22 * U[4], () => this.tryReturn(r, k));
      return;
    }
    if (U[5] < this.P.p_forget) {
      const delay = (26 + 70 * U[6]) * 60;
      this.schedule(this.t + delay, () => this.tryReturn(r, this.nearest(r.origin, this.P.return_radius_m * 2)));
      return;
    }
    // Route-aware returns: recommend a station on the way once the phone is charged enough.
    if (this.routeAware && dest && chargeMin < travel) {
      const onRoute = this.kioskNearSegment(k, dest, 150);
      if (onRoute && onRoute !== k) {
        this.schedule(this.t + Math.max(chargeMin, travel * 0.6), () => this.tryReturn(r, onRoute));
        return;
      }
    }
    const tLeaveDest = this.t + travel + dwell;
    const nearDest = dest ? this.nearest(dest, this.P.return_radius_m) : null;
    if (nearDest) {
      this.schedule(Math.max(tLeaveDest, this.t + chargeMin), () => this.tryReturn(r, nearDest));
    } else {
      // No station where they're going: they hold it until they're back in the network.
      const delay = this.P.away_return_median_h * 60 * Math.exp(0.45 * N[1]);
      this.schedule(this.t + travel + delay, () => this.tryReturn(r, this.nearest(r.origin, this.P.return_radius_m * 2) || r.from));
    }
  }

  nearest(z, radius) {
    let best = null, bd = Infinity;
    for (const k of this.kiosks) {
      const d = walkDist(z, k);
      if (d <= radius && d < bd) { bd = d; best = k; }
    }
    return best;
  }

  kioskNearSegment(a, b, tol) {
    let best = null, bd = Infinity;
    const vx = b.x - a.x, vy = b.y - a.y, L2 = vx * vx + vy * vy || 1;
    for (const k of this.kiosks) {
      const u = Math.max(0, Math.min(1, ((k.x - a.x) * vx + (k.y - a.y) * vy) / L2));
      if (u < 0.3) continue;
      const px = a.x + u * vx, py = a.y + u * vy;
      const d = Math.hypot(k.x - px, k.y - py);
      if (d < tol && d < bd) { bd = d; best = k; }
    }
    return best;
  }

  tryReturn(r, k) {
    if (r.done) return;
    r.attempts++;
    const candidates = [k, ...this.kiosks.filter(x => x !== k).sort((a, b) => walkDist(k, a) - walkDist(k, b))]
      .filter(x => x && walkDist(k, x) <= this.P.return_radius_m);
    const target = candidates.find(x => x.packs.length < x.slots);
    if (!target) {
      this.m.failedReturnAttempts++;
      this._hourly('failed');
      if (r.attempts === 1) { this.m.csTickets++; this.m.csCost += this.P.cs_ticket_cost; }
      k.failedReturns++;
      this.emit('failedReturn', { kiosk: k.id });
      r.phase = 'waiting'; r.x = k.x; r.y = k.y;
      this.schedule(this.t + 60, () => this.tryReturn(r, k));
      return;
    }
    this.completeReturn(r, target);
  }

  completeReturn(r, k) {
    r.done = true;
    this.active.splice(this.active.indexOf(r), 1);
    // Pack state: drained by what it gave the phone (never below 0).
    r.pack.soc = Math.max(0, r.pack.soc - r.drawPct);
    k.packs.push(r.pack);
    k.returns++;
    this.m.returns++;
    const minutes = this.t - r.t0;
    this.m.durations.push(minutes);
    if (!r.forfeited) {
      const hours = Math.max(1, Math.ceil(minutes / 60));
      const fee = hours * this.P.price_per_hour;
      this.m.rentalRevenue += fee;
      this.m.cardFees += fee * this.P.stripe_pct + this.P.stripe_fixed;
      this.m.hostShare += fee * this.P.host_share;
      r.from.revenue += fee;
    }
    this.emit('return', { kiosk: k.id, minutes, forfeited: r.forfeited });
  }

  overdueSweep() {
    const cutoff = this.P.overdue_hours * 60;
    for (const r of [...this.active]) {
      if (!r.forfeited && this.t - r.t0 >= cutoff) {
        r.forfeited = true;
        this.m.forfeits++;
        this.m.forfeitRevenue += this.P.deposit;
        this.m.cardFees += this.P.deposit * this.P.stripe_pct + this.P.stripe_fixed;
        this.emit('forfeit', { kiosk: r.from.id });
        // Some packs come back later; the rest are lost and replaced.
        if (!this.rng.bernoulli(this.P.p_recover_after_forfeit)) {
          r.done = true;
          this.active.splice(this.active.indexOf(r), 1);
          this.m.lost++;
          this.m.lossCost += this.P.pack_replace_cost;
          // Replacement pack restocked at the origin station on the next rebalance.
          this.schedule(this.t + 12 * 60, () => {
            const k = r.from;
            if (k.packs.length < k.slots) k.packs.push({ id: `${k.id}-r${this.m.lost}`, soc: 100 });
          });
        }
      }
    }
  }

  doRebalance() {
    const target = this.P.packs_per_kiosk;
    const surplus = [], deficit = [];
    for (const k of this.kiosks) {
      const desired = Math.min(k.slots, target);
      if (k.packs.length > desired + 1) surplus.push(k);
      else if (k.packs.length < desired - 1) deficit.push(k);
    }
    if (!surplus.length || !deficit.length) return;
    const touched = new Set();
    for (const d of deficit) {
      for (const s of surplus) {
        while (d.packs.length < Math.min(d.slots, target) && s.packs.length > Math.min(s.slots, target)) {
          s.packs.sort((a, b) => b.soc - a.soc);
          d.packs.push(s.packs.shift());
          touched.add(s); touched.add(d);
        }
      }
    }
    this.m.rebalanceStops += touched.size;
    this.m.rebalanceCost += touched.size * this.P.rebalance_cost;
    if (touched.size) this.emit('rebalance', { stops: touched.size });
  }

  updatePosition(r) {
    if (r.phase === 'waiting') return;
    if (r.stay) { r.phase = 'dwell'; return; }
    const el = this.t - r.t0;
    if (r.outside) {
      // Walk to the origin zone (usually a subway entrance), then leave the area.
      const f = Math.min(1, el / r.travel);
      r.x = r.from.x + (r.origin.x - r.from.x) * f;
      r.y = r.from.y + (r.origin.y - r.from.y) * f;
      r.phase = f < 1 ? 'travel' : 'away';
      return;
    }
    const f = Math.min(1, el / r.travel);
    r.x = r.from.x + (r.dest.x - r.from.x) * f;
    r.y = r.from.y + (r.dest.y - r.from.y) * f;
    r.phase = f < 1 ? 'travel' : 'dwell';
  }

  phoneSoc(r) {
    const el = this.t - r.t0;
    if (el >= r.chargeMin) return r.target;
    return r.socStart + (r.target - r.socStart) * (el / Math.max(1, r.chargeMin));
  }

  _hourly(key) {
    const h = this.m.hourly[Math.floor(this.t / 60)];
    if (h) h[key]++;
  }

  // ── results ──
  // elapsedDays lets the live view report week-to-date figures.
  summary(elapsedDays = this.days) {
    const m = this.m;
    const days = Math.max(1 / 1440, elapsedDays);
    const weeks = days / 7;
    const nK = this.kiosks.length;
    const hardwareWeekly = nK * this.P.hardware_cost_set / (this.P.amortize_months * 52 / 12);
    const placementWeekly = nK * this.P.placement_fee / 52;
    const revenue = m.rentalRevenue + m.forfeitRevenue;
    const overhead = (placementWeekly + this.P.software_weekly) * weeks;
    const costs = m.cardFees + m.hostShare + m.csCost + m.rebalanceCost + m.lossCost + hardwareWeekly * weeks + overhead;
    const profit = revenue - costs;
    const durs = [...m.durations].sort((a, b) => a - b);
    const med = durs.length ? durs[Math.floor(durs.length / 2)] : 0;
    const demand = m.rentals + m.unmetNoKiosk + m.unmetEmpty + m.declinedPrice;
    return {
      stations: nK,
      days,
      rentals: m.rentals,
      rentalsPerDay: m.rentals / days,
      rentalsPerStationDay: m.rentals / days / Math.max(1, nK),
      demand,
      unmetNoKiosk: m.unmetNoKiosk,
      unmetEmpty: m.unmetEmpty,
      declinedPrice: m.declinedPrice,
      serviceLevel: demand ? m.rentals / (m.rentals + m.unmetEmpty) : 1,
      captureRate: demand ? m.rentals / demand : 0,
      returns: m.returns,
      failedReturnAttempts: m.failedReturnAttempts,
      csTickets: m.csTickets,
      forfeits: m.forfeits,
      lost: m.lost,
      medianRentalMin: med,
      utilization: m.packMinutesTotal ? m.packMinutesOut / m.packMinutesTotal : 0,
      revenue, rentalRevenue: m.rentalRevenue, forfeitRevenue: m.forfeitRevenue,
      cardFees: m.cardFees, hostShare: m.hostShare, csCost: m.csCost,
      rebalanceCost: m.rebalanceCost, lossCost: m.lossCost, hardware: hardwareWeekly * weeks, overhead,
      costs, profit,
      profitPerWeek: profit / weeks,
      revenuePerWeek: revenue / weeks,
      profitPerStationWeek: profit / weeks / Math.max(1, nK),
    };
  }
}

export { ZONES, SITES, DAY };
