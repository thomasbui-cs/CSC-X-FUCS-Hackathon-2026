export default function Stats({ funnel, spots, stillWarm, route }) {
  const remaining = Math.max(0, ...spots.filter((s) => s.heat > 0).map((s) => s.daysLeft));
  const detour = !route || route.heatbreak === route.usual ? 'None' : `+${route.heatbreak.minutes - route.usual.minutes} min`;

  const tiles = [
    { label: 'Photos read', value: funnel.read },
    { label: 'Still warm', value: `${stillWarm} of ${spots.length}` },
    { label: 'Detour today', value: route ? detour : '—' },
    { label: 'Fully cooled in', value: stillWarm ? `${remaining} days` : 'Done' },
  ];

  return (
    <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {tiles.map((t) => (
        <div key={t.label} className="rounded-lg border border-slate-200 px-3 py-2">
          <dt className="text-xs tracking-wide text-slate-400 uppercase">{t.label}</dt>
          <dd className="text-lg font-bold tabular-nums">{t.value}</dd>
        </div>
      ))}
    </dl>
  );
}
