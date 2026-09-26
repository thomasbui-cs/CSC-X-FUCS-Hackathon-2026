import { useRef, useState } from 'react';
import HeatbreakMap from './components/Map';
import PhotoPicker from './components/PhotoPicker/PhotoPicker';
import DatesForm from './components/DatesForm/DatesForm';
import SafePlaces from './components/SafePlaces/SafePlaces';
import DestinationSearch from './components/DestinationSearch/DestinationSearch';
import SpotList from './components/SpotList/SpotList';
import PlaceSheet from './components/PlaceSheet/PlaceSheet';
import WalkCard from './components/WalkCard/WalkCard';
import Stats from './components/Stats/Stats';
import PreviewSlider from './components/PreviewSlider/PreviewSlider';
import Settings from './components/Settings/Settings';
import { useHeatbreak } from './hooks/useHeatbreak';

function App() {
  const {
    settings,
    resetKey,
    uploadNote,
    uploading,
    spots,
    funnel,
    stillWarm,
    previewDays,
    previewDisplayDays,
    route,
    routeError,
    routeLoading,
    selectedSpot,
    actions,
  } = useHeatbreak();
  const [marking, setMarking] = useState(null);
  const mapSection = useRef(null);
  function toggleMarking(mode) {
    setMarking((current) => (current === mode ? null : mode));
    if (marking !== mode)
      mapSection.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
  }

  return (
    <main className="mx-auto min-h-svh max-w-6xl bg-white p-6 text-slate-900 sm:p-8">
      <header className="mb-6 max-w-xl">
        <h1 className="text-3xl font-bold">
          Heat<span className="text-rose-600">break</span>
        </h1>
        <p className="mt-1 text-slate-600">
          Your photos remember where it hurts. Heatbreak maps those places,
          routes your walk around them, and lets each one cool down in its own
          time.
        </p>
      </header>

      <nav
        aria-label="Your progress"
        className="mb-5 flex flex-wrap gap-2 text-sm"
      >
        {[
          '1. Import photos',
          '2. Review hotspots',
          '3. Choose destination',
          '4. Plan your walk',
        ].map((label, i) => (
          <a
            href={`#${['photos', 'hotspots', 'destination', 'route'][i]}`}
            key={label}
            className={`rounded-full px-3 py-2 ${[funnel.read > 0, spots.length > 0, Boolean(settings.destination), Boolean(route)][i] ? 'bg-sky-100 text-sky-900' : 'bg-slate-100 text-slate-600'}`}
          >
            {label}
          </a>
        ))}
      </nav>
      {marking && (
        <p role="status" className="mb-3 rounded-lg bg-sky-100 p-3">
          Tap the map to place{' '}
          {marking === 'destination' ? 'your destination' : 'a safe place'}.{' '}
          <button className="underline" onClick={() => setMarking(null)}>
            Cancel
          </button>
        </p>
      )}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <section ref={mapSection} className="grid gap-4 lg:sticky lg:top-4">
          <HeatbreakMap
            spots={spots}
            safePlaces={settings.safe}
            route={route}
            marking={Boolean(marking)}
            destination={settings.destination}
            selectedSpot={selectedSpot}
            onMapClick={(lat, lon) => {
              if (marking === 'destination') {
                actions.setDestination({
                  name: `Map pin (${lat.toFixed(4)}, ${lon.toFixed(4)})`,
                  lat,
                  lon,
                });
              } else
                actions.addSafePlace({
                  name:
                    settings.safe.length === 0
                      ? 'Home'
                      : `Safe place ${settings.safe.length + 1}`,
                  lat,
                  lon,
                  radiusM: 55,
                });
              setMarking(null);
            }}
            onSelectSpot={(spot) =>
              actions.selectSpot(spot.id === selectedSpot?.id ? null : spot.id)
            }
          />
          <PreviewSlider
            value={previewDisplayDays}
            isToday={previewDays == null}
            onChange={actions.setPreviewDays}
          />
          <Stats
            funnel={funnel}
            spots={spots}
            stillWarm={stillWarm}
            route={route}
          />
        </section>

        <aside className="grid gap-4">
          <PhotoPicker
            onFiles={actions.handleFiles}
            onUseSample={actions.loadSamplePhotos}
            note={uploadNote}
            uploading={uploading}
          />
          <DatesForm
            start={settings.start}
            end={settings.end}
            onChange={actions.setDates}
          />
          <SafePlaces
            places={settings.safe}
            onRemove={actions.removeSafePlace}
            marking={marking === 'safe'}
            onToggleMarking={() => toggleMarking('safe')}
          />
          <SpotList
            spots={spots}
            selectedId={selectedSpot?.id ?? null}
            onSelect={actions.selectSpot}
          />
          <p className="text-xs text-slate-500" role="status">
            {funnel.read} read · {funnel.withLocation} with GPS ·{' '}
            {funnel.inDates} dated in range · {funnel.kept} outside safe places.
            Hotspots need at least two nearby photos.
          </p>
          <DestinationSearch
            key={resetKey}
            destination={settings.destination}
            onSelect={actions.setDestination}
            marking={marking === 'destination'}
            onMark={() => toggleMarking('destination')}
          />
          <button
            id="route"
            onClick={actions.planRoute}
            disabled={
              uploading ||
              routeLoading ||
              !settings.safe.length ||
              !settings.destination
            }
            className="rounded-lg bg-sky-700 px-4 py-3 font-semibold text-white disabled:opacity-40"
          >
            {routeLoading
              ? 'Planning…'
              : routeError
                ? 'Retry route'
                : 'Plan route'}
          </button>
          <WalkCard
            route={route}
            routeLoading={routeLoading}
            routeError={routeError}
            stillWarm={stillWarm}
            destinationName={settings.destination?.name ?? 'your destination'}
          />
          <p className="text-xs text-slate-500">
            Walking routes only. Dashed: usual walk. Blue: avoidance route.
            Photos stay on this device; route endpoints and avoidance areas are
            sent through our server to the routing service.
          </p>
          <Settings
            remember={settings.remember}
            onToggleRemember={actions.toggleRemember}
            onForget={() => {
              setMarking(null);
              actions.forgetEverything();
            }}
          />
        </aside>
      </div>

      <PlaceSheet
        spot={selectedSpot}
        onAction={(action) => actions.applySpotAction(selectedSpot.id, action)}
        onClose={() => actions.selectSpot(null)}
      />
    </main>
  );
}

export default App;
