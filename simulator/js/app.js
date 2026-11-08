// Charj Digital Twin: UI layer (map, live dashboard, Monte Carlo, A/B, sensitivity, provenance).
import { Simulation, DAY } from './engine.js';
import { SITES, ZONES, toLatLon } from './geo.js';
import { PARAMS, SCENARIOS, BENCHMARKS, PROFILES } from './params.js';
import { stats } from './montecarlo.js';

const css = getComputedStyle(document.documentElement);
const C = k => css.getPropertyValue(k).trim();
const COL = {
  s1: C('--series-1'), s2: C('--series-2'), s3: C('--series-3'), s4: C('--series-4'),
  good: C('--good'), warn: C('--warning'), serious: C('--serious'), crit: C('--critical'),
  text: C('--text-secondary'), muted: C('--text-muted'), grid: '#2a2d33', brand: C('--brand'),
};
Chart.defaults.color = COL.text;
Chart.defaults.borderColor = COL.grid;
Chart.defaults.font.family = "Inter, system-ui, sans-serif";
Chart.defaults.font.size = 11;
Chart.defaults.plugins.legend.labels.boxWidth = 10;
Chart.defaults.plugins.legend.labels.boxHeight = 10;

const $ = id => document.getElementById(id);
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const money = (v, d = 0) => (v < 0 ? '−' : '') + '$' + Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
const pct = (v, d = 0) => (v * 100).toFixed(d) + '%';
const hhmm = t => { const m = t % DAY; return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };
const CORE6 = ['hunan', 'lerner', 'butler', 'bwy112', 'bwy116', 'ams111'];

// ───────────────────────── state ─────────────────────────
const state = {
  siteIds: SITES.filter(s => s.live).map(s => s.id),
  scenario: 'normal',
  price: PARAMS.price_per_hour.value,
  aware: PARAMS.p_aware.value,
  slots: PARAMS.slots_per_kiosk.value,
  packs: PARAMS.packs_per_kiosk.value,
  host: PARAMS.host_share.value,
  routeAware: false,
  rebalance: true,
  speed: 300,
  playing: false,
};

function cfg(siteIds = state.siteIds) {
  return {
    siteIds, scenario: state.scenario, days: 7, routeAware: state.routeAware, rebalance: state.rebalance,
    params: { price_per_hour: state.price, p_aware: state.aware, slots_per_kiosk: state.slots, packs_per_kiosk: Math.min(state.packs, state.slots), host_share: state.host },
  };
}

// ───────────────────────── tabs ─────────────────────────
document.querySelectorAll('.tab').forEach(b => b.addEventListener('click', () => {
  document.querySelectorAll('.tab').forEach(x => x.classList.toggle('active', x === b));
  document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.id === 'view-' + b.dataset.view));
  if (b.dataset.view === 'live') setTimeout(() => map.invalidateSize(), 50);
  if (b.dataset.view === 'mc') $('mcCfg').textContent = describeCfg();
  if (b.dataset.view === 'ab') renderAB();
}));
function describeCfg() {
  return `${state.siteIds.length} stations · ${SCENARIOS[state.scenario].label} · $${state.price.toFixed(2)}/h · awareness ${pct(state.aware, 1)} · ${Math.min(state.packs, state.slots)}/${state.slots} packs/slots · venue share ${pct(state.host)}`;
}

// ───────────────────────── controls ─────────────────────────
const scenSel = $('scenario');
for (const [k, s] of Object.entries(SCENARIOS)) scenSel.add(new Option(s.label, k));
scenSel.value = state.scenario;
scenSel.onchange = () => { state.scenario = scenSel.value; restart(); };

function renderSiteList() {
  const box = $('sitelist');
  box.innerHTML = '';
  for (const s of SITES) {
    const row = document.createElement('label');
    row.className = 'site';
    row.innerHTML = `<input type="checkbox" ${state.siteIds.includes(s.id) ? 'checked' : ''}><span class="nm" title="${s.name}">${s.name}</span>${s.live ? '<span class="pill live">LIVE</span>' : ''}`;
    row.querySelector('input').onchange = e => {
      state.siteIds = e.target.checked ? [...state.siteIds, s.id] : state.siteIds.filter(x => x !== s.id);
      restart();
    };
    box.appendChild(row);
  }
  $('netCount').textContent = `· ${state.siteIds.length} stations`;
}
$('selLive').onclick = () => { state.siteIds = SITES.filter(s => s.live).map(s => s.id); restart(); };
$('selCore').onclick = () => { state.siteIds = [...CORE6]; restart(); };
$('selAll').onclick = () => { state.siteIds = SITES.map(s => s.id); restart(); };

const levers = [
  ['price', 'v_price', v => `$${(+v).toFixed(2)}`, 'price'],
  ['aware', 'v_aware', v => pct(+v, 1), 'aware'],
  ['slots', 'v_slots', v => `${v}`, 'slots'],
  ['packs', 'v_packs', v => `${Math.min(+v, state.slots)}`, 'packs'],
  ['host', 'v_host', v => pct(+v), 'host'],
];
for (const [id, out, f, key] of levers) {
  const el = $(id);
  el.value = state[key];
  $(out).textContent = f(el.value);
  el.oninput = () => { $(out).textContent = f(el.value); };
  el.onchange = () => {
    state[key] = +el.value;
    if (key === 'slots') { $('packs').max = state.slots; if (state.packs > state.slots) { state.packs = state.slots; $('packs').value = state.slots; } $('v_packs').textContent = Math.min(state.packs, state.slots); }
    restart();
  };
}
$('packs').max = state.slots;
$('routeAware').onchange = e => { state.routeAware = e.target.checked; restart(); };
$('rebalance').onchange = e => { state.rebalance = e.target.checked; restart(); };

