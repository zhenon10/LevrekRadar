import {
  CurrentDirection,
  CurrentWindow,
  DailySummary,
  DailySunTimes,
  ForecastResult,
  HourlyForecast,
  HourlyWave,
  TackleAdvice,
  TideData,
  TideSeriesPoint,
  WaveData,
  WeatherData,
} from "./types";
import { istanbulDateKey } from "./utils";

const DAYS_AHEAD = 7;
const HOURS_PER_DAY = 24;
const TOTAL_HOURS = DAYS_AHEAD * HOURS_PER_DAY; // 168 saat = 1 haftalık tahmin
const TWILIGHT_WINDOW_MS = 45 * 60 * 1000; // gün doğumu/batımından ±45 dk
const SLACK_THRESHOLD_PCT = 15; // bu değerin altı "durgun su" kabul edilir
const PEAK_THRESHOLD_PCT = 70; // bu değerin üstü "akıntı zirvesi" kabul edilir

/**
 * Verilen zamanda gelgit yüksekliğini seriden lineer interpolasyonla bulur.
 */
function heightAtTime(series: TideSeriesPoint[], targetMs: number): number {
  if (series.length === 0) return 0;

  let lower = series[0];
  let upper = series[series.length - 1];

  for (let i = 0; i < series.length - 1; i++) {
    const a = series[i];
    const b = series[i + 1];
    const aMs = new Date(a.time).getTime();
    const bMs = new Date(b.time).getTime();
    if (targetMs >= aMs && targetMs <= bMs) {
      lower = a;
      upper = b;
      break;
    }
  }

  const lowerMs = new Date(lower.time).getTime();
  const upperMs = new Date(upper.time).getTime();
  if (upperMs === lowerMs) return lower.heightMeters;

  const ratio = (targetMs - lowerMs) / (upperMs - lowerMs);
  return lower.heightMeters + (upper.heightMeters - lower.heightMeters) * ratio;
}

/**
 * Akıntı hızının fiziksel karşılığı, su seviyesinin zamana göre türevidir
 * (seviye ne kadar hızlı değişiyorsa akıntı o kadar güçlüdür). Merkezi fark
 * yöntemiyle sayısal türev alınır.
 */
function slopeAtTime(series: TideSeriesPoint[], targetMs: number): number {
  const deltaMs = 15 * 60 * 1000;
  const before = heightAtTime(series, targetMs - deltaMs);
  const after = heightAtTime(series, targetMs + deltaMs);
  return (after - before) / (2 * deltaMs);
}

function findWindDataFor(weather: WeatherData, targetMs: number) {
  let closest = weather.hourly[0];
  let closestDiff = Infinity;
  for (const h of weather.hourly) {
    const diff = Math.abs(new Date(h.time).getTime() - targetMs);
    if (diff < closestDiff) {
      closestDiff = diff;
      closest = h;
    }
  }
  return (
    closest ?? {
      time: new Date(targetMs).toISOString(),
      speedKmh: 0,
      directionDeg: 0,
      temperatureC: 20,
      weatherCode: 0,
      precipitationProbabilityPct: 0,
      humidityPct: 50,
      pressureHpa: 1013,
    }
  );
}

function findWaveDataFor(waves: HourlyWave[], targetMs: number): HourlyWave | null {
  if (waves.length === 0) return null;
  let closest = waves[0];
  let closestDiff = Infinity;
  for (const w of waves) {
    const diff = Math.abs(new Date(w.time).getTime() - targetMs);
    if (diff < closestDiff) {
      closestDiff = diff;
      closest = w;
    }
  }
  return closest;
}

