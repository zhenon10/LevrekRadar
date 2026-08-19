import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** 16 yönlü pusula + geleneksel Türkçe rüzgar isimleri (Poyraz, Lodos vb.) */
const COMPASS_POINTS: Array<{ abbr: string; name: string; deg: number }> = [
  { abbr: "K", name: "Yıldız", deg: 0 },
  { abbr: "KKD", name: "Yıldız-Poyraz", deg: 22.5 },
  { abbr: "KD", name: "Poyraz", deg: 45 },
  { abbr: "DKD", name: "Poyraz-Gündoğusu", deg: 67.5 },
  { abbr: "D", name: "Gündoğusu", deg: 90 },
  { abbr: "DGD", name: "Gündoğusu-Keşişleme", deg: 112.5 },
  { abbr: "GD", name: "Keşişleme", deg: 135 },
  { abbr: "GGD", name: "Keşişleme-Kıble", deg: 157.5 },
  { abbr: "G", name: "Kıble", deg: 180 },
  { abbr: "GGB", name: "Kıble-Lodos", deg: 202.5 },
  { abbr: "GB", name: "Lodos", deg: 225 },
  { abbr: "BGB", name: "Lodos-Batı", deg: 247.5 },
  { abbr: "B", name: "Batı", deg: 270 },
  { abbr: "BKB", name: "Batı-Karayel", deg: 292.5 },
  { abbr: "KB", name: "Karayel", deg: 315 },
  { abbr: "KKB", name: "Karayel-Yıldız", deg: 337.5 },
];

export function compassLabel(deg: number): { abbr: string; name: string } {
  const normalized = ((deg % 360) + 360) % 360;
  let closest = COMPASS_POINTS[0];
  let minDiff = 360;
  for (const point of COMPASS_POINTS) {
    const diff = Math.min(Math.abs(normalized - point.deg), 360 - Math.abs(normalized - point.deg));
    if (diff < minDiff) {
      minDiff = diff;
      closest = point;
    }
  }
  return closest;
}

export function scoreLabel(score: number): string {
  if (score >= 80) return "MÜKEMMEL";
  if (score >= 60) return "İYİ";
  if (score >= 40) return "ORTA";
  return "ZAYIF";
}

export function scoreColorClass(score: number): string {
  if (score >= 80) return "text-score-high";
  if (score >= 40) return "text-score-mid";
  return "text-score-low";
}

export function formatHour(iso: string): string {
  return new Date(iso).toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDayHour(iso: string): string {
  return new Date(iso).toLocaleString("tr-TR", {
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Uygulama Edremit Körfezi/Ayvalık'a özel olduğu için tüm gün gruplamaları bu saat dilimine göre yapılır. */
export const APP_TIMEZONE = "Europe/Istanbul";

/** ISO zaman damgasını "YYYY-MM-DD" takvim anahtarına çevirir (İstanbul saatine göre). */
export function istanbulDateKey(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

/** ISO zaman damgasının İstanbul saatine göre saatini (0-23) döndürür. */
export function istanbulHourOfDay(iso: string): number {
  const formatted = new Intl.DateTimeFormat("en-GB", {
    timeZone: APP_TIMEZONE,
    hour: "2-digit",
    hour12: false,
  }).format(new Date(iso));
  return parseInt(formatted, 10) % 24;
}

/** Bir gün anahtarı için "Bugün", "Yarın" ya da kısa gün adı ("Çrş") üretir. */
export function dayLabelFor(dateKey: string): string {
  const todayKey = istanbulDateKey(new Date().toISOString());
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowKey = istanbulDateKey(tomorrow.toISOString());

  if (dateKey === todayKey) return "Bugün";
  if (dateKey === tomorrowKey) return "Yarın";

  return new Intl.DateTimeFormat("tr-TR", { weekday: "short", timeZone: APP_TIMEZONE }).format(
    new Date(`${dateKey}T12:00:00Z`)
  );
}

/** Gün anahtarı için "19 Ağu" gibi kısa tarih. */
export function shortDateFor(dateKey: string): string {
  return new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short", timeZone: APP_TIMEZONE }).format(
    new Date(`${dateKey}T12:00:00Z`)
  );
}

/**
 * WMO hava kodu (Open-Meteo `weather_code`) → emoji + Türkçe açıklama.
 * https://open-meteo.com/en/docs (WMO Weather interpretation codes)
 */
export function weatherCodeInfo(code: number): { emoji: string; label: string } {
  if (code === 0) return { emoji: "☀️", label: "Açık" };
  if (code === 1) return { emoji: "🌤️", label: "Az Bulutlu" };
  if (code === 2) return { emoji: "⛅", label: "Parçalı Bulutlu" };
  if (code === 3) return { emoji: "☁️", label: "Kapalı" };
  if (code === 45 || code === 48) return { emoji: "🌫️", label: "Sisli" };
  if (code >= 51 && code <= 57) return { emoji: "🌦️", label: "Çisenti" };
  if (code >= 61 && code <= 67) return { emoji: "🌧️", label: "Yağmurlu" };
  if (code >= 71 && code <= 77) return { emoji: "🌨️", label: "Karlı" };
  if (code >= 80 && code <= 82) return { emoji: "🌧️", label: "Sağanak Yağmur" };
  if (code >= 85 && code <= 86) return { emoji: "🌨️", label: "Kar Sağanağı" };
  if (code >= 95) return { emoji: "⛈️", label: "Fırtınalı" };
  return { emoji: "🌡️", label: "Bilinmiyor" };
}