// ───────────────────────── map ─────────────────────────
const map = L.map('map', { zoomControl: false, preferCanvas: true }).setView([40.8052, -73.9648], 16);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors', maxZoom: 19,
}).addTo(map);
L.control.zoom({ position: 'bottomright' }).addTo(map);
const canvasR = L.canvas({ padding: 0.5 });

const zoneLayers = ZONES.map(z => {
  const c = L.circle([z.lat, z.lon], { radius: 60, stroke: false, fillColor: COL.s1, fillOpacity: 0.16, renderer: canvasR, interactive: true });
  c.bindTooltip('', { direction: 'top', opacity: 0.95 });
  c.addTo(map);
  return { z, c };
});

let kioskMarkers = {};
let renterMarkers = new Map();
let flashes = [];

function footfallNow(z, t) {
  const h = Math.floor((t % DAY) / 60);
  const d = Math.floor(t / DAY) % 7;
  const wk = d >= 5 ? 'weekend' : 'weekday';
  const prof = PROFILES[wk][z.profile];
  let f = PARAMS[z.footfallKey].value * prof[h] / prof.reduce((a, b) => a + b, 0);
  if (wk === 'weekend' && z.weekendFactor) f *= z.weekendFactor;
  if (wk === 'weekend' && z.type === 'campus') f *= 0.6;
  return f;
}

function kioskHtml(k) {
  const min = sim.P.rentable_min_soc;
  const cols = k.slots > 16 ? 8 : 4;
  let cells = '';
  const packs = [...k.packs].sort((a, b) => b.soc - a.soc);
  for (let i = 0; i < k.slots; i++) {
    const p = packs[i];
    const cls = !p ? '' : p.soc >= min ? 'ready' : 'charging';
    cells += `<div class="slot ${cls}"></div>`;
  }
  const alert = (k.packs.length >= k.slots || !packs.some(p => p.soc >= min)) ? 'alert' : '';
  return `<div class="kiosk ${k.live ? 'live' : ''} ${alert}" style="grid-template-columns:repeat(${cols},7px)">${cells}</div>`;
}
function kioskSig(k) {
  const min = sim.P.rentable_min_soc;
  return k.packs.length + ':' + k.packs.filter(p => p.soc >= min).length;
}

function buildKioskMarkers() {
  for (const m of Object.values(kioskMarkers)) map.removeLayer(m.marker);
  kioskMarkers = {};
  for (const k of sim.kiosks) {
    const cols = k.slots > 16 ? 8 : 4;
    const rows = Math.ceil(k.slots / cols);
    const w = cols * 9 + 8, h = rows * 11 + 8;
    const icon = L.divIcon({ className: 'kiosk-icon', html: kioskHtml(k), iconSize: [w, h], iconAnchor: [w / 2, h / 2] });
    const marker = L.marker([k.lat, k.lon], { icon, zIndexOffset: 1000 }).addTo(map);
    marker.bindPopup('');
    marker.on('popupopen', () => marker.setPopupContent(kioskPopup(k)));
    kioskMarkers[k.id] = { marker, sig: kioskSig(k), k };
  }
}
function kioskPopup(k) {
  const min = sim.P.rentable_min_soc;
  const ready = k.packs.filter(p => p.soc >= min).length;
  return `<b>${k.name}</b>${k.live ? ' <span class="pill live">LIVE</span>' : ''}<br>
    <span style="color:var(--text-muted)">${k.hostType}</span><br>
    Slots ${k.slots} · packs here ${k.packs.length} · ready ${ready}<br>
    Rentals ${k.rentals} · returns ${k.returns}<br>
    Fees from rentals started here ${money(k.revenue)}<br>
    Missed (empty) ${k.unmetEmpty} · return attempts when full ${k.failedReturns}`;
}

function socColor(s) { return s < 30 ? COL.crit : s < 60 ? COL.warn : COL.good; }
function hash(str) { let h = 0; for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0; return h; }

function drawMap() {
  // stations
  for (const km of Object.values(kioskMarkers)) {
    const sig = kioskSig(km.k);
    if (sig !== km.sig) {
      km.sig = sig;
      const el = km.marker.getElement();
      if (el) el.innerHTML = kioskHtml(km.k);
    }
  }
  // renters
  const seen = new Set();
  for (const r of sim.active) {
    if (r.phase === 'away') continue;
    seen.add(r.id);
    const h = hash(r.id);
    const jx = ((h & 0xff) / 255 - 0.5) * 28, jy = (((h >> 8) & 0xff) / 255 - 0.5) * 28;
    const ll = toLatLon(r.x + jx, r.y + jy);
    const color = socColor(sim.phoneSoc(r));
    let mk = renterMarkers.get(r.id);
    if (!mk) {
      mk = L.circleMarker([ll.lat, ll.lon], { radius: 5, color: '#0f1012', weight: 2, fillColor: color, fillOpacity: 1, renderer: canvasR }).addTo(map);
      mk.bindTooltip('', { direction: 'top' });
      renterMarkers.set(r.id, mk);
    } else {
      mk.setLatLng([ll.lat, ll.lon]);
      mk.setStyle({ fillColor: color });
    }
    mk.setTooltipContent(`${r.persona}${r.old ? ' · older phone' : ''} · phone ${Math.round(sim.phoneSoc(r))}% · rented ${Math.round((sim.t - r.t0))} min ago at ${r.from.name.split(' · ')[0]}`);
  }
  for (const [id, mk] of renterMarkers) if (!seen.has(id)) { map.removeLayer(mk); renterMarkers.delete(id); }
  // missed-demand flashes
  const now = performance.now();
  flashes = flashes.filter(f => {
    const age = (now - f.born) / 1400;
    if (age >= 1) { map.removeLayer(f.m); return false; }
    f.m.setStyle({ opacity: 1 - age, radius: 6 + age * 14 });
    return true;
  });
  // foot traffic circles
  let max = 1;
  const vals = zoneLayers.map(({ z }) => { const v = footfallNow(z, sim.t); max = Math.max(max, v); return v; });
  zoneLayers.forEach(({ z, c }, i) => {
    c.setRadius(35 + 170 * Math.sqrt(vals[i] / 3500));
    c.setTooltipContent(`<b>${z.name}</b><br>≈${Math.round(vals[i]).toLocaleString()} people this hour<br><span style="color:var(--text-muted)">source: ${PARAMS[z.footfallKey].conf}</span>`);
  });
  // night shade
  const hr = (sim.t % DAY) / 60;
  const night = hr < 6 ? 0.42 : hr < 7.5 ? 0.42 * (7.5 - hr) / 1.5 : hr < 17.5 ? 0 : hr < 20 ? 0.42 * (hr - 17.5) / 2.5 : 0.42;
  $('nightshade').style.opacity = night.toFixed(2);
}

