import { TideAdapter, TideAdapterParams } from "./types";
import { TideData, TideEvent, TideSeriesPoint } from "../types";

/**
 * API anahtarı olmadan çalışan varsayılan gelgit motoru.
 * Ege'deki gerçek yarı-günlük (semi-diurnal) ay bileşenini (M2 ≈ 12.42 saat)
 * baz alan matematiksel bir sinüs dalgası ile su seviyesini simüle eder.
 *
 * Konuma göre deterministik bir faz kayması uygulanır ki her mera farklı ama
 * tutarlı (aynı gün için hep aynı) bir eğri göstersin.
 */
export class MockSineTideAdapter implements TideAdapter {
  readonly name = "mock-sine" as const;

  private readonly M2_PERIOD_HOURS = 12.42;
  private readonly AMPLITUDE_METERS = 0.32; // Ege'de tipik olarak küçük genlik
  private readonly MEAN_LEVEL_METERS = 0.45;

  async fetchTideData(params: TideAdapterParams): Promise<TideData> {
    const { latitude, longitude, start, hours } = params;
    const startMs = new Date(start).getTime();
    const periodMs = this.M2_PERIOD_HOURS * 60 * 60 * 1000;
    const phaseOffsetMs = this.phaseOffsetFor(latitude, longitude, startMs);

    const series: TideSeriesPoint[] = [];
    const stepMs = 10 * 60 * 1000; // 10 dakika
    const endMs = startMs + hours * 60 * 60 * 1000;

    for (let t = startMs; t <= endMs; t += stepMs) {
      series.push({
        time: new Date(t).toISOString(),
        heightMeters: this.heightAt(t, phaseOffsetMs, periodMs),
      });
    }

    const events = this.findEvents(startMs, endMs, phaseOffsetMs, periodMs);

    return { source: this.name, events, series };
  }

  private heightAt(tMs: number, phaseOffsetMs: number, periodMs: number): number {
    const angle = ((tMs + phaseOffsetMs) / periodMs) * 2 * Math.PI;
    return this.MEAN_LEVEL_METERS + this.AMPLITUDE_METERS * Math.sin(angle);
  }

  /** Konuma bağlı, kararlı bir sözde-rastgele faz kayması (0..periodMs) üretir */
  private phaseOffsetFor(lat: number, lon: number, startMs: number): number {
    const seed = Math.abs(Math.sin(lat * 12.9898 + lon * 78.233) * 43758.5453);
    const fractional = seed - Math.floor(seed);
    // Günlük olarak da hafif kaysın (ay evresi hissi) ama saat içinde sabit kalsın
    const dayIndex = Math.floor(startMs / (24 * 60 * 60 * 1000));
    const daySeed = Math.abs(Math.sin(dayIndex * 3.1415) * 10000);
    const dayFractional = daySeed - Math.floor(daySeed);
    return (fractional + dayFractional * 0.5) * this.M2_PERIOD_HOURS * 60 * 60 * 1000;
  }

  /**
   * Sinüs dalgasının analitik türevinden yüksek/alçak su anlarını bulur.
   * Tepe noktaları periyodun 1/4 ve 3/4'ünde oluşur.
   */
  private findEvents(
    startMs: number,
    endMs: number,
    phaseOffsetMs: number,
    periodMs: number
  ): TideEvent[] {
    const events: TideEvent[] = [];
    // sin(angle) = 1 -> angle = pi/2 + 2k*pi  (high tide)
    // sin(angle) = -1 -> angle = 3pi/2 + 2k*pi (low tide)
    const quarterPeriod = periodMs / 4;

    // İlk high-tide anını bul: angle = pi/2 olduğu t
    // angle = ((t + offset)/period) * 2pi = pi/2  ->  t = period/4 - offset
    let firstHighMs = quarterPeriod - phaseOffsetMs;
    // startMs'den önceki en yakın high-tide'a geri sar
    const cyclesBack = Math.ceil((firstHighMs - startMs) / periodMs) * -1;
    firstHighMs += (cyclesBack - 2) * periodMs;

    for (let highMs = firstHighMs; highMs <= endMs + periodMs; highMs += periodMs) {
      const lowMs = highMs + 2 * quarterPeriod; // yarım periyot sonrası low tide

      if (highMs >= startMs - periodMs && highMs <= endMs + periodMs) {
        if (highMs >= startMs && highMs <= endMs) {
          events.push({
            type: "high",
            time: new Date(highMs).toISOString(),
            heightMeters: this.MEAN_LEVEL_METERS + this.AMPLITUDE_METERS,
          });
        }
      }
      if (lowMs >= startMs && lowMs <= endMs) {
        events.push({
          type: "low",
          time: new Date(lowMs).toISOString(),
          heightMeters: this.MEAN_LEVEL_METERS - this.AMPLITUDE_METERS,
        });
      }
    }

    return events.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
  }
}
