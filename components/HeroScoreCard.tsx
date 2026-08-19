import { ArrowRight, Waves } from "lucide-react";
import { HourlyForecast } from "@/lib/types";
import { cn, compassLabel, scoreColorClass, scoreLabel } from "@/lib/utils";
import { WindCompass } from "./WindCompass";

interface HeroScoreCardProps {
  current: HourlyForecast;
  waveAvailable: boolean;
}

export function HeroScoreCard({ current, waveAvailable }: HeroScoreCardProps) {
  const hasWaveReading = waveAvailable && current.waveHeightMeters !== null;
  const waveCompass = hasWaveReading ? compassLabel(current.waveDirectionDeg ?? 0) : null;
  const directionLabel =
    current.currentDirection === "IÇERI"
      ? "İçeri Doluyor"
      : current.currentDirection === "DIŞARI"
      ? "Dışarı Boşalıyor"
      : "Durgun";

  return (
    <div className="relative overflow-hidden rounded-2xl border border-abyss-600 bg-abyss-900/80 p-6 shadow-glow">
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-tide-in/10 blur-3xl" />

      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-slate-400">
            Anlık Av Skoru
          </p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className={cn("text-5xl font-bold tabular-nums", scoreColorClass(current.score))}>
              {current.score}
            </span>
            <span className="text-lg text-slate-500">/ 100</span>
          </div>
          <p className={cn("mt-1 text-sm font-semibold", scoreColorClass(current.score))}>
            {scoreLabel(current.score)}
          </p>
        </div>

        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-tide-in/30 bg-tide-in/10">
          <Waves className="h-8 w-8 animate-pulse-slow text-tide-in" />
        </div>
      </div>

      <div className="relative mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-abyss-600 bg-abyss-800/60 px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-slate-400">Akıntı Durumu</p>
          <p className="mt-1 flex items-center gap-1.5 text-lg font-semibold text-slate-100">
            %{current.currentStrengthPct} Hızla {directionLabel}
            <ArrowRight className="h-4 w-4 text-tide-in" aria-hidden />
          </p>
          <p className="text-xs text-slate-500">
            {current.tideHeightMeters.toFixed(2)} m seviye
            {current.isTwilight && " · 🌇 alacakaranlık"}
          </p>
        </div>

        <WindCompass speedKmh={current.windSpeedKmh} directionDeg={current.windDirectionDeg} />

        {hasWaveReading && (
          <div className="rounded-xl border border-abyss-600 bg-abyss-800/60 px-4 py-3 sm:col-span-2">
            <p className="text-xs uppercase tracking-wide text-slate-400">Dalga Durumu</p>
            <p className="mt-1 text-lg font-semibold text-slate-100">
              {current.waveHeightMeters!.toFixed(1)} m
              {waveCompass && (
                <span className="ml-2 text-sm font-normal text-slate-400">
                  {waveCompass.abbr} yönünden
                </span>
              )}
            </p>
            {current.wavePeriodSeconds !== null && (
              <p className="text-xs text-slate-500">Periyot: {current.wavePeriodSeconds.toFixed(0)} sn</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
