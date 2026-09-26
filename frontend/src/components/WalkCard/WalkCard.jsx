// Voice line and today's walk. Pure-ish rendering of the { usual, heatbreak, avoided } pair
// from routeAround() — see build spec section 10 ("Walk card and voice line").
const placeName = (s) => (s?.name ? s.name.replace(/^The /, 'the ') : 'a warm place');

function voiceLine(pair, stillWarm) {
  if (stillWarm === 0) return 'Every place has cooled down. The city is yours again.';
  if (pair && pair.heatbreak !== pair.usual && pair.avoided.length) {
    const extra = pair.heatbreak.minutes - pair.usual.minutes;
    return `Rerouting. We’re skipping ${placeName(pair.avoided[0])} today. It’s ${extra} extra ${
      extra === 1 ? 'minute' : 'minutes'
    }, and worth it.`;
  }
  return 'Your usual way is clear today.';
}

export default function WalkCard({ route, routeLoading, routeError, stillWarm, destinationName }) {
  if (routeLoading) {
    return (
      <section className="rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm text-slate-600">
        Finding today’s walk…
      </section>
    );
  }
  if (routeError) {
    return (
      <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-slate-700">
        Routes are unavailable right now ({routeError}). The heat map still works.
      </section>
    );
  }
  if (!route) {
    return (
      <section className="rounded-lg border border-slate-200 p-4 text-sm text-slate-400">
        Mark home and pick a destination to see today’s walk.
      </section>
    );
  }

  const same = route.heatbreak === route.usual;
  return (
    <section className="grid gap-2 rounded-lg border border-sky-200 bg-sky-50 p-4">
      <h2 className="font-semibold">Today’s walk to {destinationName}</h2>
      <p className="text-sm text-slate-700">{voiceLine(route, stillWarm)}</p>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-md bg-white px-3 py-2">
          <span className="block text-xs text-slate-400">Usual way</span>
          <b className="text-xl tabular-nums">{route.usual.minutes} min</b>
        </div>
        <div className="rounded-md bg-white px-3 py-2">
          <span className="block text-xs text-slate-400">Heatbreak way</span>
          <b className="text-xl tabular-nums">{route.heatbreak.minutes} min</b>
        </div>
      </div>
      <p className="text-sm text-slate-600">
        {same ? 'No detour needed.' : `Avoiding ${route.avoided.map((s) => s.name ?? 'a warm place').join(', ')}.`}
      </p>
    </section>
  );
}