// ───────────────────────── live sim ─────────────────────────
let sim, feedItems = [], hourlyChart, availChart;
const ICON = { rent: '⚡', return: '↩', unmet: '✕', failedReturn: '⛔', forfeit: '$', rebalance: '🚚', declined: '–' };

function onEvent(e) {
  if (e.type === 'unmet') {
    const z = ZONES.find(x => x.id === e.zone);
    if (z && flashes.length < 80) {
      const jit = toLatLon(z.x + (Math.random() - 0.5) * 60, z.y + (Math.random() - 0.5) * 60);
      flashes.push({ born: performance.now(), m: L.circleMarker([jit.lat, jit.lon], { radius: 6, color: COL.crit, weight: 2, fill: false, renderer: canvasR, interactive: false }).addTo(map) });
    }
  }
  let msg = null;
  const kn = id => (sim.kiosks.find(k => k.id === id)?.name || id).split(' · ')[0];
  const zn = id => (ZONES.find(z => z.id === id)?.name || id);
  if (e.type === 'rent') msg = `Rental at ${kn(e.kiosk)}: ${e.persona}, phone ${e.soc}%`;
  else if (e.type === 'return') msg = `Returned to ${kn(e.kiosk)} after ${e.minutes} min${e.forfeited ? ' (deposit already kept)' : ''}`;
  else if (e.type === 'unmet') msg = e.reason === 'station empty' ? `Missed: ${kn(e.kiosk)} had no charged pack` : `Missed: no station near ${zn(e.zone)}`;
  else if (e.type === 'failedReturn') msg = `Return failed: ${kn(e.kiosk)} full → support ticket`;
  else if (e.type === 'forfeit') msg = `24 h overdue: $30 hold captured`;
  else if (e.type === 'rebalance') msg = `Night rebalancing: ${e.stops} station visits`;
  if (msg) {
    feedItems.unshift({ t: e.t, icon: ICON[e.type] || '•', msg, type: e.type });
    if (feedItems.length > 60) feedItems.length = 60;
  }
}

function restart() {
  state.playing = false;
  $('play').textContent = '▶ Play';
  for (const [, mk] of renterMarkers) map.removeLayer(mk);
  renterMarkers.clear();
  flashes.forEach(f => map.removeLayer(f.m)); flashes = [];
  feedItems = [];
  sim = new Simulation({ ...cfg(), seed: 42, onEvent });
  buildKioskMarkers();
  renderSiteList();
  $('scenarioDesc').textContent = SCENARIOS[state.scenario].description;
  $('clockScen').textContent = SCENARIOS[state.scenario].label;
  initLiveCharts();
  updateLive(true);
}

function initLiveCharts() {
  if (hourlyChart) hourlyChart.destroy();
  if (availChart) availChart.destroy();
  hourlyChart = new Chart($('chHourly'), {
    type: 'bar',
    data: { labels: [...Array(24).keys()].map(h => String(h).padStart(2, '0')), datasets: [
      { label: 'Rentals', data: Array(24).fill(0), backgroundColor: COL.s1, borderRadius: 3, borderSkipped: 'start' },
      { label: 'Missed demand', data: Array(24).fill(0), backgroundColor: COL.s2, borderRadius: 3, borderSkipped: 'start' },
    ] },
    options: { animation: false, responsive: true, plugins: { legend: { position: 'bottom' }, tooltip: { mode: 'index', intersect: false } },
      scales: { x: { grid: { display: false }, title: { display: true, text: 'hour of day (today)' } }, y: { beginAtZero: true, ticks: { precision: 0 } } } },
  });
  const labels = [];
  for (let d = 0; d < 7; d++) for (let h = 0; h < 24; h++) labels.push(`${DAYS[d].slice(0, 3)} ${String(h).padStart(2, '0')}:00`);
  availChart = new Chart($('chAvail'), {
    type: 'line',
    data: { labels, datasets: [
      { label: 'Packs ready', data: [], borderColor: COL.s3, borderWidth: 2, pointRadius: 0, tension: 0.25 },
      { label: 'Packs out with renters', data: [], borderColor: COL.s1, borderWidth: 2, pointRadius: 0, tension: 0.25 },
    ] },
    options: { animation: false, responsive: true, interaction: { mode: 'index', intersect: false },
      plugins: { legend: { position: 'bottom' } },
      scales: { x: { ticks: { maxTicksLimit: 7, callback: function (v) { const l = this.getLabelForValue(v); return l.endsWith('00:00') ? l.slice(0, 3) : ''; } }, grid: { display: false } },
                y: { beginAtZero: true, ticks: { precision: 0 } } } },
  });
}

