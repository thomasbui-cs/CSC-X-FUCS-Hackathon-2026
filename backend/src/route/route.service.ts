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
  line: [number, number][]; // [lat, lon] pairs
}

const ORS_URL =
  'https://api.openrouteservice.org/v2/directions/foot-walking/geojson';

@Injectable()
export class RouteService {
  private readonly cache = new Map<string, WalkRoute>();

  constructor(private readonly config: ConfigService) {}

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

    let data: any;
    try {
      const res = await fetch(ORS_URL, {
        method: 'POST',
        headers: {
          Authorization: this.config.get<string>('ORS_API_KEY') ?? '',
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
      line: feature.geometry.coordinates.map(
        ([lon, lat]: [number, number]) => [lat, lon],
      ),
    };
    this.cache.set(key, route);
    return route;
  }
}
