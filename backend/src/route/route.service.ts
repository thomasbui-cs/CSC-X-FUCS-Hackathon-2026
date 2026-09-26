import {
  BadGatewayException,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RouteRequestDto } from './dto/route-request.dto';

export interface WalkRoute {
  metres: number;
  minutes: number;
  provider?: 'valhalla';
  line: [number, number][]; // [lat, lon] pairs
}

const ORS_URL =
  'https://api.openrouteservice.org/v2/directions/foot-walking/geojson';

@Injectable()
export class RouteService {
  private readonly cache = new Map<string, WalkRoute>();

  private fallbackQueue: Promise<unknown> = Promise.resolve();
  private lastFallbackRequest = 0;

  constructor(private readonly config: ConfigService) {}

  private getValhallaRoute(
    dto: RouteRequestDto,
    key: string,
  ): Promise<WalkRoute> {
    const task = this.fallbackQueue.then(async () => {
      const cached = this.cache.get(key);
      if (cached) return cached;
      // The public demo permits at most one request per second per application.
      await new Promise((resolve) =>
        setTimeout(
          resolve,
          Math.max(0, 1100 - (Date.now() - this.lastFallbackRequest)),
        ),
      );
      this.lastFallbackRequest = Date.now();
      try {
        const response = await fetch(
          this.config.get<string>('VALHALLA_URL') ??
            'https://valhalla1.openstreetmap.de/route',
          {
            method: 'POST',
            signal: AbortSignal.timeout(20000),
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'Heatbreak/1.0 (CSC-X-FUCS-Hackathon-2026)',
              'X-Client-Id': 'heatbreak-hackathon-2026',
            },
            body: JSON.stringify({
              locations: [dto.from, dto.to].map(([lon, lat]) => ({ lon, lat })),
              costing: 'pedestrian',
              format: 'osrm',
              shape_format: 'geojson',
              units: 'kilometers',
              exclude_polygons: (dto.polygons ?? []).map(
                (polygon) => polygon[0],
              ),
            }),
          },
        );
        const data = await response.json();
        if (!response.ok || data.code !== 'Ok') {
          throw new UnprocessableEntityException(
            data.error ?? data.message ?? 'No walking route found',
          );
        }
        // Do not claim avoidance if the provider warns that an option was ignored.
        if (dto.polygons?.length && data.warnings?.length) {
          throw new UnprocessableEntityException(
            'The routing service could not confirm hotspot avoidance',
          );
        }
        const result = data.routes?.[0];
        if (
          !Number.isFinite(result?.distance) ||
          !Number.isFinite(result?.duration) ||
          !Array.isArray(result?.geometry?.coordinates) ||
          result.geometry.coordinates.length < 2
        ) {
          throw new Error('Invalid walking route response');
        }
        const route: WalkRoute = {
          metres: Math.round(result.distance),
          minutes: Math.round(result.duration / 60),
          line: result.geometry.coordinates.map(
            ([lon, lat]: [number, number]) => [lat, lon],
          ),
          provider: 'valhalla',
        };
        if (this.cache.size >= 500) this.cache.clear();
        this.cache.set(key, route);
        return route;
      } catch (error) {
        if (error instanceof UnprocessableEntityException) throw error;
        throw new BadGatewayException(
          'The public walking router is temporarily unavailable. Please retry.',
        );
      }
    });
    this.fallbackQueue = task.catch(() => undefined);
    return task;
  }

  async getRoute(dto: RouteRequestDto): Promise<WalkRoute> {
    const key = JSON.stringify([dto.from, dto.to, dto.polygons ?? []]);
    const cached = this.cache.get(key);
    if (cached) return cached;

    const body: Record<string, unknown> = {
      coordinates: [dto.from, dto.to],
    };
    if (dto.polygons?.length) {
      body.options = {
        avoid_polygons: { type: 'MultiPolygon', coordinates: dto.polygons },
      };
    }

    const apiKey = this.config.get<string>('ORS_API_KEY');
    if (!apiKey) return this.getValhallaRoute(dto, key);

    let data: any;
    try {
      const res = await fetch(ORS_URL, {
        signal: AbortSignal.timeout(15000),
        method: 'POST',
        headers: {
          Authorization: apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      data = await res.json();
      if (!res.ok) {
        throw new UnprocessableEntityException(
          data?.error?.message ?? 'No walking route found',
        );
      }
    } catch (err) {
      if (err instanceof UnprocessableEntityException) throw err;
      throw new BadGatewayException(
        `Routing failed: ${(err as Error).message}`,
      );
    }

    const feature = data.features[0];
    const route: WalkRoute = {
      metres: Math.round(feature.properties.summary.distance),
      minutes: Math.round(feature.properties.summary.duration / 60),
      line: feature.geometry.coordinates.map(([lon, lat]: [number, number]) => [
        lat,
        lon,
      ]),
    };
    this.cache.set(key, route);
    return route;
  }
}
