import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';
import { HEAT_GRADIENT } from './mapConstants';

// Imperative wrapper around leaflet.heat, since it has no react-leaflet component of its own.
// One point per spot at its current heat (0-1), not one per photo — see the build spec's map.js
// for why: overlapping per-photo points would keep a busy spot fully red until its last day.
export default function HeatLayer({ points }) {
  const map = useMap();
  const layerRef = useRef(null);

  useEffect(() => {
    layerRef.current = L.heatLayer([], {
      radius: 45,
      blur: 30,
      max: 1,
      maxZoom: 15,
      gradient: HEAT_GRADIENT,
    }).addTo(map);
    return () => {
      // leaflet.heat schedules `_redraw` via requestAnimationFrame and never cancels it on
      // removal, so a pending frame fires after `remove()` nulls `_map` and throws on `.getSize()`.
      // Only reproduces under React StrictMode's dev-only double-invoke of effects — harmless in
      // production, but cancel it ourselves so dev console stays clean.
      if (layerRef.current?._frame)
        L.Util.cancelAnimFrame(layerRef.current._frame);
      layerRef.current?.remove();
      layerRef.current = null;
    };
  }, [map]);

  useEffect(() => {
    layerRef.current?.setLatLngs(points);
  }, [points]);

  return null;
}
