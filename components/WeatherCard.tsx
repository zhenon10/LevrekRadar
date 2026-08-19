import { Droplets, Gauge, CloudRain, Navigation } from "lucide-react";
import { HourlyForecast, DailySummary } from "@/lib/types";
import { cn, compassLabel, dayLabelFor, weatherCodeInfo } from "@/lib/utils";

interface WeatherCardProps {
  current: HourlyForecast;
  isToday: boolean;
  days: DailySummary[];
  selectedDateKey: string;
}

export function WeatherCard({ current, isToday, days, selectedDateKey }: WeatherCardProps) {
  const currentWeather = weatherCodeInfo(current.weatherCode);
  const windCompass = compassLabel(current.windDirectionDeg);
  const selectedDayLabel = dayLabelFor(selectedDateKey);

  return (
    <div className="rounded-2xl border border-abyss-600 bg-abyss-900/80 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-300">
          Hava Durumu
        </h2>
        <span className="text-xs font-medium text-tide-in">
          {isToday ? "Şu An · " : "Öğle Tahmini · "}
          {selectedDayLabel}
        </span>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-5xl leading-none">{currentWeather.emoji}</span>
        <div>
          <p className="text-3xl font-bold tabular-nums text-slate-100">
            {Math.round(current.temperatureC)}°C
          </p>
          <p className="text-sm text-slate-400">{currentWeather.label}</p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3 rounded-xl border border-tide-in/30 bg-tide-in/5 px-4 py-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-tide-in/30 bg-abyss-900">
          <Navigation
            className="h-5 w-5 text-tide-in transition-transform"
            style={{ transform: `rotate(${current.windDirectionDeg}deg)` }}
          />
        </div>
        <div>
          <p className="text-lg font-bold tabular-nums text-slate-100">
            {current.windSpeedKmh.toFixed(0)} km/s
          </p>
          <p className="text-xs text-slate-400">
            Rüzgar · {windCompass.abbr} ({windCompass.name}) yönünden esiyor
          </p>
        </div>
      </div>

      <div className="mt-2 grid grid-cols-3 gap-2">
        <div className="flex flex-col items-center gap-1 rounded-xl border border-abyss-600 bg-abyss-800/60 px-2 py-2.5">
          <Droplets className="h-4 w-4 text-tide-in" />
          <span className="text-sm font-semibold text-slate-100">{current.humidityPct}%</span>
          <span className="text-[10px] text-slate-500">Nem</span>
        </div>
        <div className="flex flex-col items-center gap-1 rounded-xl border border-abyss-600 bg-abyss-800/60 px-2 py-2.5">
          <CloudRain className="h-4 w-4 text-tide-in" />
          <span className="text-sm font-semibold text-slate-100">
            {current.precipitationProbabilityPct}%
          </span>
          <span className="text-[10px] text-slate-500">Yağış İht.</span>
        </div>
        <div className="flex flex-col items-center gap-1 rounded-xl border border-abyss-600 bg-abyss-800/60 px-2 py-2.5">
          <Gauge className="h-4 w-4 text-tide-in" />
          <span className="text-sm font-semibold text-slate-100">{Math.round(current.pressureHpa)}</span>
          <span className="text-[10px] text-slate-500">hPa</span>
        </div>
      </div>

      <div className="no-scrollbar mt-4 flex gap-1.5 overflow-x-auto pt-1">
        {days.map((day) => {
          const info = weatherCodeInfo(day.dominantWeatherCode);
          const selected = day.dateKey === selectedDateKey;
          return (
            <div
              key={day.dateKey}
              className={cn(
                "flex min-w-[64px] shrink-0 flex-col items-center gap-1 rounded-xl border px-2 py-2.5",
                selected ? "border-tide-in bg-tide-in/10" : "border-abyss-700 bg-abyss-800/40"
              )}
            >
              <span className="text-[10px] font-medium uppercase text-slate-400">
                {dayLabelFor(day.dateKey)}
              </span>
              <span className="text-lg leading-none">{info.emoji}</span>
              <span className="text-xs text-slate-300">
                {Math.round(day.maxTemperatureC)}° / {Math.round(day.minTemperatureC)}°
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
