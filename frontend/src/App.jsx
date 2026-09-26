import { useState } from 'react';
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
    uploadNote,
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
  const [marking, setMarking] = useState(false);

  return (
    <main className="mx-auto min-h-svh max-w-6xl bg-white p-6 text-slate-900 sm:p-8">
      <header className="mb-6 max-w-xl">
        <h1 className="text-3xl font-bold">
          Heat<span className="text-rose-600">break</span>
        </h1>
        <p className="mt-1 text-slate-600">
          Your photos remember where it hurts. Heatbreak maps those places, routes your walk around them, and lets
          each one cool down in its own time.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <section className="grid gap-4">
          <HeatbreakMap
            spots={spots}
            safePlaces={settings.safe}
            route={route}
            marking={marking}
            onMapClick={(lat, lon) => {
              actions.addSafePlace({
                name: settings.safe.length === 0 ? 'Home' : `Safe place ${settings.safe.length + 1}`,
                lat,
                lon,
                radiusM: 55,
              });
              setMarking(false);
            }}
            onSelectSpot={(spot) => actions.selectSpot(spot.id === selectedSpot?.id ? null : spot.id)}
          />
          <PreviewSlider
            value={previewDisplayDays}
            isToday={previewDays == null}
            onChange={actions.setPreviewDays}
          />
          <Stats funnel={funnel} spots={spots} stillWarm={stillWarm} route={route} />
        </section>

        <aside className="grid gap-4">
          <WalkCard
            route={route}
            routeLoading={routeLoading}
            routeError={routeError}
            stillWarm={stillWarm}
            destinationName={settings.destination?.name ?? 'your destination'}
          />
          <PhotoPicker onFiles={actions.handleFiles} onUseSample={actions.loadSamplePhotos} note={uploadNote} />
          <DatesForm start={settings.start} end={settings.end} onChange={actions.setDates} />
          <SafePlaces
            places={settings.safe}
            onRemove={actions.removeSafePlace}
            marking={marking}
            onToggleMarking={() => setMarking((m) => !m)}
          />
          <DestinationSearch destination={settings.destination} onSelect={actions.setDestination} />
          <SpotList spots={spots} selectedId={selectedSpot?.id ?? null} onSelect={actions.selectSpot} />
          <Settings
            remember={settings.remember}
            onToggleRemember={actions.toggleRemember}
            onForget={actions.forgetEverything}
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