let lastPanelUpdate = 0;
function updateLive(force = false) {
  const t = sim.t;
  $('clockTime').textContent = hhmm(t);
  const d = Math.min(6, Math.floor(t / DAY));
  $('clockDay').textContent = `${DAYS[d]} · ${d >= 5 ? 'weekend' : 'weekday'} · week 1`;
  drawMap();
  const now = performance.now();
  if (!force && now - lastPanelUpdate < 200) return;
  lastPanelUpdate = now;

  const s = sim.summary(Math.max(t, 1) / DAY);
  const m = sim.m;
  $('k_profit').innerHTML = `<span class="${s.profit >= 0 ? 'pos' : 'neg'}">${money(s.profit)}</span>`;
  $('k_profitSub').textContent = `revenue ${money(s.revenue)} − costs ${money(s.costs)} (week to date)`;
  $('k_rentals').textContent = m.rentals.toLocaleString();
  const dayStart = Math.floor(t / 60 / 24) * 24;
  const today = m.hourly.slice(dayStart, dayStart + 24);
  $('k_rentalsSub').textContent = `today ${today.reduce((a, h) => a + h.rentals, 0)} · ${s.rentalsPerStationDay.toFixed(1)}/station/day`;
  $('k_rev').textContent = money(s.revenue);
  $('k_revSub').textContent = `fees ${money(s.rentalRevenue)} · forfeits ${money(s.forfeitRevenue)}`;
  $('k_service').textContent = (m.rentals + m.unmetEmpty) ? pct(s.serviceLevel) : '–';
  let ready = 0, total = 0;
  for (const k of sim.kiosks) { total += k.packs.length; ready += k.packs.filter(p => p.soc >= sim.P.rentable_min_soc).length; }
  $('k_avail').textContent = `${ready}/${total + sim.active.length}`;
  $('k_availSub').textContent = `in use now ${sim.active.length} · charging ${total - ready}`;
  $('k_unmet').textContent = (m.unmetNoKiosk + m.unmetEmpty).toLocaleString();
  $('k_unmetSub').textContent = `no station ${m.unmetNoKiosk} · empty ${m.unmetEmpty} · price ${m.declinedPrice}`;
  $('k_fail').textContent = m.failedReturnAttempts;
  $('k_failSub').textContent = `station full · forfeits ${m.forfeits} · lost ${m.lost}`;

  hourlyChart.data.datasets[0].data = today.map(h => h.rentals);
  hourlyChart.data.datasets[1].data = today.map(h => h.unmet);
  hourlyChart.update('none');
  const hrs = Math.floor(t / 60);
  availChart.data.datasets[0].data = m.hourly.slice(0, hrs).map(h => h.avail);
  availChart.data.datasets[1].data = m.hourly.slice(0, hrs).map(h => h.out);
  availChart.update('none');

  $('feed').innerHTML = feedItems.slice(0, 40).map(f => `<div><span class="t">${DAYS[Math.min(6, Math.floor(f.t / DAY))].slice(0, 3)} ${hhmm(f.t)}</span><span class="ic">${f.icon}</span><span>${f.msg}</span></div>`).join('');
}

let lastFrame = 0, carry = 0;
function frame(ts) {
  const dt = lastFrame ? Math.min(100, ts - lastFrame) : 16;
  lastFrame = ts;
  if (state.playing && !sim.done) {
    carry += (state.speed / 60) * dt / 1000;
    let n = Math.floor(carry);
    carry -= n;
    while (n-- > 0 && !sim.done) sim.step();
    updateLive();
    if (sim.done) { state.playing = false; $('play').textContent = '✓ Week done'; updateLive(true); }
  }
  requestAnimationFrame(frame);
}
$('play').onclick = () => {
  if (sim.done) { restart(); }
  state.playing = !state.playing;
  $('play').textContent = state.playing ? '❚❚ Pause' : '▶ Play';
};
$('reset').onclick = restart;
document.querySelectorAll('.spd').forEach(b => {
  b.classList.toggle('on', +b.dataset.speed === state.speed);
  b.onclick = () => { state.speed = +b.dataset.speed; document.querySelectorAll('.spd').forEach(x => x.classList.toggle('on', x === b)); };
});

// ───────────────────────── Monte Carlo ─────────────────────────
const worker = new Worker('js/mc-worker.js', { type: 'module' });
let workerJob = null;
worker.onmessage = e => workerJob && workerJob(e.data);

const vline = {
  id: 'vline',
  afterDatasetsDraw(chart, args, opts) {
    if (opts.value == null) return;
    const scale = chart.scales[opts.axis || 'x'];
    const x = scale.getPixelForValue(opts.value);
    if (x < chart.chartArea.left || x > chart.chartArea.right) return;
    const ctx = chart.ctx;
    ctx.save(); ctx.strokeStyle = opts.color || '#c3c2b7'; ctx.setLineDash([5, 4]); ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x, chart.chartArea.top); ctx.lineTo(x, chart.chartArea.bottom); ctx.stroke();
    if (opts.label) { ctx.fillStyle = opts.color || '#c3c2b7'; ctx.font = '11px Inter'; ctx.fillText(opts.label, x + 5, chart.chartArea.top + 12); }
    ctx.restore();
  },
};
Chart.register(vline);

let histChart, convChart;
function statTile(lab, val, sub) { return `<div class="card stat"><div class="lab">${lab}</div><div class="val">${val}</div><div class="sub">${sub}</div></div>`; }

