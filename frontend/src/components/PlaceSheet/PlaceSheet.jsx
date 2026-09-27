// The place sheet: opened when a map pin is tapped. See build spec section 10.
export default function PlaceSheet({ spot, onAction, onClose }) {
  if (!spot) return null;
  const { status, daysLeft, n, name } = spot;

  const line =
    status === 'reclaimed'
      ? 'Reclaimed. New memories only.'
      : daysLeft > 0
        ? `Cools in ${daysLeft} ${daysLeft === 1 ? 'day' : 'days'}.`
        : 'Cooled down. Go when you’re ready.';

  return (
    <div
      className="fixed inset-0 z-1000 flex items-end justify-center bg-black/30 p-4 sm:items-center"
      onClick={onClose}
    >
      <div
        className="grid w-full max-w-sm gap-3 rounded-lg bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold">{name ?? 'A place'}</h2>
        <p className="text-sm text-slate-600">
          {n} photos · {line}
        </p>
        <div className="flex flex-wrap gap-2">
          {status === 'reclaimed' ? (
            <button
              type="button"
              onClick={() => onAction('unreclaim')}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium hover:border-slate-400"
            >
              Undo
            </button>
          ) : daysLeft > 0 ? (
            <>
              <button
                type="button"
                onClick={() => onAction('ready')}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium hover:border-slate-400"
              >
                I’ve moved on
              </button>
              <button
                type="button"
                onClick={() => onAction('more')}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium hover:border-slate-400"
              >
                Needs more time
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => onAction('reclaim')}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium hover:border-slate-400"
            >
              Reclaimed it with friends
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium hover:border-slate-400"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
