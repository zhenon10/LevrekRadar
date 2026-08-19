import { Clock, TrendingUp } from "lucide-react";
import { CurrentWindow } from "@/lib/types";
import { cn, formatDayHour, scoreColorClass } from "@/lib/utils";

interface BestWindowsCardProps {
  windows: CurrentWindow[];
  title?: string;
  emptyLabel?: string;
}

function directionLabel(direction: CurrentWindow["direction"]): string {
  if (direction === "IÇERI") return "Dolduran Akıntı (İçeri)";
  if (direction === "DIŞARI") return "Boşalan Akıntı (Dışarı)";
  return "Durgun Su";
}

export function BestWindowsCard({
  windows,
  title = "İdeal Av Saatleri",
  emptyLabel = "Bu dönemde belirgin bir akıntı zirvesi tespit edilemedi.",
}: BestWindowsCardProps) {
  if (windows.length === 0) {
    return (
      <div className="rounded-2xl border border-abyss-600 bg-abyss-900/80 p-5">
        <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-slate-300">
          <TrendingUp className="h-4 w-4 text-tide-in" />
          {title}
        </h2>
        <p className="text-sm text-slate-400">{emptyLabel}</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-abyss-600 bg-abyss-900/80 p-5">
      <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-slate-300">
        <TrendingUp className="h-4 w-4 text-tide-in" />
        {title}
      </h2>

      <div className="flex flex-col gap-3">
        {windows.map((w, i) => (
          <div
            key={i}
            className={cn(
              "flex items-center justify-between gap-3 rounded-xl border px-4 py-3",
              i === 0
                ? "border-tide-in/50 bg-tide-in/10"
                : "border-abyss-600 bg-abyss-800/60"
            )}
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg",
                  i === 0 ? "bg-tide-in/20" : "bg-abyss-700"
                )}
              >
                {i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}
              </div>
              <div>
                <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-100">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  {formatDayHour(w.start)} – {formatDayHour(w.end)}
                </p>
                <p className="text-xs text-slate-400">{directionLabel(w.direction)}</p>
              </div>
            </div>
            <span className={cn("text-xl font-bold tabular-nums", scoreColorClass(w.peakScore))}>
              {w.peakScore}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
