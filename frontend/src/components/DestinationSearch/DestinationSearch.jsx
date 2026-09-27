import { useEffect, useRef, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export default function DestinationSearch({
  destination,
  onSelectDestination,
  onSelectDeparture,
  marking,
  onMark,
}) {
  const [queryDeparture, setQueryDeparture] = useState('');
  const [queryDestination, setQueryDestination] = useState('');
  const [resultsDestination, setResultsDestination] = useState([]);
  const [resultsDeparture, setResultsDeparture] = useState([]);
  const [messageDestination, setMessageDestination] = useState('');
  const [messageDeparture, setMessageDeparture] = useState('');
  const [loadingDestination, setLoadingDestination] = useState(false);
  const [loadingDeparture, setLoadingDeparture] = useState(false);
  const request = useRef(null);

  useEffect(() => () => request.current?.abort(), []);

  function reset() {
    request.current?.abort();
    request.current = null;
    setLoadingDestination(false);
    setResultsDestination([]);
    setMessageDestination('');
  }

  async function searchDestination(event) {
    event.preventDefault();
    reset();
    const controller = new AbortController();
    request.current = controller;
    setLoadingDestination(true);
    try {
      const res = await fetch(
        `${API_URL}/api/places?q=${encodeURIComponent(queryDestination.trim())}`,
        { signal: controller.signal }
      );
      if (!res.ok)
        throw new Error('Search unavailable. Retry or place a pin on the map.');
      const places = await res.json();
      if (request.current !== controller) return;
      setResultsDestination(places);
      setMessageDestination(
        places.length
          ? 'Choose a destination below.'
          : 'No places found. Try a street, suburb, or city.'
      );
    } catch (error) {
      if (!controller.signal.aborted) setMessageDestination(error.message);
    } finally {
      if (request.current === controller) setLoadingDestination(false);
    }
  }

  async function searchDeparture(event) {
    event.preventDefault();
    reset();
    const controller = new AbortController();
    request.current = controller;
    setLoadingDeparture(true);
    try {
      const res = await fetch(
        `${API_URL}/api/places?q=${encodeURIComponent(queryDeparture.trim())}`,
        { signal: controller.signal }
      );
      if (!res.ok)
        throw new Error('Search unavailable. Retry or place a pin on the map.');
      const places = await res.json();
      if (request.current !== controller) return;
      setResultsDeparture(places);
      setMessageDeparture(
        places.length
          ? 'Choose a destination below.'
          : 'No places found. Try a street, suburb, or city.'
      );
    } catch (error) {
      if (!controller.signal.aborted) setMessageDeparture(error.message);
    } finally {
      if (request.current === controller) setLoadingDeparture(false);
    }
  }

  return (
    <section
      id="destination"
      className="grid gap-3 rounded-lg border border-slate-200 p-4"
    >
      <h2 className="font-semibold"> Where are you walking?</h2>
      {destination && (
        <div className="rounded-md bg-sky-50 p-2 text-sm">
          <strong>Destination: </strong>
          {destination.name}
          <button
            className="ml-2 underline"
            onClick={() => {
              reset();
              onSelectDestination(null);
            }}
          >
            Clear
          </button>
        </div>
      )}
      <form className=" gap-2">
        <div>
          <input
            aria-label="Search Departure"
            value={queryDeparture}
            onChange={(e) => {
              reset();
              setQueryDeparture(e.target.value);
            }}
            placeholder="Place, address, or city"
            className="min-w-0 flex-1 rounded-md border border-slate-300 px-2 py-2 text-sm"
          />
          <button
            disabled={loadingDeparture || queryDeparture.trim().length < 3}
            className="rounded-md bg-slate-900 px-3 text-sm text-white disabled:opacity-40"
            onClick={searchDeparture}
          >
            Search Departure
          </button>
        </div>
        <div>
          <input
            aria-label="Search destination"
            value={queryDestination}
            onChange={(e) => {
              reset();
              setQueryDestination(e.target.value);
            }}
            placeholder="Place, address, or city"
            className="min-w-0 flex-1 rounded-md border border-slate-300 px-2 py-2 text-sm"
          />
          <button
            disabled={loadingDestination || queryDestination.trim().length < 3}
            className="rounded-md bg-slate-900 px-3 text-sm text-white disabled:opacity-40"
            onClick={searchDestination}
          >
            Search Destination
          </button>
        </div>
      </form>
      <p role="status" className="text-sm text-slate-500">
        {loadingDestination ? 'Searching…' : messageDestination}
      </p>
      <ul className="max-h-52 overflow-auto">
        {resultsDestination.map((place) => (
          <li key={`${place.lat},${place.lon}`}>
            <button
              onClick={() => {
                reset();
                onSelectDestination(place);
              }}
              className="w-full rounded-md p-2 text-left text-sm hover:bg-sky-50"
            >
              {place.name}
            </button>
          </li>
        ))}
      </ul>
      <ul className="max-h-52 overflow-auto">
        {resultsDeparture.map((place) => (
          <li key={`${place.lat},${place.lon}`}>
            <button
              onClick={() => {
                reset();
                onSelectDeparture(place);
              }}
              className="w-full rounded-md p-2 text-left text-sm hover:bg-sky-50"
            >
              {place.name}
            </button>
          </li>
        ))}
      </ul>
      <button
        onClick={onMark}
        className="rounded-md border border-slate-300 px-3 py-2 text-sm"
      >
        {marking ? 'Cancel destination pin' : 'Choose destination on map'}
      </button>
      <p className="text-xs text-slate-500">
        Search uses{' '}
        <a className="underline" href="https://www.openstreetmap.org/copyright">
          OpenStreetMap
        </a>
        . Search terms are sent to the search service only when you press
        Search.
      </p>
    </section>
  );
}
