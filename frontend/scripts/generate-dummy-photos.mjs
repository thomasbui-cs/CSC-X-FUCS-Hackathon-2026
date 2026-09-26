// Writes 100 dummy JPEGs to demo-photos/ for demonstrating hotspot highlighting through the real upload path.
// Each file is a blank 8x8 grey image; only its EXIF GPS position and date matter.
// Photos are clustered around Adelaide CBD places and dated within the 6 months before today.
// Usage: node scripts/generate-dummy-photos.mjs [outDir]
import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const DAY = 86400000;
const OUT =
  process.argv[2] ?? new URL('../demo-photos/', import.meta.url).pathname;

// Bigger clusters become hotter, larger hotspots. spreadM is how far photos stray from the centre.
const PLACES = [
  {
    name: 'Rundle Street cafe',
    lat: -34.9224,
    lon: 138.6072,
    n: 10,
    spreadM: 45,
  },
  { name: 'Rundle Mall', lat: -34.9227, lon: 138.6015, n: 8, spreadM: 45 },
  { name: 'Victoria Square', lat: -34.9285, lon: 138.6007, n: 6, spreadM: 45 },
  { name: 'Central Market', lat: -34.9296, lon: 138.5981, n: 5, spreadM: 40 },
  { name: 'Hindmarsh Square', lat: -34.9247, lon: 138.6054, n: 4, spreadM: 40 },
  { name: 'Light Square', lat: -34.9235, lon: 138.5935, n: 3, spreadM: 35 },
  // Same spot as DEMO_HOME in src/lib/demoPhotos.js: marking it as a safe place (90m) removes this hotspot.
  { name: 'Home', lat: -34.9334, lon: 138.6092, n: 50, spreadM: 25 },
];

// One-off photos anywhere inside the four terraces. Most stay alone and never form a hotspot.
const SCATTERED = 14;
const CBD = {
  north: -34.9206,
  south: -34.9395,
  west: 138.5875,
  east: 138.6135,
};

// Minimal 8x8 grey baseline JPEG with no metadata segments.
const BLANK_JPEG = Buffer.from(
  '/9j/wAALCAAIAAgBAREA/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/9sAQwAbGxsbGxsvGxsvQi8vL0JZQkJCQllwWVlZWVlwiHBwcHBwcIiIiIiIiIiIo6Ojo6Ojvr6+vr7V1dXV1dXV1dXV/90ABAAB/9oACAEBAAA/ANav/9k=',
  'base64'
);

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

// --- EXIF (little-endian TIFF) ---
const ASCII = 2;
const SHORT = 3;
const LONG = 4;
const RATIONAL = 5;
const BYTE = 1;

const ascii = (s) => Buffer.from(`${s}\0`, 'latin1');
const long = (n) => {
  const b = Buffer.alloc(4);
  b.writeUInt32LE(n);
  return b;
};
const rationals = (pairs) => {
  const b = Buffer.alloc(8 * pairs.length);
  pairs.forEach(([num, den], i) => {
    b.writeUInt32LE(num, i * 8);
    b.writeUInt32LE(den, i * 8 + 4);
  });
  return b;
};
const dms = (deg) => {
  const a = Math.abs(deg);
  const d = Math.floor(a);
  const m = Math.floor((a - d) * 60);
  const s = Math.round(((a - d) * 60 - m) * 60 * 10000);
  return rationals([
    [d, 1],
    [m, 1],
    [s, 10000],
  ]);
};
const SIZE = { [BYTE]: 1, [ASCII]: 1, [SHORT]: 2, [LONG]: 4, [RATIONAL]: 8 };
const entry = (tag, type, value) => ({
  tag,
  type,
  count: value.length / SIZE[type],
  value,
});

// Serialises one IFD at `offset`; values over 4 bytes go in a data area straight after it.
function ifd(entries, offset) {
  const sorted = [...entries].sort((a, b) => a.tag - b.tag);
  const head = Buffer.alloc(2 + 12 * sorted.length + 4);
  const data = [];
  let dataOffset = offset + head.length;
  head.writeUInt16LE(sorted.length, 0);
  sorted.forEach((e, i) => {
    const at = 2 + 12 * i;
    head.writeUInt16LE(e.tag, at);
    head.writeUInt16LE(e.type, at + 2);
    head.writeUInt32LE(e.count, at + 4);
    if (e.value.length <= 4) e.value.copy(head, at + 8);
    else {
      head.writeUInt32LE(dataOffset, at + 8);
      const padded =
        e.value.length % 2
          ? Buffer.concat([e.value, Buffer.alloc(1)])
          : e.value;
      data.push(padded);
      dataOffset += padded.length;
    }
  });
  return Buffer.concat([head, ...data]);
}