$('mcRun').onclick = () => {
  const reps = +$('mcReps').value;
  $('mcRun').disabled = true;
  $('mcCfg').textContent = describeCfg();
  let lastDraw = 0;
  workerJob = d => {
    if (d.error) { $('mcStats').innerHTML = `<div class="callout warn">${d.error}</div>`; $('mcRun').disabled = false; return; }
    $('mcProg').style.width = (100 * (d.done ? 1 : d.progress / d.total)) + '%';
    const now = performance.now();
    if (d.done || now - lastDraw > 250) { lastDraw = now; drawMC(d.results); }
    if (d.done) $('mcRun').disabled = false;
  };
  worker.postMessage({ kind: 'replicate', cfg: cfg(), reps });
};

function drawMC(results) {
  const P = stats(results.map(r => r.profitPerWeek));
  const R = stats(results.map(r => r.rentalsPerStationDay));
  const S = stats(results.map(r => r.serviceLevel));
  const D = stats(results.map(r => r.medianRentalMin));
  $('mcStats').innerHTML =
    statTile('Expected weekly profit', `<span class="${P.mean >= 0 ? 'pos' : 'neg'}">${money(P.mean)}</span>`, `95% CI ${money(P.mean - P.ci95)} to ${money(P.mean + P.ci95)} · n=${P.n}`) +
    statTile('Chance of a profitable week', pct(P.pPositive), `typical range (P10–P90) ${money(P.p10)} to ${money(P.p90)}`) +
    statTile('Rentals per station per day', R.mean.toFixed(2), `P10–P90 ${R.p10.toFixed(2)}–${R.p90.toFixed(2)}`) +
    statTile('Service level', pct(S.mean), `median rental ${Math.round(D.mean)} min`);

  // histogram
  const xs = results.map(r => r.profitPerWeek);
  const lo = Math.min(...xs, 0), hi = Math.max(...xs, 0);
  const nb = 24, w = (hi - lo) / nb || 1;
  const bins = Array.from({ length: nb }, (_, i) => ({ x: lo + w * (i + 0.5), y: 0 }));
  for (const x of xs) bins[Math.min(nb - 1, Math.floor((x - lo) / w))].y++;
  if (histChart) histChart.destroy();
  histChart = new Chart($('chMcHist'), {
    type: 'bar',
    data: { datasets: [{ label: 'Simulated weeks', data: bins, backgroundColor: COL.s1, borderRadius: 3, borderSkipped: 'start', barPercentage: 0.94, categoryPercentage: 1 }] },
    options: { animation: false, parsing: { xAxisKey: 'x', yAxisKey: 'y' },
      plugins: { legend: { display: false }, vline: { value: 0, label: 'break-even', color: '#c3c2b7' },
        tooltip: { callbacks: { title: it => `${money(it[0].raw.x - w / 2)} to ${money(it[0].raw.x + w / 2)}`, label: it => `${it.raw.y} weeks` } } },
      scales: { x: { type: 'linear', offset: false, ticks: { callback: v => money(v) }, title: { display: true, text: 'profit per week' }, grid: { display: false } },
                y: { beginAtZero: true, ticks: { precision: 0 }, title: { display: true, text: 'weeks' } } } },
  });

  // convergence
  const mean = [], up = [], dn = [];
  let s = 0, s2 = 0;
  xs.forEach((x, i) => {
    s += x; s2 += x * x;
    const n = i + 1, m = s / n, v = n > 1 ? (s2 - n * m * m) / (n - 1) : 0, ci = 1.96 * Math.sqrt(Math.max(0, v) / n);
    mean.push({ x: n, y: m }); up.push({ x: n, y: m + ci }); dn.push({ x: n, y: m - ci });
  });
  if (convChart) convChart.destroy();
  convChart = new Chart($('chMcConv'), {
    type: 'line',
    data: { datasets: [
      { label: '95% CI upper', data: up, borderColor: 'transparent', pointRadius: 0, fill: '+1', backgroundColor: 'rgba(57,135,229,0.18)' },
      { label: '95% CI lower', data: dn, borderColor: 'transparent', pointRadius: 0, fill: false },
      { label: 'Running mean', data: mean, borderColor: COL.s1, borderWidth: 2, pointRadius: 0 },
    ] },
    options: { animation: false, interaction: { mode: 'index', intersect: false },
      plugins: { legend: { labels: { filter: i => i.text === 'Running mean' } }, tooltip: { callbacks: { label: it => `${it.dataset.label}: ${money(it.raw.y)}` } } },
      scales: { x: { type: 'linear', title: { display: true, text: 'replications' }, grid: { display: false } }, y: { ticks: { callback: v => money(v) } } } },
  });

  // benchmarks
  const val = { rentalsPerStationDay: R.mean, medianRentalMin: D.mean };
  $('mcBench').innerHTML = BENCHMARKS.map(b => {
    const v = val[b.metric];
    const ok = v >= b.low && v <= b.high;
    return `<div class="callout ${ok ? '' : 'warn'}"><b>${ok ? '✓ Inside' : '⚠ Outside'} the real-world range:</b> ${b.label} = <b>${v.toFixed(b.metric === 'medianRentalMin' ? 0 : 2)}</b> (comparable operators: ${b.low}–${b.high})<br>
      ${b.points.map(p => `<span class="badge b-${p.conf}">${p.conf}</span> <a href="${p.url}" target="_blank" rel="noopener">${p.name}</a>: ${p.value}`).join(' &nbsp;·&nbsp; ')}</div>`;
  }).join('') + `<div class="hint">Matching benchmarks is necessary, not sufficient: it shows the model is in the right ballpark, and the Charj pilot data will be the real test.</div>`;
}

