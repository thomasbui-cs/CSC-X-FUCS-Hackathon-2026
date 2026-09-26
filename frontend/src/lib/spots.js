// Which photos count, which places they form, and how warm each place is.
// See the build spec section 06: heat falls in a straight line from break-up day
// to zero at the end of the cooldown; cooldown grows with log2(photo count).
import { metres } from './geo';

const DAY = 86400000;

export function filterPhotos(photos, { start, end, safe }) {
  const withLoc = photos.filter((p) => p.lat != null && p.lon != null);
  const inDates = withLoc.filter(
    (p) =>
      (!start && !end) ||
      (p.takenAt && (!start || p.takenAt >= start) && (!end || p.takenAt < new Date(+end + DAY))),
  );
  const kept = inDates.filter((p) => !safe.some((s) => metres(p, s) < s.radiusM));
  return {
    kept,
    funnel: { read: photos.length, withLocation: withLoc.length, inDates: inDates.length, kept: kept.length },
  };
}

// A photo joins the nearest place within joinM, or starts a new one. Places need minPhotos+.
export function clusterPhotos(photos, joinM = 60, minPhotos = 2) {
  const places = [];
  for (const p of [...photos].sort((a, b) => a.lat - b.lat || a.lon - b.lon)) {
    let best = null;
    let bd = joinM;
    for (const c of places) {
      const d = metres(c, p);
      if (d < bd) {
        bd = d;
        best = c;
      }
    }
    if (best) {
      best.photos.push(p);
      const n = best.photos.length;
      best.lat += (p.lat - best.lat) / n;
      best.lon += (p.lon - best.lon) / n;
    } else {
      places.push({ lat: p.lat, lon: p.lon, photos: [p] });
    }
  }
  // Greedy grouping can start a second place at the edge of a busy one: merge centres closer than joinM.
  for (let merged = true; merged; ) {
    merged = false;
    outer: for (let i = 0; i < places.length; i++) {
      for (let j = i + 1; j < places.length; j++) {
        if (metres(places[i], places[j]) < joinM) {
          const a = places[i];
          const b = places.splice(j, 1)[0];
          const na = a.photos.length;
          const nb = b.photos.length;
          a.lat = (a.lat * na + b.lat * nb) / (na + nb);
          a.lon = (a.lon * na + b.lon * nb) / (na + nb);
          a.photos.push(...b.photos);
          merged = true;
          break outer;
        }
      }
    }
  }
  const real = places.filter((c) => c.photos.length >= minPhotos);
  const nMax = Math.max(20, ...real.map((c) => c.photos.length));
  return real
    .map((c) => {
      const n = c.photos.length;
      const L2 = Math.log2(1 + n);
      return {
        id: `${c.lat.toFixed(4)},${c.lon.toFixed(4)}`,
        lat: c.lat,
        lon: c.lon,
        n,
        radiusM: Math.round(36 + 16 * L2),
        weight: 0.35 + (0.65 * L2) / Math.log2(1 + nMax),
        baseCooldownDays: Math.round(30 * L2),
      };
    })
    .sort((a, b) => b.n - a.n);
}

export const daysSince = (from, now) => Math.max(0, Math.floor((now - from) / DAY));
const cooldown = (spot, st) => spot.baseCooldownDays + (st?.extraDays || 0);

// 0 = cold. Falls in a straight line from the spot's weight on break-up day to 0 at the end of its cooldown.
export function heat(spot, st, now, breakUp) {
  if (st?.reclaimedOn || st?.readyOn) return 0;
  return spot.weight * Math.max(0, 1 - daysSince(breakUp, now) / cooldown(spot, st));
}

export function status(spot, st, now, breakUp) {
  if (st?.reclaimedOn) return 'reclaimed';
  const h = heat(spot, st, now, breakUp);
  return h <= 0 ? 'cooled' : h / spot.weight > 0.5 ? 'hot' : 'cooling';
}

export function daysLeft(spot, st, now, breakUp) {
  return heat(spot, st, now, breakUp) > 0 ? Math.ceil(cooldown(spot, st) - daysSince(breakUp, now)) : 0;
}

// Attaches heat/status/daysLeft to each raw spot, ready for HeatbreakMap and PlaceSheet.
export function withLiveState(spots, states, now, breakUp) {
  return spots.map((spot) => {
    const st = states[spot.id];
    return {
      ...spot,
      heat: heat(spot, st, now, breakUp),
      status: status(spot, st, now, breakUp),
      daysLeft: daysLeft(spot, st, now, breakUp),
    };
  });
}
