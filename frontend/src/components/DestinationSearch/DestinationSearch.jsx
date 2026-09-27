import { useEffect, useRef, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
const MIN_QUERY_LENGTH = 3;

function usePlaceSearch(onSelect) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const requestRef = useRef(null);

  useEffect(() => () => requestRef.current?.abort(), []);

  function reset() {
    requestRef.current?.abort();
    requestRef.current = null;
    setLoading(false);
    setResults([]);
    setMessage('');
  }

  async function search(event) {
    event.preventDefault();
    reset();
    const trimmed = query.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) return;
    const controller = new AbortController();
    requestRef.current = controller;
    setLoading(true);
    try {
      const res = await fetch(
        `${API_URL}/api/places?q=${encodeURIComponent(trimmed)}`,
        { signal: controller.signal }
      );
      if (!res.ok) {
        throw new Error(
          'Search unavailable. Retry or place a pin on the map.'
        );
      }
      const places = await res.json();
      if (requestRef.current !== controller) return;
      setResults(places);
      if (!places.length) {
        setMessage('No places found. Try a street, suburb, or city.');
      }
    } catch (error) {
      if (!controller.signal.aborted) setMessage(error.message);
    } finally {
      if (requestRef.current === controller) setLoading(false);
    }
  }

  function select(place) {
    reset();
    setQuery('');
    onSelect(place);
  }

  function clear() {
    reset();
    setQuery('');
    onSelect(null);
  }

  return { query, setQuery, results, message, loading, search, select, clear };
}

function PlaceField({
  label,
  dotClassName,
  placeholder,
  value,
  onSelect,
  marking,
  onMark,
  markLabel,
}) {
  const { query, setQuery, results, message, loading, search, select, clear } =
    usePlaceSearch(onSelect);

  return (
    <div className="grid min-w-0 gap-2">
      <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${dotClassName}`} />
        {label}
      </label>

      {value ? (
        <div className="flex min-w-0 items-center justify-between gap-2 rounded-md bg-sky-50 px-3 py-2 text-sm">
          <span className="min-w-0 truncate">{value.name}</span>
          <button
            type="button"
            className="shrink-0 text-slate-500 underline hover:text-slate-700"
            onClick={clear}
          >
            Clear
          </button>
        </div>
      ) : (
        <>
          <form className="flex gap-2" onSubmit={search}>
            <input
              aria-label={label}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading || query.trim().length < MIN_QUERY_LENGTH}
              className="shrink-0 rounded-md bg-slate-900 px-4 text-sm font-medium text-white disabled:opacity-40"
            >
              {loading ? 'Searching…' : 'Search'}
            </button>
          </form>

          {message && (
            <p role="status" className="text-sm text-slate-500">
              {message}
            </p>
          )}

          {results.length > 0 && (
            <ul className="max-h-48 divide-y divide-slate-100 overflow-auto rounded-md border border-slate-200">
              {results.map((place) => (
                <li key={`${place.lat},${place.lon}`}>
                  <button
                    type="button"
                    onClick={() => select(place)}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-sky-50"
                  >
                    {place.name}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {onMark && (
            <button
              type="button"
              onClick={onMark}
              className={`rounded-md border px-3 py-2 text-sm ${
                marking
                  ? 'border-sky-500 bg-sky-50 text-sky-700'
                  : 'border-slate-300 text-slate-700 hover:border-slate-400'
              }`}
            >
              {marking ? 'Tap the map… (cancel)' : markLabel}
            </button>
          )}
        </>
      )}
    </div>
  );
}

export default function DestinationSearch({
  departure,
  destination,
  onSelectDeparture,
  onSelectDestination,
  markingDeparture,
  onMarkDeparture,
  markingDestination,
  onMarkDestination,
}) {
  return (
    <section
      id="destination"
      className="grid min-w-0 gap-4 rounded-lg border border-slate-200 p-4"
    >
      <h2 className="font-semibold">Where are you walking?</h2>

      <PlaceField
        label="Starting point"
        dotClassName="bg-slate-900"
        placeholder="Home, a street, or a suburb"
        value={departure}
        onSelect={onSelectDeparture}
        marking={markingDeparture}
        onMark={onMarkDeparture}
        markLabel="Choose starting point on map"
      />

      <PlaceField
        label="Destination"
        dotClassName="bg-sky-500"
        placeholder="Uni, work, a café…"
        value={destination}
        onSelect={onSelectDestination}
        marking={markingDestination}
        onMark={onMarkDestination}
        markLabel="Choose destination on map"
      />

      <p className="text-xs text-slate-500">
        Search uses{' '}
        <a
          className="underline"
          href="https://www.openstreetmap.org/copyright"
        >
          OpenStreetMap
        </a>
        . Search terms are sent to the search service only when you press
        Search.
      </p>
    </section>
  );
}
