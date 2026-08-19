/**
 * LevrekRadar — paylaşılan tip tanımları
 */

export interface FishingSpot {
  id: string;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
}

export type TideEventType = "high" | "low";

/** Ham gelgit olayı (yüksek/alçak su anı) — mock veya gerçek API'den gelir */
export interface TideEvent {
  type: TideEventType;
  time: string; // ISO 8601
  heightMeters: number;
}

/** Tide adapter'larının döndürdüğü ortak sonuç şekli */
export interface TideSeriesPoint {
  time: string; // ISO 8601
  heightMeters: number;
}

export interface TideData {
  source: "mock-sine" | "stormglass" | "worldtides";
  events: TideEvent[];
  series: TideSeriesPoint[]; // görselleştirme için yoğunluklu seri (10dk aralıklı vb.)
}

export type CurrentDirection = "IÇERI" | "DIŞARI" | "DURGUN";

export interface HourlyWind {
  time: string; // ISO 8601
  speedKmh: number;
  directionDeg: number;
  temperatureC: number;
  /** WMO hava kodu (Open-Meteo weather_code) — bkz. lib/utils.ts weatherCodeInfo() */
  weatherCode: number;
  precipitationProbabilityPct: number;
  humidityPct: number;
  pressureHpa: number;
}

export interface DailySunTimes {
  dateKey: string; // YYYY-MM-DD (İstanbul saati)
  sunrise: string; // ISO 8601
  sunset: string; // ISO 8601
}

export interface WeatherData {
  hourly: HourlyWind[];
  /** Her gün için gün doğumu/batımı — haftalık alacakaranlık hesaplaması için */
  sunTimes: DailySunTimes[];
}

export interface HourlyWave {
  time: string; // ISO 8601
  heightMeters: number;
  directionDeg: number;
  periodSeconds: number;
}

/** Open-Meteo Marine API'den gelen dalga/deniz durumu verisi (rüzgar kaynaklı, gelgitten bağımsız) */
export interface WaveData {
  hourly: HourlyWave[];
  /** Marine API'ye ulaşılamazsa false — UI dalga bilgisini gizler, skor hesabı etkilenmez */
  available: boolean;
}

/** Tek bir saatlik zaman dilimi için hesaplanmış av verisi */
export interface HourlyForecast {
  time: string; // ISO 8601
  score: number; // 0-100
  tideHeightMeters: number;
  currentStrengthPct: number; // 0-100, akıntının o andaki göreli gücü
  currentDirection: CurrentDirection;
  windSpeedKmh: number;
  windDirectionDeg: number;
  isTwilight: boolean;
  isPeakCurrentWindow: boolean;
  waveHeightMeters: number | null;
  waveDirectionDeg: number | null;
  wavePeriodSeconds: number | null;
  temperatureC: number;
  weatherCode: number;
  precipitationProbabilityPct: number;
  humidityPct: number;
  pressureHpa: number;
}

export interface CurrentWindow {
  start: string; // ISO 8601
  end: string; // ISO 8601
  direction: CurrentDirection;
  peakScore: number;
}

/** Bir takvim gününün (İstanbul saatine göre) özeti — haftalık görünüm için */
export interface DailySummary {
  dateKey: string; // YYYY-MM-DD
  bestScore: number;
  avgScore: number;
  /** O güne ait en iyi akıntı pencereleri (en fazla 3, skora göre sıralı) */
  bestWindows: CurrentWindow[];
  hourly: HourlyForecast[]; // o güne ait saatlik veriler
  minTemperatureC: number;
  maxTemperatureC: number;
  /** Gün içinde en sık görülen WMO hava kodu — günlük ikon için */
  dominantWeatherCode: number;
  maxPrecipitationProbabilityPct: number;
}

export interface ForecastResult {
  /** Şu andan itibaren 7 gün (168 saat) boyunca saatlik tahmin */
  hourly: HourlyForecast[];
  bestWindows: CurrentWindow[];
  tackleAdvice: TackleAdvice;
  dailySummaries: DailySummary[];
}

export interface TackleAdvice {
  hookSize: string;
  leaderStrengthFC: string;
  tip: string;
  baitStrategy: string;
}
