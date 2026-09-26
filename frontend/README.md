# Frontend

React + JavaScript (JSX), Vite, and Tailwind CSS.

## Development

Run these commands from `frontend`:

```bash
npm install
npm run dev
```

The app starts in `src/main.jsx`. Edit `src/App.jsx` to build the interface.
Use Tailwind utility classes in JSX; global CSS lives in `src/index.css`.

## Checks

```bash
npm run build
npm run lint
npm run format:check
```

Run `npm run format` to format files, or `npm run preview` to preview a production build.

The frontend uses JavaScript and does not require a TypeScript configuration.

## Complete photo-to-walk flow

1. Choose original JPEG/HEIC photos, drop files, or load the sample metadata.
2. Review the date range and mark home first, then other safe places on the map.
3. Inspect hotspots. Only dated, geotagged photos outside safe places count; a hotspot needs two nearby photos.
4. Search for a destination and select a result, or choose a destination pin on the map.
5. Press **Plan route**. Compare the usual walk with the avoidance route, including any partial-avoidance warning. Changing hotspots or the preview recalculates an active plan.

Start the backend in another terminal (`cd backend`, `npm ci`, `npm run start`). Walking routes work without a key using the public Valhalla demo. Optionally configure `ORS_API_KEY` in `backend/.env` to use OpenRouteService instead. The frontend uses `http://localhost:3000` by default; set `VITE_API_URL` for another backend.

Place search is explicitly submitted, not autocomplete. The backend caches results and serializes requests at no more than one per 1.1 seconds. The default public Nominatim service requires adherence to https://operations.osmfoundation.org/policies/nominatim/ — in particular, no autocomplete, identification and attribution, and an application-wide maximum of one request per second. Use only one backend instance with this default. Set `GEOCODER_URL` to a compatible dedicated search endpoint for a larger deployment. Search terms leave the device; photos do not. Map tiles also require connectivity.

“Remember my map” stores extracted photo coordinates/dates and settings locally, never photo files. Switching it off clears saved data. “Forget everything” clears saved and active state.

Run `npm test`, `npm run build`, and `npm run lint`. Tests cover sample extraction, missing metadata, cooling, persistence, avoidance fallback and cancellation. Real-device HEIC picking and live OpenRouteService routing require manual verification with original files and a configured key.

### No-key routing

When `ORS_API_KEY` is empty, the backend uses Valhalla's pedestrian routing with `exclude_polygons` for hotspot avoidance. Route shapes follow the street/path network; they are not straight-line placeholders. Responses are cached and requests serialized at no more than one per 1.1 seconds. The same detour limit and partial-avoidance messages apply.

The public demo is a fair-use service, not a production SLA. Run only one backend instance with this default; for deployment at scale, set `VALHALLA_URL` to a dedicated `/route` endpoint or configure OpenRouteService. Endpoint coordinates and avoidance rings are sent to the selected routing provider. Follow https://github.com/valhalla/valhalla#demo-server, including notifying the operators before publishing an end-user app.
