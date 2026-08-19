import { TideAdapter, TideAdapterParams } from "./types";
import { TideData } from "../types";
import { MockSineTideAdapter } from "./mock-sine";
import { StormglassTideAdapter } from "./stormglass";
import { WorldTidesTideAdapter } from "./worldtides";
import { readSettings } from "../settings";

export type { TideAdapter, TideAdapterParams } from "./types";

/**
 * Adapter pattern: hangi gelgit kaynağının kullanılacağına karar verir.
 * Öncelik sırası: 1) /settings sayfasından kaydedilen anahtar (data/settings.json)
 * 2) ortam değişkenleri (.env.local) 3) hiçbiri yoksa matematiksel sinüs
 * simülasyonuna (mock) düşer — uygulama API anahtarsız da tam çalışır.
 */
export async function getTideAdapter(): Promise<TideAdapter> {
  const settings = await readSettings();

  const stormglassKey = settings.stormglassApiKey || process.env.STORMGLASS_API_KEY;
  const worldtidesKey = settings.worldtidesApiKey || process.env.WORLDTIDES_API_KEY;

  if (stormglassKey) {
    return new StormglassTideAdapter(stormglassKey);
  }
  if (worldtidesKey) {
    return new WorldTidesTideAdapter(worldtidesKey);
  }
  return new MockSineTideAdapter();
}

/**
 * Seçili adapter'ı dener; kota aşımı, ağ hatası vb. durumlarda uygulamanın
 * çökmemesi için otomatik olarak sinüs simülasyonuna (mock) düşer.
 */
export async function fetchTideDataResilient(params: TideAdapterParams): Promise<TideData> {
  const adapter = await getTideAdapter();

  if (adapter.name === "mock-sine") {
    return adapter.fetchTideData(params);
  }

  try {
    return await adapter.fetchTideData(params);
  } catch (error) {
    console.error(
      `[tide-adapters] ${adapter.name} adapter'ı başarısız oldu, sinüs simülasyonuna düşülüyor:`,
      error
    );
    return new MockSineTideAdapter().fetchTideData(params);
  }
}
