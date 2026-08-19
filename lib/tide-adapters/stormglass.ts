import { TideAdapter, TideAdapterParams } from "./types";
import { TideData, TideEvent, TideSeriesPoint } from "../types";

interface StormglassExtremeResponse {
  data: Array<{
    height: number;
    time: string;
    type: "high" | "low";
  }>;
}

interface StormglassSeaLevelResponse {
  data: Array<{
    sg: number;
    time: string;
  }>;
}

/**
 * Stormglass.io tide adapter. STORMGLASS_API_KEY ortam değişkeni set edildiğinde
 * otomatik olarak devreye girer (bkz. lib/tide-adapters/index.ts).
 * https://docs.stormglass.io/#/tide
 */
export class StormglassTideAdapter implements TideAdapter {
  readonly name = "stormglass" as const;

  constructor(private readonly apiKey: string) {}

  async fetchTideData(params: TideAdapterParams): Promise<TideData> {
    const { latitude, longitude, start, hours } = params;
    const startMs = new Date(start).getTime();
    const endIso = new Date(startMs + hours * 60 * 60 * 1000).toISOString();

    const [extremes, seaLevel] = await Promise.all([
      this.fetchExtremes(latitude, longitude, start, endIso),
      this.fetchSeaLevel(latitude, longitude, start, endIso),
    ]);

    return { source: this.name, events: extremes, series: seaLevel };
  }

  private async fetchExtremes(
    lat: number,
    lon: number,
    start: string,
    end: string
  ): Promise<TideEvent[]> {
    const url = `https://api.stormglass.io/v2/tide/extremes/point?lat=${lat}&lng=${lon}&start=${start}&end=${end}`;
    const res = await fetch(url, { headers: { Authorization: this.apiKey } });
    if (!res.ok) {
      throw new Error(`Stormglass extremes API hatası: ${res.status}`);
    }
    const json = (await res.json()) as StormglassExtremeResponse;
    return json.data.map((d) => ({
      type: d.type,
      time: d.time,
      heightMeters: d.height,
    }));
  }

  private async fetchSeaLevel(
    lat: number,
    lon: number,
    start: string,
    end: string
  ): Promise<TideSeriesPoint[]> {
    const url = `https://api.stormglass.io/v2/tide/sea-level/point?lat=${lat}&lng=${lon}&start=${start}&end=${end}`;
    const res = await fetch(url, { headers: { Authorization: this.apiKey } });
    if (!res.ok) {
      throw new Error(`Stormglass sea-level API hatası: ${res.status}`);
    }
    const json = (await res.json()) as StormglassSeaLevelResponse;
    return json.data.map((d) => ({ time: d.time, heightMeters: d.sg }));
  }
}
