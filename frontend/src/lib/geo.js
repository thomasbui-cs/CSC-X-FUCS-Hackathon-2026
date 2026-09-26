// Distances in metres, and GeoJSON circles for "avoid this area" polygons sent to /api/route.
const EARTH = 6371000;
const rad = (d) => (d * Math.PI) / 180;

export function metres(a, b) {
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH * Math.asin(Math.sqrt(h));
}

// Ring of [lon, lat] pairs around a point, closed (last point = first) — MultiPolygon coordinate shape.
export function circle(center, radiusM, steps = 16) {
  const ring = [];
  for (let i = 0; i < steps; i++) {
    const t = (2 * Math.PI * i) / steps;
    const dLat = (radiusM * Math.cos(t)) / 111320;
    const dLon = (radiusM * Math.sin(t)) / (111320 * Math.cos(rad(center.lat)));
    ring.push([+(center.lon + dLon).toFixed(6), +(center.lat + dLat).toFixed(6)]);
  }
  ring.push(ring[0]);
  return ring;
}

// Closest distance from a point to a route line of [lat, lon] pairs (sampled, good enough at city scale).
export function distanceToLine(p, line) {
  let best = Infinity;
  for (let i = 0; i < line.length - 1; i++) {
    for (let t = 0; t <= 1; t += 0.1) {
      const q = {
        lat: line[i][0] + (line[i + 1][0] - line[i][0]) * t,
        lon: line[i][1] + (line[i + 1][1] - line[i][1]) * t,
      };
      best = Math.min(best, metres(p, q));
    }
  }
  return best;
}
