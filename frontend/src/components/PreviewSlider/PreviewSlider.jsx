export default function PreviewSlider({ value, isToday, onChange }) {
  return (
    <section className="grid gap-1 rounded-lg border border-slate-200 p-4">
      <div className="flex items-baseline justify-between">
        <label htmlFor="preview" className="font-medium">
          Days since the break-up
        </label>
        <div className="flex items-baseline gap-2">
          <output htmlFor="preview" className="text-lg font-bold tabular-nums">
            Day {value}
            {isToday && <small className="ml-1 text-xs font-normal text-slate-400">· today</small>}
          </output>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:border-slate-400"
          >
            Today
          </button>
        </div>
      </div>
      <input
        id="preview"
        type="range"
        min={0}
        max={270}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-sky-500"
      />
      <div className="flex justify-between font-mono text-xs text-slate-400">
        <span>Day 0</span>
        <span>1 mo</span>
        <span>3 mo</span>
        <span>6 mo</span>
        <span>9 mo</span>
      </div>
    </section>
  );
}
