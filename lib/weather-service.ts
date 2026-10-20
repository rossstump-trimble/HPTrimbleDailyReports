export interface NormalizedWeather {
  temp: number;
  tempMax?: number;
  tempMin?: number;
  conditions: string;
  humidity: number;
  windVelocity: number;
  rainfall: number;
  snowfall: number;
  weatherNotes: string;
  weathers: Array<{
    Conditions: string;
    Temp: number;
    Humidity: number;
    WindVelocity: number;
    UOM: string;
    IsCurrent: boolean;
    Location: string;
  }>;
}

// Default coordinates for Project 1025 (Wichita, KS / KICT)
const DEFAULT_LAT = 37.6872;
const DEFAULT_LON = -97.3301;
const DEFAULT_LOCATION_NAME = "Wichita, KS";

export async function fetchWeatherForDate(
  dateIso: string,
  lat: number = DEFAULT_LAT,
  lon: number = DEFAULT_LON,
  locationName: string = DEFAULT_LOCATION_NAME,
): Promise<NormalizedWeather> {
  const dateStr = (dateIso || new Date().toISOString()).slice(0, 10);
  const todayStr = new Date().toISOString().slice(0, 10);
  const isPast = dateStr < todayStr;
  const isFuture = dateStr > todayStr;

  const xClientId = (process.env.XWEATHER_CLIENT_ID || process.env.XWEATHER_API_KEY || "").trim();
  const xClientSecret = (process.env.XWEATHER_CLIENT_SECRET || "").trim();

  if (xClientId && xClientSecret) {
    try {
      let temp = 75;
      let tempMax: number | undefined;
      let tempMin: number | undefined;
      let cond = "Clear / Sunny";
      let humidity = 40;
      let wind = 5;
      let rain = 0;
      let snow = 0;
      let fetched = false;

      if (isPast) {
        // Query daily historical summary for past date
        const summaryUrl = `https://data.api.xweather.com/observations/summary/${lat},${lon}?from=${dateStr}&to=${dateStr}&client_id=${xClientId}&client_secret=${xClientSecret}`;
        const res = await fetch(summaryUrl);
        if (res.ok) {
          const json = await res.json();
          const doc = Array.isArray(json.response) ? json.response[0] : json.response;
          const period = Array.isArray(doc?.periods) ? doc.periods[0] : null;
          const summary = period?.summary;
          if (summary) {
            temp = Math.round(Number(summary.temp?.avgF ?? summary.temp?.maxF ?? 75));
            if (summary.temp?.maxF != null) tempMax = Math.round(Number(summary.temp.maxF));
            if (summary.temp?.minF != null) tempMin = Math.round(Number(summary.temp.minF));
            cond = String(summary.weather?.phrase || summary.weather?.primary || "Clear");
            humidity = Math.round(Number(summary.rh?.avg ?? 40));
            wind = Math.round(Number(summary.wind?.avgMPH ?? summary.wind?.maxMPH ?? 5));
            rain = Number(summary.precip?.totalIN ?? 0);
            snow = 0;
            fetched = true;
          }
        }
      } else if (isFuture) {
        // Query forecast for future date
        const fcUrl = `https://data.api.xweather.com/forecasts/${lat},${lon}?client_id=${xClientId}&client_secret=${xClientSecret}&filter=day&limit=10`;
        const res = await fetch(fcUrl);
        if (res.ok) {
          const json = await res.json();
          const doc = Array.isArray(json.response) ? json.response[0] : json.response;
          const periods = Array.isArray(doc?.periods) ? doc.periods : [];
          const match =
            periods.find((p: Record<string, unknown>) => String(p.dateTimeISO || '').startsWith(dateStr)) ||
            periods[0];
          if (match) {
            temp = Math.round(Number(match.avgTempF ?? match.tempF ?? 75));
            if (match.maxTempF != null) tempMax = Math.round(Number(match.maxTempF));
            if (match.minTempF != null) tempMin = Math.round(Number(match.minTempF));
            cond = String(match.weatherPrimary ?? match.weather ?? "Clear");
            humidity = Math.round(Number(match.humidity ?? 40));
            wind = Math.round(Number(match.windSpeedMPH ?? 5));
            rain = Number(match.precipIN ?? 0);
            snow = Number(match.snowIN ?? 0);
            fetched = true;
          }
        }
      } else {
        // Query live conditions for today
        const condUrl = `https://data.api.xweather.com/conditions/${lat},${lon}?client_id=${xClientId}&client_secret=${xClientSecret}`;
        const res = await fetch(condUrl);
        if (res.ok) {
          const json = await res.json();
          const doc = Array.isArray(json.response) ? json.response[0] : json.response;
          const periods = Array.isArray(doc?.periods) ? doc.periods[0] : doc;
          if (periods) {
            temp = Math.round(Number(periods.tempF ?? 75));
            cond = String(periods.weatherPrimary ?? periods.weather ?? "Clear");
            humidity = Math.round(Number(periods.humidity ?? 40));
            wind = Math.round(Number(periods.windSpeedMPH ?? 5));
            rain = Number(periods.precipIN ?? 0);
            snow = Number(periods.snowIN ?? 0);
            fetched = true;
          }
        }
      }

      if (fetched) {
        const parts: string[] = [cond];
        if (tempMax != null && tempMin != null) {
          parts.push(`High ${tempMax}°F / Low ${tempMin}°F (Avg ${temp}°F)`);
        } else {
          parts.push(`Temp ${temp}°F`);
        }
        parts.push(`Wind ${wind} mph`);
        parts.push(`Humidity ${humidity}%`);
        if (rain > 0) parts.push(`Rain ${rain.toFixed(2)} in.`);
        if (snow > 0) parts.push(`Snow ${snow.toFixed(1)} in.`);
        const weatherNotes = parts.join(", ") + ".";

        console.log(`[XWeather] Loaded live weather for ${dateStr}: ${weatherNotes}`);

        return {
          temp,
          tempMax,
          tempMin,
          conditions: cond,
          humidity,
          windVelocity: wind,
          rainfall: rain,
          snowfall: snow,
          weatherNotes,
          weathers: [
            {
              Conditions: cond,
              Temp: temp,
              Humidity: humidity,
              WindVelocity: wind,
              UOM: "Imperial",
              IsCurrent: !isPast,
              Location: locationName,
            },
          ],
        };
      }
    } catch (err) {
      console.warn("[XWeather] fetch failed, falling back to defaults:", err);
    }
  }

  // Fallback default conditions when XWeather is not configured or offline
  return {
    temp: 75,
    tempMax: 82,
    tempMin: 64,
    conditions: "Clear / Sunny",
    humidity: 40,
    windVelocity: 5,
    rainfall: 0,
    snowfall: 0,
    weatherNotes: "Clear / Sunny, High 82°F, Low 64°F, Wind 5 mph.",
    weathers: [
      {
        Conditions: "Clear / Sunny",
        Temp: 75,
        Humidity: 40,
        WindVelocity: 5,
        UOM: "Imperial",
        IsCurrent: !isPast,
        Location: locationName,
      },
    ],
  };
}
