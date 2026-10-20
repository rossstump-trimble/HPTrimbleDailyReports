import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchWeatherForDate } from './weather-service';

describe('weather-service', () => {
  const origEnv = process.env;

  beforeEach(() => {
    process.env = { ...origEnv };
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env = origEnv;
  });

  it('returns fallback weather when XWeather credentials are missing', async () => {
    delete process.env.XWEATHER_CLIENT_ID;
    delete process.env.XWEATHER_CLIENT_SECRET;
    delete process.env.XWEATHER_API_KEY;

    const weather = await fetchWeatherForDate('2026-09-17');
    expect(weather).toBeDefined();
    expect(weather.temp).toBe(75);
    expect(weather.conditions).toContain('Clear');
    expect(weather.weathers).toHaveLength(1);
    expect(weather.weathers[0].Conditions).toContain('Clear');
  });

  it('parses XWeather today conditions response correctly', async () => {
    process.env.XWEATHER_CLIENT_ID = 'test-client-id';
    process.env.XWEATHER_CLIENT_SECRET = 'test-client-secret';

    const todayStr = new Date().toISOString().slice(0, 10);

    const mockResponse = {
      success: true,
      response: [
        {
          periods: [
            {
              tempF: 84.5,
              humidity: 55,
              windSpeedMPH: 8.2,
              weatherPrimary: 'Partly Cloudy',
              precipIN: 0.1,
              snowIN: 0,
            },
          ],
        },
      ],
    };

    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as unknown as Response);

    const weather = await fetchWeatherForDate(todayStr);
    expect(weather.temp).toBe(85);
    expect(weather.conditions).toBe('Partly Cloudy');
    expect(weather.humidity).toBe(55);
    expect(weather.windVelocity).toBe(8);
    expect(weather.rainfall).toBe(0.1);
    expect(weather.weatherNotes).toContain('Partly Cloudy');
    expect(weather.weathers[0].Conditions).toBe('Partly Cloudy');
  });

  it('parses XWeather past observations summary correctly', async () => {
    process.env.XWEATHER_CLIENT_ID = 'test-client-id';
    process.env.XWEATHER_CLIENT_SECRET = 'test-client-secret';

    const mockResponse = {
      success: true,
      response: [
        {
          periods: [
            {
              summary: {
                temp: { avgF: 78, maxF: 88, minF: 68 },
                weather: { phrase: 'Partly Cloudy with Scattered Showers', primary: 'Showers' },
                rh: { avg: 50 },
                wind: { avgMPH: 6, maxMPH: 12 },
                precip: { totalIN: 0.25 },
              },
            },
          ],
        },
      ],
    };

    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as unknown as Response);

    const weather = await fetchWeatherForDate('2026-08-01');
    expect(weather.temp).toBe(78);
    expect(weather.tempMax).toBe(88);
    expect(weather.tempMin).toBe(68);
    expect(weather.conditions).toBe('Partly Cloudy with Scattered Showers');
    expect(weather.rainfall).toBe(0.25);
    expect(weather.weatherNotes).toContain('High 88°F');
  });
});
