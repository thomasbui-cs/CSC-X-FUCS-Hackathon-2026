import { ConfigService } from '@nestjs/config';
import { RouteService } from './route.service';

describe('Walking routes', () => {
  afterEach(() => jest.restoreAllMocks());
  const request = {
    from: [138.6, -34.93] as [number, number],
    to: [138.61, -34.92] as [number, number],
    polygons: [],
  };

  it('uses no-key pedestrian routing, preserves avoidance rings and caches results', async () => {
    const ring: [number, number][] = [
      [138.6, -34.93],
      [138.61, -34.93],
      [138.61, -34.92],
      [138.6, -34.93],
    ];
    const fetch = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        code: 'Ok',
        routes: [
          {
            distance: 1973.1,
            duration: 1483.5,
            geometry: {
              coordinates: [
                [138.6, -34.93],
                [138.61, -34.92],
              ],
            },
          },
        ],
      }),
    } as Response);
    const service = new RouteService(new ConfigService({ ORS_API_KEY: '' }));
    const dto = { ...request, polygons: [[ring]] };
    expect(await service.getRoute(dto)).toEqual({
      metres: 1973,
      minutes: 25,
      line: [
        [-34.93, 138.6],
        [-34.92, 138.61],
      ],
      provider: 'valhalla',
    });
    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe('https://valhalla1.openstreetmap.de/route');
    expect(JSON.parse(init!.body as string)).toMatchObject({
      costing: 'pedestrian',
      format: 'osrm',
      shape_format: 'geojson',
      locations: [
        { lon: 138.6, lat: -34.93 },
        { lon: 138.61, lat: -34.92 },
      ],
      exclude_polygons: [ring],
    });
    await service.getRoute(dto);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('does not invent a route when the public service is offline', async () => {
    jest.spyOn(global, 'fetch').mockRejectedValue(new Error('offline'));
    const service = new RouteService(new ConfigService({ ORS_API_KEY: '' }));
    await expect(service.getRoute(request)).rejects.toThrow(
      'temporarily unavailable',
    );
  });

  it('rejects unsuccessful and malformed public router responses', async () => {
    const fetch = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'No path could be found' }),
    } as Response);
    await expect(
      new RouteService(new ConfigService({ ORS_API_KEY: '' })).getRoute(
        request,
      ),
    ).rejects.toThrow('No path');
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ code: 'Ok', routes: [] }),
    } as Response);
    await expect(
      new RouteService(new ConfigService({ ORS_API_KEY: '' })).getRoute(
        request,
      ),
    ).rejects.toThrow('temporarily unavailable');
  });

  it('returns Leaflet coordinates, times and cached results', async () => {
    const fetch = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        features: [
          {
            properties: { summary: { distance: 1234, duration: 720 } },
            geometry: {
              coordinates: [
                [138.6, -34.93],
                [138.61, -34.92],
              ],
            },
          },
        ],
      }),
    } as Response);
    const service = new RouteService(
      new ConfigService({ ORS_API_KEY: 'test-key' }),
    );
    expect(await service.getRoute(request)).toEqual({
      metres: 1234,
      minutes: 12,
      line: [
        [-34.93, 138.6],
        [-34.92, 138.61],
      ],
    });
    await service.getRoute(request);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