// ───────────────────────── A/B ─────────────────────────
let abB = null, abChart;
function renderAB() {
  $('abA').innerHTML = state.siteIds.map(id => SITES.find(s => s.id === id).name).join('<br>') + `<br><br>${describeCfg()}`;
  if (!abB) {
    const extra = SITES.find(s => !state.siteIds.includes(s.id));
    abB = [...state.siteIds, ...(extra ? [extra.id] : [])];
  }
  const box = $('abB'); box.innerHTML = '';
  for (const s of SITES) {
    const row = document.createElement('label');
    row.className = 'site';
    const inA = state.siteIds.includes(s.id);
    row.innerHTML = `<input type="checkbox" ${abB.includes(s.id) ? 'checked' : ''}><span class="nm">${s.name}</span>${abB.includes(s.id) && !inA ? '<span class="pill live" style="color:#86b6ef;border-color:#3987e5;background:rgba(57,135,229,.12)">ADDED</span>' : ''}${!abB.includes(s.id) && inA ? '<span class="pill" style="color:#ff7a7a;border:1px solid #d03b3b">REMOVED</span>' : ''}`;
    row.querySelector('input').onchange = e => { abB = e.target.checked ? [...abB, s.id] : abB.filter(x => x !== s.id); renderAB(); };
    box.appendChild(row);
  }
}
$('abRun').onclick = () => {
  const reps = +$('abReps').value;
  $('abRun').disabled = true;
  let lastDraw = 0;
  workerJob = d => {
    if (d.error) { $('abResult').innerHTML = `<div class="callout warn">${d.error}</div>`; $('abRun').disabled = false; return; }
    if (d.done) { $('abRun').disabled = false; $('abProg').style.width = '100%'; return; }
    $('abProg').style.width = (100 * d.progress / d.total) + '%';
    const now = performance.now();
    if (now - lastDraw > 250 || d.progress === d.total) { lastDraw = now; drawAB(d); }
  };
  worker.postMessage({ kind: 'compare', cfg: cfg(state.siteIds), cfgB: cfg(abB), reps });
};
function drawAB(d) {
  const D = stats(d.diffs), A = stats(d.a), B = stats(d.b);
  const better = d.diffs.filter(x => x > 0).length / d.diffs.length;
  const sig = Math.abs(D.mean) > D.ci95;
  const added = abB.filter(x => !state.siteIds.includes(x)).length, removed = state.siteIds.filter(x => !abB.includes(x)).length;
  $('abResult').innerHTML = `<div class="grid4">
    ${statTile('Layout A profit / week', money(A.mean), `±${money(A.ci95)} (95% CI)`)}
    ${statTile('Layout B profit / week', money(B.mean), `±${money(B.ci95)} (95% CI)`)}
    ${statTile('Difference (B − A)', `<span class="${D.mean >= 0 ? 'pos' : 'neg'}">${D.mean >= 0 ? '+' : ''}${money(D.mean)}</span>`, `95% CI ${money(D.mean - D.ci95)} to ${money(D.mean + D.ci95)}`)}
    ${statTile('B wins in', pct(better), `of ${d.diffs.length} paired weeks`)}
  </div>
  <div class="callout ${sig ? '' : 'warn'}"><b>${sig ? (D.mean > 0 ? 'Layout B is better' : 'Layout A is better') : 'No clear winner yet'}.</b>
  B ${added ? `adds ${added}` : ''}${added && removed ? ' and ' : ''}${removed ? `removes ${removed}` : ''} station${added + removed === 1 ? '' : 's'} and changes expected profit by <b>${D.mean >= 0 ? '+' : ''}${money(D.mean)}/week</b>
  (${money(D.mean * 52)}/year)${sig ? ', and the 95% interval excludes zero.' : '. The interval includes zero, so run more replications or treat the layouts as equivalent.'}</div>`;
  const pts = d.a.map((a, i) => ({ x: a, y: d.b[i] }));
  const lo = Math.min(...d.a, ...d.b), hi = Math.max(...d.a, ...d.b);
  if (abChart) abChart.destroy();
  abChart = new Chart($('chAB'), {
    type: 'scatter',
    data: { datasets: [
      { label: 'One paired week', data: pts, backgroundColor: COL.s1, pointRadius: 4, pointBorderColor: '#17181b', pointBorderWidth: 1 },
      { label: 'Equal profit (B = A)', type: 'line', data: [{ x: lo, y: lo }, { x: hi, y: hi }], borderColor: COL.muted, borderDash: [5, 4], borderWidth: 1.5, pointRadius: 0 },
    ] },
    options: { animation: false, plugins: { tooltip: { callbacks: { label: it => `A ${money(it.raw.x)} · B ${money(it.raw.y)}` } } },
      scales: { x: { title: { display: true, text: 'Layout A profit / week' }, ticks: { callback: v => money(v) } }, y: { title: { display: true, text: 'Layout B profit / week' }, ticks: { callback: v => money(v) } } } },
  });
}

