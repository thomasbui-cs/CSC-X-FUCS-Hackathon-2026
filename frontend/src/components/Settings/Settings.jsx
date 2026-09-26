export default function Settings({ remember, onToggleRemember, onForget }) {
  return (
    <section className="grid gap-2 rounded-lg border border-slate-200 p-4">
      <h2 className="font-semibold">Settings</h2>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={remember} onChange={onToggleRemember} className="accent-sky-500" />
        Remember my map on this device
      </label>
      <button
        type="button"
        onClick={onForget}
        className="w-fit rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 hover:border-red-400"
      >
        Forget everything
      </button>
      <p className="text-xs text-slate-400">
        Talk to someone:{' '}
        <a href="tel:131114" className="underline">
          Lifeline 13 11 14
        </a>
      </p>
    </section>
  );
}
