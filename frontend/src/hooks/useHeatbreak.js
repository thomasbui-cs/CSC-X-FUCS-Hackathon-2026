import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { readPhotos } from '../lib/photos';
import {
  filterPhotos,
  clusterPhotos,
  withLiveState,
  daysSince,
} from '../lib/spots';
import { routeAround } from '../lib/route';
import { save, load, forgetEverything as clearStore } from '../lib/store';
import {
  demoPhotos,
  demoBreakUpDate,
  DEMO_HOME,
  DEMO_DESTINATION,
} from '../lib/demoPhotos';

const DAY = 86400000;

const emptySettings = () => ({
  start: null,
  end: null,
  breakUp: null,
  safe: [],
  destination: null,
  states: {},
  remember: false,
});

export function useHeatbreak() {
  const [initial] = useState(() => load());
  const [settings, setSettings] = useState(
    () => initial?.settings ?? emptySettings()
  );
  const [photos, setPhotos] = useState(() => initial?.photos ?? []);
  const [uploading, setUploading] = useState(false);
  const importId = useRef(0);
  const [planVersion, setPlanVersion] = useState(0);
  const [uploadNote, setUploadNote] = useState('');
  const [resetKey, setResetKey] = useState(0);
  const [selectedId, setSelectedId] = useState(null);
  const [previewDays, setPreviewDays] = useState(null); // null = "today"
  const [fetchedRoute, setFetchedRoute] = useState(null);
  const [routeError, setRouteError] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);

  useEffect(() => {
    if (settings.remember) save(settings, photos);
    else clearStore();
  }, [settings, photos]);

  const breakUp = useMemo(
    () => settings.breakUp ?? new Date(),
    [settings.breakUp]
  );
  const now = useMemo(
    () =>
      previewDays == null ? new Date() : new Date(+breakUp + previewDays * DAY),
    [previewDays, breakUp]
  );
  const previewDisplayDays = previewDays ?? daysSince(breakUp, now);

  const { kept, funnel } = useMemo(
    () =>
      filterPhotos(photos, {
        start: settings.start,
        end: settings.end,
        safe: settings.safe,
      }),
    [photos, settings.start, settings.end, settings.safe]
  );
  const rawSpots = useMemo(() => clusterPhotos(kept), [kept]);
  const spots = useMemo(
    // Spots marked "I'm ready" are gone for good — off the map, the list and the stats.
    () =>
      withLiveState(
        rawSpots.filter((s) => !settings.states[s.id]?.readyOn),
        settings.states,
        now,
        breakUp
      ),
    [rawSpots, settings.states, now, breakUp]
  );
  const stillWarm = spots.filter((s) => s.heat > 0).length;
  const selectedSpot = spots.find((s) => s.id === selectedId) ?? null;

  const home = settings.safe[0] ?? null;
  const canRoute = Boolean(
    home &&
    settings.destination &&
    planVersion &&
    !uploading &&
    settings.departure
  );
  const routeKey = JSON.stringify([
    settings.departure,
    settings.destination,
    spots,
    planVersion,
  ]);

  useEffect(() => {
    if (!canRoute) return; // nothing to fetch — `route` below already resolves to null
    let cancelled = false;
    const controller = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard loading-flag reset before an async fetch
    setRouteLoading(true);
    setRouteError(null);
    const timer = setTimeout(() => {
      routeAround(
        home,
        settings.destination,
        rawSpots,
        settings.states,
        now,
        breakUp,
        controller.signal
      )
        .then((pair) => {
          if (!cancelled) setFetchedRoute({ key: routeKey, pair });
        })
        .catch((err) => {
          if (!cancelled) {
            setFetchedRoute(null);
            setRouteError(err.message);
          }
        })
        .finally(() => {
          if (!cancelled) setRouteLoading(false);
        });
    }, 350);
    return () => {
      clearTimeout(timer);
      cancelled = true;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canRoute, routeKey]);

  const route =
    canRoute && fetchedRoute?.key === routeKey ? fetchedRoute.pair : null;

  const loadSamplePhotos = useCallback(() => {
    importId.current++;
    setUploading(false);
    setPlanVersion(0);
    setFetchedRoute(null);
    const end = demoBreakUpDate();
    const start = new Date(end.getTime() - 900 * DAY);
    setPhotos(demoPhotos());
    setSettings((s) => ({
      ...s,
      start,
      end,
      breakUp: end,
      safe: [DEMO_HOME],
      destination: DEMO_DESTINATION,
      states: {},
    }));
    setSelectedId(null);
    setPreviewDays(null);
    setUploadNote('Sample photos loaded.');
  }, []);

  const handleFiles = useCallback(async (fileList) => {
    const files = [...fileList];
    if (!files.length) return;
    const id = ++importId.current;
    setUploading(true);
    setPlanVersion(0);
    setFetchedRoute(null);
    setUploadNote(`Reading ${files.length} photos on this device…`);
    const read = await readPhotos(
      files,
      (done, total) =>
        id === importId.current &&
        setUploadNote(`Reading ${done} of ${total} photos on this device…`)
    );
    if (id !== importId.current) return;
    setUploading(false);
    const withLoc = read.filter((p) => p.lat != null).length;
    const dated = read.filter((p) => p.takenAt).map((p) => p.takenAt.getTime());
    const start = dated.length
      ? new Date(Math.min(...dated))
      : new Date(Date.now() - 365 * DAY);
    const end = new Date();
    setPhotos(read);
    setSettings((s) => ({ ...s, start, end, breakUp: end, states: {} }));
    setSelectedId(null);
    setPreviewDays(null);
    setUploadNote(
      withLoc
        ? `${withLoc} of ${files.length} photos have GPS; ${read.filter((p) => !p.takenAt).length} missing dates; ${read.filter((p) => p.unreadable).length} unreadable. Mark home to exclude it from hotspots.`
        : 'None of these photos have a saved location. Phones often remove it when picked in a browser — try the original files from a computer.'
    );
  }, []);

  const setDates = useCallback((start, end) => {
    setSettings((s) => ({ ...s, start, end, breakUp: end }));
  }, []);

  const addSafePlace = useCallback((place) => {
    setSettings((s) => ({ ...s, safe: [...s.safe, place] }));
  }, []);

  const removeSafePlace = useCallback((index) => {
    setSettings((s) => ({ ...s, safe: s.safe.filter((_, i) => i !== index) }));
  }, []);

  const setDestination = useCallback((destination) => {
    setSettings((s) => ({ ...s, destination }));
  }, []);
  const setDeparture = useCallback((departure) => {
    setSettings((s) => ({ ...s, departure }));
  }, []);

  const applySpotAction = useCallback((spotId, action) => {
    const today = new Date().toISOString().slice(0, 10);
    setSettings((s) => {
      const prev = s.states[spotId] ?? {};
      let next = prev;
      if (action === 'ready') next = { ...prev, readyOn: today };
      if (action === 'unready') next = { ...prev, readyOn: undefined };
      if (action === 'more')
        next = { ...prev, extraDays: (prev.extraDays || 0) + 30 };
      if (action === 'reclaim') next = { ...prev, reclaimedOn: today };
      if (action === 'unreclaim') next = { ...prev, reclaimedOn: undefined };
      return { ...s, states: { ...s.states, [spotId]: next } };
    });
    if (action === 'ready') setSelectedId(null); // the spot is removed, so close its sheet
  }, []);

  const toggleRemember = useCallback(() => {
    setSettings((s) => ({ ...s, remember: !s.remember }));
  }, []);

  const forgetEverything = useCallback(() => {
    importId.current++;
    setUploading(false);
    setPlanVersion(0);
    setFetchedRoute(null);
    setRouteError(null);
    setRouteLoading(false);
    clearStore();
    setResetKey((v) => v + 1);
    setSettings(emptySettings());
    setPhotos([]);
    setSelectedId(null);
    setPreviewDays(null);
    setUploadNote('');
  }, []);

  return {
    settings,
    resetKey,
    photos,
    uploadNote,
    uploading,
    spots,
    funnel,
    stillWarm,
    home,
    now,
    breakUp,
    previewDays,
    previewDisplayDays,
    route,
    routeError: canRoute ? routeError : null,
    routeLoading: canRoute && routeLoading,
    selectedSpot,
    actions: {
      planRoute: () => setPlanVersion((v) => v + 1),
      loadSamplePhotos,
      handleFiles,
      setDates,
      addSafePlace,
      removeSafePlace,
      setDestination,
      setDeparture,
      selectSpot: setSelectedId,
      applySpotAction,
      setPreviewDays,
      toggleRemember,
      forgetEverything,
    },
  };
}
