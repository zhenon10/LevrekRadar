import { CurrentWindow, HourlyForecast } from "@/lib/types";
import { cn, formatHour, scoreColorClass } from "@/lib/utils";

interface TimelineProps {
  hourly: HourlyForecast[];
  bestWindows: CurrentWindow[];
  nowIso: string;
  title?: string;
  avgScore?: number;
  bestScore?: number;
}

function windowLabel(direction: HourlyForecast["currentDirection"]): string {
  if (direction === "IÇERI") return "Dolduran Akıntı";
  if (direction === "DIŞARI") return "Boşalan Akıntı";
  return "Durgun Su";
}

export function Timeline({
  hourly,
  bestWindows,
  nowIso,
  title = "Akıntı & Av Skoru",
  avgScore,
  bestScore,
}: TimelineProps) {
  return (
    <div className="rounded-2xl border border-abyss-600 bg-abyss-900/80 p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-300">{title}</h2>
        {(avgScore !== undefined || bestScore !== undefined) && (
          <div className="flex items-center gap-3 text-xs text-slate-400">
            {avgScore !== undefined && (
              <span>
                Ortalama Skor:{" "}
                <span className={cn("font-semibold tabular-nums", scoreColorClass(avgScore))}>
                  {avgScore}
                </span>
              </span>
            )}
            {bestScore !== undefined && (
              <span>
                En Yüksek:{" "}
                <span className={cn("font-semibold tabular-nums", scoreColorClass(bestScore))}>
                  {bestScore}
                </span>
              </span>
            )}
          </div>
        )}
      </div>

      {bestWindows.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {bestWindows.map((w, i) => (
            <span
              key={i}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium",
                w.direction === "DURGUN"
                  ? "border-tide-slack/40 bg-tide-slack/10 text-slate-300"
                  : "border-tide-in/40 bg-tide-in/10 text-tide-in"
              )}
            >
              {w.direction === "DURGUN" ? "🔴" : "🟢"} {formatHour(w.start)} - {formatHour(w.end)}{" "}
              {windowLabel(w.direction)} (Skor: {w.peakScore})
            </span>
          ))}
        </div>
      )}

      <div className="grid grid-cols-8 gap-1.5 sm:grid-cols-12 sm:gap-2">
        {hourly.map((h) => {
          const now = h.time === nowIso;
          return (
            <div
              key={h.time}
              className={cn(
                "flex flex-col items-center gap-1 rounded-lg border px-1 py-2 sm:gap-1.5 sm:rounded-xl sm:px-2 sm:py-3",
                now
                  ? "border-tide-in bg-tide-in/10"
                  : h.isPeakCurrentWindow
                  ? "border-abyss-600 bg-abyss-800/70"
                  : "border-abyss-700 bg-abyss-800/30"
              )}
            >
              <span className="text-[9px] font-medium text-slate-400 sm:text-[11px]">
                {now ? "ŞİMDİ" : formatHour(h.time)}
              </span>
              <span className={cn("text-sm font-bold tabular-nums sm:text-lg", scoreColorClass(h.score))}>
                {h.score}
              </span>
              <span className="text-[9px] leading-none">
                {h.isPeakCurrentWindow ? "🟢" : h.currentDirection === "DURGUN" ? "🔴" : " "}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
