const iso = (d) => {
  if (!d) return '';
  const date = new Date(d);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
};

export default function DatesForm({ start, end, onChange }) {
  return (
    <section className="grid gap-2 rounded-lg border border-slate-200 p-4">
      <h2 className="font-semibold">2. Relationship dates</h2>
      <div className="grid grid-cols-2 gap-3">
        <label className="grid gap-1 text-sm text-slate-500">
          Together from
          <input
            type="date"
            value={iso(start)}
            max={iso(end)}
            onChange={(e) =>
              e.target.value &&
              onChange(new Date(`${e.target.value}T00:00:00`), end)
            }
            className="rounded-md border border-slate-300 px-2 py-1.5 text-slate-900"
          />
        </label>
        <label className="grid gap-1 text-sm text-slate-500">
          Until
          <input
            type="date"
            value={iso(end)}
            min={iso(start)}
            onChange={(e) =>
              e.target.value &&
              onChange(start, new Date(`${e.target.value}T00:00:00`))
            }
            className="rounded-md border border-slate-300 px-2 py-1.5 text-slate-900"
          />
        </label>
      </div>
      <p className="text-xs text-slate-400">
        Only photos from these dates count. Everything before or after is left
        alone.
      </p>
    </section>
  );
}
