import { TideAdapter, TideAdapterParams } from "./types";
import { TideData, TideEvent, TideSeriesPoint } from "../types";

interface WorldTidesResponse {
  extremes?: Array<{ dt: number; date: string; height: number; type: "High" | "Low" }>;
  heights?: Array<{ dt: number; date: string; height: number }>;
}

/**
 * WorldTides.info tide adapter. WORLDTIDES_API_KEY ortam değişkeni set edildiğinde
 * otomatik olarak devreye girer (bkz. lib/tide-adapters/index.ts).
 * https://www.worldtides.info/apidocs
 */
export class WorldTidesTideAdapter implements TideAdapter {
  readonly name = "worldtides" as const;

  constructor(private readonly apiKey: string) {}

  async fetchTideData(params: TideAdapterParams): Promise<TideData> {
    const { latitude, longitude, start, hours } = params;
    const startUnix = Math.floor(new Date(start).getTime() / 1000);

    const url =
      `https://www.worldtides.info/api/v3?extremes&heights&datum=CD` +
      `&lat=${latitude}&lon=${longitude}&start=${startUnix}&length=${hours * 3600}&key=${this.apiKey}`;

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`WorldTides API hatası: ${res.status}`);
    }
    const json = (await res.json()) as WorldTidesResponse;

    const events: TideEvent[] = (json.extremes ?? []).map((e) => ({
      type: e.type === "High" ? "high" : "low",
      time: new Date(e.dt * 1000).toISOString(),
      heightMeters: e.height,
    }));

    const series: TideSeriesPoint[] = (json.heights ?? []).map((h) => ({
      time: new Date(h.dt * 1000).toISOString(),
      heightMeters: h.height,
    }));

    return { source: this.name, events, series };
  }
}