// ───────────────────────── Sensitivity ─────────────────────────
let tornado;
$('sensRun').onclick = () => {
  const reps = +$('sensReps').value;
  $('sensRun').disabled = true;
  $('sensBase').textContent = describeCfg();
  workerJob = d => {
    if (d.error) { $('sensInsight').innerHTML = `<div class="callout warn">${d.error}</div>`; $('sensRun').disabled = false; return; }
    $('sensProg').style.width = (100 * (d.done ? 1 : d.progress / d.total)) + '%';
    if (d.done) { $('sensRun').disabled = false; drawTornado(d.base, d.rows); }
  };
  worker.postMessage({ kind: 'sensitivity', cfg: cfg(), reps });
};
function drawTornado(base, rows) {
  const fmtV = (r, v) => r.unit.includes('fraction') || r.unit.startsWith('of ') ? pct(v, v < 0.1 ? 1 : 0) : `${v} ${r.unit.split(' ')[0]}`;
  const labels = rows.map(r => `${r.label} [${r.conf}]`);
  if (tornado) tornado.destroy();
  tornado = new Chart($('chTornado'), {
    type: 'bar',
    data: { labels, datasets: [
      { label: 'Input at low end', data: rows.map(r => [base, r.lowProfit]), backgroundColor: COL.s1, borderRadius: 3, borderSkipped: false },
      { label: 'Input at high end', data: rows.map(r => [base, r.highProfit]), backgroundColor: COL.s2, borderRadius: 3, borderSkipped: false },
    ] },
    options: { indexAxis: 'y', animation: false, responsive: true,
      plugins: { vline: { value: base, label: `base ${money(base)}/wk`, color: '#c3c2b7' }, legend: { position: 'bottom' },
        tooltip: { callbacks: { label: it => { const r = rows[it.dataIndex]; const lowSide = it.datasetIndex === 0; return `${lowSide ? 'low' : 'high'} (${fmtV(r, lowSide ? r.lowVal : r.highVal)}): ${money(lowSide ? r.lowProfit : r.highProfit)}/week`; } } } },
      scales: { x: { ticks: { callback: v => money(v) }, title: { display: true, text: 'expected profit per week' } }, y: { grid: { display: false } } } },
  });
  const weak = rows.slice(0, 5).filter(r => ['ASSUMPTION', 'LOW', 'CALIBRATED'].includes(r.conf));
  $('sensInsight').innerHTML = `<div class="callout"><b>Where to spend research effort:</b> the biggest swings come from
    ${rows.slice(0, 3).map(r => `<b>${r.label}</b> (${money(r.swing)}/week swing, <span class="badge b-${r.conf}">${r.conf}</span>)`).join(', ')}.
    ${weak.length ? `Of the top five, ${weak.length} still rest on weak or calibrated data, so measuring them (street battery survey, pilot rental logs, host deals) is worth more than any other analysis.` : ''}</div>`;
}

// ───────────────────────── Data & sources ─────────────────────────
function renderData() {
  const order = ['FACT', 'HIGH', 'MED', 'LOW', 'CALIBRATED', 'ASSUMPTION'];
  const colors = { FACT: '#ffd23f', HIGH: '#0ca30c', MED: '#3987e5', LOW: '#ec835a', CALIBRATED: '#9085e9', ASSUMPTION: '#6b6b66' };
  const desc = { FACT: "Charj's own data (app code, purchase order, field notes)", HIGH: 'Primary data, directly applicable', MED: 'Good data, transferred or derived',
    LOW: 'Weak or indirect evidence', CALIBRATED: 'Unmeasured; tuned to match real benchmarks', ASSUMPTION: 'No data yet: a tested range' };
  const items = Object.entries(PARAMS);
  const counts = Object.fromEntries(order.map(c => [c, items.filter(([, p]) => p.conf === c).length]));
  const n = items.length;
  const sourced = counts.FACT + counts.HIGH + counts.MED;
  $('confSummary').innerHTML = `<div class="confbar">${order.filter(c => counts[c]).map(c => `<div style="flex:${counts[c]};background:${colors[c]}" title="${c}: ${counts[c]}">${counts[c]}</div>`).join('')}</div>
    <div style="display:flex;flex-wrap:wrap;gap:14px;font-size:12px;color:var(--text-secondary)">${order.map(c => `<span><span class="badge b-${c}">${c}</span> ${counts[c]} · ${desc[c]}</span>`).join('')}</div>
    <div class="callout"><b>${sourced} of ${n} inputs (${pct(sourced / n)}) are backed by Charj's own records or good external data.</b>
    Hour-of-day subway traffic comes from MTA hourly ridership (HIGH). The rest are flagged, given a range, and tested in the Sensitivity tab. The remaining weak inputs are mostly about Charj customers themselves (awareness, battery level at the moment of need, return habits), which only a pilot and a street survey can measure.</div>`;

  const groups = [...new Set(items.map(([, p]) => p.group))];
  const link = p => p.url ? `<a href="${p.url}" target="_blank" rel="noopener">${p.source}</a>` : p.ref ? `${p.source}<br><a href="../${p.ref}" target="_blank" class="mono" style="font-size:11px">${p.ref}</a>` : p.source;
  const fmt = (p, v) => (typeof v === 'number' && v < 1 && v > 0 && /fraction|of /.test(p.unit)) ? pct(v, v < 0.1 ? 1 : 0) : (typeof v === 'number' ? v.toLocaleString() : v);
  let html = `<thead><tr><th>Input</th><th>Value</th><th>Range tested</th><th>Unit</th><th>Confidence</th><th>Source &amp; notes</th></tr></thead><tbody>`;
  for (const g of groups) {
    html += `<tr class="grp"><td colspan="6">${g}</td></tr>`;
    for (const [, p] of items.filter(([, p]) => p.group === g)) {
      html += `<tr><td>${p.label}</td><td class="num"><b>${fmt(p, p.value)}</b></td><td class="num">${p.low === p.high ? '—' : `${fmt(p, p.low)} – ${fmt(p, p.high)}`}</td><td>${p.unit}</td><td><span class="badge b-${p.conf}">${p.conf}</span></td><td>${link(p)}${p.note ? `<div class="hint">${p.note}</div>` : ''}</td></tr>`;
    }
  }
  html += `<tr class="grp"><td colspan="6">Time-of-day patterns</td></tr>`;
  for (const k of ['subway', 'campus', 'dining', 'hospital']) {
    const u = PROFILES.url && PROFILES.url[k];
    html += `<tr><td>Hourly footfall curve: ${k}</td><td colspan="3">24 hourly shares, weekday and weekend (local time, ET)</td><td><span class="badge b-${PROFILES.conf[k]}">${PROFILES.conf[k]}</span></td><td>${u ? `<a href="${u}" target="_blank" rel="noopener">${PROFILES.source[k]}</a>` : PROFILES.source[k]}</td></tr>`;
  }
  $('paramTable').innerHTML = html + '</tbody>';
}

