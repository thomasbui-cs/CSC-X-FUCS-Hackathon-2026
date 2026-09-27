import {
  BadGatewayException,
  BadRequestException,
  Controller,
  Get,
  Query,
} from '@nestjs/common';

type Place = { name: string; lat: number; lon: number };

const GEOCODER_URL = 'https://nominatim.openstreetmap.org/search';

@Controller('api/places')
export class PlacesController {
  private readonly cache = new Map<string, Place[]>();
  private queue: Promise<unknown> = Promise.resolve();
  private lastRequest = 0;

  @Get()
  search(@Query('q') query: string): Promise<Place[]> {
    if (
      typeof query !== 'string' ||
      query.trim().length < 3 ||
      query.length > 200
    ) {
      throw new BadRequestException('Enter between 3 and 200 characters');
    }
    const q = query.trim();
    const task = this.queue.then(async () => {
      const cached = this.cache.get(q.toLowerCase());
      if (cached) return cached;
      await new Promise((resolve) =>
        setTimeout(
          resolve,
          Math.max(0, 1100 - (Date.now() - this.lastRequest)),
        ),
      );
      this.lastRequest = Date.now();
      const url = new URL(GEOCODER_URL);
      url.searchParams.set('q', q);
      url.searchParams.set('format', 'json');
      url.searchParams.set('limit', '5');
      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Heatbreak/1.0 (CSC-X-FUCS-Hackathon-2026)',
          },
          signal: AbortSignal.timeout(10000),
        });
        if (!response.ok) throw new Error('Geocoder unavailable');
        const data = (await response.json()) as {
          display_name: string;
          lat: string;
          lon: string;
        }[];
        const places = data.map((place) => ({
          name: place.display_name,
          lat: Number(place.lat),
          lon: Number(place.lon),
        }));
        if (this.cache.size >= 500) this.cache.clear();
        this.cache.set(q.toLowerCase(), places);
        return places;
      } catch {
        throw new BadGatewayException('Place search unavailable');
      }
    });
    this.queue = task.catch(() => undefined);
    return task;
  }
}
