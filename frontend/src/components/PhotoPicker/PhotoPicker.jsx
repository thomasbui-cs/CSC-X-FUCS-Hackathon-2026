export default function PhotoPicker({ onFiles, onUseSample, note }) {
  return (
    <section className="grid gap-2 rounded-lg border border-slate-200 p-4">
      <h2 className="font-semibold">1. Photos</h2>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onUseSample}
          className="rounded-md border border-slate-300 bg-slate-50 px-3 py-1.5 text-sm font-medium hover:border-slate-400"
        >
          Use the sample photos
        </button>
        <label className="relative cursor-pointer rounded-md border border-slate-300 bg-slate-50 px-3 py-1.5 text-sm font-medium hover:border-slate-400">
          Try your own photos
          <input
            type="file"
            accept="image/jpeg,image/jpg,image/heic,image/*"
            multiple
            onChange={(e) => {
              onFiles(e.target.files);
              e.target.value = '';
            }}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </label>
      </div>
      {note && <p className="text-sm text-slate-500">{note}</p>}
      <p className="text-xs text-slate-400">
        Your own photos are read in this page, from their saved location and date. Nothing leaves your device.
      </p>
    </section>
  );
}
