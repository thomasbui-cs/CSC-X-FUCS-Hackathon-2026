// Made-up photos with real GPS and dates, generated in memory — no real image files needed.
// Same places and counts as the build spec's demo generator (section 11), so the pipeline
// runs for real on stage without depending on phone EXIF support during the demo.
const DAY = 86400000;

const PLACES = [
  { name: 'The café on Rundle Street', lat: -34.9224, lon: 138.6072, n: 86 },
  { name: 'Rundle Mall', lat: -34.9224, lon: 138.6025, n: 41 },
  { name: 'Central Market', lat: -34.9296, lon: 138.5981, n: 33 },
  { name: 'Hindmarsh Square', lat: -34.9247, lon: 138.6054, n: 24 },
  { name: 'Home (safe place)', lat: -34.9334, lon: 138.6092, n: 120 },
];

let seed = 20260926;
const rand = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
};
const gauss = () => {
  let u = 0;
  let v = 0;
  while (!u) u = rand();
  while (!v) v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};

export function demoBreakUpDate() {
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  return new Date(today.getTime() - 54 * DAY);
}

export function demoPhotos() {
  seed = 20260926;
  const end = demoBreakUpDate();
  const start = new Date(end.getTime() - 900 * DAY);
  const span = end - start;
  const out = [];
  for (const place of PLACES) {
    for (let i = 0; i < place.n; i++) {
      out.push({
        name: place.name,
        lat: place.lat + Math.max(-1.5, Math.min(1.5, gauss())) * 0.0002, // roughly ±20m
        lon: place.lon + Math.max(-1.5, Math.min(1.5, gauss())) * 0.0002,
        takenAt: new Date(start.getTime() + rand() * span),
      });
    }
  }
  return out;
}

export const DEMO_HOME = {
  name: 'Home',
  lat: -34.9334,
  lon: 138.6092,
  radiusM: 90,
};
export const DEMO_DESTINATION = {
  name: 'Adelaide University',
  lat: -34.9208,
  lon: 138.6059,
};
