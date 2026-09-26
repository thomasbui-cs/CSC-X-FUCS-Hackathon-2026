import { STATUS_COLOURS } from '../Map/mapConstants';

export default function SpotList({ spots, selectedId, onSelect }) {
  return (
    <section className="grid gap-2 rounded-lg border border-slate-200 p-4">
      <h2 className="font-semibold">4. Hot spots</h2>
      {spots.length === 0 && <p className="text-sm text-slate-400">No places with two or more photos yet.</p>}
      <ul className="grid gap-1">
        {spots.map((spot) => (
          <li key={spot.id}>
            <button
              type="button"
              onClick={() => onSelect(spot.id === selectedId ? null : spot.id)}
              className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm ${
                spot.id === selectedId ? 'bg-slate-100' : 'hover:bg-slate-50'
              }`}
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: STATUS_COLOURS[spot.status] }}
              />
              <span className="flex-1 truncate">{spot.name ?? 'A place'}</span>
              <span className="text-xs text-slate-400">
                {spot.n} · {spot.status}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
