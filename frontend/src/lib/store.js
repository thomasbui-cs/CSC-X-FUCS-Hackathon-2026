// On-device only, and only if the person ticks "Remember my map". Photos are never stored:
// just settings, safe places and choices per place.
const KEY = 'heatbreak:v1';

export function save(settings) {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    // storage unavailable (private mode, quota, etc.) — safe to ignore
  }
}

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      ...parsed,
      start: parsed.start ? new Date(parsed.start) : null,
      end: parsed.end ? new Date(parsed.end) : null,
      breakUp: parsed.breakUp ? new Date(parsed.breakUp) : null,
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
