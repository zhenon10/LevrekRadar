import { WeatherData } from "./types";
import { istanbulDateKey } from "./utils";

const FORECAST_DAYS = 8; // Open-Meteo'nun izin verdiği maksimum; 7 günlük görünüm için yeterli tampon

interface OpenMeteoResponse {
  hourly: {
    time: string[];
    wind_speed_10m: number[];
    wind_direction_10m: number[];
    surface_pressure: number[];
    temperature_2m: number[];
    weather_code: number[];
    precipitation_probability: number[];
    relative_humidity_2m: number[];
  };
  daily?: {
    time: string[];
    sunrise: string[];
    sunset: string[];
  };
}

/**
 * Open-Meteo — ücretsiz, anahtarsız hava durumu/rüzgar API'si.
 * https://open-meteo.com/
 */
export async function fetchWeather(
  latitude: number,
  longitude: number
): Promise<WeatherData> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
    `&hourly=wind_speed_10m,wind_direction_10m,surface_pressure,temperature_2m,weather_code,precipitation_probability,relative_humidity_2m` +
    `&daily=sunrise,sunset&forecast_days=${FORECAST_DAYS}&timezone=auto`;

  try {
    const res = await fetch(url, { next: { revalidate: 600 } });
    if (!res.ok) {
      throw new Error(`Open-Meteo API hatası: ${res.status}`);
    }
    const json = (await res.json()) as OpenMeteoResponse;

    const hourly = json.hourly.time.map((time, i) => ({
      time,
      speedKmh: json.hourly.wind_speed_10m[i],
      directionDeg: json.hourly.wind_direction_10m[i],
      temperatureC: json.hourly.temperature_2m[i],
      weatherCode: json.hourly.weather_code[i],
      precipitationProbabilityPct: json.hourly.precipitation_probability[i],
      humidityPct: json.hourly.relative_humidity_2m[i],
      pressureHpa: json.hourly.surface_pressure[i],
    }));

    const sunTimes = (json.daily?.time ?? []).map((_, i) => ({
      dateKey: istanbulDateKey(json.daily!.sunrise[i]),
      sunrise: json.daily!.sunrise[i],
      sunset: json.daily!.sunset[i],
    }));

    return { hourly, sunTimes };
  } catch (error) {
    console.error("[weather] Open-Meteo alınamadı, yedek veri kullanılıyor:", error);
    return buildFallbackWeather();
  }
}

/**
 * Open-Meteo'ya ulaşılamadığında (ör. çevrimdışı geliştirme ortamı) uygulamanın
 * çökmemesi için basit, deterministik bir yedek rüzgar/hava/gün doğumu-batımı verisi üretir.
 */
function buildFallbackWeather(): WeatherData {
  const now = new Date();
  const start = new Date(now);
  start.setHours(start.getHours() - 2, 0, 0, 0);

  const totalHours = FORECAST_DAYS * 24;
  const hourly = Array.from({ length: totalHours }, (_, i) => {
    const t = new Date(start.getTime() + i * 60 * 60 * 1000);
    const angle = (i / 24) * Math.PI * 2;
    const hourOfDay = t.getHours();
    return {
      time: t.toISOString(),
      speedKmh: Math.max(0, 10 + 6 * Math.sin(angle)),
      directionDeg: (45 + i * 4) % 360,
      temperatureC: 24 + 5 * Math.sin(angle - Math.PI / 2), // gece serin, öğlen sıcak
      weatherCode: 1, // az bulutlu
      precipitationProbabilityPct: 5,
      humidityPct: hourOfDay >= 22 || hourOfDay <= 6 ? 70 : 55,
      pressureHpa: 1013,
    };
  });

  const sunTimes = Array.from({ length: FORECAST_DAYS }, (_, d) => {
    const day = new Date(now);
    day.setDate(day.getDate() + d);
    const sunrise = new Date(day);
    sunrise.setHours(6, 30, 0, 0);
    const sunset = new Date(day);
    sunset.setHours(20, 15, 0, 0);
    return {
      dateKey: istanbulDateKey(sunrise.toISOString()),
      sunrise: sunrise.toISOString(),
      sunset: sunset.toISOString(),
    };
  });

  return { hourly, sunTimes };
}
