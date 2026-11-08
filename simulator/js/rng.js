// Seeded random number generation, so every run is reproducible and layouts can be
// compared with common random numbers (same seed => same customers).

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class RNG {
  constructor(seed = 1) {
    this.u = mulberry32(seed);
    this._spare = null;
  }
  uniform(a = 0, b = 1) { return a + (b - a) * this.u(); }
  bernoulli(p) { return this.u() < p; }
  normal(mu = 0, sd = 1) {
    if (this._spare !== null) { const s = this._spare; this._spare = null; return mu + sd * s; }
    let u = 0, v = 0;
    while (u === 0) u = this.u();
    v = this.u();
    const r = Math.sqrt(-2 * Math.log(u));
    this._spare = r * Math.sin(2 * Math.PI * v);
    return mu + sd * r * Math.cos(2 * Math.PI * v);
  }
  // Lognormal parameterised by its median and the sd of log(x).
  lognormalMedian(median, sigma) { return median * Math.exp(sigma * this.normal()); }
  // Poisson: Knuth for small lambda, normal approximation for large.
  poisson(lambda) {
    if (lambda <= 0) return 0;
    if (lambda > 40) return Math.max(0, Math.round(this.normal(lambda, Math.sqrt(lambda))));
    const L = Math.exp(-lambda);
    let k = 0, p = 1;
    do { k++; p *= this.u(); } while (p > L);
    return k - 1;
  }
  pickWeighted(items, weights) {
    let total = 0;
    for (const w of weights) total += w;
    let r = this.u() * total;
    for (let i = 0; i < items.length; i++) { r -= weights[i]; if (r <= 0) return items[i]; }
    return items[items.length - 1];
  }
}
