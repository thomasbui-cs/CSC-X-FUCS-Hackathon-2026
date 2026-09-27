export default function SafePlaces({
  places,
  onRemove,
  marking,
  onToggleMarking,
}) {
  return (
    <section className="grid gap-2 rounded-lg border border-slate-200 p-4">
      <h2 className="font-semibold">3. Never avoid</h2>
      {places.length === 0 && (
        <p className="text-sm text-slate-400">
          Some places are yours, no matter how many selfies happened there. Mark
          home, work and uni, and we'll never route you around your own front
          door.
        </p>
      )}
      <ul className="grid gap-1">
        {places.map((p, i) => (
          <li key={p.name + i} className="flex items-center gap-2 text-sm">
            <span className="h-2.5 w-2.5 rounded-full bg-sky-500" />
            <span className="flex-1">
              {p.name}
              {i === 0 && (
                <span className="text-slate-400"> · walk starts here</span>
              )}
            </span>
            <button
              type="button"
              onClick={() => onRemove(i)}
              className="text-xs text-slate-400 underline hover:text-slate-600"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={onToggleMarking}
        className={`rounded-md border px-3 py-1.5 text-sm font-medium ${
          marking
            ? 'border-sky-500 bg-sky-500 text-white'
            : 'border-slate-300 bg-slate-50 hover:border-slate-400'
        }`}
      >
        {marking ? 'Tap the map… (cancel)' : 'Mark a place on the map'}
      </button>
    </section>
  );
}
