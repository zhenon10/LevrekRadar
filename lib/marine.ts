import { WaveData } from "./types";

interface OpenMeteoMarineResponse {
  hourly: {
    time: string[];
    wave_height: number[];
    wave_direction: number[];
    wave_period: number[];
  };
}

/**
 * Open-Meteo Marine Weather API — ücretsiz, anahtarsız dalga/deniz durumu verisi.
 * https://open-meteo.com/en/docs/marine-weather-api
 *
 * Not: Bu, rüzgarın oluşturduğu yüzey dalgası (sea state) verisidir; astronomik
 * gelgit/akıntı verisi değildir — o `lib/tide-adapters/` içinde ayrıca hesaplanır.
 * Dar boğaz/koy gibi kıyıya çok yakın noktalarda model çözünürlüğü kaba
 * kalabileceğinden değerler yaklaşık kabul edilmelidir.
 */
export async function fetchWaveData(
  latitude: number,
  longitude: number
): Promise<WaveData> {
  const url =
    `https://marine-api.open-meteo.com/v1/marine?latitude=${latitude}&longitude=${longitude}` +
    `&hourly=wave_height,wave_direction,wave_period&timezone=auto&forecast_days=8`;

  try {
    const res = await fetch(url, { next: { revalidate: 600 } });
    if (!res.ok) {
      throw new Error(`Open-Meteo Marine API hatası: ${res.status}`);
    }
    const json = (await res.json()) as OpenMeteoMarineResponse;

    const hourly = json.hourly.time.map((time, i) => ({
      time,
      heightMeters: json.hourly.wave_height[i] ?? 0,
      directionDeg: json.hourly.wave_direction[i] ?? 0,
      periodSeconds: json.hourly.wave_period[i] ?? 0,
    }));

    return { hourly, available: true };
  } catch (error) {
    console.error("[marine] Open-Meteo Marine alınamadı, dalga verisi olmadan devam ediliyor:", error);
    return { hourly: [], available: false };
  }
}
