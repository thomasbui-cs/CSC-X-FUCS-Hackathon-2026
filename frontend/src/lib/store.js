// On-device only, and only if the person ticks "Remember my map". Photos are never stored:
// only extracted metadata, settings, safe places and choices per place.
const KEY = 'heatbreak:v1';

export function save(settings, photos = []) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ settings, photos }));
  } catch {
    // storage unavailable (private mode, quota, etc.) — safe to ignore
  }
}

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const value = JSON.parse(raw);
    const parsed = value.settings ?? value;
    if (!parsed.remember || !Array.isArray(parsed.safe)) return null;
    return {
      photos: (value.photos ?? []).map((p) => ({
        ...p,
        takenAt: p.takenAt ? new Date(p.takenAt) : null,
      })),
      settings: {
        ...parsed,
        start: parsed.start ? new Date(parsed.start) : null,
        end: parsed.end ? new Date(parsed.end) : null,
        breakUp: parsed.breakUp ? new Date(parsed.breakUp) : null,
      },
    };
  } catch {
    return null;
  }
}

export function forgetEverything() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
