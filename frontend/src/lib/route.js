// The usual walk, and a walk around places that are still warm.
// Talks to our NestJS backend's POST /api/route (backend/src/route), which proxies
// OpenRouteService and keeps the API key server-side. See build spec section 07.
import { circle, distanceToLine } from './geo';
import { heat } from './spots';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
const MAX_EXTRA_MIN = 15;

async function getRoute(from, to, polygons) {
  const res = await fetch(`${API_URL}/api/route`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: [from.lon, from.lat], to: [to.lon, to.lat], polygons }),
  });
  const body = await res.json();
  if (!res.ok) {
    const message = Array.isArray(body.message) ? body.message.join(', ') : body.message;
    throw new Error(message ?? body.error ?? 'Route request failed');
  }
  return body; // { minutes, metres, line: [[lat, lon], ...] }
}

// The routing service avoids areas completely, not a little. So: avoid every warm place near
// the usual walk; if that gives no route or a silly detour, let the coolest place back in and retry.
export async function routeAround(from, to, spots, states, now, breakUp) {
  const usual = await getRoute(from, to, []);
  let warm = spots
    .map((s) => ({ s, h: heat(s, states[s.id], now, breakUp) }))
    .filter(({ s, h }) => h > 0.05 && distanceToLine(s, usual.line) < s.radiusM * 1.5)
    .sort((a, b) => b.h - a.h);

  while (warm.length) {
    try {
      const r = await getRoute(
        from,
        to,
        warm.map(({ s }) => [circle(s, s.radiusM * 1.2)]),
      );
      if (r.minutes - usual.minutes <= MAX_EXTRA_MIN) {
        return { usual, heatbreak: r, avoided: warm.map((w) => w.s) };
      }
    } catch {
      // no route with all of these avoided
    }
    warm = warm.slice(0, -1); // drop the coolest and retry
  }
  return { usual, heatbreak: usual, avoided: [] };
}
