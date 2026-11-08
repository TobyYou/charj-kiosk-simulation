// Geography of the Morningside Heights pilot area (W 96th – W 130th St, Manhattan).
// Subway coordinates: MTA GTFS (data.ny.gov 39hk-dx4f). Landmarks: OpenStreetMap Nominatim.
// Candidate host sites are approximate (±50 m): plausible host types, none signed yet.

export const ORIGIN = { lat: 40.8050, lon: -73.9640 };
const M_PER_DEG_LAT = 110540;
const M_PER_DEG_LON = 111320 * Math.cos((ORIGIN.lat * Math.PI) / 180);

export function toXY(lat, lon) {
  return { x: (lon - ORIGIN.lon) * M_PER_DEG_LON, y: (lat - ORIGIN.lat) * M_PER_DEG_LAT };
}
export function toLatLon(x, y) {
  return { lat: ORIGIN.lat + y / M_PER_DEG_LAT, lon: ORIGIN.lon + x / M_PER_DEG_LON };
}
// Manhattan street grid: walking distance ≈ 1.25 × straight-line distance.
export const GRID_FACTOR = 1.25;
export function walkDist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y) * GRID_FACTOR;
}

// Footfall zones: places where people are, and where they start and end trips.
// `footfallKey` points to a parameter in params.js (people passing per day).
// `profile` picks the hour-of-day curve. `weekendFactor` (subway) = MTA 2024 avg weekend day ÷ avg weekday. `pOutside` is the share of trips from here that leave the area.
export const ZONES = [
  { id: 'z96',   name: '96 St subway (1/2/3)',            lat: 40.793919, lon: -73.972323, type: 'subway', footfallKey: 'footfall_96st',   profile: 'subway',   pOutside: 0.45, weekendFactor: 0.73 },
  { id: 'z103',  name: '103 St subway (1)',               lat: 40.799446, lon: -73.968379, type: 'subway', footfallKey: 'footfall_103st',  profile: 'subway',   pOutside: 0.45, weekendFactor: 0.6 },
  { id: 'z110',  name: 'Cathedral Pkwy–110 St subway (1)', lat: 40.803967, lon: -73.966847, type: 'subway', footfallKey: 'footfall_110st',  profile: 'subway',   pOutside: 0.45, weekendFactor: 0.62 },
  { id: 'z116',  name: '116 St–Columbia subway (1)',      lat: 40.807722, lon: -73.96411, type: 'subway', footfallKey: 'footfall_116st',  profile: 'subway',   pOutside: 0.45, weekendFactor: 0.49 },
  { id: 'z125',  name: '125 St subway (1)',               lat: 40.815581, lon: -73.958372, type: 'subway', footfallKey: 'footfall_125st',  profile: 'subway',   pOutside: 0.45, weekendFactor: 0.55 },
  { id: 'zCU',   name: 'Columbia main campus',            lat: 40.8075, lon: -73.9626, type: 'campus', footfallKey: 'footfall_columbia', profile: 'campus', pOutside: 0.15 },
  { id: 'zBC',   name: 'Barnard College',                 lat: 40.809486, lon: -73.963551, type: 'campus', footfallKey: 'footfall_barnard',  profile: 'campus', pOutside: 0.15 },
  { id: 'zTC',   name: 'Teachers College',                lat: 40.810344, lon: -73.960504, type: 'campus', footfallKey: 'footfall_tc',       profile: 'campus', pOutside: 0.20 },
  { id: 'zMV',   name: 'Manhattanville campus',           lat: 40.817666, lon: -73.958514, type: 'campus', footfallKey: 'footfall_mville',   profile: 'campus', pOutside: 0.25 },
  { id: 'zBWY',  name: 'Broadway retail 110–116 St',      lat: 40.8058, lon: -73.9655, type: 'retail', footfallKey: 'footfall_broadway', profile: 'dining', pOutside: 0.30 },
  { id: 'zAMS',  name: 'Amsterdam Ave dining 105–112 St', lat: 40.8025, lon: -73.9640, type: 'retail', footfallKey: 'footfall_amsterdam', profile: 'dining', pOutside: 0.30 },
  { id: 'zMS',   name: 'Mount Sinai Morningside',         lat: 40.805237, lon: -73.961388, type: 'hospital', footfallKey: 'footfall_hospital', profile: 'hospital', pOutside: 0.35 },
];

// Candidate kiosk sites. `live: true` = in the Charj database today (reference/04-app-data-model).
// The rest are plausible host types from the pitch (cafés, restaurants, bookstores, bars, gyms,
// hotels); none is a signed host yet.
export const SITES = [
  { id: 'hunan',   name: 'Happy Hot Hunan · 969 Amsterdam Ave', lat: 40.801332, lon: -73.964665, live: true,  hostType: 'restaurant' },
  { id: 'lerner',  name: 'Lerner Hall lobby · Columbia',       lat: 40.806836, lon: -73.964010, live: true,  hostType: 'campus' },
  { id: 'butler',  name: 'Butler Library area · Columbia',     lat: 40.806374, lon: -73.963186, live: false, hostType: 'campus' },
  { id: 'bwy112',  name: 'Café · Broadway & 112th',            lat: 40.8050, lon: -73.9660, live: false, hostType: 'café' },
  { id: 'bwy116',  name: 'Bookstore · Broadway & 115th',       lat: 40.8072, lon: -73.9645, live: false, hostType: 'bookstore' },
  { id: 'barnard', name: 'Barnard Diana Center',               lat: 40.8100, lon: -73.9636, live: false, hostType: 'campus' },
  { id: 'ams111',  name: 'Bar · Amsterdam & 111th',            lat: 40.8040, lon: -73.9636, live: false, hostType: 'bar' },
  { id: 'tc120',   name: 'Café · W 120th near Teachers College', lat: 40.8098, lon: -73.9614, live: false, hostType: 'café' },
  { id: 'bwy104',  name: 'Gym · Broadway & 104th',             lat: 40.7998, lon: -73.9680, live: false, hostType: 'gym' },
  { id: 'bwy97',   name: 'Deli · Broadway & 97th',             lat: 40.7945, lon: -73.9718, live: false, hostType: 'deli (24h)' },
  { id: 'bwy125',  name: 'Restaurant · Broadway & 125th',      lat: 40.8150, lon: -73.9590, live: false, hostType: 'restaurant' },
  { id: 'mville',  name: 'Manhattanville · W 130th',           lat: 40.8172, lon: -73.9572, live: false, hostType: 'campus' },
  { id: 'sinai',   name: 'Mount Sinai Morningside lobby',      lat: 40.8050, lon: -73.9618, live: false, hostType: 'hospital (24h)' },
];

for (const z of ZONES) Object.assign(z, toXY(z.lat, z.lon));
for (const s of SITES) Object.assign(s, toXY(s.lat, s.lon));

// Persona mix by zone type (shares sum to 1).
export const PERSONA_MIX = {
  subway:   { student: 0.30, worker: 0.40, resident: 0.20, visitor: 0.10 },
  campus:   { student: 0.75, worker: 0.20, resident: 0.00, visitor: 0.05 },
  retail:   { student: 0.35, worker: 0.20, resident: 0.30, visitor: 0.15 },
  hospital: { student: 0.05, worker: 0.55, resident: 0.15, visitor: 0.25 },
};

// Typical stay at the destination (median minutes, log-sd) by persona.
export const DWELL = {
  student:  { median: 110, sigma: 0.6 },
  worker:   { median: 240, sigma: 0.5 },
  resident: { median: 75,  sigma: 0.7 },
  visitor:  { median: 60,  sigma: 0.6 },
};