/** Verilen ana en yakın günün gün doğumu/batımı kaydını bulur (tarih anahtarına göre). */
function findSunTimesFor(sunTimes: DailySunTimes[], targetMs: number): DailySunTimes | null {
  if (sunTimes.length === 0) return null;
  const dateKey = istanbulDateKey(new Date(targetMs).toISOString());
  const exact = sunTimes.find((s) => s.dateKey === dateKey);
  if (exact) return exact;

  let closest = sunTimes[0];
  let closestDiff = Infinity;
  for (const s of sunTimes) {
    const diff = Math.abs(new Date(s.sunrise).getTime() - targetMs);
    if (diff < closestDiff) {
      closestDiff = diff;
      closest = s;
    }
  }
  return closest;
}

function isWithinTwilight(targetMs: number, sunTimes: DailySunTimes[]): boolean {
  const day = findSunTimesFor(sunTimes, targetMs);
  if (!day) return false;
  const sunriseMs = new Date(day.sunrise).getTime();
  const sunsetMs = new Date(day.sunset).getTime();
  return (
    Math.abs(targetMs - sunriseMs) <= TWILIGHT_WINDOW_MS ||
    Math.abs(targetMs - sunsetMs) <= TWILIGHT_WINDOW_MS
  );
}

/**
 * Rüzgar Çarpanı & Levrek Av Skoru (0-100) hesaplama kuralları.
 * Bkz. proje spesifikasyonu bölüm 2.3.
 */
