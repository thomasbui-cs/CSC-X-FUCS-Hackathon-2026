// Read the saved location and date from each photo, on the device. Nothing is uploaded.
// exifr reads JPEG and iPhone HEIC files; unreadable files are counted but never placed.
import { gps, parse } from 'exifr';

export async function readPhotos(files, onProgress = () => {}) {
  const out = [];
  const queue = [...files];
  let done = 0;

  async function worker() {
    for (let f = queue.shift(); f; f = queue.shift()) {
      let lat = null;
      let lon = null;
      let takenAt = null;
      let unreadable = false;
      try {
        const loc = await gps(f);
        if (loc) ({ latitude: lat, longitude: lon } = loc);
        const meta = await parse(f, ['DateTimeOriginal', 'CreateDate']);
        takenAt = meta?.DateTimeOriginal || meta?.CreateDate || null;
      } catch {
        lat = null;
        lon = null;
        unreadable = true;
      }
      out.push({
        lat,
        lon,
        takenAt:
          takenAt instanceof Date && Number.isFinite(+takenAt) ? takenAt : null,
        unreadable,
      });
      onProgress(++done, files.length);
    }
  }

  await Promise.all(Array.from({ length: 4 }, worker)); // 4 at a time keeps big batches responsive
  return out;
}
