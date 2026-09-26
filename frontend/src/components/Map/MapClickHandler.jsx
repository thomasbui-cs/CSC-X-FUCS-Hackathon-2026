import { useMapEvent } from 'react-leaflet';

// Fires onClick(lat, lon) for every map click — used to place a "never avoid" safe place.
export default function MapClickHandler({ onClick }) {
  useMapEvent('click', (e) => onClick?.(e.latlng.lat, e.latlng.lng));
  return null;
}