function computeScore(params: {
  currentStrengthPct: number;
  windSpeedKmh: number;
  isPeakCurrentWindow: boolean;
  isTwilight: boolean;
}): number {
  const { currentStrengthPct, windSpeedKmh, isPeakCurrentWindow, isTwilight } = params;

  // Kural 1: Saf gelgit/akıntı katkısı — durgun suda düşük, zirvede yüksek taban puan.
  let score = 20 + (currentStrengthPct / 100) * 40;

  // Kural 3: Rüzgar çarpanı.
  if (windSpeedKmh >= 8 && windSpeedKmh <= 18) {
    score += 20; // ideal çırpıntı
  } else if (windSpeedKmh < 4) {
    score -= 15; // su çarşaf gibi
  }

  // Kural 3: Akıntı zirve penceresi bonusu.
  if (isPeakCurrentWindow) {
    score += 30;
  }

  // Kural 3: Alacakaranlık + akıntı zirvesi çakışma bonusu.
  if (isPeakCurrentWindow && isTwilight) {
    score += 15;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

function directionFor(slope: number, currentStrengthPct: number): CurrentDirection {
  if (currentStrengthPct < SLACK_THRESHOLD_PCT) return "DURGUN";
  return slope > 0 ? "IÇERI" : "DIŞARI";
}

/**
 * Dinamik yem & mera tavsiyesi (Kural 4) + iğne/lider önerisi.
 */
function buildTackleAdvice(reference: HourlyForecast): TackleAdvice {
  const isSlack = reference.currentDirection === "DURGUN";
  const isStrongCurrent = reference.currentStrengthPct >= PEAK_THRESHOLD_PCT;
  const isWindy = reference.windSpeedKmh >= 8 && reference.windSpeedKmh <= 18;

  const advice = buildBaseAdvice({ isSlack, isStrongCurrent, isWindy, reference });

  // Dalga yüksekliği (Open-Meteo Marine) yüksekse güvenlik/teknik notu ekle.
  if (reference.waveHeightMeters !== null && reference.waveHeightMeters >= 0.8) {
    advice.tip += ` ⚠️ Dalga yüksekliği ~${reference.waveHeightMeters.toFixed(1)}m — kayalık kenarlarda dikkatli olun, tekneden avlanıyorsanız can yeleği şart.`;
  }

  return advice;
}

function buildBaseAdvice(params: {
  isSlack: boolean;
  isStrongCurrent: boolean;
  isWindy: boolean;
  reference: HourlyForecast;
}): TackleAdvice {
  const { isSlack, isStrongCurrent, isWindy, reference } = params;

  if (isSlack && reference.windSpeedKmh < 4) {
    return {
      hookSize: "No: 6-8 (ince tel, canlı teke için hafif iğne)",
      leaderStrengthFC: "0.20 - 0.25mm FC",
      baitStrategy: "Canlı teke veya hassas şamandıra",
      tip:
        "Su durgun. Köprü yerine marina ışık sınırlarında veya sığ taşlıklarda canlı teke / hassas şamandıra deneyin.",
    };
  }

  if (isStrongCurrent) {
    return {
      hookSize: "No: 2-4 (dayanıklı, geniş ağızlı iğne)",
      leaderStrengthFC: "0.35 - 0.45mm FC",
      baitStrategy: "Drift canlı teke veya silikon yem ile dip taraması",
      tip:
        "Boğazda güçlü akıntı var. Canlı tekeyi köprü ayaklarına drift (akıtma) yapın veya silikon yemlerle dip tarayın.",
    };
  }

  if (isWindy) {
    return {
      hookSize: "No: 4-6",
      leaderStrengthFC: "0.28 - 0.32mm FC",
      baitStrategy: "Yüzey/orta su maket balık veya canlı teke",
      tip:
        "Rüzgar suyu kırıyor, levrek için ideal çırpıntı var. Maket balıkla yüzeye yakın avlanmayı deneyin.",
    };
  }

  return {
    hookSize: "No: 4-6",
    leaderStrengthFC: "0.28 - 0.32mm FC",
    baitStrategy: "Canlı teke veya silikon yem",
    tip: "Orta şiddette akıntı — köprü ayakları ve kayalık kenarlarında klasik sürükleme tekniğini deneyin.",
  };
}

/**
 * En verimli akıntı pencerelerini (ardışık "peak" saatleri) tespit eder ve
 * her biri için başlangıç/bitiş, yön ve tepe skorunu döndürür.
 */
function findBestWindows(hourly: HourlyForecast[]): CurrentWindow[] {
  const windows: CurrentWindow[] = [];
  let current: HourlyForecast[] | null = null;

  for (const h of hourly) {
    if (h.isPeakCurrentWindow) {
      if (!current) current = [];
      current.push(h);
    } else if (current) {
      windows.push(collapseWindow(current));
      current = null;
    }
  }
  if (current) windows.push(collapseWindow(current));

  return windows.sort((a, b) => b.peakScore - a.peakScore).slice(0, 3);
}

function collapseWindow(hours: HourlyForecast[]): CurrentWindow {
  const peak = hours.reduce((max, h) => (h.score > max.score ? h : max), hours[0]);
  return {
    start: hours[0].time,
    end: hours[hours.length - 1].time,
    direction: peak.currentDirection,
    peakScore: peak.score,
  };
}

/**
 * Saatlik tahmini takvim gününe (İstanbul saatine göre) gruplayıp her gün için
 * en yüksek skoru ve en iyi akıntı penceresini hesaplar — haftalık takvim görünümü için.
 */
function buildDailySummaries(hourly: HourlyForecast[]): DailySummary[] {
  const byDay = new Map<string, HourlyForecast[]>();

  for (const h of hourly) {
    const key = istanbulDateKey(h.time);
    const bucket = byDay.get(key);
    if (bucket) {
      bucket.push(h);
    } else {
      byDay.set(key, [h]);
    }
  }

  const summaries: DailySummary[] = [];
  for (const [dateKey, dayHourly] of byDay) {
    const bestHour = dayHourly.reduce((max, h) => (h.score > max.score ? h : max), dayHourly[0]);
    const avgScore = Math.round(dayHourly.reduce((sum, h) => sum + h.score, 0) / dayHourly.length);
    const bestWindows = findBestWindows(dayHourly);

    const temps = dayHourly.map((h) => h.temperatureC);
    const weatherCodeCounts = new Map<number, number>();
    for (const h of dayHourly) {
      weatherCodeCounts.set(h.weatherCode, (weatherCodeCounts.get(h.weatherCode) ?? 0) + 1);
    }
    const dominantWeatherCode = [...weatherCodeCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 0;

    summaries.push({
      dateKey,
      bestScore: bestHour.score,
      avgScore,
      bestWindows,
      hourly: dayHourly,
      minTemperatureC: Math.min(...temps),
      maxTemperatureC: Math.max(...temps),
      dominantWeatherCode,
      maxPrecipitationProbabilityPct: Math.max(...dayHourly.map((h) => h.precipitationProbabilityPct)),
    });
  }

  // "Şimdi" gece yarısında olmadığı için son gün genelde eksik/taşan bir dilim
  // üretir; takvimde tam olarak "bugün + sonraki 6 gün" görünmesi için kırpılır.
  return summaries.sort((a, b) => a.dateKey.localeCompare(b.dateKey)).slice(0, DAYS_AHEAD);
}

/**
 * Ana hesaplama motoru: gelgit + rüzgar + dalga verilerini birleştirip önümüzdeki
 * 7 gün (168 saat) için saatlik av skoru, akıntı yönü ve taktik önerisi üretir.
 */
export function calculateForecast(
  tide: TideData,
  weather: WeatherData,
  startTime: Date = new Date(),
  waves: WaveData | null = null
): ForecastResult {
  const startMs = startTime.getTime();

  // Zirve akıntı gücünü doğru normalize edebilmek için önce tüm serideki
  // maksimum eğim (mutlak değer) bulunur.
  let maxAbsSlope = 0;
  for (const point of tide.series) {
    const t = new Date(point.time).getTime();
    const slope = Math.abs(slopeAtTime(tide.series, t));
    if (slope > maxAbsSlope) maxAbsSlope = slope;
  }
  if (maxAbsSlope === 0) maxAbsSlope = 1e-9;

  const hourly: HourlyForecast[] = [];

  for (let i = 0; i < TOTAL_HOURS; i++) {
    const targetMs = startMs + i * 60 * 60 * 1000;
    const tideHeightMeters = heightAtTime(tide.series, targetMs);
    const slope = slopeAtTime(tide.series, targetMs);
    const currentStrengthPct = Math.min(100, Math.round((Math.abs(slope) / maxAbsSlope) * 100));
    const currentDirection = directionFor(slope, currentStrengthPct);
    const isPeakCurrentWindow = currentStrengthPct >= PEAK_THRESHOLD_PCT;

    const wind = findWindDataFor(weather, targetMs);
    const isTwilight = isWithinTwilight(targetMs, weather.sunTimes);
    const wave = waves?.available ? findWaveDataFor(waves.hourly, targetMs) : null;

    const score = computeScore({
      currentStrengthPct,
      windSpeedKmh: wind.speedKmh,
      isPeakCurrentWindow,
      isTwilight,
    });

    hourly.push({
      time: new Date(targetMs).toISOString(),
      score,
      tideHeightMeters,
      currentStrengthPct,
      currentDirection,
      windSpeedKmh: wind.speedKmh,
      windDirectionDeg: wind.directionDeg,
      isTwilight,
      isPeakCurrentWindow,
      waveHeightMeters: wave?.heightMeters ?? null,
      waveDirectionDeg: wave?.directionDeg ?? null,
      wavePeriodSeconds: wave?.periodSeconds ?? null,
      temperatureC: wind.temperatureC,
      weatherCode: wind.weatherCode,
      precipitationProbabilityPct: wind.precipitationProbabilityPct,
      humidityPct: wind.humidityPct,
      pressureHpa: wind.pressureHpa,
    });
  }

  const bestWindows = findBestWindows(hourly);
  const tackleAdvice = buildTackleAdvice(hourly[0]);
  const dailySummaries = buildDailySummaries(hourly);

  return { hourly, bestWindows, tackleAdvice, dailySummaries };
}

export const TIDE_ENGINE_CONSTANTS = {
  SLACK_THRESHOLD_PCT,
  PEAK_THRESHOLD_PCT,
  TWILIGHT_WINDOW_MS,
  DAYS_AHEAD,
  HOURS_PER_DAY,
};
