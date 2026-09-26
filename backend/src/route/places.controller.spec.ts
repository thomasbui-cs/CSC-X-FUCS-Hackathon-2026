import { ConfigService } from '@nestjs/config';
import { PlacesController } from './places.controller';

describe('Place search', () => {
  afterEach(() => jest.restoreAllMocks());

  it('rejects missing and short queries', () => {
    const controller = new PlacesController(new ConfigService());
    expect(() => controller.search('')).toThrow(
      'Enter between 3 and 200 characters',
    );
  });

  it('normalizes results and caches repeated submitted queries', async () => {
    const fetch = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => [
        { display_name: 'Adelaide University', lat: '-34.92', lon: '138.60' },
      ],
    } as Response);
    const controller = new PlacesController(new ConfigService());
    expect(await controller.search('Adelaide')).toEqual([
      { name: 'Adelaide University', lat: -34.92, lon: 138.6 },
    ]);
    await controller.search('adelaide');
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('returns an actionable service failure', async () => {
    jest.spyOn(global, 'fetch').mockRejectedValue(new Error('offline'));
    const controller = new PlacesController(new ConfigService());
    await expect(controller.search('Adelaide')).rejects.toThrow(
      'Place search unavailable',
    );
  });
});
