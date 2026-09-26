import test from 'node:test';
import assert from 'node:assert/strict';
import { filterPhotos, clusterPhotos, heat } from '../src/lib/spots.js';
import {
  demoPhotos,
  demoBreakUpDate,
  DEMO_HOME,
} from '../src/lib/demoPhotos.js';
import { routeAround } from '../src/lib/route.js';
import { save, load, forgetEverything } from '../src/lib/store.js';

const date = new Date('2026-01-01');
const spot = {
  lat: 0,
  lon: 0.005,
  radiusM: 100,
  weight: 1,
  baseCooldownDays: 60,
};
const usual = {
  minutes: 10,
  metres: 800,
  line: [
    [0, 0],
    [0, 0.01],
  ],
};
const from = { lat: 0, lon: 0 };
const to = { lat: 0, lon: 0.01 };

test('sample import excludes home and produces four hotspots', () => {
  const { kept, funnel } = filterPhotos(demoPhotos(), {
    start: null,
    end: demoBreakUpDate(),
    safe: [DEMO_HOME],
  });
  const spots = clusterPhotos(kept);
  assert.equal(spots.length, 4);
  assert.ok(funnel.kept < funnel.withLocation);
  assert.deepEqual(
    spots.map((s) => s.n),
    [86, 41, 33, 24]
  );
});

test('undated, invalid coordinates and safe-place photos are never placed', () => {
  const photos = [
    { lat: 0, lon: 0, takenAt: date },
    { lat: 1, lon: 1, takenAt: null },
    { lat: NaN, lon: 2, takenAt: date },
  ];
  assert.equal(
    filterPhotos(photos, {
      start: null,
      end: null,
      safe: [{ lat: 0, lon: 0, radiusM: 50 }],
    }).kept.length,
    0
  );
});

test('cooling, additional time and readiness affect heat', () => {
  assert.equal(heat(spot, {}, date, date), 1);
  const end = new Date(+date + 60 * 86400000);
  assert.equal(heat(spot, {}, end, date), 0);
  assert.ok(heat(spot, { extraDays: 30 }, end, date) > 0);
  assert.equal(heat(spot, { readyOn: '2026-01-01' }, date, date), 0);
});

test('remember restores metadata dates and forget clears storage', () => {
  const memory = new Map();
  globalThis.localStorage = {
    setItem: (k, v) => memory.set(k, v),
    getItem: (k) => memory.get(k),
    removeItem: (k) => memory.delete(k),
  };
  save({ remember: true, safe: [], start: date }, [
    { lat: 0, lon: 0, takenAt: date },
  ]);
  assert.equal(+load().photos[0].takenAt, +date);
  assert.equal(+load().settings.start, +date);
  forgetEverything();
  assert.equal(load(), null);
  delete globalThis.localStorage;
});

test('route uses avoidance polygons and reports a successful detour', async (t) => {
  const requests = [];
  t.mock.method(globalThis, 'fetch', async (_url, init) => {
    const payload = JSON.parse(init.body);
    requests.push(payload);
    return {
      ok: true,
      json: async () =>
        payload.polygons.length ? { ...usual, minutes: 15 } : usual,
    };
  });
  const route = await routeAround(from, to, [spot], {}, date, date);
  assert.equal(route.avoided.length, 1);
  assert.equal(route.partial, false);
  assert.equal(requests[1].polygons.length, 1);
});

test('unavailable avoidance is reported as partial, not a clear walk', async (t) => {
  t.mock.method(globalThis, 'fetch', async (_url, init) => {
    const avoid = JSON.parse(init.body).polygons.length;
    return {
      ok: !avoid,
      json: async () => (avoid ? { message: 'No route' } : usual),
    };
  });
  const route = await routeAround(from, to, [spot], {}, date, date);
  assert.equal(route.partial, true);
  assert.equal(route.avoided.length, 0);
});

test('aborted avoidance does not silently return the ordinary route', async (t) => {
  const controller = new globalThis.AbortController();
  t.mock.method(globalThis, 'fetch', async (_url, init) => {
    if (JSON.parse(init.body).polygons.length) {
      controller.abort();
      throw new Error('aborted');
    }
    return { ok: true, json: async () => usual };
  });
  await assert.rejects(
    routeAround(from, to, [spot], {}, date, date, controller.signal),
    /aborted/
  );
});

test('ready places stay out of route avoidance when previewing earlier dates', async (t) => {
  const readySpot = { ...spot, id: 'ready-place' };
  const states = { 'ready-place': { readyOn: '2026-02-01' } };
  assert.equal(heat(readySpot, states['ready-place'], date, date), 0);
  const requests = [];
  t.mock.method(globalThis, 'fetch', async (_url, init) => {
    requests.push(JSON.parse(init.body));
    return { ok: true, json: async () => usual };
  });
  const result = await routeAround(from, to, [readySpot], states, date, date);
  assert.equal(requests.length, 1);
  assert.deepEqual(requests[0].polygons, []);
  assert.deepEqual(result.avoided, []);
  assert.equal(result.partial, false);
});
