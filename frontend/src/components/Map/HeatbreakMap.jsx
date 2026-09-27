import { useEffect, Fragment } from 'react';
import { Marker } from 'react-leaflet';
import {
  useMap,
  MapContainer,
  TileLayer,
  CircleMarker,
  Circle,
  Polyline,
  Tooltip,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import HeatLayer from './HeatLayer';
import MapClickHandler from './MapClickHandler';
import { DEFAULT_CENTER, DEFAULT_ZOOM, STATUS_COLOURS } from './mapConstants';

const startingIcon = L.divIcon({
  className: 'starting-pin-wrapper',
  html: '<span class="starting-pin"><span></span></span>',
  iconSize: [32, 44],
  iconAnchor: [16, 44],
});

// Shows the photo count directly on the pin, coloured by cooldown status.
const spotIcon = (spot) =>
  L.divIcon({
    className: 'spot-pin-wrapper',
    html: `<span class="spot-pin" style="background:${
      STATUS_COLOURS[spot.status] ?? STATUS_COLOURS.cooled
    }">${spot.n}</span>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });

function MapView({
  spots,
  safePlaces,
  destination,
  departure,
  route,
  selectedSpot,
}) {
  const map = useMap();
  const points =
    route?.heatbreak?.line ??
    [
      ...spots,
      ...safePlaces,
      ...(destination ? [destination] : []),
      ...(departure ? [departure] : []),
    ].map((p) => [p.lat, p.lon]);
  const boundsKey = JSON.stringify(points);
  useEffect(() => {
    const bounds = JSON.parse(boundsKey);
    if (bounds.length)
      map.fitBounds(bounds, { padding: [35, 35], maxZoom: 16 });
    else map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
  }, [map, boundsKey]);
  useEffect(() => {
    if (selectedSpot) map.panTo([selectedSpot.lat, selectedSpot.lon]);
  }, [map, selectedSpot]);
  return null;
}

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
  destination = null,
  departure = null,
  selectedSpot = null,
  spots = [],
  safePlaces = [],
  route = null,
  onSelectSpot,
  marking = false,
  onMapClick,
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  className = 'h-[48vh] min-h-72 w-full lg:h-[70vh]',
}) {
  const heatPoints = spots
    .filter((s) => s.heat > 0)
    .map((s) => [s.lat, s.lon, s.heat]);
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

      <MapView
        spots={spots}
        safePlaces={safePlaces}
        destination={destination}
        departure={departure}
        route={route}
        selectedSpot={selectedSpot}
      />
      {destination && (
        <CircleMarker
          center={[destination.lat, destination.lon]}
          radius={9}
          pathOptions={{
            color: '#075985',
            fillColor: '#fff',
            fillOpacity: 1,
            weight: 4,
          }}
        >
          <Tooltip permanent>Destination</Tooltip>
        </CircleMarker>
      )}
      {departure && (
        <Marker position={[departure.lat, departure.lon]} icon={startingIcon}>
          <Tooltip permanent>Starting point</Tooltip>
        </Marker>
      )}
      {marking && <MapClickHandler onClick={onMapClick} />}
      <HeatLayer points={heatPoints} />

      {safePlaces.map((place) => (
        <Fragment key={place.name}>
          <Circle
            center={[place.lat, place.lon]}
            radius={place.radiusM}
            pathOptions={{
              color: '#2F7FCF',
              weight: 2,
              dashArray: '6 6',
              fillOpacity: 0.05,
            }}
          >
            <Tooltip>{place.name}</Tooltip>
          </Circle>
        </Fragment>
      ))}

      {route?.usual && (
        <Polyline
          positions={route.usual.line}
          pathOptions={{ color: '#72697D', weight: 4, dashArray: '8 8' }}
        />
      )}
      {route?.heatbreak && !sameRoute && (
        <Polyline
          positions={route.heatbreak.line}
          pathOptions={{ color: '#2F7FCF', weight: 6 }}
        />
      )}

      {spots.map((spot) => (
        <Marker
          key={spot.id}
          position={[spot.lat, spot.lon]}
          icon={spotIcon(spot)}
          eventHandlers={{ click: () => onSelectSpot?.(spot) }}
        >
          <Tooltip>
            {(spot.name ?? 'A place') + ` · ${spot.n} photos · ${spot.status}`}
          </Tooltip>
        </Marker>
      ))}
    </MapContainer>
  );
}
