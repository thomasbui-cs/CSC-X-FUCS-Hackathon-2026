import { MapContainer, TileLayer, CircleMarker, Circle, Polyline, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import HeatLayer from './HeatLayer';
import MapClickHandler from './MapClickHandler';
import { DEFAULT_CENTER, DEFAULT_ZOOM, STATUS_COLOURS } from './mapConstants';

/**
 * @param {object[]} spots - [{ id, lat, lon, name?, n, heat, status }], status one of
 *   'hot' | 'cooling' | 'cooled' | 'reclaimed' (see build spec section 06).
 * @param {object[]} safePlaces - [{ name, lat, lon, radiusM }], safePlaces[0] is home.
 * @param {{usual, heatbreak, avoided}|null} route - from POST /api/route, called twice
 *   (once with no polygons, once avoiding warm spots) — see build spec section 07.
 * @param {(spot: object) => void} onSelectSpot
 * @param {boolean} marking - when true, the map is in "tap to mark a safe place" mode
 * @param {(lat: number, lon: number) => void} onMapClick
 */
export default function HeatbreakMap({
  spots = [],
  safePlaces = [],
  route = null,
  onSelectSpot,
  marking = false,
  onMapClick,
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  className = 'h-[70vh] w-full',
}) {
  const heatPoints = spots.filter((s) => s.heat > 0).map((s) => [s.lat, s.lon, s.heat]);
  const sameRoute = route && route.heatbreak === route.usual;

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      scrollWheelZoom
      className={`${className} rounded-lg ${marking ? 'cursor-crosshair' : ''}`}
    >
      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
        maxZoom={19}
      />

      {marking && <MapClickHandler onClick={onMapClick} />}
      <HeatLayer points={heatPoints} />

      {safePlaces.map((s) => (
        <Circle
          key={s.name}
          center={[s.lat, s.lon]}
          radius={s.radiusM}
          pathOptions={{ color: '#2F7FCF', weight: 2, dashArray: '6 6', fillOpacity: 0.05 }}
        >
          <Tooltip>{s.name}</Tooltip>
        </Circle>
      ))}

      {route?.usual && (
        <Polyline
          positions={route.usual.line}
          pathOptions={{ color: '#72697D', weight: 4, dashArray: '8 8' }}
        />
      )}
      {route?.heatbreak && !sameRoute && (
        <Polyline positions={route.heatbreak.line} pathOptions={{ color: '#2F7FCF', weight: 6 }} />
      )}

      {spots.map((spot) => (
        <CircleMarker
          key={spot.id}
          center={[spot.lat, spot.lon]}
          radius={11}
          pathOptions={{
            color: '#fff',
            weight: 2,
            fillColor: STATUS_COLOURS[spot.status] ?? STATUS_COLOURS.cooled,
            fillOpacity: 1,
          }}
          eventHandlers={{ click: () => onSelectSpot?.(spot) }}
        >
          <Tooltip>
            {(spot.name ?? 'A place') + ` · ${spot.n} photos · ${spot.status}`}
          </Tooltip>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