function exifSegment({ lat, lon, takenAt }) {
  const stamp = exifDate(takenAt);
  const gps = [
    entry(0x0000, BYTE, Buffer.from([2, 3, 0, 0])),
    entry(0x0001, ASCII, ascii(lat < 0 ? 'S' : 'N')),
    entry(0x0002, RATIONAL, dms(lat)),
    entry(0x0003, ASCII, ascii(lon < 0 ? 'W' : 'E')),
    entry(0x0004, RATIONAL, dms(lon)),
  ];
  const exif = [
    entry(0x9003, ASCII, ascii(stamp)), // DateTimeOriginal
    entry(0x9004, ASCII, ascii(stamp)), // CreateDate
  ];
  // Pointer values don't change IFD sizes, so lay out once with placeholders to find offsets.
  const ifd0 = (exifAt, gpsAt) => [
    entry(0x0132, ASCII, ascii(stamp)), // DateTime
    entry(0x8769, LONG, long(exifAt)),
    entry(0x8825, LONG, long(gpsAt)),
  ];
  const ifd0Len = ifd(ifd0(0, 0), 8).length;
  const exifAt = 8 + ifd0Len;
  const exifBuf = ifd(exif, exifAt);
  const gpsAt = exifAt + exifBuf.length;
  const tiff = Buffer.concat([
    Buffer.from([0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00]),
    ifd(ifd0(exifAt, gpsAt), 8),
    exifBuf,
    ifd(gps, gpsAt),
  ]);
  const body = Buffer.concat([Buffer.from('Exif\0\0', 'latin1'), tiff]);
  const head = Buffer.from([0xff, 0xe1, 0, 0]);
  head.writeUInt16BE(body.length + 2, 2);
  return Buffer.concat([head, body]);
}

// EXIF dates carry no time zone; readers treat them as the device's local time.
const pad = (n) => String(n).padStart(2, '0');
const exifDate = (d) =>
  `${d.getFullYear()}:${pad(d.getMonth() + 1)}:${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

// --- Generate ---
const now = new Date();
const sixMonthsAgo = new Date(now);
sixMonthsAgo.setMonth(now.getMonth() - 6);
const span = now - DAY - sixMonthsAgo; // stop a day short so nothing lands in the future

const M_PER_DEG_LAT = 111320;
const M_PER_DEG_LON = M_PER_DEG_LAT * Math.cos((-34.93 * Math.PI) / 180);

const randomDate = () => {
  const d = new Date(+sixMonthsAgo + rand() * span);
  d.setHours(
    8 + Math.floor(rand() * 14),
    Math.floor(rand() * 60),
    Math.floor(rand() * 60)
  );
  return d;
};
// Normal scatter clamped to 2 sigma, so no photo lands further than spreadM from the centre.
const offsetM = (spreadM) => (Math.max(-2, Math.min(2, gauss())) * spreadM) / 2;

const photos = [];
for (const place of PLACES) {
  for (let i = 0; i < place.n; i++) {
    const takenAt = randomDate();
    photos.push({
      lat: place.lat + offsetM(place.spreadM) / M_PER_DEG_LAT,
      lon: place.lon + offsetM(place.spreadM) / M_PER_DEG_LON,
      takenAt,
    });
  }
}
for (let i = 0; i < SCATTERED; i++) {
  const takenAt = randomDate();
  photos.push({
    lat: CBD.south + rand() * (CBD.north - CBD.south),
    lon: CBD.west + rand() * (CBD.east - CBD.west),
    takenAt,
  });
}
photos.sort((a, b) => a.takenAt - b.takenAt);

mkdirSync(OUT, { recursive: true });
for (const f of readdirSync(OUT))
  if (/^IMG_\d+\.jpg$/.test(f)) rmSync(join(OUT, f));
photos.forEach((p, i) => {
  const file = `IMG_${String(1001 + i)}.jpg`;
  writeFileSync(
    join(OUT, file),
    Buffer.concat([
      BLANK_JPEG.subarray(0, 2),
      exifSegment(p),
      BLANK_JPEG.subarray(2),
    ])
  );
});

const counts = [
  ...PLACES.map((p) => `${p.name} ${p.n}`),
  `scattered ${SCATTERED}`,
].join(', ');
console.log(`Wrote ${photos.length} photos to ${OUT}`);
console.log(
  `Dates ${exifDate(photos[0].takenAt)} to ${exifDate(photos.at(-1).takenAt)}`
);
console.log(counts);
