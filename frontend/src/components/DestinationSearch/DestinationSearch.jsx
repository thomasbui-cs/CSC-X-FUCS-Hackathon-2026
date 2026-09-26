import { useEffect, useRef, useState } from 'react';

// Free, client-only reverse geocoding — no key, no server. Debounced, biased to Adelaide's
// city centre bounding box for relevance. See build spec's "stretch" list, section 01.
const ADELAIDE_VIEWBOX = '138.55,-34.90,138.65,-34.96';

export default function DestinationSearch({ destination, onSelect }) {
  const [query, setQuery] = useState(destination?.name ?? '');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const abortRef = useRef(null);

  const tooShort = query.trim().length < 3 || query === destination?.name;

  useEffect(() => {
    if (tooShort) return; // nothing to fetch — dropdown is hidden via `tooShort` below regardless
    const handle = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&viewbox=${ADELAIDE_VIEWBOX}&bounded=1&q=${encodeURIComponent(query)}`;
        const res = await fetch(url, { signal: controller.signal });
        const body = await res.json();
        setResults(body.map((r) => ({ name: r.display_name, lat: +r.lat, lon: +r.lon })));
        setOpen(true);
      } catch {
        // aborted or offline: leave results as-is
      }
    }, 400);
    return () => clearTimeout(handle);
  }, [query, tooShort]);

  return (
    <section className="relative grid gap-2 rounded-lg border border-slate-200 p-4">
      <h2 className="font-semibold">Destination</h2>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => !tooShort && results.length && setOpen(true)}
        placeholder="Search for where you're walking to…"
        className="rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-900"
      />
      {open && !tooShort && results.length > 0 && (
        <ul className="absolute top-full left-0 z-10 mt-1 max-h-48 w-full overflow-auto rounded-md border border-slate-200 bg-white shadow-lg">
          {results.map((r) => (
            <li key={`${r.lat},${r.lon}`}>
              <button
                type="button"
                onClick={() => {
                  onSelect(r);
                  setQuery(r.name);
                  setOpen(false);
                }}
                className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
              >
                {r.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