// ───────────────────────── Model card ─────────────────────────
function renderModel() {
  $('modelDoc').innerHTML = `
  <h2>How the model works</h2>
  <p class="lede">A minute-by-minute stochastic simulation (a "digital twin") of Charj stations, packs and customers in Morningside Heights. Every run is seeded and reproducible. The same engine powers the live map, the Monte Carlo runs and the command-line tool (<span class="mono">node simulator/cli.mjs</span>).</p>
  <h3>1. Who shows up: demand (non-homogeneous Poisson process)</h3>
  <div class="eq">λ_zone(t) = footfall_zone × hourShare_zone(h, weekday/weekend) / 60
           × p_aware × p_low(h) × p_seek × scenario multipliers
arrivals per minute ~ Poisson(λ_zone(t))</div>
  <p>Footfall comes from MTA subway ridership (fall 2026 hourly data) and Columbia, Barnard and Teachers College enrollment. Only people who know Charj (<i>p_aware</i>), whose phone is low (<i>p_low</i>, peaking in the evening as phones run down) and who have no charger of their own (<i>p_seek</i>) become potential customers.</p>
  <h3>2. Will they rent?</h3>
  <p>A potential customer looks for a station within <i>search_radius</i> (further if the phone is below 8%). If no station is in range, that is <b>missed demand: no station</b>, the signal for where to expand. If the nearest stations have no pack charged above the release level, it is <b>missed demand: empty</b>. Otherwise they accept the price with logistic probability:</p>
  <div class="eq">P(accept) = 1 / (1 + exp(2 × (price − WTP_mid)))</div>
  <h3>3. What happens during the rental</h3>
  <ul>
    <li><b>Charging physics:</b> the phone charges at ~1.8 %/min to 80% (Apple 20 W data), then ~0.5 %/min. Older phones (≥3 years, 40% of users) charge slower. Pack energy delivered = 8000 mAh × 3.7 V × 65% ≈ 19 Wh, about 1.5 full iPhone charges.</li>
    <li><b>Where they go:</b> a share stay at the venue and hand the pack back once charged (comparables: median ≈45 min). The rest walk to a destination chosen by a gravity model (bigger, closer places are likelier) or leave the area.</li>
    <li><b>Returning:</b> at the nearest station within <i>return_radius</i> of where they end up. If none is nearby, they hold it until they're back (median 12 h). With route-aware suggestions on, they drop it at a station on their path once charged. A full station means a failed return and a support ticket.</li>
    <li><b>Billing (from Charj's app code):</b> $1 per started hour. After 24 h the hourly job captures the $30 hold and cancels the rental fee. Some forfeited packs never come back and are replaced at PO cost.</li>
  </ul>
  <h3>4. Stations</h3>
  <p>Each slot recharges its pack to 80% in ~2.5 h, then trickles. A pack is released only above the release level (default 60%). Optional nightly rebalancing at 04:00 moves packs from full stations to empty ones, at a cost per stop.</p>
  <h3>5. Money</h3>
  <div class="eq">profit = rental fees + forfeited holds
       − card fees (2.9% + $0.30) − venue share − support tickets − rebalancing
       − lost-pack replacement − hardware write-off ($197.85/set over 36 months)
       − placement fees ($150/station over 12 months) − software</div>
  <p>Not included yet: founder or employee salaries, insurance, installation, marketing spend and taxes. This is contribution profit, not net income.</p>
  <h3>6. Monte Carlo, A/B and sensitivity</h3>
  <ul>
    <li><b>Monte Carlo:</b> replays the week N times with different random customers; reports the mean, a 95% confidence interval (mean ± 1.96·s/√N), P10–P90 and the chance of a profitable week.</li>
    <li><b>A/B:</b> uses common random numbers (identical customers for both layouts), so the difference isolates the layout effect.</li>
    <li><b>Sensitivity:</b> one-at-a-time low/high swings of each uncertain input; the ranking says which data to collect first (value of information).</li>
  </ul>
  <h3>7. Validation and known limits</h3>
  <ul>
    <li><b>Calibrated:</b> awareness is tuned so a 13-station network lands inside real operators' 0.5–3 rentals per station per day (Brick, ChargeSPOT Japan, a NYC operator). Rental duration is checked against Brick's ≈45 min median.</li>
    <li><b>Not yet validated against Charj's own data.</b> The pilot's rental logs (start/return station, time) will replace the calibrated and assumed inputs; then the model is tested on weeks it hasn't seen.</li>
    <li>The same person may count in two zones (e.g. subway then campus), which slightly overstates footfall. The calibration absorbs this.</li>
    <li>Walking uses grid distance (1.25 × straight line), not real street routing. Weather, academic calendar and special events are scenario switches, not continuous inputs.</li>
  </ul>
  <h3>8. Data still needed (in priority order)</h3>
  <ol>
    <li>Street survey of phone battery % at candidate sites, by hour → replaces <i>p_low</i>.</li>
    <li>Pilot rental logs → awareness/conversion, rental durations, return locations, forfeits.</li>
    <li>Signed host terms → venue share and placement fees.</li>
    <li>Bench test of the BST-0265 station → real pack recharge time.</li>
    <li>NYC DOT-style pedestrian counts on Broadway 110–116 St → retail footfall.</li>
  </ol>`;
}

// ───────────────────────── boot ─────────────────────────
renderData();
renderModel();
restart();
requestAnimationFrame(frame);
window.__charj = { get sim() { return sim; }, state };
